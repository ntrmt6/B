import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Image as ImageIcon, Check, FolderOpen, Grid, LayoutGrid, ZoomIn, ChevronLeft, ChevronRight, Filter, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
import { GalleryItem } from '../types';
import { DataService } from '../services/DataService';
import { useAuth } from '../context/AuthContext';

// No default gallery images - users upload their own
const DEFAULT_GALLERY_IMAGES: GalleryItem[] = [];
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  multiple?: boolean;
  onSelectMultiple?: (imageUrls: string[]) => void;
  title?: string;
}

type ViewMode = 'grid' | 'large';
type SortMode = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export const GalleryPicker: React.FC<GalleryPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  onSelectMultiple,
  title = 'Choose from Gallery'
}) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [previewImage, setPreviewImage] = useState<GalleryItem | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const loadGallery = async () => {
      setIsLoading(true);
      try {
        // Load gallery images for current tenant only
        const stored = await DataService.get<GalleryItem[]>('gallery', DEFAULT_GALLERY_IMAGES, tenantId);
        setImages(stored);
      } catch (error) {
        console.warn('Failed to load gallery:', error);
        setImages(DEFAULT_GALLERY_IMAGES);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGallery();
    setSelectedUrls([]);
    setSearchTerm('');
    setPreviewImage(null);
  }, [isOpen, tenantId]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClick = () => setShowSortMenu(false);
    if (showSortMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showSortMenu]);

  const categories = useMemo(() => 
    ['All', ...Array.from(new Set(images.map(img => img.category)))],
    [images]
  );

  const filteredImages = useMemo(() => {
    let result = images.filter(img => {
      const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           img.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || img.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort images
    switch (sortMode) {
      case 'newest':
        result = [...result].reverse();
        break;
      case 'oldest':
        // Already in order
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return result;
  }, [images, searchTerm, activeCategory, sortMode]);

  if (!isOpen) return null;

  const handleImageClick = (imageUrl: string) => {
    const normalizedUrl = normalizeImageUrl(imageUrl);
    if (multiple) {
      setSelectedUrls(prev => 
        prev.includes(normalizedUrl) 
          ? prev.filter(url => url !== normalizedUrl)
          : [...prev, normalizedUrl]
      );
    } else {
      onSelect(normalizedUrl);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (multiple && onSelectMultiple) {
      onSelectMultiple(selectedUrls.map(url => normalizeImageUrl(url)));
    } else if (selectedUrls.length === 1) {
      onSelect(normalizeImageUrl(selectedUrls[0]));
    }
    onClose();
  };

  const handlePreview = (e: React.MouseEvent, img: GalleryItem) => {
    e.stopPropagation();
    setPreviewImage(img);
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewImage) return;
    const currentIndex = filteredImages.findIndex(img => img.id === previewImage.id);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = filteredImages.length - 1;
    if (newIndex >= filteredImages.length) newIndex = 0;
    setPreviewImage(filteredImages[newIndex]);
  };

  const selectAll = () => {
    setSelectedUrls(filteredImages.map(img => normalizeImageUrl(img.imageUrl)));
  };

  const clearSelection = () => {
    setSelectedUrls([]);
  };

  const gridCols = viewMode === 'large' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
                <ImageIcon size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                <p className="text-sm text-gray-500">{images.length} images • {filteredImages.length} showing</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 hover:bg-white rounded-xl transition text-gray-500 hover:text-gray-700 hover:shadow-md"
            >
              <X size={22} />
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
            {/* Search & Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm shadow-sm"
                />
              </div>
              
              <div className="flex gap-2">
                {/* View Mode Toggle */}
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    title="Compact Grid"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('large')}
                    className={`p-3 transition-colors ${viewMode === 'large' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    title="Large Grid"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 shadow-sm"
                  >
                    {sortMode.includes('asc') || sortMode === 'oldest' ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
                    <span className="hidden sm:inline">Sort</span>
                  </button>
                  
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[160px] z-50 animate-in fade-in slide-in-from-to p-2 duration-200">
                      <button onClick={() => { setSortMode('newest'); setShowSortMenu(false); }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 ${sortMode === 'newest' ? 'text-purple-600 bg-purple-50 font-medium' : 'text-gray-700'}`}>
                        Newest First
                      </button>
                      <button onClick={() => { setSortMode('oldest'); setShowSortMenu(false); }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 ${sortMode === 'oldest' ? 'text-purple-600 bg-purple-50 font-medium' : 'text-gray-700'}`}>
                        Oldest First
                      </button>
                      <hr className="my-1" />
                      <button onClick={() => { setSortMode('name-asc'); setShowSortMenu(false); }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 ${sortMode === 'name-asc' ? 'text-purple-600 bg-purple-50 font-medium' : 'text-gray-700'}`}>
                        Name A-Z
                      </button>
                      <button onClick={() => { setSortMode('name-desc'); setShowSortMenu(false); }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 ${sortMode === 'name-desc' ? 'text-purple-600 bg-purple-50 font-medium' : 'text-gray-700'}`}>
                        Name Z-A
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Categories Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Filter size={16} className="text-gray-400 flex-shrink-0" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Selection Controls (for multiple mode) */}
            {multiple && filteredImages.length > 0 && (
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Select All ({filteredImages.length})
                </button>
                {selectedUrls.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Image Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
            {isLoading ? (
              <div className={`grid ${gridCols} gap-4`}>
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="p-6 bg-gray-100 rounded-full mb-4">
                  <FolderOpen size={48} className="opacity-50" />
                </div>
                <p className="font-semibold text-gray-600">No images found</p>
                <p className="text-sm mt-1">Try a different search term or category</p>
              </div>
            ) : (
              <div className={`grid ${gridCols} gap-4`}>
                {filteredImages.map((img, index) => {
                  const isSelected = selectedUrls.includes(img.imageUrl);
                  const isHovered = hoveredImage === String(img.id);
                  return (
                    <div
                      key={img.id}
                      onClick={() => handleImageClick(img.imageUrl)}
                      onMouseEnter={() => setHoveredImage(String(img.id))}
                      onMouseLeave={() => setHoveredImage(null)}
                      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'ring-4 ring-purple-500 ring-offset-2 scale-[0.97] shadow-xl shadow-purple-500/25'
                          : 'hover:ring-2 hover:ring-purple-300 hover:shadow-lg'
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <img
                        src={normalizeImageUrl(img.imageUrl)}
                        alt={img.title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                        loading="lazy"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
                        isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                      }`} />
                      
                      {/* Selection Indicator */}
                      <div className={`absolute to p-3 right-3 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-2 shadow-lg">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </div>

                      {/* Selection Number for Multiple */}
                      {multiple && isSelected && (
                        <div className="absolute to p-3 left-3 bg-white text-purple-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                          {selectedUrls.indexOf(img.imageUrl) + 1}
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className={`absolute to p-3 right-3 flex gap-1.5 transition-all duration-300 ${
                        !isSelected && isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                      }`}>
                        <button
                          onClick={(e) => handlePreview(e, img)}
                          className="p-2 bg-white/95 rounded-lg text-gray-700 hover:bg-white shadow-lg transition-colors"
                          title="Preview"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>
                      
                      {/* Image Info */}
                      <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${
                        isSelected || isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                      }`}>
                        <p className="text-white text-sm font-semibold truncate drop-shadow-lg">{img.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-[10px] font-medium">
                            {img.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                {multiple 
                  ? selectedUrls.length > 0 
                    ? <span className="font-medium text-purple-600">{selectedUrls.length} image{selectedUrls.length !== 1 ? 's' : ''} selected</span>
                    : 'Click images to select'
                  : 'Click an image to select'
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium text-sm"
              >
                Cancel
              </button>
              {multiple && (
                <button
                  onClick={handleConfirm}
                  disabled={selectedUrls.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:shadow-none"
                >
                  <Check size={16} />
                  Add Selected {selectedUrls.length > 0 && `(${selectedUrls.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setPreviewImage(null)}
        >
          {/* Navigation Arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); navigatePreview('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigatePreview('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <ChevronRight size={28} />
          </button>

          {/* Image */}
          <div className="relative max-w-5xl max-h-[85vh] animate-in fade-in zoom-in-95 duration-300">
            <img
              src={normalizeImageUrl(previewImage.imageUrl)}
              alt={previewImage.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Image Info Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent rounded-b-lg">
              <div className="flex items-end justify-between">
                <div>
                  <h4 className="text-white font-bold text-lg">{previewImage.title}</h4>
                  <p className="text-white/70 text-sm">{previewImage.category}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleImageClick(previewImage.imageUrl); }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedUrls.includes(previewImage.imageUrl)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {selectedUrls.includes(previewImage.imageUrl) ? (
                    <span className="flex items-center gap-2"><Check size={16} /> Selected</span>
                  ) : (
                    'Select'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute to p-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      )}
    </>
  );
};

export default GalleryPicker;
