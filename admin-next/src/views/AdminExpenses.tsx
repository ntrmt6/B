import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Plus, Calendar, Printer, Filter, Image as ImageIcon, Edit2, Trash2, ChevronLeft, ChevronRight, X, TrendingDown, BarChart3, Tag, Clock, MoreVertical } from 'lucide-react';
import { ExpenseService, ExpenseDTO, setExpenseTenantId } from '../services/ExpenseService';
import { CategoryService, CategoryDTO, setCategoryTenantId } from '../services/CategoryService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string; // ISO date
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
}

type DatePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom' | 'all';

function getDateRange(preset: DatePreset): { from?: string; to?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  switch (preset) {
    case 'today':
      return { from: fmt(now), to: fmt(now) };
    case 'this_week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(now);
      start.setDate(now.getDate() - diff);
      return { from: fmt(start), to: fmt(now) };
    }
    case 'this_month':
      return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: fmt(now) };
    case 'this_year':
      return { from: `${now.getFullYear()}-01-01`, to: fmt(now) };
    case 'all':
      return {};
    default:
      return {};
  }
}

const presetLabels: Record<DatePreset, string> = {
  all: 'All Time',
  today: 'Today',
  this_week: 'This Week',
  this_month: 'This Month',
  this_year: 'This Year',
  custom: 'Custom Range',
};

interface AdminExpensesProps {
  tenantId?: string;
}

