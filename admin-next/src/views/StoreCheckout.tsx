
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Product, User, WebsiteConfig, ProductVariantSelection, DeliveryConfig, PaymentMethod, Order } from '../types';

// Lazy load heavy layout components from individual files
const StoreHeader = lazy(() => import('../components/StoreHeader').then(m => ({ default: m.StoreHeader })));
const StoreFooter = lazy(() => import('../components/store/StoreFooter').then(m => ({ default: m.StoreFooter })));
const TrackOrderModal = lazy(() => import('../components/store/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));

// Skeleton loaders removed for faster initial render
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Loader2,
  ChevronDown,
  CreditCard,
  Gift,
  Headphones,
  MapPin,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  User as UserIcon,
  X,
  Plus
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { getCurrencySymbol } from '../utils/currencyHelper';

const getTrackPageView = () => import('../hooks/useVisitorStats').then(m => m.trackPageView);

interface CheckoutProps {
  product: Product;
  quantity: number;
  variant: ProductVariantSelection;
  onBack: () => void;
  onConfirmOrder: (formData: any) => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileClick?: () => void;
  logo?: string | null;
  websiteConfig?: WebsiteConfig;
  tenantId?: string;
  deliveryConfigs?: DeliveryConfig[];
  paymentMethods?: PaymentMethod[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onImageSearchClick?: () => void;
  onOpenChat?: () => void;
  cart?: number[];
  onToggleCart?: (id: number) => void;
  onCheckoutFromCart?: (productId: number) => void;
  productCatalog?: Product[];
  orders?: Order[];
  onCartOpenRef?: (openFn: () => void) => void;
}

type CheckoutFormState = {
  fullName: string;
  phone: string;
  division: string;
  district: string;
  email: string;
  address: string;
  productDescription?: string;
  cardName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
};
// Bangladesh Division -> District mapping (all 64 districts)
const BD_DISTRICTS: Record<string, string[]> = {
  Dhaka: ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  Chittagong: ['Chittagong', 'Bandarban', 'Brahmanbaria', 'Chandpur', 'Comilla', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  Rajshahi: ['Rajshahi', 'Bogra', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Nawabganj', 'Pabna', 'Sirajganj'],
  Khulna: ['Khulna', 'Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  Barisal: ['Barisal', 'Barguna', 'Bhola', 'Jhalokathi', 'Patuakhali', 'Pirojpur'],
  Sylhet: ['Sylhet', 'Habiganj', 'Moulvibazar', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
};

const StoreCheckout = ({
  product,
  quantity,
  variant,
  onBack,
  onConfirmOrder,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo,
  websiteConfig,
  deliveryConfigs,
  paymentMethods,
  searchValue,
  onSearchChange,
  onImageSearchClick,
  onOpenChat,
  tenantId,
  cart,
  onToggleCart,
  onCheckoutFromCart,
  productCatalog,
  orders = [],
  onCartOpenRef
}: CheckoutProps) => {
  const [formData, setFormData] = useState<CheckoutFormState>({
    fullName: '',
    phone: '',
    division: '',
    district: '',
    email: '',
    address: '',
    productDescription: ''
  });
  const [districtSearch, setDistrictSearch] = useState('');
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const districtRef = React.useRef<HTMLDivElement>(null);
  const districtDropdownRef = React.useRef<HTMLDivElement>(null);
  const [divisionSearch, setDivisionSearch] = useState('');
  const [isOpen, setIsDivisionOpen] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'Regular' | 'Express' | 'Free'>('Regular');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod-default');
  const [paymentInfoSaved, setPaymentInfoSaved] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dynamic currency symbol from tenant config
  const cs = getCurrencySymbol(websiteConfig?.shopCurrency);

  // Dynamic currency symbol from tenant config
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [registrationDiscount, setRegistrationDiscount] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [additionalItems, setAdditionalItems] = useState<{product: Product; quantity: number; variant: ProductVariantSelection}[]>([]);
  const [addMoreSearch, setAddMoreSearch] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [alertState, setAlertState] = useState<{ type: 'error' | 'success' | null; message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(() => sessionStorage.getItem(`draft_order_${product.id}`));

  // Close district dropdown on outside click
  useEffect(() => {
    if (!isDistrictOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target as Node)) {
        setIsDistrictOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDistrictOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!tenantId || !product) return;

    const trackCheckoutVisit = async () => {
      try {
        const trackPageView = await getTrackPageView();
        trackPageView(tenantId, '/checkout');
      } catch (error) {
        console.warn('Failed to track checkout view:', error);
      }
    };

    trackCheckoutVisit();
  }, [tenantId, product?.id]);

  useEffect(() => {
    if (deliveryConfigs && deliveryConfigs.length) {
      const firstEnabled = deliveryConfigs.find(c => c.isEnabled) || deliveryConfigs[0];
      if (firstEnabled) {
        setSelectedDeliveryType(firstEnabled.type);
      }
    }
  }, [deliveryConfigs]);

  // Pre-fill if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || ''
      }));
    }
  }, [user]);

  const subTotal = product.price * quantity + additionalItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Apply first-registration / first-purchase discount from tenant offers
  useEffect(() => {
    if (!websiteConfig?.offers || websiteConfig.offers.length === 0) {
      setRegistrationDiscount(0);
      return;
    }
    // Check if user qualifies for registration discount (logged in, no previous orders)
    const regOffer = websiteConfig.offers.find(o => o.type === 'Registration' && o.discount);
    const firstPurchaseOffer = websiteConfig.offers.find(o => o.type === 'First Purchase' && o.discount);
    
    let applicableOffer = null;
    // First Purchase: user has no orders
    if (firstPurchaseOffer && orders && orders.length === 0) {
      applicableOffer = firstPurchaseOffer;
    }
    // Registration: user is logged in and has no orders (just registered)
    if (regOffer && user && orders && orders.length === 0) {
      applicableOffer = regOffer;
    }
    
    if (applicableOffer) {
      const discStr = applicableOffer.discount.trim();
      let discAmt = 0;
      if (discStr.endsWith('%')) {
        const pct = parseFloat(discStr.replace('%', ''));
        discAmt = Math.round(subTotal * (pct / 100));
      } else {
        discAmt = parseFloat(discStr) || 0;
      }
      if (discAmt > subTotal) discAmt = subTotal;
      setRegistrationDiscount(discAmt);
    } else {
      setRegistrationDiscount(0);
    }
  }, [websiteConfig?.offers, user, orders, subTotal]);
  const discount = product.originalPrice ? (product.originalPrice - product.price) * quantity : 0;
  const activeConfig = deliveryConfigs?.find(c => c.type === selectedDeliveryType) || (deliveryConfigs && deliveryConfigs[0]);
  const computedDeliveryCharge = useMemo(() => {
    if (!activeConfig || !activeConfig.isEnabled) return 0;
    if (activeConfig.freeThreshold > 0 && subTotal >= activeConfig.freeThreshold) return 0;
    const division = formData.division || activeConfig.division;
    const isInside = division ? division === activeConfig.division : true;
    return isInside ? activeConfig.insideCharge : activeConfig.outsideCharge;
  }, [activeConfig, formData.division, subTotal]);
  const grandTotal = Math.max(0, subTotal - promoDiscount - registrationDiscount) + computedDeliveryCharge;
  const formattedProductPrice = formatCurrency(product.price);
  const formattedProductOriginalPrice = formatCurrency(product.originalPrice, null);

  const progressSteps = useMemo(() => [
    { key: 'cart', label: 'Cart' },
    { key: 'address', label: 'Address' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' }
  ], []);

  const completedSteps = useMemo(() => {
    const steps: Record<string, boolean> = {};
    // Step 1 (Cart): Always completed since user is on checkout
    steps.cart = true;
    // Step 2 (Address): Completed when required address fields are filled
    const addressFields = ['fullName', 'phone', 'division', 'district', 'address'];
    steps.address = addressFields.every(field => {
      const value = (formData as Record<string, string>)[field] || '';
      return value.trim().length > 0;
    });
    // Step 3 (Payment): Completed when a payment method is selected
    steps.payment = !!selectedPaymentMethod;
    // Step 4 (Review): Completed when all previous steps are done
    steps.review = steps.cart && steps.address && steps.payment;
    return steps;
  }, [formData, selectedPaymentMethod]);

  const validateField = useCallback((field: string, value: string) => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Please enter at least 3 characters';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^\+?\d{9,15}$/.test(value.trim())) return 'Enter a valid phone number';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(value.trim())) return 'Enter a valid email address';
        return '';
      case 'division':
        return value ? '' : 'Select a division';
      case 'district':
        return value ? '' : 'Select a district';
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 10) return 'Provide a bit more detail';
        return '';
      case 'cardName':
        return value.trim() ? '' : 'Name on card is required';
      case 'cardNumber':
        if (!value.trim()) return 'Card number is required';
        if (!/^\d{16}$/.test(value.replace(/\s/g, ''))) return 'Enter a 16-digit card number';
        return '';
      case 'expiry':
        if (!value.trim()) return 'Expiry is required';
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value.trim())) return 'Use MM/YY format';
        return '';
      case 'cvv':
        if (!value.trim()) return 'CVV is required';
        if (!/^\d{3,4}$/.test(value.trim())) return 'Enter a valid CVV';
        return '';
      default:
        return '';
    }
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const message = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: message }));
  };

  const validateForm = () => {
    const fieldsToValidate = websiteConfig?.showEmailFieldForOrder 
      ? ['fullName', 'phone', 'email', 'division', 'district', 'address']
      : ['fullName', 'phone', 'division', 'district', 'address'];
    const messages: Record<string, string> = {};
    fieldsToValidate.forEach(field => {
      const value = (formData as Record<string, string>)[field] || '';
      messages[field] = validateField(field, value);
    });
    setFormErrors(prev => ({ ...prev, ...messages }));
    setTouchedFields(prev => ({ ...prev, ...fieldsToValidate.reduce((acc, key) => ({ ...acc, [key]: true }), {}) }));
    const hasErrors = Object.values(messages).some(Boolean);
    if (hasErrors) {
      setAlertState({ type: 'error', message: 'Please fix the highlighted fields before placing your order.' });
    }
    return !hasErrors;
  };

  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoStatus({ type: 'error', message: 'Enter a promo code first.' });
      return;
    }
    
    const promoCodes = websiteConfig?.promoCodes || [];
    const matched = promoCodes.find(
      p => p.code.toLowerCase() === promoCode.trim().toLowerCase() && p.isActive !== false
    );
    
    if (!matched) {
      setPromoStatus({ type: 'error', message: 'Invalid promo code. Try another one.' });
      setPromoDiscount(0);
      setAppliedPromo(null);
      return;
    }
    
    // Check expiry
    if (matched.expiryDate && new Date(matched.expiryDate) < new Date()) {
      setPromoStatus({ type: 'error', message: 'This promo code has expired.' });
      setPromoDiscount(0);
      setAppliedPromo(null);
      return;
    }
    
    // Check min purchase
    if (matched.minPurchaseEnabled && matched.minPurchase && subTotal < matched.minPurchase) {
      setPromoStatus({ type: 'error', message: `Minimum purchase of ${cs}${matched.minPurchase} required for this code.` });
      setPromoDiscount(0);
      setAppliedPromo(null);
      return;
    }
    
    // Calculate discount
    let discountAmt = 0;
    if (matched.discountType === 'amount') {
      discountAmt = matched.discountAmount || 0;
    } else if (matched.discountType === 'percentage') {
      discountAmt = Math.round(subTotal * (matched.discountPercentage || 0) / 100);
      // Apply max discount cap
      if (matched.maxDiscountEnabled && matched.maxDiscount && discountAmt > matched.maxDiscount) {
        discountAmt = matched.maxDiscount;
      }
    }
    
    // Don't let discount exceed subtotal
    if (discountAmt > subTotal) discountAmt = subTotal;
    
    setPromoDiscount(discountAmt);
    setAppliedPromo(matched.code);
    setPromoStatus({ type: 'success', message: `Promo code applied! You save ${cs}${discountAmt.toLocaleString()}.` });
  };

  // Auto-save draft as incomplete order
  useEffect(() => {
    const shouldSave = formData.fullName.trim().length >= 3 || formData.phone.trim().length >= 5;
    if (!shouldSave) return;

    const timeoutId = setTimeout(async () => {
      const id = draftOrderId || `#${Math.floor(100000 + Math.random() * 900000)}`;
      if (!draftOrderId) {
        setDraftOrderId(id);
        sessionStorage.setItem(`draft_order_${product.id}`, id);
      }

      try {
        const selectedPayment = paymentMethods?.find(m => m.id === selectedPaymentMethod);
        const payload = {
          id,
          customer: formData.fullName || 'Draft Customer',
          phone: formData.phone,
          location: formData.address || (formData.division && formData.district ? `${formData.district}, ${formData.division}` : ''),
          amount: grandTotal,
          status: 'Incomplete',
          email: formData.email,
          division: formData.division,
          district: formData.district,
          productId: product.id,
          productName: product.name,
          productImage: product.galleryImages?.[0] || product.image,
          quantity,
          variant,
          deliveryType: selectedDeliveryType,
          deliveryCharge: computedDeliveryCharge,
          paymentMethod: selectedPayment?.name || 'Cash On Delivery',
          paymentMethodId: selectedPaymentMethod,
          source: 'store'
        };

        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'}/api/orders/${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('[Checkout] Failed to save draft:', err);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [formData, selectedDeliveryType, selectedPaymentMethod, grandTotal, tenantId, product, quantity, variant, draftOrderId, paymentMethods]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (!validateForm()) {
      setShowConfirmationModal(false);
      return;
    }

    // Clear draft ID on successful submission
    sessionStorage.removeItem(`draft_order_${product.id}`);

    // Find the selected payment method details
    const selectedPayment = paymentMethods?.find(m => m.id === selectedPaymentMethod);
    const isManualPayment = selectedPayment?.id.startsWith('self-mfs-');
    
    // Validate manual payment info is saved
    if (isManualPayment && (!paymentInfoSaved || !formData.cardName || !formData.cardNumber)) {
      setAlertState({ type: 'error', message: 'Please fill in your payment number and Transaction ID, then click "Save Payment Info".' });
      return;
    }
    
    onConfirmOrder({
      ...formData,
      id: draftOrderId || undefined,
      amount: grandTotal,
      productName: product.name,
      quantity,
      variant,
      district: formData.district,
      promoCode: appliedPromo || undefined,
      additionalItems: additionalItems.length > 0 ? additionalItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        variant: item.variant,
        image: item.product.galleryImages?.[0] || item.product.image || '',
      })) : undefined,
      promoDiscount: promoDiscount > 0 ? promoDiscount : undefined,
      registrationDiscount: registrationDiscount > 0 ? registrationDiscount : undefined,
      deliveryType: selectedDeliveryType,
      deliveryCharge: computedDeliveryCharge,
      // Payment method info
      paymentMethod: selectedPayment?.name || 'Cash On Delivery',
      paymentMethodId: selectedPaymentMethod,
      transactionId: isManualPayment ? formData.cardNumber : undefined,
      customerPaymentPhone: isManualPayment ? formData.cardName : undefined
    });
    setAlertState({ type: 'success', message: 'Order details captured successfully.' });
    setShowConfirmationModal(true);
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 mobile-smooth-scroll" style={{ background: 'linear-gradient(to bottom, #EFF6FF, #F0F9FF)' }}>
      <Suspense fallback={null}>
        <StoreHeader
          onHomeClick={onBack}
          onTrackOrder={() => setIsTrackOrderOpen(true)}
          user={user}
          onLoginClick={onLoginClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          logo={logo}
          websiteConfig={websiteConfig}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          cart={cart}
          onToggleCart={onToggleCart}
          onCheckoutFromCart={onCheckoutFromCart}
          productCatalog={productCatalog}
          onCartOpenRef={onCartOpenRef}
        />
      </Suspense>

      <main className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 space-y-2 sm:space-y-4 pb-20 md:pb-6">
        <section className="glass-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-6 z-10 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-400">Checkout</p>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-2">🛒 Complete your purchase</h1>
              <p className="text-xs sm:text-sm text-gray-600">Almost there! Just a few more steps.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="hidden sm:flex items-center gap-2 rounded-full border-2 border-orange-400 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                onClick={() => setShowOfferModal(true)}
              >
                <Gift size={16} /> View offers
              </button>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-sky-700 font-semibold bg-sky-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-sky-200">
                <ShieldCheck size={14} className="sm:w-[18px] sm:h-[18px]" /> 100% secure
              </div>
            </div>
          </div>
          <div className="mt-2 sm:mt-4 flex flex-col md:flex-row gap-2 sm:gap-4">
            {progressSteps.map((step, index) => {
              const isCompleted = completedSteps[step.key] || false;
              const prevCompleted = index === 0 || completedSteps[progressSteps[index - 1].key] || false;
              const active = isCompleted || prevCompleted;
              return (
                <div key={step.key} className="flex-1 flex items-center gap-1.5 sm:gap-2 md:gap-3">
                  <div
                    className={`mobile-progress-step h-7 w-7 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm font-bold transition-all ${isCompleted
                      ? 'bg-gradient-to-br from-sky-400 to-sky-500 shadow-lg shadow-sky-200 text-white border-transparent'
                        : active
                        ? 'bg-gradient-to-br from-sky-400 to-sky-500 shadow-lg shadow-sky-200 text-white border-transparent'
                        : 'border-gray-300 text-gray-400 bg-white'
                      }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Step {index + 1}</p>
                    <p className={`text-xs sm:text-sm font-semibold transition ${active ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</p>
                  </div>
                  {index < progressSteps.length - 1 && (
                    <div className={`hidden md:block flex-1 h-1 rounded-full transition ${isCompleted ? 'bg-sky-400' : active ? 'bg-sky-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <div className="flex-1 space-y-2 sm:space-y-4 md:space-y-6">
            {isLoading && (
              <div className="space-y-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
            )}
            {!isLoading && (
              <>
                {deliveryConfigs && deliveryConfigs.length > 0 && (
                  <div className="glass-card p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl animate-slide-up">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 sm:mb-2">🚚 Delivery Options</h2>
                      <span className="text-[10px] sm:text-xs text-gray-500">Choose the best speed for you</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {deliveryConfigs.map(config => {
                        const isActive = selectedDeliveryType === config.type;
                        return (
                          <button
                            key={config.type}
                            type="button"
                            onClick={() => setSelectedDeliveryType(config.type)}
                            className={`mobile-delivery-card mobile-touch-feedback text-left flex flex-col gap-1 ${isActive ? 'selected' : ''
                              } ${!config.isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            disabled={!config.isEnabled}
                          >
                            <p className="font-bold text-gray-800 flex items-center gap-2">
                              {config.type} Delivery
                              {isActive && <CheckCircle2 size={16} className="text-orange-500" />}
                            </p>
                            <p className="text-xs text-gray-500">Inside city: {cs} {config.insideCharge}</p>
                            <p className="text-xs text-gray-500">Outside city: {cs} {config.outsideCharge}</p>
                            {config.freeThreshold > 0 && (
                              <p className="text-xs text-orange-600 mt-1 font-semibold">Free over {cs} {config.freeThreshold}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {activeConfig && (
                      <p className="text-xs text-gray-500 mt-4">{activeConfig.note}</p>
                    )}
                  </div>
                )}

                <div className="glass-card p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl animate-slide-up">
                  <div className="flex items-center justify-between mb-3 sm:mb-6 border-b border-gray-100 pb-2 sm:pb-4">
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Step 1</p>
                      <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-2">📍 Delivery Address</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Where should we deliver your order?</p>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-orange-200">Auto-fill</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2.5">Your Full Name <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <UserIcon className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.fullName && touchedFields.fullName ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-sky-500'}`} size={18} />
                        <input
                          type="text"
                          placeholder="John Doe"
                          autoComplete="name"
                          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 rounded-xl sm:rounded-2xl text-sm transition-all duration-200 focus:outline-none !text-gray-900 placeholder:text-gray-400 border-gray-200 !bg-white hover:border-gray-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 [-webkit-autofill]:!bg-white [-webkit-autofill]:!text-gray-900 [-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] ${formErrors.fullName && touchedFields.fullName ? 'error' : ''
                            }`}
                          value={formData.fullName}
                          onChange={e => updateField('fullName', e.target.value)}
                          aria-invalid={!!(formErrors.fullName && touchedFields.fullName)}
                          aria-describedby={formErrors.fullName && touchedFields.fullName ? 'fullName-error' : undefined}
                        />
                      </div>
                      {formErrors.fullName && touchedFields.fullName && (
                        <p id="fullName-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle size={14} /> {formErrors.fullName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2.5">Phone Number <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.phone && touchedFields.phone ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-sky-500'}`} size={18} />
                        <input
                          type="number"
                          placeholder="+880 1XXX-XXXXXX"
                          autoComplete="tel"
                          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 rounded-xl sm:rounded-2xl text-sm transition-all duration-200 focus:outline-none !text-gray-900 placeholder:text-gray-400 [-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] ${formErrors.phone && touchedFields.phone
                              ? 'border-rose-300 !bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                              : 'border-gray-200 !bg-white hover:border-gray-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
                            }`}
                          value={formData.phone}
                          onChange={e => updateField('phone', e.target.value)}
                          aria-invalid={!!(formErrors.phone && touchedFields.phone)}
                          aria-describedby={formErrors.phone && touchedFields.phone ? 'phone-error' : undefined}
                        />
                      </div>
                      {formErrors.phone && touchedFields.phone && (
                        <p id="phone-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle size={14} /> {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-6">
                    {websiteConfig?.showEmailFieldForOrder && (
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2.5">Email Address <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.email && touchedFields.email ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-sky-500'}`} size={18} />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 rounded-xl sm:rounded-2xl text-sm transition-all duration-200 focus:outline-none !text-gray-900 placeholder:text-gray-400 [-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] ${formErrors.email && touchedFields.email
                              ? 'border-rose-300 !bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                              : 'border-gray-200 !bg-white hover:border-gray-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
                            }`}
                          value={formData.email}
                          onChange={e => updateField('email', e.target.value)}
                          aria-invalid={!!(formErrors.email && touchedFields.email)}
                          aria-describedby={formErrors.email && touchedFields.email ? 'email-error' : undefined}
                        />
                      </div>
                      {formErrors.email && touchedFields.email && (
                        <p id="email-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle size={14} /> {formErrors.email}
                        </p>
                      )}
                    </div>
                    )}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2.5">Division/Region <span className="text-rose-500">*</span></label>
                      <div className="relative group" ref={districtRef}>
                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 z-10 ${formErrors.division && touchedFields.division ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-sky-500'}`} size={18} />
                        <div
                          className={`w-full pl-10 sm:pl-12 pr-8 sm:pr-10 py-2.5 sm:py-3.5 border-2 rounded-xl sm:rounded-2xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-between ${formErrors.division && touchedFields.division
                              ? 'border-rose-300 bg-rose-50/50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            } text-gray-800`}
                          onClick={() => setIsDivisionOpen(!isOpen)}
                        >
                          <span className={formData.division ? 'text-gray-800' : 'text-gray-400'}>
                            {formData.division || 'Select Division'}
                          </span>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isOpen && (
                          <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-hidden">
                            <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                              <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search division..."
                                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 !bg-white rounded-xl focus:outline-none focus:border-sky-400 !text-gray-900 placeholder:text-gray-400"
                                  value={divisionSearch}
                                  onChange={e => setDivisionSearch(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              {["Dhaka", "Chittagong", "Sylhet", "Khulna", "Rajshahi", "Barisal", "Rangpur", "Mymensingh"].filter(d => d.toLowerCase().includes(divisionSearch.toLowerCase())).map(d => (
                                <div
                                  key={d}
                                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sky-50 transition-colors ${formData.division === d ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-gray-700'}`}
                                  onClick={() => {
                                    updateField('division', d);
                                    setIsDivisionOpen(false);
                                    setDivisionSearch('');
                                    setFormData(prev => ({ ...prev, district: '' }));
                                    setFormErrors(prev => ({ ...prev, district: '' }));
                                  }}
                                >
                                  {d}
                                </div>
                              ))}
                              {["Dhaka", "Chittagong", "Sylhet", "Khulna", "Rajshahi", "Barisal", "Rangpur", "Mymensingh"].filter(d => d.toLowerCase().includes(divisionSearch.toLowerCase())).length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-400 text-center">No division found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {formErrors.division && touchedFields.division && (
                        <p id="division-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle size={14} /> {formErrors.division}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2.5">District/Zila <span className="text-rose-500">*</span></label>
                      <div className="relative group" ref={districtRef}>
                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 z-10 ${formErrors.district && touchedFields.district ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-sky-500'}`} size={18} />
                        <div
                          className={`w-full pl-10 sm:pl-12 pr-8 sm:pr-10 py-2.5 sm:py-3.5 border-2 rounded-xl sm:rounded-2xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-between ${formErrors.district && touchedFields.district
                              ? 'border-rose-300 bg-rose-50/50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            } text-gray-800`}
                          onClick={() => {
                            if (!formData.division) {
                              updateField('division', '');
                              return;
                            }
                            setIsDistrictOpen(!isDistrictOpen);
                          }}
                        >
                          <span className={formData.district ? 'text-gray-800' : 'text-gray-400'}>
                            {formData.district || (formData.division ? 'Select District' : 'Select Division first')}
                          </span>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDistrictOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isDistrictOpen && formData.division && (
                          <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-hidden">
                            <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                              <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search district..."
                                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 !bg-white rounded-xl focus:outline-none focus:border-sky-400 !text-gray-900 placeholder:text-gray-400"
                                  value={districtSearch}
                                  onChange={e => setDistrictSearch(e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              {(BD_DISTRICTS[formData.division] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).map(d => (
                                <div
                                  key={d}
                                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sky-50 transition-colors ${formData.district === d ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-gray-700'}`}
                                  onClick={() => {
                                    updateField('district', d);
                                    setIsDistrictOpen(false);
                                    setDistrictSearch('');
                                  }}
                                >
                                  {d}
                                </div>
                              ))}
                              {(BD_DISTRICTS[formData.division] || []).filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-400 text-center">No district found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {formErrors.district && touchedFields.district && (
                        <p id="district-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle size={14} /> {formErrors.district}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2.5">Delivery Address <span className="text-rose-500">*</span></label>
                    <div className="relative group">
                      <MapPin className={`absolute left-3 sm:left-4 top-4 pointer-events-none transition-colors duration-200 ${formErrors.address && touchedFields.address ? 'text-rose-400' : 'text-gray-400 group-focus-within:text-sky-500'}`} size={18} />
                      <textarea
                        placeholder="House #, Road #, Area, City"
                        autoComplete="street-address"
                        className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 rounded-xl sm:rounded-2xl text-sm transition-all duration-200 focus:outline-none min-h-[80px] sm:min-h-[120px] resize-none !text-gray-900 placeholder:text-gray-400 [-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] ${formErrors.address && touchedFields.address
                            ? 'border-rose-300 !bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                            : 'border-gray-200 !bg-white hover:border-gray-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
                          }`}
                        value={formData.address}
                        onChange={e => updateField('address', e.target.value)}
                        aria-invalid={!!(formErrors.address && touchedFields.address)}
                        aria-describedby={formErrors.address && touchedFields.address ? 'address-error' : undefined}
                      ></textarea>
                    </div>
                    {formErrors.address && touchedFields.address && (
                      <p id="address-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle size={14} /> {formErrors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2.5">Special Instructions <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <textarea
                      placeholder="Add any special requests or instructions..."
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-200 !bg-white rounded-xl sm:rounded-2xl text-sm transition-all duration-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 hover:border-gray-300 resize-none min-h-[60px] sm:min-h-[100px] !text-gray-900 placeholder:text-gray-400"
                      value={formData.productDescription || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, productDescription: value }));
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1 sm:mt-2 flex items-center gap-1"><Gift size={12} /> Let us know about any specific requirements</p>
                  </div>
                </div>


                {/* Payment Methods Section */}
                <div className="glass-card p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl animate-slide-up">
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Step 2</p>
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-0.5 sm:mb-2">💳 Select a Payment Option</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Choose your preferred payment method</p>
                      </div>
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm">
                        <ShieldCheck size={12} className="sm:w-[14px] sm:h-[14px]" /> Secure
                      </span>
                    </div>
                    
                    {/* Payment Method Cards */}
                    {(() => { console.log('[StoreCheckout] paymentMethods:', paymentMethods); return null; })()}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                      {(paymentMethods && paymentMethods.length > 0 ? paymentMethods.filter(m => m.isEnabled) : [
                        { id: 'cod-default', provider: 'cod', name: 'Cash On Delivery', isEnabled: true, logo: undefined }
                      ]).map((method) => {
                        const isSelected = selectedPaymentMethod === method.id;
                        const logoMap: Record<string, string> = {
                          bkash: 'https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg',
                          nagad: 'https://hdnfltv.com/image/nitimages/pasted_1770952876471.webp',
                          rocket: 'https://hdnfltv.com/image/nitimages/pasted_1770952937066.webp',
                          upay: 'https://hdnfltv.com/image/nitimages/pasted_1770952990491.webp',
                          tap: 'https://hdnfltv.com/image/nitimages/pasted_1770953059804.webp',
                          sslcommerz: 'https://sslcommerz.com/wp-content/uploads/2021/11/sslcommerz.png'
                        };
                        // Use provider logo for cards, not QR code
                        const logo = logoMap[method.provider] || '';
                        
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 sm:gap-3 min-h-[80px] sm:min-h-[100px] shadow-sm hover:shadow-lg transform hover:scale-[1.02] relative ${
                              isSelected 
                              ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-md ring-2 ring-orange-200'
                              : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 size={16} className="absolute top-2 left-2 text-orange-500" />
                            )}
                            {method.provider === 'cod' ? (
                              <Banknote size={24} className="sm:w-7 sm:h-7 text-orange-600" />
                            ) : logo ? (
                              <img src={logo} alt={method.name} className="h-6 sm:h-8 object-contain" />
                            ) : (
                              <CreditCard size={24} className="sm:w-7 sm:h-7 text-gray-500" />
                            )}
                            <span className="text-xs sm:text-sm font-medium text-gray-700">{method.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Selected Payment Method Details */}
                    {(() => {
                      const selected = paymentMethods?.find(m => m.id === selectedPaymentMethod);
                      const qrCodeUrl = (selected as any)?.qrCodeUrl || selected?.logo;
                      // Show details for manual payment methods (self-mfs) or any method with account number
                      if (selected && selected.provider !== 'cod' && (selected.accountNumber || selected.paymentInstruction || qrCodeUrl)) {
                        return (
                          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            {/* QR Code and Account Info Row */}
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                              {/* QR Code if available */}
                              {qrCodeUrl && (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={qrCodeUrl} 
                                    alt="Payment QR Code" 
                                    className="w-32 h-32 object-contain rounded-lg border border-gray-200 bg-white p-1"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                {/* Account Number */}
                                {selected.accountNumber && (
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className="font-bold text-gray-800 flex items-center gap-2">
                                      +88{selected.accountNumber}
                                      <button 
                                        type="button" 
                                        onClick={() => { 
                                          navigator.clipboard.writeText(selected.accountNumber || ''); 
                                          // Show copy feedback
                                          const btn = document.activeElement as HTMLButtonElement;
                                          btn.classList.add('bg-green-100');
                                          setTimeout(() => btn.classList.remove('bg-green-100'), 500);
                                        }}
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        title="Copy number"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                      </button>
                                    </span>
                                  </div>
                                )}
                                
                                {/* Payment Type Badge */}
                                {selected.paymentType && (
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-2">
                                    {selected.paymentType === 'merchant' ? 'Merchant Payment' : 
                                     selected.paymentType === 'send_money' ? 'Send Money' : 
                                     selected.paymentType === 'personal' ? 'Personal' : selected.paymentType}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Payment Instruction (supports HTML from RichTextEditor) */}
                            {selected.paymentInstruction && (
                              <div 
                                className="text-sm text-gray-700 mb-4 prose prose-sm max-w-none [&_img]:max-w-full [&_img]:rounded-lg [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 bg-white p-3 rounded-lg border border-gray-100"
                                dangerouslySetInnerHTML={{ __html: selected.paymentInstruction }}
                              />
                            )}
                            
                            {/* Payment Input Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your {selected.name} Number:</label>
                                <input
                                  type="text"
                                  placeholder={`017XXXXXXXX*`}
                                  className="w-full px-4 py-2.5 border border-gray-300 !bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none !text-gray-900 placeholder:text-gray-400 [-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]"
                                  value={formData.cardName || ''}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, cardName: e.target.value }));
                                    setPaymentInfoSaved(false); // Reset saved state when editing
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID:</label>
                                <input
                                  type="text"
                                  placeholder="Transaction Id*"
                                  className="w-full px-4 py-2.5 border border-gray-300 !bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none !text-gray-900 placeholder:text-gray-400 [-webkit-autofill]:shadow-[0_0_0_1000px_white_inset]"
                                  value={formData.cardNumber || ''}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, cardNumber: e.target.value }));
                                    setPaymentInfoSaved(false); // Reset saved state when editing
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Save Payment Info Button - Only show when both fields are filled */}
                            {formData.cardName && formData.cardNumber && (
                              <div className="mt-4">
                                {paymentInfoSaved ? (
                                  <div className="flex items-center gap-2 text-green-600 font-medium">
                                    <CheckCircle2 size={20} />
                                    <span>Payment information saved!</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPaymentInfoSaved(true)}
                                    className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all shadow-md shadow-orange-200"
                                  >
                                    Save Payment Info
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-full lg:w-96">
            <div className="glass-card rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 animate-scale-in w-full">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-6">Order Items ({quantity + additionalItems.reduce((s, i) => s + i.quantity, 0)} Items)</h2>

              <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded border border-gray-200 p-0.5 sm:p-1 flex-shrink-0">
                  <img
                    src={normalizeImageUrl(product.galleryImages?.[0] || product.image)}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 pr-2">{product.name}</h3>
                    <button className="text-gray-400 hover:text-red-500 flex-shrink-0" type="button">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Variant: <span className="font-semibold text-gray-700">{variant.color} / {variant.size}</span></p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                    <div className="flex items-center border border-gray-200 rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-gray-50">
                      <span className="px-1 sm:px-2">{quantity} {product.unitName || "pcs"}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-bold text-gray-800 text-xs sm:text-sm">{cs} {formattedProductPrice}</span>
                      {formattedProductOriginalPrice && (
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through">{cs} {formattedProductOriginalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Items */}
              {additionalItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 sm:gap-3 mb-2 sm:mb-4 pb-2 sm:pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded border border-gray-200 p-0.5 sm:p-1 flex-shrink-0">
                    <img src={normalizeImageUrl(item.product.galleryImages?.[0] || item.product.image)} alt={item.product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{item.product.name}</h4>
                      <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => setAdditionalItems(prev => prev.filter((_, i) => i !== idx))}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button type="button" className="px-2 py-0.5 text-xs hover:bg-gray-100" onClick={() => { setAdditionalItems(prev => { const u = [...prev]; if (u[idx].quantity > 1) u[idx] = {...u[idx], quantity: u[idx].quantity - 1}; return u; }); }}>-</button>
                        <span className="px-2 text-xs">{item.quantity}</span>
                        <button type="button" className="px-2 py-0.5 text-xs hover:bg-gray-100" onClick={() => { setAdditionalItems(prev => { const u = [...prev]; u[idx] = {...u[idx], quantity: u[idx].quantity + 1}; return u; }); }}>+</button>
                      </div>
                      <span className="text-xs font-bold">{cs} {(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add more items button */}
              <button
                type="button"
                onClick={() => setShowAddMoreModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 sm:py-3 border-2 border-dashed border-orange-300 rounded-lg sm:rounded-xl text-orange-500 hover:bg-orange-50 transition-colors text-xs sm:text-sm font-semibold mb-3 sm:mb-4"
              >
                <Plus size={14} /> Add more items
              </button>

              <div className="space-y-2 sm:space-y-3 border-t border-gray-100 pt-2 sm:pt-4 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Selected Variant:</span>
                  <span className="font-medium text-gray-800">{variant.color} / {variant.size}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sub Total:</span>
                  <span className="font-medium">{cs} {subTotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span className="font-medium text-rose-500">-{cs} {discount.toLocaleString()}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Promo ({appliedPromo}):</span>
                    <span className="font-medium text-orange-600">-{cs} {promoDiscount.toLocaleString()}</span>
                  </div>
                )}
                {registrationDiscount > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Registration Offer:</span>
                    <span className="font-medium text-purple-600">-{cs} {registrationDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge ({selectedDeliveryType}):</span>
                  <span className="font-medium">{cs} {computedDeliveryCharge}</span>
                </div>
                <div className="flex justify-between text-gray-800 text-base sm:text-lg font-bold border-t border-dashed border-gray-200 pt-2 sm:pt-3 mt-1 sm:mt-2">
                  <span>Total:</span>
                  <span>{cs} {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Promo Code Input */}
              {(websiteConfig?.promoCodes || []).filter(p => p.isActive !== false && (!p.expiryDate || new Date(p.expiryDate) >= new Date())).length > 0 && (
              <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 sm:mb-2 block">Have a coupon code?</label>
                <div className="flex gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 min-w-0 px-2.5 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 !bg-white rounded-lg sm:rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:ring-2 sm:focus:ring-4 focus:ring-sky-100 transition-all duration-200 !text-gray-900 placeholder:text-gray-400 hover:border-gray-300 font-semibold tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={applyPromoCode}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-900 text-white text-xs sm:text-sm font-bold hover:bg-gray-800 transition-colors duration-200 shadow-md hover:shadow-lg whitespace-nowrap flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {promoStatus.message && (
                  <p className={`text-[10px] sm:text-xs font-semibold mt-1.5 ${promoStatus.type === 'success' ? 'text-orange-600' : 'text-rose-500'}`}>
                    {promoStatus.message}
                  </p>
                )}
              </div>
              )}

              <div className="mt-3 sm:mt-6 flex flex-col gap-2 sm:gap-3">
                <button
                  onClick={handleSubmit}
                  className="flex-1 font-lato text-white py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-2 text-sm sm:text-base transition-all duration-200 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 hover:shadow-lg shadow-sky-200"
                >
                  Confirm Order • {cs}{grandTotal.toLocaleString()}
                </button>
                <button
                  onClick={onBack}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-xs sm:text-sm flex items-center justify-center gap-2 mobile-touch-feedback"
                >
                  <ArrowLeft size={14} /> Continue Shopping
                </button>
              </div>

              <div className="mt-4 sm:mt-8 space-y-2 sm:space-y-4 text-xs sm:text-sm">
                {/* <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-theme-primary" />
                  <span className="font-semibold text-gray-700">Money-back guarantee within 7 days.</span>
                </div> */}
                {(websiteConfig?.chatSupportPhone || websiteConfig?.chatSupportWhatsapp) && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Headphones size={16} className="sm:w-5 sm:h-5 text-indigo-500" />
                  <span className="text-gray-600">Need help? <a className="text-indigo-600 font-semibold" href={`tel:${websiteConfig?.chatSupportPhone || websiteConfig?.chatSupportWhatsapp}`}>{websiteConfig?.chatSupportPhone || websiteConfig?.chatSupportWhatsapp}</a></span>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add More Items Modal */}
      {showAddMoreModal && productCatalog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-800" onClick={() => { setShowAddMoreModal(false); setAddMoreSearch(''); }}>
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add More Products</h3>
            <input
              type="text"
              placeholder="Search products..."
              value={addMoreSearch}
              onChange={(e) => setAddMoreSearch(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 !bg-white rounded-xl mb-4 focus:outline-none focus:border-sky-400 !text-gray-900 placeholder:text-gray-400"
            />
            <div className="overflow-y-auto flex-1 space-y-2">
              {productCatalog
                .filter(p => p.id !== product.id && (!addMoreSearch || p.name.toLowerCase().includes(addMoreSearch.toLowerCase())))
                .slice(0, 20)
                .map(p => {
                  const alreadyAdded = additionalItems.find(a => a.product.id === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-sky-300 hover:bg-sky-50/30 transition-all">
                      <div className="w-12 h-12 bg-gray-50 rounded border p-1 flex-shrink-0">
                        <img src={normalizeImageUrl(p.galleryImages?.[0] || p.image)} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs font-bold text-orange-600">{cs} {p.price?.toLocaleString()}</p>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-orange-600 font-semibold px-3 py-1.5 bg-sky-50 rounded-full">Added</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const defaultVariant: ProductVariantSelection = {
                              color: p.variants?.[0]?.color || 'Default',
                              size: p.variants?.[0]?.sizes?.[0]?.size || 'Standard'
                            };
                            setAdditionalItems(prev => [...prev, { product: p, quantity: 1, variant: defaultVariant }]);
                          }}
                          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
            <button
              type="button"
              onClick={() => { setShowAddMoreModal(false); setAddMoreSearch(''); }}
              className="mt-4 w-full rounded-full bg-gray-900 text-white font-semibold py-3 text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
              onClick={() => setShowOfferModal(false)}
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <Gift size={32} className="text-sky-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Exclusive</p>
                <h3 className="text-xl font-bold text-gray-900">Limited-time discounts</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {/* Tenant Offers: Registration, First Purchase, Referral */}
              {(websiteConfig?.offers || []).filter(o => o.discount).map((offer, i) => {
                const discStr = offer.discount.trim();
                const isPercent = discStr.endsWith('%');
                const discLabel = isPercent ? discStr : `${cs}${discStr}`;
                const typeLabel = offer.type === 'Registration' ? '🎁 Registration Discount' : offer.type === 'First Purchase' ? '🛍️ First Purchase Discount' : `🎉 ${offer.type} Discount`;
                return (
                  <li key={`offer-${i}`} className="flex items-start gap-2 p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-purple-500 mt-0.5">✨</span>
                    <span className="text-purple-800"><span className="font-semibold">{typeLabel}</span> — Get <span className="font-bold text-purple-900">{discLabel} off</span> on your {offer.type === 'Registration' ? 'first order after registration' : offer.type === 'First Purchase' ? 'very first purchase' : 'referral order'}!</span>
                  </li>
                );
              })}
              {/* Promo Codes / Coupons */}
              {(websiteConfig?.promoCodes || []).filter(p => p.isActive !== false && (!p.expiryDate || new Date(p.expiryDate) >= new Date())).map((promo, i) => (
                <li key={`promo-${i}`} className="flex items-center gap-2">
                  <span className="text-sky-500">✅</span>
                  <span>Use code <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-900">{promo.code}</span> for {promo.discountType === 'amount' ? `${cs}${promo.discountAmount} off` : `${promo.discountPercentage}% off`}
                  {promo.minPurchase ? ` on orders above ${cs}${promo.minPurchase.toLocaleString()}` : ''}.
                  </span>
                </li>
              ))}
              {((!websiteConfig?.promoCodes || websiteConfig.promoCodes.filter(p => p.isActive !== false).length === 0) && (!websiteConfig?.offers || websiteConfig.offers.filter(o => o.discount).length === 0)) && (
                <li className="flex items-center gap-2"><span className="text-sky-500">✅</span> Check back soon for exclusive offers!</li>
              )}
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-gray-900 text-white font-semibold py-3 text-sm"
              onClick={() => setShowOfferModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 text-center shadow-2xl">
            <div className="mx-auto h-16 w-16 rounded-full bg-sky-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-sky-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Order placed successfully!</h3>
            <p className="text-sm text-gray-600 mb-6">We sent a confirmation email with the next steps. Sit tight while we prepare your delivery.</p>
            <button
              type="button"
              className="w-full rounded-full bg-gray-900 text-white font-semibold py-3 text-sm"
              onClick={() => setShowConfirmationModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {alertState.type && (
        <div className="fixed bottom-6 right-6 z-40">
          <div
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl border text-sm font-semibold max-w-sm ${alertState.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-sky-300 bg-sky-50 text-sky-700'
              }`}
          >
            {alertState.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <div className="flex-1">{alertState.message}</div>
            <button
              type="button"
              className="text-xs uppercase tracking-wide"
              onClick={() => setAlertState({ type: null, message: '' })}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <StoreFooter websiteConfig={websiteConfig} logo={logo} tenantId={tenantId} onOpenChat={onOpenChat} />
      </Suspense>

      {isTrackOrderOpen && (
        <Suspense fallback={null}>
          <TrackOrderModal onClose={() => setIsTrackOrderOpen(false)} orders={orders} />
        </Suspense>
      )}
    </div>
  );
};

export default StoreCheckout;
