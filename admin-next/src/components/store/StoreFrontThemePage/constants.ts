import type { Product, WebsiteConfig } from '../../../types';

// ─── Palette ────────────────────────────────────────────────────────────────
export const ACCENT = '#4ea674';
export const DARK = '#023337';
export const LIGHT_GREEN = '#eaf8e7';

// ─── Interface ──────────────────────────────────────────────────────────────
export interface StoreFrontThemeProps {
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
