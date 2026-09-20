'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  AttendanceReport,
  PayslipData,
  createAdvance,
  deleteAdvance,
  getAttendanceConfig,
  getAttendanceReport,
  getPayslip,
  setAttendanceConfig,
} from '@/lib/attendanceApi';
import { toBn, formatBdt } from '@/lib/bn';
import { ChevronLeft, Save, Users, TrendingUp, Calendar, Wallet, FileText, Printer, X, Trash2 } from 'lucide-react';

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
  const [advOpenId, setAdvOpenId] = useState<string | null>(null);
  const [advAmount, setAdvAmount] = useState('');
  const [advNote, setAdvNote] = useState('');
  const [advSaving, setAdvSaving] = useState(false);
  const [payslip, setPayslip] = useState<PayslipData | null>(null);
  const [payslipLoading, setPayslipLoading] = useState(false);

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

  const openAdvance = (deviceId: string) => {
    setAdvOpenId(deviceId);
    setAdvAmount('');
    setAdvNote('');
  };

  const submitAdvance = async () => {
    if (!advOpenId) return;
    const amt = Number(advAmount);
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('সঠিক অ্যাডভান্স টাকা দিন'); return; }
    setAdvSaving(true);
    try {
      await createAdvance({ deviceId: advOpenId, amount: amt, note: advNote.trim(), month });
      toast.success('অ্যাডভান্স যোগ হয়েছে');
      setAdvOpenId(null);
      await loadReport();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'সেভ হয়নি');
    } finally {
      setAdvSaving(false);
    }
  };

  const openPayslip = async (deviceId: string) => {
    setPayslipLoading(true);
    try {
      const data = await getPayslip(deviceId, month);
      setPayslip(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'পে-স্লিপ লোড হয়নি');
    } finally {
      setPayslipLoading(false);
    }
  };

  const removeAdvance = async (id: string) => {
    if (!confirm('এই অ্যাডভান্সটি মুছে দেবেন?')) return;
    try {
      await deleteAdvance(id);
      toast.success('মুছে ফেলা হয়েছে');
      await loadReport();
      if (payslip) {
        const fresh = await getPayslip(payslip.employee.deviceId, payslip.month);
        setPayslip(fresh);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'মুছে ফেলা যায়নি');
    }
  };

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
            <div className="text-xs text-neutral-500 flex items-center gap-1"><TrendingUp size={12} /> মোট গ্রস</div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{formatBdt(report?.totals.salary || 0)}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1"><Wallet size={12} /> মোট অ্যাডভান্স</div>
            <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{formatBdt(report?.totals.advances || 0)}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1"><TrendingUp size={12} /> মোট প্রদেয় (নেট)</div>
            <div className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">{formatBdt(report?.totals.netSalary || 0)}</div>
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
                <li key={e.deviceId} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                      {(e.label || 'ক').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {e.label}
                        {e.revoked && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">বাতিল</span>}
                      </div>
                      <div className="text-xs text-neutral-500">{toBn(e.days)} দিন হাজিরা · গ্রস {formatBdt(e.totalSalary)}</div>
                      {e.advances > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">অ্যাডভান্স −{formatBdt(e.advances)}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold tabular-nums text-sky-600 dark:text-sky-400">{formatBdt(e.netSalary)}</div>
                      <div className="text-[10px] text-neutral-500">নেট প্রদেয়</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openAdvance(e.deviceId)}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1 active:scale-[0.98]"
                    >
                      <Wallet size={12} /> অ্যাডভান্স যোগ
                    </button>
                    <button
                      onClick={() => openPayslip(e.deviceId)}
                      disabled={payslipLoading}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50"
                    >
                      <FileText size={12} /> পে-স্লিপ
                    </button>
                  </div>
                  {advOpenId === e.deviceId && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center rounded-lg border border-amber-200 dark:border-amber-800 px-2 bg-white dark:bg-neutral-900">
                          <span className="text-neutral-500">৳</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={advAmount}
                            onChange={ev => setAdvAmount(ev.target.value)}
                            placeholder="0"
                            className="w-full py-1.5 px-2 bg-transparent outline-none text-sm font-semibold tabular-nums"
                          />
                        </div>
                        <input
                          type="text"
                          value={advNote}
                          onChange={ev => setAdvNote(ev.target.value)}
                          placeholder="কারণ (ঐচ্ছিক)"
                          className="flex-1 min-w-0 rounded-lg border border-amber-200 dark:border-amber-800 px-2 py-1.5 text-sm bg-white dark:bg-neutral-900 outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAdvOpenId(null)}
                          className="flex-1 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-semibold"
                        >বাতিল</button>
                        <button
                          onClick={submitAdvance}
                          disabled={advSaving}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
                        >{advSaving ? 'সেভ হচ্ছে…' : 'সেভ'}</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="text-xs text-neutral-500 text-center pt-2">
          কর্মচারী তার ডিভাইসে <Link href="/due-book/attendance" className="text-sky-500 underline">/due-book/attendance</Link> খুলে দৈনিক হাজিরা দেবেন।
        </div>
      </main>

      {payslip && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 print:bg-white print:p-0" onClick={() => setPayslip(null)}>
          <div
            className="relative bg-white text-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto print:rounded-none print:shadow-none print:max-h-none print:w-full"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b border-neutral-200 bg-white print:hidden">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText size={14} /> পে-স্লিপ
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                >
                  <Printer size={12} /> প্রিন্ট / PDF
                </button>
                <button onClick={() => setPayslip(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div id="payslip-print" className="p-6 space-y-4 print:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-3">
                  {payslip.shopLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={payslip.shopLogo} alt="" className="w-12 h-12 rounded-lg object-cover border border-neutral-200" />
                  ) : null}
                  <div>
                    <div className="text-lg font-bold">{payslip.shopName || 'DueBook'}</div>
                    <div className="text-xs text-neutral-500">Pay Slip · {monthLabel(payslip.month)}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-neutral-500">
                  <div>Issued: {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] text-neutral-500 uppercase tracking-wide">কর্মচারী</div>
                  <div className="font-semibold">{payslip.employee.label}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500 uppercase tracking-wide">হাজিরা দিন</div>
                  <div className="font-semibold">{toBn(payslip.days)} দিন</div>
                </div>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="text-left py-1">তারিখ</th>
                    <th className="text-right py-1">রেট (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.rows.map(r => (
                    <tr key={r._id} className="border-b border-neutral-100">
                      <td className="py-1">{r.date}</td>
                      <td className="py-1 text-right tabular-nums">{formatBdt(r.dailyRate)}</td>
                    </tr>
                  ))}
                  {payslip.rows.length === 0 && (
                    <tr><td colSpan={2} className="text-center py-3 text-neutral-500">এ মাসে কোনো হাজিরা নেই</td></tr>
                  )}
                </tbody>
              </table>

              {payslip.advances.length > 0 && (
                <div>
                  <div className="text-[11px] text-neutral-500 uppercase tracking-wide mb-1">অ্যাডভান্স</div>
                  <ul className="text-xs space-y-1">
                    {payslip.advances.map(a => (
                      <li key={a._id} className="flex items-center gap-2 border-b border-neutral-100 py-1">
                        <span className="flex-1">
                          {new Date(a.createdAt).toLocaleDateString('en-GB')} · {a.note || '—'}
                        </span>
                        <span className="tabular-nums text-amber-600">−{formatBdt(a.amount)}</span>
                        <button
                          onClick={() => removeAdvance(a._id)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-500 print:hidden"
                          aria-label="Remove advance"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t-2 border-neutral-300 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">গ্রস বেতন</span>
                  <span className="tabular-nums font-semibold">{formatBdt(payslip.totals.gross)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>মোট অ্যাডভান্স</span>
                  <span className="tabular-nums">−{formatBdt(payslip.totals.advances)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-1 border-t border-neutral-300">
                  <span>নেট প্রদেয়</span>
                  <span className="tabular-nums text-sky-700">{formatBdt(payslip.totals.net)}</span>
                </div>
              </div>

              <div className="pt-6 text-[11px] text-neutral-400 flex justify-between border-t border-neutral-100">
                <div>
                  <div className="border-t border-neutral-400 w-32 mt-6"></div>
                  <div className="mt-1">কর্মচারীর স্বাক্ষর</div>
                </div>
                <div>
                  <div className="border-t border-neutral-400 w-32 mt-6"></div>
                  <div className="mt-1 text-right">মালিকের স্বাক্ষর</div>
                </div>
              </div>
            </div>
          </div>
          <style jsx global>{`
            @media print {
              body * { visibility: hidden !important; }
              #payslip-print, #payslip-print * { visibility: visible !important; }
              #payslip-print { position: absolute; top: 0; left: 0; width: 100%; color: #000 !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
