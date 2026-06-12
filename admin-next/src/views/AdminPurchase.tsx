import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search, Plus, X, Package, ShoppingBag, ChevronDown, Calendar, ScanLine, Upload,
  ArrowRight, User, Printer, Download, RefreshCw, MoreVertical, Eye, Edit,
  ArrowLeft, BookOpen, Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Product, Category, SubCategory } from '../types';
import { DataService } from '../services/DataService';
import { getAuthHeader, getStoredToken } from '../services/authService';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface PurchaseItem {
  productId: number;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  expiryDate?: string;
  stock: number;
}

interface NewProductForm {
  name: string;
  currentStock: number;
  purchasePrice: number;
  sellPrice: number;
  unit: string;
  category: string;
  subCategory: string;
  description: string;
  sellOnline: boolean;
  sellInBulk: boolean;
  lowStockAlert: boolean;
  vatApplicable: boolean;
  warranty: boolean;
  discount: boolean;
  barcode: boolean;
  image: string;
}

interface PaymentForm {
  dateOfPurchase: string;
  amount: number;
  cashPaid: number;
  note: string;
  supplierName: string;
  mobileNumber: string;
  countryCode: string;
  address: string;
  customInvoiceNumber: boolean;
  invoiceNumber: string;
  employeeInfo: boolean;
  employeeName: string;
  employeeNumber: string;
  sendSMS: boolean;
}

interface PurchaseRecord {
  _id: string;
  purchaseNumber: string;
  items: any[];
  totalAmount: number;
  paymentType: 'cash' | 'due';
  supplierName: string;
  mobileNumber: string;
  address: string;
  note: string;
  cashPaid: number;
  dueAmount: number;
  employeeName?: string;
  createdAt: string;
  tenantId: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  supplierName: string;
  mobileNumber: string;
  address: string;
  items: PurchaseItem[];
  subTotal: number;
  discount: number;
  deliveryCharge: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentType: 'cash' | 'due';
  buyerName: string;
}

interface AdminPurchaseProps {
  products?: Product[];
  tenantId?: string;
  categories?: Category[];
  storeInfo?: { name: string; address: string; phone: string };
}

// ─── Theme ───────────────────────────────────────────────────────────────────

const ORANGE = '#FF8A00';
const BLUE = '#1E90FF';
const DARK = '#1A1A2E';

type ViewMode = 'select' | 'review' | 'cash' | 'due' | 'book' | 'invoice';

// ─── Reusable sub-components ─────────────────────────────────────────────────

const Header: React.FC<{ title: string; onBack?: () => void; right?: React.ReactNode }> = ({ title, onBack, right }) => (
  <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: ORANGE }}>
    <div className="flex items-center gap-3">
      {onBack && <button onClick={onBack} aria-label="Go back"><ArrowLeft className="w-5 h-5" /></button>}
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
    {right}
  </div>
);

