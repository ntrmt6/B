import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Upload,
  Layers,
  FolderOpen,
  MoreVertical,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Popup, WebsiteConfig, PopupFilterStatus, ImageUploadType } from './types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { convertFileToWebP } from '../../services/imageUtils';
import { ActionButton } from './shared/TabButton';
import { GalleryPicker } from '../GalleryPicker';

// ========== Figma Design Styles ==========
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  headerTitle: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '20px',
    color: '#111827',
    letterSpacing: '0.11px',
    margin: 0,
  },
  headerSubtitle: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    color: '#777',
    margin: 0,
  },
  createButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    height: '48px',
    padding: '6px 16px 6px 12px',
    background: 'linear-gradient(to right, #38bdf8, #1e90ff)',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  createButtonText: {
    fontFamily: "'Lato', sans-serif",
    fontWeight: 700,
    fontSize: '15px',
    color: 'white',
    letterSpacing: '-0.3px',
  },
  tableContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    background: 'white',
    borderRadius: '8px',
    overflow: 'visible',
    minHeight: '340px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '50px 80px 1fr 1fr 100px 80px',
    alignItems: 'center',
    height: '48px',
    background: '#f5f5f5',
    padding: '0 16px',
  },
  tableHeaderCell: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: '16px',
    color: 'black',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '50px 80px 1fr 1fr 100px 80px',
    alignItems: 'center',
    height: '68px',
    borderBottom: '0.5px solid #b9b9b9',
    padding: '0 16px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    background: 'white',
    border: '1.5px solid #eaf8e7',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  slNumber: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: '#1d1a1a',
    textAlign: 'center' as const,
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  productImage: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, #38bdf8, #1e90ff)',
    objectFit: 'cover' as const,
    overflow: 'hidden',
  },
  productName: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: '#1d1a1a',
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  urlText: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    color: '#1d1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 9px',
    borderRadius: '30px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: '12px',
    cursor: 'pointer',
    border: 'none',
  },
  statusPublish: {
    background: '#c1ffbc',
    color: '#085e00',
  },
  statusDraft: {
    background: '#ffeeba',
    color: '#856404',
  },
  actionButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    padding: 0,
  },
  dropdownMenu: {
    position: 'absolute' as const,
    right: '0',
    top: '100%',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    minWidth: '140px',
    zIndex: 50,
    overflow: 'visible',
    border: '1px solid #e5e7eb',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
    color: '#777',
  },
  // Mobile Card Styles
  mobileCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    borderBottom: '1px solid #eee',
  },
  mobileCardImage: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
  mobileCardContent: {
    flex: 1,
    minWidth: 0,
  },
  mobileCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  mobileCardName: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    fontSize: '14px',
    color: '#1d1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  mobileCardUrl: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '12px',
    color: '#777',
    marginTop: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  mobileCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
};

interface PopupTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  tenantId: string;
  onUpdateWebsiteConfig?: (config: WebsiteConfig) => Promise<void>;
  hasUnsavedChangesRef: React.MutableRefObject<boolean>;
  prevWebsiteConfigRef: React.MutableRefObject<WebsiteConfig | null>;
  lastSaveTimestampRef: React.MutableRefObject<number>;
}

