import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Gift,
  CheckCircle2,
  ShoppingCart,
  Phone,
  MapPin,
  User,
  Minus,
  Plus,
  Star,
  Shield,
  Truck,
  CreditCard,
  AlertCircle,
  Loader2,
  Sparkles,
  BadgeCheck,
  Package,
  HeartHandshake,
  HelpCircle,
  MessageSquare,
  Play,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Language translations
const translations = {
  English: {
    specialOffer: 'Special Offer',
    offerExpired: '⏰ This offer has expired!',
    offerEndsIn: '⏰ Offer Ends In:',
    hurryOfferEnds: '🔥 Hurry! Offer Ends In:',
    limitedTime: '⚡ Limited time left! Order now!',
    days: 'Days',
    hours: 'Hours',
    mins: 'Mins',
    secs: 'Secs',
    specialPrice: 'Special Price',
    off: 'OFF',
    selectQuantity: 'Select Quantity',
    total: 'Total',
    save: 'Save',
    yourName: 'Your Name *',
    phoneNumber: 'Phone Number * (01XXXXXXXXX)',
    fullAddress: 'Full Address *',
    orderSuccess: 'Order Successful! 🎉',
    orderSuccessMsg: 'We will contact you shortly.',
    orderNow: 'Order Now',
    processing: 'Processing...',
    secure: 'Secure',
    fastDelivery: 'Fast Delivery',
    cod: 'COD',
    offerDetails: 'Offer Details',
    whyBuyProduct: 'Why Buy This Product?',
    whyChooseUs: 'Why Choose Us?',
    original: '100% Original',
    nationwideDelivery: 'Nationwide Delivery',
    cashOnDelivery: 'Cash on Delivery',
    returnGuarantee: 'Return Guarantee',
    orderNowTitle: 'Order Now',
    freeDelivery: 'Free Delivery Nationwide',
    allRightsReserved: 'All rights reserved.',
    contact: 'Contact:',
    enterName: 'Please enter your name',
    enterValidPhone: 'Please enter a valid phone number',
    enterAddress: 'Please enter your delivery address',
    orderFailed: 'Failed to submit order. Please try again.',
    faq: 'Frequently Asked Questions',
    customerReviews: 'Customer Reviews',
    watchVideo: 'Watch Product Video'
  },
  Bangla: {
    specialOffer: 'বিশেষ অফার',
    offerExpired: '⏰ এই অফারের মেয়াদ শেষ!',
    offerEndsIn: '⏰ অফার শেষ হবে:',
    hurryOfferEnds: '🔥 তাড়াতাড়ি করুন! অফার শেষ হবে:',
    limitedTime: '⚡ সময় সীমিত! এখনই অর্ডার করুন!',
    days: 'দিন',
    hours: 'ঘন্টা',
    mins: 'মিনিট',
    secs: 'সেকেন্ড',
    specialPrice: 'বিশেষ মূল্য',
    off: 'ছাড়',
    selectQuantity: 'পরিমাণ নির্বাচন করুন',
    total: 'মোট',
    save: 'সাশ্রয়',
    yourName: 'আপনার নাম *',
    phoneNumber: 'মোবাইল নম্বর * (01XXXXXXXXX)',
    fullAddress: 'সম্পূর্ণ ঠিকানা *',
    orderSuccess: 'অর্ডার সফল! 🎉',
    orderSuccessMsg: 'শীঘ্রই যোগাযোগ করা হবে।',
    orderNow: 'অর্ডার করুন',
    processing: 'প্রক্রিয়াকরণ হচ্ছে...',
    secure: 'নিরাপদ',
    fastDelivery: 'দ্রুত ডেলিভারি',
    cod: 'ক্যাশ অন ডেলিভারি',
    offerDetails: 'অফারের বিস্তারিত',
    whyBuyProduct: 'কেন এই পণ্য নেবেন?',
    whyChooseUs: 'আমাদের কেন বেছে নেবেন?',
    original: '100% অরিজিনাল',
    nationwideDelivery: 'সারাদেশে ডেলিভারি',
    cashOnDelivery: 'ক্যাশ অন ডেলিভারি',
    returnGuarantee: 'রিটার্ন গ্যারান্টি',
    orderNowTitle: 'এখনই অর্ডার করুন',
    freeDelivery: 'ফ্রি ডেলিভারি সারাদেশে',
    allRightsReserved: 'সর্বস্বত্ব সংরক্ষিত।',
    contact: 'যোগাযোগ:',
    enterName: 'আপনার নাম লিখুন',
    enterValidPhone: 'সঠিক মোবাইল নম্বর লিখুন',
    enterAddress: 'ডেলিভারি ঠিকানা লিখুন',
    orderFailed: 'অর্ডার জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    faq: 'সচরাচর জিজ্ঞাসা',
    customerReviews: 'কাস্টমার রিভিউ',
    watchVideo: 'পণ্যের ভিডিও দেখুন'
  }
};

