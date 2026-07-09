import { Router, Response } from 'express';
import { Invoice, Product, IInvoice } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get Sales & Revenue Forecast (Next 30 Days)
// @route   GET /api/ai/forecast
// @access  Private
router.get('/forecast', protect, async (req: AuthRequest, res) => {
  try {
    const invoices = await Invoice.find({});
    
    if (invoices.length < 3) {
      // Not enough data, return mock/estimate data based on existing invoices or flatline
      const baseVal = invoices.length > 0 ? (invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length) : 5000;
      const mockForecast = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        return {
          date: date.toISOString().split('T')[0],
          predictedSales: Math.round(baseVal * (1 + (Math.sin(i / 2) * 0.1) + (i * 0.005)))
        };
      });
      return res.json({
        method: 'Baseline Sine Trend Projection (Insufficient historical data)',
        forecast: mockForecast,
        predictedGrowthRate: '2.5%'
      });
    }

    // 1. Group historical sales by date
    const dailySalesMap: Record<string, number> = {};
    invoices.forEach(inv => {
      const dateStr = new Date(inv.createdAt || '').toISOString().split('T')[0];
      dailySalesMap[dateStr] = (dailySalesMap[dateStr] || 0) + inv.totalAmount;
    });

    const sortedDates = Object.keys(dailySalesMap).sort();
    const dataPoints = sortedDates.map((date, idx) => ({
      x: idx,
      y: dailySalesMap[date],
      date
    }));

    // 2. Perform Simple Linear Regression (y = mx + c)
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });

    const denominator = (n * sumXX - sumX * sumX);
    const m = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const c = (sumY - m * sumX) / n;

    // 3. Project next 30 days
    const forecast: any[] = [];
    const lastDayIdx = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].x : 0;
    const lastDate = dataPoints.length > 0 ? new Date(dataPoints[dataPoints.length - 1].date) : new Date();

    for (let i = 1; i <= 30; i++) {
      const nextIdx = lastDayIdx + i;
      let predictedSales = m * nextIdx + c;
      
      // Ensure we don't project negative numbers, add minor weekly seasonality
      const dayOfWeek = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000).getDay();
      const seasonality = dayOfWeek === 0 ? 0.4 : (dayOfWeek === 6 ? 1.2 : 1.0); // Sunday low, Saturday high
      predictedSales = Math.max(1000, predictedSales) * seasonality;

      const date = new Date(lastDate);
      date.setDate(date.getDate() + i);

      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedSales: Math.round(predictedSales)
      });
    }

    const growthRate = m > 0 ? `+${((m / (c || 1)) * 100).toFixed(1)}% / day` : `${((m / (c || 1)) * 100).toFixed(1)}% / day`;

    res.json({
      method: 'Linear Regression Least-Squares with Seasonality Adjustment',
      slope: m,
      intercept: c,
      predictedGrowthRate: growthRate,
      forecast
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get Demand Prediction & Smart Stock suggestions
// @route   GET /api/ai/replenishment
// @access  Private
router.get('/replenishment', protect, async (req: AuthRequest, res) => {
  try {
    const products = await Product.find({});
    const invoices = await Invoice.find({});

    // Calculate weekly sales velocity per product (how many units sold per week)
    const productSalesMap: Record<string, number> = {};
    
    // Sum quantities sold
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        productSalesMap[item.productId] = (productSalesMap[item.productId] || 0) + item.qty;
      });
    });

    const suggestions = products.map(prod => {
      const totalSold = productSalesMap[prod.productId] || 0;
      // Assume a 4-week history for rate (or default to minimum if zero)
      const weeklyVelocity = Math.max(0.1, totalSold / 4); 
      const weeksOfStockLeft = prod.quantity / weeklyVelocity;
      
      let urgency: 'High' | 'Medium' | 'Low' = 'Low';
      let suggestedRestock = 0;

      if (weeksOfStockLeft < 1.5) {
        urgency = 'High';
        suggestedRestock = Math.ceil(weeklyVelocity * 4) - prod.quantity; // restock up to 4 weeks
      } else if (weeksOfStockLeft < 3) {
        urgency = 'Medium';
        suggestedRestock = Math.ceil(weeklyVelocity * 2);
      }

      return {
        productId: prod.productId,
        brand: prod.brand,
        model: prod.model,
        currentStock: prod.quantity,
        weeklyVelocity: Number(weeklyVelocity.toFixed(1)),
        weeksRemaining: Number(weeksOfStockLeft.toFixed(1)),
        urgency,
        suggestedRestock: Math.max(0, suggestedRestock)
      };
    });

    // Sort by Urgency High first
    suggestions.sort((a, b) => {
      const priority: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      return priority[b.urgency] - priority[a.urgency];
    });

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Product Recommendations engine based on Vehicle Type
// @route   POST /api/ai/recommend
// @access  Private
router.post('/recommend', protect, async (req: AuthRequest, res) => {
  const { vehicleType, budget } = req.body;

  if (!vehicleType) {
    return res.status(400).json({ message: 'vehicleType is required' });
  }

  try {
    const products = await Product.find({});
    
    // Map vehicle types to standard capacities (Ah)
    // Bike: 2.5Ah - 9Ah
    // Hatchback Car: 32Ah - 45Ah
    // Sedan/SUV: 50Ah - 80Ah
    // Truck/Bus: 100Ah - 180Ah
    
    let targetMinAh = 35;
    let targetMaxAh = 45;

    const vType = String(vehicleType).toLowerCase();
    if (vType.includes('bike') || vType.includes('scooter') || vType.includes('motorcycle')) {
      targetMinAh = 2.5;
      targetMaxAh = 14;
    } else if (vType.includes('hatchback') || vType.includes('small car')) {
      targetMinAh = 32;
      targetMaxAh = 45;
    } else if (vType.includes('sedan') || vType.includes('suv') || vType.includes('jeep') || vType.includes('car')) {
      targetMinAh = 50;
      targetMaxAh = 80;
    } else if (vType.includes('truck') || vType.includes('bus') || vType.includes('tractor') || vType.includes('heavy')) {
      targetMinAh = 100;
      targetMaxAh = 200;
    }

    // Filter products within target capacity range and budget if specified
    let recommended = products.filter(p => p.capacity >= targetMinAh && p.capacity <= targetMaxAh);
    
    if (budget) {
      recommended = recommended.filter(p => p.sellingPrice <= Number(budget));
    }

    // Sort by profit margin and stock level to recommend high-margin in-stock products
    recommended.sort((a, b) => {
      const marginA = a.sellingPrice - a.purchasePrice;
      const marginB = b.sellingPrice - b.purchasePrice;
      return (marginB * (b.quantity > 0 ? 1.5 : 0.5)) - (marginA * (a.quantity > 0 ? 1.5 : 0.5));
    });

    res.json(recommended.slice(0, 5)); // return top 5 suggestions
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
