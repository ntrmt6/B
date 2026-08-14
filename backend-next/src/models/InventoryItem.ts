import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  tenantId: string;
  name: string;
  unit?: string;
  stockQty: number;
  buyPrice: number;
  sellPrice: number;
  lowStockThreshold: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    unit: { type: String, trim: true, maxlength: 20 },
    stockQty: { type: Number, required: true, default: 0, min: 0 },
    buyPrice: { type: Number, required: true, default: 0, min: 0 },
    sellPrice: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

InventoryItemSchema.index({ tenantId: 1, name: 1 });
InventoryItemSchema.index({ tenantId: 1, createdAt: -1 });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
