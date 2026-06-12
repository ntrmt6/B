'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createOrder, type CreateOrderData } from '@/lib/services/orders';
import { fetchEntities, type Entity } from '@/lib/services/entities';
import { formatCurrency } from '@/lib/tenant-config';
import {
  X, Calendar, Banknote, UserSearch, StickyNote,
  CheckCircle, ArrowLeft, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Theme Colors ─── */
const ORANGE = '#FF8A00';
const BLUE = '#1E90FF';

/* ─── Helpers ─── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .replace(/(\d+)/, (_, day) => {
      const n = parseInt(day, 10);
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    });
}

export default function QuickSellPage() {
  const { tenantId, tenantConfig } = useAuth();
  const router = useRouter();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);

  /* ─── Form State ─── */
  const [date, setDate] = useState(todayStr());
  const [payMethod, setPayMethod] = useState<'Cash' | 'Due'>('Cash');
  const [amount, setAmount] = useState('');
  const [profit, setProfit] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);

  /* ─── Customer Search ─── */
  const [entities, setEntities] = useState<Entity[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    if (!tenantId) return;
    fetchEntities(tenantId)
      .then(setEntities)
      .catch(() => { /* silent — customer search is optional */ });
  }, [tenantId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return entities.filter(e => e.type === 'Customer').slice(0, 10);
    const q = customerSearch.toLowerCase();
    return entities
      .filter(e => e.type === 'Customer' && (e.name.toLowerCase().includes(q) || e.phone?.includes(q)))
      .slice(0, 10);
  }, [entities, customerSearch]);

  const selectCustomer = useCallback((e: Entity) => {
    setCustomerName(e.name);
    setMobileNumber(e.phone || '');
    setShowCustomerSearch(false);
    setCustomerSearch('');
  }, []);

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!tenantId) return;

    setSaving(true);
    try {
      const profitVal = parseFloat(profit) || 0;
      const noteText = [
        note || 'Quick Sell',
        profitVal > 0 ? `Profit: ${fc(profitVal)}` : '',
      ].filter(Boolean).join(' | ');

      const data: CreateOrderData = {
        customer: customerName || 'Walk-in Customer',
        phone: mobileNumber || undefined,
        amount: amt,
        items: [{
          name: 'Quick Sale',
          quantity: 1,
          price: amt,
        }],
        paymentMethod: payMethod,
        note: noteText,
        status: payMethod === 'Cash' ? 'Delivered' : 'Pending',
        source: 'quick-sell',
      };
      await createOrder(tenantId, data);
      setLastTotal(amt);
      setSuccess(true);
      toast.success('Sale recorded!');
    } catch {
      toast.error('Failed to record sale');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Reset ─── */
  const handleNewSale = () => {
    setDate(todayStr());
    setPayMethod('Cash');
    setAmount('');
    setProfit('');
    setCustomerName('');
    setMobileNumber('');
    setNote('');
    setSuccess(false);
    setLastTotal(0);
  };

  /* ─── Success View ─── */
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${ORANGE}18` }}>
            <CheckCircle size={36} style={{ color: ORANGE }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sale Recorded!</h2>
          <p className="text-3xl font-bold mb-1" style={{ color: ORANGE }}>{fc(lastTotal)}</p>
          <p className="text-sm text-gray-500 mb-6">{payMethod} • Quick Sell</p>
          <div className="flex gap-2">
            <button onClick={handleNewSale}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: BLUE }}>
              New Quick Sell
            </button>
            <button onClick={() => router.push('/sales')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
              Sale Book
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main Form ─── */
  return (
    <div className="p-3 md:p-6 max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Quick Sell</h1>
        </div>
        <button onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600">
          <X size={22} />
        </button>
      </div>

      {/* Date of Sell */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Date of Sell</label>
        <div className="relative">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 bg-white appearance-none"
            style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
          />
          <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Method of Payment */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Method Of Payment</label>
        <div className="flex gap-2">
          {(['Cash', 'Due'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setPayMethod(m)}
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all"
              style={
                payMethod === m
                  ? { backgroundColor: m === 'Cash' ? '#f5f5f5' : 'rgba(30,144,255,0.06)', borderColor: m === 'Cash' ? '#d1d5db' : BLUE, color: '#1f2937' }
                  : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }
              }
            >
              <span
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={payMethod === m
                  ? { borderColor: m === 'Cash' ? '#6b7280' : BLUE }
                  : { borderColor: '#d1d5db' }}
              >
                {payMethod === m && (
                  <span className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: m === 'Cash' ? '#6b7280' : BLUE }} />
                )}
              </span>
              <Banknote size={16} />
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount"
          min="0"
          step="any"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
          style={{ '--tw-ring-color': ORANGE } as React.CSSProperties}
        />
      </div>

      {/* Profit */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Profit</label>
        <input
          type="number"
          value={profit}
          onChange={e => setProfit(e.target.value)}
          placeholder="Profit"
          min="0"
          step="any"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
          style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
        />
      </div>

      {/* Customer Name */}
      <div className="mb-4 relative">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Customer Name</label>
        <div className="relative">
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Customer Name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2"
            style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <UserSearch size={20} />
          </button>
        </div>

        {/* Customer Search Dropdown */}
        {showCustomerSearch && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white p-2 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1"
                  style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
                  autoFocus
                />
              </div>
            </div>
            {filteredCustomers.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-400">No customers found</div>
            ) : (
              filteredCustomers.map(c => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => selectCustomer(c)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mobile Number */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Mobile Number</label>
        <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2"
          style={{ '--tw-ring-color': BLUE } as React.CSSProperties}>
          <div className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 select-none">
            <span className="text-base">🇧🇩</span>
            <span className="text-xs text-gray-400">▾</span>
          </div>
          <input
            type="tel"
            value={mobileNumber}
            onChange={e => setMobileNumber(e.target.value)}
            placeholder="+88 XXXXXXXXXXX"
            className="flex-1 px-3 py-3 text-sm outline-none"
          />
        </div>
      </div>

      {/* Note */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
              style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
            />
          </div>
          <button
            type="button"
            className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"
          >
            <StickyNote size={20} />
          </button>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-20 lg:left-64">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !amount}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          {saving ? 'Processing...' : 'Amount Received'}
        </button>
      </div>
    </div>
  );
}
