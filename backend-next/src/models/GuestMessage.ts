import mongoose, { Document, Schema } from 'mongoose';

export interface IGuestMessage extends Document {
  tenantId: string;
  sessionId: string;
  senderId?: string;          // populated when an authenticated user sends
  senderName: string;
  senderEmail?: string;
  text: string;
  sender: 'customer' | 'admin';
  isGuest: boolean;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GuestMessageSchema = new Schema<IGuestMessage>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    default: null,
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  senderEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 2000,
  },
  sender: {
    type: String,
    enum: ['customer', 'admin'],
    required: true,
  },
  isGuest: {
    type: Boolean,
    default: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
GuestMessageSchema.index({ tenantId: 1, sessionId: 1, createdAt: 1 });
GuestMessageSchema.index({ tenantId: 1, createdAt: -1 });

export const GuestMessage = mongoose.model<IGuestMessage>('GuestMessage', GuestMessageSchema);
