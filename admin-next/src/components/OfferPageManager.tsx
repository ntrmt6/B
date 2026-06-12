import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2, Copy, ExternalLink,
  MoreVertical, Calendar, ShoppingCart, TrendingUp, FileText,
  CheckCircle, Clock, Archive, X, AlertTriangle, ChevronDown, ChevronLeft, ChevronRight,
  Monitor, Smartphone
} from 'lucide-react';
import { getOfferPages, deleteOfferPage, updateOfferPage, OfferPageResponse } from '../services/DataService';
import { isAuthenticated } from '../services/authService';
// useTenant removed - using prop instead

interface OfferPageManagerProps {
  tenantId: string;
  tenantSubdomain?: string;
  onCreateNew: () => void;
  onEdit: (page: OfferPageResponse) => void;
  onPreview: (page: OfferPageResponse) => void;
}

export const OfferPageManager: React.FC<OfferPageManagerProps> = ({
  tenantId,
  tenantSubdomain: propSubdomain,
  onCreateNew,
  onEdit,
  onPreview
}) => {
  // Use subdomain from prop - it's passed from AdminLandingPage which gets it from AdminApp
  const tenantSubdomain = propSubdomain || '';
  console.log('[OfferPageManager] Using subdomain from prop:', tenantSubdomain, 'for tenantId:', tenantId);
  
  const [pages, setPages] = useState<OfferPageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; page: OfferPageResponse | null }>({ open: false, page: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [previewPage, setPreviewPage] = useState<OfferPageResponse | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper function to build proper URL with subdomain
  const buildUrl = (slug: string) => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    // Check if localhost
    if (host.includes('localhost')) {
      // For localhost: subdomain.localhost:port
      const port = host.split(':')[1] || '3000';
      const baseUrl = tenantSubdomain 
        ? `${protocol}//${tenantSubdomain}.localhost:${port}`
        : window.location.origin;
      return `${baseUrl}/offer/${slug}`;
    }
    
    // For production: subdomain.maindomain.com
    const hostParts = host.split('.');
    const mainDomain = hostParts.length >= 2 
      ? hostParts.slice(-2).join('.') 
      : host;
    const baseUrl = tenantSubdomain 
      ? `${protocol}//${tenantSubdomain}.${mainDomain}`
      : window.location.origin;
    return `${baseUrl}/offer/${slug}`;
  };

  const fetchPages = async () => {
    if (!tenantId) {
      console.log('[OfferPageManager] No tenantId, skipping fetch');
      return;
    }
    if (!isAuthenticated()) {
      console.log('[OfferPageManager] Not authenticated, skipping fetch');
      return;
    }
    setIsLoading(true);
    try {
      const response = await getOfferPages(tenantId);
      setPages(response.data || []);
      if (response.data?.length > 0) {
        setPreviewPage(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching offer pages:', error);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [tenantId]);

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.urlSlug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPages.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPages = filteredPages.slice(startIndex, startIndex + pageSize);

  const handleDelete = async () => {
    if (!deleteModal.page) return;
    setIsDeleting(true);
    try {
      await deleteOfferPage(tenantId, deleteModal.page._id);
      setPages(pages.filter(p => p._id !== deleteModal.page?._id));
      setDeleteModal({ open: false, page: null });
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (page: OfferPageResponse) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      await updateOfferPage(tenantId, page._id, { status: newStatus });
      setPages(pages.map(p => p._id === page._id ? { ...p, status: newStatus } : p));
    } catch (error) {
      console.error('Error updating page status:', error);
      alert('Failed to update page status');
    }
  };

  const copyUrl = (slug: string) => {
    const url = buildUrl(slug);
    navigator.clipboard.writeText(url);
    alert('URL copied!');
  };

  const handleSelectAll = () => {
    if (selectedPages.length === paginatedPages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(paginatedPages.map(p => p._id));
    }
  };

  const handleSelectPage = (id: string) => {
    setSelectedPages(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleRowClick = (page: OfferPageResponse) => {
    setPreviewPage(page);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#f9f9f9]">
      {/* Left Section - Table */}
      <div className="flex-1 p-3 sm:p-4 lg:p-5 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-[22px] font-bold text-[#023337] tracking-[0.11px] font-['Lato',sans-serif]">Landing Page</h1>
            <p className="text-[#777] mt-1 text-base font-['Poppins',sans-serif]">Create unlimited landing Page</p>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
            <button className="flex items-center justify-center gap-1 px-3 sm:px-4 py-2.5 border border-[#ff6a00] text-black rounded-lg hover:bg-orange-50 transition-colors text-[15px] font-bold font-['Lato',sans-serif] tracking-[-0.3px]">
              Version 1
              <ChevronDown size={18} />
            </button>
            <button
              onClick={onCreateNew}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white rounded-lg hover:opacity-90 transition-opacity text-[15px] font-bold font-['Lato',sans-serif] tracking-[-0.3px]"
            >
              <Plus size={20} />
              <span className="hidden xs:inline">Create</span> Landing Page
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-full sm:max-w-[240px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search Category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f2f2f2] border-0 rounded-lg focus:ring-2 focus:ring-[#38bdf8] text-xs font-['Poppins',sans-serif] text-[#7b7b7b] placeholder:text-[#7b7b7b]"
            />
          </div>
          
          {/* Filter Label */}
          <div className="flex items-center gap-2 text-black text-xs font-['Poppins',sans-serif]">
            <Filter size={18} />
            <span>Filter:</span>
          </div>
          
          {/* Filter Dropdowns */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-w-[100px] px-2 py-2 bg-[#f2f2f2] border-0 rounded-lg text-xs font-['Poppins',sans-serif] focus:ring-2 focus:ring-[#38bdf8] cursor-pointer"
          >
            <option value="all">All Category</option>
          </select>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="min-w-[100px] px-2 py-2 bg-[#f2f2f2] border-0 rounded-lg text-xs font-['Poppins',sans-serif] focus:ring-2 focus:ring-[#38bdf8] cursor-pointer"
          >
            <option value="all">All Version</option>
            <option value="v1">V-1</option>
            <option value="v2">V-2</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[100px] px-2 py-2 bg-[#f2f2f2] border-0 rounded-lg text-xs font-['Poppins',sans-serif] focus:ring-2 focus:ring-[#38bdf8] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg flex flex-col min-h-[500px]">
          {isLoading ? (
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38bdf8] mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No landing pages</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new landing page.</p>
              <button
                onClick={onCreateNew}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white rounded-lg hover:opacity-90"
              >
                Create First Page
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto overflow-y-visible flex-1">
                <table className="w-full table-fixed">
                  <thead className="bg-gradient-to-r from-[rgba(56,189,248,0.15)] to-[rgba(30,144,255,0.15)]">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPages.length === paginatedPages.length && paginatedPages.length > 0}
                          onChange={handleSelectAll}
                          className="w-5 h-5 rounded border-[#eaf8e7] border-[1.5px] bg-white focus:ring-[#38bdf8]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 font-['Poppins',sans-serif] w-12">SL</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 font-['Poppins',sans-serif] w-40">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 font-['Poppins',sans-serif]">Landing Page URL</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 font-['Poppins',sans-serif] w-24">Version</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 font-['Poppins',sans-serif] w-24">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 font-['Poppins',sans-serif] w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b9b9b9]/50">
                    {paginatedPages.map((page, index) => (
                      <tr 
                        key={page._id} 
                        className={`hover:bg-gray-50 cursor-pointer ${previewPage?._id === page._id ? 'bg-[rgba(56,189,248,0.08)]' : ''}`}
                        onClick={() => handleRowClick(page)}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedPages.includes(page._id)}
                            onChange={() => handleSelectPage(page._id)}
                            className="w-5 h-5 rounded border-[#eaf8e7] border-[1.5px] bg-white focus:ring-[#38bdf8]"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#1d1a1a] font-['Poppins',sans-serif] text-center w-[50px]">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {page.imageUrl ? (
                              <img
                                src={page.imageUrl}
                                alt={page.productTitle}
                                className="w-10 h-10 object-cover rounded-lg bg-gradient-to-r from-[#38bdf8] to-[#1e90ff]"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-lg flex items-center justify-center">
                                <FileText size={16} className="text-white" />
                              </div>
                            )}
                            <p className="text-xs text-[#1d1a1a] font-['Poppins',sans-serif] line-clamp-2 max-w-[120px]">
                              {page.productTitle}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-[#1d1a1a] font-['Poppins',sans-serif] truncate max-w-[160px]">
                            offer/{page.urlSlug}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[rgba(56,189,248,0.2)] to-[rgba(30,144,255,0.2)] text-transparent bg-clip-text font-['Poppins',sans-serif]" style={{ backgroundImage: 'linear-gradient(to right, #38bdf8, #1e90ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            V-1
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(page);
                            }}
                            className={`px-3 py-0.5 rounded-full text-xs font-medium font-['Poppins',sans-serif] ${
                              page.status === 'published'
                                ? 'bg-[#c1ffbc] text-[#085e00]'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {page.status === 'published' ? 'Publish' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === page._id ? null : page._id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Actions"
                          >
                            <MoreVertical size={18} className="text-gray-600" />
                          </button>
                          
                          {actionMenuOpen === page._id && (
                            <div className="absolute right-4 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1 animate-in fade-in slide-in-from-to p-2 duration-200">
                              <button
                                onClick={() => {
                                  onPreview(page);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                              >
                                <Eye size={16} className="text-blue-500" /> Preview
                              </button>
                              <button
                                onClick={() => {
                                  onEdit(page);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                              >
                                <Edit2 size={16} className="text-emerald-500" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  copyUrl(page.urlSlug);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                              >
                                <Copy size={16} className="text-purple-500" /> Copy URL
                              </button>
                              <button
                                onClick={() => {
                                  window.open(buildUrl(page.urlSlug), '_blank');
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-sky-50 flex items-center gap-3 text-gray-700 font-medium transition-colors"
                              >
                                <ExternalLink size={16} className="text-sky-500" /> Open Link
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={() => {
                                  setDeleteModal({ open: true, page });
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 font-medium transition-colors"
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-[#b9b9b9]/50 flex-1">
                {paginatedPages.map((page, index) => (
                  <div
                    key={page._id}
                    className={`p-4 hover:bg-gray-50 ${previewPage?._id === page._id ? 'bg-[rgba(56,189,248,0.08)]' : ''}`}
                    onClick={() => handleRowClick(page)}
                  >
                    <div className="flex gap-3">
                      {page.imageUrl ? (
                        <img
                          src={page.imageUrl}
                          alt={page.productTitle}
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff]"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-[#1d1a1a] text-xs line-clamp-2 font-['Poppins',sans-serif]">{page.productTitle}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(page);
                            }}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 font-['Poppins',sans-serif] ${
                              page.status === 'published'
                                ? 'bg-[#c1ffbc] text-[#085e00]'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {page.status === 'published' ? 'Publish' : 'Draft'}
                          </button>
                        </div>
                        <p className="text-xs text-[#1d1a1a] truncate mt-1 font-['Poppins',sans-serif]">offer/{page.urlSlug}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[rgba(56,189,248,0.2)] to-[rgba(30,144,255,0.2)]" style={{ backgroundImage: 'linear-gradient(to right, #38bdf8, #1e90ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>V-1</span>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onPreview(page)}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => onEdit(page)}
                              className="p-1.5 hover:bg-gray-100 rounded text-[#38bdf8]"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, page })}
                              className="p-1.5 hover:bg-red-50 rounded text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 mt-auto border-t border-[#b9b9b9]/30 bg-gray-50 rounded-b-lg">
                <div className="flex items-center gap-2 text-xs text-gray-600 font-['Poppins',sans-serif]">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-[#f2f2f2] border-0 rounded text-xs"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="hidden xs:inline">entries</span>
                </div>
                
                <div className="flex flex-col xs:flex-row items-center gap-2">
                  <span className="text-xs text-gray-600 font-['Poppins',sans-serif]">
                    Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredPages.length)} of {filteredPages.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded text-xs ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Section - Preview (Hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex w-[420px] bg-white rounded-lg p-4 flex-col m-2 ml-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#023337] font-['Lato',sans-serif] tracking-[0.1px]">Preview</h2>
          <div className="flex items-center gap-2">
            {previewPage && (
              <button
                onClick={() => window.open(buildUrl(previewPage.urlSlug), '_blank')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Open in new tab"
              >
                <div className="flex items-center gap-1">
                  <Monitor size={16} className="text-gray-500" />
                  <Smartphone size={14} className="text-gray-500" />
                </div>
              </button>
            )}
          </div>
        </div>
        
        {previewPage ? (
          <div className="flex-1 overflow-hidden rounded-lg bg-gray-100">
            <div className="w-full h-full overflow-auto">
              <div className="transform scale-[0.38] origin-top-left w-[263%]">
                <iframe
                  src={buildUrl(previewPage.urlSlug)}
                  className="w-full h-[1800px] border-0"
                  title="Preview"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center text-gray-400">
              <Eye size={48} className="mx-auto mb-2 opacity-50" />
              <p className="font-['Poppins',sans-serif]">Select a page to preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#023337] font-['Lato',sans-serif]">Delete Landing Page</h3>
            </div>
            <p className="text-gray-600 mb-6 font-['Poppins',sans-serif] text-sm">
              Are you sure you want to delete "<strong>{deleteModal.page?.productTitle}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, page: null })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-['Poppins',sans-serif] text-sm"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-['Poppins',sans-serif] text-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
};

export default OfferPageManager;
