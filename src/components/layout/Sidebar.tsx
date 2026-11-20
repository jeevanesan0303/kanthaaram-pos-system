import React from 'react';
import {
  LayoutDashboard, ShoppingBag, ClipboardList, Users, Package,
  Layers, Tag, Truck, UserCheck, BarChart3, Receipt, Settings,
  LogOut, CupSoda, Wallet, PackageCheck, ArchiveX
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveView } from '../../types';
import logoImg from '../../assets/logo.jpg';

export const Sidebar: React.FC = () => {
  const { currentUser, activeView, setActiveView, cashierPermissions, logout } = useApp();

  console.log('CASHIER PROFILE:', {
  name: currentUser?.name,
  role: currentUser?.role,
  permissions:
    currentUser?.permissions,
  resolvedPermissions:
    cashierPermissions,
});

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'pos', label: 'POS Sales', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'deactivatedOrders', label: 'Deactivated Orders', icon: <ArchiveX className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <Layers className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
    { id: 'inventory', label: 'Stock Management', icon: <PackageCheck className="w-4 h-4" /> },
    { id: 'offers', label: 'Offers', icon: <Tag className="w-4 h-4" /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck className="w-4 h-4" /> },
    { id: 'employees', label: 'Employees', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'salary', label: 'Salary', icon: <Wallet className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const permissionForView: Partial<
  Record<ActiveView, string>
> = {
  pos: 'pos',

  // Orders are included when POS access is allowed.
  orders: 'pos',
  deactivatedOrders: 'pos',

  customers: 'customers',
  categories: 'categories',
  products: 'products',
  inventory: 'inventory',
  offers: 'offers',
  suppliers: 'suppliers',
  reports: 'reports',
  expenses: 'expenses',
};

const assignedPermissions = new Set<string>(
  Array.isArray(currentUser?.permissions)
    ? currentUser.permissions
    : [],
);

const hasPermission = (
  permission: string,
): boolean => {
  /*
   * Individual permissions saved in staff_members
   * have priority.
   */
  if (
    currentUser?.permissions !== undefined
  ) {
    return assignedPermissions.has(
      permission,
    );
  }

  // Fallback to global permissions only when
  // the employee has no permissions property.
  return Boolean(
    cashierPermissions[permission],
  );
};

const filteredNavItems = navItems.filter(
  (item) => {
    if (!currentUser) {
      return false;
    }

    if (currentUser.role === 'Admin') {
      return true;
    }

    // Administrator-only pages
    if (
      item.id === 'dashboard' ||
      item.id === 'deactivatedOrders' ||
      item.id === 'employees' ||
      item.id === 'salary' ||
      item.id === 'settings'
    ) {
      return false;
    }

    const requiredPermission =
      permissionForView[item.id];

    if (!requiredPermission) {
      return false;
    }

    return hasPermission(
      requiredPermission,
    );
  },
);

  return (
    <aside className="w-60 bg-[#042418] border-r border-[#0B3D2B] flex flex-col justify-between h-screen sticky top-0 select-none overflow-y-auto shrink-0 shadow-xs">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex flex-col items-center justify-center border-b border-[#0B3D2B]/60 bg-[#031d13]/50">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="Logo"
              className="w-9 h-9 rounded-full object-cover shadow-xs border border-[#0B3D2B]"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white font-serif leading-none">
                காந்தாரம்
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <p className="px-3 text-[10px] font-bold text-emerald-400/50 tracking-wider uppercase mb-2">
            MAIN MENU
          </p>
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F9C032] text-amber-950 shadow-xs font-bold'
                      : 'text-emerald-100/70 hover:bg-[#073623] hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-amber-950' : 'text-emerald-300'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Bottom Actions & Profile */}
      <div className="p-3 space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-100/70 hover:bg-red-950/40 hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-emerald-300" />
          <span>Logout</span>
        </button>

        {/* User Info Bar */}
        <div className="flex items-center gap-3 p-2 bg-[#031d13] rounded-xl border border-[#0B3D2B]">
          <img
            src={currentUser?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
            alt={currentUser?.name || "User"}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate font-sans">
              {currentUser?.name || "Arun Kumar"}
            </p>
            <p className="text-[10px] text-emerald-300/70 truncate">
              {currentUser?.role === 'Admin' ? 'Administrator' : currentUser?.role || 'Staff'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
