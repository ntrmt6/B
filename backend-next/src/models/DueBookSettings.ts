import mongoose, { Schema, Document } from 'mongoose';

export type BkashType = 'personal' | 'merchant' | 'agent';

export interface IDueBookSettings extends Document {
  tenantId: string;
  shopName: string;
  registrationEnabled: boolean;
  bonusAmount: number;
  rewardItemName: string;
  rewardItemPrice: number;
  paymentRewardThreshold: number;
  welcomeMessage: string;
  shopLogo: string;
  dailyAttendanceRate: number;
  bkashNumber: string;
  bkashType: BkashType;
  nagadNumber: string;
  rocketNumber: string;
  paymentLinkUrl: string;
  paymentNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const DueBookSettingsSchema = new Schema<IDueBookSettings>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    shopName: { type: String, trim: true, maxlength: 120, default: '' },
    registrationEnabled: { type: Boolean, default: true },
    bonusAmount: { type: Number, default: 0, min: 0 },
    rewardItemName: { type: String, trim: true, maxlength: 100, default: '' },
    rewardItemPrice: { type: Number, default: 0, min: 0 },
    paymentRewardThreshold: { type: Number, default: 0, min: 0 },
    welcomeMessage: { type: String, trim: true, maxlength: 300, default: '' },
    shopLogo: { type: String, default: '' },
    dailyAttendanceRate: { type: Number, default: 0, min: 0 },
    bkashNumber: { type: String, trim: true, maxlength: 20, default: '' },
    bkashType: {
      type: String,
      enum: ['personal', 'merchant', 'agent'],
      default: 'personal',
    },
    nagadNumber: { type: String, trim: true, maxlength: 20, default: '' },
    rocketNumber: { type: String, trim: true, maxlength: 20, default: '' },
    paymentLinkUrl: { type: String, trim: true, maxlength: 500, default: '' },
    paymentNote: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

export const DueBookSettings = mongoose.model<IDueBookSettings>(
  'DueBookSettings',
  DueBookSettingsSchema
);
