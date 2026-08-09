'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, X, Trash2 } from 'lucide-react';
import {
  subscribe, list, pendingCount, failedCount,
  drain, retryFailed, discardFailed, type QueueItem,
} from '@/lib/offlineQueue';

interface Props {
  isOnline: boolean;
  onSynced?: () => void;
}

type Toast = { kind: 'success' | 'error'; text: string; };

export default function SyncBar({ isOnline, onSynced }: Props) {
  const [, forceUpdate] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const pending = pendingCount();
  const failed = failedCount();
  const items = list();

  const runDrain = useCallback(async (retry = false) => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = retry ? await retryFailed() : await drain();
      if (res.synced > 0) {
        setToast({ kind: 'success', text: `Synced ${res.synced} change${res.synced === 1 ? '' : 's'}` });
        onSynced?.();
      }
      if (res.failedItems.length > 0) {
        setToast({ kind: 'error', text: `${res.failedItems.length} failed — tap to view` });
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing, onSynced]);

  // Auto-drain when we come online (or on mount if online with pending items)
  useEffect(() => {
    if (isOnline && pending > 0 && !syncing) {
      void runDrain(false);
    }
  }, [isOnline, pending, syncing, runDrain]);

  const nothing = pending === 0 && failed === 0 && !toast && isOnline;
  if (nothing) return null;

  let barBg = 'bg-slate-700 dark:bg-slate-800';
  let icon = <Cloud size={13} />;
  let text = '';
  if (!isOnline) {
    barBg = 'bg-amber-500';
    icon = <CloudOff size={13} />;
    text = pending > 0 ? `Offline • ${pending} change${pending === 1 ? '' : 's'} queued` : 'Offline — showing cached data';
  } else if (syncing) {
    barBg = 'bg-sky-500';
    icon = <RefreshCw size={13} className="animate-spin" />;
    text = 'Syncing…';
  } else if (failed > 0) {
    barBg = 'bg-red-500';
    icon = <AlertTriangle size={13} />;
    text = `${failed} failed to sync — tap to view`;
  } else if (pending > 0) {
    barBg = 'bg-sky-500';
    icon = <Cloud size={13} />;
    text = `${pending} pending — tap to sync`;
  } else if (toast) {
    barBg = toast.kind === 'success' ? 'bg-green-600' : 'bg-red-500';
    icon = toast.kind === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />;
    text = toast.text;
  }

  const canTap = !syncing && (failed > 0 || pending > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isOnline) { setShowDetail(true); return; }
          if (failed > 0 || pending > 0) setShowDetail(true);
        }}
        className={`flex-shrink-0 w-full ${barBg} text-white text-[11px] font-semibold py-1 px-3 flex items-center justify-center gap-1.5 tracking-wide ${canTap || !isOnline ? 'active:opacity-80' : ''}`}
        aria-label="Sync status"
      >
        {icon}
        <span>{text}</span>
      </button>

      {showDetail && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={() => setShowDetail(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[80dvh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                {isOnline ? <Cloud size={15} className="text-sky-500" /> : <CloudOff size={15} className="text-amber-500" />}
                Sync
              </h3>
              <button onClick={() => setShowDetail(false)} className="w-6 h-6 flex items-center justify-center">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className="text-[11px] text-gray-500 dark:text-slate-400">
                {isOnline
                  ? 'Online. Pending changes will sync automatically.'
                  : 'You are offline. Changes will sync when you reconnect.'}
              </div>
              {(pending > 0 || failed > 0) && isOnline && (
                <div className="flex gap-2 mt-2">
                  {pending > 0 && (
                    <button
                      onClick={() => runDrain(false)}
                      disabled={syncing}
                      className="flex-1 py-2 rounded-lg bg-sky-500 text-white text-[12px] font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {syncing ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} />}
                      Sync {pending}
                    </button>
                  )}
                  {failed > 0 && (
                    <button
                      onClick={() => runDrain(true)}
                      disabled={syncing}
                      className="flex-1 py-2 rounded-lg border-2 border-sky-400 text-sky-500 text-[12px] font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      Retry failed
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-5 space-y-1.5 mt-2">
              {items.length === 0 && (
                <p className="text-center text-[12px] text-gray-400 dark:text-slate-500 py-6">
                  No pending changes.
                </p>
              )}
              {items.map((it: QueueItem) => (
                <div
                  key={it.id}
                  className={`rounded-xl px-3 py-2 border ${
                    it.status === 'failed'
                      ? 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 dark:text-slate-100 truncate">{it.label}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                        {new Date(it.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {it.attempts > 0 && ` • ${it.attempts} attempt${it.attempts === 1 ? '' : 's'}`}
                      </p>
                      {it.status === 'failed' && it.lastError && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 break-words">
                          <AlertTriangle size={10} className="inline -mt-0.5 mr-0.5" />
                          {it.lastError}
                        </p>
                      )}
                    </div>
                    {it.status === 'failed' && (
                      <button
                        onClick={() => discardFailed(it.id)}
                        title="Discard"
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 active:bg-red-100 dark:active:bg-red-900/40"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
