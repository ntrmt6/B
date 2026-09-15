'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  PairCodeResponse, PairedDevice,
  generatePairCode, listPairedDevices, revokePairedDevice,
} from '@/lib/pairApi';
import { toBn, formatBnDate, formatBnTime } from '@/lib/bn';
import { ChevronLeft, Plus, Trash2, Smartphone, RefreshCw, Copy } from 'lucide-react';

const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false });

export default function DevicesPage() {
  const router = useRouter();
  const { user, tenantId, loading } = useAuth();
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<PairCodeResponse | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    else if (!loading && user && user.role === 'employee') router.replace('/due-book');
  }, [loading, user, router]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    setBusy(true);
    try { setDevices(await listPairedDevices(tenantId)); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'লোড করা যায়নি'); }
    finally { setBusy(false); }
  }, [tenantId]);

  useEffect(() => { if (tenantId) refresh(); }, [tenantId, refresh]);

  const generate = async () => {
    if (!tenantId) return;
    setBusy(true);
    try {
      const code = await generatePairCode(tenantId, 'কর্মচারী');
      setActive(code);
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'কোড তৈরি করা যায়নি');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (d: PairedDevice) => {
    if (!tenantId) return;
    if (!confirm(`"${d.label}" ডিভাইসের সংযোগ বাতিল করবেন?`)) return;
    try {
      await revokePairedDevice(tenantId, d._id);
      setDevices(prev => prev.filter(x => x._id !== d._id));
      toast.success('বাতিল হয়েছে');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'বাতিল হয়নি');
    }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে…</div>;

  const pairUrl = active
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/due-book/pair?tid=${encodeURIComponent(active.tenantId)}&code=${encodeURIComponent(active.pairCode)}`
    : '';
  const expiresIn = active ? Math.max(0, Math.floor((new Date(active.expiresAt).getTime() - now) / 1000)) : 0;

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-3 py-3">
          <Link href="/due-book" className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="ফিরে যান">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-bold text-lg">কর্মচারী ডিভাইস</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        {!active ? (
          <button
            onClick={generate}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            <Plus size={18} /> নতুন ডিভাইস যোগ করুন
          </button>
        ) : (
          <div className="rounded-2xl border-2 border-sky-500 bg-sky-50 dark:bg-sky-900/20 p-4 text-center space-y-3">
            <div className="text-sm text-sky-700 dark:text-sky-300">কর্মচারীর ফোনে খুলুন / QR স্ক্যান করুন</div>
            <div className="text-4xl font-bold tabular-nums tracking-widest text-sky-900 dark:text-sky-100">{toBn(active.pairCode)}</div>
            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={pairUrl} size={180} level="M" />
              </div>
            </div>
            <div className="text-xs text-sky-600 dark:text-sky-400 break-all px-2">{pairUrl}</div>
            <div className="text-sm text-sky-700 dark:text-sky-300">
              মেয়াদ শেষ: {toBn(Math.floor(expiresIn / 60))}:{toBn(String(expiresIn % 60).padStart(2, '0'))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(pairUrl).then(() => toast.success('লিংক কপি হয়েছে'));
                }}
                className="flex-1 bg-white dark:bg-neutral-800 border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              ><Copy size={14} /> লিংক কপি</button>
              <button
                onClick={() => setActive(null)}
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 py-2 rounded-lg text-sm font-medium"
              >বন্ধ</button>
            </div>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-neutral-500">যুক্ত ডিভাইস</h2>
            <button onClick={refresh} disabled={busy} className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-40" aria-label="রিফ্রেশ">
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            </button>
          </div>
          {devices.length === 0 && !busy && (
            <div className="text-center py-10 text-neutral-500">
              <Smartphone size={36} className="mx-auto opacity-40 mb-2" />
              <p>এখনো কোনো ডিভাইস যুক্ত নেই।</p>
            </div>
          )}
          <ul className="space-y-2">
            {devices.map(d => {
              const paired = d.pairCodeConsumed;
              const expired = d.pairCodeExpiresAt && new Date(d.pairCodeExpiresAt).getTime() < now;
              return (
                <li key={d._id} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <Smartphone size={20} className={paired ? 'text-emerald-500' : expired ? 'text-neutral-400' : 'text-amber-500'} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{d.label}</div>
                    <div className="text-xs text-neutral-500">
                      {paired
                        ? (d.lastSeenAt ? `শেষ অ্যাকটিভ: ${formatBnDate(d.lastSeenAt)} ${formatBnTime(d.lastSeenAt)}` : 'যুক্ত')
                        : expired ? 'কোডের মেয়াদ শেষ' : `অপেক্ষা করছে · কোড ${d.pairCode ? toBn(d.pairCode) : ''}`}
                    </div>
                  </div>
                  <button
                    onClick={() => revoke(d)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    aria-label="বাতিল"
                  ><Trash2 size={16} /></button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
