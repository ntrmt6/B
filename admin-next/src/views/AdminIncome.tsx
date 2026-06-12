import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Plus, Calendar, Printer, Image as ImageIcon, Edit2, Trash2, ChevronLeft, ChevronRight, X, TrendingUp, DollarSign, Filter, Clock, BarChart3, Tag, MoreVertical, Eye } from 'lucide-react';
import { IncomeService, IncomeDTO, IncomeCategoryDTO, setIncomeTenantId } from '../services/IncomeService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface IncomeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  status: 'Published' | 'Draft' | 'Trash';
  note?: string;
  imageUrl?: string;
}

type DatePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom' | 'all';

function getDateRange(preset: DatePreset): { from?: string; to?: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  switch (preset) {
    case 'today': return { from: fmt(now), to: fmt(now) };
    case 'this_week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(now);
      start.setDate(now.getDate() - diff);
      return { from: fmt(start), to: fmt(now) };
    }
    case 'this_month': return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: fmt(now) };
    case 'this_year': return { from: `${now.getFullYear()}-01-01`, to: fmt(now) };
    case 'all': return {};
    default: return {};
  }
}

const presetLabels: Record<DatePreset, string> = {
  all: 'All Time', today: 'Today', this_week: 'This Week',
  this_month: 'This Month', this_year: 'This Year', custom: 'Custom Range',
};

interface AdminIncomeProps { tenantId?: string; }

