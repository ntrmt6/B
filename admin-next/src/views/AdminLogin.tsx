import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, LogIn, Shield, Store, LayoutDashboard, RefreshCw, Phone, MessageCircle, HeadphonesIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authService from '../services/authService';
import { User, ShopStatus } from '../types';
import RenewSubscription from '../components/dashboard/RenewSubscription';

// Check if we're on the superadmin subdomain
const isSuperAdminSubdomain = typeof window !== 'undefined' && 
  window.location.hostname.startsWith('superadmin.');

// Check if we're on the tenant login portal
const isTenantLoginPortal = typeof window !== 'undefined' &&
  (window.location.hostname === 'systemnextit.website' ||
  window.location.hostname === 'www.systemnextit.website');

interface AdminLoginProps {
  onLoginSuccess?: (user: User) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [shopStatusType, setShopStatusType] = useState<'expired' | 'suspended' | 'blocked' | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);

  const WHATSAPP_NUMBER = '8801410050031';
  const PHONE_NUMBER = '+8801410050031';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShopStatusType(null);
    setShowContactOptions(false);
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      const user = result.user;

      if (isSuperAdminSubdomain) {
        if (!user || user.role !== 'super_admin') {
          setError('Access denied. Only Super Admin can login here.');
          authService.logout();
          setIsLoading(false);
          return;
        }
      } else if (isTenantLoginPortal) {
        if (!user || !user.role || !['admin', 'tenant_admin', 'staff'].includes(user.role)) {
          setError('Access denied. This portal is for tenant administrators only.');
          authService.logout();
          setIsLoading(false);
          return;
        }
      } else {
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'tenant_admin' && user.role !== 'staff')) {
          setError('Access denied. This login is for admin and staff users only.');
          authService.logout();
          setIsLoading(false);
          return;
        }
      }

      // Check shop status for non-super_admin users
      const shopStatus: ShopStatus | undefined = user?.tenantDetails?.shopStatus;
      if (shopStatus && user?.role !== 'super_admin') {
        if (shopStatus.isBlocked) {
          setError('Your shop is blocked. Please contact support.');
          setShopStatusType('blocked');
          authService.logout();
          setIsLoading(false);
          return;
        }
        if (shopStatus.isSuspended) {
          setError('Your shop is suspended. Please contact support.');
          setShopStatusType('suspended');
          authService.logout();
          setIsLoading(false);
          return;
        }
        if (shopStatus.isExpired) {
          setError('Your subscription is expired. Please renew your subscription to continue.');
          setShopStatusType('expired');
          authService.logout();
          setIsLoading(false);
          return;
        }
      }

      toast.success('Login successful!');
      if (onLoginSuccess) onLoginSuccess(user as User);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getBranding = () => {
    if (isSuperAdminSubdomain) {
      return {
        icon: <Shield className="text-white" size={28} />,
        gradientFrom: 'from-sky-500',
        gradientTo: 'to-orange-400',
        shadowColor: 'shadow-sky-950/40',
        title: 'Super Admin Portal',
        subtitle: 'Sign in with super admin credentials',
        ringColor: 'focus:ring-sky-400/35',
        borderColor: 'focus:border-sky-300/35',
        btnFrom: 'from-sky-500',
        btnTo: 'to-orange-400',
        btnHoverFrom: 'hover:from-sky-400',
        btnHoverTo: 'hover:to-orange-300',
        btnShadow: 'shadow-sky-950/40',
        checkboxColor: 'text-sky-400',
        linkColor: 'text-sky-300',
        linkHover: 'hover:text-orange-300',
        bgGlow1: 'bg-sky-500/12',
        bgGlow2: 'bg-orange-500/12',
        bgGlow3: 'bg-sky-400/6',
      };
    }
    if (isTenantLoginPortal) {
      return {
        icon: <LayoutDashboard className="text-white" size={28} />,
        gradientFrom: 'from-sky-500',
        gradientTo: 'to-orange-400',
        shadowColor: 'shadow-sky-950/40',
        title: 'Shop Dashboard',
        subtitle: 'Sign in to manage your store',
        ringColor: 'focus:ring-sky-400/35',
        borderColor: 'focus:border-sky-300/35',
        btnFrom: 'from-sky-500',
        btnTo: 'to-orange-400',
        btnHoverFrom: 'hover:from-sky-400',
        btnHoverTo: 'hover:to-orange-300',
        btnShadow: 'shadow-sky-950/40',
        checkboxColor: 'text-sky-400',
        linkColor: 'text-sky-300',
        linkHover: 'hover:text-orange-300',
        bgGlow1: 'bg-sky-500/12',
        bgGlow2: 'bg-orange-500/12',
        bgGlow3: 'bg-sky-400/6',
      };
    }
    return {
      icon: <Shield className="text-white" size={28} />,
      gradientFrom: 'from-sky-500',
      gradientTo: 'to-orange-400',
      shadowColor: 'shadow-sky-950/40',
      title: 'Welcome to Admin Panel',
      subtitle: 'Sign in to access the admin dashboard',
      ringColor: 'focus:ring-sky-400/35',
      borderColor: 'focus:border-sky-300/35',
      btnFrom: 'from-sky-500',
      btnTo: 'to-orange-400',
      btnHoverFrom: 'hover:from-sky-400',
      btnHoverTo: 'hover:to-orange-300',
      btnShadow: 'shadow-sky-950/40',
      checkboxColor: 'text-sky-400',
      linkColor: 'text-sky-300',
      linkHover: 'hover:text-orange-300',
      bgGlow1: 'bg-sky-500/12',
      bgGlow2: 'bg-orange-500/12',
      bgGlow3: 'bg-sky-400/6',
    };
  };

  const brand = getBranding();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-24 -left-16 w-72 h-72 ${brand.bgGlow1} rounded-full blur-[110px]`} />
        <div className={`absolute bottom-24 -right-16 w-72 h-72 ${brand.bgGlow2} rounded-full blur-[110px]`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] ${brand.bgGlow3} rounded-full blur-[140px]`} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="">
          <div className="p-6 pb-0 text-center">
            {/* <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-6 bg-gradient-to-br ${brand.gradientFrom} ${brand.gradientTo} ${brand.shadowColor}`}>
              {brand.icon}
            </div> */}
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-1.5">{brand.title}</h1>
            <p className="text-gray-900 dark:text-gray-100 text-xs">{brand.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 pt-5 space-y-5">
            {error && (
              <div className="animate-shake">
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
                {shopStatusType === 'expired' && (
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
                  >
                    <RefreshCw size={16} />
                    Renew Subscription
                  </button>
                )}
                {(shopStatusType === 'suspended' || shopStatusType === 'blocked') && (
                  <div className="relative mt-3">
                    <button
                      type="button"
                      onClick={() => setShowContactOptions(!showContactOptions)}
                      aria-expanded={showContactOptions}
                      aria-haspopup="true"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
                    >
                      <HeadphonesIcon size={16} />
                      Contact Us
                    </button>
                    {showContactOptions && (
                      <div className="mt-2 w-full bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                        <a
                          href={`tel:${PHONE_NUMBER}`}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                        >
                          <Phone size={16} className="text-green-400" />
                          <span>Call Us</span>
                        </a>
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors border-t border-white/10"
                        >
                          <MessageCircle size={16} className="text-green-400" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 ${brand.ringColor} ${brand.borderColor} text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300 transition-colors duration-200`}
                  placeholder="admin@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 ${brand.ringColor} ${brand.borderColor} text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-200`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r ${brand.btnFrom} ${brand.btnTo} ${brand.btnHoverFrom} ${brand.btnHoverTo} text-white font-semibold rounded-xl transition-all duration-200 shadow-lg ${brand.btnShadow} disabled:opacity-60`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              {isLoading ? 'Signing in...' : (isTenantLoginPortal ? 'Sign In to Dashboard' : 'Sign In')}
            </button>
          </form>

          <div className="px-8 pb-8 text-center border-t border-gray-200 dark:border-white/10 pt-6">
            <p className="text-gray-500 dark:text-slate-400/90 text-xs">
              {isTenantLoginPortal ? 'Merchant Dashboard' : 'Admin Panel'} v2.0 • © {new Date().getFullYear()} SystemNextIT
            </p>
          </div>
        </div>
      </div>

      <RenewSubscription
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
      />

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default AdminLogin;
