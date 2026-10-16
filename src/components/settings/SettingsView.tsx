import React, { useEffect, useState } from 'react';
import { 
  Settings, Save, Printer, Shield, Eye, Award, ToggleLeft, Layers,
  ShoppingBag, Tag, ClipboardList, Package, Users, BarChart3, FileText,
  Truck, Receipt, Leaf, Sun, Moon, MonitorCog
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { ImageUploader } from '../common/ImageUploader';
import realStoreLogo from '../../images/logo.jpg';
import realQrCode from '../../images/qr.jpeg';

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 group focus:outline-none"
    >
      <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${checked ? 'bg-[#10B981]' : 'bg-gray-300'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className={`text-[10px] font-extrabold tracking-wide uppercase ${checked ? 'text-emerald-700' : 'text-gray-400'}`}>
        {checked ? 'Allowed' : 'Denied'}
      </span>
    </button>
  );
};

const MODULES = [
  { id: 'pos', title: 'Access POS Checkout', desc: 'Allow cashier to access the POS screen and process sales', icon: <ShoppingBag className="w-4 h-4 text-emerald-800" /> },
  { id: 'discounts', title: 'Apply Discounts', desc: 'Allow cashier to apply discounts during sales', icon: <Tag className="w-4 h-4 text-emerald-800" /> },
  { id: 'holdBills', title: 'Hold & Resume Bills', desc: 'Allow cashier to hold and resume orders', icon: <ClipboardList className="w-4 h-4 text-emerald-800" /> },
  { id: 'products', title: 'View Products', desc: 'Allow cashier to view product catalog and details', icon: <Package className="w-4 h-4 text-emerald-800" /> },
  { id: 'categories', title: 'Manage Categories', desc: 'Allow cashier to view and manage categories', icon: <Layers className="w-4 h-4 text-emerald-800" /> },
  { id: 'customers', title: 'Manage Customers', desc: 'Allow cashier to create and view customer details', icon: <Users className="w-4 h-4 text-emerald-800" /> },
  { id: 'offers', title: 'View Offers', desc: 'Allow cashier to view and apply active offers', icon: <Award className="w-4 h-4 text-emerald-800" /> },
  { id: 'inventory', title: 'Stock Management', desc: 'Allow cashier to view inventory and adjust stock levels', icon: <Package className="w-4 h-4 text-emerald-800" /> },
  { id: 'suppliers', title: 'Manage Suppliers', desc: 'Allow cashier to view supplier details', icon: <Truck className="w-4 h-4 text-emerald-800" /> },
  { id: 'expenses', title: 'Manage Expenses', desc: 'Allow cashier to view and record store expenses', icon: <Receipt className="w-4 h-4 text-emerald-800" /> },
  { id: 'receipts', title: 'Print Receipts', desc: 'Allow cashier to print sales receipts', icon: <FileText className="w-4 h-4 text-emerald-800" /> },
  { id: 'reports', title: 'View Reports', desc: 'Allow cashier to view basic reports', icon: <BarChart3 className="w-4 h-4 text-emerald-800" /> }
];

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const {
  settings,
  settingsLoading,
  updateSettings,
  changeAdminPassword,
  changeAdminEmail,
  cashierPermissions,
  updateCashierPermissions,
  updateEmployeePermissions,
  currentUser,
  employees,
} = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'receipt' | 'security'>('general');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

 const handleChangePassword = async (
  event: React.FormEvent<HTMLFormElement>,
): Promise<void> => {
  event.preventDefault();

  setPasswordError('');
  setPasswordSuccess('');

  if (!currentPassword) {
    setPasswordError(
      'Please enter your current password.',
    );
    return;
  }

  if (newPassword.length < 8) {
    setPasswordError(
      'The new password must contain at least 8 characters.',
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError(
      'New password and confirmation do not match.',
    );
    return;
  }

  if (currentPassword === newPassword) {
    setPasswordError(
      'The new password must be different from the current password.',
    );
    return;
  }

  setIsChangingPassword(true);

  try {
    await changeAdminPassword({
      currentPassword,
      newPassword,
    });

    setPasswordSuccess(
      'Administrator password updated successfully.',
    );

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch (error) {
    setPasswordError(
      error instanceof Error
        ? error.message
        : 'Unable to update the password.',
    );
  } finally {
    setIsChangingPassword(false);
  }
};

  // General Settings States
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState(settings.email);
  const [currency, setCurrency] = useState(settings.currency);
  const [logo, setLogo] = useState(settings.logo);
  const [banner, setBanner] = useState(settings.banner);

  // Receipt Customization States
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [printerName, setPrinterName] = useState(settings.printerName);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(settings.autoPrintReceipt);
  
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(settings.showLogoOnReceipt ?? true);
  const [showAddressOnReceipt, setShowAddressOnReceipt] = useState(settings.showAddressOnReceipt ?? true);
  const [showPointsOnReceipt, setShowPointsOnReceipt] = useState(settings.showPointsOnReceipt ?? true);
  const [showQrCodeOnReceipt, setShowQrCodeOnReceipt] = useState(settings.showQrCodeOnReceipt ?? true);
  const [showCashierOnReceipt, setShowCashierOnReceipt] = useState(settings.showCashierOnReceipt ?? true);
  const [showCustomerOnReceipt, setShowCustomerOnReceipt] = useState(settings.showCustomerOnReceipt ?? true);
  const [showNotesOnReceipt, setShowNotesOnReceipt] = useState(settings.showNotesOnReceipt ?? true);
  const [showPaymentMethodOnReceipt, setShowPaymentMethodOnReceipt] = useState(settings.showPaymentMethodOnReceipt ?? true);
  const [showTaxBreakdownOnReceipt, setShowTaxBreakdownOnReceipt] = useState(settings.showTaxBreakdownOnReceipt ?? true);
  
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'80mm' | '58mm'>(settings.receiptPaperWidth ?? '80mm');
  const [receiptFontSize, setReceiptFontSize] = useState<'Compact' | 'Standard' | 'Comfortable'>(settings.receiptFontSize ?? 'Standard');
  const [receiptHeaderTitle, setReceiptHeaderTitle] = useState(settings.receiptHeaderTitle ?? settings.storeName);
  const [receiptHeaderTagline, setReceiptHeaderTagline] = useState(settings.receiptHeaderTagline ?? 'Pure Spiced Cardamom Chai');

  // Security & User Roles States
  const [localCashierPermissions, setLocalCashierPermissions] = useState(cashierPermissions);
  const [selectedCashierId, setSelectedCashierId] = useState<string>('default');
  //settings
  const [isSavingSettings, setIsSavingSettings] =
  useState(false);

const [isChangingPassword, setIsChangingPassword] =
  useState(false);

const [isSavingPermissions, setIsSavingPermissions] =
  useState(false);

const [settingsError, setSettingsError] =
  useState('');

const [settingsSuccess, setSettingsSuccess] =
  useState('');

  const handleCashierSelectChange = (employeeId: string) => {
    setSelectedCashierId(employeeId);
    if (employeeId === 'default') {
      setLocalCashierPermissions(cashierPermissions);
    } else {
      const cashier = employees.find(e => e.id === employeeId);
      if (cashier) {
        const permsMap: { [key: string]: boolean } = {};
        const userPermissions = cashier.permissions || [];
        MODULES.forEach(mod => {
          permsMap[mod.id] = userPermissions.includes(mod.id);
        });
        setLocalCashierPermissions(permsMap);
      }
    }
  };

 const handleSave = async (
  event: React.FormEvent,
) => {
  event.preventDefault();

  setSettingsError('');
  setSettingsSuccess('');

  if (!storeName.trim()) {
    setSettingsError(
      'Store name is required.',
    );
    return;
  }

  if (!email.trim()) {
    setSettingsError(
      'Administrator email is required.',
    );
    return;
  }

  if (!/^0\d{9}$/.test(phone)) {
    setPhoneError(
      'Enter a valid Sri Lankan 10-digit phone number, e.g. 0771234567.',
    );
    setSettingsError(
      'Contact phone must be a valid Sri Lankan 10-digit number.',
    );
    return;
  }

  setPhoneError('');
  setIsSavingSettings(true);

  try {
    const emailChanged =
      email.trim().toLowerCase() !==
      settings.email.trim().toLowerCase();

    if (emailChanged) {
      await changeAdminEmail(email);
    }

    await updateSettings({
      ...settings,
      storeName: storeName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email:
        email.trim().toLowerCase(),
      currency,
      logo,
      banner,
      receiptFooter,
      printerName,
      autoPrintReceipt,
      showLogoOnReceipt,
      showAddressOnReceipt,
      showPointsOnReceipt,
      showQrCodeOnReceipt,
      showCashierOnReceipt,
      showCustomerOnReceipt,
      showNotesOnReceipt,
      showPaymentMethodOnReceipt,
      showTaxBreakdownOnReceipt,
      receiptPaperWidth,
      receiptFontSize,
      receiptHeaderTitle,
      receiptHeaderTagline,
    });

    setSettingsSuccess(
      emailChanged
        ? 'Settings saved. Please confirm the verification message sent to the new administrator email.'
        : 'Store settings saved successfully.',
    );
  } catch (error) {
    setSettingsError(
      error instanceof Error
        ? error.message
        : 'Unable to save settings.',
    );
  } finally {
    setIsSavingSettings(false);
  }
};

  const handleSaveCashierPermissions =
  async () => {
    setSettingsError('');
    setSettingsSuccess('');
    setIsSavingPermissions(true);

    try {
      if (
        selectedCashierId === 'default'
      ) {
        updateCashierPermissions(
          localCashierPermissions,
        );

        setSettingsSuccess(
          'Default permissions saved.',
        );
      } else {
        const activePermissions =
          Object.entries(
            localCashierPermissions,
          )
            .filter(
              ([, allowed]) => allowed,
            )
            .map(
              ([permission]) => permission,
            );

        const employee =
          await updateEmployeePermissions(
            selectedCashierId,
            activePermissions,
          );

        setSettingsSuccess(
          `Permissions saved for ${employee.name}.`,
        );
      }
    } catch (error) {
      setSettingsError(
        error instanceof Error
          ? error.message
          : 'Unable to save permissions.',
      );
    } finally {
      setIsSavingPermissions(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-600" /> POS System & Store Configuration
          </h1>
          <p className="text-xs text-gray-500">Configure store branding, customizable receipt templates, and security access controls</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={settingsLoading || isSavingSettings}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-amber-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          {isSavingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Segmented Tab Headers */}
      <div className="flex gap-2 border-b border-gray-200 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-5 py-2.5 text-xs font-black transition-all rounded-t-xl border-b-2 -mb-px ${
            activeTab === 'general'
              ? 'border-amber-500 text-amber-950 bg-white shadow-3xs'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          General Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('receipt')}
          className={`px-5 py-2.5 text-xs font-black transition-all rounded-t-xl border-b-2 -mb-px ${
            activeTab === 'receipt'
              ? 'border-amber-500 text-amber-950 bg-white shadow-3xs'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Receipt Customization
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-5 py-2.5 text-xs font-black transition-all rounded-t-xl border-b-2 -mb-px ${
            activeTab === 'security'
              ? 'border-amber-500 text-amber-950 bg-white shadow-3xs'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Security & User Roles
        </button>
      </div>

      <div className="w-full">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <section className="theme-card bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <MonitorCog className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="text-sm font-black text-gray-900">Appearance</h2>
                  <p className="text-[11px] text-gray-500">Choose the POS interface theme. Your choice is saved on this device.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => setTheme('light')} className={`theme-option flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${theme === 'light' ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                  <span className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center"><Sun className="w-5 h-5 text-amber-500" /></span>
                  <span><span className="block text-xs font-black text-gray-900">Light Mode</span><span className="block text-[10px] text-gray-500 mt-0.5">Bright interface for daytime use</span></span>
                </button>
                <button type="button" onClick={() => setTheme('dark')} className={`theme-option flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${theme === 'dark' ? 'border-emerald-500 bg-emerald-950/10' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                  <span className="w-10 h-10 rounded-xl bg-[#111827] border border-gray-700 flex items-center justify-center"><Moon className="w-5 h-5 text-emerald-300" /></span>
                  <span><span className="block text-xs font-black text-gray-900">Dark Mode</span><span className="block text-[10px] text-gray-500 mt-0.5">Comfortable low-light interface</span></span>
                </button>
              </div>
            </section>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-5 max-w-3xl">
            <h3 className="font-extrabold text-sm text-gray-900 font-serif border-b pb-2">Store Profile & Branding</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Store Address (Appears on Receipts)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  pattern="0[0-9]{9}"
                  value={phone}
                  placeholder="e.g. 0771234567"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                    if (phoneError) setPhoneError('');
                  }}
                  onBlur={() => {
                    if (phone && !/^0\d{9}$/.test(phone)) {
                      setPhoneError('Sri Lankan phone number must be exactly 10 digits and start with 0.');
                    }
                  }}
                  className={`w-full p-2.5 bg-[#FAF7F2] border rounded-xl text-xs focus:outline-none focus:ring-1 ${
                    phoneError
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-gray-200 focus:ring-amber-400'
                  }`}
                />
                {phoneError && (
                  <p className="mt-1 text-[10px] font-semibold text-red-600">
                    {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          </div>
        )}

        {activeTab === 'receipt' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-6xl">
            {/* Left Column: Form Controls (60% width) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-5">
              <h3 className="font-extrabold text-sm text-gray-900 font-serif border-b pb-2 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-600" /> Receipt Layout & Hardware Setup
              </h3>

              {/* Hardware & Tax Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Hardware Printer Host Name</label>
                  <input
                    type="text"
                    value={printerName}
                    onChange={(e) => setPrinterName(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Header Text Customization */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider text-[10px] border-l-2 border-amber-500 pl-2">
                  Header Customization
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Receipt Main Header Title</label>
                    <input
                      type="text"
                      value={receiptHeaderTitle}
                      onChange={(e) => setReceiptHeaderTitle(e.target.value)}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Receipt Tagline / Subtitle</label>
                    <input
                      type="text"
                      value={receiptHeaderTagline}
                      onChange={(e) => setReceiptHeaderTagline(e.target.value)}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Layout Customizations Checklist */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider text-[10px] border-l-2 border-amber-500 pl-2">
                  Customizable Receipt Sections
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={autoPrintReceipt}
                      onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Auto-print instantly on pay</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showLogoOnReceipt}
                      onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Render Store Logo in Header</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showAddressOnReceipt}
                      onChange={(e) => setShowAddressOnReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Show Address & Phone details</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showCashierOnReceipt}
                      onChange={(e) => setShowCashierOnReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Show Cashier Staff Name</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showCustomerOnReceipt}
                      onChange={(e) => setShowCustomerOnReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Show Customer Name / Mobile</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showPaymentMethodOnReceipt}
                      onChange={(e) => setShowPaymentMethodOnReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Show Payment Method</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showTaxBreakdownOnReceipt}
                      onChange={(e) => setShowTaxBreakdownOnReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Show GST Tax Breakdown</span>
                  </label>



                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showQrCodeOnReceipt}
                      onChange={(e) => setShowQrCodeOnReceipt(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Print Verification QR Code</span>
                  </label>
                </div>
              </div>

              {/* Formatting & Size */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider text-[10px] border-l-2 border-amber-500 pl-2">
                  Paper Layout & Formatting
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Thermal Paper Width</label>
                    <select
                      value={receiptPaperWidth}
                      onChange={(e) => setReceiptPaperWidth(e.target.value as any)}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                    >
                      <option value="80mm">80 mm Standard Ticket Width</option>
                      <option value="58mm">58 mm Narrow Ticket Width</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Typography Font Spacing</label>
                    <select
                      value={receiptFontSize}
                      onChange={(e) => setReceiptFontSize(e.target.value as any)}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                    >
                      <option value="Compact">Compact / Small spacing</option>
                      <option value="Standard">Standard / Normal spacing</option>
                      <option value="Comfortable">Comfortable / Large spacing</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer Text */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Receipt Footer Signature Message</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="e.g. Thank you for visiting! See you soon."
                  className="w-full p-2.5 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Right Column: Live Interactive Preview (40% width) */}
            <div className="lg:col-span-5 sticky top-6 bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b pb-2">
                <Printer className="w-3.5 h-3.5 text-amber-600" /> Live Receipt Ticket Preview
              </h4>

              {/* Receipt Ticket simulation container */}
              <div 
                className={`mx-auto bg-gray-50 border border-gray-300 p-4 rounded-lg shadow-inner font-mono text-gray-800 transition-all ${
                  receiptPaperWidth === '58mm' ? 'w-57.5 text-[10px]' : 'w-77.5 text-xs'
                }`}
                style={{
                  fontSize: receiptFontSize === 'Compact' ? '9px' : receiptFontSize === 'Comfortable' ? '13px' : undefined,
                  lineHeight: receiptFontSize === 'Compact' ? '1.2' : receiptFontSize === 'Comfortable' ? '1.6' : '1.4'
                }}
              >
                {/* Logo */}
                {showLogoOnReceipt && (
                  <div className="mb-2 text-center">
                    <img
                      src={logo || realStoreLogo}
                      alt="Kaanthaaram logo"
                      className="mx-auto h-14 w-14 rounded-full object-contain"
                      onError={(event) => {
                        event.currentTarget.src = realStoreLogo;
                      }}
                    />
                  </div>
                )}

                {/* Header Title & Tagline */}
                <div className="text-center font-bold text-sm tracking-tight mb-0.5">
                  {receiptHeaderTitle}
                </div>
                {receiptHeaderTagline && (
                  <div className="text-center text-[10px] text-gray-500 italic mb-1">
                    {receiptHeaderTagline}
                  </div>
                )}

                {/* Address & Contact */}
                {showAddressOnReceipt && (
                  <div className="text-center text-[10px] text-gray-500 space-y-0.5 mb-2 leading-tight">
                    <p>{address}</p>
                    <p>PH: {phone}</p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-b border-dashed border-gray-300 my-2" />

                {/* Meta details */}
                <div className="space-y-0.5 text-[10px] text-gray-600 mb-2">
                  <p className="flex justify-between">
                    <span>Order: #KT-9921</span>
                    <span>Date: 27-Jul-2026</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Type: Takeaway</span>
                    <span>Time: 12:45 PM</span>
                  </p>
                  {showCashierOnReceipt && (
                    <p>Cashier: Kavya Rajesh</p>
                  )}
                  {showCustomerOnReceipt && (
                    <p>Customer: Arun Kumar (9876543210)</p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-b border-dashed border-gray-300 my-2" />

                {/* Items */}
                <div className="space-y-1 py-1">
                  <div className="flex justify-between font-mono">
                    <span className="font-bold">காந்தாரம் Tea x 2</span>
                    <span>40.00</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="font-bold">Veg Sandwich x 1</span>
                    <span>60.00</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-b border-dashed border-gray-300 my-2" />

                {/* Totals */}
                <div className="space-y-1 text-right">
                  <div className="flex justify-between font-mono">
                    <span>Subtotal</span>
                    <span>100.00</span>
                  </div>
                  {/* {showTaxBreakdownOnReceipt && (
                    // <div className="flex justify-between text-gray-500 font-mono">
                    //   <span>GST ({taxPercentage}%)</span>
                    //   <span>{currency} {(100 * taxPercentage / 100).toFixed(2)}</span>
                    // </div>
                  )} */}
                
                  {showPaymentMethodOnReceipt && (
                    <div className="flex justify-between text-[10px] text-gray-500 pt-0.5">
                      <span>Payment Mode</span>
                      <span className="font-bold">QR Payment</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-b border-dashed border-gray-300 my-2" />

                {/* Footer Message */}
                <div className="text-center font-bold text-[10px] py-1 text-emerald-800 flex items-center justify-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{receiptFooter || 'Thank You! Visit Again'}</span>
                </div>



                {/* QR Code */}
                {showQrCodeOnReceipt && (
                  <div className="pt-3 text-center">
                    <img
                      src={realQrCode}
                      alt="Kaanthaaram QR Code"
                      className="w-20 h-20 mx-auto border border-gray-200 p-1 bg-white rounded-lg object-contain"
                    />
                    <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Scan to Verify Invoice</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Admin Password Card */}
            {currentUser?.role === 'Admin' && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-sm text-gray-900 font-serif border-b pb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" /> Change Administrator Password
                </h3>

                {passwordError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl font-bold">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Current Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">New Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Confirm New Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                <button
  type="submit"
  disabled={
    isChangingPassword ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  }
  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
>
  {isChangingPassword
    ? 'Updating...'
    : 'Update Password'}
</button>
                </form>
              </div>
            )}



            {/* Cashier Role Permissions Header Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center text-emerald-800 shadow-3xs shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 font-serif">Cashier Role Permissions</h4>
                  <p className="text-[11px] text-gray-500">Select a specific cashier to configure their individual roles and permissions.</p>
                </div>
              </div>

              {/* Cashier Dropdown Select Box */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700">Select Cashier:</label>
                <select
                  value={selectedCashierId}
                  onChange={(e) => handleCashierSelectChange(e.target.value)}
                  className="p-2 bg-[#FAF7F2] border border-gray-250 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="default">Global Default Cashier permissions</option>
                 {employees
                  .filter(
                    (employee) =>
                      employee.userType === 'POS Access' &&
                      employee.role !== 'Admin' &&
                      employee.status === 'Active',
                  )
                  .map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name} ({employee.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-[#E8F5E9]/50 border border-[#C8E6C9] p-3 rounded-2xl flex items-start gap-2 max-w-sm">
                <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[10px] text-emerald-900">Cashier Access Level</h5>
                  <p className="text-[10px] text-emerald-800 leading-normal">
                    Cashiers can perform sales, manage orders and customers but cannot access system settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions list */}
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-2xs">
              <div className="grid grid-cols-2 p-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Permission Module</span>
                <span className="text-right pr-6">Cashier Access</span>
              </div>
              {MODULES.map(mod => {
                const checked = localCashierPermissions[mod.id] ?? false;
                return (
                  <div key={mod.id} className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-emerald-800 flex items-center justify-center shrink-0 shadow-4xs">
                        {mod.icon}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-gray-900">{mod.title}</h5>
                        <p className="text-[10px] text-gray-500">{mod.desc}</p>
                      </div>
                    </div>
                    <div className="flex justify-start md:justify-end md:pr-6">
                      <ToggleSwitch
                        checked={checked}
                        onChange={(val) => {
                          setLocalCashierPermissions(prev => ({ ...prev, [mod.id]: val }));
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer block */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3 bg-[#E8F5E9]/50 p-2.5 rounded-xl border border-[#C8E6C9]">
                <Shield className="w-5 h-5 text-emerald-700" />
                <div>
                  <h5 className="font-bold text-[10px] text-emerald-950">Cashier Role Summary</h5>
                  <p className="text-[10px] text-emerald-800 font-medium">
                    {Object.values(localCashierPermissions).filter(Boolean).length} of {MODULES.length} permissions enabled
                  </p>
                </div>
                <div className="pl-3 border-l border-[#C8E6C9] flex flex-col items-center">
                  <span className="text-sm font-black text-emerald-900 font-serif leading-none">
                    {Math.round((Object.values(localCashierPermissions).filter(Boolean).length / MODULES.length) * 100)}%
                  </span>
                  <span className="text-[8px] text-emerald-700 uppercase font-bold tracking-wider mt-0.5">Access Level</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocalCashierPermissions({
                    pos: true,
                    discounts: false,
                    holdBills: true,
                    products: true,
                    categories: false,
                    customers: true,
                    offers: true,
                    inventory: false,
                    receipts: true,
                    reports: false,
                    suppliers: false,
                    expenses: false
                  })}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl shadow-4xs transition-all"
                >
                  Reset to Default
                </button>
           <button
                  type="button"
                  onClick={() =>
                    void handleSaveCashierPermissions()
                  }
                  disabled={
                    isSavingPermissions ||
                    !selectedCashierId
                  }
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />

                  {isSavingPermissions
                    ? 'Saving Permissions...'
                    : selectedCashierId === 'default'
                      ? 'Save Default Permissions'
                      : 'Update Staff Permissions'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};