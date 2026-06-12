import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, RefreshCw, X, Trash2, Search, Package } from 'lucide-react';
import { CategoryService, CategoryDTO } from '../../../../services/CategoryService';
import { PurchaseRecord } from '../types';
import {
  AddSquareIcon, AddSquareSmallIcon, PrinterIcon,
  DotsIcon, ArrowLeftIcon, ArrowRightIcon, ShoppingBagIcon,
} from '../icons';

interface PurchaseTabProps {
  tenantId?: string;
  expenseCategories: CategoryDTO[];
  getDateRangeBoundaries: { start: Date; end: Date };
  isWithinDateRange: (date: string | Date | undefined) => boolean;
}

const PAGE_SIZE = 10;

const PurchaseTab: React.FC<PurchaseTabProps> = ({
  tenantId,
  expenseCategories,
  getDateRangeBoundaries,
  isWithinDateRange,
}) => {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseSortBy, setPurchaseSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [purchaseFilterCategory, setPurchaseFilterCategory] = useState('');
  const [selectedPurchases, setSelectedPurchases] = useState<Set<string>>(new Set());
  const [purchaseActionMenuOpen, setPurchaseActionMenuOpen] = useState<string | null>(null);
  const [isPurchaseCategoryModalOpen, setIsPurchaseCategoryModalOpen] = useState(false);
  const [newPurchaseCategoryName, setNewPurchaseCategoryName] = useState('');

  useEffect(() => {
    const loadPurchases = async () => {
      if (!tenantId) return;
      try {
        setPurchaseLoading(true);
        const { start, end } = getDateRangeBoundaries;
        const response = await fetch(
          `/api/purchases?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
          { headers: { 'X-Tenant-Id': tenantId } }
        );
        if (response.ok) {
          const data = await response.json();
          const purchaseList = Array.isArray(data) ? data : (data?.items || data?.purchases || []);
          setPurchases(purchaseList);
        }
      } catch (e) {
        console.error('Failed to load purchases:', e);
      } finally {
        setPurchaseLoading(false);
      }
    };
    loadPurchases();
  }, [tenantId, getDateRangeBoundaries]);

  const purchaseStats = useMemo(() => {
    const arr = Array.isArray(purchases) ? purchases : [];
    const filtered = arr.filter(p => isWithinDateRange(p.createdAt));
    const totalAmount = filtered.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const uniqueSuppliers = new Set(filtered.map(p => p.supplierName)).size;
    return { totalAmount, totalPurchases: filtered.length, categories: uniqueSuppliers };
  }, [purchases, isWithinDateRange]);

  const filteredPurchases = useMemo(() => {
    const arr = Array.isArray(purchases) ? purchases : [];
    let result = [...arr];
    if (purchaseSearch.trim()) {
      const q = purchaseSearch.toLowerCase();
      result = result.filter(p =>
        p.supplierName?.toLowerCase().includes(q) ||
        p.purchaseNumber?.toLowerCase().includes(q) ||
        p.mobileNumber?.includes(q)
      );
    }
    if (purchaseSortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (purchaseSortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (purchaseSortBy === 'amount') {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    }
    return result;
  }, [purchases, purchaseSearch, purchaseSortBy]);

  const paginatedPurchases = useMemo(() => {
    const start = (purchasePage - 1) * PAGE_SIZE;
    return filteredPurchases.slice(start, start + PAGE_SIZE);
  }, [filteredPurchases, purchasePage]);

  const totalPurchasePages = Math.ceil(filteredPurchases.length / PAGE_SIZE) || 1;

  const togglePurchaseSelection = (id: string) => {
    setSelectedPurchases(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDeletePurchases = async () => {
    if (!window.confirm(`Delete ${selectedPurchases.size} selected purchases? This action cannot be undone.`)) return;
    let successCount = 0, failCount = 0;
    for (const id of selectedPurchases) {
      try {
        await fetch(`/api/purchases/${id}`, { method: 'DELETE', headers: { 'X-Tenant-Id': tenantId || '' } });
        successCount++;
      } catch (e) {
        console.error(`Failed to delete purchase ${id}:`, e);
        failCount++;
      }
    }
    setPurchases(prev => prev.filter(p => !selectedPurchases.has(p._id)));
    setSelectedPurchases(new Set());
    if (successCount > 0) alert(`${successCount} purchase(s) deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
    else if (failCount > 0) alert(`Failed to delete ${failCount} purchase(s)`);
  };

  const handleDeletePurchase = async (id: string) => {
    if (!window.confirm('Delete this purchase?')) return;
    try {
      await fetch(`/api/purchases/${id}`, { method: 'DELETE', headers: { 'X-Tenant-Id': tenantId || '' } });
      setPurchases(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      console.error('Failed to delete purchase:', e);
    }
    setPurchaseActionMenuOpen(null);
  };

  const handleAddPurchaseCategory = async () => {
    if (!newPurchaseCategoryName.trim()) return;
    try {
      await CategoryService.create({ name: newPurchaseCategoryName });
      setNewPurchaseCategoryName('');
      setIsPurchaseCategoryModalOpen(false);
    } catch (e) {
      alert('Failed to add category');
    }
  };

  const handlePrintPurchases = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    const htmlContent = `
      <!DOCTYPE html><html><head><title>Purchase Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #38bdf8; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #023337; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: linear-gradient(to right, #38bdf8, #1e90ff); color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .amount { color: #da3e00; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; color: #da3e00; }
      </style></head><body>
      <div class="header"><div class="title">Purchase Report</div></div>
      <table>
        <thead><tr><th>SL</th><th>Supplier</th><th>Number</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          ${filteredPurchases.map((p, idx) => `
            <tr>
              <td>${filteredPurchases.length - idx}</td>
              <td>${p.supplierName || 'N/A'}</td>
              <td>${p.mobileNumber || '-'}</td>
              <td class="amount">৳${p.totalAmount?.toLocaleString('en-IN') || 0}</td>
              <td>${new Date(p.createdAt).toLocaleDateString('en-GB')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total">Total: ৳${purchaseStats.totalAmount.toLocaleString('en-IN')}</div>
      </body></html>`;
    doc.document.write(htmlContent);
    doc.document.close();
    doc.print();
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-3 sm:px-5 pt-3 pb-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight font-['Roboto']">Purchase information</h2>
          <p className="text-[12px] text-slate-500 font-['Roboto']">View all purchase report</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-6">
          <div className="bg-[#f9f9f9] h-[34px] rounded-lg flex items-center px-2 w-full sm:w-[200px] lg:w-[300px]">
            <Search size={20} className="text-gray-400 mr-2" />
            <input
              type="text"
              value={purchaseSearch}
              onChange={(e) => setPurchaseSearch(e.target.value)}
              placeholder="Search Customers"
              className="bg-transparent text-[12px] text-gray-700 font-['Roboto'] outline-none flex-1"
            />
            <span className="text-[12px] text-slate-900 font-['Roboto']">Search</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#7b7b7b] font-['Roboto']">Sort by</span>
            <div className="bg-[#f9f9f9] rounded-lg px-2 py-2">
              <select
                value={purchaseSortBy}
                onChange={(e) => setPurchaseSortBy(e.target.value as 'newest' | 'oldest' | 'amount')}
                className="bg-transparent text-[12px] text-slate-900 font-['Roboto'] outline-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="amount">Amount</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => alert('Use the Purchase tab in sidebar to add new purchases')}
            className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] flex items-center gap-1 h-[48px] pl-3 pr-4 py-[6px] rounded-lg"
          >
            <AddSquareIcon />
            <span className="text-[15px] font-bold text-white tracking-[-0.3px] font-['Roboto']">Add Purchase</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3 sm:gap-4 px-3 sm:px-5 mt-4">
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-full sm:w-[396px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#da3e00] tracking-tight font-['Roboto']">
            ৳{purchaseStats.totalAmount.toLocaleString('en-IN')}.00
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Total purchase value</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-[calc(50%-6px)] sm:w-[148px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#022f37] tracking-tight font-['Roboto']">
            {purchaseStats.totalPurchases}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Total Purchase</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-[calc(50%-6px)] sm:w-[148px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#022f37] tracking-tight font-['Roboto']">
            {purchaseStats.categories}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Categories</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[100px] w-full sm:flex-1 overflow-hidden px-[18px] py-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-slate-500 font-['Roboto']">Actions</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsPurchaseCategoryModalOpen(true)} className="bg-white flex items-center gap-1 px-[6px] py-[6px] rounded">
                <AddSquareSmallIcon />
                <span className="text-[12px] text-slate-900 font-['Roboto']">Add Category</span>
              </button>
              <button onClick={handlePrintPurchases} className="bg-white flex items-center gap-1 px-[6px] py-[6px] rounded">
                <PrinterIcon />
                <span className="text-[12px] text-slate-900 font-['Roboto']">Print</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-[7px] mt-3">
            <span className="text-[12px] text-slate-900 font-['Roboto']">Filter by:</span>
            <div className="bg-white flex-1 flex items-center justify-between px-3 py-[11px] rounded">
              <select
                value={purchaseFilterCategory}
                onChange={(e) => setPurchaseFilterCategory(e.target.value)}
                className="text-[12px] text-slate-900 font-['Roboto'] bg-transparent border-none outline-none flex-1 cursor-pointer"
              >
                <option value="">Category</option>
                {expenseCategories.map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown size={18} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 px-2 sm:px-5 overflow-x-auto">
        <div className="bg-gradient-to-r from-[#38bdf8]/10 to-[#1e90ff]/10 h-[48px] flex items-center rounded-t-lg min-w-[700px]">
          <div className="w-12 flex-shrink-0 text-center">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[#eaf8e7] accent-[#38bdf8]"
              checked={selectedPurchases.size === paginatedPurchases.length && paginatedPurchases.length > 0}
              onChange={() => {
                if (selectedPurchases.size === paginatedPurchases.length) setSelectedPurchases(new Set());
                else setSelectedPurchases(new Set(paginatedPurchases.map(p => p._id)));
              }}
            />
          </div>
          {selectedPurchases.size > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-[12px] text-blue-700 font-medium">{selectedPurchases.size} selected</span>
              <button onClick={handleBulkDeletePurchases} className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-[12px] font-medium hover:bg-red-600">
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => setSelectedPurchases(new Set())} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-[12px] font-medium hover:bg-gray-300">
                <X size={14} /> Clear
              </button>
            </div>
          )}
          <div className="w-14 flex-shrink-0"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">SL</p></div>
          <div className="w-16 flex-shrink-0"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Doc</p></div>
          <div className="flex-1 min-w-[120px]"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Name</p></div>
          <div className="w-28 flex-shrink-0"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Number</p></div>
          <div className="w-28 flex-shrink-0"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Category</p></div>
          <div className="w-28 flex-shrink-0"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Date</p></div>
          <div className="w-24 flex-shrink-0 text-center"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Amount</p></div>
          <div className="w-16 flex-shrink-0 text-center"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Action</p></div>
        </div>

        {purchaseLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin text-[#38bdf8]" size={24} />
          </div>
        ) : paginatedPurchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <ShoppingBagIcon />
            <p className="mt-4 text-[14px]">No purchases found.</p>
          </div>
        ) : (
          paginatedPurchases.map((purchase, index) => (
            <div key={purchase._id} className="h-[68px] flex items-center border-b border-[#b9b9b9]/50 min-w-[700px] hover:bg-gray-50">
              <div className="w-12 flex-shrink-0 text-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-[#eaf8e7] accent-[#38bdf8]"
                  checked={selectedPurchases.has(purchase._id)}
                  onChange={() => togglePurchaseSelection(purchase._id)}
                />
              </div>
              <div className="w-14 flex-shrink-0">
                <p className="text-[12px] text-slate-900 font-['Roboto']">
                  {filteredPurchases.length - ((purchasePage - 1) * PAGE_SIZE) - index}
                </p>
              </div>
              <div className="w-16 flex-shrink-0">
                <div className="bg-[#f5f5f5] w-[46px] h-[46px] rounded-lg flex items-center justify-center">
                  {purchase.items?.[0]?.productImage ? (
                    <img src={purchase.items[0].productImage} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package size={20} className="text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <p className="text-[12px] text-slate-900 font-['Roboto'] truncate">{purchase.supplierName || 'N/A'}</p>
              </div>
              <div className="w-28 flex-shrink-0">
                <p className="text-[12px] text-slate-900 font-['Roboto']">{purchase.mobileNumber || '-'}</p>
              </div>
              <div className="w-28 flex-shrink-0">
                <p className="text-[12px] text-slate-900 font-['Roboto']">Product Buy</p>
              </div>
              <div className="w-28 flex-shrink-0">
                <p className="text-[12px] text-slate-900 font-['Roboto']">
                  {new Date(purchase.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                </p>
              </div>
              <div className="w-24 flex-shrink-0 text-center">
                <p className="text-[12px] text-[#da0000] font-['Roboto']">৳{purchase.totalAmount?.toLocaleString('en-IN') || 0}</p>
              </div>
              <div className="w-16 flex-shrink-0 flex justify-center relative">
                <button
                  onClick={() => setPurchaseActionMenuOpen(purchaseActionMenuOpen === purchase._id ? null : purchase._id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <DotsIcon />
                </button>
                {purchaseActionMenuOpen === purchase._id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => handleDeletePurchase(purchase._id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-gray-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {paginatedPurchases.length > 0 && (
        <div className="flex items-center justify-center gap-[279px] py-5">
          <button
            onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
            disabled={purchasePage === 1}
            className="bg-white flex items-center gap-1 h-[42px] pl-2 pr-3 py-[10px] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] disabled:opacity-50"
          >
            <ArrowLeftIcon />
            <span className="text-[15px] font-medium text-slate-900 font-['Roboto']">Previous</span>
          </button>
          <div className="flex items-center gap-3">
            {Array.from({ length: Math.min(5, totalPurchasePages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setPurchasePage(page)}
                className={`w-9 h-9 flex items-center justify-center rounded ${purchasePage === page ? 'bg-[#dff5ff] text-[#1e90ff]' : 'border border-[#d1d5db] text-slate-900'} text-[15px] font-medium font-['Roboto']`}
              >
                {page}
              </button>
            ))}
            {totalPurchasePages > 5 && (
              <>
                <button className="w-9 h-9 flex items-center justify-center border border-[#d1d5db] rounded text-[15px] font-bold text-slate-900 font-['Roboto']">....</button>
                <button onClick={() => setPurchasePage(totalPurchasePages)} className="w-9 h-9 flex items-center justify-center border border-[#d1d5db] rounded text-[15px] font-medium text-slate-900 font-['Roboto']">
                  {totalPurchasePages}
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setPurchasePage(p => Math.min(totalPurchasePages, p + 1))}
            disabled={purchasePage === totalPurchasePages}
            className="bg-white flex items-center gap-1 h-[42px] pl-3 pr-2 py-[10px] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] disabled:opacity-50"
          >
            <span className="text-[15px] font-medium text-slate-900 font-['Roboto']">Next</span>
            <ArrowRightIcon />
          </button>
        </div>
      )}

      {/* Add Category Modal */}
      {isPurchaseCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-slate-900 font-['Roboto']">Add Category</h3>
              <button onClick={() => setIsPurchaseCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newPurchaseCategoryName}
                onChange={(e) => setNewPurchaseCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] font-['Roboto']"
                placeholder="Enter category name"
              />
              <button
                onClick={handleAddPurchaseCategory}
                className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white py-3 rounded-lg text-[15px] font-bold font-['Roboto']"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseTab;
