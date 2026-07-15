import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Barcode, 
  Upload, 
  AlertTriangle,
  FolderOpen,
  Filter,
  X,
  FileDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  
  // Form fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    brand: '',
    model: '',
    vehicleType: 'Car',
    capacity: 45,
    warrantyPeriod: 18,
    purchasePrice: 3000,
    sellingPrice: 4500,
    quantity: 10,
    supplier: '',
    location: ''
  });

  // Selected item for Code Modal
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [error, setError] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/inventory', {
        params: {
          search,
          brand: filterBrand || undefined,
          vehicleType: filterType || undefined,
          branchId: user?.branchId || undefined
        }
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, filterBrand, filterType, user?.branchId]);

  const handleOpenForm = (prod: any = null) => {
    if (prod) {
      setEditingId(prod._id);
      setFormData({
        productId: prod.productId,
        brand: prod.brand,
        model: prod.model,
        vehicleType: prod.vehicleType,
        capacity: prod.capacity,
        warrantyPeriod: prod.warrantyPeriod,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        quantity: prod.quantity,
        supplier: prod.supplier || '',
        location: prod.location || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        productId: 'BAT-' + Math.floor(100000 + Math.random() * 900000),
        brand: '',
        model: '',
        vehicleType: 'Car',
        capacity: 45,
        warrantyPeriod: 24,
        purchasePrice: 3500,
        sellingPrice: 4800,
        quantity: 12,
        supplier: '',
        location: 'Aisle A'
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        branchId: user?.branchId || 'main'
      };
      if (editingId) {
        await axios.put(`/api/inventory/${editingId}`, payload);
      } else {
        await axios.post('/api/inventory', payload);
      }
      setIsFormOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product from inventory?')) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        fetchInventory();
      } catch (err) {
        console.error('Failed to delete product', err);
      }
    }
  };

  const handleOpenCodes = (prod: any) => {
    setSelectedProduct(prod);
    setIsCodeOpen(true);
  };

  const parseBulkInput = (input: string) => {
    const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedProducts: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Split by tab first (Excel format), then by comma (CSV format)
      let parts = line.split('\t');
      if (parts.length <= 1) {
        parts = line.split(',');
      }
      parts = parts.map(p => p.trim());

      // Skip lines that don't have enough product details
      if (parts.length < 3) {
        continue;
      }

      const brand = parts[0] || 'Generic';
      const model = parts[1] || 'Unknown';
      const vehicleType = parts[2] || 'Car';
      const capacity = Number(parts[3]) || 35;
      const warrantyPeriod = Number(parts[4]) || 12;
      const purchasePrice = Number(parts[5]) || 0;
      const sellingPrice = Number(parts[6]) || 0;
      const quantity = Number(parts[7]) || 0;
      const location = parts[8] || 'Aisle A';
      const supplier = parts[9] || 'Imported';

      // Auto-generate a clean SKU/productId based on brand, model and random digit
      const productId = `BAT-${brand.substring(0, 3).toUpperCase()}-${model.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      parsedProducts.push({
        productId,
        brand,
        model,
        vehicleType,
        capacity,
        warrantyPeriod,
        purchasePrice,
        sellingPrice,
        quantity,
        location,
        supplier
      });
    }

    return parsedProducts;
  };

  const handleLoadSampleBulk = () => {
    const sample = 
`Exide, Xpress 32Ah, Car, 32, 24, 2200, 3100, 8, Shelf 5, Exide Distributors
Amaron, HiLife 55Ah, Car, 55, 36, 3800, 5200, 15, Shelf 3, Amaron Power Systems`;
    setBulkInput(sample);
  };

  const handleBulkImport = async () => {
    setError('');
    try {
      let parsed: any[] = [];
      const trimmed = bulkInput.trim();
      
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        parsed = JSON.parse(bulkInput);
      } else {
        parsed = parseBulkInput(bulkInput);
      }

      if (parsed.length === 0) {
        throw new Error('No valid products parsed. Enter at least: Brand, Model, VehicleType.');
      }

      const productsWithBranch = parsed.map(p => ({
        ...p,
        branchId: p.branchId || user?.branchId || 'main'
      }));
      await axios.post('/api/inventory/bulk-import', { products: productsWithBranch });
      setIsBulkOpen(false);
      setBulkInput('');
      fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Invalid format. Make sure columns are separated by commas or tab characters.');
    }
  };

  // Barcode SVG Renderer
  const renderBarcodeLines = (code: string) => {
    const bars = [];
    const len = code.length;
    for (let i = 0; i < 40; i++) {
      const width = (code.charCodeAt(i % len) % 3) + 1; // 1, 2, or 3px
      bars.push(
        <rect 
          key={i} 
          x={i * 6} 
          y={0} 
          width={width} 
          height={60} 
          fill="currentColor" 
        />
      );
    }
    return (
      <svg className="w-full h-16 text-zinc-900 dark:text-white" viewBox="0 0 240 60">
        {bars}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Inventory Catalog</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Manage Battery Stock & Locations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
          >
            <Upload size={14} />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, Brand, Model, Supplier..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input"
          />
        </div>

        {/* Brand Filter */}
        <div className="w-full md:w-48">
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl glass-input cursor-pointer"
          >
            <option value="">All Brands</option>
            <option value="Exide">Exide</option>
            <option value="Amaron">Amaron</option>
            <option value="SF Sonic">SF Sonic</option>
            <option value="Luminous">Luminous</option>
          </select>
        </div>

        {/* Vehicle Type Filter */}
        <div className="w-full md:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2.5 text-xs rounded-xl glass-input cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Car">Car</option>
            <option value="SUV">SUV</option>
            <option value="Truck">Truck</option>
            <option value="Bike">Bike</option>
            <option value="Inverter">Inverter</option>
          </select>
        </div>

      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-400 font-extrabold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                <th className="p-4">SKU / Product ID</th>
                <th className="p-4">Brand & Model</th>
                <th className="p-4">Vehicle / Capacity</th>
                <th className="p-4">Warranty</th>
                <th className="p-4 text-right">Purchase (₹)</th>
                <th className="p-4 text-right">Selling (₹)</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center p-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-12 text-zinc-400 font-bold">
                    No batteries match your filter query.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-zinc-100/20 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="p-4 font-extrabold text-brand tracking-wider">{prod.productId}</td>
                    <td className="p-4">
                      <div className="font-extrabold text-zinc-900 dark:text-white">{prod.brand}</div>
                      <div className="text-[10px] text-zinc-400 font-semibold">{prod.model}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold mr-1.5">{prod.vehicleType}</span>
                      <span className="font-extrabold">{prod.capacity} Ah</span>
                    </td>
                    <td className="p-4 font-bold">{prod.warrantyPeriod} Months</td>
                    <td className="p-4 text-right font-semibold">₹{prod.purchasePrice.toLocaleString()}</td>
                    <td className="p-4 text-right font-extrabold">₹{prod.sellingPrice.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-black ${
                        prod.quantity <= 5 
                          ? 'bg-red-100 text-brand dark:bg-brand/10' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                      }`}>
                        {prod.quantity}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-zinc-400">{prod.location || 'Shelf A'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenCodes(prod)}
                          title="Generate Barcode / QR"
                          className="p-2 bg-zinc-100 hover:bg-brand/10 dark:bg-zinc-800 text-zinc-500 hover:text-brand rounded-lg transition-all"
                        >
                          <Barcode size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenForm(prod)}
                          title="Edit Details"
                          className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-lg transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(prod._id)}
                          title="Delete Product"
                          className="p-2 bg-zinc-100 hover:bg-red-500/10 dark:bg-zinc-800 text-zinc-500 hover:text-brand rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
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

      {/* CRUD Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-xl font-extrabold">{editingId ? 'Edit Product Details' : 'Add New Inventory Battery'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-zinc-150 text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Product SKU / ID</label>
                <input
                  type="text"
                  required
                  disabled={editingId !== null}
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exide, Amaron"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Model Name / Spec</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HiLife Max"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input cursor-pointer"
                >
                  <option value="Car">Car</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Bike">Bike</option>
                  <option value="Inverter">Inverter</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Capacity (Ah)</label>
                <input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Warranty Period (Months)</label>
                <input
                  type="number"
                  required
                  value={formData.warrantyPeriod}
                  onChange={(e) => setFormData({ ...formData, warrantyPeriod: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Purchase Price (Cost ₹)</label>
                <input
                  type="number"
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Selling Price (Retail ₹)</label>
                <input
                  type="number"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Supplier Name</label>
                <input
                  type="text"
                  placeholder="Supplier Company"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Warehouse Shelf / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Aisle B, Rack 3"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Modal (Barcode) */}
      {isCodeOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark text-center">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold">Product Barcode</h2>
              <button onClick={() => setIsCodeOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Standard Barcode</span>
                <span className="font-mono text-[10px] text-zinc-500 mb-3 block">{selectedProduct.productId}</span>
                <div className="bg-white p-4 rounded-2xl inline-flex justify-center border border-zinc-200/40">
                  {renderBarcodeLines(selectedProduct.productId)}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 flex justify-end">
                <button
                  onClick={() => setIsCodeOpen(false)}
                  className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-6">
              <h2 className="text-base font-extrabold">Bulk Import Catalog</h2>
              <button onClick={() => setIsBulkOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Paste Excel columns or CSV lines here (tab/comma separated):</span>
                <button 
                  onClick={handleLoadSampleBulk} 
                  className="text-xs text-brand font-extrabold hover:underline"
                >
                  Load Sample Excel/CSV
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-brand text-xs font-bold rounded-xl">
                  {error}
                </div>
              )}

              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Exide, Xpress 32Ah, Car, 32, 24, 2200, 3100, 8, Shelf 5, Exide Distributors&#10;Amaron, HiLife 55Ah, Car, 55, 36, 3800, 5200, 15, Shelf 3, Amaron Power Systems&#10;&#10;Format: Brand, Model, VehicleType, Capacity(Ah), Warranty(M), CostPrice, RetailPrice, Quantity, [Location], [Supplier]"
                rows={10}
                className="w-full p-3 font-mono text-[10px] rounded-2xl glass-input"
              />

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  onClick={() => setIsBulkOpen(false)}
                  className="px-4 py-2 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
                >
                  Import Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
