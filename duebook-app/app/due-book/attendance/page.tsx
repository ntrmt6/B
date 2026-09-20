'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  AttendanceMe,
  AttendancePolicy,
  getAttendancePolicy,
  getMyAttendance,
  markAttendance,
} from '@/lib/attendanceApi';
import { toBn, formatBdt, formatBnDate, formatBnTime } from '@/lib/bn';
import { ChevronLeft, CheckCircle2, Calendar, Clock, TrendingUp, Camera, MapPin, X, RefreshCw } from 'lucide-react';

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
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsError, setGpsError] = useState<string>('');
  const [gpsBusy, setGpsBusy] = useState(false);
  const [selfieData, setSelfieData] = useState<string>('');
  const [camError, setCamError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  useEffect(() => {
    if (!tenantId) return;
    getAttendancePolicy().then(setPolicy).catch(() => {/* ignore */});
  }, [tenantId]);

  const captureGps = useCallback((): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return reject(new Error('GPS not supported on this device'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error(err.message || 'Could not read location')),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 },
      );
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 320 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { /* ignore */ });
      }
      setCamError('');
    } catch (e: any) {
      setCamError(e?.message || 'Camera unavailable');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const openCapture = async () => {
    setCaptureOpen(true);
    setSelfieData('');
    setGpsError('');
    setGpsCoords(null);
    if (policy?.requireGeofence) {
      setGpsBusy(true);
      try {
        const c = await captureGps();
        setGpsCoords(c);
      } catch (e: any) {
        setGpsError(e?.message || 'GPS failed');
      } finally {
        setGpsBusy(false);
      }
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      captureGps().then(setGpsCoords).catch(() => {/* silent when optional */});
    }
    if (policy?.requireSelfie) {
      await startCamera();
    }
  };

  const closeCapture = () => {
    stopCamera();
    setCaptureOpen(false);
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const snapSelfie = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { toast.error('ক্যামেরা প্রস্তুত নয়'); return; }
    const size = 240;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - s) / 2;
    const sy = (v.videoHeight - s) / 2;
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, sx, sy, s, s, 0, 0, size, size);
    const url = canvas.toDataURL('image/jpeg', 0.55);
    setSelfieData(url);
    stopCamera();
  };

  const doSubmit = async () => {
    setMarking(true);
    try {
      const payload: { latitude?: number | null; longitude?: number | null; selfie?: string } = {};
      if (gpsCoords) {
        payload.latitude = gpsCoords.latitude;
        payload.longitude = gpsCoords.longitude;
      }
      if (selfieData) payload.selfie = selfieData;
      const r = await markAttendance(payload);
      if (r.alreadyMarked) toast('আজকের হাজিরা আগেই দেওয়া হয়েছে', { icon: 'ℹ️' });
      else toast.success('আজকের হাজিরা দেওয়া হয়েছে');
      closeCapture();
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'হাজিরা দেওয়া যায়নি');
    } finally {
      setMarking(false);
    }
  };

  const onMark = async () => {
    if (policy?.requireGeofence || policy?.requireSelfie) {
      await openCapture();
      return;
    }
    setMarking(true);
    try {
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        coords = await captureGps();
      } catch {/* GPS optional */}
      const r = await markAttendance(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {});
      if (r.alreadyMarked) toast('আজকের হাজিরা আগেই দেওয়া হয়েছে', { icon: 'ℹ️' });
      else toast.success('আজকের হাজিরা দেওয়া হয়েছে');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'হাজিরা দেওয়া যায়নি');
    } finally {
      setMarking(false);
    }
  };

  const canSubmitCapture =
    (!policy?.requireSelfie || !!selfieData) &&
    (!policy?.requireGeofence || !!gpsCoords);

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

        {policy && (policy.requireGeofence || policy.requireSelfie) && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-800 dark:text-amber-300">
            <div className="font-semibold mb-0.5">হাজিরা নিয়ম:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {policy.requireGeofence && <li>দোকান থেকে {toBn(policy.radiusMeters)} মিটারের মধ্যে থেকে হাজিরা দিতে হবে</li>}
              {policy.requireSelfie && <li>সেলফি তুলে হাজিরা নিশ্চিত করতে হবে</li>}
            </ul>
          </div>
        )}

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

      {captureOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4" onClick={closeCapture}>
          <div
            className="bg-white dark:bg-neutral-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4 space-y-3 max-h-[92vh] overflow-y-auto"
            onClick={ev => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">হাজিরা নিশ্চিত করুন</h2>
              <button onClick={closeCapture} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X size={18} />
              </button>
            </div>

            {policy?.requireGeofence && (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin size={14} className="text-sky-500" /> অবস্থান যাচাই
                </div>
                {gpsBusy ? (
                  <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    GPS পাচ্ছি…
                  </div>
                ) : gpsCoords ? (
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ লোকেশন পাওয়া গেছে ({gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)})
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-red-500">
                    {gpsError || 'GPS অ্যাকসেস দিন'}
                    <button
                      onClick={async () => {
                        setGpsBusy(true); setGpsError('');
                        try { setGpsCoords(await captureGps()); }
                        catch (e: any) { setGpsError(e?.message || 'GPS failed'); }
                        finally { setGpsBusy(false); }
                      }}
                      className="ml-2 inline-flex items-center gap-1 text-sky-500 underline"
                    >
                      <RefreshCw size={11} /> আবার চেষ্টা
                    </button>
                  </div>
                )}
              </div>
            )}

            {policy?.requireSelfie && (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Camera size={14} className="text-fuchsia-500" /> সেলফি
                </div>
                {selfieData ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selfieData} alt="Selfie" className="w-full aspect-square object-cover rounded-lg border border-neutral-200 dark:border-neutral-700" />
                    <button
                      onClick={() => { setSelfieData(''); startCamera(); }}
                      className="w-full py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <RefreshCw size={11} /> আবার তুলুন
                    </button>
                  </div>
                ) : camError ? (
                  <div className="text-xs text-red-500">
                    {camError}
                    <button onClick={startCamera} className="ml-2 inline-flex items-center gap-1 text-sky-500 underline">
                      <RefreshCw size={11} /> আবার
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full aspect-square object-cover rounded-lg bg-black scale-x-[-1]"
                    />
                    <button
                      onClick={snapSelfie}
                      className="w-full py-2 rounded-lg bg-fuchsia-500 text-white text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Camera size={14} /> সেলফি তুলুন
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={doSubmit}
              disabled={marking || !canSubmitCapture}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {marking ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
              হাজিরা সাবমিট
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
