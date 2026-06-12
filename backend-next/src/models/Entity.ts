import mongoose, { Schema, Document } from 'mongoose';

export interface IEntity extends Document {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: 'Customer' | 'Supplier' | 'Employee';
  totalOwedToMe: number;
  totalIOweThemNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const EntitySchema = new Schema<IEntity>(
  {
    tenantId: {
      type: String,
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['Customer', 'Supplier', 'Employee'],
      required: [true, 'Please specify entity type'],
    },
    totalOwedToMe: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalIOweThemNumber: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
EntitySchema.index({ tenantId: 1, type: 1, name: 1 });
EntitySchema.index({ tenantId: 1, phone: 1 }, { unique: true });
EntitySchema.index({ tenantId: 1, createdAt: -1 });

export const Entity = mongoose.model<IEntity>('Entity', EntitySchema);
