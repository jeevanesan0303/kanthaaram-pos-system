export type UserRole =
  | 'Admin'
  | 'Cashier'
  | 'Manager'
  | 'Delivery Boy'
  | 'Tea Master'
  | 'Worker';

export type EmployeeUserType = 'Normal' | 'POS Access';

export interface Employee {
  id: string;

  // Supabase Auth user ID. Normal staff will not have this.
  authUserId?: string;

  userType: EmployeeUserType;

  name: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;

  // Keep only if you separately use a four-digit POS PIN.
  // Never place the account password here.
  pin: string;

  photo: string;
  salary: number;

  dateOfBirth?: string;

  gender?: 'Male' | 'Female' | 'Other';
  workingType?: 'Full-time' | 'Part-time';

  attendance: string;
  status: 'Active' | 'Inactive';
  permissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeInput {
  userType: EmployeeUserType;
  name: string;
  email?: string;
  password?: string;
  phone: string;
  role: UserRole;
  photo?: string;
  salary?: number;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  workingType: 'Full-time' | 'Part-time';
  permissions?: string[];
}

export interface CreateEmployeeResult {
  employee: Employee;
  emailSent: boolean;
  emailWarning?: string;
}

export interface UpdateEmployeeInput {
  name: string;
  email?: string;
  newPassword?: string;
  phone: string;
  role: UserRole;
  photo?: string;
  salary?: number;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  workingType: 'Full-time' | 'Part-time';
  permissions?: string[];
  status: 'Active' | 'Inactive';
}

export interface UpdateEmployeeResult {
  employee: Employee;
  emailSent: boolean;
  emailWarning?: string;
}

export interface UpdateEmployeePermissionsResult {
  employee: Employee;
}

export interface SetEmployeeStatusResult {
  employee: Employee;
}
export interface DashboardMetrics {
  todaySales: number;
  yesterdaySales: number;
  salesChangePercentage: number;
  todayOrderCount: number;
  newCustomerCount: number;
  activeOfferCount: number;
}

export interface DashboardActiveOffer {
  id: string;
  name: string;
  type: 'Percentage' | 'Flat';
  discount: number;
  productName?: string;
  startDate: string;
  endDate: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  activeOffers: DashboardActiveOffer[];
  generatedAt: string;
} 

export interface Customer {
  id: string;

  photo?: string;

  name: string;
  mobile: string;
  email: string;
  dob: string;
  gender?: string;
  address: string;

  walletBalance: number;
  totalOrders: number;
  totalSpent: number;

  status:
  | 'Active'
  | 'Inactive';

  notes?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productsCount: number;
  status: 'Active' | 'Inactive';
  iconName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // selling price
  purchasePrice: number;
  stock: number;
  lowStockAlert: number;
  image: string;
  barcode: string;
  sku: string;
  description?: string;
  tax: number; // percentage e.g. 5
  supplier?: string;
  unit: string; // e.g. Cup, Piece, Pack
  expiryDate?: string;
  status: 'Active' | 'Inactive';
  isStockItem?: boolean;
  createdAt?: string;
  categoryId?: string;
  updatedAt?: string;
}
// =========================================================
// SEPARATE INVENTORY TYPES
// Not connected to Product
// =========================================================

export type InventoryStatus =
  | 'Active'
  | 'Inactive';

export type InventoryMovementType =
  | 'Stock In'
  | 'Stock Out';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  lowStockAlert: number;
  unit: string;
  sku?: string;
  price: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId?: string;
  itemName: string;
  movementType: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  performedBy?: string;
  performedByName: string;
  createdAt: string;
}

export interface CreateInventoryItemInput {
  name: string;
  category: string;
  stock: number;
  lowStockAlert: number;
  unit: string;
  sku?: string;
  price: number;
  status?: InventoryStatus;
}

export interface UpdateInventoryItemInput {
  name?: string;
  category?: string;
  lowStockAlert?: number;
  unit?: string;
  sku?: string;
  price?: number;
  status?: InventoryStatus;
}

