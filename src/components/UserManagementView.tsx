import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Key,
  Lock,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Check,
  X,
  Smartphone,
  Trash2,
  Edit3,
  Globe2,
  Shield,
  Layers,
} from 'lucide-react';
import { Role, EnterpriseUser, TenantAccessScope, PermissionKey } from '../types';

export const UserManagementView: React.FC = () => {
  const {
    enterpriseUsers,
    customRoles,
    tenants,
    activeTenant,
    activeRole,
    createEnterpriseUser,
    updateUserStatus,
    updateUserRoleAndScopes,
    toggleUserMfa,
    deleteEnterpriseUser,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'INVITED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Provision Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('Corporate Accounting');
  const [newUserRole, setNewUserRole] = useState<Role>('accountant');
  const [newUserMfa, setNewUserMfa] = useState(true);
  const [selectedTenantScopes, setSelectedTenantScopes] = useState<Record<string, Role>>({
    [activeTenant.id]: 'accountant',
  });

  // Edit Scopes Modal State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>('accountant');
  const [editScopes, setEditScopes] = useState<Record<string, Role>>({});

  // Alert State
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredUsers = enterpriseUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || u.defaultRole === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalUsersCount = enterpriseUsers.length;
  const activeCount = enterpriseUsers.filter((u) => u.status === 'ACTIVE').length;
  const mfaEnforcedCount = enterpriseUsers.filter((u) => u.mfaEnabled).length;
  const mfaPercent = Math.round((mfaEnforcedCount / (totalUsersCount || 1)) * 100);

  const handleOpenProvisionModal = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserTitle('');
    setNewUserDepartment('Corporate Accounting');
    setNewUserRole('accountant');
    setNewUserMfa(true);
    const initialScopes: Record<string, Role> = {};
    tenants.forEach((t) => {
      initialScopes[t.id] = 'accountant';
    });
    setSelectedTenantScopes(initialScopes);
    setIsModalOpen(true);
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'User full name and valid corporate email are required.' });
      return;
    }

    const tenantScopes: TenantAccessScope[] = Object.entries(selectedTenantScopes).map(
      ([tenantId, role]) => ({
        tenantId,
        role: role as Role,
      })
    );

    const result = createEnterpriseUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      title: newUserTitle.trim() || 'Financial Analyst',
      department: newUserDepartment,
      status: 'ACTIVE',
      mfaEnabled: newUserMfa,
      defaultRole: newUserRole,
      tenantScopes,
    });

    if (result.success) {
      setIsModalOpen(false);
      setStatusMessage({
        type: 'success',
        text: `Successfully provisioned enterprise account for ${newUserName} (${newUserEmail}).`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to provision user account.' });
    }
  };

  const handleStartEditScopes = (user: EnterpriseUser) => {
    setEditingUserId(user.id);
    setEditRole(user.defaultRole);
    const currentScopes: Record<string, Role> = {};
    user.tenantScopes.forEach((s) => {
      currentScopes[s.tenantId] = s.role;
    });
    // Fill missing tenants
    tenants.forEach((t) => {
      if (!currentScopes[t.id]) {
        currentScopes[t.id] = user.defaultRole;
      }
    });
    setEditScopes(currentScopes);
  };

  const handleSaveEditScopes = () => {
    if (!editingUserId) return;
    const formattedScopes: TenantAccessScope[] = Object.entries(editScopes).map(
      ([tenantId, role]) => ({ tenantId, role: role as Role })
    );

    updateUserRoleAndScopes(editingUserId, editRole, formattedScopes);
    setEditingUserId(null);
    setStatusMessage({ type: 'success', text: 'Updated user role and tenant access scopes successfully.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const permissionsList: { key: PermissionKey; label: string; category: string }[] = [
    { key: 'users:manage_global', label: 'Global User & Super Admin Provisioning', category: 'System Governance' },
    { key: 'users:manage_entity', label: 'Entity User & Role Provisioning', category: 'System Governance' },
    { key: 'users:manage_provisioning', label: 'User RBAC Assignment', category: 'System Governance' },
    { key: 'journals:create', label: 'Create Draft Journals', category: 'General Ledger' },
    { key: 'journals:post', label: 'Post Double-Entry Journals', category: 'General Ledger' },
    { key: 'journals:reverse', label: 'Execute Journal Reversals', category: 'General Ledger' },
    { key: 'ar:manage', label: 'Manage AR & Create Invoices', category: 'Sub-Ledgers' },
    { key: 'ap:manage', label: 'Manage AP & Process Bills', category: 'Sub-Ledgers' },
    { key: 'treasury:sweep', label: 'Execute Bank Vault Sweeps', category: 'Treasury' },
    { key: 'fpa:budget_edit', label: 'Adjust Cost-Center Budgets', category: 'FP&A' },
    { key: 'governance:approve', label: 'Approve High-Value Items', category: 'Governance' },
    { key: 'tax:settle', label: 'Post Tax Settlement Vouchers', category: 'Tax & Statutory' },
    { key: 'fiscal:lock_period', label: 'Toggle Fiscal Period Locks', category: 'Fiscal Period' },
    { key: 'fiscal:year_end_close', label: 'Execute Year-End Close', category: 'Fiscal Period' },
    { key: 'reports:export', label: 'Export Immutable Audit Reports', category: 'Audit' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Enterprise User Access & Provisioning</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold">
              SOX 404 Access Control
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provision identities, assign multi-tenant entity access scopes, enforce MFA policies, and manage granular RBAC matrices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'USERS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> User Directory ({totalUsersCount})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('MATRIX')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'MATRIX'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Permission Matrix
              </span>
            </button>
          </div>

          <button
            onClick={handleOpenProvisionModal}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Provision New User
          </button>
        </div>
      </div>

      {/* ACTIVE ACCESS SCOPE HIERARCHY BANNER */}
      <div className="p-4 rounded-2xl border bg-slate-900 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          {activeRole === 'super_user' && (
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-lg shadow-inner">
              ⚡
            </div>
          )}
          {activeRole === 'entity_admin' && (
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg shadow-inner">
              🏢
            </div>
          )}
          {activeRole === 'admin' && (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-lg shadow-inner">
              🛡️
            </div>
          )}
          {activeRole !== 'super_user' && activeRole !== 'entity_admin' && activeRole !== 'admin' && (
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-lg shadow-inner">
              🔒
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">Active Access Scope:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase ${
                activeRole === 'super_user'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : activeRole === 'entity_admin'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : activeRole === 'admin'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {activeRole === 'super_user' && 'Global Super User'}
                {activeRole === 'entity_admin' && `Entity Admin (${activeTenant.code})`}
                {activeRole === 'admin' && `Financial Admin (${activeTenant.code})`}
                {activeRole !== 'super_user' && activeRole !== 'entity_admin' && activeRole !== 'admin' && `${activeRole.toUpperCase()} (Restricted)`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeRole === 'super_user' && 'Unrestricted system authority: Create new users, delegate Entity Admin rights across all organizations, and manage global access.'}
              {activeRole === 'entity_admin' && `Scoped organization admin: Authorized to provision users and grant entity access within ${activeTenant.name} (${activeTenant.code}).`}
              {activeRole === 'admin' && `Financial tenant admin: Authorized to manage financial parameters and team access for ${activeTenant.name}.`}
              {activeRole !== 'super_user' && activeRole !== 'entity_admin' && activeRole !== 'admin' && 'Read-only viewer context. User provisioning and scope adjustments require Super User or Entity Admin status.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Current User:</span>
          <span className="text-indigo-300 font-bold">{useAccounting().userEmail}</span>
        </div>
      </div>

      {/* FEEDBACK STATUS ALERT */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TOP SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Active Provisioned Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{activeCount} / {totalUsersCount}</div>
          <p className="text-[11px] text-slate-500">Corporate Account Identity Roster</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>MFA Enforcement Rate</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{mfaPercent}%</div>
          <p className="text-[11px] text-slate-500">{mfaEnforcedCount} Users Hardware / App Secured</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Multi-Tenant Access Scopes</span>
            <Globe2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">{tenants.length} Entities</div>
          <p className="text-[11px] text-slate-500">Row-Level Tenant Access Guard</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Defined System Roles</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{customRoles.length} Roles</div>
          <p className="text-[11px] text-slate-500">SOX 404 Segregation of Duties</p>
        </div>
      </div>

      {activeTab === 'USERS' ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user by name, email, title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center flex-wrap gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 mr-1 font-semibold">Status:</span>
                {(['ALL', 'ACTIVE', 'SUSPENDED', 'INVITED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 text-slate-300 border border-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
              >
                <option value="ALL">All System Roles</option>
                <option value="super_user">⚡ Super User</option>
                <option value="entity_admin">🏢 Entity Admin</option>
                <option value="admin">Financial Admin</option>
                <option value="controller">Controller</option>
                <option value="accountant">Senior Accountant</option>
                <option value="junior_accountant">Junior Accountant</option>
                <option value="auditor">Auditor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          {/* USER ROSTER TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">User Identity</th>
                  <th className="py-3 px-4">Status & MFA</th>
                  <th className="py-3 px-4">Primary Role</th>
                  <th className="py-3 px-4">Tenant Access Scopes</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white font-sans text-sm">{user.name}</div>
                          <div className="text-[11px] text-slate-400 font-sans">{user.title} • {user.department}</div>
                          <div className="text-[10px] text-indigo-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {user.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> SUSPENDED
                          </span>
                        )}
                        {user.status === 'INVITED' && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> INVITED
                          </span>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Smartphone className={`w-3 h-3 ${user.mfaEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span>{user.mfaEnabled ? 'MFA Hardware Active' : 'No MFA Enforced'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.defaultRole === 'super_user' && (
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg text-[11px] font-extrabold uppercase inline-flex items-center gap-1 shadow-sm">
                          ⚡ SUPER USER
                        </span>
                      )}
                      {user.defaultRole === 'entity_admin' && (
                        <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-[11px] font-extrabold uppercase inline-flex items-center gap-1 shadow-sm">
                          🏢 ENTITY ADMIN
                        </span>
                      )}
                      {user.defaultRole === 'admin' && (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-extrabold uppercase inline-flex items-center gap-1">
                          🛡️ ADMIN
                        </span>
                      )}
                      {user.defaultRole === 'controller' && (
                        <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold uppercase">
                          CONTROLLER
                        </span>
                      )}
                      {user.defaultRole !== 'super_user' && user.defaultRole !== 'entity_admin' && user.defaultRole !== 'admin' && user.defaultRole !== 'controller' && (
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-bold uppercase">
                          {user.defaultRole.replace('_', ' ')}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.tenantScopes.map((scope) => {
                          const t = tenants.find((tenant) => tenant.id === scope.tenantId);
                          return (
                            <span
                              key={scope.tenantId}
                              className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] rounded text-slate-300"
                            >
                              <strong className="text-purple-400">{t?.code || scope.tenantId}</strong>: {scope.role}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {user.lastLogin}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEditScopes(user)}
                          title="Edit Access Scopes"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        </button>

                        <button
                          onClick={() => toggleUserMfa(user.id)}
                          title="Toggle MFA Enforcement"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                        >
                          <Smartphone className={`w-3.5 h-3.5 ${user.mfaEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </button>

                        <button
                          onClick={() =>
                            updateUserStatus(user.id, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                          }
                          title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                          className={`p-1.5 rounded-lg border text-xs font-bold ${
                            user.status === 'ACTIVE'
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => deleteEnterpriseUser(user.id)}
                          title="Delete User Identity"
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PERMISSION MATRIX VIEW */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Granular Access Control & Permission Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Segregation of duties (SoD) mapping permissions across defined corporate user roles.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">System Operation / Permission Key</th>
                  {customRoles.map((roleDef) => (
                    <th key={roleDef.id} className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-200">{roleDef.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {permissionsList.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white font-sans text-xs">{perm.label}</div>
                      <div className="text-[10px] text-indigo-400 font-mono">{perm.key} • [{perm.category}]</div>
                    </td>

                    {customRoles.map((roleDef) => {
                      const isGranted =
                        roleDef.permissions.includes(perm.key) ||
                        roleDef.code === 'super_user' ||
                        (roleDef.code === 'entity_admin' && perm.key !== 'users:manage_global') ||
                        (roleDef.code === 'admin' && perm.key !== 'users:manage_global');
                      return (
                        <td key={roleDef.id} className="py-3 px-4 text-center">
                          {isGranted ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-slate-600 border border-slate-800">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROVISION NEW USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Provision Enterprise User Account</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Marcus Aurelius"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. marcus@acme.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Job Title</label>
                  <input
                    type="text"
                    value={newUserTitle}
                    onChange={(e) => setNewUserTitle(e.target.value)}
                    placeholder="e.g. Senior Treasury Analyst"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <select
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="Corporate Accounting">Corporate Accounting</option>
                    <option value="Finance Operations">Finance Operations</option>
                    <option value="Treasury & Risk">Treasury & Risk</option>
                    <option value="Executive Leadership">Executive Leadership</option>
                    <option value="External Audit">External Audit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Global Default System Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="super_user">⚡ Super User (Global System-Wide Authority)</option>
                  <option value="entity_admin">🏢 Entity Admin (Organization Administrator)</option>
                  <option value="admin">Financial Admin (Tenant Admin)</option>
                  <option value="controller">Controller (Sign-off, Year-End Close, Locks)</option>
                  <option value="accountant">Senior Accountant (Full Ledger Post/Reverse)</option>
                  <option value="junior_accountant">Junior Accountant (Draft Entry Only)</option>
                  <option value="auditor">Auditor (Read-Only Audit Ledger Access)</option>
                  <option value="viewer">Viewer (Read-Only Dashboard Summary)</option>
                </select>
              </div>

              {/* TENANT SCOPES MAPPING */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-400" /> Multi-Tenant Entity Access Scope Mapping
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {tenants.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">({t.code})</span>
                      </div>
                      <select
                        value={selectedTenantScopes[t.id] || newUserRole}
                        onChange={(e) =>
                          setSelectedTenantScopes((prev) => ({
                            ...prev,
                            [t.id]: e.target.value as Role,
                          }))
                        }
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono"
                      >
                        <option value="super_user">⚡ Super User</option>
                        <option value="entity_admin">🏢 Entity Admin</option>
                        <option value="admin">Admin</option>
                        <option value="controller">Controller</option>
                        <option value="accountant">Senior Accountant</option>
                        <option value="junior_accountant">Junior Accountant</option>
                        <option value="auditor">Auditor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="mfa-checkbox"
                  checked={newUserMfa}
                  onChange={(e) => setNewUserMfa(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="mfa-checkbox" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Enforce Hardware Authenticator MFA on initial login
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCESS SCOPES MODAL */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Modify Tenant Access Scopes & Role</h3>
              </div>
              <button onClick={() => setEditingUserId(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Default Primary System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="super_user">⚡ Super User</option>
                  <option value="entity_admin">🏢 Entity Admin</option>
                  <option value="admin">Financial Admin</option>
                  <option value="controller">Controller</option>
                  <option value="accountant">Senior Accountant</option>
                  <option value="junior_accountant">Junior Accountant</option>
                  <option value="auditor">Auditor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Tenant Entity Role Assignment Overrides</label>
                <div className="space-y-2">
                  {tenants.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">({t.code})</span>
                      </div>
                      <select
                        value={editScopes[t.id] || editRole}
                        onChange={(e) =>
                          setEditScopes((prev) => ({
                            ...prev,
                            [t.id]: e.target.value as Role,
                          }))
                        }
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono"
                      >
                        <option value="super_user">⚡ Super User</option>
                        <option value="entity_admin">🏢 Entity Admin</option>
                        <option value="admin">Admin</option>
                        <option value="controller">Controller</option>
                        <option value="accountant">Senior Accountant</option>
                        <option value="junior_accountant">Junior Accountant</option>
                        <option value="auditor">Auditor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setEditingUserId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditScopes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Access Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
