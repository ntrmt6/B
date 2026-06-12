import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Loader2, Gift, Users, Info, Percent, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../services/authService';

interface AdminRewardPointSettingsProps {
  tenantId: string;
  onBack?: () => void;
}

interface RewardPointConfig {
  enabled: boolean;
  pointsPerCurrency: number;
  currencyAmount: number;
  calculationType: 'manual' | 'percentage';
  rewardPercentage: number;
  referralEnabled: boolean;
  referralPointsPerReferral: number;
}

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
};

const AdminRewardPointSettings: React.FC<AdminRewardPointSettingsProps> = ({ tenantId, onBack }) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<RewardPointConfig>({
    enabled: false,
    pointsPerCurrency: 1,
    currencyAmount: 100,
    calculationType: 'manual',
    rewardPercentage: 5,
    referralEnabled: false,
    referralPointsPerReferral: 50
  });

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/reward-points/config`, {
        headers: { 'X-Tenant-Id': tenantId, ...getAuthHeader() }
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfig(prev => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Error fetching reward point config:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchConfig();
    }
  }, [tenantId, fetchConfig]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${getApiBaseUrl()}/api/reward-points/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
          ...getAuthHeader()
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success('Reward point settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving reward point config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const calculateExamplePoints = () => {
    if (config.calculationType === 'percentage') {
      const examplePurchase = 1000;
      return Math.floor((examplePurchase * config.rewardPercentage) / 100);
    }
    return Math.floor((1000 / config.currencyAmount) * config.pointsPerCurrency);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Reward Point Settings</h1>
                <p className="text-sm text-gray-500">Configure your customer reward point system</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 font-medium shadow-lg shadow-blue-500/25"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Left Column - Main Reward Point Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            {/* Enable Reward Point System */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enable Reward Point System</h3>
                  <p className="text-sm text-gray-500">Reward customers with points for purchases</p>
                </div>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                  config.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute to p-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    config.enabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {config.enabled && (
              <>
                {/* Point Value Configuration */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Point Value Configuration
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1.5">Number of Points</label>
                      <input
                        type="number"
                        value={config.pointsPerCurrency}
                        onChange={(e) => setConfig(prev => ({ ...prev, pointsPerCurrency: Number(e.target.value) }))}
                        min="1"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center font-semibold text-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl">
                      <span className="text-gray-400 font-bold">=</span>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1.5">Currency Amount (৳)</label>
                      <input
                        type="number"
                        value={config.currencyAmount}
                        onChange={(e) => setConfig(prev => ({ ...prev, currencyAmount: Number(e.target.value) }))}
                        min="1"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center font-semibold text-lg"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Customer earns {config.pointsPerCurrency} point(s) for every ৳{config.currencyAmount} spent
                  </p>
                </div>

                {/* Calculation Type */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Reward Calculation Method
                  </label>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        config.calculationType === 'manual'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="calculationType"
                        checked={config.calculationType === 'manual'}
                        onChange={() => setConfig(prev => ({ ...prev, calculationType: 'manual' }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">Manual Calculation</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Set fixed points per currency amount
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        config.calculationType === 'percentage'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="calculationType"
                        checked={config.calculationType === 'percentage'}
                        onChange={() => setConfig(prev => ({ ...prev, calculationType: 'percentage' }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-900">Percentage Based</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Calculate points as percentage of purchase
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Percentage Input (shown when percentage-based is selected) */}
                {config.calculationType === 'percentage' && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-xl">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reward Point Percentage
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={config.rewardPercentage}
                        onChange={(e) => setConfig(prev => ({ ...prev, rewardPercentage: Number(e.target.value) }))}
                        min="0"
                        max="100"
                        step="0.5"
                        className="flex-1 px-4 py-2.5 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-center font-semibold text-lg"
                      />
                      <span className="text-lg font-semibold text-purple-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Customer earns {config.rewardPercentage}% of purchase amount as points
                    </p>
                  </div>
                )}

                {/* Example Calculation */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-800 text-sm">Example Calculation</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        For a ৳1,000 purchase, customer will earn approximately{' '}
                        <span className="font-bold text-amber-900">{calculateExamplePoints()} points</span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Referral Reward Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 h-fit">
            {/* Enable Referral Reward Point */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enable Referral Reward Point</h3>
                  <p className="text-sm text-gray-500">Reward customers for referrals</p>
                </div>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, referralEnabled: !prev.referralEnabled }))}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                  config.referralEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute to p-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    config.referralEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {config.referralEnabled && (
              <>
                {/* Referral Points Configuration */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reward Point Per Referral
                  </label>
                  <input
                    type="number"
                    value={config.referralPointsPerReferral}
                    onChange={(e) => setConfig(prev => ({ ...prev, referralPointsPerReferral: Number(e.target.value) }))}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-center font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Points awarded when a referred customer makes their first purchase
                  </p>
                </div>

                {/* Referral Info */}
                <div className="mt-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-violet-800 text-sm">How it works</h4>
                      <p className="text-sm text-violet-700 mt-1">
                        When a customer refers someone and they make a purchase, the referrer earns{' '}
                        <span className="font-bold text-violet-900">{config.referralPointsPerReferral} points</span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quick Stats Card */}
            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3">Quick Summary</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Point System</span>
                  <span className={`font-medium ${config.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {config.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Referral Rewards</span>
                  <span className={`font-medium ${config.referralEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {config.referralEnabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {config.enabled && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Calculation Method</span>
                    <span className="font-medium text-blue-600 capitalize">
                      {config.calculationType === 'percentage' ? 'Percentage' : 'Manual'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRewardPointSettings;
