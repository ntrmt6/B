import React, { useState, useEffect, useRef } from 'react';
import {
  Image, Plus, Trash2, Edit2, Save, X, Loader2, RefreshCw,
  ExternalLink, GripVertical, Eye, EyeOff, Upload, Link
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeader } from '../../services/authService';
import { getApiUrl } from '../../utils/appHelpers';

// API URL helper
const API_URL = getApiUrl();

// Resolve image URLs - relative paths need the API base URL prefix
const resolveImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Strip /api suffix to get base URL, then append relative path
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Ad {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  title?: string;
  active: boolean;
  createdAt: string;
}

const AdsManagementTab: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', linkUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch ads
  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/tenant-data/global/billing_ads`);
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setAds(data.data);
      } else {
        setAds([]);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load ads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Save ads to backend
  const saveAds = async (newAds: Ad[]) => {
    setIsSaving(true);
    try {
      const authHeader = getAuthHeader() as Record<string, string>;
      const response = await fetch(`${API_URL}/tenant-data/global/billing_ads`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader['Authorization'] || ''
        },
        body: JSON.stringify({ data: newAds })
      });

      if (!response.ok) throw new Error('Failed to save');
      setAds(newAds);
      toast.success('Ads saved successfully');
    } catch (error) {
      console.error('Error saving ads:', error);
      toast.error('Failed to save ads');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', 'global');
      formData.append('folder', 'ads');

      const authHeader = getAuthHeader() as Record<string, string>;
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader['Authorization'] || ''
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      
      const newAd: Ad = {
        id: `ad_${Date.now()}`,
        imageUrl: data.imageUrl,
        title: '',
        linkUrl: '',
        active: true,
        createdAt: new Date().toISOString()
      };

      const newAds = [...ads, newAd];
      await saveAds(newAds);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle ad active status
  const toggleActive = async (id: string) => {
    const newAds = ads.map(ad => 
      ad.id === id ? { ...ad, active: !ad.active } : ad
    );
    await saveAds(newAds);
  };

  // Delete ad
  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    const newAds = ads.filter(ad => ad.id !== id);
    await saveAds(newAds);
  };

  // Start editing
  const startEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setEditForm({ title: ad.title || '', linkUrl: ad.linkUrl || '' });
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingId) return;
    const newAds = ads.map(ad => 
      ad.id === editingId ? { ...ad, title: editForm.title, linkUrl: editForm.linkUrl } : ad
    );
    await saveAds(newAds);
    setEditingId(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', linkUrl: '' });
  };

  // Move ad up/down
  const moveAd = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ads.length) return;
    
    const newAds = [...ads];
    [newAds[index], newAds[newIndex]] = [newAds[newIndex], newAds[index]];
    await saveAds(newAds);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Image className="w-7 h-7 text-teal-600" />
            Billing Page Ads
          </h2>
          <p className="text-gray-500 mt-1">Manage ads shown on tenant billing pages</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAds}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add New Ad
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{ads.length}</div>
          <div className="text-sm text-gray-500">Total Ads</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {ads.filter(a => a.active).length}
          </div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-700">
            {ads.filter(a => !a.active).length}
          </div>
          <div className="text-sm text-gray-500">Inactive</div>
        </div>
      </div>

      {/* Ads List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {ads.length === 0 ? (
          <div className="p-12 text-center">
            <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ads yet</h3>
            <p className="text-gray-500 mb-4">Upload your first ad image to get started</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {ads.map((ad, index) => (
              <div
                key={ad.id}
                className={`p-4 flex items-center gap-4 ${!ad.active ? 'bg-gray-50 opacity-60' : ''}`}
              >
                {/* Drag Handle & Order */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => moveAd(index, 'up')}
                    disabled={index === 0 || isSaving}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <button
                    onClick={() => moveAd(index, 'down')}
                    disabled={index === ads.length - 1 || isSaving}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {/* Image Preview */}
                <div className="w-48 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={resolveImageUrl(ad.imageUrl)}
                    alt={ad.title || 'Ad'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editingId === ad.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Ad title (optional)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={editForm.linkUrl}
                          onChange={(e) => setEditForm({ ...editForm, linkUrl: e.target.value })}
                          placeholder="Link URL (optional)"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-medium text-gray-900">
                        {ad.title || `Ad #${index + 1}`}
                      </h4>
                      {ad.linkUrl && (
                        <a
                          href={ad.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {ad.linkUrl.substring(0, 40)}...
                        </a>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Added: {new Date(ad.createdAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {editingId === ad.id ? (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={isSaving}
                        className="p-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleActive(ad.id)}
                        disabled={isSaving}
                        className={`p-2 rounded-lg ${
                          ad.active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={ad.active ? 'Hide ad' : 'Show ad'}
                      >
                        {ad.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => startEdit(ad)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteAd(ad.id)}
                        disabled={isSaving}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Section */}
      {ads.filter(a => a.active).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview (Active Ads)</h3>
          <div 
            className="rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #ff6a00 0%, #ff9f1c 100%)',
              height: '200px',
              position: 'relative'
            }}
          >
            <img
              src={resolveImageUrl(ads.filter(a => a.active)[0]?.imageUrl)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {ads.filter(a => a.active).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsManagementTab;
