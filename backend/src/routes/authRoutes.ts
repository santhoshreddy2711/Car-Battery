import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/schemas.js';
import { protect, admin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'carbattery-super-secret-key-123';

function generateToken(id: string) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
}

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password || ''))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        token: generateToken(user._id!)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Change user password
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', protect, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user?._id!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id!, { password: hashedPassword });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      branchId: req.user.branchId
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req: AuthRequest, res) => {
  try {
    const users = await User.find({});
    // Remove passwords before sending
    const sanitizedUsers = users.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Create a new user (Admin only)
// @route   POST /api/auth/users
// @access  Private/Admin
router.post('/users', protect, admin, async (req: AuthRequest, res) => {
  const { name, email, password, role, branchId } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      branchId: branchId || 'main'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update a user (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, admin, async (req: AuthRequest, res) => {
  const { name, email, role, branchId, password } = req.body;

  try {
    const updateData: any = { name, email, role, branchId };

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      branchId: updatedUser.branchId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Delete a user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req: AuthRequest, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