const AdminIncome: React.FC<AdminIncomeProps> = ({ tenantId }) => {
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'All'|'Published'|'Draft'|'Trash'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [categories, setCategories] = useState<IncomeCategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<IncomeItem>>({ status: 'Published' });
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

  // Set tenant ID on service
  useEffect(() => {
    if (tenantId) setIncomeTenantId(tenantId);
  }, [tenantId]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') return { from: customFrom || undefined, to: customTo || undefined };
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

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(i => map.set(i.category, (map.get(i.category) || 0) + i.amount));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return items.filter(i => i.date === today).reduce((sum, i) => sum + i.amount, 0);
  }, [items]);

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
      const result = await IncomeService.loadAll({
        query: query || undefined,
        status: statusTab === 'All' ? undefined : statusTab,
        category: selectedCategory || undefined,
        from: dateRange.from,
        to: dateRange.to,
        page: 1,
        pageSize: 100, // Reduced pageSize for faster initial load
      });
      
      setItems((result.list.items || []).map((x: any) => ({ ...x, id: x.id || x._id })));
      setCategories((result.categories || []).map((c: any) => ({ ...c, id: c.id || c._id })));
    } catch (e: any) {
      setError(e?.message || 'Failed to load income');
    } finally {
      setLoading(false);
    }
  }, [query, statusTab, selectedCategory, dateRange.from, dateRange.to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await IncomeService.createCategory(newCategoryName);
      setCategories(prev => [...prev, { ...created, id: (created as any).id || (created as any)._id }]);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch { alert('Failed to save category'); }
  };

  const handleAdd = async () => {
    if (!newItem.name || !newItem.category || !newItem.amount || !newItem.date) return;
    const payload: IncomeDTO = {
      name: newItem.name!,
      category: newItem.category!,
      amount: Number(newItem.amount!),
      date: newItem.date!,
      status: (newItem.status as any) || 'Draft',
      note: newItem.note,
      imageUrl: newItem.imageUrl,
    };
    try {
      if (editingIncomeId) {
        const updated = await IncomeService.update(editingIncomeId, payload);
        setItems(prev => prev.map(item => item.id === editingIncomeId ? { ...(updated as any), id: updated.id || editingIncomeId } : item));
      } else {
        const created = await IncomeService.create(payload);
        setItems(prev => [{ ...(created as any), id: created.id || String(Date.now()) }, ...prev]);
      }
      setIsAddOpen(false);
      setNewItem({ status: 'Draft' });
      setEditingIncomeId(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to save income');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income entry?')) return;
    try {
      await IncomeService.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete income');
    }
  };

  const handleEdit = (item: IncomeItem) => {
    setNewItem(item);
    setEditingIncomeId(item.id);
    setIsAddOpen(true);
  };

  const formatCurrency = (amount: number) =>
    `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 bg-[#F8FAFC] dark:bg-gray-900 min-h-screen space-y-2 sm:space-y-3">
      {/* Summary Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Income Tracker
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Track & manage all income — filter by day, month, year or custom range.</p>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 flex-1 xs:flex-initial">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search income..." className="bg-transparent text-gray-700 dark:text-gray-200 text-xs sm:text-sm outline-none ml-2 w-full xs:w-auto placeholder:text-xs placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            </div>
            <button onClick={() => { setNewItem({ status: 'Published', date: new Date().toISOString().split('T')[0] }); setEditingIncomeId(null); setIsAddOpen(true); }} className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add Income</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Date Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
          <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          {(['all', 'today', 'this_week', 'this_month', 'this_year', 'custom'] as DatePreset[]).map(p => (
            <button key={p} onClick={() => setDatePreset(p)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all ${datePreset === p ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {presetLabels[p]}
            </button>
          ))}
        </div>

        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">From:</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">To:</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{presetLabels[datePreset]} Total</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 break-words">{formatCurrency(totalAmount)}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{filtered.length} transactions</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Today</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 break-words">{formatCurrency(todayTotal)}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">This Month</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400 break-words">{formatCurrency(monthTotal)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-600">
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Top Categories</span>
            </div>
            <div className="space-y-1 mt-1">
              {categoryBreakdown.length === 0 && <div className="text-[10px] text-gray-400 dark:text-gray-500">No data</div>}
              {categoryBreakdown.slice(0, 3).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-gray-700 dark:text-gray-300 truncate mr-1">{cat}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">{formatCurrency(amt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => { setNewCategoryName(''); setIsCategoryModalOpen(true); }} className="inline-flex items-center gap-1 sm:gap-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" /><span>Category</span>
          </button>
          <button onClick={() => {
            const doc = window.open('', '_blank');
            if (!doc) return;
            doc.document?.open();
            doc.document?.write(`<!DOCTYPE html><html><head><title>Income Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#333}.container{max-width:900px;margin:0 auto;padding:40px}header{text-align:center;margin-bottom:40px;border-bottom:3px solid #059669;padding-bottom:20px}.logo{font-size:32px;font-weight:bold;color:#059669}table{width:100%;border-collapse:collapse;margin:30px 0}thead{background:#059669;color:white}th{padding:12px;text-align:left}td{padding:12px;border-bottom:1px solid #eee}.text-right{text-align:right}.amount{font-weight:bold;color:#059669}.total-row{font-weight:bold;font-size:16px;background:#f0f0f0}footer{margin-top:40px;text-align:center;color:#888;font-size:12px}</style></head><body><div class="container"><header><div class="logo">Income Report</div></header><table><thead><tr><th>Date</th><th>Name</th><th>Category</th><th>Status</th><th class="text-right">Amount</th></tr></thead><tbody>${filtered.map(i => `<tr><td>${new Date(i.date).toLocaleDateString()}</td><td>${i.name}</td><td>${i.category}</td><td>${i.status}</td><td class="text-right amount">৳${i.amount.toFixed(2)}</td></tr>`).join('')}<tr class="total-row"><td colspan="4" style="text-align:right;">TOTAL</td><td class="text-right">৳${totalAmount.toFixed(2)}</td></tr></tbody></table><footer>Generated on ${new Date().toLocaleString()}</footer></div></body></html>`);
            doc.document?.close();
            setTimeout(() => doc.print(), 500);
          }} className="inline-flex items-center gap-1 sm:gap-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold">
            <Printer className="w-3 h-3 sm:w-4 sm:h-4" /><span>Print Report</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-[10px] sm:text-xs rounded-md px-1.5 sm:px-2 py-1 min-w-[100px]">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table & Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-[10px] sm:text-xs md:text-sm overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
            {(['All', 'Published', 'Draft', 'Trash'] as const).map(t => (
              <button key={t} onClick={() => setStatusTab(t)} className={`font-semibold whitespace-nowrap px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${statusTab === t ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-400 dark:text-gray-500'} hover:text-gray-900 dark:hover:text-gray-100 transition`}>
                {t}{t === 'All' ? ` (${filtered.length})` : ` (${items.filter(i => i.status === t).length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              <span className="hidden sm:inline">Page</span>
              <span className="text-[10px] sm:text-xs font-semibold">{page}</span>
              <span className="text-[10px] sm:text-xs">of {totalPages}</span>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50"><ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50"><ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" /></button>
            </div>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 -mx-2 sm:mx-0 px-2 sm:px-0">
          {loading && items.length === 0 ? (
            <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Loading income...</div>
          ) : error ? (
            <div className="py-6 sm:py-10 text-center text-red-500 dark:text-red-400 text-xs sm:text-sm">{error}</div>
          ) : paged.length === 0 ? (
            <div className="py-10 sm:py-16 text-center">
              <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
                <div className="font-semibold text-xs sm:text-sm">No Income Found!</div>
                <div className="text-[10px] sm:text-xs">Add your first income to start tracking.</div>
              </div>
            </div>
          ) : (
            <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto scrollbar-hide">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
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
                  <tr key={i.id || `income-${idx}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-1.5 sm:p-2 hidden sm:table-cell">
                      {i.imageUrl ? <img src={normalizeImageUrl(i.imageUrl)} alt="receipt" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover" /> : <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded flex items-center justify-center"><DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /></div>}
                    </td>
                    <td className="p-1.5 sm:p-2 text-gray-900 dark:text-gray-100 font-medium">
                      <div className="text-xs sm:text-sm">{i.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 lg:hidden mt-0.5">{i.category}</div>
                      {i.note && <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{i.note}</div>}
                    </td>
                    <td className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hidden lg:table-cell text-xs sm:text-sm">{i.category}</td>
                    <td className="p-1.5 sm:p-2 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap text-xs sm:text-sm">+{formatCurrency(i.amount)}</td>
                    <td className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs whitespace-nowrap">{new Date(i.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="p-1.5 sm:p-2 hidden sm:table-cell">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${i.status === 'Published' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : i.status === 'Trash' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{i.status}</span>
                    </td>
                    <td className="p-1.5 sm:p-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 dark:text-gray-500">
                        <button className="p-1 sm:p-1.5 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => handleEdit(i)}><Edit2 className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                        <button className="p-1 sm:p-1.5 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" onClick={() => handleDelete(i.id)}><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 dark:bg-emerald-900/30 font-bold text-sm">
                  <td className="p-2 hidden sm:table-cell"></td>
                  <td className="p-2 dark:text-gray-200" colSpan={1}>TOTAL</td>
                  <td className="p-2 hidden lg:table-cell"></td>
                  <td className="p-2 text-emerald-700 dark:text-emerald-400">+{formatCurrency(totalAmount)}</td>
                  <td className="p-2" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {paged.map((i, idx) => (
                <div key={i.id || `mobile-income-${idx}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {i.imageUrl ? (
                        <img src={normalizeImageUrl(i.imageUrl)} alt="receipt" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{i.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{i.category}</div>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setMobileMenuOpen(mobileMenuOpen === i.id ? null : i.id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {mobileMenuOpen === i.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[120px] py-1">
                          <button
                            onClick={() => { handleEdit(i); setMobileMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => { handleEdit(i); setMobileMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold text-base">+{formatCurrency(i.amount)}</div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        i.status === 'Published' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        i.status === 'Trash' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>{i.status}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(i.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {i.note && <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 truncate">{i.note}</div>}
                </div>
              ))}
              {/* Mobile Total */}
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">TOTAL</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">+{formatCurrency(totalAmount)}</span>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-gray-100 font-bold text-base sm:text-lg">{editingIncomeId ? 'Edit Income' : 'Add Income'}</h3>
              <button onClick={() => { setIsAddOpen(false); setEditingIncomeId(null); setNewItem({ status: 'Published' }); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Income Name *</label>
                <input className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" value={newItem.name || ''} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Enter income name" />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Category *</label>
                <select className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500" value={newItem.category || ''} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Amount (৳) *</label>
                  <input type="number" className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" value={newItem.amount as any || ''} onChange={e => setNewItem({ ...newItem, amount: Number(e.target.value) })} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Date *</label>
                  <input type="date" className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500" value={newItem.date || ''} onChange={e => setNewItem({ ...newItem, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Image URL (Optional)</label>
                <input className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500" value={newItem.imageUrl || ''} onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })} placeholder="https://example.com/image.jpg" />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Status</label>
                <select className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500" value={newItem.status as any || 'Published'} onChange={e => setNewItem({ ...newItem, status: e.target.value as any })}>
                  <option>Published</option>
                  <option>Draft</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Note (Optional)</label>
                <textarea rows={3} className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500 resize-none" value={newItem.note || ''} onChange={e => setNewItem({ ...newItem, note: e.target.value })} placeholder="Add any notes..." />
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                <button onClick={() => { setIsAddOpen(false); setNewItem({ status: 'Published' }); setEditingIncomeId(null); }} className="px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium">Cancel</button>
                <button onClick={handleAdd} disabled={!newItem.name || !newItem.category || !newItem.amount || !newItem.date} className="px-4 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold disabled:opacity-50">{editingIncomeId ? 'Update Income' : 'Save Income'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-gray-100 font-bold text-base sm:text-lg">Add Income Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 mb-4">
              <input type="text" placeholder="Category name" className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="flex-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold">Add</button>
                <button onClick={() => setIsCategoryModalOpen(false)} className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md">Cancel</button>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-gray-900 dark:text-gray-100 text-sm font-semibold mb-3">All Categories</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.id || cat.name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{cat.name}</span>
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

export default AdminIncome;
