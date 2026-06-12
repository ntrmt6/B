import React, { useRef, useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Loader2,
  FolderOpen,
  Eye,
  Smartphone,
  Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CarouselItem, WebsiteConfig, CarouselFilterStatus, ImageUploadType } from './types';
import { STATUS_COLORS } from './constants';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import {
  convertFileToWebP,
  CAROUSEL_WIDTH,
  CAROUSEL_HEIGHT,
  CAROUSEL_MOBILE_WIDTH,
  CAROUSEL_MOBILE_HEIGHT,
} from '../../services/imageUtils';
import { ActionButton } from './shared/TabButton';
import { GalleryPicker } from '../GalleryPicker';

interface CarouselTabProps {
  websiteConfiguration: WebsiteConfig;
  setWebsiteConfiguration: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  tenantId: string;
  onUpdateWebsiteConfig?: (config: WebsiteConfig) => Promise<void>;
  isSavingRef: React.MutableRefObject<boolean>;
  hasUnsavedChangesRef: React.MutableRefObject<boolean>;
  prevWebsiteConfigRef: React.MutableRefObject<WebsiteConfig | null>;
  lastSaveTimestampRef: React.MutableRefObject<number>;
}

export const CarouselTab: React.FC<CarouselTabProps> = ({
  websiteConfiguration,
  setWebsiteConfiguration,
  tenantId,
  onUpdateWebsiteConfig,
  isSavingRef,
  hasUnsavedChangesRef,
  prevWebsiteConfigRef,
  lastSaveTimestampRef
}) => {
  const [carouselFilterStatus, setCarouselFilterStatus] = useState<CarouselFilterStatus>('All');
  const [carouselSearchQuery, setCarouselSearchQuery] = useState('');
  const [isCarouselModalOpen, setIsCarouselModalOpen] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState<CarouselItem | null>(null);
  const [carouselFormData, setCarouselFormData] = useState<Partial<CarouselItem>>({
    name: '',
    image: '',
    mobileImage: '',
    url: '',
    urlType: 'Internal',
    serial: 1,
    status: 'Publish'
  });
  const [isCarouselSaving, setIsCarouselSaving] = useState(false);

  // Gallery Picker State
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState<'carousel' | 'carouselMobile' | null>(null);

  // Preview State
  const [selectedCarousel, setSelectedCarousel] = useState<CarouselItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');

  // Auto-select first carousel when items change
  useEffect(() => {
    const items = websiteConfiguration.carouselItems || [];
    if (!selectedCarousel && items.length > 0) {
      setSelectedCarousel(items[0]);
    }
  }, [websiteConfiguration.carouselItems]);

  // File Input Refs
  const carouselDesktopInputRef = useRef<HTMLInputElement>(null);
  const carouselMobileInputRef = useRef<HTMLInputElement>(null);

  const openGalleryPicker = (target: 'carousel' | 'carouselMobile') => {
    setGalleryPickerTarget(target);
    setIsGalleryPickerOpen(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (!galleryPickerTarget) return;
    
    if (galleryPickerTarget === 'carousel') {
      setCarouselFormData(p => ({ ...p, image: imageUrl }));
    } else if (galleryPickerTarget === 'carouselMobile') {
      setCarouselFormData(p => ({ ...p, mobileImage: imageUrl }));
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'carousel' | 'carouselMobile'
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Max 2MB.');
      event.target.value = '';
      return;
    }

    try {
      const converted = await convertFileToWebP(file, { quality: 0.8, maxDimension: 2000 });
      setCarouselFormData((prev) =>
        imageType === 'carousel'
          ? { ...prev, image: converted }
          : { ...prev, mobileImage: converted }
      );
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to process image.');
    } finally {
      event.target.value = '';
    }
  };

  const openCarouselModal = (carouselItem?: CarouselItem): void => {
    if (carouselItem) {
      setEditingCarousel(carouselItem);
      setCarouselFormData({ ...carouselItem });
    } else {
      setEditingCarousel(null);
      setCarouselFormData({
        name: '',
        image: '',
        mobileImage: '',
        url: '',
        urlType: 'Internal',
        serial: websiteConfiguration.carouselItems.length + 1,
        status: 'Publish'
      });
    }
    setIsCarouselModalOpen(true);
  };

  const handleSaveCarousel = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (isCarouselSaving || !carouselFormData.image) {
      if (!carouselFormData.image) {
        toast.error('Upload desktop banner.');
      }
      return;
    }

    setIsCarouselSaving(true);
    isSavingRef.current = true;
    const startTime = Date.now();

    try {
      const desktopImage = carouselFormData.image || '';
      const mobileImage = carouselFormData.mobileImage || '';

      const carouselItem: CarouselItem = {
        id: editingCarousel?.id || Date.now().toString(),
        name: carouselFormData.name || 'Untitled',
        image: desktopImage,
        mobileImage: mobileImage,
        url: carouselFormData.url || '',
        urlType: (carouselFormData.urlType as 'Internal' | 'External') || 'Internal',
        serial: Number(carouselFormData.serial),
        status: (carouselFormData.status as 'Publish' | 'Draft') || 'Publish',
        subtitle: carouselFormData.subtitle || '',
        title: carouselFormData.name || '',
        imageUrl: desktopImage
      };

      const updatedItems = editingCarousel
        ? websiteConfiguration.carouselItems.map((item) =>
            item.id === editingCarousel.id ? carouselItem : item
          )
        : [...websiteConfiguration.carouselItems, carouselItem];

      const updatedConfig = { ...websiteConfiguration, carouselItems: updatedItems };
      
      toast.loading('Saving carousel...', { id: 'carousel-save' });
      
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

      toast.dismiss('carousel-save');
      toast.success(editingCarousel ? 'Carousel updated successfully!' : 'Carousel added successfully!');
      setIsCarouselModalOpen(false);
    } catch (error) {
      console.error('Carousel save failed:', error);
      toast.error('Failed to save carousel. Please try again.');
    } finally {
      setIsCarouselSaving(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 2000);
    }
  };

  const handleDeleteCarousel = async (carouselId: string): Promise<void> => {
    if (confirm('Delete carousel?')) {
      const loadingToast = toast.loading('Deleting carousel...');
      const startTime = Date.now();
      isSavingRef.current = true;
      
      try {
        const updatedConfig = {
          ...websiteConfiguration,
          carouselItems: websiteConfiguration.carouselItems.filter((item) => item.id !== carouselId)
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
        toast.success('Carousel deleted successfully!');
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Delete failed:', error);
        toast.error('Failed to delete carousel');
      } finally {
        setTimeout(() => {
          isSavingRef.current = false;
        }, 2000);
      }
    }
  };

  const filteredCarouselItems = websiteConfiguration.carouselItems.filter(
    (item) =>
      (carouselFilterStatus === 'All' || item.status === carouselFilterStatus) &&
      item.name.toLowerCase().includes(carouselSearchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex gap-3 sm:gap-4">
        {/* Main Content */}
        <div className="flex-1 space-y-1.5 sm:space-y-2.5">
      {/* Filters and Search */}
      <div className="flex flex-col gap-1.5 sm:gap-2.5">
        {/* Status Filters - Scrollable on mobile */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 overflow-x-auto scrollbar-hide">
          {(['All', 'Publish', 'Draft', 'Trash'] as CarouselFilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setCarouselFilterStatus(status)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                carouselFilterStatus === status
                  ? 'bg-white dark:bg-gray-900 text-green-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
              {status === 'All' ? 'All Data' : status}
              {status === 'All' && (
                 <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-600 px-1.5 rounded-full">
                   {websiteConfiguration.carouselItems.length}
                 </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-green-500"
              value={carouselSearchQuery}
              onChange={(e) => setCarouselSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 to p-2 text-gray-400" size={14} />
          </div>
          <ActionButton
            onClick={() => openCarouselModal()}
            variant="bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white hover:from-[#2BAEE8] hover:to-[#1A7FE8] flex items-center gap-2 justify-center flex-1 sm:flex-none"
          >
            <Plus size={16} />
            <span className="hidden xs:inline">Add</span> Carousel
          </ActionButton>
        </div>
      </div>

      {/* Carousel Table - Mobile Card View / Desktop Table */}
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs uppercase border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-3 py-2 w-10">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Url</th>
                <th className="px-3 py-2">Url Type</th>
                <th className="px-3 py-2">Serial</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCarouselItems.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => setSelectedCarousel(item)}
                  className={`hover:bg-gray-50 group cursor-pointer ${selectedCarousel?.id === item.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                >
                  <td className="px-3 py-2">
                    <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="w-14 h-8 bg-gray-100 rounded border overflow-hidden">
                      {item.image ? (
                        <img
                          src={normalizeImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={14} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-xs truncate">{item.url}</td>
                  <td className="px-3 py-2 text-gray-500">{item.urlType}</td>
                  <td className="px-3 py-2 font-mono">{item.serial}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === 'Publish'
                          ? 'bg-green-100 text-green-700'
                          : STATUS_COLORS.Draft
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => openCarouselModal(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCarousel(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCarouselItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    <ImageIcon size={28} className="mx-auto mb-1 opacity-50" />
                    No carousel items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredCarouselItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ImageIcon size={28} className="mx-auto mb-1 opacity-50" />
              No carousel items found.
            </div>
          ) : (
            filteredCarouselItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedCarousel(item)}
                className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedCarousel?.id === item.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
              >
                <div className="flex gap-2">
                  <div className="w-16 h-10 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={normalizeImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                          item.status === 'Publish'
                            ? 'bg-green-100 text-green-700'
                            : STATUS_COLORS.Draft
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{item.url || 'No URL'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">Serial: {item.serial}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCarouselModal(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCarousel(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-2">
        <span className="text-sm text-gray-600">1 of 1</span>
        <div className="flex border rounded-lg overflow-hidden">
          <button disabled className="px-2 py-1 bg-gray-50 text-gray-400 border-r">
            <ChevronLeft size={16} />
          </button>
          <button disabled className="px-2 py-1 bg-gray-50 text-gray-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      </div>

        {/* Preview Panel */}
        <div className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky to p-4 border rounded-lg shadow-sm bg-white overflow-hidden">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Eye size={16} />
                Preview
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Mobile View"
                >
                  <Smartphone size={16} />
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Desktop View"
                >
                  <Monitor size={16} />
                </button>
              </div>
            </div>
            
            {selectedCarousel ? (
              <div className="p-3">
                {/* Device Frame Preview */}
                <div className={`mx-auto bg-gray-900 rounded-2xl p-1.5 ${previewDevice === 'mobile' ? 'w-44' : 'w-full'}`}>
                  <div className="bg-white rounded-lg overflow-hidden">
                    {/* Browser/Phone Header */}
                    <div className={`bg-gray-100 ${previewDevice === 'mobile' ? 'px-2 py-1' : 'px-2 py-1.5'} flex items-center gap-1`}>
                      {previewDevice === 'mobile' ? (
                        <div className="w-6 h-0.5 bg-gray-300 rounded-full mx-auto"></div>
                      ) : (
                        <>
                          <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                          </div>
                          <div className="flex-1 mx-1">
                            <div className="bg-white rounded px-1.5 py-0.5 text-[6px] text-gray-400 text-center truncate">yourstore.com</div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Mini Store Header */}
                    <div className={`bg-white border-b ${previewDevice === 'mobile' ? 'px-1.5 py-1' : 'px-2 py-1.5'} flex items-center justify-between`}>
                      <div className={`font-bold text-gray-800 ${previewDevice === 'mobile' ? 'text-[6px]' : 'text-[8px]'}`}>🏪 Store</div>
                      <div className="flex gap-1">
                        <div className={`bg-gray-100 rounded ${previewDevice === 'mobile' ? 'w-8 h-2' : 'w-12 h-2.5'}`}></div>
                        <div className={`bg-pink-500 rounded ${previewDevice === 'mobile' ? 'w-3 h-2' : 'w-4 h-2.5'}`}></div>
                      </div>
                    </div>

                    {/* Mini Nav */}
                    <div className={`bg-gray-50 border-b flex gap-1 ${previewDevice === 'mobile' ? 'px-1 py-0.5' : 'px-2 py-1'}`}>
                      {['Home', 'Categories', 'Products'].map(item => (
                        <div key={item} className={`text-gray-500 ${previewDevice === 'mobile' ? 'text-[4px]' : 'text-[6px]'}`}>{item}</div>
                      ))}
                    </div>

                    {/* Carousel Banner Area - Main Content */}
                    <div className={`${previewDevice === 'mobile' ? 'p-1' : 'p-1.5'}`}>
                      {/* Carousel Banner */}
                      <div className="relative">
                        {(() => {
                          const imageUrl = previewDevice === 'mobile' && selectedCarousel.mobileImage 
                            ? selectedCarousel.mobileImage 
                            : selectedCarousel.image;
                          return imageUrl ? (
                            <img
                              src={normalizeImageUrl(imageUrl)}
                              alt={selectedCarousel.name}
                              className={`w-full object-cover rounded ${previewDevice === 'mobile' ? 'h-20' : 'h-24'}`}
                            />
                          ) : (
                            <div className={`w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded flex items-center justify-center ${previewDevice === 'mobile' ? 'h-20' : 'h-24'}`}>
                              <span className={`text-white font-bold ${previewDevice === 'mobile' ? 'text-[8px]' : 'text-xs'}`}>{selectedCarousel.name}</span>
                            </div>
                          );
                        })()}
                        {/* Carousel dots indicator */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                        </div>
                      </div>

                      {/* Categories Row */}
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-semibold text-gray-700 ${previewDevice === 'mobile' ? 'text-[5px]' : 'text-[7px]'}`}>Categories</span>
                          <span className={`text-pink-500 ${previewDevice === 'mobile' ? 'text-[4px]' : 'text-[5px]'}`}>View All →</span>
                        </div>
                        <div className="flex gap-0.5 overflow-hidden">
                          {['🎮', '📱', '💻', '🎧', '⌚'].map((icon, i) => (
                            <div key={i} className={`bg-gray-100 rounded flex items-center justify-center flex-shrink-0 ${previewDevice === 'mobile' ? 'w-5 h-5 text-[8px]' : 'w-6 h-6 text-[10px]'}`}>
                              {icon}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carousel Info */}
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCarousel.status === 'Publish' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedCarousel.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serial:</span>
                    <span className="text-gray-700">{selectedCarousel.serial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">URL Type:</span>
                    <span className="text-gray-700">{selectedCarousel.urlType || 'None'}</span>
                  </div>
                  {selectedCarousel.url && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">URL:</span>
                      <span className="text-gray-700 truncate max-w-[120px]" title={selectedCarousel.url}>{selectedCarousel.url}</span>
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => openCarouselModal(selectedCarousel)}
                  className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Edit Carousel
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a carousel to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carousel Modal */}
      {isCarouselModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0">
              <h3 className="font-bold text-gray-800">{editingCarousel ? 'Edit Carousel' : 'Add New Carousel'}</h3>
              <button onClick={() => setIsCarouselModalOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveCarousel} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desktop Banner*</label>
                <p className="text-xs text-gray-500 mb-2">{CAROUSEL_WIDTH}×{CAROUSEL_HEIGHT}px. Auto WebP.</p>
                <input type="file" ref={carouselDesktopInputRef} onChange={e => handleImageUpload(e, 'carousel')} className="hidden" accept="image/*" />
                <div className="flex gap-2">
                  <div onClick={() => carouselDesktopInputRef.current?.click()} className="flex-1 border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 h-28">
                    {carouselFormData.image ? (
                      <img src={normalizeImageUrl(carouselFormData.image)} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center justify-center h-full">
                        <Upload size={32} className="mb-2" />
                        <p className="text-sm">Upload</p>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => openGalleryPicker('carousel')} className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition">
                    <FolderOpen size={24} className="mb-1" />
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Banner</label>
                <p className="text-xs text-gray-500 mb-2">{CAROUSEL_MOBILE_WIDTH}×{CAROUSEL_MOBILE_HEIGHT}px. Auto WebP.</p>
                <input type="file" ref={carouselMobileInputRef} onChange={e => handleImageUpload(e, 'carouselMobile')} className="hidden" accept="image/*" />
                <div className="flex gap-2">
                  <div onClick={() => carouselMobileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-blue-300 rounded-lg p-2 text-center cursor-pointer hover:bg-blue-50 h-28">
                    {carouselFormData.mobileImage ? (
                      <div className="relative w-full h-full">
                        <img src={normalizeImageUrl(carouselFormData.mobileImage)} alt="" className="w-full h-full object-cover rounded" />
                        <button type="button" onClick={e => { e.stopPropagation(); setCarouselFormData(p => ({ ...p, mobileImage: '' })); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-blue-400 flex flex-col items-center justify-center h-full">
                        <Upload size={32} className="mb-2" />
                        <p className="text-sm">Upload</p>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => openGalleryPicker('carouselMobile')} className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition">
                    <FolderOpen size={24} className="mb-1" />
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.name} onChange={e => setCarouselFormData({ ...carouselFormData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.serial} onChange={e => setCarouselFormData({ ...carouselFormData, serial: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Url</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.url} onChange={e => setCarouselFormData({ ...carouselFormData, url: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Url Type</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.urlType} onChange={e => setCarouselFormData({ ...carouselFormData, urlType: e.target.value as any })}>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.status} onChange={e => setCarouselFormData({ ...carouselFormData, status: e.target.value as any })}>
                  <option value="Publish">Publish</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCarouselModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isCarouselSaving} className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg text-sm font-bold hover:from-[#2BAEE8] hover:to-[#1A7FE8] disabled:opacity-60 flex items-center gap-2">
                  {isCarouselSaving ? <><Loader2 size={16} className="animate-spin" />Saving...</> : 'Save Carousel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal */}
      <GalleryPicker
        isOpen={isGalleryPickerOpen}
        onClose={() => {
          setIsGalleryPickerOpen(false);
          setGalleryPickerTarget(null);
        }}
        onSelect={handleGallerySelect}
        title={`Choose ${galleryPickerTarget === 'carousel' ? 'Desktop Banner' : 'Mobile Banner'} from Gallery`}
      />
    </>
  );
};

export default CarouselTab;
