'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchEntities, createEntity, updateEntity, deleteEntity, type Entity } from '@/lib/services/entities';
import { fetchLoyaltyAccounts, type LoyaltyAccount } from '@/lib/services/loyalty';
import { fetchOrders, type Order } from '@/lib/services/orders';
import { formatCurrency } from '@/lib/tenant-config';
import { Users, Plus, Phone, Mail, Edit2, Trash2, Save, X, Search, Star, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-700',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  platinum: 'bg-purple-100 text-purple-700',
};

export default function ContactsPage() {
  const { tenantId, tenantConfig } = useAuth();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [entityOrders, setEntityOrders] = useState<Record<string, Order[]>>({});

  const loadEntities = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [entitiesData, loyaltyData] = await Promise.allSettled([
        fetchEntities(tenantId),
        fetchLoyaltyAccounts(tenantId),
      ]);
      if (entitiesData.status === 'fulfilled') setEntities(entitiesData.value);
      if (loyaltyData.status === 'fulfilled') setLoyaltyAccounts(loyaltyData.value);
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadEntities(); }, [loadEntities]);

  const getLoyaltyAccount = (entity: Entity): LoyaltyAccount | undefined => {
    return loyaltyAccounts.find(
      (a) => a.customerPhone === entity.phone || a.customerEmail === entity.email || a.customerName === entity.name
    );
  };

  const handleToggleHistory = async (entityId: string, entity: Entity) => {
    if (expandedEntity === entityId) {
      setExpandedEntity(null);
      return;
    }
    setExpandedEntity(entityId);
    if (!entityOrders[entityId] && tenantId) {
      try {
        const { orders: allOrders } = await fetchOrders(tenantId);
        const matching = allOrders.filter(
          (o) => o.customerPhone === entity.phone || o.customerName === entity.name
        );
        setEntityOrders((prev) => ({ ...prev, [entityId]: matching }));
      } catch {
        // Silently fail — purchase history is optional
      }
    }
  };

  const filtered = entities.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) || e.phone?.includes(search);
    const matchType = !typeFilter || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAdd = async (name: string, phone: string, email: string, type: 'Customer' | 'Supplier' | 'Employee', address: string) => {
    if (!tenantId) return;
    try {
      await createEntity(tenantId, { name, phone, email, type, address, totalOwedToMe: 0, totalIOweThemNumber: 0 });
      toast.success('Contact added');
      setShowForm(false);
      loadEntities();
    } catch {
      toast.error('Failed to add contact');
    }
  };

  const handleUpdate = async () => {
    if (!tenantId || !editingEntity) return;
    try {
      await updateEntity(tenantId, editingEntity._id, editingEntity);
      toast.success('Contact updated');
      setEditingEntity(null);
      loadEntities();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenantId || !confirm('Delete this contact?')) return;
    try {
      await deleteEntity(tenantId, id);
      setEntities(prev => prev.filter(e => e._id !== id));
      toast.success('Contact deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-blue-500" />
            Contacts
          </h1>
          <p className="text-sm text-gray-500">{entities.length} contacts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm outline-none">
          <option value="">All Types</option>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
        </select>
      </div>

      {showForm && <ContactForm entityTypes={tenantConfig.entityTypes} onSave={handleAdd} onCancel={() => setShowForm(false)} />}

      {editingEntity && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditingEntity(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Edit Contact</h3>
            <div className="space-y-3">
              <input value={editingEntity.name} onChange={e => setEditingEntity({ ...editingEntity, name: e.target.value })} placeholder="Name" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" />
              <input value={editingEntity.phone || ''} onChange={e => setEditingEntity({ ...editingEntity, phone: e.target.value })} placeholder="Phone" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" />
              <input value={editingEntity.email || ''} onChange={e => setEditingEntity({ ...editingEntity, email: e.target.value })} placeholder="Email" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" />
              <input value={editingEntity.address || ''} onChange={e => setEditingEntity({ ...editingEntity, address: e.target.value })} placeholder="Address" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleUpdate} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"><Save size={14} /> Save</button>
              <button onClick={() => setEditingEntity(null)} className="flex items-center gap-1 border px-4 py-2 rounded-lg text-sm"><X size={14} /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white border rounded-lg p-4 animate-pulse h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{search ? 'No contacts match' : 'No contacts yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(entity => {
            const loyalty = entity.type === 'Customer' ? getLoyaltyAccount(entity) : undefined;
            const isExpanded = expandedEntity === entity._id;
            const orders = entityOrders[entity._id] || [];
            return (
            <div key={entity._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900">{entity.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entity.type === 'Customer' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{entity.type}</span>
                    {loyalty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TIER_COLORS[loyalty.tier] || 'bg-gray-100 text-gray-600'}`}>
                        {loyalty.tier.charAt(0).toUpperCase() + loyalty.tier.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditingEntity({ ...entity })} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(entity._id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                {entity.phone && <p className="flex items-center gap-1"><Phone size={12} /> {entity.phone}</p>}
                {entity.email && <p className="flex items-center gap-1"><Mail size={12} /> {entity.email}</p>}
              </div>
              {/* Loyalty Points */}
              {loyalty && (
                <div className="mt-2 pt-2 border-t flex items-center gap-2">
                  <Star size={14} className="text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-600">{loyalty.currentBalance} pts</span>
                  <span className="text-[10px] text-gray-400">({loyalty.totalPointsEarned} earned • {loyalty.totalPointsRedeemed} redeemed)</span>
                </div>
              )}
              <div className="mt-2 pt-2 border-t">
                <span className={`text-sm font-bold ${(entity.totalOwedToMe || 0) > 0 ? 'text-red-600' : (entity.totalIOweThemNumber || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  Receivable: {fc(entity.totalOwedToMe || 0)} | Payable: {fc(entity.totalIOweThemNumber || 0)}
                </span>
              </div>
              {/* Purchase History Toggle */}
              {entity.type === 'Customer' && (
                <button
                  onClick={() => handleToggleHistory(entity._id, entity)}
                  className="flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700"
                >
                  <ShoppingBag size={12} />
                  Purchase History
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
              {isExpanded && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-xs text-gray-400">No purchase history found.</p>
                  ) : (
                    orders.slice(0, 10).map((order, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5">
                        <div>
                          <span className="font-medium">{order.orderId || order._id}</span>
                          <span className="text-gray-400 ml-1">• {order.source === 'store' ? '🏪' : '🌐'} {order.status}</span>
                        </div>
                        <span className="font-bold text-gray-700">৳{(order.total || order.grandTotal || 0).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContactForm({ entityTypes, onSave, onCancel }: { entityTypes: string[]; onSave: (name: string, phone: string, email: string, type: 'Customer' | 'Supplier' | 'Employee', address: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<string>(entityTypes[0] || 'Customer');
  const [address, setAddress] = useState('');

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">New Contact</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2" />
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => { if (!name) { toast.error('Name required'); return; } onSave(name, phone, email, type as 'Customer' | 'Supplier' | 'Employee', address); }} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"><Save size={14} /> Save</button>
        <button onClick={onCancel} className="flex items-center gap-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"><X size={14} /> Cancel</button>
      </div>
    </div>
  );
}
