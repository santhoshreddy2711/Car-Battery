import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.js';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { Canvas3D } from '../components/Canvas3D.js';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    orderBook: 0,
    clients: 0,
    totalProducts: 0,
    lowStock: 0,
    monthlySales: 0,
    claims: 0,
    suppliers: 0
  });

  const [chartsData, setChartsData] = useState<any>({
    monthlyTrend: [],
    brandSales: [],
    inventoryShare: [],
    profitAnalysis: []
  });

  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          invoicesRes,
          productsRes,
          customersRes,
          claimsRes,
          suppliersRes,
          purchasesRes
        ] = await Promise.all([
          axios.get('/api/billing', { params: { branchId: user?.branchId || undefined } }),
          axios.get('/api/inventory', { params: { branchId: user?.branchId || undefined } }),
          axios.get('/api/customers'),
          axios.get('/api/warranty'),
          axios.get('/api/suppliers'),
          axios.get('/api/purchases')
        ]);

        const invoices = invoicesRes.data;
        const products = productsRes.data;
        const customers = customersRes.data;
        const claims = claimsRes.data;
        const suppliers = suppliersRes.data;
        const purchases = purchasesRes.data;

        // Calculate KPI values
        const revenue = invoices
          .filter((inv: any) => inv.status === 'Paid')
          .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

        const orderBook = purchases
          .filter((p: any) => p.status === 'Pending')
          .reduce((sum: number, p: any) => sum + p.totalAmount, 0);

        const clients = customers.length;
        const totalProducts = products.reduce((sum: number, p: any) => sum + p.quantity, 0);
        const lowStock = products.filter((p: any) => p.quantity <= 5).length;

        // Filter invoices in the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlySales = invoices
          .filter((inv: any) => {
            const d = new Date(inv.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
          .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

        setStats({
          revenue,
          orderBook,
          clients,
          totalProducts,
          lowStock,
          monthlySales,
          claims: claims.length,
          suppliers: suppliers.length
        });

        // 1. Compute Monthly Sales Trend Chart Data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyAggregation = Array.from({ length: 12 }, (_, idx) => ({
          name: months[idx],
          sales: 0,
          profit: 0
        }));

        invoices.forEach((inv: any) => {
          const d = new Date(inv.createdAt);
          const monthIdx = d.getMonth();
          monthlyAggregation[monthIdx].sales += inv.totalAmount;
          // Estimate net margin as 25% of sales
          monthlyAggregation[monthIdx].profit += Math.round(inv.totalAmount * 0.25);
        });
        
        // Truncate to current month or show full history
        setChartsData((prev: any) => ({
          ...prev,
          monthlyTrend: monthlyAggregation
        }));

        // 2. Compute Brand-Wise Inventory Status
        const brandMap: Record<string, { qty: number; value: number }> = {};
        products.forEach((p: any) => {
          if (!brandMap[p.brand]) brandMap[p.brand] = { qty: 0, value: 0 };
          brandMap[p.brand].qty += p.quantity;
          brandMap[p.brand].value += (p.sellingPrice * p.quantity);
        });

        const brandSalesData = Object.keys(brandMap).map(key => ({
          brand: key,
          stock: brandMap[key].qty,
          value: brandMap[key].value
        }));

        // 3. Compute Inventory Shares (Pie Chart)
        const typeMap: Record<string, number> = {};
        products.forEach((p: any) => {
          const type = p.vehicleType || 'Other';
          typeMap[type] = (typeMap[type] || 0) + p.quantity;
        });

        const inventoryShareData = Object.keys(typeMap).map(key => ({
          name: key,
          value: typeMap[key]
        }));

        setChartsData({
          monthlyTrend: monthlyAggregation,
          brandSales: brandSalesData,
          inventoryShare: inventoryShareData,
          profitAnalysis: monthlyAggregation.map(item => ({
            name: item.name,
            revenue: item.sales,
            margin: item.profit
          }))
        });

        setRecentClaims(claims.slice(0, 5));
        setLowStockItems(products.filter((p: any) => p.quantity <= 5).slice(0, 5));

      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.branchId]);

  const kpis = [
    { title: 'Verified Revenue', value: `₹${stats.revenue.toLocaleString()}`, change: '+14.2%', isPositive: true, icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Pending Orders', value: `₹${stats.orderBook.toLocaleString()}`, change: '+3.4%', isPositive: true, icon: ShoppingBag, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Clients Registry', value: stats.clients.toString(), change: '+8.1%', isPositive: true, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Total Products', value: stats.totalProducts.toString(), change: '+4.5%', isPositive: true, icon: Layers, color: 'text-purple-500 bg-purple-500/10' },
    { title: 'Low Stock Alerts', value: stats.lowStock.toString(), change: stats.lowStock > 0 ? 'Urgent Restock' : 'Stock OK', isPositive: stats.lowStock === 0, icon: AlertTriangle, color: stats.lowStock > 0 ? 'text-brand bg-brand/10' : 'text-zinc-400 bg-zinc-400/10' },
    { title: 'Monthly Sales', value: `₹${stats.monthlySales.toLocaleString()}`, change: '+18.7%', isPositive: true, icon: TrendingUp, color: 'text-red-500 bg-red-500/10' },
    { title: 'Warranty Claims', value: stats.claims.toString(), change: 'Pending Review', isPositive: true, icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Suppliers Ledger', value: stats.suppliers.toString(), change: 'No dues pending', isPositive: true, icon: Truck, color: 'text-cyan-500 bg-cyan-500/10' }
  ];

  const PIE_COLORS = ['#E53E3E', '#3182CE', '#38A169', '#D69E2E', '#805AD5', '#718096'];

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">ERP Dashboard</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">CAR Battery Dealership Performance Overview</p>
        </div>
        <div className="bg-glass-white dark:bg-glass-dark border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl px-4 py-2 flex items-center space-x-3 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Live Inventory Database Linked</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={index}
              className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Highlight red accent border on hover */}
              <div className="absolute inset-0 border-t-2 border-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">{kpi.title}</span>
                <span className={`p-2.5 rounded-2xl ${kpi.color}`}>
                  <Icon size={18} />
                </span>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black tracking-tight">{kpi.value}</span>
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  kpi.isPositive 
                    ? 'text-emerald-600 bg-emerald-500/10' 
                    : 'text-brand bg-brand/10'
                }`}>
                  {kpi.isPositive ? <ArrowUpRight size={10} className="mr-0.5" /> : <ArrowDownRight size={10} className="mr-0.5" />}
                  {kpi.change}
                </span>
              </div>

              {/* Sparkline decoration */}
              <div className="mt-4 h-6 flex items-end">
                <svg className="w-full h-full opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path 
                    d={`M0,${5 + Math.sin(index) * 4} Q25,${2 + Math.cos(index) * 4} 50,${7 + Math.sin(index) * 3} T100,${4 + Math.cos(index) * 2}`} 
                    fill="none" 
                    stroke="#E53E3E" 
                    strokeWidth="1.5" 
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Monthly Revenue Area Chart */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-base">Monthly Sales Analysis</h3>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Gross Invoice Valuations</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.monthlyTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#E53E3E" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(26, 26, 36, 0.9)', border: 'none', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" name="Sales (₹)" stroke="#E53E3E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3D Telemetry Dashboard Widget */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base flex items-center space-x-1">
              <Sparkles className="text-brand animate-pulse" size={16} />
              <span>3D Battery Telemetry</span>
            </h3>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Real-Time Model & Status</span>
          </div>
          
          <div className="h-56 relative border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl overflow-hidden mt-3 bg-zinc-950/10">
            <Canvas3D isHero={false} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <span className="block text-[8px] text-zinc-400 uppercase font-semibold">Voltage</span>
              <span>12.8 V</span>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <span className="block text-[8px] text-zinc-400 uppercase font-semibold">Health</span>
              <span>100%</span>
            </div>
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <span className="block text-[8px] text-zinc-400 uppercase font-semibold">Temp</span>
              <span>28°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Brand Wise Sales Bar Chart */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
          <div>
            <h3 className="font-extrabold text-base">Brand Stock Value</h3>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Stock value (INR) by battery brand</span>
          </div>
          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.brandSales}>
                <XAxis dataKey="brand" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Valuation (₹)" fill="#E53E3E" radius={[8, 8, 0, 0]}>
                  {chartsData.brandSales.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Warnings list */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-extrabold text-base">Low Stock Restock Queue</h3>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Batteries dropping below 5 units</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {lowStockItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-zinc-400 py-12">
                All inventory quantities are currently in safe thresholds.
              </div>
            ) : (
              lowStockItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-500/5 dark:bg-red-500/10 border border-brand/10 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-brand/15 text-brand flex items-center justify-center text-xs font-bold">
                      {item.brand[0]}
                    </span>
                    <div>
                      <span className="font-bold text-xs block">{item.brand} - {item.model}</span>
                      <span className="text-[10px] text-zinc-400 font-bold">{item.productId} | Location: {item.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-brand text-xs block">{item.quantity} Left</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Aisle: {item.location.split(',')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Inventory Distribution Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
          <div>
            <h3 className="font-extrabold text-base">Inventory Segmentation</h3>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-4">Stock Breakdown by Vehicle Type</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="w-full md:w-1/2 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.inventoryShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartsData.inventoryShare.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
              {chartsData.inventoryShare.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-zinc-100/30 dark:bg-zinc-950/20 border border-zinc-250/20 dark:border-zinc-800/40 rounded-2xl">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <div>
                    <span className="text-xs font-black block">{item.name}</span>
                    <span className="text-[10px] text-zinc-400 font-bold">{item.value} Unit(s) in catalog</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
