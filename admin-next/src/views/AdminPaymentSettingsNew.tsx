import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Upload, X, Check, Info, Loader2 } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';
import { getAuthHeader } from '../services/authService';
import { invalidateDataCache } from '../services/DataService';
import { toast } from 'react-hot-toast';
import { PaymentMethod } from '../types';

// Use relative URL to leverage Vite proxy (proxies /api -> localhost:5001)
const API_URL = '/api';

// Payment provider logos
const PROVIDER_LOGOS = {
  bkash: 'https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg',
  nagad: 'https://hdnfltv.com/image/nitimages/pasted_1770952876471.webp',
  rocket: 'https://hdnfltv.com/image/nitimages/pasted_1770952937066.webp',
  upay: 'https://hdnfltv.com/image/nitimages/pasted_1770952990491.webp',
  tap: 'https://hdnfltv.com/image/nitimages/pasted_1770953059804.webp',
  aamarpay: 'https://hdnfltv.com/image/nitimages/pasted_1770950390967.webp',
};

const MFS_PROVIDERS = [
  { id: 'bkash', name: 'bKash', logo: PROVIDER_LOGOS.bkash },
  { id: 'nagad', name: 'Nagad', logo: PROVIDER_LOGOS.nagad },
  { id: 'rocket', name: 'Rocket', logo: PROVIDER_LOGOS.rocket },
  { id: 'upay', name: 'UPay', logo: PROVIDER_LOGOS.upay },
  { id: 'tap', name: 'Tap', logo: PROVIDER_LOGOS.tap },
];

const MFS_TYPES = [
  { value: 'merchant', label: 'Merchant' },
  { value: 'send_money', label: 'Send Money' },
  { value: 'personal', label: 'Personal' },
];

const ADVANCE_PAYMENT_OPTIONS = [
  { id: 'full', label: 'Full Payment' },
  { id: 'delivery_charge', label: 'Delivery Charge Only' },
  { id: 'percentage', label: 'Percentage' },
  { id: 'fixed', label: 'Fixed Amount' },
];

interface PaymentGatewaySettings {
  cashOnDelivery: boolean;
  aamarPay: {
    enabled: boolean;
    storeId?: string;
    signatureKey?: string;
  };
  bkash: {
    enabled: boolean;
    appKey?: string;
    secretKey?: string;
    username?: string;
    password?: string;
  };
  selfMfs: {
    enabled: boolean;
    selectedProviders: string[];
    phoneNumber?: string;
    mfsType: string;
    paymentInstruction?: string;
    qrCodeUrl?: string;
  };
  advancePayment: {
    enabled: boolean;
    type: string;
    percentage?: number;
    fixedAmount?: number;
  };
  paymentProcessMessage?: string;
}

interface AdminPaymentSettingsNewProps {
  onBack: () => void;
  tenantId?: string;
  onSave?: (settings: PaymentGatewaySettings) => void;
  onUpdatePaymentMethods?: (methods: PaymentMethod[]) => void;
}

// Toggle Switch Component
const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (v: boolean) => void }> = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-5 w-[38px] items-center rounded-full transition-colors ${
      enabled ? 'bg-[#1e90ff]' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

// Payment Card Component
const PaymentCard: React.FC<{
  title?: string;
  subtitle: string;
  logo?: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}> = ({ title, subtitle, logo, enabled, onToggle, children }) => (
  <div className="bg-white rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.03)] px-3 py-2">
    <div className="flex items-start sm:items-center justify-between gap-3 py-2">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        {logo ? (
          <img src={logo} alt={title} className="h-7 w-auto object-contain max-w-[120px]" />
        ) : (
          <h4 className="text-lg font-bold text-black tracking-tight">{title}</h4>
        )}
        <p className="text-xs text-[#6f6f6f]">{subtitle}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onToggle} />
    </div>
    {enabled && children && <div className="mt-2">{children}</div>}
  </div>
);

