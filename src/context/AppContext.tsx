import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  Customer,
  Category,
  Product,
  ComboOffer,
  Offer,
  Supplier,
  Expense,
  Order,
  OrderItem,
  OrderType,
  PaymentMethod,
  StoreSettings,
  NotificationItem,
  ActiveView,
  SalaryRecord,
  HeldOrder,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  OrderPaymentStatus,
  OrderStatus,
  SupplierPaymentType,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateEmployeeInput,
  CreateEmployeeResult,
  UpdateEmployeeInput,
  UpdateEmployeeResult,
  CreateSalaryInput,
  UpdateSalaryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  UpdateOrderInput,
  } from '../types';

import { supabase } from '../lib/supabase';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { getOffers, createOffer, updateOfferById, deleteOfferById } from '../services/offerService';
import { getCombos, createCombo, updateComboById, deleteComboById } from '../services/comboservice';
import {
  createOrder,
  getOrders,
  updateOrder as updateOrderInDatabase,
  updateOrderStatus as updateOrderStatusInDatabase,
  updateOrderPaymentStatus as updateOrderPaymentStatusInDatabase,
  deactivateOrder as deactivateOrderInDatabase,
  restoreOrder as restoreOrderInDatabase,
  permanentlyDeleteOrder as permanentlyDeleteOrderInDatabase,
} from '../services/orderService';
// import { OrderPaymentStatus, OrderStatus } from '../types';
import { employeeService } from '../services/employeeService';
import { salaryService } from '../services/salaryService';
import { expenseService } from '../services/expenseService';
import { settingsService } from '../services/settingsService';
import { authService } from '../services/authService';
import { readOfflineCache, writeOfflineCache, clearOfflineDraft } from '../lib/offlineStorage';

const mapSupplier = (row: any): Supplier => ({
  id: row.id,
  companyName: row.company_name,
  owner: row.owner,
  phone: row.phone,
  email: row.email,
  address: row.address,
  products: row.products,
  quantitySupplied:
    row.quantity_supplied || '',
  buyingPrice: Number(row.buying_price),
  // balance: Number(row.balance),
  // logo: row.logo || '',
  paymentType:
    row.payment_type as SupplierPaymentType,
  // status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapInventoryItem = (
  row: any
): InventoryItem => ({
  id: row.id,
  name: row.name,
  category: row.category,
  stock: Number(row.stock),
  lowStockAlert: Number(row.low_stock_alert),
  unit: row.unit,
  sku: row.sku || undefined,
  price: Number(row.price),
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapInventoryMovement = (
  row: any
): InventoryMovement => ({
  id: row.id,
  inventoryItemId:
    row.inventory_item_id || undefined,
  itemName: row.item_name,
  movementType: row.movement_type,
  quantity: Number(row.quantity),
  previousStock: Number(row.previous_stock),
  newStock: Number(row.new_stock),
  reason: row.reason || undefined,
  performedBy: row.performed_by || undefined,
  performedByName: row.performed_by_name,
  createdAt: row.created_at
});

interface AppContextType {
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  // Cart / POS State
  cart: OrderItem[];
  cartOrderType: OrderType;
  setCartOrderType: (type: OrderType) => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  addToCart: (product: Product) => void;
  addComboToCart: (combo: ComboOffer) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Active Receipt Modal
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (order: Order | null) => void;

  // Payment Modal
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  processPayment: (
    method: PaymentMethod,
    notes?: string
  ) => Promise<void>;

  // PIN Login Modal
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  loginWithPin: (pin: string, employeeId?: string) => boolean;

  // Hold / Resume Orders
  heldOrders: HeldOrder[];
  holdCurrentCart: (notes?: string) => void;
  resumeHeldOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;

  // Global Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data Collections
  products: Product[];
  categories: Category[];
  orders: Order[];
  ordersLoading: boolean;
  customers: Customer[];
  offers: Offer[];
  combos: ComboOffer[];
  suppliers: Supplier[];
  employees: Employee[];
  expenses: Expense[];
  settings: StoreSettings;
  notifications: NotificationItem[];

  refreshOrders: () => Promise<void>;
  updateOrder: (id: string, updates: UpdateOrderInput) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrderPaymentStatus: (id: string, status: OrderPaymentStatus) => Promise<void>;
  deactivateOrder: (id: string) => Promise<void>;
  restoreOrder: (id: string) => Promise<void>;
  permanentlyDeleteOrder: (id: string) => Promise<void>;

  // CRUD Actions
  addProduct: (
    product: Omit<Product, 'id'>
  ) => Promise<void>;

  updateProduct: (
    id: string,
    product: Partial<Product>
  ) => Promise<void>;

  deleteProduct: (
    id: string
  ) => Promise<void>;

  refreshProducts: () => Promise<void>;

  addCategory: (
    category: Omit<
      Category,
      'id' | 'productsCount'
    >
  ) => Promise<void>;

  updateCategory: (
    id: string,
    category: Partial<Category>
  ) => Promise<void>;

  deleteCategory: (
    id: string
  ) => Promise<void>;

  refreshCategories: () => Promise<void>;

  addCustomer: (
    customer: Omit<
      Customer,
      'id'
      | 'totalOrders'
      | 'totalSpent'
      | 'walletBalance'
      | 'createdAt'
      | 'updatedAt'
    >
  ) => Promise<void>;

  updateCustomer: (
    id: string,
    customer: Partial<Customer>
  ) => Promise<void>;

  deleteCustomer: (
    id: string
  ) => Promise<void>;

  refreshCustomers: () => Promise<void>;

  addOffer: (offer: Omit<Offer, 'id'>) => Promise<Offer>;
  updateOffer: (
    id: string,
    offer: Partial<Omit<Offer, 'id'>>
  ) => Promise<Offer>;
  deleteOffer: (id: string) => Promise<void>;

  addCombo: (combo: Omit<ComboOffer, 'id'>) => Promise<ComboOffer>;
  updateCombo: (id: string, combo: Partial<Omit<ComboOffer, 'id'>>) => Promise<ComboOffer>;
  deleteCombo: (id: string) => Promise<void>;

  suppliersLoading: boolean;

  refreshSuppliers: () => Promise<void>;

  addSupplier: (
    supplier: CreateSupplierInput
  ) => Promise<void>;

  updateSupplier: (
    id: string,
    supplier: UpdateSupplierInput
  ) => Promise<void>;

  deleteSupplier: (
    id: string
  ) => Promise<void>;

  employeesLoading: boolean;
  refreshEmployees: () => Promise<void>;
  addEmployee: (
    employee: CreateEmployeeInput,
  ) => Promise<CreateEmployeeResult>;

  updateEmployee: (
  id: string,
  employee: UpdateEmployeeInput,
) => Promise<UpdateEmployeeResult>;

setEmployeeStatus: (
  id: string,
  status: Employee['status'],
) => Promise<void>;

    salaries: SalaryRecord[];
    salariesLoading: boolean;

    refreshSalaries: () => Promise<void>;

    addSalary: (
      salary: CreateSalaryInput,
    ) => Promise<SalaryRecord>;
    updateSalary: (
  id: string,
  salary: UpdateSalaryInput,
) => Promise<SalaryRecord>;

    deleteSalary: (
      id: string,
    ) => Promise<void>;
  cashierPermissions: { [key: string]: boolean };
  updateCashierPermissions: (perms: { [key: string]: boolean }) => void;

  expensesLoading: boolean;

    refreshExpenses: () => Promise<void>;

    addExpense: (
      expense: CreateExpenseInput,
    ) => Promise<Expense>;

    updateExpense: (
      id: string,
      expense: UpdateExpenseInput,
    ) => Promise<Expense>;

    deleteExpense: (
      id: string,
    ) => Promise<void>;

  settingsLoading: boolean;

refreshSettings: () => Promise<void>;

updateSettings: (
  newSettings: StoreSettings,
) => Promise<StoreSettings>;

changeAdminPassword: (input: {
  currentPassword: string;
  newPassword: string;
}) => Promise<void>;

changeAdminEmail: (
  newEmail: string,
) => Promise<void>;

updateEmployeePermissions: (
  employeeId: string,
  permissions: string[],
) => Promise<Employee>;

  authLoading: boolean;

  loginWithCredentials: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;

  logout: () => Promise<void>;
  requestPasswordReset: (
    email: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  getProductPrice: (product: Product) => number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Separate Inventory
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  inventoryLoading: boolean;

  refreshInventory: () => Promise<void>;

  addInventoryItem: (
    item: CreateInventoryItemInput
  ) => Promise<void>;

  updateInventoryItem: (
    id: string,
    item: UpdateInventoryItemInput
  ) => Promise<void>;

  deleteInventoryItem: (
    id: string
  ) => Promise<void>;

  adjustInventoryStock: (
    inventoryItemId: string,
    movementType: InventoryMovementType,
    quantity: number,
    reason?: string
  ) => Promise<void>;

}
const requestPasswordReset = async (
  email: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      success: false,
      message: 'Please enter your email address.'
    };
  }

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: `${window.location.origin}/reset-password`
      }
    );

  if (error) {
    console.error(
      'Password reset failed:',
      error.message
    );

    return {
      success: false,
      message:
        'Unable to send the password-reset email. Please try again.'
    };
  }

  return {
    success: true,
    message:
      'If this email is registered, a password-reset link has been sent.'
  };
};
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence helpers
  const getStored = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`kaanthaaram_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const setStored = (key: string, value: any) => {
    try {
      localStorage.setItem(`kaanthaaram_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  };

  // State
  const [currentUser, setCurrentUser] =
    useState<Employee | null>(null);

  const [authLoading, setAuthLoading] =
    useState<boolean>(true);
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    return 'pos';
  });
  
  const [
  settingsLoading,
  setSettingsLoading,
] = useState<boolean>(false);


  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] =
    useState<InventoryItem[]>([]);

  const [
    inventoryMovements,
    setInventoryMovements
  ] = useState<InventoryMovement[]>([]);

  const [inventoryLoading, setInventoryLoading] =
    useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] =
    useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [
    suppliersLoading,
    setSuppliersLoading
  ] = useState<boolean>(false);

  const [employees, setEmployees] =
  useState<Employee[]>([]);

