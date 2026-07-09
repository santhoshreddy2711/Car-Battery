-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'Staff',
  "branchId" text NOT NULL DEFAULT 'main',
  "createdAt" timestamptz DEFAULT now()
);

-- Create Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id serial PRIMARY KEY,
  name text NOT NULL,
  location text,
  code text UNIQUE NOT NULL,
  "contactNumber" text,
  "createdAt" timestamptz DEFAULT now()
);

-- Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id serial PRIMARY KEY,
  "shopName" text NOT NULL,
  "logoUrl" text,
  "gstNumber" text,
  address text,
  phone text,
  email text,
  "invoiceFormat" text,
  theme text,
  "createdAt" timestamptz DEFAULT now()
);

-- Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  "productId" text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  "vehicleType" text,
  capacity integer,
  "warrantyPeriod" integer,
  "purchasePrice" numeric,
  "sellingPrice" numeric,
  quantity integer NOT NULL DEFAULT 0,
  supplier text,
  location text,
  "branchId" text DEFAULT 'main',
  "createdAt" timestamptz DEFAULT now()
);

-- Create Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  "contactPerson" text,
  mobile text,
  email text,
  "outstandingDues" numeric DEFAULT 0,
  ledger jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamptz DEFAULT now()
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  mobile text UNIQUE NOT NULL,
  email text,
  "vehicleNumber" text,
  "loyaltyPoints" integer DEFAULT 0,
  "purchaseHistory" jsonb DEFAULT '[]'::jsonb,
  "serviceHistory" jsonb DEFAULT '[]'::jsonb,
  "vehicleRecords" jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamptz DEFAULT now()
);

-- Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id serial PRIMARY KEY,
  "invoiceNumber" text UNIQUE NOT NULL,
  "customerName" text NOT NULL,
  "mobileNumber" text NOT NULL,
  "vehicleNumber" text,
  items jsonb NOT NULL,
  "subTotal" numeric NOT NULL,
  "gstTotal" numeric NOT NULL,
  "discountTotal" numeric DEFAULT 0,
  "totalAmount" numeric NOT NULL,
  "paymentMethod" text NOT NULL,
  "branchId" text NOT NULL DEFAULT 'main',
  status text NOT NULL DEFAULT 'Paid',
  "staffId" text,
  "createdAt" timestamptz DEFAULT now()
);

-- Create Warranty Claims Table
CREATE TABLE IF NOT EXISTS warranty_claims (
  id serial PRIMARY KEY,
  "claimNumber" text UNIQUE NOT NULL,
  "invoiceNumber" text NOT NULL,
  "customerName" text NOT NULL,
  "mobileNumber" text NOT NULL,
  "productId" text NOT NULL,
  brand text,
  model text,
  "serialNumber" text NOT NULL,
  "issueDescription" text,
  status text NOT NULL DEFAULT 'Pending',
  "claimDate" text,
  "resolvedDate" text,
  notes text,
  "createdAt" timestamptz DEFAULT now()
);

-- Create Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id serial PRIMARY KEY,
  "purchaseOrderNumber" text UNIQUE NOT NULL,
  "supplierId" text NOT NULL,
  "branchId" text NOT NULL DEFAULT 'main',
  items jsonb NOT NULL,
  "totalAmount" numeric NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  "receivedDate" text,
  "createdAt" timestamptz DEFAULT now()
);

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  "branchId" text DEFAULT 'all',
  "createdAt" timestamptz DEFAULT now()
);