export const PopupTab: React.FC<PopupTabProps> = ({
  websiteConfiguration,
  setWebsiteConfiguration,
  tenantId,
  onUpdateWebsiteConfig,
  hasUnsavedChangesRef,
  prevWebsiteConfigRef,
  lastSaveTimestampRef
}) => {
  const [popupFilterStatus, setPopupFilterStatus] = useState<PopupFilterStatus>('All');
  const [popupSearchQuery, setPopupSearchQuery] = useState('');
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [popupFormData, setPopupFormData] = useState<Partial<Popup>>({
    name: '',
    image: '',
    url: '',
    urlType: 'Internal',
    priority: 0,
    status: 'Draft'
  });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedPopups, setSelectedPopups] = useState<Set<number>>(new Set());

  // Gallery Picker State
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);

  const popupImageInputRef = useRef<HTMLInputElement>(null);

  const handleGallerySelect = (imageUrl: string) => {
    setPopupFormData(p => ({ ...p, image: imageUrl }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Max 2MB.');
      event.target.value = '';
      return;
    }

    try {
      const convertedImage = await convertFileToWebP(file, { quality: 0.82, maxDimension: 2000 });
      setPopupFormData((prev) => ({ ...prev, image: convertedImage }));
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to process image.');
    } finally {
      event.target.value = '';
    }
  };

  const openPopupModal = (popup?: Popup): void => {
    if (popup) {
      setEditingPopup(popup);
      setPopupFormData(popup);
    } else {
      setEditingPopup(null);
      setPopupFormData({
        name: '',
        image: '',
        url: '',
        urlType: 'Internal',
        priority: 0,
        status: 'Draft'
      });
    }
    setIsPopupModalOpen(true);
  };

  const handleSavePopup = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!popupFormData.name || !popupFormData.image) {
      toast.error('Please fill all required fields');
      return;
    }

    const loadingToast = toast.loading('Saving popup...');
    const startTime = Date.now();

    try {
      const popup: Popup = {
        id: editingPopup?.id || Date.now(),
        name: popupFormData.name,
        image: popupFormData.image,
        url: popupFormData.url || '',
        urlType: popupFormData.urlType as 'Internal' | 'External',
        priority: Number(popupFormData.priority),
        status: popupFormData.status as 'Draft' | 'Publish',
        createdAt: editingPopup?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedPopups = editingPopup
        ? (websiteConfiguration.popups || []).map((item) =>
            item.id === editingPopup.id ? popup : item
          )
        : [...(websiteConfiguration.popups || []), popup];

      const updatedConfig = { ...websiteConfiguration, popups: updatedPopups };

      if (onUpdateWebsiteConfig) {
        await onUpdateWebsiteConfig(updatedConfig);
      }

      setWebsiteConfiguration(updatedConfig);
      hasUnsavedChangesRef.current = false;
      prevWebsiteConfigRef.current = updatedConfig;
      lastSaveTimestampRef.current = Date.now();

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      toast.success(editingPopup ? 'Popup updated successfully!' : 'Popup added successfully!');
      setIsPopupModalOpen(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Popup save failed:', error);
      toast.error('Failed to save popup');
    }
  };

  const handleDeletePopup = async (popupId: number): Promise<void> => {
    if (confirm('Delete popup?')) {
      const loadingToast = toast.loading('Deleting popup...');
      const startTime = Date.now();

      try {
        const updatedConfig = {
          ...websiteConfiguration,
          popups: (websiteConfiguration.popups || []).filter((item) => item.id !== popupId)
        };

        if (onUpdateWebsiteConfig) {
          await onUpdateWebsiteConfig(updatedConfig);
        }

        setWebsiteConfiguration(updatedConfig);
        hasUnsavedChangesRef.current = false;
        prevWebsiteConfigRef.current = updatedConfig;
        lastSaveTimestampRef.current = Date.now();

        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
        }

        toast.dismiss(loadingToast);
        toast.success('Popup deleted successfully!');
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Delete failed:', error);
        toast.error('Failed to delete popup');
      }
    }
  };

  const handleTogglePopupStatus = async (popup: Popup): Promise<void> => {
    const loadingToast = toast.loading('Updating status...');
    const startTime = Date.now();

    try {
      const newStatus: 'Publish' | 'Draft' = popup.status === 'Draft' ? 'Publish' : 'Draft';
      const updatedPopups = (websiteConfiguration.popups || []).map((item) =>
        item.id === popup.id
          ? {
              ...item,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          : item
      );

      const updatedConfig = { ...websiteConfiguration, popups: updatedPopups };

      if (onUpdateWebsiteConfig) {
        await onUpdateWebsiteConfig(updatedConfig);
      }

      setWebsiteConfiguration(updatedConfig);
      hasUnsavedChangesRef.current = false;
      prevWebsiteConfigRef.current = updatedConfig;
      lastSaveTimestampRef.current = Date.now();

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      toast.success('Status updated!');
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Status update failed:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredPopups = (websiteConfiguration.popups || []).filter(
    (popup) =>
      (popupFilterStatus === 'All' || popup.status === popupFilterStatus) &&
      popup.name.toLowerCase().includes(popupSearchQuery.toLowerCase())
  );

  const toggleSelectPopup = (popupId: number) => {
    const newSelected = new Set(selectedPopups);
    if (newSelected.has(popupId)) {
      newSelected.delete(popupId);
    } else {
      newSelected.add(popupId);
    }
    setSelectedPopups(newSelected);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get currently selected/hovered popup for preview
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(filteredPopups[0] || null);

  // Auto-select first popup for preview when list changes
  useEffect(() => {
    if (filteredPopups.length > 0 && !previewPopup) {
      setPreviewPopup(filteredPopups[0]);
    } else if (filteredPopups.length === 0) {
      setPreviewPopup(null);
    } else if (previewPopup && !filteredPopups.find(p => p.id === previewPopup.id)) {
      setPreviewPopup(filteredPopups[0]);
    }
  }, [filteredPopups]);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-4" style={{ width: '100%' }}>
        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-2 sm:p-3" style={{ ...styles.container, flex: 1, minWidth: 0 }}>
          {/* Header Section */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white m-0">Popup</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 m-0">Create unlimited Popup</p>
            </div>
            <button
              style={styles.createButton}
              onClick={() => openPopupModal()}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Plus size={24} color="white" />
              <span style={styles.createButtonText}>Create Popup</span>
            </button>
          </div>

          {/* Table Section */}
          <div style={styles.tableContainer}>
            {/* Desktop Table */}
          <div className="hidden md:block">
            {/* Table Header */}
            <div style={styles.tableHeader}>
              <div style={styles.tableHeaderCell}>SL</div>
              <div style={styles.tableHeaderCell}></div>
              <div style={styles.tableHeaderCell}>Name</div>
              <div style={styles.tableHeaderCell}>URL</div>
              <div style={styles.tableHeaderCell}>Status</div>
              <div style={styles.tableHeaderCell}>Action</div>
            </div>
            
            {/* Table Body */}
            {filteredPopups.length === 0 ? (
              <div style={styles.emptyState}>No popups found</div>
            ) : (
              filteredPopups.map((popup, index) => (
                <div 
                  key={popup.id} 
                  style={{
                    ...styles.tableRow,
                    cursor: 'pointer',
                    background: previewPopup?.id === popup.id ? '#f0f9ff' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={() => setPreviewPopup(popup)}
                  onMouseEnter={(e) => {
                    if (previewPopup?.id !== popup.id) {
                      e.currentTarget.style.background = '#fafafa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = previewPopup?.id === popup.id ? '#f0f9ff' : 'transparent';
                  }}
                >
                  {/* Checkbox + SL */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedPopups.has(popup.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectPopup(popup.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={styles.checkbox}
                    />
                  </div>
                  <div style={styles.slNumber}>{index + 1}</div>

                  {/* Name with Image */}
                  <div style={styles.productCell}>
                    <div style={styles.productImage}>
                      <img
                        src={normalizeImageUrl(popup.image)}
                        alt={popup.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                    <span style={styles.productName} title={popup.name}>
                      {truncateText(popup.name, 25)}
                    </span>
                  </div>

                  {/* URL */}
                  <div style={styles.urlText} title={popup.url || '-'}>
                    {truncateText(popup.url || '-', 40)}
                  </div>

                  {/* Status Badge */}
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePopupStatus(popup);
                      }}
                      style={{
                        ...styles.statusBadge,
                        ...(popup.status === 'Publish' ? styles.statusPublish : styles.statusDraft),
                      }}
                    >
                      {popup.status}
                    </button>
                  </div>

                  {/* Action Menu */}
                  <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === popup.id ? null : popup.id);
                      }}
                    >
                      <MoreVertical size={20} color="#666" />
                    </button>
                    {openMenuId === popup.id && (
                      <div style={styles.dropdownMenu}>
                        <button
                          style={{ ...styles.dropdownItem }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openPopupModal(popup);
                            setOpenMenuId(null);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Edit size={16} color="#1e90ff" />
                          Edit
                        </button>
                        <button
                          style={{ ...styles.dropdownItem, color: '#dc2626' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePopup(popup.id);
                            setOpenMenuId(null);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={16} color="#dc2626" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredPopups.length === 0 ? (
              <div style={styles.emptyState}>No popups found</div>
            ) : (
              filteredPopups.map((popup, index) => (
                <div key={popup.id} style={styles.mobileCard}>
                  <img
                    src={normalizeImageUrl(popup.image)}
                    alt={popup.name}
                    style={styles.mobileCardImage}
                  />
                  <div style={styles.mobileCardContent}>
                    <div style={styles.mobileCardHeader}>
                      <span style={styles.mobileCardName}>{popup.name}</span>
                      <button
                        onClick={() => handleTogglePopupStatus(popup)}
                        style={{
                          ...styles.statusBadge,
                          ...(popup.status === 'Publish' ? styles.statusPublish : styles.statusDraft),
                        }}
                      >
                        {popup.status}
                      </button>
                    </div>
                    <p style={styles.mobileCardUrl}>{popup.url || 'No URL'}</p>
                    <div style={styles.mobileCardFooter}>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12px', color: '#777' }}>
                        #{index + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openPopupModal(popup)}
                          style={{ ...styles.actionButton, background: '#eff6ff', borderRadius: '6px', padding: '6px' }}
                        >
                          <Edit size={16} color="#1e90ff" />
                        </button>
                        <button
                          onClick={() => handleDeletePopup(popup.id)}
                          style={{ ...styles.actionButton, background: '#fef2f2', borderRadius: '6px', padding: '6px' }}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl" style={{
        width: '320px',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '20px',
        height: 'fit-content',
        position: 'sticky',
        top: '20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #eee',
        }}>
          <Eye size={18} color="#1e90ff" />
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            color: '#333',
          }}>Popup Preview</span>
        </div>
        
        {previewPopup ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Preview Image */}
            <div style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#f5f5f5',
              aspectRatio: '1/1',
            }}>
              <img
                src={normalizeImageUrl(previewPopup.image)}
                alt={previewPopup.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Close button simulation */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <X size={14} color="white" />
              </div>
            </div>
            
            {/* Popup Info */}
            <div style={{ padding: '8px 0' }}>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                color: '#333',
                marginBottom: '4px',
              }}>{previewPopup.name}</p>
              
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '12px',
                color: '#666',
                marginBottom: '8px',
              }}>
                {previewPopup.url || 'No URL specified'}
              </p>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 500,
                  ...(previewPopup.status === 'Publish' 
                    ? { background: '#c1ffbc', color: '#085e00' }
                    : { background: '#ffeeba', color: '#856404' }
                  ),
                }}>
                  {previewPopup.status}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#999',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Priority: {previewPopup.priority || 0}
                </span>
              </div>
            </div>
            
            {/* Edit Button */}
            <button
              onClick={() => openPopupModal(previewPopup)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(to right, #38bdf8, #1e90ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              <Edit size={16} />
              Edit Popup
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 16px',
            color: '#999',
          }}>
            <ImageIcon size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '13px',
            }}>Select a popup to preview</p>
          </div>
        )}
      </div>
    </div>

      {/* Popup Modal */}
      {isPopupModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          padding: '16px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eee',
              background: '#f9f9f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{
                fontFamily: "'Lato', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                color: '#023337',
                margin: 0,
              }}>
                {editingPopup ? 'Edit Popup' : 'Add New Popup'}
              </h3>
              <button
                onClick={() => setIsPopupModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} color="#666" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePopup} style={{ padding: '24px' }}>
              {/* Image Upload Section */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '8px',
                }}>
                  Popup Image*
                </label>
                <input
                  type="file"
                  ref={popupImageInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    onClick={() => popupImageInputRef.current?.click()}
                    style={{
                      flex: 1,
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#f9f9f9',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#38bdf8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    {popupFormData.image ? (
                      <img
                        src={normalizeImageUrl(popupFormData.image)}
                        alt=""
                        style={{ height: '100px', margin: '0 auto', objectFit: 'contain', borderRadius: '8px' }}
                      />
                    ) : (
                      <div style={{ color: '#9ca3af' }}>
                        <Upload size={32} style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px' }}>Upload</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGalleryPickerOpen(true)}
                    style={{
                      width: '100px',
                      border: '2px dashed #38bdf8',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1e90ff',
                      cursor: 'pointer',
                      background: '#f0f9ff',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e0f2fe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f0f9ff';
                    }}
                  >
                    <FolderOpen size={24} style={{ marginBottom: '4px' }} />
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 500 }}>Gallery</span>
                  </button>
                </div>
              </div>

              {/* Name and Priority Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '8px',
                  }}>
                    Name*
                  </label>
                  <input
                    type="text"
                    value={popupFormData.name}
                    onChange={e => setPopupFormData({ ...popupFormData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '14px',
                      background: '#f9f9f9',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '8px',
                  }}>
                    Priority
                  </label>
                  <input
                    type="number"
                    value={popupFormData.priority}
                    onChange={e => setPopupFormData({ ...popupFormData, priority: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '14px',
                      background: '#f9f9f9',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* URL and URL Type Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '8px',
                  }}>
                    URL
                  </label>
                  <input
                    type="text"
                    value={popupFormData.url}
                    onChange={e => setPopupFormData({ ...popupFormData, url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '14px',
                      background: '#f9f9f9',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '8px',
                  }}>
                    URL Type
                  </label>
                  <select
                    value={popupFormData.urlType}
                    onChange={e => setPopupFormData({ ...popupFormData, urlType: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '14px',
                      background: '#f9f9f9',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '8px',
                }}>
                  Status
                </label>
                <select
                  value={popupFormData.status}
                  onChange={e => setPopupFormData({ ...popupFormData, status: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '14px',
                    background: '#f9f9f9',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Publish">Publish</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsPopupModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(to right, #38bdf8, #1e90ff)',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 700,
                    fontSize: '14px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Save Popup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal */}
      <GalleryPicker
        isOpen={isGalleryPickerOpen}
        onClose={() => setIsGalleryPickerOpen(false)}
        onSelect={handleGallerySelect}
        title="Choose Popup Image from Gallery"
      />
    </>
  );
};




export default PopupTab;
