import React from 'react';
import { Eye, Globe, TrendingUp } from 'lucide-react';

interface VisitorsSummaryCardsProps {
  onlineCount: number;
  totalViews: number;
  topSource: string;
  topSourcePercentage: number;
  uniqueSourceCount: number;
}

export const VisitorsSummaryCards: React.FC<VisitorsSummaryCardsProps> = ({
  onlineCount,
  totalViews,
  topSource,
  topSourcePercentage,
  uniqueSourceCount
}) => (
  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/90 p-3 shadow-[0_18px_40px_-34px_rgba(37,99,235,0.55)] dark:border-sky-500/20 dark:bg-sky-500/10">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/60">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Online Now</span>
      </div>
      <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">{onlineCount}</div>
      <p className="mt-1 text-[11px] text-sky-700/80 dark:text-sky-200/80">Active in the last 5 minutes</p>
    </div>

    <div className="overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/90 p-3 shadow-[0_18px_40px_-34px_rgba(249,115,22,0.55)] dark:border-orange-500/20 dark:bg-orange-500/10">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/60">
          <Eye size={16} className="text-orange-600 dark:text-orange-300" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">Page Views</span>
      </div>
      <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">{totalViews.toLocaleString()}</div>
      <p className="mt-1 text-[11px] text-orange-700/80 dark:text-orange-200/80">Across the selected range</p>
    </div>

    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/90 p-3 shadow-[0_18px_40px_-34px_rgba(37,99,235,0.55)] dark:border-sky-500/20 dark:bg-sky-500/10">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/60">
          <TrendingUp size={16} className="text-sky-600 dark:text-sky-300" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Top Source</span>
      </div>
      <div className="truncate text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{topSource}</div>
      <p className="mt-1 text-[11px] text-sky-700/80 dark:text-sky-200/80">{topSourcePercentage}% of traffic</p>
    </div>

    <div className="overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/90 p-3 shadow-[0_18px_40px_-34px_rgba(249,115,22,0.55)] dark:border-orange-500/20 dark:bg-orange-500/10">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/60">
          <Globe size={16} className="text-orange-600 dark:text-orange-300" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">Sources</span>
      </div>
      <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">{uniqueSourceCount}</div>
      <p className="mt-1 text-[11px] text-orange-700/80 dark:text-orange-200/80">Unique traffic channels</p>
    </div>
  </div>
);
