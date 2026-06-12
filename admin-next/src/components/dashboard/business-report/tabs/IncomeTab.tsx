import React, { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw, X, Edit2, Trash2 } from 'lucide-react';
import { IncomeService, IncomeDTO, setIncomeTenantId } from '../../../../services/IncomeService';
import { CategoryDTO } from '../../../../services/CategoryService';
import { IncomeItem } from '../types';
import {
  AddSquareIcon, AddSquareSmallIcon, PrinterIcon,
  DotsIcon, ArrowLeftIcon, ArrowRightIcon, MoneyReceiveIcon,
} from '../icons';

interface IncomeTabProps {
  incomes: IncomeItem[];
  setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
  tenantId?: string;
  incomeLoading?: boolean;
}

const PAGE_SIZE = 10;

const IncomeTab: React.FC<IncomeTabProps> = ({
  incomes,
  setIncomes,
  tenantId,
  incomeLoading = false,
}) => {
  const [incomeCategories, setIncomeCategories] = useState<CategoryDTO[]>([]);
  const [incomePage, setIncomePage] = useState(1);
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState('');
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isIncomeCategoryModalOpen, setIsIncomeCategoryModalOpen] = useState(false);
  const [newIncomeCategoryName, setNewIncomeCategoryName] = useState('');
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState<Partial<IncomeItem>>({ status: 'Published' });
  const [selectedIncomes, setSelectedIncomes] = useState<Set<string>>(new Set());
  const [incomeActionMenuOpen, setIncomeActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    if (incomeCategories.length === 0) {
      IncomeService.listCategories().then(res => setIncomeCategories(res as any)).catch(console.error);
    }
  }, [tenantId, incomeCategories.length]);

  const incomeStats = {
    totalAmount: incomes.reduce((sum, i) => sum + i.amount, 0),
    totalTransactions: incomes.length,
    categories: new Set(incomes.map(i => i.category)).size || incomeCategories.length,
  };

  const pagedIncomes = incomes.slice((incomePage - 1) * PAGE_SIZE, incomePage * PAGE_SIZE);
  const totalIncomePages = Math.ceil(incomes.length / PAGE_SIZE) || 1;

  const handleAddIncome = async () => {
    if (!newIncome.name || !newIncome.category || !newIncome.amount || !newIncome.date) return;
    const payload: IncomeDTO = {
      name: newIncome.name!,
      category: newIncome.category!,
      amount: Number(newIncome.amount!),
      date: newIncome.date!,
      status: (newIncome.status as any) || 'Published',
      note: newIncome.note,
      imageUrl: newIncome.imageUrl,
    };
    try {
      if (editingIncomeId) {
        const updated = await IncomeService.update(editingIncomeId, payload);
        setIncomes(prev => prev.map(item => item.id === editingIncomeId ? { ...(updated as any), id: updated.id || editingIncomeId } : item));
      } else {
        const created = await IncomeService.create(payload);
        setIncomes(prev => [{ ...(created as any), id: created.id || Math.random().toString(36).slice(2) }, ...prev]);
      }
    } catch (e) {
      if (editingIncomeId) {
        setIncomes(prev => prev.map(item => item.id === editingIncomeId ? (newIncome as IncomeItem) : item));
      } else {
        setIncomes(prev => [{ id: Math.random().toString(36).slice(2), ...(payload as any) } as IncomeItem, ...prev]);
      }
    }
    setIsAddIncomeOpen(false);
    setNewIncome({ status: 'Published' });
    setEditingIncomeId(null);
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm('Delete this income?')) return;
    try { await IncomeService.remove(id); } catch (e) { /* fall through */ }
    setIncomes(prev => prev.filter(i => i.id !== id));
    setIncomeActionMenuOpen(null);
  };

  const handleAddIncomeCategory = async () => {
    if (!newIncomeCategoryName.trim()) return;
    try {
      const created = await IncomeService.createCategory(newIncomeCategoryName);
      setIncomeCategories(prev => [...prev, created as any]);
      setNewIncomeCategoryName('');
      setIsIncomeCategoryModalOpen(false);
    } catch (e) {
      alert('Failed to add category');
    }
  };

  const toggleIncomeSelection = (id: string) => {
    setSelectedIncomes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDeleteIncomes = async () => {
    if (!window.confirm(`Delete ${selectedIncomes.size} selected incomes? This action cannot be undone.`)) return;
    if (tenantId) setIncomeTenantId(tenantId);
    let successCount = 0, failCount = 0;
    for (const id of selectedIncomes) {
      try { await IncomeService.remove(id); successCount++; }
      catch (e) { failCount++; }
    }
    setIncomes(prev => prev.filter(i => !selectedIncomes.has(i.id)));
    setSelectedIncomes(new Set());
    if (successCount > 0) alert(`${successCount} income(s) deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
    else if (failCount > 0) alert(`Failed to delete ${failCount} income(s)`);
  };

  const handlePrintIncomes = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    const htmlContent = `
      <!DOCTYPE html><html><head><title>Income Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #38bdf8; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #023337; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: linear-gradient(to right, #38bdf8, #1e90ff); color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .amount { color: #008c09; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; color: #008c09; }
      </style></head><body>
      <div class="header"><div class="title">Income Report</div></div>
      <table>
        <thead><tr><th>SL</th><th>Name</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          ${incomes.map((i, idx) => `
            <tr>
              <td>${incomes.length - idx}</td><td>${i.name}</td><td>${i.category}</td>
              <td class="amount">৳${i.amount.toLocaleString('en-IN')}</td>
              <td>${new Date(i.date).toLocaleDateString('en-GB')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total">Total: ৳${incomeStats.totalAmount.toLocaleString('en-IN')}</div>
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
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight font-['Roboto']">Income</h2>
          <p className="text-[12px] text-slate-500 font-['Roboto']">Track your other income sources</p>
        </div>
        <button
          onClick={() => { setNewIncome({ status: 'Published' }); setEditingIncomeId(null); setIsAddIncomeOpen(true); }}
          className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] flex items-center gap-1 h-[48px] pl-3 pr-4 py-[6px] rounded-lg"
        >
          <AddSquareIcon />
          <span className="text-[15px] font-bold text-white tracking-[-0.3px] font-['Roboto']">Add Income</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3 sm:gap-4 px-3 sm:px-5 mt-4">
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-full sm:w-[396px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#008c09] tracking-tight tabular-nums font-['Roboto']">
            ৳{incomeStats.totalAmount.toLocaleString('en-IN')}.00
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Total income</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-[calc(50%-6px)] sm:w-[148px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#022f37] tracking-tight tabular-nums font-['Roboto']">
            {incomeStats.totalTransactions}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Total Transactions</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-[calc(50%-6px)] sm:w-[148px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#022f37] tracking-tight tabular-nums font-['Roboto']">
            {incomeStats.categories}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Categories</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[100px] w-full sm:flex-1 overflow-hidden px-[18px] py-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-slate-500 font-['Roboto']">Actions</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsIncomeCategoryModalOpen(true)} className="bg-white flex items-center gap-1 px-[6px] py-[6px] rounded">
                <AddSquareSmallIcon />
            <span className="text-[12px] text-slate-900 font-['Roboto']">Add Category</span>
              </button>
              <button onClick={handlePrintIncomes} className="bg-white flex items-center gap-1 px-[6px] py-[6px] rounded">
                <PrinterIcon />
            <span className="text-[12px] text-slate-900 font-['Roboto']">Print</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-[7px] mt-3">
            <span className="text-[12px] text-slate-500 font-['Roboto']">Filter by:</span>
            <div className="bg-white flex-1 flex items-center justify-between px-3 py-[11px] rounded">
              <select
                value={selectedIncomeCategory}
                onChange={(e) => setSelectedIncomeCategory(e.target.value)}
                className="text-[12px] text-slate-900 font-['Roboto'] bg-transparent border-none outline-none flex-1 cursor-pointer"
              >
                <option value="">All Categories</option>
                {incomeCategories.map(cat => (
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
          <div className="w-[60px] text-center">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[#eaf8e7] accent-[#38bdf8]"
              checked={selectedIncomes.size === incomes.length && incomes.length > 0}
              onChange={() => {
                if (selectedIncomes.size === incomes.length) setSelectedIncomes(new Set());
                else setSelectedIncomes(new Set(incomes.map(i => i.id)));
              }}
            />
          </div>
          {selectedIncomes.size > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[12px] text-blue-700 font-medium">{selectedIncomes.size} selected</span>
              <button onClick={handleBulkDeleteIncomes} className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-[12px] font-medium hover:bg-red-600">
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => setSelectedIncomes(new Set())} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-[12px] font-medium hover:bg-gray-300">
                <X size={14} /> Clear
              </button>
            </div>
          )}
          <div className={`w-[80px] ${selectedIncomes.size === 0 ? '' : 'ml-auto'}`}><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">SL</p></div>
          <div className="flex-1"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Name</p></div>
          <div className="w-[150px]"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Category</p></div>
          <div className="w-[120px] text-center"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Amount</p></div>
          <div className="w-[120px]"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Date</p></div>
          <div className="w-[80px] text-center"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Action</p></div>
        </div>

        {incomeLoading && incomes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin text-[#38bdf8]" size={24} />
          </div>
        ) : incomes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <MoneyReceiveIcon />
            <p className="mt-4 text-[14px]">No income found. Click &quot;Add Income&quot; to create one.</p>
          </div>
        ) : (
          pagedIncomes.map((income, index) => (
            <div key={income.id || `income-${index}`} className="h-[68px] flex items-center border-b border- min-w-[700px] [#b9b9b9]/50 hover:bg-gray-50">
              <div className="w-[60px] text-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-[#eaf8e7] accent-[#38bdf8]"
                  checked={selectedIncomes.has(income.id)}
                  onChange={() => toggleIncomeSelection(income.id)}
                />
              </div>
              <div className="w-[80px]">
                <p className="text-[12px] text-slate-500 font-mono tabular-nums font-['Roboto']">{incomes.length - ((incomePage - 1) * PAGE_SIZE) - index}</p>
              </div>
              <div className="flex-1"><p className="text-[12px] text-slate-900 font-['Roboto']">{income.name}</p></div>
              <div className="w-[150px]"><p className="text-[12px] text-slate-500 font-['Roboto']">{income.category}</p></div>
              <div className="w-[120px] text-center">
                <p className="text-[12px] text-[#008c09] tabular-nums font-mono font-['Roboto']">৳{income.amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-[120px]">
                <p className="text-[12px] text-slate-500 font-['Roboto']">
                  {new Date(income.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                </p>
              </div>
              <div className="w-[80px] flex justify-center relative">
                <button
                  onClick={() => { const menuId = income.id || `income-${index}`; setIncomeActionMenuOpen(incomeActionMenuOpen === menuId ? null : menuId); }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <DotsIcon />
                </button>
                {incomeActionMenuOpen === (income.id || `income-${index}`) && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => { setNewIncome(income); setEditingIncomeId(income.id); setIsAddIncomeOpen(true); setIncomeActionMenuOpen(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(income.id)}
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
      {incomes.length > 0 && (
        <div className="flex items-center justify-center gap-[279px] py-5">
          <button
            onClick={() => setIncomePage(p => Math.max(1, p - 1))}
            disabled={incomePage === 1}
            className="bg-white flex items-center gap-1 h-[42px] pl-2 pr-3 py-[10px] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] disabled:opacity-50"
          >
            <ArrowLeftIcon />
            <span className="text-[15px] font-medium text-slate-900 font-['Roboto']">Previous</span>
          </button>
          <div className="flex items-center gap-3">
            {Array.from({ length: Math.min(5, totalIncomePages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setIncomePage(page)}
                className={`w-9 h-9 flex items-center justify-center rounded ${incomePage === page ? 'bg-[#dff5ff] text-[#1e90ff]' : 'border border-[#d1d5db] text-slate-900'} text-[15px] font-medium font-['Roboto']`}
              >
                {page}
              </button>
            ))}
            {totalIncomePages > 5 && (
              <>
                <button className="w-9 h-9 flex items-center justify-center border border-[#d1d5db] rounded text-[15px] font-bold text-slate-900 font-['Roboto']">.....</button>
                <button onClick={() => setIncomePage(totalIncomePages)} className="w-9 h-9 flex items-center justify-center border border-[#d1d5db] rounded text-[15px] font-medium text-slate-900 font-['Roboto']">
                  {totalIncomePages}
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setIncomePage(p => Math.min(totalIncomePages, p + 1))}
            disabled={incomePage === totalIncomePages}
            className="bg-white flex items-center gap-1 h-[42px] pl-3 pr-2 py-[10px] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] disabled:opacity-50"
          >
            <span className="text-[15px] font-medium text-slate-900 font-['Roboto']">Next</span>
            <ArrowRightIcon />
          </button>
        </div>
      )}

      {/* Add/Edit Income Modal */}
      {isAddIncomeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[8px] p-5 w-full max-w-[548px] overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
              <h3 className="text-[16px] font-semibold text-slate-900 font-['Roboto']">{editingIncomeId ? 'Edit Income' : 'Add Income'}</h3>
              <button onClick={() => { setIsAddIncomeOpen(false); setEditingIncomeId(null); }} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-[15px] font-semibold text-slate-900 font-['Roboto']">Income Name<span className="text-[#da0000]">*</span></label>
                <input
                  type="text"
                  value={newIncome.name || ''}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-[48px] px-3 py-[10px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] text-slate-900 font-['Roboto'] placeholder:text-[#aeaeae] outline-none focus:border-[#38bdf8]"
                  placeholder="Enter income name"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[15px] font-semibold text-slate-900 font-['Roboto']">Category<span className="text-[#da0000]">*</span></label>
                <div className="relative">
                  <select
                    value={newIncome.category || ''}
                    onChange={(e) => setNewIncome(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-[48px] px-3 py-[10px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] text-slate-900 font-['Roboto'] appearance-none cursor-pointer outline-none focus:border-[#38bdf8]"
                  >
                    <option value="" className="text-[#aeaeae]">Select Category</option>
                    {incomeCategories.map(cat => (
                      <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-3">
                  <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Amount<span className="text-[#da0000]">*</span></label>
                  <input
                    type="number"
                    value={newIncome.amount || ''}
                    onChange={(e) => setNewIncome(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full h-[48px] px-3 py-[10px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] text-slate-900 font-['Roboto'] placeholder:text-[#aeaeae] outline-none focus:border-[#38bdf8]"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Date<span className="text-[#da0000]">*</span></label>
                  <input
                    type="date"
                    value={newIncome.date || ''}
                    onChange={(e) => setNewIncome(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full h-[48px] px-3 py-[10px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] text-slate-900 font-['Roboto'] placeholder:text-[#aeaeae] outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Image Upload</label>
                <div
                  className="w-full h-[153px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#38bdf8] transition-colors"
                  onClick={() => document.getElementById('income-image-upload')?.click()}
                >
                  {newIncome.imageUrl ? (
                    <div className="relative w-full h-full p-2">
                      <img src={newIncome.imageUrl} alt="Income" className="w-full h-full object-contain rounded" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setNewIncome(prev => ({ ...prev, imageUrl: undefined })); }}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[15px] text-[#aeaeae] font-['Roboto']">Upload Doc</p>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aeaeae" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </>
                  )}
                </div>
                <input
                  id="income-image-upload" type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setNewIncome(prev => ({ ...prev, imageUrl: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Note</label>
                <input
                  type="text"
                  value={newIncome.note || ''}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full h-[48px] px-3 py-[10px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] text-slate-900 font-['Roboto'] placeholder:text-[#aeaeae] outline-none focus:border-[#38bdf8]"
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => { setIsAddIncomeOpen(false); setEditingIncomeId(null); }}
                  className="h-[40px] px-4 py-2 bg-white border border-[#e5e7eb] rounded-[8px] text-[15px] font-bold text-slate-900 font-['Roboto'] tracking-[-0.3px] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIncome}
                  className="h-[40px] px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-[8px] text-[15px] font-bold text-white font-['Roboto'] tracking-[-0.3px] hover:opacity-90"
                >
                  {editingIncomeId ? 'Update Income' : 'Save Income'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isIncomeCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-slate-900 font-['Roboto']">Add Category</h3>
              <button onClick={() => setIsIncomeCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newIncomeCategoryName}
                onChange={(e) => setNewIncomeCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] font-['Roboto']"
                placeholder="Enter category name"
              />
              <button onClick={handleAddIncomeCategory} className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white py-3 rounded-lg text-[15px] font-bold font-['Roboto']">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeTab;
