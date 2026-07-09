import { Router, Response } from 'express';
import { Product, IProduct } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get all inventory products with filters
// @route   GET /api/inventory
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  const { search, brand, vehicleType, branchId } = req.query;
  const filter: any = {};

  if (branchId) {
    filter.branchId = branchId;
  } else if (req.user?.role !== 'Admin') {
    filter.branchId = req.user?.branchId || 'main';
  }

  if (brand) {
    filter.brand = brand;
  }
  if (vehicleType) {
    filter.vehicleType = vehicleType;
  }

  try {
    let products = await Product.find(filter);

    if (search) {
      const searchStr = String(search).toLowerCase();
      products = products.filter((p: IProduct) => 
        p.productId.toLowerCase().includes(searchStr) ||
        p.brand.toLowerCase().includes(searchStr) ||
        p.model.toLowerCase().includes(searchStr) ||
        p.vehicleType.toLowerCase().includes(searchStr) ||
        (p.supplier && p.supplier.toLowerCase().includes(searchStr))
      );
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get low stock alerts
// @route   GET /api/inventory/low-stock
// @access  Private
router.get('/low-stock', protect, async (req: AuthRequest, res) => {
  const branchId = req.user?.role === 'Admin' ? undefined : (req.user?.branchId || 'main');
  const filter: any = {};
  if (branchId) {
    filter.branchId = branchId;
  }

  try {
    const products = await Product.find(filter);
    const lowStockThreshold = 5; // Alert if stock is 5 or less
    const alertProducts = products.filter((p: IProduct) => p.quantity <= lowStockThreshold);
    res.json(alertProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get single product
// @route   GET /api/inventory/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      // Also try finding by custom productId (barcode)
      const prodByBarcode = await Product.findOne({ productId: req.params.id });
      if (!prodByBarcode) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(prodByBarcode);
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Create new product
// @route   POST /api/inventory
// @access  Private
router.post('/', protect, async (req: AuthRequest, res) => {
  const { productId, brand, model, vehicleType, capacity, warrantyPeriod, purchasePrice, sellingPrice, quantity, supplier, location, branchId } = req.body;

  try {
    const productExists = await Product.findOne({ productId });
    if (productExists) {
      return res.status(400).json({ message: 'Product ID/SKU already exists' });
    }

    const product = await Product.create({
      productId,
      brand,
      model,
      vehicleType,
      capacity: Number(capacity),
      warrantyPeriod: Number(warrantyPeriod),
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity) || 0,
      supplier,
      location,
      branchId: branchId || req.user?.branchId || 'main'
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update product
// @route   PUT /api/inventory/:id
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res) => {
  const { brand, model, vehicleType, capacity, warrantyPeriod, purchasePrice, sellingPrice, quantity, supplier, location, branchId } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        brand,
        model,
        vehicleType,
        capacity: Number(capacity),
        warrantyPeriod: Number(warrantyPeriod),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        quantity: Number(quantity),
        supplier,
        location,
        branchId: branchId || product.branchId
      },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Delete product
// @route   DELETE /api/inventory/:id
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Bulk Import products
// @route   POST /api/inventory/bulk-import
// @access  Private
router.post('/bulk-import', protect, async (req: AuthRequest, res) => {
  const { products } = req.body; // Array of product objects

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'Invalid products format or empty list' });
  }

  try {
    const importPromises = products.map(async (p: any) => {
      // Check if product with ID already exists, if so skip or update
      const existing = await Product.findOne({ productId: p.productId });
      if (existing) {
        return Product.findByIdAndUpdate(existing._id!, {
          quantity: existing.quantity + (Number(p.quantity) || 0),
          purchasePrice: Number(p.purchasePrice) || existing.purchasePrice,
          sellingPrice: Number(p.sellingPrice) || existing.sellingPrice
        });
      } else {
        return Product.create({
          productId: p.productId,
          brand: p.brand || 'Generic',
          model: p.model || 'Unknown',
          vehicleType: p.vehicleType || 'Car',
          capacity: Number(p.capacity) || 35,
          warrantyPeriod: Number(p.warrantyPeriod) || 12,
          purchasePrice: Number(p.purchasePrice) || 0,
          sellingPrice: Number(p.sellingPrice) || 0,
          quantity: Number(p.quantity) || 0,
          supplier: p.supplier || 'Imported',
          location: p.location || 'Aisle A',
          branchId: p.branchId || req.user?.branchId || 'main'
        });
      }
    });

    await Promise.all(importPromises);
    res.status(201).json({ message: 'Products imported/updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during bulk import', error });
  }
});

export default router;
