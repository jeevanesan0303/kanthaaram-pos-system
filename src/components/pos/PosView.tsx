import React, { useState } from 'react';
import { 
  Coffee, CupSoda, Utensils, GlassWater, Cake, Sparkles, ShoppingBag, 
  Plus, Minus, Trash2, Search, Users, UserPlus, X, Check, Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderType } from '../../types';


export const PosView: React.FC = () => {
  const { 
    products, categories, orders, cart, cartOrderType, setCartOrderType, 
    cartDiscount, setCartDiscount, addToCart, updateCartQuantity, 
    removeFromCart, clearCart, setIsPaymentModalOpen, settings,
    selectedCustomer, setSelectedCustomer, customers, addCustomer, getProductPrice,
    currentUser, cashierPermissions, combos, addComboToCart,
    heldOrders, holdCurrentCart, resumeHeldOrder, deleteHeldOrder
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [posSearch, setPosSearch] = useState('');

  const [customerSearchText, setCustomerSearchText] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isHoldPromptOpen, setIsHoldPromptOpen] = useState(false);
  const [holdNote, setHoldNote] = useState('');

  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustDob, setNewCustDob] = useState('');


  const [mobileError, setMobileError] = useState('');
  const [dobError, setDobError] = useState('');

  const currentDate = new Date();
  const today = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, '0'),
    String(currentDate.getDate()).padStart(2, '0')
  ].join('-');

  const safeText = (value: unknown): string =>
    String(value ?? '');

  const filteredCustomers = (customers || []).filter(c => {
    const searchText = customerSearchText.toLowerCase();

    return (
      safeText(c?.name).toLowerCase().includes(searchText) ||
      safeText(c?.mobile).includes(customerSearchText)
    );
  });

  const normalizePhone = (phone?: string): string =>
    (phone || '').replace(/\D/g, '');

  const getCustomerOrderSummary = (mobile: string) => {
    const customerPhone = normalizePhone(mobile);
    const customerOrders = orders.filter(order =>
      customerPhone !== '' &&
      normalizePhone(order.customerPhone) === customerPhone &&
      order.status !== 'Cancelled' &&
      order.paymentStatus === 'Paid'
    );

    return {
      orderCount: customerOrders.length,
      totalBill: customerOrders.reduce(
        (amount, order) => amount + Number(order.total || 0),
        0
      )
    };
  };

  const selectedCustomerSummary = selectedCustomer
    ? getCustomerOrderSummary(selectedCustomer.mobile)
    : { orderCount: 0, totalBill: 0 };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
  e.preventDefault();

  const customerName = newCustName.trim();
  const customerMobile = newCustMobile.replace(/\D/g, '');

  setMobileError('');
  setDobError('');

  let hasError = false;

  if (!customerName) {
    return;
  }

  // Sri Lankan phone number: exactly 10 digits starting with 0
  if (!/^0\d{9}$/.test(customerMobile)) {
    setMobileError(
      'Enter a valid 10-digit phone number starting with 0.'
    );
    hasError = true;
  }

  // Check whether the phone number already belongs to a customer
  const phoneAlreadyExists = customers.some(
    customer =>
      normalizePhone(customer.mobile) === customerMobile
  );

  if (phoneAlreadyExists) {
    setMobileError(
      'A customer with this phone number already exists.'
    );
    hasError = true;
  }

  if (!newCustDob) {
    setDobError('Date of birth is required.');
    hasError = true;
  } else {
    const selectedDob = new Date(`${newCustDob}T00:00:00`);
    const currentDate = new Date();
    const minimumDob = new Date('1900-01-01T00:00:00');

    if (Number.isNaN(selectedDob.getTime())) {
      setDobError('Enter a valid date of birth.');
      hasError = true;
    } else if (selectedDob > currentDate) {
      setDobError('Date of birth cannot be in the future.');
      hasError = true;
    } else if (selectedDob < minimumDob) {
      setDobError('Date of birth cannot be before 1900.');
      hasError = true;
    }
  }

  if (hasError) {
    return;
  }

  addCustomer({
    name: customerName,
    mobile: customerMobile,
    dob: newCustDob,
    email: `${customerName
      .toLowerCase()
      .replace(/\s+/g, '')}@gmail.com`,
    gender: 'Other',
    address: '',
    status: 'Active',
    photo: '',
    notes: ''
  });

  setNewCustName('');
  setNewCustMobile('');
  setNewCustDob('');
  setMobileError('');
  setDobError('');
  setIsAddCustomerModalOpen(false);
};

  // Category Icon Resolver
  const getCategoryIcon = (iconName?: string, name?: string) => {
    switch (name || iconName) {
      case 'Tea': return <Coffee className="w-4 h-4" />;
      case 'Coffee': return <CupSoda className="w-4 h-4" />;
      case 'Snacks': return <Utensils className="w-4 h-4" />;
      case 'Juice': return <GlassWater className="w-4 h-4" />;
      case 'Desserts': return <Cake className="w-4 h-4" />;
      case 'Combo': return <Sparkles className="w-4 h-4" />;
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    // Hide stock items that are not sellable (i.e. isStockItem is true and price is 0)
    if (p.isStockItem && p.price <= 0) return false;
    
    const matchesCat = selectedCategory === 'All' || (selectedCategory !== 'Combo Deals' && p.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(posSearch.toLowerCase()) || (p.barcode && p.barcode.includes(posSearch));
    return matchesCat && matchesSearch;
  });

  const parsePromoDate = (value: string): Date | null => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    const iso = parts[0].length === 4 ? value : `${parts[2]}-${parts[1]}-${parts[0]}`;
    const date = new Date(`${iso}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const activeCombos = (combos || []).filter(combo => {
    if (!combo || combo.status !== 'Active') return false;

    const start = parsePromoDate(
      safeText(combo.startDate)
    );
    const end = parsePromoDate(
      safeText(combo.endDate)
    );

    if (!start || !end) return false;

    const now = new Date();
    now.setHours(12, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const includedProducts = Array.isArray(combo.productsIncluded)
      ? combo.productsIncluded
      : [];

    const searchText = posSearch.toLowerCase();

    const matchesSearch =
      safeText(combo.name).toLowerCase().includes(searchText) ||
      includedProducts
        .map(item => safeText(item))
        .join(' ')
        .toLowerCase()
        .includes(searchText);

    return now >= start && now <= end && matchesSearch;
  });

  // Calculate Cart Totals
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // const tax = Math.round((subtotal * settings.taxPercentage / 100) * 100) / 100;
  const total = Math.max(0, subtotal - cartDiscount);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#FAF7F2]">
      {/* Left / Center Product Grid Section */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {/* Top Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-amber-400 text-amber-950 shadow-md scale-102'
                : 'bg-white text-gray-600 hover:bg-amber-50/50 border border-gray-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>All</span>
          </button>
          {(categories || []).filter(Boolean).map((cat) => {
            const categoryName = safeText(cat?.name);
            const isSelected =
              selectedCategory.toLowerCase() === categoryName.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(categoryName)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950 shadow-md scale-102'
                    : 'bg-white text-gray-600 hover:bg-amber-50/50 border border-gray-100'
                }`}
              >
                {getCategoryIcon(cat.iconName, categoryName)}
                <span>{categoryName || 'Uncategorised'}</span>
              </button>
            );
          })}
          {combos.length > 0 && (
            <button
              onClick={() => setSelectedCategory('Combo Deals')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'Combo Deals'
                  ? 'bg-amber-400 text-amber-950 shadow-md scale-102'
                  : 'bg-white text-gray-600 hover:bg-amber-50/50 border border-gray-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Combo Deals</span>
            </button>
          )}
        </div>

        {/* Local POS Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={posSearch}
            onChange={(e) => setPosSearch(e.target.value)}
            placeholder="Search items by name or scan barcode..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200/80 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>

        {/* Active Combo Deals from Supabase */}
        {(selectedCategory === 'All' || selectedCategory === 'Combo Deals') && activeCombos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-extrabold text-gray-800">Active Combo Deals</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {activeCombos.map(combo => (
                <div
                  key={combo.id}
                  onClick={() => addComboToCart(combo)}
                  className="bg-white rounded-2xl p-3 border border-amber-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                >
                  <span className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg">COMBO</span>
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-amber-50 flex items-center justify-center">
                    {combo.image ? <img src={combo.image} alt={safeText(combo.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Sparkles className="w-8 h-8 text-amber-300" />}
                  </div>
                  <h3 className="font-bold text-xs text-gray-900 line-clamp-1">{safeText(combo.name) || 'Combo Deal'}</h3>
                  <p className="text-[9px] text-gray-500 line-clamp-2 min-h-7 mt-1">{(Array.isArray(combo.productsIncluded)
                      ? combo.productsIncluded
                      : []
                    ).join(' + ')}</p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="font-extrabold text-xs text-amber-700 font-mono">{Number(combo.price).toFixed(2)}</span>
                    {Number(combo.discount) > 0 && <span className="text-[9px] font-bold text-emerald-600">{combo.discount}% OFF</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        {selectedCategory !== 'Combo Deals' && <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => {
            const cartItem = cart.find(ci => ci.product.id === product.id);
            const finalPrice = getProductPrice(product);
            const hasDiscount = finalPrice < product.price;
            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-2xl p-3 border border-gray-100/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {cartItem && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white font-extrabold text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in-50">
                    {cartItem.quantity}
                  </span>
                )}

                {hasDiscount && (
                  <span className="absolute top-2 left-2 bg-emerald-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-lg shadow-sm z-10 animate-pulse">
                    OFFER
                  </span>
                )}

                <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-amber-50/30">
                  <img
                    src={product.image || ""}
                    alt={safeText(product.name)}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-xs text-gray-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <span className="text-[10px] text-gray-400 line-through leading-none font-mono">
                          {product.price.toFixed(2)}
                        </span>
                      )}
                      <span className="font-extrabold text-xs text-amber-700 font-mono">
                        {finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}

        {selectedCategory !== 'Combo Deals' && filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-semibold text-gray-500">No products match your search/category.</p>
          </div>
        )}

        {selectedCategory === 'Combo Deals' && activeCombos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <Sparkles className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">No active combo deals right now.</p>
          </div>
        )}
      </div>

      {/* Right Side Order Panel */}
      <div className="w-96 bg-white border-l border-gray-200/70 p-5 flex flex-col justify-between h-full shadow-lg shrink-0">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-gray-900 font-serif">
                Current Order
              </h2>
              {heldOrders && heldOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHeldModalOpen(true)}
                  className="bg-amber-100 text-amber-955 hover:bg-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-200 cursor-pointer animate-pulse shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                  <span>{heldOrders.length} Held</span>
                </button>
              )}
            </div>
            
            {/* Order Type Selector Pills */}
            <div className="flex bg-amber-50 p-1 rounded-xl border border-amber-200/60">
              {(['Takeaway', 'Dine In'] as OrderType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setCartOrderType(type)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    cartOrderType === type
                      ? 'bg-amber-400 text-amber-950 shadow-2xs'
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Selection & Search */}
          <div className="py-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" /> Customer
              </span>
              {!selectedCustomer && (
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline text-[10px]"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Customer
                </button>
              )}
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between gap-2 p-2 bg-amber-50/50 border border-amber-100 rounded-xl">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {selectedCustomer.name}
                    </p>
                    <span
                      className="shrink-0 min-w-5 h-5 px-1.5 bg-amber-400 text-amber-950 rounded-full text-[9px] font-black flex items-center justify-center"
                      title={`${selectedCustomerSummary.orderCount} paid orders`}
                    >
                      {selectedCustomerSummary.orderCount}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800 font-semibold truncate">
                    {selectedCustomer.mobile}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right px-2 py-1 bg-white border border-amber-100 rounded-lg shadow-3xs">
                   
                    <p className="text-[10px] font-black text-amber-800 font-mono">
                      {selectedCustomerSummary.orderCount}
                    </p>
                  </div>
             
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 rounded-full hover:bg-amber-100 text-amber-700 transition-colors"
                    title="Remove customer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={customerSearchText}
                  onChange={(e) => {
                    setCustomerSearchText(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
                />

                {isCustomerDropdownOpen && customerSearchText && (
                  <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-25 p-1.5 space-y-1">
                    {filteredCustomers.map(c => {
                      const summary = getCustomerOrderSummary(c.mobile);

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearchText('');
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="p-2 hover:bg-amber-50/50 rounded-lg cursor-pointer text-xs flex justify-between items-center gap-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 block truncate">{c.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{c.mobile}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold">
                              {summary.orderCount} Orders
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold font-mono">
                              {summary.totalBill.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredCustomers.length === 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-2 font-medium">No matching customers found</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="py-4 space-y-3 max-h-[calc(100vh-27rem)] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-2xl border border-gray-100/80 hover:bg-amber-50/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      {item.quantity} x <span className="font-mono">{item.price.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-gray-900 min-w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-bold text-xs text-gray-900 w-14 text-right font-mono">
                    {(item.price * item.quantity).toFixed(2)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-semibold">Your order is empty</p>
                <p className="text-[10px]">Select items from the menu to start</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary & Checkout Buttons */}
        <div className="pt-4 border-t border-gray-100 space-y-3 bg-white">
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900 font-mono">{subtotal.toFixed(2)}</span>
            </div>
                  <div className="flex justify-between font-medium text-emerald-600">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <span className="font-mono">-</span>
                <input
                  type="number"
                  value={cartDiscount}
                  onChange={(e) => setCartDiscount(Number(e.target.value))}
                  disabled={currentUser?.role === 'Cashier' && !cashierPermissions.discounts}
                  className="w-14 text-right bg-emerald-50 border border-emerald-200 rounded px-1 text-xs font-bold text-emerald-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
              </div>
            </div>

            

            <div className="flex justify-between font-extrabold text-base text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-amber-800 text-lg font-mono">{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setIsHoldPromptOpen(true)}
              disabled={cart.length === 0 || (currentUser?.role === 'Cashier' && !cashierPermissions.holdBills)}
              className="py-3 px-4 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Hold Order
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="py-3 px-4 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              Pay <span className="font-mono">{total.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
      {/* Quick Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-5 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-xs text-gray-900 font-serif">Quick Add Customer</h3>
              <button 
                type="button" 
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Nair"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
             <div>
  <label className="text-[10px] font-bold text-gray-700 block mb-1">
    Mobile Number *
  </label>

  <input
    type="tel"
    required
    inputMode="numeric"
    maxLength={10}
    placeholder="e.g. 0771234567"
    value={newCustMobile}
    onChange={(e) => {
      const digitsOnly = e.target.value
        .replace(/\D/g, '')
        .slice(0, 10);

      setNewCustMobile(digitsOnly);

      if (mobileError) {
        setMobileError('');
      }
    }}
    className={`w-full p-2 bg-gray-50 border rounded-xl text-xs focus:outline-none ${
      mobileError
        ? 'border-red-400 focus:ring-1 focus:ring-red-400'
        : 'border-gray-200 focus:ring-1 focus:ring-amber-400'
    }`}
  />

  {mobileError && (
    <p className="mt-1 text-[10px] font-semibold text-red-600">
      {mobileError}
    </p>
  )}
</div>
             <div>
  <label className="text-[10px] font-bold text-gray-700 block mb-1">
    Date of Birth *
  </label>

  <input
    type="date"
    required
    min="1900-01-01"
    max={today}
    value={newCustDob}
    onChange={(e) => {
      setNewCustDob(e.target.value);

      if (dobError) {
        setDobError('');
      }
    }}
    className={`w-full p-2 bg-gray-50 border rounded-xl text-xs focus:outline-none text-gray-700 ${
      dobError
        ? 'border-red-400 focus:ring-1 focus:ring-red-400'
        : 'border-gray-200 focus:ring-1 focus:ring-amber-400'
    }`}
  />

  {dobError && (
    <p className="mt-1 text-[10px] font-semibold text-red-600">
      {dobError}
    </p>
  )}
</div>
              <button
                type="submit"
                className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 pt-2"
              >
                <Check className="w-3.5 h-3.5" /> Save & Select
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-gray-150 animate-in fade-in zoom-in-95 duration-150 relative space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-extrabold text-sm text-gray-900 font-serif">Held Orders</h3>
              <button 
                type="button" 
                onClick={() => setIsHeldModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {heldOrders && heldOrders.length > 0 ? (
                heldOrders.map((h) => (
                  <div 
                    key={h.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between hover:border-amber-300 transition-colors group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-xs text-gray-950 truncate">{h.notes}</p>
                      <p className="text-[10px] text-gray-450 mt-0.5 font-mono">{h.time} • {h.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                      <p className="text-[10px] text-amber-800 font-bold font-mono mt-0.5">
                        {h.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          resumeHeldOrder(h.id);
                          setIsHeldModalOpen(false);
                        }}
                        className="px-2.5 py-1.5 bg-[#2D7D46] hover:bg-[#236337] text-white text-[10px] font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteHeldOrder(h.id)}
                        className="p-1.5 text-gray-405 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-450 font-medium">
                  No held orders.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hold Order Prompt Modal */}
      {isHoldPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-5 border border-gray-150 animate-in fade-in zoom-in-95 duration-150 space-y-4 text-left">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 font-serif">Hold Order</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Add a table name or reference note to help identify this held bill later.</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">Reference / Table Note</label>
                <input
                  type="text"
                  placeholder="e.g. Table 4, Takeaway #5"
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsHoldPromptOpen(false);
                    setHoldNote('');
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    holdCurrentCart(holdNote || `Held Order #${heldOrders.length + 1}`);
                    setIsHoldPromptOpen(false);
                    setHoldNote('');
                  }}
                  className="flex-1 py-2 bg-[#2D7D46] hover:bg-[#236337] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Hold Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};