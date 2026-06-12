import React from 'react';
import { Globe } from 'lucide-react';
import { getSourceConfig, TrafficSourceAvatar } from './TrafficSourceAvatar';
import {
  ReferrersList,
  ProductClicksList,
  SearchTermsList,
  CheckoutJourneysList,
  RecentVisitorsList
} from './SourceDetailSections';
import type { TrafficSourceDetails } from './types';

interface SourceDetailsViewProps {
  selectedSourceName: string | null;
  details: TrafficSourceDetails | null;
  detailsLoading: boolean;
  formatTimeAgo: (value: string) => string;
}

const DetailsLoadingSkeleton: React.FC = () => (
  <div className="grid gap-3 lg:grid-cols-2">
    {[1, 2, 3, 4].map(item => (
      <div
        key={item}
        className="rounded-2xl border border-slate-100 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/70"
      >
        <div className="mb-3 h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          {[1, 2, 3].map(row => (
            <div key={row} className="h-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SourceDetailsView: React.FC<SourceDetailsViewProps> = ({
  selectedSourceName,
  details,
  detailsLoading,
  formatTimeAgo
}) => {
  const selectedSourceConfig = details ? getSourceConfig(details.source) : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-orange-50/70 p-3 sm:p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-orange-500/5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: selectedSourceConfig?.bgColor || 'rgba(148, 163, 184, 0.14)' }}
          >
            {details ? (
              <TrafficSourceAvatar source={details.source} size="lg" />
            ) : (
              <Globe size={18} className="text-slate-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Persisted details</p>
            <h3 className="truncate text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
              {details?.source || selectedSourceName || 'Choose a traffic source'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historical data stays available here even after visitors leave the site.
            </p>
          </div>
        </div>

        {details && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/80 p-2 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{details.visitors}</div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Visitors</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{details.views}</div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Views</div>
            </div>
          </div>
        )}
      </div>

      {detailsLoading ? (
        <DetailsLoadingSkeleton />
      ) : details ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <ReferrersList referrers={details.topReferrers} />
          <ProductClicksList products={details.topProducts} />
          <SearchTermsList searches={details.recentSearches} formatTimeAgo={formatTimeAgo} />
          <CheckoutJourneysList journeys={details.checkoutJourneys} formatTimeAgo={formatTimeAgo} />
          <RecentVisitorsList visitors={details.recentVisitors} formatTimeAgo={formatTimeAgo} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
          Select a traffic source to inspect its historical visitor behavior.
        </div>
      )}
    </div>
  );
};