const [employeesLoading, setEmployeesLoading] =
  useState<boolean>(false);
  const [expenses, setExpenses] =
      useState<Expense[]>([]);

    const [
      expensesLoading,
      setExpensesLoading,
    ] = useState<boolean>(false);
  const [salaries, setSalaries] =
  useState<SalaryRecord[]>([]);

const [
  salariesLoading,
  setSalariesLoading,
] = useState<boolean>(false);
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const stored = getStored<StoreSettings | null>('settings', null);
    if (stored) {
      if (stored.currency === '₹' || !stored.currency) {
        // stored.currency = 'LKR';
      }
      if (stored.storeName === 'Kaanthaaram TEA' || !stored.storeName) {
        stored.storeName = 'காந்தாரம் TEA';
      }
      if (stored.receiptHeaderTitle === 'Kaanthaaram TEA' || !stored.receiptHeaderTitle) {
        stored.receiptHeaderTitle = 'காந்தாரம் TEA';
      }
      return stored;
    }
    // Settings are fetched from Supabase by refreshSettings after authentication.
    // This is a temporary initial value, not seeded store data.
    return {} as StoreSettings;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStored<NotificationItem[]>('notifications', []));
  const [cashierPermissions, setCashierPermissions] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('kaanthaaram_cashier_permissions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      pos: true,
      discounts: false,
      holdBills: true,
      products: true,
      customers: true,
      offers: true,
      inventory: false,
      receipts: true,
      reports: false,
      suppliers: false,
      expenses: false
    };
  });

  // Cart
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOrderType, setCartOrderType] = useState<OrderType>('Takeaway');
  const [cartDiscount, setCartDiscount] = useState<number>(0.00);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => getStored('held_orders', []));

  const refreshCategories = async (): Promise<void> => {
    try {
      const loadedCategories =
        await categoryService.getAll();

      setCategories(loadedCategories);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load categories.';

      console.error(
        'Category loading error:',
        message
      );

      throw new Error(message);
    }
  };

  useEffect(() => {
    if (currentUser) {
      void refreshCategories().catch(
        (error) => {
          console.error(error);
        }
      );
    } else {
      setCategories([]);
    }
  }, [currentUser?.id]);


  const refreshProducts =
    async (): Promise<void> => {
      try {
        const loadedProducts =
          await productService.getAll();

        setProducts(loadedProducts);
        if (currentUser?.id) await writeOfflineCache(currentUser.id, 'products', loadedProducts);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load products.';

        console.error(
          'Product loading error:',
          message
        );

        if (currentUser?.id) {
          const cached = await readOfflineCache<Product[]>(currentUser.id, 'products');
          if (cached) { setProducts(cached); return; }
        }
        throw new Error(message);
      }
    };
  useEffect(() => {
    if (currentUser) {
      void refreshProducts().catch(
        (error) => {
          console.error(error);
        }
      );
    } else {
      setProducts([]);
    }
  }, [currentUser?.id]);

  const refreshCustomers =
    async (): Promise<void> => {
      try {
        const loadedCustomers =
          await customerService.getAll();

        setCustomers(loadedCustomers);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load Customers.';

        console.error(
          'Customer loading error:',
          message
        );

        throw new Error(message);
      }
    };
  useEffect(() => {
    if (currentUser) {
      void refreshCustomers().catch(
        (error) => {
          console.error(error);
        }
      );
    } else {
      setCustomers([]);
    }
  }, [currentUser?.id]);

  const refreshEmployees =
  async (): Promise<void> => {
    setEmployeesLoading(true);

    try {
      const loadedEmployees =
        await employeeService.getAll();

      setEmployees(loadedEmployees);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load staff members.';

      console.error(
        'Employee loading error:',
        message,
      );

      throw new Error(message);
    } finally {
      setEmployeesLoading(false);
    }
  };

