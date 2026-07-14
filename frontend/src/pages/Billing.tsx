import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Receipt, 
  User, 
  Phone, 
  Car, 
  Search, 
  ShoppingCart, 
  Printer, 
  Mail, 
  Send,
  X,
  CreditCard,
  QrCode,
  Sparkles
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.js';
import { useAuth } from '../context/AuthContext.js';

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Invoice Customer Form
  const [customer, setCustomer] = useState({
    name: '',
    mobile: '',
    vehicleNumber: ''
  });

  // Validation States
  const [phoneValid, setPhoneValid] = useState(false);
  const [vehicleValid, setVehicleValid] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [vehicleError, setVehicleError] = useState('');
  const [nameError, setNameError] = useState('');

  const handleNameChange = (val: string) => {
    // Keep only alphabetic characters and spaces
    const sanitized = val.replace(/[^A-Za-z\s]/g, '');
    setCustomer(prev => ({ ...prev, name: sanitized }));
    if (sanitized.length === 0 && val.length > 0) {
      setNameError('Customer name must contain only alphabets.');
    } else {
      setNameError('');
    }
  };

  const getNameClass = () => {
    if (customer.name.length === 0) return 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input';
    return 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20';
  };

  const handlePhoneChange = (val: string) => {
    // Accept only digits and limit to 10 characters
    const sanitized = val.replace(/\D/g, '').slice(0, 10);
    setCustomer(prev => ({ ...prev, mobile: sanitized }));
    const isValid = /^\d{10}$/.test(sanitized);
    setPhoneValid(isValid);
    if (!isValid && sanitized.length > 0) {
      setPhoneError('Phone number must contain exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const handleVehicleChange = (val: string) => {
    // Convert to uppercase, strip invalid characters (spaces and symbols)
    const sanitized = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCustomer(prev => ({ ...prev, vehicleNumber: sanitized }));
    const isValid = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(sanitized);
    setVehicleValid(isValid);
    if (!isValid && sanitized.length > 0) {
      setVehicleError('Enter a valid registration number (Example: TG08GU3055).');
    } else {
      setVehicleError('');
    }
  };

  const getPhoneClass = () => {
    if (customer.mobile.length === 0) return 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input';
    return phoneValid 
      ? 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20' 
      : 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input border-brand focus:border-brand focus:ring-brand/20'; // border-brand represents red accent
  };

  const getVehicleClass = () => {
    if (customer.vehicleNumber.length === 0) return 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input';
    return vehicleValid 
      ? 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20' 
      : 'w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input border-brand focus:border-brand focus:ring-brand/20';
  };

  // Invoice Cart
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Credit'>('Cash');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Completed Invoice Modal (Receipt)
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Search product dropdown list
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchInvoices();
  }, [user?.branchId]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/inventory', {
        params: { branchId: user?.branchId || undefined }
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/billing', {
        params: { branchId: user?.branchId || undefined }
      });
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (prod: any) => {
    if (prod.quantity === 0) {
      alert('Product out of stock!');
      return;
    }

    const existing = cart.find(item => item.productId === prod.productId);
    if (existing) {
      if (existing.qty >= prod.quantity) {
        alert(`Cannot add more. Only ${prod.quantity} units available in stock.`);
        return;
      }
      setCart(prev => prev.map(item => 
        item.productId === prod.productId ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart(prev => [...prev, {
        productId: prod.productId,
        brand: prod.brand,
        model: prod.model,
        qty: 1,
        price: prod.sellingPrice,
        gstRate: 18,
        discount: 0,
        maxStock: prod.quantity
      }]);
    }
    setShowProductDropdown(false);
    setSearchQuery('');
  };

  const updateCartQty = (productId: string, val: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const nextQty = Math.max(1, val);
        if (nextQty > item.maxStock) {
          alert(`Only ${item.maxStock} units available.`);
          return item;
        }
        return { ...item, qty: nextQty };
      }
      return item;
    }));
  };

  const updateCartDiscount = (productId: string, val: number) => {
    setCart(prev => prev.map(item => 
      item.productId === productId ? { ...item, discount: Math.max(0, val) } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Financial Calculations
  const calculateTotals = () => {
    let subTotal = 0;
    let gstTotal = 0;
    let discountTotal = 0;

    cart.forEach(item => {
      const basePrice = item.price - item.discount;
      const itemSubtotal = basePrice * item.qty;
      const itemGst = (basePrice * (item.gstRate / 100)) * item.qty;

      subTotal += itemSubtotal;
      gstTotal += itemGst;
      discountTotal += (item.discount * item.qty);
    });

    const totalAmount = Math.round(subTotal + gstTotal);

    return {
      subTotal: Math.round(subTotal),
      gstTotal: Math.round(gstTotal),
      discountTotal: Math.round(discountTotal),
      totalAmount
    };
  };

  const totals = calculateTotals();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Your billing cart is empty.');
      return;
    }

    const isPhoneOk = /^\d{10}$/.test(customer.mobile);
    const isVehicleOk = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(customer.vehicleNumber);

    if (!customer.name || !isPhoneOk || !isVehicleOk) {
      alert('Please fix validation errors before checkout. Phone must be 10 digits and vehicle reg format valid (e.g. TG08GU3055).');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await axios.post('/api/billing', {
        customerName: customer.name,
        mobileNumber: customer.mobile,
        vehicleNumber: customer.vehicleNumber,
        items: cart,
        paymentMethod,
        status: 'Paid',
        branchId: user?.branchId || 'main'
      });

      // Reset states
      setCart([]);
      setCustomer({ name: '', mobile: '', vehicleNumber: '' });
      setPhoneValid(false);
      setVehicleValid(false);
      setPhoneError('');
      setVehicleError('');
      setNameError('');
      
      // Load completed receipt
      setCompletedInvoice(res.data);
      setIsReceiptOpen(true);
      
      // Refresh local lists
      fetchProducts();
      fetchInvoices();
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing invoice checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const sendMockNotification = (channel: 'whatsapp' | 'email') => {
    alert(`Mock ${channel === 'whatsapp' ? 'WhatsApp message' : 'Email notification'} sent to ${completedInvoice?.customerName} (${completedInvoice?.mobileNumber}) with Invoice PDF link.`);
  };

  // Filter products for dropdown autocomplete search
  const filteredProducts = products.filter(p => 
    p.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Billing & Checkout</h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Generate GST Invoice Receipts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Customer & Product Selector */}
        <div className="lg:col-span-7 space-y-6 no-print">
          
          {/* Customer Profile card */}
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4">
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-brand">
              <User size={16} />
              <span>Customer Registry</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Customer Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <User size={12} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={customer.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={getNameClass()}
                  />
                </div>
                {nameError && (
                  <span className="text-[9px] text-brand font-bold mt-1 block leading-tight">{nameError}</span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Mobile Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Phone size={12} />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={customer.mobile}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={getPhoneClass()}
                  />
                </div>
                {phoneError && (
                  <span className="text-[9px] text-brand font-bold mt-1 block leading-tight">{phoneError}</span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Vehicle Registration</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Car size={12} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TG08GU3055"
                    value={customer.vehicleNumber}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className={getVehicleClass()}
                  />
                </div>
                {vehicleError && (
                  <span className="text-[9px] text-brand font-bold mt-1 block leading-tight">{vehicleError}</span>
                )}
              </div>
            </div>
          </div>

          {/* Product autocomplete search and quick list */}
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4 relative">
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-brand">
              <Search size={16} />
              <span>Search Batteries to Bill</span>
            </h2>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowProductDropdown(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type brand, model, capacity, or barcode SKU..."
                className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input"
              />

              {/* Product Autocomplete Dropdown List */}
              {showProductDropdown && searchQuery && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/40">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-xs text-zinc-400 font-bold text-center">No batteries found in catalog</div>
                  ) : (
                    filteredProducts.map(prod => (
                      <div
                        key={prod._id}
                        onClick={() => addToCart(prod)}
                        className="p-3 hover:bg-brand/5 cursor-pointer flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-zinc-950 dark:text-zinc-50">{prod.brand} - {prod.model}</span>
                          <span className="text-[10px] text-zinc-400 font-bold ml-2">({prod.productId})</span>
                        </div>
                        <div className="flex items-center space-x-3 text-right">
                          <span className="font-bold text-zinc-400">{prod.capacity}Ah | Cost: ₹{prod.sellingPrice}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            prod.quantity <= 5 ? 'bg-red-100 text-brand dark:bg-brand/10' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                          }`}>
                            {prod.quantity} In Stock
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Click backdrop to close autocomplete */}
            {showProductDropdown && (
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowProductDropdown(false)}
              />
            )}

            {/* Quick Select Grid (frequently sold batteries) */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest block">Quick Select Catalog</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.slice(0, 3).map((prod) => (
                  <button
                    key={prod._id}
                    onClick={() => addToCart(prod)}
                    className="p-3 bg-white/50 dark:bg-zinc-850/40 border border-zinc-200/50 dark:border-zinc-800/50 hover:border-brand rounded-2xl flex flex-col items-start text-left transition-all hover:scale-[1.01]"
                  >
                    <span className="text-[10px] font-extrabold text-brand tracking-wider">{prod.brand}</span>
                    <span className="font-bold text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{prod.model}</span>
                    <span className="text-[10px] text-zinc-400 font-bold mt-1">₹{prod.sellingPrice.toLocaleString()} | {prod.quantity} left</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Past Invoices Registry */}
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark">
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500 mb-4">
              <Receipt size={16} />
              <span>Billing Logs / Invoices</span>
            </h2>
            <div className="overflow-y-auto max-h-56 divide-y divide-zinc-200/20 dark:divide-zinc-850/20 pr-1">
              {invoices.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400 font-bold">No previous invoice entries found.</div>
              ) : (
                invoices.map((inv: any) => (
                  <div key={inv._id} className="py-2.5 flex items-center justify-between text-xs hover:bg-zinc-100/10 rounded-lg px-2">
                    <div>
                      <span className="font-extrabold text-brand tracking-wider">{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-zinc-400 font-bold ml-2">{inv.customerName} | {inv.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <span className="font-extrabold">₹{inv.totalAmount.toLocaleString()}</span>
                      <button 
                        onClick={() => { setCompletedInvoice(inv); setIsReceiptOpen(true); }}
                        className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 rounded-lg font-bold"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Invoice Billing Cart */}
        <div className="lg:col-span-5 no-print">
          <form onSubmit={handleCheckout} className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800/40">
              <h2 className="font-extrabold text-base flex items-center space-x-2">
                <ShoppingCart size={18} className="text-brand" />
                <span>Billing Cart</span>
              </h2>
              <span className="bg-brand/10 text-brand text-xs font-black px-2.5 py-0.5 rounded-full">{cart.length} Item(s)</span>
            </div>

            {/* Cart Items list */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 divide-y divide-zinc-200/20 dark:divide-zinc-850/20">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 font-bold text-xs flex flex-col items-center justify-center space-y-3">
                  <ShoppingCart size={36} className="text-zinc-300 opacity-70" />
                  <span>Cart is empty. Add a battery to begin.</span>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={item.productId} className={`pt-3 ${idx === 0 ? '' : 'mt-3'} flex flex-col space-y-2`}>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold">{item.brand} - {item.model}</span>
                        <span className="text-[10px] text-zinc-400 block font-semibold">SKU: {item.productId} | Unit ₹{item.price}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-zinc-400 hover:text-brand"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Quantity */}
                      <div>
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Quantity</label>
                        <input
                          type="number"
                          value={item.qty}
                          min={1}
                          onChange={(e) => updateCartQty(item.productId, Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded-lg glass-input text-center font-bold"
                        />
                      </div>

                      {/* Discount per item */}
                      <div>
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Discount (₹)</label>
                        <input
                          type="number"
                          value={item.discount}
                          min={0}
                          onChange={(e) => updateCartDiscount(item.productId, Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs rounded-lg glass-input text-center"
                        />
                      </div>

                      {/* Total cost for item */}
                      <div className="text-right flex flex-col justify-end">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase block">Total</span>
                        <span className="font-black text-xs">₹{((item.price - item.discount) * item.qty * 1.18).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            {cart.length > 0 && (
              <div className="bg-zinc-150/40 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-4 space-y-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal (Excl. Tax)</span>
                  <span className="font-bold text-zinc-900 dark:text-white">₹{totals.subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST + SGST (18%)</span>
                  <span className="font-bold text-zinc-900 dark:text-white">₹{totals.gstTotal.toLocaleString()}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Loyalty / Item Discounts</span>
                    <span>-₹{totals.discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 border-t border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 font-black">
                  <span className="text-sm">Final Invoice Total</span>
                  <span className="text-base text-brand">₹{totals.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {cart.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest block">Select Payment Method</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['Cash', 'Card', 'UPI', 'Credit'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`
                        py-2 text-[10px] font-black rounded-xl transition-all border
                        ${paymentMethod === method 
                          ? 'bg-brand text-white border-brand shadow-glow-red' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                        }
                      `}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Checkout Action button */}
            <button
              type="submit"
              disabled={checkoutLoading || cart.length === 0 || !phoneValid || !vehicleValid || !customer.name}
              className="w-full py-4 bg-brand hover:bg-brand-hover text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-glow-red hover:scale-[1.01] transition-all"
            >
              {checkoutLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Receipt size={16} />
                  <span>Generate GST Bill Receipt</span>
                </>
              )}
            </button>

          </form>
        </div>

      </div>

      {/* Completed Invoice PDF/Thermal Viewer Modal */}
      {isReceiptOpen && completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm overflow-y-auto p-4 no-print">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between max-h-[90vh]">
            
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <h2 className="font-extrabold text-sm flex items-center space-x-1.5">
                <Receipt size={16} className="text-brand" />
                <span>Invoice Viewer ({completedInvoice.invoiceNumber})</span>
              </h2>
              <button 
                onClick={() => setIsReceiptOpen(false)} 
                className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Printable Area */}
            <div id="invoice-print-area" className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/40 text-black dark:text-white dark:border-zinc-800/40">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-dashed border-zinc-300 dark:border-zinc-800">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-brand uppercase">CAR Battery ERP</h1>
                  <span className="text-[10px] text-zinc-400 font-bold block">PLOT 42, AUTOMOTIVE INDUSTRIAL STATE</span>
                  <span className="text-[10px] text-zinc-400 font-bold block">BANGALORE, KARNATAKA, INDIA</span>
                  <span className="text-[10px] text-zinc-400 font-bold block">GSTIN: 29AAACG0943R1ZS</span>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-extrabold uppercase">Tax Invoice</h2>
                  <span className="text-[10px] text-zinc-400 block font-bold">No: {completedInvoice.invoiceNumber}</span>
                  <span className="text-[10px] text-zinc-400 block font-bold">Date: {new Date(completedInvoice.createdAt).toISOString().split('T')[0]}</span>
                </div>
              </div>

              {/* Customer / Vehicle details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-[10px] border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <span className="text-zinc-400 font-extrabold uppercase tracking-wider block mb-1">Bill To:</span>
                  <span className="font-extrabold block">{completedInvoice.customerName}</span>
                  <span className="font-bold text-zinc-500 block">Phone: {completedInvoice.mobileNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 font-extrabold uppercase tracking-wider block mb-1">Vehicle Records:</span>
                  <span className="font-extrabold block">Reg No: {completedInvoice.vehicleNumber}</span>
                  <span className="font-bold text-zinc-500 block">Branch Code: {completedInvoice.branchId}</span>
                </div>
              </div>

              {/* Items List */}
              <table className="w-full text-left text-[10px] mb-6 border-collapse">
                <thead>
                  <tr className="bg-zinc-200/50 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800 text-zinc-500 font-extrabold uppercase">
                    <th className="p-2">Item Spec</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price (₹)</th>
                    <th className="p-2 text-right">GST (18%)</th>
                    <th className="p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {completedInvoice.items.map((item: any, idx: number) => (
                    <tr key={idx} className="font-bold">
                      <td className="p-2">
                        <span>{item.brand} - {item.model}</span>
                        <span className="text-[8px] text-zinc-400 block font-semibold">{item.productId}</span>
                      </td>
                      <td className="p-2 text-center">{item.qty}</td>
                      <td className="p-2 text-right">₹{item.price}</td>
                      <td className="p-2 text-right">₹{Math.round(item.gstAmount)}</td>
                      <td className="p-2 text-right">₹{Math.round(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary calculations */}
              <div className="w-56 ml-auto space-y-1.5 text-[10px] font-bold border-t border-zinc-200 dark:border-zinc-800 pt-4 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{completedInvoice.subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (CGST/SGST):</span>
                  <span>₹{completedInvoice.gstTotal.toLocaleString()}</span>
                </div>
                {completedInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discounts:</span>
                    <span>-₹{completedInvoice.discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm border-t border-zinc-300 dark:border-zinc-800 pt-2 text-brand">
                  <span>Grand Total:</span>
                  <span>₹{completedInvoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer Declaration & Mock QR Verification */}
              <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-6 text-[8px] text-zinc-400 font-bold uppercase">
                <div>
                  <span className="block mb-1">Declaration:</span>
                  <span className="block">Goods once sold cannot be returned.</span>
                  <span className="block">Thank you for your business!</span>
                </div>
                <div className="flex flex-col items-center">
                  <QrCode size={40} className="text-zinc-800 dark:text-zinc-300 mb-1" />
                  <span>GST QR Verify</span>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => sendMockNotification('whatsapp')}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Send size={12} />
                <span>WhatsApp Invoice</span>
              </button>
              <button
                onClick={() => sendMockNotification('email')}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Mail size={12} />
                <span>Email Invoice</span>
              </button>
              <button
                onClick={triggerPrint}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all"
              >
                <Printer size={12} />
                <span>Print / Thermal Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
