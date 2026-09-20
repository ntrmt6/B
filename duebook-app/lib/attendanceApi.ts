import api from './api';

export interface AttendanceRow {
  _id: string;
  tenantId: string;
  deviceId: string;
  employeeLabel: string;
  date: string;
  markedAt: string;
  dailyRate: number;
}

export interface AttendanceMe {
  month: string;
  today: string;
  markedToday: boolean;
  currentRate: number;
  totalDays: number;
  totalSalary: number;
  rows: AttendanceRow[];
}

export interface AttendanceEmployeeSummary {
  deviceId: string;
  label: string;
  days: number;
  totalSalary: number;
  advances: number;
  netSalary: number;
  dates: string[];
  revoked?: boolean;
}

export interface AttendanceReport {
  month: string;
  employees: AttendanceEmployeeSummary[];
  totals: { days: number; salary: number; advances: number; netSalary: number };
}

export interface EmployeeAdvance {
  _id: string;
  tenantId: string;
  deviceId: string;
  employeeLabel: string;
  month: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface PayslipData {
  month: string;
  shopName: string;
  shopLogo: string;
  employee: { deviceId: string; label: string };
  days: number;
  rows: AttendanceRow[];
  advances: EmployeeAdvance[];
  totals: { gross: number; advances: number; net: number };
}

export async function getAttendanceConfig(): Promise<{ dailyAttendanceRate: number }> {
  const r = await api.get('/duebook/attendance/config');
  return r.data;
}

export async function setAttendanceConfig(dailyAttendanceRate: number): Promise<{ dailyAttendanceRate: number }> {
  const r = await api.put('/duebook/attendance/config', { dailyAttendanceRate });
  return r.data;
}

export async function markAttendance(): Promise<{ ok: boolean; attendance: AttendanceRow; alreadyMarked: boolean }> {
  const r = await api.post('/duebook/attendance/mark', {});
  return r.data;
}

export async function getMyAttendance(month?: string): Promise<AttendanceMe> {
  const r = await api.get('/duebook/attendance/me', { params: month ? { month } : {} });
  return r.data;
}

export async function getAttendanceReport(month?: string): Promise<AttendanceReport> {
  const r = await api.get('/duebook/attendance/report', { params: month ? { month } : {} });
  return r.data;
}

export async function listAdvances(month?: string): Promise<{ month: string; advances: EmployeeAdvance[] }> {
  const r = await api.get('/duebook/attendance/advances', { params: month ? { month } : {} });
  return r.data;
}

export async function createAdvance(payload: { deviceId: string; amount: number; note?: string; month?: string }): Promise<EmployeeAdvance> {
  const r = await api.post('/duebook/attendance/advances', payload);
  return r.data;
}

export async function deleteAdvance(id: string): Promise<{ ok: boolean }> {
  const r = await api.delete(`/duebook/attendance/advances/${id}`);
  return r.data;
}

export async function getPayslip(deviceId: string, month?: string): Promise<PayslipData> {
  const r = await api.get('/duebook/attendance/payslip', { params: { deviceId, ...(month ? { month } : {}) } });
  return r.data;
}
