import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyTarget extends Document {
  tenantId: string;
  date: string; // YYYY-MM-DD in the shopkeeper's local time
  targetSales: number;
  targetProfit: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyTargetSchema = new Schema<IDailyTarget>(
  {
    tenantId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    targetSales: { type: Number, required: true, default: 0, min: 0 },
    targetProfit: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

DailyTargetSchema.index({ tenantId: 1, date: 1 }, { unique: true });

export const DailyTarget = mongoose.model<IDailyTarget>('DailyTarget', DailyTargetSchema);
