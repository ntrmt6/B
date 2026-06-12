import React from 'react';
import { getSourceConfig, TrafficSourceAvatar } from './TrafficSourceAvatar';
import type { TrafficSource } from './types';

interface SourceListItemProps {
  source: TrafficSource;
  index: number;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

export const SourceListItem: React.FC<SourceListItemProps> = ({
  source,
  index,
  isSelected,
  onSelect
}) => {
  const config = getSourceConfig(source.name);

  return (
    <button
      type="button"
      onClick={() => onSelect(source.name)}
      className={`w-full rounded-2xl border p-2.5 text-left transition-all ${
        isSelected
          ? 'border-sky-300 bg-sky-50/80 shadow-[0_18px_40px_-36px_rgba(37,99,235,0.65)] dark:border-sky-500/40 dark:bg-sky-500/10'
          : 'border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <TrafficSourceAvatar source={source.name} />

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                {source.name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {source.visitors} visitors • {source.count.toLocaleString()} views
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ color: config.color, backgroundColor: config.bgColor }}
              >
                {source.percentage}%
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:inline">
                {isSelected ? 'selected' : `#${index + 1}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${source.percentage}%`,
                  backgroundColor: config.color,
                  minWidth: source.percentage > 0 ? '4px' : '0'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
