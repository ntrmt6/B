import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialComment extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  text: string;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SocialCommentSchema = new Schema<ISocialComment>({
  postId: { type: Schema.Types.ObjectId, ref: 'SocialPost', required: true, index: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'SocialComment', index: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  likeCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
}, { timestamps: true });

SocialCommentSchema.index({ postId: 1, createdAt: -1 });

export const SocialComment = mongoose.model<ISocialComment>('SocialComment', SocialCommentSchema);
