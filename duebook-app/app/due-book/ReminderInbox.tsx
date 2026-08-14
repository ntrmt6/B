'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, X, Send, Trash2, RefreshCw, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

interface ReminderItem {
  _id: string;
  entityName: string;
  phone: string;
  totalDue: number;
  daysOverdue: number;
  txCount: number;
  triggerReason: string;
  message: string;
  status: 'pending' | 'sent' | 'dismissed';
  generatedAt: string;
  sentAt?: string;
}

interface ReminderSettings {
  enabled: boolean;
  triggerDaysOverdue: number[];
  minAmount: number;
  cooldownDays: number;
  runHourLocal: number;
  maxRemindersPerRun: number;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  triggerDaysOverdue: [3, 7, 14, 30],
  minAmount: 100,
  cooldownDays: 3,
  runHourLocal: 9,
  maxRemindersPerRun: 50,
};

const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0') && d.length === 11) return '880' + d.slice(1);
  return d;
};

const waUrl = (phone: string, message: string) => {
  const n = waNumber(phone);
  if (!n) return '';
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
};

const fmtMoney = (n: number) => {
  const abs = Math.abs(n);
  if (abs < 1000) return 'Tk ' + abs.toLocaleString('en-IN');
  return 'Tk ' + new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(abs).toLowerCase();
};

interface Props {
  isDark: boolean;
}

