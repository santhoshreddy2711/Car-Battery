import { Schema } from 'mongoose';
import { getModel } from '../config/db.js';

// ==========================================
// 1. USER
// ==========================================
export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Staff';
  name: string;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Staff'], default: 'Staff' },
  name: { type: String, required: true },
  branchId: { type: String, default: 'main' }
}, { timestamps: true });

export const User = getModel<IUser>('User', UserSchema);

// ==========================================
// 2. CUSTOMER
// ==========================================
export interface ICustomer {
  _id?: string;
  name: string;
  mobile: string;
  email: string;
  vehicleNumber: string;
  loyaltyPoints: number;
  purchaseHistory: string[]; // Invoice IDs
  serviceHistory: Array<{ date: string; description: string; cost: number }>;
  vehicleRecords: Array<{ vehicleNumber: string; model: string; lastServiceDate?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  vehicleNumber: { type: String, required: true },
  loyaltyPoints: { type: Number, default: 0 },
  purchaseHistory: [{ type: String }],
  serviceHistory: [{
    date: { type: String },
    description: { type: String },
    cost: { type: Number }
  }],
  vehicleRecords: [{
    vehicleNumber: { type: String },
    model: { type: String },
    lastServiceDate: { type: String }
  }]
}, { timestamps: true });

export const Customer = getModel<ICustomer>('Customer', CustomerSchema);

// ==========================================
// 3. PRODUCT (INVENTORY)
// ==========================================
export interface IProduct {
  _id?: string;
  productId: string; // SKU or Barcode
  brand: string;
  model: string;
  vehicleType: string; // Car, SUV, Bike, Truck
  capacity: number; // Ah
  warrantyPeriod: number; // in months
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  supplier: string;
  location: string; // Aisle, Shelf, etc.
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

const ProductSchema = new Schema<IProduct>({
  productId: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  vehicleType: { type: String, required: true },
  capacity: { type: Number, required: true },
  warrantyPeriod: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  supplier: { type: String },
  location: { type: String },
  branchId: { type: String, default: 'main' }
}, { timestamps: true });

export const Product = getModel<IProduct>('Product', ProductSchema);

// ==========================================
// 4. SUPPLIER
// ==========================================
export interface ISupplier {
  _id?: string;
  name: string;
  contactPerson: string;
  mobile: string;
  email: string;
  outstandingDues: number;
  ledger: Array<{ date: string; description: string; amount: number; type: 'credit' | 'debit' }>;
  createdAt?: string;
  updatedAt?: string;
}

const SupplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true },
  contactPerson: { type: String },
  mobile: { type: String, required: true },
  email: { type: String },
  outstandingDues: { type: Number, default: 0 },
  ledger: [{
    date: { type: String },
    description: { type: String },
    amount: { type: Number },
    type: { type: String, enum: ['credit', 'debit'] }
  }]
}, { timestamps: true });

export const Supplier = getModel<ISupplier>('Supplier', SupplierSchema);

// ==========================================
// 5. PURCHASE
// ==========================================
export interface IPurchase {
  _id?: string;
  purchaseOrderNumber: string;
  supplierId: string;
  branchId: string;
  items: Array<{ productId: string; brand: string; model: string; qty: number; purchasePrice: number }>;
  totalAmount: number;
  status: 'Pending' | 'Received';
  receivedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PurchaseSchema = new Schema<IPurchase>({
  purchaseOrderNumber: { type: String, required: true },
  supplierId: { type: String, required: true },
  branchId: { type: String, default: 'main' },
  items: [{
    productId: { type: String, required: true },
    brand: { type: String },
    model: { type: String },
    qty: { type: Number, required: true },
    purchasePrice: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Received'], default: 'Pending' },
  receivedDate: { type: String }
}, { timestamps: true });

export const Purchase = getModel<IPurchase>('Purchase', PurchaseSchema);

// ==========================================
// 6. INVOICE (SALES)
// ==========================================
export interface IInvoiceItem {
  productId: string;
  brand: string;
  model: string;
  qty: number;
  price: number;
  gstAmount: number;
  discountAmount: number;
  total: number;
}

export interface IInvoice {
  _id?: string;
  invoiceNumber: string;
  customerName: string;
  mobileNumber: string;
  vehicleNumber: string;
  items: IInvoiceItem[];
  subTotal: number;
  gstTotal: number;
  discountTotal: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Credit';
  branchId: string;
  status: 'Paid' | 'Unpaid';
  staffId: string;
  createdAt?: string;
  updatedAt?: string;
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    brand: { type: String },
    model: { type: String },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  subTotal: { type: Number, required: true },
  gstTotal: { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Credit'], default: 'Cash' },
  branchId: { type: String, default: 'main' },
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid' },
  staffId: { type: String }
}, { timestamps: true });

export const Invoice = getModel<IInvoice>('Invoice', InvoiceSchema);

// ==========================================
// 7. WARRANTY CLAIM
// ==========================================
export interface IWarrantyClaim {
  _id?: string;
  claimNumber: string;
  invoiceNumber: string;
  customerName: string;
  mobileNumber: string;
  productId: string;
  brand: string;
  model: string;
  serialNumber: string;
  issueDescription: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  claimDate: string;
  resolvedDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const WarrantyClaimSchema = new Schema<IWarrantyClaim>({
  claimNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  productId: { type: String, required: true },
  brand: { type: String },
  model: { type: String },
  serialNumber: { type: String, required: true },
  issueDescription: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  claimDate: { type: String, required: true },
  resolvedDate: { type: String },
  notes: { type: String }
}, { timestamps: true });

export const WarrantyClaim = getModel<IWarrantyClaim>('WarrantyClaim', WarrantyClaimSchema);

// ==========================================
// 8. NOTIFICATION
// ==========================================
export interface INotification {
  _id?: string;
  type: 'LowStock' | 'WarrantyExpiry' | 'PendingPayment' | 'NewOrder' | 'Summary' | 'System';
  title: string;
  message: string;
  read: boolean;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

const NotificationSchema = new Schema<INotification>({
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  branchId: { type: String, default: 'all' }
}, { timestamps: true });

export const Notification = getModel<INotification>('Notification', NotificationSchema);

// ==========================================
// 9. SETTING
// ==========================================
export interface ISetting {
  _id?: string;
  shopName: string;
  logoUrl?: string;
  gstNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  invoiceFormat?: string;
  whatsappApiKey?: string;
  smtpConfig?: { host: string; port: number; user: string; pass: string };
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
}

const SettingSchema = new Schema<ISetting>({
  shopName: { type: String, required: true, default: 'CAR Battery ERP' },
  logoUrl: { type: String },
  gstNumber: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  invoiceFormat: { type: String, default: 'Standard GST' },
  whatsappApiKey: { type: String },
  smtpConfig: {
    host: { type: String },
    port: { type: Number },
    user: { type: String },
    pass: { type: String }
  },
  theme: { type: String, default: 'red-light' }
}, { timestamps: true });

export const Setting = getModel<ISetting>('Setting', SettingSchema);

// ==========================================
// 10. BRANCH
// ==========================================
export interface IBranch {
  _id?: string;
  name: string;
  location: string;
  code: string;
  contactNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

const BranchSchema = new Schema<IBranch>({
  name: { type: String, required: true },
  location: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true }
}, { timestamps: true });

export const Branch = getModel<IBranch>('Branch', BranchSchema);
