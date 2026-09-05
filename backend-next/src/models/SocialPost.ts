import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  kind: 'post' | 'short';
  text?: string;
  images: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  visibility: 'public' | 'followers';
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema = new Schema<ISocialPost>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: { type: String, enum: ['post', 'short'], default: 'post', index: true },
  text: { type: String, trim: true, maxlength: 5000 },
  images: [{ type: String }],
  videoUrl: { type: String },
  thumbnailUrl: { type: String },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  visibility: { type: String, enum: ['public', 'followers'], default: 'public' },
}, { timestamps: true });

SocialPostSchema.index({ kind: 1, createdAt: -1 });
SocialPostSchema.index({ authorId: 1, createdAt: -1 });

export const SocialPost = mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);
