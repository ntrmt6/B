import { Order } from '../../../types';

export type ReviewStatus = 'approved' | 'pending' | 'rejected';

export interface ReviewItem {
  _id: string;
  productId: number;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  headline?: string;
  comment: string;
  verified: boolean;
  status: ReviewStatus;
  helpful: number;
  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  firstOrderDate: string;
  avgOrderValue: number;
  orders: Order[];
  avatar?: string;
  status: 'Active' | 'Blocked';
  serialNumber: number;
  /** true for customers saved manually via Add Customer form */
  isManual?: boolean;
  company?: string;
}
