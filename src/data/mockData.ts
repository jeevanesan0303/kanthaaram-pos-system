import { Product, Category, Customer, Order, ComboOffer, Offer, Supplier, Employee, Expense, StoreSettings, NotificationItem, SalaryRecord } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Kaanthaaram Tea',
    category: 'Tea',
    price: 20.00,
    purchasePrice: 8.00,
    stock: 100,
    lowStockAlert: 15,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400',
    barcode: '8901001',
    sku: 'TEA-KT-001',
    description: 'Signature spiced Kaanthaaram special tea brewed with authentic secret spices.',
    tax: 5,
    unit: 'Cup',
    status: 'Active'
  },
  {
    id: 'prod-2',
    name: 'Masala Tea',
    category: 'Tea',
    price: 25.00,
    purchasePrice: 9.00,
    stock: 80,
    lowStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&q=80&w=400',
    barcode: '8901002',
    sku: 'TEA-MS-002',
    description: 'Rich cardamom and ginger infused traditional masala chai.',
    tax: 5,
    unit: 'Cup',
    status: 'Active'
  },
  {
    id: 'prod-3',
    name: 'Ginger Tea',
    category: 'Tea',
    price: 25.00,
    purchasePrice: 9.00,
    stock: 60,
    lowStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=400',
    barcode: '8901003',
    sku: 'TEA-GG-003',
    description: 'Refreshing tea steeped with fresh hand-crushed ginger roots.',
    tax: 5,
    unit: 'Cup',
    status: 'Active'
  },
  {
    id: 'prod-4',
    name: 'Lemon Tea',
    category: 'Tea',
    price: 20.00,
    purchasePrice: 6.00,
    stock: 70,
    lowStockAlert: 12,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400',
    barcode: '8901004',
    sku: 'TEA-LM-004',
    description: 'Citrus infused black tea with fresh mint and lemon drops.',
    tax: 5,
    unit: 'Cup',
    status: 'Active'
  },
  {
    id: 'prod-5',
    name: 'Green Tea',
    category: 'Tea',
    price: 20.00,
    purchasePrice: 7.00,
    stock: 90,
    lowStockAlert: 15,
    image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=400',
    barcode: '8901005',
    sku: 'TEA-GT-005',
    description: 'Antioxidant rich organic leaf green tea brewed fresh.',
    tax: 5,
    unit: 'Cup',
    status: 'Active'
  },
  {
    id: 'prod-6',
    name: 'Black Coffee',
    category: 'Coffee',
    price: 40.00,
    purchasePrice: 15.00,
    stock: 50,
    lowStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
    barcode: '8902001',
    sku: 'COF-BK-001',
    description: 'Strong single origin dark roasted espresso coffee.',
    tax: 5,
    unit: 'Cup',
    status: 'Active'
  },
  {
    id: 'prod-7',
    name: 'Milk Coffee',
    category: 'Coffee',
    price: 40.00,
    purchasePrice: 16.00,
    stock: 45,
    lowStockAlert: 8,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=400',
    barcode: '8902002',
    sku: 'COF-MK-002',
    description: 'Creamy filter coffee topped with velvety foam.',
    tax: 5,
    unit: 'Cup',
    status: 'Active'
  },
  {
    id: 'prod-8',
    name: 'Veg Sandwich',
    category: 'Snacks',
    price: 60.00,
    purchasePrice: 25.00,
    stock: 30,
    lowStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=400',
    barcode: '8903001',
    sku: 'SNK-VS-001',
    description: 'Fresh grilled sandwich loaded with spiced garden vegetables and chutney.',
    tax: 5,
    unit: 'Plate',
    status: 'Active'
  },
  {
    id: 'prod-9',
    name: 'Samosa',
    category: 'Snacks',
    price: 20.00,
    purchasePrice: 7.00,
    stock: 50,
    lowStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400',
    barcode: '8903002',
    sku: 'SNK-SM-002',
    description: 'Crisp fried savory pastry with seasoned potato peas filling.',
    tax: 5,
    unit: 'Piece',
    status: 'Active'
  },
  {
    id: 'prod-10',
    name: 'Brownie',
    category: 'Desserts',
    price: 50.00,
    purchasePrice: 20.00,
    stock: 25,
    lowStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400',
    barcode: '8904001',
    sku: 'DES-BR-001',
    description: 'Rich dark chocolate fudgy brownie slice.',
    tax: 5,
    unit: 'Piece',
    status: 'Active'
  },
  {
    id: 'prod-11',
    name: 'Mango Fresh Juice',
    category: 'Juice',
    price: 50.00,
    purchasePrice: 20.00,
    stock: 40,
    lowStockAlert: 8,
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=400',
    barcode: '8905001',
    sku: 'JUC-MG-001',
    description: 'Pure Alphonso mango pulp juice chilled with ice.',
    tax: 5,
    unit: 'Glass',
    status: 'Active'
  },
  {
    id: 'prod-12',
    name: 'Special Tea Combo Pack',
    category: 'Combo',
    price: 90.00,
    purchasePrice: 35.00,
    stock: 20,
    lowStockAlert: 4,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400',
    barcode: '8906001',
    sku: 'CMB-ST-001',
    description: '2 Kaanthaaram Tea + 1 Veg Sandwich + 1 Samosa special snack deal.',
    tax: 5,
    unit: 'Combo',
    status: 'Active'
  },
  {
    id: 'stock-1',
    name: 'Milk Packets',
    category: 'Ingredients',
    price: 0,
    purchasePrice: 45.00,
    stock: 8,
    lowStockAlert: 15,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400',
    barcode: '',
    sku: 'STK-MLK-001',
    description: 'Fresh milk packets purchased for tea & coffee brewing.',
    tax: 0,
    unit: 'Packets',
    status: 'Active',
    isStockItem: true
  },
  {
    id: 'stock-2',
    name: 'Biscuit Packets',
    category: 'Snacks',
    price: 30.00,
    purchasePrice: 18.00,
    stock: 5,
    lowStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1558961309-db0f1774373c?auto=format&fit=crop&q=80&w=400',
    barcode: '8903003',
    sku: 'STK-BSC-002',
    description: 'Marie / Chocolate biscuits packets for retail sale.',
    tax: 5,
    unit: 'Packets',
    status: 'Active',
    isStockItem: true
  },
  {
    id: 'stock-3',
    name: 'Tea Powder',
    category: 'Ingredients',
    price: 0,
    purchasePrice: 280.00,
    stock: 3,
    lowStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=400',
    barcode: '',
    sku: 'STK-PWD-003',
    description: 'Premium black tea powder for brewing.',
    tax: 0,
    unit: 'kg',
    status: 'Active',
    isStockItem: true
  },
  {
    id: 'stock-4',
    name: 'Sugar',
    category: 'Ingredients',
    price: 0,
    purchasePrice: 60.00,
    stock: 12,
    lowStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=400',
    barcode: '',
    sku: 'STK-SGR-004',
    description: 'Refined sugar for sweetening beverages.',
    tax: 0,
    unit: 'kg',
    status: 'Active',
    isStockItem: true
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Tea',
    description: 'All types of tea',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300',
    productsCount: 15,
    status: 'Active',
    iconName: 'Coffee'
  },
  {
    id: 'cat-2',
    name: 'Coffee',
    description: 'Hot & Cold Coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=300',
    productsCount: 8,
    status: 'Active',
    iconName: 'CupSoda'
  },
  {
    id: 'cat-3',
    name: 'Snacks',
    description: 'Snacks & Bites',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
    productsCount: 12,
    status: 'Active',
    iconName: 'Utensils'
  },
  {
    id: 'cat-4',
    name: 'Juice',
    description: 'Fresh Juices',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=300',
    productsCount: 6,
    status: 'Active',
    iconName: 'GlassWater'
  },
  {
    id: 'cat-5',
    name: 'Desserts',
    description: 'Sweets & Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300',
    productsCount: 5,
    status: 'Active',
    iconName: 'Cake'
  },
  {
    id: 'cat-6',
    name: 'Combo',
    description: 'Value Meals & Offers',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300',
    productsCount: 4,
    status: 'Active',
    iconName: 'Sparkles'
  },
  {
    id: 'cat-7',
    name: 'Merchandise',
    description: 'Tea leaves, Mugs & Pots',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300',
    productsCount: 10,
    status: 'Active',
    iconName: 'ShoppingBag'
  },
  {
    id: 'cat-8',
    name: 'Ingredients',
    description: 'Raw materials & ingredients inventory',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300',
    productsCount: 4,
    status: 'Active',
    iconName: 'PackageCheck'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: '#KT2507',
    customerName: 'Arun Kumar',
    customerPhone: '9876543210',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1, price: 20.00 },
      { product: INITIAL_PRODUCTS[1], quantity: 1, price: 25.00 },
      { product: INITIAL_PRODUCTS[7], quantity: 1, price: 60.00 }
    ],
    subtotal: 105.00,
    discount: 5.00,
    tax: 5.00,
    total: 105.00,
    type: 'Takeaway',
    status: 'Completed',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    time: '05:15 PM',
    date: '23 Jul 2026',
    createdAt: '2026-07-23T12:00:00+05:30',
    cashierName: 'Arun Kumar'
  },
  {
    id: '#KT2506',
    customerName: 'Priya Nair',
    customerPhone: '9123456780',
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 2, price: 25.00 },
      { product: INITIAL_PRODUCTS[8], quantity: 1, price: 20.00 }
    ],
    subtotal: 85.00,
    discount: 5.00,
    tax: 5.00,
    total: 85.00,
    type: 'Dine In',
    status: 'Preparing',
    paymentMethod: 'QR',
    paymentStatus: 'Paid',
    time: '04:42 PM',
    date: '23 Jul 2026',
    createdAt: '2026-07-23T12:00:00+05:30',
    cashierName: 'Arun Kumar'
  },
  {
    id: '#KT2505',
    customerName: 'Vivek S',
    customerPhone: '9988776655',
    items: [
      { product: INITIAL_PRODUCTS[7], quantity: 2, price: 60.00 }
    ],
    subtotal: 120.00,
    discount: 0.00,
    tax: 6.00,
    total: 120.00,
    type: 'Takeaway',
    status: 'Ready',
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    time: '03:30 PM',
    date: '23 Jul 2026',
    createdAt: '2026-07-23T12:00:00+05:30',
    cashierName: 'Arun Kumar'
  },
  {
    id: '#KT2504',
    customerName: 'Anjali Dev',
    customerPhone: '9034567890',
    items: [
      { product: INITIAL_PRODUCTS[9], quantity: 1, price: 50.00 },
      { product: INITIAL_PRODUCTS[2], quantity: 1, price: 25.00 }
    ],
    subtotal: 75.00,
    discount: 5.00,
    tax: 5.00,
    total: 75.00,
    type: 'Takeaway',
    status: 'On the way',
    paymentMethod: 'QR',
    paymentStatus: 'Paid',
    time: '02:15 PM',
    date: '23 Jul 2026',
    createdAt: '2026-07-23T12:00:00+05:30',
    cashierName: 'Arun Kumar'
  },
  {
    id: '#KT2503',
    customerName: 'Rahul R',
    customerPhone: '9847001122',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1, price: 25.00 }
    ],
    subtotal: 25.00,
    discount: 0.00,
    tax: 1.25,
    total: 25.00,
    type: 'Dine In',
    status: 'Completed',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    time: '01:10 PM',
    date: '23 Jul 2026',
    createdAt: '2026-07-23T12:00:00+05:30',
    cashierName: 'Arun Kumar'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    name: 'Arun Kumar',
    mobile: '9876543210',
    email: 'arun.kumar@gmail.com',
    dob: '15-04-1990',
    gender: 'Male',
    address: '12 Green Park, Munnar',
    walletBalance: 450.00,
    totalOrders: 25,
    totalSpent: 2450.00,
    status: 'Active',
    createdAt: '2026-01-10'
  },
  {
    id: 'cust-2',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    name: 'Priya Nair',
    mobile: '9123456780',
    email: 'priya.nair@gmail.com',
    dob: '22-07-1995',
    gender: 'Female',
    address: '45 Lake View Road, Munnar',
    walletBalance: 200.00,
    totalOrders: 18,
    totalSpent: 1850.00,
    status: 'Active',
    createdAt: '2026-02-14'
  },
  {
    id: 'cust-3',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    name: 'Vivek S',
    mobile: '9988776655',
    email: 'vivek.s@gmail.com',
    dob: '10-11-1988',
    gender: 'Male',
    address: '88 Tea Garden Hills, Munnar',
    walletBalance: 600.00,
    totalOrders: 30,
    totalSpent: 3400.00,
    status: 'Active',
    createdAt: '2025-11-20'
  },
  {
    id: 'cust-4',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    name: 'Anjali Dev',
    mobile: '9034567890',
    email: 'anjali.dev@gmail.com',
    dob: '05-01-1993',
    gender: 'Female',
    address: '32 Resort Valley, Munnar',
    walletBalance: 50.00,
    totalOrders: 12,
    totalSpent: 980.00,
    status: 'Active',
    createdAt: '2026-03-01'
  }
];

