import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, 
  Download, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  AlertTriangle,
  FileText,
  Car
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'customers' | 'pl'>('sales');
  const [reportData, setReportData] = useState<any[]>([]);
  const [plSummary, setPlSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // AI states
  const [forecast, setForecast] = useState<any[]>([]);
  const [growthRate, setGrowthRate] = useState('');
  const [replenishSuggestions, setReplenishSuggestions] = useState<any[]>([]);
  const [recVehicleType, setRecVehicleType] = useState('Car');
  const [recBudget, setRecBudget] = useState('6000');
  const [recResult, setRecResult] = useState<any[]>([]);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  useEffect(() => {
    fetchAIForecast();
    fetchAIReplenishment();
    handleGetRecommendation();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pl') {
        const res = await axios.get('/api/reports/profit-loss');
        setPlSummary(res.data);
      } else {
        const res = await axios.get(`/api/reports/${activeTab}`);
        setReportData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIForecast = async () => {
    try {
      const res = await axios.get('/api/ai/forecast');
      setForecast(res.data.forecast);
      setGrowthRate(res.data.predictedGrowthRate);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAIReplenishment = async () => {
    try {
      const res = await axios.get('/api/ai/replenishment');
      setReplenishSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetRecommendation = async () => {
    try {
      const res = await axios.post('/api/ai/recommend', {
        vehicleType: recVehicleType,
        budget: Number(recBudget)
      });
      setRecResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Export Engine
  const exportToCSV = () => {
    if (activeTab === 'pl' && plSummary) {
      // Format P&L object as key-value lines
      const csvLines = Object.keys(plSummary).map(key => `"${key}","${plSummary[key]}"`);
      const csvContent = "data:text/csv;charset=utf-8," + ["\"Metric\",\"Value (INR)\"", ...csvLines].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Profit_Loss_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (reportData.length === 0) return;
    
    // Get headers
    const headers = Object.keys(reportData[0]);
    const csvHeaderLine = headers.map(h => `"${h}"`).join(",");
    
    const csvRows = reportData.map(row => 
      headers.map(h => `"${String(row[h] !== undefined ? row[h] : '').replace(/"/g, '""')}"`).join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [csvHeaderLine, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Reports & Business Intelligence</h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Export Ledger Data & AI Forecasting Models</p>
      </div>

      {/* Grid: 2/3 Reports Viewer, 1/3 AI Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Data Tables & Exporter */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            
            {/* Tabs & Export Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200/40 dark:border-zinc-800/40 gap-4">
              <div className="flex flex-wrap gap-1.5">
                {(['sales', 'inventory', 'customers', 'pl'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-4 py-2 rounded-xl text-xs font-black transition-all
                      ${activeTab === tab 
                        ? 'bg-brand text-white shadow-glow-red' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                      }
                    `}
                  >
                    {tab === 'pl' ? 'Profit & Loss' : `${tab.toUpperCase()} REPORT`}
                  </button>
                ))}
              </div>

              <button
                onClick={exportToCSV}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-zinc-950 dark:bg-zinc-800 hover:bg-brand text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Download size={12} />
                <span>Export CSV Sheet</span>
              </button>
            </div>

            {/* Table / Details Area */}
            <div className="mt-6">
              {loading ? (
                <div className="py-24 text-center">
                  <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : activeTab === 'pl' && plSummary ? (
                /* Profit & Loss aggregate display */
                <div className="max-w-md mx-auto space-y-4 py-6">
                  <div className="text-center mb-6">
                    <span className="p-3 bg-brand-light dark:bg-zinc-800 rounded-2xl text-brand inline-block mb-3">
                      <TrendingUp size={24} />
                    </span>
                    <h3 className="font-extrabold text-base">Net Statement Summary</h3>
                  </div>

                  <div className="divide-y divide-zinc-250/20 dark:divide-zinc-800/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold">
                    {Object.keys(plSummary).map((key, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between">
                        <span className="text-zinc-500">{key}</span>
                        <span className={`font-black ${
                          key.includes('Profit') || key.includes('Revenue') ? 'text-brand' : 'text-zinc-900 dark:text-white'
                        }`}>
                          {plSummary[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-20 text-zinc-400 font-bold">No ledger data to display. Try generating invoices.</div>
              ) : (
                /* CSV data table view */
                <div className="overflow-x-auto max-h-[480px]">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-400 font-bold uppercase border-b border-zinc-250/30 dark:border-zinc-800/30">
                        {Object.keys(reportData[0]).slice(0, 5).map((h, i) => (
                          <th key={i} className="p-3">{h}</th>
                        ))}
                        <th className="p-3 text-right">
                          {Object.keys(reportData[0])[5] || ''}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/20 dark:divide-zinc-800/20 font-bold text-zinc-700 dark:text-zinc-300">
                      {reportData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-100/20 dark:hover:bg-zinc-800/10">
                          {Object.keys(row).slice(0, 5).map((col, cIdx) => (
                            <td key={cIdx} className="p-3 text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px]">
                              {String(row[col])}
                            </td>
                          ))}
                          <td className="p-3 text-right text-brand">
                            {String(row[Object.keys(row)[5]])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: AI Analytics Hub */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Sales Forecast Card */}
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4">
            <h3 className="font-extrabold text-base flex items-center space-x-2 text-brand">
              <Sparkles size={16} />
              <span>AI Sales Forecast (30D)</span>
            </h3>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-bold">Slope Velocity:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{growthRate}</span>
            </div>

            {/* Sparkline trend area chart */}
            <div className="h-32 w-full">
              {forecast.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] text-zinc-400">Loading forecast...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip />
                    <Area type="monotone" dataKey="predictedSales" name="Forecast (₹)" stroke="#E53E3E" fill="rgba(229, 62, 62, 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal font-semibold">
              Projections computed using linear regression of transaction velocity adjusted with weekly seasonality curves.
            </p>
          </div>

          {/* AI Replenishment Alert Panel */}
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4">
            <h3 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500">
              <AlertTriangle size={16} className="text-brand" />
              <span>Demand Prediction</span>
            </h3>
            
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {replenishSuggestions.filter(s => s.urgency === 'High').length === 0 ? (
                <div className="text-center py-6 text-[10px] text-zinc-400 font-bold">No critical replenishment targets.</div>
              ) : (
                replenishSuggestions.filter(s => s.urgency === 'High').map((s, idx) => (
                  <div key={idx} className="p-3 bg-brand/5 border border-brand/10 rounded-xl text-[10px] space-y-1">
                    <div className="flex justify-between font-extrabold">
                      <span className="text-brand">{s.brand} {s.model}</span>
                      <span>Suggest Restock: {s.suggestedRestock} units</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 font-semibold">
                      <span>Velocity: {s.weeklyVelocity}/wk</span>
                      <span>Weeks Left: {s.weeksRemaining} wks</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Interactive Compatibility lookup */}
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4">
            <h3 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500">
              <Compass size={16} className="text-brand" />
              <span>Battery Compatibility Finder</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Vehicle Classification</label>
                <select
                  value={recVehicleType}
                  onChange={(e) => setRecVehicleType(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl glass-input cursor-pointer font-bold"
                >
                  <option value="Bike">Scooter / Motorcycle</option>
                  <option value="Car">Hatchback Compact Car</option>
                  <option value="SUV">Sedan / SUV / Jeep</option>
                  <option value="Truck">Heavy Commercial Truck</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Budget Limit (INR)</label>
                <input
                  type="number"
                  value={recBudget}
                  onChange={(e) => setRecBudget(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl glass-input"
                />
              </div>

              <button
                type="button"
                onClick={handleGetRecommendation}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Scan Product Catalog
              </button>
            </div>

            {/* Results */}
            <div className="space-y-2 pt-2 border-t border-zinc-200/40 dark:border-zinc-800/40">
              {recResult.length === 0 ? (
                <div className="text-center py-4 text-[10px] text-zinc-400 font-bold">No exact specifications matched.</div>
              ) : (
                recResult.map((p, idx) => (
                  <div key={idx} className="p-2.5 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-xl text-[10px] flex justify-between items-center font-bold">
                    <div>
                      <span className="block">{p.brand} - {p.model}</span>
                      <span className="text-[8px] text-zinc-400">{p.capacity}Ah | warranty: {p.warrantyPeriod}mo</span>
                    </div>
                    <span className="text-brand">₹{p.sellingPrice}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
