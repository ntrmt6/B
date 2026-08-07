import mongoose, { Schema, Document } from 'mongoose';

export interface IDueBookSettings extends Document {
  tenantId: string;
  shopName: string;
  registrationEnabled: boolean;
  bonusAmount: number;
  welcomeMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const DueBookSettingsSchema = new Schema<IDueBookSettings>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    shopName: { type: String, trim: true, maxlength: 120, default: '' },
    registrationEnabled: { type: Boolean, default: true },
    bonusAmount: { type: Number, default: 0, min: 0 },
    welcomeMessage: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

export const DueBookSettings = mongoose.model<IDueBookSettings>(
  'DueBookSettings',
  DueBookSettingsSchema
);
