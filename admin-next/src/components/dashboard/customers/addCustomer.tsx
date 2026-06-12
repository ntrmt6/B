import React, { useState, useEffect } from 'react';
import {
  UserPlus, Mail, Phone, Building2, MapPin, X, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CustomerInfo } from './types';
import { getAuthHeader } from '../../../services/authService';

interface AddCustomerProps {
  tenantId: string;
  onCustomerAdded?: (customer: CustomerInfo) => void;
}

const AddCustomer: React.FC<AddCustomerProps> = ({ tenantId, onCustomerAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    status: 'Active' as 'Active' | 'Blocked',
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const reset = () => {
    setForm({ firstName: '', lastName: '', phone: '', email: '', company: '', address: '', status: 'Active' });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleClose = () => { if (!saving) { setIsOpen(false); reset(); } };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const nameParts = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ');
    if (!nameParts) { setErrorMsg('First name is required.'); return; }
    if (!form.phone.trim()) { setErrorMsg('Phone number is required.'); return; }

    setSaving(true);
    try {
      // 1. Fetch existing manually-added customers
      const getRes = await fetch(`/api/tenant-data/${tenantId}/customers`, {
        headers: getAuthHeader() as Record<string, string>,
      });
      const existing: CustomerInfo[] = getRes.ok
        ? ((await getRes.json()) as { data?: CustomerInfo[] }).data ?? []
        : [];

      // 2. Build new customer record
      const newCustomer: CustomerInfo = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: nameParts,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        company: form.company.trim() || undefined,
        address: form.address.trim() || undefined,
        status: form.status,
        totalOrders: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        firstOrderDate: new Date().toISOString(),
        lastOrderDate: new Date().toISOString(),
        orders: [],
        serialNumber: existing.length + 1,
        isManual: true,
      };

      // 3. Persist the updated list
      const putRes = await fetch(`/api/tenant-data/${tenantId}/customers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ data: [...existing, newCustomer] }),
      });

      if (!putRes.ok) throw new Error(`Save failed (${putRes.status})`);

      toast.success('Customer added successfully.');
      setSuccessMsg(`${nameParts} has been added.`);
      onCustomerAdded?.(newCustomer);

      setTimeout(() => { setIsOpen(false); reset(); }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(`Failed to save customer: ${msg}`);
      toast.error('Failed to add customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 disabled:opacity-60';

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
      >
        <UserPlus size={16} />
        Add Customer
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-blue-600 text-white px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <UserPlus size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wide">Add New Customer</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={saving}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Status messages */}
              {successMsg && (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                  <CheckCircle2 size={16} />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="First"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Last"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+880 1XXXXXXXXX"
                    disabled={saving}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                    disabled={saving}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    name="company"
                    type="text"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Business name (optional)"
                    disabled={saving}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Delivery address (optional)"
                    rows={2}
                    disabled={saving}
                    className={`${inputClass} pl-10 resize-none`}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={saving}
                  className={inputClass}
                >
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {saving ? 'Saving…' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddCustomer;