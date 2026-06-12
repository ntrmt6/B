import type { Product, WebsiteConfig } from '../../../types';

// ─── Palette ────────────────────────────────────────────────────────────────
export const C = {
  primary: '#1e1b4b',      // deep indigo
  accent: '#f97316',       // coral-orange
  accentLight: '#fff7ed',  // very light orange
  secondaryBg: '#f8f7ff',  // light lavender bg
  surface: '#ffffff',
  borderLight: '#e8e6f8',
  textMain: '#111827',
  textMuted: '#6b7280',
  textInverse: '#ffffff',
} as const;

// ─── Interface (mirrors StoreFrontThemePage) ─────────────────────────────────
export interface StoreFront2Props {
  products: Product[];
  categories: any[];
  brands: any[];
  websiteConfig?: WebsiteConfig;
  logo?: string | null;
  onProductClick: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number, variant: any) => void;
  onCategoryClick?: (categorySlug: string) => void;
  onOpenChat?: () => void;
}
