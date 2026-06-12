/**
 * STORE STUDIO CONSTANTS
 * Style configurations, theme presets, and custom blocks
 */

import type { SectionCategory, StylePreview, StyleVariant, StoreLayout, SectionType, ThemePreset, ThemeColors } from './types';

// Default theme colors
export const DEFAULT_COLORS: ThemeColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  background: '#ffffff',
  text: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

// Default layout configuration
export const DEFAULT_LAYOUT: Omit<StoreLayout, 'tenantId' | 'lastUpdated'> = {
  sections: [],
  headerStyle: 'style1',
  mobileHeaderStyle: 'style1',
  categorySectionStyle: 'style1',
  productCardStyle: 'style1',
  productSectionStyle: 'style1',
  showcaseSectionStyle: 'style1',
  brandSectionStyle: 'style1',
  footerStyle: 'style1',
  bottomNavStyle: 'style1',
  colors: DEFAULT_COLORS,
  version: 1,
  isPublished: false,
};

// Style descriptions for each section type
const HEADER_STYLES: StylePreview[] = [
  { id: 'style1', name: 'Clean Modern', description: 'Glassmorphism with frosted glass', thumbnail: 'https://hdnfltv.com/image/nitimages/pasted_1771447828354.webp' },
  { id: 'style2', name: 'Compact Single Row', description: 'Minimal single-row navigation', thumbnail: 'https://hdnfltv.com/image/nitimages/header-2.webp' },
  { id: 'style3', name: 'Gradient Colorful', description: 'Theme gradient background', thumbnail: 'https://hdnfltv.com/image/nitimages/header-3.webp' },
  { id: 'style4', name: 'E-commerce Pro', description: 'Dark top bar, category dropdown', thumbnail: 'https://hdnfltv.com/image/nitimages/header-4.webp' },
  { id: 'style5', name: 'Dark Mode', description: 'Full dark theme, cyan accents', thumbnail: 'https://hdnfltv.com/image/nitimages/header_-_5.webp' },
];

const MOBILE_HEADER_STYLES: StylePreview[] = [
  { id: 'style1', name: 'Frosted Glass', description: 'White frosted glass effect', thumbnail: 'https://hdnfltv.com/image/nitimages/mobile_header_-_1_1768841563.webp' },
  { id: 'style2', name: 'Compact Centered', description: 'Centered logo, minimal', thumbnail: 'https://hdnfltv.com/image/nitimages/mobile_header_2.webp' },
  { id: 'style3', name: 'Gradient', description: 'Theme gradient, white icons', thumbnail: 'https://hdnfltv.com/image/nitimages/mobile_header_3.webp' },
  { id: 'style4', name: 'E-commerce Pro', description: 'Integrated search bar', thumbnail: 'https://hdnfltv.com/image/nitimages/mobile_header_4.webp' },
  { id: 'style5', name: 'Dark Mode', description: 'Dark gray, cyan accents', thumbnail: 'https://hdnfltv.com/image/nitimages/mobile_header_5.webp' },
];

const CATEGORY_STYLES: StylePreview[] = [
  { id: 'none', name: 'Hidden', description: 'Do not show category section', thumbnail: '' },
  { id: 'style1', name: 'Pill Carousel', description: 'Auto-scrolling pill buttons', thumbnail: 'https://hdnfltv.com/image/nitimages/category_-_1.webp' },
  { id: 'style2', name: 'Grid Cards', description: 'Fixed grid with hover effect', thumbnail: 'https://hdnfltv.com/image/nitimages/category-2.webp' },
  { id: 'style3', name: 'Circular Icons', description: 'Instagram-style circles', thumbnail: 'https://hdnfltv.com/image/nitimages/category_-_3.webp' },
  { id: 'style4', name: 'Compact List', description: 'Card with gradient header', thumbnail: 'https://hdnfltv.com/image/nitimages/category_-_4.webp' },
  { id: 'style5', name: 'Featured Cards', description: 'Large horizontal cards', thumbnail: 'https://hdnfltv.com/image/nitimages/category-5.webp' },
];

