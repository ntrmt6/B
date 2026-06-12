import { ColorKey, FooterLinkField, WebsiteConfig } from './types';

// Status colors for badges - matching AdminOrders pattern
export const STATUS_COLORS = {
  Publish: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
  Draft: 'text-amber-600 bg-amber-50 border border-amber-200',
  Trash: 'text-red-600 bg-red-50 border border-red-200',
  Active: 'text-blue-600 bg-blue-50 border border-blue-200',
  Inactive: 'text-gray-600 bg-gray-50 border border-gray-200',
};

export const DEFAULT_COLORS: Record<ColorKey, string> = {
  primary: '#22c55e',
  secondary: '#ec4899',
  tertiary: '#9333ea',
  font: '#0f172a',
  hover: '#f97316',
  surface: '#e2e8f0',
  adminBg: '#030407',
  adminInputBg: '#0f172a',
  adminBorder: '#ffffff',
  adminFocus: '#f87171'
};

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  websiteName: '',
  shortDescription: '',
  whatsappNumber: '',
  favicon: null,
  headerLogo: null,
  footerLogo: null,
  addresses: [],
  emails: [],
  phones: [],
  socialLinks: [],
  footerQuickLinks: [],
  footerUsefulLinks: [],
  showMobileHeaderCategory: true,
  showNewsSlider: true,
  headerSliderText: '',
  hideCopyright: false,
  hideCopyrightText: false,
  showPoweredBy: false,
  showFlashSaleCounter: true,
  brandingText: '',
  carouselItems: [],
  campaigns: [],
  popups: [],
  searchHints: '',
  orderLanguage: 'English',
  adminNoticeText: '',
  productDetailTheme: 'modern',
  categorySectionStyle: 'style1',
  storeName: '',

  contactSubjects: [],
  productSectionStyle: ''
};

// Demo images for style previews - webp format URLs for each theme section and style
export const THEME_DEMO_IMAGES: Record<string, Record<string, string>> = {
  headerStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/pasted_1771447828354.webp',
    style2: 'https://hdnfltv.com/image/nitimages/header-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/header-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/header-4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/header_-_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/pasted_1771697764963.webp',
    style7: 'https://hdnfltv.com/image/nitimages/Header7.webp',
  },
  mobileHeaderStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/mobile_header_-_1_1768841563.webp',
    style2: 'https://hdnfltv.com/image/nitimages/mobile_header_2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/mobile_header_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/mobile_header_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/mobile_header_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/Mobile_header_6.webp',
    style7: 'https://hdnfltv.com/image/nitimages/Header7.webp',
  },
  showcaseSectionStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    style2: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    style3: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    style4: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    style5: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
  },
  brandSectionStyle: {
    none: '',
    style1: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    style2: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    style3: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp ',
    style4: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    style5: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
  },
  categorySectionStyle: {
    none: '',
    style1: 'https://hdnfltv.com/image/nitimages/category_-_1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/category-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/category_-_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/category_-_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/category-5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/category-5.webp',
    style7: 'https://hdnfltv.com/image/nitimages/category-5.webp',
  },
  productSectionStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/product_card_-_1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/pasted_1772910489898.webp',
    style3: 'https://hdnfltv.com/image/nitimages/product_card_-_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/product_card_-_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/product_card_-_5.webp',
  },
  productCardStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/product_card_-_1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/pasted_1772910489898.webp',
    style3: 'https://hdnfltv.com/image/nitimages/product_card_-_3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/product_card_-_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/product_card_-_5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/Product_card_style6.webp',
  },
  footerStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/pasted_1773259417132.webp',
    style2: 'https://hdnfltv.com/image/nitimages/footer_-_2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/footer_-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/footer_-4_orginal.webp',
    style5: 'https://hdnfltv.com/image/nitimages/footer_5_1768901505.webp',
  },
  bottomNavStyle: {
    style1: 'https://hdnfltv.com/image/nitimages/bottomNav-1.webp',
    style2: 'https://hdnfltv.com/image/nitimages/bottomNav-2.webp',
    style3: 'https://hdnfltv.com/image/nitimages/bottomNav-3.webp',
    style4: 'https://hdnfltv.com/image/nitimages/bottomNav_4.webp',
    style5: 'https://hdnfltv.com/image/nitimages/bottomNav-5.webp',
    style6: 'https://hdnfltv.com/image/nitimages/bottomNav-5.webp',
  },
  // Ready Made Theme preview images
  readyThemes: {
    gadgets1: 'https://hdnfltv.com/image/nitimages/gadgets_theme_one.webp',
    gadgets2: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    gadgets3: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    gadgets4: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    fashion1: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    fashion2: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    fashion3: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    fashion4: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    grocery1: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    grocery2: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    grocery3: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    grocery4: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    cosmetics1: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    cosmetics2: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    cosmetics3: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    cosmetics4: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    pharmacy1: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    pharmacy2: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    pharmacy3: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    pharmacy4: 'https://hdnfltv.com/image/nitimages/istockphoto-2177087647-612x612.webp',
    // store front theme number 1 preview image. 
    storefront1: 'https://hdnfltv.com/image/nitimages/pasted_1773730043062.webp',
    // store front theme number 2 preview image.
    storefront2: 'https://hdnfltv.com/image/nitimages/gadget_theme_3.webp',
  },
  // Product Detail Page Theme preview images
  productDetailThemes: {
    default: 'https://hdnfltv.com/image/nitimages/pasted_1773258157343.webp',
    modern: 'https://hdnfltv.com/image/nitimages/pasted_1771688008265.webp',
    gadgets: 'https://hdnfltv.com/image/nitimages/gadgets_theme_product_page_.webp',
  },
};

