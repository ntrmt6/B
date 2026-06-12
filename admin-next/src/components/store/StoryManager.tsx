import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, GripVertical, Play, Eye, EyeOff, Save, X, Upload } from 'lucide-react';
import type { VideoStory } from '../../types';
import { getYouTubeId, getYouTubeThumbnail } from '../../utils/videoUrlHelper';
import toast from 'react-hot-toast';
import { IKContext, IKUpload } from 'imagekitio-react';

/** Shape of the ImageKit upload success response (subset we use). */
interface IKUploadResponse {
  url: string;
  fileId: string;
  name: string;
  filePath: string;
  thumbnailUrl?: string;
}

interface StoryManagerProps {
  tenantId: string;
  products?: { id: number; name: string; image: string }[];
}

const getApiUrl = () => {
  return (
    (typeof window !== 'undefined' && (window as any).__apiBase) ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ''
  );
};

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }
  // Use the same token key as the admin auth system ('admin_auth_token')
  const token =
    localStorage.getItem('admin_auth_token') ||
    sessionStorage.getItem('admin_auth_token') ||
    null;
  const tenantId = localStorage.getItem('tenantId') || null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
  };
};

/* ─── ImageKit configuration ─── */
const IK_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '';
const IK_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';
const isImageKitConfigured = () => Boolean(IK_PUBLIC_KEY && IK_URL_ENDPOINT);

/** Fetches authentication parameters from the backend for ImageKit client-side uploads. */
const imagekitAuthenticator = async () => {
  const apiBase = getApiUrl();
  const res = await fetch(`${apiBase}/api/v1/upload-auth`);
  if (!res.ok) throw new Error('ImageKit auth failed');
  const data = await res.json();
  return { signature: data.signature, expire: data.expire, token: data.token };
};

const emptyForm: Omit<VideoStory, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  videoUrl: '',
  thumbnailUrl: '',
  productId: undefined,
  duration: 30,
  order: 0,
  active: true,
};

