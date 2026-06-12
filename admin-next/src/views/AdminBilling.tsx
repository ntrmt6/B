import React, { useState, useEffect } from 'react';
import RenewSubscription from '../components/dashboard/RenewSubscription';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  Receipt,
  TrendingUp,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  ArrowUpRight,
  Download,
  RefreshCw,
  Check,
  Loader2,
} from 'lucide-react';
import { Tenant } from '../types';
import { toast } from 'react-hot-toast';
import { getAuthHeader } from '../services/authService';
import { useDarkMode } from '../context/DarkModeContext';
import { getApiUrl } from '../utils/appHelpers';

// API URL helper
const API_URL = getApiUrl();

// Resolve image URLs - relative paths need the API base URL prefix
const resolveImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Figma-based inline styles
const createFigmaStyles = (isDark: boolean) => ({
  container: {
    backgroundColor: isDark ? '#111827' : '#f9f9f9',
    minHeight: '100vh',
    position: 'relative' as const,
    // padding handled by Tailwind
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    // gap handled by Tailwind
    maxWidth: '1146px',
    margin: '0 auto',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    // padding handled by Tailwind
    overflow: 'hidden',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '22px',
    color: '#023337',
    letterSpacing: '0.11px',
    margin: 0,
  },
  tabContainer: {
    backgroundColor: 'rgba(235, 239, 240, 0.36)',
    borderRadius: '100px',
    padding: '4px',
    display: 'flex',
    gap: '8px',
  },
  tabActive: {
    backgroundColor: isDark ? '#374151' : '#1d2127',
    borderRadius: '100px',
    padding: '10px',
    minWidth: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
  },
  tabActiveText: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: '16px',
    color: '#ffffff',
    letterSpacing: '0.32px',
  },
  tabInactive: {
    backgroundColor: isDark ? '#1f2937' : 'transparent',
    borderRadius: '100px',
    padding: '10px',
    minWidth: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
    border: 'none',
  },
  tabInactiveText: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    fontSize: '16px',
    color: '#1d2127',
    letterSpacing: '0.32px',
  },
  tabDiscount: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: '#1d2127',
    letterSpacing: '0.24px',
  },
  plansGrid: {
    display: 'grid',
    // grid handled by Tailwind
    // gap handled by Tailwind
    marginTop: '24px',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    minHeight: '338px',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    padding: '30px 19px',
  },
  planTitle: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: '24px',
    color: '#2f2f2f',
    margin: 0,
  },
  planSubtitle: {
    fontFamily: "'Questrial', 'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    color: '#2f2f2f',
    margin: '4px 0 0 0',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  oldPrice: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '24px',
    color: '#afafaf',
    textDecoration: 'line-through',
    position: 'relative' as const,
  },
  currentPrice: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '32px',
    color: '#2f2f2f',
  },
  priceMonth: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    fontSize: '14px',
    color: '#2f2f2f',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '24px',
  },
  featureColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  featureIcon: {
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
  featureText: {
    fontFamily: "'Questrial', 'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '16px',
    color: '#454452',
    marginTop: '4px',
  },
  featureSubText: {
    fontFamily: "'Questrial', 'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: '#454452',
  },
  subscribeButton: {
    // width handled by Tailwind
    height: '40px',
    borderRadius: '69px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
  },
  subscribeButtonOutline: {
    border: '1.5px solid',
    backgroundColor: 'transparent',
  },
  subscribeButtonFilled: {
    border: 'none',
    color: '#ffffff',
  },
  adsSection: {
    background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
    borderRadius: '8px',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  adsText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '60px',
    color: '#ffffff',
    letterSpacing: '1.2px',
  },
  adsDots: {
    position: 'absolute' as const,
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  dotActive: {
    backgroundColor: '#1e90ff',
  },
  dotInactive: {
    backgroundColor: '#ffffff',
    opacity: 0.5,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    // padding handled by Tailwind
    overflow: 'hidden',
  },
  requestTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '22px',
    color: '#000000',
    margin: 0,
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  formLabel: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '16px',
    color: '#000000',
  },
  formInput: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 12px',
    height: '48px',
    fontFamily: "'Lato', sans-serif",
    fontSize: '15px',
    color: '#909090',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '24px',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkbox: {
    width: '26px',
    height: '26px',
    border: '2px solid #777',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: '15px',
    color: '#777',
  },
  requestButton: {
    backgroundColor: '#00cdba',
    borderRadius: '4px',
    height: '40px',
    width: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'PingFang SC', sans-serif",
    fontWeight: 500,
    fontSize: '16px',
    color: '#ffffff',
  },
});

