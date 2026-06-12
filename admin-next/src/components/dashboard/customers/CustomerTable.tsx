import React from 'react';
import { Search, ChevronDown, ArrowUpDown, MoreVertical, CheckCircle, Eye, Edit } from 'lucide-react';
import { CustomerInfo } from './types';

interface CustomerTableProps {
  customers: CustomerInfo[];
  selectedCustomers: string[];
  customerSearch: string;
  customerSortBy: string;
  customerActionDropdown: string | null;
  onSearchChange: (q: string) => void;
  onSortChange: (s: string) => void;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onView: (c: CustomerInfo) => void;
  onEdit: (c: CustomerInfo) => void;
  onToggleDropdown: (id: string) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedCustomers,
  customerSearch,
  customerSortBy,
  customerActionDropdown,
  onSearchChange,
  onSortChange,
  onSelectAll,
  onSelectOne,
  onView,
  onEdit,
  onToggleDropdown,
}) => {
  return (
    <div className="w-full xl:flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md bg-[#F1F5F9] rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Customers"
            className="block w-full pl-9 pr-16 py-2 bg-transparent border-none text-sm text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-xs font-medium text-gray-500">Search</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-500 text-sm">Sort by</span>
          <div className="relative">
            <select
              value={customerSortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-[#F1F5F9] text-gray-700 text-sm font-medium py-1.5 pl-3 pr-8 rounded-md focus:outline-none cursor-pointer"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>Name</option>
              <option>Most Orders</option>
              <option>Highest Spent</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>
          <button className="p-1.5 bg-[#F1F5F9] rounded-md hover:bg-gray-200 transition">
            <ArrowUpDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#E0F2FE]">
            <tr>
              <th className="p-4 w-12">
                <div
                  className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${
                    selectedCustomers.length === customers.length && customers.length > 0
                      ? 'bg-[#0095FF] border-[#0095FF]'
                      : 'border-gray-400 bg-transparent'
                  }`}
                  onClick={onSelectAll}
                >
                  {selectedCustomers.length === customers.length && customers.length > 0 && (
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </th>
              <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Sl</th>
              <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Image</th>
              <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Name</th>
              <th className="py-4 px-2 text-gray-900 font-semibold text-sm">Contact</th>
              <th className="py-4 px-2 text-gray-900 font-semibold text-sm text-center">Status</th>
              <th className="py-4 px-2 text-gray-900 font-semibold text-sm text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer, i) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div
                      className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${
                        selectedCustomers.includes(customer.id)
                          ? 'bg-[#0095FF] border-[#0095FF]'
                          : 'border-gray-400 bg-transparent'
                      }`}
                      onClick={() => onSelectOne(customer.id)}
                    >
                      {selectedCustomers.includes(customer.id) && (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-600">{customers.length - i}</td>
                  <td className="py-4 px-2">
                    <img
                      src={customer.avatar || 'https://hdnfltv.com/image/nitimages/pasted_1770973977439.webp'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                    />
                  </td>
                  <td className="py-4 px-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      {customer.company && <p className="text-xs text-gray-400">{customer.company}</p>}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-900">{customer.phone}</span>
                      <span className="text-gray-500 text-xs">{customer.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === 'Active'
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : 'bg-[#FEE2E2] text-[#991B1B]'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-center relative">
                    <button
                      onClick={() => onToggleDropdown(customer.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {customerActionDropdown === customer.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                        <button
                          onClick={() => onView(customer)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button
                          onClick={() => onEdit(customer)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 p-2 xs:p-3 sm:p-4">
        {customers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">No customers found</div>
        ) : (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 sm:p-4 shadow-sm flex items-start gap-3 active:scale-[0.99] transition-transform"
            >
              <div
                className={`mt-1 w-5 h-5 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 ${
                  selectedCustomers.includes(customer.id)
                    ? 'bg-[#0095FF] border-[#0095FF]'
                    : 'border-gray-400 bg-transparent'
                }`}
                onClick={() => onSelectOne(customer.id)}
              >
                {selectedCustomers.includes(customer.id) && (
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <img
                src={customer.avatar || 'https://hdnfltv.com/image/nitimages/pasted_1770973977439.webp'}
                alt=""
                className="w-12 h-12 rounded-lg object-cover bg-gray-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{customer.name}</h4>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                    {customer.email && <p className="text-xs text-gray-400 truncate">{customer.email}</p>}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => onToggleDropdown(customer.id)}
                      className="text-gray-400 p-1 hover:bg-gray-100 rounded-full"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {customerActionDropdown === customer.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                        <button
                          onClick={() => onView(customer)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button
                          onClick={() => onEdit(customer)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.status === 'Active'
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-[#FEE2E2] text-[#991B1B]'
                    }`}
                  >
                    {customer.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerTable;
