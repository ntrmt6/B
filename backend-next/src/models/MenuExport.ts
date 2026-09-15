import mongoose, { Schema, Document } from 'mongoose';

export type MenuExportFormat = 'pdf-a4' | 'pdf-a5' | 'png';

export interface IMenuExport extends Document {
  tenantId: string;
  format: MenuExportFormat;
  fileName: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const MenuExportSchema = new Schema<IMenuExport>(
  {
    tenantId: { type: String, required: true, index: true },
    format: { type: String, enum: ['pdf-a4', 'pdf-a5', 'png'], required: true },
    fileName: { type: String, required: true, maxlength: 160 },
    itemCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

MenuExportSchema.index({ tenantId: 1, createdAt: -1 });

export const MenuExport = mongoose.model<IMenuExport>('MenuExport', MenuExportSchema);
