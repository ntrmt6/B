/**
 * GadgetsThemePage – Shared constants, interfaces, helpers, and footer data.
 */

import type { Product, WebsiteConfig } from '../../../types';

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface GadgetTag {
  id?: number | string;
  name: string;
  status?: string;
  showCountdown?: boolean;
  expiresAt?: string;
}

export interface GadgetsThemeProps {
  products: Product[];
  categories: any[];
  brands: any[];
  websiteConfig?: WebsiteConfig;
  logo?: string | null;
  tags?: GadgetTag[];
  onProductClick: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number, variant: any) => void;
  onCategoryClick?: (categorySlug: string) => void;
  onOpenChat?: () => void;
}

// ─── Palette (matches Figma: lime-500 accent, orange CTA) ────────────────────
export const G = {
  accent: '#84cc16',       // lime-500
  accentDark: '#65a30d',   // lime-600
  buyNow: '#fb923c',       // orange-400
  buyNowHover: '#f97316',  // orange-500
  bg: '#f3f4f6',           // gray-100
  cardBg: '#ffffff',
  text: '#171717',         // neutral-900
  textMuted: '#525252',    // neutral-600
  border: '#e5e7eb',       // gray-200
  discountBg: '#fb923c',   // orange-400
  counterBorder: '#6d28d9', // violet-700
  counterText: '#6d28d9',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const slugify = (s: string) =>
  s?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';

export const formatPrice = (p: number) => `৳ ${p.toLocaleString('en-BD')}`;

export const calcDiscount = (price: number, sale: number) =>
  Math.round(((price - sale) / price) * 100);

// ─── Default footer link fallbacks ───────────────────────────────────────────
export const defaultQuickLinks = [
  { id: '1', label: 'Home', url: '/' },
  { id: '2', label: 'Terms and Conditions', url: '/termsnconditions' },
  { id: '3', label: 'Return Policy', url: '/returnpolicy' },
];
export const defaultUsefulLinks = [
  { id: '1', label: 'About Us', url: '/about' },
  { id: '2', label: 'Privacy Policy', url: '/privacy' },
  { id: '3', label: 'FAQ', url: '/faq' },
  { id: '4', label: 'Track Order', url: '/track' },
];

// ─── Footer icon URLs ────────────────────────────────────────────────────────
export const GADGET_FOOTER_EMAIL_ICON = 'https://hdnfltv.com/image/nitimages/pasted_1773746473256.webp';
export const GADGET_FOOTER_PHONE_ICON = 'https://hdnfltv.com/image/nitimages/pasted_1773746487757.webp';
export const GADGET_FOOTER_ADDRESS_ICON = 'https://hdnfltv.com/image/nitimages/pasted_1773746503062.webp';

// ─── Social icon URLs map ────────────────────────────────────────────────────
export const GADGET_SOCIAL_ICON_URLS: Record<string, string> = {
  facebook: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg',
  fb: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg',
  instagram: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg',
  ig: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg',
  youtube: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/YouTube_social_red_circle_%282017%29.svg',
  yt: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/YouTube_social_red_circle_%282017%29.svg',
  twitter: 'https://upload.wikimedia.org/wikipedia/en/6/60/Twitter_Logo_as_of_2021.svg',
  x: 'https://upload.wikimedia.org/wikipedia/en/6/60/Twitter_Logo_as_of_2021.svg',
  linkedin: 'https://hdnfltv.com/image/nitimages/pasted_1773746619238.webp',
  tiktok: 'https://hdnfltv.com/image/nitimages/pasted_1773746605870.webp',
  tt: 'https://hdnfltv.com/image/nitimages/pasted_1773746605870.webp',
  whatsapp: 'https://hdnfltv.com/image/nitimages/2062095_application_chat_communication_logo_whatsapp_icon.webp',
  wa: 'https://hdnfltv.com/image/nitimages/2062095_application_chat_communication_logo_whatsapp_icon.webp',
  pinterest: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/YouTube_social_red_circle_%282017%29.svg',
  daraz: 'https://hdnfltv.com/image/nitimages/pasted_1773759254557.webp',
};
