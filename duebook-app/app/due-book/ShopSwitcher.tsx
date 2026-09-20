'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Plus, Check, ChevronDown, Trash2, X } from 'lucide-react';
import api, { KEYS } from '@/lib/api';

interface Shop {
  tenantId: string;
  shopName: string;
  shopLogo: string;
  isPrimary: boolean;
}

interface Props {
  currentTenantId: string;
  currentShopName?: string;
}

export default function ShopSwitcher({ currentTenantId, currentShopName }: Props) {
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/duebook/shops');
      setShops(Array.isArray(r.data?.shops) ? r.data.shops : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const switchTo = (shop: Shop) => {
    if (shop.tenantId === currentTenantId) { setOpen(false); return; }
    try { localStorage.setItem(KEYS.tenantId, shop.tenantId); } catch { /* ignore */ }
    toast.success(`Switched to ${shop.shopName || 'shop'}`);
    setTimeout(() => window.location.reload(), 200);
  };

  const createShop = async () => {
    const name = newName.trim();
    if (!name) { toast.error('Shop name required'); return; }
    setCreating(true);
    try {
      const r = await api.post('/duebook/shops', { shopName: name });
      const created: Shop | undefined = r.data?.shop;
      toast.success(`Created "${name}"`);
      setNewName('');
      setShowNew(false);
      await load();
      if (created?.tenantId) switchTo(created);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not create shop');
    } finally {
      setCreating(false);
    }
  };

  const removeShop = async (shop: Shop) => {
    if (shop.isPrimary) { toast.error('Primary shop cannot be removed'); return; }
    if (!confirm(`Remove "${shop.shopName || shop.tenantId}" from your list? Data is preserved.`)) return;
    try {
      await api.delete(`/duebook/shops/${shop.tenantId}`);
      toast.success('Shop removed from list');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not remove');
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-[11px] font-semibold max-w-[140px]"
        aria-label="Switch shop"
      >
        <Store size={11} />
        <span className="truncate">{currentShopName || 'Shop'}</span>
        <ChevronDown size={11} className="shrink-0" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">My shops</span>
            <button onClick={() => setOpen(false)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-700">
              <X size={12} className="text-gray-400" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-[11px] text-gray-400">Loading…</div>
            ) : shops.length === 0 ? (
              <div className="text-center py-4 text-[11px] text-gray-400">No shops yet</div>
            ) : (
              shops.map(shop => (
                <div key={shop.tenantId} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700">
                  <button
                    onClick={() => switchTo(shop)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {shop.shopLogo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={shop.shopLogo} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 flex items-center justify-center text-[11px] font-bold">
                        {(shop.shopName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-gray-800 dark:text-slate-100 truncate">
                        {shop.shopName || shop.tenantId}
                      </div>
                      {shop.isPrimary && (
                        <div className="text-[9px] text-gray-400 uppercase tracking-wide">Primary</div>
                      )}
                    </div>
                    {shop.tenantId === currentTenantId && <Check size={13} className="text-emerald-500 shrink-0" />}
                  </button>
                  {!shop.isPrimary && (
                    <button
                      onClick={() => removeShop(shop)}
                      className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 shrink-0"
                      aria-label="Remove shop"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-100 dark:border-slate-700 p-2">
            {showNew ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createShop(); if (e.key === 'Escape') setShowNew(false); }}
                  placeholder="New shop name"
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-[12px] outline-none focus:border-sky-400"
                />
                <button
                  onClick={createShop}
                  disabled={creating}
                  className="px-2 rounded-lg bg-sky-500 text-white text-[11px] font-bold disabled:opacity-50"
                >
                  {creating ? '…' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowNew(false); setNewName(''); }}
                  className="px-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 text-[11px] font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNew(true)}
                className="w-full py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1"
              >
                <Plus size={11} /> Add another shop
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
