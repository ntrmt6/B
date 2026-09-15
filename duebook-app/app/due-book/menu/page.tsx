'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  MenuItemDoc, MenuSettingsDoc,
  listMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems,
  getMenuSettings, saveMenuSettings, seedDefaultsIfNeeded,
} from '@/lib/menuApi';
import { toBn, formatBdt } from '@/lib/bn';
import {
  ChevronLeft, Plus, Trash2, Pencil, Check, X, ArrowUp, ArrowDown, Eye, Settings as SettingsIcon,
  Menu as MenuIcon, History, ToggleLeft, ToggleRight, Save,
} from 'lucide-react';

type Tab = 'items' | 'settings' | 'preview' | 'history';

const TABS: { id: Tab; labelBn: string; icon: React.ReactNode }[] = [
  { id: 'items', labelBn: 'আইটেম', icon: <MenuIcon size={16} /> },
  { id: 'settings', labelBn: 'সেটিংস', icon: <SettingsIcon size={16} /> },
  { id: 'preview', labelBn: 'প্রিভিউ', icon: <Eye size={16} /> },
  { id: 'history', labelBn: 'হিস্ট্রি', icon: <History size={16} /> },
];

export default function MenuBuilderPage() {
  const router = useRouter();
  const { user, tenantId, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('items');
  const [items, setItems] = useState<MenuItemDoc[]>([]);
  const [settings, setSettings] = useState<MenuSettingsDoc>({ shopNameBn: '', taglineBn: '', footerNotesBn: [] });
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    setBusy(true);
    try {
      await seedDefaultsIfNeeded(tenantId);
      const [{ items: it }, s] = await Promise.all([listMenuItems(tenantId), getMenuSettings(tenantId)]);
      setItems(it);
      setSettings(s);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'মেনু লোড করা গেল না');
    } finally {
      setBusy(false);
    }
  }, [tenantId]);

  useEffect(() => { if (tenantId) refresh(); }, [tenantId, refresh]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemDoc[]>();
    for (const it of items) {
      const arr = map.get(it.category) || [];
      arr.push(it);
      map.set(it.category, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return Array.from(map.entries());
  }, [items]);

  const toggleAvailable = async (it: MenuItemDoc) => {
    if (!tenantId) return;
    setItems(prev => prev.map(x => x._id === it._id ? { ...x, available: !x.available } : x));
    try { await updateMenuItem(tenantId, it._id, { available: !it.available }); }
    catch (e: any) {
      toast.error(e?.response?.data?.error || 'সেভ হয়নি');
      setItems(prev => prev.map(x => x._id === it._id ? it : x));
    }
  };

  const moveItem = async (it: MenuItemDoc, dir: -1 | 1) => {
    if (!tenantId) return;
    const same = items.filter(x => x.category === it.category).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = same.findIndex(x => x._id === it._id);
    const swap = same[idx + dir];
    if (!swap) return;
    const a = { ...it, sortOrder: swap.sortOrder };
    const b = { ...swap, sortOrder: it.sortOrder };
    setItems(prev => prev.map(x => x._id === a._id ? a : x._id === b._id ? b : x));
    try {
      await reorderMenuItems(tenantId, [
        { _id: a._id, sortOrder: a.sortOrder },
        { _id: b._id, sortOrder: b.sortOrder },
      ]);
    } catch (e: any) {
      toast.error('অর্ডার সেভ হয়নি');
      refresh();
    }
  };

  const remove = async (it: MenuItemDoc) => {
    if (!tenantId) return;
    if (!confirm(`"${it.nameBn}" মুছবেন?`)) return;
    try {
      await deleteMenuItem(tenantId, it._id);
      setItems(prev => prev.filter(x => x._id !== it._id));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'মোছা যায়নি');
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে…</div>;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-3 py-2">
          <Link href="/due-book" className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="ফিরে যান">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-bold text-lg">মেনু বিল্ডার</h1>
        </div>
        <div className="max-w-3xl mx-auto flex gap-1 px-2 pb-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                tab === t.id
                  ? 'bg-sky-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {t.icon}
              {t.labelBn}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-4">
        {tab === 'items' && (
          <ItemsTab
            grouped={grouped}
            busy={busy}
            addOpen={addOpen}
            setAddOpen={setAddOpen}
            editId={editId}
            setEditId={setEditId}
            onAdd={async (form) => {
              if (!tenantId) return;
              const nextSort = (items.length ? Math.max(...items.map(i => i.sortOrder)) : 0) + 10;
              try {
                const doc = await createMenuItem(tenantId, { ...form, sortOrder: nextSort });
                setItems(prev => [...prev, doc]);
                setAddOpen(false);
                toast.success('যোগ হয়েছে');
              } catch (e: any) {
                toast.error(e?.response?.data?.error || 'যোগ করা যায়নি');
              }
            }}
            onEdit={async (id, form) => {
              if (!tenantId) return;
              try {
                const doc = await updateMenuItem(tenantId, id, form);
                setItems(prev => prev.map(x => x._id === id ? doc : x));
                setEditId(null);
                toast.success('আপডেট হয়েছে');
              } catch (e: any) {
                toast.error(e?.response?.data?.error || 'সেভ হয়নি');
              }
            }}
            onToggle={toggleAvailable}
            onMove={moveItem}
            onDelete={remove}
          />
        )}

        {tab === 'settings' && (
          <SettingsTab
            settings={settings}
            onSave={async (s) => {
              if (!tenantId) return;
              try {
                const doc = await saveMenuSettings(tenantId, s);
                setSettings(doc);
                toast.success('সেভ হয়েছে');
              } catch (e: any) {
                toast.error(e?.response?.data?.error || 'সেভ হয়নি');
              }
            }}
          />
        )}

        {tab === 'preview' && (
          <PreviewTab items={items} settings={settings} />
        )}

        {tab === 'history' && (
          <div className="text-center py-16 text-neutral-500">
            <History size={40} className="mx-auto opacity-40 mb-2" />
            <p>মেনু এক্সপোর্ট করলে এখানে হিস্ট্রি দেখাবে।</p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─────────────── Items Tab ─────────────── */

interface ItemForm { nameBn: string; price: number; category: string; available: boolean; }
const EMPTY_FORM: ItemForm = { nameBn: '', price: 10, category: 'দুধ চা', available: true };

function ItemsTab(props: {
  grouped: [string, MenuItemDoc[]][];
  busy: boolean;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  editId: string | null;
  setEditId: (v: string | null) => void;
  onAdd: (form: ItemForm) => Promise<void>;
  onEdit: (id: string, form: ItemForm) => Promise<void>;
  onToggle: (it: MenuItemDoc) => Promise<void>;
  onMove: (it: MenuItemDoc, dir: -1 | 1) => Promise<void>;
  onDelete: (it: MenuItemDoc) => Promise<void>;
}) {
  const { grouped, busy, addOpen, setAddOpen, editId, setEditId, onAdd, onEdit, onToggle, onMove, onDelete } = props;
  const [addForm, setAddForm] = useState<ItemForm>(EMPTY_FORM);

  return (
    <div className="space-y-4">
      {!addOpen ? (
        <button
          onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(true); }}
          className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-medium"
        >
          <Plus size={18} /> নতুন আইটেম যোগ করুন
        </button>
      ) : (
        <ItemFormCard
          form={addForm}
          setForm={setAddForm}
          onCancel={() => setAddOpen(false)}
          onSubmit={() => onAdd(addForm)}
          submitLabel="যোগ করুন"
        />
      )}

      {busy && grouped.length === 0 && (
        <div className="text-center py-8 text-neutral-500">লোড হচ্ছে…</div>
      )}

      {grouped.map(([cat, list]) => (
        <section key={cat} className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="bg-neutral-50 dark:bg-neutral-800 px-3 py-2 font-semibold text-sm">{cat}</div>
          <ul>
            {list.map((it, idx) => (
              <li key={it._id} className="border-t border-neutral-100 dark:border-neutral-800 first:border-t-0">
                {editId === it._id ? (
                  <div className="p-3">
                    <InlineEditor
                      initial={{ nameBn: it.nameBn, price: it.price, category: it.category, available: it.available }}
                      onCancel={() => setEditId(null)}
                      onSubmit={(f) => onEdit(it._id, f)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${it.available ? '' : 'text-neutral-400 line-through'}`}>{it.nameBn}</div>
                      <div className="text-sm text-neutral-500">{formatBdt(it.price)}</div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        onClick={() => onMove(it, -1)}
                        disabled={idx === 0}
                        className="p-1 disabled:opacity-30"
                        aria-label="উপরে"
                      ><ArrowUp size={16} /></button>
                      <button
                        onClick={() => onMove(it, 1)}
                        disabled={idx === list.length - 1}
                        className="p-1 disabled:opacity-30"
                        aria-label="নিচে"
                      ><ArrowDown size={16} /></button>
                    </div>
                    <button
                      onClick={() => onToggle(it)}
                      className="p-2"
                      aria-label={it.available ? 'অফ' : 'অন'}
                      title={it.available ? 'বন্ধ করুন' : 'চালু করুন'}
                    >
                      {it.available ? <ToggleRight className="text-emerald-500" size={22} /> : <ToggleLeft className="text-neutral-400" size={22} />}
                    </button>
                    <button onClick={() => setEditId(it._id)} className="p-2 text-sky-500" aria-label="এডিট"><Pencil size={16} /></button>
                    <button onClick={() => onDelete(it)} className="p-2 text-red-500" aria-label="ডিলিট"><Trash2 size={16} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!busy && grouped.length === 0 && !addOpen && (
        <div className="text-center py-8 text-neutral-500">
          এখনো কোনো আইটেম নেই। নতুন আইটেম যোগ করুন।
        </div>
      )}
    </div>
  );
}

function ItemFormCard(props: {
  form: ItemForm;
  setForm: (f: ItemForm) => void;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
}) {
  const { form, setForm, onCancel, onSubmit, submitLabel } = props;
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
      <input
        value={form.nameBn}
        onChange={e => setForm({ ...form, nameBn: e.target.value })}
        placeholder="আইটেমের নাম (যেমন: দুধ চা)"
        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
      />
      <div className="flex gap-2">
        <input
          value={String(form.price)}
          onChange={e => setForm({ ...form, price: Math.max(0, Number(e.target.value.replace(/[^0-9.]/g, '')) || 0) })}
          inputMode="decimal"
          placeholder="দাম (৳)"
          className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
        />
        <input
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          placeholder="ক্যাটাগরি"
          className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.available}
          onChange={e => setForm({ ...form, available: e.target.checked })}
        />
        এখন পাওয়া যাচ্ছে
      </label>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSubmit()}
          disabled={!form.nameBn.trim()}
          className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-1"
        ><Check size={16} /> {submitLabel}</button>
        <button
          onClick={onCancel}
          className="px-4 bg-neutral-100 dark:bg-neutral-800 py-2 rounded-lg flex items-center gap-1"
        ><X size={16} /> বাতিল</button>
      </div>
    </div>
  );
}

function InlineEditor(props: {
  initial: ItemForm;
  onCancel: () => void;
  onSubmit: (f: ItemForm) => void | Promise<void>;
}) {
  const [form, setForm] = useState<ItemForm>(props.initial);
  return (
    <ItemFormCard
      form={form}
      setForm={setForm}
      onCancel={props.onCancel}
      onSubmit={() => props.onSubmit(form)}
      submitLabel="সেভ"
    />
  );
}

/* ─────────────── Settings Tab ─────────────── */

function SettingsTab({ settings, onSave }: { settings: MenuSettingsDoc; onSave: (s: MenuSettingsDoc) => Promise<void> }) {
  const [form, setForm] = useState<MenuSettingsDoc>(settings);
  useEffect(() => { setForm(settings); }, [settings]);
  const setNote = (idx: number, val: string) => {
    const next = [...form.footerNotesBn];
    next[idx] = val;
    setForm({ ...form, footerNotesBn: next });
  };
  return (
    <div className="space-y-3 max-w-xl">
      <label className="block">
        <div className="text-sm font-medium mb-1">দোকানের নাম</div>
        <input
          value={form.shopNameBn}
          onChange={e => setForm({ ...form, shopNameBn: e.target.value })}
          placeholder="যেমন: রহিম চা স্টল"
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
        />
      </label>
      <label className="block">
        <div className="text-sm font-medium mb-1">ট্যাগলাইন</div>
        <input
          value={form.taglineBn}
          onChange={e => setForm({ ...form, taglineBn: e.target.value })}
          placeholder="যেমন: গরম গরম চা, দিনরাত খোলা"
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
        />
      </label>
      <div>
        <div className="text-sm font-medium mb-1">ফুটার নোটস</div>
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => (
            <input
              key={i}
              value={form.footerNotesBn[i] || ''}
              onChange={e => setNote(i, e.target.value)}
              placeholder={i === 0 ? 'যেমন: আজ নগদ, কাল বাকি' : i === 1 ? 'যেমন: বিকাশ / নগদ চলে' : 'ঐচ্ছিক নোট'}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
            />
          ))}
        </div>
      </div>
      <button
        onClick={() => onSave({ ...form, footerNotesBn: form.footerNotesBn.filter(s => s && s.trim()) })}
        className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1"
      ><Save size={16} /> সেভ করুন</button>
    </div>
  );
}

/* ─────────────── Preview Tab ─────────────── */

export function MenuPreview({ items, settings }: { items: MenuItemDoc[]; settings: MenuSettingsDoc }) {
  const grouped = useMemo(() => {
    const available = items.filter(i => i.available);
    const map = new Map<string, MenuItemDoc[]>();
    for (const it of available) {
      const arr = map.get(it.category) || [];
      arr.push(it);
      map.set(it.category, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return Array.from(map.entries());
  }, [items]);

  return (
    <div id="menu-preview-card" className="mx-auto bg-white text-neutral-900 rounded-2xl shadow-xl border border-neutral-200 overflow-hidden" style={{ fontFamily: '"Noto Sans Bengali", system-ui, sans-serif', maxWidth: 480 }}>
      <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-white px-5 py-6 text-center border-b-2 border-orange-200">
        <div className="text-3xl font-extrabold text-orange-900 leading-tight">{settings.shopNameBn || 'আমাদের মেনু'}</div>
        {settings.taglineBn && <div className="text-base text-orange-700 mt-1">{settings.taglineBn}</div>}
      </div>
      <div className="p-5 space-y-5">
        {grouped.map(([cat, list]) => (
          <div key={cat}>
            <div className="text-lg font-bold text-orange-800 border-b-2 border-orange-300 pb-1 mb-2">{cat}</div>
            <ul className="space-y-1.5">
              {list.map(it => (
                <li key={it._id} className="flex items-baseline gap-2">
                  <span className="text-xl">{it.nameBn}</span>
                  <span className="flex-1 border-b border-dotted border-neutral-400 translate-y-[-4px]" />
                  <span className="text-xl font-bold tabular-nums">{formatBdt(it.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-center text-neutral-400 py-6">কোনো আইটেম নেই</div>
        )}
      </div>
      {settings.footerNotesBn.length > 0 && (
        <div className="bg-orange-50 border-t border-orange-200 px-5 py-3 text-center">
          {settings.footerNotesBn.map((n, i) => (
            <div key={i} className="text-base text-orange-900 font-medium">{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewTab({ items, settings }: { items: MenuItemDoc[]; settings: MenuSettingsDoc }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500 text-center">প্রিন্ট করার আগে চেক করে নিন</p>
      <MenuPreview items={items} settings={settings} />
    </div>
  );
}
