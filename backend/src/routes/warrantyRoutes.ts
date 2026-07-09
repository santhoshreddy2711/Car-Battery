import { Router, Response } from 'express';
import { WarrantyClaim, Invoice, Product } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get all warranty claims
// @route   GET /api/warranty
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  const { status, search } = req.query;
  const filter: any = {};

  if (status) {
    filter.status = status;
  }

  try {
    let claims = await WarrantyClaim.find(filter);

    claims.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search) {
      const searchStr = String(search).toLowerCase();
      claims = claims.filter(c =>
        c.claimNumber.toLowerCase().includes(searchStr) ||
        c.invoiceNumber.toLowerCase().includes(searchStr) ||
        c.customerName.toLowerCase().includes(searchStr) ||
        c.serialNumber.toLowerCase().includes(searchStr) ||
        c.mobileNumber.includes(searchStr)
      );
    }

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Check warranty status by invoice and product
// @route   GET /api/warranty/check-status
// @access  Private
router.get('/check-status', protect, async (req: AuthRequest, res) => {
  const { invoiceNumber, productId } = req.query;

  if (!invoiceNumber || !productId) {
    return res.status(400).json({ message: 'invoiceNumber and productId are required' });
  }

  try {
    const invoice = await Invoice.findOne({ invoiceNumber: String(invoiceNumber) });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found', active: false });
    }

    const item = invoice.items.find(i => i.productId === String(productId));
    if (!item) {
      return res.status(404).json({ message: 'Product not found in this invoice', active: false });
    }

    const product = await Product.findOne({ productId: String(productId) });
    const warrantyMonths = product ? product.warrantyPeriod : 12;

    const purchaseDate = new Date(invoice.createdAt || '');
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

    const now = new Date();
    const isActive = expiryDate > now;
    const monthsRemaining = Math.max(0, Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));

    res.json({
      invoiceNumber,
      purchaseDate: purchaseDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      warrantyPeriod: warrantyMonths,
      isActive,
      monthsRemaining,
      customerName: invoice.customerName,
      mobileNumber: invoice.mobileNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    File a new warranty claim
// @route   POST /api/warranty
// @access  Private
router.post('/', protect, async (req: AuthRequest, res) => {
  const { invoiceNumber, productId, serialNumber, issueDescription } = req.body;

  try {
    // 1. Verify invoice
    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) {
      return res.status(400).json({ message: 'Invoice number not found' });
    }

    // 2. Find product
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(400).json({ message: 'Product not found in inventory' });
    }

    // 3. Create unique Claim number
    const count = await WarrantyClaim.countDocuments();
    const claimNumber = `CLM-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const claim = await WarrantyClaim.create({
      claimNumber,
      invoiceNumber,
      customerName: invoice.customerName,
      mobileNumber: invoice.mobileNumber,
      productId,
      brand: product.brand,
      model: product.model,
      serialNumber,
      issueDescription,
      status: 'Pending',
      claimDate: new Date().toISOString().split('T')[0]
    });

    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update claim status (Approve/Reject)
// @route   PUT /api/warranty/:id/status
// @access  Private
router.put('/:id/status', protect, async (req: AuthRequest, res) => {
  const { status, notes } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected' });
  }

  try {
    const claim = await WarrantyClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const updatedClaim = await WarrantyClaim.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        resolvedDate: new Date().toISOString().split('T')[0]
      },
      { new: true }
    );

    // If claim is approved, we typically swap the battery (meaning we deduct another battery from inventory or flag it)
    if (status === 'Approved') {
      const product = await Product.findOne({ productId: claim.productId });
      if (product && product.quantity > 0) {
        // Automatically deduct 1 item for the replacement battery
        await Product.findByIdAndUpdate(product._id!, { quantity: product.quantity - 1 });
      }
    }

    res.json(updatedClaim);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
