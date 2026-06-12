import api from '@/lib/api';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  productId?: string | number;
}

export interface Order {
  _id?: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  total?: number;
  grandTotal?: number;
  status: string;
  items?: OrderItem[];
  createdAt: string;
  paymentMethod?: string;
  address?: string;
  deliveryCharge?: number;
  discount?: number;
  note?: string;
  source?: string;
}

export interface CreateOrderData {
  customer: string;
  phone?: string;
  amount: number;
  items: OrderItem[];
  paymentMethod: string;
  deliveryCharge?: number;
  discount?: number;
  note?: string;
  status?: string;
  source?: string;
}

export async function fetchOrders(tenantId: string, params?: Record<string, string>): Promise<{ orders: Order[]; total: number }> {
  const mapped: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (k === 'query') mapped.search = v;
      else if (k === 'pageSize') mapped.perPage = v;
      else mapped[k] = v;
    }
  }
  const res = await api.get(`/orders/${tenantId}`, { params: mapped });
  const orders = Array.isArray(res.data?.data) ? res.data.data : [];
  return { orders, total: orders.length };
}

export async function createOrder(tenantId: string, data: CreateOrderData): Promise<Order> {
  const res = await api.post(`/orders/${tenantId}`, data);
  return res.data;
}

export async function updateOrder(tenantId: string, orderId: string, updates: Partial<Order>): Promise<void> {
  await api.patch(`/orders/${tenantId}/${orderId}`, updates);
}

export async function deleteOrder(tenantId: string, orderId: string): Promise<void> {
  await api.delete(`/orders/${tenantId}/${orderId}`);
}
