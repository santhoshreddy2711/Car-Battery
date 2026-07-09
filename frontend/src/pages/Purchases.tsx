import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  X,
  PlusCircle,
  Trash2
} from 'lucide-react';

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // PO Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState<any[]>([{ productId: '', qty: 10, purchasePrice: 0 }]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, prRes] = await Promise.all([
        axios.get('/api/purchases', { params: { search } }),
        axios.get('/api/suppliers'),
        axios.get('/api/inventory')
      ]);
      setPurchases(pRes.data);
      setSuppliers(sRes.data);
      setProducts(prRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleAddItemRow = () => {
    setPoItems([...poItems, { productId: '', qty: 10, purchasePrice: 0 }]);
  };

  const handleUpdateItemRow = (index: number, field: string, value: any) => {
    const updated = [...poItems];
    updated[index][field] = value;
    
    // Auto populate unit cost if productId changes
    if (field === 'productId') {
      const match = products.find(p => p.productId === value);
      if (match) {
        updated[index].purchasePrice = match.purchasePrice;
      }
    }
    setPoItems(updated);
  };

  const handleRemoveItemRow = (index: number) => {
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }
    try {
      await axios.post('/api/purchases', {
        supplierId: selectedSupplier,
        items: poItems
      });
      setIsFormOpen(false);
      setSelectedSupplier('');
      setPoItems([{ productId: '', qty: 10, purchasePrice: 0 }]);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating purchase order');
    }
  };

  const handleReceiveStock = async (id: string) => {
    if (window.confirm('Mark this purchase order as Received? Stock quantities will be updated.')) {
      try {
        await axios.put(`/api/purchases/${id}/receive`);
        fetchData();
      } catch (err) {
        console.error('Failed to receive stock', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Purchase Orders</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Manage Procurements & Restocks</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
        >
          <Plus size={14} />
          <span>Launch Restock PO</span>
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
            placeholder="Search by Purchase Order number, supplier..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
          />
        </div>
      </div>

      {/* PO List */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-400 font-extrabold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Date Drafted</th>
                <th className="p-4 text-center">Items Count</th>
                <th className="p-4 text-right">Total Cost (₹)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-zinc-400 font-bold">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => {
                  const supplierName = suppliers.find(s => s._id === po.supplierId)?.name || 'Direct Procurement';
                  return (
                    <tr key={po._id} className="hover:bg-zinc-100/20 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="p-4 font-extrabold text-brand tracking-wider">{po.purchaseOrderNumber}</td>
                      <td className="p-4 font-bold">{supplierName}</td>
                      <td className="p-4 text-zinc-500 font-semibold">{new Date(po.createdAt).toISOString().split('T')[0]}</td>
                      <td className="p-4 text-center font-bold">{po.items?.length || 0} Line Item(s)</td>
                      <td className="p-4 text-right font-extrabold">₹{po.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-black ${
                          po.status === 'Pending' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          {po.status === 'Pending' ? (
                            <button
                              onClick={() => handleReceiveStock(po._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1 shadow-sm transition-all"
                            >
                              <CheckCircle size={12} />
                              <span>Receive Stock</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Received: {po.receivedDate}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Creation Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-lg font-extrabold flex items-center space-x-2">
                <ShoppingBag className="text-brand" size={18} />
                <span>Create Procurements Purchase Order (PO)</span>
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-6">
              {/* Select Supplier */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Select Supplier</label>
                <select
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl glass-input cursor-pointer font-bold"
                >
                  <option value="">Choose Supplier Registry...</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name} (Dues: ₹{s.outstandingDues})</option>
                  ))}
                </select>
              </div>

              {/* Items Row list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-zinc-400">Order Items Checklist</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-brand hover:underline font-bold flex items-center space-x-0.5"
                  >
                    <PlusCircle size={12} className="mr-0.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end bg-zinc-100/30 dark:bg-zinc-900/25 p-3 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
                      {/* Select Product */}
                      <div className="col-span-5">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Product Battery SKU</label>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg glass-input cursor-pointer"
                        >
                          <option value="">Select Battery...</option>
                          {products.map(p => (
                            <option key={p._id} value={p.productId}>{p.brand} {p.model} ({p.productId})</option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-3">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Qty to Order</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleUpdateItemRow(index, 'qty', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs rounded-lg glass-input text-center font-bold"
                        />
                      </div>

                      {/* Cost Price */}
                      <div className="col-span-3">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Purchase Cost (₹)</label>
                        <input
                          type="number"
                          required
                          value={item.purchasePrice}
                          onChange={(e) => handleUpdateItemRow(index, 'purchasePrice', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs rounded-lg glass-input text-center"
                        />
                      </div>

                      {/* Remove Row */}
                      <div className="col-span-1 flex justify-center pb-1">
                        <button
                          type="button"
                          disabled={poItems.length === 1}
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-2 text-zinc-400 hover:text-brand disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                  Draft & Dispatch PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
