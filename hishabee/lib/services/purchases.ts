import api from '@/lib/api';

export interface PurchaseItem {
  productId?: number | string;
  productName: string;
  image?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Purchase {
  _id: string;
  purchaseNumber?: string;
  supplierName?: string;
  mobileNumber?: string;
  address?: string;
  items: PurchaseItem[];
  totalAmount: number;
  subTotal?: number;
  discount?: number;
  deliveryCharge?: number;
  paymentType?: 'cash' | 'due';
  cashPaid?: number;
  dueAmount?: number;
  note?: string;
  date?: string;
  status?: string;
  createdAt: string;
}

export interface CreatePurchaseData {
  items: PurchaseItem[];
  totalAmount: number;
  subTotal: number;
  discount: number;
  deliveryCharge: number;
  paymentType: 'cash' | 'due';
  supplierName: string;
  mobileNumber: string;
  address: string;
  note: string;
  cashPaid: number;
  dueAmount: number;
  invoiceNumber: string;
  dateOfPurchase: string;
}

export async function fetchPurchases(tenantId: string, params?: Record<string, string>): Promise<{ purchases: Purchase[]; total: number }> {
  const res = await api.get('/purchases', { params, headers: { 'X-Tenant-Id': tenantId } });
  const data = res.data;
  return { purchases: data?.items || [], total: data?.total || 0 };
}

export async function createPurchase(tenantId: string, purchase: CreatePurchaseData): Promise<Purchase> {
  const res = await api.post('/purchases', purchase, { headers: { 'X-Tenant-Id': tenantId } });
  return res.data;
}

export async function deletePurchase(tenantId: string, id: string): Promise<void> {
  await api.delete(`/purchases/${id}`, { headers: { 'X-Tenant-Id': tenantId } });
}
