'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUsers, fetchRoles, fetchResources, createUser, updateUser,
  deleteUser, updateUserRole, createRole, updateRole, deleteRole,
  type AccessUser, type AccessRole, type ResourceInfo,
} from '@/lib/services/access';
import {
  ArrowLeft, ChevronRight, Plus, Search, Shield, UserCog,
  Edit2, Trash2, Save, X, Phone, Eye, EyeOff, Check, ToggleLeft, ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

type View = 'users' | 'roles' | 'addUser' | 'editUser' | 'addRole' | 'editRole';

const MIN_PASSWORD_LENGTH = 6;

function getInitials(name: string) {
  return name.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getRoleName(u: AccessUser, roles: AccessRole[]): string {
  if (u.roleId) {
    if (typeof u.roleId === 'object' && u.roleId.name) return u.roleId.name;
    const r = roles.find(r => r._id === u.roleId);
    if (r) return r.name;
  }
  return u.role.replace(/_/g, ' ');
}

function roleBadgeColor(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('super') || r.includes('owner')) return 'bg-amber-100 text-amber-700 border border-amber-300';
  if (r.includes('admin') || r.includes('authority') || r.includes('manager')) return 'bg-blue-100 text-blue-700 border border-blue-300';
  if (r.includes('staff') || r.includes('developer') || r.includes('sales')) return 'bg-orange-100 text-orange-700 border border-orange-300';
  if (r.includes('viewer')) return 'bg-gray-100 text-gray-600 border border-gray-300';
  return 'bg-gray-100 text-gray-600 border border-gray-300';
}

const ADMIN_ROLES = ['admin', 'super_admin', 'tenant_admin'];

export default function AccessPage() {
  const { user: currentUser, tenantId } = useAuth();
  const [view, setView] = useState<View>('users');
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [allActions, setAllActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isAdmin = currentUser ? ADMIN_ROLES.includes(currentUser.role) : false;
  const [editingUser, setEditingUser] = useState<AccessUser | null>(null);
  const [editingRole, setEditingRole] = useState<AccessRole | null>(null);

  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [u, r, res] = await Promise.all([
        fetchUsers(tenantId || undefined),
        fetchRoles(tenantId || undefined),
        fetchResources(),
      ]);
      setUsers(u);
      setRoles(r);
      setResources(res.resources || []);
      setAllActions(res.actions || ['read', 'write', 'edit', 'delete']);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tenantId, isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  // Navigate helpers
  const goUsers = () => { setView('users'); setEditingUser(null); };
  const goRoles = () => { setView('roles'); setEditingRole(null); };
  const goAddUser = () => setView('addUser');
  const goEditUser = (u: AccessUser) => { setEditingUser(u); setView('editUser'); };
  const goAddRole = () => setView('addRole');
  const goEditRole = (r: AccessRole) => { setEditingRole(r); setView('editRole'); };

  // User handlers
  const handleCreateUser = async (data: { name: string; email: string; password: string; phone?: string; roleId?: string }) => {
    try {
      await createUser({ ...data, tenantId: tenantId || undefined });
      toast.success('User created');
      await loadData();
      goUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user';
      toast.error(msg);
    }
  };

  const handleUpdateUser = async (id: string, data: { name?: string; phone?: string; roleId?: string; isActive?: boolean }) => {
    try {
      await updateUser(id, data);
      toast.success('User updated');
      await loadData();
      goUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update user';
      toast.error(msg);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete user';
      toast.error(msg);
    }
  };

  const handleChangeRole = async (userId: string, roleId: string) => {
    try {
      await updateUserRole(userId, roleId);
      toast.success('Role updated');
      await loadData();
    } catch {
      toast.error('Failed to update role');
    }
  };

  // Role handlers
  const handleCreateRole = async (data: { name: string; description?: string; permissions: { resource: string; actions: string[] }[] }) => {
    try {
      await createRole({ ...data, tenantId: tenantId || undefined });
      toast.success('Role created');
      await loadData();
      goRoles();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create role';
      toast.error(msg);
    }
  };

  const handleUpdateRole = async (id: string, data: { name?: string; description?: string; permissions?: { resource: string; actions: string[] }[] }) => {
    try {
      await updateRole(id, data);
      toast.success('Role updated');
      await loadData();
      goRoles();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update role';
      toast.error(msg);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
      await deleteRole(id);
      toast.success('Role deleted');
      setRoles(prev => prev.filter(r => r._id !== id));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete role';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-amber-400 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeft size={20} className="text-gray-800" />
            <span className="font-bold text-gray-900">Access Management</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // === NOT AUTHORIZED VIEW ===
  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-amber-400 px-4 py-3 flex items-center gap-2">
          <Shield size={20} className="text-gray-800" />
          <span className="font-bold text-gray-900">Access Management</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
          <Shield size={40} className="text-gray-300" />
          <p className="font-semibold text-gray-700">Access Restricted</p>
          <p className="text-sm text-gray-500">You don&apos;t have permission to manage access.</p>
        </div>
      </div>
    );
  }

  // === USER LIST VIEW ===
  if (view === 'users') {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-amber-400 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-gray-800" />
            <span className="font-bold text-gray-900">Access Management</span>
          </div>
          <button onClick={goRoles} className="flex items-center gap-1 bg-white/80 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white">
            Access Role ({roles.length}) <ChevronRight size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 bg-white border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserCog size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">{search ? 'No users match' : 'No users yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map(u => {
                const rName = getRoleName(u, roles);
                const isSelf = u._id === currentUser?._id;
                return (
                  <div key={u._id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0 overflow-hidden">
                      {u.image ? (
                        <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(u.name || 'U')
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm truncate">{u.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${roleBadgeColor(rName)}`}>
                          {rName}
                        </span>
                        {!u.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">Inactive</span>}
                        {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-600">You</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {u.phone && <span className="flex items-center gap-1"><Phone size={10} /> {u.phone}</span>}
                        {!u.phone && <span>{u.email}</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => goEditUser(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 size={14} />
                      </button>
                      {!isSelf && (
                        <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Add Button */}
        <div className="p-3 bg-white border-t">
          <button onClick={goAddUser} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={18} /> Add New User
          </button>
        </div>
      </div>
    );
  }

  // === ROLE LIST VIEW ===
  if (view === 'roles') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-amber-400 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goUsers}><ArrowLeft size={20} className="text-gray-800" /></button>
            <span className="font-bold text-gray-900">Access Roles</span>
          </div>
          <button onClick={goAddRole} className="flex items-center gap-1 bg-white/80 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white">
            <Plus size={16} /> New Role
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No roles defined</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {roles.map(r => {
                const userCount = users.filter(u => {
                  const rid = typeof u.roleId === 'object' ? u.roleId?._id : u.roleId;
                  return rid === r._id;
                }).length;
                return (
                  <div key={r._id} className="px-4 py-3 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{r.name}</span>
                          {r.isSystem && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">System</span>}
                          <span className="text-[10px] text-gray-400">{userCount} user{userCount !== 1 ? 's' : ''}</span>
                        </div>
                        {r.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{r.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.permissions.slice(0, 5).map(p => (
                            <span key={p.resource} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {p.resource.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {r.permissions.length > 5 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              +{r.permissions.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {!r.isSystem && (
                          <>
                            <button onClick={() => goEditRole(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteRole(r._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {r.isSystem && (
                          <button onClick={() => goEditRole(r)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded">
                            <Eye size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === ADD/EDIT USER VIEW ===
  if (view === 'addUser' || view === 'editUser') {
    return (
      <UserForm
        user={editingUser}
        roles={roles}
        onSave={(data) => {
          if (view === 'editUser' && editingUser) {
            handleUpdateUser(editingUser._id, data);
          } else {
            handleCreateUser(data as { name: string; email: string; password: string; phone?: string; roleId?: string });
          }
        }}
        onCancel={goUsers}
        onChangeRole={handleChangeRole}
      />
    );
  }

  // === ADD/EDIT ROLE VIEW ===
  if (view === 'addRole' || view === 'editRole') {
    return (
      <RoleForm
        role={editingRole}
        resources={resources}
        allActions={allActions}
        onSave={(data) => {
          if (view === 'editRole' && editingRole) {
            handleUpdateRole(editingRole._id, data);
          } else {
            handleCreateRole(data as { name: string; description?: string; permissions: { resource: string; actions: string[] }[] });
          }
        }}
        onCancel={goRoles}
        isSystem={editingRole?.isSystem || false}
      />
    );
  }

  return null;
}

// === USER FORM COMPONENT ===
function UserForm({
  user, roles, onSave, onCancel, onChangeRole,
}: {
  user: AccessUser | null;
  roles: AccessRole[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  onChangeRole: (userId: string, roleId: string) => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [roleId, setRoleId] = useState(() => {
    if (!user?.roleId) return '';
    return typeof user.roleId === 'object' ? user.roleId._id : user.roleId;
  });
  const [isActive, setIsActive] = useState(user?.isActive !== false);

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!isEdit && !email.trim()) { toast.error('Email is required'); return; }
    if (!isEdit && password.length < MIN_PASSWORD_LENGTH) { toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`); return; }

    if (isEdit) {
      const data: Record<string, unknown> = { name: name.trim(), phone: phone.trim() || undefined, isActive };
      if (roleId) data.roleId = roleId;
      onSave(data);
    } else {
      onSave({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        roleId: roleId || undefined,
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-amber-400 px-4 py-3 flex items-center gap-2">
        <button onClick={onCancel}><ArrowLeft size={20} className="text-gray-800" /></button>
        <span className="font-bold text-gray-900">{isEdit ? 'Edit User' : 'Add New User'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {!isEdit && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880..."
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {!isEdit && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Password *</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'} placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
                className="w-full border rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Assign Role</label>
          <select value={roleId} onChange={e => {
            setRoleId(e.target.value);
            if (isEdit && user) onChangeRole(user._id, e.target.value);
          }} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— No custom role —</option>
            {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>

        {isEdit && (
          <div className="flex items-center justify-between border rounded-lg px-3 py-2.5">
            <span className="text-sm text-gray-700">Account Active</span>
            <button onClick={() => setIsActive(!isActive)} className="text-blue-600">
              {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-400" />}
            </button>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t flex gap-2">
        <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Save size={16} /> {isEdit ? 'Update' : 'Create User'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 border px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50">
          <X size={16} /> Cancel
        </button>
      </div>
    </div>
  );
}

// === ROLE FORM COMPONENT ===
function RoleForm({
  role, resources, allActions, onSave, onCancel, isSystem,
}: {
  role: AccessRole | null;
  resources: ResourceInfo[];
  allActions: string[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isSystem: boolean;
}) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState<Record<string, string[]>>(() => {
    if (!role?.permissions) return {};
    const map: Record<string, string[]> = {};
    role.permissions.forEach(p => { map[p.resource] = [...p.actions]; });
    return map;
  });

  const toggleAction = (resource: string, action: string) => {
    if (isSystem) return;
    setPermissions(prev => {
      const current = prev[resource] || [];
      const has = current.includes(action);
      const updated = has ? current.filter(a => a !== action) : [...current, action];
      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[resource];
        return copy;
      }
      return { ...prev, [resource]: updated };
    });
  };

  const toggleAllForResource = (resource: string) => {
    if (isSystem) return;
    setPermissions(prev => {
      const current = prev[resource] || [];
      if (current.length === allActions.length) {
        const copy = { ...prev };
        delete copy[resource];
        return copy;
      }
      return { ...prev, [resource]: [...allActions] };
    });
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Role name is required'); return; }
    const perms = Object.entries(permissions)
      .filter(([, actions]) => actions.length > 0)
      .map(([resource, actions]) => ({ resource, actions }));
    onSave({ name: name.trim(), description: description.trim(), permissions: perms });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-amber-400 px-4 py-3 flex items-center gap-2">
        <button onClick={onCancel}><ArrowLeft size={20} className="text-gray-800" /></button>
        <span className="font-bold text-gray-900">{isSystem ? `Role: ${role?.name}` : isEdit ? 'Edit Role' : 'New Role'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isSystem && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Role Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Manager"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Permissions</label>
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_repeat(4,40px)] bg-gray-100 px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>Resource</span>
              {allActions.map(a => <span key={a} className="text-center">{a.charAt(0).toUpperCase()}</span>)}
            </div>
            {/* Rows */}
            {resources.map(res => {
              const perm = permissions[res.id] || [];
              const allChecked = allActions.every(a => perm.includes(a));
              return (
                <div key={res.id} className="grid grid-cols-[1fr_repeat(4,40px)] px-3 py-1.5 border-t text-sm items-center hover:bg-gray-50">
                  <button onClick={() => toggleAllForResource(res.id)}
                    className={`text-left text-xs truncate ${allChecked ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                    {res.name}
                  </button>
                  {allActions.map(action => {
                    const checked = perm.includes(action);
                    return (
                      <button key={action} onClick={() => toggleAction(res.id, action)}
                        className={`w-6 h-6 mx-auto rounded border flex items-center justify-center transition-colors ${
                          checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-transparent hover:border-blue-400'
                        } ${isSystem ? 'cursor-default' : 'cursor-pointer'}`}
                        disabled={isSystem}>
                        <Check size={12} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!isSystem && (
        <div className="p-3 bg-white border-t flex gap-2">
          <button onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Save size={16} /> {isEdit ? 'Update Role' : 'Create Role'}
          </button>
          <button onClick={onCancel} className="flex items-center gap-1 border px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50">
            <X size={16} /> Cancel
          </button>
        </div>
      )}
      {isSystem && (
        <div className="p-3 bg-white border-t">
          <button onClick={onCancel} className="w-full flex items-center justify-center gap-1 border py-2.5 rounded-lg text-sm hover:bg-gray-50">
            <ArrowLeft size={16} /> Back to Roles
          </button>
        </div>
      )}
    </div>
  );
}
