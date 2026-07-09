import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Check, 
  X, 
  Calendar, 
  Smartphone, 
  FileText,
  AlertCircle
} from 'lucide-react';

export const Warranty: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Warranty check state
  const [checkForm, setCheckForm] = useState({ invoiceNumber: '', productId: '' });
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');

  // File claim state
  const [isFilingOpen, setIsFilingOpen] = useState(false);
  const [fileForm, setFileForm] = useState({
    invoiceNumber: '',
    productId: '',
    serialNumber: '',
    issueDescription: ''
  });

  // Review Claim notes
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/warranty', { params: { search } });
      setClaims(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [search]);

  const handleCheckWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckLoading(true);
    setCheckError('');
    setCheckResult(null);

    try {
      const res = await axios.get('/api/warranty/check-status', {
        params: {
          invoiceNumber: checkForm.invoiceNumber,
          productId: checkForm.productId
        }
      });
      setCheckResult(res.data);
    } catch (err: any) {
      setCheckError(err.response?.data?.message || 'Verification search failed');
    } finally {
      setCheckLoading(false);
    }
  };

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/warranty', fileForm);
      setIsFilingOpen(false);
      setFileForm({ invoiceNumber: '', productId: '', serialNumber: '', issueDescription: '' });
      fetchClaims();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to file claim');
    }
  };

  const handleResolveClaim = async (id: string, status: 'Approved' | 'Rejected') => {
    const notes = reviewNotes[id] || `Claim ${status.toLowerCase()} during inspection.`;
    try {
      await axios.put(`/api/warranty/${id}/status`, { status, notes });
      fetchClaims();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update claim');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Warranty Register</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Track Battery Warranties & Service Claims</p>
        </div>
        <button
          onClick={() => setIsFilingOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
        >
          <Plus size={14} />
          <span>File Warranty Claim</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Warranty Validity Checker */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4">
          <h2 className="font-extrabold text-base flex items-center space-x-2 text-brand">
            <ShieldCheck size={18} />
            <span>Validity Checker</span>
          </h2>
          
          <form onSubmit={handleCheckWarranty} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Invoice Number</label>
              <input
                type="text"
                required
                placeholder="e.g. INV-2026-00001"
                value={checkForm.invoiceNumber}
                onChange={(e) => setCheckForm({ ...checkForm, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Product SKU / ID</label>
              <input
                type="text"
                required
                placeholder="e.g. AMR-FL-35AH"
                value={checkForm.productId}
                onChange={(e) => setCheckForm({ ...checkForm, productId: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={checkLoading}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              {checkLoading ? 'Verifying...' : 'Check Coverage Status'}
            </button>
          </form>

          {/* Verification Results Panel */}
          {checkResult && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              checkResult.isActive 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-400' 
                : 'bg-red-500/5 border-brand/20 text-brand'
            }`}>
              <div className="flex items-center justify-between font-black">
                <span className="uppercase text-[9px] tracking-widest">Verification Status</span>
                <span className={`px-2 py-0.5 rounded ${checkResult.isActive ? 'bg-emerald-500/20' : 'bg-brand/20'}`}>
                  {checkResult.isActive ? 'ACTIVE COVERAGE' : 'WARRANTY EXPIRED'}
                </span>
              </div>
              <div className="space-y-1 text-zinc-700 dark:text-zinc-300 font-semibold">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-extrabold text-zinc-950 dark:text-white">{checkResult.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Purchase Date:</span>
                  <span>{checkResult.purchaseDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires On:</span>
                  <span>{checkResult.expiryDate}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800 font-bold">
                  <span>Months Covered:</span>
                  <span>{checkResult.warrantyPeriod} Months</span>
                </div>
                {checkResult.isActive && (
                  <div className="text-[10px] font-black text-center text-emerald-600 dark:text-emerald-400 pt-2">
                    {checkResult.monthsRemaining} months of active warranty left.
                  </div>
                )}
              </div>
            </div>
          )}

          {checkError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-brand/20 text-brand text-xs font-bold rounded-xl flex items-center space-x-1.5">
              <AlertCircle size={14} />
              <span>{checkError}</span>
            </div>
          )}
        </div>

        {/* Right Side: Active Claims Approval Queue */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500 mb-4">
              <ShieldCheck size={18} />
              <span>Active Claims Reviews</span>
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {claims.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 font-bold text-xs">No filed warranty claims found.</div>
              ) : (
                claims.map((claim) => (
                  <div 
                    key={claim._id} 
                    className="p-5 bg-white/50 dark:bg-zinc-850/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-extrabold text-brand tracking-wider">{claim.claimNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          claim.status === 'Pending' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                            : claim.status === 'Approved' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-zinc-150 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-600 dark:text-zinc-400 font-semibold">
                        <div>Invoice: <span className="text-zinc-950 dark:text-white">{claim.invoiceNumber}</span></div>
                        <div>Battery SKU: <span className="text-zinc-950 dark:text-white">{claim.productId}</span></div>
                        <div>Customer: <span>{claim.customerName} ({claim.mobileNumber})</span></div>
                        <div>Battery Serial No: <span className="font-mono text-[10px] text-zinc-500">{claim.serialNumber}</span></div>
                      </div>

                      <div className="p-2.5 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-xl font-medium text-zinc-500 text-[10px]">
                        <strong>Problem details:</strong> {claim.issueDescription || 'No description provided'}
                      </div>
                      
                      {claim.notes && (
                        <div className="p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl font-bold text-[10px]">
                          <strong>Resolution notes:</strong> {claim.notes}
                        </div>
                      )}
                    </div>

                    {/* Review actions (Admin/Staff check) */}
                    {claim.status === 'Pending' && (
                      <div className="flex flex-col space-y-2 w-full md:w-48">
                        <input
                          type="text"
                          placeholder="Resolution inspection notes..."
                          value={reviewNotes[claim._id] || ''}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [claim._id]: e.target.value })}
                          className="px-2.5 py-1.5 text-[10px] rounded-lg glass-input w-full"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResolveClaim(claim._id, 'Approved')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleResolveClaim(claim._id, 'Rejected')}
                            className="flex-1 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* File Claim Dialog */}
      {isFilingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold">File Warranty Claim Receipt</h2>
              <button onClick={() => setIsFilingOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFileClaim} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-00001"
                  value={fileForm.invoiceNumber}
                  onChange={(e) => setFileForm({ ...fileForm, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Product SKU / ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXD-DIN65-RED"
                  value={fileForm.productId}
                  onChange={(e) => setFileForm({ ...fileForm, productId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Battery Serial Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SN-98234-X9"
                  value={fileForm.serialNumber}
                  onChange={(e) => setFileForm({ ...fileForm, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Defect / Issue Details</label>
                <textarea
                  placeholder="e.g. Dead cell, does not hold charge, bulging casing..."
                  value={fileForm.issueDescription}
                  onChange={(e) => setFileForm({ ...fileForm, issueDescription: e.target.value })}
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFilingOpen(false)}
                  className="px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
                >
                  File Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
