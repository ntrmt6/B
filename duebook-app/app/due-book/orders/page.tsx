'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  ChevronLeft, Plus, Minus, Check, X, ShoppingCart, Trash2, Pencil,
  Clock, ChefHat, CheckCircle2, XCircle, User, Wallet, Smartphone, Package,
  BarChart3, Coffee, CalendarCheck,
} from 'lucide-react';
import { listMenuItems, MenuItemDoc } from '@/lib/menuApi';
import {
  listOrders, createOrderResilient, editOrder, updateOrderStatus,
  drainOfflineOrders, offlineOrderCount, getDailySummary, DailySummary,
  OrderDoc, OrderItem, OrderPayment, OrderStatus, CreateOrderPayload,
} from '@/lib/ordersApi';
import { getEntitiesOffline } from '@/lib/offlineApi';
import { joinTenant, getSocket, leaveTenant } from '@/lib/socket';
import { toBn, formatBdt, formatBnTime } from '@/lib/bn';

interface Entity { _id: string; name: string; phone?: string; type: 'Customer' | 'Supplier' | 'Employee'; }

export default function OrdersPage() {
  const router = useRouter();
  const { user, tenantId, loading } = useAuth();
  const [role, setRole] = useState<'owner' | 'employee'>('owner');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('duebook_role');
    if (stored === 'employee' || (user && user.role === 'employee')) setRole('employee');
    else setRole('owner');
  }, [user]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে…</div>;
  if (!tenantId) return <div className="min-h-screen flex items-center justify-center">দোকান আইডি নেই</div>;

  return role === 'employee'
    ? <KitchenScreen tenantId={tenantId} />
    : <OwnerScreen tenantId={tenantId} />;
}

/* ─────────────── OWNER: create + track orders ─────────────── */

