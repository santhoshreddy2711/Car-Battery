import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  Plus, 
  History, 
  Award, 
  Car, 
  Wrench, 
  X, 
  Eye,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected customer for histories
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  
  // Service Log Form
  const [serviceForm, setServiceForm] = useState({
    description: '',
    cost: 300,
    vehicleNumber: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customers', {
        params: {
          search,
          branchId: user?.branchId || undefined
        }
      });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, user?.branchId]);

  const handleOpenHistory = (cust: any) => {
    setSelectedCust(cust);
    setIsHistoryOpen(true);
  };

  const handleOpenServiceLog = (cust: any) => {
    setSelectedCust(cust);
    setServiceForm({
      description: 'Battery Terminal Cleaning & Voltage Check',
      cost: 250,
      vehicleNumber: cust.vehicleNumber || ''
    });
    setIsServiceFormOpen(true);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`/api/customers/${selectedCust._id}/service`, serviceForm);
      setSelectedCust(res.data); // Refresh history state
      setIsServiceFormOpen(false);
      fetchCustomers();
    } catch (err) {
      alert('Error adding service log');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Customer Database</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Track Profiles, Loyalty Points & Services</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="glass-panel rounded-2xl p-4 shadow-sm flex items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone number, vehicle plate..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
          />
        </div>
      </div>

      {/* Customer Registry List */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-400 font-extrabold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Mobile Number</th>
                <th className="p-4">Primary Vehicle</th>
                <th className="p-4">Service Visits</th>
                <th className="p-4 text-center">Loyalty Points</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-zinc-400 font-bold">
                    No customer profiles found.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-zinc-100/20 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-zinc-900 dark:text-white">{cust.name}</div>
                      <div className="text-[10px] text-zinc-400 font-semibold">{cust.email || 'No Email'}</div>
                    </td>
                    <td className="p-4 font-bold">{cust.mobile}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-150 dark:bg-zinc-800 text-[10px] font-bold">
                        <Car size={10} className="mr-1" />
                        {cust.vehicleNumber}
                      </span>
                    </td>
                    <td className="p-4 font-bold">{cust.serviceHistory?.length || 0} Visit(s)</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full font-black">
                        <Award size={12} />
                        <span>{cust.loyaltyPoints || 0} Pts</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenHistory(cust)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-brand rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Eye size={12} />
                          <span>View History</span>
                        </button>
                        <button
                          onClick={() => handleOpenServiceLog(cust)}
                          className="px-3 py-1.5 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-lg font-bold flex items-center space-x-1 transition-all"
                        >
                          <Wrench size={12} />
                          <span>Log Service</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {isHistoryOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-lg font-extrabold flex items-center space-x-2">
                <History className="text-brand" size={18} />
                <span>Customer History Ledger ({selectedCust.name})</span>
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded-lg hover:bg-zinc-155 text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Details */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-150/40 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Phone Number</span>
                  <span className="font-extrabold text-xs">{selectedCust.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Loyalty Tier</span>
                  <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400">{selectedCust.loyaltyPoints} Reward Points</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Registered Vehicle</span>
                  <span className="font-extrabold text-xs">{selectedCust.vehicleNumber}</span>
                </div>
              </div>

              {/* Service Logs List */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center">
                  <Wrench size={12} className="mr-1" /> Service Check-ups Log
                </h3>
                {selectedCust.serviceHistory?.length === 0 ? (
                  <div className="text-xs text-zinc-400 py-3 font-semibold text-center bg-zinc-100/30 dark:bg-zinc-900/30 rounded-xl">No services logged yet.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedCust.serviceHistory.map((s: any, idx: number) => (
                      <div key={idx} className="p-3 bg-zinc-100/50 dark:bg-zinc-850/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{s.description}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold">{s.date}</span>
                        </div>
                        <span className="font-extrabold text-brand">₹{s.cost}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle records */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center">
                  <Car size={12} className="mr-1" /> Vehicle Records Directory
                </h3>
                <div className="space-y-3">
                  {selectedCust.vehicleRecords?.map((v: any, idx: number) => (
                    <div key={idx} className="p-3 bg-zinc-100/50 dark:bg-zinc-850/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold">{v.vehicleNumber}</span>
                        <span className="text-[10px] text-zinc-400 block font-bold">Model Spec: {v.model}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold">Last Visited: {v.lastServiceDate || 'Today'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40">
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Service Form Modal */}
      {isServiceFormOpen && selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold">Log Service Checklist ({selectedCust.name})</h2>
              <button onClick={() => setIsServiceFormOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Service Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.cost}
                    onChange={(e) => setServiceForm({ ...serviceForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Vehicle Plate</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.vehicleNumber}
                    onChange={(e) => setServiceForm({ ...serviceForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 mt-4">
                <button
                  type="button"
                  onClick={() => setIsServiceFormOpen(false)}
                  className="px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
                >
                  Save Service Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
