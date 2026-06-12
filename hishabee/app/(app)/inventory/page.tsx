'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Package, Warehouse, AlertTriangle, ArrowRightLeft, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchWarehouses, createWarehouse, deleteWarehouse,
  fetchBufferRules, saveBufferRules,
  fetchStockEntries, adjustStock, transferStock, fetchStockMovements,
  WarehouseNode, BufferStockRule, StockEntry, StockMovement,
} from '@/lib/services/inventory';
import { fetchProducts, Product } from '@/lib/services/products';

type TabView = 'stock' | 'warehouses' | 'buffer' | 'movements';

const CRYSTAL_ORANGE = '#FF8A00';
const CRYSTAL_BLUE = '#1E90FF';

export default function InventoryPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';

  const [tab, setTab] = useState<TabView>('stock');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseNode[]>([]);
  const [bufferRules, setBufferRules] = useState<BufferStockRule[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  // Forms
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [whName, setWhName] = useState('');
  const [whBranch, setWhBranch] = useState('');
  const [whAddress, setWhAddress] = useState('');

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjWarehouse, setAdjWarehouse] = useState('default');
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjType, setAdjType] = useState<'purchase' | 'adjustment' | 'return'>('adjustment');
  const [adjNote, setAdjNote] = useState('');

  const [showTransfer, setShowTransfer] = useState(false);
  const [tfProductId, setTfProductId] = useState('');
  const [tfFrom, setTfFrom] = useState('');
  const [tfTo, setTfTo] = useState('');
  const [tfQty, setTfQty] = useState('');

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [s, w, b, m, p] = await Promise.allSettled([
        fetchStockEntries(tenantId),
        fetchWarehouses(tenantId),
        fetchBufferRules(tenantId),
        fetchStockMovements(tenantId, { limit: '100' }),
        fetchProducts(tenantId),
      ]);
      if (s.status === 'fulfilled') setStockEntries(s.value);
      if (w.status === 'fulfilled') setWarehouses(w.value);
      if (b.status === 'fulfilled') setBufferRules(b.value);
      if (m.status === 'fulfilled') setMovements(m.value);
      if (p.status === 'fulfilled') setProducts(p.value);
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddWarehouse = async () => {
    if (!whName || !whBranch) return toast.error('Name and branch are required');
    try {
      await createWarehouse(tenantId, { name: whName, branchId: whBranch, address: whAddress, isDefault: false });
      toast.success('Warehouse added');
      setShowAddWarehouse(false);
      setWhName(''); setWhBranch(''); setWhAddress('');
      loadData();
    } catch { toast.error('Failed to add warehouse'); }
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      await deleteWarehouse(tenantId, id);
      toast.success('Warehouse removed');
      loadData();
    } catch { toast.error('Failed to remove warehouse'); }
  };

  const handleAdjustStock = async () => {
    if (!adjProductId || !adjQuantity) return toast.error('Product and quantity are required');
    try {
      await adjustStock(tenantId, {
        productId: adjProductId,
        warehouseId: adjWarehouse,
        quantity: Number(adjQuantity),
        type: adjType,
        note: adjNote,
      });
      toast.success('Stock adjusted');
      setShowAdjust(false);
      setAdjProductId(''); setAdjQuantity(''); setAdjNote('');
      loadData();
    } catch { toast.error('Failed to adjust stock'); }
  };

  const handleTransfer = async () => {
    if (!tfProductId || !tfFrom || !tfTo || !tfQty) return toast.error('All fields required');
    try {
      await transferStock(tenantId, {
        productId: tfProductId,
        fromWarehouseId: tfFrom,
        toWarehouseId: tfTo,
        quantity: Number(tfQty),
      });
      toast.success('Stock transferred');
      setShowTransfer(false);
      setTfProductId(''); setTfFrom(''); setTfTo(''); setTfQty('');
      loadData();
    } catch { toast.error('Failed to transfer stock'); }
  };

  const handleSaveBufferRules = async () => {
    try {
      await saveBufferRules(tenantId, bufferRules);
      toast.success('Buffer rules saved');
    } catch { toast.error('Failed to save buffer rules'); }
  };

  const getProductName = (id: string | number) => {
    const p = products.find((p) => String(p.id) === String(id) || p.name === String(id));
    return p?.name || String(id);
  };

  const filteredStock = stockEntries.filter((e) => {
    const name = getProductName(e.productId).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const tabs: { id: TabView; label: string; icon: React.ReactNode }[] = [
    { id: 'stock', label: 'Stock Levels', icon: <Package size={16} /> },
    { id: 'warehouses', label: 'Warehouses', icon: <Warehouse size={16} /> },
    { id: 'buffer', label: 'Buffer Rules', icon: <AlertTriangle size={16} /> },
    { id: 'movements', label: 'Movement Log', icon: <ArrowRightLeft size={16} /> },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Package size={22} style={{ color: CRYSTAL_ORANGE }} />
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Real-time stock sync, multi-warehouse, buffer thresholds</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
          <p className="text-sm text-gray-400">Loading inventory...</p>
        </div>
      )}

      {/* ─── Stock Levels Tab ─── */}
      {!loading && tab === 'stock' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowAdjust(true)}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg"
              style={{ background: CRYSTAL_ORANGE }}
            >
              <Plus size={14} /> Adjust
            </button>
            {warehouses.length > 1 && (
              <button
                onClick={() => setShowTransfer(true)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg"
                style={{ background: CRYSTAL_BLUE }}
              >
                <ArrowRightLeft size={14} /> Transfer
              </button>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Total Products</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{products.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Total Stock</p>
              <p className="text-lg font-bold" style={{ color: CRYSTAL_BLUE }}>{stockEntries.reduce((s, e) => s + e.quantity, 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Low Stock</p>
              <p className="text-lg font-bold text-red-500">{stockEntries.filter((e) => !e.availableOnline).length}</p>
            </div>
          </div>

          {filteredStock.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No stock entries found. Adjust stock to begin tracking.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStock.map((entry, i) => (
                <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{getProductName(entry.productId)}</p>
                    <p className="text-xs text-gray-400">{entry.warehouseName || entry.warehouseId}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${entry.availableOnline ? 'text-green-600' : 'text-red-500'}`}>{entry.quantity}</p>
                    {(entry.bufferThreshold ?? 0) > 0 && (
                      <p className="text-[10px] text-gray-400">Buffer: {entry.bufferThreshold}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adjust Stock Modal */}
          {showAdjust && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm">
                <h3 className="text-sm font-bold mb-3">Adjust Stock</h3>
                <div className="space-y-2.5">
                  <select value={adjProductId} onChange={(e) => setAdjProductId(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Select Product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={adjWarehouse} onChange={(e) => setAdjWarehouse(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <select value={adjType} onChange={(e) => setAdjType(e.target.value as 'purchase' | 'adjustment' | 'return')} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="adjustment">Adjustment</option>
                    <option value="purchase">Purchase (Add)</option>
                    <option value="return">Return (Add)</option>
                  </select>
                  <input type="number" placeholder="Quantity (+ or -)" value={adjQuantity} onChange={(e) => setAdjQuantity(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                  <input type="text" placeholder="Note (optional)" value={adjNote} onChange={(e) => setAdjNote(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowAdjust(false)} className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleAdjustStock} className="flex-1 px-3 py-2 text-sm text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>Adjust</button>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Modal */}
          {showTransfer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm">
                <h3 className="text-sm font-bold mb-3">Transfer Stock</h3>
                <div className="space-y-2.5">
                  <select value={tfProductId} onChange={(e) => setTfProductId(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Select Product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={tfFrom} onChange={(e) => setTfFrom(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">From Warehouse</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <select value={tfTo} onChange={(e) => setTfTo(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">To Warehouse</option>
                    {warehouses.filter((w) => w.id !== tfFrom).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <input type="number" placeholder="Quantity" value={tfQty} onChange={(e) => setTfQty(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowTransfer(false)} className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleTransfer} className="flex-1 px-3 py-2 text-sm text-white rounded-lg" style={{ background: CRYSTAL_BLUE }}>Transfer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Warehouses Tab ─── */}
      {!loading && tab === 'warehouses' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{warehouses.length} warehouse(s)</p>
            <button onClick={() => setShowAddWarehouse(!showAddWarehouse)} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>
              {showAddWarehouse ? <ChevronUp size={14} /> : <Plus size={14} />}
              {showAddWarehouse ? 'Close' : 'Add Warehouse'}
            </button>
          </div>

          {showAddWarehouse && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <input type="text" placeholder="Warehouse Name" value={whName} onChange={(e) => setWhName(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Branch ID" value={whBranch} onChange={(e) => setWhBranch(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder="Address (optional)" value={whAddress} onChange={(e) => setWhAddress(e.target.value)} className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <button onClick={handleAddWarehouse} className="px-4 py-2 text-xs font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>Add</button>
            </div>
          )}

          <div className="space-y-2">
            {warehouses.map((w) => (
              <div key={w.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                    <Warehouse size={16} style={{ color: CRYSTAL_BLUE }} />
                    {w.name}
                    {w.isDefault && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Default</span>}
                  </p>
                  <p className="text-xs text-gray-400">Branch: {w.branchId}{w.address ? ` • ${w.address}` : ''}</p>
                </div>
                {!w.isDefault && (
                  <button onClick={() => handleDeleteWarehouse(w.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Buffer Rules Tab ─── */}
      {!loading && tab === 'buffer' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Set safety thresholds. Products below the threshold will show as &quot;Out of Stock&quot; online.</p>
            </div>
            <button
              onClick={() => setBufferRules([...bufferRules, { productId: '', threshold: 5 }])}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white rounded-lg"
              style={{ background: CRYSTAL_ORANGE }}
            >
              <Plus size={14} /> Add Rule
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {bufferRules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                <select
                  value={String(rule.productId)}
                  onChange={(e) => {
                    const updated = [...bufferRules];
                    updated[i].productId = e.target.value;
                    setBufferRules(updated);
                  }}
                  className="flex-1 px-2 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Threshold"
                  value={rule.threshold}
                  onChange={(e) => {
                    const updated = [...bufferRules];
                    updated[i].threshold = Number(e.target.value);
                    setBufferRules(updated);
                  }}
                  className="w-24 px-2 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={() => setBufferRules(bufferRules.filter((_, j) => j !== i))}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {bufferRules.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No buffer rules set. Products will always show as available online.</p>
              </div>
            )}
          </div>

          {bufferRules.length > 0 && (
            <button onClick={handleSaveBufferRules} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: CRYSTAL_ORANGE }}>
              Save Buffer Rules
            </button>
          )}
        </div>
      )}

      {/* ─── Movement Log Tab ─── */}
      {!loading && tab === 'movements' && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Recent stock movements across all warehouses</p>
          {movements.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ArrowRightLeft size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No stock movements recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{getProductName(m.productId)}</p>
                    <p className="text-xs text-gray-400">
                      {m.type.charAt(0).toUpperCase() + m.type.slice(1)} • {m.warehouseId}
                      {m.note && ` • ${m.note}`}
                    </p>
                    <p className="text-[10px] text-gray-300">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${m.quantity >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {m.quantity >= 0 ? '+' : ''}{m.quantity}
                    </p>
                    <p className="text-[10px] text-gray-400">{m.previousQuantity} → {m.newQuantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
