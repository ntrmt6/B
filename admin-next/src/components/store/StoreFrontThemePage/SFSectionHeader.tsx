import React, { memo } from 'react';

export const SectionHeader = memo(({ title, onViewAll }: { title: string; onViewAll?: () => void }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Lato', sans-serif" }}>{title}</h2>
    {onViewAll && (
      <button onClick={onViewAll} className="px-5 py-2 rounded-full border border-gray-900 text-gray-900 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors" style={{ fontFamily: "'Lato', sans-serif" }}>
        View All
      </button>
    )}
  </div>
));
SectionHeader.displayName = 'SectionHeader';
