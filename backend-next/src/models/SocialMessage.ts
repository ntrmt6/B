import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: string;
  lastMessageAt?: Date;
  lastSenderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SocialConversationSchema = new Schema<ISocialConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
  lastMessage: { type: String, trim: true, maxlength: 500 },
  lastMessageAt: { type: Date },
  lastSenderId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

SocialConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const SocialConversation = mongoose.model<ISocialConversation>('SocialConversation', SocialConversationSchema);

export interface ISocialMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text?: string;
  imageUrl?: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SocialMessageSchema = new Schema<ISocialMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'SocialConversation', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, trim: true, maxlength: 5000 },
  imageUrl: { type: String },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

SocialMessageSchema.index({ conversationId: 1, createdAt: -1 });

export const SocialMessage = mongoose.model<ISocialMessage>('SocialMessage', SocialMessageSchema);
