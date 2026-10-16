import React, { useState } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Users,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Key
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/logo.jpg';

export const LoginPage: React.FC = () => {
  const { employees, loginWithCredentials, requestPasswordReset } = useApp();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] =
    useState<boolean>(false);
  const [showPinHelp, setShowPinHelp] = useState<boolean>(false);

  // Forgot password flow states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [resetSending, setResetSending] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetSending || !resetEmail.trim()) return;
    setResetSending(true);
    setResetError('');
    setResetSuccess('');
    try {
      const result = await requestPasswordReset(resetEmail.trim());
      if (!result.success) {
        setResetError(result.message);
        return;
      }
      setResetSuccess(result.message);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Could not request password reset.');
    } finally {
      setResetSending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await loginWithCredentials(
        email,
        password
      );

      if (!result.success) {
        setError(
          result.message || 'Unable to sign in.'
        );
      }
    } catch (error) {
      console.error(error);
      setError('Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (empEmail: string, empPin: string) => {
    setEmail(empEmail);
    setPassword(empPin);
    setError('');
    setTimeout(() => {
      loginWithCredentials(empEmail, empPin);
    }, 120);
  };

  return (
    <div className="h-screen w-screen bg-[#FAF4E8] flex flex-col lg:flex-row select-none relative overflow-hidden font-sans">

      {/* Decorative Corner Tea Leaves Background Accent */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-emerald-800 via-transparent to-transparent" />
      <div className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-amber-700 via-transparent to-transparent" />

      {/* ================= LEFT SIDE: BRANDING & PRODUCT SHOWCASE ================= */}
      <div className="w-full lg:w-1/2 h-full p-4 lg:p-8 flex flex-col justify-between items-center relative z-10 border-b lg:border-b-0 lg:border-r border-[#E8DFC8] overflow-hidden">

        {/* Brand Header */}
        <div className="text-center space-y-2 max-w-md my-auto lg:my-0">
          {/* Logo Icon */}
          <div className="mx-auto w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center relative">
            <svg viewBox="0 0 100 100" className="w-12 h-12 lg:w-14 lg:h-14 text-[#23532B]" fill="none" stroke="currentColor">
              {/* Sprouting leaf top */}
              <path d="M50 8 C50 8, 42 22, 50 32 C58 22, 50 8, 50 8 Z" fill="#2E7D32" stroke="none" />
              <path d="M50 32 C40 25, 30 28, 28 35 C38 35, 48 30, 50 32 Z" fill="#4CAF50" stroke="none" />
              <path d="M50 32 C60 25, 70 28, 72 35 C62 35, 52 30, 50 32 Z" fill="#2E7D32" stroke="none" />
              {/* Cup shape */}
              <path d="M25 40 H75 C75 40, 72 75, 50 75 C28 75, 25 40, 25 40 Z" stroke="#1B4323" strokeWidth="4" fill="#FFFDF7" />
              {/* Handle */}
              <path d="M74 48 C85 48, 85 62, 72 65" stroke="#1B4323" strokeWidth="4" strokeLinecap="round" />
              {/* Tea level */}
              <path d="M28 50 C40 54, 60 46, 72 50 C71 62, 62 70, 50 70 C38 70, 29 62, 28 50 Z" fill="#E8A018" opacity="0.85" />
            </svg>
          </div>

          {/* Brand Name */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1B4323] tracking-tight font-serif leading-none">
              காந்தாரம்
            </h1>
          </div>

          {/* Twin Leaf Emblem */}
          <div className="flex items-center justify-center gap-2 text-[#2E7D32] opacity-80 pt-0.5">
            <span className="h-px w-6 bg-[#2E7D32]/30" />
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M17 8C8 10 59 16 17 8ZM12 3C7 3 3 7 3 12C8 12 12 8 12 3ZM12 21C17 21 21 17 21 12C16 12 12 16 12 21Z" />
            </svg>
            <span className="h-px w-6 bg-[#2E7D32]/30" />
          </div>

          {/* Taglines */}
          <div>
            <h2 className="text-gray-900 font-extrabold text-sm lg:text-base font-serif">
              Premium Tea. Perfect Moments.
            </h2>
            <p className="text-[11px] lg:text-xs text-gray-600 leading-tight max-w-xs mx-auto mt-0.5 font-medium">
              A complete POS solution to manage your business with ease and elegance.
            </p>
          </div>
        </div>

        {/* Center Tea Cup Image Container */}
        <div className="my-auto relative w-full max-w-xs flex justify-center items-center">
          <div className="relative group">
            {/* Soft backdrop glow */}
            <div className="absolute inset-0 bg-amber-200/50 rounded-full blur-2xl transform scale-90" />

            {/* Real Tea Cup Showcase Image */}
            <img
              src={logoImg}
              alt="Kaanthaaram Premium Tea Cup"
              className="w-40 h-40 lg:w-48 lg:h-48 xl:w-52 xl:h-52 object-cover rounded-full shadow-xl border-4 border-white/80 relative z-10 hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Bottom Feature Badges Bar */}
        <div className="w-full max-w-lg grid grid-cols-4 gap-1 pt-3 border-t border-[#E8DFC8] my-auto lg:my-0">
          <div className="flex flex-col items-center text-center space-y-0.5">
            <div className="w-7 h-7 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">Smart POS</span>
          </div>

          <div className="flex flex-col items-center text-center space-y-0.5 border-l border-[#E8DFC8]">
            <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">Sales Analytics</span>
          </div>

          <div className="flex flex-col items-center text-center space-y-0.5 border-l border-[#E8DFC8]">
            <div className="w-7 h-7 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">Customer Loyalty</span>
          </div>

          <div className="flex flex-col items-center text-center space-y-0.5 border-l border-[#E8DFC8]">
            <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <span className="text-[10px] font-bold text-gray-800">Secure & Reliable</span>
          </div>
        </div>

      </div>

      {/* ================= RIGHT SIDE: CREDENTIALS LOGIN CARD ================= */}
      <div className="w-full lg:w-1/2 h-full p-4 lg:p-8 flex flex-col justify-center items-center bg-[#36533D] relative z-10 overflow-hidden">

        {/* Elegant Tea Leaf Outline Background */}
        <svg
          viewBox="0 0 100 100"
          className="absolute -bottom-8 -right-8 w-80 h-80 text-white/8 pointer-events-none select-none z-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M90,95 C75,70 50,45 25,25" />
          <path d="M72,67 C55,67 42,52 35,42 C45,43 65,49 72,67 Z" fill="currentColor" fillOpacity="0.02" />
          <path d="M78,74 C90,64 96,48 98,38 C88,43 78,57 78,74 Z" fill="currentColor" fillOpacity="0.02" />
          <path d="M53,49 C38,49 28,36 22,27 C30,28 47,34 53,49 Z" fill="currentColor" fillOpacity="0.02" />
          <path d="M59,54 C70,45 75,32 77,24 C69,28 60,39 59,54 Z" fill="currentColor" fillOpacity="0.02" />
          <path d="M25,25 C15,18 8,10 5,2 C12,5 20,13 25,25 Z" fill="currentColor" fillOpacity="0.02" />
        </svg>

        {/* Main Card */}
        {isForgotOpen ? (
          <div className="w-full max-w-sm lg:max-w-md bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-gray-100/80 p-6 text-center relative space-y-4 my-auto animate-in fade-in duration-150">
            <div className="space-y-1.5">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-emerald-50 text-[#2D7D46] flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-6 h-6 lg:w-7 lg:h-7 stroke-[1.8]" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-gray-900 font-serif leading-tight">
                  Forgot Password?
                </h2>
                <p className="text-[11px] lg:text-xs text-gray-500 mt-0.5 font-medium">
                  Enter your registered email address to receive reset instructions
                </p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl font-bold text-center">
                {resetSuccess}
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4 text-left">
                {resetError && <p role="alert" className="text-xs font-semibold text-red-600">{resetError}</p>}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@kaanthaaram.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setResetEmail('');
                    }}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={resetSending}
                    className="flex-1 py-2.5 bg-[#2D7D46] hover:bg-[#236337] text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D7D46]" />
              <span>Secure System Authentication</span>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm lg:max-w-md bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-gray-100/80 p-6 text-center relative space-y-4 my-auto animate-in fade-in duration-150">

            <div className="space-y-1.5">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#EBF5EC] text-[#2D7D46] flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6 lg:w-7 lg:h-7 stroke-[1.8]" />
              </div>

              <div>
                <h2 className="text-xl lg:text-2xl font-black text-gray-900 font-serif leading-tight">
                  POS Staff Login
                </h2>
                <p className="text-[11px] lg:text-xs text-gray-500 mt-0.5 font-medium">
                  Enter your credentials to manage sales
                </p>
              </div>
            </div>

            {/* Quick Employee Credentials Helper Drawer Toggle */}
            {/* <div className="text-center">
              <button
                type="button"
                onClick={() => setShowPinHelp(!showPinHelp)}
                className="text-[10px] lg:text-[11px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 hover:underline"
              >
                <Key className="w-3 h-3 text-amber-500" />
                {showPinHelp ? 'Hide Credentials' : 'View Quick Sign In Directory'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showPinHelp ? 'rotate-180' : ''}`} />
              </button>

              {showPinHelp && (
                <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-left space-y-1.5 text-xs animate-in fade-in duration-150 max-h-48 overflow-y-auto">
                  <p className="text-[9px] font-bold text-emerald-950 uppercase tracking-wider">
                    Select employee for auto-login:
                  </p>
                  <div className="space-y-1">
                    {employees.filter(e => e.email).map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleQuickLogin(emp.email, emp.pin)}
                        className="w-full p-2 rounded-lg border text-left flex flex-col justify-between bg-white text-gray-750 border-emerald-100 hover:bg-emerald-100/50 transition-colors"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-gray-950">{emp.name} ({emp.role})</span>
                          <span className="font-mono text-[10px] font-bold bg-amber-100/60 text-amber-900 px-1.5 py-0.5 rounded">Pass: {emp.pin}</span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-500 select-all">{emp.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div> */}

            {/* Error Notice */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-xl font-bold text-center">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3 text-left">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Email Address / Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="name@kaanthaaram.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 mb-1 flex justify-between items-center w-full">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#2D7D46]
    hover:bg-[#236337] disabled:opacity-60
    disabled:cursor-not-allowed text-white
    font-extrabold text-xs rounded-xl"
              >
                {isSubmitting
                  ? 'Signing In...'
                  : 'Sign In to System'}
              </button>
            </form>

            {/* Bottom Security Footer */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D7D46]" />
              <span>Secure System Authentication</span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
