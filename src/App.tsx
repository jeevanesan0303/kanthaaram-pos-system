import React from 'react';
import { OfflineBanner } from './components/common/OfflineBanner';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { PinLoginModal } from './components/auth/PinLoginModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { OrdersView } from './components/orders/OrdersView';
import { DeactivatedOrdersView } from './components/orders/deactivateorders';
import { CustomersView } from './components/customers/CustomersView';
import { ProductsView } from './components/products/ProductsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { OffersView } from './components/offers/OffersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { EmployeesView } from './components/employees/EmployeesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { InventoryView } from './components/inventory/InventoryView';
import { SettingsView } from './components/settings/SettingsView';
import { SalaryView } from './components/salary/SalaryView';

import { PaymentModal } from './components/pos/PaymentModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { ActiveView } from './types';
import { ThemeProvider } from './context/ThemeContext';
const AppContent: React.FC = () => {
  if (window.location.pathname === "/reset-password") return <ResetPasswordPage />;
  const {
  currentUser,
  activeView,
  cashierPermissions,
  authLoading
} = useApp();
if (authLoading) {
  return (
    <div className="h-screen w-screen bg-[#FAF4E8]
      flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4
          border-emerald-700 border-t-transparent
          rounded-full animate-spin mx-auto"
        />

        <p className="mt-3 text-sm font-bold
          text-emerald-900">
          Checking secure session...
        </p>
      </div>
    </div>
  );
}
  if (!currentUser) {
    return (
      <>
        <OfflineBanner />
        <LoginPage />
        <PinLoginModal />
      </>
    );
  }


  const permissionForView: Partial<
  Record<ActiveView, string>
> = {
  pos: 'pos',
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

const getFirstAllowedView = (): ActiveView => {
  const fallbackOrder: ActiveView[] = [
    'pos',
    'orders',
    'deactivatedOrders',
    'customers',
    'categories',
    'products',
    'offers',
    'inventory',
    'suppliers',
    'expenses',
    'reports',
  ];

  const allowedView = fallbackOrder.find(
    (view) => {
      const permission =
        permissionForView[view];

      return (
        permission !== undefined &&
        Boolean(
          cashierPermissions[permission],
        )
      );
    },
  );

  return allowedView ?? 'pos';
};

const canAccessView = (
  view: ActiveView,
): boolean => {
  if (currentUser.role === 'Admin') {
    return true;
  }

  // These pages are available only to administrators.
  if (
    view === 'dashboard' ||
    view === 'deactivatedOrders' ||
    view === 'employees' ||
    view === 'salary' ||
    view === 'settings'
  ) {
    return false;
  }

  const permission =
    permissionForView[view];

  if (!permission) {
    return false;
  }

  return Boolean(
    cashierPermissions[permission],
  );
};

const safeActiveView: ActiveView =
  canAccessView(activeView)
    ? activeView
    : getFirstAllowedView();

const renderView = () => {
  switch (safeActiveView) {
    case 'dashboard':
      return <DashboardView />;

    case 'pos':
      return <PosView />;

    case 'orders':
      return <OrdersView />;

    case 'deactivatedOrders':
      return <DeactivatedOrdersView />;

    case 'customers':
      return <CustomersView />;

    case 'products':
      return <ProductsView />;

    case 'categories':
      return <CategoriesView />;

    case 'offers':
      return <OffersView />;

    case 'suppliers':
      return <SuppliersView />;

    case 'employees':
      return <EmployeesView />;

    case 'expenses':
      return <ExpensesView />;

    case 'reports':
      return <ReportsView />;

    case 'inventory':
      return <InventoryView />;

    case 'settings':
      return <SettingsView />;

    case 'salary':
      return <SalaryView />;

    default:
      return <PosView />;
  }
};

  return (
    <div className="app-shell flex h-screen bg-[#FAF7F2] font-sans antialiased text-gray-900 overflow-hidden select-none">
      <OfflineBanner />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      {/* Global Modals */}
      <PinLoginModal />
      <GlobalSearchModal />
      <PaymentModal />
      <ReceiptModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
