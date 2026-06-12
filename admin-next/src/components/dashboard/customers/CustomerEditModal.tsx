import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CustomerInfo } from './types';
import { getAuthHeader } from '../../../services/authService';

interface CustomerEditModalProps {
  customer: CustomerInfo | null;
  tenantId: string;
  allCustomers: CustomerInfo[];
  onClose: () => void;
  onSaved: (updated: CustomerInfo) => void;
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  customer,
  tenantId,
  allCustomers,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    company: customer?.company ?? '',
    status: (customer?.status ?? 'Active') as 'Active' | 'Blocked',
  });
  const [saving, setSaving] = useState(false);

  if (!customer) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone number are required.');
      return;
    }

    setSaving(true);
    try {
      const updated: CustomerInfo = {
        ...customer,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        company: form.company.trim() || undefined,
        status: form.status,
      };

      // Replace or insert this customer in the manual customers list and persist
      const existingIdx = allCustomers.findIndex(
        (c) => c.id === customer.id || c.phone === customer.phone,
      );
      const updatedList =
        existingIdx >= 0
          ? allCustomers.map((c, i) => (i === existingIdx ? updated : c))
          : [...allCustomers, updated];

      const res = await fetch(`/api/tenant-data/${tenantId}/customers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ data: updatedList }),
      });

      if (!res.ok) throw new Error('Save failed');

      toast.success('Customer updated successfully.');
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400';

  const fields: Array<{
    name: keyof typeof form;
    label: string;
    placeholder: string;
    type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  }> = [
    { name: 'name', label: 'Full Name', placeholder: 'e.g. Amir Hossain', type: 'text' },
    { name: 'phone', label: 'Phone', placeholder: '+880 1XXXXXXXXX', type: 'tel' },
    { name: 'email', label: 'Email', placeholder: 'user@example.com', type: 'email' },
    { name: 'company', label: 'Company', placeholder: 'Company name (optional)', type: 'text' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between z-10">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Edit Customer</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={saving}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {fields.map(({ name, label, placeholder, type }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
              <input
                type={type ?? 'text'}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Delivery address (optional)"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerEditModal;
