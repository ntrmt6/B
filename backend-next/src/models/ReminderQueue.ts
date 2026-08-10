import mongoose, { Schema, Document } from 'mongoose';

export type ReminderStatus = 'pending' | 'sent' | 'dismissed';

export interface IReminderQueueItem extends Document {
  tenantId: string;
  entityId: mongoose.Types.ObjectId;
  entityName: string;
  phone: string;
  totalDue: number;
  oldestTxDate: Date;
  daysOverdue: number;
  txCount: number;
  triggerReason: string;
  message: string;
  status: ReminderStatus;
  generatedAt: Date;
  generatedDay: string;
  sentAt?: Date;
  expiresAt: Date;
}

const ReminderQueueSchema = new Schema<IReminderQueueItem>({
  tenantId: { type: String, required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, ref: 'Entity', required: true, index: true },
  entityName: { type: String, required: true },
  phone: { type: String, required: true },
  totalDue: { type: Number, required: true },
  oldestTxDate: { type: Date, required: true },
  daysOverdue: { type: Number, required: true },
  txCount: { type: Number, required: true },
  triggerReason: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'dismissed'], default: 'pending', index: true },
  generatedAt: { type: Date, default: () => new Date() },
  generatedDay: { type: String, required: true },
  sentAt: { type: Date },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

// Prevent duplicates: one reminder per (tenant, entity, day)
ReminderQueueSchema.index(
  { tenantId: 1, entityId: 1, generatedDay: 1 },
  { unique: true }
);
ReminderQueueSchema.index({ tenantId: 1, status: 1, generatedAt: -1 });

export const ReminderQueue = mongoose.model<IReminderQueueItem>(
  'ReminderQueueItem',
  ReminderQueueSchema
);
