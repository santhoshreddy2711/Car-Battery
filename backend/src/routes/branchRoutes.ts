import { Router, Response } from 'express';
import { Branch, Product } from '../models/schemas.js';
import { protect, admin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const branches = await Branch.find({});
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Create a branch (Admin only)
// @route   POST /api/branches
// @access  Private/Admin
router.post('/', protect, admin, async (req: AuthRequest, res) => {
  const { name, location, code, contactNumber } = req.body;

  try {
    const exists = await Branch.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: 'Branch with this code already exists' });
    }

    const branch = await Branch.create({
      name,
      location,
      code,
      contactNumber
    });

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update branch (Admin only)
// @route   PUT /api/branches/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req: AuthRequest, res) => {
  const { name, location, code, contactNumber } = req.body;

  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const updated = await Branch.findByIdAndUpdate(
      req.params.id,
      { name, location, code, contactNumber },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Delete branch (Admin only)
// @route   DELETE /api/branches/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Branch removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Transfer stock between branches
// @route   POST /api/branches/transfer
// @access  Private
router.post('/transfer', protect, async (req: AuthRequest, res) => {
  const { fromBranchCode, toBranchCode, productId, qty } = req.body;
  const quantityToTransfer = Number(qty);

  if (!fromBranchCode || !toBranchCode || !productId || !quantityToTransfer || quantityToTransfer <= 0) {
    return res.status(400).json({ message: 'Invalid transfer details. fromBranchCode, toBranchCode, productId, and positive qty are required' });
  }

  try {
    // 1. Locate product in source branch
    const sourceProduct = await Product.findOne({ productId, branchId: fromBranchCode });
    if (!sourceProduct) {
      return res.status(404).json({ message: `Product ${productId} not found in source branch ${fromBranchCode}` });
    }

    if (sourceProduct.quantity < quantityToTransfer) {
      return res.status(400).json({ message: `Insufficient stock in source branch. Available: ${sourceProduct.quantity}, Requested: ${quantityToTransfer}` });
    }

    // 2. Deduct from source
    await Product.findByIdAndUpdate(sourceProduct._id!, { quantity: sourceProduct.quantity - quantityToTransfer });

    // 3. Add to destination branch
    const destProduct = await Product.findOne({ productId, branchId: toBranchCode });
    if (destProduct) {
      await Product.findByIdAndUpdate(destProduct._id!, { quantity: destProduct.quantity + quantityToTransfer });
    } else {
      // Create new inventory record in destination branch
      await Product.create({
        productId: sourceProduct.productId,
        brand: sourceProduct.brand,
        model: sourceProduct.model,
        vehicleType: sourceProduct.vehicleType,
        capacity: sourceProduct.capacity,
        warrantyPeriod: sourceProduct.warrantyPeriod,
        purchasePrice: sourceProduct.purchasePrice,
        sellingPrice: sourceProduct.sellingPrice,
        quantity: quantityToTransfer,
        supplier: sourceProduct.supplier || 'Branch Transfer',
        location: 'Branch Transfer Rack',
        branchId: toBranchCode
      });
    }

    res.json({ message: `Transferred ${quantityToTransfer} unit(s) of product ${productId} from ${fromBranchCode} to ${toBranchCode} successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error during branch transfer', error });
  }
});

export default router;