export const SOCIAL_PLATFORM_OPTIONS = [
  'Facebook',
  'Instagram',
  'YouTube',
  'Daraz',
  'Twitter',
  'LinkedIn'
];

export const COLOR_GUIDE_CONFIG: Array<{
  key: ColorKey;
  label: string;
  helper: string;
}> = [
  {
    key: 'primary',
    label: 'Primary Accent',
    helper: 'Sidebar active state, admin CTAs, storefront hero buttons'
  },
  {
    key: 'secondary',
    label: 'Secondary Accent',
    helper: 'Warning chips, checkout highlights, floating badges'
  },
  {
    key: 'tertiary',
    label: 'Depth Accent',
    helper: 'Charts, outlines, subtle gradients'
  },
  {
    key: 'font',
    label: 'Global Font Color',
    helper: 'Header links, footer text, storefront typography'
  }
];

export const FOOTER_LINK_SECTIONS: Array<{
  field: FooterLinkField;
  title: string;
  helper: string;
}> = [
  {
    field: 'footerQuickLinks',
    title: 'Footer Quick Links',
    helper: 'Shown in the Quick Links column of Footer 3'
  },
  {
    field: 'footerUsefulLinks',
    title: 'Footer Useful Links',
    helper: 'Shown in the Useful Links column of Footer 3'
  }
];

export const THEME_VIEW_SECTIONS = [
  { title: 'Header Section', key: 'headerStyle', count: 6 },
  { title: 'Mobile Header', key: 'mobileHeaderStyle', count: 6 },
  {
    title: 'Category Section',
    key: 'categorySectionStyle',
    count: 5,
    hasNone: true,
    hasMobile: true
  },
  { title: 'Product Card', key: 'productCardStyle', count: 6 },
  { title: 'Footer Section', key: 'footerStyle', count: 5 },
  { title: 'Bottom Nav', key: 'bottomNavStyle', count: 6 }
];

export const WEBSITE_INFO_TOGGLES = [
  { key: 'showMobileHeaderCategory', label: 'isShowMobileHeaderCategoryMenu' },
  { key: 'showNewsSlider', label: 'Is Show News Slider' },
  { key: 'hideCopyright', label: 'Hide Copyright Section' },
  { key: 'hideCopyrightText', label: 'Hide Copyright Text' },
  { key: 'showPoweredBy', label: 'Powered by SystemNext IT' }
];

export const LOGO_CONFIG = [
  { refKey: 'logo', configKey: 'logo', name: 'Primary Store Logo (Fallback)' },
  { refKey: 'headerLogo', configKey: 'headerLogo', name: 'Header Logo Override' },
  { refKey: 'footerLogo', configKey: 'footerLogo', name: 'Footer Logo Override' }
] as const;

/**
 * Normalizes a hex color string to proper format
 * Supports 3-digit and 6-digit hex codes
 */
export const normalizeHexColor = (value: string): string => {
  const sanitized = value.trim().replace(/[^0-9a-fA-F]/g, '');
  if (sanitized.length === 3) {
    return `#${sanitized
      .split('')
      .map((c) => `${c}${c}`)
      .join('')
      .toUpperCase()}`;
  }
  if (sanitized.length === 6) {
    return `#${sanitized.toUpperCase()}`;
  }
  return '';
};
