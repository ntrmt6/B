import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  tenantId: string;
  deviceId: string;
  employeeLabel: string;
  date: string; // YYYY-MM-DD in Asia/Dhaka
  markedAt: Date;
  dailyRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    tenantId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    employeeLabel: { type: String, trim: true, maxlength: 100, default: 'কর্মচারী' },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    markedAt: { type: Date, default: () => new Date() },
    dailyRate: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

AttendanceSchema.index({ tenantId: 1, deviceId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ tenantId: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
