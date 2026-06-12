// Type definitions for FigmaProductList and related components

import { Product, Category, Brand, CourierConfig, Order, PathaoConfig, Tag as TagType } from '../../types';

export type { Product, Category, Brand, CourierConfig, Order, PathaoConfig, TagType };

export interface ProductCourierStatus {
  label: string;
  provider: 'Steadfast' | 'Pathao';
  trackingId: string;
  orderId: string;
}

export interface FigmaProductListProps {
  products?: Product[];
  orders?: Order[];
  courierConfig?: CourierConfig;
  categories?: Category[];
  brands?: Brand[];
  title?: string;
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
  onCloneProduct?: (product: Product) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkStatusUpdate?: (ids: number[], status: 'Active' | 'Draft') => void;
  onBulkFlashSale?: (ids: number[], action: 'add' | 'remove') => void;
  onBulkDiscount?: (ids: number[], discount: number) => void;
  onBulkTagAssign?: (ids: number[], tagNames: string[]) => void;
  onBulkStockUpdate?: (ids: number[], quantity: number, mode: 'set' | 'add') => void;
  onImport?: () => void;
  onExport?: () => void;
  onBulkImport?: (products: Product[]) => void;
  onQuickUpdate?: (productId: number, updates: Partial<Product>) => void;
  tags?: TagType[];
  tenantId?: string;
  tenantSubdomain?: string;
  productDisplayOrder?: number[];
  onProductOrderChange?: (order: number[]) => Promise<void>;
}
