import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeAdvance extends Document {
  tenantId: string;
  deviceId: string;
  employeeLabel: string;
  month: string; // YYYY-MM in Asia/Dhaka
  amount: number;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeAdvanceSchema = new Schema<IEmployeeAdvance>(
  {
    tenantId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    employeeLabel: { type: String, trim: true, maxlength: 100, default: 'কর্মচারী' },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

EmployeeAdvanceSchema.index({ tenantId: 1, month: 1 });
EmployeeAdvanceSchema.index({ tenantId: 1, deviceId: 1, month: 1 });

export const EmployeeAdvance = mongoose.model<IEmployeeAdvance>(
  'EmployeeAdvance',
  EmployeeAdvanceSchema
);
