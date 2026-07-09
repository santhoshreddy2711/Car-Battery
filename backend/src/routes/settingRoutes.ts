import { Router, Response } from 'express';
import { Setting } from '../models/schemas.js';
import { protect, admin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// @desc    Get current system/shop settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      // Create default settings if empty
      settings = await Setting.create({
        shopName: 'CAR Battery Shop ERP',
        logoUrl: '',
        gstNumber: '22AAAAA0000A1Z5',
        address: '123 Battery Street, Automobile Hub, India',
        phone: '+91 98765 43210',
        email: 'info@carbattery.com',
        invoiceFormat: 'Standard GST Invoice',
        whatsappApiKey: 'waba_mock_key_982347923',
        smtpConfig: {
          host: 'smtp.carbattery.com',
          port: 587,
          user: 'smtp_user',
          pass: 'smtp_pass'
        },
        theme: 'red-light'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// @desc    Update system/shop settings
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, admin, async (req: AuthRequest, res) => {
  const { shopName, logoUrl, gstNumber, address, phone, email, invoiceFormat, whatsappApiKey, smtpConfig, theme } = req.body;

  try {
    let settings = await Setting.findOne({});
    if (!settings) {
      settings = await Setting.create({ shopName });
    }

    const updated = await Setting.findByIdAndUpdate(
      settings._id!,
      {
        shopName,
        logoUrl,
        gstNumber,
        address,
        phone,
        email,
        invoiceFormat,
        whatsappApiKey,
        smtpConfig,
        theme
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
