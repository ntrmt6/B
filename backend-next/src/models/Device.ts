import mongoose, { Schema, Document } from 'mongoose';

export type DeviceRole = 'owner' | 'employee';

export interface IDevice extends Document {
  tenantId: string;
  role: DeviceRole;
  label: string;
  tokenHash: string;
  pairCode?: string;
  pairCodeExpiresAt?: Date;
  pairCodeConsumed: boolean;
  lastSeenAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    tenantId: { type: String, required: true, index: true },
    role: { type: String, enum: ['owner', 'employee'], required: true },
    label: { type: String, trim: true, maxlength: 60, default: 'কর্মচারী' },
    tokenHash: { type: String, required: true, index: true },
    pairCode: { type: String, maxlength: 12 },
    pairCodeExpiresAt: { type: Date },
    pairCodeConsumed: { type: Boolean, default: false },
    lastSeenAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

DeviceSchema.index({ tenantId: 1, role: 1, revokedAt: 1 });
DeviceSchema.index({ pairCode: 1, pairCodeExpiresAt: 1 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