const AdminExpenses: React.FC<AdminExpensesProps> = ({ tenantId }) => {
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'All'|'Published'|'Draft'|'Trash'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ExpenseItem>>({ status: 'Draft' });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

  // Set tenant IDs on services
  useEffect(() => {
    if (tenantId) {
      setExpenseTenantId(tenantId);
      setCategoryTenantId(tenantId);
    }
  }, [tenantId]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { from: customFrom || undefined, to: customTo || undefined };
    }
    return getDateRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const filtered = useMemo(() => {
    return items.filter(i =>
      (statusTab === 'All' || i.status === statusTab) &&
      (!selectedCategory || i.category === selectedCategory) &&
      (!query || i.name.toLowerCase().includes(query.toLowerCase())) &&
      (!dateRange.from || i.date >= dateRange.from) &&
      (!dateRange.to || i.date <= dateRange.to)
    );
  }, [items, statusTab, selectedCategory, query, dateRange]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalAmount = useMemo(() => filtered.reduce((sum, i) => sum + i.amount, 0), [filtered]);

  // Category-wise breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(i => map.set(i.category, (map.get(i.category) || 0) + i.amount));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  // Today's total
  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return items.filter(i => i.date === today).reduce((sum, i) => sum + i.amount, 0);
  }, [items]);

  // This month's total
  const monthTotal = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return items.filter(i => i.date >= monthStart).reduce((sum, i) => sum + i.amount, 0);
  }, [items]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use optimized loadAll for faster parallel fetching with caching
      const [expRes, catRes] = await Promise.all([
        ExpenseService.list({
          query: query || undefined,
          status: statusTab === 'All' ? undefined : statusTab,
          category: selectedCategory || undefined,
          from: dateRange.from,
          to: dateRange.to,
          page: 1,
          pageSize: 100, // Reduced pageSize for faster initial load
        }),
        CategoryService.list(),
      ]);
      setItems((expRes.items || []).map((x: any) => ({ ...x, id: x.id || String(x._id) })));
      setCategories((catRes.items || []).map((c: any) => ({ ...c, id: c.id || String(c._id) })));
    } catch (e: any) {
      setError(e?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [query, statusTab, selectedCategory, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!newItem.name || !newItem.category || !newItem.amount || !newItem.date) return;
    const payload: ExpenseDTO = {
      name: newItem.name!,
      category: newItem.category!,
      amount: Number(newItem.amount!),
      date: newItem.date!,
      status: (newItem.status as any) || 'Draft',
      note: newItem.note,
      imageUrl: newItem.imageUrl,
    };
    try {
      if (editingExpenseId) {
        // Update existing expense
        const updated = await ExpenseService.update(editingExpenseId, payload);
        setItems(prev => prev.map(item => item.id === editingExpenseId ? { ...(updated as any), id: updated.id || editingExpenseId } : item));
      } else {
        // Create new expense
        const created = await ExpenseService.create(payload);
        setItems(prev => [{ ...(created as any), id: created.id || Math.random().toString(36).slice(2) }, ...prev]);
      }
      setIsAddOpen(false);
      setNewItem({ status: 'Draft' });
      setEditingExpenseId(null);
    } catch (e) {
      // Fall back to local update/add if API not ready
      if (editingExpenseId) {
        setItems(prev => prev.map(item => item.id === editingExpenseId ? (newItem as ExpenseItem) : item));
      } else {
        const fallback = { id: Math.random().toString(36).slice(2), ...(payload as any) } as ExpenseItem;
        setItems(prev => [fallback, ...prev]);
      }
      setIsAddOpen(false);
      setNewItem({ status: 'Draft' });
      setEditingExpenseId(null);
    }
  };

  const handleEditExpense = (expense: ExpenseItem) => {
    setNewItem(expense);
    setEditingExpenseId(expense.id);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await ExpenseService.remove(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch {
      setItems(prev => prev.filter(x => x.id !== id));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategoryId) {
        const updated = await CategoryService.update(editingCategoryId, { name: newCategoryName });
        setCategories(prev => prev.map(c => c.id === editingCategoryId ? updated : c));
      } else {
        const created = await CategoryService.create({ name: newCategoryName });
        setCategories(prev => [...prev, created]);
      }
      setNewCategoryName('');
      setEditingCategoryId(null);
      setIsCategoryModalOpen(false);
    } catch (e) {
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await CategoryService.remove(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('Failed to delete category');
    }
  };

  const handlePrintInvoice = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Invoice</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 40px; }
          header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0f766e; padding-bottom: 20px; }
          .logo { font-size: 32px; font-weight: bold; color: #0f766e; margin-bottom: 10px; }
          .subtitle { color: #888; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .info-label { font-weight: bold; color: #0f766e; font-size: 12px; text-transform: uppercase; }
          .info-value { margin-top: 5px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          thead { background: #0f766e; color: white; }
          th { padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          tr:hover { background: #fafafa; }
          .text-right { text-align: right; }
          .amount { font-weight: bold; color: #0f766e; }
          .total-row { font-weight: bold; font-size: 16px; background: #f0f0f0; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
          .summary-card { padding: 20px; background: #0f766e; color: white; border-radius: 8px; text-align: center; }
          .summary-label { font-size: 12px; opacity: 0.9; }
          .summary-value { font-size: 24px; font-weight: bold; margin-top: 10px; }
          footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px; }
          @media print { body { margin: 0; padding: 0; } .container { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div class="logo">OP-BD.COM</div>
            <div class="subtitle">Professional Expense Report</div>
          </header>

          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Report Date</div>
              <div class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Total Expenses</div>
              <div class="info-value amount">BDT ${totalAmount.toFixed(2)}</div>
            </div>
          </div>

          <div class="summary">
            <div class="summary-card">
              <div class="summary-label">Total Amount</div>
              <div class="summary-value">BDT ${totalAmount.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Categories</div>
              <div class="summary-value">${new Set(filtered.map(i => i.category)).size}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Transactions</div>
              <div class="summary-value">${filtered.length}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(i => `
                <tr>
                  <td>${new Date(i.date).toLocaleDateString()}</td>
                  <td>${i.name}</td>
                  <td>${i.category}</td>
                  <td>${i.status}</td>
                  <td class="text-right amount">BDT ${i.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">TOTAL</td>
                <td class="text-right" style="color: #0f766e;">BDT ${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <footer>
            <p>This is an automatically generated expense report. Generated on ${new Date().toLocaleString()}</p>
          </footer>
        </div>
      </body>
      </html>
    `;
    
    // write into the opened window's document (document.write exists, window.write does not)
    doc.document?.open();
    doc.document?.write(htmlContent);
    doc.document?.close();
    setTimeout(() => doc.print(), 500);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 bg-[#F8FAFC] min-h-screen space-y-2 sm:space-y-3">
      {/* Summary Header */}
      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Expense Tracker
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Track & manage all expenses — filter by day, month, year or custom range.</p>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex-1 xs:flex-initial">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search expenses..." className="bg-transparent text-gray-700 text-xs sm:text-sm outline-none ml-2 w-full xs:w-auto placeholder:text-xs" />
            </div>
            <button onClick={()=>setIsAddOpen(true)} className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add Expense</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Date Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          {(['all', 'today', 'this_week', 'this_month', 'this_year', 'custom'] as DatePreset[]).map(p => (
            <button
              key={p}
              onClick={() => setDatePreset(p)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all ${
                datePreset === p
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {presetLabels[p]}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3 bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-500 font-medium">From:</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-500 font-medium">To:</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
          <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-100">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{presetLabels[datePreset]} Total</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-red-600 break-words">৳{totalAmount.toLocaleString('en-BD', {minimumFractionDigits: 2})}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{filtered.length} transactions</div>
          </div>
          <div className="bg-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Today</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-orange-600 break-words">৳{todayTotal.toLocaleString('en-BD', {minimumFractionDigits: 2})}</div>
          </div>
          <div className="bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-100">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">This Month</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-purple-600 break-words">৳{monthTotal.toLocaleString('en-BD', {minimumFractionDigits: 2})}</div>
          </div>
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Top Categories</span>
            </div>
            <div className="space-y-1 mt-1">
              {categoryBreakdown.length === 0 && <div className="text-[10px] text-gray-400">No data</div>}
              {categoryBreakdown.slice(0, 3).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-gray-700 truncate mr-1">{cat}</span>
                  <span className="text-red-600 font-semibold whitespace-nowrap">৳{amt.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => { setNewCategoryName(''); setEditingCategoryId(null); setIsCategoryModalOpen(true); }} className="inline-flex items-center gap-1 sm:gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Category</span>
          </button>
          <button onClick={handlePrintInvoice} className="inline-flex items-center gap-1 sm:gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold">
            <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Print Report</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
            <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-[10px] sm:text-xs rounded-md px-1.5 sm:px-2 py-1 min-w-[100px]">
              <option value="">All Categories</option>
              {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table & Tabs */}
      <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-[10px] sm:text-xs md:text-sm overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
            {(['All','Published','Draft','Trash'] as const).map(t => (
              <button key={t} onClick={()=>setStatusTab(t)} className={`font-semibold whitespace-nowrap px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${statusTab===t? 'text-emerald-600 bg-emerald-50':'text-gray-400'} hover:text-gray-900 transition`}>
                {t}{t === 'All' ? ` (${filtered.length})` : ` (${items.filter(i => i.status === t).length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs text-gray-600">
              <span className="hidden sm:inline">Page</span>
              <span className="text-[10px] sm:text-xs font-semibold">{page}</span>
              <span className="text-[10px] sm:text-xs">of {totalPages}</span>
              <button onClick={()=>setPage(Math.max(1,page-1))} disabled={page <= 1} className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"><ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
              <button onClick={()=>setPage(Math.min(totalPages,page+1))} disabled={page >= totalPages} className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"><ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3"/></button>
            </div>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 overflow-x-auto scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
          {loading && items.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Loading expenses...</div>
          ) : error ? (
            <div className="py-6 sm:py-10 text-center text-red-500 text-xs sm:text-sm">{error}</div>
          ) : paged.length === 0 ? (
            <div className="py-10 sm:py-16 text-center">
              <div className="flex flex-col items-center text-gray-400">
                <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
                <div className="font-semibold text-xs sm:text-sm">No Expenses Found!</div>
                <div className="text-[10px] sm:text-xs">Add your first expense to start tracking.</div>
              </div>
            </div>
          ) : (
          <>
          <div className="overflow-x-auto hidden sm:block">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-200">
                <th className="p-1.5 sm:p-2 hidden sm:table-cell text-[10px] sm:text-xs">Image</th>
                <th className="p-1.5 sm:p-2 text-[10px] sm:text-xs">Name</th>
                <th className="p-1.5 sm:p-2 hidden lg:table-cell text-[10px] sm:text-xs">Category</th>
                <th className="p-1.5 sm:p-2 text-[10px] sm:text-xs">Amount</th>
                <th className="p-1.5 sm:p-2 text-[10px] sm:text-xs">Date</th>
                <th className="p-1.5 sm:p-2 hidden sm:table-cell text-[10px] sm:text-xs">Status</th>
                <th className="p-1.5 sm:p-2 text-[10px] sm:text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((i, idx) => (
                  <tr key={i.id || `expense-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-1.5 sm:p-2 hidden sm:table-cell">
                      {i.imageUrl ? <img src={normalizeImageUrl(i.imageUrl)} alt="receipt" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"/> : <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"/></div>}
                    </td>
                    <td className="p-1.5 sm:p-2 text-gray-900 font-medium">
                      <div className="text-xs sm:text-sm">{i.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 lg:hidden mt-0.5">{i.category}</div>
                      {i.note && <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">{i.note}</div>}
                    </td>
                    <td className="p-1.5 sm:p-2 text-gray-600 hidden lg:table-cell text-xs sm:text-sm">{i.category}</td>
                    <td className="p-1.5 sm:p-2 text-red-600 font-semibold whitespace-nowrap text-xs sm:text-sm">৳{i.amount.toFixed(2)}</td>
                    <td className="p-1.5 sm:p-2 text-gray-600 text-[10px] sm:text-xs whitespace-nowrap">{new Date(i.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="p-1.5 sm:p-2 hidden sm:table-cell">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${i.status==='Published'? 'bg-emerald-50 text-emerald-600': i.status === 'Trash' ? 'bg-red-50 text-red-600' :'bg-gray-100 text-gray-600'}`}>{i.status}</span>
                    </td>
                    <td className="p-1.5 sm:p-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400">
                        <button className="p-1 sm:p-1.5 hover:text-gray-700 hover:bg-gray-100 rounded" onClick={() => handleEditExpense(i)}><Edit2 className="w-3 h-3 sm:w-4 sm:h-4"/></button>
                        <button className="p-1 sm:p-1.5 hover:text-red-500 hover:bg-red-50 rounded" onClick={()=>handleDelete(i.id)}><Trash2 className="w-3 h-3 sm:w-4 sm:h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-red-50 font-bold text-sm">
                <td className="p-2 hidden sm:table-cell"></td>
                <td className="p-2" colSpan={1}>TOTAL</td>
                <td className="p-2 hidden lg:table-cell"></td>
                <td className="p-2 text-red-700">৳{totalAmount.toFixed(2)}</td>
                <td className="p-2" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {paged.map((i, idx) => (
              <div key={i.id || `mobile-expense-${idx}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{i.name}</h3>
                    {i.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{i.note}</p>}
                  </div>
                  <div className="relative ml-2">
                    <button
                      onClick={() => setMobileMenuOpen(mobileMenuOpen === i.id ? null : i.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {mobileMenuOpen === i.id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px] py-1">
                        <button
                          onClick={() => { handleEditExpense(i); setMobileMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => { handleDelete(i.id); setMobileMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Amount</div>
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">৳{i.amount.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Date</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{new Date(i.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    <Tag className="w-3 h-3" /> {i.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${i.status === 'Published' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : i.status === 'Trash' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {i.status}
                  </span>
                </div>
              </div>
            ))}

            {/* Mobile Total Card */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">TOTAL</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">৳{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-base sm:text-lg">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={()=>{setIsAddOpen(false); setNewItem({ status: 'Draft' }); setEditingExpenseId(null);}} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Expense Name *</label>
                <input className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" value={newItem.name||''} onChange={e=>setNewItem({...newItem, name: e.target.value})} placeholder="Enter expense name" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Category *</label>
                <select className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500" value={newItem.category||''} onChange={e=>setNewItem({...newItem, category: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Amount (৳) *</label>
                  <input type="number" className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" value={newItem.amount as any || ''} onChange={e=>setNewItem({...newItem, amount: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Date *</label>
                  <input type="date" className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500" value={newItem.date||''} onChange={e=>setNewItem({...newItem, date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Image URL (Optional)</label>
                <input className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500" value={newItem.imageUrl||''} onChange={e=>setNewItem({...newItem, imageUrl: e.target.value})} placeholder="https://example.com/image.jpg" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Status</label>
                <select className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500" value={newItem.status as any || 'Draft'} onChange={e=>setNewItem({...newItem, status: e.target.value as any})}>
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Note (Optional)</label>
                <textarea rows={3} className="mt-1 w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 resize-none" value={newItem.note||''} onChange={e=>setNewItem({...newItem, note: e.target.value})} placeholder="Add any notes..." />
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                <button onClick={()=>{setIsAddOpen(false); setNewItem({ status: 'Draft' }); setEditingExpenseId(null);}} className="px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium">Cancel</button>
                <button onClick={handleAdd} className="px-4 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold">{editingExpenseId ? 'Update Expense' : 'Save Expense'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-base sm:text-lg">{editingCategoryId ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={()=>setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4 mb-4">
              <input 
                type="text" 
                placeholder="Category name" 
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="flex-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold">{editingCategoryId ? 'Update' : 'Add'}</button>
                <button onClick={()=>setIsCategoryModalOpen(false)} className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md">Cancel</button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-gray-900 text-sm font-semibold mb-3">All Categories</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <span className="text-sm text-gray-900">{cat.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setNewCategoryName(cat.name); setEditingCategoryId(cat.id!); }} className="p-1 text-emerald-600 hover:text-emerald-700"><Edit2 className="w-3 h-3"/></button>
                      <button onClick={() => handleDeleteCategory(cat.id!)} className="p-1 text-red-500 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
