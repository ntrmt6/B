import React from 'react';
import { Globe } from 'lucide-react';
import { SourceListItem } from './SourceListItem';
import { SourceDetailsView } from './SourceDetailsView';
import type { TrafficSource, TrafficSourceDetails } from './types';

interface TrafficSourcesPanelProps {
  sources: TrafficSource[];
  selectedSourceName: string | null;
  details: TrafficSourceDetails | null;
  detailsLoading: boolean;
  onSourceSelect: (sourceName: string) => void;
  formatTimeAgo: (value: string) => string;
}

export const TrafficSourcesPanel: React.FC<TrafficSourcesPanelProps> = ({
  sources,
  selectedSourceName,
  details,
  detailsLoading,
  onSourceSelect,
  formatTimeAgo
}) => (
  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white p-3 shadow-[0_18px_48px_-38px_rgba(37,99,235,0.45)] dark:border-slate-700 dark:bg-slate-900 xl:col-span-8">
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">Traffic Sources</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click a source to review the persisted visitor history, search behavior, product interest, and checkout paths.
        </p>
      </div>
      <div className="flex-shrink-0 self-start rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
        {sources.length} sources
      </div>
    </div>

    {sources.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
        <Globe size={40} className="mb-3 opacity-50" />
        <p className="text-sm">No visitor data yet</p>
        <p className="mt-1 text-xs">Traffic sources will appear as visitors arrive</p>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="space-y-2">
          {sources.map((source, idx) => (
            <SourceListItem
              key={source.name}
              source={source}
              index={idx}
              isSelected={source.name === selectedSourceName}
              onSelect={onSourceSelect}
            />
          ))}
        </div>

        <SourceDetailsView
          selectedSourceName={selectedSourceName}
          details={details}
          detailsLoading={detailsLoading}
          formatTimeAgo={formatTimeAgo}
        />
      </div>
    )}
  </div>
);
