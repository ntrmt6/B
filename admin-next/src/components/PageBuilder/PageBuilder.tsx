import React, { useState, useEffect, useCallback, useMemo, useRef, JSX } from 'react';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { uploadPreparedImageToServer } from '../../services/imageUploadService';
import { getAuthHeader } from '../../services/authService';
import ComponentLibrary from './components/ComponentLibrary';
import { getStoreUrl } from '../../utils/appHelpers';

// Constants
const BROKEN_IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EBroken Image%3C/text%3E%3C/svg%3E';

// Types
type SectionType = 'announcement-bar' | 'header' | 'hero' | 'featured-collection' | 'rich-text' | 'image-with-text' | 'image-banner' | 'slideshow' | 'video' | 'newsletter' | 'collection-list' | 'product-grid' | 'testimonials' | 'contact-form' | 'map' | 'multicolumn' | 'collapsible-content' | 'custom-html' | 'footer' | 'featured-product' | 'blog-posts' | 'brand-list' | 'flash-sale' | 'categories' | 'brands' | 'tags-products' | 'showcaseSection' | 'photo-gallery' | 'video-gallery';
type BlockType = 'heading' | 'text' | 'button' | 'image' | 'link' | 'product' | 'collection' | 'video' | 'icon' | 'price' | 'quantity' | 'divider';

interface Block { id: string; type: BlockType; settings: Record<string, any>; }
interface PlacedSection { id: string; type: SectionType; name: string; visible: boolean; settings: Record<string, any>; blocks: Block[]; }
interface PageBuilderProps { tenantId: string; }

// Icons
const Icons = {
  Monitor: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2"/><path d="M8 21h8M12 17v4" strokeWidth="2"/></svg>,
  Smartphone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2"/><path d="M12 18h.01" strokeWidth="2" strokeLinecap="round"/></svg>,
  Tablet: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2"/><path d="M12 18h.01" strokeWidth="2" strokeLinecap="round"/></svg>,
  Save: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeWidth="2"/><polyline points="17,21 17,13 7,13 7,21" strokeWidth="2"/><polyline points="7,3 7,8 15,8" strokeWidth="2"/></svg>,
  Loader: () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
  Eye: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>,
  EyeOff: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeWidth="2"/><line x1="1" y1="1" x2="23" y2="23" strokeWidth="2"/></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6" strokeWidth="2"/></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="6,9 12,15 18,9" strokeWidth="2"/></svg>,
  GripVertical: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6" strokeWidth="2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2"/></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2"/></svg>,
  Home: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2"/><polyline points="9,22 9,12 15,12 15,22" strokeWidth="2"/></svg>,
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" strokeWidth="2"/><polyline points="12,19 5,12 12,5" strokeWidth="2"/></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"/></svg>,
  Megaphone: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2"/></svg>,
  Layout: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><line x1="3" y1="9" x2="21" y2="9" strokeWidth="2"/></svg>,
  Star: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeWidth="2"/></svg>,
  Grid: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" strokeWidth="2"/></svg>,
  Image: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/><polyline points="21,15 16,10 5,21" strokeWidth="2"/></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="2"/><polyline points="22,6 12,13 2,6" strokeWidth="2"/></svg>,
  Type: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="4,7 4,4 20,4 20,7" strokeWidth="2"/><line x1="9" y1="20" x2="15" y2="20" strokeWidth="2"/><line x1="12" y1="4" x2="12" y2="20" strokeWidth="2"/></svg>,
  Video: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="23,7 16,12 23,17" strokeWidth="2"/><rect x="1" y="5" width="15" height="14" rx="2" strokeWidth="2"/></svg>,
  Message: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeWidth="2"/></svg>,
  Map: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeWidth="2"/><circle cx="12" cy="10" r="3" strokeWidth="2"/></svg>,
  Layers: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="12,2 2,7 12,12 22,7" strokeWidth="2"/><polyline points="2,17 12,22 22,17" strokeWidth="2"/><polyline points="2,12 12,17 22,12" strokeWidth="2"/></svg>,
  Menu: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2"/><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/><line x1="3" y1="18" x2="21" y2="18" strokeWidth="2"/></svg>,
  ShoppingBag: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeWidth="2"/><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/><path d="M16 10a4 4 0 01-8 0" strokeWidth="2"/></svg>,
  FileText: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="2"/><polyline points="14,2 14,8 20,8" strokeWidth="2"/><line x1="16" y1="13" x2="8" y2="13" strokeWidth="2"/><line x1="16" y1="17" x2="8" y2="17" strokeWidth="2"/></svg>,
  Zap: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeWidth="2"/></svg>,
  Tag: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeWidth="2"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2"/></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12" strokeWidth="2"/></svg>,
  Camera: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeWidth="2"/><circle cx="12" cy="13" r="4" strokeWidth="2"/></svg>,
  Film: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2.18" strokeWidth="2"/><line x1="7" y1="2" x2="7" y2="22" strokeWidth="2"/><line x1="17" y1="2" x2="17" y2="22" strokeWidth="2"/><line x1="2" y1="12" x2="22" y2="12" strokeWidth="2"/><line x1="2" y1="7" x2="7" y2="7" strokeWidth="2"/><line x1="2" y1="17" x2="7" y2="17" strokeWidth="2"/><line x1="17" y1="7" x2="22" y2="7" strokeWidth="2"/><line x1="17" y1="17" x2="22" y2="17" strokeWidth="2"/></svg>,
  Palette: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth="2"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" strokeWidth="2"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" strokeWidth="2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" strokeWidth="2"/></svg>,
};

// Section definitions with proper settings for each type
const SECTION_DEFINITIONS: Partial<Record<SectionType, { icon: JSX.Element; label: string; category: 'header' | 'sections' | 'footer'; description: string; allowedBlocks: BlockType[]; defaultSettings: Record<string, any> }>> = {
  'announcement-bar': { icon: <Icons.Megaphone />, label: 'Announcement bar', category: 'header', description: 'Show important announcements', allowedBlocks: ['text', 'link'], defaultSettings: { text: 'Welcome! Free shipping on orders over $50', backgroundColor: '#1a1a2e', textColor: '#ffffff', dismissible: true } },
  'header': { icon: <Icons.Layout />, label: 'Header', category: 'header', description: 'Site header with navigation', allowedBlocks: ['link', 'image'], defaultSettings: { logoText: 'Store', sticky: true, transparent: false, menuStyle: 'horizontal' } },
  'hero': { icon: <Icons.Star />, label: 'Hero banner', category: 'sections', description: 'Full-width hero section', allowedBlocks: ['heading', 'text', 'button', 'image'], defaultSettings: { heading: 'Welcome to Our Store', subheading: 'Discover amazing products', buttonText: 'Shop Now', buttonLink: '/products', imageUrl: '', overlayOpacity: 40, height: 'large', alignment: 'center' } },
  'categories': { icon: <Icons.Grid />, label: 'Categories', category: 'sections', description: 'Display product categories', allowedBlocks: [], defaultSettings: { title: 'Shop by Category', style: 'grid', columns: 4, showSubcategories: true } },
  'featured-collection': { icon: <Icons.Grid />, label: 'Featured collection', category: 'sections', description: 'Showcase products from collection', allowedBlocks: ['heading', 'product'], defaultSettings: { heading: 'Featured Products', collectionId: '', productsToShow: 4, columns: 4, showViewAll: true } },
  'flash-sale': { icon: <Icons.Zap />, label: 'Flash Sale', category: 'sections', description: 'Show flash sale products with countdown', allowedBlocks: [], defaultSettings: { title: 'Flash Deals', showCountdown: true, productsToShow: 8 } },
  'product-grid': { icon: <Icons.ShoppingBag />, label: 'Product grid', category: 'sections', description: 'Grid of products', allowedBlocks: ['product'], defaultSettings: { heading: 'All Products', productsToShow: 12, columns: 4, filterType: 'all', showFilters: false, showSort: false } },
  'brands': { icon: <Icons.Star />, label: 'Brands Section', category: 'sections', description: 'Display brand logos', allowedBlocks: [], defaultSettings: { title: 'Our Brands', style: 'carousel', columns: 6, grayscale: false } },
  'tags-products': { icon: <Icons.Tag />, label: 'Products by Tag', category: 'sections', description: 'Show products filtered by tag', allowedBlocks: [], defaultSettings: { tagName: '', title: 'Tagged Products', productsToShow: 8, columns: 4 } },
  'rich-text': { icon: <Icons.Type />, label: 'Rich text', category: 'sections', description: 'Custom formatted text content', allowedBlocks: ['heading', 'text', 'button'], defaultSettings: { content: 'Add your content here...', textAlign: 'center', backgroundColor: '#ffffff', maxWidth: '800px' } },
  'image-with-text': { icon: <Icons.Image />, label: 'Image with text', category: 'sections', description: 'Image paired with text content', allowedBlocks: ['heading', 'text', 'button', 'image'], defaultSettings: { heading: 'Section Title', text: 'Pair text with an image to focus on your chosen product, collection, or blog post.', imagePosition: 'left', buttonText: 'Learn More', buttonLink: '', imageUrl: '' } },
  'image-banner': { icon: <Icons.Image />, label: 'Image banner', category: 'sections', description: 'Full-width image banner', allowedBlocks: ['heading', 'text', 'button'], defaultSettings: { imageUrl: '', heading: '', subheading: '', buttonText: '', buttonLink: '', height: 'medium', overlayOpacity: 30 } },
  'slideshow': { icon: <Icons.Layers />, label: 'Slideshow', category: 'sections', description: 'Image carousel/slideshow', allowedBlocks: ['image'], defaultSettings: { autoplay: true, autoplaySpeed: 5, showArrows: true, showDots: true, slides: [] } },
  'video': { icon: <Icons.Video />, label: 'Video', category: 'sections', description: 'Embed video content', allowedBlocks: ['heading', 'text'], defaultSettings: { videoUrl: '', autoplay: false, muted: true, loop: true, aspectRatio: '16:9', heading: '' } },
  'newsletter': { icon: <Icons.Mail />, label: 'Newsletter', category: 'sections', description: 'Email signup form', allowedBlocks: ['heading', 'text'], defaultSettings: { heading: 'Subscribe to our newsletter', subheading: 'Get the latest updates and offers.', buttonText: 'Subscribe', backgroundColor: '#f8f9fa', successMessage: 'Thanks for subscribing!' } },
  'collection-list': { icon: <Icons.Grid />, label: 'Collection list', category: 'sections', description: 'Display collections', allowedBlocks: ['collection'], defaultSettings: { heading: 'Shop by Category', columns: 3, imageRatio: 'square' } },
  'testimonials': { icon: <Icons.Message />, label: 'Testimonials', category: 'sections', description: 'Customer reviews/testimonials', allowedBlocks: ['text'], defaultSettings: { heading: 'What Our Customers Say', items: [], autoplay: true, showRatings: true } },
  'contact-form': { icon: <Icons.Mail />, label: 'Contact form', category: 'sections', description: 'Contact form section', allowedBlocks: ['heading', 'text'], defaultSettings: { heading: 'Get in Touch', subheading: 'Have a question? Send us a message.', showPhone: true, showAddress: true, formFields: ['name', 'email', 'message'] } },
  'map': { icon: <Icons.Map />, label: 'Map', category: 'sections', description: 'Embed Google map', allowedBlocks: ['heading', 'text'], defaultSettings: { address: '', heading: 'Visit Us', mapHeight: 400, showMarker: true } },
  'multicolumn': { icon: <Icons.Grid />, label: 'Multicolumn', category: 'sections', description: 'Multi-column content', allowedBlocks: ['heading', 'text', 'image', 'button'], defaultSettings: { heading: '', columns: 3, columnContent: [] } },
  'collapsible-content': { icon: <Icons.Menu />, label: 'Collapsible content', category: 'sections', description: 'FAQ/accordion content', allowedBlocks: ['heading', 'text'], defaultSettings: { heading: 'Frequently Asked Questions', items: [], openFirst: true, allowMultiple: false } },
  'custom-html': { icon: <Icons.FileText />, label: 'Custom HTML', category: 'sections', description: 'Custom HTML code', allowedBlocks: [], defaultSettings: { html: '' } },
  'footer': { icon: <Icons.Layout />, label: 'Footer', category: 'footer', description: 'Site footer', allowedBlocks: ['link', 'text', 'image'], defaultSettings: { showNewsletter: true, showSocial: true, showPaymentIcons: true, copyrightText: '© 2024 Store. All rights reserved.', columns: 4 } },
  'featured-product': { icon: <Icons.Star />, label: 'Featured product', category: 'sections', description: 'Highlight a single product', allowedBlocks: ['heading', 'text', 'button', 'price'], defaultSettings: { productId: '', showQuantity: true, showVariants: true, mediaSize: 'medium' } },
  'blog-posts': { icon: <Icons.FileText />, label: 'Blog posts', category: 'sections', description: 'Display blog posts', allowedBlocks: ['heading'], defaultSettings: { heading: 'Latest Posts', postsToShow: 3, showDate: true, showAuthor: true, showExcerpt: true } },
  'brand-list': { icon: <Icons.Grid />, label: 'Brand list', category: 'sections', description: 'Logo carousel/grid', allowedBlocks: ['image'], defaultSettings: { heading: 'Our Partners', logos: [], columns: 6, grayscale: true } },
  'photo-gallery': { icon: <Icons.Camera />, label: 'Photo Gallery', category: 'sections', description: 'Display a gallery of photos', allowedBlocks: ['image'], defaultSettings: { heading: 'Gallery', columns: 3, gap: 8, imageRadius: '8px', hoverEffect: 'zoom', images: [], aspectRatio: 'square', showCaptions: false, backgroundColor: '#ffffff', padding: '24px', margin: '0px' } },
  'video-gallery': { icon: <Icons.Film />, label: 'Video Gallery', category: 'sections', description: 'Showcase video content', allowedBlocks: ['video'], defaultSettings: { heading: 'Videos', columns: 2, gap: 16, videos: [], autoplay: false, muted: true, backgroundColor: '#f9fafb', padding: '24px', margin: '0px', borderRadius: '12px' } },
  'showcaseSection': { icon: <Icons.Star />, label: 'Showcase', category: 'sections', description: 'Featured product showcase', allowedBlocks: ['heading', 'product'], defaultSettings: { heading: 'Featured Collection', productsToShow: 4, columns: 4, backgroundColor: '#ffffff' } },


};

