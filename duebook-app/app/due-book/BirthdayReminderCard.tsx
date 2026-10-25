'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cake, ChevronDown, ChevronUp, RefreshCw, MessageCircle } from 'lucide-react';
import api from '@/lib/api';

interface Upcoming {
  customerId: string;
  customerName: string;
  phone: string;
  memberName: string;
  relation: string;
  birthDate: string;
  birthdayOn: string;
  daysUntil: number;
  age: number | null;
}

interface Props {
  isDark: boolean;
  shopName?: string;
  tenantId?: string | null;
}

const waNumber = (phone: string) => {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0') && d.length === 11) return '880' + d.slice(1);
  return d;
};

const waUrl = (phone: string, msg: string) => {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : '';
};

function buildGreeting(u: Upcoming, shopName: string): string {
  const when = u.daysUntil === 0 ? 'আজ' : u.daysUntil === 1 ? 'আগামীকাল' : `${u.daysUntil} দিন পর`;
  const ageLine = u.age && u.age > 0 ? ` (${u.age} বছরের শুভ জন্মদিন)` : '';
  const shop = shopName?.trim() || 'আমাদের দোকান';
  return (
    `শুভেচ্ছা ${u.customerName} ভাই/আপা!\n\n` +
    `${u.memberName}${u.relation ? ' (' + u.relation + ')' : ''}-এর জন্মদিন ${when}${ageLine}।\n\n` +
    `${shop} থেকে আপনার জন্য বিশেষ ছাড় – কেক ও মিষ্টির উপরে ১০% ডিসকাউন্ট। অর্ডার করতে এই মেসেজের উত্তর দিন।\n\n` +
    `শুভ জন্মদিন 🎂`
  );
}

const relLabel = (d: number) =>
  d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`;

export default function BirthdayReminderCard({ shopName }: Props) {
  const [data, setData] = useState<Upcoming[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/duebook/family-birthdays?days=7');
      setData(r.data?.upcoming || []);
    } catch {
      /* offline / auth — silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  if (!data || data.length === 0) {
    // Keep the card hidden when there's nothing to show, to avoid visual noise.
    return null;
  }

  const soon = data.filter(u => u.daysUntil <= 1);
  const nextHeadline = soon[0] || data[0];
  const summary = `${nextHeadline.memberName}${nextHeadline.relation ? ' (' + nextHeadline.relation + ')' : ''} · ${relLabel(nextHeadline.daysUntil)}`;

  return (
    <div className="rounded-xl border border-pink-200 dark:border-pink-900 bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-950/40 dark:to-amber-950/30 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 active:bg-black/5 dark:active:bg-white/5"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Cake size={14} className="text-pink-500 shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pink-700 dark:text-pink-300 leading-none">
              Birthday reminders · {data.length} this week
            </p>
            <p className="text-[12px] font-bold text-gray-900 dark:text-slate-100 leading-tight mt-0.5 truncate">
              {summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); load(); }}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/50 dark:hover:bg-slate-700"
            aria-label="Refresh birthdays"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
          {expanded
            ? <ChevronUp size={13} className="text-gray-400" />
            : <ChevronDown size={13} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <ul className="px-2 pb-2 pt-1 space-y-1">
          {data.map((u, i) => {
            const msg = buildGreeting(u, shopName || '');
            const href = waUrl(u.phone, msg);
            return (
              <li key={`${u.customerId}-${i}`}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700">
                <div className="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
                  <Cake size={14} className="text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 dark:text-slate-100 truncate">
                    {u.memberName}
                    {u.relation && (
                      <span className="text-gray-500 dark:text-slate-400 font-normal"> · {u.relation}</span>
                    )}
                    {u.age ? (
                      <span className="ml-1 text-[10px] text-pink-700 dark:text-pink-300">({u.age})</span>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                    {u.customerName} · {relLabel(u.daysUntil)}
                  </p>
                </div>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-[11px] font-semibold"
                  >
                    <MessageCircle size={11} />
                    WhatsApp
                  </a>
                ) : (
                  <span className="shrink-0 text-[10px] text-gray-400">no phone</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
