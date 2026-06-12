import mongoose, { Document, Schema } from 'mongoose';

export interface ISMSConfig extends Document {
  tenantId: string;
  provider: string;
  apiKey: string;
  apiToken: string;
  apiUrl: string;
  userId: string;
  senderId: string;
  voiceSupported: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SMSConfigSchema: Schema = new Schema({
  tenantId: { type: String, required: true, unique: true },
  provider: { type: String, default: 'greenweb' },
  apiKey: { type: String, default: '' },
  apiToken: { type: String, default: '' },
  apiUrl: { type: String, default: '' },
  userId: { type: String, default: '' },
  senderId: { type: String, default: '' },
  voiceSupported: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

export const SMSConfig = mongoose.model<ISMSConfig>('SMSConfig', SMSConfigSchema);
