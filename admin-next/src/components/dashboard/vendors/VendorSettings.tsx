import React, { useState } from 'react';
import { ChevronLeft, Globe, ChevronRight, Settings } from 'lucide-react';
import type { Vendor } from '../../../types';
import VendorShopDomain from './VendorShopDomain';

interface VendorSettingsProps {
  vendor: Vendor;
  tenantId: string;
  onBack: () => void;
  onVendorUpdate: (vendor: Vendor) => void;
}

type SettingsView = 'menu' | 'shop_domain';

const VendorSettings: React.FC<VendorSettingsProps> = ({ vendor, tenantId, onBack, onVendorUpdate }) => {
  const [currentView, setCurrentView] = useState<SettingsView>('menu');

  if (currentView === 'shop_domain') {
    return (
      <VendorShopDomain
        vendor={vendor}
        tenantId={tenantId}
        onBack={() => setCurrentView('menu')}
        onVendorUpdate={onVendorUpdate}
      />
    );
  }

  const settingsItems = [
    {
      id: 'shop_domain',
      label: 'Shop Domain',
      description: 'Configure custom domain for your shop',
      icon: Globe,
      badge: vendor.customDomain ? (vendor.domainVerified ? 'Verified' : 'Pending') : undefined,
      badgeColor: vendor.domainVerified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <Settings className="w-5 h-5 text-[#FF8C00]" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Vendor Settings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.name}</p>
          </div>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {settingsItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as SettingsView)}
            className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
              index !== settingsItems.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#FF8C00]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{item.label}</p>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        ))}
      </div>

      {/* Vendor Info Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Vendor Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
            <p className="text-slate-700 dark:text-slate-200">{vendor.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              vendor.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : vendor.status === 'pending'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
            </span>
          </div>
          {vendor.customDomain && (
            <div className="col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Custom Domain</p>
              <p className="text-slate-700 dark:text-slate-200">{vendor.customDomain}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorSettings;