/** Admin dashboard component for managing Video Stories. */
export const StoryManager: React.FC<StoryManagerProps> = ({ tenantId, products = [] }) => {
  const [stories, setStories] = useState<VideoStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStory, setEditingStory] = useState<Partial<VideoStory> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const apiBase = getApiUrl();

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/stories/${tenantId}/all`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch {
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [apiBase, tenantId]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleSave = async (form: Partial<VideoStory>) => {
    try {
      const isNew = !form.id;
      const url = isNew
        ? `${apiBase}/api/stories/${tenantId}`
        : `${apiBase}/api/stories/${tenantId}/${form.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(isNew ? 'Story created!' : 'Story updated!');
        setEditingStory(null);
        setIsCreating(false);
        fetchStories();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save story');
      }
    } catch {
      toast.error('Failed to save story');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this story?')) return;
    try {
      const res = await fetch(`${apiBase}/api/stories/${tenantId}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success('Story deleted');
        fetchStories();
      }
    } catch {
      toast.error('Failed to delete story');
    }
  };

  const toggleActive = async (story: VideoStory) => {
    await handleSave({ id: story.id, active: !story.active });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Video Stories</h3>
          <p className="text-xs text-gray-500 mt-0.5">Instagram-style shoppable video stories for your storefront</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingStory({ ...emptyForm, order: stories.length }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Story
        </button>
      </div>

      {/* Story List */}
      {stories.length === 0 && !isCreating ? (
        <div className="text-center py-12 text-gray-400">
          <Play size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No stories yet</p>
          <p className="text-sm mt-1">Add video stories to engage customers on your storefront</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stories.map(story => (
            <div
              key={story.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group hover:shadow-sm transition-shadow"
            >
              <GripVertical size={16} className="text-gray-300 cursor-grab flex-shrink-0" />

              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {story.thumbnailUrl ? (
                  <img src={story.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={16} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{story.title}</p>
                <p className="text-xs text-gray-400 truncate">{story.videoUrl}</p>
              </div>

              {/* Duration */}
              <span className="text-xs text-gray-400 font-mono flex-shrink-0">{story.duration}s</span>

              {/* Status */}
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                story.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {story.active ? 'Active' : 'Inactive'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => toggleActive(story)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={story.active ? 'Deactivate' : 'Activate'}>
                  {story.active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => { setEditingStory(story); setIsCreating(false); }} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(story.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Form */}
      {editingStory && (
        <StoryForm
          story={editingStory}
          isNew={isCreating}
          products={products}
          onSave={handleSave}
          onCancel={() => { setEditingStory(null); setIsCreating(false); }}
        />
      )}
    </div>
  );
};

/* ──────────────────────── Story Form Modal ──────────────────────── */

interface StoryFormProps {
  story: Partial<VideoStory>;
  isNew: boolean;
  products: { id: number; name: string; image: string }[];
  onSave: (form: Partial<VideoStory>) => void;
  onCancel: () => void;
}

const StoryForm: React.FC<StoryFormProps> = ({ story, isNew, products, onSave, onCancel }) => {
  const [form, setForm] = useState<Partial<VideoStory>>(story);
  const [videoUploading, setVideoUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);

  const update = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  /** Auto-set thumbnail from YouTube URL if thumbnail is empty */
  const handleVideoUrlChange = (url: string) => {
    update('videoUrl', url);
    // Auto-extract YouTube thumbnail when no custom thumbnail is set
    if (!form.thumbnailUrl) {
      const ytId = getYouTubeId(url);
      if (ytId) {
        update('thumbnailUrl', getYouTubeThumbnail(ytId));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-base font-bold text-gray-900 dark:text-white">{isNew ? 'Add Story' : 'Edit Story'}</h4>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Title *</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. New Collection"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Video URL *</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.videoUrl || ''}
                onChange={e => handleVideoUrlChange(e.target.value)}
                placeholder="YouTube, Facebook, Instagram or direct video URL"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
              />
              {isImageKitConfigured() && (
                <IKContext publicKey={IK_PUBLIC_KEY} urlEndpoint={IK_URL_ENDPOINT} authenticator={imagekitAuthenticator}>
                  <label
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      videoUploading
                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <Upload size={14} />
                    {videoUploading ? 'Uploading…' : 'Upload'}
                    <IKUpload
                      fileName="story-video"
                      folder="/stories/videos"
                      accept="video/*"
                      useUniqueFileName={true}
                      style={{ display: 'none' }}
                      onUploadStart={() => setVideoUploading(true)}
                      onSuccess={(res) => {
                        update('videoUrl', (res as IKUploadResponse).url);
                        setVideoUploading(false);
                        toast.success('Video uploaded!');
                      }}
                      onError={() => {
                        setVideoUploading(false);
                        toast.error('Video upload failed');
                      }}
                    />
                  </label>
                </IKContext>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isImageKitConfigured()
                ? 'Paste a URL or upload directly via ImageKit'
                : 'Supports YouTube, Facebook, Instagram reels & direct .mp4 links'}
            </p>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Thumbnail URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.thumbnailUrl || ''}
                onChange={e => update('thumbnailUrl', e.target.value)}
                placeholder="https://cdn.example.com/thumb.jpg"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
              />
              {isImageKitConfigured() && (
                <IKContext publicKey={IK_PUBLIC_KEY} urlEndpoint={IK_URL_ENDPOINT} authenticator={imagekitAuthenticator}>
                  <label
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      thumbUploading
                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <Upload size={14} />
                    {thumbUploading ? 'Uploading…' : 'Upload'}
                    <IKUpload
                      fileName="story-thumb"
                      folder="/stories/thumbnails"
                      accept="image/*"
                      useUniqueFileName={true}
                      style={{ display: 'none' }}
                      onUploadStart={() => setThumbUploading(true)}
                      onSuccess={(res) => {
                        update('thumbnailUrl', (res as IKUploadResponse).url);
                        setThumbUploading(false);
                        toast.success('Thumbnail uploaded!');
                      }}
                      onError={() => {
                        setThumbUploading(false);
                        toast.error('Thumbnail upload failed');
                      }}
                    />
                  </label>
                </IKContext>
              )}
            </div>
          </div>

          {/* Linked Product */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Linked Product</label>
            <select
              value={form.productId || ''}
              onChange={e => update('productId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
            >
              <option value="">None (no product link)</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            {/* Duration */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Duration (sec)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={form.duration || 30}
                onChange={e => update('duration', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Active */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Status</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={e => update('active', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSave(form)}
            disabled={!form.title || !form.videoUrl}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save size={14} /> {isNew ? 'Create Story' : 'Save Changes'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryManager;