const PRODUCT_CARD_STYLES: StylePreview[] = [
  { id: 'style1', name: 'Gradient Top Bar', description: 'Purple-to-pink gradient', thumbnail: 'https://hdnfltv.com/image/nitimages/product_card_-_1.webp' },
  { id: 'style2', name: 'Minimal Hover', description: 'Clean white, hover overlay', thumbnail: 'https://hdnfltv.com/image/nitimages/pasted_1772910489898.webp' },
  { id: 'style3', name: 'Elegant Rounded', description: 'Soft shadows, premium feel', thumbnail: 'https://hdnfltv.com/image/nitimages/product_card_-_3.webp' },
  { id: 'style4', name: 'Bold Dark', description: 'Dark background, vibrant CTAs', thumbnail: 'https://hdnfltv.com/image/nitimages/product_card_-_4.webp' },
  { id: 'style5', name: 'Compact Efficient', description: 'Border-focused layout', thumbnail: 'https://hdnfltv.com/image/nitimages/product_card_-_5.webp' },
];

const FOOTER_STYLES: StylePreview[] = [
  { id: 'style1', name: 'Dark Gradient', description: 'Dark gradient, 4-column', thumbnail: 'https://hdnfltv.com/image/nitimages/pasted_1773259417132.webp' },
  { id: 'style2', name: 'Minimal White', description: 'Clean white, compact', thumbnail: 'https://hdnfltv.com/image/nitimages/footer_-_2.webp' },
  { id: 'style3', name: 'Colorful Gradient', description: 'Theme gradient, newsletter', thumbnail: 'https://hdnfltv.com/image/nitimages/footer_-3.webp' },
  { id: 'style4', name: 'Newsletter Focus', description: 'Light gray, centered', thumbnail: 'https://hdnfltv.com/image/nitimages/footer_-4_orginal.webp' },
  { id: 'style5', name: 'E-commerce Pro', description: 'White, app store links', thumbnail: 'https://hdnfltv.com/image/nitimages/footer_5_1768901505.webp' },
];

const BOTTOM_NAV_STYLES: StylePreview[] = [
  { id: 'style1', name: 'Elevated Home', description: 'Glassmorphism, center button', thumbnail: 'https://hdnfltv.com/image/nitimages/bottomNav-1.webp' },
  { id: 'style2', name: 'Minimal Flat', description: 'Simple flat, dot indicator', thumbnail: 'https://hdnfltv.com/image/nitimages/bottomNav-2.webp' },
  { id: 'style3', name: 'Rounded Pill Dark', description: 'Floating dark pill', thumbnail: 'https://hdnfltv.com/image/nitimages/bottomNav-3.webp' },
  { id: 'style4', name: 'Iconic with Chat', description: 'Large icons, chat button', thumbnail: 'https://hdnfltv.com/image/nitimages/bottomNav_4.webp' },
  { id: 'style5', name: 'E-commerce Optimized', description: '5 icons, elevated cart', thumbnail: 'https://hdnfltv.com/image/nitimages/bottomNav-5.webp' },
];

// Custom block styles (single style for custom blocks)
const CUSTOM_BLOCK_STYLE: StylePreview[] = [
  { id: 'style1', name: 'Default', description: 'Standard appearance', thumbnail: '' },
];

// All section categories with their styles
export const SECTION_CATEGORIES: SectionCategory[] = [
  { id: 'header', label: 'Desktop Header', icon: '🖥️', description: 'Main navigation bar', styles: HEADER_STYLES, deviceType: 'desktop' },
  { id: 'mobileHeader', label: 'Mobile Header', icon: '📱', description: 'Compact mobile header', styles: MOBILE_HEADER_STYLES, deviceType: 'mobile' },
  { id: 'categorySection', label: 'Categories', icon: '📁', description: 'Product categories', styles: CATEGORY_STYLES, allowNone: true, deviceType: 'both' },
  { id: 'productSection', label: 'Product Cards', icon: '🛍️', description: 'Product display style', styles: PRODUCT_CARD_STYLES, deviceType: 'both' },
  { id: 'footer', label: 'Footer', icon: '📋', description: 'Site footer', styles: FOOTER_STYLES, deviceType: 'both' },
  { id: 'bottomNav', label: 'Bottom Navigation', icon: '📲', description: 'Mobile bottom nav', styles: BOTTOM_NAV_STYLES, deviceType: 'mobile' },
];

