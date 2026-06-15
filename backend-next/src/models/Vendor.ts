import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  description?: string;
  logo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  commissionRate: number; // Percentage (e.g. 10 means tenant takes 10%)
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  userId?: mongoose.Types.ObjectId; // Link to User who manages this vendor
  bankInfo?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    routingNumber?: string;
  };
  customDomain?: string;
  domainVerified?: boolean;
  totalSales: number;
  totalCommission: number;
  balance: number; // Pending payout balance
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>({
  tenantId: { type: String, required: true, index: true, trim: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  description: { type: String, trim: true },
  logo: { type: String },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  commissionRate: { type: Number, required: true, default: 10, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending',
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  bankInfo: {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    routingNumber: { type: String, trim: true },
  },
  customDomain: { type: String, trim: true, lowercase: true, sparse: true },
  domainVerified: { type: Boolean, default: false },
  totalSales: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Compound indexes for tenant isolation and fast lookups
VendorSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
VendorSchema.index({ tenantId: 1, email: 1 }, { unique: true });
VendorSchema.index({ tenantId: 1, status: 1 });
VendorSchema.index({ userId: 1 });
VendorSchema.index({ customDomain: 1 }, { unique: true, sparse: true });

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