function OwnerScreen({ tenantId }: { tenantId: string }) {
  const [menu, setMenu] = useState<MenuItemDoc[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<OrderPayment>('nagad');
  const [customerName, setCustomerName] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [today, setToday] = useState<OrderDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refreshMenu = useCallback(async () => {
    const { items } = await listMenuItems(tenantId);
    setMenu(items.filter(i => i.available));
  }, [tenantId]);

  const refreshOrders = useCallback(async () => {
    try { setToday(await listOrders(tenantId)); }
    catch { /* offline is fine */ }
  }, [tenantId]);

  useEffect(() => { refreshMenu(); }, [refreshMenu]);

  useEffect(() => {
    getEntitiesOffline(tenantId).then(r => setEntities(r.data.filter((e: any) => e.type === 'Customer')));
  }, [tenantId]);

  // Socket live sync — fetch AFTER the tenant room is joined so we can't miss
  // an order broadcast that lands in the gap between initial fetch and join.
  useEffect(() => {
    let cancelled = false;
    let firstConnect = true;
    const s = getSocket();
    const onNew = (o: OrderDoc) => setToday(prev => prev.some(x => x._id === o._id) ? prev : [...prev, o]);
    const onUpd = (o: OrderDoc) => setToday(prev => prev.map(x => x._id === o._id ? o : x));
    s.on('order:new', onNew);
    s.on('order:updated', onUpd);
    s.on('order:status', onUpd);
    joinTenant(tenantId).then(() => { if (!cancelled) refreshOrders(); });
    const onConnect = () => {
      if (firstConnect) { firstConnect = false; return; }
      joinTenant(tenantId).then(() => { if (!cancelled) refreshOrders(); });
    };
    s.on('connect', onConnect);
    return () => {
      cancelled = true;
      s.off('order:new', onNew);
      s.off('order:updated', onUpd);
      s.off('order:status', onUpd);
      s.off('connect', onConnect);
      leaveTenant();
    };
  }, [tenantId, refreshOrders]);

  // Offline drain
  useEffect(() => {
    setOfflineCount(offlineOrderCount());
    const flush = () => drainOfflineOrders().then(r => {
      setOfflineCount(offlineOrderCount());
      if (r.synced > 0) { toast.success(`${toBn(r.synced)}টি অর্ডার সিঙ্ক হয়েছে`); refreshOrders(); }
    });
    window.addEventListener('online', flush);
    flush();
    return () => window.removeEventListener('online', flush);
  }, [refreshOrders]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemDoc[]>();
    for (const it of menu) {
      const arr = map.get(it.category) || [];
      arr.push(it);
      map.set(it.category, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return Array.from(map.entries());
  }, [menu]);

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const totalCups = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const cartQtyByItemId = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of cart) {
      if (!l.menuItemId) continue;
      m.set(l.menuItemId, (m.get(l.menuItemId) || 0) + l.qty);
    }
    return m;
  }, [cart]);

  const addToCart = (item: MenuItemDoc) => {
    setCart(prev => {
      const idx = prev.findIndex(l => l.menuItemId === item._id && !l.note);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { menuItemId: item._id, name: item.nameBn, price: item.price, qty: 1 }];
    });
  };

  const changeQty = (idx: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const l = { ...next[idx], qty: next[idx].qty + delta };
      if (l.qty <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = l;
      return next;
    });
  };

  const setLineNote = (idx: number, note: string) => {
    setCart(prev => prev.map((l, i) => i === idx ? { ...l, note } : l));
  };

  const resetOrder = () => {
    setCart([]); setPayment('nagad'); setCustomerName(''); setSelectedEntityId(''); setOrderNote('');
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    if (payment === 'baki' && !selectedEntityId) {
      toast.error('বাকি পেমেন্টের জন্য কাস্টমার সিলেক্ট করুন');
      return;
    }
    const payload: CreateOrderPayload = {
      items: cart.map<OrderItem>(l => ({
        menuItemId: l.menuItemId,
        nameBn: l.name,
        priceAt: l.price,
        qty: l.qty,
        note: l.note?.trim() || undefined,
      })),
      customerName: customerName.trim() || undefined,
      entityId: payment === 'baki' ? selectedEntityId : undefined,
      note: orderNote.trim() || undefined,
      paymentMethod: payment,
    };
    setBusy(true);
    try {
      const res = await createOrderResilient(tenantId, payload);
      if (res.queued) {
        setOfflineCount(offlineOrderCount());
        toast.success('ইন্টারনেট নেই — সেভ হয়েছে, পরে সিঙ্ক হবে');
      } else if (res.order) {
        setToday(prev => prev.some(x => x._id === res.order!._id) ? prev : [...prev, res.order!]);
        toast.success(`অর্ডার #${res.order.code} পাঠানো হয়েছে`);
      }
      setShowCart(false);
      resetOrder();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'অর্ডার ব্যর্থ');
    } finally { setBusy(false); }
  };

  const cancelOrder = async (o: OrderDoc) => {
    if (!confirm(`অর্ডার #${o.code} বাতিল করবেন?`)) return;
    try {
      const doc = await updateOrderStatus(tenantId, o._id, 'cancelled');
      setToday(prev => prev.map(x => x._id === doc._id ? doc : x));
      toast.success('বাতিল হয়েছে');
    } catch (e: any) { toast.error(e?.response?.data?.error || 'বাতিল হয়নি'); }
  };

  const startEdit = (o: OrderDoc) => {
    if (o.status !== 'new') { toast.error('বানানো শুরু হয়ে গেছে — এডিট করা যাবে না'); return; }
    setCart(o.items.map(i => ({
      menuItemId: i.menuItemId,
      name: i.nameBn,
      price: i.priceAt,
      qty: i.qty,
      note: i.note,
    })));
    setPayment(o.paymentMethod);
    setSelectedEntityId(o.entityId || '');
    setCustomerName(o.customerName || '');
    setOrderNote(o.note || '');
    setEditingId(o._id);
    setShowCart(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setBusy(true);
    try {
      const doc = await editOrder(tenantId, editingId, {
        items: cart.map(l => ({ menuItemId: l.menuItemId, nameBn: l.name, priceAt: l.price, qty: l.qty, note: l.note })),
        customerName: customerName.trim() || undefined,
        note: orderNote.trim() || undefined,
      });
      setToday(prev => prev.map(x => x._id === doc._id ? doc : x));
      toast.success('আপডেট হয়েছে');
      setEditingId(null);
      setShowCart(false);
      resetOrder();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'সেভ হয়নি');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white pb-24">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-3 py-3">
          <Link href="/due-book" className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="ফিরে যান">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-bold text-lg">অর্ডার</h1>
          {offlineCount > 0 && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {toBn(offlineCount)}টি সিঙ্ক অপেক্ষমাণ
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-3 space-y-3">
        <DailySummaryCard tenantId={tenantId} today={today} />
        {editingId && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-2 text-sm flex items-center gap-2">
            <Pencil size={14} /> অর্ডার এডিট মোড
            <button onClick={() => { setEditingId(null); resetOrder(); }} className="ml-auto underline">বাতিল</button>
          </div>
        )}

        {menu.length === 0 ? (
          <div className="text-center py-10 text-neutral-500">
            <Package size={40} className="mx-auto opacity-40 mb-2" />
            <p>মেনুতে চালু আইটেম নেই।</p>
            <Link href="/due-book/menu" className="inline-block mt-2 text-sky-500 underline">মেনু বিল্ডারে যান</Link>
          </div>
        ) : (
          <section className="space-y-3">
            {grouped.map(([cat, list]) => (
              <div key={cat}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">{cat}</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {list.map(it => {
                    const qty = cartQtyByItemId.get(it._id) || 0;
                    const inCart = qty > 0;
                    return (
                      <button
                        key={it._id}
                        onClick={() => addToCart(it)}
                        className={`relative flex flex-col items-start gap-0.5 p-2 rounded-lg border-2 active:scale-95 transition text-left min-h-[54px] ${
                          inCart
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-sky-400'
                        }`}
                      >
                        <div className="text-sm font-semibold leading-tight line-clamp-2">{it.nameBn}</div>
                        <div className="text-[11px] text-neutral-500 tabular-nums">{formatBdt(it.price)}</div>
                        {inCart && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums shadow">
                            {toBn(qty)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Today's live orders */}
        {today.length > 0 && (
          <section>
            <div className="text-sm font-semibold text-neutral-500 mb-2">আজকের অর্ডার</div>
            <ul className="space-y-2">
              {today.slice().reverse().map(o => (
                <OrderCard key={o._id} o={o} role="owner"
                  onEdit={o.status === 'new' ? () => startEdit(o) : undefined}
                  onCancel={o.status === 'new' || o.status === 'making' ? () => cancelOrder(o) : undefined}
                />
              ))}
            </ul>
          </section>
        )}
      </main>

      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800"
        >
          <div className="max-w-3xl mx-auto p-2.5 flex items-center gap-3">
            <div className="flex-1 text-left">
              <div className="text-[11px] text-neutral-500 leading-tight">{toBn(totalCups)} কাপ · {toBn(cart.length)} আইটেম</div>
              <div className="text-xl font-bold leading-tight">{formatBdt(total)}</div>
            </div>
            <div className={`${editingId ? 'bg-emerald-500' : 'bg-sky-500'} text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 text-base`}>
              <ShoppingCart size={16} /> {editingId ? 'সেভ' : 'পাঠান'}
            </div>
          </div>
        </button>
      )}

      {showCart && (
        <CartModal
          cart={cart}
          entities={entities}
          payment={payment}
          setPayment={setPayment}
          customerName={customerName}
          setCustomerName={setCustomerName}
          selectedEntityId={selectedEntityId}
          setSelectedEntityId={setSelectedEntityId}
          orderNote={orderNote}
          setOrderNote={setOrderNote}
          changeQty={changeQty}
          setLineNote={setLineNote}
          total={total}
          totalCups={totalCups}
          isEditing={!!editingId}
          onClose={() => setShowCart(false)}
          onSubmit={editingId ? saveEdit : submitOrder}
          busy={busy}
        />
      )}
    </div>
  );
}

interface CartLine { menuItemId?: string; name: string; price: number; qty: number; note?: string; }

function DailySummaryCard({ tenantId, today }: { tenantId: string; today: OrderDoc[] }) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const s = await getDailySummary(tenantId);
        if (!cancelled) setSummary(s);
      } catch { /* offline: skip */ }
    };
    fetch();
    return () => { cancelled = true; };
    // Re-fetch whenever the order list changes locally (create / edit / status)
  }, [tenantId, today.length, today.map(o => `${o._id}:${o.status}:${o.total}`).join('|')]);

  if (!summary) return null;
  const anyOrders = summary.orderCount > 0 || summary.cancelled > 0;
  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-900/20 dark:to-sky-900/20 text-left"
      >
        <BarChart3 size={18} className="text-emerald-600 dark:text-emerald-400" />
        <div className="flex-1">
          <div className="text-sm font-semibold">আজকের সারাংশ</div>
          <div className="text-xs text-neutral-500">{toBn(summary.orderCount)} অর্ডার · {formatBdt(summary.totals.all)}</div>
        </div>
        <span className="text-xs text-neutral-500">{open ? 'বন্ধ' : 'বিস্তারিত'}</span>
      </button>
      {open && anyOrders && (
        <div className="p-3 space-y-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <SummaryTile icon={<Wallet size={14} />} label="নগদ" value={formatBdt(summary.totals.cash)} tone="emerald" />
            <SummaryTile icon={<Smartphone size={14} />} label="বিকাশ / নগদ" value={formatBdt(summary.totals.digital)} tone="sky" />
            <SummaryTile icon={<User size={14} />} label="বাকি" value={formatBdt(summary.totals.baki)} tone="amber" />
          </div>
          {Object.keys(summary.perItem).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1 flex items-center gap-1"><Coffee size={12} /> কাপ হিসাব</div>
              <ul className="text-sm space-y-0.5">
                {Object.entries(summary.perItem)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, cups]) => (
                    <li key={name} className="flex items-baseline gap-2">
                      <span className="flex-1">{name}</span>
                      <span className="text-xs tabular-nums text-neutral-500">{toBn(cups)} কাপ</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {summary.cancelled > 0 && (
            <div className="text-xs text-neutral-500">বাতিল: {toBn(summary.cancelled)}</div>
          )}
        </div>
      )}
      {open && !anyOrders && (
        <div className="p-4 text-center text-sm text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
          আজ কোনো অর্ডার নেই।
        </div>
      )}
    </section>
  );
}

function SummaryTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'emerald' | 'sky' | 'amber' }) {
  const cls = tone === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200'
    : tone === 'sky' ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-900 dark:text-sky-200'
    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200';
  return (
    <div className={`rounded-lg p-2 ${cls}`}>
      <div className="text-[10px] flex items-center justify-center gap-0.5 opacity-80">{icon} {label}</div>
      <div className="text-sm font-bold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function PayBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-sm ${
        active
          ? 'border-sky-500 bg-sky-500 text-white'
          : 'border-neutral-200 dark:border-neutral-700'
      }`}
    >{icon} {label}</button>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}

function CartModal({
  cart, entities, payment, setPayment,
  customerName, setCustomerName,
  selectedEntityId, setSelectedEntityId,
  orderNote, setOrderNote,
  changeQty, setLineNote,
  total, totalCups, isEditing,
  onClose, onSubmit, busy,
}: {
  cart: CartLine[];
  entities: Entity[];
  payment: OrderPayment;
  setPayment: (p: OrderPayment) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  selectedEntityId: string;
  setSelectedEntityId: (v: string) => void;
  orderNote: string;
  setOrderNote: (v: string) => void;
  changeQty: (idx: number, delta: number) => void;
  setLineNote: (idx: number, note: string) => void;
  total: number;
  totalCups: number;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const payLabel = payment === 'nagad' ? 'নগদ' : payment === 'bkash' ? 'বিকাশ / নগদ' : 'বাকি';
  const canSubmit = cart.length > 0 && !(payment === 'baki' && !selectedEntityId);
  const [showNoteIdx, setShowNoteIdx] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <h2 className="text-lg font-bold flex-1">{isEditing ? 'অর্ডার এডিট' : 'কার্ট'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="বন্ধ"><X size={20} /></button>
        </div>
        <div className="p-3 space-y-3 overflow-y-auto flex-1">
          <ul className="space-y-1.5">
            {cart.map((l, i) => (
              <li key={i} className="rounded-lg border border-neutral-100 dark:border-neutral-800 p-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{l.name}</div>
                    <div className="text-[11px] text-neutral-500 tabular-nums">{formatBdt(l.price)} × {toBn(l.qty)} = {formatBdt(l.price * l.qty)}</div>
                  </div>
                  <button onClick={() => changeQty(i, -1)} className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"><Minus size={16} /></button>
                  <div className="w-6 text-center text-lg font-bold tabular-nums">{toBn(l.qty)}</div>
                  <button onClick={() => changeQty(i, 1)} className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center"><Plus size={16} /></button>
                </div>
                {showNoteIdx === i || l.note ? (
                  <input
                    autoFocus={showNoteIdx === i}
                    value={l.note || ''}
                    onChange={e => setLineNote(i, e.target.value)}
                    onBlur={() => setShowNoteIdx(null)}
                    placeholder="নোট (কম চিনি, কড়া…)"
                    className="mt-1.5 w-full text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-transparent"
                  />
                ) : (
                  <button onClick={() => setShowNoteIdx(i)} className="mt-1 text-[11px] text-sky-500 hover:underline">+ নোট যোগ করুন</button>
                )}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 gap-2">
            <PayBtn active={payment === 'nagad'} onClick={() => setPayment('nagad')} icon={<Wallet size={14} />} label="নগদ" />
            <PayBtn active={payment === 'bkash'} onClick={() => setPayment('bkash')} icon={<Smartphone size={14} />} label="বিকাশ" />
            <PayBtn active={payment === 'baki'} onClick={() => setPayment('baki')} icon={<User size={14} />} label="বাকি" />
          </div>

          {payment === 'baki' && (
            <select
              value={selectedEntityId}
              onChange={e => setSelectedEntityId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
            >
              <option value="">— বাকি খাতার কাস্টমার বাছাই —</option>
              {entities.map(e => (
                <option key={e._id} value={e._id}>{e.name} {e.phone ? `(${e.phone})` : ''}</option>
              ))}
            </select>
          )}

          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="কাস্টমারের নাম (ঐচ্ছিক)"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
          />

          <input
            value={orderNote}
            onChange={e => setOrderNote(e.target.value)}
            placeholder="বিশেষ নির্দেশনা (টেবিল, দ্রুত…)"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
          />
        </div>
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-neutral-500">{toBn(totalCups)} কাপ · {payLabel}</span>
            <span className="text-2xl font-bold">{formatBdt(total)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-medium">আরও যোগ</button>
            <button
              onClick={onSubmit}
              disabled={busy || !canSubmit}
              className={`flex-1 py-3 rounded-lg ${isEditing ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-sky-500 hover:bg-sky-600'} disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2`}
            >
              {busy ? <Spinner /> : <Check size={18} />} {isEditing ? 'সেভ' : 'পাঠান'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── EMPLOYEE: kitchen live view ─────────────── */

function KitchenScreen({ tenantId }: { tenantId: string }) {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [flash, setFlash] = useState<{ id: string; kind: 'updated' | 'cancelled' } | null>(null);
  const wakeLockRef = useRef<any>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try { setOrders(await listOrders(tenantId)); }
    catch { /* offline is fine */ }
  }, [tenantId]);

  useEffect(() => {
    let cancelled = false;
    let firstConnect = true;
    const s = getSocket();
    const onNew = (o: OrderDoc) => {
      setOrders(prev => {
        if (prev.some(x => x._id === o._id)) return prev;
        // Signal only for genuinely new server-issued orders
        setTimeout(() => alertNewOrder(), 0);
        return [...prev, o];
      });
    };
    const onUpd = (o: OrderDoc) => {
      setOrders(prev => prev.map(x => x._id === o._id ? o : x));
      setFlash({ id: o._id, kind: o.status === 'cancelled' ? 'cancelled' : 'updated' });
      try { navigator.vibrate?.(120); } catch {}
      setTimeout(() => setFlash(null), 2500);
    };
    s.on('order:new', onNew);
    s.on('order:updated', onUpd);
    s.on('order:status', onUpd);
    // Fetch AFTER join so orders placed in the join-ack gap are picked up.
    joinTenant(tenantId).then(() => { if (!cancelled) refresh(); });
    const onConnect = () => {
      if (firstConnect) { firstConnect = false; return; }
      joinTenant(tenantId).then(() => { if (!cancelled) refresh(); });
    };
    s.on('connect', onConnect);
    return () => {
      cancelled = true;
      s.off('order:new', onNew);
      s.off('order:updated', onUpd);
      s.off('order:status', onUpd);
      s.off('connect', onConnect);
      leaveTenant();
    };
  }, [tenantId, refresh]);

  // Prime audio + wake lock on first user interaction so alarms actually ring
  useEffect(() => {
    const unlock = () => {
      const ctx = getAudioCtx();
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    unlock();
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Wake lock
  useEffect(() => {
    (async () => {
      try {
        const nav: any = navigator;
        if (nav?.wakeLock?.request) {
          wakeLockRef.current = await nav.wakeLock.request('screen');
        }
      } catch { /* not supported / user gesture missing */ }
    })();
    const onVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const nav: any = navigator;
          if (nav?.wakeLock?.request) wakeLockRef.current = await nav.wakeLock.request('screen');
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockRef.current?.release?.().catch(() => {});
    };
  }, []);

  const active = orders.filter(o => o.status === 'new' || o.status === 'making').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const done = orders.filter(o => o.status === 'ready' || o.status === 'cancelled').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const advance = async (o: OrderDoc) => {
    const next = o.status === 'new' ? 'making' : o.status === 'making' ? 'ready' : null;
    if (!next) return;
    try {
      const doc = await updateOrderStatus(tenantId, o._id, next);
      setOrders(prev => prev.map(x => x._id === doc._id ? doc : x));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'আপডেট হয়নি');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <header className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-4xl mx-auto flex items-center gap-2 px-3 py-3">
          <ChefHat size={22} className="text-orange-400" />
          <h1 className="font-bold text-lg">রান্নাঘর</h1>
          <Link
            href="/due-book/attendance"
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
          >
            <CalendarCheck size={16} /> হাজিরা
          </Link>
          <span className="text-sm text-neutral-400">{toBn(active.length)} সক্রিয়</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-3 space-y-3">
        {active.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            <ChefHat size={48} className="mx-auto opacity-30 mb-2" />
            <p className="text-lg">নতুন অর্ডারের অপেক্ষায়…</p>
          </div>
        )}
        {active.map(o => (
          <OrderCard
            key={o._id}
            o={o}
            role="employee"
            flashKind={flash?.id === o._id ? flash.kind : undefined}
            onAdvance={() => advance(o)}
          />
        ))}
        {done.length > 0 && (
          <details className="pt-2">
            <summary className="text-sm text-neutral-400 py-2 cursor-pointer">সম্পন্ন / বাতিল ({toBn(done.length)})</summary>
            <ul className="space-y-2 mt-2 opacity-70">
              {done.slice(0, 20).map(o => (
                <OrderCard key={o._id} o={o} role="employee" flashKind={flash?.id === o._id ? flash.kind : undefined} />
              ))}
            </ul>
          </details>
        )}
      </main>
    </div>
  );
}

let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext);
      if (!Ctor) return null;
      sharedAudioCtx = new Ctor();
    }
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
    return sharedAudioCtx;
  } catch { return null; }
}

