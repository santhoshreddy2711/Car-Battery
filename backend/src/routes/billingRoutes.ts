import { Router, Response } from 'express';
import { Invoice, Product, Customer } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get invoice history with filters
// @route   GET /api/billing
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  const { search, branchId, status } = req.query;
  const filter: any = {};

  if (branchId) {
    if (branchId !== 'all') {
      filter.branchId = branchId;
    }
  } else if (req.user?.role !== 'Admin') {
    filter.branchId = req.user?.branchId || 'main';
  }

  if (status) {
    filter.status = status;
  }

  try {
    let invoices = await Invoice.find(filter);

    // Sort by createdAt descending
    invoices.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search) {
      const searchStr = String(search).toLowerCase();
      invoices = invoices.filter((inv: any) =>
        inv.invoiceNumber.toLowerCase().includes(searchStr) ||
        inv.customerName.toLowerCase().includes(searchStr) ||
        inv.mobileNumber.toLowerCase().includes(searchStr) ||
        inv.vehicleNumber.toLowerCase().includes(searchStr)
      );
    }

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get single invoice
// @route   GET /api/billing/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      // Try searching by invoiceNumber
      const invByNum = await Invoice.findOne({ invoiceNumber: req.params.id });
      if (!invByNum) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      return res.json(invByNum);
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Create new invoice
// @route   POST /api/billing
// @access  Private
router.post('/', protect, async (req: AuthRequest, res) => {
  const {
    customerName,
    mobileNumber,
    vehicleNumber,
    items, // Array of { productId, qty, price, gstRate, discount }
    paymentMethod,
    status
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items in the invoice' });
  }

  try {
    let subTotal = 0;
    let gstTotal = 0;
    let discountTotal = 0;
    let totalAmount = 0;
    const processedItems: any[] = [];

    // 1. Process items and update stock
    for (const item of items) {
      const product = await Product.findOne({ productId: item.productId });
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found in inventory` });
      }

      if (product.quantity < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.brand} ${product.model}. Available: ${product.quantity}` });
      }

      // Deduct stock
      const newQty = product.quantity - item.qty;
      await Product.findByIdAndUpdate(product._id!, { quantity: newQty });

      // Financials for this item
      const itemPrice = Number(item.price) || product.sellingPrice;
      const itemDiscount = Number(item.discount) || 0;
      const basePrice = itemPrice - itemDiscount;

      // GST is standard 18% for car batteries in India (or custom)
      const gstRate = Number(item.gstRate) || 18; 
      const gstAmount = (basePrice * (gstRate / 100)) * item.qty;
      const itemSubtotal = basePrice * item.qty;
      const itemTotal = itemSubtotal + gstAmount;

      processedItems.push({
        productId: product.productId,
        brand: product.brand,
        model: product.model,
        qty: item.qty,
        price: itemPrice,
        gstAmount,
        discountAmount: itemDiscount * item.qty,
        total: itemTotal
      });

      subTotal += itemSubtotal;
      gstTotal += gstAmount;
      discountTotal += (itemDiscount * item.qty);
      totalAmount += itemTotal;
    }

    // Round total amount
    totalAmount = Math.round(totalAmount);

    // 2. Generate unique Invoice Number
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    // 3. Create Invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      mobileNumber,
      vehicleNumber,
      items: processedItems,
      subTotal,
      gstTotal,
      discountTotal,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash',
      branchId: req.body.branchId || req.user?.branchId || 'main',
      status: status || 'Paid',
      staffId: req.user?._id || 'admin'
    });

    // 4. Update / Create Customer profile & loyalty points
    // Calculate loyalty points: 1 point for every 100 Rs spent
    const newPoints = Math.floor(totalAmount / 100);

    const existingCustomer = await Customer.findOne({ mobile: mobileNumber });

    if (existingCustomer) {
      const updatedHistory = [...(existingCustomer.purchaseHistory || [])];
      updatedHistory.push(invoice._id!);

      const updatedVehicles = [...(existingCustomer.vehicleRecords || [])];
      if (!updatedVehicles.some(v => v.vehicleNumber === vehicleNumber)) {
        updatedVehicles.push({
          vehicleNumber,
          model: processedItems[0]?.brand + ' ' + processedItems[0]?.model,
          lastServiceDate: new Date().toISOString().split('T')[0]
        });
      }

      await Customer.findByIdAndUpdate(existingCustomer._id!, {
        loyaltyPoints: (existingCustomer.loyaltyPoints || 0) + newPoints,
        purchaseHistory: updatedHistory,
        vehicleRecords: updatedVehicles,
        $push: {
          serviceHistory: {
            date: new Date().toISOString().split('T')[0],
            description: `Battery Purchase & Installation - ${invoiceNumber}`,
            cost: totalAmount
          }
        } as any
      });
    } else {
      // Create new customer
      await Customer.create({
        name: customerName,
        mobile: mobileNumber,
        email: '',
        vehicleNumber,
        loyaltyPoints: newPoints,
        purchaseHistory: [invoice._id!],
        serviceHistory: [{
          date: new Date().toISOString().split('T')[0],
          description: `First Battery Purchase - ${invoiceNumber}`,
          cost: totalAmount
        }],
        vehicleRecords: [{
          vehicleNumber,
          model: processedItems[0]?.brand + ' ' + processedItems[0]?.model,
          lastServiceDate: new Date().toISOString().split('T')[0]
        }],
        branchId: invoice.branchId
      });
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update invoice payment status
// @route   PUT /api/billing/:id/status
// @access  Private
router.put('/:id/status', protect, async (req: AuthRequest, res) => {
  const { status } = req.body;
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