type Language = 'English' | 'Bangla';

interface OfferPageBenefit {
  id: string;
  text: string;
  icon?: string;
}

interface OfferPageFAQ {
  id: string;
  question: string;
  answer: string;
}

interface OfferPageReview {
  id: string;
  name: string;
  quote: string;
  rating: number;
  image?: string;
}

interface OfferPageData {
  _id: string;
  productTitle: string;
  productId?: string;
  searchQuery?: string;
  imageUrl: string;
  productImages?: string[];
  offerEndDate: string;
  description: string;
  productOfferInfo: string;
  paymentSectionTitle: string;
  benefits: OfferPageBenefit[];
  whyBuySection: string;
  // New dynamic sections
  faqs?: OfferPageFAQ[];
  faqHeadline?: string;
  reviews?: OfferPageReview[];
  reviewHeadline?: string;
  videoLink?: string;
  backgroundColor?: string;
  textColor?: string;
  urlSlug: string;
  status: 'draft' | 'published' | 'archived';
  views?: number;
  orders?: number;
  price?: number;
  originalPrice?: number;
}

interface OfferLandingPageProps {
  offerPage: OfferPageData;
  onOrder?: (data: {
    name: string;
    phone: string;
    address: string;
    quantity: number;
    offerPageId: string;
  }) => Promise<void>;
  tenantSubdomain?: string;
  websiteConfig?: {
    websiteName?: string;
    whatsappNumber?: string;
    phones?: string[];
    orderLanguage?: Language;
  };
}

// Animated countdown timer with urgency indicators
const CountdownTimer: React.FC<{ endDate: string; lang: Language }> = ({ endDate, lang }) => {
  const t = translations[lang];
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      setIsUrgent(difference < 24 * 60 * 60 * 1000);
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white py-4 px-3 sm:px-4 lg:px-6 rounded-2xl text-center shadow-lg">
        <p className="font-bold text-lg sm:text-xl">{t.offerExpired}</p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className={`bg-white text-gray-900 rounded-xl w-[52px] h-[52px] xs:w-16 xs:h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 ${isUrgent ? 'animate-pulse' : ''}`}>
        <span className="text-lg xs:text-2xl sm:text-3xl font-bold tabular-nums">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-white text-[10px] xs:text-xs sm:text-sm mt-1.5 sm:mt-2 font-medium uppercase tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className={`${isUrgent ? 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600' : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600'} py-4 sm:py-6 px-3 sm:px-6 rounded-2xl shadow-xl`}>
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
        <Clock className="text-white animate-bounce" size={18} />
        <p className="text-white font-bold text-xs sm:text-lg">
          {isUrgent ? t.hurryOfferEnds : t.offerEndsIn}
        </p>
      </div>
      <div className="flex justify-center gap-2 xs:gap-3 sm:gap-4">
        <TimeBlock value={timeLeft.days} label={t.days} />
        <TimeBlock value={timeLeft.hours} label={t.hours} />
        <TimeBlock value={timeLeft.minutes} label={t.mins} />
        <TimeBlock value={timeLeft.seconds} label={t.secs} />
      </div>
      {isUrgent && (
        <p className="text-center text-white/90 text-xs sm:text-sm mt-3 animate-pulse">
          {t.limitedTime}
        </p>
      )}
    </div>
  );
};

