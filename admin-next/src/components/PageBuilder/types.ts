/**
 * STORE STUDIO TYPE DEFINITIONS
 */

export type StyleVariant = 'style1' | 'style2' | 'style3' | 'style4' | 'style5' | 'none';
export type DevicePreview = 'desktop' | 'tablet' | 'mobile';
export type DeviceType = 'desktop' | 'mobile' | 'both';

// Block types for custom content
export type BlockType = 
  | 'header' | 'mobileHeader' | 'heroSlider' | 'categorySection' 
  | 'productSection' | 'footer' | 'bottomNav'
  | 'textBlock' | 'imageBlock' | 'bannerBlock' | 'spacerBlock' 
  | 'videoBlock' | 'testimonialBlock' | 'featureBlock' | 'ctaBlock';

export type SectionType = BlockType;

export interface StylePreview {
  id: StyleVariant;
  name: string;
  description: string;
  thumbnail: string;
}

export interface SectionCategory {
  id: SectionType;
  label: string;
  icon: string;
  description: string;
  styles: StylePreview[];
  allowNone?: boolean;
  deviceType: DeviceType;
  isCustomBlock?: boolean;
}

export interface PlacedSection {
  id: string;
  type: SectionType;
  styleVariant: StyleVariant;
  order: number;
  visible: boolean;
  config: BlockConfig;
  createdAt: string;
  updatedAt: string;
}

// Block configuration for custom content
export interface BlockConfig {
  // Text block
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  
  // Image block
  imageUrl?: string;
  imageAlt?: string;
  imageFit?: 'cover' | 'contain' | 'fill';
  
  // Banner block
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerBgColor?: string;
  bannerTextColor?: string;
  bannerLink?: string;
  
  // Spacer block
  spacerHeight?: number;
  
  // Video block
  videoUrl?: string;
  autoPlay?: boolean;
  
  // CTA block
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaButtonColor?: string;
  
  // General
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  
  [key: string]: unknown;
}

// Theme presets
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category: 'fashion' | 'food' | 'groceries' | 'gadgets' | 'wine' | 'general' | 'beauty' | 'sports';
  thumbnail: string;
  colors: ThemeColors;
  styles: {
    headerStyle: StyleVariant;
    mobileHeaderStyle: StyleVariant;
    categorySectionStyle: StyleVariant;
    productCardStyle: StyleVariant;
    footerStyle: StyleVariant;
    bottomNavStyle: StyleVariant;
  };
  defaultSections: Omit<PlacedSection, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface StoreLayout {
  tenantId: string;
  sections: PlacedSection[];
  headerStyle: StyleVariant;
  mobileHeaderStyle: StyleVariant;
  categorySectionStyle: StyleVariant;
  productCardStyle: StyleVariant;
  productSectionStyle: StyleVariant;
  showcaseSectionStyle: StyleVariant;
  brandSectionStyle: StyleVariant;
  footerStyle: StyleVariant;
  bottomNavStyle: StyleVariant;
  colors?: ThemeColors;
  activeTheme?: string;
  version: number;
  isPublished: boolean;
  lastUpdated?: string;
}

export interface DragData {
  type: 'style-card' | 'canvas-section' | 'block';
  sectionType?: SectionType;
  styleVariant?: StyleVariant;
  sectionId?: string;
  preview?: StylePreview;
  blockType?: BlockType;
}

export interface PageBuilderProps {
  tenantId: string;
  initialLayout?: StoreLayout;
  onSaveSuccess?: (layout: StoreLayout) => void;
  onError?: (error: Error) => void;
}

// Legacy types
export type WidgetType = 
  | 'header' | 'hero-slider' | 'product-grid' | 'categories'
  | 'featured-products' | 'banner' | 'testimonials' | 'newsletter' | 'footer';

export interface Widget {
  id: WidgetType;
  label: string;
  icon: string;
  description: string;
  defaultConfig: WidgetConfig;
}

export interface WidgetConfig {
  backgroundColor?: string;
  padding?: string;
  textAlign?: 'left' | 'center' | 'right';
  columns?: number;
  maxItems?: number;
  fullWidth?: boolean;
  customClasses?: string;
  [key: string]: unknown;
}

export interface Section {
  id: string;
  type: WidgetType;
  order: number;
  visible: boolean;
  config: WidgetConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TenantLayout {
  tenantId: string;
  sections: Section[];
  metadata: LayoutMetadata;
  version: number;
  lastUpdated: string;
}

export interface LayoutMetadata {
  name: string;
  isPublished: boolean;
  lastModifiedBy?: string;
  themeId?: string;
}
