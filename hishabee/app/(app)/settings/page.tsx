'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings, Monitor, Receipt, Globe, Webhook, Plus, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchHardwareMappings, createHardwareMapping, deleteHardwareMapping,
  fetchTaxRules, saveTaxRules,
  HardwareMapping, TaxRule,
} from '@/lib/services/pos';
import {
  fetchWebhooks, createWebhook, deleteWebhook, fetchWebhookLogs,
  WebhookRegistration, WebhookDeliveryLog,
} from '@/lib/services/webhooks';
import { fetchLoyaltyConfig, saveLoyaltyConfig, LoyaltyConfig } from '@/lib/services/loyalty';

type TabView = 'hardware' | 'tax' | 'webhooks' | 'loyalty';

const CRYSTAL_ORANGE = '#FF8A00';
const CRYSTAL_BLUE = '#1E90FF';

export default function SettingsPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';

  const [tab, setTab] = useState<TabView>('hardware');
  const [loading, setLoading] = useState(true);

  // Data
  const [hardwareMappings, setHardwareMappings] = useState<HardwareMapping[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRegistration[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({
    enabled: false, pointsPerCurrencyUnit: 100, currencyPerPoint: 1, minimumRedeemPoints: 100,
  });

  // Hardware form
  const [showAddHW, setShowAddHW] = useState(false);
  const [hwRegisterId, setHwRegisterId] = useState('');
  const [hwRegisterName, setHwRegisterName] = useState('');
  const [hwBranchId, setHwBranchId] = useState('');
  const [hwPrinterName, setHwPrinterName] = useState('');
  const [hwPrinterIp, setHwPrinterIp] = useState('');

  // Webhook form
  const [showAddWH, setShowAddWH] = useState(false);
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [whSecret, setWhSecret] = useState('');
  const [whDesc, setWhDesc] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  const WEBHOOK_EVENTS = [
    'order.created', 'order.updated', 'order.delivered', 'order.cancelled',
    'stock.updated', 'stock.low', 'price.changed',
    'customer.created', 'customer.updated',
    'loyalty.earned', 'loyalty.redeemed',
    'pos.sale', 'pos.return',
  ];

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [hw, tx, wh, logs, lc] = await Promise.allSettled([
        fetchHardwareMappings(tenantId),
        fetchTaxRules(tenantId),
        fetchWebhooks(tenantId),
        fetchWebhookLogs(tenantId),
        fetchLoyaltyConfig(tenantId),
      ]);
      if (hw.status === 'fulfilled') setHardwareMappings(hw.value);
      if (tx.status === 'fulfilled') setTaxRules(tx.value);
      if (wh.status === 'fulfilled') setWebhooks(wh.value);
      if (logs.status === 'fulfilled') setWebhookLogs(logs.value);
      if (lc.status === 'fulfilled') setLoyaltyConfig(lc.value);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Hardware Handlers ────────────────────────────────────────
  const handleAddHardware = async () => {
    if (!hwRegisterId || !hwRegisterName || !hwBranchId) return toast.error('Register ID, name, and branch required');
    try {
      await createHardwareMapping(tenantId, {
        registerId: hwRegisterId, registerName: hwRegisterName, branchId: hwBranchId,
        printerName: hwPrinterName || undefined, printerIp: hwPrinterIp || undefined, isActive: true,
      });
      toast.success('Hardware mapping added');
      setShowAddHW(false);
      setHwRegisterId(''); setHwRegisterName(''); setHwBranchId(''); setHwPrinterName(''); setHwPrinterIp('');
      loadData();
    } catch { toast.error('Failed to add hardware mapping'); }
  };

  const handleDeleteHardware = async (id: string) => {
    try {
      await deleteHardwareMapping(tenantId, id);
      toast.success('Hardware mapping removed');
      loadData();
    } catch { toast.error('Failed to remove'); }
  };

  // ─── Tax Rule Handlers ────────────────────────────────────────
  const handleSaveTaxRules = async () => {
    try {
      await saveTaxRules(tenantId, taxRules);
      toast.success('Tax rules saved');
    } catch { toast.error('Failed to save tax rules'); }
  };

  // ─── Webhook Handlers ─────────────────────────────────────────
  const handleAddWebhook = async () => {
    if (!whUrl || whEvents.length === 0) return toast.error('URL and at least one event required');
    try {
      await createWebhook(tenantId, { url: whUrl, events: whEvents, secret: whSecret || undefined, description: whDesc || undefined });
      toast.success('Webhook registered');
      setShowAddWH(false);
      setWhUrl(''); setWhEvents([]); setWhSecret(''); setWhDesc('');
      loadData();
    } catch { toast.error('Failed to register webhook'); }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhook(tenantId, id);
      toast.success('Webhook removed');
      loadData();
    } catch { toast.error('Failed to remove webhook'); }
  };

  // ─── Loyalty Handlers ─────────────────────────────────────────
  const handleSaveLoyalty = async () => {
    try {
      await saveLoyaltyConfig(tenantId, loyaltyConfig);
      toast.success('Loyalty config saved');
    } catch { toast.error('Failed to save loyalty config'); }
  };

  const tabs: { id: TabView; label: string; icon: React.ReactNode }[] = [
    { id: 'hardware', label: 'Hardware', icon: <Monitor size={16} /> },
    { id: 'tax', label: 'Tax Rules', icon: <Receipt size={16} /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={16} /> },
    { id: 'loyalty', label: 'Loyalty', icon: <Globe size={16} /> },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Settings size={22} style={{ color: CRYSTAL_ORANGE }} />
            POS Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hardware, tax, webhooks, and loyalty configuration</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <RefreshCw size={18} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
              tab === t.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <RefreshCw size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      )}

      {/* ─── Hardware Tab ─── */}
      {!loading && tab === 'hardware' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Map POS registers and receipt printers to branches</p>
            <button onClick={() => setShowAddHW(!showAddHW)} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>
              <Plus size={14} /> Add Register
            </button>
          </div>

          {showAddHW && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <input type="text" placeholder="Register ID (e.g. REG-001)" value={hwRegisterId} onChange={(e) => setHwRegisterId(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Register Name" value={hwRegisterName} onChange={(e) => setHwRegisterName(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Branch ID" value={hwBranchId} onChange={(e) => setHwBranchId(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Printer Name (optional)" value={hwPrinterName} onChange={(e) => setHwPrinterName(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Printer IP (optional)" value={hwPrinterIp} onChange={(e) => setHwPrinterIp(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddHW(false)} className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddHardware} className="px-4 py-2 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>Add</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {hardwareMappings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Monitor size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hardware mappings configured.</p>
              </div>
            ) : (
              hardwareMappings.map((hw) => (
                <div key={hw.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Monitor size={14} style={{ color: CRYSTAL_BLUE }} />
                      {hw.registerName}
                      <span className="text-[10px] text-gray-400 font-normal">({hw.registerId})</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Branch: {hw.branchId}
                      {hw.printerName && ` • Printer: ${hw.printerName}`}
                      {hw.printerIp && ` (${hw.printerIp})`}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteHardware(hw.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── Tax Rules Tab ─── */}
      {!loading && tab === 'tax' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Configure tax rules for your region</p>
            <button
              onClick={() => setTaxRules([...taxRules, { name: '', rate: 0, type: 'exclusive', appliesTo: 'all', isActive: true }])}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg"
              style={{ background: CRYSTAL_ORANGE }}
            >
              <Plus size={14} /> Add Rule
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {taxRules.map((rule, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tax Name (e.g. VAT)"
                    value={rule.name}
                    onChange={(e) => { const u = [...taxRules]; u[i].name = e.target.value; setTaxRules(u); }}
                    className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="%"
                      value={rule.rate}
                      onChange={(e) => { const u = [...taxRules]; u[i].rate = Number(e.target.value); setTaxRules(u); }}
                      className="w-16 px-2 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                  <select
                    value={rule.type}
                    onChange={(e) => { const u = [...taxRules]; u[i].type = e.target.value as 'inclusive' | 'exclusive'; setTaxRules(u); }}
                    className="px-2 py-1.5 text-xs border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="inclusive">Inclusive</option>
                    <option value="exclusive">Exclusive</option>
                  </select>
                  <select
                    value={rule.appliesTo}
                    onChange={(e) => { const u = [...taxRules]; u[i].appliesTo = e.target.value as 'all' | 'category' | 'product'; setTaxRules(u); }}
                    className="px-2 py-1.5 text-xs border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="all">All Products</option>
                    <option value="category">By Category</option>
                    <option value="product">By Product</option>
                  </select>
                  {rule.appliesTo !== 'all' && (
                    <input
                      type="text"
                      placeholder={rule.appliesTo === 'category' ? 'Category' : 'Product ID'}
                      value={rule.categoryId || rule.productId || ''}
                      onChange={(e) => {
                        const u = [...taxRules];
                        if (rule.appliesTo === 'category') u[i].categoryId = e.target.value;
                        else u[i].productId = e.target.value;
                        setTaxRules(u);
                      }}
                      className="w-28 px-2 py-1.5 text-xs border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Region"
                    value={rule.region || ''}
                    onChange={(e) => { const u = [...taxRules]; u[i].region = e.target.value; setTaxRules(u); }}
                    className="w-24 px-2 py-1.5 text-xs border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button onClick={() => setTaxRules(taxRules.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {taxRules.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tax rules configured.</p>
              </div>
            )}
          </div>

          {taxRules.length > 0 && (
            <button onClick={handleSaveTaxRules} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>
              Save Tax Rules
            </button>
          )}
        </div>
      )}

      {/* ─── Webhooks Tab ─── */}
      {!loading && tab === 'webhooks' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Push instant updates from SaaS to external systems</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-1 px-3 py-2 text-xs font-medium border rounded-lg text-gray-600 hover:bg-gray-50">
                {showLogs ? <EyeOff size={14} /> : <Eye size={14} />}
                {showLogs ? 'Hide Logs' : 'View Logs'}
              </button>
              <button onClick={() => setShowAddWH(!showAddWH)} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_BLUE }}>
                <Plus size={14} /> Add Webhook
              </button>
            </div>
          </div>

          {showAddWH && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-700">
              <div className="space-y-2 mb-3">
                <input type="url" placeholder="Webhook URL (https://...)" value={whUrl} onChange={(e) => setWhUrl(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Description (optional)" value={whDesc} onChange={(e) => setWhDesc(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="HMAC Secret (optional)" value={whSecret} onChange={(e) => setWhSecret(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Events:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WEBHOOK_EVENTS.map((evt) => (
                      <button
                        key={evt}
                        onClick={() => setWhEvents((prev) => prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt])}
                        className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                          whEvents.includes(evt)
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {evt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddWH(false)} className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddWebhook} className="px-4 py-2 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_BLUE }}>Register</button>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Webhook size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No webhooks registered.</p>
              </div>
            ) : (
              webhooks.map((wh) => (
                <div key={wh.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      <Webhook size={14} style={{ color: CRYSTAL_BLUE }} />
                      {wh.description || wh.url}
                      {wh.isActive ? (
                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-md">{wh.url}</p>
                    <p className="text-[10px] text-gray-300">{wh.events.join(', ')}</p>
                  </div>
                  <button onClick={() => handleDeleteWebhook(wh.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {showLogs && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Delivery Logs</h3>
              <div className="space-y-1.5">
                {webhookLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      {log.success ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                      <span className="font-medium">{log.event}</span>
                      <span className="text-gray-400 truncate max-w-[200px]">{log.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span>{log.statusCode || 'N/A'}</span>
                      <span>×{log.attempts}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {webhookLogs.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No delivery logs yet.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Loyalty Tab ─── */}
      {!loading && tab === 'loyalty' && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Globe size={16} style={{ color: CRYSTAL_ORANGE }} />
              Loyalty Program Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Loyalty Program</p>
                  <p className="text-xs text-gray-400">Cross-channel points for online and in-store purchases</p>
                </div>
                <button
                  onClick={() => setLoyaltyConfig({ ...loyaltyConfig, enabled: !loyaltyConfig.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    loyaltyConfig.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    loyaltyConfig.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {loyaltyConfig.enabled && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Points per ৳ spent</label>
                    <p className="text-[10px] text-gray-400 mb-1">How much a customer needs to spend to earn 1 point</p>
                    <input
                      type="number"
                      value={loyaltyConfig.pointsPerCurrencyUnit}
                      onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, pointsPerCurrencyUnit: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">৳ value per point</label>
                    <p className="text-[10px] text-gray-400 mb-1">How much each point is worth in currency</p>
                    <input
                      type="number"
                      value={loyaltyConfig.currencyPerPoint}
                      onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, currencyPerPoint: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Minimum points to redeem</label>
                    <input
                      type="number"
                      value={loyaltyConfig.minimumRedeemPoints}
                      onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, minimumRedeemPoints: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </>
              )}
            </div>

            <button onClick={handleSaveLoyalty} className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>
              Save Loyalty Config
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
