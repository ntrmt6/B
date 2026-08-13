'use client';

import { useState, useEffect } from 'react';
import { Gift, CheckCircle2, Store, Loader2, Package } from 'lucide-react';
import { apiUrl } from '@/lib/config';

interface RegInfo {
  shopName: string;
  bonusAmount: number;
  rewardItemName: string;
  rewardItemPrice: number;
  welcomeMessage: string;
}

interface RegResult {
  returning: boolean;
  bonusAmount: number;
  rewardItemName: string;
  rewardItemPrice: number;
  shopName: string;
  entityId: string;
  name: string;
}

const fmtTk = (n: number) => 'Tk ' + Math.abs(n).toLocaleString('en-IN');

export default function RegisterPage() {
  // Tenant comes from the ?t= query param (e.g. /register?t=<tenantId>) so the
  // page works as a static export (no server-rendered dynamic segment).
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [info, setInfo] = useState<RegInfo | null>(null);
  const [infoErr, setInfoErr] = useState('');
  const [infoLoading, setInfoLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [result, setResult] = useState<RegResult | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t');
    if (!t) { setInfoErr('Invalid registration link'); setInfoLoading(false); return; }
    setTenantId(t);
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(apiUrl(`/api/public/register-info?tid=${tenantId}`));
        if (!r.ok) throw new Error((await r.json())?.error || 'Not available');
        const data: RegInfo = await r.json();
        if (!cancelled) setInfo(data);
      } catch (e: any) {
        if (!cancelled) setInfoErr(e?.message || 'Not available');
      } finally {
        if (!cancelled) setInfoLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  const submit = async () => {
    setSubmitErr('');
    if (!name.trim()) return setSubmitErr('Please enter your name');
    if (phone.replace(/\D/g, '').length < 7) return setSubmitErr('Please enter a valid phone');
    setSubmitting(true);
    try {
      const r = await fetch(apiUrl('/api/public/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tid: tenantId, name: name.trim(), phone: phone.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Failed');
      setResult(data);
    } catch (e: any) {
      setSubmitErr(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (infoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }

  if (infoErr || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">Registration unavailable</p>
          <p className="text-sm text-gray-500 mt-1">{infoErr || 'Please contact the shop.'}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-600" size={36} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            {result.returning ? `Welcome back, ${result.name}!` : `You're in, ${result.name}!`}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{result.shopName}</p>

          {result.bonusAmount > 0 && (
            <div className="mt-5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4">
              <div className="flex items-center justify-center gap-2">
                <Gift size={20} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {result.returning ? 'Your credit' : 'Welcome credit'}
                </span>
              </div>
              <p className="mt-1 text-3xl font-black tabular-nums">{fmtTk(result.bonusAmount)}</p>
              <p className="mt-1 text-[11px] opacity-90">
                Show this screen to the shop to redeem
              </p>
            </div>
          )}

          {result.rewardItemName && (
            <div className="mt-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4">
              <div className="flex items-center justify-center gap-2">
                <Package size={20} />
                <span className="text-xs font-semibold uppercase tracking-wide">Free Item</span>
              </div>
              <p className="mt-1 text-2xl font-black">1 × {result.rewardItemName}</p>
              {result.rewardItemPrice > 0 && (
                <p className="text-[11px] opacity-90">
                  Worth {fmtTk(result.rewardItemPrice)} — show this to claim
                </p>
              )}
            </div>
          )}

          <p className="mt-6 text-[12px] text-gray-400">
            {result.returning
              ? 'We already have you on record. Thanks for coming back!'
              : "You'll get updates and offers from the shop."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-5 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center">
            <Store className="text-white" size={28} />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{info.shopName}</h1>
          <p className="text-sm text-gray-500 mt-1">Customer Registration</p>
        </div>

        {info.bonusAmount > 0 && (
          <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Gift size={18} />
              <span className="text-xs font-semibold uppercase tracking-wide">Welcome Credit</span>
            </div>
            <p className="mt-1 text-3xl font-black tabular-nums">{fmtTk(info.bonusAmount)}</p>
            <p className="text-[11px] opacity-90 mt-1">Register now to claim your credit</p>
          </div>
        )}

        {info.rewardItemName && (
          <div className={`${info.bonusAmount > 0 ? 'mt-3' : 'mt-6'} rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 text-center`}>
            <div className="flex items-center justify-center gap-2">
              <Package size={18} />
              <span className="text-xs font-semibold uppercase tracking-wide">Free Item</span>
            </div>
            <p className="mt-1 text-2xl font-black">1 × {info.rewardItemName}</p>
            {info.rewardItemPrice > 0 && (
              <p className="text-[11px] opacity-90 mt-1">Worth {fmtTk(info.rewardItemPrice)}</p>
            )}
          </div>
        )}

        {info.welcomeMessage && (
          <p className="mt-4 text-center text-sm text-gray-600 leading-relaxed">
            {info.welcomeMessage}
          </p>
        )}

        <div className="mt-6 bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahim"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[15px] outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Phone Number
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[15px] outline-none focus:border-sky-500"
            />
          </div>

          {submitErr && (
            <p className="text-[13px] text-red-600">{submitErr}</p>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full mt-1 rounded-lg bg-sky-500 text-white font-semibold py-3 text-[15px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Registering…' : 'Register & Get Bonus'}
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Powered by DueBook
        </p>
      </div>
    </div>
  );
}