const AdminPaymentSettingsNew: React.FC<AdminPaymentSettingsNewProps> = ({ 
  onBack, 
  tenantId,
  onSave,
  onUpdatePaymentMethods
}) => {
  // State for all payment settings
  const [settings, setSettings] = useState<PaymentGatewaySettings>({
    cashOnDelivery: true,
    aamarPay: { enabled: false },
    bkash: { enabled: true },
    selfMfs: {
      enabled: true,
      selectedProviders: ['bkash', 'nagad', 'rocket', 'upay', 'tap'],
      phoneNumber: '',
      mfsType: 'merchant',
      paymentInstruction: '',
      qrCodeUrl: '',
    },
    advancePayment: {
      enabled: true,
      type: 'percentage',
      percentage: 0,
    },
    paymentProcessMessage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing payment settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/tenant-data/${tenantId}/payment_methods`, {
          headers: {
            ...getAuthHeader() as Record<string, string>,
            'X-Tenant-Id': tenantId
          }
        });
        
        if (!response.ok) {
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        const paymentMethods: PaymentMethod[] = data.data || [];
        
        // Convert PaymentMethod[] to local settings format
        const codMethod = paymentMethods.find(m => m.provider === 'cod');
        const bkashMerchant = paymentMethods.find(m => m.provider === 'bkash' && m.id.includes('merchant'));
        
        // Find all self-mfs methods (saved as self-mfs-bkash, self-mfs-nagad, etc.)
        const selfMfsMethods = paymentMethods.filter(m => m.id.startsWith('self-mfs-'));
        const anySelfMfs = selfMfsMethods[0]; // Get the first one for shared settings
        const enabledProviders = selfMfsMethods.map(m => m.id.replace('self-mfs-', ''));
        
        setSettings(prev => ({
          ...prev,
          cashOnDelivery: codMethod?.isEnabled ?? true,
          bkash: {
            enabled: bkashMerchant?.isEnabled ?? false,
            appKey: (bkashMerchant as any)?.appKey || '',
            secretKey: (bkashMerchant as any)?.secretKey || '',
            username: (bkashMerchant as any)?.username || '',
            password: (bkashMerchant as any)?.password || '',
          },
          selfMfs: anySelfMfs ? {
            enabled: true,
            selectedProviders: enabledProviders.length > 0 ? enabledProviders : ['bkash', 'nagad', 'rocket', 'upay', 'tap'],
            phoneNumber: anySelfMfs.accountNumber || '',
            mfsType: anySelfMfs.paymentType || 'merchant',
            paymentInstruction: anySelfMfs.paymentInstruction || '',
            qrCodeUrl: (anySelfMfs as any)?.qrCodeUrl || anySelfMfs.logo || '',
          } : prev.selfMfs,
        }));
      } catch (error) {
        console.error('Failed to load payment settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [tenantId]);

  const updateSettings = useCallback(<K extends keyof PaymentGatewaySettings>(
    key: K, 
    value: PaymentGatewaySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateNestedSettings = useCallback(<K extends keyof PaymentGatewaySettings>(
    key: K,
    field: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] as any),
        [field]: value,
      },
    }));
  }, []);

  const toggleMfsProvider = useCallback((providerId: string) => {
    setSettings(prev => ({
      ...prev,
      selfMfs: {
        ...prev.selfMfs,
        selectedProviders: prev.selfMfs.selectedProviders.includes(providerId)
          ? prev.selfMfs.selectedProviders.filter(id => id !== providerId)
          : [...prev.selfMfs.selectedProviders, providerId],
      },
    }));
  }, []);

  const handleQrCodeUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateNestedSettings('selfMfs', 'qrCodeUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [updateNestedSettings]);

  const handleSave = useCallback(async () => {
    if (!tenantId) {
      toast.error('Tenant ID is required');
      return;
    }
    
    console.log('[PaymentSettings] Saving for tenant:', tenantId);
    console.log('[PaymentSettings] Settings:', JSON.stringify(settings.selfMfs, null, 2));
    
    setSaving(true);
    
    try {
      // Convert local settings to PaymentMethod[] format
      const paymentMethods: PaymentMethod[] = [];
      
      // Cash on Delivery - always include
      paymentMethods.push({
        id: 'cod-default',
        provider: 'cod',
        name: 'Cash On Delivery',
        isEnabled: settings.cashOnDelivery,
      });
      
      // bKash Merchant (API integrated)
      if (settings.bkash.enabled) {
        paymentMethods.push({
          id: 'bkash-merchant',
          provider: 'bkash',
          name: 'bKash Payment',
          isEnabled: settings.bkash.enabled,
          ...({
            appKey: settings.bkash.appKey,
            secretKey: settings.bkash.secretKey,
            username: settings.bkash.username,
            password: settings.bkash.password,
          } as any),
        });
      }
      
      // Self MFS (Manual Payment) - This creates payment methods for each selected provider
      if (settings.selfMfs.enabled && settings.selfMfs.selectedProviders.length > 0) {
        // Create individual payment methods for each selected MFS provider
        settings.selfMfs.selectedProviders.forEach(providerId => {
          const providerNames: Record<string, string> = {
            bkash: 'bKash',
            nagad: 'Nagad',
            rocket: 'Rocket',
            upay: 'UPay',
            tap: 'Tap',
          };
          
          paymentMethods.push({
            id: `self-mfs-${providerId}`,
            provider: providerId as any,
            name: `${providerNames[providerId] || providerId} (Manual)`,
            isEnabled: true,
            paymentType: settings.selfMfs.mfsType as any,
            accountNumber: settings.selfMfs.phoneNumber,
            paymentInstruction: settings.selfMfs.paymentInstruction,
            logo: settings.selfMfs.qrCodeUrl,
            ...({
              selectedProviders: settings.selfMfs.selectedProviders,
              qrCodeUrl: settings.selfMfs.qrCodeUrl,
            } as any),
          });
        });
      }
      
      console.log('[PaymentSettings] Saving paymentMethods:', JSON.stringify(paymentMethods, null, 2));
      
      // Save to backend using PUT (not POST)
      const response = await fetch(`${API_URL}/tenant-data/${tenantId}/payment_methods`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader() as Record<string, string>,
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify({ data: paymentMethods })
      });
      
      const responseData = await response.json();
      console.log('[PaymentSettings] Server response:', responseData);
      
      if (!response.ok) {
        throw new Error('Failed to save payment settings');
      }
      
      // Invalidate cache to force refresh
      await invalidateDataCache(tenantId, 'payment_methods');
      
      // Update App state so Store Checkout gets new payment methods
      console.log('[PaymentSettings] Calling onUpdatePaymentMethods with:', paymentMethods.length, 'methods');
      onUpdatePaymentMethods?.(paymentMethods);
      
      toast.success('Payment settings saved successfully!');
      onSave?.(settings);
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  }, [settings, tenantId, onSave, onUpdatePaymentMethods]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-[1146px] mx-auto">
        <div className="bg-white rounded-lg px-3 sm:px-4 py-4 sm:py-5">
          <div className="flex items-center gap-3.5 min-h-[42px] mb-4">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.03)] px-3 py-4 h-20 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="h-5 w-10 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1146px] mx-auto">
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 text-xs rounded">
          Debug: tenantId = {tenantId || 'undefined'}
        </div>
      )}
      {/* Main Content Card */}
      <div className="bg-white rounded-lg px-3 sm:px-4 py-4 sm:py-5">
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
          {/* Header */}
          <div className="flex items-center gap-3.5 min-h-[42px]">
            <button 
              onClick={onBack}
              className="flex items-center justify-center rotate-180"
            >
              <ChevronRight size={13} className="text-gray-600" />
            </button>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-medium text-black font-['Lato']">Payment Gateway</h2>
              <p className="text-xs text-[#a2a2a2] font-['Lato']">Enable and configure your preferred delivery services</p>
            </div>
          </div>

          {/* Payment Options */}
          <div className="flex flex-col gap-4">
            {/* Cash On Delivery */}
            {/* <PaymentCard
              title="Cash On Delivery"
              subtitle="Accept cash payments on delivery"
              enabled={settings.cashOnDelivery}
              onToggle={(v) => updateSettings('cashOnDelivery', v)}
            /> */}

            {/* AamarPay */}
            <PaymentCard
              logo={PROVIDER_LOGOS.aamarpay}
              subtitle="Configure AamarPay credentials"
              enabled={settings.aamarPay.enabled}
              onToggle={(v) => updateNestedSettings('aamarPay', 'enabled', v)}
            />

            {/* bKash Merchant */}
            <PaymentCard
              logo={PROVIDER_LOGOS.bkash}
              subtitle="Configure bKash merchant credentials"
              enabled={settings.bkash.enabled}
              onToggle={(v) => updateNestedSettings('bkash', 'enabled', v)}
            >
              <div className="flex flex-col gap-4 w-full">
                <p className="text-xs text-[#6f6f6f] w-full">
                  Please provide your bKash credentials to integrate bKash merchant
                </p>
                <div className="flex flex-col gap-3">
                  {/* Row 1: App Key, Secret Key */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Merchant App Key"
                      className="bg-[#f9f9f9] rounded-lg h-10 px-3 text-sm text-[#a2a2a2] w-full focus:outline-none focus:ring-1 focus:ring-[#1e90ff]"
                      value={settings.bkash.appKey || ''}
                      onChange={(e) => updateNestedSettings('bkash', 'appKey', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Merchant Secret Key"
                      className="bg-[#f9f9f9] rounded-lg h-10 px-3 text-sm text-[#a2a2a2] flex-1 focus:outline-none focus:ring-1 focus:ring-[#1e90ff]"
                      value={settings.bkash.secretKey || ''}
                      onChange={(e) => updateNestedSettings('bkash', 'secretKey', e.target.value)}
                    />
                  </div>
                  {/* Row 2: Username, Password, Save */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 items-start">
                    <input
                      type="text"
                      placeholder="Merchant Username"
                      className="bg-[#f9f9f9] rounded-lg h-10 px-3 text-sm text-[#a2a2a2] w-full focus:outline-none focus:ring-1 focus:ring-[#1e90ff]"
                      value={settings.bkash.username || ''}
                      onChange={(e) => updateNestedSettings('bkash', 'username', e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Merchant Password"
                      className="bg-[#f9f9f9] rounded-lg h-10 px-3 text-sm text-[#a2a2a2] flex-1 focus:outline-none focus:ring-1 focus:ring-[#1e90ff]"
                      value={settings.bkash.password || ''}
                      onChange={(e) => updateNestedSettings('bkash', 'password', e.target.value)}
                    />
                    <button className="bg-[#1e90ff] border border-[#1e90ff] rounded-lg px-4 py-2 h-10 w-full sm:w-[120px] flex items-center justify-center">
                      <span className="text-white text-sm font-semibold font-['Lato']">Save</span>
                    </button>
                  </div>
                </div>
              </div>
            </PaymentCard>

            {/* Self MFS */}
            <div className="bg-white rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.03)] px-3 py-4 sm:py-6">
              {/* Self MFS Header */}
              <div className="flex items-start sm:items-center justify-between gap-3 py-2">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <h4 className="text-lg font-bold text-black tracking-tight">Manual Payment (Self MFS)</h4>
                  <p className="text-xs text-[#6f6f6f]">Merchant API না থাকলে এখানে manual payment instruction দিন - এটি checkout এ customer দেখবে</p>
                </div>
                <ToggleSwitch 
                  enabled={settings.selfMfs.enabled} 
                  onChange={(v) => updateNestedSettings('selfMfs', 'enabled', v)} 
                />
              </div>

              {settings.selfMfs.enabled && (
                <>
                  {/* Provider Selection & Phone Number */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full mb-3">
                    {/* Provider Pills */}
                    <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
                      {MFS_PROVIDERS.map((provider) => {
                        const isSelected = settings.selfMfs.selectedProviders.includes(provider.id);
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => toggleMfsProvider(provider.id)}
                            className={`flex gap-1 h-10 items-center justify-center px-2 py-1 rounded-lg border ${
                              isSelected ? 'border-[#1e90ff]' : 'border-gray-300'
                            } bg-white`}
                          >
                            {isSelected && <Check size={18} className="text-[#1e90ff]" />}
                            <img src={provider.logo} alt={provider.name} className="h-7 w-auto object-contain" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center text-sm font-['Lato'] w-full lg:w-auto">
                      <span className="text-black whitespace-nowrap">Phone Number</span>
                      <div className="bg-[#f9f9f9] rounded-lg h-[39px] w-full sm:w-[273px] px-[19px] flex items-center">
                        <span className="text-black">+88</span>
                        <input
                          type="text"
                          placeholder="01XX XXXXXXX"
                          className="bg-transparent ml-2 text-[#a2a2a2] flex-1 focus:outline-none"
                          value={settings.selfMfs.phoneNumber || ''}
                          onChange={(e) => updateNestedSettings('selfMfs', 'phoneNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MFS Type, Payment Instruction, QR Code */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left Column: MFS Type & Payment Instruction */}
                    <div className="flex-1 flex flex-col gap-4">
                      {/* MFS Type */}
                      <div className="flex flex-col gap-2">
                        <label className="text-base font-medium text-black font-['Lato']">Select MFS type</label>
                        <div className="bg-[#f9f9f9] rounded-lg flex items-center justify-between px-3 py-1">
                          <select
                            className="bg-transparent text-sm text-black font-['Lato'] flex-1 focus:outline-none cursor-pointer appearance-none"
                            value={settings.selfMfs.mfsType}
                            onChange={(e) => updateNestedSettings('selfMfs', 'mfsType', e.target.value)}
                          >
                            {MFS_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          <ChevronRight size={24} className="text-gray-500 rotate-90" />
                        </div>
                      </div>

                      {/* Payment Instruction */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-base font-medium text-black font-['Lato']">Payment Instruction</label>
                          <div className="group relative">
                            <Info size={14} className="text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                              এই instruction টি checkout page এ customer কে দেখানো হবে যখন তারা bKash/Nagad/Rocket select করবে। Image সহ সুন্দর করে লিখুন।
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#f9f9f9] rounded-lg overflow-hidden">
                          <p className="text-xs text-[#6f6f6f] px-3 py-2 border-b border-gray-200 bg-blue-50">
                            💡 এখানে image সহ manual payment instruction লিখুন। Customer checkout করার সময় এটি দেখবে।
                          </p>
                          <RichTextEditor
                            value={settings.selfMfs.paymentInstruction || ''}
                            onChange={(val) => updateNestedSettings('selfMfs', 'paymentInstruction', val)}
                            placeholder="যেমন: ১. এই নম্বরে Send Money করুন: 01XXXXXXXXX। ২. Transaction ID নোট করুন। ৩. Checkout এ TxnID দিন।"
                            minHeight="min-h-[200px]"
                            hideLabel
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: QR Code Upload */}
                    <div className="w-full lg:w-[300px] min-h-[240px] lg:min-h-[300px] border border-dashed border-[#d7d7d7] rounded-lg bg-white flex items-center justify-center p-3">
                      {settings.selfMfs.qrCodeUrl ? (
                        <div className="relative">
                          <img 
                            src={settings.selfMfs.qrCodeUrl} 
                            alt="QR Code" 
                            className="max-w-full max-h-[280px] object-contain" 
                          />
                          <button
                            onClick={() => updateNestedSettings('selfMfs', 'qrCodeUrl', '')}
                            className="absolute -to p-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-base font-medium text-black font-['Lato']">Add QR Code</p>
                          <div className="w-20 h-20 sm:w-[105px] sm:h-[105px] bg-gray-100 rounded-lg flex items-center justify-center">
                            <Upload size={40} className="text-gray-400" />
                          </div>
                          <div className="flex flex-col items-center gap-1 text-[#a2a2a2]">
                            <p className="text-sm font-['Lato'] text-center">Drag and drop image here, or click add image.</p>
                            <p className="text-[10px] text-center w-full max-w-[264px] font-['Lato']">
                              Supported formats: JPG, PNG, Max size: 4MB.<br />
                              Note: Use images with a 1:1 aspect ratio (150×150 pixels.)
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleQrCodeUpload}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#ff9f1c] rounded-lg px-4 py-2 text-white text-sm font-semibold font-['Lato']"
                          >
                            Add Image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Save Manual Payment Settings Button */}
                  <div className="flex justify-end mt-4">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#1e90ff] border border-[#1e90ff] rounded-lg px-3 sm:px-4 lg:px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span className="text-white text-sm font-semibold font-['Lato']">Saving...</span>
                        </>
                      ) : (
                        <span className="text-white text-sm font-semibold font-['Lato']">Save Manual Payment Settings</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentSettingsNew;
