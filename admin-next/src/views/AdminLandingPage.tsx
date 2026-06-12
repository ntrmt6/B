import React, { useState, useEffect } from 'react';
import { useTenant } from '../hooks/useTenant';
import { OfferPageManager } from '../components/OfferPageManager';
import { OfferPageBuilder } from '../components/OfferPageBuilder';
import { OfferLandingPage } from '../components/OfferLandingPage';
import { CreateLandingPageForm, LandingPageFormData } from '../components/CreateLandingPageForm';
import { DataService, OfferPageResponse, createOfferPage } from '../services/DataService';
import { Product } from '../types';
import { ArrowLeft, X } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'preview';

interface AdminLandingPageProps {
  tenantSubdomain?: string;
  products?: any[];
  landingPages?: any[];
  onCreateLandingPage?: (page: any) => void;
  onUpdateLandingPage?: (page: any) => void;
  onTogglePublish?: (pageId: string, status: string) => void;
  onPreviewLandingPage?: (page: any) => void;
}

const AdminLandingPage: React.FC<AdminLandingPageProps> = ({ tenantSubdomain: propSubdomain = '' }) => {
  const { activeTenantId } = useTenant();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Use the subdomain prop directly - it comes from AdminApp where selectedTenantRecord is available
  const tenantSubdomain = propSubdomain;
  console.log('[AdminLandingPage] Using subdomain from prop:', tenantSubdomain, 'for tenant:', activeTenantId);
  const [editingPage, setEditingPage] = useState<OfferPageResponse | null>(null);
  const [previewPage, setPreviewPage] = useState<OfferPageResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!activeTenantId) return;
      try {
        const data = await DataService.getProducts(activeTenantId);
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };
    fetchProducts();
  }, [activeTenantId]);

  const handleCreateNew = () => {
    setEditingPage(null);
    setViewMode('create');
  };

  const handleEdit = (page: OfferPageResponse) => {
    setEditingPage(page);
    setViewMode('edit');
  };

  const handlePreview = (page: OfferPageResponse) => {
    setPreviewPage(page);
    setViewMode('preview');
  };

  const handleSave = () => {
    setViewMode('list');
    setEditingPage(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateLandingPage = async (data: LandingPageFormData) => {
    try {
      // Validate required fields
      if (!data.productTitle || !data.productTitle.trim()) {
        throw new Error('Product title is required');
      }
      if (!data.imageUrl || !data.imageUrl.trim()) {
        throw new Error('Main image is required');
      }
      if (!data.description || !data.description.trim()) {
        throw new Error('Description is required');
      }

      // Generate URL slug if not provided
      const urlSlug = data.urlSlug?.trim() || 
        data.productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36).slice(-6);

      // Transform data to match the API format
      const pageData = {
        productId: data.productId || undefined,
        productTitle: data.productTitle.trim(),
        searchQuery: '',
        imageUrl: data.imageUrl.trim(),
        offerEndDate: data.offerEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: data.description.trim(),
        productOfferInfo: data.productOfferInfo || '',
        paymentSectionTitle: data.paymentSectionTitle || '',
        whyBuySection: data.whyBuySection || '',
        urlSlug,
        status: data.status,
        benefits: (data.benefits || []).filter(b => b.text?.trim()).map(b => ({ id: b.id, text: b.text.trim() })),
        price: data.price,
        originalPrice: data.originalPrice,
        // Additional fields from the new form
        faqHeadline: data.faqHeadline || '',
        faqs: (data.faqs || []).filter(f => f.question?.trim() && f.answer?.trim()).map(f => ({
          id: f.id,
          question: f.question.trim(),
          answer: f.answer.trim()
        })),
        reviewHeadline: data.reviewHeadline || '',
        reviews: (data.reviews || []).filter(r => r.name?.trim() && r.quote?.trim()).map(r => ({
          id: r.id,
          name: r.name.trim(),
          quote: r.quote.trim(),
          rating: r.rating || 5
        })),
        videoLink: data.videoLink || '',
        productImages: (data.productImages || []).filter(img => img?.trim()),
        backgroundColor: data.backgroundColor || '#FFFFFF',
        textColor: data.textColor || '#000000'
      };
      
      console.log('[AdminLandingPage] Creating page with data:', pageData);
      await createOfferPage(activeTenantId, pageData);
      handleSave();
    } catch (error) {
      console.error('Error creating landing page:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingPage(null);
    setPreviewPage(null);
  };

  if (!activeTenantId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Please select a tenant</p>
      </div>
    );
  }

  // Preview mode - full screen
  if (viewMode === 'preview' && previewPage) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="sticky top-0 z-10 bg-gray-900 text-white p-3 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft size={20} />
            Back to List
          </button>
          <span className="text-sm text-gray-400">Preview Mode</span>
          <button onClick={handleCancel} className="p-2 hover:bg-gray-800 rounded">
            <X size={20} />
          </button>
        </div>
        <OfferLandingPage offerPage={previewPage as any} />
      </div>
    );
  }

  // Create mode - use new CreateLandingPageForm
  if (viewMode === 'create') {
    return (
      <CreateLandingPageForm
        products={products}
        tenantId={activeTenantId}
        onSave={handleCreateLandingPage}
        onCancel={handleCancel}
      />
    );
  }

  // Edit mode - use existing OfferPageBuilder
  if (viewMode === 'edit') {
    return (
      <OfferPageBuilder
        tenantId={activeTenantId}
        products={products}
        editingPage={editingPage}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  // List mode (default)
  return (
    <OfferPageManager
      key={refreshKey}
      tenantId={activeTenantId}
      tenantSubdomain={tenantSubdomain}
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onPreview={handlePreview}
    />
  );
};

export default AdminLandingPage;
