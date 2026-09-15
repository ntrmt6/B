import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderStatus = 'new' | 'making' | 'ready' | 'cancelled';
export type OrderPayment = 'nagad' | 'bkash' | 'baki';

export interface IOrderItem {
  menuItemId?: string;
  nameBn: string;
  priceAt: number;
  qty: number;
  note?: string;
}

export interface IOrder extends Document {
  tenantId: string;
  code: string;
  items: IOrderItem[];
  customerName?: string;
  entityId?: Types.ObjectId;
  linkedTxId?: Types.ObjectId;
  note?: string;
  paymentMethod: OrderPayment;
  total: number;
  status: OrderStatus;
  createdByRole: 'owner' | 'employee';
  cancelledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: String },
    nameBn: { type: String, required: true, maxlength: 80 },
    priceAt: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 999 },
    note: { type: String, maxlength: 120 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    tenantId: { type: String, required: true, index: true },
    code: { type: String, required: true, maxlength: 12 },
    items: { type: [OrderItemSchema], required: true, validate: [(v: unknown[]) => v.length > 0, 'Order must have at least one item'] },
    customerName: { type: String, trim: true, maxlength: 80 },
    entityId: { type: Schema.Types.ObjectId, ref: 'Entity' },
    linkedTxId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    note: { type: String, maxlength: 240 },
    paymentMethod: { type: String, enum: ['nagad', 'bkash', 'baki'], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['new', 'making', 'ready', 'cancelled'], default: 'new' },
    createdByRole: { type: String, enum: ['owner', 'employee'], default: 'owner' },
    cancelledReason: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, status: 1, createdAt: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
