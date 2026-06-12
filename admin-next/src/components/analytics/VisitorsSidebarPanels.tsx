import React from 'react';
import { Users } from 'lucide-react';
import { getSourceConfig, TrafficSourceAvatar } from './TrafficSourceAvatar';
import type { OnlineVisitor } from './types';

interface VisitorsSidebarPanelsProps {
  onlineBySource: Record<string, number>;
  onlineCount: number;
  onlineVisitors: OnlineVisitor[];
  formatTimeAgo: (value: string) => string;
}

export const VisitorsSidebarPanels: React.FC<VisitorsSidebarPanelsProps> = ({
  onlineBySource,
  onlineCount,
  onlineVisitors,
  formatTimeAgo
}) => (
  <div className="space-y-3 xl:col-span-4">
    <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white p-3 shadow-[0_18px_48px_-38px_rgba(249,115,22,0.45)] dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">Online by Source</h2>
        <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2 py-1 dark:border-orange-500/20 dark:bg-orange-500/10">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-300">{onlineCount} online</span>
        </div>
      </div>

      {Object.keys(onlineBySource).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Users size={32} className="mb-2 opacity-50" />
          <p className="text-xs">No visitors online right now</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(onlineBySource)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => {
              const config = getSourceConfig(source);
              const percentage = onlineCount > 0 ? Math.round((count / onlineCount) * 100) : 0;

              return (
                <div
                  key={source}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-2 transition-colors hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-slate-700"
                >
                  <TrafficSourceAvatar source={source} size="sm" />
                  <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{source}</span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{count}</span>
                  <span
                    className="w-8 text-right text-[11px] font-medium"
                    style={{ color: config.color }}
                  >
                    {percentage}%
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>

    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white p-3 shadow-[0_18px_48px_-38px_rgba(37,99,235,0.45)] dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">Active Visitors</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Latest pages visitors are viewing right now.</p>
        </div>
        <div className="rounded-full border border-sky-100 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
          {onlineVisitors.length}
        </div>
      </div>

      {onlineVisitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Users size={32} className="mb-2 opacity-50" />
          <p className="text-xs">No active visitors</p>
        </div>
      ) : (
        <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
          {onlineVisitors.slice(0, 20).map(visitor => (
            <div
              key={`${visitor.visitorId}-${visitor.lastSeen}`}
              className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-2 transition-colors hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-slate-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <Users size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{visitor.page || '/'}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <TrafficSourceAvatar source={visitor.source} size="sm" />
                  <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">{visitor.source}</span>
                </div>
              </div>
              <span className="flex-shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {formatTimeAgo(visitor.lastSeen)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
