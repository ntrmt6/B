'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { redeemPairCode, applyEmployeeSession } from '@/lib/pairApi';
import { toBn } from '@/lib/bn';
import { CheckCircle2, LogIn, ChevronLeft, Store } from 'lucide-react';

export default function PairPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">লোড হচ্ছে…</div>}>
      <PairForm />
    </Suspense>
  );
}

function PairForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [tenantId, setTenantId] = useState(sp?.get('tid') || '');
  const [code, setCode] = useState(sp?.get('code') || '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = sp?.get('tid');
    const c = sp?.get('code');
    if (t) setTenantId(t);
    if (c) setCode(c);
  }, [sp]);

  const submit = async () => {
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) return toast.error('৬ ডিজিট কোড দিন');
    if (!tenantId.trim()) return toast.error('দোকান আইডি দিন');
    setBusy(true);
    try {
      const resp = await redeemPairCode(cleanCode, tenantId.trim());
      applyEmployeeSession(resp);
      setDone(true);
      toast.success('সংযোগ সফল');
      setTimeout(() => router.replace('/due-book'), 800);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'সংযোগ ব্যর্থ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-sky-950 dark:via-neutral-900 dark:to-emerald-950 flex flex-col">
      <header className="p-3">
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800">
          <ChevronLeft size={16} /> লগইন
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500 flex items-center justify-center">
              <Store size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold mt-3">কর্মচারী সংযোগ</h1>
            <p className="text-sm text-neutral-500 mt-1">মালিকের ফোনে দেখানো ৬-ডিজিট কোড দিন</p>
          </div>

          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
              <p className="mt-2 font-medium text-emerald-700 dark:text-emerald-300">সংযোগ সফল</p>
            </div>
          ) : (
            <>
              <label className="block">
                <div className="text-sm font-medium mb-1">দোকান আইডি</div>
                <input
                  value={tenantId}
                  onChange={e => setTenantId(e.target.value)}
                  placeholder="tenant id"
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">কোড</div>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  className="w-full px-3 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-center text-2xl tabular-nums tracking-widest font-bold"
                />
                {code && (
                  <div className="text-center text-xl tabular-nums tracking-widest text-neutral-500 mt-1">{toBn(code)}</div>
                )}
              </label>
              <button
                onClick={submit}
                disabled={busy || code.length !== 6 || !tenantId.trim()}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {busy ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn size={16} />}
                সংযোগ করুন
              </button>
            </>
          )}
          <div className="text-xs text-center text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-700">
            মালিকের ফোন → মেনু → কর্মচারী ডিভাইস
          </div>
        </div>
      </main>
    </div>
  );
}
