import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  FolderOpen, 
  Upload, 
  CheckCircle, 
  Smartphone, 
  Copy, 
  Download, 
  Check,
  Trash2,
  FolderPlus,
  Edit3,
  RotateCcw,
  Clock,
  ChevronDown,
  X,
  MoreVertical,
  MoveRight,
  AlertTriangle
} from 'lucide-react';
import { GalleryItem } from '../types';
import { DataService } from '../services/DataService';
import { uploadPreparedImageToServer } from '../services/imageUploadService';
import { getStoredToken } from '../services/authService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { ImageGridSkeleton } from '../components/SkeletonLoaders';
import toast from 'react-hot-toast';
import { useTenant } from '../hooks/useTenant';
import { showErrorWithWhatsApp } from '../utils/errorReporter';

const GALLERY_IMAGES: GalleryItem[] = [];

/** Get JSON auth headers for gallery management requests */
const getGalleryAuthHeaders = (): HeadersInit => {
  const token = getStoredToken();
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

interface GalleryFolder {
  name: string;
  path: string;
  createdAt: string;
}

interface TrashItem {
  originalUrl: string;
  trashPath: string;
  deletedAt: number;
  tenantId: string;
  folder: string | null;
  filename: string;
  expiresIn: number;
  expiresAt: number;
}

const AdminGallery: React.FC = () => {
  const { activeTenantId: tenantId } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Folder state
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  
  // Trash state
  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  
  // Move modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingImages, setMovingImages] = useState<GalleryItem[]>([]);
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folder: string } | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Load folders
  const loadFolders = useCallback(async () => {
    // Skip if tenantId not yet loaded
    if (!tenantId) return;
    try {
      const res = await fetch(`${apiBase}/api/upload/folders?tenantId=${tenantId}`, {
        credentials: 'include',
        headers: getGalleryAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }, [tenantId, apiBase]);

  // Load trash
  const loadTrash = useCallback(async () => {
    // Skip if tenantId not yet loaded
    if (!tenantId) return;
    setIsLoadingTrash(true);
    try {
      const res = await fetch(`${apiBase}/api/upload/trash?tenantId=${tenantId}`, {
        credentials: 'include',
        headers: getGalleryAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTrashItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setIsLoadingTrash(false);
    }
  }, [tenantId, apiBase]);

  const handleCopyUrl = async (e: React.MouseEvent, imageUrl: string, id: number) => {
    e.stopPropagation();
    const fullUrl = normalizeImageUrl(imageUrl);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async (e: React.MouseEvent, imageUrl: string, title: string) => {
    e.stopPropagation();
    const fullUrl = normalizeImageUrl(imageUrl);
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.${blob.type.split('/')[1] || 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: open in new tab
      window.open(fullUrl, '_blank');
    }
  };

  // Delete image (move to trash)
  const handleDeleteImage = async (e: React.MouseEvent, image: GalleryItem) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${apiBase}/api/upload/trash`, {
        method: 'POST',
        credentials: 'include',
        headers: getGalleryAuthHeaders(),
        body: JSON.stringify({ imageUrl: image.imageUrl, tenantId })
      });
      const data = await res.json();
      
      if (data.success) {
        setImages(prev => prev.filter(img => img.id !== image.id));
        setSelectedIds(prev => prev.filter(id => id !== image.id));
        toast.success('Image moved to trash');
      } else {
        toast.error(data.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete image');
    }
  };

  // Delete selected images
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    const toDelete = images.filter(img => selectedIds.includes(img.id));
    let successCount = 0;
    
    for (const img of toDelete) {
      try {
        const res = await fetch(`${apiBase}/api/upload/trash`, {
          method: 'POST',
          credentials: 'include',
          headers: getGalleryAuthHeaders(),
          body: JSON.stringify({ imageUrl: img.imageUrl, tenantId })
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch (err) {
        console.error('Delete failed for:', img.imageUrl);
      }
    }
    
    if (successCount > 0) {
      setImages(prev => prev.filter(img => !selectedIds.includes(img.id)));
      setSelectedIds([]);
      toast.success(`${successCount} image(s) moved to trash`);
    }
  };

  // Restore from trash
  const handleRestore = async (item: TrashItem) => {
    try {
      const res = await fetch(`${apiBase}/api/upload/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: getGalleryAuthHeaders(),
        body: JSON.stringify({ trashPath: item.trashPath, tenantId })
      });
      const data = await res.json();
      
      if (data.success) {
        const restored: GalleryItem = {
          id: Date.now(),
          title: item.filename.split('.')[0],
          category: item.folder || 'Restored',
          imageUrl: data.imageUrl,
          dateAdded: new Date().toISOString()
        };
        setImages(prev => [restored, ...prev]);
        setTrashItems(prev => prev.filter(t => t.trashPath !== item.trashPath));
        toast.success('Image restored');
      } else {
        toast.error(data.error || 'Failed to restore');
      }
    } catch (err) {
      console.error('Restore failed:', err);
      toast.error('Failed to restore image');
    }
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const res = await fetch(`${apiBase}/api/upload/folders`, {
        method: 'POST',
        credentials: 'include',
        headers: getGalleryAuthHeaders(),
        body: JSON.stringify({ tenantId, folderName: newFolderName.trim() })
      });
      const data = await res.json();
      
      if (data.success) {
        setFolders(prev => [...prev, data.folder]);
        setNewFolderName('');
        setShowCreateFolder(false);
        toast.success('Folder created');
      } else {
        toast.error(data.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('Create folder failed:', err);
      toast.error('Failed to create folder');
    }
  };

  // Rename folder
  const handleRenameFolder = async (oldName: string) => {
    if (!editFolderName.trim() || editFolderName === oldName) {
      setEditingFolder(null);
      return;
    }
    
    try {
      const res = await fetch(`${apiBase}/api/upload/folders`, {
        method: 'PUT',
        credentials: 'include',
        headers: getGalleryAuthHeaders(),
        body: JSON.stringify({ tenantId, oldName, newName: editFolderName.trim() })
      });
      const data = await res.json();
      
      if (data.success) {
        setFolders(prev => prev.map(f => 
          f.name === oldName ? { ...f, name: editFolderName.trim() } : f
        ));
        setEditingFolder(null);
        toast.success('Folder renamed');
      } else {
        toast.error(data.error || 'Failed to rename folder');
      }
    } catch (err) {
      console.error('Rename folder failed:', err);
      toast.error('Failed to rename folder');
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Delete folder "${folderName}"? The folder must be empty.`)) return;
    
    try {
      const res = await fetch(`${apiBase}/api/upload/folders`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getGalleryAuthHeaders(),
        body: JSON.stringify({ tenantId, folderName })
      });
      const data = await res.json();
      
      if (data.success) {
        setFolders(prev => prev.filter(f => f.name !== folderName));
        if (currentFolder === folderName) setCurrentFolder(null);
        setContextMenu(null);
        toast.success('Folder deleted');
      } else {
        toast.error(data.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('Delete folder failed:', err);
      toast.error('Failed to delete folder');
    }
  };

  // Move images to folder
  const handleMoveToFolder = async (targetFolder: string | null) => {
    if (movingImages.length === 0) return;
    
    let successCount = 0;
    for (const img of movingImages) {
      try {
        const res = await fetch(`${apiBase}/api/upload/move`, {
          method: 'POST',
          credentials: 'include',
          headers: getGalleryAuthHeaders(),
          body: JSON.stringify({ 
            imageUrl: img.imageUrl, 
            targetFolder: targetFolder || 'root',
            tenantId 
          })
        });
        const data = await res.json();
        
        if (data.success) {
          setImages(prev => prev.map(i => 
            i.id === img.id ? { ...i, imageUrl: data.imageUrl, category: targetFolder || 'Gallery' } : i
          ));
          successCount++;
        }
      } catch (err) {
        console.error('Move failed:', err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} image(s) moved`);
    }
    setShowMoveModal(false);
    setMovingImages([]);
    setSelectedIds([]);
  };

  // Open move modal for selected images
  const openMoveModal = () => {
    const toMove = images.filter(img => selectedIds.includes(img.id));
    if (toMove.length === 0) {
      toast.error('Select images to move');
      return;
    }
    setMovingImages(toMove);
    setShowMoveModal(true);
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

   useEffect(() => {
      let mounted = true;
      const loadGallery = async () => {
         if (!tenantId) return;
         try {
            // Use tenant-specific key for gallery storage
            // Load from tenant-specific gallery (consistent with GalleryPicker and saveToGallery)
            const stored = await DataService.get<GalleryItem[]>('gallery', GALLERY_IMAGES, tenantId);
            if (mounted) {
               setImages(stored);
               setIsLoaded(true);
            }
         } catch (error) {
            console.warn('Failed to load gallery, using defaults', error);
            if (mounted) setIsLoaded(true);
         }
      };
      // Reset state when tenant changes
      setImages([]);
      setIsLoaded(false);
      setSelectedIds([]);
      loadGallery();
      loadFolders();
      return () => { mounted = false; };
   }, [loadFolders, tenantId]);

   useEffect(() => {
      if (!isLoaded || !tenantId) return;
      // Save to tenant-specific gallery (consistent with GalleryPicker and saveToGallery)
      DataService.save('gallery', images, tenantId);
   }, [images, isLoaded, tenantId]);

  // Load trash when viewing
  useEffect(() => {
    if (showTrash) {
      loadTrash();
    }
  }, [showTrash, loadTrash]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const filteredImages = images.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      img.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = !currentFolder || img.category === currentFolder;
    return matchesSearch && matchesFolder;
  });

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    // Ensure tenantId is valid before uploading
    if (!tenantId) {
      toast.error('Tenant not loaded yet. Please try again in a moment.');
      if (input) input.value = '';
      return;
    }

    const errors: string[] = [];
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const imageUrl = await uploadPreparedImageToServer(file, tenantId, 'gallery');
        const newItem: GalleryItem = {
          id: Date.now() + Math.random(),
          title: file.name.split('.')[0],
          category: currentFolder || 'Uploads',
          imageUrl,
          dateAdded: new Date().toISOString()
        };
        return newItem;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to upload:', file.name, error);
        errors.push(`${file.name}: ${msg}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploaded = results.filter((r): r is GalleryItem => r !== null);
    
    if (uploaded.length > 0) {
      setImages(prev => [...uploaded, ...prev]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    }

    if (errors.length > 0) {
      showErrorWithWhatsApp(
        'Gallery Upload',
        `Failed to upload ${errors.length} image(s)`,
        errors.join('; ')
      );
    }
    
    if (input) input.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && e.relatedTarget && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Ensure tenantId is valid before uploading
    if (!tenantId) {
      toast.error('Tenant not loaded yet. Please try again in a moment.');
      return;
    }

    // Filter only image files
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('Please drop image files only');
      return;
    }

    const errors: string[] = [];
    const uploadPromises = imageFiles.map(async (file) => {
      try {
        const imageUrl = await uploadPreparedImageToServer(file, tenantId, 'gallery');
        const newItem: GalleryItem = {
          id: Date.now() + Math.random(),
          title: file.name.split('.')[0],
          category: currentFolder || 'Uploads',
          imageUrl,
          dateAdded: new Date().toISOString()
        };
        return newItem;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to upload:', file.name, error);
        errors.push(`${file.name}: ${msg}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploaded = results.filter((r): r is GalleryItem => r !== null);
    
    if (uploaded.length > 0) {
      setImages(prev => [...uploaded, ...prev]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    }

    if (errors.length > 0) {
      showErrorWithWhatsApp(
        'Gallery Upload (Drop)',
        `Failed to upload ${errors.length} image(s)`,
        errors.join('; ')
      );
    }
  };

  return (
    <div 
      ref={dropZoneRef}
      className={`flex flex-col h-[calc(100vh-80px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in relative ${isDragging ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-500/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className={`bg-white rounded-xl p-8 shadow-2xl border-2 border-dashed ${tenantId ? 'border-purple-500' : 'border-gray-400'}`}>
            <div className="text-center">
              <Upload size={48} className={`mx-auto mb-4 ${tenantId ? 'text-purple-500' : 'text-gray-400'}`} />
              {tenantId ? (
                <>
                  <p className="text-lg font-bold text-purple-700">Drop images here to upload</p>
                  <p className="text-sm text-gray-500 mt-1">Images will be uploaded to {currentFolder || 'Gallery Root'}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-600">Please wait...</p>
                  <p className="text-sm text-gray-500 mt-1">Store is still loading</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col gap-3 sm:gap-4 bg-white z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gallery</h2>
            
            {/* Trash Toggle */}
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                showTrash 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Trash2 size={14} className="sm:hidden" />
              <Trash2 size={16} className="hidden sm:block" />
              <span className="hidden xs:inline">Trash</span> {trashItems.length > 0 && `(${trashItems.length})`}
            </button>
          </div>

          {!showTrash && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-48 lg:w-64">
                <input 
                  type="text" 
                  placeholder="Search images..." 
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-purple-100 bg-purple-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:hidden" />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hidden sm:block" />
              </div>
              
              {/* Folder Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                  className="flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-bold whitespace-nowrap w-full sm:w-auto"
                >
                  <FolderOpen size={16} className="sm:hidden" />
                  <FolderOpen size={18} className="hidden sm:block" /> 
                  <span className="truncate max-w-[100px] sm:max-w-none">{currentFolder || 'All Images'}</span>
                  <ChevronDown size={16} />
                </button>
                
                {showFolderDropdown && (
                  <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="p-2 border-b border-gray-100">
                      <button
                        onClick={() => { setCurrentFolder(null); setShowFolderDropdown(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!currentFolder ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'}`}
                      >
                        All Images
                      </button>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto p-2">
                      {folders.map(folder => (
                        <div
                          key={folder.name}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer group ${
                            currentFolder === folder.name ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => { setCurrentFolder(folder.name); setShowFolderDropdown(false); }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, folder: folder.name });
                          }}
                        >
                          {editingFolder === folder.name ? (
                            <input
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              onBlur={() => handleRenameFolder(folder.name)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.name)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              autoFocus
                            />
                          ) : (
                            <>
                              <span className="flex items-center gap-2">
                                <FolderOpen size={16} />
                                {folder.name}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContextMenu({ x: e.clientX, y: e.clientY, folder: folder.name });
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                              >
                                <MoreVertical size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-2 border-t border-gray-100">
                      {showCreateFolder ? (
                        <div className="flex gap-2">
                          <input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder name"
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            autoFocus
                          />
                          <button
                            onClick={handleCreateFolder}
                            className="px-3 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg text-sm"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                            className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCreateFolder(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg text-sm"
                        >
                          <FolderPlus size={16} />
                          Create Folder
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu for Folders */}
      {contextMenu && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              setEditingFolder(contextMenu.folder);
              setEditFolderName(contextMenu.folder);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Edit3 size={14} /> Rename
          </button>
          <button
            onClick={() => handleDeleteFolder(contextMenu.folder)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50/30">
        {showTrash ? (
          // Trash View
          isLoadingTrash ? (
            <ImageGridSkeleton count={6} />
          ) : trashItems.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>Items are permanently deleted after 24 hours</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {trashItems.map(item => (
                  <div 
                    key={item.trashPath}
                    className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden opacity-60">
                      <img 
                        src={normalizeImageUrl(item.trashPath)} 
                        alt={item.filename} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    </div>
                    <div className="p-2 sm:p-3">
                      <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{item.filename}</h4>
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <Clock size={10} className="sm:hidden" />
                        <Clock size={12} className="hidden sm:block" />
                        <span className="text-[10px] sm:text-xs">Expires in {formatTimeRemaining(item.expiresIn)}</span>
                      </div>
                      <button
                        onClick={() => handleRestore(item)}
                        className="mt-2 w-full flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] sm:text-xs font-medium hover:bg-emerald-200 transition"
                      >
                        <RotateCcw size={12} className="sm:hidden" />
                        <RotateCcw size={14} className="hidden sm:block" />
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Trash2 size={36} className="mb-4 opacity-20 sm:hidden" />
              <Trash2 size={48} className="mb-4 opacity-20 hidden sm:block" />
              <p className="font-medium text-sm sm:text-base">Trash is empty</p>
            </div>
          )
        ) : (
          // Gallery View
          !isLoaded ? (
            <ImageGridSkeleton count={10} />
          ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {filteredImages.map(item => (
                <div 
                  key={item.id}
                  onClick={() => toggleSelection(item.id)}
                  className={`group relative bg-white rounded-lg overflow-hidden border shadow-sm cursor-pointer transition-all duration-200 ${
                    selectedIds.includes(item.id) 
                      ? 'border-purple-600 ring-2 ring-purple-500 ring-opacity-50' 
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    <img src={normalizeImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
                    
                    {/* Overlay on Hover/Select */}
                    <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-opacity duration-200 ${selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {/* Action Buttons - Compact on mobile */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center px-2">
                        <button
                          onClick={(e) => handleCopyUrl(e, item.imageUrl, item.id)}
                          className="bg-white hover:bg-gray-100 text-gray-700 rounded-lg p-2 sm:px-3 sm:py-2 shadow-lg flex items-center gap-1 sm:gap-1.5 text-xs font-medium transition"
                          title="Copy image URL"
                        >
                          {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          <span className="hidden sm:inline">{copiedId === item.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, item.imageUrl, item.title)}
                          className="bg-white hover:bg-gray-100 text-gray-700 rounded-lg p-2 sm:px-3 sm:py-2 shadow-lg flex items-center gap-1 sm:gap-1.5 text-xs font-medium transition"
                          title="Download image"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteImage(e, item)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 sm:px-3 sm:py-2 shadow-lg flex items-center gap-1 sm:gap-1.5 text-xs font-medium transition"
                          title="Delete image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedIds.includes(item.id) && (
                        <div className="bg-purple-600 text-white rounded-full p-1.5 sm:p-2 shadow-lg">
                          <CheckCircle size={18} className="sm:hidden" />
                          <CheckCircle size={24} className="hidden sm:block" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3">
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate" title={item.title}>{item.title}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full truncate max-w-[80%]">{item.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Smartphone size={36} className="mb-4 opacity-20 sm:hidden" />
              <Smartphone size={48} className="mb-4 opacity-20 hidden sm:block" />
              <p className="font-medium text-sm sm:text-base">No images found</p>
            </div>
          )
        )}
      </div>

      {/* Footer Actions */}
      {!showTrash && (
        <div className="p-2 sm:p-3 md:p-4 border-t border-gray-100 bg-white z-20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Selection Actions */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
              {selectedIds.length > 0 && (
                <>
                  <button 
                    onClick={openMoveModal}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition text-xs sm:text-sm whitespace-nowrap"
                  >
                    <MoveRight size={14} className="sm:hidden" />
                    <MoveRight size={16} className="hidden sm:block" />
                    <span className="hidden xs:inline">Move to</span> Folder
                  </button>
                  <button 
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Trash2 size={14} className="sm:hidden" />
                    <Trash2 size={16} className="hidden sm:block" />
                    Delete
                  </button>
                </>
              )}
            </div>
            
            {/* Upload and Counter */}
            <div className="flex items-center gap-2 sm:gap-4 justify-end">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                multiple
                onChange={handleUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!tenantId}
                className={`group relative px-6 sm:px-10 py-2 sm:py-4 rounded-xl font-bold transition-all duration-500 active:scale-95 overflow-hidden ${
                  tenantId 
                    ? 'bg-slate-950' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                title={!tenantId ? 'Waiting for store to load...' : 'Upload images'}
              >
                {tenantId && (
                  <>
                    {/* Crystal Gradient Border */}
                    <span className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-orange-500 to-blue-500 [mask-image:linear-gradient(white,white)_padding-box,linear-gradient(white,white)] [mask-composite:exclude] opacity-70 animate-pulse"></span>
                    
                    {/* Dual-Tone Glow */}
                    <span className="absolute inset-0 rounded-xl bg-orange-500/20 blur-xl animate-pulse"></span>
                    <span className="absolute -inset-1 rounded-xl bg-blue-500/20 blur-2xl animate-pulse [animation-delay:1.5s]"></span>
                    
                    {/* Prismatic Reflection */}
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full"></span>

                    {/* Edge Highlights */}
                    <span className="absolute to p-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-300/30 to-transparent"></span>
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-300/30 to-transparent"></span>
                  </>
                )}
                
                {/* Content */}
                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                  <Upload className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500 ${tenantId ? 'text-orange-400 group-hover:text-blue-300 group-hover:-translate-y-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-gray-500'}`} />
                  <span className={`tracking-[0.1em] uppercase text-xs sm:text-sm font-bold transition-all duration-500 ${tenantId ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-400 group-hover:from-white group-hover:to-white' : 'text-gray-500'}`}>
                    {tenantId ? 'Upload' : 'Loading...'}
                  </span>
                </span>
              </button>
              
              <div className="px-3 sm:px-6 py-2 sm:py-3 border border-purple-600 text-purple-600 rounded-lg font-medium text-xs sm:text-sm min-w-[80px] sm:min-w-[120px] text-center">
                {selectedIds.length} <span className="hidden xs:inline">Selected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold">Move {movingImages.length} image(s) to folder</h3>
              <button onClick={() => setShowMoveModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleMoveToFolder(null)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-lg text-left"
              >
                <FolderOpen size={20} className="text-gray-400" />
                <span>Gallery Root</span>
              </button>
              
              {folders.map(folder => (
                <button
                  key={folder.name}
                  onClick={() => handleMoveToFolder(folder.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-lg text-left"
                >
                  <FolderOpen size={20} className="text-purple-500" />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowMoveModal(false)}
                className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
