import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ChevronDown, Save, ArrowLeft, Truck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { CourierConfig } from '../types';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../services/authService';

interface AdminCourierSettingsProps {
  config: CourierConfig;
  onSave: (config: CourierConfig) => void;
  onBack: () => void;
  tenantId?: string;
}

// Get API base URL - use same origin in production
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
};

interface PathaoConfig {
  apiKey: string;
  secretKey: string;
  username: string;
  password: string;
  storeId: string;
  instruction: string;
}

const AdminCourierSettings: React.FC<AdminCourierSettingsProps> = ({ config, onSave, onBack, tenantId }) => {
  const [activeTab, setActiveTab] = useState<'Steadfast' | 'Pathao'>('Steadfast');
  
  // Steadfast form data
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: '',
    instruction: ''
  });
  
  // Pathao form data
  const [pathaoData, setPathaoData] = useState<PathaoConfig>({
    apiKey: '',
    secretKey: '',
    username: '',
    password: '',
    storeId: '',
    instruction: ''
  });
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; balance?: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pathaoConfigured, setPathaoConfigured] = useState(false);

  // Get tenant ID from props or localStorage
  const getTenantId = () => {
    if (tenantId) return tenantId;
    const stored = localStorage.getItem('activeTenantId');
    return stored || '';
  };

  // Load config from database on mount
  useEffect(() => {
    const loadConfig = async () => {
      const tid = getTenantId();
      if (!tid) {
        setIsLoading(false);
        return;
      }

      try {
        // Load Steadfast config
        const steadfastRes = await fetch(`${getApiBaseUrl()}/api/courier/config`, {
          headers: {
            'X-Tenant-Id': tid,
            ...getAuthHeader()
          }
        });

        if (steadfastRes.ok) {
          const data = await steadfastRes.json();
          setFormData({
            apiKey: data.apiKey || '',
            secretKey: data.secretKey || '',
            instruction: data.instruction || ''
          });
          if (data.apiKey || data.secretKey) {
            onSave({
              apiKey: data.apiKey || '',
              secretKey: data.secretKey || '',
              instruction: data.instruction || ''
            });
          }
        }

        // Load Pathao config
        const pathaoRes = await fetch(`${getApiBaseUrl()}/api/courier/pathao/config`, {
          headers: {
            'X-Tenant-Id': tid,
            ...getAuthHeader()
          }
        });

        if (pathaoRes.ok) {
          const data = await pathaoRes.json();
          setPathaoData({
            apiKey: data.apiKey || '',
            secretKey: data.secretKey || '',
            username: data.username || '',
            password: data.password || '',
            storeId: data.storeId || '',
            instruction: data.instruction || ''
          });
          setPathaoConfigured(!!(data.apiKey && data.secretKey && data.username && data.password));
        }
      } catch (error) {
        console.error('Failed to load courier config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Create a synthetic form event to trigger save
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    const tid = getTenantId();
    if (!tid) {
      toast.error('Tenant ID not found');
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      if (activeTab === 'Steadfast') {
        const response = await fetch(`${getApiBaseUrl()}/api/courier/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': tid,
            ...getAuthHeader()
          },
          body: JSON.stringify({
            apiKey: formData.apiKey.trim(),
            secretKey: formData.secretKey.trim(),
            instruction: formData.instruction.trim()
          })
        });

        if (!response.ok) throw new Error('Failed to save config');

        onSave({
          apiKey: formData.apiKey.trim(),
          secretKey: formData.secretKey.trim(),
          instruction: formData.instruction.trim()
        });
      } else {
        // Save Pathao config
        const response = await fetch(`${getApiBaseUrl()}/api/courier/pathao/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': tid,
            ...getAuthHeader()
          },
          body: JSON.stringify({
            apiKey: pathaoData.apiKey.trim(),
            secretKey: pathaoData.secretKey.trim(),
            username: pathaoData.username.trim(),
            password: pathaoData.password.trim(),
            storeId: pathaoData.storeId.trim(),
            instruction: pathaoData.instruction.trim()
          })
        });

        if (!response.ok) throw new Error('Failed to save Pathao config');
        
        setPathaoConfigured(!!(pathaoData.apiKey && pathaoData.secretKey && pathaoData.username && pathaoData.password));
      }
      
      setSaveSuccess(true);
      setShowSuccess(true);
      toast.success(`${activeTab} courier settings saved!`);
      
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      if (activeTab === 'Steadfast') {
        if (!formData.apiKey || !formData.secretKey) {
          setTestResult({ valid: false, message: 'Please enter both API Key and Secret Key' });
          setIsTesting(false);
          return;
        }

        const response = await fetch(`${getApiBaseUrl()}/api/courier/steadfast/test-credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            apiKey: formData.apiKey.trim(),
            secretKey: formData.secretKey.trim()
          })
        });

        const data = await response.json();
        
        if (data.valid) {
          setTestResult({
            valid: true,
            message: `Connection successful! Balance: ৳${data.balance || 0}`,
            balance: data.balance
          });
        } else {
          setTestResult({
            valid: false,
            message: data.error || data.hint || 'Invalid credentials or account not activated'
          });
        }
      } else {
        // Test Pathao connection
        if (!pathaoData.apiKey || !pathaoData.secretKey || !pathaoData.username || !pathaoData.password) {
          setTestResult({ valid: false, message: 'Please fill in all required fields (API Key, Secret Key, Username, Password)' });
          setIsTesting(false);
          return;
        }

        const response = await fetch(`${getApiBaseUrl()}/api/courier/pathao/test-credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            apiKey: pathaoData.apiKey.trim(),
            secretKey: pathaoData.secretKey.trim(),
            username: pathaoData.username.trim(),
            password: pathaoData.password.trim()
          })
        });

        const data = await response.json();
        
        if (data.valid) {
          setTestResult({
            valid: true,
            message: data.message || 'Pathao connection successful!'
          });
        } else {
          setTestResult({
            valid: false,
            message: data.error || 'Failed to connect to Pathao. Check your credentials.'
          });
        }
      }
    } catch (error) {
      setTestResult({
        valid: false,
        message: `Failed to connect to ${activeTab}. Please check your credentials and try again.`
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading courier settings...</span>
      </div>
    );
  }

  const isSteadfastConfigured = formData.apiKey && formData.secretKey;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-0">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5"/>
        </button>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Courier Configuration</h2>
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">Manage third-party logistics integrations.</p>
        </div>
      </div>

      {/* Tabs - Compact Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
        {['Steadfast', 'Pathao'].map((provider) => {
          const isActive = activeTab === provider;
          const providerConfigured = provider === 'Steadfast' ? isSteadfastConfigured : pathaoConfigured;
          
          return (
            <div 
              key={provider}
              onClick={() => {
                setActiveTab(provider as any);
                setTestResult(null);
              }}
              className={`
                relative p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[60px] sm:min-h-[70px] lg:h-24
                ${isActive ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-200'}
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                  {providerConfigured ? (
                    <CheckCircle size={16} className="text-green-500 fill-green-100 sm:w-5 sm:h-5 lg:w-[22px] lg:h-[22px]" />
                  ) : (
                    <Circle size={16} className="text-gray-300 sm:w-5 sm:h-5 lg:w-[22px] lg:h-[22px]" />
                  )}
                  <div>
                    <span className={`font-bold text-xs sm:text-sm block ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                      {provider}
                    </span>
                  </div>
                </div>
              </div>
              
              {isActive && (
                <div className="text-[10px] sm:text-xs text-purple-600 font-medium flex items-center gap-1 mt-1.5 sm:mt-2">
                  Show <ChevronDown size={10} className="sm:w-3 sm:h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-to p-2">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Truck size={16} className="text-purple-600 sm:w-5 sm:h-5"/>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base lg:text-lg">{activeTab} Integration</h3>
          </div>
          {(activeTab === 'Steadfast' ? isSteadfastConfigured : pathaoConfigured) && (
            <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              ✓ Configured
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="p-3 sm:p-4 lg:p-6">
          {showSuccess && (
            <div className="bg-green-50 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 border border-green-100 mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-1 text-xs sm:text-sm">
              <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> Credentials saved successfully!
            </div>
          )}

          {activeTab === 'Steadfast' ? (
            // Steadfast Form
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Provider*</label>
                <select 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50"
                  value="Steadfast Courier"
                  disabled
                >
                  <option>Steadfast Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Api Key</label>
                <input 
                  type="text" 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                  placeholder="Enter API Key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-purple-600 mb-1">Secret Key</label>
                <input 
                  type="text" 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition bg-purple-50/30"
                  placeholder="Enter Secret Key"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Special Instruction</label>
                <input 
                  type="text" 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                  placeholder="e.g. Handle fragile items with care"
                  value={formData.instruction}
                  onChange={(e) => setFormData({...formData, instruction: e.target.value})}
                />
              </div>
            </div>
          ) : (
            // Pathao Form
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Provider*</label>
                <select 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50"
                  value="Pathao Courier"
                  disabled
                >
                  <option>Pathao Courier</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Api Key</label>
                  <input 
                    type="text" 
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    placeholder="Enter Pathao API Key"
                    value={pathaoData.apiKey}
                    onChange={(e) => setPathaoData({...pathaoData, apiKey: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-purple-600 mb-1">Secret Key</label>
                  <input 
                    type="text" 
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition bg-purple-50/30"
                    placeholder="Enter Pathao Secret Key"
                    value={pathaoData.secretKey}
                    onChange={(e) => setPathaoData({...pathaoData, secretKey: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input 
                    type="email" 
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    placeholder="Enter Pathao account email"
                    value={pathaoData.username}
                    onChange={(e) => setPathaoData({...pathaoData, username: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                    placeholder="Enter Pathao account password"
                    value={pathaoData.password}
                    onChange={(e) => setPathaoData({...pathaoData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Store Id</label>
                <input 
                  type="text" 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                  placeholder="Enter Pathao Store ID"
                  value={pathaoData.storeId}
                  onChange={(e) => setPathaoData({...pathaoData, storeId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Special Instruction</label>
                <input 
                  type="text" 
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                  placeholder="e.g. Handle fragile items with care"
                  value={pathaoData.instruction}
                  onChange={(e) => setPathaoData({...pathaoData, instruction: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="pt-4 sm:pt-5 lg:pt-6 mt-4 sm:mt-5 lg:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button 
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 lg:py-3 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <Truck size={16} className="sm:w-[18px] sm:h-[18px]" />}
              {isTesting ? 'Testing...' : 'Test'}
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg font-bold text-sm transition-all duration-300 shadow-lg min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] justify-center ${
                saveSuccess 
                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                  : isSaving 
                    ? 'bg-purple-500 text-white shadow-purple-200 cursor-wait'
                    : 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700'
              }`}
            >
              {saveSuccess ? (
                <><CheckCircle2 size={16} className="animate-bounce sm:w-[18px] sm:h-[18px]" /> Saved!</>
              ) : isSaving ? (
                <><Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> Saving...</>
              ) : (
                <><Save size={16} className="sm:w-[18px] sm:h-[18px]" /> Save</>
              )}
            </button>
          </div>

          {testResult && (
            <div className={`mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm ${testResult.valid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {testResult.valid ? <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> : <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
              <span className="truncate">{testResult.message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminCourierSettings;
