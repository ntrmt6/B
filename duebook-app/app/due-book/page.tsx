'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  getEntitiesOffline, getTxOffline,
  createEntityOffline, addTxOffline, patchTxStatusOffline,
  patchEntityOffline, deleteEntityOffline, deleteTxOffline, isTempId,
} from '@/lib/offlineApi';
import { drain as drainQueue } from '@/lib/offlineQueue';
import toast from 'react-hot-toast';
import {
  Plus, Search, X, ChevronLeft, LogOut,
  TrendingUp, TrendingDown, UserPlus, Trash2, CheckCircle2, Circle, Download,
  Minus, Pencil, Settings, Moon, Sun, MessageCircle, Gift, QrCode as QrIcon, CloudOff, Send, Bell,
  MessageSquare, Copy, Users, Upload, ClipboardPaste, Check, Pin, PinOff, ShieldCheck, Camera,
  Lock, Unlock, Package, Menu,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SyncBar from './SyncBar';
import ReminderInbox from './ReminderInbox';
import InventoryModal from './InventoryModal';

/* ─── Types ─── */
interface Entity {
  _id: string; name: string; phone?: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number; totalIOweThemNumber: number;
  rewardsClaimed?: number;
  profilePicture?: string;
  updatedAt?: string; createdAt?: string;
  _pending?: boolean;
}

interface Transaction {
  _id: string; amount: number;
  direction: 'INCOME' | 'EXPENSE';
  transactionDate: string; notes?: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  photo?: string;
  _pending?: boolean;
}

interface CatalogItem { id: string; name: string; price: number; }
interface CartItem { item: CatalogItem; qty: number; }
type Labels = { Customer: string; Supplier: string; Employee: string };
interface RegSettings {
  shopName: string;
  registrationEnabled: boolean;
  bonusAmount: number;
  rewardItemName: string;
  rewardItemPrice: number;
  paymentRewardThreshold: number;
  welcomeMessage: string;
  shopLogo: string;
}
type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select';
interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  listId?: string;
  options?: string[];
  defaultValue?: string;
}
interface MessageTemplate { id: string; name: string; body: string; fields?: TemplateField[]; }
interface NamedList { id: string; name: string; items: string[]; }

const TYPES: Entity['type'][] = ['Customer', 'Supplier', 'Employee'];
const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ec4899','#6366f1'];
const CATALOG_KEY = 'duebook_catalog';
const LABELS_KEY = 'duebook_labels';
const DARK_KEY = 'duebook_dark';
const USAGE_KEY = 'duebook_usage';
const TEMPLATES_KEY = 'duebook_templates';
const LISTS_KEY = 'duebook_lists';
const LAST_TPL_VALUES_KEY = 'duebook_tpl_last';
const PINNED_KEY = 'duebook_pinned';
const LOCK_KEY = 'duebook_locked';

type SettingsTab = 'general' | 'business' | 'templates' | 'lists';
const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'business', label: 'Business' },
  { id: 'templates', label: 'Templates' },
  { id: 'lists', label: 'Lists' },
];
const DEFAULT_CATALOG: CatalogItem[] = [
  { id: '1', name: 'Chai', price: 10 },
  { id: '2', name: 'Coke', price: 30 },
  { id: '3', name: 'Sprite', price: 30 },
  { id: '4', name: 'Water', price: 15 },
  { id: '5', name: 'Cigarette', price: 5 },
  { id: '6', name: 'Biscuit', price: 10 },
];
const DEFAULT_LABELS: Labels = { Customer: 'Customer', Supplier: 'Supplier', Employee: 'Employee' };

const DEFAULT_LISTS: NamedList[] = [
  { id: 'vehicles', name: 'Vehicle Types', items: ['AC Bus', 'Non-AC Bus', 'Microbus', 'Sedan Car', 'SUV', 'Hiace'] },
  { id: 'locations', name: 'Locations', items: ['Dhaka', 'Chittagong', "Cox's Bazar", 'Sylhet', 'Rangamati', 'Bandarban'] },
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'greeting',
    name: 'Greeting',
    body: `Hi {customerName},

Thank you for choosing *{shopName}*. We appreciate your trust in us.

For any query, feel free to reach out.

Regards,
{shopName}`,
  },
  {
    id: 'booking',
    name: 'Booking Confirmation',
    body: `*{shopName}*
━━━━━━━━━━━━━━━━━━
Booking Date: {today}
Name: {customerName}
Contact Number: {phone}
Service: {service}
Date: {date}
Time: {time}
Location: {location}


Total: {total}
Advance: {advance}
Remaining due: {due}
━━━━━━━━━━━━━━━━━━
Thank you!`,
    fields: [
      { id: 'service', label: 'Service', type: 'text' },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'time', label: 'Time', type: 'time' },
      { id: 'location', label: 'Location', type: 'select', listId: 'locations' },
      { id: 'total', label: 'Total (Tk)', type: 'number' },
      { id: 'advance', label: 'Advance (Tk)', type: 'number' },
    ],
  },
  {
    id: 'car-rental',
    name: 'Car Rental Booking',
    body: `*{shopName} - Tourist Bus Rental Service*
━━━━━━━━━━━━━━━━━━
Booking Date: {today}
Name: {customerName}
Contact Number: {phone}
Vehicle Type: {vehicleType}
Journey Date: {journeyDate}
Pickup location: {pickup}
Pickup time: {pickupTime}
Destination: {destination}
Return Drop location: {returnDrop}
Return date: {returnDate}
Return Time: {returnTime}


Total Rent: {totalRent}
Advance Amount: {advance}
Remaining due: {due}
━━━━━━━━━━━━━━━━━━
Thank you!`,
    fields: [
      { id: 'vehicleType', label: 'Vehicle Type', type: 'select', listId: 'vehicles' },
      { id: 'journeyDate', label: 'Journey Date', type: 'date' },
      { id: 'pickup', label: 'Pickup Location', type: 'select', listId: 'locations' },
      { id: 'pickupTime', label: 'Pickup Time', type: 'time' },
      { id: 'destination', label: 'Destination', type: 'select', listId: 'locations' },
      { id: 'returnDrop', label: 'Return Drop Location', type: 'select', listId: 'locations' },
      { id: 'returnDate', label: 'Return Date', type: 'date' },
      { id: 'returnTime', label: 'Return Time', type: 'time' },
      { id: 'totalRent', label: 'Total Rent (Tk)', type: 'number' },
      { id: 'advance', label: 'Advance (Tk)', type: 'number' },
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery Update',
    body: `Hi {customerName},

Your order from *{shopName}* is on the way and will be delivered soon.

Amount to collect: {due}

Thank you!`,
  },
];

const PLACEHOLDER_KEYS = ['shopName', 'customerName', 'phone', 'today', 'due', 'net'] as const;

const applyPlaceholders = (
  body: string,
  ctx: { shopName?: string; customerName?: string; phone?: string; today?: string; due?: number; net?: number },
) => {
  const today = ctx.today || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dueStr = typeof ctx.due === 'number' && ctx.due > 0
    ? `Tk ${ctx.due.toLocaleString('en-IN')}`
    : (typeof ctx.due === 'number' ? '—' : '');
  const netStr = typeof ctx.net === 'number' ? `Tk ${ctx.net.toLocaleString('en-IN')}` : '';
  return body
    .replace(/\{shopName\}/g, (ctx.shopName || '').trim() || 'Our Shop')
    .replace(/\{customerName\}/g, ctx.customerName || '')
    .replace(/\{phone\}/g, ctx.phone || '')
    .replace(/\{today\}/g, today)
    .replace(/\{due\}/g, dueStr)
    .replace(/\{net\}/g, netStr);
};

const applyFieldValues = (body: string, fields: TemplateField[] | undefined, values: Record<string, string>) => {
  if (!fields?.length) return body;
  let out = body;
  for (const f of fields) {
    const v = (values[f.id] ?? '').toString();
    out = out.split(`{${f.id}}`).join(v);
  }
  return out;
};

const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initial = (name: string) => (name || '?')[0].toUpperCase();

async function fileToDataUrl(f: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}
const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs < 1000) return 'Tk ' + abs.toLocaleString('en-IN');
  return 'Tk ' + new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(abs).toLowerCase();
};
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
const fmtDateTime = (s: string) => new Date(s).toLocaleString('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
});

const dueLineFor = (remainingDue?: number): string | null => {
  if (typeof remainingDue !== 'number') return null;
  if (remainingDue > 0) return `Remaining due: *Tk ${remainingDue.toLocaleString('en-IN')}*`;
  if (remainingDue < 0) return `I owe you: *Tk ${Math.abs(remainingDue).toLocaleString('en-IN')}*`;
  return `All dues cleared 🎉`;
};

const buildReceipt = (
  tx: { amount: number; direction: 'INCOME' | 'EXPENSE'; transactionDate: string; notes?: string; status: string },
  entityName: string,
  shopName: string,
  remainingDue?: number,
) => {
  const header = shopName?.trim() || 'DueBook';
  const line = '━━━━━━━━━━━━━━━━━━';
  const dueLine = dueLineFor(remainingDue);

  if (tx.status === 'Paid') {
    return [
      `🧾 *${header}*`,
      line,
      `Date: ${fmtDateTime(tx.transactionDate)}`,
      `Customer: ${entityName}`,
      ``,
      `✅ Payment received: *Tk ${tx.amount.toLocaleString('en-IN')}*`,
      ...(dueLine ? [dueLine] : []),
      line,
      `Thanks for your payment!`,
    ].join('\n');
  }

  const dir = tx.direction === 'INCOME' ? 'Due (They Owe)' : 'Payment (I Owe)';
  const items = tx.notes?.trim() || '—';
  return [
    `🧾 *${header}*`,
    line,
    `Date: ${fmtDateTime(tx.transactionDate)}`,
    `Customer: ${entityName}`,
    ``,
    `Items: ${items}`,
    ``,
    `Amount: *Tk ${tx.amount.toLocaleString('en-IN')}*`,
    `Type: ${dir}`,
    ...(dueLine ? [dueLine] : []),
    line,
    `Thank you!`,
  ].join('\n');
};

const netPending = (
  txs: { direction: 'INCOME' | 'EXPENSE'; amount: number; status: string }[],
): number =>
  txs.reduce(
    (s, t) => (t.status === 'Pending' ? s + (t.direction === 'INCOME' ? t.amount : -t.amount) : s),
    0,
  );

const buildDueReminder = (
  entityName: string,
  totalDue: number,
  shopName: string,
  pendingTxs?: { amount: number; direction: 'INCOME' | 'EXPENSE'; transactionDate: string; notes?: string; status: string }[],
) => {
  const header = shopName?.trim() || 'DueBook';
  const line = '━━━━━━━━━━━━━━━━━━';
  const amount = `Tk ${totalDue.toLocaleString('en-IN')}`;

  const unpaid = (pendingTxs || [])
    .filter(t => t.status === 'Pending' && t.direction === 'INCOME')
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

  const parts: string[] = [
    `🔔 *Payment Reminder*`,
    line,
    `Hello *${entityName}*,`,
    ``,
    `This is a friendly reminder from *${header}*.`,
    ``,
    `💰 Total due: *${amount}*`,
  ];

  if (unpaid.length > 0) {
    const oldest = unpaid[0];
    const days = Math.max(0, Math.floor((Date.now() - new Date(oldest.transactionDate).getTime()) / 86400000));
    parts.push(`📊 Unpaid entries: *${unpaid.length}*`);
    parts.push(`📅 Pending since: ${fmtDate(oldest.transactionDate)}${days > 0 ? ` (${days} day${days === 1 ? '' : 's'})` : ''}`);

    const recent = unpaid.slice(-3).reverse();
    parts.push(``);
    parts.push(`*Recent unpaid:*`);
    for (const t of recent) {
      const note = t.notes?.trim();
      parts.push(`• ${fmtDate(t.transactionDate)} — Tk ${t.amount.toLocaleString('en-IN')}${note ? ` (${note})` : ''}`);
    }
  }

  parts.push(line);
  parts.push(
    unpaid.length > 1
      ? `Your balance has been growing. Kindly clear at your earliest convenience.`
      : `Kindly clear at your earliest convenience.`,
  );
  parts.push(``);
  parts.push(`Thank you! 🙏`);

  return parts.join('\n');
};

/* ─── API helpers ─── */
const getEntities = async (tid: string): Promise<Entity[]> => {
  const { data } = await getEntitiesOffline(tid);
  return data as Entity[];
};
const getTx = async (tid: string, entityId: string): Promise<Transaction[]> => {
  const { data } = await getTxOffline(tid, entityId);
  return data as Transaction[];
};
const getRegSettings = async (tid: string): Promise<RegSettings> => {
  const r = await api.get('/duebook/settings', { headers: { 'X-Tenant-Id': tid } });
  return r.data;
};
const saveRegSettingsApi = async (tid: string, payload: Partial<RegSettings>) =>
  api.put('/duebook/settings', payload, { headers: { 'X-Tenant-Id': tid } });
const claimRewardApi = async (tid: string, entityId: string) => {
  const r = await api.post(`/entities/${entityId}/claim-reward`, {}, { headers: { 'X-Tenant-Id': tid } });
  return r.data as Entity;
};

/* WhatsApp phone: strip non-digits; if starts with 0 → BD (880). */
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0') && d.length === 11) return '880' + d.slice(1);
  return d;
};
const waUrl = (phone: string, message: string) => {
  const n = waNumber(phone);
  if (!n) return '';
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
};

