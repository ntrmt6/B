import mongoose, { Document, Schema } from 'mongoose';

export interface ISMSHistory extends Document {
  tenantId: string;
  recipients: string[];
  message: string;
  type: 'sms' | 'voice';
  status: 'pending' | 'sent' | 'failed' | 'partial';
  sentCount: number;
  failedCount: number;
  results?: Array<{ phone: string; success: boolean; error?: string; messageId?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const SMSHistorySchema = new Schema<ISMSHistory>(
  {
    tenantId: { type: String, required: true, index: true },
    recipients: [{ type: String, required: true }],
    message: { type: String, required: true },
    type: { type: String, enum: ['sms', 'voice'], default: 'sms' },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'partial'], default: 'pending' },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    results: [{
      phone: String,
      success: Boolean,
      error: String,
      messageId: String,
    }],
  },
  { timestamps: true }
);

SMSHistorySchema.index({ tenantId: 1, createdAt: -1 });

export const SMSHistory = mongoose.model<ISMSHistory>('SMSHistory', SMSHistorySchema);
export default SMSHistory;
