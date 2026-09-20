'use client';

import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface Pnl {
  date: string;
  salesRevenue: number;
  cogs: number;
  grossProfit: number;
  wages: number;
  advances: number;
  otherIncome: number;
  otherExpense: number;
  net: number;
  counts: { sales: number; transactions: number; employeesMarked: number; advances: number };
  breakdown: {
    topSales: { itemName: string; qty: number; revenue: number; profit: number }[];
    expenses: { amount: number; note: string }[];
  };
}

const fmt = (n: number) => {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  if (abs < 1000) return sign + 'Tk ' + abs.toLocaleString('en-IN');
  return sign + 'Tk ' + new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(abs).toLowerCase();
};

interface Props {
  isDark: boolean;
}

export default function DailyPnlCard({ isDark }: Props) {
  void isDark;
  const [data, setData] = useState<Pnl | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/duebook/pnl');
      setData(r.data);
    } catch {
      /* offline / auth — silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-center text-[11px] text-gray-400 dark:text-slate-500">
        {loading ? 'Loading today\'s P&L…' : 'P&L unavailable'}
      </div>
    );
  }

  const netPositive = data.net >= 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 active:bg-gray-50 dark:active:bg-slate-700"
      >
        <div className="flex items-center gap-2 min-w-0">
          {netPositive ? (
            <TrendingUp size={14} className="text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown size={14} className="text-red-500 shrink-0" />
          )}
          <div className="text-left min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 leading-none">
              Today · {data.date}
            </p>
            <p className={`text-[15px] font-bold tabular-nums leading-tight mt-0.5 ${netPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmt(data.net)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-gray-500 dark:text-slate-400 tabular-nums">
            {fmt(data.salesRevenue)} sales
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); load(); }}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Refresh P&L"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
          {expanded ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 dark:border-slate-700 pt-2 space-y-1.5 text-[12px]">
          <Row label="Sales revenue" value={data.salesRevenue} tone="pos" />
          <Row label="Ingredient cost" value={-data.cogs} tone="neg" />
          <Row label="Gross profit" value={data.grossProfit} tone={data.grossProfit >= 0 ? 'pos' : 'neg'} bold />
          {data.wages > 0 && <Row label="Wages (attendance today)" value={-data.wages} tone="neg" />}
          {data.advances > 0 && <Row label="Advances paid today" value={-data.advances} tone="neg" />}
          {data.otherIncome > 0 && <Row label="Other income" value={data.otherIncome} tone="pos" />}
          {data.otherExpense > 0 && <Row label="Other expense" value={-data.otherExpense} tone="neg" />}
          <div className="pt-1.5 mt-1 border-t border-gray-200 dark:border-slate-700">
            <Row label="Net" value={data.net} tone={netPositive ? 'pos' : 'neg'} bold />
          </div>
          {data.breakdown.topSales.length > 0 && (
            <div className="pt-1.5 mt-1 border-t border-gray-200 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Top sales</p>
              <ul className="space-y-0.5">
                {data.breakdown.topSales.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-gray-700 dark:text-slate-300">
                      {s.itemName} · {s.qty}
                    </span>
                    <span className="tabular-nums text-gray-900 dark:text-slate-100">{fmt(s.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone, bold }: { label: string; value: number; tone: 'pos' | 'neg' | 'neu'; bold?: boolean }) {
  const cls =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-700 dark:text-slate-300';
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-gray-600 dark:text-slate-400 ${bold ? 'font-bold text-gray-900 dark:text-slate-100' : ''}`}>{label}</span>
      <span className={`tabular-nums ${cls} ${bold ? 'font-bold' : ''}`}>{fmt(value)}</span>
    </div>
  );
}