/* ══════════════════════════════════════════ */
export default function DueBookPage() {
  const { user, tenantId, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Entity['type']>('Customer');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Entity | null>(null);
  const [transactions, setTx] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  /* modal: add transaction */
  const [showAdd, setShowAdd] = useState(false);
  const [addDir, setAddDir] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addSaving, setAddSaving] = useState(false);

  /* item catalog + cart */
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CATALOG;
    try {
      const s = localStorage.getItem(CATALOG_KEY);
      return s ? JSON.parse(s) : DEFAULT_CATALOG;
    } catch { return DEFAULT_CATALOG; }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  /* item usage tracking */
  const [itemUsage, setItemUsage] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const s = localStorage.getItem(USAGE_KEY);
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  /* modal: add entity */
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<Entity['type']>('Customer');
  const [newProfilePic, setNewProfilePic] = useState('');
  const [entitySaving, setEntitySaving] = useState(false);

  /* edit entity */
  const [showEditEntity, setShowEditEntity] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProfilePic, setEditProfilePic] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  /* add transaction extra */
  const [addPhoto, setAddPhoto] = useState('');
  const [showPhotoViewer, setShowPhotoViewer] = useState<string | null>(null);

  /* registration settings (self-registration + welcome bonus) */
  const DEFAULT_REG: RegSettings = { shopName: '', registrationEnabled: false, bonusAmount: 0, rewardItemName: '', rewardItemPrice: 0, paymentRewardThreshold: 0, welcomeMessage: '', shopLogo: '' };
  const [regSettings, setRegSettings] = useState<RegSettings>(DEFAULT_REG);
  const [draftReg, setDraftReg] = useState<RegSettings>(DEFAULT_REG);
  const [regSaving, setRegSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);

  /* settings */
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [labels, setLabels] = useState<Labels>(() => {
    if (typeof window === 'undefined') return DEFAULT_LABELS;
    try {
      const s = localStorage.getItem(LABELS_KEY);
      return s ? { ...DEFAULT_LABELS, ...JSON.parse(s) } : DEFAULT_LABELS;
    } catch { return DEFAULT_LABELS; }
  });
  const [draftLabels, setDraftLabels] = useState<Labels>(DEFAULT_LABELS);

  /* message templates */
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
    try {
      const s = localStorage.getItem(TEMPLATES_KEY);
      return s ? JSON.parse(s) : DEFAULT_TEMPLATES;
    } catch { return DEFAULT_TEMPLATES; }
  });
  const [showTplPicker, setShowTplPicker] = useState(false);
  const [showTplEditor, setShowTplEditor] = useState(false);
  const [editingTpl, setEditingTpl] = useState<MessageTemplate | null>(null);
  const [tplDraftName, setTplDraftName] = useState('');
  const [tplDraftBody, setTplDraftBody] = useState('');
  const [tplDraftFields, setTplDraftFields] = useState<TemplateField[]>([]);
  const [showTplPreview, setShowTplPreview] = useState(false);
  const [tplPreview, setTplPreview] = useState('');
  const [tplPreviewTpl, setTplPreviewTpl] = useState<MessageTemplate | null>(null);
  const [tplFieldValues, setTplFieldValues] = useState<Record<string, string>>({});
  const [tplBodyOverride, setTplBodyOverride] = useState<string | null>(null);

  /* named lists (vehicles, locations, etc.) */
  const [lists, setLists] = useState<NamedList[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_LISTS;
    try {
      const s = localStorage.getItem(LISTS_KEY);
      return s ? JSON.parse(s) : DEFAULT_LISTS;
    } catch { return DEFAULT_LISTS; }
  });
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListItem, setNewListItem] = useState<Record<string, string>>({});

  /* settings tab */
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');

  /* recovery (security Q&A) */
  const [recoveryHasSet, setRecoveryHasSet] = useState<boolean | null>(null);
  const [recoveryCurrentQ, setRecoveryCurrentQ] = useState('');
  const [recPassword, setRecPassword] = useState('');
  const [recQuestion, setRecQuestion] = useState('');
  const [recAnswer, setRecAnswer] = useState('');
  const [recSaving, setRecSaving] = useState(false);

  /* pinned entities (top of list) */
  const [pinned, setPinned] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const s = localStorage.getItem(PINNED_KEY);
      return new Set(s ? JSON.parse(s) as string[] : []);
    } catch { return new Set(); }
  });
  const togglePin = (id: string) => {
    setPinned(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      try { localStorage.setItem(PINNED_KEY, JSON.stringify(Array.from(n))); } catch {/* ignore */}
      return n;
    });
  };

  /* import / export */
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  /* bulk send */
  const [showBulk, setShowBulk] = useState(false);
  const [bulkTplId, setBulkTplId] = useState<string>('');
  const [bulkFilter, setBulkFilter] = useState<'has_due' | 'all_customers' | 'all_suppliers' | 'all_employees'>('has_due');
  const [bulkFieldValues, setBulkFieldValues] = useState<Record<string, string>>({});
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSentIds, setBulkSentIds] = useState<Set<string>>(new Set());

  /* dark mode */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_KEY) === '1';
  });

  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem(DARK_KEY, next ? '1' : '0');
      return next;
    });
  };

  /* shadow lock — blocks all touches until user long-presses to unlock */
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LOCK_KEY) === '1';
  });
  const lockOn = () => {
    localStorage.setItem(LOCK_KEY, '1');
    setIsLocked(true);
    toast('Screen locked — long-press to unlock', { icon: '🔒' });
  };
  const lockOff = () => {
    localStorage.setItem(LOCK_KEY, '0');
    setIsLocked(false);
    toast('Unlocked', { icon: '🔓' });
  };
  const unlockHoldTimer = useRef<number | null>(null);
  const [unlockHoldPct, setUnlockHoldPct] = useState(0);
  const startUnlockHold = () => {
    if (unlockHoldTimer.current) return;
    const start = Date.now();
    const HOLD_MS = 1500;
    unlockHoldTimer.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / HOLD_MS) * 100);
      setUnlockHoldPct(pct);
      if (pct >= 100) {
        if (unlockHoldTimer.current) { clearInterval(unlockHoldTimer.current); unlockHoldTimer.current = null; }
        setUnlockHoldPct(0);
        lockOff();
      }
    }, 50) as unknown as number;
  };
  const cancelUnlockHold = () => {
    if (unlockHoldTimer.current) { clearInterval(unlockHoldTimer.current); unlockHoldTimer.current = null; }
    setUnlockHoldPct(0);
  };

  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);

  /* multi-select for transactions (bulk delete / mark paid) */
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);
  const isSelectMode = selectedTxIds.size > 0;
  useEffect(() => { setSelectedTxIds(new Set()); }, [selected?._id]);
  const txListRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  /* pull-to-refresh */
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const PULL_THRESHOLD = 60;

  /* online/offline */
  const [isOnline, setIsOnline] = useState(true);

  const TODAY = new Date().toISOString().split('T')[0];
  const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);

  /* sorted catalog by usage */
  const sortedCatalog = useMemo(() => {
    return [...catalog].sort((a, b) => (itemUsage[b.id] || 0) - (itemUsage[a.id] || 0));
  }, [catalog, itemUsage]);

  useEffect(() => {
    if (!authLoading && !user) window.location.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!user) window.location.replace('/login');
    }, 3000);
    return () => clearTimeout(t);
  }, [user]);

  const loadEntities = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try { setEntities(await getEntities(tenantId)); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { loadEntities(); }, [loadEntities]);

  /* load registration settings once tenant is known */
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const s = await getRegSettings(tenantId);
        setRegSettings({
          shopName: s.shopName || '',
          registrationEnabled: !!s.registrationEnabled,
          bonusAmount: Number(s.bonusAmount) || 0,
          rewardItemName: s.rewardItemName || '',
          rewardItemPrice: Number(s.rewardItemPrice) || 0,
          paymentRewardThreshold: Number(s.paymentRewardThreshold) || 0,
          welcomeMessage: s.welcomeMessage || '',
          shopLogo: s.shopLogo || '',
        });
      } catch { /* ignore */ }
    })();
  }, [tenantId]);

  /* runtime PWA branding: update title, favicon, and manifest per shop */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const shopName = regSettings.shopName?.trim();
    const logo = regSettings.shopLogo;
    if (shopName) document.title = `${shopName} · DueBook`;
    else document.title = 'DueBook';

    const setIcon = (rel: string, href: string) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"][data-shop="1"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        link.setAttribute('data-shop', '1');
        document.head.appendChild(link);
      }
      link.href = href;
    };
    if (logo) {
      setIcon('icon', logo);
      setIcon('apple-touch-icon', logo);
    }

    if (logo || shopName) {
      const manifest = {
        name: shopName ? `${shopName} — DueBook` : 'DueBook',
        short_name: shopName || 'DueBook',
        start_url: '/due-book',
        scope: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#0ea5e9',
        icons: logo
          ? [{ src: logo, sizes: '192x192', type: 'image/png', purpose: 'any' }]
          : [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
      const url = URL.createObjectURL(blob);
      let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"][data-shop="1"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'manifest';
        link.setAttribute('data-shop', '1');
        document.head.appendChild(link);
      }
      const prev = link.href;
      link.href = url;
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
    }
  }, [regSettings.shopName, regSettings.shopLogo]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => {
      setIsOnline(true);
      void drainQueue().then(res => {
        if (res.synced > 0 && tenantId) loadEntities();
      });
    };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [tenantId, loadEntities]);

  useEffect(() => {
    if (!showMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMenu(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [showMenu]);

  useEffect(() => {
    const onPop = () => {
      if (showImport) { setShowImport(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showBulk) { setShowBulk(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showTplPreview) { setShowTplPreview(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showTplEditor) { setShowTplEditor(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showTplPicker) { setShowTplPicker(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showCatalog) { setShowCatalog(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showSettings) { setShowSettings(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showInventory) { setShowInventory(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showEditEntity) { setShowEditEntity(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showAdd) { setShowAdd(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (showAddEntity) { setShowAddEntity(false); window.history.pushState({ duebook: 'modal' }, ''); return; }
      if (selected) { setSelected(null); setTx([]); window.history.pushState({ duebook: 'list' }, ''); return; }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showAdd, showAddEntity, showCatalog, showSettings, showInventory, showEditEntity, selected, showTplPicker, showTplEditor, showTplPreview, showBulk, showImport]);

  const loadTx = useCallback(async (entity: Entity) => {
    if (!tenantId) return;
    setTxLoading(true);
    try { setTx(await getTx(tenantId, entity._id)); }
    catch { toast.error('Failed to load transactions'); }
    finally { setTxLoading(false); }
  }, [tenantId]);

  const selectEntity = (entity: Entity) => {
    setSelected(entity);
    loadTx(entity);
    window.history.pushState({ duebook: 'detail' }, '');
  };

  const filtered = useMemo(() => {
    const matched = entities.filter(e => {
      const matchTab = e.type?.toLowerCase() === tab.toLowerCase();
      if (!search) return matchTab;
      return matchTab && (
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.phone?.includes(search)
      );
    });
    const ts = (e: Entity) => new Date(e.updatedAt || e.createdAt || 0).getTime();
    return matched.sort((a, b) => {
      const pa = pinned.has(a._id) ? 1 : 0;
      const pb = pinned.has(b._id) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return ts(b) - ts(a);
    });
  }, [entities, tab, search, pinned]);

  const totalGet = entities.reduce((s, e) => s + (e.totalOwedToMe || 0), 0);
  const totalGive = entities.reduce((s, e) => s + (e.totalIOweThemNumber || 0), 0);

  const txWithBal = useMemo(() => {
    let bal = 0;
    return [...transactions]
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
      .map(tx => {
        if (tx.status === 'Pending') { const d = tx.direction === 'INCOME' ? tx.amount : -tx.amount; bal += d; }
        return { ...tx, bal };
      });
  }, [transactions]);

  useEffect(() => {
    if (txListRef.current && txWithBal.length > 0) {
      txListRef.current.scrollTop = txListRef.current.scrollHeight;
    }
  }, [txWithBal]);

  /* ─── Cart helpers ─── */
  const addToCart = (item: CatalogItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id);
      if (idx >= 0) return prev.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
    /* track usage */
    setItemUsage(prev => {
      const next = { ...prev, [item.id]: (prev[item.id] || 0) + 1 };
      localStorage.setItem(USAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const decrementCart = (itemId: string) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === itemId);
      if (idx < 0) return prev;
      if (prev[idx].qty === 1) return prev.filter(c => c.item.id !== itemId);
      return prev.map((c, i) => i === idx ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  /* ─── Catalog helpers ─── */
  const saveCatalog = (items: CatalogItem[]) => {
    setCatalog(items);
    localStorage.setItem(CATALOG_KEY, JSON.stringify(items));
  };

  const addCatalogItem = () => {
    if (!newItemName.trim()) { toast.error('Enter item name'); return; }
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) { toast.error('Enter valid price'); return; }
    saveCatalog([...catalog, { id: Date.now().toString(), name: newItemName.trim(), price }]);
    setNewItemName(''); setNewItemPrice('');
  };

  const removeCatalogItem = (id: string) => {
    saveCatalog(catalog.filter(i => i.id !== id));
    setCart(prev => prev.filter(c => c.item.id !== id));
  };

  /* ─── Labels helpers ─── */
  const openSettings = () => {
    setDraftLabels({ ...labels });
    setDraftReg({ ...regSettings });
    setShowQR(false);
    setSettingsTab('general');
    setShowSettings(true);
    setRecPassword(''); setRecAnswer('');
    // fetch current recovery status
    api.get('/duebook/auth/recovery-status')
      .then(r => {
        setRecoveryHasSet(!!r.data?.hasRecovery);
        setRecoveryCurrentQ(r.data?.question || '');
        if (!recQuestion) setRecQuestion(r.data?.question || '');
      })
      .catch(() => setRecoveryHasSet(null));
    window.history.pushState({ duebook: 'modal' }, '');
  };

  const saveRecovery = async () => {
    if (!recPassword) { toast.error('Enter current password'); return; }
    if (!recQuestion.trim() || recQuestion.trim().length < 4) { toast.error('Question too short'); return; }
    if (!recAnswer.trim() || recAnswer.trim().length < 2) { toast.error('Answer too short'); return; }
    setRecSaving(true);
    try {
      await api.put('/duebook/auth/security-question', {
        currentPassword: recPassword,
        securityQuestion: recQuestion.trim(),
        securityAnswer: recAnswer.trim(),
      });
      toast.success('Recovery updated');
      setRecoveryHasSet(true);
      setRecoveryCurrentQ(recQuestion.trim());
      setRecPassword(''); setRecAnswer('');
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(typeof err?.response?.data?.error === 'string' ? err.response!.data!.error! : 'Failed to save');
    } finally { setRecSaving(false); }
  };

  /* last-used template field values (per template) */
  const getLastValues = (tplId: string): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
      const s = localStorage.getItem(LAST_TPL_VALUES_KEY);
      const all = s ? JSON.parse(s) as Record<string, Record<string, string>> : {};
      return all[tplId] || {};
    } catch { return {}; }
  };
  const saveLastValues = (tplId: string, values: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    try {
      const s = localStorage.getItem(LAST_TPL_VALUES_KEY);
      const all = s ? JSON.parse(s) as Record<string, Record<string, string>> : {};
      all[tplId] = values;
      localStorage.setItem(LAST_TPL_VALUES_KEY, JSON.stringify(all));
    } catch {/* ignore */}
  };

  const saveLabels = () => {
    setLabels(draftLabels);
    localStorage.setItem(LABELS_KEY, JSON.stringify(draftLabels));
    setShowSettings(false);
    toast.success('Labels saved');
  };

  const saveRegSettings = async () => {
    if (!tenantId) return;
    setRegSaving(true);
    try {
      await saveRegSettingsApi(tenantId, {
        shopName: draftReg.shopName,
        registrationEnabled: draftReg.registrationEnabled,
        bonusAmount: Number(draftReg.bonusAmount) || 0,
        rewardItemName: draftReg.rewardItemName,
        rewardItemPrice: Number(draftReg.rewardItemPrice) || 0,
        paymentRewardThreshold: Number(draftReg.paymentRewardThreshold) || 0,
        welcomeMessage: draftReg.welcomeMessage,
        shopLogo: draftReg.shopLogo,
      });
      setRegSettings({
        ...draftReg,
        bonusAmount: Number(draftReg.bonusAmount) || 0,
        rewardItemPrice: Number(draftReg.rewardItemPrice) || 0,
        paymentRewardThreshold: Number(draftReg.paymentRewardThreshold) || 0,
      });
      toast.success('Registration settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setRegSaving(false); }
  };

  /* ─── Edit entity helpers ─── */
  const openEditEntity = () => {
    if (!selected) return;
    setEditName(selected.name);
    setEditPhone(selected.phone || '');
    setEditProfilePic(selected.profilePicture || '');
    setShowEditEntity(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };

  const handleEditEntity = async () => {
    if (!selected || !tenantId) return;
    if (!editName.trim()) { toast.error('Name required'); return; }
    setEditSaving(true);
    try {
      const res = await patchEntityOffline(tenantId, selected._id, { name: editName.trim(), phone: editPhone.trim(), profilePicture: editProfilePic });
      toast.success(res.queued ? 'Saved offline — will sync' : 'Updated');
      setShowEditEntity(false);
      // Optimistic local update
      setEntities(prev => prev.map(e => e._id === selected._id ? { ...e, name: editName.trim(), phone: editPhone.trim(), profilePicture: editProfilePic } : e));
      setSelected(prev => prev ? { ...prev, name: editName.trim(), phone: editPhone.trim(), profilePicture: editProfilePic } : prev);
      if (!res.queued) {
        const updated = await getEntities(tenantId);
        setEntities(updated);
        const fresh = updated.find(e => e._id === selected._id);
        if (fresh) setSelected(fresh);
      }
    } catch (e) {
      const err = e as { message?: string };
      toast.error(err?.message || 'Failed to update');
    }
    finally { setEditSaving(false); }
  };

  /* ─── Transaction handlers ─── */
  const handleSendTx = async (
    tx: { amount: number; direction: 'INCOME' | 'EXPENSE'; transactionDate: string; notes?: string; status: string },
    entity?: Entity | null,
    remainingOverride?: number,
  ) => {
    const target = entity ?? selected;
    if (!target) return;
    const remaining = typeof remainingOverride === 'number'
      ? remainingOverride
      : netPending(transactions);
    const msg = buildReceipt(tx, target.name, regSettings.shopName || '', remaining);
    const phone = target.phone || '';
    if (phone) {
      const href = waUrl(phone, msg);
      if (href) { window.open(href, '_blank', 'noopener,noreferrer'); return; }
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: msg }); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(msg);
      toast.success('Receipt copied');
    } catch {
      toast.error('Unable to share');
    }
  };

  const shareText = async (msg: string, phone?: string, copiedLabel = 'Copied') => {
    if (phone) {
      const href = waUrl(phone, msg);
      if (href) { window.open(href, '_blank', 'noopener,noreferrer'); return; }
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: msg }); return; } catch { /* user cancelled */ }
    }
    try { await navigator.clipboard.writeText(msg); toast.success(copiedLabel); }
    catch { toast.error('Unable to share'); }
  };

  /* ─── Template helpers ─── */
  const saveTemplates = (list: MessageTemplate[]) => {
    setTemplates(list);
    try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list)); } catch {/* ignore */}
  };

  const openTplPicker = () => {
    if (!selected) return;
    setShowTplPicker(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };

  const openNewTpl = () => {
    setEditingTpl(null);
    setTplDraftName('');
    setTplDraftBody('');
    setTplDraftFields([]);
    setShowTplEditor(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };

  const openEditTpl = (t: MessageTemplate) => {
    setEditingTpl(t);
    setTplDraftName(t.name);
    setTplDraftBody(t.body);
    setTplDraftFields(t.fields ? t.fields.map(f => ({ ...f })) : []);
    setShowTplEditor(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };

  const saveTpl = () => {
    const name = tplDraftName.trim();
    const body = tplDraftBody;
    if (!name) { toast.error('Template name required'); return; }
    if (!body.trim()) { toast.error('Message body required'); return; }
    const fields = tplDraftFields
      .map(f => ({ ...f, id: (f.id || '').trim(), label: (f.label || '').trim() }))
      .filter(f => f.id && f.label);
    if (editingTpl) {
      saveTemplates(templates.map(t => t.id === editingTpl.id ? { ...t, name, body, fields } : t));
      toast.success('Template updated');
    } else {
      saveTemplates([...templates, { id: 'tpl-' + Date.now(), name, body, fields }]);
      toast.success('Template added');
    }
    setShowTplEditor(false);
    setEditingTpl(null);
  };

  const addDraftField = () => {
    const idx = tplDraftFields.length + 1;
    const id = `field${idx}`;
    setTplDraftFields(prev => [...prev, { id, label: `Field ${idx}`, type: 'text' }]);
    setTplDraftBody(v => v + (v.endsWith('\n') || v === '' ? '' : '\n') + `${id}: {${id}}`);
  };
  const updateDraftField = (idx: number, patch: Partial<TemplateField>) => {
    setTplDraftFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };
  const removeDraftField = (idx: number) => {
    setTplDraftFields(prev => prev.filter((_, i) => i !== idx));
  };

  const deleteTpl = (id: string) => {
    if (!confirm('Delete this template?')) return;
    saveTemplates(templates.filter(t => t.id !== id));
    toast.success('Deleted');
  };

  const buildTplPreview = useCallback(
    (t: MessageTemplate, values: Record<string, string>) => {
      if (!selected) return '';
      const net = (selected.totalOwedToMe || 0) - (selected.totalIOweThemNumber || 0);
      const withCustom = applyFieldValues(t.body, t.fields, values);
      return applyPlaceholders(withCustom, {
        shopName: regSettings.shopName,
        customerName: selected.name,
        phone: selected.phone,
        due: net > 0 ? net : 0,
        net,
      });
    },
    [selected, regSettings.shopName],
  );

  const pickTpl = (t: MessageTemplate) => {
    if (!selected) return;
    const last = getLastValues(t.id);
    const initValues: Record<string, string> = {};
    (t.fields || []).forEach(f => { initValues[f.id] = last[f.id] || f.defaultValue || ''; });
    setTplPreviewTpl(t);
    setTplFieldValues(initValues);
    setTplBodyOverride(null);
    setTplPreview(buildTplPreview(t, initValues));
    setShowTplPicker(false);
    setShowTplPreview(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };

  const updateTplField = (fieldId: string, value: string) => {
    setTplFieldValues(prev => {
      const next = { ...prev, [fieldId]: value };
      if (tplPreviewTpl && tplBodyOverride === null) {
        setTplPreview(buildTplPreview(tplPreviewTpl, next));
      }
      return next;
    });
  };

  const onTplPreviewEdit = (value: string) => {
    setTplBodyOverride(value);
    setTplPreview(value);
  };

  const resetTplPreview = () => {
    if (!tplPreviewTpl) return;
    setTplBodyOverride(null);
    setTplPreview(buildTplPreview(tplPreviewTpl, tplFieldValues));
  };

  const sendTplPreview = async () => {
    if (!selected) return;
    if (tplPreviewTpl && tplPreviewTpl.fields?.length) {
      saveLastValues(tplPreviewTpl.id, tplFieldValues);
    }
    await shareText(tplPreview, selected.phone, 'Message copied');
    setShowTplPreview(false);
  };

  const copyTplPreview = async () => {
    try { await navigator.clipboard.writeText(tplPreview); toast.success('Copied'); }
    catch { toast.error('Copy failed'); }
  };

  /* ─── Import / Export helpers ─── */
  const exportTemplatesJson = async () => {
    const payload = { version: 1, templates, lists };
    const json = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      toast.success('Templates + lists copied as JSON');
    } catch {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try { await navigator.share({ text: json }); return; } catch {/* ignore */}
      }
      toast.error('Copy failed');
    }
  };
  const importTemplatesJson = () => {
    const text = importText.trim();
    if (!text) { toast.error('Paste JSON first'); return; }
    try {
      const parsed = JSON.parse(text);
      const incomingTpls: MessageTemplate[] = Array.isArray(parsed) ? parsed
        : Array.isArray(parsed.templates) ? parsed.templates : [];
      const incomingLists: NamedList[] = Array.isArray(parsed.lists) ? parsed.lists : [];
      if (incomingTpls.length === 0 && incomingLists.length === 0) {
        toast.error('No templates or lists found'); return;
      }
      const existingIds = new Set(templates.map(t => t.id));
      const mergedTpls = [...templates];
      for (const t of incomingTpls) {
        if (!t?.name || !t?.body) continue;
        const id = existingIds.has(t.id) ? 'tpl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) : t.id;
        mergedTpls.push({ ...t, id });
      }
      const existingListIds = new Set(lists.map(l => l.id));
      const mergedLists = [...lists];
      for (const l of incomingLists) {
        if (!l?.name || !Array.isArray(l.items)) continue;
        const id = existingListIds.has(l.id) ? 'lst-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) : l.id;
        mergedLists.push({ ...l, id });
      }
      saveTemplates(mergedTpls);
      saveLists(mergedLists);
      setImportText('');
      setShowImport(false);
      toast.success(`Imported ${incomingTpls.length} templates, ${incomingLists.length} lists`);
    } catch {
      toast.error('Invalid JSON');
    }
  };

  /* ─── Bulk send ─── */
  const openBulk = () => {
    setBulkTplId(templates[0]?.id || '');
    setBulkFilter('has_due');
    setBulkFieldValues({});
    setBulkSelected(new Set());
    setBulkSentIds(new Set());
    setShowBulk(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };
  const bulkTpl = useMemo(() => templates.find(t => t.id === bulkTplId), [templates, bulkTplId]);
  const bulkCandidates = useMemo(() => {
    return entities.filter(e => {
      if (!e.phone) return false;
      if (bulkFilter === 'has_due') return (e.totalOwedToMe - e.totalIOweThemNumber) > 0;
      if (bulkFilter === 'all_customers') return e.type === 'Customer';
      if (bulkFilter === 'all_suppliers') return e.type === 'Supplier';
      if (bulkFilter === 'all_employees') return e.type === 'Employee';
      return false;
    });
  }, [entities, bulkFilter]);
  useEffect(() => {
    if (!showBulk) return;
    setBulkSelected(new Set(bulkCandidates.map(e => e._id)));
    setBulkSentIds(new Set());
  }, [showBulk, bulkCandidates]);

  const toggleBulk = (id: string) => {
    setBulkSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const buildBulkMessage = (e: Entity) => {
    if (!bulkTpl) return '';
    const net = (e.totalOwedToMe || 0) - (e.totalIOweThemNumber || 0);
    const withCustom = applyFieldValues(bulkTpl.body, bulkTpl.fields, bulkFieldValues);
    return applyPlaceholders(withCustom, {
      shopName: regSettings.shopName,
      customerName: e.name,
      phone: e.phone,
      due: net > 0 ? net : 0,
      net,
    });
  };
  const sendBulkOne = (e: Entity) => {
    const msg = buildBulkMessage(e);
    if (!msg) { toast.error('Pick a template first'); return; }
    const href = waUrl(e.phone || '', msg);
    if (!href) { toast.error('No phone'); return; }
    window.open(href, '_blank', 'noopener,noreferrer');
    setBulkSentIds(prev => new Set(prev).add(e._id));
  };

  /* ─── Named list helpers ─── */
  const saveLists = (l: NamedList[]) => {
    setLists(l);
    try { localStorage.setItem(LISTS_KEY, JSON.stringify(l)); } catch {/* ignore */}
  };
  const addList = () => {
    const name = newListName.trim();
    if (!name) return;
    saveLists([...lists, { id: 'lst-' + Date.now(), name, items: [] }]);
    setNewListName('');
  };
  const deleteList = (id: string) => {
    if (!confirm('Delete this list? Templates using it will show a plain text field.')) return;
    saveLists(lists.filter(l => l.id !== id));
  };
  const addItemToList = (listId: string) => {
    const val = (newListItem[listId] || '').trim();
    if (!val) return;
    saveLists(lists.map(l => l.id === listId ? { ...l, items: [...l.items, val] } : l));
    setNewListItem(prev => ({ ...prev, [listId]: '' }));
  };
  const removeItemFromList = (listId: string, idx: number) => {
    saveLists(lists.map(l => l.id === listId ? { ...l, items: l.items.filter((_, i) => i !== idx) } : l));
  };

  const handleSendReminder = async (
    entity: Entity,
    pendingTxs?: Transaction[],
  ) => {
    const totalDue = (entity.totalOwedToMe || 0) - (entity.totalIOweThemNumber || 0);
    if (totalDue <= 0) { toast('No pending due for this customer'); return; }
    const msg = buildDueReminder(entity.name, totalDue, regSettings.shopName || '', pendingTxs);
    await shareText(msg, entity.phone, 'Reminder copied');
  };

  const handleAddTx = async () => {
    if (!selected || !tenantId) return;
    const amt = cart.length > 0 ? cartTotal : parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter valid amount'); return; }
    const autoNote = cart.length > 0
      ? cart.map(c => `${c.item.name} x${c.qty}`).join(', ')
      : addNote || undefined;
    setAddSaving(true);
    try {
      const res = await addTxOffline(tenantId, {
        entityId: selected._id, entityName: selected.name,
        amount: amt, direction: addDir,
        transactionDate: addDate, notes: autoNote,
        photo: addPhoto || undefined,
      });
      const savedForShare = {
        amount: amt, direction: addDir,
        transactionDate: addDate, notes: autoNote,
        status: 'Pending' as const,
      };
      const entityForShare = selected;
      const remainingAfterSave = netPending(transactions) + (addDir === 'INCOME' ? amt : -amt);
      toast.custom((t) => (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 shadow-lg rounded-xl px-3 py-2 border border-gray-200 dark:border-slate-700">
          <span className="text-[13px] text-gray-800 dark:text-slate-200">
            {res.queued ? 'Saved offline — will sync' : 'Saved'}
          </span>
          <button
            onClick={() => { toast.dismiss(t.id); handleSendTx(savedForShare, entityForShare, remainingAfterSave); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500 text-white text-[12px] font-semibold active:scale-95 transition"
          >
            <Send size={12} /> Send receipt
          </button>
        </div>
      ), { duration: 5000 });
      setShowAdd(false);
      setAddAmount(''); setAddNote(''); setCart([]); setAddPhoto('');
      setAddDate(new Date().toISOString().split('T')[0]);
      const updated = await getEntities(tenantId);
      setEntities(updated);
      const fresh = updated.find(e => e._id === selected._id);
      if (fresh) setSelected(fresh);
      await loadTx(fresh || selected);
    } catch (e) {
      const err = e as { message?: string };
      toast.error(err?.message || 'Failed to save');
    }
    finally { setAddSaving(false); }
  };

  const handleAddEntity = async () => {
    if (!tenantId || !newName || !newPhone) { toast.error('Name and phone required'); return; }
    setEntitySaving(true);
    try {
      const res = await createEntityOffline(tenantId, { name: newName, phone: newPhone, type: newType, profilePicture: newProfilePic || undefined });
      toast.success(res.queued ? 'Saved offline — will sync' : 'Added');
      setShowAddEntity(false); setNewName(''); setNewPhone(''); setNewProfilePic('');
      await loadEntities();
    } catch (e) {
      const err = e as { message?: string };
      toast.error(err?.message || 'Failed to add');
    }
    finally { setEntitySaving(false); }
  };

  const handleDeleteEntity = async (entity: Entity) => {
    if (!tenantId || !confirm(`Delete ${entity.name}?`)) return;
    try {
      const res = await deleteEntityOffline(tenantId, entity._id, entity.name);
      setSelected(null); setTx([]);
      await loadEntities();
      toast.success(res.queued ? 'Delete queued — will sync' : 'Deleted');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || 'Cannot delete — has transactions');
    }
  };

  const handleMarkPaid = async (tx: Transaction & { bal: number }) => {
    if (!tenantId || markingPaid) return;
    const newStatus = tx.status === 'Paid' ? 'Pending' : 'Paid';
    setMarkingPaid(tx._id);
    try {
      const res = await patchTxStatusOffline(tenantId, tx._id, newStatus);
      if (newStatus === 'Paid') {
        const paidTx = { ...tx, status: 'Paid' as const };
        const entityForShare = selected;
        const remaining = netPending(transactions) - (tx.direction === 'INCOME' ? tx.amount : -tx.amount);
        const label = res.queued ? 'Marked as paid — will sync' : 'Marked as paid';
        toast.custom((t) => (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 shadow-lg rounded-xl px-3 py-2 border border-gray-200 dark:border-slate-700">
            <span className="text-[13px] text-gray-800 dark:text-slate-200">{label}</span>
            <button
              onClick={() => { toast.dismiss(t.id); handleSendTx(paidTx, entityForShare, remaining); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500 text-white text-[12px] font-semibold active:scale-95 transition"
            >
              <Send size={12} /> Send thanks
            </button>
          </div>
        ), { duration: 5000 });
      } else {
        toast.success(res.queued ? 'Marked as pending — will sync' : 'Marked as pending');
      }
      // Optimistic local flip
      setTx(prev => prev.map(t => t._id === tx._id ? { ...t, status: newStatus } : t));
      if (!res.queued) {
        const updated = await getEntities(tenantId);
        setEntities(updated);
        const fresh = updated.find(e => e._id === selected?._id);
        if (fresh) setSelected(fresh);
        if (selected) await loadTx(fresh || selected);
      }
    } catch (e) {
      const err = e as { message?: string };
      toast.error(err?.message || 'Failed to update');
    }
    finally { setMarkingPaid(null); }
  };

  const toggleTxSelected = (id: string) => {
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedTxIds(new Set());

  const handleDeleteTx = async (tx: Transaction & { bal: number }) => {
    if (!tenantId) return;
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      const res = await deleteTxOffline(tenantId, tx._id, selected?._id);
      setTx(prev => prev.filter(t => t._id !== tx._id));
      toast.success(res.queued ? 'Delete queued — will sync' : 'Deleted');
      if (!res.queued && !isTempId(tx._id)) {
        const updated = await getEntities(tenantId);
        setEntities(updated);
        const fresh = updated.find(e => e._id === selected?._id);
        if (fresh) setSelected(fresh);
      }
    } catch (e) {
      const err = e as { message?: string };
      toast.error(err?.message || 'Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (!tenantId || bulkBusy || selectedTxIds.size === 0) return;
    const n = selectedTxIds.size;
    if (!confirm(`Delete ${n} transaction${n > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkBusy(true);
    const ids = Array.from(selectedTxIds);
    let ok = 0, failed = 0, queued = 0;
    for (const id of ids) {
      const t = transactions.find(x => x._id === id);
      if (!t) continue;
      try {
        const res = await deleteTxOffline(tenantId, id, selected?._id);
        if (res.queued) queued++; else ok++;
      } catch { failed++; }
    }
    setTx(prev => prev.filter(t => !selectedTxIds.has(t._id)));
    clearSelection();
    setBulkBusy(false);
    const parts: string[] = [];
    if (ok) parts.push(`${ok} deleted`);
    if (queued) parts.push(`${queued} queued`);
    if (failed) parts.push(`${failed} failed`);
    (failed ? toast.error : toast.success)(parts.join(' · ') || 'Done');
    if (ok > 0 && tenantId) {
      const updated = await getEntities(tenantId);
      setEntities(updated);
      const fresh = updated.find(e => e._id === selected?._id);
      if (fresh) setSelected(fresh);
    }
  };

  const handleBulkStatus = async (target: 'Paid' | 'Pending') => {
    if (!tenantId || bulkBusy || selectedTxIds.size === 0) return;
    setBulkBusy(true);
    const ids = Array.from(selectedTxIds);
    let ok = 0, failed = 0, queued = 0, skipped = 0;
    for (const id of ids) {
      const t = transactions.find(x => x._id === id);
      if (!t) continue;
      if (t.status === target) { skipped++; continue; }
      if (isTempId(id)) { skipped++; continue; }
      try {
        const res = await patchTxStatusOffline(tenantId, id, target);
        if (res.queued) queued++; else ok++;
      } catch { failed++; }
    }
    setTx(prev => prev.map(t => selectedTxIds.has(t._id) && !isTempId(t._id) ? { ...t, status: target } : t));
    clearSelection();
    setBulkBusy(false);
    const parts: string[] = [];
    if (ok) parts.push(`${ok} marked ${target.toLowerCase()}`);
    if (queued) parts.push(`${queued} queued`);
    if (skipped) parts.push(`${skipped} skipped`);
    if (failed) parts.push(`${failed} failed`);
    (failed ? toast.error : toast.success)(parts.join(' · ') || 'Done');
    if (ok > 0 && tenantId) {
      const updated = await getEntities(tenantId);
      setEntities(updated);
      const fresh = updated.find(e => e._id === selected?._id);
      if (fresh) setSelected(fresh);
    }
  };

  const startLongPress = (id: string) => {
    longPressFired.current = false;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      toggleTxSelected(id);
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleClaimReward = async () => {
    if (!selected || !tenantId || claimingReward) return;
    setClaimingReward(true);
    try {
      const updated = await claimRewardApi(tenantId, selected._id);
      setSelected(prev => prev ? { ...prev, rewardsClaimed: updated.rewardsClaimed } : prev);
      setEntities(prev => prev.map(e => e._id === selected._id ? { ...e, rewardsClaimed: updated.rewardsClaimed } : e));
      toast.success('Reward given');
    } catch (e) {
      const err = e as { message?: string };
      toast.error(err?.message || 'Failed to claim reward');
    } finally { setClaimingReward(false); }
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (selected || (txListRef.current?.scrollTop ?? 1) > 2) return;
    pullStartY.current = e.touches[0].clientY;
  }, [selected]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullStartY.current) return;
    const dist = e.touches[0].clientY - pullStartY.current;
    if (dist > 0) setPullDist(Math.min(dist * 0.5, PULL_THRESHOLD + 20));
    else pullStartY.current = 0;
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDist >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDist(0);
      await loadEntities();
      setRefreshing(false);
    } else {
      setPullDist(0);
    }
    pullStartY.current = 0;
  }, [pullDist, refreshing, loadEntities]);

  const handleExportPDF = async () => {
    if (!tenantId || exporting) return;
    setExporting(true);
    try {
      const allEntities: Entity[] = await getEntities(tenantId);
      const entityTxMap: Record<string, Transaction[]> = {};
      await Promise.all(allEntities.map(async e => {
        entityTxMap[e._id] = await getTx(tenantId, e._id);
      }));

      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = margin;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 165, 233);
      doc.text('DueBook', margin, y);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Exported: ${new Date().toLocaleString('en-GB')}`, pageW - margin, y, { align: 'right' });
      if (user?.email) {
        y += 5;
        doc.text(`Account: ${user.email}`, pageW - margin, y, { align: 'right' });
      }
      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      const totalGetAll = allEntities.reduce((s, e) => s + (e.totalOwedToMe || 0), 0);
      const totalGiveAll = allEntities.reduce((s, e) => s + (e.totalIOweThemNumber || 0), 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Summary', margin, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [['Total Entities', 'Will Get (Tk)', 'Will Give (Tk)', 'Net (Tk)']],
        body: [[
          allEntities.length,
          totalGetAll.toLocaleString('en-IN'),
          totalGiveAll.toLocaleString('en-IN'),
          (totalGetAll - totalGiveAll).toLocaleString('en-IN'),
        ]],
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      for (const type of TYPES) {
        const group = allEntities.filter(e => e.type === type);
        if (group.length === 0) continue;

        if (y > 240) { doc.addPage(); y = margin; }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(14, 165, 233);
        doc.text(`${labels[type]}s`, margin, y);
        y += 2;

        for (const entity of group) {
          if (y > 240) { doc.addPage(); y = margin; }
          y += 5;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(`${entity.name}${entity.phone ? '  •  ' + entity.phone : ''}`, margin, y);
          const net = entity.totalOwedToMe - entity.totalIOweThemNumber;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(net >= 0 ? 22 : 220, net >= 0 ? 163 : 38, net >= 0 ? 74 : 38);
          doc.text(`Get: ${entity.totalOwedToMe.toLocaleString('en-IN')}  |  Give: ${entity.totalIOweThemNumber.toLocaleString('en-IN')}  |  Net: ${net >= 0 ? '+' : ''}${net.toLocaleString('en-IN')}`, margin, y + 4);
          y += 7;

          const txs = entityTxMap[entity._id] || [];
          if (txs.length > 0) {
            const sorted = [...txs].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
            let bal = 0;
            const rows = sorted.map(tx => {
              if (tx.status === 'Pending') bal += tx.direction === 'INCOME' ? tx.amount : -tx.amount;
              return [
                fmtDate(tx.transactionDate),
                tx.direction === 'INCOME' ? 'They Owe' : 'I Owe',
                tx.amount.toLocaleString('en-IN'),
                tx.status === 'Pending' ? bal.toLocaleString('en-IN') : '-',
                tx.status,
                tx.notes || '',
              ];
            });
            autoTable(doc, {
              startY: y,
              head: [['Date', 'Type', 'Amount', 'Balance', 'Status', 'Items']],
              body: rows,
              theme: 'striped',
              headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 7.5 },
              bodyStyles: { fontSize: 7.5 },
              columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 18 }, 5: { cellWidth: 'auto' } },
              margin: { left: margin, right: margin },
              didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                  if (data.cell.raw === 'Paid') data.cell.styles.textColor = [22, 163, 74];
                  else if (data.cell.raw === 'Pending') data.cell.styles.textColor = [234, 88, 12];
                }
              },
            });
            y = (doc as any).lastAutoTable.finalY + 4;
          } else {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('No transactions', margin + 2, y);
            y += 5;
          }
        }
        y += 3;
      }

      doc.save(`DueBook-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const openAdd = (dir: 'INCOME' | 'EXPENSE') => {
    setAddDir(dir); setAddAmount(''); setAddNote(''); setCart([]);
    setAddDate(new Date().toISOString().split('T')[0]);
    setShowAdd(true);
    window.history.pushState({ duebook: 'modal' }, '');
  };

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0f172a' : '#f8fafc', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#00900a,#1e90ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>৳</span>
      </div>
      <div style={{ width: 28, height: 28, border: '3px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!user) return null;

  const canSave = cart.length > 0 ? cartTotal > 0 : !!addAmount;
  const saveLabel = cart.length > 0
    ? `Save  Tk ${cartTotal.toLocaleString('en-IN')}`
    : addAmount ? `Save  Tk ${parseFloat(addAmount).toLocaleString('en-IN')}` : 'Save';

  return (
    <div className={`h-screen flex flex-col bg-gray-50 dark:bg-slate-900 max-w-sm mx-auto relative overflow-hidden${isDark ? ' dark' : ''}`}>

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-3 h-10 flex items-center justify-between">
        {selected ? (
          <button onClick={() => { setSelected(null); setTx([]); }}
            className="flex items-center gap-1 text-sky-500 font-semibold text-[13px]">
            <ChevronLeft size={16} /> Back
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center overflow-hidden">
              {regSettings.shopLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={regSettings.shopLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[10px] font-bold">DB</span>
              )}
            </div>
            <span className="text-[14px] font-bold text-gray-900 dark:text-slate-100 truncate max-w-[140px]">
              {regSettings.shopName?.trim() || 'DueBook'}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {!selected && (
            <>
              <button onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchRef.current?.focus(), 50); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700">
                <Search size={15} />
              </button>
              <ReminderInbox isDark={isDark} />
              <button onClick={() => { setNewType(tab); setShowAddEntity(true); window.history.pushState({ duebook: 'modal' }, ''); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-500 text-white">
                <UserPlus size={13} />
              </button>
            </>
          )}
          {selected && (
            <>
              <button onClick={openEditEntity}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDeleteEntity(selected)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                <Trash2 size={14} />
              </button>
            </>
          )}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(v => !v)} aria-label="Menu"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700">
              <Menu size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-50 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-[13px]">
                {!selected && (
                  <>
                    <button onClick={() => { setShowMenu(false); setShowInventory(true); window.history.pushState({ duebook: 'modal' }, ''); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <Package size={14} className="text-gray-500 dark:text-slate-400" /> Inventory
                    </button>
                    <button onClick={() => { setShowMenu(false); handleExportPDF(); }} disabled={exporting}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
                      {exporting
                        ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        : <Download size={14} className="text-gray-500 dark:text-slate-400" />}
                      {exporting ? 'Exporting…' : 'Export PDF'}
                    </button>
                    <button onClick={() => { setShowMenu(false); openBulk(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <Users size={14} className="text-gray-500 dark:text-slate-400" /> Bulk Send
                    </button>
                    <button onClick={() => { setShowMenu(false); lockOn(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <Lock size={14} className="text-gray-500 dark:text-slate-400" /> Lock Screen
                    </button>
                    <button onClick={() => { toggleDark(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                      {isDark ? <Sun size={14} className="text-gray-500 dark:text-slate-400" /> : <Moon size={14} className="text-gray-500 dark:text-slate-400" />}
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button onClick={() => { setShowMenu(false); openSettings(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <Settings size={14} className="text-gray-500 dark:text-slate-400" /> Settings
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-slate-700" />
                  </>
                )}
                <button onClick={() => { setShowMenu(false); logout(); router.replace('/login'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SYNC / OFFLINE BAR ── */}
      <SyncBar isOnline={isOnline} onSynced={() => { loadEntities(); if (selected) loadTx(selected); }} />

      {/* ── SUMMARY ROW ── */}
      {!selected && (
        <div className="flex-shrink-0 flex gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
          <div className="flex-1 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg px-2.5 py-1.5">
            <TrendingUp size={12} className="text-green-600 shrink-0" />
            <div>
              <p className="text-[10px] text-green-700 dark:text-green-400 font-medium leading-none">Will Get</p>
              <p className="text-[13px] font-bold text-green-700 dark:text-green-400 tabular-nums leading-tight">{fmt(totalGet)}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg px-2.5 py-1.5">
            <TrendingDown size={12} className="text-red-600 shrink-0" />
            <div>
              <p className="text-[10px] text-red-700 dark:text-red-400 font-medium leading-none">Will Give</p>
              <p className="text-[13px] font-bold text-red-700 dark:text-red-400 tabular-nums leading-tight">{fmt(totalGive)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ENTITY TABS ── */}
      {!selected && (
        <>
          <div className="flex-shrink-0 flex bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
            {TYPES.map(t => (
              <button key={t} onClick={() => { setTab(t); if (txListRef.current) txListRef.current.scrollTop = 0; }}
                className={`flex-1 py-2 text-[12px] font-semibold border-b-2 transition-colors ${
                  tab === t ? 'text-sky-500 border-sky-500' : 'text-gray-400 dark:text-slate-500 border-transparent'
                }`}>
                {labels[t]}
              </button>
            ))}
          </div>
          {showSearch && (
            <div className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5">
                <Search size={13} className="text-gray-400 dark:text-slate-500 shrink-0" />
                <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${labels[tab].toLowerCase()}s…`}
                  className="flex-1 bg-transparent text-[12px] outline-none border-none text-gray-900 dark:text-slate-100"
                  style={{ background: 'transparent' }}
                />
                {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-400 dark:text-slate-500" /></button>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ENTITY DETAIL HEADER ── */}
      {selected && (() => {
        const totalPaid = transactions
          .filter(t => t.direction === 'INCOME' && t.status === 'Paid')
          .reduce((s, t) => s + (t.amount || 0), 0);
        const threshold = Number(regSettings.paymentRewardThreshold) || 0;
        const claimed = Number(selected.rewardsClaimed) || 0;
        const earned = threshold > 0 ? Math.floor(totalPaid / threshold) : 0;
        const rewardsDue = Math.max(0, earned - claimed);
        const showRewardBlock = selected.type === 'Customer'
          && threshold > 0
          && !!regSettings.rewardItemName;
        const nextRemaining = threshold > 0 ? threshold - (totalPaid % threshold) : 0;
        return (
        <div className="flex-shrink-0 px-3 py-2 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            {selected.profilePicture ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={selected.profilePicture} alt={selected.name}
                className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0"
                style={{ background: avatarColor(selected.name) }}>
                {initial(selected.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900 dark:text-slate-100 truncate">{selected.name}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">{selected.phone || labels[selected.type]}</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            <div className="flex-1 text-center bg-green-50 dark:bg-green-900/30 rounded-lg py-1.5">
              <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Get</p>
              <p className="text-[13px] font-bold text-green-700 dark:text-green-400 tabular-nums">{fmt(selected.totalOwedToMe)}</p>
            </div>
            <div className="flex-1 text-center bg-red-50 dark:bg-red-900/30 rounded-lg py-1.5">
              <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">Give</p>
              <p className="text-[13px] font-bold text-red-700 dark:text-red-400 tabular-nums">{fmt(selected.totalIOweThemNumber)}</p>
            </div>
            <div className="flex-1 text-center bg-gray-50 dark:bg-slate-700 rounded-lg py-1.5">
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Net</p>
              <p className={`text-[13px] font-bold tabular-nums ${(selected.totalOwedToMe - selected.totalIOweThemNumber) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {fmt(selected.totalOwedToMe - selected.totalIOweThemNumber)}
              </p>
            </div>
            {selected.type === 'Customer' && (
              <div className="flex-1 text-center bg-emerald-50 dark:bg-emerald-900/30 rounded-lg py-1.5">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Paid</p>
                <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{fmt(totalPaid)}</p>
              </div>
            )}
          </div>
          {(selected.totalOwedToMe - selected.totalIOweThemNumber) > 0 && (
            <button
              onClick={() => handleSendReminder(selected, transactions)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[12px] font-bold border border-amber-200 dark:border-amber-800 active:scale-[0.98] transition"
              title={selected.phone ? 'Send WhatsApp due reminder' : 'Share due reminder'}
            >
              <Bell size={13} />
              Send Due Reminder — {fmt(selected.totalOwedToMe - selected.totalIOweThemNumber)}
            </button>
          )}
          {showRewardBlock && rewardsDue > 0 && (
            <div className="mt-2 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
              <Gift size={16} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold leading-tight truncate">
                  Reward due{rewardsDue > 1 ? ` × ${rewardsDue}` : ''}: {regSettings.rewardItemName}
                </p>
                <p className="text-[10px] opacity-90 leading-tight">Paid Tk {fmt(totalPaid)} · earned every Tk {fmt(threshold)}</p>
              </div>
              <button
                onClick={handleClaimReward}
                disabled={claimingReward}
                className="shrink-0 px-2.5 py-1 rounded-md bg-white/95 text-emerald-700 text-[11px] font-bold active:scale-95 disabled:opacity-60"
              >
                {claimingReward ? '…' : 'Mark given'}
              </button>
            </div>
          )}
          {showRewardBlock && rewardsDue === 0 && totalPaid > 0 && (
            <p className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400/80 text-center">
              <Gift size={10} className="inline -mt-0.5" /> Tk {fmt(nextRemaining)} more paid to earn a free {regSettings.rewardItemName || 'item'}
            </p>
          )}
          <button
            onClick={openTplPicker}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-[12px] font-bold border border-sky-200 dark:border-sky-800 active:scale-[0.98] transition"
            title="Send custom message from template"
          >
            <MessageSquare size={13} />
            Send Custom Message
          </button>
        </div>
        );
      })()}

      {/* ── SCROLL AREA ── */}
      <div
        ref={txListRef}
        className="flex-1 overflow-y-auto scroll-view"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!selected && (pullDist > 0 || refreshing) && (
          <div className="flex items-center justify-center" style={{ height: refreshing ? 48 : pullDist, overflow: 'hidden' }}>
            <div
              className={`ptr-spinner${refreshing ? ' spinning' : ''}`}
              style={{ transform: refreshing ? undefined : `rotate(${pullDist * 4}deg)`, opacity: Math.min(pullDist / PULL_THRESHOLD, 1) }}
            />
          </div>
        )}

        {/* Entity list */}
        {!selected && (
          loading ? (
            <div className="p-2 space-y-1.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-2.5 bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                  <div className="h-3.5 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                <UserPlus size={20} className="text-gray-400 dark:text-slate-500" />
              </div>
              <p className="text-[13px] font-semibold text-gray-700 dark:text-slate-200 mb-1">
                {search ? `No results for "${search}"` : `No ${labels[tab].toLowerCase()}s yet`}
              </p>
              {!search && (
                <button onClick={() => { setNewType(tab); setShowAddEntity(true); window.history.pushState({ duebook: 'modal' }, ''); }}
                  className="mt-2 px-4 py-1.5 bg-sky-500 text-white rounded-lg text-[12px] font-bold">
                  + Add {labels[tab]}
                </button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map(entity => {
                const net = (entity.totalOwedToMe || 0) - (entity.totalIOweThemNumber || 0);
                const total = (entity.totalOwedToMe || 0) + (entity.totalIOweThemNumber || 0);
                const waHref = entity.phone
                  ? waUrl(
                      entity.phone,
                      net > 0
                        ? buildDueReminder(entity.name, net, regSettings.shopName || '')
                        : `Hi ${entity.name}, we miss you at our shop! Come by soon for a special offer.`
                    )
                  : '';
                return (
                  <div key={entity._id} onClick={() => selectEntity(entity)}
                    role="button"
                    className="w-full flex items-center gap-2.5 bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:bg-gray-50 dark:active:bg-slate-700 transition cursor-pointer">
                    <div className="relative shrink-0">
                      {entity.profilePicture ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={entity.profilePicture} alt={entity.name}
                          className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[12px]"
                          style={{ background: avatarColor(entity.name) }}>
                          {initial(entity.name)}
                        </div>
                      )}
                      {pinned.has(entity._id) && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                          <Pin size={8} className="text-white" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-slate-100 truncate">{entity.name}</p>
                        {isTempId(entity._id) && (
                          <span title="Waiting to sync" className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                            <CloudOff size={9} /> SYNC
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{entity.phone || labels[entity.type]}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); togglePin(entity._id); }}
                      title={pinned.has(entity._id) ? 'Unpin' : 'Pin to top'}
                      className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition ${
                        pinned.has(entity._id)
                          ? 'text-amber-500 active:bg-amber-50 dark:active:bg-amber-900/30'
                          : 'text-gray-300 dark:text-slate-600 active:bg-gray-100 dark:active:bg-slate-700'
                      }`}
                    >
                      {pinned.has(entity._id) ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <div className="text-right shrink-0">
                      {total > 0 ? (
                        <>
                          <p className={`text-[13px] font-bold tabular-nums ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {net >= 0 ? '+' : '-'}{fmt(net)}
                          </p>
                          <p className={`text-[10px] font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {net >= 0 ? 'to get' : 'to pay'}
                          </p>
                        </>
                      ) : (
                        <p className="text-[12px] text-gray-300 dark:text-slate-600 font-medium">Clear</p>
                      )}
                    </div>
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        title={net > 0 ? 'Send WhatsApp reminder' : 'Send WhatsApp offer'}
                        className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 shrink-0">
                        <MessageCircle size={15} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Transaction list */}
        {selected && (
          txLoading ? (
            <div className="p-2 space-y-1.5">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : txWithBal.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-[13px] font-semibold text-gray-600 dark:text-slate-300 mb-1">No transactions yet</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">Use buttons below to record</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {txWithBal.map((tx, i) => {
                const isPaid = tx.status === 'Paid';
                const isMarking = markingPaid === tx._id;
                const isChecked = selectedTxIds.has(tx._id);
                return (
                  <div
                    key={tx._id || i}
                    onPointerDown={() => startLongPress(tx._id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    onClick={(e) => {
                      if (longPressFired.current) { longPressFired.current = false; e.preventDefault(); return; }
                      if (isSelectMode) { e.preventDefault(); toggleTxSelected(tx._id); }
                    }}
                    className={`rounded-xl overflow-hidden flex shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-opacity ${isChecked ? 'ring-2 ring-sky-500' : ''} ${isPaid ? 'opacity-60' : 'bg-white dark:bg-slate-800'} select-none`}
                    style={{ background: isChecked ? (isDark ? '#0c2740' : '#e0f2fe') : isPaid ? (isDark ? '#1e293b' : '#f9fafb') : undefined }}>
                    <div className={`w-1 shrink-0 ${isPaid ? 'bg-gray-300 dark:bg-slate-600' : tx.direction === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 flex items-center gap-2 px-2.5 py-2">
                      {isSelectMode && (
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                          {isChecked
                            ? <CheckCircle2 size={20} className="text-sky-500" />
                            : <Circle size={20} className="text-gray-300 dark:text-slate-600" />}
                        </div>
                      )}
                      {tx.photo && !isSelectMode && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={tx.photo} alt="tx"
                          onClick={(e) => { e.stopPropagation(); setShowPhotoViewer(tx.photo!); }}
                          className="w-9 h-9 rounded-lg object-cover cursor-pointer shrink-0 border border-gray-200 dark:border-slate-600" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[11px] ${isPaid ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 dark:text-slate-400'}`}>{fmtDate(tx.transactionDate)}</p>
                          {isPaid && <span className="text-[9px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1 rounded">PAID</span>}
                          {isTempId(tx._id) && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 px-1 rounded inline-flex items-center gap-0.5"><CloudOff size={9} /> SYNC</span>}
                        </div>
                        {tx.notes && <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate mt-0.5">{tx.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[13px] font-bold tabular-nums ${isPaid ? 'text-gray-400 dark:text-slate-500 line-through' : tx.direction === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {tx.direction === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                        </p>
                        {!isPaid && <p className="text-[10px] text-gray-400 dark:text-slate-500 tabular-nums">bal: {fmt(tx.bal)}</p>}
                      </div>
                      {!isSelectMode && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendTx(tx); }}
                            title={selected?.phone ? 'Send receipt via WhatsApp' : 'Share receipt'}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-sky-500 dark:text-sky-400 active:bg-sky-50 dark:active:bg-sky-900/30 transition"
                          >
                            <Send size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(tx); }}
                            disabled={!!markingPaid}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg active:bg-gray-100 dark:active:bg-slate-700 transition"
                          >
                            {isMarking
                              ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              : isPaid
                                ? <CheckCircle2 size={18} className="text-green-500" />
                                : <Circle size={18} className="text-gray-300 dark:text-slate-600" />
                            }
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx); }}
                            title="Delete transaction"
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-red-400 dark:text-red-500 active:bg-red-50 dark:active:bg-red-900/30 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── BOTTOM ACTION BAR (entity selected) ── */}
      {selected && !isSelectMode && (
        <div className="flex-shrink-0 grid grid-cols-2 gap-2 px-3 py-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
          <button onClick={() => openAdd('INCOME')}
            className="py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-green-600 text-white text-[13px] font-bold shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-1">
            <TrendingUp size={14} /> They Owe
          </button>
          <button onClick={() => openAdd('EXPENSE')}
            className="py-2.5 rounded-xl bg-gradient-to-r from-red-400 to-red-600 text-white text-[13px] font-bold shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-1">
            <TrendingDown size={14} /> I Owe
          </button>
        </div>
      )}

      {/* ── BULK ACTION BAR (select mode) ── */}
      {selected && isSelectMode && (
        <div className="flex-shrink-0 flex items-center gap-2 px-2 py-2 bg-sky-50 dark:bg-sky-950/40 border-t border-sky-200 dark:border-sky-800">
          <button onClick={clearSelection} disabled={bulkBusy}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-slate-300 active:bg-gray-200 dark:active:bg-slate-700"
            title="Cancel">
            <X size={18} />
          </button>
          <span className="shrink-0 text-[12px] font-bold text-sky-700 dark:text-sky-300 tabular-nums">
            {selectedTxIds.size} selected
          </span>
          <div className="flex-1" />
          <button onClick={() => {
              const allIds = txWithBal.map(t => t._id);
              const allSelected = allIds.every(id => selectedTxIds.has(id));
              setSelectedTxIds(allSelected ? new Set() : new Set(allIds));
            }}
            disabled={bulkBusy || txWithBal.length === 0}
            className="shrink-0 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-sky-700 dark:text-sky-300 active:bg-sky-100 dark:active:bg-sky-900/40">
            {txWithBal.length > 0 && txWithBal.every(t => selectedTxIds.has(t._id)) ? 'None' : 'All'}
          </button>
          <button onClick={() => handleBulkStatus('Paid')} disabled={bulkBusy}
            className="shrink-0 px-2.5 py-2 rounded-lg bg-green-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 disabled:opacity-50">
            <CheckCircle2 size={13} /> Paid
          </button>
          <button onClick={() => handleBulkStatus('Pending')} disabled={bulkBusy}
            className="shrink-0 px-2.5 py-2 rounded-lg bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 disabled:opacity-50">
            <Circle size={13} /> Pending
          </button>
          <button onClick={handleBulkDelete} disabled={bulkBusy}
            className="shrink-0 px-2.5 py-2 rounded-lg bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 disabled:opacity-50">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {/* ── FAB (entity list) ── */}
      {!selected && (
        <button onClick={() => openAdd('INCOME')}
          className="absolute bottom-4 right-3 w-12 h-12 rounded-full bg-sky-500 shadow-lg shadow-sky-200 flex items-center justify-center active:scale-95 transition z-30">
          <Plus size={22} className="text-white" />
        </button>
      )}

      {/* ══════════════════════════════════════
          ADD TRANSACTION SHEET
          ══════════════════════════════════════ */}
      {showAdd && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-inner sheet-slide-up flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Fixed header */}
            <div className="flex-shrink-0">
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2 pt-1">
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">
                  {addDir === 'INCOME' ? 'They Owe Me' : 'I Owe Them'}
                </h3>
                <button onClick={() => setShowAdd(false)} className="w-6 h-6 flex items-center justify-center rounded-lg">
                  <X size={15} className="text-gray-400 dark:text-slate-500" />
                </button>
              </div>
              {/* direction toggle */}
              <div className="flex gap-1.5 px-4 pb-3">
                <button onClick={() => setAddDir('INCOME')}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold border-2 transition-all ${
                    addDir === 'INCOME' ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400 shadow-sm' : 'border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                  }`}>
                  <TrendingUp size={13} className="inline mr-1 -mt-0.5" />They Owe
                </button>
                <button onClick={() => setAddDir('EXPENSE')}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-bold border-2 transition-all ${
                    addDir === 'EXPENSE' ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400 shadow-sm' : 'border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                  }`}>
                  <TrendingDown size={13} className="inline mr-1 -mt-0.5" />I Owe
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto scroll-view px-4 pb-2 space-y-3">

              {/* ── Quick-add item grid ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Quick Add</span>
                  <button onClick={() => { setShowCatalog(true); window.history.pushState({ duebook: 'catalog' }, ''); }}
                    className="text-[10px] text-sky-500 font-semibold">
                    Edit items
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {sortedCatalog.map(item => {
                    const inCart = cart.find(c => c.item.id === item.id);
                    return (
                      <button key={item.id} onClick={() => addToCart(item)}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition active:scale-95 ${
                          inCart
                            ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30'
                            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700'
                        }`}>
                        <span className="text-[13px] font-bold text-gray-800 dark:text-slate-200">{item.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">Tk {item.price}</span>
                        {inCart && (
                          <span className="text-[10px] font-bold text-sky-600 mt-0.5 bg-sky-100 dark:bg-sky-900/40 px-1.5 rounded-full">×{inCart.qty}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Cart summary ── */}
              {cart.length > 0 && (
                <div className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 rounded-xl px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400">Cart</span>
                    <button onClick={() => setCart([])}
                      className="text-[10px] text-red-400 font-semibold">Clear</button>
                  </div>
                  {cart.map(c => (
                    <div key={c.item.id} className="flex items-center gap-2">
                      <span className="flex-1 text-[12px] text-gray-700 dark:text-slate-200 font-medium">{c.item.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => decrementCart(c.item.id)}
                          className="w-5 h-5 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center active:bg-gray-100 dark:active:bg-slate-600">
                          <Minus size={9} className="text-gray-500 dark:text-slate-400" />
                        </button>
                        <span className="text-[12px] font-bold tabular-nums w-4 text-center text-gray-800 dark:text-slate-200">{c.qty}</span>
                        <button onClick={() => addToCart(c.item)}
                          className="w-5 h-5 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center active:bg-gray-100 dark:active:bg-slate-600">
                          <Plus size={9} className="text-gray-500 dark:text-slate-400" />
                        </button>
                      </div>
                      <span className="text-[12px] font-bold text-gray-700 dark:text-slate-200 tabular-nums w-16 text-right">
                        Tk {(c.item.price * c.qty).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-sky-200 dark:border-sky-800 pt-1.5 flex justify-between items-center">
                    <span className="text-[12px] font-bold text-sky-700 dark:text-sky-400">Total</span>
                    <span className="text-[15px] font-bold text-sky-700 dark:text-sky-400 tabular-nums">Tk {cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* ── Manual amount (when no cart items) ── */}
              {cart.length === 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Amount (Tk) *</label>
                  <input type="number" inputMode="decimal" value={addAmount}
                    onChange={e => setAddAmount(e.target.value)} placeholder="0.00"
                    className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-[22px] font-bold tabular-nums text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 transition"
                  />
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 no-scrollbar">
                    {[10, 20, 50, 100, 200].map(chip => (
                      <button key={chip}
                        onClick={() => setAddAmount(v => String((parseFloat(v) || 0) + chip))}
                        className="shrink-0 px-3 py-1 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-[11px] font-semibold text-sky-600 dark:text-sky-400 active:bg-sky-100 transition">
                        +{chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Date ── */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Date</label>
                <div className="flex gap-1.5 items-center">
                  <button onClick={() => setAddDate(TODAY)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition shrink-0 ${
                      addDate === TODAY ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-400 text-sky-700 dark:text-sky-400' : 'border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                    }`}>Today</button>
                  <button onClick={() => setAddDate(YESTERDAY)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition shrink-0 ${
                      addDate === YESTERDAY ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-400 text-sky-700 dark:text-sky-400' : 'border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                    }`}>Yesterday</button>
                  <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                    className="flex-1 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-[12px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 min-w-0"
                  />
                </div>
              </div>

              {/* ── Note (only for manual mode) ── */}
              {cart.length === 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Note (optional)</label>
                  <input type="text" value={addNote} onChange={e => setAddNote(e.target.value)}
                    placeholder="e.g. Chai x2, Coke x1"
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
                  />
                </div>
              )}

              {/* ── Photo capture (optional) ── */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Photo (optional)</label>
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                    {addPhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={addPhoto} alt="Item" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="w-full py-1.5 rounded-lg border-2 border-dashed border-sky-300 dark:border-sky-700 text-sky-500 dark:text-sky-400 text-[11px] font-bold flex items-center justify-center cursor-pointer active:scale-[0.98] transition">
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={async e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          if (f.size > 300 * 1024) { toast.error('Max 300 KB — please resize'); return; }
                          setAddPhoto(await fileToDataUrl(f));
                        }}
                      />
                      {addPhoto ? 'Change Photo' : 'Capture / Attach Photo'}
                    </label>
                    {addPhoto && (
                      <button onClick={() => setAddPhoto('')}
                        className="w-full py-1 rounded-lg text-[10px] font-semibold text-red-500 border border-red-200 dark:border-red-800">
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Snap the item or receipt for future proof.</p>
              </div>
            </div>

            {/* Sticky save button */}
            <div className="flex-shrink-0 px-4 pt-2 pb-5">
              <button onClick={handleAddTx} disabled={addSaving || !canSave}
                className={`w-full py-3 rounded-xl text-white text-[14px] font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                  addDir === 'INCOME'
                    ? 'bg-gradient-to-r from-green-400 to-green-600'
                    : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}>
                {addSaving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : saveLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MANAGE ITEMS (CATALOG) SHEET
          ══════════════════════════════════════ */}
      {showCatalog && (
        <div className="absolute inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowCatalog(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[80dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Manage Items</h3>
              <button onClick={() => setShowCatalog(false)} className="w-6 h-6 flex items-center justify-center">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>

            {/* Add new item row */}
            <div className="px-4 pb-2">
              <div className="flex gap-2">
                <input
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCatalogItem()}
                  placeholder="Item name"
                  className="flex-1 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-sky-400"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCatalogItem()}
                  placeholder="Price"
                  className="w-20 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-sky-400"
                />
                <button onClick={addCatalogItem}
                  className="px-3 py-2 bg-sky-500 text-white rounded-xl text-[13px] font-bold active:scale-95 transition">
                  Add
                </button>
              </div>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-4 pb-5 space-y-1.5">
              {catalog.length === 0 && (
                <p className="text-center text-[12px] text-gray-400 dark:text-slate-500 py-6">No items yet. Add some above.</p>
              )}
              {catalog.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-xl px-3 py-2.5">
                  <span className="flex-1 text-[13px] font-semibold text-gray-800 dark:text-slate-200">{item.name}</span>
                  <span className="text-[12px] text-gray-500 dark:text-slate-400 tabular-nums font-medium">Tk {item.price}</span>
                  <button onClick={() => removeCatalogItem(item.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 active:bg-red-50 dark:active:bg-red-900/30 transition">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          ADD ENTITY SHEET
          ══════════════════════════════════════ */}
      {showAddEntity && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={() => setShowAddEntity(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Add Contact</h3>
              <button onClick={() => setShowAddEntity(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="px-4 pb-5 space-y-2.5">
              <div className="flex gap-1.5">
                {TYPES.map(t => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border-2 transition ${
                      newType === t ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' : 'border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                    }`}>{labels[t]}</button>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                  {newProfilePic ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={newProfilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400">No photo</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="w-full py-1.5 rounded-lg border-2 border-dashed border-sky-300 dark:border-sky-700 text-sky-500 dark:text-sky-400 text-[11px] font-bold flex items-center justify-center cursor-pointer active:scale-[0.98] transition">
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        if (f.size > 300 * 1024) { toast.error('Max 300 KB — please resize'); return; }
                        setNewProfilePic(await fileToDataUrl(f));
                      }}
                    />
                    {newProfilePic ? 'Change Photo' : 'Add Profile Photo (≤300 KB)'}
                  </label>
                  {newProfilePic && (
                    <button onClick={() => setNewProfilePic('')}
                      className="w-full py-1 rounded-lg text-[10px] font-semibold text-red-500 border border-red-200 dark:border-red-800">
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Full name *" autoFocus
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
              />
              <input type="tel" inputMode="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                placeholder="Phone number *"
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
              />
              <button onClick={handleAddEntity} disabled={entitySaving || !newName || !newPhone}
                className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center">
                {entitySaving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT ENTITY SHEET
          ══════════════════════════════════════ */}
      {showEditEntity && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={() => setShowEditEntity(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Edit Contact</h3>
              <button onClick={() => setShowEditEntity(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="px-4 pb-5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                  {editProfilePic ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={editProfilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400">No photo</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="w-full py-1.5 rounded-lg border-2 border-dashed border-sky-300 dark:border-sky-700 text-sky-500 dark:text-sky-400 text-[11px] font-bold flex items-center justify-center cursor-pointer active:scale-[0.98] transition">
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        if (f.size > 300 * 1024) { toast.error('Max 300 KB — please resize'); return; }
                        setEditProfilePic(await fileToDataUrl(f));
                      }}
                    />
                    {editProfilePic ? 'Change Photo' : 'Add Profile Photo (≤300 KB)'}
                  </label>
                  {editProfilePic && (
                    <button onClick={() => setEditProfilePic('')}
                      className="w-full py-1 rounded-lg text-[10px] font-semibold text-red-500 border border-red-200 dark:border-red-800">
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                placeholder="Full name *" autoFocus
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
              />
              <input type="tel" inputMode="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
              />
              <button onClick={handleEditEntity} disabled={editSaving || !editName.trim()}
                className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center">
                {editSaving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          INVENTORY SHEET
          ══════════════════════════════════════ */}
      <InventoryModal
        open={showInventory}
        onClose={() => setShowInventory(false)}
        isDark={isDark}
        entities={entities}
        onSaleRecorded={() => { loadEntities(); if (selected) loadTx(selected); }}
      />

      {/* ══════════════════════════════════════
          SETTINGS SHEET
          ══════════════════════════════════════ */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            {/* Tab bar */}
            <div className="flex-shrink-0 flex gap-1 px-3 pb-2 pt-1 border-b border-gray-100 dark:border-slate-700">
              {SETTINGS_TABS.map(tab => (
                <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                    settingsTab === tab.id
                      ? 'bg-sky-500 text-white'
                      : 'text-gray-500 dark:text-slate-400 active:bg-gray-100 dark:active:bg-slate-700'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto scroll-view px-4 pb-5 pt-3 space-y-4">
              {settingsTab === 'general' && (
                <>
              {/* Dark mode toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-gray-700 dark:text-slate-200">Dark Mode</span>
                <button
                  onClick={toggleDark}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-sky-500' : 'bg-gray-200 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Rename tabs */}
              <div>
                <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Rename Tabs</p>
                <div className="space-y-2">
                  {TYPES.map(t => (
                    <div key={t} className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-500 dark:text-slate-400 w-20 shrink-0">{t}</span>
                      <input
                        type="text"
                        value={draftLabels[t]}
                        onChange={e => setDraftLabels(prev => ({ ...prev, [t]: e.target.value }))}
                        placeholder={t}
                        className="flex-1 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveLabels}
                className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold active:scale-[0.98] transition-all">
                Save Labels
              </button>

              {/* Share view link */}
              {tenantId && (
                <div>
                  <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">View Link</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-2">Share this link with family / manager. They can see all dues — read-only, no login needed.</p>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/view/${tenantId}`;
                      navigator.clipboard.writeText(url).then(() => {
                        const el = document.getElementById('copy-link-btn');
                        if (el) { el.textContent = 'Copied!'; setTimeout(() => { if (el) el.textContent = 'Copy View Link'; }, 2000); }
                      });
                    }}
                    id="copy-link-btn"
                    className="w-full py-2.5 rounded-xl border-2 border-sky-400 text-sky-500 dark:text-sky-400 text-[13px] font-bold active:scale-[0.98] transition-all">
                    Copy View Link
                  </button>
                </div>
              )}

              {/* Account Recovery */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
                <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Account Recovery
                </p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-2">
                  {recoveryHasSet
                    ? 'A security question is set. Change it below (requires your current password).'
                    : 'No security question set. Without this, forgot-password is disabled for your account.'}
                </p>
                {recoveryHasSet && recoveryCurrentQ && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 mb-2">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Current question</p>
                    <p className="text-[12px] text-gray-800 dark:text-slate-200">{recoveryCurrentQ}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <input type="password" value={recPassword} onChange={e => setRecPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-700"
                  />
                  <input type="text" value={recQuestion} onChange={e => setRecQuestion(e.target.value)}
                    placeholder="Security question"
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-700"
                  />
                  <input type="text" value={recAnswer} onChange={e => setRecAnswer(e.target.value)}
                    placeholder="Your answer"
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-700"
                  />
                  <button onClick={saveRecovery} disabled={recSaving}
                    className="w-full py-2 rounded-lg bg-sky-500 text-white text-[12px] font-bold disabled:opacity-60 active:scale-[0.98] transition">
                    {recSaving ? 'Saving…' : (recoveryHasSet ? 'Update Recovery' : 'Set Recovery')}
                  </button>
                </div>
              </div>
                </>
              )}

              {settingsTab === 'business' && tenantId && (
                <>
              {/* Customer self-registration */}
              {tenantId && (
                <div>
                  <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1.5">
                    <Gift size={13} /> Customer Registration
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-3">
                    Share a QR / link. Customers register themselves and get a welcome credit.
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-semibold text-gray-700 dark:text-slate-200">Enable self-registration</span>
                    <button
                      onClick={() => setDraftReg(p => ({ ...p, registrationEnabled: !p.registrationEnabled }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${draftReg.registrationEnabled ? 'bg-sky-500' : 'bg-gray-200 dark:bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${draftReg.registrationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Shop Name</label>
                      <input
                        type="text"
                        value={draftReg.shopName}
                        onChange={e => setDraftReg(p => ({ ...p, shopName: e.target.value }))}
                        placeholder="e.g. Karim Store"
                        className="mt-0.5 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Shop Logo</label>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                          {draftReg.shopLogo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={draftReg.shopLogo} alt="Shop logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400">No logo</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="w-full py-1.5 rounded-lg border-2 border-dashed border-sky-300 dark:border-sky-700 text-sky-500 dark:text-sky-400 text-[11px] font-bold flex items-center justify-center cursor-pointer active:scale-[0.98] transition">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async e => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                if (f.size > 300 * 1024) { toast.error('Max 300 KB — please resize'); return; }
                                const dataUrl = await new Promise<string>((resolve, reject) => {
                                  const r = new FileReader();
                                  r.onload = () => resolve(String(r.result));
                                  r.onerror = () => reject(r.error);
                                  r.readAsDataURL(f);
                                });
                                setDraftReg(p => ({ ...p, shopLogo: dataUrl }));
                              }}
                            />
                            {draftReg.shopLogo ? 'Change Logo' : 'Upload Logo (≤300 KB)'}
                          </label>
                          {draftReg.shopLogo && (
                            <button
                              onClick={() => setDraftReg(p => ({ ...p, shopLogo: '' }))}
                              className="w-full py-1 rounded-lg text-[10px] font-semibold text-red-500 border border-red-200 dark:border-red-800">
                              Remove Logo
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                        Shown in the top bar, receipts, and as the install icon after Save.
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Welcome Credit (Tk)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={draftReg.bonusAmount || ''}
                        onChange={e => setDraftReg(p => ({ ...p, bonusAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0 = no cash credit"
                        className="mt-0.5 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2.5 space-y-2">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Free Item (optional)</p>
                      {catalog.length > 0 && (
                        <select
                          value=""
                          onChange={e => {
                            const item = catalog.find(c => c.id === e.target.value);
                            if (item) setDraftReg(p => ({ ...p, rewardItemName: item.name, rewardItemPrice: item.price }));
                          }}
                          className="w-full border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:border-emerald-400"
                        >
                          <option value="">Pick from catalog…</option>
                          {catalog.map(c => (
                            <option key={c.id} value={c.id}>{c.name} — Tk {c.price}</option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={draftReg.rewardItemName}
                          onChange={e => setDraftReg(p => ({ ...p, rewardItemName: e.target.value }))}
                          placeholder="Item name"
                          className="flex-1 min-w-0 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:border-emerald-400"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={draftReg.rewardItemPrice || ''}
                          onChange={e => setDraftReg(p => ({ ...p, rewardItemPrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="Tk"
                          className="w-16 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2 py-1.5 text-[12px] text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:border-emerald-400"
                        />
                        {(draftReg.rewardItemName || draftReg.rewardItemPrice > 0) && (
                          <button
                            onClick={() => setDraftReg(p => ({ ...p, rewardItemName: '', rewardItemPrice: 0 }))}
                            className="px-2 rounded-lg bg-white dark:bg-slate-700 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                            title="Clear reward item">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80">
                        Leave empty for no item reward. Price is used to credit the customer's balance for redemption.
                      </p>
                    </div>

                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2.5 space-y-2">
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Payment Milestone Reward</p>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-300">Give free item every (Tk)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={draftReg.paymentRewardThreshold || ''}
                        onChange={e => setDraftReg(p => ({ ...p, paymentRewardThreshold: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 500 (0 = disabled)"
                        className="w-full border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:border-amber-400"
                      />
                      <p className="text-[10px] text-amber-700 dark:text-amber-400/80">
                        Uses the Free Item above. Customer earns one item each time their total paid crosses this amount.
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Welcome Message (optional)</label>
                      <textarea
                        value={draftReg.welcomeMessage}
                        onChange={e => setDraftReg(p => ({ ...p, welcomeMessage: e.target.value }))}
                        placeholder="Thanks for joining our shop!"
                        rows={2}
                        className="mt-0.5 w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={saveRegSettings}
                    disabled={regSaving}
                    className="w-full mt-3 py-2.5 rounded-xl bg-sky-500 text-white text-[13px] font-bold active:scale-[0.98] transition-all disabled:opacity-60">
                    {regSaving ? 'Saving…' : 'Save Registration Settings'}
                  </button>

                  {regSettings.registrationEnabled && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => setShowQR(v => !v)}
                        className="w-full py-2.5 rounded-xl border-2 border-sky-400 text-sky-500 dark:text-sky-400 text-[13px] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                        <QrIcon size={14} /> {showQR ? 'Hide QR' : 'Show QR & Link'}
                      </button>

                      {showQR && (
                        <div className="rounded-xl bg-white dark:bg-slate-700 p-4 flex flex-col items-center gap-2 border border-gray-100 dark:border-slate-600">
                          <div className="bg-white p-2 rounded-lg">
                            <QRCodeSVG
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register/${tenantId}`}
                              size={168}
                              level="M"
                            />
                          </div>
                          <p className="text-[10px] text-center text-gray-500 dark:text-slate-400 break-all px-2">
                            {typeof window !== 'undefined' ? window.location.origin : ''}/register/{tenantId}
                          </p>
                          <button
                            id="copy-reg-btn"
                            onClick={() => {
                              const url = `${window.location.origin}/register/${tenantId}`;
                              navigator.clipboard.writeText(url).then(() => {
                                const el = document.getElementById('copy-reg-btn');
                                if (el) { el.textContent = 'Copied!'; setTimeout(() => { if (el) el.textContent = 'Copy Registration Link'; }, 2000); }
                              });
                            }}
                            className="w-full py-2 rounded-lg bg-sky-500 text-white text-[12px] font-bold active:scale-[0.98]">
                            Copy Registration Link
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
                </>
              )}

              {settingsTab === 'lists' && (
              /* Reusable Lists (vehicles, locations, ...) */
              <div>
                <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Reusable Lists
                </p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-2">
                  Named dropdown lists (Vehicle Types, Locations, Services…) that templates can reuse.
                </p>

                <div className="space-y-1.5 mb-2">
                  {lists.length === 0 && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 py-2 text-center">No lists yet.</p>
                  )}
                  {lists.map(l => {
                    const isOpen = expandedListId === l.id;
                    return (
                      <div key={l.id} className="rounded-lg bg-gray-50 dark:bg-slate-700">
                        <div className="flex items-center gap-2 px-2.5 py-1.5">
                          <button onClick={() => setExpandedListId(isOpen ? null : l.id)}
                            className="flex-1 text-left text-[12px] font-semibold text-gray-800 dark:text-slate-200">
                            {l.name} <span className="text-gray-400 dark:text-slate-500 font-normal">({l.items.length})</span>
                          </button>
                          <button onClick={() => deleteList(l.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 active:bg-red-50 dark:active:bg-red-900/30">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {isOpen && (
                          <div className="px-2.5 pb-2 space-y-1.5">
                            {l.items.map((it, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-md px-2 py-1">
                                <span className="flex-1 text-[12px] text-gray-800 dark:text-slate-200 truncate">{it}</span>
                                <button onClick={() => removeItemFromList(l.id, i)}
                                  className="w-5 h-5 flex items-center justify-center rounded text-red-400">
                                  <X size={11} />
                                </button>
                              </div>
                            ))}
                            <div className="flex gap-1.5">
                              <input
                                value={newListItem[l.id] || ''}
                                onChange={e => setNewListItem(prev => ({ ...prev, [l.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && addItemToList(l.id)}
                                placeholder="New item"
                                className="flex-1 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 text-[12px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400 bg-white dark:bg-slate-800"
                              />
                              <button onClick={() => addItemToList(l.id)}
                                className="px-2 rounded-md bg-sky-500 text-white text-[11px] font-bold">
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-1.5">
                  <input
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addList()}
                    placeholder="New list name (e.g. Vehicles)"
                    className="flex-1 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
                  />
                  <button onClick={addList}
                    className="px-3 rounded-lg bg-sky-500 text-white text-[12px] font-bold">
                    <Plus size={12} className="inline -mt-0.5" /> List
                  </button>
                </div>
              </div>
              )}

              {settingsTab === 'templates' && (
              /* Message Templates */
              <div>
                <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare size={13} /> Message Templates
                </p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-2">
                  Customize WhatsApp / SMS templates. Use{' '}
                  <code className="text-[10px] bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{shopName}'}</code>,{' '}
                  <code className="text-[10px] bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{customerName}'}</code>,{' '}
                  <code className="text-[10px] bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{phone}'}</code>,{' '}
                  <code className="text-[10px] bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{today}'}</code>,{' '}
                  <code className="text-[10px] bg-gray-100 dark:bg-slate-700 px-1 rounded">{'{due}'}</code>.
                </p>

                <div className="space-y-1.5 mb-2">
                  {templates.length === 0 && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 py-2 text-center">
                      No templates. Add one below.
                    </p>
                  )}
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-2.5 py-1.5">
                      <span className="flex-1 text-[12px] font-semibold text-gray-800 dark:text-slate-200 truncate">{t.name}</span>
                      <button onClick={() => openEditTpl(t)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-sky-500 active:bg-sky-100 dark:active:bg-sky-900/30">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteTpl(t.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 active:bg-red-50 dark:active:bg-red-900/30">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={openNewTpl}
                  className="w-full py-2 rounded-lg border-2 border-dashed border-sky-300 dark:border-sky-700 text-sky-500 dark:text-sky-400 text-[12px] font-bold active:scale-[0.98] transition flex items-center justify-center gap-1">
                  <Plus size={13} /> Add Template
                </button>

                {/* Import / Export */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Share Templates</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-2">
                    Export as JSON to share with another shop, or paste JSON to import.
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={exportTemplatesJson}
                      className="flex-1 py-2 rounded-lg border-2 border-sky-300 dark:border-sky-700 text-sky-500 dark:text-sky-400 text-[12px] font-bold active:scale-[0.98] flex items-center justify-center gap-1">
                      <Upload size={12} /> Export
                    </button>
                    <button onClick={() => { setImportText(''); setShowImport(true); window.history.pushState({ duebook: 'modal' }, ''); }}
                      className="flex-1 py-2 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-[12px] font-bold active:scale-[0.98] flex items-center justify-center gap-1">
                      <ClipboardPaste size={12} /> Import
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TEMPLATE PICKER SHEET
          ══════════════════════════════════════ */}
      {showTplPicker && (
        <div className="absolute inset-0 z-[55] flex flex-col justify-end" onClick={() => setShowTplPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[80dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Choose Template</h3>
              <button onClick={() => setShowTplPicker(false)} className="w-6 h-6 flex items-center justify-center">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
              {templates.length === 0 && (
                <p className="text-center text-[12px] text-gray-400 dark:text-slate-500 py-6">
                  No templates yet. Open Settings → Message Templates to add one.
                </p>
              )}
              {templates.map(t => (
                <button key={t.id} onClick={() => pickTpl(t)}
                  className="w-full text-left bg-gray-50 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl px-3 py-2.5 active:scale-[0.99] transition">
                  <p className="text-[13px] font-bold text-gray-800 dark:text-slate-200 mb-0.5">{t.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-2 whitespace-pre-line">{t.body}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TEMPLATE PREVIEW / EDIT + SEND SHEET
          ══════════════════════════════════════ */}
      {showTplPreview && (
        <div className="absolute inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowTplPreview(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Review & Send</h3>
              <button onClick={() => setShowTplPreview(false)} className="w-6 h-6 flex items-center justify-center">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
              {tplPreviewTpl?.fields && tplPreviewTpl.fields.length > 0 && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-2.5 space-y-2">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Fill Details</p>
                  {tplPreviewTpl.fields.map(f => {
                    const val = tplFieldValues[f.id] || '';
                    const list = f.listId ? lists.find(l => l.id === f.listId) : undefined;
                    const commonCls = 'w-full border border-emerald-200 dark:border-emerald-800 rounded-md px-2 py-1.5 text-[12px] bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:border-emerald-400';
                    return (
                      <div key={f.id}>
                        <label className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">{f.label}</label>
                        {f.type === 'textarea' ? (
                          <textarea rows={2} value={val}
                            onChange={e => updateTplField(f.id, e.target.value)}
                            className={commonCls + ' resize-none'} />
                        ) : f.type === 'select' && list ? (
                          <select value={val}
                            onChange={e => updateTplField(f.id, e.target.value)}
                            className={commonCls}>
                            <option value="">— select —</option>
                            {list.items.map((it, i) => <option key={i} value={it}>{it}</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.type === 'select' ? 'text' : f.type}
                            inputMode={f.type === 'number' ? 'decimal' : undefined}
                            value={val}
                            onChange={e => updateTplField(f.id, e.target.value)}
                            className={commonCls}
                          />
                        )}
                      </div>
                    );
                  })}
                  {tplBodyOverride !== null && (
                    <button onClick={resetTplPreview}
                      className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 underline">
                      Regenerate preview from fields
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                  WhatsApp Preview
                </label>
                <div className="rounded-xl p-3" style={{ background: isDark ? '#0b1f1a' : '#e5ddd5' }}>
                  <div className="max-w-[85%] ml-auto relative rounded-lg px-2.5 py-1.5 shadow-sm"
                    style={{ background: isDark ? '#005c4b' : '#d9fdd3' }}>
                    <div className="whitespace-pre-wrap break-words text-[12.5px] leading-snug text-gray-900 dark:text-slate-100">
                      {tplPreview || <span className="text-gray-400 italic">Empty message…</span>}
                    </div>
                    <div className="text-[9px] text-gray-500 dark:text-slate-300/70 text-right mt-0.5 flex items-center justify-end gap-0.5">
                      {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      <Check size={9} className="ml-0.5" strokeWidth={3} />
                      <Check size={9} className="-ml-1.5" strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Edit Message</label>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{tplPreview.length} chars</span>
                </div>
                <textarea
                  value={tplPreview}
                  onChange={e => onTplPreviewEdit(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-[12.5px] text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-700 outline-none focus:border-sky-400 resize-none font-mono leading-snug"
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                Recipient: {selected?.name}{selected?.phone ? ` (${selected.phone})` : ''}
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-2 px-4 pt-2 pb-5">
              <button onClick={copyTplPreview}
                className="flex-1 py-3 rounded-xl border-2 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
                <Copy size={14} /> Copy
              </button>
              <button onClick={sendTplPreview}
                className="flex-[2] py-3 rounded-xl bg-green-500 text-white text-[14px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
                <MessageCircle size={14} /> Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TEMPLATE EDITOR SHEET
          ══════════════════════════════════════ */}
      {showTplEditor && (
        <div className="absolute inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowTplEditor(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">
                {editingTpl ? 'Edit Template' : 'New Template'}
              </h3>
              <button onClick={() => setShowTplEditor(false)} className="w-6 h-6 flex items-center justify-center">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={tplDraftName}
                  onChange={e => setTplDraftName(e.target.value)}
                  placeholder="e.g. Car Rental Booking"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Message Body</label>
                <textarea
                  value={tplDraftBody}
                  onChange={e => setTplDraftBody(e.target.value)}
                  rows={14}
                  placeholder="Write your message here…"
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-700 outline-none focus:border-sky-400 resize-none font-mono leading-snug"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDER_KEYS.map(k => (
                  <button key={k}
                    onClick={() => setTplDraftBody(v => v + `{${k}}`)}
                    className="px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 text-[10px] font-semibold text-sky-600 dark:text-sky-400 active:scale-95 transition">
                    + {`{${k}}`}
                  </button>
                ))}
                {tplDraftFields.map(f => (
                  <button key={f.id}
                    onClick={() => setTplDraftBody(v => v + `{${f.id}}`)}
                    className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 active:scale-95">
                    + {`{${f.id}}`}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                Blue: built-in. Green: your custom fields. Both filled in when you send.
              </p>

              {/* Dynamic fields editor */}
              <div className="pt-2 mt-1 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Custom Fields</span>
                  <button onClick={addDraftField}
                    className="text-[11px] font-bold text-sky-500 flex items-center gap-0.5">
                    <Plus size={11} /> Add field
                  </button>
                </div>
                {tplDraftFields.length === 0 && (
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 py-1">
                    Add fields for date, time, vehicle, location etc. They become selectable inputs when sending.
                  </p>
                )}
                <div className="space-y-2">
                  {tplDraftFields.map((f, i) => (
                    <div key={i} className="rounded-lg bg-gray-50 dark:bg-slate-700 p-2 space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          value={f.label}
                          onChange={e => updateDraftField(i, { label: e.target.value })}
                          placeholder="Label"
                          className="flex-1 min-w-0 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 text-[12px] outline-none focus:border-sky-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                        />
                        <input
                          value={f.id}
                          onChange={e => updateDraftField(i, { id: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                          placeholder="key"
                          className="w-20 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 text-[11px] font-mono outline-none focus:border-sky-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                        />
                        <button onClick={() => removeDraftField(i)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-red-400 active:bg-red-50 dark:active:bg-red-900/30">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <select
                          value={f.type}
                          onChange={e => updateDraftField(i, { type: e.target.value as FieldType, listId: undefined })}
                          className="flex-1 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 text-[12px] bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100">
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="select">Dropdown (list)</option>
                        </select>
                        {f.type === 'select' && (
                          <select
                            value={f.listId || ''}
                            onChange={e => updateDraftField(i, { listId: e.target.value })}
                            className="flex-1 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 text-[12px] bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100">
                            <option value="">— pick list —</option>
                            {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 px-4 pt-2 pb-5">
              <button onClick={saveTpl}
                className="w-full py-3 rounded-xl bg-sky-500 text-white text-[14px] font-bold active:scale-[0.98] transition">
                {editingTpl ? 'Save Changes' : 'Add Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          IMPORT SHEET
          ══════════════════════════════════════ */}
      {showImport && (
        <div className="absolute inset-0 z-[70] flex flex-col justify-end" onClick={() => setShowImport(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[85dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100">Import Templates</h3>
              <button onClick={() => setShowImport(false)} className="w-6 h-6 flex items-center justify-center">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Paste JSON exported from another shop. Existing templates are kept — new ones are appended.
              </p>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={12}
                placeholder='{"templates":[...], "lists":[...]}'
                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] font-mono text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-700 outline-none focus:border-emerald-400 resize-none"
              />
              <button
                onClick={async () => {
                  try { const t = await navigator.clipboard.readText(); if (t) setImportText(t); }
                  catch { toast.error('Clipboard read blocked'); }
                }}
                className="w-full py-2 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-[12px] font-bold active:scale-[0.98] flex items-center justify-center gap-1">
                <ClipboardPaste size={12} /> Paste from clipboard
              </button>
            </div>
            <div className="flex-shrink-0 px-4 pt-2 pb-5">
              <button onClick={importTemplatesJson}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white text-[14px] font-bold active:scale-[0.98] transition">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          BULK SEND SHEET
          ══════════════════════════════════════ */}
      {showBulk && (
        <div className="absolute inset-0 z-[65] flex flex-col justify-end" onClick={() => setShowBulk(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl z-10 sheet-slide-up flex flex-col max-h-[92dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>
            <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2 pt-1">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                <Users size={14} /> Bulk Send
              </h3>
              <button onClick={() => setShowBulk(false)} className="w-6 h-6 flex items-center justify-center">
                <X size={15} className="text-gray-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Template</label>
                <select
                  value={bulkTplId}
                  onChange={e => setBulkTplId(e.target.value)}
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-2 text-[13px] bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 outline-none focus:border-sky-400">
                  <option value="">— pick template —</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1">Send to</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { id: 'has_due', label: 'With Dues' },
                    { id: 'all_customers', label: 'All ' + labels.Customer + 's' },
                    { id: 'all_suppliers', label: 'All ' + labels.Supplier + 's' },
                    { id: 'all_employees', label: 'All ' + labels.Employee + 's' },
                  ] as const).map(f => (
                    <button key={f.id} onClick={() => setBulkFilter(f.id)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border-2 transition ${
                        bulkFilter === f.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                          : 'border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {bulkTpl?.fields && bulkTpl.fields.length > 0 && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-2 space-y-1.5">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Common Fields</p>
                  {bulkTpl.fields.map(f => {
                    const val = bulkFieldValues[f.id] || '';
                    const list = f.listId ? lists.find(l => l.id === f.listId) : undefined;
                    const cls = 'w-full border border-emerald-200 dark:border-emerald-800 rounded-md px-2 py-1 text-[12px] bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:border-emerald-400';
                    return (
                      <div key={f.id}>
                        <label className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block">{f.label}</label>
                        {f.type === 'select' && list ? (
                          <select value={val} onChange={e => setBulkFieldValues(prev => ({ ...prev, [f.id]: e.target.value }))} className={cls}>
                            <option value="">— select —</option>
                            {list.items.map((it, i) => <option key={i} value={it}>{it}</option>)}
                          </select>
                        ) : f.type === 'textarea' ? (
                          <textarea rows={2} value={val} onChange={e => setBulkFieldValues(prev => ({ ...prev, [f.id]: e.target.value }))} className={cls + ' resize-none'} />
                        ) : (
                          <input
                            type={f.type === 'select' ? 'text' : f.type}
                            inputMode={f.type === 'number' ? 'decimal' : undefined}
                            value={val}
                            onChange={e => setBulkFieldValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                            className={cls}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    Recipients ({bulkCandidates.length} with phone) — {bulkSelected.size} selected, {bulkSentIds.size} sent
                  </label>
                  <button onClick={() => setBulkSelected(new Set(bulkCandidates.map(e => e._id)))}
                    className="text-[10px] font-bold text-sky-500">Select All</button>
                </div>
                {bulkCandidates.length === 0 ? (
                  <p className="text-center text-[12px] text-gray-400 dark:text-slate-500 py-4">
                    No matching contacts with phone numbers.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {bulkCandidates.map(e => {
                      const isSel = bulkSelected.has(e._id);
                      const isSent = bulkSentIds.has(e._id);
                      const net = e.totalOwedToMe - e.totalIOweThemNumber;
                      return (
                        <div key={e._id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${isSent ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-slate-700'}`}>
                          <button onClick={() => toggleBulk(e._id)}
                            className="w-5 h-5 flex items-center justify-center shrink-0">
                            {isSel
                              ? <CheckCircle2 size={17} className="text-sky-500" />
                              : <Circle size={17} className="text-gray-300 dark:text-slate-600" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-gray-800 dark:text-slate-200 truncate">{e.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                              {e.phone}{net > 0 ? ` • Due ${fmt(net)}` : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => sendBulkOne(e)}
                            disabled={!isSel || !bulkTpl}
                            className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 ${
                              isSent
                                ? 'bg-green-500 text-white'
                                : 'bg-sky-500 text-white disabled:opacity-40'
                            } active:scale-95`}>
                            {isSent ? <><Check size={11} /> Sent</> : <><Send size={11} /> Send</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 px-4 pt-2 pb-5 text-center">
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                WhatsApp only allows one message per tap — send one at a time and come back for the next.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PHOTO VIEWER (transaction photo full-screen)
          ══════════════════════════════════════ */}
      {showPhotoViewer && (
        <div className="absolute inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPhotoViewer(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={showPhotoViewer} alt="Photo" className="max-w-full max-h-full rounded-lg" />
          <button onClick={() => setShowPhotoViewer(null)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── SHADOW LOCK OVERLAY ── */}
      {isLocked && (
        <div
          className="fixed inset-0 z-[999] bg-transparent select-none"
          style={{ touchAction: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={startUnlockHold}
          onPointerUp={cancelUnlockHold}
          onPointerCancel={cancelUnlockHold}
          onPointerLeave={cancelUnlockHold}
        >
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-[11px] font-medium shadow">
              {unlockHoldPct > 0 ? <Unlock size={12} /> : <Lock size={12} />}
              <span>{unlockHoldPct > 0 ? 'Keep holding…' : 'Locked — long-press to unlock'}</span>
            </div>
            {unlockHoldPct > 0 && (
              <div className="w-32 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: `${unlockHoldPct}%` }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