export interface CreateOrderInput {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  discount: number;
  taxPercentage: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'Paid' | 'Pending';
  notes?: string;
}

export interface UpdateOrderInput {
  customerName: string;
  customerPhone?: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  notes?: string;
}

export type OrderStatus =
  | 'Completed'
  | 'Preparing'
  | 'Ready'
  | 'On the way'
  | 'Cancelled';

export type OrderPaymentStatus = 'Paid' | 'Pending' | 'Refunded';

export interface ComboDealItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface ComboOffer {
  id: string;
  name: string;
  productsIncluded: string[];
  productItems?: ComboDealItem[];
  discount: number;
  price: number;
  image: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive';
}

export interface Offer {
  id: string;
  name: string;
  type: 'Percentage' | 'Flat';
  discount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive';
  categoryId?: string;
  categoryName?: string;
  productId?: string;
  productName?: string;
}

export type SupplierPaymentType =
  | 'Paid'
  | 'Bank Transfer'
  | 'Pending';



export interface Supplier {
  id: string;

  companyName: string;
  owner: string;
  phone: string;
  email: string;
  address: string;

  products: string;
  quantitySupplied: string;

  buyingPrice: number;
 
  paymentType: SupplierPaymentType;
  

  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  companyName: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  products: string;
  quantitySupplied: string;
  buyingPrice: number;
 
  paymentType: SupplierPaymentType;
  
}

export type UpdateSupplierInput =
  Partial<CreateSupplierInput>;

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
  receiptImage?: string;
  addedBy: string;
  addedById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateExpenseInput {
  category: string;
  amount: number;
  date: string;
  notes?: string;
  receiptImage?: string;
  addedBy: string;
}

export interface UpdateExpenseInput {
  category: string;
  amount: number;
  date: string;
  notes?: string;
  receiptImage?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
  notes?: string;
}

export type OrderType =
  | 'Takeaway'
  | 'Dine In';


export type PaymentMethod =
  | 'Cash'
  | 'Card'
  | 'QR'
  | 'Bank Transfer'
  | 'Split Payment'
  | 'Credit Customer'
  | 'Gift Card';

export type PaymentStatus =
  | 'Paid'
  | 'Pending'
  | 'Refunded';

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  time: string;
  date: string;
  createdAt: string;
  cashierName: string;
  notes?: string;
  qrCodeUrl?: string;
}


export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  banner: string;
  currency: string;
  taxPercentage: number;
  defaultDiscount: number;
  receiptFooter: string;
  enableNotifications: boolean;
  lowStockThreshold: number;
  printerName: string;
  autoPrintReceipt: boolean;
  showLogoOnReceipt?: boolean;
  showAddressOnReceipt?: boolean;
  showPointsOnReceipt?: boolean;
  showQrCodeOnReceipt?: boolean;
  showCashierOnReceipt?: boolean;
  showCustomerOnReceipt?: boolean;
  showNotesOnReceipt?: boolean;
  showPaymentMethodOnReceipt?: boolean;
  showTaxBreakdownOnReceipt?: boolean;
  receiptPaperWidth?: '80mm' | '58mm';
  receiptFontSize?: 'Compact' | 'Standard' | 'Comfortable';
  receiptHeaderTitle?: string;
  receiptHeaderTagline?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'customer' | 'employee' | 'system';
  time: string;
  read: boolean;
}

export type ActiveView =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'deactivatedOrders'
  | 'customers'
  | 'products'
  | 'categories'
  | 'offers'
  | 'suppliers'
  | 'employees'
  | 'reports'
  | 'expenses'
  | 'settings'
  | 'inventory'
  | 'salary';

export interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CreateSalaryInput {
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface UpdateSalaryInput {
  amount: number;
  date: string;
  notes?: string;
}

export interface HeldOrder {
  id: string;
  customer: Customer | null;
  items: OrderItem[];
  discount: number;
  orderType: OrderType;
  time: string;
  date: string;
  notes?: string;
}