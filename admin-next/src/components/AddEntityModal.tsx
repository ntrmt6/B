import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EntityType, CreateEntityPayload, DueEntity } from '../types';
import { dueListService } from '../services/DueListService';

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: DueEntity) => void;
  defaultType?: EntityType;
}

const AddEntityModal: React.FC<AddEntityModalProps> = ({ isOpen, onClose, onSave, defaultType = 'Customer' }) => {
  const [formData, setFormData] = useState<CreateEntityPayload>({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: defaultType,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      const payload: CreateEntityPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        type: formData.type,
        ...(formData.email?.trim() && { email: formData.email.trim() }),
        ...(formData.address?.trim() && { address: formData.address.trim() }),
      };
      const entity = await dueListService.createEntity(payload);
      onSave(entity);
      setFormData({ name: '', phone: '', email: '', address: '', type: defaultType });
      setErrors({});
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to create' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', phone: '', email: '', address: '', type: defaultType });
    setErrors({});
    onClose();
  };

  return (
    /* Bottom sheet on mobile, centered dialog on sm+ */
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-[17px] font-bold text-gray-900 font-['Roboto']">Add {formData.type}</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-8 space-y-5">

          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-gray-500">Type</label>
            <div className="flex gap-2">
              {(['Customer', 'Supplier', 'Employee'] as EntityType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-[13px] font-bold transition ${
                    formData.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-500">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-400 transition bg-white"
            />
            {errors.name && <p className="text-[12px] text-red-600">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-500">Phone <span className="text-red-500">*</span></label>
            <input
              type="tel"
              inputMode="tel"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-400 transition bg-white"
            />
            {errors.phone && <p className="text-[12px] text-red-600">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-500">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="email"
              inputMode="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-400 transition bg-white"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-500">Address <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Street address"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-400 transition bg-white"
            />
          </div>

          {errors.submit && <p className="text-[13px] text-red-600 text-center">{errors.submit}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-[14px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3.5 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white rounded-xl font-bold text-[14px] disabled:opacity-50 transition"
            >
              {loading ? 'Saving…' : `Add ${formData.type}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEntityModal;
