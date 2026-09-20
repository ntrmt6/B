'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  AttendanceReport,
  getAttendanceConfig,
  getAttendanceReport,
  setAttendanceConfig,
} from '@/lib/attendanceApi';
import { toBn, formatBdt } from '@/lib/bn';
import { ChevronLeft, Save, Users, TrendingUp, Calendar } from 'lucide-react';

const monthKey = (d = new Date()): string =>
  new Date(d.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 7);

const shiftMonth = (key: string, delta: number): string => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

const BN_MONTH_NAMES = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return `${BN_MONTH_NAMES[m - 1]} ${toBn(y)}`;
};

export default function AttendanceAdminPage() {
  const router = useRouter();
  const { user, tenantId, loading } = useAuth();
  const [month, setMonth] = useState<string>(monthKey());
  const [rate, setRate] = useState<string>('');
  const [savedRate, setSavedRate] = useState<number>(0);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    const isEmp = user.role === 'employee' || (typeof window !== 'undefined' && localStorage.getItem('duebook_role') === 'employee');
    if (isEmp) router.replace('/due-book/attendance');
  }, [loading, user, router]);

  const loadConfig = useCallback(async () => {
    try {
      const r = await getAttendanceConfig();
      setSavedRate(r.dailyAttendanceRate);
      setRate(String(r.dailyAttendanceRate || 0));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'সেটিং লোড হয়নি');
    }
  }, []);

  const loadReport = useCallback(async () => {
    if (!tenantId) return;
    setBusy(true);
    try { setReport(await getAttendanceReport(month)); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'রিপোর্ট লোড হয়নি'); }
    finally { setBusy(false); }
  }, [tenantId, month]);

  useEffect(() => { if (tenantId) { loadConfig(); loadReport(); } }, [tenantId, loadConfig, loadReport]);
  useEffect(() => { if (tenantId) loadReport(); }, [month, tenantId, loadReport]);

  const saveRate = async () => {
    const n = Number(rate);
    if (!Number.isFinite(n) || n < 0) return toast.error('সঠিক টাকার পরিমাণ দিন');
    setSaving(true);
    try {
      const r = await setAttendanceConfig(n);
      setSavedRate(r.dailyAttendanceRate);
      setRate(String(r.dailyAttendanceRate));
      toast.success('হাজিরা রেট আপডেট হয়েছে');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'সেভ হয়নি');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে…</div>;

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white pb-8">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-3 py-3">
          <Link href="/due-book" className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="ফিরে যান">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-bold text-lg">হাজিরা ব্যবস্থাপনা</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-4 space-y-5">
        {/* Daily rate config */}
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
          <h2 className="font-semibold text-base">দৈনিক হাজিরার টাকা</h2>
          <p className="text-xs text-neutral-500 mt-1">
            প্রতিদিন হাজিরা দিলে কর্মচারী কত টাকা পাবেন সেটা নির্ধারণ করুন। বর্তমান: <b>{formatBdt(savedRate)}</b>
          </p>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 px-3">
              <span className="text-neutral-500">৳</span>
              <input
                type="number"
                min={0}
                step={1}
                value={rate}
                onChange={e => setRate(e.target.value)}
                className="w-full py-2.5 px-2 bg-transparent outline-none text-lg font-semibold tabular-nums"
                placeholder="0"
              />
              <span className="text-xs text-neutral-500">/ দিন</span>
            </div>
            <button
              onClick={saveRate}
              disabled={saving || Number(rate) === savedRate}
              className="px-4 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium flex items-center gap-1 disabled:opacity-50"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              সেভ
            </button>
          </div>
        </section>

        {/* Month picker */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm">‹ আগের মাস</button>
          <div className="font-semibold flex items-center gap-1.5"><Calendar size={14} /> {monthLabel(month)}</div>
          <button
            onClick={() => setMonth(shiftMonth(month, +1))}
            disabled={month >= monthKey()}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-40"
          >পরের মাস ›</button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1"><Users size={12} /> মোট হাজিরা</div>
            <div className="text-2xl font-bold mt-1">{toBn(report?.totals.days || 0)} দিন</div>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1"><TrendingUp size={12} /> মোট প্রদেয় বেতন</div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{formatBdt(report?.totals.salary || 0)}</div>
          </div>
        </div>

        {/* Employees list */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-500 mb-2">কর্মচারী তালিকা</h2>
          {busy && !report ? (
            <div className="text-center py-10 text-neutral-500">লোড হচ্ছে…</div>
          ) : (report?.employees.length || 0) === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <Users size={36} className="mx-auto opacity-40 mb-2" />
              <p>কোনো কর্মচারী যুক্ত নেই।</p>
              <Link href="/due-book/devices" className="inline-block mt-2 text-sky-500 underline text-sm">কর্মচারী ডিভাইস যোগ করুন</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {report!.employees.map(e => (
                <li key={e.deviceId} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                    {(e.label || 'ক').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {e.label}
                      {e.revoked && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">বাতিল</span>}
                    </div>
                    <div className="text-xs text-neutral-500">{toBn(e.days)} দিন হাজিরা</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatBdt(e.totalSalary)}</div>
                    <div className="text-[10px] text-neutral-500">প্রদেয়</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="text-xs text-neutral-500 text-center pt-2">
          কর্মচারী তার ডিভাইসে <Link href="/due-book/attendance" className="text-sky-500 underline">/due-book/attendance</Link> খুলে দৈনিক হাজিরা দেবেন।
        </div>
      </main>
    </div>
  );
}