function alertNewOrder() {
  try { navigator.vibrate?.([250, 120, 250, 120, 400]); } catch {}
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Three-chime alarm: two rising bell tones repeated, ~1.4s total, louder than before.
    const pattern = [
      { f: 988, t: 0.00 }, // B5
      { f: 1319, t: 0.22 }, // E6
      { f: 988, t: 0.55 },
      { f: 1319, t: 0.77 },
      { f: 1568, t: 1.10 }, // G6 finale
    ];
    const start = ctx.currentTime + 0.02;
    for (const p of pattern) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(p.f, start + p.t);
      gain.gain.setValueAtTime(0.0001, start + p.t);
      gain.gain.exponentialRampToValueAtTime(0.7, start + p.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + p.t + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + p.t);
      osc.stop(start + p.t + 0.32);
    }
  } catch {}
}

/* ─────────────── Shared order card ─────────────── */

function OrderCard({ o, role, onAdvance, onEdit, onCancel, flashKind }: {
  o: OrderDoc;
  role: 'owner' | 'employee';
  onAdvance?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  flashKind?: 'updated' | 'cancelled';
}) {
  const isEmployee = role === 'employee';
  const statusBadge = (() => {
    switch (o.status) {
      case 'new': return { label: 'নতুন', cls: 'bg-amber-500 text-white', icon: <Clock size={14} /> };
      case 'making': return { label: 'বানানো হচ্ছে', cls: 'bg-sky-500 text-white', icon: <ChefHat size={14} /> };
      case 'ready': return { label: 'তৈরি', cls: 'bg-emerald-500 text-white', icon: <CheckCircle2 size={14} /> };
      case 'cancelled': return { label: 'বাতিল', cls: 'bg-neutral-500 text-white', icon: <XCircle size={14} /> };
    }
  })();
  const payLabel = o.paymentMethod === 'nagad' ? 'নগদ' : o.paymentMethod === 'bkash' ? 'বিকাশ / নগদ' : 'বাকি';
  const totalCups = o.items.reduce((s, i) => s + i.qty, 0);
  const flashCls = flashKind === 'updated' ? 'ring-2 ring-amber-400 animate-pulse'
    : flashKind === 'cancelled' ? 'ring-2 ring-red-400 animate-pulse' : '';

  return (
    <li className={`rounded-2xl border ${isEmployee ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 dark:border-neutral-800'} ${flashCls} overflow-hidden`}>
      <div className={`flex items-center justify-between gap-2 px-3 py-2 ${isEmployee ? 'bg-neutral-700/60' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
        <div className="flex items-center gap-2">
          <span className="font-bold">#{o.code}</span>
          {o.customerName && <span className={`text-sm ${isEmployee ? 'text-neutral-300' : 'text-neutral-600 dark:text-neutral-400'}`}>· {o.customerName}</span>}
        </div>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
          {statusBadge.icon} {statusBadge.label}
        </span>
      </div>
      <ul className={`p-3 space-y-1 ${isEmployee ? 'text-2xl' : 'text-base'}`}>
        {o.items.map((it, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className={`${isEmployee ? 'w-12 text-3xl' : 'w-8 text-lg'} font-bold tabular-nums`}>{toBn(it.qty)}×</span>
            <span className="flex-1">
              <span className="font-medium">{it.nameBn}</span>
              {it.note && (
                <span className={`block font-semibold ${isEmployee ? 'text-xl mt-0.5' : 'text-xs'} ${isEmployee ? 'text-amber-300' : 'text-amber-600'}`}>
                  📝 {it.note}
                </span>
              )}
            </span>
            {!isEmployee && <span className="text-sm tabular-nums text-neutral-500">{formatBdt(it.priceAt * it.qty)}</span>}
          </li>
        ))}
      </ul>
      {o.note && (
        <div
          className={`px-3 pb-2 ${
            isEmployee
              ? 'text-2xl font-bold text-amber-300 bg-amber-500/10 border-y border-amber-500/30 py-3 mt-1'
              : 'text-sm text-amber-700 dark:text-amber-300'
          }`}
        >
          📌 নির্দেশনা: {o.note}
        </div>
      )}
      <div className={`flex items-center gap-2 px-3 py-2 border-t ${isEmployee ? 'border-neutral-700' : 'border-neutral-100 dark:border-neutral-800'}`}>
        <span className={`text-xs ${isEmployee ? 'text-neutral-400' : 'text-neutral-500'}`}>{formatBnTime(o.createdAt)} · {toBn(totalCups)} কাপ · {payLabel}</span>
        <span className={`ml-auto font-bold ${isEmployee ? 'text-lg' : ''}`}>{formatBdt(o.total)}</span>
      </div>
      {(onAdvance || onEdit || onCancel) && (
        <div className={`flex gap-2 p-2 border-t ${isEmployee ? 'border-neutral-700' : 'border-neutral-100 dark:border-neutral-800'}`}>
          {onAdvance && (o.status === 'new' || o.status === 'making') && (
            <button
              onClick={onAdvance}
              className={`flex-1 py-3 rounded-lg font-bold text-lg ${
                o.status === 'new' ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {o.status === 'new' ? 'বানানো শুরু' : 'তৈরি'}
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center gap-1 text-sm">
              <Pencil size={14} /> এডিট
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1 text-sm">
              <Trash2 size={14} /> বাতিল
            </button>
          )}
        </div>
      )}
    </li>
  );
}
