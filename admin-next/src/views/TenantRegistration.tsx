/**
 * TenantRegistration.tsx - Public Tenant Registration Page
 * 
 * Allows new users to register and create their own shop with:
 * - 14-day free trial
 * - Shop name and subdomain selection
 * - Real-time subdomain availability check
 * - Beautiful loading animation during creation
 * - Comprehensive success page with all details
 */
import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  CreditCard,
  Hexagon,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Rocket,
  PartyPopper,
  KeyRound,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { getPrimaryDomain, getStoreUrl } from '../utils/appHelpers';

// Types
interface FormData {
  shopName: string;
  subdomain: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  shopName?: string;
  subdomain?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

interface CreatedShopInfo {
  subdomain: string;
  shopName: string;
  email: string;
  shopUrl: string;
  adminUrl: string;
}

type SubdomainStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const FEATURES = [
  { icon: Store, title: 'নিজের অনলাইন শপ', desc: 'মিনিটেই প্রফেশনাল শপ তৈরি', color: 'from-blue-500 to-indigo-600' },
  { icon: Shield, title: 'সিকিউর পেমেন্ট', desc: 'SSL সার্টিফিকেট ও ডাটা এনক্রিপশন', color: 'from-green-500 to-emerald-600' },
  { icon: Clock, title: '১৪ দিন ফ্রি ট্রায়াল', desc: 'কোনো কার্ড বা পেমেন্ট লাগবে না', color: 'from-amber-500 to-orange-600' },
  { icon: CreditCard, title: 'সব পেমেন্ট মেথড', desc: 'বিকাশ, নগদ, রকেট, কার্ড সাপোর্ট', color: 'from-purple-500 to-pink-600' },
];

const RESERVED_SUBDOMAINS = ['www', 'admin', 'superadmin', 'api', 'app', 'mail', 'smtp', 'ftp', 'cpanel', 'webmail', 'ns1', 'ns2', 'test', 'demo'];

const CREATION_STEPS = [
  { label: 'একাউন্ট তৈরি হচ্ছে', duration: 15 },
  { label: 'শপ সেটআপ হচ্ছে', duration: 18 },
  { label: 'ডেটাবেস কনফিগার হচ্ছে', duration: 15 },
  { label: 'থিম ইনস্টল হচ্ছে', duration: 12 },
];

// Total duration: 60 seconds for premium feel
const TOTAL_CREATION_DURATION = 60;

export default function TenantRegistration() {
  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    subdomain: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [createdShopInfo, setCreatedShopInfo] = useState<CreatedShopInfo | null>(null);
  
  // Loading progress state
  const [creationProgress, setCreationProgress] = useState(0);
  const [currentCreationStep, setCurrentCreationStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Auto-generate subdomain from shop name
  useEffect(() => {
    if (formData.shopName) {
      const generated = formData.shopName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);
      setFormData(prev => ({ ...prev, subdomain: generated }));
    }
  }, [formData.shopName]);

  // Check subdomain availability with debounce
  useEffect(() => {
    const subdomain = formData.subdomain.toLowerCase().trim();
    
    // Show idle/waiting message if less than 3 chars
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus('idle');
      return;
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      setSubdomainStatus('invalid');
      return;
    }

    // Validate format: must start and end with alphanumeric
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length >= 3) {
      if (subdomain.length === 3 && /^[a-z0-9]{3}$/.test(subdomain)) {
        // Allow 3 char subdomains without hyphen
      } else if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
        setSubdomainStatus('invalid');
        return;
      }
    }

    setSubdomainStatus('checking');
    
