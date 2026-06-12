
import React, { useState, useEffect } from 'react';
import { DeliveryConfig } from '../types';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Save, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDeliverySettingsProps {
  configs: DeliveryConfig[];
  onSave: (configs: DeliveryConfig[]) => void;
  onBack: () => void;
}

const AdminDeliverySettings: React.FC<AdminDeliverySettingsProps> = ({ configs, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'Regular' | 'Express' | 'Free'>('Regular');
  
  // Default delivery config
  const defaultConfig: DeliveryConfig = {
    type: 'Regular',
    isEnabled: false,
    division: 'Dhaka',
    insideCharge: 80,
    outsideCharge: 150,
    freeThreshold: 0,
    note: ''
  };
  
  // Ensure we always have all 3 config types
  const ensureAllConfigs = (inputConfigs: DeliveryConfig[]): DeliveryConfig[] => {
    const types = ['Regular', 'Express', 'Free'] as const;
    return types.map(type => {
      const existing = inputConfigs?.find(c => c.type === type);
      return existing || { ...defaultConfig, type };
    });
  };
  
  const [localConfigs, setLocalConfigs] = useState<DeliveryConfig[]>(ensureAllConfigs(configs));
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with props if they change externally
  useEffect(() => {
    setLocalConfigs(ensureAllConfigs(configs));
  }, [configs]);

  const activeConfig = localConfigs.find(c => c.type === activeTab) || defaultConfig;

  const handleUpdateConfig = (field: keyof DeliveryConfig, value: any) => {
    const updated = localConfigs.map(c => 
      c.type === activeTab ? { ...c, [field]: value } : c
    );
    setLocalConfigs(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      onSave(localConfigs);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSaveSuccess(true);
      setShowSuccess(true);
      toast.success('Delivery settings saved!');
      
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

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-0">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0">
           <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5"/>
        </button>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Delivery Settings</h2>
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">Configure delivery charges, methods, and areas.</p>
        </div>
      </div>

      {/* Tabs - Compact Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {['Regular', 'Express', 'Free'].map((type) => {
          const config = localConfigs.find(c => c.type === type);
          const isActive = activeTab === type;
          const isEnabled = config?.isEnabled;

          return (
            <div 
              key={type}
              onClick={() => { setActiveTab(type as any); setIsFormVisible(true); }}
              className={`
                relative p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[60px] sm:min-h-[70px] lg:h-24
                ${isActive ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-200'}
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 sm:gap-2">
                   {isEnabled ? (
                     <CheckCircle size={16} className="text-green-500 fill-green-100 sm:w-5 sm:h-5" />
                   ) : (
                     <Circle size={16} className="text-gray-300 sm:w-5 sm:h-5" />
                   )}
                   <span className={`font-bold text-xs sm:text-sm ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>
                     {type}
                   </span>
                </div>
              </div>
              
              {isActive && (
                <div className="text-[10px] sm:text-xs text-purple-600 font-medium flex items-center gap-1 mt-1.5 sm:mt-2">
                   {isFormVisible ? 'Hide' : 'Show'} 
                   {isFormVisible ? <ChevronUp size={10} className="sm:w-3 sm:h-3" /> : <ChevronDown size={10} className="sm:w-3 sm:h-3" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Form */}
      {isFormVisible && (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-to p-2">
           <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="min-w-0">
                 <h3 className="font-bold text-gray-800 text-sm sm:text-base lg:text-lg">{activeTab} Delivery Configuration</h3>
                 <p className="text-[10px] sm:text-xs text-gray-500">Update shipping rates and rules for this method.</p>
              </div>
              
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0">
                 <span className="text-xs sm:text-sm font-medium text-gray-700">Enable</span>
                 <div className="relative inline-block w-10 sm:w-12 h-5 sm:h-6 transition duration-200 ease-in-out rounded-full border border-gray-300 bg-white">
                    <input 
                      type="checkbox" 
                      className="absolute w-full h-full opacity-0 cursor-pointer"
                      checked={activeConfig.isEnabled}
                      onChange={(e) => handleUpdateConfig('isEnabled', e.target.checked)}
                    />
                    <span className={`block w-5 sm:w-6 h-5 sm:h-6 rounded-full shadow transition-transform duration-200 ${activeConfig.isEnabled ? 'translate-x-5 sm:translate-x-6 bg-green-500' : 'translate-x-0 bg-gray-300'}`}></span>
                 </div>
              </label>
           </div>

           <form onSubmit={handleSave} className="p-3 sm:p-4 lg:p-6">
              
              {showSuccess && (
                <div className="bg-green-50 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 border border-green-100 mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-1 text-xs sm:text-sm">
                   <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> Settings saved successfully!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                 <div className="sm:col-span-2">
                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Delivery Type</label>
                    <input 
                      type="text" 
                      value={`${activeTab} Delivery`} 
                      disabled 
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                 </div>

                 <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Your Division</label>
                    <select 
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                      value={activeConfig.division}
                      onChange={(e) => handleUpdateConfig('division', e.target.value)}
                    >
                       <option value="Dhaka">Amit's House</option>
                       <option value="Dhaka">Dhaka</option>
                       <option value="Chittagong">Chittagong</option>
                       <option value="Sylhet">Sylhet</option>
                       <option value="Khulna">Khulna</option>
                       <option value="Rajshahi">Rajshahi</option>
                       <option value="Barisal">Barisal</option>
                       <option value="Rangpur">Rangpur</option>
                       <option value="Mymensingh">Mymensingh</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Inside {activeConfig.division}</label>
                    <div className="relative">
                        <span className="absolute left-3 sm:left-4 to p-2 sm:to p-2.5 lg:to p-3 text-gray-500 text-sm">৳</span>
                        <input 
                        type="number" 
                        min="0"
                        className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={activeConfig.insideCharge}
                        onChange={(e) => handleUpdateConfig('insideCharge', Number(e.target.value))}
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Outside {activeConfig.division}</label>
                    <div className="relative">
                        <span className="absolute left-3 sm:left-4 to p-2 sm:to p-2.5 lg:to p-3 text-gray-500 text-sm">৳</span>
                        <input 
                        type="number" 
                        min="0"
                        className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={activeConfig.outsideCharge}
                        onChange={(e) => handleUpdateConfig('outsideCharge', Number(e.target.value))}
                        />
                    </div>
                 </div>

                 <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold</label>
                    <div className="relative">
                        <span className="absolute left-3 sm:left-4 to p-2 sm:to p-2.5 lg:to p-3 text-gray-500 text-sm">৳</span>
                        <input 
                        type="number" 
                        min="0"
                        className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="Leave 0 if not applicable"
                        value={activeConfig.freeThreshold}
                        onChange={(e) => handleUpdateConfig('freeThreshold', Number(e.target.value))}
                        />
                    </div>
                 </div>

                 <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Delivery Note</label>
                    <div className="relative">
                       <textarea 
                         rows={3}
                         className="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                         value={activeConfig.note}
                         onChange={(e) => handleUpdateConfig('note', e.target.value)}
                         placeholder="e.g. Order & Delivery Policy..."
                       ></textarea>
                    </div>
                 </div>
              </div>

              <div className="pt-4 sm:pt-5 lg:pt-6 border-t border-gray-100 mt-4 sm:mt-5 lg:mt-6 flex justify-end">
                 <button 
                   type="submit"
                   disabled={isSaving}
                   className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-lg font-bold text-sm transition-all duration-300 shadow-lg min-w-[120px] sm:min-w-[150px] lg:min-w-[180px] justify-center transform active:scale-95 ${
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
           </form>
        </div>
      )}
    </div>
  );
};

export default AdminDeliverySettings;
