'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchProducts, type Product } from '@/lib/services/products';
import { createOrder, type CreateOrderData, type OrderItem } from '@/lib/services/orders';
import { formatCurrency } from '@/lib/tenant-config';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, X,
  ArrowLeft, CreditCard, Banknote, FileText,
  CheckCircle, Package
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── types ─── */
type ViewMode = 'select' | 'review' | 'payment' | 'invoice';
interface CartItem extends Product { cartQty: number }

/* ─── theme colors ─── */
const ORANGE = '#FF8A00';
const BLUE = '#1E90FF';

export default function SellPage() {
  const { tenantId, tenantConfig } = useAuth();
  const router = useRouter();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);

  const [view, setView] = useState<ViewMode>('select');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* payment fields */
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'Due'>('Cash');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  const [lastOrder, setLastOrder] = useState<{ id: string; total: number } | null>(null);

  /* load products */
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    fetchProducts(tenantId)
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  /* derived */
  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.cartQty, 0), [cart]);
  const grandTotal = useMemo(() => Math.max(0, subtotal + deliveryCharge - discount), [subtotal, deliveryCharge, discount]);

  /* cart ops */
  const addToCart = useCallback((p: Product) => {
    setCart(prev => {
      const key = p._id || p.id?.toString() || p.name;
      const exists = prev.find(c => (c._id || c.id?.toString() || c.name) === key);
      if (exists) return prev.map(c => (c._id || c.id?.toString() || c.name) === key ? { ...c, cartQty: c.cartQty + 1 } : c);
      return [...prev, { ...p, cartQty: 1 }];
    });
  }, []);

  const updateQty = useCallback((idx: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], cartQty: Math.max(1, updated[idx].cartQty + delta) };
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }, []);

  /* submit sale */
  const handleSubmit = async () => {
    if (!tenantId || cart.length === 0) return;
    setSaving(true);
    try {
      const items: OrderItem[] = cart.map(c => ({
        name: c.name,
        quantity: c.cartQty,
        price: c.price,
        image: c.image || c.images?.[0],
        productId: c._id || c.id,
      }));
      const data: CreateOrderData = {
        customer: customer || 'Walk-in Customer',
        phone: phone || undefined,
        amount: grandTotal,
        items,
        paymentMethod: payMethod,
        deliveryCharge,
        discount,
        note: note || items.map(i => i.name).join(', '),
        status: payMethod === 'Cash' ? 'Delivered' : 'Pending',
        source: 'admin',
      };
      const res = await createOrder(tenantId, data);
      setLastOrder({ id: res._id || res.orderId || '', total: grandTotal });
      setView('invoice');
      toast.success('Sale completed!');
    } catch {
      toast.error('Failed to create sale');
    } finally {
      setSaving(false);
    }
  };

  /* reset */
  const handleNewSale = () => {
    setCart([]);
    setCustomer('');
    setPhone('');
    setPayMethod('Cash');
    setDeliveryCharge(0);
    setDiscount(0);
    setNote('');
    setLastOrder(null);
    setView('select');
  };

  /* ─── RENDER ─── */

  /* invoice / success screen */
  if (view === 'invoice') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${ORANGE}18` }}>
            <CheckCircle size={36} style={{ color: ORANGE }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sale Complete!</h2>
          <p className="text-3xl font-bold mb-1" style={{ color: ORANGE }}>{fc(lastOrder?.total || 0)}</p>
          <p className="text-sm text-gray-500 mb-6">{payMethod} • {cart.length} item{cart.length > 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={handleNewSale} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: BLUE }}>
              New Sale
            </button>
            <button onClick={() => router.push('/sales')} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
              Sale Book
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* payment step */
  if (view === 'payment') {
    return (
      <div className="p-3 md:p-6 max-w-lg mx-auto">
        <button onClick={() => setView('review')} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700">
          <ArrowLeft size={16} /> Back to Cart
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard size={22} style={{ color: BLUE }} /> Payment
        </h1>
        <div className="bg-white rounded-xl border p-4 space-y-3 mb-4">
          <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name (optional)" className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': BLUE } as React.CSSProperties} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': BLUE } as React.CSSProperties} />
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" rows={2} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 resize-none" style={{ '--tw-ring-color': BLUE } as React.CSSProperties} />
        </div>

        {/* payment method */}
        <div className="flex gap-2 mb-4">
          {(['Cash', 'Due'] as const).map(m => (
            <button
              key={m}
              onClick={() => setPayMethod(m)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 flex items-center justify-center gap-2 transition-all ${payMethod === m ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 bg-white'}`}
              style={payMethod === m ? { backgroundColor: m === 'Cash' ? ORANGE : BLUE } : undefined}
            >
              {m === 'Cash' ? <Banknote size={18} /> : <FileText size={18} />} {m}
            </button>
          ))}
        </div>

        {/* charges */}
        <div className="bg-white rounded-xl border p-4 space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="font-semibold">{fc(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Delivery Charge</span>
            <input type="number" value={deliveryCharge} onChange={e => setDeliveryCharge(Number(e.target.value) || 0)} className="w-24 text-right border rounded px-2 py-1 text-sm outline-none" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Discount</span>
            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} className="w-24 text-right border rounded px-2 py-1 text-sm outline-none" />
          </div>
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="font-bold text-gray-900">Grand Total</span>
            <span className="text-xl font-bold" style={{ color: ORANGE }}>{fc(grandTotal)}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: ORANGE }}
        >
          {saving ? 'Processing...' : `Complete Sale • ${fc(grandTotal)}`}
        </button>
      </div>
    );
  }

  /* review cart */
  if (view === 'review') {
    return (
      <div className="p-3 md:p-6 max-w-lg mx-auto">
        <button onClick={() => setView('select')} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700">
          <ArrowLeft size={16} /> Add More
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingCart size={22} style={{ color: ORANGE }} /> Cart ({cart.length})
        </h1>
        {cart.length === 0 ? (
          <div className="text-center py-12 bg-white border rounded-xl">
            <Package size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-white border rounded-xl p-3 flex items-center gap-3">
                  {(item.image || item.images?.[0]) ? (
                    <img src={item.image || item.images?.[0]} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Package size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{fc(item.price)} × {item.cartQty} = <span className="font-semibold" style={{ color: ORANGE }}>{fc(item.price * item.cartQty)}</span></p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-50">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.cartQty}</span>
                    <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-50">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => removeFromCart(idx)} className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 ml-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Subtotal</span>
                <span className="text-xl font-bold" style={{ color: ORANGE }}>{fc(subtotal)}</span>
              </div>
            </div>
            <button
              onClick={() => setView('payment')}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: BLUE }}
            >
              Proceed to Payment
            </button>
          </>
        )}
      </div>
    );
  }

  /* ─── select products (default) ─── */
  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart size={22} style={{ color: ORANGE }} /> Sell
        </h1>
        {cart.length > 0 && (
          <button
            onClick={() => setView('review')}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: ORANGE }}
          >
            <ShoppingCart size={16} /> Cart
            <span className="ml-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" style={{ color: ORANGE }}>
              {cart.length}
            </span>
          </button>
        )}
      </div>

      {/* search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2"
          style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
        />
      </div>

      {/* products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-3 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-lg mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl">
          <Package size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">{search ? 'No matching products' : 'No products found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filtered.map((p, idx) => {
            const key = p._id || p.id?.toString() || `${p.name}-${idx}`;
            const inCart = cart.find(c => (c._id || c.id?.toString() || c.name) === (p._id || p.id?.toString() || p.name));
            return (
              <button
                key={key}
                onClick={() => addToCart(p)}
                className={`bg-white border rounded-xl p-3 text-left transition-all hover:shadow-md relative ${inCart ? 'ring-2' : ''}`}
                style={inCart ? { '--tw-ring-color': ORANGE } as React.CSSProperties : undefined}
              >
                {inCart && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: ORANGE }}>
                    {inCart.cartQty}
                  </span>
                )}
                {(p.image || p.images?.[0]) ? (
                  <img src={p.image || p.images?.[0]} alt={p.name} className="aspect-square w-full rounded-lg object-cover mb-2" />
                ) : (
                  <div className="aspect-square w-full rounded-lg bg-gray-50 flex items-center justify-center mb-2">
                    <Package size={28} className="text-gray-300" />
                  </div>
                )}
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-sm font-bold" style={{ color: ORANGE }}>{fc(p.price)}</p>
                {p.stock !== undefined && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Stock: {p.stock}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* floating cart bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 flex items-center justify-between z-20 lg:left-64">
          <div>
            <p className="text-sm font-semibold text-gray-900">{cart.length} item{cart.length > 1 ? 's' : ''}</p>
            <p className="text-lg font-bold" style={{ color: ORANGE }}>{fc(subtotal)}</p>
          </div>
          <button
            onClick={() => setView('review')}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: BLUE }}
          >
            Review Cart →
          </button>
        </div>
      )}
    </div>
  );
}