const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-[#1E90FF]' : 'bg-gray-300'}`}>
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminPurchase: React.FC<AdminPurchaseProps> = ({ products = [], tenantId, categories = [], storeInfo }) => {
  // View
  const [view, setView] = useState<ViewMode>('select');

  // Data
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [discount, setDiscount] = useState<number | string>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number | string>(0);

  // Purchase book
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

  // Due tab
  const [dueTabType, setDueTabType] = useState<'customer' | 'supplier'>('supplier');

  // Invoice
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Add product
  const [showAddProductPanel, setShowAddProductPanel] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    dateOfPurchase: new Date().toISOString().split('T')[0],
    amount: 0, cashPaid: 0, note: '', supplierName: '', mobileNumber: '',
    countryCode: '+88', address: '', customInvoiceNumber: false, invoiceNumber: '',
    employeeInfo: false, employeeName: '', employeeNumber: '', sendSMS: false
  });

  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: '', currentStock: 0, purchasePrice: 0, sellPrice: 0, unit: '', category: '',
    subCategory: '', description: '', sellOnline: false, sellInBulk: false,
    lowStockAlert: false, vatApplicable: false, warranty: false, discount: false,
    barcode: false, image: ''
  });

  // ─── Data loading ────────────────────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      if (!tenantId) return;
      try {
        if (products.length === 0) {
          const data = await DataService.getProducts(tenantId);
          setProductsList(data || []);
        }
        if (categories.length === 0) {
          const cats = await DataService.getCatalog('categories', [], tenantId);
          setCategoriesList(cats || []);
        }
      } catch (error) { console.error('Error loading data:', error); }
    };
    loadData();
  }, [products, categories, tenantId]);

  useEffect(() => {
    if (products.length > 0) setProductsList(products);
    if (categories.length > 0) setCategoriesList(categories);
  }, [products, categories]);

  useEffect(() => {
    const loadSubCategories = async () => {
      if (newProduct.category && tenantId) {
        try {
          const allSubs = await DataService.getCatalog('subcategories', [], tenantId);
          setSubCategories(allSubs.filter((sub: any) => sub.category === newProduct.category || sub.parentCategory === newProduct.category) || []);
        } catch { setSubCategories([]); }
      } else { setSubCategories([]); }
    };
    loadSubCategories();
  }, [newProduct.category, tenantId]);

  const loadPurchaseRecords = async () => {
    if (!tenantId) return;
    try {
      const response = await fetch('/api/purchases', {
        headers: { 'X-Tenant-Id': tenantId, ...getAuthHeader() }
      });
      if (response.ok) setPurchaseRecords((await response.json()) || []);
    } catch (error) { console.error('Error loading purchases:', error); }
  };

  useEffect(() => {
    if (view === 'book' && tenantId) loadPurchaseRecords();
  }, [view, tenantId]);

  // ─── Cart logic ──────────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsList;
    const lowerQuery = searchQuery.toLowerCase();
    return productsList.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) || p.sku?.toLowerCase().includes(lowerQuery) || p.category?.toLowerCase().includes(lowerQuery)
    );
  }, [productsList, searchQuery]);

  const generateSKU = (product: Product) => {
    const prefix = product.category?.substring(0, 2).toUpperCase() || 'PR';
    return `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product.id, productName: product.name, productImage: product.image || '',
        sku: product.sku || generateSKU(product), quantity: 1,
        price: product.costPrice || product.price || 0, total: product.costPrice || product.price || 0,
        stock: product.stock || 0
      }];
    });
  }, []);

  const handleBarcodeScan = useCallback(() => {
    if (!barcodeQuery.trim()) return;
    const product = productsList.find(p => p.sku?.toLowerCase() === barcodeQuery.toLowerCase());
    if (product) { addToCart(product); setBarcodeQuery(''); toast.success(`Added ${product.name}`); }
    else toast.error('Product not found with this barcode/SKU');
  }, [barcodeQuery, productsList, addToCart]);

  const updateCartItem = (productId: number, field: keyof PurchaseItem, value: any) => {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'price') updated.total = Number(updated.quantity) * Number(updated.price);
      return updated;
    }));
  };

  const removeFromCart = (productId: number) => setCart(prev => prev.filter(i => i.productId !== productId));
  const clearCart = () => { setCart([]); setDiscount(0); setDeliveryCharge(0); };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const grandTotal = useMemo(() => cartTotal - (Number(discount) || 0) + (Number(deliveryCharge) || 0), [cartTotal, discount, deliveryCharge]);
  const getCartCount = (productId: number) => cart.find(i => i.productId === productId)?.quantity || 0;

  const generateInvoiceNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  // ─── Payment navigation ─────────────────────────────────────────────────

  const openPaymentView = (type: 'cash' | 'due') => {
    if (cart.length === 0) { toast.error('Please add at least one product'); return; }
    setPaymentForm(prev => ({
      ...prev,
      dateOfPurchase: new Date().toISOString().split('T')[0],
      amount: grandTotal,
      cashPaid: type === 'cash' ? grandTotal : 0
    }));
    setView(type);
  };

  // ─── Payment handlers ───────────────────────────────────────────────────

  const buildPurchasePayload = (paymentType: 'cash' | 'due', invoiceNum: string) => ({
    items: cart.map(item => ({
      productId: item.productId, productName: item.productName, image: item.productImage,
      sku: item.sku, quantity: item.quantity, unitPrice: item.price, totalPrice: item.total
    })),
    totalAmount: grandTotal, subTotal: cartTotal,
    discount: Number(discount) || 0, deliveryCharge: Number(deliveryCharge) || 0,
    paymentType, supplierName: paymentForm.supplierName,
    mobileNumber: paymentForm.countryCode + paymentForm.mobileNumber,
    address: paymentForm.address, note: paymentForm.note,
    cashPaid: paymentType === 'cash' ? grandTotal : paymentForm.cashPaid,
    dueAmount: paymentType === 'cash' ? 0 : grandTotal - paymentForm.cashPaid,
    invoiceNumber: invoiceNum,
    employeeName: paymentForm.employeeInfo ? paymentForm.employeeName : '',
    employeeNumber: paymentForm.employeeInfo ? paymentForm.employeeNumber : '',
    dateOfPurchase: paymentForm.dateOfPurchase,
    ...(paymentType === 'due' ? { dueType: dueTabType } : {})
  });

  const showInvoiceAfterPayment = (invoiceNum: string, paymentType: 'cash' | 'due') => {
    const paid = paymentType === 'cash' ? grandTotal : paymentForm.cashPaid;
    const due = paymentType === 'cash' ? 0 : grandTotal - paymentForm.cashPaid;
    setInvoiceData({
      invoiceNumber: invoiceNum, date: new Date().toLocaleString('bn-BD'),
      supplierName: paymentForm.supplierName,
      mobileNumber: paymentForm.countryCode + paymentForm.mobileNumber,
      address: paymentForm.address, items: cart, subTotal: cartTotal,
      discount: Number(discount) || 0, deliveryCharge: Number(deliveryCharge) || 0,
      grandTotal, paidAmount: paid, dueAmount: due, paymentType, buyerName: 'admin'
    });
    setView('invoice');
  };

  const handlePayment = async (paymentType: 'cash' | 'due') => {
    if (!tenantId) { toast.error('Tenant ID is required'); return; }
    if (!paymentForm.supplierName.trim()) { toast.error('Supplier name is required'); return; }
    if (!paymentForm.mobileNumber.trim()) { toast.error('Mobile number is required'); return; }

    setIsSubmitting(true);
    try {
      const invoiceNum = paymentForm.customInvoiceNumber && paymentForm.invoiceNumber
        ? paymentForm.invoiceNumber : generateInvoiceNumber();

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId, ...getAuthHeader() },
        body: JSON.stringify(buildPurchasePayload(paymentType, invoiceNum))
      });
      if (!response.ok) throw new Error('Failed to create purchase');

      showInvoiceAfterPayment(invoiceNum, paymentType);
      toast.success(paymentType === 'cash' ? 'Payment successful!' : 'Purchase saved!');

      if (tenantId) setProductsList((await DataService.getProducts(tenantId)) || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process payment');
    } finally { setIsSubmitting(false); }
  };

  const handleCashPayment = () => handlePayment('cash');
  const handleDuePayment = () => handlePayment('due');

  const closeInvoice = () => {
    setInvoiceData(null);
    clearCart();
    setPaymentForm({
      dateOfPurchase: new Date().toISOString().split('T')[0],
      amount: 0, cashPaid: 0, note: '', supplierName: '', mobileNumber: '',
      countryCode: '+88', address: '', customInvoiceNumber: false, invoiceNumber: '',
      employeeInfo: false, employeeName: '', employeeNumber: '', sendSMS: false
    });
    setView('select');
  };

  // ─── Add product ────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return; }
    try {
      if (!tenantId) { toast.error('Tenant not loaded. Please try again.'); return; }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', tenantId);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setNewProduct(prev => ({ ...prev, image: data.url || data.imageUrl }));
        toast.success('Image uploaded');
      } else {
        const reader = new FileReader();
        reader.onload = () => setNewProduct(prev => ({ ...prev, image: reader.result as string }));
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProduct.name.trim()) { toast.error('Product name is required'); return; }
    if (!tenantId) { toast.error('Tenant ID is required'); return; }
    setIsAddingProduct(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': tenantId, ...getAuthHeader() },
        body: JSON.stringify({
          name: newProduct.name, price: newProduct.sellPrice, costPrice: newProduct.purchasePrice,
          stock: newProduct.currentStock, category: newProduct.category, subCategory: newProduct.subCategory,
          description: newProduct.description, image: newProduct.image, unit: newProduct.unit,
          status: 'active', sku: `SKU-${Date.now().toString(36).toUpperCase()}`
        })
      });
      if (!response.ok) throw new Error('Failed to add product');
      toast.success('Product added successfully!');
      setProductsList((await DataService.getProducts(tenantId)) || []);
      resetNewProductForm();
      setShowAddProductPanel(false);
    } catch { toast.error('Failed to add product'); }
    finally { setIsAddingProduct(false); }
  };

  const resetNewProductForm = () => setNewProduct({
    name: '', currentStock: 0, purchasePrice: 0, sellPrice: 0, unit: '', category: '',
    subCategory: '', description: '', sellOnline: false, sellInBulk: false,
    lowStockAlert: false, vatApplicable: false, warranty: false, discount: false,
    barcode: false, image: ''
  });

  const units = ['Pieces', 'Kg', 'Gram', 'Liter', 'ML', 'Meter', 'Box', 'Pack', 'Set', 'Pair'];

  // ─── Computed ───────────────────────────────────────────────────────────

  const totalPurchaseAmount = useMemo(() => purchaseRecords.reduce((sum, record) => sum + (record.totalAmount || 0), 0), [purchaseRecords]);

  const groupedPurchases = useMemo(() => {
    const groups: { [key: string]: PurchaseRecord[] } = {};
    purchaseRecords.forEach(record => {
      const dateKey = new Date(record.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(record);
    });
    return groups;
  }, [purchaseRecords]);

  // ─── View: Select Products ──────────────────────────────────────────────

  const renderSelectView = () => (
    <div className="flex flex-col h-full min-h-screen">
      <Header
        title="Purchase"
        right={<button onClick={() => setView('book')} className="p-1" aria-label="View purchase book"><BookOpen className="w-5 h-5" /></button>}
      />
      <div className="px-4 py-2 bg-orange-50 text-sm font-medium text-gray-700">Select Products to Purchase</div>

      {/* Search row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-[#1E90FF] focus:border-[#1E90FF]" />
        </div>
        {showBarcodeInput && (
          <input type="text" placeholder="Barcode" value={barcodeQuery} onChange={e => setBarcodeQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleBarcodeScan()} autoFocus
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-[#1E90FF]" />
        )}
        <button onClick={() => setShowBarcodeInput(!showBarcodeInput)} aria-label="Toggle barcode input"
          className={`p-2 border rounded-lg ${showBarcodeInput ? 'border-[#1E90FF] bg-blue-50 text-[#1E90FF]' : 'hover:bg-gray-50'}`}>
          <ScanLine className="w-4 h-4" />
        </button>
        <button onClick={() => { if (tenantId) DataService.getProducts(tenantId).then(data => setProductsList(data || [])); }}
          className="p-2 border rounded-lg hover:bg-gray-50" aria-label="Refresh products list">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {filteredProducts.map(product => {
          const cnt = getCartCount(product.id);
          return (
            <div key={product.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b hover:bg-gray-50">
              <img src={product.image || '/placeholder.png'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: BLUE }}>{product.name}</p>
                <p className="text-xs text-gray-500">Price: {product.costPrice || product.price || 0} · Stock: {product.stock || 0}</p>
              </div>
              <div className="relative flex-shrink-0">
                <button onClick={() => addToCart(product)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: DARK }}>
                  Add <ChevronDown className="w-3 h-3" />
                </button>
                {cnt > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cnt}</span>
                )}
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">No products found</p>
          </div>
        )}
      </div>

      {/* Bottom sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-2xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3 text-white text-sm" style={{ background: DARK }}>
          <div>
            <span className="opacity-80">Selected: ({cart.length})</span>
            <span className="ml-3 font-semibold">Total: ৳ {cartTotal.toFixed(2)}</span>
          </div>
          <button onClick={() => { if (cart.length === 0) { toast.error('Add products first'); return; } setView('review'); }}
            className="px-4 py-1.5 rounded-lg font-medium text-sm" style={{ background: BLUE }}>
            Purchase &gt;
          </button>
        </div>
      </div>
    </div>
  );

  // ─── View: Review Cart ──────────────────────────────────────────────────

  const renderReviewView = () => (
    <div className="flex flex-col h-full min-h-screen">
      <Header title="Review Purchase" onBack={() => setView('select')}
        right={cart.length > 0 ? <button onClick={clearCart} className="text-sm opacity-90">Clear</button> : undefined} />

      <div className="flex-1 overflow-y-auto pb-24">
        {cart.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">No products selected</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {cart.map(item => (
              <div key={item.productId} className="bg-white border rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <img src={item.productImage || '/placeholder.png'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <input type="text" value={item.sku} onChange={e => updateCartItem(item.productId, 'sku', e.target.value)}
                          className="mt-1 w-full px-2 py-1 border rounded text-xs text-gray-500" placeholder="SKU" />
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="ml-2 p-1 text-red-400 hover:text-red-600" aria-label={`Remove ${item.productName}`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium">QTY</label>
                        <div className="flex items-center mt-0.5">
                          <button onClick={() => updateCartItem(item.productId, 'quantity', Math.max(1, item.quantity - 1))}
                            className="p-1 border rounded-l-md hover:bg-gray-50" aria-label="Decrease quantity"><Minus className="w-3 h-3" /></button>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(item.productId, 'quantity', Number(e.target.value) || 1)}
                            className="w-full px-1 py-1 border-y text-center text-xs" />
                          <button onClick={() => updateCartItem(item.productId, 'quantity', item.quantity + 1)}
                            className="p-1 border rounded-r-md hover:bg-gray-50" aria-label="Increase quantity"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium">PRICE</label>
                        <input type="number" min="0" step="0.01" value={item.price}
                          onChange={e => updateCartItem(item.productId, 'price', Number(e.target.value) || 0)}
                          className="w-full mt-0.5 px-2 py-1 border rounded text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium">TOTAL</label>
                        <input type="text" value={`৳${item.total.toFixed(2)}`} readOnly
                          className="w-full mt-0.5 px-2 py-1 border rounded text-xs bg-gray-50 font-medium" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">৳ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount</span>
                <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-right text-sm" />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Delivery</span>
                <input type="number" min="0" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-right text-sm" />
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Grand Total</span>
                <span className="text-lg font-bold" style={{ color: BLUE }}>৳ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action buttons */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-3 p-3 bg-white border-t">
            <button onClick={() => openPaymentView('cash')}
              className="py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2" style={{ background: DARK }}>
              Cash <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => openPaymentView('due')}
              className="py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2" style={{ background: BLUE }}>
              Due <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── View: Payment Form (Cash / Due) ───────────────────────────────────

  const renderPaymentView = () => {
    const isCash = view === 'cash';
    return (
      <div className="flex flex-col h-full min-h-screen">
        <Header title={isCash ? 'Confirm Payment' : 'Money Given Entry'} onBack={() => setView('review')} />

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="p-4 space-y-3">
            {/* Due-only: Customer / Supplier tabs */}
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
                <div className="bg-gray-100 rounded-lg py-2.5 text-center text-sm font-medium">
                  Total payable ৳{grandTotal.toFixed(0)}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Purchase</label>
              <input type="date" value={paymentForm.dateOfPurchase}
                onChange={e => setPaymentForm(prev => ({ ...prev, dateOfPurchase: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
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
                  onChange={e => setPaymentForm(prev => ({ ...prev, cashPaid: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="0" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input type="text" value={paymentForm.note} onChange={e => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Note" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="text" value={paymentForm.supplierName} onChange={e => setPaymentForm(prev => ({ ...prev, supplierName: e.target.value }))}
                  placeholder="Supplier Name" className="w-full px-3 py-2.5 border rounded-lg pr-9 text-sm" />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select value={paymentForm.countryCode} onChange={e => setPaymentForm(prev => ({ ...prev, countryCode: e.target.value }))}
                  className="px-2 py-2.5 border rounded-lg bg-white text-sm">
                  <option value="+88">🇧🇩 +88</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                </select>
                <input type="text" value={paymentForm.mobileNumber}
                  onChange={e => setPaymentForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder="XXXXXXXXXXX" className="flex-1 px-3 py-2.5 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={paymentForm.address} onChange={e => setPaymentForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Address" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Custom Invoice Number</span>
              <Toggle on={paymentForm.customInvoiceNumber} onToggle={() => setPaymentForm(prev => ({ ...prev, customInvoiceNumber: !prev.customInvoiceNumber }))} />
            </div>
            {paymentForm.customInvoiceNumber && (
              <input type="text" value={paymentForm.invoiceNumber} onChange={e => setPaymentForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Invoice Number" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Employee Information</span>
              <Toggle on={paymentForm.employeeInfo} onToggle={() => setPaymentForm(prev => ({ ...prev, employeeInfo: !prev.employeeInfo }))} />
            </div>
            {paymentForm.employeeInfo && (
              <>
                <div className="relative">
                  <input type="text" value={paymentForm.employeeName} onChange={e => setPaymentForm(prev => ({ ...prev, employeeName: e.target.value }))}
                    placeholder="Employee Name" className="w-full px-3 py-2.5 border rounded-lg pr-9 text-sm" />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <input type="text" value={paymentForm.employeeNumber} onChange={e => setPaymentForm(prev => ({ ...prev, employeeNumber: e.target.value }))}
                  placeholder="Employee Number" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </>
            )}
          </div>
        </div>

        {/* Bottom confirm */}
        <div className="fixed bottom-0 left-0 right-0 z-30 max-w-2xl mx-auto">
          <div className="p-3 bg-white border-t">
            <button onClick={isCash ? handleCashPayment : handleDuePayment} disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-medium text-white text-sm ${isSubmitting ? 'bg-gray-400' : ''}`}
              style={isSubmitting ? undefined : { background: BLUE }}>
              {isSubmitting ? 'Processing...' : (isCash ? 'Confirm Payment' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── View: Purchase Book ────────────────────────────────────────────────

  const renderBookView = () => (
    <div className="flex flex-col h-full min-h-screen">
      <Header title="Purchase Book" onBack={() => setView('select')} />

      <div className="px-4 py-2 bg-orange-50 flex items-center justify-between">
        <span className="text-sm font-medium">Total: <span style={{ color: BLUE }}>৳{totalPurchaseAmount.toLocaleString()}</span></span>
        <button onClick={loadPurchaseRecords} className="p-1.5 hover:bg-white/60 rounded-lg" aria-label="Refresh purchase records"><RefreshCw className="w-4 h-4 text-gray-600" /></button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <input type="date" className="flex-1 px-2 py-1.5 border rounded-lg text-xs" value={dateRange.start}
          onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" className="flex-1 px-2 py-1.5 border rounded-lg text-xs" value={dateRange.end}
          onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(groupedPurchases).map(([date, records]) => (
          <div key={date} className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold" style={{ color: BLUE }}>{date}</h3>
              <span className="text-xs" style={{ color: BLUE }}>৳{records.reduce((s, r) => s + r.totalAmount, 0).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {records.map(record => (
                <div key={record._id} className="bg-white border rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">#{record.purchaseNumber}</p>
                      <p className="text-sm font-medium" style={{ color: BLUE }}>৳{record.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Items: {record.items?.length || 0}</p>
                      {record.supplierName && <p className="text-xs text-gray-500 mt-0.5">{record.supplierName}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        record.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.paymentType?.toUpperCase() || 'CASH'}
                      </span>
                      <div className="relative">
                        <button onClick={() => setMobileMenuOpen(mobileMenuOpen === record._id ? null : record._id)}
                          className="p-1 hover:bg-gray-100 rounded" aria-label="Show options">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {mobileMenuOpen === record._id && (
                          <div className="absolute right-0 top-full mt-1 w-28 bg-white border rounded-lg shadow-lg z-10 py-1">
                            <button onClick={() => { setMobileMenuOpen(null); toast.success('View purchase details'); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button onClick={() => { setMobileMenuOpen(null); toast.success('Edit purchase'); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50">
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
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
          <div className="py-16 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">No purchase records found</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── View: Invoice ──────────────────────────────────────────────────────

  const renderInvoiceView = () => invoiceData && (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <Header title="Invoice" onBack={closeInvoice}
        right={<span className="text-sm font-bold text-green-200">✓ Successful</span>} />

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white rounded-xl p-4" id="invoice-content">
          <div className="text-center mb-3">
            <h3 className="text-base font-bold">{storeInfo?.name || 'Store Name'}</h3>
            <p className="text-xs text-gray-500">{storeInfo?.address || 'Store Address'}</p>
            <p className="text-xs text-gray-500">{storeInfo?.phone || 'Store Phone'}</p>
          </div>
          <h4 className="text-center font-bold mb-3">ইনভয়েস</h4>

          <div className="grid grid-cols-2 gap-1 text-xs mb-3">
            <p><span className="text-gray-500">সাপ্লায়ার:</span> {invoiceData.supplierName || '[দেওয়া হয়নি]'}</p>
            <p className="text-right"><span className="text-gray-500">কিনেছেন:</span> {invoiceData.buyerName}</p>
            <p><span className="text-gray-500">মোবাইল:</span> {invoiceData.mobileNumber || '[দেওয়া হয়নি]'}</p>
            <p className="text-right"><span className="text-gray-500">ইনভয়েস:</span> {invoiceData.invoiceNumber}</p>
            <p><span className="text-gray-500">ঠিকানা:</span> {invoiceData.address || '[দেওয়া হয়নি]'}</p>
            <p className="text-right"><span className="text-gray-500">তারিখ:</span> {invoiceData.date}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border mb-3">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-1.5 border text-left">#</th>
                  <th className="p-1.5 border text-left">পণ্যের নাম</th>
                  <th className="p-1.5 border text-center">পরিমাণ</th>
                  <th className="p-1.5 border text-center">ইউনিট</th>
                  <th className="p-1.5 border text-right">মূল্য</th>
                  <th className="p-1.5 border text-right">মোট</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, i) => (
                  <tr key={item.productId}>
                    <td className="p-1.5 border">{i + 1}.</td>
                    <td className="p-1.5 border">
                      {item.productName}
                      <div className="text-[10px] text-gray-400">বারকোড: {item.sku}</div>
                    </td>
                    <td className="p-1.5 border text-center">{item.quantity}</td>
                    <td className="p-1.5 border text-center">পিস</td>
                    <td className="p-1.5 border text-right">৳{item.price.toFixed(2)}</td>
                    <td className="p-1.5 border text-right">৳{item.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td colSpan={3} className="p-1.5 border text-center">মোট</td>
                  <td className="p-1.5 border text-center">{invoiceData.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="p-1.5 border" />
                  <td className="p-1.5 border text-right">৳{invoiceData.subTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <p>পূর্বের বাকি: <span style={{ color: BLUE }}>৳ 0</span></p>
              <p>বর্তমান বাকি: <span style={{ color: BLUE }}>৳ 0</span></p>
              <p>টোটাল বাকি: <span style={{ color: BLUE }}>৳ 0</span></p>
            </div>
            <div className="text-right space-y-0.5">
              <p>সাব টোটাল: ৳{invoiceData.subTotal.toFixed(2)}</p>
              <p>(-) ছাড়: ৳{invoiceData.discount}</p>
              <p>ডেলিভারি: ৳{invoiceData.deliveryCharge}</p>
              <p className="font-medium">মোট: ৳{invoiceData.grandTotal.toFixed(2)}</p>
              <p>পরিশোধিত: ৳{invoiceData.paidAmount.toFixed(2)}</p>
              <p>বাকি আছে: <span style={{ color: BLUE }}>৳{invoiceData.dueAmount.toFixed(2)}</span></p>
            </div>
          </div>
          <p className="text-xs mt-3">এমাউন্ট (কথায়):</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-2xl mx-auto">
        <div className="p-3 bg-white border-t">
          <button onClick={() => window.print()}
            className="w-full py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2" style={{ background: BLUE }}>
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Add Product Panel (overlay) ────────────────────────────────────────

  const renderAddProductPanel = () => showAddProductPanel && (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setShowAddProductPanel(false); resetNewProductForm(); }} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between text-white" style={{ background: ORANGE }}>
          <h2 className="font-semibold">Add Product</h2>
          <button onClick={() => { setShowAddProductPanel(false); resetNewProductForm(); }} aria-label="Close panel"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div onClick={() => fileInputRef.current?.click()}
            className="h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
            {newProduct.image
              ? <img src={newProduct.image} alt="Preview" className="h-full w-full object-contain rounded-xl" />
              : <><Upload className="w-7 h-7 text-gray-400 mb-1" /><span className="text-xs text-gray-500">Upload image</span></>
            }
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          <input type="text" value={newProduct.name} onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Product Name *" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          <input type="number" value={newProduct.currentStock} onChange={e => setNewProduct(prev => ({ ...prev, currentStock: Number(e.target.value) || 0 }))}
            placeholder="Stock" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={newProduct.purchasePrice} onChange={e => setNewProduct(prev => ({ ...prev, purchasePrice: Number(e.target.value) || 0 }))}
              placeholder="Purchase Price" className="px-3 py-2.5 border rounded-lg text-sm" />
            <input type="number" value={newProduct.sellPrice} onChange={e => setNewProduct(prev => ({ ...prev, sellPrice: Number(e.target.value) || 0 }))}
              placeholder="Sell Price *" className="px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <select value={newProduct.unit} onChange={e => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
            className="w-full px-3 py-2.5 border rounded-lg text-sm">
            <option value="">Select Unit</option>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={newProduct.category} onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value, subCategory: '' }))}
              className="px-3 py-2.5 border rounded-lg text-sm">
              <option value="">Category</option>
              {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={newProduct.subCategory} onChange={e => setNewProduct(prev => ({ ...prev, subCategory: e.target.value }))}
              className="px-3 py-2.5 border rounded-lg text-sm" disabled={!newProduct.category}>
              <option value="">Sub-Category</option>
              {subCategories.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <textarea value={newProduct.description} onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description" rows={2} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>
        <div className="p-3 border-t flex gap-3">
          <button onClick={() => { setShowAddProductPanel(false); resetNewProductForm(); }}
            className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAddNewProduct} disabled={isAddingProduct || !newProduct.name.trim()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white ${isAddingProduct || !newProduct.name.trim() ? 'bg-gray-400' : ''}`}
            style={isAddingProduct || !newProduct.name.trim() ? undefined : { background: BLUE }}>
            {isAddingProduct ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </div>
    </>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen relative">
      {view === 'select' && renderSelectView()}
      {view === 'review' && renderReviewView()}
      {(view === 'cash' || view === 'due') && renderPaymentView()}
      {view === 'book' && renderBookView()}
      {view === 'invoice' && renderInvoiceView()}
      {renderAddProductPanel()}
    </div>
  );
};

export default AdminPurchase;
