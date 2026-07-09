import { Router, Response } from 'express';
import { Invoice, Product, Customer, Purchase } from '../models/schemas.js';
import { protect, admin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get Sales Report Summary
// @route   GET /api/reports/sales
// @access  Private
router.get('/sales', protect, async (req: AuthRequest, res) => {
  const { startDate, endDate } = req.query;
  const filter: any = {};

  try {
    const invoices = await Invoice.find(filter);
    
    // Filter by date range if provided
    let filtered = invoices;
    if (startDate) {
      filtered = filtered.filter(inv => new Date(inv.createdAt || '') >= new Date(String(startDate)));
    }
    if (endDate) {
      filtered = filtered.filter(inv => new Date(inv.createdAt || '') <= new Date(String(endDate)));
    }

    const reportData = filtered.map(inv => ({
      'Invoice No': inv.invoiceNumber,
      'Date': new Date(inv.createdAt || '').toISOString().split('T')[0],
      'Customer Name': inv.customerName,
      'Mobile': inv.mobileNumber,
      'Vehicle No': inv.vehicleNumber,
      'Subtotal (INR)': inv.subTotal,
      'GST (INR)': inv.gstTotal,
      'Discount (INR)': inv.discountTotal,
      'Total Amount (INR)': inv.totalAmount,
      'Payment Method': inv.paymentMethod,
      'Status': inv.status
    }));

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get Inventory Valuation Report
// @route   GET /api/reports/inventory
// @access  Private
router.get('/inventory', protect, async (req: AuthRequest, res) => {
  try {
    const products = await Product.find({});
    
    const reportData = products.map(p => {
      const assetCost = p.purchasePrice * p.quantity;
      const assetRetail = p.sellingPrice * p.quantity;
      const potentialProfit = assetRetail - assetCost;

      return {
        'Product ID/SKU': p.productId,
        'Brand': p.brand,
        'Model': p.model,
        'Vehicle Type': p.vehicleType,
        'Capacity (Ah)': p.capacity,
        'Warranty (Months)': p.warrantyPeriod,
        'Unit Purchase Cost (INR)': p.purchasePrice,
        'Unit Selling Price (INR)': p.sellingPrice,
        'Quantity': p.quantity,
        'Branch': p.branchId,
        'Total Valuation (Cost INR)': assetCost,
        'Total Valuation (Retail INR)': assetRetail,
        'Potential Margin (INR)': potentialProfit
      };
    });

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get Customer Loyalty and Spend Report
// @route   GET /api/reports/customers
// @access  Private
router.get('/customers', protect, async (req: AuthRequest, res) => {
  try {
    const customers = await Customer.find({});
    const invoices = await Invoice.find({});

    const reportData = customers.map(c => {
      // Find total money spent by this customer
      const custInvoices = invoices.filter(inv => inv.mobileNumber === c.mobile);
      const totalSpend = custInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalVisits = custInvoices.length;

      return {
        'Customer Name': c.name,
        'Mobile': c.mobile,
        'Email': c.email || 'N/A',
        'Vehicle No': c.vehicleNumber,
        'Loyalty Points': c.loyaltyPoints,
        'Total Transactions': totalVisits,
        'Total Spend (INR)': totalSpend
      };
    });

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get Profit & Loss Report
// @route   GET /api/reports/profit-loss
// @access  Private/Admin
router.get('/profit-loss', protect, admin, async (req: AuthRequest, res) => {
  try {
    const invoices = await Invoice.find({ status: 'Paid' });
    const purchases = await Purchase.find({ status: 'Received' });

    // 1. Calculate revenue from sales
    let totalRevenue = 0;
    let costOfGoodsSold = 0;
    let discountsGiven = 0;

    invoices.forEach(inv => {
      totalRevenue += inv.subTotal; // base sales revenue before tax
      discountsGiven += inv.discountTotal;

      inv.items.forEach(item => {
        // Cost of goods sold based on estimated purchase price (or average)
        // If we can find the product, use its cost. Otherwise, assume 75% of sales price as cost
        costOfGoodsSold += (item.qty * (item.price * 0.75));
      });
    });

    // 2. Calculate expenses from purchases received
    const totalPurchasesCost = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - discountsGiven;

    const reportSummary = {
      'Total Sales Revenue (Excl. Tax)': Math.round(totalRevenue),
      'Cost of Goods Sold (COGS)': Math.round(costOfGoodsSold),
      'Gross Profit': Math.round(grossProfit),
      'Total Discounts Allowed': Math.round(discountsGiven),
      'Stock Purchasing Outflow (Received)': Math.round(totalPurchasesCost),
      'Net Profit Estimate': Math.round(netProfit),
      'Profit Margin': totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'
    };

    res.json(reportSummary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
