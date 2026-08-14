'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { use } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, RefreshCw, Users } from 'lucide-react';

interface Entity {
  _id: string; name: string; phone?: string;
  type: string;
  totalOwedToMe: number; totalIOweThemNumber: number;
  updatedAt: string;
}
interface Transaction {
  _id: string; amount: number;
  direction: 'INCOME' | 'EXPENSE';
  transactionDate: string; notes?: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
}

const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ec4899','#6366f1'];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initial = (name: string) => (name || '?')[0].toUpperCase();
const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs < 1000) return 'Tk ' + abs.toLocaleString('en-IN');
  return 'Tk ' + new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(abs).toLowerCase();
};
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
const timeAgo = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

const REFRESH_INTERVAL = 30_000;

export default function ViewPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);

  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ticking, setTicking] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [txMap, setTxMap] = useState<Record<string, Transaction[]>>({});
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [shop, setShop] = useState<{ shopName: string; shopLogo: string }>({ shopName: '', shopLogo: '' });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/public/duebook/shop?tid=${tenantId}`);
        if (r.ok) setShop(await r.json());
      } catch { /* ignore */ }
    })();
  }, [tenantId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (shop.shopName) document.title = `${shop.shopName} · Dues`;
  }, [shop.shopName]);

  const fetchEntities = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await fetch(`/api/public/due-view?tid=${tenantId}`);
      if (!r.ok) throw new Error('Failed');
      const data: Entity[] = await r.json();
      // Sort: people with active dues first, then by amount desc
      data.sort((a, b) => {
        const netA = a.totalOwedToMe - a.totalIOweThemNumber;
        const netB = b.totalOwedToMe - b.totalIOweThemNumber;
        return Math.abs(netB) - Math.abs(netA);
      });
      setEntities(data);
      setLastUpdated(new Date());
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchEntities(); }, [fetchEntities]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => fetchEntities(true), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchEntities]);

  // Tick the "X seconds ago" display
  useEffect(() => {
    const id = setInterval(() => {
      if (lastUpdated) setTicking(timeAgo(lastUpdated));
    }, 2000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  useEffect(() => {
    if (lastUpdated) setTicking(timeAgo(lastUpdated));
  }, [lastUpdated]);

  const toggleExpand = async (entity: Entity) => {
    if (expanded === entity._id) { setExpanded(null); return; }
    setExpanded(entity._id);
    if (txMap[entity._id]) return;
    setTxLoading(entity._id);
    try {
      const r = await fetch(`/api/public/due-view/transactions?tid=${tenantId}&entityId=${entity._id}`);
      if (r.ok) {
        const data = await r.json();
        setTxMap(prev => ({ ...prev, [entity._id]: data }));
      }
    } finally { setTxLoading(null); }
  };

  const totalGet = entities.reduce((s, e) => s + (e.totalOwedToMe || 0), 0);
  const totalGive = entities.reduce((s, e) => s + (e.totalIOweThemNumber || 0), 0);
  const activePeople = entities.filter(e => (e.totalOwedToMe + e.totalIOweThemNumber) > 0).length;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(14,165,233,0.4)' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>৳</span>
      </div>
      <div style={{ width: 28, height: 28, border: '3px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Loading dues…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', paddingBottom: 32 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding: '24px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)', overflow: 'hidden' }}>
              {shop.shopLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={shop.shopLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>৳</span>
              )}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: -0.5 }}>
                {shop.shopName || 'Dues Board'}
              </h1>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 500 }}>Live · Read-only view</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '4px 10px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s ease infinite' }} />
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>LIVE</span>
            </div>
            <button onClick={() => fetchEntities(true)} disabled={refreshing}
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* ── SUMMARY CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp size={13} color="#10b981" />
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Will Collect</span>
            </div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalGet)}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingDown size={13} color="#ef4444" />
              <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Will Pay</span>
            </div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalGive)}</p>
          </div>
        </div>

        {/* Net + People count */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: (totalGet - totalGive) >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(totalGet - totalGive) >= 0 ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600 }}>NET BALANCE</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: (totalGet - totalGive) >= 0 ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                {(totalGet - totalGive) >= 0 ? '+' : '-'}{fmt(totalGet - totalGive)}
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#6366f1" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600 }}>ACTIVE DUES</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#a5b4fc' }}>{activePeople} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>people</span></p>
            </div>
          </div>
        </div>

        {/* ── Last updated ── */}
        {lastUpdated && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginBottom: 16, fontWeight: 500 }}>
            Updated {ticking || timeAgo(lastUpdated)} · auto-refreshes every 30s
          </p>
        )}

        {/* ── ENTITY LIST ── */}
        {entities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>No data yet</p>
            <p style={{ fontSize: 12, margin: 0 }}>Add contacts in DueBook to see them here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entities.map(entity => {
              const net = entity.totalOwedToMe - entity.totalIOweThemNumber;
              const isExpanded = expanded === entity._id;
              const hasBalance = (entity.totalOwedToMe + entity.totalIOweThemNumber) > 0;
              const txs = txMap[entity._id] || [];

              return (
                <div key={entity._id}
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hasBalance ? (net >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>

                  {/* Card header — tap to expand */}
                  <button onClick={() => toggleExpand(entity)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    {/* Avatar */}
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: avatarColor(entity.name), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${avatarColor(entity.name)}44` }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{initial(entity.name)}</span>
                    </div>

                    {/* Name + phone */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entity.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 500 }}>{entity.phone || entity.type}</p>
                    </div>

                    {/* Balance */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {hasBalance ? (
                        <>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: net >= 0 ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                            {net >= 0 ? '+' : '-'}{fmt(net)}
                          </p>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: net >= 0 ? '#059669' : '#dc2626' }}>
                            {net >= 0 ? 'to collect' : 'to pay'}
                          </p>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>Clear</span>
                      )}
                    </div>

                    {/* Expand chevron */}
                    <div style={{ color: '#475569', flexShrink: 0, marginLeft: 4 }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Balance breakdown row */}
                  {hasBalance && (
                    <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', gap: 12 }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600 }}>OWES YOU</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{fmt(entity.totalOwedToMe)}</p>
                      </div>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600 }}>YOU OWE</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{fmt(entity.totalIOweThemNumber)}</p>
                      </div>
                    </div>
                  )}

                  {/* Expanded: transaction history */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', animation: 'slideDown 0.2s ease' }}>
                      {txLoading === entity._id ? (
                        <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
                          <div style={{ width: 20, height: 20, border: '2.5px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        </div>
                      ) : txs.length === 0 ? (
                        <p style={{ margin: 0, padding: '16px', textAlign: 'center', fontSize: 12, color: '#475569' }}>No transactions</p>
                      ) : (
                        <div style={{ padding: '8px 12px 12px' }}>
                          <p style={{ margin: '0 0 8px 4px', fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Transaction History</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {txs.map((tx, i) => {
                              const isPaid = tx.status === 'Paid';
                              return (
                                <div key={tx._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px', opacity: isPaid ? 0.5 : 1 }}>
                                  <div style={{ width: 3, height: 32, borderRadius: 2, background: isPaid ? '#334155' : tx.direction === 'INCOME' ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{fmtDate(tx.transactionDate)}</p>
                                    {tx.notes && <p style={{ margin: 0, fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{tx.notes}</p>}
                                  </div>
                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isPaid ? '#475569' : tx.direction === 'INCOME' ? '#10b981' : '#ef4444', textDecoration: isPaid ? 'line-through' : 'none', fontVariantNumeric: 'tabular-nums' }}>
                                      {tx.direction === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                    </p>
                                    {isPaid && <span style={{ fontSize: 9, color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: 4 }}>PAID</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#1e293b', marginTop: 32, fontWeight: 500 }}>
          DueBook · View-only · Data updates automatically
        </p>
      </div>
    </div>
  );
}