// Custom blocks that can be added anywhere
export const CUSTOM_BLOCKS: SectionCategory[] = [
  { id: 'textBlock', label: 'Text Block', icon: '📝', description: 'Add custom text content', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
  { id: 'imageBlock', label: 'Image Block', icon: '🖼️', description: 'Add an image', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
  { id: 'bannerBlock', label: 'Banner', icon: '🎯', description: 'Promotional banner', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
  { id: 'spacerBlock', label: 'Spacer', icon: '↕️', description: 'Add vertical space', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
  { id: 'videoBlock', label: 'Video', icon: '🎬', description: 'Embed a video', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
  { id: 'ctaBlock', label: 'Call to Action', icon: '🔔', description: 'Action button section', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
  { id: 'testimonialBlock', label: 'Testimonials', icon: '💬', description: 'Customer reviews', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
  { id: 'featureBlock', label: 'Features', icon: '✨', description: 'Feature highlights', styles: CUSTOM_BLOCK_STYLE, deviceType: 'both', isCustomBlock: true },
];

// Ready-made theme presets
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'fashion-elegant',
    name: 'Fashion Elegance',
    description: 'Sophisticated design for fashion & clothing stores',
    category: 'fashion',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    colors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', background: '#ffffff', text: '#1a1a2e', textMuted: '#6b7280', border: '#e5e7eb', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
    styles: { headerStyle: 'style5', mobileHeaderStyle: 'style5', categorySectionStyle: 'style3', productCardStyle: 'style3', footerStyle: 'style1', bottomNavStyle: 'style3' },
    defaultSections: [
      { type: 'header', styleVariant: 'style5', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style3', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style3', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style1', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'fashion-minimal',
    name: 'Fashion Minimal',
    description: 'Clean and minimal fashion store design',
    category: 'fashion',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop',
    colors: { primary: '#000000', secondary: '#333333', accent: '#ff6b6b', background: '#fafafa', text: '#1a1a1a', textMuted: '#888888', border: '#eeeeee', success: '#4caf50', warning: '#ff9800', error: '#f44336' },
    styles: { headerStyle: 'style2', mobileHeaderStyle: 'style2', categorySectionStyle: 'style1', productCardStyle: 'style2', footerStyle: 'style2', bottomNavStyle: 'style2' },
    defaultSections: [
      { type: 'header', styleVariant: 'style2', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style1', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style2', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style2', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'food-fresh',
    name: 'Fresh Food Market',
    description: 'Vibrant design for food & restaurant businesses',
    category: 'food',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    colors: { primary: '#ff6b35', secondary: '#f7931e', accent: '#2ec4b6', background: '#fff9f5', text: '#2d3436', textMuted: '#636e72', border: '#ffeaa7', success: '#00b894', warning: '#fdcb6e', error: '#d63031' },
    styles: { headerStyle: 'style3', mobileHeaderStyle: 'style3', categorySectionStyle: 'style2', productCardStyle: 'style1', footerStyle: 'style3', bottomNavStyle: 'style4' },
    defaultSections: [
      { type: 'header', styleVariant: 'style3', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style2', order: 1, visible: true, config: {} },
      { type: 'bannerBlock', styleVariant: 'style1', order: 2, visible: true, config: { bannerTitle: '🍕 Fresh Daily!', bannerSubtitle: 'Order now for fast delivery', bannerBgColor: '#ff6b35', bannerTextColor: '#ffffff' } },
      { type: 'productSection', styleVariant: 'style1', order: 3, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style3', order: 4, visible: true, config: {} },
    ],
  },
  {
    id: 'food-restaurant',
    name: 'Restaurant Premium',
    description: 'Premium restaurant & fine dining design',
    category: 'food',
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    colors: { primary: '#8b4513', secondary: '#a0522d', accent: '#daa520', background: '#faf8f5', text: '#3d2914', textMuted: '#8b7355', border: '#d4c4a8', success: '#228b22', warning: '#daa520', error: '#8b0000' },
    styles: { headerStyle: 'style4', mobileHeaderStyle: 'style4', categorySectionStyle: 'style5', productCardStyle: 'style3', footerStyle: 'style1', bottomNavStyle: 'style1' },
    defaultSections: [
      { type: 'header', styleVariant: 'style4', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style5', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style3', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style1', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'grocery-fresh',
    name: 'Grocery Fresh',
    description: 'Clean design for grocery & supermarket stores',
    category: 'groceries',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    colors: { primary: '#27ae60', secondary: '#2ecc71', accent: '#f39c12', background: '#ffffff', text: '#2c3e50', textMuted: '#7f8c8d', border: '#ecf0f1', success: '#27ae60', warning: '#f39c12', error: '#e74c3c' },
    styles: { headerStyle: 'style4', mobileHeaderStyle: 'style4', categorySectionStyle: 'style4', productCardStyle: 'style5', footerStyle: 'style5', bottomNavStyle: 'style5' },
    defaultSections: [
      { type: 'header', styleVariant: 'style4', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style4', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style5', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style5', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'grocery-organic',
    name: 'Organic Market',
    description: 'Natural & organic grocery store design',
    category: 'groceries',
    thumbnail: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
    colors: { primary: '#4a7c59', secondary: '#6b8e23', accent: '#deb887', background: '#f5f5dc', text: '#2f4f2f', textMuted: '#6b8e6b', border: '#c4d4c4', success: '#228b22', warning: '#daa520', error: '#cd5c5c' },
    styles: { headerStyle: 'style1', mobileHeaderStyle: 'style1', categorySectionStyle: 'style3', productCardStyle: 'style2', footerStyle: 'style4', bottomNavStyle: 'style2' },
    defaultSections: [
      { type: 'header', styleVariant: 'style1', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style3', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style2', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style4', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'gadgets-tech',
    name: 'Tech Store',
    description: 'Modern design for electronics & gadgets',
    category: 'gadgets',
    thumbnail: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop',
    colors: { primary: '#0066cc', secondary: '#0052a3', accent: '#00d4ff', background: '#f8fafc', text: '#1e293b', textMuted: '#64748b', border: '#e2e8f0', success: '#22c55e', warning: '#eab308', error: '#ef4444' },
    styles: { headerStyle: 'style5', mobileHeaderStyle: 'style5', categorySectionStyle: 'style2', productCardStyle: 'style4', footerStyle: 'style1', bottomNavStyle: 'style3' },
    defaultSections: [
      { type: 'header', styleVariant: 'style5', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style2', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style4', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style1', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'gadgets-gaming',
    name: 'Gaming Zone',
    description: 'Bold design for gaming & electronics',
    category: 'gadgets',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    colors: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#22d3ee', background: '#0f0f23', text: '#f1f5f9', textMuted: '#94a3b8', border: '#334155', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
    styles: { headerStyle: 'style5', mobileHeaderStyle: 'style5', categorySectionStyle: 'style5', productCardStyle: 'style4', footerStyle: 'style1', bottomNavStyle: 'style3' },
    defaultSections: [
      { type: 'header', styleVariant: 'style5', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style5', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style4', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style1', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'wine-classic',
    name: 'Wine Cellar',
    description: 'Classic design for wine & spirits stores',
    category: 'wine',
    thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
    colors: { primary: '#722f37', secondary: '#8b0000', accent: '#d4af37', background: '#fefdf8', text: '#1a1a1a', textMuted: '#666666', border: '#d4c4a8', success: '#228b22', warning: '#daa520', error: '#8b0000' },
    styles: { headerStyle: 'style4', mobileHeaderStyle: 'style4', categorySectionStyle: 'style5', productCardStyle: 'style3', footerStyle: 'style1', bottomNavStyle: 'style1' },
    defaultSections: [
      { type: 'header', styleVariant: 'style4', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style5', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style3', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style1', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'wine-modern',
    name: 'Wine Modern',
    description: 'Contemporary wine store design',
    category: 'wine',
    thumbnail: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop',
    colors: { primary: '#2d2d2d', secondary: '#4a4a4a', accent: '#c9a962', background: '#ffffff', text: '#1a1a1a', textMuted: '#757575', border: '#e0e0e0', success: '#4caf50', warning: '#ff9800', error: '#f44336' },
    styles: { headerStyle: 'style2', mobileHeaderStyle: 'style2', categorySectionStyle: 'style1', productCardStyle: 'style2', footerStyle: 'style2', bottomNavStyle: 'style2' },
    defaultSections: [
      { type: 'header', styleVariant: 'style2', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style1', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style2', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style2', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'beauty-glamour',
    name: 'Beauty Glamour',
    description: 'Elegant design for beauty & cosmetics',
    category: 'beauty',
    thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop',
    colors: { primary: '#e91e8c', secondary: '#c2185b', accent: '#ffc107', background: '#fff5f8', text: '#333333', textMuted: '#888888', border: '#fce4ec', success: '#4caf50', warning: '#ff9800', error: '#f44336' },
    styles: { headerStyle: 'style3', mobileHeaderStyle: 'style3', categorySectionStyle: 'style3', productCardStyle: 'style1', footerStyle: 'style3', bottomNavStyle: 'style4' },
    defaultSections: [
      { type: 'header', styleVariant: 'style3', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style3', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style1', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style3', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'sports-active',
    name: 'Sports Active',
    description: 'Dynamic design for sports & fitness',
    category: 'sports',
    thumbnail: 'https://images.unsplash.com/photo-1461896836934- voices-60x40?w=400&h=300&fit=crop',
    colors: { primary: '#ff5722', secondary: '#e64a19', accent: '#00bcd4', background: '#fafafa', text: '#212121', textMuted: '#757575', border: '#e0e0e0', success: '#4caf50', warning: '#ff9800', error: '#f44336' },
    styles: { headerStyle: 'style3', mobileHeaderStyle: 'style3', categorySectionStyle: 'style2', productCardStyle: 'style1', footerStyle: 'style5', bottomNavStyle: 'style5' },
    defaultSections: [
      { type: 'header', styleVariant: 'style3', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style2', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style1', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style5', order: 3, visible: true, config: {} },
    ],
  },
  {
    id: 'general-classic',
    name: 'Classic Store',
    description: 'Timeless design for any store type',
    category: 'general',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop',
    colors: { primary: '#3f51b5', secondary: '#303f9f', accent: '#ff4081', background: '#ffffff', text: '#212121', textMuted: '#757575', border: '#e0e0e0', success: '#4caf50', warning: '#ff9800', error: '#f44336' },
    styles: { headerStyle: 'style1', mobileHeaderStyle: 'style1', categorySectionStyle: 'style1', productCardStyle: 'style1', footerStyle: 'style1', bottomNavStyle: 'style1' },
    defaultSections: [
      { type: 'header', styleVariant: 'style1', order: 0, visible: true, config: {} },
      { type: 'categorySection', styleVariant: 'style1', order: 1, visible: true, config: {} },
      { type: 'productSection', styleVariant: 'style1', order: 2, visible: true, config: {} },
      { type: 'footer', styleVariant: 'style1', order: 3, visible: true, config: {} },
    ],
  },
];

// Map section type to theme_config key
export const SECTION_TO_CONFIG_KEY: Record<SectionType, keyof StoreLayout> = {
  header: 'headerStyle',
  mobileHeader: 'mobileHeaderStyle',
  heroSlider: 'productSectionStyle',
  categorySection: 'categorySectionStyle',
  productSection: 'productCardStyle',
  footer: 'footerStyle',
  bottomNav: 'bottomNavStyle',
  textBlock: 'productSectionStyle',
  imageBlock: 'productSectionStyle',
  bannerBlock: 'productSectionStyle',
  spacerBlock: 'productSectionStyle',
  videoBlock: 'productSectionStyle',
  testimonialBlock: 'productSectionStyle',
  featureBlock: 'productSectionStyle',
  ctaBlock: 'productSectionStyle',
};

// Get style info
export const getStyleInfo = (sectionType: SectionType, variant: StyleVariant): StylePreview | undefined => {
  const allCategories = [...SECTION_CATEGORIES, ...CUSTOM_BLOCKS];
  const category = allCategories.find(c => c.id === sectionType);
  return category?.styles.find(s => s.id === variant);
};

// Get section category
export const getSectionCategory = (type: SectionType): SectionCategory | undefined => {
  const allCategories = [...SECTION_CATEGORIES, ...CUSTOM_BLOCKS];
  return allCategories.find(c => c.id === type);
};

// Get theme presets by category
export const getThemesByCategory = (category: ThemePreset['category']): ThemePreset[] => {
  return THEME_PRESETS.filter(t => t.category === category);
};
