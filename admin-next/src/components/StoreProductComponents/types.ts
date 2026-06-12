import { Product } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

export interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  variant?: string;
  onQuickView?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  wishlist?: number[];
  onToggleWishlist?: (productId: number) => void;
  showSoldCount?: boolean;
  discount?: 'percentage' | 'amount';
}

export const getImage = (p: Product) => normalizeImageUrl(p.galleryImages?.[0] || p.image);

export const showToast = {
  success: (msg: string) => import('react-hot-toast').then(m => m.toast.success(msg)),
};
