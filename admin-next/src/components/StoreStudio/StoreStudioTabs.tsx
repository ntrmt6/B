import React from 'react';
import { Settings, Layout, Grid, Palette } from 'lucide-react';

type TabId = 'settings' | 'styles' | 'layout' | 'products';

interface StoreStudioTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'styles', label: 'Styles', icon: <Palette className="w-4 h-4" /> },
  { id: 'layout', label: 'Layout Builder', icon: <Layout className="w-4 h-4" /> },
  { id: 'products', label: 'Product Order', icon: <Grid className="w-4 h-4" /> },
];

export const StoreStudioTabs: React.FC<StoreStudioTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex gap-1 border-t border-gray-200 -mb-px overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default StoreStudioTabs;
