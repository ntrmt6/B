'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchPurchases, createPurchase, deletePurchase, type Purchase, type PurchaseItem, type CreatePurchaseData } from '@/lib/services/purchases';
import { fetchProducts, type Product } from '@/lib/services/products';
import { formatCurrency } from '@/lib/tenant-config';
import {
  ArrowLeft, BookOpen, Search, ScanLine, RefreshCw, ChevronDown, Plus, Minus,
  X, ShoppingBag, Package, ArrowRight, User, Printer, MoreVertical, Eye, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const AMBER = '#F59E0B';
const BLUE  = '#1E90FF';
const DARK  = '#1A1A2E';

type ViewMode = 'select' | 'review' | 'cash' | 'due' | 'book' | 'invoice';

/* ── Cart item ─────────────────────────────────────────────────────────────── */
interface CartItem {
  productId: string | number;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  stock: number;
}

/* ── Sub-components ────────────────────────────────────────────────────────── */
function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-black font-semibold" style={{ background: AMBER }}>
      <div className="flex items-center gap-3">
        {onBack && <button onClick={onBack} aria-label="Go back"><ArrowLeft className="w-5 h-5" /></button>}
        <h1 className="text-lg">{title}</h1>
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-[#1E90FF]' : 'bg-gray-300'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */
export default function PurchasesPage() {
  const { tenantId, tenantConfig } = useAuth();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);

  const [view, setView] = useState<ViewMode>('select');

  // Products & cart
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBarcode, setShowBarcode] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number | string>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number | string>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Purchase book
  const [purchaseRecords, setPurchaseRecords] = useState<Purchase[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Due tab
  const [dueTabType, setDueTabType] = useState<'customer' | 'supplier'>('supplier');

  // Invoice
  const [invoiceData, setInvoiceData] = useState<{
    invoiceNumber: string; date: string; supplierName: string; mobileNumber: string;
    address: string; items: CartItem[]; subTotal: number; discount: number;
    deliveryCharge: number; grandTotal: number; paidAmount: number; dueAmount: number;
    paymentType: 'cash' | 'due';
  } | null>(null);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    dateOfPurchase: new Date().toISOString().split('T')[0],
    amount: 0, cashPaid: 0, note: '', supplierName: '', mobileNumber: '',
    countryCode: '+88', address: '', customInvoiceNumber: false, invoiceNumber: '',
  });

  /* ── Data loading ──────────────────────────────────────────────────────── */
  const loadProducts = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await fetchProducts(tenantId);
      setProducts(data || []);
    } catch { toast.error('Failed to load products'); }
  }, [tenantId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const loadPurchaseRecords = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await fetchPurchases(tenantId, { pageSize: '100' });
      setPurchaseRecords(data.purchases || []);
    } catch { toast.error('Failed to load purchases'); }
  }, [tenantId]);

  useEffect(() => { if (view === 'book') loadPurchaseRecords(); }, [view, loadPurchaseRecords]);

  /* ── Cart logic ────────────────────────────────────────────────────────── */
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }, [products, searchQuery]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const pid = product._id || product.id || product.name;
      const existing = prev.find(i => i.productId === pid);
      if (existing) {
        return prev.map(i => i.productId === pid
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
          : i);
      }
      const price = product.cost || product.price || 0;
      return [...prev, {
        productId: pid, productName: product.name, productImage: product.image || '',
        sku: product.sku || '', quantity: 1, price, total: price, stock: product.stock || 0,
      }];
    });
  }, []);

  const handleBarcodeScan = useCallback(() => {
    if (!barcodeQuery.trim()) return;
    const p = products.find(p => p.sku?.toLowerCase() === barcodeQuery.toLowerCase());
    if (p) { addToCart(p); setBarcodeQuery(''); toast.success(`Added ${p.name}`); }
    else toast.error('Product not found');
  }, [barcodeQuery, products, addToCart]);

  const updateCartItem = (pid: string | number, field: keyof CartItem, value: number | string) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== pid) return i;
      const updated = { ...i, [field]: value };
      if (field === 'quantity' || field === 'price') updated.total = Number(updated.quantity) * Number(updated.price);
      return updated;
    }));
  };

  const removeFromCart = (pid: string | number) => setCart(prev => prev.filter(i => i.productId !== pid));
  const clearCart = () => { setCart([]); setDiscount(0); setDeliveryCharge(0); };
  const getCartCount = (pid: string | number) => cart.find(i => i.productId === pid)?.quantity || 0;

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.total, 0), [cart]);
  const grandTotal = useMemo(() => cartTotal - (Number(discount) || 0) + (Number(deliveryCharge) || 0), [cartTotal, discount, deliveryCharge]);

  /* ── Payment ───────────────────────────────────────────────────────────── */
  const generateInvoiceNumber = () => Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

  const openPaymentView = (type: 'cash' | 'due') => {
    if (!cart.length) { toast.error('Add products first'); return; }
    setPaymentForm(f => ({ ...f, dateOfPurchase: new Date().toISOString().split('T')[0], amount: grandTotal, cashPaid: type === 'cash' ? grandTotal : 0 }));
    setView(type);
  };

  const handlePayment = async (paymentType: 'cash' | 'due') => {
    if (!tenantId) { toast.error('Tenant ID required'); return; }
    if (!paymentForm.supplierName.trim()) { toast.error('Supplier name required'); return; }

    setIsSubmitting(true);
    try {
      const invoiceNum = paymentForm.customInvoiceNumber && paymentForm.invoiceNumber ? paymentForm.invoiceNumber : generateInvoiceNumber();
      const paid = paymentType === 'cash' ? grandTotal : paymentForm.cashPaid;
      const due = paymentType === 'cash' ? 0 : grandTotal - paymentForm.cashPaid;

      const payload: CreatePurchaseData = {
        items: cart.map(i => ({ productId: i.productId, productName: i.productName, image: i.productImage, sku: i.sku, quantity: i.quantity, unitPrice: i.price, totalPrice: i.total })),
        totalAmount: grandTotal, subTotal: cartTotal, discount: Number(discount) || 0, deliveryCharge: Number(deliveryCharge) || 0,
        paymentType, supplierName: paymentForm.supplierName,
        mobileNumber: paymentForm.countryCode + paymentForm.mobileNumber,
        address: paymentForm.address, note: paymentForm.note, cashPaid: paid, dueAmount: due,
        invoiceNumber: invoiceNum, dateOfPurchase: paymentForm.dateOfPurchase,
      };

      await createPurchase(tenantId, payload);
      setInvoiceData({
        invoiceNumber: invoiceNum, date: new Date().toLocaleString('bn-BD'),
        supplierName: paymentForm.supplierName, mobileNumber: paymentForm.countryCode + paymentForm.mobileNumber,
        address: paymentForm.address, items: cart, subTotal: cartTotal,
        discount: Number(discount) || 0, deliveryCharge: Number(deliveryCharge) || 0,
        grandTotal, paidAmount: paid, dueAmount: due, paymentType,
      });
      setView('invoice');
      toast.success(paymentType === 'cash' ? 'Payment successful!' : 'Purchase saved!');
      loadProducts(); // refresh stock
    } catch { toast.error('Failed to process'); }
    finally { setIsSubmitting(false); }
  };

  const closeInvoice = () => {
    setInvoiceData(null); clearCart();
    setPaymentForm({ dateOfPurchase: new Date().toISOString().split('T')[0], amount: 0, cashPaid: 0, note: '', supplierName: '', mobileNumber: '', countryCode: '+88', address: '', customInvoiceNumber: false, invoiceNumber: '' });
    setView('select');
  };

  /* ── Computed ──────────────────────────────────────────────────────────── */
  const totalPurchaseAmount = useMemo(() => purchaseRecords.reduce((s, r) => s + (r.totalAmount || 0), 0), [purchaseRecords]);
  const groupedPurchases = useMemo(() => {
    const g: Record<string, Purchase[]> = {};
    purchaseRecords.forEach(r => {
      const d = new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      (g[d] ||= []).push(r);
    });
    return g;
  }, [purchaseRecords]);

  /* ── VIEW: Select Products ─────────────────────────────────────────────── */
  const renderSelect = () => (
    <div className="flex flex-col h-full min-h-screen">
      <Header title="Purchase" right={<button onClick={() => setView('book')} className="p-1" aria-label="Purchase book"><BookOpen className="w-5 h-5" /></button>} />
      <div className="px-4 py-2 bg-amber-50 text-sm font-medium text-gray-700">Select Products to Purchase</div>

      <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none" />
        </div>
        {showBarcode && (
          <input type="text" placeholder="Barcode" value={barcodeQuery} onChange={e => setBarcodeQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBarcodeScan()} autoFocus
            className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-amber-400" />
        )}
        <button onClick={() => setShowBarcode(!showBarcode)} aria-label="Toggle barcode"
          className={`p-2 border rounded-lg ${showBarcode ? 'border-amber-400 bg-amber-50 text-amber-600' : 'hover:bg-gray-50'}`}>
          <ScanLine className="w-4 h-4" />
        </button>
        <button onClick={loadProducts} className="p-2 border rounded-lg hover:bg-gray-50" aria-label="Refresh products">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {filteredProducts.map(product => {
          const pid = product._id || product.id || product.name;
          const cnt = getCartCount(pid);
          return (
            <div key={pid} className="flex items-center gap-2.5 px-3 py-2.5 border-b hover:bg-gray-50">
              <img src={product.image || '/placeholder.png'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">Price: {product.cost || product.price || 0} &middot; Stock: {product.stock ?? 0}</p>
              </div>
              <div className="relative flex-shrink-0">
                <button onClick={() => addToCart(product)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: DARK }}>
                  Add <ChevronDown className="w-3 h-3" />
                </button>
                {cnt > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cnt}</span>}
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-gray-400"><Package className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">No products found</p></div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 py-3 text-white text-sm" style={{ background: DARK }}>
          <div><span className="opacity-80">Selected Products: ({cart.length})</span><br /><span className="font-semibold">Total: {fc(cartTotal)}</span></div>
          <button onClick={() => { if (!cart.length) { toast.error('Add products first'); return; } setView('review'); }}
            className="px-4 py-2 rounded-lg font-medium text-sm" style={{ background: BLUE }}>
            Purchase &gt;
          </button>
        </div>
      </div>
    </div>
  );

  /* ── VIEW: Review Cart ─────────────────────────────────────────────────── */
  const renderReview = () => (
    <div className="flex flex-col h-full min-h-screen">
      <Header title="Review Purchase" onBack={() => setView('select')}
        right={cart.length > 0 ? <button onClick={clearCart} className="text-sm">Clear</button> : undefined} />

      <div className="flex-1 overflow-y-auto pb-24">
        {cart.length === 0 ? (
          <div className="py-16 text-center text-gray-400"><ShoppingBag className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">No products selected</p></div>
        ) : (
          <div className="p-3 space-y-3">
            {cart.map(item => (
              <div key={String(item.productId)} className="bg-white border rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <img src={item.productImage || '/placeholder.png'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium truncate flex-1">{item.productName}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="ml-2 p-1 text-red-400 hover:text-red-600" aria-label={`Remove ${item.productName}`}><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium">QTY</label>
                        <div className="flex items-center mt-0.5">
                          <button onClick={() => updateCartItem(item.productId, 'quantity', Math.max(1, item.quantity - 1))}
                            className="p-1 border rounded-l-md hover:bg-gray-50" aria-label="Decrease"><Minus className="w-3 h-3" /></button>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(item.productId, 'quantity', Number(e.target.value) || 1)}
                            className="w-full px-1 py-1 border-y text-center text-xs outline-none" />
                          <button onClick={() => updateCartItem(item.productId, 'quantity', item.quantity + 1)}
                            className="p-1 border rounded-r-md hover:bg-gray-50" aria-label="Increase"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium">PRICE</label>
                        <input type="number" min="0" step="0.01" value={item.price}
                          onChange={e => updateCartItem(item.productId, 'price', Number(e.target.value) || 0)}
                          className="w-full mt-0.5 px-2 py-1 border rounded text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium">TOTAL</label>
                        <input type="text" value={fc(item.total)} readOnly className="w-full mt-0.5 px-2 py-1 border rounded text-xs bg-gray-50 font-medium" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">{fc(cartTotal)}</span></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount</span>
                <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-24 px-2 py-1 border rounded text-right text-sm outline-none" />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Delivery</span>
                <input type="number" min="0" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="w-24 px-2 py-1 border rounded text-right text-sm outline-none" />
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Grand Total</span>
                <span className="text-lg font-bold" style={{ color: BLUE }}>{fc(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="grid grid-cols-2 gap-3 p-3 bg-white border-t">
            <button onClick={() => openPaymentView('cash')} className="py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2" style={{ background: DARK }}>
              Cash <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => openPaymentView('due')} className="py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2" style={{ background: BLUE }}>
              Due <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  /* ── VIEW: Payment ─────────────────────────────────────────────────────── */
  const renderPayment = () => {
    const isCash = view === 'cash';
    return (
      <div className="flex flex-col h-full min-h-screen">
        <Header title={isCash ? 'Confirm Payment' : 'Money Given Entry'} onBack={() => setView('review')} />
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="p-4 space-y-3">
            {!isCash && (
              <>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['customer', 'supplier'] as const).map(t => (
                    <button key={t} onClick={() => setDueTabType(t)}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition ${dueTabType === t ? 'bg-white shadow' : 'text-gray-500'}`}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="bg-gray-100 rounded-lg py-2.5 text-center text-sm font-medium">Total payable {fc(grandTotal)}</div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Purchase</label>
              <input type="date" value={paymentForm.dateOfPurchase}
                onChange={e => setPaymentForm(f => ({ ...f, dateOfPurchase: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none" />
            </div>
            {isCash ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                <input type="number" value={paymentForm.amount} readOnly className="w-full px-3 py-2.5 border rounded-lg bg-gray-50 text-sm" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash Paid <span className="text-red-500">*</span></label>
                <input type="number" value={paymentForm.cashPaid}
                  onChange={e => setPaymentForm(f => ({ ...f, cashPaid: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none" placeholder="0" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input type="text" value={paymentForm.note} onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Note" className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="text" value={paymentForm.supplierName} onChange={e => setPaymentForm(f => ({ ...f, supplierName: e.target.value }))}
                  placeholder="Supplier Name" className="w-full px-3 py-2.5 border rounded-lg pr-9 text-sm outline-none" />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex gap-2">
                <select value={paymentForm.countryCode} onChange={e => setPaymentForm(f => ({ ...f, countryCode: e.target.value }))}
                  className="px-2 py-2.5 border rounded-lg bg-white text-sm outline-none">
                  <option value="+88">🇧🇩 +88</option><option value="+91">🇮🇳 +91</option><option value="+1">🇺🇸 +1</option>
                </select>
                <input type="text" value={paymentForm.mobileNumber} onChange={e => setPaymentForm(f => ({ ...f, mobileNumber: e.target.value }))}
                  placeholder="XXXXXXXXXXX" className="flex-1 px-3 py-2.5 border rounded-lg text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={paymentForm.address} onChange={e => setPaymentForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Address" className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none" />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Custom Invoice Number</span>
              <Toggle on={paymentForm.customInvoiceNumber} onToggle={() => setPaymentForm(f => ({ ...f, customInvoiceNumber: !f.customInvoiceNumber }))} />
            </div>
            {paymentForm.customInvoiceNumber && (
              <input type="text" value={paymentForm.invoiceNumber} onChange={e => setPaymentForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                placeholder="Invoice Number" className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none" />
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="p-3 bg-white border-t">
            <button onClick={() => handlePayment(isCash ? 'cash' : 'due')} disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-medium text-white text-sm ${isSubmitting ? 'bg-gray-400' : ''}`}
              style={isSubmitting ? undefined : { background: BLUE }}>
              {isSubmitting ? 'Processing...' : isCash ? 'Confirm Payment' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ── VIEW: Purchase Book ───────────────────────────────────────────────── */
  const renderBook = () => (
    <div className="flex flex-col h-full min-h-screen">
      <Header title="Purchase Book" onBack={() => setView('select')} />
      <div className="px-4 py-2 bg-amber-50 flex items-center justify-between">
        <span className="text-sm font-medium">Total: <span style={{ color: BLUE }}>{fc(totalPurchaseAmount)}</span></span>
        <button onClick={loadPurchaseRecords} className="p-1.5 hover:bg-white/60 rounded-lg" aria-label="Refresh"><RefreshCw className="w-4 h-4 text-gray-600" /></button>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <input type="date" className="flex-1 px-2 py-1.5 border rounded-lg text-xs outline-none" value={dateRange.start}
          onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))} />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" className="flex-1 px-2 py-1.5 border rounded-lg text-xs outline-none" value={dateRange.end}
          onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))} />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(groupedPurchases).map(([date, records]) => (
          <div key={date} className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold" style={{ color: BLUE }}>{date}</h3>
              <span className="text-xs" style={{ color: BLUE }}>{fc(records.reduce((s, r) => s + r.totalAmount, 0))}</span>
            </div>
            <div className="space-y-2">
              {records.map(record => (
                <div key={record._id} className="bg-white border rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">#{record.purchaseNumber || record._id.slice(-6)}</p>
                      <p className="text-sm font-medium" style={{ color: BLUE }}>{fc(record.totalAmount)}</p>
                      <p className="text-xs text-gray-500">Items: {record.items?.length || 0}</p>
                      {record.supplierName && <p className="text-xs text-gray-500 mt-0.5">{record.supplierName}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${record.paymentType === 'cash' ? 'bg-green-100 text-green-700' : record.paymentType === 'due' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {(record.paymentType || 'CASH').toUpperCase()}
                      </span>
                      <div className="relative">
                        <button onClick={() => setMenuOpenId(menuOpenId === record._id ? null : record._id)}
                          className="p-1 hover:bg-gray-100 rounded" aria-label="Options">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {menuOpenId === record._id && (
                          <div className="absolute right-0 top-full mt-1 w-28 bg-white border rounded-lg shadow-lg z-10 py-1">
                            <button onClick={() => { setMenuOpenId(null); toast.success('View details'); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50"><Eye className="w-3.5 h-3.5" /> View</button>
                            <button onClick={() => { setMenuOpenId(null); toast.success('Edit purchase'); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50"><Edit className="w-3.5 h-3.5" /> Edit</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {purchaseRecords.length === 0 && (
          <div className="py-16 text-center text-gray-400"><Package className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">No purchase records</p></div>
        )}
      </div>
    </div>
  );

  /* ── VIEW: Invoice ─────────────────────────────────────────────────────── */
  const renderInvoice = () => invoiceData && (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <Header title="Invoice" onBack={closeInvoice} right={<span className="text-sm font-bold text-green-700">✓ Successful</span>} />
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white rounded-xl p-4">
          <h4 className="text-center font-bold mb-3">ইনভয়েস</h4>
          <div className="grid grid-cols-2 gap-1 text-xs mb-3">
            <p><span className="text-gray-500">সাপ্লায়ার:</span> {invoiceData.supplierName || '-'}</p>
            <p className="text-right"><span className="text-gray-500">ইনভয়েস:</span> {invoiceData.invoiceNumber}</p>
            <p><span className="text-gray-500">মোবাইল:</span> {invoiceData.mobileNumber || '-'}</p>
            <p className="text-right"><span className="text-gray-500">তারিখ:</span> {invoiceData.date}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border mb-3">
              <thead className="bg-gray-50">
                <tr><th className="p-1.5 border text-left">#</th><th className="p-1.5 border text-left">পণ্য</th><th className="p-1.5 border text-center">পরিমাণ</th><th className="p-1.5 border text-right">মূল্য</th><th className="p-1.5 border text-right">মোট</th></tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, i) => (
                  <tr key={String(item.productId)}>
                    <td className="p-1.5 border">{i + 1}</td>
                    <td className="p-1.5 border">{item.productName}</td>
                    <td className="p-1.5 border text-center">{item.quantity}</td>
                    <td className="p-1.5 border text-right">{fc(item.price)}</td>
                    <td className="p-1.5 border text-right">{fc(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <p>বর্তমান বাকি: <span style={{ color: BLUE }}>{fc(invoiceData.dueAmount)}</span></p>
            </div>
            <div className="text-right space-y-0.5">
              <p>সাব টোটাল: {fc(invoiceData.subTotal)}</p>
              <p>(-) ছাড়: {fc(invoiceData.discount)}</p>
              <p>ডেলিভারি: {fc(invoiceData.deliveryCharge)}</p>
              <p className="font-medium">মোট: {fc(invoiceData.grandTotal)}</p>
              <p>পরিশোধিত: {fc(invoiceData.paidAmount)}</p>
              <p>বাকি: <span style={{ color: BLUE }}>{fc(invoiceData.dueAmount)}</span></p>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="p-3 bg-white border-t">
          <button onClick={() => window.print()} className="w-full py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2" style={{ background: BLUE }}>
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen relative">
      {view === 'select' && renderSelect()}
      {view === 'review' && renderReview()}
      {(view === 'cash' || view === 'due') && renderPayment()}
      {view === 'book' && renderBook()}
      {view === 'invoice' && renderInvoice()}
    </div>
  );
}
