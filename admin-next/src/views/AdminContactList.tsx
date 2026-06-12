import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, RefreshCw, Edit2, Trash2, ChevronRight, X, User, Phone, Mail, MapPin, Loader2, MoreVertical, Eye } from 'lucide-react';
import { DueEntity, DueTransaction, EntityType } from '../types';
import { dueListService } from '../services/DueListService';
import toast from 'react-hot-toast';

interface AdminContactListProps {
  tenantId?: string;
}

const AdminContactList: React.FC<AdminContactListProps> = ({ tenantId }) => {
  // Set tenant ID in service when component mounts or tenantId changes
  useEffect(() => {
    if (tenantId) {
      dueListService.setTenantId(tenantId);
    }
  }, [tenantId]);
  const [activeTab, setActiveTab] = useState<EntityType>('Customer');
  const [entities, setEntities] = useState<DueEntity[]>([]);
  const [transactions, setTransactions] = useState<DueTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<DueEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<DueEntity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'Customer' as EntityType
  });
  const [isSaving, setIsSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count entities by type
  const entityCounts = {
    Customer: entities.filter(e => e.type === 'Customer').length,
    Supplier: entities.filter(e => e.type === 'Supplier').length,
    Employee: entities.filter(e => e.type === 'Employee').length,
  };

  // Fetch entities
  const fetchEntities = async () => {
    setLoading(true);
    try {
      const data = await dueListService.getEntities(activeTab, searchQuery);
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all entities for counts
  const fetchAllEntities = async () => {
    try {
      const data = await dueListService.getEntities();
      // Update counts based on all entities
      const counts = {
        Customer: data.filter((e: DueEntity) => e.type === 'Customer').length,
        Supplier: data.filter((e: DueEntity) => e.type === 'Supplier').length,
        Employee: data.filter((e: DueEntity) => e.type === 'Employee').length,
      };
      // Filter for active tab
      setEntities(data.filter((e: DueEntity) => e.type === activeTab));
    } catch (error) {
      console.error('Error fetching all entities:', error);
    }
  };

  // Fetch transactions for selected entity
  const fetchTransactions = async () => {
    if (!selectedEntity?._id) {
      setTransactions([]);
      return;
    }
    setTransactionLoading(true);
    try {
      const data = await dueListService.getTransactions(selectedEntity._id);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
    setSelectedEntity(null);
    setTransactions([]);
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => fetchEntities(), 300);
      return () => clearTimeout(timer);
    } else {
      fetchEntities();
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [selectedEntity]);

  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone.includes(searchQuery)
  );

  const handleAddNew = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      type: activeTab
    });
    setShowAddModal(true);
  };

  const handleEdit = (entity: DueEntity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      phone: entity.phone,
      email: entity.email || '',
      address: entity.address || '',
      type: entity.type
    });
    setShowEditModal(true);
  };

  const handleDelete = async (entity: DueEntity) => {
    if (!entity._id) return;
    
    if (!window.confirm(`Are you sure you want to delete ${entity.name}?`)) {
      return;
    }

    try {
      await dueListService.deleteEntity(entity._id);
      toast.success('Contact deleted successfully');
      fetchEntities();
      if (selectedEntity?._id === entity._id) {
        setSelectedEntity(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  const handleSaveNew = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    setIsSaving(true);
    try {
      await dueListService.createEntity({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        type: formData.type
      });
      toast.success('Contact added successfully');
      setShowAddModal(false);
      fetchEntities();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntity?._id || !formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    setIsSaving(true);
    try {
      await dueListService.updateEntity(editingEntity._id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        type: formData.type
      });
      toast.success('Contact updated successfully');
      setShowEditModal(false);
      setEditingEntity(null);
      fetchEntities();
      if (selectedEntity?._id === editingEntity._id) {
        setSelectedEntity({ ...selectedEntity, ...formData });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update contact');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('0')) {
      return `+88 ${phone}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Contact List</h1>
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Add New Member</span><span className="xs:hidden">Add</span>
          </button>
        </div>
      </header>

      <div className="p-2 sm:p-3 md:p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6">
          {/* Left Sidebar - Entity List */}
          <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden max-h-[500px] lg:max-h-[calc(100vh-180px)]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(['Customer', 'Supplier', 'Employee'] as EntityType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition relative ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  <sup className="ml-1 text-xs sm:text-xs text-gray-400">
                    ({tab === 'Customer' ? entityCounts.Customer : tab === 'Supplier' ? entityCounts.Supplier : entityCounts.Employee})
                  </sup>
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="p-2 sm:p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-7 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 md:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                />
                <button
                  onClick={() => { setSearchQuery(''); fetchEntities(); }}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Entity List - Desktop */}
            <div className="flex-1 overflow-y-auto hidden sm:block">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
                  <User size={24} className="mb-2 text-gray-300" />
                  No {activeTab.toLowerCase()}s found
                </div>
              ) : (
                filteredEntities.map(entity => (
                  <button
                    key={entity._id}
                    onClick={() => setSelectedEntity(entity)}
                    className={`w-full p-4 border-b border-gray-100 text-left transition flex items-center justify-between group ${
                      selectedEntity?._id === entity._id
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                        {entity.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{entity.name}</div>
                        {entity.address && (
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">{entity.address}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{formatPhone(entity.phone)}</span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Entity List - Mobile Cards */}
            <div className="flex-1 overflow-y-auto block sm:hidden p-2 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
                  <User size={24} className="mb-2 text-gray-300" />
                  No {activeTab.toLowerCase()}s found
                </div>
              ) : (
                filteredEntities.map(entity => (
                  <div
                    key={entity._id}
                    className={`bg-white dark:bg-gray-800 rounded-lg border p-3 transition ${
                      selectedEntity?._id === entity._id
                        ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => setSelectedEntity(entity)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                          {entity.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{entity.name}</div>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Phone size={12} />
                              <span className="truncate">{formatPhone(entity.phone)}</span>
                            </div>
                            {entity.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Mail size={12} />
                                <span className="truncate">{entity.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative" ref={mobileMenuOpen === entity._id ? mobileMenuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(mobileMenuOpen === entity._id ? null : entity._id || null);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                          <MoreVertical size={18} className="text-gray-500 dark:text-gray-400" />
                        </button>
                        {mobileMenuOpen === entity._id && (
                          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntity(entity);
                                setMobileMenuOpen(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(entity);
                                setMobileMenuOpen(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {entity.address && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          <MapPin size={12} className="inline mr-1" />
                          {entity.address}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Button at Bottom */}
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleAddNew}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                {activeTab} Add
              </button>
            </div>
          </div>

          {/* Right Panel - Entity Details */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            {!selectedEntity ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <User size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Select a contact to view details</p>
                </div>
              </div>
            ) : (
              <>
                {/* Entity Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                      {selectedEntity.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{selectedEntity.name}</h2>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{selectedEntity.type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone size={14} /> {formatPhone(selectedEntity.phone)}
                        </span>
                        {selectedEntity.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={14} /> {selectedEntity.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(selectedEntity)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEntity)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                    <button
                      onClick={() => fetchTransactions()}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <RefreshCw size={16} /> Refresh
                    </button>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Type</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Buy Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactionLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                            You have no transactions
                          </td>
                        </tr>
                      ) : (
                        transactions.map(tx => (
                          <tr key={tx._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{tx._id?.slice(-8)}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(tx.transactionDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{tx.notes || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{tx.items || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{tx.transactionType || tx.direction}</td>
                            <td className="px-6 py-4 text-sm text-right font-medium">
                              <span className={tx.direction === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                ৳{tx.amount.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {showAddModal ? `Add New ${formData.type}` : `Edit ${editingEntity?.name}`}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingEntity(null); }}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as EntityType })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Customer">Customer</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 to p-3 text-gray-400" size={18} />
                  <textarea
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingEntity(null); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleSaveNew : handleSaveEdit}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {showAddModal ? 'Add Contact' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactList;