// Plan data matching Figma design
const PLANS = [
  {
    id: 'startup',
    name: 'Startup',
    subtitle: 'Hands-free hosting & updates.',
    oldPrice: 500,
    price: 400,
    buttonColor: '#008c09',
    buttonStyle: 'outline' as const,
    features: [
      ['Free Sub-Domain & Hosting', 'User Friendly Dashboard', 'Unlimited Product Upload', 'Live Chat Support', 'Next.js Performance', 'Initial Load Time 0.2 sec'],
      ['SSL & Security', 'Mobile First Approach', 'Customizable Theme'],
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Hands-free hosting & updates.',
    oldPrice: 1000,
    price: 800,
    buttonColor: '#1e90ff',
    buttonStyle: 'outline' as const,
    features: [
      ['Free Sub-Domain & Hosting', 'User Friendly Dashboard', 'Unlimited Product Upload', 'Live Chat Support', 'Next.js Performance', 'Initial Load Time 0.2 sec'],
      ['SSL & Security', 'Mobile First Approach', 'Customizable Theme', 'Business Report'],
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    subtitle: 'Hands-free hosting & updates.',
    oldPrice: 1500,
    price: 1200,
    buttonColor: '#f17800',
    buttonStyle: 'outline' as const,
    features: [
      ['Free Sub-Domain & Hosting', 'User Friendly Dashboard', 'Unlimited Product Upload', 'Live Chat Support', 'Next.js Performance', 'Initial Load Time 0.2 sec'],
      ['SSL & Security', 'Mobile First Approach', 'Customizable Theme', 'Business Report', 'Theme Customization Request'],
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Hands-free hosting & updates.',
    oldPrice: 2000,
    price: 1600,
    buttonColor: '#3855f8',
    buttonStyle: 'filled' as const,
    features: [
      ['Free Sub-Domain & Hosting', 'User Friendly Dashboard', 'Unlimited Product Upload', 'Live Chat Support', 'Next.js Performance', 'Initial Load Time 0.2 sec'],
      ['SSL & Security', 'Mobile First Approach', 'Customizable Theme', 'Business Report', 'Full Frontend Customization'],
    ],
  },
];

interface AdminBillingProps {
  tenant?: Tenant | null;
  onUpgrade?: () => void;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

const PLAN_FEATURES: Record<string, { name: string; price: number; features: string[]; color: string; icon: React.ReactNode }> = {
  startup: {
    name: 'Startup',
    price: 0,
    features: ['Up to 50 products', 'Basic analytics', 'Email support', '1 Admin user'],
    color: 'from-gray-500 to-gray-600',
    icon: <Package size={24} />
  },
  growth: {
    name: 'Growth',
    price: 999,
    features: ['Up to 500 products', 'Advanced analytics', 'Priority support', '5 Admin users', 'Custom domain'],
    color: 'from-blue-500 to-cyan-500',
    icon: <TrendingUp size={24} />
  },
  enterprise: {
    name: 'Enterprise',
    price: 2999,
    features: ['Unlimited products', 'Full analytics suite', '24/7 support', 'Unlimited users', 'Multiple domains', 'API access'],
    color: 'from-purple-500 to-pink-500',
    icon: <Crown size={24} />
  }
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  trialing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  suspended: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  pending: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' }
};

const AdminBilling: React.FC<AdminBillingProps> = ({ tenant, onUpgrade }) => {
  const { isDarkMode } = useDarkMode();
  const figmaStyles = createFigmaStyles(isDarkMode);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [platforms, setPlatforms] = useState({ android: false, ios: false });
  const [priority, setPriority] = useState<string>('Low');
  const [appTitle, setAppTitle] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [isSubmittingAppRequest, setIsSubmittingAppRequest] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPlanForRenew, setSelectedPlanForRenew] = useState('');
  
  // Ads carousel state
  const [ads, setAds] = useState<Array<{ id: string; imageUrl: string; linkUrl?: string; title?: string }>>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Calculate days left for subscription
  const getDaysLeft = (): { days: number; isExpiringSoon: boolean; isExpired: boolean } | null => {
    // Check subscription end date first, then trial end date
    const endDate = tenant?.subscriptionEndsAt || tenant?.trialEndsAt;
    if (!endDate) {
      // If no end date, calculate from createdAt + 30 days (default trial/subscription period)
      if (tenant?.createdAt) {
        const created = new Date(tenant.createdAt);
        const defaultEnd = new Date(created);
        defaultEnd.setDate(defaultEnd.getDate() + 30);
        const now = new Date();
        const diffTime = defaultEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          days: Math.max(0, diffDays),
          isExpiringSoon: diffDays <= 7 && diffDays > 0,
          isExpired: diffDays <= 0
        };
      }
      return null;
    }
    
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: Math.max(0, diffDays),
      isExpiringSoon: diffDays <= 7 && diffDays > 0,
      isExpired: diffDays <= 0
    };
  };

  const daysLeftInfo = getDaysLeft();

  // Fetch billing page ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(`${API_URL}/tenant-data/global/billing_ads`);
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setAds(data.data.filter((ad: any) => ad.active !== false));
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };
    fetchAds();
  }, []);

  // Auto-rotate ads
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  // Handle app request submission
  const handleAppRequestSubmit = async () => {
    // Validation
    if (!appTitle.trim()) {
      toast.error('Please enter an app title');
      return;
    }
    if (!appDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!platforms.android && !platforms.ios) {
      toast.error('Please select at least one platform');
      return;
    }
    if (!priority) {
      toast.error('Please select a priority');
      return;
    }
    if (!tenant?.id) {
      toast.error('Tenant information not available');
      return;
    }

    setIsSubmittingAppRequest(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${API_URL}/tenants/${tenant.id}/app-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': (authHeader as Record<string, string>)['Authorization'] || ''
        },
        body: JSON.stringify({
          appTitle: appTitle.trim(),
          description: appDescription.trim(),
          platforms,
          priority
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      toast.success('App request submitted successfully!');
      // Reset form
      setAppTitle('');
      setAppDescription('');
      setPlatforms({ android: false, ios: false });
      setPriority('Low');
    } catch (error) {
      console.error('Error submitting app request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmittingAppRequest(false);
    }
  };

  // Calculate price based on billing cycle
  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === 'yearly') {
      return Math.round(monthlyPrice * 12 * 0.8);
    }
    return monthlyPrice;
  };

  const getOldPrice = (oldPrice: number) => {
    if (billingCycle === 'yearly') {
      return oldPrice * 12;
    }
    return oldPrice;
  };

  // Check icon component
  const CheckIcon = ({ color = '#008c09' }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div style={figmaStyles.container} className="p-3 sm:p-4 md:p-5">
      <div style={figmaStyles.mainContent} className="flex flex-col gap-4 sm:gap-6">
        {/* Header Card with Plans */}
        <div style={figmaStyles.headerCard} className="p-3 sm:p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <h1 style={figmaStyles.title}>Billing & Subscription</h1>
              
              {/* Days Left Badge */}
              {daysLeftInfo && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: daysLeftInfo.isExpired 
                      ? '#FEE2E2' 
                      : daysLeftInfo.isExpiringSoon 
                        ? '#FEF3C7' 
                        : '#DCFCE7',
                    border: `1px solid ${daysLeftInfo.isExpired 
                      ? '#FECACA' 
                      : daysLeftInfo.isExpiringSoon 
                        ? '#FDE68A' 
                        : '#BBF7D0'}`,
                  }}
                >
                  <Clock 
                    size={18} 
                    style={{ 
                      color: daysLeftInfo.isExpired 
                        ? '#DC2626' 
                        : daysLeftInfo.isExpiringSoon 
                          ? '#D97706' 
                          : '#16A34A' 
                    }} 
                  />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: '14px',
                      color: daysLeftInfo.isExpired 
                        ? '#DC2626' 
                        : daysLeftInfo.isExpiringSoon 
                          ? '#D97706' 
                          : '#16A34A',
                    }}
                  >
                    {daysLeftInfo.isExpired 
                      ? 'Subscription Expired' 
                      : `${daysLeftInfo.days} Day${daysLeftInfo.days !== 1 ? 's' : ''} Left`}
                  </span>
                </div>
              )}
            </div>
            
            {/* Monthly/Yearly Toggle */}
            <div style={figmaStyles.tabContainer}>
              <button
                style={billingCycle === 'monthly' ? figmaStyles.tabActive : figmaStyles.tabInactive}
                onClick={() => setBillingCycle('monthly')}
              >
                <span style={billingCycle === 'monthly' ? figmaStyles.tabActiveText : figmaStyles.tabInactiveText}>
                  Monthly
                </span>
              </button>
              <button
                style={billingCycle === 'yearly' ? figmaStyles.tabActive : figmaStyles.tabInactive}
                onClick={() => setBillingCycle('yearly')}
              >
                <span style={billingCycle === 'yearly' ? figmaStyles.tabActiveText : figmaStyles.tabInactiveText}>
                  Yearly
                </span>
                {(
                  <span style={figmaStyles.tabDiscount}>-20% off</span>
                )}
              </button>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
            {PLANS.map((plan) => (
              <div key={plan.id} style={figmaStyles.planCard} className="p-4 sm:p-6">
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                  <div>
                    <h2 style={figmaStyles.planTitle}>{plan.name}</h2>
                    <p style={figmaStyles.planSubtitle}>{plan.subtitle}</p>
                  </div>
                  
                  {/* Price */}
                  <div style={figmaStyles.priceContainer}>
                    <span style={figmaStyles.oldPrice}>
                      ৳{getOldPrice(plan.oldPrice)}
                    </span>
                    <span>
                      <span style={figmaStyles.currentPrice}>৳{getPrice(plan.price)}</span>
                      <span style={figmaStyles.priceMonth}>/{billingCycle === 'yearly' ? 'Year' : 'Month'}</span>
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-6">
                  {plan.features.map((column, colIdx) => (
                    <div key={colIdx} style={figmaStyles.featureColumn}>
                      {column.map((feature, idx) => (
                        <div key={idx} style={figmaStyles.featureItem}>
                          <CheckIcon color={plan.buttonColor} />
                          <div>
                            <span style={figmaStyles.featureText}>
                              {feature === 'Initial Load Time 0.2 sec' ? (
                                <>
                                  Initial Load Time 0.2 sec
                                  <br />
                                  <span style={figmaStyles.featureSubText}>(no reload time)</span>
                                </>
                              ) : feature}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Subscribe Button */}
                <div className="mt-auto flex justify-center sm:justify-end pt-4 sm:pt-6">
                  <button
                    style={{
                      ...figmaStyles.subscribeButton,
                      ...(plan.buttonStyle === 'outline' 
                        ? { ...figmaStyles.subscribeButtonOutline, borderColor: plan.buttonColor, color: plan.buttonColor }
                        : { ...figmaStyles.subscribeButtonFilled, backgroundColor: plan.buttonColor }
                      ),
                    }}
                    className="w-full sm:w-[233px]" onClick={() => { setSelectedPlanForRenew(plan.id); setShowRenewModal(true); }}
                    >
                    SUBSCRIBE NOW
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ads Section */}
        <div style={figmaStyles.adsSection}>
          {ads.length > 0 ? (
            <>
              {ads[currentAdIndex]?.linkUrl ? (
                <a 
                  href={ads[currentAdIndex].linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                >
                  <img 
                    src={resolveImageUrl(ads[currentAdIndex].imageUrl)} 
                    alt={ads[currentAdIndex].title || 'Advertisement'}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </a>
              ) : (
                <img 
                  src={resolveImageUrl(ads[currentAdIndex].imageUrl)} 
                  alt={ads[currentAdIndex].title || 'Advertisement'}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              )}
              {ads.length > 1 && (
                <div style={figmaStyles.adsDots}>
                  {ads.map((_, index) => (
                    <div 
                      key={index}
                      onClick={() => setCurrentAdIndex(index)}
                      style={{ 
                        ...figmaStyles.dot, 
                        ...(index === currentAdIndex ? figmaStyles.dotActive : figmaStyles.dotInactive),
                        cursor: 'pointer'
                      }} 
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <span style={figmaStyles.adsText}>Ads Section</span>
              <div style={figmaStyles.adsDots}>
                <div style={{ ...figmaStyles.dot, ...figmaStyles.dotActive }} />
                <div style={{ ...figmaStyles.dot, ...figmaStyles.dotInactive }} />
                <div style={{ ...figmaStyles.dot, ...figmaStyles.dotInactive }} />
                <div style={{ ...figmaStyles.dot, ...figmaStyles.dotInactive }} />
                <div style={{ ...figmaStyles.dot, ...figmaStyles.dotInactive }} />
              </div>
            </>
          )}
        </div>

        {/* Request a New App */}
        <div style={figmaStyles.requestCard} className="p-3 sm:p-5">
          <h2 style={figmaStyles.requestTitle}>Request a New App</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-6">
            {/* App Title */}
            <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-[364px] sm:flex-shrink-0">
              <label style={figmaStyles.formLabel}>App Title:</label>
              <input
                type="text"
                placeholder="Ex E-commerce Delivery App"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                style={figmaStyles.formInput}
              />
            </div>

            {/* Brief Description */}
            <div className="flex flex-col gap-2 sm:gap-3 flex-1">
              <label style={figmaStyles.formLabel}>Brief Description:</label>
              <input
                type="text"
                placeholder="Ex E-commerce Delivery App"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                style={figmaStyles.formInput}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-wrap gap-4 sm:gap-6 mt-4 sm:mt-6 items-start lg:items-center lg:justify-between">
            {/* Platform */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span style={figmaStyles.formLabel}>Platform:</span>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div 
                  style={figmaStyles.checkboxItem}
                  onClick={() => setPlatforms({ ...platforms, android: !platforms.android })}
                >
                  <div style={{
                    ...figmaStyles.checkbox,
                    backgroundColor: platforms.android ? '#00cdba' : 'transparent',
                    borderColor: platforms.android ? '#00cdba' : '#777',
                  }}>
                    {platforms.android && <Check size={16} color="#fff" />}
                  </div>
                  <span style={figmaStyles.checkboxLabel}>Android</span>
                </div>
                <div 
                  style={figmaStyles.checkboxItem}
                  onClick={() => setPlatforms({ ...platforms, ios: !platforms.ios })}
                >
                  <div style={{
                    ...figmaStyles.checkbox,
                    backgroundColor: platforms.ios ? '#00cdba' : 'transparent',
                    borderColor: platforms.ios ? '#00cdba' : '#777',
                  }}>
                    {platforms.ios && <Check size={16} color="#fff" />}
                  </div>
                  <span style={figmaStyles.checkboxLabel}>iOS</span>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span style={figmaStyles.formLabel}>Priority:</span>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {['Low', 'Standard', 'High (ASAP)'].map((p) => (
                  <div 
                    key={p}
                    style={figmaStyles.checkboxItem}
                    onClick={() => setPriority(p)}
                  >
                    <div style={{
                      ...figmaStyles.checkbox,
                      backgroundColor: priority === p ? '#00cdba' : 'transparent',
                      borderColor: priority === p ? '#00cdba' : '#777',
                    }}>
                      {priority === p && <Check size={16} color="#fff" />}
                    </div>
                    <span style={figmaStyles.checkboxLabel}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Button */}
            <button 
              style={{
                ...figmaStyles.requestButton,
                opacity: isSubmittingAppRequest ? 0.7 : 1,
                cursor: isSubmittingAppRequest ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={handleAppRequestSubmit}
              disabled={isSubmittingAppRequest}
            >
              {isSubmittingAppRequest && <Loader2 size={18} className="animate-spin" />}
              {isSubmittingAppRequest ? 'Submitting...' : 'Request App'}
            </button>
          </div>
        </div>
      </div>

      {/* Renew Subscription Modal */}
      {showRenewModal && (
        <RenewSubscription
          isOpen={showRenewModal}
          onClose={() => setShowRenewModal(false)}
          selectedPlan={selectedPlanForRenew}
        />
      )}
    </div>
  );
};

export default AdminBilling;
