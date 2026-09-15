import api, { KEYS } from './api';

export interface PairCodeResponse {
  _id: string;
  pairCode: string;
  expiresAt: string;
  tenantId: string;
  label: string;
}

export interface PairedDevice {
  _id: string;
  role: 'owner' | 'employee';
  label: string;
  pairCode?: string;
  pairCodeExpiresAt?: string;
  pairCodeConsumed?: boolean;
  lastSeenAt?: string;
  createdAt: string;
}

export interface RedeemResponse {
  token: string;
  tenantId: string;
  role: 'employee';
  label: string;
  deviceId: string;
}

export async function generatePairCode(tid: string, label?: string): Promise<PairCodeResponse> {
  const r = await api.post('/duebook/pair/codes', { label }, { headers: { 'X-Tenant-Id': tid } });
  return r.data;
}

export async function listPairedDevices(tid: string): Promise<PairedDevice[]> {
  const r = await api.get('/duebook/pair/devices', { headers: { 'X-Tenant-Id': tid } });
  return r.data || [];
}

export async function revokePairedDevice(tid: string, id: string): Promise<void> {
  await api.delete(`/duebook/pair/devices/${id}`, { headers: { 'X-Tenant-Id': tid } });
}

export async function redeemPairCode(pairCode: string, tenantId: string): Promise<RedeemResponse> {
  const r = await api.post('/duebook/pair/redeem', { pairCode, tenantId });
  return r.data;
}

// Persist an employee session in the same localStorage keys the auth context uses.
export function applyEmployeeSession(resp: RedeemResponse) {
  const syntheticUser = {
    _id: `device:${resp.deviceId}`,
    name: resp.label || 'কর্মচারী',
    email: `device+${resp.deviceId}@duebook.local`,
    role: 'employee',
    tenantId: resp.tenantId,
  };
  localStorage.setItem(KEYS.token, resp.token);
  localStorage.setItem(KEYS.user, JSON.stringify(syntheticUser));
  localStorage.setItem(KEYS.tenantId, resp.tenantId);
  // Flag used by role-aware UI (main /due-book routes employees to orders view)
  localStorage.setItem('duebook_role', 'employee');
}

export function currentRole(): 'owner' | 'employee' | null {
  if (typeof window === 'undefined') return null;
  const r = localStorage.getItem('duebook_role');
  if (r === 'employee') return 'employee';
  const raw = localStorage.getItem(KEYS.user);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    if (u?.role === 'employee') return 'employee';
    return 'owner';
  } catch { return null; }
}
