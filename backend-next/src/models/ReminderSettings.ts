import mongoose, { Schema, Document } from 'mongoose';

export interface IReminderSettings extends Document {
  tenantId: string;
  enabled: boolean;
  triggerDaysOverdue: number[];
  minAmount: number;
  cooldownDays: number;
  runHourLocal: number;
  maxRemindersPerRun: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSettingsSchema = new Schema<IReminderSettings>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    triggerDaysOverdue: {
      type: [Number],
      default: [3, 7, 14, 30],
      validate: {
        validator: (v: number[]) => v.every((n) => Number.isInteger(n) && n >= 0 && n <= 365),
        message: 'triggerDaysOverdue values must be integers in 0..365',
      },
    },
    minAmount: { type: Number, default: 100, min: 0 },
    cooldownDays: { type: Number, default: 3, min: 0, max: 365 },
    runHourLocal: { type: Number, default: 9, min: 0, max: 23 },
    maxRemindersPerRun: { type: Number, default: 50, min: 1, max: 1000 },
  },
  { timestamps: true }
);

export const ReminderSettings = mongoose.model<IReminderSettings>(
  'ReminderSettings',
  ReminderSettingsSchema
);