// FAQ Section with accordion
const FAQSection: React.FC<{ faqs: OfferPageFAQ[]; headline: string }> = ({ faqs, headline }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
      <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 flex items-center gap-2">
        <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg"><HelpCircle className="text-indigo-600" size={18} /></div>
        {headline}
      </h2>
      <div className="space-y-2 sm:space-y-3">
        {faqs.map((faq, index) => (
          <div key={faq.id || index} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-3 sm:p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900 text-sm sm:text-base pr-4">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="text-gray-500 flex-shrink-0" size={18} />
              ) : (
                <ChevronDown className="text-gray-500 flex-shrink-0" size={18} />
              )}
            </button>
            {openIndex === index && (
              <div className="p-3 sm:p-4 bg-white border-t border-gray-100">
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

// Enhanced Order Form
const OrderForm: React.FC<{
  offerPageId: string;
  productTitle: string;
  price?: number;
  originalPrice?: number;
  lang: Language;
  onSubmit: (data: { name: string; phone: string; address: string; quantity: number; offerPageId: string; }) => Promise<void>;
}> = ({ offerPageId, price, originalPrice, lang, onSubmit }) => {
  const t = translations[lang];
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState({ name: false, phone: false, address: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, address: true });
    
    if (!formData.name.trim()) {
      setErrorMessage(t.enterName);
      setSubmitStatus('error');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setErrorMessage(t.enterValidPhone);
      setSubmitStatus('error');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage(t.enterAddress);
      setSubmitStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    
    try {
      await onSubmit({ ...formData, quantity, offerPageId });
      setSubmitStatus('success');
      setFormData({ name: '', phone: '', address: '' });
      setQuantity(1);
      setTouched({ name: false, phone: false, address: false });
    } catch {
      setSubmitStatus('error');
      setErrorMessage(t.orderFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = price ? price * quantity : 0;
  const totalOriginalPrice = originalPrice ? originalPrice * quantity : 0;
  const savings = totalOriginalPrice - totalPrice;
  const discountPercent = originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 0;

  const isFieldError = (field: 'name' | 'phone' | 'address') => {
    if (!touched[field]) return false;
    if (field === 'name') return !formData.name.trim();
    if (field === 'phone') return !formData.phone.trim() || formData.phone.length < 10;
    if (field === 'address') return !formData.address.trim();
    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {price && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 border border-purple-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">{t.specialPrice}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-3xl font-bold text-purple-600">৳{price.toLocaleString()}</span>
                {originalPrice && originalPrice > price && (
                  <span className="text-xs sm:text-base text-gray-400 line-through">৳{originalPrice.toLocaleString()}</span>
                )}
              </div>
            </div>
            {discountPercent > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm">
                {discountPercent}% {t.off}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">{t.selectQuantity}</label>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-purple-500 hover:bg-purple-50 transition-all active:scale-95 shadow-sm" aria-label="Decrease quantity">
              <Minus size={16} />
            </button>
            <span className="text-lg sm:text-2xl font-bold w-8 sm:w-10 text-center tabular-nums">{quantity}</span>
            <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-purple-500 hover:bg-purple-50 transition-all active:scale-95 shadow-sm" aria-label="Increase quantity">
              <Plus size={16} />
            </button>
          </div>
          {price && (
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-gray-500">{t.total}</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">৳{totalPrice.toLocaleString()}</p>
              {savings > 0 && <p className="text-[10px] sm:text-sm text-green-600 font-medium">{t.save} ৳{savings.toLocaleString()}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="relative">
          <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${isFieldError('name') ? 'text-red-400' : 'text-gray-400'}`} size={18} />
          <input type="text" placeholder={t.yourName} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} onBlur={() => setTouched({ ...touched, name: true })} className={`w-full pl-10 pr-4 py-2.5 sm:py-3.5 border-2 rounded-xl focus:outline-none transition-all text-sm sm:text-base ${isFieldError('name') ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:bg-purple-50/30'}`} />
        </div>
        <div className="relative">
          <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${isFieldError('phone') ? 'text-red-400' : 'text-gray-400'}`} size={18} />
          <input type="tel" placeholder={t.phoneNumber} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 11) })} onBlur={() => setTouched({ ...touched, phone: true })} className={`w-full pl-10 pr-4 py-2.5 sm:py-3.5 border-2 rounded-xl focus:outline-none transition-all text-sm sm:text-base ${isFieldError('phone') ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:bg-purple-50/30'}`} />
        </div>
        <div className="relative">
          <MapPin className={`absolute left-3 to p-2.5 sm:to p-3 ${isFieldError('address') ? 'text-red-400' : 'text-gray-400'}`} size={18} />
          <textarea placeholder={t.fullAddress} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} onBlur={() => setTouched({ ...touched, address: true })} rows={2} className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition-all resize-none text-sm sm:text-base ${isFieldError('address') ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:bg-purple-50/30'}`} />
        </div>
      </div>

      {submitStatus === 'success' && (
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl border border-green-200">
          <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm sm:text-base">{t.orderSuccess}</p>
            <p className="text-xs sm:text-sm text-green-600 mt-0.5">{t.orderSuccessMsg}</p>
          </div>
        </div>
      )}
      {submitStatus === 'error' && errorMessage && (
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold text-sm sm:text-lg rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
        {isSubmitting ? (<><Loader2 className="animate-spin" size={20} /><span>{t.processing}</span></>) : (<><ShoppingCart size={20} /><span>{t.orderNow}</span></>)}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-2 sm:pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-gray-500 text-[10px] sm:text-sm"><Shield size={14} className="text-green-500" /><span>{t.secure}</span></div>
        <div className="flex items-center gap-1 text-gray-500 text-[10px] sm:text-sm"><Truck size={14} className="text-blue-500" /><span>{t.fastDelivery}</span></div>
        <div className="flex items-center gap-1 text-gray-500 text-[10px] sm:text-sm"><CreditCard size={14} className="text-purple-500" /><span>{t.cod}</span></div>
      </div>
    </form>
  );
};

// Floating Order Button for Mobile
const FloatingOrderButton: React.FC<{ onClick: () => void; price?: number; lang: Language }> = ({ onClick, price, lang }) => {
  const t = translations[lang];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2.5 sm:p-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-50 lg:hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
      <button onClick={onClick} className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
        <ShoppingCart size={18} />
        <span className="text-sm sm:text-base">{t.orderNow}</span>
        {price && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs sm:text-sm">৳{price.toLocaleString()}</span>}
      </button>
    </div>
  );
};

// Main Component
export const OfferLandingPage: React.FC<OfferLandingPageProps> = ({ offerPage, onOrder, websiteConfig }) => {
  const orderFormRef = useRef<HTMLDivElement>(null);
  const lang: Language = websiteConfig?.orderLanguage || 'Bangla';
  const t = translations[lang];

  const handleOrder = async (data: { name: string; phone: string; address: string; quantity: number; offerPageId: string; }) => {
    if (onOrder) await onOrder(data);
  };

  const scrollToOrderForm = () => {
    orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const trustIndicators = [
    { icon: BadgeCheck, color: 'text-purple-600', label: t.original },
    { icon: Truck, color: 'text-blue-600', label: t.nationwideDelivery },
    { icon: Package, color: 'text-green-600', label: t.cashOnDelivery },
    { icon: Shield, color: 'text-rose-600', label: t.returnGuarantee }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative">
        <div className="w-full h-[240px] xs:h-[280px] sm:h-[340px] md:h-[400px] lg:h-[450px] overflow-hidden">
          <img src={offerPage.imageUrl} alt={offerPage.productTitle} className="w-full h-full object-cover object-center" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-sm font-medium mb-2 sm:mb-3">
              <Sparkles size={12} />
              <span>{t.specialOffer}</span>
            </div>
            
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-3 drop-shadow-lg leading-tight px-2">
              {offerPage.productTitle}
            </h1>
            
            {offerPage.description && (
              <p className="text-white/90 text-xs sm:text-base md:text-lg max-w-2xl mx-auto line-clamp-2 px-4">
                {offerPage.description}
              </p>
            )}

            {offerPage.price && (
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
                <span className="text-base sm:text-xl font-bold text-purple-600">৳{offerPage.price.toLocaleString()}</span>
                {offerPage.originalPrice && offerPage.originalPrice > offerPage.price && (
                  <>
                    <span className="text-xs sm:text-sm text-gray-400 line-through">৳{offerPage.originalPrice.toLocaleString()}</span>
                    <span className="bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
                      {Math.round((1 - offerPage.price / offerPage.originalPrice) * 100)}% {t.off}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="max-w-3xl mx-auto px-2.5 sm:px-4 -mt-3 sm:-mt-6 relative z-10">
        <CountdownTimer endDate={offerPage.offerEndDate} lang={lang} />
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-4 sm:py-8 lg:py-10">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
            
            {offerPage.productOfferInfo && (
              <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-4 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg"><Gift className="text-purple-600" size={18} /></div>
                  {t.offerDetails}
                </h2>
                <div className="prose prose-sm sm:prose-base max-w-none" dangerouslySetInnerHTML={{ __html: offerPage.productOfferInfo }} />
              </section>
            )}

            {offerPage.benefits && offerPage.benefits.length > 0 && (
              <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg"><Star className="text-yellow-500" size={18} /></div>
                  {t.whyBuyProduct}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {offerPage.benefits.map((benefit, index) => (
                    <div key={benefit.id || index} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <CheckCircle2 className="text-white" size={14} />
                      </div>
                      <p className="text-gray-700 font-medium text-xs sm:text-base leading-relaxed">{benefit.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {offerPage.whyBuySection && (
              <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-4 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg"><HeartHandshake className="text-blue-600" size={18} /></div>
                  {t.whyChooseUs}
                </h2>
                <div className="prose prose-sm sm:prose-base max-w-none" dangerouslySetInnerHTML={{ __html: offerPage.whyBuySection }} />
              </section>
            )}

            {/* Video Section */}
            {offerPage.videoLink && (
              <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg"><Play className="text-red-600" size={18} /></div>
                  {t.watchVideo}
                </h2>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <iframe
                    src={offerPage.videoLink.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    title="Product Video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

            {/* FAQ Section */}
            {offerPage.faqs && offerPage.faqs.length > 0 && (
              <FAQSection 
                faqs={offerPage.faqs} 
                headline={offerPage.faqHeadline || t.faq}
              />
            )}

            {/* Reviews Section */}
            {offerPage.reviews && offerPage.reviews.length > 0 && (
              <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg"><MessageSquare className="text-amber-600" size={18} /></div>
                  {offerPage.reviewHeadline || t.customerReviews}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {offerPage.reviews.map((review, index) => (
                    <div key={review.id || index} className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sm:text-base">
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{review.name}</h4>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={14} 
                                  className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1.5 leading-relaxed">{review.quote}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trust Indicators */}
            <section className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-purple-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {trustIndicators.map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-1.5 sm:mb-2">
                      <item.icon className={item.color} size={20} />
                    </div>
                    <p className="text-[10px] sm:text-sm font-medium text-gray-700">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Order Form */}
          <div className="lg:col-span-1 order-1 lg:order-2" ref={orderFormRef}>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 lg:sticky lg:to p-4">
              <div className="text-center mb-3 sm:mb-6">
                {offerPage.paymentSectionTitle ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: offerPage.paymentSectionTitle }} />
                ) : (
                  <>
                    <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">{t.orderNowTitle}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">{t.freeDelivery}</p>
                  </>
                )}
              </div>
              <OrderForm offerPageId={offerPage._id} productTitle={offerPage.productTitle} price={offerPage.price} originalPrice={offerPage.originalPrice} lang={lang} onSubmit={handleOrder} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 sm:py-8 mt-6 sm:mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-xs sm:text-base">© {new Date().getFullYear()} {websiteConfig?.websiteName || 'Store'}. {t.allRightsReserved}</p>
          {websiteConfig?.whatsappNumber && (
            <p className="mt-1 sm:mt-2 text-gray-400 text-xs sm:text-sm">{t.contact} <a href={`tel:${websiteConfig.whatsappNumber}`} className="text-purple-400 hover:text-purple-300">{websiteConfig.whatsappNumber}</a></p>
          )}
        </div>
      </footer>

      {/* Floating Order Button */}
      <FloatingOrderButton onClick={scrollToOrderForm} price={offerPage.price} lang={lang} />
      <div className="h-16 lg:hidden" />

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @media (min-width: 375px) {
          .xs\\:w-16 { width: 4rem; }
          .xs\\:h-16 { height: 4rem; }
          .xs\\:text-2xl { font-size: 1.5rem; }
          .xs\\:text-xs { font-size: 0.75rem; }
          .xs\\:h-\\[280px\\] { height: 280px; }
          .xs\\:gap-3 { gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
};

export default OfferLandingPage;