export const INITIAL_OFFERS: Offer[] = [
  {
    id: 'off-1',
    name: 'Tea Time Offer',
    type: 'Flat',
    discount: 10,
    startDate: '01-08-2026',
    endDate: '30-08-2026',
    status: 'Active'
  },
  {
    id: 'off-2',
    name: 'Weekend Special',
    type: 'Percentage',
    discount: 15,
    startDate: '01-08-2026',
    endDate: '01-09-2026',
    status: 'Active'
  }
];

export const INITIAL_COMBOS: ComboOffer[] = [
  {
    id: 'combo-1',
    name: 'Combo Offer',
    productsIncluded: ['Kaanthaaram Tea', 'Veg Sandwich'],
    discount: 10,
    price: 70.00,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
    startDate: '01-08-2026',
    endDate: '31-08-2026',
    status: 'Active'
  },
  {
    id: 'combo-2',
    name: 'Buy 2 Get 1',
    productsIncluded: ['Ginger Tea'],
    discount: 33,
    price: 50.00,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=300',
    startDate: '01-08-2026',
    endDate: '25-08-2026',
    status: 'Active'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    companyName: 'Tea Leaves Co.',
    owner: 'Ramesh Sharma',
    phone: '9876501234',
    email: 'contact@tealeaves.com',
    address: 'Estate No 4, Nilgiri Hills',
    products: 'Tea, Coffee',
    quantitySupplied: '200 kg',
    buyingPrice: 12000.00,
    paymentType: 'Paid',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  {
    id: 'sup-2',
    companyName: 'Fresh Foods',
    owner: 'Suresh Kumar',
    phone: '9123405678',
    email: 'info@freshfoods.in',
    address: 'Industrial Estate, Cochin',
    products: 'Snacks, Juices',
    quantitySupplied: '150 packs',
    buyingPrice: 8500.00,
    paymentType: 'Paid',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  {
    id: 'sup-3',
    companyName: 'Daily Supplies',
    owner: 'Karan Menon',
    phone: '9988774455',
    email: 'orders@dailysupplies.in',
    address: 'Main Market, Munnar',
    products: 'Milk, Sugar, Cups',
    quantitySupplied: '500 Liters',
    buyingPrice: 22000.00,
    paymentType: 'Paid',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  {
    id: 'sup-4',
    companyName: 'Organic Farms',
    owner: 'Anita George',
    phone: '9034509876',
    email: 'organic@farms.org',
    address: 'High Range Farms, Devikulam',
    products: 'Tea Leaves',
    quantitySupplied: '300 kg',
    buyingPrice: 15000.00,
    paymentType: 'Paid',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [

  {
    id: 'emp-2',
    userType: 'POS Access',
    name: 'Kavya Rajesh',
    username: 'cashier1',
    email: 'cashier@kaanthaaram.com',
    phone: '9876500001',
    role: 'Cashier',
    pin: '5555',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    salary: 20000,
    gender: 'Female',
    workingType: 'Full-time',
    attendance: 'Present',
    status: 'Active',
    createdAt: '2025-03-15'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'Ingredients',
    amount: 1200.00,
    date: '2026-07-23',
    notes: 'Purchase of fresh mint leaves & lemons',
    createdAt: '2026-07-23T00:00:00Z',
    addedBy: 'Arun Kumar'
  },
  {
    id: 'exp-2',
    category: 'Utilities',
    amount: 3500.00,
    date: '2026-07-20',
    notes: 'Monthly Electricity & Water Bill',
    createdAt: '2026-07-23T00:00:00Z',
    addedBy: 'Arun Kumar'
  }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'காந்தாரம் TEA',
  address: '123, Tea Garden Road, Mulannar, Sri Lanka',
  phone: '+94 9876543210',
  email: 'info@kaanthaaramtea.com',
  logo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=200',
  banner: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=1200',
  currency: 'LKR',
  taxPercentage: 5,
  defaultDiscount: 0,
  receiptFooter: 'Thank You! Visit Again',
  enableNotifications: true,
  lowStockThreshold: 10,
  printerName: 'Thermal Receipt Printer (POS-80)',
  autoPrintReceipt: true,
  showLogoOnReceipt: true,
  showAddressOnReceipt: true,
  showPointsOnReceipt: true,
  showQrCodeOnReceipt: true,
  showCashierOnReceipt: true,
  showCustomerOnReceipt: true,
  showNotesOnReceipt: true,
  showPaymentMethodOnReceipt: true,
  showTaxBreakdownOnReceipt: true,
  receiptPaperWidth: '80mm',
  receiptFontSize: 'Standard',
  receiptHeaderTitle: 'காந்தாரம் TEA',
  receiptHeaderTagline: 'Pure Spiced Cardamom Chai'
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Low Stock Alert',
    message: 'Veg Sandwich stock is below 10 items (3 remaining).',
    type: 'stock',
    time: '10 mins ago',
    read: false
  },
  {
    id: 'notif-2',
    title: 'New Online Order',
    message: 'Order #KT2507 received for Takeaway.',
    type: 'order',
    time: '25 mins ago',
    read: false
  }
];

export const INITIAL_SALARIES: SalaryRecord[] = [
  {
    id: 'sal-1',
    employeeId: 'emp-2',
    employeeName: 'Kavya Rajesh',
    amount: 20000,
    date: '2026-07-25',
    createdAt: '2026-07-25T00:00:00Z',
    notes: 'July Monthly Salary Payment'
  },
  {
    id: 'sal-2',
    employeeId: 'emp-1',
    employeeName: 'Arun Kumar',
    amount: 35000,
    date: '2026-07-25',
    createdAt: '2026-07-25T00:00:00Z',
    notes: 'July Monthly Salary Payment'
  }
];
