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
  Sliders,
  Copy,
  Plus,
  Filter,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  TrendingUp,
  Bot,
  AlertOctagon,
  FileSpreadsheet,
} from 'lucide-react';
import { Role, EnterpriseUser, TenantAccessScope, PermissionKey, CustomRoleDefinition, EntityAiConfig } from '../types';

export const UserManagementView: React.FC = () => {
  const {
    enterpriseUsers,
    customRoles,
    tenants,
    activeTenant,
    activeRole,
    userEmail,
    createEnterpriseUser,
    updateUserStatus,
    updateUserRoleAndScopes,
    toggleUserMfa,
    deleteEnterpriseUser,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
    cloneCustomRole,
    tenantAiConfigs,
    updateTenantAiConfig,
    resetTenantAiQuota,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX' | 'ROLES' | 'AI_CONFIG'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'INVITED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>('ALL');

  // AI Entity Config Modal State
  const [aiConfigModalTenantId, setAiConfigModalTenantId] = useState<string | null>(null);
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiModelInput, setAiModelInput] = useState('gemini-2.5-flash');
  const [aiQuotaInput, setAiQuotaInput] = useState<number>(500000);
  const [aiCycleInput, setAiCycleInput] = useState<'MONTHLY' | 'DAILY' | 'TOTAL'>('MONTHLY');
  const [aiThresholdInput, setAiThresholdInput] = useState<number>(80);
  const [aiEnforceInput, setAiEnforceInput] = useState<boolean>(true);
  const [aiDirectivesInput, setAiDirectivesInput] = useState<string>('');
  const [aiStatusMsg, setAiStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Role Creation / Editing Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [rolePermissions, setRolePermissions] = useState<PermissionKey[]>([]);

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

  const permissionsList: { key: PermissionKey; label: string; category: string; description: string }[] = [
    // General Ledger & Core Postings
    { key: 'journals:create', label: 'Create Draft Journal Entries', category: 'General Ledger', description: 'Draft manual double-entry vouchers' },
    { key: 'journals:post', label: 'Post & Authorize Journal Entries', category: 'General Ledger', description: 'Commit debits/credits directly to GL accounts' },
    { key: 'journals:reverse', label: 'Reverse Posted Journals', category: 'General Ledger', description: 'Generate immutable double-entry reversal lines' },
    { key: 'coa:manage', label: 'Chart of Accounts Management', category: 'General Ledger', description: 'Add, update, or archive general ledger accounts' },
    
    // Accounts Receivable
    { key: 'ar:view', label: 'View Invoices & AR Ledger', category: 'Accounts Receivable', description: 'Read-only access to customer receivables' },
    { key: 'ar:manage', label: 'Manage AR & Customers', category: 'Accounts Receivable', description: 'Full customer setup and balance administration' },
    { key: 'ar:create_invoice', label: 'Draft Customer Invoices', category: 'Accounts Receivable', description: 'Issue commercial sales invoices' },
    { key: 'ar:approve_invoice', label: 'Approve & Release Invoices', category: 'Accounts Receivable', description: 'Checker sign-off for high-value sales' },
    { key: 'ar:collect_payment', label: 'Record Payment Receipts', category: 'Accounts Receivable', description: 'Post customer payment allocations and advances' },
    { key: 'ar:write_off', label: 'Bad Debt & Discount Write-off', category: 'Accounts Receivable', description: 'Authorize accounts receivable write-offs' },

    // Accounts Payable
    { key: 'ap:view', label: 'View Bills & AP Ledger', category: 'Accounts Payable', description: 'Read-only view of trade payables' },
    { key: 'ap:manage', label: 'Manage AP & Vendors', category: 'Accounts Payable', description: 'Full vendor profile and terms management' },
    { key: 'ap:create_bill', label: 'Enter Vendor Bills', category: 'Accounts Payable', description: 'Record AP voucher line items and tax tags' },
    { key: 'ap:approve_bill', label: 'Approve Vendor Bills', category: 'Accounts Payable', description: 'Sign-off on purchase invoices for disbursement' },
    { key: 'ap:disburse_funds', label: 'Execute Vendor Disbursements', category: 'Accounts Payable', description: 'Release liquid bank funds for vendor payment' },

    // Expenses & Mileage
    { key: 'expenses:submit', label: 'Submit Expense & Mileage Claims', category: 'Expenses & Workforce', description: 'Employee expense reimbursement requests' },
    { key: 'expenses:approve', label: 'Approve Expense Claims', category: 'Expenses & Workforce', description: 'Managerial sign-off on employee expenses' },
    { key: 'expenses:post_gl', label: 'Post Expenses to GL', category: 'Expenses & Workforce', description: 'Automated double-entry reconciliation to GL' },

    // Inventory & Stock
    { key: 'inventory:view', label: 'View Inventory Valuation', category: 'Inventory & Assets', description: 'Access stock balances and moving average costs' },
    { key: 'inventory:adjust', label: 'Record Stock Adjustments', category: 'Inventory & Assets', description: 'Post write-downs, shrinkage, and revaluations' },
    { key: 'inventory:manage', label: 'Manage Inventory Catalog', category: 'Inventory & Assets', description: 'Create and configure tracked inventory items' },

    // Workforce & Payroll
    { key: 'employees:view', label: 'View Employee Directory', category: 'Workforce & Payroll', description: 'Inspect workforce records and titles' },
    { key: 'employees:manage', label: 'Manage Workforce 360° Profiles', category: 'Workforce & Payroll', description: 'Edit compensation, tax forms, and bank details' },
    { key: 'payroll:view', label: 'View Payroll Runs & Stubs', category: 'Workforce & Payroll', description: 'Access historical wage disbursements' },
    { key: 'payroll:draft_run', label: 'Calculate & Draft Payroll Runs', category: 'Workforce & Payroll', description: 'Compute gross pay, taxes, and net disbursements' },
    { key: 'payroll:approve_and_post', label: 'Authorize & Post Payroll to GL', category: 'Workforce & Payroll', description: 'Dual-authorized wage posting to GL accounts' },

    // Treasury & Banking
    { key: 'treasury:view', label: 'View Cash & Vault Balances', category: 'Treasury & Banking', description: 'Monitor multi-currency cash positioning' },
    { key: 'treasury:sweep', label: 'Execute Liquidity Sweeps', category: 'Treasury & Banking', description: 'Transfer funds between treasury operating vaults' },
    { key: 'bank:connect_feed', label: 'Configure Bank Feed Integration', category: 'Treasury & Banking', description: 'Link Open Banking and Plaid connectors' },
    { key: 'bank:reconcile', label: 'Reconcile Bank Statements', category: 'Treasury & Banking', description: 'Match statement lines against GL bank accounts' },

    // FP&A & Budgets
    { key: 'fpa:view', label: 'View Financial Ratios & Forecasts', category: 'FP&A & Budgets', description: 'Access executive dashboards and variance stats' },
    { key: 'fpa:budget_edit', label: 'Adjust Cost-Center Budgets', category: 'FP&A & Budgets', description: 'Modify department annual budget allocations' },

    // Tax & Statutory
    { key: 'tax:view', label: 'View Statutory Tax Ledgers', category: 'Tax & Compliance', description: 'Audit GST, VAT, and Sales Tax liability reports' },
    { key: 'tax:settle', label: 'Post Tax Settlement Vouchers', category: 'Tax & Compliance', description: 'Execute statutory payment remittances to revenue tax authority' },
    { key: 'tax:configure', label: 'Configure Tax Jurisdictions & Rates', category: 'Tax & Compliance', description: 'Manage regional tax nexus rules and rates' },

    // Fiscal Period & Close Controls
    { key: 'fiscal:view', label: 'View Accounting Periods', category: 'Fiscal Controls', description: 'Inspect period lock statuses and dates' },
    { key: 'fiscal:lock_period', label: 'Toggle Period Locks (Soft Lock)', category: 'Fiscal Controls', description: 'Prevent accidental back-dated transaction postings' },
    { key: 'fiscal:year_end_close', label: 'Execute Year-End Close Run', category: 'Fiscal Controls', description: 'Roll P&L balances into Retained Earnings' },
    { key: 'fiscal:reopen_period', label: 'Re-open Closed Fiscal Periods', category: 'Fiscal Controls', description: 'Override period seals (Requires high-privilege audit)' },

    // Multi-Signature Governance
    { key: 'governance:approve', label: 'Execute 2nd Signature Approvals', category: 'Governance & Security', description: 'Sign-off as Checker in SOX 404 workflow' },
    { key: 'governance:configure_rules', label: 'Configure Threshold Rules', category: 'Governance & Security', description: 'Set Maker-Checker authorization thresholds' },

    // Backup & Disaster Recovery
    { key: 'backup:export', label: 'Export Encrypted Backups', category: 'Governance & Security', description: 'Download cryptographic point-in-time snapshots' },
    { key: 'backup:restore', label: 'Restore Company Database', category: 'Governance & Security', description: 'Execute full system restore from backup payload' },

    // API & Webhook Integrations
    { key: 'webhooks:manage', label: 'Configure Webhook Endpoints', category: 'Integrations & API', description: 'Manage outbound webhook listeners and events' },
    { key: 'apikeys:manage', label: 'Provision Scoped API Keys', category: 'Integrations & API', description: 'Generate and revoke REST API tokens' },
    { key: 'connectors:manage', label: 'Configure App Connectors', category: 'Integrations & API', description: 'Manage Zapier, Make, and Stripe sync hubs' },

    // Identity & Access Management (IAM)
    { key: 'users:manage_provisioning', label: 'User RBAC Assignment', category: 'IAM & Administration', description: 'Assign roles and entity access scopes' },
    { key: 'users:manage_entity', label: 'Entity User & Role Provisioning', category: 'IAM & Administration', description: 'Administer users within active entity' },
    { key: 'users:manage_global', label: 'Global Super User Provisioning', category: 'IAM & Administration', description: 'Super Administrator privileges across all tenants' },
    { key: 'roles:manage_custom', label: 'Create & Edit Custom Roles', category: 'IAM & Administration', description: 'Define custom permission matrices' },

    // Reports & Audit Logs
    { key: 'reports:view', label: 'View Financial Statements', category: 'Audit & Reports', description: 'Access Balance Sheet, Trial Balance, Income Statement' },
    { key: 'reports:export', label: 'Export Immutable Audit Reports', category: 'Audit & Reports', description: 'Download cryptographically sealed PDF/Excel reports' },
  ];

  const categories = Array.from(new Set(permissionsList.map((p) => p.category)));

  const filteredPermissions = permissionsList.filter((p) => {
    if (matrixCategoryFilter === 'ALL') return true;
    return p.category === matrixCategoryFilter;
  });

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

  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleCode('');
    setRoleDesc('');
    setRolePermissions(['journals:create', 'ar:view', 'ap:view', 'reports:view']);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (roleDef: CustomRoleDefinition) => {
    setEditingRoleId(roleDef.id);
    setRoleName(roleDef.name);
    setRoleCode(roleDef.code);
    setRoleDesc(roleDef.description);
    setRolePermissions([...roleDef.permissions]);
    setIsRoleModalOpen(true);
  };

  const handleTogglePermission = (permKey: PermissionKey) => {
    setRolePermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || !roleCode.trim()) return;

    if (editingRoleId) {
      const res = updateCustomRole(editingRoleId, {
        name: roleName.trim(),
        description: roleDesc.trim(),
        permissions: rolePermissions,
      });
      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to update role.' });
        return;
      }
      setStatusMessage({ type: 'success', text: `Updated role "${roleName}" successfully.` });
    } else {
      const res = createCustomRole({
        name: roleName.trim(),
        code: roleCode.trim().toLowerCase().replace(/\s+/g, '_'),
        description: roleDesc.trim() || 'Custom organizational role definition.',
        colorBadge: 'indigo',
        permissions: rolePermissions,
      });
      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to create role.' });
        return;
      }
      setStatusMessage({ type: 'success', text: `Created custom role "${roleName}" with ${rolePermissions.length} permissions.` });
    }

    setIsRoleModalOpen(false);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Enterprise Access & Granular RBAC Engine</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold">
              SOX 404 Access Control
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provision identities, define granular custom roles, assign multi-tenant entity access scopes, and enforce Segregation of Duties (SoD).
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
                <Users className="w-3.5 h-3.5" /> Directory ({totalUsersCount})
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
            <button
              onClick={() => setActiveTab('ROLES')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'ROLES'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Roles ({customRoles.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('AI_CONFIG')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'AI_CONFIG'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Entity Keys & Quotas
              </span>
            </button>
          </div>

          <button
            onClick={handleOpenProvisionModal}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Provision User
          </button>
        </div>
      </div>

      {/* STATUS NOTIFICATION */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Enterprise Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalUsersCount}</div>
          <p className="text-[11px] text-slate-500">{activeCount} active identities across {tenants.length} tenants</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>MFA Security Posture</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{mfaPercent}%</div>
          <p className="text-[11px] text-slate-500">{mfaEnforcedCount} of {totalUsersCount} accounts enforce hardware/TOTP MFA</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Configured Roles</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{customRoles.length}</div>
          <p className="text-[11px] text-slate-500">{permissionsList.length} granular permissions mapped</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Session Role</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-400 font-mono uppercase truncate">{activeRole}</div>
          <p className="text-[11px] text-slate-500">Tenant: {activeTenant.code} ({activeTenant.name})</p>
        </div>
      </div>

      {activeTab === 'USERS' && (
        /* USER DIRECTORY TAB */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user name, email, or title..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INVITED">Invited</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ALL">Role: All</option>
                {customRoles.map((r) => (
                  <option key={r.id} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">User Details & Identity</th>
                  <th className="py-3 px-4">Department & Title</th>
                  <th className="py-3 px-4">Primary Role</th>
                  <th className="py-3 px-4">Entity Access Scopes</th>
                  <th className="py-3 px-4 text-center">MFA</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-white text-xs">{user.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="text-slate-200">{user.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{user.department}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {customRoles.find((r) => r.code === user.defaultRole)?.name || user.defaultRole}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.tenantScopes.map((scope) => {
                          const t = tenants.find((item) => item.id === scope.tenantId);
                          return (
                            <span
                              key={scope.tenantId}
                              className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300 flex items-center gap-1"
                              title={`Role in ${t?.name}: ${scope.role}`}
                            >
                              <Building2 className="w-2.5 h-2.5 text-indigo-400" />
                              {t ? t.code : scope.tenantId}: <strong className="text-indigo-300">{scope.role}</strong>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {user.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[10px]">
                          <XCircle className="w-3.5 h-3.5" /> Disabled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : user.status === 'SUSPENDED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEditScopes(user)}
                          title="Edit Roles & Tenant Scopes"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        </button>

                        <button
                          onClick={() => toggleUserMfa(user.id)}
                          title="Toggle MFA Enforcement"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          <Smartphone className={`w-3.5 h-3.5 ${user.mfaEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </button>

                        <button
                          onClick={() =>
                            updateUserStatus(user.id, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                          }
                          title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition ${
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
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition"
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
      )}

      {activeTab === 'MATRIX' && (
        /* PERMISSION MATRIX VIEW */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Granular Access Control & Permission Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Segregation of duties (SoD) mapping permissions across defined corporate user roles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={matrixCategoryFilter}
                onChange={(e) => setMatrixCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Categories ({permissionsList.length} Permissions)</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 min-w-[260px]">System Operation / Scope Key</th>
                  {customRoles.map((roleDef) => (
                    <th key={roleDef.id} className="py-3 px-3 text-center min-w-[110px]">
                      <div className="font-bold text-slate-200 truncate">{roleDef.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono lowercase">({roleDef.code})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredPermissions.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        {perm.label}
                      </div>
                      <div className="text-[10px] text-indigo-400 font-mono">{perm.key}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{perm.description}</div>
                    </td>

                    {customRoles.map((roleDef) => {
                      const isGranted =
                        roleDef.permissions.includes(perm.key) ||
                        roleDef.code === 'super_user' ||
                        (roleDef.code === 'entity_admin' && perm.key !== 'users:manage_global') ||
                        (roleDef.code === 'admin' && perm.key !== 'users:manage_global');
                      return (
                        <td key={roleDef.id} className="py-3 px-3 text-center">
                          {isGranted ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm" title={`Granted to ${roleDef.name}`}>
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-slate-600 border border-slate-800" title={`Denied for ${roleDef.name}`}>
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

      {activeTab === 'ROLES' && (
        /* CUSTOM ROLES MANAGEMENT TAB */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" /> Custom Role Definitions & Permissions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create tailored organizational roles with specific security permissions and scopes.
              </p>
            </div>

            <button
              onClick={handleOpenCreateRole}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customRoles.map((roleDef) => (
              <div
                key={roleDef.id}
                className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{roleDef.name}</h3>
                      <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono">
                        {roleDef.code}
                      </span>
                      {roleDef.isSystemRole && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px]">
                          System Role
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{roleDef.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditRole(roleDef)}
                      title="Configure Permissions"
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => cloneCustomRole(roleDef.id, `${roleDef.name} Copy`, `${roleDef.code}_copy`)}
                      title="Clone Role"
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {!roleDef.isSystemRole && (
                      <button
                        onClick={() => deleteCustomRole(roleDef.id)}
                        title="Delete Role"
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono">Assigned Permissions:</span>
                    <span className="font-bold text-white font-mono">{roleDef.permissions.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {roleDef.permissions.slice(0, 6).map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] font-mono border border-slate-800">
                        {p}
                      </span>
                    ))}
                    {roleDef.permissions.length > 6 && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-mono">
                        +{roleDef.permissions.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                <label className="text-xs font-semibold text-slate-300">Default Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {customRoles.map((r) => (
                    <option key={r.id} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="mfaCheck"
                  checked={newUserMfa}
                  onChange={(e) => setNewUserMfa(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="mfaCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Enforce Hardware MFA / TOTP for this corporate account
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
                  Provision User
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
                  {customRoles.map((r) => (
                    <option key={r.id} value={r.code}>{r.name}</option>
                  ))}
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
                        {customRoles.map((r) => (
                          <option key={r.id} value={r.code}>{r.name}</option>
                        ))}
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

      {/* CREATE / EDIT CUSTOM ROLE MODAL */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" /> {editingRoleId ? 'Configure Role Permissions' : 'Create Custom Role'}
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. AP Specialist Lead"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Role Code Identifier *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRoleId}
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    placeholder="e.g. ap_specialist_lead"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Responsibilities and functional scope..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Select Granular Permissions ({rolePermissions.length} selected)</label>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setRolePermissions(permissionsList.map((p) => p.key))}
                      className="text-indigo-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setRolePermissions([])}
                      className="text-slate-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  {categories.map((cat) => {
                    const catPerms = permissionsList.filter((p) => p.category === cat);
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          {cat}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {catPerms.map((perm) => {
                            const isChecked = rolePermissions.includes(perm.key);
                            return (
                              <div
                                key={perm.key}
                                onClick={() => handleTogglePermission(perm.key)}
                                className={`p-2 rounded-lg border text-xs cursor-pointer flex items-start gap-2 transition ${
                                  isChecked
                                    ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                                    : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
                                />
                                <div>
                                  <div className="font-semibold text-xs leading-tight">{perm.label}</div>
                                  <div className="text-[9px] text-slate-500 font-mono">{perm.key}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Role Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
