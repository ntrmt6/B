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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-4 sm:p-6 pb-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Add {formData.type}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <div className="flex gap-2">
              {(['Customer', 'Supplier', 'Employee'] as EntityType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                    formData.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Address (optional)</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white rounded-lg font-medium disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : `Add ${formData.type}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEntityModal;