    const checkAvailability = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tenants/check-subdomain/${subdomain}`);
        const data = await response.json();
        setSubdomainStatus(data.available ? 'available' : 'taken');
      } catch (error) {
        console.error('Subdomain check failed:', error);
        setSubdomainStatus('idle');
      }
    }, 600);

    return () => clearTimeout(checkAvailability);
  }, [formData.subdomain]);

  // Progress animation during creation - Premium 60 second experience
  useEffect(() => {
    if (!isCreating) return;
    
    let progress = 0;
    const stepDurations = CREATION_STEPS.map(s => s.duration);
    const totalDuration = TOTAL_CREATION_DURATION;
    
    // Calculate cumulative step thresholds
    let cumulative = 0;
    const stepThresholds = stepDurations.map(d => {
      cumulative += d;
      return (cumulative / totalDuration) * 100;
    });
    
    const interval = setInterval(() => {
      progress += (100 / totalDuration);
      const newProgress = Math.min(progress, 95);
      setCreationProgress(newProgress);
      
      // Update current step and mark completed steps with tick
      let newCurrentStep = 0;
      const newCompletedSteps: number[] = [];
      
      for (let i = 0; i < stepThresholds.length; i++) {
        if (newProgress >= stepThresholds[i]) {
          newCompletedSteps.push(i);
          newCurrentStep = Math.min(i + 1, CREATION_STEPS.length - 1);
        } else if (newProgress < stepThresholds[i] && (i === 0 || newProgress >= (stepThresholds[i - 1] || 0))) {
          newCurrentStep = i;
          break;
        }
      }
      
      setCompletedSteps(newCompletedSteps);
      setCurrentCreationStep(newCurrentStep);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCreating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'subdomain') {
      // Only allow lowercase letters, numbers, and hyphens
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
      setFormData(prev => ({ ...prev, [name]: sanitized }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'শপের নাম দিন';
    } else if (formData.shopName.length < 3) {
      newErrors.shopName = 'শপের নাম কমপক্ষে ৩ অক্ষর হতে হবে';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'সাবডোমেইন দিন';
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = 'সাবডোমেইন কমপক্ষে ৩ অক্ষর হতে হবে';
    } else if (subdomainStatus === 'taken') {
      newErrors.subdomain = 'এই সাবডোমেইন ইতোমধ্যে নেওয়া হয়েছে';
    } else if (subdomainStatus === 'invalid') {
      newErrors.subdomain = 'সাবডোমেইন শুধু ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিয়ে হবে';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'আপনার নাম দিন';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'ইমেইল দিন';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'সঠিক ইমেইল দিন';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'ফোন নম্বর দিন';
    } else if (!/^(\+?880)?0?1[3-9]\d{8}$/.test(formData.phone.replace(/\s|-/g, ''))) {
      newErrors.phone = 'সঠিক বাংলাদেশি ফোন নম্বর দিন';
    }

    if (!formData.password) {
      newErrors.password = 'পাসওয়ার্ড দিন';
    } else if (formData.password.length < 6) {
      newErrors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1() && subdomainStatus === 'available') {
      setStep(2);
    } else if (subdomainStatus === 'checking') {
      toast.error('সাবডোমেইন চেক হচ্ছে, একটু অপেক্ষা করুন...');
    } else if (subdomainStatus !== 'available' && formData.subdomain.length >= 3) {
      toast.error('অনুগ্রহ করে একটি available সাবডোমেইন বাছাই করুন');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setIsCreating(true);
    setCreationProgress(0);
    setCurrentCreationStep(0);
    setCompletedSteps([]);

    // Start time for 60 second minimum loading
    const startTime = Date.now();
    const MIN_LOADING_DURATION = TOTAL_CREATION_DURATION * 1000; // 60 seconds in ms

    try {
      const response = await fetch('/api/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.shopName.trim(),
          subdomain: formData.subdomain.toLowerCase().trim(),
          contactName: formData.ownerName.trim(),
          contactEmail: formData.email.trim().toLowerCase(),
          adminEmail: formData.email.trim().toLowerCase(),
          adminPassword: formData.password,
          phone: formData.phone.trim(),
          plan: 'starter'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Calculate remaining time to reach 60 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);
      
      // Wait for the remaining time to complete 60 seconds
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Complete the progress - mark all steps as done
      setCreationProgress(100);
      setCompletedSteps([0, 1, 2, 3]);
      setCurrentCreationStep(3);
      
      // Small delay before showing success for premium feel
      await new Promise(resolve => setTimeout(resolve, 1500));

      const adminUrl = `https://admin.${getPrimaryDomain()}`;
      setCreatedShopInfo({
        subdomain: formData.subdomain,
        shopName: formData.shopName,
        email: formData.email,
        shopUrl: getStoreUrl(formData.subdomain),
        adminUrl,
      });
      // Remember admin URL so the APK can navigate there on next launch
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopbdit_admin_url', adminUrl);
      }
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} কপি হয়েছে!`);
  };

  const getSubdomainIcon = () => {
    switch (subdomainStatus) {
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'available':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'taken':
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Globe className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSubdomainMessage = () => {
    const subdomain = formData.subdomain.trim();
    
    if (!subdomain) {
      return <span className="text-slate-400">সাবডোমেইন লিখুন (কমপক্ষে ৩ অক্ষর)</span>;
    }
    
    if (subdomain.length < 3) {
      return <span className="text-amber-600">আরো {3 - subdomain.length}টি অক্ষর দিন</span>;
    }
    
    switch (subdomainStatus) {
      case 'checking':
        return <span className="text-blue-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> চেক করা হচ্ছে...</span>;
      case 'available':
        return <span className="text-green-600 font-medium">✓ Available!</span>;
      case 'taken':
        return <span className="text-red-600">✗ নেওয়া হয়েছে, অন্য নাম চেষ্টা করুন</span>;
      case 'invalid':
        return <span className="text-red-600">✗ শুধু a-z, 0-9, হাইফেন ব্যবহার করুন</span>;
      default:
        return null;
    }
  };

  // Loading/Creating Screen - Premium Experience
  if (isCreating && !registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <Helmet>
          <title>শপ তৈরি হচ্ছে... - SystemNext IT</title>
        </Helmet>
        
        <div className="max-w-md w-full">
          {/* Animated Logo with Glow Effect */}
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-white/30 rounded-3xl animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl">
                <Rocket className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 animate-pulse">আপনার শপ তৈরি হচ্ছে</h1>
            <p className="text-white/80 text-lg">অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>

          {/* Premium Progress Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl">
            {/* Progress Bar with Glow */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-white/80 mb-3">
                <span className="font-medium">Progress</span>
                <span className="font-bold text-lg">{Math.round(creationProgress)}%</span>
              </div>
              <div className="h-4 bg-white/20 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${creationProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  <div className="absolute right-0 to p-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/50 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Steps with Premium Tick Animation */}
            <div className="space-y-4">
              {CREATION_STEPS.map((stepItem, idx) => {
                const isCompleted = completedSteps.includes(idx);
                const isCurrent = idx === currentCreationStep && !isCompleted;
                const isPending = !isCompleted && !isCurrent;
                
                return (
                  <div 
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 transform ${
                      isCurrent 
                        ? 'bg-white/25 text-white scale-[1.02] shadow-lg' 
                        : isCompleted 
                          ? 'bg-green-500/20 text-white' 
                          : 'text-white/40'
                    }`}
                  >
                    {/* Step Icon with Animation */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isCompleted 
                        ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110' 
                        : isCurrent 
                          ? 'bg-white/30 shadow-lg' 
                          : 'bg-white/10'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white animate-[bounceIn_0.5s_ease-out]" />
                      ) : isCurrent ? (
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      ) : (
                        <span className="text-sm font-bold">{idx + 1}</span>
                      )}
                    </div>
                    
                    {/* Step Label */}
                    <div className="flex-1">
                      <span className={`font-semibold text-lg transition-all duration-300 ${
                        isCompleted ? 'line-through opacity-80' : ''
                      }`}>
                        {stepItem.label}
                      </span>
                      {isCurrent && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Completion Indicator */}
                    {isCompleted && (
                      <span className="text-green-300 text-sm font-medium">✓ সম্পন্ন</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Shop Preview with Animation */}
            <div className="mt-8 p-5 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl text-center border border-white/10">
              <p className="text-white/60 text-sm mb-2">আপনার শপ:</p>
              <p className="text-white font-bold text-xl tracking-wide">{formData.subdomain}.{getPrimaryDomain()}</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-white/50 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>লাইভ হতে প্রস্তুত</span>
              </div>
            </div>
          </div>
          
          {/* Bottom Text */}
          <p className="text-center text-white/60 text-sm mt-6">
            এই প্রক্রিয়াটি সাধারণত ১ মিনিট সময় নেয়
          </p>
        </div>
        
        {/* Custom Animation Styles */}
        <style>{`
          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Success Screen
  if (registrationSuccess && createdShopInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Helmet>
          <title>🎉 শপ তৈরি সফল! - SystemNext IT</title>
        </Helmet>

        {/* Confetti effect placeholder */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute to p-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute to p-10 right-1/4 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="absolute to p-5 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200 animate-bounce">
              <PartyPopper className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">🎉 অভিনন্দন!</h1>
            <p className="text-lg text-slate-600">
              <span className="font-semibold text-emerald-600">{createdShopInfo.shopName}</span> সফলভাবে তৈরি হয়েছে
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Trial Banner */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-3 sm:px-4 lg:px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-white font-semibold">
                <Clock className="w-5 h-5" />
                <span>১৪ দিন ফ্রি ট্রায়াল শুরু হয়েছে!</span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Shop URL */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">আপনার শপের ঠিকানা</p>
                    <p className="font-bold text-indigo-600">Shop URL</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-indigo-100">
                  <input 
                    type="text" 
                    value={createdShopInfo.shopUrl}
                    readOnly
                    className="flex-1 bg-transparent text-slate-700 font-medium text-sm md:text-base outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(createdShopInfo.shopUrl, 'Shop URL')}
                    className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4 text-indigo-600" />
                  </button>
                  <a
                    href={createdShopInfo.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                  </a>
                </div>
              </div>

              {/* Admin URL */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">এডমিন প্যানেল</p>
                    <p className="font-bold text-emerald-600">Admin Panel</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-emerald-100">
                  <input 
                    type="text" 
                    value={createdShopInfo.adminUrl}
                    readOnly
                    className="flex-1 bg-transparent text-slate-700 font-medium text-sm md:text-base outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(createdShopInfo.adminUrl, 'Admin URL')}
                    className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-emerald-600" />
                  </button>
                  <a
                    href={createdShopInfo.adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                  </a>
                </div>
              </div>

              {/* Login Credentials */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">লগইন তথ্য</p>
                    <p className="font-bold text-slate-700">Login Credentials</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">ইমেইল</p>
                        <p className="font-medium text-slate-700">{createdShopInfo.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdShopInfo.email, 'Email')}
                      className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">পাসওয়ার্ড</p>
                        <p className="font-medium text-slate-700">আপনার দেওয়া পাসওয়ার্ড</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <a
                  href={createdShopInfo.adminUrl}
                  target="_self"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-3 sm:px-4 lg:px-6 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Building2 className="w-5 h-5" />
                  এডমিন প্যানেল
                </a>
                <a
                  href={createdShopInfo.shopUrl}
                  target="_self"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-slate-700 py-4 px-3 sm:px-4 lg:px-6 rounded-2xl font-bold text-lg border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                >
                  <Store className="w-5 h-5" />
                  শপ দেখুন
                </a>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-sm text-blue-800 font-medium mb-2">💡 পরবর্তী কাজ:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• এডমিন প্যানেলে লগইন করুন</li>
                  <li>• প্রোডাক্ট যোগ করুন</li>
                  <li>• শপের লোগো ও থিম সেট করুন</li>
                  <li>• পেমেন্ট মেথড কনফিগার করুন</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              সাহায্য দরকার? <a href={`mailto:support@${getPrimaryDomain()}`} className="text-indigo-600 hover:underline">support@{getPrimaryDomain()}</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute to p-0 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute to p-0 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      
      <Helmet>
        <title>ফ্রি শপ তৈরি করুন - SystemNext IT | বাংলাদেশের সেরা ই-কমার্স প্ল্যাটফর্ম</title>
        <meta name="description" content="১৪ দিন ফ্রি ট্রায়াল দিয়ে আপনার নিজের অনলাইন শপ তৈরি করুন। কোনো ক্রেডিট কার্ড লাগবে না। বিকাশ, নগদ, কার্ড পেমেন্ট সাপোর্ট।" />
      </Helmet>

      {/* Premium Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-18 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all group-hover:scale-105">
              <Hexagon className="text-white" size={22} fill="white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SystemNext IT</span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">বাংলাদেশের #১ ই-কমার্স প্ল্যাটফর্ম</span>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <a href="tel:+8801XXXXXXXXX" className="hidden md:flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
              <Phone className="w-4 h-4" />
              <span>সাপোর্ট</span>
            </a>
            <a 
              href="/" 
              className="text-sm text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">হোমপেজ</span>
            </a>
          </div>
        </div>
      </header>

      {/* Blob animation styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Features - Hidden on mobile, shown on lg */}
          <div className="hidden lg:block lg:sticky lg:to p-24">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-700 text-sm font-semibold mb-4 border border-indigo-200/50 shadow-sm">
                <Sparkles className="w-4 h-4 animate-pulse" />
                ১৪ দিন ফ্রি ট্রায়াল • কোনো কার্ড লাগবে না
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                আজই আপনার <br/>
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">অনলাইন শপ</span> শুরু করুন
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                কোনো টেকনিক্যাল জ্ঞান ছাড়াই মিনিটেই নিজের প্রফেশনাল ই-কমার্স শপ তৈরি করুন। 
                সব প্রিমিয়াম ফিচার ১৪ দিন সম্পূর্ণ ফ্রিতে ব্যবহার করুন।
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map((feature, idx) => (
                <div 
                  key={idx}
                  className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">১০০০+ সফল ব্যবসায়ী</p>
                  <p className="text-sm text-slate-600">ইতোমধ্যে SystemNext IT ব্যবহার করছেন</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Shield className="w-4 h-4 text-green-500" />
                <span>১০০% সিকিউর • SSL এনক্রিপ্টেড • ডাটা প্রোটেক্টেড</span>
              </div>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div>
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 rounded-full text-indigo-700 text-xs font-semibold mb-3">
                <Sparkles className="w-3 h-3" />
                ১৪ দিন ফ্রি ট্রায়াল
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                আপনার <span className="text-indigo-600">অনলাইন শপ</span> তৈরি করুন
              </h1>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl shadow-indigo-100/50 border border-slate-200/50 p-4 sm:p-6 md:p-8 relative overflow-hidden">
              {/* Decorative gradient border top */}
              <div className="absolute to p-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              {/* Progress Steps */}
              <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 mt-2">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                    1
                  </div>
                  <span className="font-medium text-sm md:text-base">শপ তথ্য</span>
                </div>
                <div className="flex-1 h-1 bg-slate-200 rounded">
                  <div className={`h-full bg-indigo-600 rounded transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
                </div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                    2
                  </div>
                  <span className="font-medium text-sm md:text-base">একাউন্ট</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Step 1: Shop Info */}
                {step === 1 && (
                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        শপের নাম *
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="shopName"
                          value={formData.shopName}
                          onChange={handleInputChange}
                          placeholder="যেমন: Fashion Hub BD"
                          className={`w-full pl-10 md:pl-12 pr-4 py-3 rounded-xl border ${errors.shopName ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base`}
                        />
                      </div>
                      {errors.shopName && (
                        <p className="text-red-500 text-sm mt-1">{errors.shopName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        সাবডোমেইন (আপনার শপের ঠিকানা) *
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2">
                          {getSubdomainIcon()}
                        </div>
                        <input
                          type="text"
                          name="subdomain"
                          value={formData.subdomain}
                          onChange={handleInputChange}
                          placeholder="yourshop"
                          className={`w-full pl-10 md:pl-12 pr-4 py-3 rounded-xl border ${
                            errors.subdomain || subdomainStatus === 'taken' || subdomainStatus === 'invalid' 
                              ? 'border-red-300 bg-red-50' 
                              : subdomainStatus === 'available' 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-slate-200'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base`}
                        />
                      </div>
                      
                      {/* Subdomain Preview & Status - Only show preview if 3+ chars */}
                      <div className="mt-2 space-y-1">
                        {formData.subdomain && formData.subdomain.length >= 3 && (
                          <p className="text-sm">
                            <span className="text-slate-500">আপনার শপ: </span>
                            <span className={`font-semibold ${subdomainStatus === 'available' ? 'text-green-600' : 'text-indigo-600'}`}>
                              {formData.subdomain}.{getPrimaryDomain()}
                            </span>
                          </p>
                        )}
                        <p className="text-sm">{getSubdomainMessage()}</p>
                      </div>
                      
                      {errors.subdomain && (
                        <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={subdomainStatus === 'checking' || formData.subdomain.length < 3}
                      className="w-full bg-indigo-600 text-white py-3.5 px-3 sm:px-4 lg:px-6 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base"
                    >
                      পরবর্তী ধাপ <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Step 2: Account Info */}
                {step === 2 && (
                  <div className="space-y-4 md:space-y-5">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 mb-2 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> পিছনে যান
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        আপনার নাম *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleInputChange}
                          placeholder="আপনার পুরো নাম"
                          className={`w-full pl-10 md:pl-12 pr-4 py-3 rounded-xl border ${errors.ownerName ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base`}
                        />
                      </div>
                      {errors.ownerName && (
                        <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ইমেইল *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          className={`w-full pl-10 md:pl-12 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ফোন নম্বর *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="01XXXXXXXXX"
                          className={`w-full pl-10 md:pl-12 pr-4 py-3 rounded-xl border ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        পাসওয়ার্ড *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="কমপক্ষে ৬ অক্ষর"
                          className={`w-full pl-10 md:pl-12 pr-12 py-3 rounded-xl border ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        পাসওয়ার্ড নিশ্চিত করুন *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="আবার পাসওয়ার্ড দিন"
                          className={`w-full pl-10 md:pl-12 pr-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base`}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-3 sm:px-4 lg:px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          তৈরি হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          ফ্রি শপ তৈরি করুন
                        </>
                      )}
                    </button>

                    <p className="text-xs text-slate-500 text-center">
                      রেজিস্ট্রেশন করে আপনি আমাদের{' '}
                      <a href="/terms" className="text-indigo-600 hover:underline">শর্তাবলী</a> ও{' '}
                      <a href="/privacy" className="text-indigo-600 hover:underline">প্রাইভেসি পলিসি</a> মেনে নিচ্ছেন।
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Mobile Features - Shown only on mobile */}
            <div className="lg:hidden mt-6 grid grid-cols-2 gap-3">
              {FEATURES.map((feature, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-3 shadow-md`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
            
            {/* Mobile trust badge */}
            <div className="lg:hidden mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 bg-white/80 backdrop-blur rounded-full px-4 py-2 border border-slate-100">
              <Shield className="w-3 h-3 text-green-500" />
              <span>১০০% সিকিউর • SSL এনক্রিপ্টেড</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
