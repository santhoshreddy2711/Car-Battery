import { Router, Response } from 'express';
import { Supplier } from '../models/schemas.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  const { search } = req.query;

  try {
    let suppliers = await Supplier.find({});

    if (search) {
      const searchStr = String(search).toLowerCase();
      suppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchStr) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchStr)) ||
        s.mobile.includes(searchStr)
      );
    }

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
router.post('/', protect, async (req: AuthRequest, res) => {
  const { name, contactPerson, mobile, email, outstandingDues } = req.body;

  try {
    const supplier = await Supplier.create({
      name,
      contactPerson,
      mobile,
      email,
      outstandingDues: Number(outstandingDues) || 0,
      ledger: outstandingDues > 0 ? [{
        date: new Date().toISOString().split('T')[0],
        description: 'Opening Balance',
        amount: Number(outstandingDues),
        type: 'credit'
      }] : []
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update supplier details
// @route   PUT /api/suppliers/:id
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res) => {
  const { name, contactPerson, mobile, email, outstandingDues } = req.body;

  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        name,
        contactPerson,
        mobile,
        email,
        outstandingDues: Number(outstandingDues) !== undefined ? Number(outstandingDues) : supplier.outstandingDues
      },
      { new: true }
    );

    res.json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Record a supplier payment/transaction in ledger
// @route   POST /api/suppliers/:id/ledger
// @access  Private
router.post('/:id/ledger', protect, async (req: AuthRequest, res) => {
  const { description, amount, type } = req.body; // type: credit (we owe more) / debit (we paid off)

  if (!description || !amount || !['credit', 'debit'].includes(type)) {
    return res.status(400).json({ message: 'description, amount, and type (credit/debit) are required' });
  }

  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const ledger = [...(supplier.ledger || [])];
    ledger.push({
      date: new Date().toISOString().split('T')[0],
      description,
      amount: Number(amount),
      type
    });

    // Update dues
    // Credit: we owe supplier more (+ amount)
    // Debit: we paid supplier (- amount)
    const dueChange = type === 'credit' ? Number(amount) : -Number(amount);
    const newDues = (supplier.outstandingDues || 0) + dueChange;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        outstandingDues: newDues,
        ledger
      },
      { new: true }
    );

    res.json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
