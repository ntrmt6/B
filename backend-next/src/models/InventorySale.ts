import mongoose, { Schema, Document } from 'mongoose';

export interface IInventorySale extends Document {
  tenantId: string;
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  qty: number;
  salePrice: number;
  buyPriceSnapshot: number;
  profit: number;
  entityId?: mongoose.Types.ObjectId;
  entityName?: string;
  transactionId?: mongoose.Types.ObjectId;
  soldAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySaleSchema = new Schema<IInventorySale>(
  {
    tenantId: { type: String, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0.0001 },
    salePrice: { type: Number, required: true, min: 0 },
    buyPriceSnapshot: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    entityId: { type: Schema.Types.ObjectId, ref: 'Entity' },
    entityName: { type: String, trim: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    soldAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

InventorySaleSchema.index({ tenantId: 1, soldAt: -1 });
InventorySaleSchema.index({ tenantId: 1, itemId: 1, soldAt: -1 });

export const InventorySale = mongoose.model<IInventorySale>('InventorySale', InventorySaleSchema);
