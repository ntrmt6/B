import React from 'react';
import { Activity, ArrowLeft, RefreshCw } from 'lucide-react';

interface VisitorsAnalysisHeaderProps {
  period: string;
  refreshing: boolean;
  onBack?: () => void;
  onPeriodChange: (period: string) => void;
  onRefresh: () => void;
}

const PERIOD_OPTIONS = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'All', value: 'all' },
];

export const VisitorsAnalysisHeader: React.FC<VisitorsAnalysisHeaderProps> = ({
  period,
  refreshing,
  onBack,
  onPeriodChange,
  onRefresh
}) => (
  <div className="rounded-2xl border border-sky-100 bg-white/95 p-3 shadow-[0_18px_48px_-36px_rgba(37,99,235,0.55)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 transition-all hover:border-sky-200 hover:bg-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
              <Activity size={12} />
              live insights
            </span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Visitors Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Drill into live and historical traffic sources, searches, product interest, and checkout journeys.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/80">
          {PERIOD_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                period === option.value
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 transition-all hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  </div>
);