const BLOCK_DEFINITIONS: Record<BlockType, { icon: JSX.Element; label: string; defaultSettings: Record<string, any> }> = {
  'heading': { icon: <Icons.Type />, label: 'Heading', defaultSettings: { text: 'Heading', size: 'h2' } },
  'text': { icon: <Icons.Type />, label: 'Text', defaultSettings: { text: 'Add your text here', size: 'base' } },
  'button': { icon: <Icons.Plus />, label: 'Button', defaultSettings: { text: 'Click me', link: '', style: 'primary' } },
  'image': { icon: <Icons.Image />, label: 'Image', defaultSettings: { src: '', alt: '', width: 'full' } },
  'link': { icon: <Icons.Plus />, label: 'Link', defaultSettings: { text: 'Link', url: '', newTab: false } },
  'product': { icon: <Icons.ShoppingBag />, label: 'Product', defaultSettings: { productId: '' } },
  'collection': { icon: <Icons.Grid />, label: 'Collection', defaultSettings: { collectionId: '', imageUrl: '', title: '' } },
  'video': { icon: <Icons.Video />, label: 'Video', defaultSettings: { url: '', autoplay: false } },
  'icon': { icon: <Icons.Star />, label: 'Icon', defaultSettings: { name: 'star', size: 24 } },
  'price': { icon: <Icons.ShoppingBag />, label: 'Price', defaultSettings: { showCompare: true, size: 'large' } },
  'quantity': { icon: <Icons.Plus />, label: 'Quantity selector', defaultSettings: { min: 1, max: 99 } },
  'divider': { icon: <Icons.Menu />, label: 'Divider', defaultSettings: { style: 'line', spacing: 'medium' } }
};

// Default store layout template
const getDefaultLayout = (): PlacedSection[] => [
  { id: uuidv4(), type: 'announcement-bar', name: 'Announcement bar', visible: true, settings: SECTION_DEFINITIONS['announcement-bar']!.defaultSettings, blocks: [] },
  { id: uuidv4(), type: 'header', name: 'Header', visible: true, settings: SECTION_DEFINITIONS['header']!.defaultSettings, blocks: [] },
  { id: uuidv4(), type: 'hero', name: 'Hero banner', visible: true, settings: SECTION_DEFINITIONS['hero']!.defaultSettings, blocks: [] },
  { id: uuidv4(), type: 'categories', name: 'Categories', visible: true, settings: SECTION_DEFINITIONS['categories']!.defaultSettings, blocks: [] },
  { id: uuidv4(), type: 'flash-sale', name: 'Flash Sale', visible: true, settings: SECTION_DEFINITIONS['flash-sale']!.defaultSettings, blocks: [] },
  { id: uuidv4(), type: 'product-grid', name: 'Featured Products', visible: true, settings: { ...SECTION_DEFINITIONS['product-grid']!.defaultSettings, heading: 'Featured Products', filterType: 'featured' }, blocks: [] },
  { id: uuidv4(), type: 'brands', name: 'Brands', visible: true, settings: SECTION_DEFINITIONS['brands']!.defaultSettings, blocks: [] },
  { id: uuidv4(), type: 'product-grid', name: 'All Products', visible: true, settings: { ...SECTION_DEFINITIONS['product-grid']!.defaultSettings, heading: 'All Products', filterType: 'all', productsToShow: 20 }, blocks: [] },
  { id: uuidv4(), type: 'newsletter', name: 'Newsletter', visible: true, settings: SECTION_DEFINITIONS['newsletter']!.defaultSettings, blocks: [] },
  { id: uuidv4(), type: 'footer', name: 'Footer', visible: true, settings: SECTION_DEFINITIONS['footer']!.defaultSettings, blocks: [] }
];

// SortableSectionItem Component
const SortableSectionItem: React.FC<{ 
  section: PlacedSection; 
  isSelected: boolean; 
  isExpanded: boolean; 
  selectedBlockId: string | null; 
  onSelect: () => void; 
  onToggleExpand: () => void; 
  onToggleVisibility: () => void; 
  onDelete: () => void; 
  onSelectBlock: (blockId: string) => void; 
  onAddBlock: () => void 
}> = ({ section, isSelected, isExpanded, selectedBlockId, onSelect, onToggleExpand, onToggleVisibility, onDelete, onSelectBlock, onAddBlock }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const def = SECTION_DEFINITIONS[section.type];
  
  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'} ${!section.visible ? 'opacity-50' : ''}`} onClick={onSelect}>
        <button {...attributes} {...listeners} className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"><Icons.GripVertical /></button>
        <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="p-0.5 text-gray-500 hover:text-gray-700">{isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</button>
        <span className="text-gray-500">{def?.icon}</span>
        <span className="flex-1 text-sm font-medium text-gray-700 truncate">{section.name}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }} className="p-1 text-gray-400 hover:text-gray-600" title={section.visible ? 'Hide' : 'Show'}>{section.visible ? <Icons.Eye /> : <Icons.EyeOff />}</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Icons.Trash /></button>
        </div>
      </div>
      {isExpanded && section.blocks.length > 0 && (
        <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
          {section.blocks.map(block => (
            <div key={block.id} onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm ${selectedBlockId === block.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              {BLOCK_DEFINITIONS[block.type]?.icon}<span>{BLOCK_DEFINITIONS[block.type]?.label}</span>
            </div>
          ))}
        </div>
      )}
      {isExpanded && def?.allowedBlocks && def.allowedBlocks.length > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onAddBlock(); }} className="ml-8 mt-1 flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"><Icons.Plus /><span>Add block</span></button>
      )}
    </div>
  );
};

// Helper to build inline styles from section settings
const buildSectionStyle = (settings: Record<string, any>): React.CSSProperties => {
  const style: React.CSSProperties = {};
  if (settings.padding) style.padding = settings.padding;
  if (settings.paddingTop) style.paddingTop = settings.paddingTop;
  if (settings.paddingBottom) style.paddingBottom = settings.paddingBottom;
  if (settings.paddingLeft) style.paddingLeft = settings.paddingLeft;
  if (settings.paddingRight) style.paddingRight = settings.paddingRight;
  if (settings.margin) style.margin = settings.margin;
  if (settings.marginTop) style.marginTop = settings.marginTop;
  if (settings.marginBottom) style.marginBottom = settings.marginBottom;
  if (settings.backgroundColor) style.backgroundColor = settings.backgroundColor;
  if (settings.textColor) style.color = settings.textColor;
  if (settings.fontSize) style.fontSize = settings.fontSize;
  if (settings.fontWeight) style.fontWeight = settings.fontWeight;
  if (settings.letterSpacing) style.letterSpacing = settings.letterSpacing;
  if (settings.lineHeight) style.lineHeight = settings.lineHeight;
  if (settings.borderRadius) style.borderRadius = settings.borderRadius;
  if (settings.borderWidth) style.borderWidth = settings.borderWidth;
  if (settings.borderColor) { style.borderColor = settings.borderColor; style.borderStyle = 'solid'; }
  if (settings.boxShadow && settings.boxShadow !== 'none') style.boxShadow = settings.boxShadow;
  if (settings.maxWidth) style.maxWidth = settings.maxWidth;
  if (settings.minHeight) style.minHeight = settings.minHeight;
  if (settings.overflow) style.overflow = settings.overflow as any;
  if (settings.textAlign) style.textAlign = settings.textAlign as any;
  return style;
};

