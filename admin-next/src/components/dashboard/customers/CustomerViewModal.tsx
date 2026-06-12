import React from 'react';
import {
  X, Phone, Mail, ShoppingBag, Calendar, MapPin, Building2,
} from 'lucide-react';
import { CustomerInfo } from './types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: CustomerInfo['status']): { bg: string; text: string; label: string } {
  switch (status) {
    case 'Blocked': return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Blocked' };
    default: return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' };
  }
}

interface CustomerViewModalProps {
  customer: CustomerInfo | null;
  onClose: () => void;
}

const CustomerViewModal: React.FC<CustomerViewModalProps> = ({ customer, onClose }) => {
  if (!customer) return null;

  const statusStyle = getStatusBadge(customer.status);
  const initials = customer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const stats = [
    { icon: ShoppingBag, label: 'Total Orders', value: customer.totalOrders.toString() },
    { icon: ShoppingBag, label: 'Total Spent', value: formatCurrency(customer.totalSpent) },
    { icon: Calendar, label: 'First Order', value: formatDate(customer.firstOrderDate) },
    { icon: Calendar, label: 'Last Order', value: formatDate(customer.lastOrderDate) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner + Avatar */}
        <div className="relative">
          <div className="h-28 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-t-2xl" />
          <div className="absolute -bottom-8 left-5">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-xl font-extrabold text-blue-600">{initials}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
          >
            <X size={17} className="text-white" />
          </button>
        </div>

        {/* Name + Status */}
        <div className="px-5 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900 truncate">{customer.name}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
          </div>
          {customer.company && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Building2 size={14} />
              <span>{customer.company}</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="px-5 pb-4 space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</h4>
          {customer.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Phone size={15} className="text-blue-600" />
              </div>
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Mail size={15} className="text-purple-600" />
              </div>
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mt-0.5">
                <MapPin size={15} className="text-green-600" />
              </div>
              <span className="leading-relaxed">{customer.address}</span>
            </div>
          )}
        </div>

        {/* Order Stats Grid */}
        <div className="mx-5 mb-5 grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewModal;
