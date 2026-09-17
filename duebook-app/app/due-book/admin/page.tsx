'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Users, Store, Eye, Activity, RefreshCw,
  Search, Trash2, ShieldCheck, ShieldOff, UserCog, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Overview {
  users: {
    total: number; tenantAdmins: number; staff: number;
    active: number; inactive: number; google: number; local: number;
    newToday: number; newThisWeek: number; newThisMonth: number;
    loggedInDay: number; loggedInWeek: number;
  };
  shops: { configured: number };
  records: { entities: number; transactions: number };
  visitors: {
    total: number; today: number; week: number;
    pageViewsToday: number; pageViewsWeek: number; onlineNow: number;
  };
  generatedAt: string;
}

interface UserRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  tenantId?: string;
  isActive: boolean;
  provider?: string;
  lastLogin?: string;
  createdAt: string;
  shopName?: string;
  entities: number;
  transactions: number;
}

interface TimelineDay {
  date: string;
  signups: number;
  newVisitors: number;
  pageViews: number;
  uniqueVisitors: number;
}

interface TrafficData {
  days: number;
  topReferrers: Array<{ referrer: string; count: number }>;
  topPages: Array<{ page: string; views: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  tenantsByViews: Array<{ tenantId: string; views: number; visitors: number }>;
}

type Tab = 'overview' | 'users' | 'traffic';

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [recent, setRecent] = useState<UserRow[]>([]);
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'super_admin') { router.replace('/due-book'); return; }
  }, [authLoading, user, router]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [ov, tl, rc] = await Promise.all([
        api.get('/duebook/admin/overview'),
        api.get('/duebook/admin/timeline?days=30'),
        api.get('/duebook/admin/recent-signups?limit=8'),
      ]);
      setOverview(ov.data);
      setTimeline(tl.data.days || []);
      setRecent((rc.data.users || []).map((u: any) => ({ ...u, entities: 0, transactions: 0 })));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') refreshAll();
  }, [user, refreshAll]);

  const loadTraffic = useCallback(async () => {
    try {
      const r = await api.get('/duebook/admin/traffic?days=7');
      setTraffic(r.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load traffic');
    }
  }, []);

  useEffect(() => {
    if (tab === 'traffic' && user?.role === 'super_admin' && !traffic) loadTraffic();
  }, [tab, user, traffic, loadTraffic]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">লোড হচ্ছে…</div>;
  }
  if (user.role !== 'super_admin') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link href="/due-book" className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Super Admin</div>
            <div className="text-sm font-black text-slate-900 truncate">DueBook Control Panel</div>
          </div>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { logout(); router.replace('/login'); }}
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Sign out
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {(['overview', 'users', 'traffic'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-[12px] font-bold uppercase tracking-wide border-b-2 ${
                tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {tab === 'overview' && (
          <OverviewTab overview={overview} timeline={timeline} recent={recent} />
        )}
        {tab === 'users' && <UsersTab />}
        {tab === 'traffic' && <TrafficTab traffic={traffic} onReload={loadTraffic} />}
      </main>
    </div>
  );
}

/* ────────── Overview tab ────────── */
function OverviewTab({
  overview, timeline, recent,
}: { overview: Overview | null; timeline: TimelineDay[]; recent: UserRow[] }) {
  if (!overview) {
    return <div className="text-slate-500 py-10 text-center">লোড হচ্ছে…</div>;
  }
  const { users, shops, records, visitors } = overview;

  const stats: Array<{ label: string; value: number; sub?: string; icon: any; color: string }> = [
    { label: 'Registered users', value: users.total, sub: `${users.newToday} new today`, icon: Users, color: 'from-sky-500 to-sky-600' },
    { label: 'Shops configured', value: shops.configured, sub: `${users.tenantAdmins} tenant admins`, icon: Store, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Visitors', value: visitors.total, sub: `${visitors.today} today`, icon: Eye, color: 'from-amber-500 to-amber-600' },
    { label: 'Online now', value: visitors.onlineNow, sub: 'Active in last 5 min', icon: Activity, color: 'from-rose-500 to-rose-600' },
  ];

  const maxSignup = Math.max(1, ...timeline.map(d => d.signups));
  const maxVisitors = Math.max(1, ...timeline.map(d => d.uniqueVisitors));

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.label}</div>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} text-white grid place-items-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl md:text-3xl font-black text-slate-900">{s.value.toLocaleString()}</div>
              {s.sub && <div className="text-[11px] text-slate-500 mt-0.5">{s.sub}</div>}
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <MiniStat label="Active accounts" value={users.active} tone="emerald" />
        <MiniStat label="Deactivated" value={users.inactive} tone="rose" />
        <MiniStat label="Google sign-ins" value={users.google} tone="sky" />
        <MiniStat label="Logged in (24h)" value={users.loggedInDay} tone="sky" />
        <MiniStat label="Logged in (7d)" value={users.loggedInWeek} tone="emerald" />
        <MiniStat label="New this week" value={users.newThisWeek} tone="amber" />
        <MiniStat label="Contacts stored" value={records.entities} tone="slate" />
        <MiniStat label="Transactions" value={records.transactions} tone="slate" />
        <MiniStat label="Page views (week)" value={visitors.pageViewsWeek} tone="slate" />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-black text-slate-900">Signups & visitors — last {timeline.length} days</h3>
        <div className="mt-4 grid grid-cols-[repeat(30,1fr)] gap-0.5 h-32 items-end">
          {timeline.map(d => (
            <div key={d.date} title={`${d.date} · ${d.signups} signups · ${d.uniqueVisitors} visitors`} className="flex flex-col-reverse items-center gap-0.5">
              <div
                className="w-full bg-gradient-to-t from-sky-400 to-sky-500 rounded-sm"
                style={{ height: `${(d.signups / maxSignup) * 60}%`, minHeight: d.signups ? '2px' : '0' }}
              />
              <div
                className="w-full bg-gradient-to-t from-emerald-300/70 to-emerald-400/70 rounded-sm"
                style={{ height: `${(d.uniqueVisitors / maxVisitors) * 40}%`, minHeight: d.uniqueVisitors ? '2px' : '0' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-500" /> Signups</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400" /> Unique visitors</span>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Recent signups</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {recent.length === 0 && <li className="p-4 text-slate-500 text-sm">No signups yet.</li>}
          {recent.map(u => (
            <li key={u._id} className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 grid place-items-center text-white font-black text-xs">
                {u.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{u.name || '—'}</div>
                <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <div className="font-bold text-slate-700">{u.provider || 'local'}</div>
                <div>{new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'rose' | 'sky' | 'amber' | 'slate' }) {
  const bg: Record<string, string> = {
    emerald: 'text-emerald-700 bg-emerald-50',
    rose: 'text-rose-700 bg-rose-50',
    sky: 'text-sky-700 bg-sky-50',
    amber: 'text-amber-700 bg-amber-50',
    slate: 'text-slate-700 bg-slate-100',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
      <div className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide ${bg[tone]}`}>{label}</div>
      <div className="ml-auto text-lg font-black text-slate-900">{value.toLocaleString()}</div>
    </div>
  );
}

/* ────────── Users tab ────────── */
function UsersTab() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: String(limit), offset: String(offset), sort });
      if (search) p.set('search', search);
      if (role) p.set('role', role);
      if (active) p.set('active', active);
      const r = await api.get(`/duebook/admin/users?${p.toString()}`);
      setRows(r.data.users);
      setTotal(r.data.total);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [limit, offset, sort, search, role, active]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u: UserRow) => {
    try {
      await api.patch(`/duebook/admin/${'users'}/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Deactivated' : 'Activated');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Update failed');
    }
  };

  const changeRole = async (u: UserRow) => {
    const next = prompt('Set role (customer, staff, tenant_admin, admin, super_admin)', u.role);
    if (!next) return;
    try {
      await api.patch(`/duebook/admin/users/${u._id}`, { role: next });
      toast.success('Role updated');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Update failed');
    }
  };

  const deleteUser = async (u: UserRow) => {
    if (!confirm(`Delete ${u.email}? This also removes their DueBook data.`)) return;
    try {
      await api.delete(`/duebook/admin/users/${u._id}`);
      toast.success('Deleted');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.floor(offset / limit) + 1;

  return (
    <section className="bg-white rounded-2xl border border-slate-200">
      <div className="p-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={e => { setOffset(0); setSearch(e.target.value); }}
          />
        </div>
        <select value={role} onChange={e => { setOffset(0); setRole(e.target.value); }} className="border border-slate-200 rounded-lg text-sm px-2 py-2">
          <option value="">All roles</option>
          <option value="tenant_admin">tenant_admin</option>
          <option value="staff">staff</option>
          <option value="super_admin">super_admin</option>
          <option value="admin">admin</option>
          <option value="customer">customer</option>
        </select>
        <select value={active} onChange={e => { setOffset(0); setActive(e.target.value); }} className="border border-slate-200 rounded-lg text-sm px-2 py-2">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="border border-slate-200 rounded-lg text-sm px-2 py-2">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="lastLogin">Last login</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Shop</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-right px-3 py-2">Data</th>
              <th className="text-left px-3 py-2">Last login</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">No users found</td></tr>}
            {!loading && rows.map(u => (
              <tr key={u._id} className={u.isActive ? '' : 'bg-rose-50/40'}>
                <td className="px-3 py-2">
                  <div className="font-bold text-slate-900 truncate max-w-[220px]">{u.name || '—'}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[220px]">{u.email}</div>
                  {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                </td>
                <td className="px-3 py-2 text-slate-700 truncate max-w-[160px]">{u.shopName || <span className="text-slate-400">—</span>}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    u.role === 'super_admin' ? 'bg-emerald-100 text-emerald-700' :
                    u.role === 'tenant_admin' ? 'bg-sky-100 text-sky-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>{u.role}</span>
                  {u.provider === 'google' && <span className="ml-1 text-[10px] text-slate-500">google</span>}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">
                  <div className="text-[11px]">{u.entities || 0} contacts</div>
                  <div className="text-[11px]">{u.transactions || 0} tx</div>
                </td>
                <td className="px-3 py-2 text-[11px] text-slate-500">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : <span className="text-slate-400">never</span>}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => toggleActive(u)} className="p-1.5 rounded-lg hover:bg-slate-100" title={u.isActive ? 'Deactivate' : 'Activate'}>
                    {u.isActive ? <ShieldOff className="w-4 h-4 text-rose-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                  </button>
                  <button onClick={() => changeRole(u)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Change role">
                    <UserCog className="w-4 h-4 text-sky-500" />
                  </button>
                  <button
                    onClick={() => deleteUser(u)}
                    disabled={u._id === me?._id}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-slate-100 flex items-center gap-3 text-sm text-slate-500">
        <div>Total: <span className="font-bold text-slate-800">{total}</span></div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[12px] font-bold">{page} / {totalPages}</span>
          <button onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ────────── Traffic tab ────────── */
function TrafficTab({ traffic, onReload }: { traffic: TrafficData | null; onReload: () => void }) {
  const maxRef = useMemo(() => Math.max(1, ...(traffic?.topReferrers || []).map(r => r.count)), [traffic]);
  const maxPage = useMemo(() => Math.max(1, ...(traffic?.topPages || []).map(p => p.views)), [traffic]);

  if (!traffic) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
      <button onClick={onReload} className="text-sky-600 font-bold">Reload traffic</button>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-black text-slate-900">Top referrers (last {traffic.days}d)</h3>
        <ul className="mt-3 space-y-2">
          {traffic.topReferrers.length === 0 && <li className="text-slate-400 text-sm">No referrer data</li>}
          {traffic.topReferrers.map(r => (
            <li key={r.referrer} className="text-sm">
              <div className="flex justify-between text-slate-700">
                <span className="truncate max-w-[220px]" title={r.referrer}>{r.referrer}</span>
                <span className="font-bold">{r.count}</span>
              </div>
              <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${(r.count / maxRef) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-black text-slate-900">Top pages</h3>
        <ul className="mt-3 space-y-2">
          {traffic.topPages.length === 0 && <li className="text-slate-400 text-sm">No page data</li>}
          {traffic.topPages.map(p => (
            <li key={p.page} className="text-sm">
              <div className="flex justify-between text-slate-700">
                <span className="truncate max-w-[220px]" title={p.page}>{p.page}</span>
                <span className="font-bold">{p.views}</span>
              </div>
              <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(p.views / maxPage) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-black text-slate-900">Devices</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {traffic.deviceBreakdown.map(d => (
            <li key={d.device} className="flex justify-between text-slate-700">
              <span>{d.device}</span>
              <span className="font-bold">{d.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-black text-slate-900">Busiest shops</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {traffic.tenantsByViews.map(t => (
            <li key={t.tenantId} className="flex justify-between text-slate-700">
              <span className="truncate max-w-[220px]" title={t.tenantId}>{t.tenantId || '—'}</span>
              <span className="font-bold">{t.views} <span className="text-slate-400 font-normal">/ {t.visitors}</span></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
