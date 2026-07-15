import { Router, Response } from 'express';
import { Customer } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get all customers with optional search
// @route   GET /api/customers
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  const { search, branchId } = req.query;
  const filter: any = {};

  if (branchId) {
    if (branchId !== 'all') {
      filter.branchId = branchId;
    }
  } else if (req.user?.role !== 'Admin') {
    filter.branchId = req.user?.branchId || 'main';
  }

  try {
    let customers = await Customer.find(filter);

    if (search) {
      const searchStr = String(search).toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(searchStr) ||
        c.mobile.includes(searchStr) ||
        (c.email && c.email.toLowerCase().includes(searchStr)) ||
        c.vehicleNumber.toLowerCase().includes(searchStr)
      );
    }

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get top customers by loyalty points
// @route   GET /api/customers/ranking/loyalty
// @access  Private
router.get('/ranking/loyalty', protect, async (req: AuthRequest, res) => {
  try {
    const customers = await Customer.find({});
    // Sort descending by loyalty points
    customers.sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0));
    res.json(customers.slice(0, 10)); // return top 10
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      // Try by phone
      const custByPhone = await Customer.findOne({ mobile: req.params.id });
      if (!custByPhone) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      return res.json(custByPhone);
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Create a customer profile
// @route   POST /api/customers
// @access  Private
router.post('/', protect, async (req: AuthRequest, res) => {
  const { name, mobile, email, vehicleNumber, branchId } = req.body;

  try {
    const exists = await Customer.findOne({ mobile });
    if (exists) {
      return res.status(400).json({ message: 'Customer with this mobile already exists' });
    }

    const customer = await Customer.create({
      name,
      mobile,
      email: email || '',
      vehicleNumber,
      loyaltyPoints: 0,
      purchaseHistory: [],
      serviceHistory: [],
      vehicleRecords: [{ vehicleNumber, model: 'Not Specified' }],
      branchId: branchId || req.user?.branchId || 'main'
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update customer profile
// @route   PUT /api/customers/:id
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res) => {
  const { name, mobile, email, vehicleNumber, loyaltyPoints } = req.body;

  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        mobile,
        email,
        vehicleNumber,
        loyaltyPoints: Number(loyaltyPoints) || customer.loyaltyPoints
      },
      { new: true }
    );

    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer profile deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Add service log to customer
// @route   POST /api/customers/:id/service
// @access  Private
router.post('/:id/service', protect, async (req: AuthRequest, res) => {
  const { description, cost, vehicleNumber } = req.body;

  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const serviceHistory = [...(customer.serviceHistory || [])];
    serviceHistory.push({
      date: new Date().toISOString().split('T')[0],
      description,
      cost: Number(cost) || 0
    });

    const vehicleRecords = [...(customer.vehicleRecords || [])];
    const vIndex = vehicleRecords.findIndex(v => v.vehicleNumber === vehicleNumber);
    if (vIndex !== -1) {
      vehicleRecords[vIndex].lastServiceDate = new Date().toISOString().split('T')[0];
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        serviceHistory,
        vehicleRecords
      },
      { new: true }
    );

    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
