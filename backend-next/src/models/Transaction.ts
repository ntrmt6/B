import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  tenantId: string;
  entityId: mongoose.Types.ObjectId;
  entityName: string;
  amount: number;
  direction: 'INCOME' | 'EXPENSE';
  transactionDate: Date;
  dueDate?: Date;
  notes?: string;
  items?: string;
  transactionType?: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    tenantId: {
      type: String,
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      ref: 'Entity',
      required: [true, 'Please provide entity ID'],
      index: true,
    },
    entityName: {
      type: String,
      required: [true, 'Please provide entity name'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide amount'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    direction: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: [true, 'Please specify transaction direction'],
    },
    transactionDate: {
      type: Date,
      required: [true, 'Please provide transaction date'],
    },
    dueDate: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    items: {
      type: String,
      maxlength: [500, 'Items cannot exceed 500 characters'],
    },
    transactionType: {
      type: String,
      maxlength: [100, 'Transaction type cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
TransactionSchema.index({ tenantId: 1, entityId: 1, transactionDate: -1 });
TransactionSchema.index({ tenantId: 1, status: 1, transactionDate: -1 });
TransactionSchema.index({ tenantId: 1, transactionDate: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
