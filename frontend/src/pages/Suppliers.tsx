import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Search, 
  Plus, 
  DollarSign, 
  FileText, 
  X,
  CreditCard,
  CheckCircle,
  Eye
} from 'lucide-react';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected supplier ledger view
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Add Supplier form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    outstandingDues: 0
  });

  // Make Payment form
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payment, setPayment] = useState({
    description: 'Bank NEFT Transfer payment',
    amount: 5000
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/suppliers', { params: { search } });
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/suppliers', form);
      setIsFormOpen(false);
      setForm({ name: '', contactPerson: '', mobile: '', email: '', outstandingDues: 0 });
      fetchSuppliers();
    } catch (err) {
      alert('Error creating supplier');
    }
  };

  const handleOpenLedger = (s: any) => {
    setSelectedSupplier(s);
    setIsLedgerOpen(true);
  };

  const handleOpenPayment = (s: any) => {
    setSelectedSupplier(s);
    setPayment({
      description: `Payment for outstanding invoice - NEFT`,
      amount: Math.min(s.outstandingDues, 10000) || 5000
    });
    setIsPaymentOpen(true);
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`/api/suppliers/${selectedSupplier._id}/ledger`, {
        description: payment.description,
        amount: Number(payment.amount),
        type: 'debit' // debit reduces dues
      });
      setSelectedSupplier(res.data); // Update ledger list view
      setIsPaymentOpen(false);
      fetchSuppliers();
    } catch (err) {
      alert('Error processing supplier payment');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Suppliers Index</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Track Vendor Accounts & Ledgers</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
        >
          <Plus size={14} />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="glass-panel rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name, contact person, mobile..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
          />
        </div>
      </div>

      {/* Supplier List Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-400 font-extrabold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                <th className="p-4">Supplier Name</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Mobile Details</th>
                <th className="p-4 text-right">Outstanding Dues (₹)</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-zinc-400 font-bold">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-zinc-100/20 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-zinc-900 dark:text-white">{s.name}</div>
                      <div className="text-[10px] text-zinc-400 font-semibold">{s.email || 'No Email'}</div>
                    </td>
                    <td className="p-4 font-bold">{s.contactPerson || 'Not Specified'}</td>
                    <td className="p-4 text-zinc-500 font-semibold">{s.mobile}</td>
                    <td className={`p-4 text-right font-extrabold ${s.outstandingDues > 0 ? 'text-brand' : 'text-emerald-600'}`}>
                      ₹{s.outstandingDues.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenLedger(s)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-brand rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Eye size={12} />
                          <span>Ledger Statement</span>
                        </button>
                        <button
                          onClick={() => handleOpenPayment(s)}
                          disabled={s.outstandingDues <= 0}
                          className="px-3 py-1.5 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-lg font-bold flex items-center space-x-1 transition-all disabled:opacity-40"
                        >
                          <DollarSign size={12} />
                          <span>Post Payment</span>
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

      {/* Supplier Creation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold">Register New Vendor / Supplier</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Company / Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exide Industries Ltd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Sharma"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Mobile Details</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876500000"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Dues Outstanding (₹)</label>
                  <input
                    type="number"
                    value={form.outstandingDues}
                    onChange={(e) => setForm({ ...form, outstandingDues: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. logistics@exide.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {isLedgerOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-lg font-extrabold flex items-center space-x-2">
                <FileText className="text-brand" size={18} />
                <span>Supplier Ledger Statement ({selectedSupplier.name})</span>
              </h2>
              <button onClick={() => setIsLedgerOpen(false)} className="p-1 rounded-lg hover:bg-zinc-150 text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-zinc-100/50 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Total Outstanding Balance</span>
                  <span className={`text-lg font-black ${selectedSupplier.outstandingDues > 0 ? 'text-brand' : 'text-emerald-600'}`}>
                    ₹{selectedSupplier.outstandingDues.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => { setIsLedgerOpen(false); handleOpenPayment(selectedSupplier); }}
                  disabled={selectedSupplier.outstandingDues <= 0}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold flex items-center space-x-1 transition-all disabled:opacity-40"
                >
                  <DollarSign size={12} />
                  <span>Log Bank Payment</span>
                </button>
              </div>

              {/* Ledger Lines */}
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest block">Transactions Log</span>
                {selectedSupplier.ledger?.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-400 font-bold bg-zinc-50 dark:bg-zinc-900 rounded-xl">No ledger entries found.</div>
                ) : (
                  <div className="space-y-2">
                    {selectedSupplier.ledger.map((line: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                          line.type === 'credit' 
                            ? 'bg-red-500/5 border-brand/10 text-brand' 
                            : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <div>
                          <span className="block font-bold">{line.description}</span>
                          <span className="text-[9px] text-zinc-400">{line.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold block">
                            {line.type === 'credit' ? '+' : '-'} ₹{line.amount}
                          </span>
                          <span className="text-[8px] text-zinc-400 uppercase tracking-widest">{line.type === 'credit' ? 'Accounts Payable' : 'Disbursement'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40">
                <button
                  onClick={() => setIsLedgerOpen(false)}
                  className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Payment Modal */}
      {isPaymentOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold">Record Disbursement Payment</h2>
              <button onClick={() => setIsPaymentOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePaySupplier} className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block mb-1">Supplier Company</span>
                <span className="font-extrabold text-sm block">{selectedSupplier.name}</span>
                <span className="text-[10px] text-brand font-bold block mt-1">Total Owed: ₹{selectedSupplier.outstandingDues.toLocaleString()}</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Disbursement Details / Ref</label>
                <input
                  type="text"
                  required
                  value={payment.description}
                  onChange={(e) => setPayment({ ...payment, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  max={selectedSupplier.outstandingDues}
                  value={payment.amount}
                  onChange={(e) => setPayment({ ...payment, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 mt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-glow-emerald"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