export default function ReminderInbox({ isDark }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'settings'>('list');
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get('/duebook/reminder-queue?status=pending');
      setCount(Array.isArray(data) ? data.length : 0);
    } catch {
      /* ignore — probably offline */
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/duebook/reminder-queue?status=pending');
      setItems(Array.isArray(data) ? data : []);
      setCount(Array.isArray(data) ? data.length : 0);
    } catch (e: any) {
      toast.error('Could not load reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/duebook/reminder-settings');
      const s: ReminderSettings = {
        enabled: !!data.enabled,
        triggerDaysOverdue: Array.isArray(data.triggerDaysOverdue)
          ? data.triggerDaysOverdue
          : DEFAULT_SETTINGS.triggerDaysOverdue,
        minAmount: typeof data.minAmount === 'number' ? data.minAmount : DEFAULT_SETTINGS.minAmount,
        cooldownDays:
          typeof data.cooldownDays === 'number' ? data.cooldownDays : DEFAULT_SETTINGS.cooldownDays,
        runHourLocal:
          typeof data.runHourLocal === 'number' ? data.runHourLocal : DEFAULT_SETTINGS.runHourLocal,
        maxRemindersPerRun:
          typeof data.maxRemindersPerRun === 'number'
            ? data.maxRemindersPerRun
            : DEFAULT_SETTINGS.maxRemindersPerRun,
      };
      setSettings(s);
      setDraft(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchCount();
    fetchSettings();
    const t = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchCount, fetchSettings]);

  useEffect(() => {
    if (open) {
      fetchItems();
      fetchSettings();
    }
  }, [open, fetchItems, fetchSettings]);

  useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.history.pushState({ duebook: 'reminders' }, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open]);

  const markSent = async (id: string) => {
    setItems(prev => prev.filter(x => x._id !== id));
    setCount(c => Math.max(0, c - 1));
    try {
      await api.post(`/duebook/reminder-queue/${id}/mark-sent`);
    } catch {
      toast.error('Failed to mark sent — item will reappear');
      fetchItems();
    }
  };

  const dismiss = async (id: string) => {
    setItems(prev => prev.filter(x => x._id !== id));
    setCount(c => Math.max(0, c - 1));
    try {
      await api.post(`/duebook/reminder-queue/${id}/dismiss`);
    } catch {
      toast.error('Failed to dismiss');
      fetchItems();
    }
  };

  const sendOne = (item: ReminderItem) => {
    const href = waUrl(item.phone, item.message);
    if (!href) {
      toast.error('Invalid phone number');
      return;
    }
    window.open(href, '_blank');
    markSent(item._id);
  };

  const generateNow = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/duebook/reminder-queue/generate-now');
      toast.success(
        data?.generated
          ? `Added ${data.generated} reminder${data.generated === 1 ? '' : 's'}`
          : 'No new reminders to add',
      );
      await fetchItems();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/duebook/reminder-settings', draft);
      setSettings(draft);
      toast.success('Reminder settings saved');
      setView('list');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Save failed');
    } finally {
      setSavingSettings(false);
    }
  };

  const bandsText = useMemo(
    () => (draft.triggerDaysOverdue.length ? draft.triggerDaysOverdue.join(', ') : ''),
    [draft.triggerDaysOverdue],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700"
        aria-label="Reminders"
      >
        <Bell size={14} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-1 shrink-0">
              <div className="flex items-center gap-2">
                {view === 'settings' && (
                  <button
                    onClick={() => setView('list')}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <ArrowLeft size={15} className="text-gray-500 dark:text-slate-400" />
                  </button>
                )}
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">
                  {view === 'settings' ? 'Reminder Rules' : 'Reminders'}
                </h3>
                {view === 'list' && count > 0 && (
                  <span className="text-[11px] font-semibold text-sky-500">{count} pending</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {view === 'list' && (
                  <>
                    <button
                      onClick={generateNow}
                      disabled={generating}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
                      title="Generate reminders now"
                    >
                      <RefreshCw
                        size={14}
                        className={generating ? 'animate-spin' : ''}
                      />
                    </button>
                    <button
                      onClick={() => setView('settings')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <SettingsIcon size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X size={15} className="text-gray-400 dark:text-slate-500" />
                </button>
              </div>
            </div>

            {view === 'list' && (
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                {!settings.enabled && (
                  <div className="mb-3 mx-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-[12px] font-semibold text-amber-800 dark:text-amber-300 mb-1">
                      Auto-reminders are off
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2">
                      Enable rules to auto-scan overdue customers every day.
                    </p>
                    <button
                      onClick={() => setView('settings')}
                      className="text-[12px] font-bold text-amber-700 dark:text-amber-300 underline"
                    >
                      Open Settings →
                    </button>
                  </div>
                )}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <span className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <Bell size={28} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="text-[13px] font-semibold text-gray-500 dark:text-slate-400">
                      No reminders queued
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                      {settings.enabled
                        ? 'Overdue customers will appear here automatically.'
                        : 'Turn on auto-reminders to start.'}
                    </p>
                    {settings.enabled && (
                      <button
                        onClick={generateNow}
                        disabled={generating}
                        className="mt-4 px-4 py-2 rounded-lg bg-sky-500 text-white text-[12px] font-bold disabled:opacity-50"
                      >
                        {generating ? 'Scanning…' : 'Scan overdue now'}
                      </button>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {items.map(item => (
                      <li
                        key={item._id}
                        className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-gray-900 dark:text-slate-100 truncate">
                              {item.entityName}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                              {item.phone} • {item.txCount} unpaid
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[13px] font-bold text-red-600 dark:text-red-400 tabular-nums">
                              {fmtMoney(item.totalDue)}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400">
                              {item.daysOverdue}d overdue
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => sendOne(item)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-500 text-white text-[12px] font-bold active:scale-[0.98]"
                          >
                            <Send size={12} /> Send on WhatsApp
                          </button>
                          <button
                            onClick={() => dismiss(item._id)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                            title="Dismiss"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {view === 'settings' && (
              <div className="flex-1 overflow-y-auto px-4 pb-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-gray-800 dark:text-slate-100">
                      Auto-scan enabled
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      Server scans daily and queues reminders
                    </p>
                  </div>
                  <button
                    onClick={() => setDraft(p => ({ ...p, enabled: !p.enabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      draft.enabled ? 'bg-sky-500' : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        draft.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Trigger at days overdue
                  </label>
                  <input
                    type="text"
                    value={bandsText}
                    onChange={e => {
                      const v = e.target.value
                        .split(',')
                        .map(s => parseInt(s.trim(), 10))
                        .filter(n => Number.isFinite(n) && n >= 0 && n <= 365);
                      setDraft(p => ({ ...p, triggerDaysOverdue: v }));
                    }}
                    placeholder="3, 7, 14, 30"
                    className="mt-1 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-900"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                    Comma-separated. Sends when a customer's oldest unpaid entry hits any of these.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Min due (Tk)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={draft.minAmount}
                      onChange={e =>
                        setDraft(p => ({ ...p, minAmount: parseFloat(e.target.value) || 0 }))
                      }
                      className="mt-1 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Cooldown (days)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={365}
                      value={draft.cooldownDays}
                      onChange={e =>
                        setDraft(p => ({ ...p, cooldownDays: parseInt(e.target.value, 10) || 0 }))
                      }
                      className="mt-1 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Run hour (BD, 0–23)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={23}
                      value={draft.runHourLocal}
                      onChange={e =>
                        setDraft(p => ({
                          ...p,
                          runHourLocal: Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0)),
                        }))
                      }
                      className="mt-1 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Cap / run
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={1000}
                      value={draft.maxRemindersPerRun}
                      onChange={e =>
                        setDraft(p => ({
                          ...p,
                          maxRemindersPerRun: Math.min(
                            1000,
                            Math.max(1, parseInt(e.target.value, 10) || 1),
                          ),
                        }))
                      }
                      className="mt-1 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-sky-50 dark:bg-sky-900/20 p-3">
                  <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">
                    💡 We queue reminders on the server; you tap <b>Send on WhatsApp</b> to actually
                    deliver each one. That keeps things free and lets you review before sending.
                  </p>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {savingSettings ? 'Saving…' : 'Save Rules'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
