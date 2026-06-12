'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchExpenses, createExpense, deleteExpense, type Expense } from '@/lib/services/expenses';
import { formatCurrency } from '@/lib/tenant-config';
import { Receipt, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

function getExpenseId(expense: Expense) {
  return expense._id || expense.id || '';
}

function getExpenseKey(expense: Expense, index: number) {
  return getExpenseId(expense) || `${expense.name}-${expense.date}-${index}`;
}

export default function ExpensesPage() {
  const { tenantId, tenantConfig } = useAuth();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const loadExpenses = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchExpenses(tenantId);
      setExpenses(data.expenses);
      setTotalAmount(data.expenses.reduce((s, e) => s + (e.amount || 0), 0));
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAdd = async (name: string, amount: number, category: string, note: string) => {
    if (!tenantId) return;
    try {
      await createExpense(tenantId, { name, amount, category, note, date: new Date().toISOString() });
      toast.success('Expense added');
      setShowForm(false);
      loadExpenses();
    } catch {
      toast.error('Failed to add expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenantId || !id || !confirm('Delete this expense?')) return;
    try {
      await deleteExpense(tenantId, id);
      setExpenses(prev => prev.filter(e => e._id !== id));
      toast.success('Expense deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt size={24} className="text-orange-500" />
            Expenses
          </h1>
          <p className="text-sm text-gray-500">Total: {fc(totalAmount)}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
          <h3 className="font-semibold mb-3">New Expense</h3>
          <ExpenseForm categories={tenantConfig.expenseCategories} onSave={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white border rounded-lg p-4 animate-pulse h-16" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <Receipt size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No expenses recorded</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((e, index) => (
                  <tr key={getExpenseKey(e, index)} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{e.name}</p>
                      {e.note && <p className="text-xs text-gray-400">{e.note}</p>}
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{e.category || '-'}</span></td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">{fc(e.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(getExpenseId(e))} disabled={!getExpenseId(e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseForm({ categories, onSave, onCancel }: { categories: string[]; onSave: (name: string, amount: number, category: string, note: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[categories.length - 1] || 'Other');
  const [note, setNote] = useState('');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Expense name *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Amount *" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (!name || !amount) { toast.error('Name and amount required'); return; } onSave(name, Number(amount), category, note); }} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"><Save size={14} /> Save</button>
        <button onClick={onCancel} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}