// StorePreview Component
const StorePreview: React.FC<{ sections: PlacedSection[]; selectedSectionId: string | null; devicePreview: 'desktop' | 'tablet' | 'mobile'; onSelectSection: (id: string) => void; tenantId?: string; hoverPreviewImage?: string | null }> = ({ sections, selectedSectionId, devicePreview, onSelectSection, tenantId, hoverPreviewImage }) => {
  const deviceWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };
  const visibleSections = sections.filter(s => s.visible);
  
  const renderSection = (section: PlacedSection) => {
    const isSelected = selectedSectionId === section.id;
    const baseClass = `relative transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-blue-200'}`;
    const customStyle = buildSectionStyle(section.settings);
    
    switch (section.type) {
      case 'announcement-bar':
        return <div className={`${baseClass} py-2 px-4 text-center text-sm`} style={{ backgroundColor: section.settings.backgroundColor, color: section.settings.textColor, fontSize: section.settings.fontSize || undefined, ...customStyle }}>{section.settings.text}{section.settings.linkUrl && <span className="ml-2 underline text-xs opacity-80">→</span>}</div>;
      case 'header': {
        const headerStyle: React.CSSProperties = {
          backgroundColor: section.settings.headerBackgroundColor || '#ffffff',
          color: section.settings.headerTextColor || undefined,
          height: section.settings.headerHeight || undefined,
          ...customStyle,
        };
        return (
          <div className={`${baseClass} flex items-center justify-between px-4 sm:px-6 py-4 border-b`} style={headerStyle}>
            <div style={{ fontSize: section.settings.logoFontSize || '20px', fontWeight: 'bold' }}>
              {section.settings.logoImage ? <img src={section.settings.logoImage} alt="Logo" className="h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : section.settings.logoText}
            </div>
            <div className="hidden sm:flex text-sm" style={{ gap: section.settings.navItemSpacing || '20px' }}>
              <span className="opacity-70 hover:opacity-100 transition">Shop</span>
              <span className="opacity-70 hover:opacity-100 transition">About</span>
              <span className="opacity-70 hover:opacity-100 transition">Contact</span>
            </div>
            <div className="flex gap-4">
              {section.settings.showSearch !== false && <Icons.Search />}
              {section.settings.showCart !== false && <Icons.ShoppingBag />}
            </div>
          </div>
        );
      }
      case 'hero': {
        const heroHeight = section.settings.height === 'full' ? 'min-h-[500px] sm:min-h-[600px]' : section.settings.height === 'large' ? 'min-h-[300px] sm:min-h-[400px]' : section.settings.height === 'medium' ? 'min-h-[200px] sm:min-h-[300px]' : 'min-h-[150px] sm:min-h-[200px]';
        const gradientClass = section.settings.bgGradient && section.settings.bgGradient !== 'custom' ? `bg-gradient-to-r ${section.settings.bgGradient}` : '';
        const heroStyle: React.CSSProperties = { ...customStyle };
        if (section.settings.bgGradient === 'custom' && section.settings.bgColor1 && section.settings.bgColor2) {
          heroStyle.background = `linear-gradient(to right, ${section.settings.bgColor1}, ${section.settings.bgColor2})`;
        }
        if (section.settings.imageUrl) {
          heroStyle.backgroundImage = `url(${section.settings.imageUrl})`;
          heroStyle.backgroundSize = 'cover';
          heroStyle.backgroundPosition = 'center';
        }
        const alignment = section.settings.alignment || 'center';
        const textAlignClass = alignment === 'left' ? 'text-left items-start' : alignment === 'right' ? 'text-right items-end' : 'text-center items-center';
        return (
          <div className={`${baseClass} relative ${heroHeight} flex ${textAlignClass} justify-center ${gradientClass} text-white`} style={heroStyle}>
            {section.settings.imageUrl && <div className="absolute inset-0 bg-black" style={{ opacity: (section.settings.overlayOpacity || 40) / 100 }} />}
            <div className={`relative z-10 px-4 sm:px-8 ${alignment === 'center' ? 'text-center' : ''}`}>
              <h1 className="font-bold mb-3" style={{ fontSize: section.settings.headingSize || '32px', color: section.settings.headingColor || 'white' }}>{section.settings.heading}</h1>
              <p className="text-white/80 mb-4" style={{ fontSize: section.settings.subheadingSize || '16px' }}>{section.settings.subheading}</p>
              {section.settings.buttonText && (
                <button className="px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base" style={{
                  backgroundColor: section.settings.buttonBgColor || 'white',
                  color: section.settings.buttonTextColor || '#7c3aed',
                  borderRadius: section.settings.buttonRadius || '8px',
                }}>{section.settings.buttonText}</button>
              )}
            </div>
          </div>
        );
      }
      case 'categories': {
        const cardShapeClass = section.settings.cardShape === 'circle' ? 'rounded-full' : section.settings.cardShape === 'square' ? 'rounded-none' : section.settings.cardShape === 'pill' ? 'rounded-full' : 'rounded-lg';
        const cols = section.settings.columns || 4;
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={customStyle}>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6" style={{ color: section.settings.titleColor }}>{section.settings.title}</h2>
            <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)`, gap: section.settings.gap ? `${section.settings.gap}px` : undefined }}>
              {[1,2,3,4].map(i => (
                <div key={i} className={`${cardShapeClass} p-3 sm:p-4 text-center transition-transform hover:scale-105`} style={{ backgroundColor: section.settings.cardBgColor || '#f3f4f6', color: section.settings.cardTextColor }}>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 ${section.settings.cardShape === 'circle' ? 'rounded-full' : 'rounded-lg'} mx-auto mb-2`} />
                  <span className="text-xs sm:text-sm font-medium">Category {i}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'flash-sale': {
        const gradientClass = section.settings.bgGradient && section.settings.bgGradient !== 'custom' ? `bg-gradient-to-r ${section.settings.bgGradient}` : 'bg-gradient-to-r from-red-500 to-orange-500';
        const flashStyle: React.CSSProperties = { ...customStyle };
        if (section.settings.bgGradient === 'custom' && section.settings.bgColor1 && section.settings.bgColor2) {
          flashStyle.background = `linear-gradient(to right, ${section.settings.bgColor1}, ${section.settings.bgColor2})`;
        }
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6 ${section.settings.bgGradient === 'custom' ? '' : gradientClass}`} style={flashStyle}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: section.settings.titleColor || 'white' }}>{section.settings.title}</h2>
              {section.settings.showCountdown && (
                <div className="text-xs sm:text-sm px-3 py-1 rounded-lg" style={{ backgroundColor: section.settings.countdownBg || 'rgba(255,255,255,0.2)', color: section.settings.countdownColor || 'white' }}>
                  ⏰ 23:59:59
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-lg p-2 sm:p-3" style={{ borderRadius: section.settings.cardStyle === 'minimal' ? '4px' : '8px', boxShadow: section.settings.cardStyle === 'shadow' ? '0 4px 6px rgba(0,0,0,0.1)' : undefined }}>
                  <div className="relative">
                    <div className="bg-gray-100 aspect-square rounded mb-2" />
                    {section.settings.badgeColor && <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] text-white font-bold" style={{ backgroundColor: section.settings.badgeColor }}>SALE</div>}
                  </div>
                  <div className="h-2 sm:h-3 bg-gray-100 rounded w-3/4 mb-1" />
                  <div className="h-2 sm:h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'product-grid': {
        const cols = typeof section.settings.columns === 'string' ? parseInt(section.settings.columns, 10) : section.settings.columns;
        const responsiveColumns = typeof window !== 'undefined' && window.innerWidth < 640 ? Math.min(cols, 2) : cols;
        const gridGap = section.settings.gap ? `${section.settings.gap}px` : undefined;
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={customStyle}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: section.settings.headingColor }}>{section.settings.heading}</h2>
              {section.settings.showViewAll && <span className="text-blue-600 text-sm cursor-pointer hover:underline">View All →</span>}
            </div>
            <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`, gap: gridGap }}>
              {Array(Math.min(section.settings.productsToShow, 8)).fill(0).map((_, i) => (
                <div key={i} className="rounded-lg p-2 sm:p-3 transition-all" style={{
                  backgroundColor: section.settings.cardBgColor || '#f9fafb',
                  borderRadius: section.settings.cardBorderRadius || '8px',
                  boxShadow: section.settings.cardShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' : section.settings.cardShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' : section.settings.cardShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' : undefined,
                }}>
                  <div className="bg-gray-100 aspect-square rounded mb-2" />
                  <div className="h-2 sm:h-3 bg-gray-100 rounded w-3/4 mb-1" />
                  {section.settings.showPrice !== false && <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2 mb-2" />}
                  {section.settings.showAddToCart !== false && <div className="h-6 bg-blue-100 rounded w-full" />}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'brands': {
        const logoSize = section.settings.logoSize || '64px';
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={customStyle}>
            <h2 className="text-base sm:text-lg font-bold text-center mb-4 sm:mb-6" style={{ color: section.settings.titleColor }}>{section.settings.title}</h2>
            <div className="flex justify-center gap-4 sm:gap-8 overflow-x-auto">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="flex items-center justify-center text-gray-400 text-xs flex-shrink-0 transition-all hover:opacity-100" style={{
                  width: logoSize, height: logoSize,
                  backgroundColor: section.settings.logoBgColor || '#f3f4f6',
                  borderRadius: section.settings.logoBorderRadius || '8px',
                  filter: section.settings.grayscale ? 'grayscale(100%)' : undefined,
                }}>B{i}</div>
              ))}
            </div>
          </div>
        );
      }
      case 'tags-products':
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={customStyle}>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold" style={{ color: section.settings.titleColor }}>{section.settings.title || 'Tagged Products'}</h2>
              {section.settings.tagName && (
                <span className="px-2 py-1 text-xs text-white font-medium" style={{
                  backgroundColor: section.settings.tagColor || '#6366f1',
                  borderRadius: section.settings.tagShape === 'pill' ? '20px' : section.settings.tagShape === 'square' ? '2px' : '6px',
                }}>{section.settings.tagName}</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="bg-gray-50 rounded-lg p-2 sm:p-3"><div className="bg-gray-100 aspect-square rounded mb-2" /><div className="h-2 bg-gray-100 rounded w-3/4 mb-1" /><div className="h-2 bg-gray-200 rounded w-1/2" /></div>)}
            </div>
          </div>
        );
      case 'newsletter':
        return (
          <div className={`${baseClass} py-8 sm:py-10 px-4 sm:px-6 text-center`} style={{ backgroundColor: section.settings.backgroundColor, ...customStyle }}>
            <h2 className="text-lg sm:text-xl font-bold mb-2">{section.settings.heading}</h2>
            <p className="text-gray-600 mb-4 text-sm">{section.settings.subheading}</p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
              <input className="flex-1 px-4 py-2 border rounded-lg sm:rounded-l-lg sm:rounded-r-none text-sm" style={{ borderRadius: section.settings.inputBorderRadius || undefined }} placeholder="Enter your email" />
              <button className="px-4 py-2 rounded-lg sm:rounded-r-lg sm:rounded-l-none text-sm" style={{
                backgroundColor: section.settings.buttonBgColor || '#111827',
                color: section.settings.buttonTextColor || 'white',
              }}>{section.settings.buttonText}</button>
            </div>
          </div>
        );
      case 'footer': {
        const footerCols = typeof section.settings.columns === 'string' ? parseInt(section.settings.columns, 10) : (section.settings.columns || 4);
        return (
          <div className={`${baseClass} py-8 sm:py-10 px-4 sm:px-6`} style={{ backgroundColor: section.settings.footerBgColor || '#111827', color: section.settings.footerTextColor || 'white', ...customStyle }}>
            <div className="grid gap-4 sm:gap-6 mb-6" style={{ gridTemplateColumns: `repeat(${footerCols}, 1fr)` }}>
              {Array(footerCols).fill(0).map((_, i) => (
                <div key={i}>
                  <div className="h-3 sm:h-4 rounded w-1/2 mb-3" style={{ backgroundColor: section.settings.footerHeadingColor || 'rgba(255,255,255,0.7)' }} />
                  <div className="space-y-2">
                    {[1,2,3].map(j => <div key={j} className="h-2 sm:h-3 rounded w-3/4" style={{ backgroundColor: section.settings.footerLinkColor || 'rgba(255,255,255,0.3)' }} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs sm:text-sm pt-6 border-t opacity-60" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{section.settings.copyrightText}</div>
          </div>
        );
      }
      case 'image-with-text':
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={customStyle}>
            <div className={`flex flex-col sm:flex-row gap-6 sm:gap-8 items-center ${section.settings.imagePosition === 'right' ? 'sm:flex-row-reverse' : ''}`}>
              <div className="w-full sm:flex-1 bg-gray-200 aspect-video rounded-lg" style={{ borderRadius: section.settings.imageBorderRadius || '8px' }} />
              <div className="w-full sm:flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-3">{section.settings.heading}</h2>
                <p className="text-gray-600 text-sm mb-4">{section.settings.text}</p>
                {section.settings.buttonText && <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: section.settings.buttonBgColor || 'transparent', border: section.settings.buttonBgColor ? 'none' : '1px solid #111827', color: section.settings.buttonBgColor ? 'white' : '#111827' }}>{section.settings.buttonText}</button>}
              </div>
            </div>
          </div>
        );
      case 'testimonials':
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={{ backgroundColor: section.settings.backgroundColor || '#f9fafb', ...customStyle }}>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6" style={{ color: section.settings.headingColor }}>{section.settings.heading}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: section.settings.cardBgColor || 'white' }}>
                  <div className="flex gap-1 mb-3" style={{ color: section.settings.starColor || '#facc15' }}>{[1,2,3,4,5].map(s => <Icons.Star key={s} />)}</div>
                  <p className="text-gray-600 text-sm mb-3">&quot;Amazing product!&quot;</p>
                  <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 rounded-full" /><span className="text-sm font-medium">Customer</span></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'rich-text':
        return <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={{ backgroundColor: section.settings.backgroundColor, textAlign: section.settings.textAlign as any, color: section.settings.textColor, fontSize: section.settings.fontSize, ...customStyle }}><div className="max-w-2xl mx-auto">{section.settings.content}</div></div>;
      case 'custom-html':
        return (
          <div className={`${baseClass} py-4 sm:py-6 px-4 sm:px-6`} style={customStyle}>
            {section.settings.html ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Icons.FileText />
                <p className="text-sm text-gray-500 mt-1">Custom HTML Section</p>
                <p className="text-xs text-gray-400 mt-1 truncate max-w-xs mx-auto">{section.settings.html.substring(0, 100)}{section.settings.html.length > 100 ? '...' : ''}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400">
                <Icons.FileText />
                <p className="text-sm mt-1">Add custom HTML code</p>
              </div>
            )}
          </div>
        );
      case 'photo-gallery': {
        const cols = typeof section.settings.columns === 'string' ? parseInt(section.settings.columns, 10) : (section.settings.columns || 3);
        const images = [section.settings.galleryImage1, section.settings.galleryImage2, section.settings.galleryImage3, section.settings.galleryImage4, section.settings.galleryImage5, section.settings.galleryImage6].filter(Boolean);
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={customStyle}>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6">{section.settings.heading}</h2>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${section.settings.gap || 8}px` }}>
              {(images.length > 0 ? images : [null, null, null, null, null, null]).slice(0, cols * 2).map((img, i) => (
                <div key={i} className={`overflow-hidden transition-transform ${section.settings.hoverEffect === 'zoom' ? 'hover:scale-105' : ''}`} style={{
                  borderRadius: section.settings.imageRadius || '8px',
                  aspectRatio: section.settings.aspectRatio === 'portrait' ? '3/4' : section.settings.aspectRatio === 'landscape' ? '4/3' : section.settings.aspectRatio === 'auto' ? 'auto' : '1/1',
                }}>
                  {img ? (
                    <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = BROKEN_IMAGE_PLACEHOLDER; }} />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center min-h-[80px]">
                      <Icons.Camera />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'video-gallery': {
        const cols = typeof section.settings.columns === 'string' ? parseInt(section.settings.columns, 10) : (section.settings.columns || 2);
        const videos = [section.settings.videoUrl1, section.settings.videoUrl2, section.settings.videoUrl3].filter(Boolean);
        return (
          <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6`} style={{ backgroundColor: section.settings.backgroundColor, ...customStyle }}>
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6">{section.settings.heading}</h2>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${section.settings.gap || 16}px` }}>
              {(videos.length > 0 ? videos : [null, null]).map((url, i) => (
                <div key={i} className="overflow-hidden aspect-video" style={{ borderRadius: section.settings.borderRadius || '12px' }}>
                  {url ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                      <div className="text-center">
                        <Icons.Video />
                        <p className="text-xs mt-1 opacity-60 truncate max-w-[120px]">{url}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Icons.Film />
                        <p className="text-xs mt-1">Add video URL</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return <div className={`${baseClass} py-6 sm:py-8 px-4 sm:px-6 bg-gray-50 text-center`} style={customStyle}><div className="text-gray-400">{SECTION_DEFINITIONS[section.type]?.icon}</div><p className="text-gray-500 mt-2 text-sm">{section.name}</p></div>;
    }
  };
  
  return (
    <main className="flex-1 bg-gray-100 overflow-auto p-2 sm:p-4 relative">
      <div className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all" style={{ maxWidth: deviceWidths[devicePreview], minHeight: 'calc(100vh - 140px)' }}>
        {visibleSections.map(section => <div key={section.id} onClick={() => onSelectSection(section.id)}>{renderSection(section)}</div>)}
        {visibleSections.length === 0 && <div className="flex flex-col items-center justify-center h-96 text-gray-400 p-4"><Icons.Layers /><p className="mt-4 text-center text-sm sm:text-base">Add sections to build your page</p></div>}
      </div>
      {hoverPreviewImage && <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"><div className="bg-white rounded-xl shadow-2xl border-4 border-indigo-500 overflow-hidden max-w-2xl max-h-[80vh]"><img src={hoverPreviewImage} alt="Style Preview" className="w-full h-auto object-contain" /></div></div>}
    </main>
  );
};

// Standalone Field Component (outside SectionSettings to prevent focus loss)
const SettingsField: React.FC<{
  label: string;
  name: string;
  value: any;
  type?: string;
  options?: { value: string; label: string }[];
  onChange: (name: string, value: any) => void;
  tenantId?: string;
}> = React.memo(({ label, name, value, type = 'text', options, onChange, tenantId }) => {
  const handleChange = (newVal: any) => onChange(name, newVal);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  
  // Only stop propagation for click and mousedown to prevent selection issues
  // Do NOT stop propagation for onFocus - it causes focus loss
  const stopEvents = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    setUploading(true);
    try {
      const imageUrl = await uploadPreparedImageToServer(file, tenantId, 'gallery');
      handleChange(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to upload image: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };
  
  if (type === 'image' || type === 'imageUrl') {
    return (
      <div className="mb-3">
        <label className="text-sm text-gray-700 block mb-1">{label}</label>
        <div className="space-y-2">
          {value && (
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={value} 
                alt={label} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = BROKEN_IMAGE_PLACEHOLDER;
                }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleChange(''); }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                type="button"
                title="Remove image"
              >
                <Icons.X />
              </button>
            </div>
          )}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter image URL or upload below"
            {...stopEvents}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={uploading || !tenantId}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              type="button"
              title={!tenantId ? 'Tenant ID required for upload' : 'Upload an image from your computer'}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }
  
  if (type === 'video' || type === 'videoUrl') {
    return (
      <div className="mb-3">
        <label className="text-sm text-gray-700 block mb-1">{label}</label>
        <div className="space-y-2">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter YouTube or Vimeo URL"
            {...stopEvents}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          />
          {value && (
            <div className="text-xs text-gray-500 mt-1">
              <p>✓ Video URL added</p>
              <p className="truncate">{value}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (type === 'select' && options) {
    return (
      <div className="mb-3">
        <label className="text-sm text-gray-700 block mb-1">{label}</label>
        <select value={value || ''} onChange={(e) => handleChange(e.target.value)} {...stopEvents} className="w-full px-3 py-2 text-sm border rounded-lg">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  
  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => handleChange(e.target.checked)} {...stopEvents} className="rounded" />
        {label}
      </label>
    );
  }
  
  if (type === 'color') {
    return (
      <div className="mb-3">
        <label className="text-sm text-gray-700 block mb-1">{label}</label>
        <div className="flex gap-2">
          <input type="color" value={value || "#000000"} onChange={(e) => handleChange(e.target.value)} {...stopEvents} className="w-10 h-10 rounded cursor-pointer border-0" />
          <input type="text" value={value || ''} onChange={(e) => handleChange(e.target.value)} {...stopEvents} className="flex-1 px-3 py-2 text-sm border rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (type === 'number') {
    return (
      <div className="mb-3">
        <label className="text-sm text-gray-700 block mb-1">{label}</label>
        <input type="number" value={value || 0} onChange={(e) => handleChange(parseInt(e.target.value) || 0)} {...stopEvents} className="w-full px-3 py-2 text-sm border rounded-lg" />
      </div>
    );
  }
  
  if (type === 'textarea') {
    return (
      <div className="mb-3">
        <label className="text-sm text-gray-700 block mb-1">{label}</label>
        <textarea value={value || ''} onChange={(e) => handleChange(e.target.value)} {...stopEvents} rows={4} className="w-full px-3 py-2 text-sm border rounded-lg resize-none" />
      </div>
    );
  }
  
  return (
    <div className="mb-3">
      <label className="text-sm text-gray-700 block mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={(e) => handleChange(e.target.value)} {...stopEvents} className="w-full px-3 py-2 text-sm border rounded-lg" />
    </div>
  );
});

// DesignControls - Universal styling controls for all sections
const DesignControls: React.FC<{
  settings: Record<string, any>;
  onChange: (name: string, value: any) => void;
  tenantId: string;
}> = React.memo(({ settings, onChange, tenantId }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>('spacing');
  
  const DesignGroup: React.FC<{ title: string; groupKey: string; icon: JSX.Element; children: React.ReactNode }> = ({ title, groupKey, icon, children }) => (
    <div className="border border-gray-100 rounded-lg mb-2 overflow-hidden">
      <button 
        onClick={(e) => { e.stopPropagation(); setExpandedGroup(expandedGroup === groupKey ? null : groupKey); }}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <span className="text-gray-400">{icon}</span>
        <span className="flex-1 text-left">{title}</span>
        {expandedGroup === groupKey ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
      </button>
      {expandedGroup === groupKey && <div className="px-3 pb-3 border-t border-gray-50">{children}</div>}
    </div>
  );
  
  return (
    <div className="space-y-1">
      <DesignGroup title="Spacing" groupKey="spacing" icon={<Icons.Layout />}>
        <SettingsField label="Padding" name="padding" value={settings.padding} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Padding Top" name="paddingTop" value={settings.paddingTop} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Padding Bottom" name="paddingBottom" value={settings.paddingBottom} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Padding Left" name="paddingLeft" value={settings.paddingLeft} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Padding Right" name="paddingRight" value={settings.paddingRight} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Margin" name="margin" value={settings.margin} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Margin Top" name="marginTop" value={settings.marginTop} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Margin Bottom" name="marginBottom" value={settings.marginBottom} type="text" onChange={onChange} tenantId={tenantId} />
      </DesignGroup>
      
      <DesignGroup title="Colors" groupKey="colors" icon={<Icons.Palette />}>
        <SettingsField label="Background Color" name="backgroundColor" value={settings.backgroundColor} type="color" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Text Color" name="textColor" value={settings.textColor} type="color" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Background Gradient" name="backgroundGradient" value={settings.backgroundGradient} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Overlay Color" name="overlayColor" value={settings.overlayColor} type="color" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Overlay Opacity" name="overlayOpacity" value={settings.overlayOpacity} type="number" onChange={onChange} tenantId={tenantId} />
      </DesignGroup>
      
      <DesignGroup title="Typography" groupKey="typography" icon={<Icons.Type />}>
        <SettingsField label="Font Size" name="fontSize" value={settings.fontSize} type="select" options={[{ value: '12px', label: 'Extra Small (12px)' }, { value: '14px', label: 'Small (14px)' }, { value: '16px', label: 'Base (16px)' }, { value: '18px', label: 'Medium (18px)' }, { value: '20px', label: 'Large (20px)' }, { value: '24px', label: 'XL (24px)' }, { value: '32px', label: '2XL (32px)' }, { value: '40px', label: '3XL (40px)' }, { value: '48px', label: '4XL (48px)' }]} onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Font Weight" name="fontWeight" value={settings.fontWeight} type="select" options={[{ value: '300', label: 'Light' }, { value: '400', label: 'Normal' }, { value: '500', label: 'Medium' }, { value: '600', label: 'Semi Bold' }, { value: '700', label: 'Bold' }, { value: '800', label: 'Extra Bold' }]} onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Text Align" name="textAlign" value={settings.textAlign} type="select" options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Letter Spacing" name="letterSpacing" value={settings.letterSpacing} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Line Height" name="lineHeight" value={settings.lineHeight} type="text" onChange={onChange} tenantId={tenantId} />
      </DesignGroup>
      
      <DesignGroup title="Border & Shadow" groupKey="border" icon={<Icons.Grid />}>
        <SettingsField label="Border Radius" name="borderRadius" value={settings.borderRadius} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Border Width" name="borderWidth" value={settings.borderWidth} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Border Color" name="borderColor" value={settings.borderColor} type="color" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Box Shadow" name="boxShadow" value={settings.boxShadow} type="select" options={[{ value: 'none', label: 'None' }, { value: '0 1px 3px rgba(0,0,0,0.12)', label: 'Small' }, { value: '0 4px 6px rgba(0,0,0,0.1)', label: 'Medium' }, { value: '0 10px 15px rgba(0,0,0,0.1)', label: 'Large' }, { value: '0 20px 25px rgba(0,0,0,0.15)', label: 'Extra Large' }]} onChange={onChange} tenantId={tenantId} />
      </DesignGroup>
      
      <DesignGroup title="Animation" groupKey="animation" icon={<Icons.Zap />}>
        <SettingsField label="Animation" name="animation" value={settings.animation} type="select" options={[{ value: 'none', label: 'None' }, { value: 'fadeIn', label: 'Fade In' }, { value: 'slideUp', label: 'Slide Up' }, { value: 'slideDown', label: 'Slide Down' }, { value: 'slideLeft', label: 'Slide Left' }, { value: 'slideRight', label: 'Slide Right' }, { value: 'zoomIn', label: 'Zoom In' }, { value: 'bounce', label: 'Bounce' }, { value: 'pulse', label: 'Pulse' }]} onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Animation Duration" name="animationDuration" value={settings.animationDuration} type="select" options={[{ value: '0.2s', label: 'Fast (0.2s)' }, { value: '0.5s', label: 'Normal (0.5s)' }, { value: '1s', label: 'Slow (1s)' }, { value: '2s', label: 'Very Slow (2s)' }]} onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Hover Effect" name="hoverEffect" value={settings.hoverEffect} type="select" options={[{ value: 'none', label: 'None' }, { value: 'zoom', label: 'Zoom' }, { value: 'lift', label: 'Lift Up' }, { value: 'glow', label: 'Glow' }, { value: 'darken', label: 'Darken' }, { value: 'brighten', label: 'Brighten' }]} onChange={onChange} tenantId={tenantId} />
      </DesignGroup>
      
      <DesignGroup title="Layout" groupKey="layout" icon={<Icons.Layers />}>
        <SettingsField label="Width" name="maxWidth" value={settings.maxWidth} type="select" options={[{ value: '100%', label: 'Full Width' }, { value: '1400px', label: 'Extra Wide (1400px)' }, { value: '1200px', label: 'Wide (1200px)' }, { value: '1024px', label: 'Medium (1024px)' }, { value: '800px', label: 'Narrow (800px)' }, { value: '640px', label: 'Compact (640px)' }]} onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Min Height" name="minHeight" value={settings.minHeight} type="text" onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Overflow" name="overflow" value={settings.overflow} type="select" options={[{ value: 'visible', label: 'Visible' }, { value: 'hidden', label: 'Hidden' }, { value: 'auto', label: 'Auto' }]} onChange={onChange} tenantId={tenantId} />
        <SettingsField label="Display" name="sectionDisplay" value={settings.sectionDisplay} type="select" options={[{ value: 'block', label: 'Block' }, { value: 'flex', label: 'Flexbox' }, { value: 'grid', label: 'Grid' }]} onChange={onChange} tenantId={tenantId} />
      </DesignGroup>
    </div>
  );
});

// SectionSettings Component
const SectionSettings: React.FC<{ section: PlacedSection; onUpdate: (settings: Record<string, any>) => void; tenantId: string }> = ({ section, onUpdate, tenantId }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  // Use refs to avoid re-creating callback on every settings change
  const sectionRef = useRef(section);
  const onUpdateRef = useRef(onUpdate);
  
  // Keep refs updated - runs when section or onUpdate changes
  useEffect(() => {
    sectionRef.current = section;
    onUpdateRef.current = onUpdate;
  }, [section, onUpdate]);
  
  // Stable callback that doesn't change between renders
  const handleFieldChange = useCallback((name: string, value: any) => {
    onUpdateRef.current({ ...sectionRef.current.settings, [name]: value });
  }, []); // Empty deps - callback is stable
  
  const renderFields = () => {
    switch (section.type) {
      case 'announcement-bar': return <>
        <SettingsField key="text" label="Text" name="text" value={section.settings.text} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="backgroundColor" label="Background Color" name="backgroundColor" value={section.settings.backgroundColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="textColor" label="Text Color" name="textColor" value={section.settings.textColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="fontSize-ann" label="Font Size" name="fontSize" value={section.settings.fontSize} type="select" options={[{ value: '12px', label: 'Small' }, { value: '14px', label: 'Medium' }, { value: '16px', label: 'Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="dismissible" label="Dismissible" name="dismissible" value={section.settings.dismissible} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="link-ann" label="Link URL" name="linkUrl" value={section.settings.linkUrl} type="text" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'header': return <>
        <SettingsField key="logoText" label="Logo Text" name="logoText" value={section.settings.logoText} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="logoImage" label="Logo Image" name="logoImage" value={section.settings.logoImage} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headerBg" label="Background Color" name="headerBackgroundColor" value={section.settings.headerBackgroundColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headerText" label="Text Color" name="headerTextColor" value={section.settings.headerTextColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headerFontSize" label="Logo Font Size" name="logoFontSize" value={section.settings.logoFontSize} type="select" options={[{ value: '16px', label: 'Small' }, { value: '20px', label: 'Medium' }, { value: '24px', label: 'Large' }, { value: '28px', label: 'X-Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headerHeight" label="Header Height" name="headerHeight" value={section.settings.headerHeight} type="select" options={[{ value: '48px', label: 'Compact' }, { value: '64px', label: 'Normal' }, { value: '80px', label: 'Tall' }, { value: '96px', label: 'Extra Tall' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="sticky" label="Sticky Header" name="sticky" value={section.settings.sticky} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="transparent" label="Transparent" name="transparent" value={section.settings.transparent} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showSearch" label="Show Search" name="showSearch" value={section.settings.showSearch !== false} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showCart" label="Show Cart Icon" name="showCart" value={section.settings.showCart !== false} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="menuStyle" label="Navigation Style" name="menuStyle" value={section.settings.menuStyle} type="select" options={[{ value: 'horizontal', label: 'Horizontal' }, { value: 'dropdown', label: 'Dropdown' }, { value: 'mega', label: 'Mega Menu' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="navItemSpacing" label="Nav Item Spacing" name="navItemSpacing" value={section.settings.navItemSpacing} type="select" options={[{ value: '12px', label: 'Compact' }, { value: '20px', label: 'Normal' }, { value: '32px', label: 'Spacious' }]} onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'hero': return <>
        <SettingsField key="heading" label="Heading" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headingSize" label="Heading Size" name="headingSize" value={section.settings.headingSize} type="select" options={[{ value: '24px', label: 'Small' }, { value: '32px', label: 'Medium' }, { value: '40px', label: 'Large' }, { value: '48px', label: 'X-Large' }, { value: '56px', label: '2X-Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headingColor" label="Heading Color" name="headingColor" value={section.settings.headingColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="subheading" label="Subheading" name="subheading" value={section.settings.subheading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="subheadingSize" label="Subheading Size" name="subheadingSize" value={section.settings.subheadingSize} type="select" options={[{ value: '14px', label: 'Small' }, { value: '16px', label: 'Medium' }, { value: '18px', label: 'Large' }, { value: '22px', label: 'X-Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonText" label="Button Text" name="buttonText" value={section.settings.buttonText} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonLink" label="Button Link" name="buttonLink" value={section.settings.buttonLink} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonBgColor" label="Button Color" name="buttonBgColor" value={section.settings.buttonBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonTextColor" label="Button Text Color" name="buttonTextColor" value={section.settings.buttonTextColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonRadius" label="Button Border Radius" name="buttonRadius" value={section.settings.buttonRadius} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="imageUrl" label="Background Image" name="imageUrl" value={section.settings.imageUrl} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="bgGradient" label="Background Gradient" name="bgGradient" value={section.settings.bgGradient} type="select" options={[{ value: 'from-purple-600 to-blue-600', label: 'Purple → Blue' }, { value: 'from-green-400 to-blue-500', label: 'Green → Blue' }, { value: 'from-pink-500 to-yellow-500', label: 'Pink → Yellow' }, { value: 'from-gray-900 to-gray-600', label: 'Dark Gradient' }, { value: 'from-indigo-500 to-purple-600', label: 'Indigo → Purple' }, { value: 'from-red-500 to-orange-500', label: 'Red → Orange' }, { value: 'custom', label: 'Custom Colors' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="bgColor1" label="Gradient Start Color" name="bgColor1" value={section.settings.bgColor1} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="bgColor2" label="Gradient End Color" name="bgColor2" value={section.settings.bgColor2} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="height" label="Height" name="height" value={section.settings.height} type="select" options={[{ value: 'small', label: 'Small (200px)' }, { value: 'medium', label: 'Medium (350px)' }, { value: 'large', label: 'Large (500px)' }, { value: 'full', label: 'Full Screen' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="alignment" label="Content Alignment" name="alignment" value={section.settings.alignment} type="select" options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="overlayOpacity" label="Overlay Opacity (%)" name="overlayOpacity" value={section.settings.overlayOpacity} type="number" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'categories': return <>
        <SettingsField key="title" label="Title" name="title" value={section.settings.title} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="titleColor" label="Title Color" name="titleColor" value={section.settings.titleColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="style" label="Layout Style" name="style" value={section.settings.style} type="select" options={[{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' }, { value: 'list', label: 'List' }, { value: 'circular', label: 'Circular Icons' }, { value: 'cards', label: 'Cards with Image' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardShape" label="Card Shape" name="cardShape" value={section.settings.cardShape} type="select" options={[{ value: 'rounded', label: 'Rounded' }, { value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'pill', label: 'Pill' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardBgColor" label="Card Background" name="cardBgColor" value={section.settings.cardBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardTextColor" label="Card Text Color" name="cardTextColor" value={section.settings.cardTextColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="gap" label="Gap (px)" name="gap" value={section.settings.gap} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showSubcategories" label="Show Subcategories" name="showSubcategories" value={section.settings.showSubcategories} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="catAnimation" label="Animation" name="animation" value={section.settings.animation} type="select" options={[{ value: 'none', label: 'None' }, { value: 'fadeIn', label: 'Fade In' }, { value: 'slideUp', label: 'Slide Up' }, { value: 'zoomIn', label: 'Zoom In' }]} onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'flash-sale': return <>
        <SettingsField key="title" label="Title" name="title" value={section.settings.title} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="titleColor" label="Title Color" name="titleColor" value={section.settings.titleColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="bgGradient" label="Background Gradient" name="bgGradient" value={section.settings.bgGradient} type="select" options={[{ value: 'from-red-500 to-orange-500', label: 'Red → Orange' }, { value: 'from-purple-600 to-pink-500', label: 'Purple → Pink' }, { value: 'from-blue-600 to-cyan-500', label: 'Blue → Cyan' }, { value: 'from-green-500 to-emerald-500', label: 'Green' }, { value: 'from-gray-900 to-gray-700', label: 'Dark' }, { value: 'custom', label: 'Custom' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="bgColor1" label="Gradient Start" name="bgColor1" value={section.settings.bgColor1} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="bgColor2" label="Gradient End" name="bgColor2" value={section.settings.bgColor2} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showCountdown" label="Show Countdown" name="showCountdown" value={section.settings.showCountdown} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="countdownBg" label="Countdown Background" name="countdownBg" value={section.settings.countdownBg} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="countdownColor" label="Countdown Text Color" name="countdownColor" value={section.settings.countdownColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="productsToShow" label="Products to Show" name="productsToShow" value={section.settings.productsToShow} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns || 4} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardStyle" label="Card Style" name="cardStyle" value={section.settings.cardStyle} type="select" options={[{ value: 'default', label: 'Default' }, { value: 'minimal', label: 'Minimal' }, { value: 'shadow', label: 'Shadow' }, { value: 'bordered', label: 'Bordered' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="badgeColor" label="Sale Badge Color" name="badgeColor" value={section.settings.badgeColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'product-grid': return <>
        <SettingsField key="heading" label="Heading" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headingColor" label="Heading Color" name="headingColor" value={section.settings.headingColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="productsToShow" label="Products to Show" name="productsToShow" value={section.settings.productsToShow} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns} type="select" options={[{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }, { value: '5', label: '5 Columns' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="filterType" label="Filter Type" name="filterType" value={section.settings.filterType} type="select" options={[{ value: 'all', label: 'All Products' }, { value: 'featured', label: 'Featured Only' }, { value: 'bestseller', label: 'Best Sellers' }, { value: 'new', label: 'New Arrivals' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardBgColor" label="Card Background" name="cardBgColor" value={section.settings.cardBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardBorderRadius" label="Card Border Radius" name="cardBorderRadius" value={section.settings.cardBorderRadius} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardShadow" label="Card Shadow" name="cardShadow" value={section.settings.cardShadow} type="select" options={[{ value: 'none', label: 'None' }, { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardHover" label="Card Hover Effect" name="cardHover" value={section.settings.cardHover} type="select" options={[{ value: 'none', label: 'None' }, { value: 'lift', label: 'Lift' }, { value: 'zoom', label: 'Zoom Image' }, { value: 'shadow', label: 'Grow Shadow' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showPrice" label="Show Price" name="showPrice" value={section.settings.showPrice !== false} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showAddToCart" label="Show Add to Cart" name="showAddToCart" value={section.settings.showAddToCart !== false} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showViewAll" label="Show View All Button" name="showViewAll" value={section.settings.showViewAll} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="gap" label="Grid Gap (px)" name="gap" value={section.settings.gap} type="number" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'brands': return <>
        <SettingsField key="title" label="Title" name="title" value={section.settings.title} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="titleColor" label="Title Color" name="titleColor" value={section.settings.titleColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="style" label="Display Style" name="style" value={section.settings.style} type="select" options={[{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' }, { value: 'marquee', label: 'Marquee (Auto Scroll)' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns || 6} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="logoSize" label="Logo Size" name="logoSize" value={section.settings.logoSize} type="select" options={[{ value: '48px', label: 'Small' }, { value: '64px', label: 'Medium' }, { value: '80px', label: 'Large' }, { value: '96px', label: 'X-Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="logoBgColor" label="Logo Background" name="logoBgColor" value={section.settings.logoBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="logoBorderRadius" label="Logo Border Radius" name="logoBorderRadius" value={section.settings.logoBorderRadius} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="grayscale" label="Grayscale" name="grayscale" value={section.settings.grayscale} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="hoverEffect" label="Hover Effect" name="hoverEffect" value={section.settings.hoverEffect} type="select" options={[{ value: 'none', label: 'None' }, { value: 'color', label: 'Show Color on Hover' }, { value: 'zoom', label: 'Zoom' }, { value: 'lift', label: 'Lift' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="marqueeSpeed" label="Marquee Speed" name="marqueeSpeed" value={section.settings.marqueeSpeed} type="select" options={[{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]} onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'tags-products': return <>
        <SettingsField key="tagName" label="Tag Name" name="tagName" value={section.settings.tagName} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="title" label="Section Title" name="title" value={section.settings.title} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="titleColor" label="Title Color" name="titleColor" value={section.settings.titleColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="productsToShow" label="Products to Show" name="productsToShow" value={section.settings.productsToShow} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="tagShape" label="Tag Badge Shape" name="tagShape" value={section.settings.tagShape} type="select" options={[{ value: 'rounded', label: 'Rounded' }, { value: 'pill', label: 'Pill' }, { value: 'square', label: 'Square' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="tagColor" label="Tag Badge Color" name="tagColor" value={section.settings.tagColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'newsletter': return <>
        <SettingsField key="heading" label="Heading" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="subheading" label="Subheading" name="subheading" value={section.settings.subheading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonText" label="Button Text" name="buttonText" value={section.settings.buttonText} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonBgColor" label="Button Color" name="buttonBgColor" value={section.settings.buttonBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonTextColor" label="Button Text Color" name="buttonTextColor" value={section.settings.buttonTextColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="backgroundColor" label="Background Color" name="backgroundColor" value={section.settings.backgroundColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="inputBorderRadius" label="Input Border Radius" name="inputBorderRadius" value={section.settings.inputBorderRadius} type="text" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'footer': return <>
        <SettingsField key="copyrightText" label="Copyright Text" name="copyrightText" value={section.settings.copyrightText} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="footerBg" label="Background Color" name="footerBgColor" value={section.settings.footerBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="footerText" label="Text Color" name="footerTextColor" value={section.settings.footerTextColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="footerLinkColor" label="Link Color" name="footerLinkColor" value={section.settings.footerLinkColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="footerHeadingColor" label="Heading Color" name="footerHeadingColor" value={section.settings.footerHeadingColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns} type="select" options={[{ value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }, { value: '4', label: '4 Columns' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showNewsletter" label="Show Newsletter" name="showNewsletter" value={section.settings.showNewsletter} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showSocial" label="Show Social Links" name="showSocial" value={section.settings.showSocial} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showPaymentIcons" label="Show Payment Icons" name="showPaymentIcons" value={section.settings.showPaymentIcons} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'image-with-text': return <>
        <SettingsField key="heading" label="Heading" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="text" label="Text" name="text" value={section.settings.text} type="textarea" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="imageUrl" label="Image" name="imageUrl" value={section.settings.imageUrl} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="imagePosition" label="Image Position" name="imagePosition" value={section.settings.imagePosition} type="select" options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="imageBorderRadius" label="Image Border Radius" name="imageBorderRadius" value={section.settings.imageBorderRadius} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonText" label="Button Text" name="buttonText" value={section.settings.buttonText} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonLink" label="Button Link" name="buttonLink" value={section.settings.buttonLink} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonBgColor" label="Button Color" name="buttonBgColor" value={section.settings.buttonBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'image-banner': return <>
        <SettingsField key="imageUrl" label="Banner Image" name="imageUrl" value={section.settings.imageUrl} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="heading" label="Heading" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="subheading" label="Subheading" name="subheading" value={section.settings.subheading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="textColor" label="Text Color" name="textColor" value={section.settings.textColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonText" label="Button Text" name="buttonText" value={section.settings.buttonText} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="buttonLink" label="Button Link" name="buttonLink" value={section.settings.buttonLink} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="height" label="Height" name="height" value={section.settings.height} type="select" options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="overlayOpacity" label="Overlay Opacity (%)" name="overlayOpacity" value={section.settings.overlayOpacity} type="number" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'video': return <>
        <SettingsField key="videoUrl" label="Video URL" name="videoUrl" value={section.settings.videoUrl} type="video" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="heading" label="Heading" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="aspectRatio" label="Aspect Ratio" name="aspectRatio" value={section.settings.aspectRatio} type="select" options={[{ value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: 'Square' }, { value: '9:16', label: 'Portrait' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="autoplay" label="Autoplay" name="autoplay" value={section.settings.autoplay} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="muted" label="Muted" name="muted" value={section.settings.muted} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="loop" label="Loop" name="loop" value={section.settings.loop} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="posterImage" label="Poster Image" name="posterImage" value={section.settings.posterImage} type="image" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'testimonials': return <>
        <SettingsField key="heading" label="Heading" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="headingColor" label="Heading Color" name="headingColor" value={section.settings.headingColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="cardBg" label="Card Background" name="cardBgColor" value={section.settings.cardBgColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="starColor" label="Star Color" name="starColor" value={section.settings.starColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showRatings" label="Show Ratings" name="showRatings" value={section.settings.showRatings} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns || 3} type="number" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'rich-text': return <>
        <SettingsField key="content" label="Content" name="content" value={section.settings.content} type="textarea" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="textAlign" label="Text Align" name="textAlign" value={section.settings.textAlign} type="select" options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="backgroundColor" label="Background Color" name="backgroundColor" value={section.settings.backgroundColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="textColor" label="Text Color" name="textColor" value={section.settings.textColor} type="color" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="fontSize" label="Font Size" name="fontSize" value={section.settings.fontSize} type="select" options={[{ value: '14px', label: 'Small' }, { value: '16px', label: 'Base' }, { value: '18px', label: 'Large' }, { value: '20px', label: 'X-Large' }]} onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'custom-html': return <>
        <SettingsField key="html" label="Custom HTML Code" name="html" value={section.settings.html} type="textarea" onChange={handleFieldChange} tenantId={tenantId} />
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 mb-3">
          <p className="font-medium mb-1">⚠️ HTML Tips</p>
          <p>You can use any valid HTML, including inline styles and CSS classes. Avoid external scripts for security.</p>
        </div>
      </>;
      case 'photo-gallery': return <>
        <SettingsField key="heading" label="Gallery Title" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns} type="select" options={[{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="gap" label="Gap (px)" name="gap" value={section.settings.gap} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="imageRadius" label="Image Border Radius" name="imageRadius" value={section.settings.imageRadius} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="aspectRatio" label="Aspect Ratio" name="aspectRatio" value={section.settings.aspectRatio} type="select" options={[{ value: 'square', label: 'Square' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }, { value: 'auto', label: 'Auto' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="hoverEffect" label="Hover Effect" name="hoverEffect" value={section.settings.hoverEffect} type="select" options={[{ value: 'none', label: 'None' }, { value: 'zoom', label: 'Zoom' }, { value: 'darken', label: 'Darken' }, { value: 'brighten', label: 'Brighten' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="showCaptions" label="Show Captions" name="showCaptions" value={section.settings.showCaptions} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="img1" label="Image 1" name="galleryImage1" value={section.settings.galleryImage1} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="img2" label="Image 2" name="galleryImage2" value={section.settings.galleryImage2} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="img3" label="Image 3" name="galleryImage3" value={section.settings.galleryImage3} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="img4" label="Image 4" name="galleryImage4" value={section.settings.galleryImage4} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="img5" label="Image 5" name="galleryImage5" value={section.settings.galleryImage5} type="image" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="img6" label="Image 6" name="galleryImage6" value={section.settings.galleryImage6} type="image" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      case 'video-gallery': return <>
        <SettingsField key="heading" label="Gallery Title" name="heading" value={section.settings.heading} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="columns" label="Columns" name="columns" value={section.settings.columns} type="select" options={[{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }]} onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="gap" label="Gap (px)" name="gap" value={section.settings.gap} type="number" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="videoRadius" label="Video Border Radius" name="borderRadius" value={section.settings.borderRadius} type="text" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="video1" label="Video 1 URL" name="videoUrl1" value={section.settings.videoUrl1} type="video" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="video2" label="Video 2 URL" name="videoUrl2" value={section.settings.videoUrl2} type="video" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="video3" label="Video 3 URL" name="videoUrl3" value={section.settings.videoUrl3} type="video" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="autoplay" label="Autoplay" name="autoplay" value={section.settings.autoplay} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
        <SettingsField key="muted" label="Muted" name="muted" value={section.settings.muted} type="checkbox" onChange={handleFieldChange} tenantId={tenantId} />
      </>;
      default: return Object.keys(section.settings).filter(key => !['padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'margin', 'marginTop', 'marginBottom', 'borderRadius', 'borderWidth', 'borderColor', 'boxShadow', 'animation', 'animationDuration', 'hoverEffect', 'maxWidth', 'minHeight', 'overflow', 'sectionDisplay', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'backgroundGradient', 'overlayColor'].includes(key)).map(key => <SettingsField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} name={key} value={section.settings[key]} type="text" onChange={handleFieldChange} tenantId={tenantId} />);
    }
  };
  
  return (
    <div>
      {/* Content/Design Tabs */}
      <div className="flex border-b border-gray-200 mb-3">
        <button
          onClick={(e) => { e.stopPropagation(); setActiveTab('content'); }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Content
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setActiveTab('design'); }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'design' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Design
        </button>
      </div>
      {activeTab === 'content' ? renderFields() : <DesignControls settings={section.settings} onChange={handleFieldChange} tenantId={tenantId} />}
    </div>
  );
};

// AddSectionModal Component
const AddSectionModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (type: SectionType) => void; category: 'header' | 'sections' | 'footer' }> = ({ isOpen, onClose, onAdd, category }) => {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;
  
  const filteredSections = (Object.entries(SECTION_DEFINITIONS) as [SectionType, typeof SECTION_DEFINITIONS[SectionType]][])
    .filter(([type, def]) => def && (category === 'sections' ? def.category === 'sections' : def.category === category) && (def.label.toLowerCase().includes(search.toLowerCase()) || def.description.toLowerCase().includes(search.toLowerCase())));
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between"><h2 className="text-lg font-semibold">Add section</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.X /></button></div>
        <div className="p-4 border-b"><div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></div><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} placeholder="Search sections..." className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div></div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredSections.map(([type, def]) => (
            <button key={type} onClick={() => { onAdd(type); onClose(); }} className="flex items-start gap-3 p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600 flex-shrink-0">{def!.icon}</div>
              <div className="min-w-0"><div className="font-medium text-gray-900">{def!.label}</div><div className="text-sm text-gray-500 break-words">{def!.description}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// AddBlockModal Component
const AddBlockModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (type: BlockType) => void; allowedBlocks: BlockType[] }> = ({ isOpen, onClose, onAdd, allowedBlocks }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between"><h2 className="text-lg font-semibold">Add block</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><Icons.X /></button></div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allowedBlocks.map(type => {
            const def = BLOCK_DEFINITIONS[type];
            return <button key={type} onClick={() => { onAdd(type); onClose(); }} className="flex items-center gap-2 p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all">{def.icon}<span className="text-sm font-medium">{def.label}</span></button>;
          })}
        </div>
      </div>
    </div>
  );
};

// Main PageBuilder Component
const PageBuilder: React.FC<PageBuilderProps> = ({ tenantId }) => {
  const [sections, setSections] = useState<PlacedSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addSectionModal, setAddSectionModal] = useState<'header' | 'sections' | 'footer' | null>(null);
  const [addBlockSectionId, setAddBlockSectionId] = useState<string | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  const [componentSearchQuery, setComponentSearchQuery] = useState<string>('');
  const [sidebarTab, setSidebarTab] = useState<'components' | 'sections'>('components');
  const [themeStyles, setThemeStyles] = useState<Record<string, string>>({});
  const [hoverPreviewImage, setHoverPreviewImage] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedBlock = selectedSection?.blocks.find(b => b.id === selectedBlockId);

  // Fetch store layout from API
  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tenant-data/${tenantId}/store_layout`);
        if (res.ok) {
          const result = await res.json();
          if (result.data?.sections && Array.isArray(result.data.sections) && result.data.sections.length > 0) {
            setSections(result.data.sections);
            console.log('[PageBuilder] Loaded layout with', result.data.sections.length, 'sections');
          } else {
            // Use default layout for new stores
            const defaultLayout = getDefaultLayout();
            setSections(defaultLayout);
            console.log('[PageBuilder] Using default layout');
          }
        } else {
          // API returned error, use default layout
          const defaultLayout = getDefaultLayout();
          setSections(defaultLayout);
          console.log('[PageBuilder] API error, using default layout');
        }
      } catch (e) {
        console.error('[PageBuilder] Failed to fetch layout:', e);
        const defaultLayout = getDefaultLayout();
        setSections(defaultLayout);
      }
      setIsLoading(false);
    };
    
    if (tenantId) {
      fetchLayout();
      // Also fetch theme customization
      fetch(`/api/tenant-data/${tenantId}/store_customization`).then(r => r.ok ? r.json() : { data: {} }).then(d => {
        if (d.data) setThemeStyles(d.data);
      }).catch(console.error);
    }
  }, [tenantId]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !isSaving) handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, isSaving]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Save layout to API
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const res = await fetch(`/api/tenant-data/${tenantId}/store_layout`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ data: { sections, updatedAt: new Date().toISOString() } })
      });
      
      if (res.ok) {
        setHasChanges(false);
        setSaveMessage({ type: 'success', text: 'Layout saved! Your store has been updated.' });
        setTimeout(() => setSaveMessage(null), 3000);
        console.log('[PageBuilder] Layout saved successfully');
        // Clear server cache so store reflects changes immediately
        try {
          await fetch(`/api/tenant-data/${tenantId}/clear-cache`, {
            method: 'POST',
            headers: getAuthHeader(),
          });
          console.log('[PageBuilder] Cache cleared after layout save');
        } catch (cacheErr) {
          console.warn('[PageBuilder] Failed to clear cache:', cacheErr);
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch (e) {
      console.error('[PageBuilder] Failed to save:', e);
      setSaveMessage({ type: 'error', text: 'Failed to save layout. Please try again.' });
    }
    
    setIsSaving(false);
  };

  const handleSelectThemeStyle = async (configKey: string, styleValue: string) => {
    setThemeStyles(prev => ({ ...prev, [configKey]: styleValue }));
    try {
      const res = await fetch(`/api/tenant-data/${tenantId}/store_customization`);
      const existing = res.ok ? await res.json() : { data: {} };
      const updated = { ...existing.data, [configKey]: styleValue };
      const saveRes = await fetch(`/api/tenant-data/${tenantId}/store_customization`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ data: updated })
      });
      if (saveRes.ok) {
        toast.success(`${configKey.replace(/Style$/, '').replace(/([A-Z])/g, ' $1').trim()} updated to ${styleValue}`);
        // Clear server cache so store reflects the style change immediately
        try {
          await fetch(`/api/tenant-data/${tenantId}/clear-cache`, {
            method: 'POST',
            headers: getAuthHeader(),
          });
          console.log('[PageBuilder] Cache cleared after style change');
        } catch (cacheErr) {
          console.warn('[PageBuilder] Failed to clear cache:', cacheErr);
        }
      }
    } catch (e) {
      console.error('[PageBuilder] Failed to save theme style:', e);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections(prev => {
        const oldIdx = prev.findIndex(s => s.id === active.id);
        const newIdx = prev.findIndex(s => s.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
      setHasChanges(true);
    }
  };

  const handleAddSection = (type: SectionType) => {
    const def = SECTION_DEFINITIONS[type];
    if (!def) return;
    const newSection: PlacedSection = {
      id: uuidv4(),
      type,
      name: def.label,
      visible: true,
      settings: { ...def.defaultSettings },
      blocks: []
    };
    
    setSections(prev => {
      if (def.category === 'header') {
        const headerIdx = prev.findIndex(s => SECTION_DEFINITIONS[s.type]?.category !== 'header');
        return [...prev.slice(0, headerIdx >= 0 ? headerIdx : prev.length), newSection, ...prev.slice(headerIdx >= 0 ? headerIdx : prev.length)];
      }
      if (def.category === 'footer') return [...prev, newSection];
      const footerIdx = prev.findIndex(s => SECTION_DEFINITIONS[s.type]?.category === 'footer');
      return [...prev.slice(0, footerIdx >= 0 ? footerIdx : prev.length), newSection, ...prev.slice(footerIdx >= 0 ? footerIdx : prev.length)];
    });
    
    setHasChanges(true);
    setSelectedSectionId(newSection.id);
  };

  // Handler for adding sections from Component Library with variant settings
  const handleAddSectionFromLibrary = (variantId: string, sectionType: string, variantSettings: Record<string, any>, variantName: string) => {
    const type = sectionType as SectionType;
    const def = SECTION_DEFINITIONS[type];
    if (!def) {
      toast.error(`Unknown section type: ${sectionType}`);
      return;
    }

    const newSection: PlacedSection = {
      id: uuidv4(),
      type,
      name: variantName || def.label,
      visible: true,
      settings: { ...def.defaultSettings, ...variantSettings },
      blocks: []
    };

    setSections(prev => {
      if (def.category === 'header') {
        const headerIdx = prev.findIndex(s => SECTION_DEFINITIONS[s.type]?.category !== 'header');
        return [...prev.slice(0, headerIdx >= 0 ? headerIdx : prev.length), newSection, ...prev.slice(headerIdx >= 0 ? headerIdx : prev.length)];
      }
      if (def.category === 'footer') return [...prev, newSection];
      const footerIdx = prev.findIndex(s => SECTION_DEFINITIONS[s.type]?.category === 'footer');
      return [...prev.slice(0, footerIdx >= 0 ? footerIdx : prev.length), newSection, ...prev.slice(footerIdx >= 0 ? footerIdx : prev.length)];
    });

    setHasChanges(true);
    setSelectedSectionId(newSection.id);
    toast.success(`Added ${variantName || def.label}`);
  };

  const handleDeleteSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    setDeleteConfirmation({ id, name: section.name });
  };

  const confirmDeleteSection = () => {
    if (!deleteConfirmation) return;
    setSections(prev => prev.filter(s => s.id !== deleteConfirmation.id));
    setHasChanges(true);
    if (selectedSectionId === deleteConfirmation.id) {
      setSelectedSectionId(null);
      setSelectedBlockId(null);
    }
    setDeleteConfirmation(null);
  };

  const handleToggleVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
    setHasChanges(true);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedSections(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleUpdateSectionSettings = (settings: Record<string, any>) => {
    setSections(prev => prev.map(s => s.id === selectedSectionId ? { ...s, settings } : s));
    setHasChanges(true);
  };

  const handleAddBlock = (type: BlockType) => {
    if (!addBlockSectionId) return;
    const newBlock: Block = { id: uuidv4(), type, settings: { ...BLOCK_DEFINITIONS[type].defaultSettings } };
    setSections(prev => prev.map(s => s.id === addBlockSectionId ? { ...s, blocks: [...s.blocks, newBlock] } : s));
    setHasChanges(true);
    setAddBlockSectionId(null);
  };

  const handlePreview = () => {
    window.open(`/store/${tenantId}`, '_blank');
  };

  // Group sections by category
  const headerSections = sections.filter(s => SECTION_DEFINITIONS[s.type]?.category === 'header');
  const mainSections = sections.filter(s => SECTION_DEFINITIONS[s.type]?.category === 'sections');
  const footerSections = sections.filter(s => SECTION_DEFINITIONS[s.type]?.category === 'footer');

  const renderSectionGroup = (title: string, sectionList: PlacedSection[], category: 'header' | 'sections' | 'footer') => (
    <div className="border-b border-gray-100">
      <div className="px-3 py-2"><h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</h3></div>
      <div className="px-2 pb-2 space-y-0.5">
        <SortableContext items={sectionList.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sectionList.map((section) => (
            <SortableSectionItem
              key={section.id}
              section={section}
              isSelected={selectedSectionId === section.id}
              isExpanded={expandedSections.includes(section.id)}
              selectedBlockId={selectedSectionId === section.id ? selectedBlockId : null}
              onSelect={() => { setSelectedSectionId(section.id); setSelectedBlockId(null); }}
              onToggleExpand={() => handleToggleExpand(section.id)}
              onToggleVisibility={() => handleToggleVisibility(section.id)}
              onDelete={() => handleDeleteSection(section.id)}
              onSelectBlock={(blockId) => { setSelectedSectionId(section.id); setSelectedBlockId(blockId); }}
              onAddBlock={() => setAddBlockSectionId(section.id)}
            />
          ))}
        </SortableContext>
        <button onClick={() => setAddSectionModal(category)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg w-full">
          <Icons.Plus /><span>Add section</span>
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Icons.Loader />
          <p className="mt-3 text-gray-600">Loading store builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-2 sm:px-4 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu toggle */}
          <button 
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden" 
            title="Toggle sections"
            aria-label="Toggle sections menu"
          >
            <Icons.Menu />
          </button>
          
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-lg hidden sm:block" title="Back"><Icons.ArrowLeft /></button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Store Builder</span>
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">● Live</span>
            {hasChanges && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Unsaved</span>}
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-1 text-sm text-gray-600">
          <Icons.Home /><span>Home page</span>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Device Preview Toggle */}
          <div className="flex items-center border rounded-lg p-0.5 sm:p-1 mr-1 sm:mr-2">
            {[{ id: 'desktop', Icon: Icons.Monitor }, { id: 'tablet', Icon: Icons.Tablet }, { id: 'mobile', Icon: Icons.Smartphone }].map(({ id, Icon }) => (
              <button 
                key={id} 
                onClick={() => setDevicePreview(id as any)} 
                className={`p-1 sm:p-2 rounded-md transition ${devicePreview === id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                aria-label={`${id} preview`}
              >
                <Icon />
              </button>
            ))}
          </div>
          
          <button onClick={handlePreview} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hidden sm:block" title="Preview store">
            <Icons.Eye />
          </button>
          
          {/* Mobile settings toggle */}
          <button 
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden" 
            title="Toggle settings"
            aria-label="Toggle settings panel"
          >
            <Icons.Settings />
          </button>
          
          <button onClick={() => window.open(getStoreUrl(tenantId), "_blank")} className="px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition bg-indigo-600 text-white hover:bg-indigo-700"><Icons.Eye /> <span className="hidden sm:inline">Preview</span></button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition ${hasChanges ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            {isSaving ? <><Icons.Loader /> <span className="hidden sm:inline">Saving...</span></> : <><Icons.Save /> <span className="hidden sm:inline">Save</span></>}
          </button>
        </div>
      </header>

      {/* Save Message Toast */}
      {saveMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${saveMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {saveMessage.type === 'success' ? <Icons.Check /> : <Icons.X />}
          {saveMessage.text}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* Left Sidebar - Section List */}
          {/* Mobile overlay */}
          {isLeftSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
              onClick={() => setIsLeftSidebarOpen(false)}
            />
          )}
          
          <aside className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-80 bg-white border-r flex flex-col h-full overflow-hidden
            transform transition-transform duration-200 ease-in-out
            ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            top-14 lg:top-0
          `}>
            {/* Mobile close button */}
            <div className="lg:hidden absolute top-2 right-2 z-10">              <button 
                onClick={() => setIsLeftSidebarOpen(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close sections menu"
              >
                <Icons.X />
              </button>
            </div>

            {/* Sidebar Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSidebarTab('components')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'components'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icons.Grid />
                  Add
                </div>
              </button>
              <button
                onClick={() => setSidebarTab('sections')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  sidebarTab === 'sections'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icons.Layers />
                  Layout ({sections.length})
                </div>
              </button>
            </div>

            {/* Components Tab - Component Library */}
            {sidebarTab === 'components' && (
              <ComponentLibrary
                onAddSection={handleAddSectionFromLibrary}
                searchQuery={componentSearchQuery}
                onSearchChange={setComponentSearchQuery}
                onSelectStyle={handleSelectThemeStyle}
                currentStyles={themeStyles}
                onHoverPreview={setHoverPreviewImage}
              />
            )}

            {/* Sections Tab - Current Sections List */}
            {sidebarTab === 'sections' && (
              <>
                <div className="p-3 border-b">
                  <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                    <Icons.Home />
                    <span className="text-sm font-medium text-gray-700 flex-1 text-left">Home page</span>
                    <Icons.ChevronDown />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {renderSectionGroup('Header', headerSections, 'header')}
                  {renderSectionGroup('Template', mainSections, 'sections')}
                  {renderSectionGroup('Footer', footerSections, 'footer')}
                </div>
                
                <div className="p-3 border-t">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                    <Icons.Settings />
                    <span className="text-sm">Theme settings</span>
                  </button>
                </div>
              </>
            )}
          </aside>

          {/* Center - Store Preview */}
          <StorePreview
            sections={sections}
            selectedSectionId={selectedSectionId}
            devicePreview={devicePreview}
            onSelectSection={(id) => { 
              setSelectedSectionId(id); 
              setSelectedBlockId(null);
              // Auto-open settings panel on mobile/tablet for better UX
              if (window.innerWidth < 1024) {
                setIsRightSidebarOpen(true);
              }
            }}
            tenantId={tenantId}
            hoverPreviewImage={hoverPreviewImage}
          />
        </DndContext>

        {/* Right Sidebar - Settings Panel */}
        {/* Mobile overlay */}
        {isRightSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setIsRightSidebarOpen(false)}
          />
        )}
        
        <aside className={`
          fixed lg:static inset-y-0 right-0 z-50
          w-full sm:w-96 lg:w-80 xl:w-96 bg-white border-l flex flex-col h-full
          transform transition-transform duration-200 ease-in-out
          ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          top-14 lg:top-0
        `}>
          {/* Mobile close button */}
          <div className="lg:hidden absolute top-2 right-2 z-10">
            <button 
              onClick={() => setIsRightSidebarOpen(false)} 
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close settings panel"
            >
              <Icons.X />
            </button>
          </div>
          
          {selectedSection ? (
            <>
              <div className="p-4 border-b">
                {selectedBlockId && (
                  <button onClick={() => setSelectedBlockId(null)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3 transition">
                    <Icons.ArrowLeft /><span>Back to section</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  {SECTION_DEFINITIONS[selectedSection.type]?.icon}
                  <h3 className="font-semibold text-gray-900">
                    {selectedBlockId ? BLOCK_DEFINITIONS[selectedBlock?.type || 'text']?.label : selectedSection.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">{SECTION_DEFINITIONS[selectedSection.type]?.description}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {selectedBlockId && selectedBlock ? (
                  <div className="space-y-3">
                    {Object.entries(selectedBlock.settings).map(([k, v]) => (
                      <div key={k}>
                        <label className="text-sm text-gray-700 block mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                          type="text"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          value={String(v)}
                          onChange={(e) => {
                            const newSettings = { ...selectedBlock.settings, [k]: e.target.value };
                            setSections(prev => prev.map(s => {
                              if (s.id !== selectedSectionId) return s;
                              return { ...s, blocks: s.blocks.map(b => b.id === selectedBlockId ? { ...b, settings: newSettings } : b) };
                            }));
                            setHasChanges(true);
                          }}
                          className="w-full px-3 py-2 text-sm border rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <SectionSettings section={selectedSection} onUpdate={handleUpdateSectionSettings} tenantId={tenantId} />
                )}
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2 text-gray-400"><Icons.Settings /></div>
              <h3 className="font-semibold text-gray-900">Customize your store</h3>
              <p className="text-sm text-gray-500 mt-1">Select a section from the left panel to customize it.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <AddSectionModal
        isOpen={addSectionModal !== null}
        onClose={() => setAddSectionModal(null)}
        onAdd={handleAddSection}
        category={addSectionModal || 'sections'}
      />
      
      <AddBlockModal
        isOpen={addBlockSectionId !== null}
        onClose={() => setAddBlockSectionId(null)}
        onAdd={handleAddBlock}
        allowedBlocks={addBlockSectionId ? SECTION_DEFINITIONS[sections.find(s => s.id === addBlockSectionId)?.type || 'hero']?.allowedBlocks || [] : []}
      />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmation(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                  <Icons.Trash />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Delete Section</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "<strong>{deleteConfirmation.name}</strong>"? This will permanently remove this section from your store.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmation(null)} 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteSection} 
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { PageBuilder };
export default PageBuilder;
