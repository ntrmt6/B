import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialFollow extends Document {
  _id: mongoose.Types.ObjectId;
  followerId: mongoose.Types.ObjectId;
  followeeId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SocialFollowSchema = new Schema<ISocialFollow>({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  followeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

SocialFollowSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });

export const SocialFollow = mongoose.model<ISocialFollow>('SocialFollow', SocialFollowSchema);
