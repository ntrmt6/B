import React from 'react';

interface DetailListCardProps {
  title: string;
  icon: React.ReactNode;
  emptyLabel: string;
  children: React.ReactNode;
  className?: string;
}

export const DetailListCard: React.FC<DetailListCardProps> = ({
  title,
  icon,
  emptyLabel,
  children,
  className = ''
}) => (
  <div className={`overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/70 ${className}`}>
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
      {icon}
      <span>{title}</span>
    </div>
    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
      {children || <p className="text-xs text-slate-400">{emptyLabel}</p>}
    </div>
  </div>
);
