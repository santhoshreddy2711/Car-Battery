import { Router, Response } from 'express';
import { Notification, Product } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get active notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  const branchId = req.user?.role === 'Admin' ? 'all' : (req.user?.branchId || 'main');
  const filter: any = {};
  if (branchId !== 'all') {
    filter.branchId = { $in: [branchId, 'all'] };
  }

  try {
    let list = await Notification.find(filter);
    // Sort by createdAt descending
    list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req: AuthRequest, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req: AuthRequest, res) => {
  const branchId = req.user?.role === 'Admin' ? 'all' : (req.user?.branchId || 'main');
  const filter: any = { read: false };
  if (branchId !== 'all') {
    filter.branchId = { $in: [branchId, 'all'] };
  }

  try {
    const unread = await Notification.find(filter);
    for (const item of unread) {
      await Notification.findByIdAndUpdate(item._id!, { read: true });
    }
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Scan inventory for low stock and generate notifications
// @route   POST /api/notifications/scan
// @access  Private
router.post('/scan', protect, async (req: AuthRequest, res) => {
  try {
    const products = await Product.find({});
    const lowStockAlerts = products.filter(p => p.quantity <= 5);
    let createdCount = 0;

    for (const prod of lowStockAlerts) {
      // Check if low stock notification already exists and is unread
      const existing = await Notification.findOne({
        type: 'LowStock',
        read: false,
        message: { $regex: prod.productId }
      });

      if (!existing) {
        await Notification.create({
          type: 'LowStock',
          title: 'Low Stock Alert',
          message: `Product ${prod.brand} ${prod.model} (SKU: ${prod.productId}) has low stock: ${prod.quantity} remaining.`,
          read: false,
          branchId: prod.branchId || 'main'
        });
        createdCount++;
      }
    }

    res.json({ message: 'Scan complete', alertsCreated: createdCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error during scan', error });
  }
});

export default router;
