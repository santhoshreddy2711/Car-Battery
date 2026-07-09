import { isSupabaseActive, getSupabaseClient, getMockModel } from '../config/db.js';

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
  purchaseHistory: string[];
  serviceHistory: Array<{ date: string; description: string; cost: number }>;
  vehicleRecords: Array<{ vehicleNumber: string; model: string; lastServiceDate?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 3. PRODUCT (INVENTORY)
// ==========================================
export interface IProduct {
  _id?: string;
  productId: string;
  brand: string;
  model: string;
  vehicleType: string;
  capacity: number;
  warrantyPeriod: number;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  supplier: string;
  location: string;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

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

// ==========================================
// Unified Supabase & JSON Fallback Model Wrapper
// ==========================================
class SupabaseModelWrapper<T extends { _id?: string; createdAt?: string; updatedAt?: string }> {
  private tableName: string;
  private mockModelName: string;

  constructor(tableName: string, mockModelName: string) {
    this.tableName = tableName;
    this.mockModelName = mockModelName;
  }

  private get client() {
    return getSupabaseClient();
  }

  private get mock() {
    return getMockModel<T>(this.mockModelName);
  }

  private applyFilters(query: any, filter: any) {
    let q = query;
    for (const key of Object.keys(filter)) {
      const val = filter[key];
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && !Array.isArray(val)) {
          if (val.$gte !== undefined) q = q.gte(key, val.$gte);
          if (val.$lte !== undefined) q = q.lte(key, val.$lte);
          if (val.$regex !== undefined) q = q.ilike(key, `%${val.$regex}%`);
          if (val.$in !== undefined) q = q.in(key, val.$in);
        } else {
          // Map _id requests to id for queries in Postgres
          const mappedKey = key === '_id' ? 'id' : key;
          const isNumeric = mappedKey === 'id' && /^\d+$/.test(val);
          const parsedVal = isNumeric ? parseInt(val, 10) : val;
          q = q.eq(mappedKey, parsedVal);
        }
      }
    }
    return q;
  }

  async find(filter: any = {}) {
    if (isSupabaseActive()) {
      let query = this.client.from(this.tableName).select('*');
      query = this.applyFilters(query, filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        _id: item.id?.toString()
      })) as T[];
    } else {
      return await this.mock.find(filter);
    }
  }

  async findOne(filter: any = {}) {
    if (isSupabaseActive()) {
      let query = this.client.from(this.tableName).select('*');
      query = this.applyFilters(query, filter);
      const { data, error } = await query.limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, _id: data.id?.toString() } as T;
    } else {
      return await this.mock.findOne(filter);
    }
  }

  async findById(id: string) {
    if (isSupabaseActive()) {
      const isNumeric = /^\d+$/.test(id);
      const parsedId = isNumeric ? parseInt(id, 10) : id;
      const { data, error } = await this.client.from(this.tableName).select('*').eq('id', parsedId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, _id: data.id?.toString() } as T;
    } else {
      return await this.mock.findById(id);
    }
  }

  async create(doc: any) {
    if (isSupabaseActive()) {
      const cleanDoc = { ...doc };
      delete cleanDoc._id;
      delete cleanDoc.id;
      
      const { data, error } = await this.client.from(this.tableName).insert([cleanDoc]).select().single();
      if (error) throw error;
      return { ...data, _id: data.id?.toString() } as T;
    } else {
      return await this.mock.create(doc);
    }
  }

  async findByIdAndUpdate(id: string, update: any, options: any = {}) {
    if (isSupabaseActive()) {
      const isNumeric = /^\d+$/.test(id);
      const parsedId = isNumeric ? parseInt(id, 10) : id;
      const cleanUpdate = { ...update };
      delete cleanUpdate._id;
      delete cleanUpdate.id;
      
      const { data, error } = await this.client.from(this.tableName).update(cleanUpdate).eq('id', parsedId).select().maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, _id: data.id?.toString() } as T;
    } else {
      return await this.mock.findByIdAndUpdate(id, update, options);
    }
  }

  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    if (isSupabaseActive()) {
      const item = await this.findOne(filter);
      if (!item) {
        if (options.upsert) {
          return await this.create(update);
        }
        return null;
      }
      return await this.findByIdAndUpdate(item._id || '', update, options);
    } else {
      const item = await this.mock.findOne(filter);
      if (!item) {
        if (options.upsert) {
          return await this.mock.create(update);
        }
        return null;
      }
      return await this.mock.findByIdAndUpdate(item._id || '', update, options);
    }
  }

  async findByIdAndDelete(id: string) {
    if (isSupabaseActive()) {
      const isNumeric = /^\d+$/.test(id);
      const parsedId = isNumeric ? parseInt(id, 10) : id;
      const { data, error } = await this.client.from(this.tableName).delete().eq('id', parsedId).select().maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, _id: data.id?.toString() } as T;
    } else {
      return await this.mock.findByIdAndDelete(id);
    }
  }

  async countDocuments(filter: any = {}) {
    if (isSupabaseActive()) {
      let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });
      query = this.applyFilters(query, filter);
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } else {
      return await this.mock.countDocuments(filter);
    }
  }
}

// ==========================================
// Exports wrappers matching the original model names
// ==========================================
export const User = new SupabaseModelWrapper<IUser>('users', 'User');
export const Customer = new SupabaseModelWrapper<ICustomer>('customers', 'Customer');
export const Product = new SupabaseModelWrapper<IProduct>('products', 'Product');
export const Supplier = new SupabaseModelWrapper<ISupplier>('suppliers', 'Supplier');
export const Purchase = new SupabaseModelWrapper<IPurchase>('purchases', 'Purchase');
export const Invoice = new SupabaseModelWrapper<IInvoice>('invoices', 'Invoice');
export const WarrantyClaim = new SupabaseModelWrapper<IWarrantyClaim>('warranty_claims', 'WarrantyClaim');
export const Notification = new SupabaseModelWrapper<INotification>('notifications', 'Notification');
export const Setting = new SupabaseModelWrapper<ISetting>('settings', 'Setting');
export const Branch = new SupabaseModelWrapper<IBranch>('branches', 'Branch');
