'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  AttendanceMe,
  getMyAttendance,
  markAttendance,
} from '@/lib/attendanceApi';
import { toBn, formatBdt, formatBnDate, formatBnTime } from '@/lib/bn';
import { ChevronLeft, CheckCircle2, Calendar, Clock, TrendingUp } from 'lucide-react';

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

export default function AttendancePage() {
  const router = useRouter();
  const { user, tenantId, loading } = useAuth();
  const [month, setMonth] = useState<string>(monthKey());
  const [data, setData] = useState<AttendanceMe | null>(null);
  const [busy, setBusy] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    const isEmp = user.role === 'employee' || (typeof window !== 'undefined' && localStorage.getItem('duebook_role') === 'employee');
    if (!isEmp) router.replace('/due-book/attendance-admin');
  }, [loading, user, router]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setBusy(true);
    try { setData(await getMyAttendance(month)); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'লোড করা যায়নি'); }
    finally { setBusy(false); }
  }, [tenantId, month]);

  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);

  const onMark = async () => {
    setMarking(true);
    try {
      const r = await markAttendance();
      if (r.alreadyMarked) toast('আজকের হাজিরা আগেই দেওয়া হয়েছে', { icon: 'ℹ️' });
      else toast.success('আজকের হাজিরা দেওয়া হয়েছে');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'হাজিরা দেওয়া যায়নি');
    } finally {
      setMarking(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে…</div>;

  const totalDays = data?.totalDays || 0;
  const totalSalary = data?.totalSalary || 0;
  const rate = data?.currentRate || 0;
  const markedToday = !!data?.markedToday;

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white pb-8">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-3 py-3">
          <Link href="/due-book/orders" className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="ফিরে যান">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-bold text-lg">হাজিরা</h1>
          <span className="ml-auto text-xs text-neutral-500">{user.name || 'কর্মচারী'}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        {/* Today card + mark button */}
        <div className={`rounded-2xl p-4 border-2 ${markedToday
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400'
          : 'bg-sky-50 dark:bg-sky-900/20 border-sky-400'}`}>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <Calendar size={16} />
            <span>আজ · {formatBnDate(new Date())}</span>
          </div>
          <div className="mt-2 text-2xl font-bold">
            {markedToday ? 'হাজিরা দেওয়া হয়েছে ✓' : 'আজকের হাজিরা এখনো দেওয়া হয়নি'}
          </div>
          <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            আজকের হাজিরায় পাবেন: <b>{formatBdt(rate)}</b>
          </div>
          <button
            onClick={onMark}
            disabled={marking || markedToday}
            className={`mt-3 w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${markedToday
              ? 'bg-emerald-500 cursor-default opacity-90'
              : 'bg-sky-500 hover:bg-sky-600 disabled:opacity-60'}`}
          >
            {marking ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
            {markedToday ? 'হাজিরা সম্পন্ন' : 'হাজিরা দিন'}
          </button>
        </div>

        {/* Month picker */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm">‹ আগের মাস</button>
          <div className="font-semibold">{monthLabel(month)}</div>
          <button
            onClick={() => setMonth(shiftMonth(month, +1))}
            disabled={month >= monthKey()}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-40"
          >পরের মাস ›</button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1"><Clock size={12} /> মোট হাজিরা</div>
            <div className="text-2xl font-bold mt-1">{toBn(totalDays)} দিন</div>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1"><TrendingUp size={12} /> মোট বেতন</div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{formatBdt(totalSalary)}</div>
          </div>
        </div>

        {/* Days list */}
        <div>
          <div className="text-sm font-semibold text-neutral-500 mb-2">এই মাসের হাজিরা</div>
          {busy && !data ? (
            <div className="text-center py-10 text-neutral-500">লোড হচ্ছে…</div>
          ) : (data?.rows.length || 0) === 0 ? (
            <div className="text-center py-10 text-neutral-500">এই মাসে কোনো হাজিরা নেই।</div>
          ) : (
            <ul className="space-y-2">
              {data!.rows.slice().reverse().map(r => (
                <li key={r._id} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{formatBnDate(r.date)}</div>
                    <div className="text-xs text-neutral-500">{formatBnTime(r.markedAt)}</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">{formatBdt(r.dailyRate)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
