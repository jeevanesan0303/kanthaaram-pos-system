import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Users,
  Package,
  Layers,
  Tag,
  Truck,
  UserCheck,
  BarChart3,
  Receipt,
  Settings,
  LogOut,
  CupSoda,
  Wallet,
  PackageCheck,
  ArchiveX,
  Menu,
  PanelLeftClose
} from 'lucide-react';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveView } from '../../types';
import logoImg from '../../assets/logo.jpg';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    <aside
  className={`kanthaaram-sidebar bg-[#042418] border-r border-[#0B3D2B] flex flex-col justify-between h-screen sticky top-0 select-none overflow-y-auto overflow-x-hidden shadow-lg transition-all duration-300 ease-in-out ${
    isCollapsed ? 'w-[72px]' : 'w-60'
  }`}
>
      {/* Brand Header */}
<div
  className={`p-4 flex items-center border-b border-[#0B3D2B]/60 bg-[#031d13]/50 ${
    isCollapsed ? 'justify-center' : 'justify-between'
  }`}
>
  {!isCollapsed && (
    <div className="flex items-center gap-2.5 min-w-0">
      <img
        src={logoImg}
        alt="Kanthaaram Logo"
        className="w-9 h-9 rounded-full object-cover shadow-sm border border-[#0B3D2B] shrink-0"
      />

      <span className="font-extrabold text-base tracking-tight text-white font-serif whitespace-nowrap">
        காந்தாரம்
      </span>
    </div>
  )}

  <button
    type="button"
    onClick={() => setIsCollapsed(!isCollapsed)}
    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    className="flex items-center justify-center w-9 h-9 shrink-0 rounded-lg text-emerald-300 hover:text-[#F9C032] hover:bg-[#073623] transition-all duration-200 cursor-pointer"
  >
    {isCollapsed ? (
      <Menu className="w-5 h-5" />
    ) : (
      <PanelLeftClose className="w-5 h-5" />
    )}
  </button>
</div>

    {/* Navigation Section */}
<div className={`py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
  {!isCollapsed && (
    <p className="px-3 text-[10px] font-bold text-emerald-400/50 tracking-wider uppercase mb-2">
      MAIN MENU
    </p>
  )}

  <nav className="space-y-1">
    {filteredNavItems.map((item) => {
      const isActive = activeView === item.id;

      return (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          title={isCollapsed ? item.label : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
          } py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-[#F9C032] text-amber-950 shadow-sm font-bold'
              : 'text-emerald-100/70 hover:bg-[#073623] hover:text-white'
          }`}
        >
          <span
            className={
              isActive
                ? 'text-amber-950 shrink-0'
                : 'text-emerald-300 shrink-0'
            }
          >
            {item.icon}
          </span>

          {!isCollapsed && (
            <span className="truncate">{item.label}</span>
          )}
        </button>
      );
    })}
  </nav>
</div>

      {/* Bottom Actions & Profile */}
<div className={`p-3 space-y-3 ${isCollapsed ? 'px-2' : ''}`}>
  <button
    onClick={logout}
    title={isCollapsed ? 'Logout' : undefined}
    aria-label="Logout"
    className={`w-full flex items-center ${
      isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
    } py-2.5 rounded-xl text-xs font-bold text-emerald-100/70 hover:bg-red-950/40 hover:text-red-400 transition-all duration-200 cursor-pointer`}
  >
    <LogOut className="w-4 h-4 text-emerald-300 shrink-0" />

    {!isCollapsed && <span>Logout</span>}
  </button>

  {/* User Info */}
  <div
    title={isCollapsed ? currentUser?.name || 'User' : undefined}
    className={`flex items-center ${
      isCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2'
    } bg-[#031d13] rounded-xl border border-[#0B3D2B]`}
  >
    <img
      src={
        currentUser?.photo ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
      }
      alt={currentUser?.name || 'User'}
      className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
    />

    {!isCollapsed && (
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate font-sans">
          {currentUser?.name || 'Arun Kumar'}
        </p>

        <p className="text-[10px] text-emerald-300/70 truncate">
          {currentUser?.role === 'Admin'
            ? 'Administrator'
            : currentUser?.role || 'Staff'}
        </p>
      </div>
    )}
  </div>
</div>
    </aside>
  );
};
