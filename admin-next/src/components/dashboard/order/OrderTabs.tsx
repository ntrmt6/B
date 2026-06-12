import React from 'react';

interface Tab {
  id: string;
  label: string;
  count: number;
}

interface OrderTabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const OrderTabs: React.FC<OrderTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex gap-1 xxs:gap-2 mb-4 xxs:mb-6 border-b border-gray-200 overflow-x-auto -mx-2 xxs:mx-0 px-2 xxs:px-0 scrollbar-thin">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-2 xxs:px-3 sm:px-4 py-2 xxs:py-3 text-xs xxs:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
};

export default OrderTabs;
