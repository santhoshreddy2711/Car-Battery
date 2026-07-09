import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, getDbMode } from './config/db.js';
import { 
  User, 
  Product, 
  Customer, 
  Supplier, 
  Branch, 
  Setting, 
  Notification,
  Invoice,
  WarrantyClaim,
  Purchase
} from './models/schemas.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import warrantyRoutes from './routes/warrantyRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

let lastSeedingStatus = 'Not started';
let lastSeedingError: any = null;

// Simple Health Check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      status: 'Healthy',
      dbMode: getDbMode(),
      seedingStatus: lastSeedingStatus,
      seedingError: lastSeedingError,
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.json({
      status: 'Degraded',
      dbMode: getDbMode(),
      seedingStatus: lastSeedingStatus,
      seedingError: lastSeedingError,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Auto-Seeder Function
async function seedDefaultData() {
  lastSeedingStatus = 'Seeding started';
  try {
    // 1. Users Seed
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default Admin and Staff users...');
      const adminSalt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash('Admin@123', adminSalt);
      await User.create({
        name: 'System Admin',
        email: 'admin@carbattery.com',
        password: adminHash,
        role: 'Admin',
        branchId: 'main'
      });

      const staffSalt = await bcrypt.genSalt(10);
      const staffHash = await bcrypt.hash('Staff@123', staffSalt);
      await User.create({
        name: 'Billing Operator',
        email: 'staff@carbattery.com',
        password: staffHash,
        role: 'Staff',
        branchId: 'main'
      });
      console.log('Default credentials generated successfully.');
    }

    // 2. Branches Seed
    const branchCount = await Branch.countDocuments();
    if (branchCount === 0) {
      console.log('Seeding default branches...');
      await Branch.create({ name: 'Main HQ Branch', location: 'Downtown Hub', code: 'main', contactNumber: '011-2384920' });
      await Branch.create({ name: 'North Suburban Outlet', location: 'Metro Mall Plaza', code: 'sub-north', contactNumber: '011-9238402' });
    }

    // 3. Settings Seed
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
      console.log('Seeding default company configurations...');
      await Setting.create({
        shopName: 'CAR Battery HQ ERP',
        logoUrl: '',
        gstNumber: '29AAACG0943R1ZS',
        address: 'Plot 42, Automotive Ind Estate, Bangalore, India',
        phone: '+91 99000 88000',
        email: 'billing@carbatteryhq.com',
        invoiceFormat: 'Standard GST Invoice',
        theme: 'red-dark'
      });
    }

    // 4. Products / Inventory Seed
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Seeding initial battery products catalog...');
      await Product.create({
        productId: 'EXD-DIN65-RED',
        brand: 'Exide',
        model: 'Express DIN65 Red',
        vehicleType: 'Car',
        capacity: 65,
        warrantyPeriod: 36,
        purchasePrice: 4200,
        sellingPrice: 5800,
        quantity: 24,
        supplier: 'Exide Distributors Ltd',
        location: 'Aisle A, Shelf 2',
        branchId: 'main'
      });

      await Product.create({
        productId: 'AMR-FL-35AH',
        brand: 'Amaron',
        model: 'Flo 35Ah Black',
        vehicleType: 'Car',
        capacity: 35,
        warrantyPeriod: 48,
        purchasePrice: 2800,
        sellingPrice: 3800,
        quantity: 35,
        supplier: 'Amaron Power Systems',
        location: 'Aisle B, Shelf 1',
        branchId: 'main'
      });

      await Product.create({
        productId: 'SF-PRO-100AH',
        brand: 'SF Sonic',
        model: 'Pro-Truk 100Ah',
        vehicleType: 'Truck',
        capacity: 100,
        warrantyPeriod: 24,
        purchasePrice: 6500,
        sellingPrice: 8500,
        quantity: 4, // low stock alert trigger demo
        supplier: 'Sonic Power Corp',
        location: 'Aisle D, Floor 1',
        branchId: 'main'
      });

      await Product.create({
        productId: 'LUM-TX-150AH',
        brand: 'Luminous',
        model: 'Tubular TX150',
        vehicleType: 'Inverter',
        capacity: 150,
        warrantyPeriod: 60,
        purchasePrice: 8200,
        sellingPrice: 11500,
        quantity: 12,
        supplier: 'Luminous Dist Bangalore',
        location: 'Aisle C, Shelf 4',
        branchId: 'main'
      });
    }

    // 5. Suppliers Seed
    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      console.log('Seeding initial supplier lists...');
      await Supplier.create({
        name: 'Exide Distributors Ltd',
        contactPerson: 'Raman Prasad',
        mobile: '9845012345',
        email: 'raman@exidedistributors.com',
        outstandingDues: 25000,
        ledger: [
          { date: '2026-06-15', description: 'Initial bulk stock PO', amount: 50000, type: 'credit' },
          { date: '2026-06-28', description: 'Partial Bank Transfer', amount: 25000, type: 'debit' }
        ]
      });

      await Supplier.create({
        name: 'Amaron Power Systems',
        contactPerson: 'Vikram Seth',
        mobile: '9986054321',
        email: 'vikram@amaronpowersystems.com',
        outstandingDues: 0,
        ledger: []
      });
    }

    // 6. Customers Seed
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      console.log('Seeding sample loyal customers...');
      await Customer.create({
        name: 'Rajesh Kumar',
        mobile: '9880011223',
        email: 'rajesh@gmail.com',
        vehicleNumber: 'KA-01-MJ-4321',
        loyaltyPoints: 38,
        purchaseHistory: [],
        serviceHistory: [
          { date: '2026-05-10', description: 'Battery inspection & top up', cost: 350 },
          { date: '2026-06-01', description: 'New Amaron 35Ah Purchase', cost: 3800 }
        ],
        vehicleRecords: [
          { vehicleNumber: 'KA-01-MJ-4321', model: 'Maruti Suzuki Swift', lastServiceDate: '2026-06-01' }
        ]
      });

      await Customer.create({
        name: 'Sunil Gupta',
        mobile: '9845099887',
        email: 'sunil@gupta.com',
        vehicleNumber: 'KA-03-NP-9988',
        loyaltyPoints: 116,
        purchaseHistory: [],
        serviceHistory: [
          { date: '2026-06-12', description: 'Exide DIN65 Installation', cost: 11600 }
        ],
        vehicleRecords: [
          { vehicleNumber: 'KA-03-NP-9988', model: 'Toyota Fortuner', lastServiceDate: '2026-06-12' }
        ]
      });

      await Customer.create({
        name: 'Ravi Shankar',
        mobile: '9845011223',
        email: 'ravi@shankar.com',
        vehicleNumber: 'Inverter-Home',
        loyaltyPoints: 115,
        purchaseHistory: [],
        serviceHistory: [
          { date: '2026-06-25', description: 'Luminous Inverter Battery Install', cost: 11500 }
        ],
        vehicleRecords: [
          { vehicleNumber: 'Inverter-Home', model: 'Inverter Backup System', lastServiceDate: '2026-06-25' }
        ]
      });
    }

    // 7. System Invoices Seed
    const invoiceCount = await Invoice.countDocuments();
    if (invoiceCount === 0) {
      console.log('Seeding sample historical sales invoices...');
      await Invoice.create({
        invoiceNumber: 'INV-2026-00001',
        customerName: 'Rajesh Kumar',
        mobileNumber: '9880011223',
        vehicleNumber: 'KA-01-MJ-4321',
        items: [{
          productId: 'AMR-FL-35AH',
          brand: 'Amaron',
          model: 'Flo 35Ah Black',
          qty: 1,
          price: 3800,
          gstAmount: 579,
          discountAmount: 0,
          total: 3800
        }],
        subTotal: 3221,
        gstTotal: 579,
        discountTotal: 0,
        totalAmount: 3800,
        paymentMethod: 'UPI',
        branchId: 'main',
        status: 'Paid',
        staffId: 'admin',
        createdAt: new Date('2026-06-01T10:30:00Z').toISOString()
      } as any);

      await Invoice.create({
        invoiceNumber: 'INV-2026-00002',
        customerName: 'Sunil Gupta',
        mobileNumber: '9845099887',
        vehicleNumber: 'KA-03-NP-9988',
        items: [{
          productId: 'EXD-DIN65-RED',
          brand: 'Exide',
          model: 'Express DIN65 Red',
          qty: 2,
          price: 5800,
          gstAmount: 1769,
          discountAmount: 0,
          total: 11600
        }],
        subTotal: 9831,
        gstTotal: 1769,
        discountTotal: 0,
        totalAmount: 11600,
        paymentMethod: 'Card',
        branchId: 'main',
        status: 'Paid',
        staffId: 'admin',
        createdAt: new Date('2026-06-12T14:45:00Z').toISOString()
      } as any);

      await Invoice.create({
        invoiceNumber: 'INV-2026-00003',
        customerName: 'Ravi Shankar',
        mobileNumber: '9845011223',
        vehicleNumber: 'Inverter-Home',
        items: [{
          productId: 'LUM-TX-150AH',
          brand: 'Luminous',
          model: 'Tubular TX150',
          qty: 1,
          price: 11500,
          gstAmount: 1754,
          discountAmount: 0,
          total: 11500
        }],
        subTotal: 9746,
        gstTotal: 1754,
        discountTotal: 0,
        totalAmount: 11500,
        paymentMethod: 'Cash',
        branchId: 'main',
        status: 'Paid',
        staffId: 'admin',
        createdAt: new Date('2026-06-25T11:15:00Z').toISOString()
      } as any);

      await Invoice.create({
        invoiceNumber: 'INV-2026-00004',
        customerName: 'Ramesh Naidu',
        mobileNumber: '9880099881',
        vehicleNumber: 'KA-05-AA-7788',
        items: [{
          productId: 'AMR-FL-35AH',
          brand: 'Amaron',
          model: 'Flo 35Ah Black',
          qty: 1,
          price: 3800,
          gstAmount: 579,
          discountAmount: 0,
          total: 3800
        }],
        subTotal: 3221,
        gstTotal: 579,
        discountTotal: 0,
        totalAmount: 3800,
        paymentMethod: 'UPI',
        branchId: 'main',
        status: 'Paid',
        staffId: 'staff',
        createdAt: new Date('2026-07-02T16:20:00Z').toISOString()
      } as any);

      await Invoice.create({
        invoiceNumber: 'INV-2026-00005',
        customerName: 'Tata Transport Service',
        mobileNumber: '9900011223',
        vehicleNumber: 'KA-02-ZZ-5544',
        items: [{
          productId: 'SF-PRO-100AH',
          brand: 'SF Sonic',
          model: 'Pro-Truk 100Ah',
          qty: 1,
          price: 8500,
          gstAmount: 1296,
          discountAmount: 0,
          total: 8500
        }],
        subTotal: 7204,
        gstTotal: 1296,
        discountTotal: 0,
        totalAmount: 8500,
        paymentMethod: 'Credit',
        branchId: 'main',
        status: 'Paid',
        staffId: 'staff',
        createdAt: new Date('2026-07-06T09:00:00Z').toISOString()
      } as any);
    }

    // 8. System Purchases Seed
    const purchaseCount = await Purchase.countDocuments();
    if (purchaseCount === 0) {
      console.log('Seeding sample purchase orders...');
      await Purchase.create({
        purchaseOrderNumber: 'PO-2026-00001',
        supplierId: 'Exide Distributors Ltd',
        branchId: 'main',
        items: [{
          productId: 'EXD-DIN65-RED',
          brand: 'Exide',
          model: 'Express DIN65 Red',
          qty: 10,
          purchasePrice: 4200
        }],
        totalAmount: 42000,
        status: 'Received',
        receivedDate: '2026-06-10',
        createdAt: new Date('2026-06-08T10:00:00Z').toISOString()
      } as any);

      await Purchase.create({
        purchaseOrderNumber: 'PO-2026-00002',
        supplierId: 'Amaron Power Systems',
        branchId: 'main',
        items: [{
          productId: 'AMR-FL-35AH',
          brand: 'Amaron',
          model: 'Flo 35Ah Black',
          qty: 20,
          purchasePrice: 2800
        }],
        totalAmount: 56000,
        status: 'Received',
        receivedDate: '2026-06-25',
        createdAt: new Date('2026-06-23T11:00:00Z').toISOString()
      } as any);

      await Purchase.create({
        purchaseOrderNumber: 'PO-2026-00003',
        supplierId: 'Exide Distributors Ltd',
        branchId: 'main',
        items: [{
          productId: 'SF-PRO-100AH',
          brand: 'SF Sonic',
          model: 'Pro-Truk 100Ah',
          qty: 5,
          purchasePrice: 6500
        }],
        totalAmount: 32500,
        status: 'Pending',
        createdAt: new Date('2026-07-08T15:30:00Z').toISOString()
      } as any);
    }

    // 9. Warranty Claims Seed
    const claimsCount = await WarrantyClaim.countDocuments();
    if (claimsCount === 0) {
      console.log('Seeding sample warranty claims...');
      await WarrantyClaim.create({
        claimNumber: 'CLM-2026-00001',
        invoiceNumber: 'INV-2026-00001',
        customerName: 'Rajesh Kumar',
        mobileNumber: '9880011223',
        productId: 'AMR-FL-35AH',
        brand: 'Amaron',
        model: 'Flo 35Ah Black',
        serialNumber: 'AMR-984213-X9',
        issueDescription: 'Battery voltage drops under load, engine cranking struggles',
        status: 'Pending',
        claimDate: '2026-07-08'
      } as any);

      await WarrantyClaim.create({
        claimNumber: 'CLM-2026-00002',
        invoiceNumber: 'INV-2026-00002',
        customerName: 'Sunil Gupta',
        mobileNumber: '9845099887',
        productId: 'EXD-DIN65-RED',
        brand: 'Exide',
        model: 'Express DIN65 Red',
        serialNumber: 'EXD-22001-A4',
        issueDescription: 'Dead cell detected, battery fails to accept charge',
        status: 'Approved',
        claimDate: '2026-06-20',
        resolvedDate: '2026-06-21',
        notes: 'Swapped battery casing under warranty. Dispatched replacement SKU EXD-DIN65-RED.'
      } as any);

      await WarrantyClaim.create({
        claimNumber: 'CLM-2026-00003',
        invoiceNumber: 'INV-2026-00003',
        customerName: 'Ravi Shankar',
        mobileNumber: '9845011223',
        productId: 'LUM-TX-150AH',
        brand: 'Luminous',
        model: 'Tubular TX150',
        serialNumber: 'LUM-0021-Z3',
        issueDescription: 'Battery bulging outward, bad backup time',
        status: 'Rejected',
        claimDate: '2026-06-29',
        resolvedDate: '2026-06-30',
        notes: 'Bulge caused by massive external overcurrent from client faulty charging inverter. Voided warranty terms.'
      } as any);
    }

    // 10. System Notifications Seed
    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      console.log('Seeding first alert center messages...');
      await Notification.create({
        type: 'LowStock',
        title: 'Critical Inventory Alert',
        message: 'Product SF Sonic Pro-Truk 100Ah (SKU: SF-PRO-100AH) has dropped below safety limits. Remaining: 4 units.',
        read: false,
        branchId: 'main'
      });

      await Notification.create({
        type: 'System',
        title: 'ERP Setup Completed',
        message: 'CAR Battery shop billing database system successfully configured and backed up.',
        read: false,
        branchId: 'all'
      });
    }
    lastSeedingStatus = 'Completed successfully';
  } catch (error: any) {
    lastSeedingStatus = 'Failed';
    lastSeedingError = { message: error.message, stack: error.stack, details: error };
    console.error('Data seeding failed:', error);
  }
}

// Start Server after connecting to Database
async function startServer() {
  await connectDB();
  await seedDefaultData();

  app.listen(PORT, () => {
    console.log(`CAR Battery ERP server is running on http://localhost:${PORT}`);
    console.log(`Active Database Mode: ${getDbMode()}`);
  });
}

startServer();
