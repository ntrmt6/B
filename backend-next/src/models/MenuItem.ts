import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  tenantId: string;
  nameBn: string;
  price: number;
  category: string;
  available: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    tenantId: { type: String, required: true, index: true },
    nameBn: { type: String, required: true, trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 40, default: 'অন্যান্য' },
    available: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MenuItemSchema.index({ tenantId: 1, sortOrder: 1 });
MenuItemSchema.index({ tenantId: 1, category: 1, sortOrder: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