useEffect(() => {
  if (
    currentUser &&
    currentUser.role === 'Admin'
  ) {
    void refreshEmployees().catch(
      (error) => {
        console.error(error);
      },
    );
  } else {
    setEmployees([]);
  }
}, [currentUser?.id, currentUser?.role]);
  // Persist whenever state changes

  // useEffect(() => setStored('products', products), [products]);
  // useEffect(() => setStored('categories', categories), [categories]);
  // useEffect(() => setStored('orders', orders), [orders]);
  // useEffect(() => setStored('customers', customers), [customers]);
  // useEffect(() => setStored('offers', offers), [offers]);
  // Combo deals are persisted in Supabase (not localStorage).
  useEffect(() => setStored('suppliers', suppliers), [suppliers]);
  // useEffect(() => setStored('employees', employees), [employees]);
  // useEffect(() => setStored('expenses', expenses), [expenses]);
  // useEffect(() => setStored('salaries', salaries), [salaries]);
  useEffect(() => {
    localStorage.setItem('kaanthaaram_cashier_permissions', JSON.stringify(cashierPermissions));
  }, [cashierPermissions]);
  // useEffect(() => setStored('settings', settings), [settings]);
  useEffect(() => setStored('notifications', notifications), [notifications]);
  useEffect(() => setStored('held_orders', heldOrders), [heldOrders]);

  useEffect(() => {
    let isMounted = true;

   const loadUserProfile = async (
  userId: string,
) => {
  const {
    data: existingUser,
    error: existingUserError,
  } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      status,
      role,
      phone_number,
      profile,
      gender,
      created_at
    `)
    .eq('id', userId)
    .maybeSingle();

  if (!isMounted) return;

  if (existingUserError) {
    console.error(
      'Unable to check users profile:',
      existingUserError,
    );
  }

  // The users table profile is used only for the main administrator.
// Staff permissions must be loaded from staff_members.
if (
  existingUser &&
  existingUser.role === 'Admin'
) {
  if (existingUser.status !== 'Active') {
    await supabase.auth.signOut();
    setCurrentUser(null);
    return;
  }

  const authenticatedEmployee: Employee = {
    id: existingUser.id,
    authUserId: existingUser.id,
    userType: 'POS Access',
    name: existingUser.name,
    username: existingUser.email,
    email: existingUser.email,
    phone:
      existingUser.phone_number || '',
    role: 'Admin',
    pin: '',
    photo: existingUser.profile || '',
    salary: 0,
    gender:
      existingUser.gender || undefined,
    workingType: 'Full-time',
    attendance: 'Present',
    status: 'Active',
    permissions: [],
    createdAt:
      existingUser.created_at,
  };

  setCurrentUser(
    authenticatedEmployee,
  );

  // Do not reset activeView here.
  return;
}

  const {
    data: staffMember,
    error: staffError,
  } = await supabase
    .from('staff_members')
    .select(`
      id,
      auth_user_id,
      user_type,
      full_name,
      email,
      phone,
      role,
      photo,
      salary,
      date_of_birth,
      gender,
      working_type,
      attendance,
      status,
      permissions,
      created_at,
      updated_at
    `)
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (!isMounted) return;

  if (staffError || !staffMember) {
    console.error(
      'Unable to load staff profile:',
      staffError,
    );

    await supabase.auth.signOut();
    setCurrentUser(null);
    return;
  }

  if (
    staffMember.status !== 'Active' ||
    staffMember.user_type !== 'POS Access'
  ) {
    await supabase.auth.signOut();
    setCurrentUser(null);
    return;
  }

  const authenticatedEmployee: Employee = {
    id: staffMember.id,
    authUserId:
      staffMember.auth_user_id ?? undefined,
    userType: staffMember.user_type,
    name: staffMember.full_name,
    username: staffMember.email ?? '',
    email: staffMember.email ?? '',
    phone: staffMember.phone ?? '',
    role: staffMember.role as Employee['role'],
    pin: '',
    photo: staffMember.photo ?? '',
    salary: Number(staffMember.salary ?? 0),
    dateOfBirth:
      staffMember.date_of_birth ?? undefined,
    gender:
      staffMember.gender ??
      undefined,
    workingType:
      staffMember.working_type ??
      undefined,
    attendance:
      staffMember.attendance ?? 'Present',
    status: staffMember.status,
    permissions: Array.isArray(
  staffMember.permissions,
)
  ? staffMember.permissions
  : [],
    createdAt: staffMember.created_at,
    updatedAt:
      staffMember.updated_at ?? undefined,
  };

  setCurrentUser(authenticatedEmployee);
  setActiveView(
    authenticatedEmployee.role === 'Admin'
      ? 'dashboard'
      : 'pos',
  );
};

    const initializeAuthentication = async () => {
      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            'Unable to read authentication session:',
            sessionError
          );
        }

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error(
          'Authentication initialization failed:',
          error
        );

        // Never leave the application permanently on
        // "Checking secure session..." after a failed profile request.
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    void initializeAuthentication();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setCurrentUser(null);
        setCart([]);
        setCartDiscount(0);
        setSelectedCustomer(null);
        setActiveReceiptOrder(null);
        setIsPaymentModalOpen(false);
        setActiveView('pos');
        setAuthLoading(false);
        return;
      }

      window.setTimeout(async () => {
        try {
          await loadUserProfile(session.user.id);
        } catch (error) {
          console.error(
            'Unable to load authenticated profile:',
            error
          );

          if (isMounted) {
            setCurrentUser(null);
          }
        } finally {
          if (isMounted) {
            setAuthLoading(false);
          }
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  const [draftLoadedFor, setDraftLoadedFor] = useState<string | null>(null);
  // Offline draft only: never treated as a completed sale.
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    void readOfflineCache<{cart: OrderItem[]; discount: number; type: OrderType}>(currentUser.id, 'draft')
      .then(draft => {
        if (!cancelled && draft && cart.length === 0) {
          setCart(draft.cart);
          setCartDiscount(draft.discount);
          setCartOrderType(draft.type);
        }
        if (!cancelled) setDraftLoadedFor(currentUser.id);
      });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || draftLoadedFor !== currentUser.id) return;
    void writeOfflineCache(currentUser.id, 'draft', {
      cart, discount: cartDiscount, type: cartOrderType,
    });
  }, [currentUser?.id, draftLoadedFor, cart, cartDiscount, cartOrderType]);

  // Cart actions
  const addToCart = (product: Product) => {
    const finalPrice = getProductPrice(product);
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      return [...prev, { product, quantity: 1, price: finalPrice }];
    });
  };


  const addComboToCart = (combo: ComboOffer) => {
    const items = combo.productItems ?? [];
    if (!items.length) {
      alert('This combo has no products. Edit the combo and select products first.');
      return;
    }

    const resolved = items.map(item => ({
      ...item,
      product: products.find(product => product.id === item.productId),
    }));

    if (resolved.some(item => !item.product)) {
      alert('One or more products in this combo are no longer available.');
      return;
    }

    const regularTotal = resolved.reduce((sum, item) => {
      const product = item.product as Product;
      return sum + getProductPrice(product) * Math.max(1, Number(item.quantity) || 1);
    }, 0);

    const comboPrice = Math.max(0, Number(combo.price) || 0);
    const comboSaving = Math.max(0, regularTotal - comboPrice);

    setCart(previous => {
      const next = [...previous];
      resolved.forEach(item => {
        const product = item.product as Product;
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const finalPrice = getProductPrice(product);
        const index = next.findIndex(cartItem => cartItem.product.id === product.id);
        if (index >= 0) {
          next[index] = { ...next[index], quantity: next[index].quantity + quantity };
        } else {
          next.push({ product, quantity, price: finalPrice });
        }
      });
      return next;
    });

    if (comboSaving > 0) {
      setCartDiscount(previous => Math.round((previous + comboSaving) * 100) / 100);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0.00);
    setSelectedCustomer(null);
  };

  // Process Payment: save the order and all items in Supabase.
  const processPayment = async (
    paymentMethod: PaymentMethod,
    notes?: string
  ): Promise<void> => {
    if (cart.length === 0) {
      throw new Error('The cart is empty.');
    }
    if (!navigator.onLine) {
      throw new Error('Offline: your cart is saved as a local draft. Payment cannot be finalized until internet is restored.');
    }

    try {
      const savedOrder = await createOrder(
        {
          customerId: selectedCustomer?.id,
          customerName: selectedCustomer?.name ?? 'Walk-in Customer',
          customerPhone: selectedCustomer?.mobile ?? '',
          items: cart,
          // create_pos_order reads the regular product prices from Supabase.
          // Convert per-item offer prices into an order-level discount so the
          // database total exactly matches the POS total, then add manual/combo discount.
          discount: Math.round((
            cartDiscount + cart.reduce((sum, item) => {
              const regular = Number(item.product.price) * item.quantity;
              const charged = Number(item.price) * item.quantity;
              return sum + Math.max(0, regular - charged);
            }, 0)
          ) * 100) / 100,
          taxPercentage: 0,
          orderType: cartOrderType,
          paymentMethod,
          paymentStatus: 'Paid',
          notes,
        },
        products
      );

      setOrders(previous => [savedOrder, ...previous]);
      setActiveReceiptOrder(savedOrder);
      setIsPaymentModalOpen(false);
      clearCart();
      if (currentUser?.id) void clearOfflineDraft(currentUser.id);
    } catch (error) {
      console.error('Payment/order save failed:', error);
      throw error instanceof Error ? error : new Error('Unable to save the order.');
    }
  };

  // Login
  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      console.error('Login failed:', error.message);

      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }

    return {
      success: true
    };
  };

  const loginWithPin = (_pin: string, _employeeId?: string): boolean => {
    // Security: do not grant access by comparing locally available PIN values.
    // Implement a server-verified PIN flow before enabling this feature.
    return false;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error.message);
      throw new Error('Unable to sign out. Please try again.');
    }

    // Clear session-scoped POS state only after Supabase confirms sign-out.
    setCurrentUser(null);
    setActiveView('pos');
    setCart([]);
    setCartDiscount(0);
    setCartOrderType('Takeaway');
    setSelectedCustomer(null);
    setActiveReceiptOrder(null);
    setIsPaymentModalOpen(false);
    setIsPinModalOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    // Held orders remain stored intentionally for recovery across shifts.
  };

  const holdCurrentCart = (notes?: string) => {
    if (cart.length === 0) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newHeldOrder: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      customer: selectedCustomer,
      items: [...cart],
      discount: cartDiscount,
      orderType: cartOrderType,
      time: timeStr,
      date: dateStr,
      notes: notes || `Held Order #${heldOrders.length + 1}`
    };
    setHeldOrders(prev => [newHeldOrder, ...prev]);
    clearCart();
  };

  const resumeHeldOrder = (id: string) => {
    const found = heldOrders.find(h => h.id === id);
    if (!found) return;

    setCart(found.items);
    setSelectedCustomer(found.customer);
    setCartDiscount(found.discount);
    setCartOrderType(found.orderType);

    setHeldOrders(prev => prev.filter(h => h.id !== id));
  };

  const deleteHeldOrder = (id: string) => {
    setHeldOrders(prev => prev.filter(h => h.id !== id));
  };

  const getProductPrice = (product: Product): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /**
     * Supports both date formats:
     * YYYY-MM-DD — Supabase format
     * DD-MM-YYYY — existing frontend format
     */
    const parseOfferDate = (dateValue: string): Date | null => {
      if (!dateValue) return null;

      const parts = dateValue.split('-');

      if (parts.length !== 3) return null;

      let year: number;
      let month: number;
      let day: number;

      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        // DD-MM-YYYY
        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);
      }

      if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        return null;
      }

      const parsedDate = new Date(year, month - 1, day);

      // Prevent invalid dates such as 31-02-2026.
      if (
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() !== month - 1 ||
        parsedDate.getDate() !== day
      ) {
        return null;
      }

      return parsedDate;
    };

    const matchingOffers = offers.filter(offer => {
      if (offer.status !== 'Active') return false;

      // Product-specific offer wins. If no product is selected, a category
      // offer applies only to products in that category. With neither selected,
      // the offer applies to all products.
      if (offer.productId && offer.productId !== product.id) return false;
      if (!offer.productId && offer.categoryId && offer.categoryId !== product.categoryId) return false;

      const startDate = parseOfferDate(offer.startDate);
      const endDate = parseOfferDate(offer.endDate);

      // Ignore offers containing invalid dates.
      if (!startDate || !endDate) {
        return false;
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Offer must be inside its validity period.
      if (today < startDate || today > endDate) {
        return false;
      }

      const discount = Number(offer.discount);

      // Ignore invalid discount values.
      if (!Number.isFinite(discount) || discount < 0) {
        return false;
      }

      // Percentage cannot exceed 100%.
      if (
        offer.type === 'Percentage' &&
        discount > 100
      ) {
        return false;
      }

      return true;
    });

    if (!matchingOffers.length) return Number(product.price);

    // Prefer product-specific over category-specific over store-wide.
    const activeOffer = [...matchingOffers].sort((a, b) => {
      const score = (offer: Offer) => offer.productId ? 3 : offer.categoryId ? 2 : 1;
      return score(b) - score(a);
    })[0];

    const originalPrice = Number(product.price);
    const discount = Number(activeOffer.discount);

    if (
      !Number.isFinite(originalPrice) ||
      originalPrice < 0
    ) {
      return 0;
    }

    let finalPrice: number;

    if (activeOffer.type === 'Percentage') {
      finalPrice =
        originalPrice -
        originalPrice * (discount / 100);
    } else {
      finalPrice = originalPrice - discount;
    }

    // Prevent negative prices and floating-point values
    // such as 18.0000000004.
    return Math.max(
      0,
      Math.round(finalPrice * 100) / 100
    );
  };

  // CRUD Implementations
  const addProduct = async (
    product: Omit<Product, 'id'>
  ): Promise<void> => {
    const selectedCategory =
      categories.find(
        (category) =>
          category.name.toLowerCase() ===
          product.category.toLowerCase()
      );

    if (!selectedCategory) {
      throw new Error(
        'Please select a valid category.'
      );
    }

    const createdProduct =
      await productService.create({
        name: product.name,
        categoryId: selectedCategory.id,
        description:
          product.description || '',
        price: product.price,
        image: product.image
      });

    setProducts((previousProducts) => [
      createdProduct,
      ...previousProducts
    ]);
  };
  const loadOffers = async (): Promise<void> => {
    try {
      setOffersLoading(true);

      const databaseOffers = await getOffers();

      setOffers(databaseOffers);
    } catch (error) {
      console.error('Unable to load offers:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load offers.';

      alert(message);
    } finally {
      setOffersLoading(false);
    }
  };
  useEffect(() => {
    if (currentUser) {
      void loadOffers();
    } else {
      setOffers([]);
    }
  }, [currentUser?.id]);


  const loadCombos = async (): Promise<void> => {
    try {
      setCombos(await getCombos());
    } catch (error) {
      console.error('Unable to load combo deals:', error);
      setCombos([]);
    }
  };

  useEffect(() => {
    if (currentUser) {
      void loadCombos();
    } else {
      setCombos([]);
    }
  }, [currentUser?.id]);

  const updateProduct = async (
    id: string,
    updatedProduct: Partial<Product>
  ): Promise<void> => {
    const currentProduct =
      products.find(
        (product) => product.id === id
      );

    if (!currentProduct) {
      throw new Error(
        'The selected Product was not found.'
      );
    }

    let selectedCategoryId:
      | string
      | undefined;

    if (updatedProduct.category) {
      const selectedCategory =
        categories.find(
          (category) =>
            category.name.toLowerCase() ===
            updatedProduct.category!
              .toLowerCase()
        );

      if (!selectedCategory) {
        throw new Error(
          'Please select a valid category.'
        );
      }

      selectedCategoryId =
        selectedCategory.id;
    }

    const savedProduct =
      await productService.update(id, {
        name: updatedProduct.name,
        categoryId: selectedCategoryId,
        description:
          updatedProduct.description,
        price: updatedProduct.price,
        image: updatedProduct.image
      });

    setProducts((previousProducts) =>
      previousProducts.map((product) =>
        product.id === id
          ? {
            ...product,
            ...savedProduct
          }
          : product
      )
    );
  };
  const deleteProduct = async (
    id: string
  ): Promise<void> => {
    await productService.remove(id);

    setProducts((previousProducts) =>
      previousProducts.filter(
        (product) => product.id !== id
      )
    );
  };

  const addCategory = async (
    category: Omit<
      Category,
      'id' | 'productsCount'
    >
  ): Promise<void> => {
    const createdCategory =
      await categoryService.create({
        name: category.name,
        description: category.description,
        image: category.image
      });

    setCategories((previousCategories) =>
      [
        ...previousCategories,
        createdCategory
      ].sort((firstCategory, secondCategory) =>
        firstCategory.name.localeCompare(
          secondCategory.name
        )
      )
    );
  };
  const updateCategory = async (
    id: string,
    updatedCategory: Partial<Category>
  ): Promise<void> => {
    const existingCategory =
      categories.find(
        (category) => category.id === id
      );

    if (!existingCategory) {
      throw new Error(
        'The selected category was not found.'
      );
    }

    const savedCategory =
      await categoryService.update(id, {
        name: updatedCategory.name,
        description:
          updatedCategory.description,
        image: updatedCategory.image
      });

    setCategories((previousCategories) =>
      previousCategories.map((category) =>
        category.id === id
          ? {
            ...category,
            ...savedCategory
          }
          : category
      )
    );

    // Update the category name inside existing
    // local frontend products.

    if (
      updatedCategory.name &&
      existingCategory.name !==
      updatedCategory.name
    ) {
      setProducts((previousProducts) =>
        previousProducts.map((product) =>
          product.category.toLowerCase() ===
            existingCategory.name.toLowerCase()
            ? {
              ...product,
              category:
                updatedCategory.name as string
            }
            : product
        )
      );
    }
  };
const deleteCategory = async (
  id: string
): Promise<void> => {
  try {
    // Deletes only the selected category.
    // Supabase CASCADE deletes only products linked to this ID.
    await categoryService.remove(id);

    setCategories((previousCategories) =>
      previousCategories.filter(
        (category) => category.id !== id
      )
    );

    // Reload remaining products without clearing all products.
    await refreshProducts();
  } catch (error) {
    console.error(
      'Unable to delete category:',
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Unable to delete category.'
    );
  }
};

  const addCustomer = async (
    customer: Omit<
      Customer,
      'id'
      | 'totalOrders'
      | 'totalSpent'
      | 'walletBalance'
      | 'createdAt'
      | 'updatedAt'
    >
  ): Promise<void> => {
    const createdCustomer =
      await customerService.create({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        dob: customer.dob,
        gender: customer.gender,
        address: customer.address,
        photo: customer.photo,
        status: customer.status,
        notes: customer.notes
      });

    setCustomers((previousCustomers) => [
      createdCustomer,
      ...previousCustomers
    ]);

    setSelectedCustomer(createdCustomer);
  };


  const updateCustomer = async (
    id: string,
    updatedCustomer: Partial<Customer>
  ): Promise<void> => {
    const savedCustomer =
      await customerService.update(
        id,
        updatedCustomer
      );

    setCustomers((previousCustomers) =>
      previousCustomers.map(
        (customerItem) =>
          customerItem.id === id
            ? savedCustomer
            : customerItem
      )
    );

    setSelectedCustomer(
      (currentSelectedCustomer) =>
        currentSelectedCustomer?.id === id
          ? savedCustomer
          : currentSelectedCustomer
    );
  };


  const deleteCustomer = async (
    id: string
  ): Promise<void> => {
    await customerService.remove(id);

    setCustomers((previousCustomers) =>
      previousCustomers.filter(
        (customerItem) =>
          customerItem.id !== id
      )
    );

    setSelectedCustomer(
      (currentSelectedCustomer) =>
        currentSelectedCustomer?.id === id
          ? null
          : currentSelectedCustomer
    );
  };

  const addOffer = async (
    offer: Omit<Offer, 'id'>
  ): Promise<Offer> => {
    try {
      const createdOffer = await createOffer(offer);

      setOffers(previousOffers => [
        createdOffer,
        ...previousOffers,
      ]);

      return createdOffer;
    } catch (error) {
      console.error('Unable to add offer:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to add offer.';

      throw new Error(message);
    }
  };

  const updateOffer = async (
    id: string,
    updates: Partial<Omit<Offer, 'id'>>
  ): Promise<Offer> => {
    try {
      const updatedOffer = await updateOfferById(
        id,
        updates
      );

      setOffers(previousOffers =>
        previousOffers.map(offer =>
          offer.id === id ? updatedOffer : offer
        )
      );

      return updatedOffer;
    } catch (error) {
      console.error('Unable to update offer:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update offer.';

      throw new Error(message);
    }
  };

  const deleteOffer = async (
    id: string
  ): Promise<void> => {
    try {
      await deleteOfferById(id);

      setOffers(previousOffers =>
        previousOffers.filter(offer => offer.id !== id)
      );
    } catch (error) {
      console.error('Unable to delete offer:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete offer.';

      throw new Error(message);
    }
  };

  const refreshOrders = async (): Promise<void> => {
    try {
      setOrdersLoading(true);
      setOrders(await getOrders(products));
    } catch (error) {
      console.error('Load orders error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Unable to load orders.'
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && products.length > 0) {
      void refreshOrders().catch(console.error);
    } else if (!currentUser) {
      setOrders([]);
    }
  }, [currentUser?.id, products.length]);

  const updateOrder = async (
    orderNumber: string,
    updates: UpdateOrderInput
  ): Promise<void> => {
    await updateOrderInDatabase(orderNumber, updates);

    setOrders(previous =>
      previous.map(order =>
        order.id === orderNumber
          ? {
              ...order,
              customerName: updates.customerName.trim() || 'Walk-in Customer',
              customerPhone: updates.customerPhone?.trim() || '',
              type: updates.orderType,
              paymentMethod: updates.paymentMethod,
              paymentStatus: updates.paymentStatus,
              notes: updates.notes?.trim() || '',
            }
          : order
      )
    );

    setActiveReceiptOrder(previous =>
      previous?.id === orderNumber
        ? {
            ...previous,
            customerName: updates.customerName.trim() || 'Walk-in Customer',
            customerPhone: updates.customerPhone?.trim() || '',
            type: updates.orderType,
            paymentMethod: updates.paymentMethod,
            paymentStatus: updates.paymentStatus,
            notes: updates.notes?.trim() || '',
          }
        : previous
    );
  };

  const updateOrderStatus = async (
    id: string,
    status: OrderStatus
  ): Promise<void> => {
    await updateOrderStatusInDatabase(id, status);
    setOrders(previous => previous.map(order =>
      order.id === id ? { ...order, status } : order
    ));
  };

  const updateOrderPaymentStatus = async (
    id: string,
    status: OrderPaymentStatus
  ): Promise<void> => {
    await updateOrderPaymentStatusInDatabase(id, status);
    setOrders(previous => previous.map(order =>
      order.id === id ? { ...order, paymentStatus: status } : order
    ));
  };

  const deactivateOrder = async (id: string): Promise<void> => {
    await deactivateOrderInDatabase(id);
    setOrders(previous => previous.map(order =>
      order.id === id ? { ...order, status: 'Cancelled' } : order
    ));
    setActiveReceiptOrder(previous => previous?.id === id ? null : previous);
  };

  const restoreOrder = async (id: string): Promise<void> => {
    await restoreOrderInDatabase(id);
    setOrders(previous => previous.map(order =>
      order.id === id ? { ...order, status: 'Completed' } : order
    ));
  };

  const permanentlyDeleteOrder = async (id: string): Promise<void> => {
    await permanentlyDeleteOrderInDatabase(id);
    setOrders(previous => previous.filter(order => order.id !== id));
    setActiveReceiptOrder(previous => previous?.id === id ? null : previous);
  };

  const addCombo = async (combo: Omit<ComboOffer, 'id'>): Promise<ComboOffer> => {
    const saved = await createCombo(combo);
    setCombos(previous => [saved, ...previous]);
    return saved;
  };

  const updateCombo = async (
    id: string,
    updates: Partial<Omit<ComboOffer, 'id'>>
  ): Promise<ComboOffer> => {
    const saved = await updateComboById(id, updates);
    setCombos(previous => previous.map(combo => combo.id === id ? saved : combo));
    return saved;
  };

  const deleteCombo = async (id: string): Promise<void> => {
    await deleteComboById(id);
    setCombos(previous => previous.filter(combo => combo.id !== id));
  };


  const refreshSuppliers =
    async (): Promise<void> => {
      try {
        setSuppliersLoading(true);

        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('created_at', {
            ascending: false
          });

        if (error) {
          throw error;
        }

        setSuppliers(
          (data || []).map(mapSupplier)
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load suppliers.';

        console.error(
          'Supplier loading error:',
          message
        );

        throw new Error(message);
      } finally {
        setSuppliersLoading(false);
      }
    };

  const addSupplier = async (
    supplier: CreateSupplierInput
  ): Promise<void> => {
    if (!supplier.companyName.trim()) {
      throw new Error(
        'Company name is required.'
      );
    }

    if (supplier.buyingPrice < 0) {
      throw new Error(
        'Buying price cannot be negative.'
      );
    }

    // if (supplier.balance < 0) {
    //   throw new Error(
    //     'Balance cannot be negative.'
    //   );
    // }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        company_name:
          supplier.companyName.trim(),

        owner:
          supplier.owner.trim(),

        phone:
          supplier.phone.trim(),

        email:
          supplier.email.trim(),

        address:
          supplier.address.trim(),

        products:
          supplier.products.trim(),

        quantity_supplied:
          supplier.quantitySupplied.trim(),

        buying_price:
          supplier.buyingPrice,

        // balance:
        //   supplier.balance,

        // logo:
        //   supplier.logo.trim(),

        payment_type:
          supplier.paymentType,

        // status:
        //   supplier.status || 'Active'
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const createdSupplier =
      mapSupplier(data);

    setSuppliers(previous => [
      createdSupplier,
      ...previous
    ]);
  };

  const updateSupplier = async (
    id: string,
    supplier: UpdateSupplierInput
  ): Promise<void> => {
    const updateData:
      Record<string, unknown> = {};

    if (supplier.companyName !== undefined) {
      updateData.company_name =
        supplier.companyName.trim();
    }

    if (supplier.owner !== undefined) {
      updateData.owner =
        supplier.owner.trim();
    }

    if (supplier.phone !== undefined) {
      updateData.phone =
        supplier.phone.trim();
    }

    if (supplier.email !== undefined) {
      updateData.email =
        supplier.email.trim();
    }

    if (supplier.address !== undefined) {
      updateData.address =
        supplier.address.trim();
    }

    if (supplier.products !== undefined) {
      updateData.products =
        supplier.products.trim();
    }

    if (
      supplier.quantitySupplied !== undefined
    ) {
      updateData.quantity_supplied =
        supplier.quantitySupplied.trim();
    }

    if (supplier.buyingPrice !== undefined) {
      updateData.buying_price =
        supplier.buyingPrice;
    }

    // if (supplier.balance !== undefined) {
    //   updateData.balance =
    //     supplier.balance;
    // }

    // if (supplier.logo !== undefined) {
    //   updateData.logo =
    //     supplier.logo.trim();
    // }

    if (supplier.paymentType !== undefined) {
      updateData.payment_type =
        supplier.paymentType;
    }

    // if (supplier.status !== undefined) {
    //   updateData.status =
    //     supplier.status;
    // }

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const updatedSupplier =
      mapSupplier(data);

    setSuppliers(previous =>
      previous.map(current =>
        current.id === id
          ? updatedSupplier
          : current
      )
    );
  };
  const deleteSupplier = async (
    id: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    setSuppliers(previous =>
      previous.filter(
        supplier => supplier.id !== id
      )
    );
  };
  useEffect(() => {
    if (currentUser) {
      void refreshSuppliers().catch(error => {
        console.error(error);
      });
    } else {
      setSuppliers([]);
    }
  }, [currentUser?.id]);

  const addEmployee = async (
  employee: CreateEmployeeInput,
): Promise<CreateEmployeeResult> => {
  const result =
    await employeeService.create(employee);

  setEmployees((previous) => [
    result.employee,
    ...previous,
  ]);

  return result;
};

  const updateEmployee = async (
  id: string,
  employee: UpdateEmployeeInput,
): Promise<UpdateEmployeeResult> => {
  const result = await employeeService.update(
    id,
    employee,
  );

  setEmployees((previousEmployees) =>
    previousEmployees.map((currentEmployee) =>
      currentEmployee.id === id
        ? result.employee
        : currentEmployee,
    ),
  );

  setCurrentUser((currentEmployee) =>
    currentEmployee?.id === id
      ? result.employee
      : currentEmployee,
  );

  return result;
};

const setEmployeeStatus = async (
  id: string,
  status: Employee['status'],
): Promise<void> => {
  const result =
    await employeeService.setStatus(
      id,
      status,
    );

  setEmployees((previousEmployees) =>
    previousEmployees.map((employee) =>
      employee.id === id
        ? result.employee
        : employee,
    ),
  );

  setCurrentUser((currentEmployee) =>
    currentEmployee?.id === id
      ? result.employee
      : currentEmployee,
  );
};

  const refreshSalaries =
  async (): Promise<void> => {
    setSalariesLoading(true);

    try {
      const loadedSalaries =
        await salaryService.getAll();

      setSalaries(loadedSalaries);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load salary history.';

      console.error(
        'Salary loading error:',
        message,
      );

      throw new Error(message);
    } finally {
      setSalariesLoading(false);
    }
  };

const addSalary = async (
  salary: CreateSalaryInput,
): Promise<SalaryRecord> => {
  const createdSalary =
    await salaryService.create(salary);

  setSalaries((previous) => [
    createdSalary,
    ...previous,
  ]);

  return createdSalary;
};

const updateSalary = async (
  id: string,
  salary: UpdateSalaryInput,
): Promise<SalaryRecord> => {
  const updatedSalary =
    await salaryService.update(id, salary);

  setSalaries((previousSalaries) =>
    previousSalaries.map((currentSalary) =>
      currentSalary.id === id
        ? updatedSalary
        : currentSalary,
    ),
  );

  return updatedSalary;
};

const deleteSalary = async (
  id: string,
): Promise<void> => {
  await salaryService.remove(id);

  setSalaries((previous) =>
    previous.filter(
      (salary) => salary.id !== id,
    ),
  );
};

useEffect(() => {
  if (
    currentUser &&
    currentUser.role === 'Admin'
  ) {
    void refreshSalaries().catch(
      (error) => {
        console.error(error);
      },
    );
  } else {
    setSalaries([]);
  }
}, [currentUser?.id, currentUser?.role]);

  const refreshExpenses =
  async (): Promise<void> => {
    setExpensesLoading(true);

    try {
      const loadedExpenses =
        await expenseService.getAll();

      setExpenses(loadedExpenses);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load expenses.';

      console.error(
        'Expense loading error:',
        message,
      );

      throw new Error(message);
    } finally {
      setExpensesLoading(false);
    }
  };

const addExpense = async (
  expense: CreateExpenseInput,
): Promise<Expense> => {
  const createdExpense =
    await expenseService.create(expense);

  setExpenses((previousExpenses) => [
    createdExpense,
    ...previousExpenses,
  ]);

  return createdExpense;
};

const updateExpense = async (
  id: string,
  expense: UpdateExpenseInput,
): Promise<Expense> => {
  const updatedExpense =
    await expenseService.update(
      id,
      expense,
    );

  setExpenses((previousExpenses) =>
    previousExpenses.map(
      (currentExpense) =>
        currentExpense.id === id
          ? updatedExpense
          : currentExpense,
    ),
  );

  return updatedExpense;
};

const deleteExpense = async (
  id: string,
): Promise<void> => {
  await expenseService.remove(id);

  setExpenses((previousExpenses) =>
    previousExpenses.filter(
      (expense) => expense.id !== id,
    ),
  );
};

useEffect(() => {
  if (
    currentUser &&
    currentUser.role === 'Admin'
  ) {
    void refreshExpenses().catch(
      (error) => {
        console.error(error);
      },
    );
  } else {
    setExpenses([]);
  }
}, [currentUser?.id, currentUser?.role]);

  const refreshSettings =
  async (): Promise<void> => {
    setSettingsLoading(true);

    try {
      const loadedSettings =
        await settingsService.get();

      setSettings(loadedSettings);
    } catch (error) {
      console.error(
        'Settings loading error:',
        error,
      );

      throw error;
    } finally {
      setSettingsLoading(false);
    }
  };

const updateSettings = async (
  newSettings: StoreSettings,
): Promise<StoreSettings> => {
  const savedSettings =
    await settingsService.update(
      newSettings,
    );

  setSettings(savedSettings);

  return savedSettings;
};

const changeAdminPassword = async (
  input: {
    currentPassword: string;
    newPassword: string;
  },
): Promise<void> => {
  await authService.changePassword(input);
};

const changeAdminEmail = async (
  newEmail: string,
): Promise<void> => {
  await authService.changeEmail(newEmail);
};

const updateEmployeePermissions = async (
  employeeId: string,
  permissions: string[],
): Promise<Employee> => {
  const result =
    await employeeService.updatePermissions(
      employeeId,
      permissions,
    );

  setEmployees((previousEmployees) =>
    previousEmployees.map((employee) =>
      employee.id === employeeId
        ? result.employee
        : employee,
    ),
  );

  setCurrentUser((currentEmployee) =>
    currentEmployee?.id === employeeId
      ? result.employee
      : currentEmployee,
  );

  return result.employee;
};

useEffect(() => {
  if (currentUser) {
    void refreshSettings().catch(
      console.error,
    );
  }
}, [currentUser?.id]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateCashierPermissions = (perms: { [key: string]: boolean }) => {
    setCashierPermissions(perms);
  };

  const resolvedCashierPermissions =
  React.useMemo(() => {
    if (!currentUser) {
      return cashierPermissions;
    }

    if (currentUser.role === 'Admin') {
      return cashierPermissions;
    }

    const modules = [
      'pos',
      'discounts',
      'holdBills',
      'products',
      'categories',
      'customers',
      'offers',
      'inventory',
      'suppliers',
      'expenses',
      'receipts',
      'reports',
    ];

    const permissionMap: {
      [key: string]: boolean;
    } = {};

    const assignedPermissions =
      Array.isArray(
        currentUser.permissions,
      )
        ? currentUser.permissions
        : [];

    modules.forEach((module) => {
      permissionMap[module] =
        assignedPermissions.includes(
          module,
        );
    });

    return permissionMap;
  }, [
    currentUser,
    cashierPermissions,
  ]);

  const refreshInventory = async (): Promise<void> => {
    try {
      setInventoryLoading(true);

      const [itemsResult, movementsResult] =
        await Promise.all([
          supabase
            .from('inventory_items')
            .select('*')
            .order('created_at', {
              ascending: false
            }),

          supabase
            .from('inventory_movements')
            .select('*')
            .order('created_at', {
              ascending: false
            })
            .limit(100)
        ]);

      if (itemsResult.error) {
        throw itemsResult.error;
      }

      if (movementsResult.error) {
        throw movementsResult.error;
      }

      setInventoryItems(
        (itemsResult.data || []).map(mapInventoryItem)
      );

      setInventoryMovements(
        (movementsResult.data || []).map(
          mapInventoryMovement
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load inventory.';

      console.error('Inventory loading error:', message);

      throw new Error(message);
    } finally {
      setInventoryLoading(false);
    }
  };
  const addInventoryItem = async (
    item: CreateInventoryItemInput
  ): Promise<void> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        name: item.name.trim(),
        category: item.category.trim(),
        stock: item.stock,
        low_stock_alert: item.lowStockAlert,
        unit: item.unit.trim(),
        sku: item.sku?.trim() || null,
        price: item.price,
        status: item.status || 'Active'
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const createdItem = mapInventoryItem(data);

    setInventoryItems(previous => [
      createdItem,
      ...previous
    ]);
  };
  const updateInventoryItem = async (
    id: string,
    item: UpdateInventoryItemInput
  ): Promise<void> => {
    const updateData: Record<string, unknown> = {};

    if (item.name !== undefined) {
      updateData.name = item.name.trim();
    }

    if (item.category !== undefined) {
      updateData.category = item.category.trim();
    }

    if (item.lowStockAlert !== undefined) {
      updateData.low_stock_alert =
        item.lowStockAlert;
    }

    if (item.unit !== undefined) {
      updateData.unit = item.unit.trim();
    }

    if (item.sku !== undefined) {
      updateData.sku = item.sku.trim() || null;
    }

    if (item.price !== undefined) {
      updateData.price = item.price;
    }

    if (item.status !== undefined) {
      updateData.status = item.status;
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const updatedItem = mapInventoryItem(data);

    setInventoryItems(previous =>
      previous.map(current =>
        current.id === id
          ? updatedItem
          : current
      )
    );
  };
  const deleteInventoryItem = async (
    id: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    setInventoryItems(previous =>
      previous.filter(item => item.id !== id)
    );
  };
  const adjustInventoryStock = async (
    inventoryItemId: string,
    movementType: InventoryMovementType,
    quantity: number,
    reason?: string
  ): Promise<void> => {
    if (quantity <= 0) {
      throw new Error(
        'Quantity must be greater than zero.'
      );
    }

    const { data, error } = await supabase.rpc(
      'adjust_inventory_stock',
      {
        p_inventory_item_id: inventoryItemId,
        p_movement_type: movementType,
        p_quantity: quantity,
        p_reason: reason?.trim() || null
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    const newStock = Number(data);

    setInventoryItems(previous =>
      previous.map(item =>
        item.id === inventoryItemId
          ? {
            ...item,
            stock: newStock,
            updatedAt: new Date().toISOString()
          }
          : item
      )
    );

    const { data: movementData } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .order('created_at', {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (movementData) {
      const movement =
        mapInventoryMovement(movementData);

      setInventoryMovements(previous => [
        movement,
        ...previous.filter(
          item => item.id !== movement.id
        )
      ]);
    }
  };
  useEffect(() => {
    if (currentUser) {
      void refreshInventory().catch(error => {
        console.error(
          'Inventory loading failed:',
          error
        );
      });
    } else {
      setInventoryItems([]);
      setInventoryMovements([]);
    }
  }, [currentUser?.id]);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      authLoading,

      // Navigation
      activeView,
      setActiveView,

      // Cart and POS
      cart,
      cartOrderType,
      setCartOrderType,
      cartDiscount,
      setCartDiscount,
      selectedCustomer,
      setSelectedCustomer,
      addToCart,
      addComboToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,

      // Receipt
      activeReceiptOrder,
      setActiveReceiptOrder,

      // Payment modal
      isPaymentModalOpen,
      setIsPaymentModalOpen,
      processPayment,

      // PIN modal
      isPinModalOpen,
      setIsPinModalOpen,
      loginWithPin,

      // Search
      isSearchOpen,
      setIsSearchOpen,
      searchQuery,
      setSearchQuery,

      // Held orders
      heldOrders,
      holdCurrentCart,
      resumeHeldOrder,
      deleteHeldOrder,

      // Main data
      products,
      categories,
      orders,
      ordersLoading,
      customers,
      offers,
      combos,
      
      expenses,
      settings,
      notifications,

      // Separate inventory backend
      inventoryItems,
      inventoryMovements,
      inventoryLoading,
      refreshInventory,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      adjustInventoryStock,

      // Order backend
      refreshOrders,
      updateOrder,
      updateOrderStatus,
      updateOrderPaymentStatus,
      deactivateOrder,
      restoreOrder,
      permanentlyDeleteOrder,

      // Product backend
      addProduct,
      updateProduct,
      deleteProduct,
      refreshProducts,

      // Category backend
      addCategory,
      updateCategory,
      deleteCategory,
      refreshCategories,

      // Customer backend
      addCustomer,
      updateCustomer,
      deleteCustomer,
      refreshCustomers,

      // Offer backend
      addOffer,
      updateOffer,
      deleteOffer,

      // Combo functions
      addCombo,
      updateCombo,
      deleteCombo,

      // Supplier backend
      suppliers,
      suppliersLoading,
      refreshSuppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,

      // Employee functions
      employees,
      employeesLoading,
      refreshEmployees,
      addEmployee,
      updateEmployee,
      setEmployeeStatus,

      // Expense functions
expensesLoading,
refreshExpenses,
addExpense,
updateExpense,
deleteExpense,

      // Settings
settingsLoading,
refreshSettings,
updateSettings,
changeAdminPassword,
changeAdminEmail,
updateEmployeePermissions,

      // Authentication functions
      loginWithCredentials,
      requestPasswordReset,
      logout,

      // Product price
      getProductPrice,

      // Notifications
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,

      // Salary
      // Salary functions
      // Salary functions
salaries,
salariesLoading,
refreshSalaries,
addSalary,
updateSalary,
deleteSalary,

      // Permissions
      cashierPermissions:
        resolvedCashierPermissions,

      updateCashierPermissions
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};