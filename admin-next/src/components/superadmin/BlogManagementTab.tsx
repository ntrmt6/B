import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../../utils/appHelpers';
import { getAuthHeader } from '../../services/authService';
import type { BlogPost, BlogPostFormData } from './types';

interface BlogManagementTabProps {
  // Optional callback when a post is created/updated/deleted
  onPostChange?: () => void;
}

const BlogManagementTab: React.FC<BlogManagementTabProps> = ({ onPostChange }) => {
  // State for posts list
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 10;

  // State for form modal
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    seoTitle: '',
    metaDescription: '',
    featuredImage: '',
    tags: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);

  const API_URL = getApiUrl();

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: postsPerPage.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`${API_URL}/super-admin/blog?${params}`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const result = await response.json();
      setPosts(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalPosts(result.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, currentPage, statusFilter, searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Generate slug from title
  const generateSlug = useCallback(async (title: string) => {
    if (!title.trim()) return;

    setIsGeneratingSlug(true);
    try {
      const response = await fetch(`${API_URL}/super-admin/blog/generate-slug`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({ ...prev, slug: result.data.slug }));
      }
    } catch (error) {
      // Fallback: generate slug client-side
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    } finally {
      setIsGeneratingSlug(false);
    }
  }, [API_URL]);

  // Handle form field changes
  const handleFieldChange = (field: keyof BlogPostFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user types
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      errors.slug = 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }

    if (!formData.excerpt.trim()) {
      errors.excerpt = 'Excerpt is required';
    } else if (formData.excerpt.length > 500) {
      errors.excerpt = 'Excerpt cannot exceed 500 characters';
    }

    if (formData.metaDescription && formData.metaDescription.length > 160) {
      errors.metaDescription = 'Meta description should not exceed 160 characters';
    }

    if (formData.seoTitle && formData.seoTitle.length > 70) {
      errors.seoTitle = 'SEO title should not exceed 70 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      status: 'draft',
      seoTitle: '',
      metaDescription: '',
      featuredImage: '',
      tags: [],
    });
    setFormErrors({});
    setEditingPost(null);
  };

  // Open create form
  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = async (post: BlogPost) => {
    // Fetch full post data including content
    try {
      const response = await fetch(`${API_URL}/super-admin/blog/${post._id}`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post details');
      }

      const result = await response.json();
      const fullPost = result.data;

      setEditingPost(fullPost);
      setFormData({
        title: fullPost.title,
        slug: fullPost.slug,
        content: fullPost.content,
        excerpt: fullPost.excerpt,
        status: fullPost.status,
        seoTitle: fullPost.seoTitle || '',
        metaDescription: fullPost.metaDescription || '',
        featuredImage: fullPost.featuredImage || '',
        tags: fullPost.tags || [],
      });
      setFormErrors({});
      setShowForm(true);
    } catch (error) {
      toast.error('Failed to load post details');
    }
  };

  // Save post (create or update)
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingPost
        ? `${API_URL}/super-admin/blog/${editingPost._id}`
        : `${API_URL}/super-admin/blog`;

      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === 'SLUG_DUPLICATE') {
          setFormErrors({ slug: 'A blog post with this slug already exists' });
          toast.error('Slug already exists');
        } else if (result.details) {
          const errors: Record<string, string> = {};
          result.details.forEach((d: { field: string; message: string }) => {
            errors[d.field] = d.message;
          });
          setFormErrors(errors);
          toast.error('Please fix the form errors');
        } else {
          throw new Error(result.error || 'Failed to save post');
        }
        return;
      }

      toast.success(editingPost ? 'Post updated successfully' : 'Post created successfully');
      setShowForm(false);
      resetForm();
      fetchPosts();
      onPostChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete post
  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(postId);
    try {
      const response = await fetch(`${API_URL}/super-admin/blog/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post deleted successfully');
      fetchPosts();
      onPostChange?.();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(null);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Character counter component
  const CharacterCounter: React.FC<{ current: number; max: number; showWarning?: boolean }> = ({
    current,
    max,
    showWarning = true,
  }) => {
    const isOverLimit = current > max;
    const isNearLimit = current >= max * 0.9;

    return (
      <span
        className={`text-xs ${
          isOverLimit
            ? 'text-red-500 font-medium'
            : isNearLimit && showWarning
            ? 'text-amber-500'
            : 'text-slate-400'
        }`}
      >
        {current}/{max}
        {isOverLimit && ' (exceeds limit)'}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Blog Management</h1>
          <p className="text-slate-500 mt-1">
            Create and manage blog posts for SEO and content marketing
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Create New Post</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Posts</p>
              <p className="text-xl font-bold text-slate-800">{totalPosts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Published</p>
              <p className="text-xl font-bold text-slate-800">
                {posts.filter(p => p.status === 'published').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Drafts</p>
              <p className="text-xl font-bold text-slate-800">
                {posts.filter(p => p.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts by title..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as 'all' | 'draft' | 'published');
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchPosts}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
            <p className="text-slate-500">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No posts match your filters'
                : 'No blog posts yet'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={18} />
                Create Your First Post
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map(post => (
                    <tr key={post._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800 line-clamp-1">{post.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">/{post.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {post.status === 'published' ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {post.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar size={14} />
                          {formatDate(post.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'published' && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Post"
                            >
                              <Eye size={18} />
                            </a>
                          )}
                          <button
                            onClick={() => openEditForm(post)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Post"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(post._id)}
                            disabled={isDeleting === post._id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Post"
                          >
                            {isDeleting === post._id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Page {currentPage} of {totalPages} ({totalPosts} posts)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleFieldChange('title', e.target.value)}
                  onBlur={() => {
                    if (formData.title && !formData.slug) {
                      generateSlug(formData.title);
                    }
                  }}
                  placeholder="Enter post title..."
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                    formErrors.title ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={e =>
                        handleFieldChange(
                          'slug',
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                        )
                      }
                      placeholder="url-friendly-slug"
                      className={`w-full pl-7 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                        formErrors.slug ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => generateSlug(formData.title)}
                    disabled={!formData.title || isGeneratingSlug}
                    className="px-4 py-2.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {isGeneratingSlug ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Auto-Generate'
                    )}
                  </button>
                </div>
                {formErrors.slug && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.slug}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  URL: /blog/{formData.slug || 'your-post-slug'}
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => handleFieldChange('content', e.target.value)}
                  placeholder="Write your blog post content here... (HTML or Markdown supported)"
                  rows={12}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm ${
                    formErrors.content ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {formErrors.content && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.content}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Supports HTML tags for rich formatting. Content will be sanitized for security.
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Excerpt <span className="text-red-500">*</span>
                  </label>
                  <CharacterCounter current={formData.excerpt.length} max={500} />
                </div>
                <textarea
                  value={formData.excerpt}
                  onChange={e => handleFieldChange('excerpt', e.target.value)}
                  placeholder="Write a short summary of the post (shown in listings)..."
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                    formErrors.excerpt ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {formErrors.excerpt && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.excerpt}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => handleFieldChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* SEO Section */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  SEO Metadata
                </h3>

                {/* SEO Title */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      SEO Browser Title
                    </label>
                    <CharacterCounter current={formData.seoTitle?.length || 0} max={70} />
                  </div>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={e => handleFieldChange('seoTitle', e.target.value)}
                    placeholder="Custom title for search engines (leave empty to use post title)"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                      formErrors.seoTitle ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.seoTitle && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.seoTitle}
                    </p>
                  )}
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Meta Description
                    </label>
                    <CharacterCounter
                      current={formData.metaDescription?.length || 0}
                      max={160}
                      showWarning
                    />
                  </div>
                  <textarea
                    value={formData.metaDescription}
                    onChange={e => handleFieldChange('metaDescription', e.target.value)}
                    placeholder="Description for search engine results (e.g., 'Learn about Dhaka retail inventory management...')"
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                      formErrors.metaDescription ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.metaDescription && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.metaDescription}
                    </p>
                  )}
                  {(formData.metaDescription?.length || 0) > 160 && (
                    <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Meta description exceeds 160 characters. It may be truncated in search results.
                    </p>
                  )}
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  value={formData.featuredImage}
                  onChange={e => handleFieldChange('featuredImage', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={e =>
                    handleFieldChange(
                      'tags',
                      e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="Enter tags separated by commas (e.g., e-commerce, inventory, retail)"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2.5 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingPost ? 'Update Post' : 'Create Post'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagementTab;
