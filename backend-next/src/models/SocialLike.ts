import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialLike extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  targetType: 'post' | 'comment';
  targetId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SocialLikeSchema = new Schema<ISocialLike>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetType: { type: String, enum: ['post', 'comment'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

SocialLikeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export const SocialLike = mongoose.model<ISocialLike>('SocialLike', SocialLikeSchema);
