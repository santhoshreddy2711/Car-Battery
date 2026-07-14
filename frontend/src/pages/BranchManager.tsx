import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GitFork, 
  Store, 
  MapPin, 
  Phone, 
  Plus, 
  X,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react';

export const BranchManager: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Branch form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    code: '',
    contactNumber: ''
  });

  // Transfer stock form
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transfer, setTransfer] = useState({
    fromBranchCode: 'main',
    toBranchCode: '',
    productId: '',
    qty: 5
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        axios.get('/api/branches'),
        axios.get('/api/inventory?branchId=all')
      ]);
      setBranches(bRes.data);
      setProducts(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/branches', form);
      setIsFormOpen(false);
      setForm({ name: '', location: '', code: '', contactNumber: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error registering branch');
    }
  };

  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer.toBranchCode || !transfer.productId || transfer.qty <= 0) {
      alert('Please fill in all transfer fields.');
      return;
    }
    if (transfer.fromBranchCode === transfer.toBranchCode) {
      alert('Source and destination branches cannot be the same!');
      return;
    }

    try {
      const res = await axios.post('/api/branches/transfer', transfer);
      alert(res.data.message);
      setIsTransferOpen(false);
      setTransfer({ fromBranchCode: 'main', toBranchCode: '', productId: '', qty: 5 });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stock transfer failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Multi-Branch ERP</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Manage Outlets & Stock Transfers</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-850 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={14} />
            <span>Transfer Inventory</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
          >
            <Plus size={14} />
            <span>Add Outlet Branch</span>
          </button>
        </div>
      </div>

      {/* Branch List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-400 font-bold text-xs">No active branches found. Register one to begin.</div>
        ) : (
          branches.map((b) => {
            // Count products in this specific branch
            const branchProductCount = products.filter(p => p.branchId === b.code).length;
            const branchStockTotal = products.filter(p => p.branchId === b.code).reduce((sum, p) => sum + p.quantity, 0);

            return (
              <div 
                key={b._id} 
                className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-all relative group overflow-hidden"
              >
                {/* Left accent color */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand" />
                
                <div className="space-y-2 pl-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base">{b.name}</h3>
                    <span className="bg-brand/10 text-brand text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{b.code}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-zinc-500 font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <MapPin size={12} className="text-zinc-400" />
                      <span>{b.location}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Phone size={12} className="text-zinc-400" />
                      <span>{b.contactNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 pl-2">
                  <div className="bg-zinc-100/50 dark:bg-zinc-900/30 rounded-2xl p-3 text-center">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase block mb-1">Catalog SKUs</span>
                    <span className="font-black text-sm">{branchProductCount} Batteries</span>
                  </div>
                  <div className="bg-zinc-100/50 dark:bg-zinc-900/30 rounded-2xl p-3 text-center">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase block mb-1">Total Stock</span>
                    <span className="font-black text-sm">{branchStockTotal} Units</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Branch Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold flex items-center space-x-2">
                <Store className="text-brand" size={16} />
                <span>Register Company Branch Outlet</span>
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Suburban Outlet"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Branch Code (Unique)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sub-south"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 080-923849"
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Physical Location Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street, City State"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
                >
                  Register Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold flex items-center space-x-2">
                <GitFork className="text-brand" size={16} />
                <span>Inter-Branch Stock Transfer</span>
              </h2>
              <button onClick={() => setIsTransferOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTransferStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 items-center">
                {/* From Branch */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Source Branch</label>
                  <select
                    value={transfer.fromBranchCode}
                    onChange={(e) => setTransfer({ ...transfer, fromBranchCode: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl glass-input cursor-pointer font-bold"
                  >
                    {branches.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* To Branch */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Dest Branch</label>
                  <select
                    value={transfer.toBranchCode}
                    onChange={(e) => setTransfer({ ...transfer, toBranchCode: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl glass-input cursor-pointer font-bold animate-pulse-glow"
                  >
                    <option value="">Choose Destination...</option>
                    {branches.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Product SKU */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Select Product Battery</label>
                <select
                  required
                  value={transfer.productId}
                  onChange={(e) => setTransfer({ ...transfer, productId: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl glass-input cursor-pointer"
                >
                  <option value="">Choose Battery...</option>
                  {/* Filter products available in the source branch */}
                  {products.filter(p => p.branchId === transfer.fromBranchCode).map(p => (
                    <option key={p._id} value={p.productId}>{p.brand} {p.model} (Stock: {p.quantity})</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Transfer Qty</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={transfer.qty}
                  onChange={(e) => setTransfer({ ...transfer, qty: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input font-bold"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 mt-4">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
                >
                  Initiate Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
