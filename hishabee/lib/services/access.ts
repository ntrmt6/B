import api from '@/lib/api';

// Types
export interface AccessUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'staff';
  roleId?: string | { _id: string; name: string; description?: string };
  tenantId?: string;
  isActive: boolean;
  image?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface AccessRole {
  _id: string;
  name: string;
  description: string;
  tenantId?: string;
  isSystem: boolean;
  permissions: { resource: string; actions: string[] }[];
  createdAt?: string;
}

export interface ResourceInfo {
  id: string;
  name: string;
  actions: string[];
}

// Normalize user from backend
function normalizeUser(u: Record<string, unknown>): AccessUser {
  return {
    _id: (u._id || u.id) as string,
    name: (u.name || '') as string,
    email: (u.email || '') as string,
    phone: u.phone as string | undefined,
    role: (u.role || 'staff') as AccessUser['role'],
    roleId: u.roleId as AccessUser['roleId'],
    tenantId: u.tenantId as string | undefined,
    isActive: u.isActive !== false,
    image: u.image as string | undefined,
    lastLogin: u.lastLogin as string | undefined,
    createdAt: u.createdAt as string | undefined,
  };
}

// === User Management ===

export async function fetchUsers(tenantId?: string): Promise<AccessUser[]> {
  const params: Record<string, string> = {};
  if (tenantId) params.tenantId = tenantId;
  const res = await api.get('/auth/admin/users', { params });
  const users = res.data?.users || res.data || [];
  return users.map(normalizeUser);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  roleId?: string;
  tenantId?: string;
}): Promise<AccessUser> {
  const res = await api.post('/auth/admin/users', data);
  return normalizeUser(res.data?.user || res.data);
}

export async function updateUser(
  id: string,
  data: { name?: string; phone?: string; role?: string; roleId?: string; isActive?: boolean }
): Promise<AccessUser> {
  const res = await api.put(`/auth/admin/users/${id}`, data);
  return normalizeUser(res.data?.user || res.data);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/auth/admin/users/${id}`);
}

export async function updateUserRole(id: string, roleId: string): Promise<AccessUser> {
  const res = await api.patch(`/auth/admin/users/${id}/role`, { roleId });
  return normalizeUser(res.data?.data || res.data?.user || res.data);
}

// === Role Management ===

export async function fetchRoles(tenantId?: string): Promise<AccessRole[]> {
  const params: Record<string, string> = {};
  if (tenantId) params.tenantId = tenantId;
  const res = await api.get('/auth/admin/roles', { params });
  return res.data?.data || res.data || [];
}

export async function createRole(data: {
  name: string;
  description?: string;
  tenantId?: string;
  permissions?: { resource: string; actions: string[] }[];
}): Promise<AccessRole> {
  const res = await api.post('/auth/admin/roles', data);
  return res.data?.data || res.data;
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissions?: { resource: string; actions: string[] }[] }
): Promise<AccessRole> {
  const res = await api.put(`/auth/admin/roles/${id}`, data);
  return res.data?.data || res.data;
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/auth/admin/roles/${id}`);
}

export async function fetchResources(): Promise<{ resources: ResourceInfo[]; actions: string[] }> {
  const res = await api.get('/auth/admin/resources');
  return res.data;
}
