import React, { useState } from 'react';
import { ChevronDown, RefreshCw, X, Edit2, Trash2 } from 'lucide-react';
import { ExpenseService, ExpenseDTO, setExpenseTenantId } from '../../../../services/ExpenseService';
import { CategoryService, CategoryDTO, setCategoryTenantId } from '../../../../services/CategoryService';
import { ExpenseItem } from '../types';
import {
  AddSquareIcon, AddSquareSmallIcon, PrinterIcon,
  DotsIcon, ArrowLeftIcon, ArrowRightIcon, InvoiceIcon,
} from '../icons';

interface ExpenseTabProps {
  expenses: ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  expenseCategories: CategoryDTO[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<CategoryDTO[]>>;
  tenantId?: string;
  expenseLoading?: boolean;
}

const PAGE_SIZE = 10;

const ExpenseTab: React.FC<ExpenseTabProps> = ({
  expenses,
  setExpenses,
  expenseCategories,
  setExpenseCategories,
  tenantId,
  expenseLoading = false,
}) => {
  const [expensePage, setExpensePage] = useState(1);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<ExpenseItem>>({ status: 'Published' });
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState<ExpenseItem | null>(null);

  const expenseStats = {
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    totalTransactions: expenses.length,
    categories: new Set(expenses.map(e => e.category)).size || expenseCategories.length,
  };

  const pagedExpenses = expenses.slice((expensePage - 1) * PAGE_SIZE, expensePage * PAGE_SIZE);
  const totalExpensePages = Math.ceil(expenses.length / PAGE_SIZE) || 1;

  const handleAddExpense = async () => {
    if (!newExpense.name || !newExpense.category || !newExpense.amount || !newExpense.date) {
      const missing = [];
      if (!newExpense.name) missing.push('Name');
      if (!newExpense.category) missing.push('Category');
      if (!newExpense.amount) missing.push('Amount');
      if (!newExpense.date) missing.push('Date');
      alert(`Please fill in required fields: ${missing.join(', ')}`);
      return;
    }
    if (tenantId) setExpenseTenantId(tenantId);
    const payload: ExpenseDTO = {
      name: newExpense.name!,
      category: newExpense.category!,
      amount: Number(newExpense.amount!),
      date: newExpense.date!,
      status: (newExpense.status as any) || 'Published',
      note: newExpense.note,
      imageUrl: newExpense.imageUrl,
    };
    try {
      if (editingExpenseId) {
        const updated = await ExpenseService.update(editingExpenseId, payload);
        setExpenses(prev => prev.map(item => item.id === editingExpenseId ? { ...(updated as any), id: updated.id || editingExpenseId } : item));
      } else {
        const created = await ExpenseService.create(payload);
        setExpenses(prev => [{ ...(created as any), id: created.id || Math.random().toString(36).slice(2) }, ...prev]);
      }
      setIsAddExpenseOpen(false);
      setNewExpense({ status: 'Published' });
      setEditingExpenseId(null);
      setIsCategoryDropdownOpen(false);
    } catch (e) {
      console.error('Failed to save expense:', e);
      alert('Failed to save expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await ExpenseService.remove(id);
    } catch (e) {
      // still remove from local state
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
    setActionMenuOpen(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) { alert('Please enter a category name'); return; }
    const effectiveTenantId = tenantId || localStorage.getItem('tenantId') || '';
    if (!effectiveTenantId) { alert('Error: No tenant ID available.'); return; }
    setCategoryTenantId(effectiveTenantId);
    try {
      const created = await CategoryService.create({ name: newCategoryName });
      setExpenseCategories(prev => [...prev, created]);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (e: any) {
      alert('Failed to add category: ' + (e?.message || e?.response?.data?.error || 'Unknown error'));
    }
  };

  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDeleteExpenses = async () => {
    if (!window.confirm(`Delete ${selectedExpenses.size} selected expenses? This action cannot be undone.`)) return;
    if (tenantId) setExpenseTenantId(tenantId);
    let successCount = 0, failCount = 0;
    for (const id of selectedExpenses) {
      try { await ExpenseService.remove(id); successCount++; }
      catch (e) { failCount++; }
    }
    setExpenses(prev => prev.filter(e => !selectedExpenses.has(e.id)));
    setSelectedExpenses(new Set());
    if (successCount > 0) alert(`${successCount} expense(s) deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
    else if (failCount > 0) alert(`Failed to delete ${failCount} expense(s)`);
  };

  const handlePrintExpenses = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    const htmlContent = `
      <!DOCTYPE html><html><head><title>Expense Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #38bdf8; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #023337; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: linear-gradient(to right, #38bdf8, #1e90ff); color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .amount { color: #da0000; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
      </style></head><body>
      <div class="header"><div class="title">Expense Report</div></div>
      <table>
        <thead><tr><th>SL</th><th>Name</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>
          ${expenses.map((e, i) => `
            <tr>
              <td>${expenses.length - i}</td><td>${e.name}</td><td>${e.category}</td>
              <td class="amount">৳${e.amount.toLocaleString('en-IN')}</td>
              <td>${new Date(e.date).toLocaleDateString('en-GB')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total">Total: ৳${expenseStats.totalAmount.toLocaleString('en-IN')}</div>
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
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight font-['Roboto']">Expense Summary</h2>
          <p className="text-[12px] text-slate-500 font-['Roboto']">Total expenses overview for the selected period.</p>
        </div>
        <button
          onClick={() => { setNewExpense({ status: 'Published' }); setEditingExpenseId(null); setIsAddExpenseOpen(true); }}
          className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] flex items-center gap-1 h-[48px] pl-3 pr-4 py-[6px] rounded-lg"
        >
          <AddSquareIcon />
          <span className="text-[15px] font-bold text-white tracking-[-0.3px] font-['Roboto']">Add Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3 sm:gap-4 px-3 sm:px-5 mt-4">
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-full sm:w-[396px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#da3e00] tracking-tight tabular-nums font-['Roboto']">
            ৳{expenseStats.totalAmount.toLocaleString('en-IN')}.00
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Total expenses with product cost</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-[calc(50%-6px)] sm:w-[148px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#022f37] tracking-tight tabular-nums font-['Roboto']">
            {expenseStats.totalTransactions}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Total Transactions</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[80px] sm:h-[100px] w-[calc(50%-6px)] sm:w-[148px] overflow-hidden px-[18px] py-5">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#022f37] tracking-tight tabular-nums font-['Roboto']">
            {expenseStats.categories}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto'] mt-2">Categories</p>
        </div>
        <div className="bg-[#f9f9f9] rounded-lg h-auto min-h-[100px] w-full sm:flex-1 overflow-hidden px-[18px] py-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-slate-500 font-['Roboto']">Actions</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCategoryModalOpen(true)} className="bg-white flex items-center gap-1 px-[6px] py-[6px] rounded">
                <AddSquareSmallIcon />
                <span className="text-[12px] text-slate-900 font-['Roboto']">Add Category</span>
              </button>
              <button onClick={handlePrintExpenses} className="bg-white flex items-center gap-1 px-[6px] py-[6px] rounded">
                <PrinterIcon />
                <span className="text-[12px] text-slate-900 font-['Roboto']">Print</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-[7px] mt-3">
            <span className="text-[12px] text-slate-500 font-['Roboto']">Filter by:</span>
            <div className="bg-white flex-1 flex items-center justify-between px-3 py-[11px] rounded">
              <select
                value={selectedExpenseCategory}
                onChange={(e) => setSelectedExpenseCategory(e.target.value)}
                className="text-[12px] text-slate-900 font-['Roboto'] bg-transparent border-none outline-none flex-1 cursor-pointer"
              >
                <option value="">All Categories</option>
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
          <div className="w-[60px] text-center">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[#eaf8e7] accent-[#38bdf8]"
              checked={selectedExpenses.size === expenses.length && expenses.length > 0}
              onChange={() => {
                if (selectedExpenses.size === expenses.length) setSelectedExpenses(new Set());
                else setSelectedExpenses(new Set(expenses.map(e => e.id)));
              }}
            />
          </div>
          {selectedExpenses.size > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[12px] text-blue-700 font-medium">{selectedExpenses.size} selected</span>
              <button onClick={handleBulkDeleteExpenses} className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-[12px] font-medium hover:bg-red-600">
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => setSelectedExpenses(new Set())} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-[12px] font-medium hover:bg-gray-300">
                <X size={14} /> Clear
              </button>
            </div>
          )}
          <div className={`w-[80px] ${selectedExpenses.size === 0 ? '' : 'ml-auto'}`}><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">SL</p></div>
          <div className="flex-1"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Name</p></div>
          <div className="w-[150px]"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Category</p></div>
          <div className="w-[120px] text-center"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Amount</p></div>
          <div className="w-[120px]"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Date</p></div>
          <div className="w-[80px] text-center"><p className="text-[16px] font-medium text-slate-900 font-['Roboto']">Action</p></div>
        </div>

        {expenseLoading && expenses.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin text-[#38bdf8]" size={24} />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <InvoiceIcon />
            <p className="mt-4 text-[14px]">No expenses found. Click &quot;Add Expense&quot; to create one.</p>
          </div>
        ) : (
          pagedExpenses.map((expense, index) => (
            <div key={expense.id || `expense-${index}`} className="h-[68px] flex items-center border-b border- min-w-[700px] [#b9b9b9]/50 hover:bg-gray-50">
              <div className="w-[60px] text-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-[#eaf8e7] accent-[#38bdf8]"
                  checked={selectedExpenses.has(expense.id)}
                  onChange={() => toggleExpenseSelection(expense.id)}
                />
              </div>
              <div className="w-[80px]">
                <p className="text-[12px] text-slate-500 font-mono tabular-nums font-['Roboto']">{expenses.length - ((expensePage - 1) * PAGE_SIZE) - index}</p>
              </div>
              <div className="flex-1"><p className="text-[12px] text-slate-900 font-['Roboto']">{expense.name}</p></div>
              <div className="w-[150px]"><p className="text-[12px] text-slate-500 font-['Roboto']">{expense.category}</p></div>
              <div className="w-[120px] text-center">
                <p className="text-[12px] text-[#da0000] tabular-nums font-mono font-['Roboto']">৳{expense.amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-[120px]">
                <p className="text-[12px] text-slate-500 font-['Roboto']">
                  {new Date(expense.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                </p>
              </div>
              <div className="w-[80px] flex justify-center relative">
                <button
                  onClick={() => { const menuId = expense.id || `expense-${index}`; setActionMenuOpen(actionMenuOpen === menuId ? null : menuId); }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <DotsIcon />
                </button>
                {actionMenuOpen === (expense.id || `expense-${index}`) && (
                  <div className="absolute right-0 top-8 bg-white rounded-[8px] shadow-[0px_3px_19.5px_0px_rgba(0,0,0,0.13)] z-10 overflow-hidden py-2">
                    <button
                      onClick={() => { setExpenseDetailsOpen(expense); setActionMenuOpen(null); }}
                      className="w-full h-[48px] flex items-center gap-2 px-4 hover:bg-gray-50"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                      <span className="text-[16px] font-semibold text-slate-900 font-['Roboto']">Details</span>
                    </button>
                    <button
                      onClick={() => { setNewExpense(expense); setEditingExpenseId(expense.id); setIsAddExpenseOpen(true); setActionMenuOpen(null); }}
                      className="w-full h-[48px] flex items-center gap-2 px-4 hover:bg-gray-50"
                    >
                      <Edit2 size={18} />
                      <span className="text-[16px] font-semibold text-slate-900 font-['Roboto']">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="w-full h-[48px] flex items-center gap-2 px-4 hover:bg-gray-50"
                    >
                      <Trash2 size={18} className="text-[#da0000]" />
                      <span className="text-[16px] font-semibold text-[#da0000] font-['Roboto']">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {expenses.length > 0 && (
        <div className="flex items-center justify-center gap-[279px] py-5">
          <button
            onClick={() => setExpensePage(p => Math.max(1, p - 1))}
            disabled={expensePage === 1}
            className="bg-white flex items-center gap-1 h-[42px] pl-2 pr-3 py-[10px] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] disabled:opacity-50"
          >
            <ArrowLeftIcon />
            <span className="text-[15px] font-medium text-slate-900 font-['Roboto']">Previous</span>
          </button>
          <div className="flex items-center gap-3">
            {Array.from({ length: Math.min(5, totalExpensePages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setExpensePage(page)}
                className={`w-9 h-9 flex items-center justify-center rounded ${expensePage === page ? 'bg-[#dff5ff] text-[#1e90ff]' : 'border border-[#d1d5db] text-slate-900'} text-[15px] font-medium font-['Roboto']`}
              >
                {page}
              </button>
            ))}
            {totalExpensePages > 5 && (
              <>
                <button className="w-9 h-9 flex items-center justify-center border border-[#d1d5db] rounded text-[15px] font-bold text-slate-900 font-['Roboto']">.....</button>
                <button onClick={() => setExpensePage(totalExpensePages)} className="w-9 h-9 flex items-center justify-center border border-[#d1d5db] rounded text-[15px] font-medium text-slate-900 font-['Roboto']">
                  {totalExpensePages}
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setExpensePage(p => Math.min(totalExpensePages, p + 1))}
            disabled={expensePage === totalExpensePages}
            className="bg-white flex items-center gap-1 h-[42px] pl-3 pr-2 py-[10px] rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.2)] disabled:opacity-50"
          >
            <span className="text-[15px] font-medium text-slate-900 font-['Roboto']">Next</span>
            <ArrowRightIcon />
          </button>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[8px] p-5 w-full max-w-[548px] overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
              <h3 className="text-[16px] font-semibold text-slate-900 text-center font-['Roboto']">
                {editingExpenseId ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button onClick={() => { setIsAddExpenseOpen(false); setEditingExpenseId(null); }} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                <label className="text-[15px] font-semibold text-slate-900 font-['Roboto']">Expense Name<span className="text-[#da0000]">*</span></label>
                <input
                  type="text"
                  value={newExpense.name || ''}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] font-['Roboto'] text-slate-900 placeholder-[#aeaeae]"
                  placeholder="Enter expense name"
                />
              </div>
              <div className="flex flex-col gap-3 relative">
                <label className="text-[15px] font-semibold text-slate-900 font-['Roboto']">Category<span className="text-[#da0000]">*</span></label>
                <div
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] font-['Roboto'] text-slate-900 cursor-pointer flex items-center justify-between"
                >
                  <span className={newExpense.category ? 'text-slate-900' : 'text-[#aeaeae]'}>
                    {newExpense.category || 'Select Category'}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-700 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-[16px] shadow-[0px_3px_19.5px_0px_rgba(0,0,0,0.13)] z-10 overflow-hidden">
                    <div className="p-4 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                      {expenseCategories.map(cat => (
                        <div
                          key={cat.id || cat.name}
                          onClick={() => { setNewExpense(prev => ({ ...prev, category: cat.name })); setIsCategoryDropdownOpen(false); }}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${newExpense.category === cat.name ? 'border-[#38bdf8] bg-[#38bdf8]' : 'border-gray-300'}`}>
                            {newExpense.category === cat.name && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                          <span className="text-[15px] font-medium text-slate-900 font-['Roboto']">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsCategoryDropdownOpen(false); setIsCategoryModalOpen(true); }}
                        className="flex items-center gap-2.5 px-3 py-3 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-[8px] text-white"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="12" y1="8" x2="12" y2="16"></line>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        <span className="text-[15px] font-medium font-['Roboto']">Add New Category</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-3">
                  <label className="text-[15px] font-semibold text-slate-900 font-['Roboto']">Amount<span className="text-[#da0000]">*</span></label>
                  <input
                    type="number"
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] font-['Roboto'] text-slate-900 placeholder-[#aeaeae] tabular-nums"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <label className="text-[15px] font-semibold text-slate-900 font-['Roboto']">Date<span className="text-[#da0000]">*</span></label>
                  <input
                    type="date"
                    value={newExpense.date || ''}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] font-['Roboto'] text-slate-900"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Image Upload</label>
                <div
                  className="w-full h-[153px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#f3f4f6] transition-colors"
                  onClick={() => document.getElementById('expense-image-upload')?.click()}
                >
                  {newExpense.imageUrl ? (
                    <div className="relative w-full h-full p-2">
                      <img src={newExpense.imageUrl} alt="Expense" className="w-full h-full object-contain rounded" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setNewExpense(prev => ({ ...prev, imageUrl: undefined })); }}
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
                  id="expense-image-upload" type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setNewExpense(prev => ({ ...prev, imageUrl: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Note</label>
                <input
                  type="text"
                  value={newExpense.note || ''}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] text-[15px] font-['Roboto'] text-slate-900 placeholder-[#aeaeae]"
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => { setIsAddExpenseOpen(false); setEditingExpenseId(null); }}
                  className="h-[40px] px-4 py-2 bg-white border border-[#e5e7eb] rounded-[8px] text-[15px] font-bold text-slate-900 font-['Roboto'] tracking-[-0.3px] min-w-[111px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  className="h-[40px] px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-[8px] text-[15px] font-bold text-white font-['Roboto'] tracking-[-0.3px]"
                >
                  {editingExpenseId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-slate-900 font-['Roboto']">Add Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] font-['Roboto']"
                placeholder="Enter category name"
              />
              <button onClick={handleAddCategory} className="bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white py-3 rounded-lg text-[15px] font-bold font-['Roboto']">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {expenseDetailsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[8px] p-5 w-full max-w-[548px] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
              <h3 className="text-[16px] font-semibold text-slate-900 text-center font-['Roboto']">Expense Details</h3>
              <button onClick={() => setExpenseDetailsOpen(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Expense Name</label>
                <div className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center">
                  <span className="text-[15px] font-['Roboto'] text-slate-900">{expenseDetailsOpen.name}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Category</label>
                <div className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center">
                  <span className="text-[15px] font-['Roboto'] text-slate-900">{expenseDetailsOpen.category}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Amount</label>
                  <div className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center">
                    <span className="text-[15px] font-['Roboto'] text-slate-900">৳{expenseDetailsOpen.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Date</label>
                  <div className="w-full h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center">
                    <span className="text-[15px] font-['Roboto'] text-slate-900">
                      {new Date(expenseDetailsOpen.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </span>
                  </div>
                </div>
              </div>
              {expenseDetailsOpen.imageUrl && (
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Image</label>
                  <div className="w-full h-[153px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center justify-center overflow-hidden">
                    <img src={expenseDetailsOpen.imageUrl} alt="Expense" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
              )}
              {expenseDetailsOpen.note && (
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] font-bold text-slate-900 font-['Roboto']">Note</label>
                  <div className="w-full min-h-[48px] px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center">
                    <span className="text-[15px] font-['Roboto'] text-slate-900">{expenseDetailsOpen.note}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => setExpenseDetailsOpen(null)}
                  className="h-[40px] px-4 py-2 bg-white border border-[#e5e7eb] rounded-[8px] text-[15px] font-bold text-slate-900 font-['Roboto'] tracking-[-0.3px] min-w-[111px]"
                >
                  Close
                </button>
                <button
                  onClick={() => { setNewExpense(expenseDetailsOpen); setEditingExpenseId(expenseDetailsOpen.id); setExpenseDetailsOpen(null); setIsAddExpenseOpen(true); }}
                  className="h-[40px] px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-[8px] text-[15px] font-bold text-white font-['Roboto'] tracking-[-0.3px]"
                >
                  Edit Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTab;
