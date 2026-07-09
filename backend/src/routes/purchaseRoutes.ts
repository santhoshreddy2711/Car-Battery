import { Router, Response } from 'express';
import { Purchase, Product, Supplier } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get all purchase orders
// @route   GET /api/purchases
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  const { search, status } = req.query;
  const filter: any = {};

  if (status) {
    filter.status = status;
  }

  try {
    let purchases = await Purchase.find(filter);

    purchases.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search) {
      const searchStr = String(search).toLowerCase();
      purchases = purchases.filter(p =>
        p.purchaseOrderNumber.toLowerCase().includes(searchStr) ||
        p.supplierId.toLowerCase().includes(searchStr)
      );
    }

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Create a new purchase order (Pending status)
// @route   POST /api/purchases
// @access  Private
router.post('/', protect, async (req: AuthRequest, res) => {
  const { supplierId, items, branchId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items in the purchase order' });
  }

  try {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      let prodPrice = Number(item.purchasePrice);
      if (!prodPrice) {
        const product = await Product.findOne({ productId: item.productId });
        prodPrice = product ? product.purchasePrice : 0;
      }

      orderItems.push({
        productId: item.productId,
        qty: Number(item.qty),
        purchasePrice: prodPrice
      });

      totalAmount += (Number(item.qty) * prodPrice);
    }

    const count = await Purchase.countDocuments();
    const purchaseOrderNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const purchase = await Purchase.create({
      purchaseOrderNumber,
      supplierId,
      branchId: branchId || req.user?.branchId || 'main',
      items: orderItems,
      totalAmount,
      status: 'Pending'
    });

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Receive purchase order (Update inventory & supplier ledger)
// @route   PUT /api/purchases/:id/receive
// @access  Private
router.put('/:id/receive', protect, async (req: AuthRequest, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchase.status === 'Received') {
      return res.status(400).json({ message: 'Purchase order is already marked as Received' });
    }

    // 1. Add item quantities to inventory
    for (const item of purchase.items) {
      const product = await Product.findOne({ productId: item.productId });
      if (product) {
        const newQty = product.quantity + item.qty;
        await Product.findByIdAndUpdate(product._id!, {
          quantity: newQty,
          // Update cost price if changed
          purchasePrice: item.purchasePrice || product.purchasePrice
        });
      } else {
        // Create product if it doesn't exist yet in inventory
        await Product.create({
          productId: item.productId,
          brand: 'Generic',
          model: 'Imported',
          vehicleType: 'Car',
          capacity: 45,
          warrantyPeriod: 12,
          purchasePrice: item.purchasePrice,
          sellingPrice: Math.round(item.purchasePrice * 1.3), // default 30% margin
          quantity: item.qty,
          supplier: purchase.supplierId,
          location: 'Aisle A',
          branchId: purchase.branchId || 'main'
        });
      }
    }

    // 2. Update supplier outstanding dues & register transaction in ledger
    const supplier = await Supplier.findById(purchase.supplierId);
    if (supplier) {
      const ledger = [...(supplier.ledger || [])];
      ledger.push({
        date: new Date().toISOString().split('T')[0],
        description: `Goods Received - PO: ${purchase.purchaseOrderNumber}`,
        amount: purchase.totalAmount,
        type: 'credit' // we now owe them this amount
      });

      await Supplier.findByIdAndUpdate(supplier._id!, {
        outstandingDues: (supplier.outstandingDues || 0) + purchase.totalAmount,
        ledger
      });
    }

    // 3. Update PO status
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Received',
        receivedDate: new Date().toISOString().split('T')[0]
      },
      { new: true }
    );

    res.json(updatedPurchase);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
