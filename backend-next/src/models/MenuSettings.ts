import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuSettings extends Document {
  tenantId: string;
  shopNameBn: string;
  taglineBn: string;
  footerNotesBn: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuSettingsSchema = new Schema<IMenuSettings>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    shopNameBn: { type: String, trim: true, maxlength: 120, default: '' },
    taglineBn: { type: String, trim: true, maxlength: 160, default: '' },
    footerNotesBn: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const MenuSettings = mongoose.model<IMenuSettings>('MenuSettings', MenuSettingsSchema);
