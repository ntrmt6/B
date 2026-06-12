import React from 'react';

interface CatalogTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface CatalogTabsProps {
  tabs: CatalogTab[];
  activeView: string;
  onNavigate: (view: string) => void;
  onPageReset: () => void;
}

export function CatalogTabs({ tabs, activeView, onNavigate, onPageReset }: CatalogTabsProps) {
  return (
    <div className="flex gap-0 border-b border-gray-200 dark:border-gray-600 mb-5 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { onNavigate(tab.id); onPageReset(); }}
            className={`flex items-center gap-1 px-[22px] py-3 h-[48px] whitespace-nowrap transition-colors ${
              isActive ? 'border-b-2 border-[#38bdf8]' : ''
            }`}
          >
            <span className={isActive ? 'text-[#38bdf8]' : 'text-black dark:text-white'}>
              {tab.icon}
            </span>
            <span
              className={`text-[16px] font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] bg-clip-text text-transparent'
                  : 'text-black dark:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && isActive && `(${tab.count})`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
