import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';
import { CreateDueTransactionPayload, TransactionDirection, EntityType, DueEntity } from '../types';
import { dueListService } from '../services/DueListService';

interface AddNewDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDueTransactionPayload) => Promise<void>;
  defaultEntity?: DueEntity | null;
}

const ENTITY_TYPES_FOR_DIRECTION: Record<TransactionDirection, EntityType[]> = {
  INCOME: ['Customer', 'Employee'],
  EXPENSE: ['Supplier', 'Employee'],
};

const AddNewDueModal: React.FC<AddNewDueModalProps> = ({ isOpen, onClose, onSave, defaultEntity }) => {
  const [direction, setDirection] = useState<TransactionDirection | null>(null);
  const [entityType, setEntityType] = useState<EntityType>('Customer');
  const [entities, setEntities] = useState<DueEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<DueEntity | null>(null);
  const [searchEntity, setSearchEntity] = useState('');
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityData, setNewEntityData] = useState({ name: '', phone: '' });
  const [formData, setFormData] = useState({
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    collectionDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pre-select entity when provided
  useEffect(() => {
    if (defaultEntity) {
      setSelectedEntity(defaultEntity);
      setEntityType((defaultEntity.type as EntityType) || 'Customer');
    }
  }, [defaultEntity, isOpen]);

  useEffect(() => {
    if (direction && !defaultEntity) {
      const defaultType = direction === 'INCOME' ? 'Customer' : 'Supplier';
      setEntityType(defaultType);
      setSelectedEntity(null);
      setEntities([]);
    }
  }, [direction]);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const data = await dueListService.getEntities(entityType);
        setEntities(data);
      } catch (error) {
        console.error('Error fetching entities:', error);
      }
    };
    if (direction && !defaultEntity) fetchEntities();
  }, [entityType, direction, defaultEntity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEntityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    if (isSaving) return;
    setDirection(null);
    setSelectedEntity(null);
    setEntities([]);
    setSearchEntity('');
    setShowEntityDropdown(false);
    setShowAddEntity(false);
    setNewEntityData({ name: '', phone: '' });
    setFormData({ amount: '', dueDate: new Date().toISOString().split('T')[0], collectionDate: '', notes: '' });
    setErrors({});
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleAddEntity = async () => {
    if (!newEntityData.name || !newEntityData.phone) {
      setErrors({ entity: 'Please fill in name and phone' });
      return;
    }
    try {
      const newEntity = await dueListService.createEntity({
        name: newEntityData.name,
        phone: newEntityData.phone,
        type: entityType,
      });
      setEntities([...entities, newEntity]);
      setSelectedEntity(newEntity);
      setNewEntityData({ name: '', phone: '' });
      setShowAddEntity(false);
      setErrors({});
    } catch (error) {
      setErrors({ entity: 'Error creating entity: ' + (error as any).message });
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!direction) newErrors.direction = 'Please select transaction type';
    if (!selectedEntity) newErrors.entity = 'Please select a person';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!formData.dueDate) newErrors.date = 'Please select a date';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: CreateDueTransactionPayload = {
      entityId: selectedEntity!._id || '',
      entityName: selectedEntity!.name,
      amount: parseFloat(formData.amount),
      direction: direction!,
      transactionDate: formData.dueDate,
      dueDate: formData.collectionDate || undefined,
      notes: formData.notes || undefined,
    };

    setIsSaving(true);
    try {
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEntities = entities.filter(e =>
    e.name.toLowerCase().includes(searchEntity.toLowerCase()) ||
    e.phone.includes(searchEntity)
  );

  // When a defaultEntity is provided: skip entity-picker, go straight to direction + form
  const hasPreselectedEntity = !!defaultEntity;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white text-gray-900 rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[96vh] overflow-y-auto">

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-4 pb-4 flex items-center justify-between border-b border-gray-100 z-10">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900 font-['Roboto']">Add Due</h2>
            {hasPreselectedEntity && (
              <p className="text-[12px] text-blue-600 font-semibold mt-0.5">For: {defaultEntity!.name}</p>
            )}
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-8 space-y-5">

          {/* ── DIRECTION SELECTOR (always shown first) ── */}
          {!direction ? (
            <div className="space-y-3">
              {hasPreselectedEntity && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl mb-2">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                    {defaultEntity!.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{defaultEntity!.name}</p>
                    <p className="text-[12px] text-slate-400">{defaultEntity!.phone}</p>
                  </div>
                </div>
              )}

              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">What type of due?</p>

              <button
                onClick={() => setDirection('INCOME')}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl active:border-[#008c09] active:bg-green-50 transition text-left flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} className="text-[#008c09]" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-[15px]">You Will Get</p>
                  <p className="text-[13px] text-gray-500">
                    {hasPreselectedEntity ? `${defaultEntity!.name} owes you money` : 'Someone owes you money'}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setDirection('EXPENSE')}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl active:border-[#da0000] active:bg-red-50 transition text-left flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <TrendingDown size={20} className="text-[#da0000]" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-[15px]">You Will Give</p>
                  <p className="text-[13px] text-gray-500">
                    {hasPreselectedEntity ? `You owe ${defaultEntity!.name} money` : 'You owe someone money'}
                  </p>
                </div>
              </button>

              {errors.direction && <p className="text-[12px] text-red-600">{errors.direction}</p>}
            </div>
          ) : (
            <>
              {/* Direction indicator */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${direction === 'INCOME' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {direction === 'INCOME'
                    ? <TrendingUp size={16} className="text-[#008c09]" />
                    : <TrendingDown size={16} className="text-[#da0000]" />
                  }
                  <span className={`text-[14px] font-bold ${direction === 'INCOME' ? 'text-[#008c09]' : 'text-[#da0000]'}`}>
                    You Will {direction === 'INCOME' ? 'Get' : 'Give'}
                  </span>
                </div>
                <button
                  onClick={() => { setDirection(null); if (!hasPreselectedEntity) setSelectedEntity(null); setErrors({}); }}
                  className="text-[13px] text-blue-600 font-semibold"
                >
                  Change
                </button>
              </div>

              {/* Pre-selected entity display */}
              {hasPreselectedEntity ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                    {defaultEntity!.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{defaultEntity!.name}</p>
                    <p className="text-[12px] text-slate-400">{defaultEntity!.phone}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Entity Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-500">Person Type</label>
                    <div className="flex gap-2">
                      {ENTITY_TYPES_FOR_DIRECTION[direction].map(type => (
                        <button
                          key={type}
                          onClick={() => { setEntityType(type); setSelectedEntity(null); setSearchEntity(''); }}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-[14px] font-semibold transition ${
                            entityType === type
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-500'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Entity dropdown */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-500">{entityType}</label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowEntityDropdown(!showEntityDropdown)}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-left bg-white flex items-center justify-between gap-2 focus:border-blue-400 transition"
                      >
                        <span className={selectedEntity ? 'text-gray-900 font-semibold text-[14px]' : 'text-gray-400 text-[14px]'}>
                          {selectedEntity ? selectedEntity.name : `Select ${entityType}…`}
                        </span>
                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                      </button>

                      {showEntityDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                          <div className="p-2 border-b border-gray-100">
                            <input
                              type="text"
                              placeholder="Search by name or phone…"
                              value={searchEntity}
                              onChange={e => setSearchEntity(e.target.value)}
                              className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 rounded-xl text-[14px] outline-none border border-gray-200 focus:border-blue-400"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-52 overflow-y-auto">
                            {filteredEntities.length === 0 ? (
                              <div className="p-4 text-center text-gray-400 text-[13px]">No {entityType.toLowerCase()}s found</div>
                            ) : (
                              filteredEntities.map(entity => (
                                <button
                                  key={entity._id}
                                  onClick={() => { setSelectedEntity(entity); setShowEntityDropdown(false); setSearchEntity(''); }}
                                  className="w-full px-4 py-3 text-left active:bg-blue-50 transition border-b border-gray-50 last:border-0"
                                >
                                  <p className="font-semibold text-gray-900 text-[14px]">{entity.name}</p>
                                  <p className="text-[12px] text-gray-400">{entity.phone}</p>
                                </button>
                              ))
                            )}
                          </div>
                          <button
                            onClick={() => { setShowAddEntity(true); setShowEntityDropdown(false); }}
                            className="w-full px-4 py-3 text-blue-600 font-bold text-[14px] active:bg-blue-50 transition border-t border-gray-100 flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> Add New {entityType}
                          </button>
                        </div>
                      )}
                    </div>
                    {errors.entity && <p className="text-[12px] text-red-600">{errors.entity}</p>}
                  </div>

                  {/* Add New Entity inline form */}
                  {showAddEntity && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <p className="text-[13px] font-bold text-blue-700">New {entityType}</p>
                      <input
                        type="text"
                        placeholder="Full name *"
                        value={newEntityData.name}
                        onChange={e => setNewEntityData({ ...newEntityData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-blue-400 bg-white"
                      />
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="Phone number *"
                        value={newEntityData.phone}
                        onChange={e => setNewEntityData({ ...newEntityData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-blue-400 bg-white"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleAddEntity} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[14px] font-bold">Add</button>
                        <button onClick={() => { setShowAddEntity(false); setNewEntityData({ name: '', phone: '' }); }} className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-[14px] font-bold">Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-500">Amount (৳)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[20px] font-bold tabular-nums text-gray-900 outline-none focus:border-blue-400 transition bg-white"
                  autoFocus={hasPreselectedEntity && !!direction}
                />
                {errors.amount && <p className="text-[12px] text-red-600">{errors.amount}</p>}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-500">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-blue-400 transition bg-white"
                />
                {errors.date && <p className="text-[12px] text-red-600">{errors.date}</p>}
              </div>

              {/* Collection Date */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-500">Collection Date <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="date"
                  value={formData.collectionDate}
                  onChange={e => setFormData({ ...formData, collectionDate: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-blue-400 transition bg-white"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-500">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Invoice #101 for 5kg coffee beans"
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-blue-400 resize-none h-20 transition bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-[14px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!selectedEntity || !formData.amount || isSaving}
                  className={`flex-1 py-3.5 text-white font-bold rounded-xl text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 ${
                    direction === 'INCOME'
                      ? 'bg-gradient-to-r from-[#008c09] to-[#00a80b]'
                      : 'bg-gradient-to-r from-[#da0000] to-[#ff2020]'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : 'Save Due'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewDueModal;
