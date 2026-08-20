import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
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
import { RoleMenuAccessSetupView } from './RoleMenuAccessSetupView';

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

  const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX' | 'ROLES' | 'MENU_ACCESS' | 'AI_CONFIG'>('USERS');
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
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const [scopeFilterTab, setScopeFilterTab] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Edit Scopes Modal State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>('accountant');
  const [editScopes, setEditScopes] = useState<Record<string, Role>>({});
  const [editEntitySearchQuery, setEditEntitySearchQuery] = useState('');
  const [editScopeFilterTab, setEditScopeFilterTab] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Role Creation / Editing Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [rolePermissions, setRolePermissions] = useState<PermissionKey[]>([]);

  // Alert State
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperUser = activeRole === 'super_user';
  const isEntityAdmin = activeRole === 'entity_admin';

  // Compute authorized tenant IDs for the current active actor
  const authorizedTenantIds = React.useMemo(() => {
    if (isSuperUser || activeRole === 'admin') {
      return tenants.map((t) => t.id);
    }
    if (isEntityAdmin) {
      const currentUser =
        enterpriseUsers.find((u) => u.email.toLowerCase() === (userEmail || '').toLowerCase()) ||
        enterpriseUsers.find((u) => u.defaultRole === 'entity_admin');
      const adminTenantIds = new Set<string>();
      if (currentUser) {
        (currentUser.tenantScopes || []).forEach((s) => {
          if (s.role === 'entity_admin' || s.role === 'admin' || s.role === 'super_user') {
            adminTenantIds.add(s.tenantId);
          }
        });
      }
      if (adminTenantIds.size === 0) {
        adminTenantIds.add(activeTenant.id);
      }
      return Array.from(adminTenantIds);
    }
    return [activeTenant.id];
  }, [isSuperUser, isEntityAdmin, activeRole, tenants, enterpriseUsers, userEmail, activeTenant.id]);

  const authorizedTenants = React.useMemo(() => {
    return (tenants || []).filter((t) => authorizedTenantIds.includes(t.id));
  }, [tenants, authorizedTenantIds]);

  // Available roles for assignment by the current active actor (Super Admin can grant super_user; others cannot)
  const availableRolesForAssignment = (customRoles || []).filter((r) => {
    if (r.code === 'super_user' && !isSuperUser) {
      return false;
    }
    return true;
  });

  // Filter enterprise users based on authorized tenant access
  // Entity Admins only see users who have access to their authorized entities
  const visibleEnterpriseUsers = React.useMemo(() => {
    if (isSuperUser || activeRole === 'admin') {
      return enterpriseUsers || [];
    }
    return (enterpriseUsers || []).filter((u) =>
      (u.tenantScopes || []).some((s) => authorizedTenantIds.includes(s.tenantId))
    );
  }, [isSuperUser, activeRole, enterpriseUsers, authorizedTenantIds]);

  const filteredUsers = React.useMemo(() => {
    return (visibleEnterpriseUsers || []).filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || u.defaultRole === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [visibleEnterpriseUsers, searchTerm, statusFilter, roleFilter]);

  const totalUsersCount = (visibleEnterpriseUsers || []).length;
  const activeCount = (visibleEnterpriseUsers || []).filter((u) => u.status === 'ACTIVE').length;
  const mfaEnforcedCount = (visibleEnterpriseUsers || []).filter((u) => u.mfaEnabled).length;
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
    setEntitySearchQuery('');

    // Preselect authorized entities
    const initialScopes: Record<string, Role> = {};
    if (isEntityAdmin) {
      authorizedTenantIds.forEach((tId) => {
        initialScopes[tId] = 'accountant';
      });
    } else {
      initialScopes[activeTenant.id] = 'accountant';
    }
    setSelectedTenantScopes(initialScopes);
    setEntitySearchQuery('');
    setScopeFilterTab('ALL');
    setIsModalOpen(true);
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'User full name and valid corporate email are required.' });
      return;
    }

    const selectedEntries = Object.entries(selectedTenantScopes);
    if (selectedEntries.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one entity access scope for this user.' });
      return;
    }

    // RBAC Rule 1: Only Super Admin can give Super Admin access
    if (!isSuperUser) {
      if (newUserRole === 'super_user' || selectedEntries.some(([_, r]) => r === 'super_user')) {
        setStatusMessage({
          type: 'error',
          text: 'SOX Security Violation: Only a Super Admin can grant Super Admin privileges to a user.',
        });
        return;
      }
    }

    // RBAC Rule 2: Entity Admin can only provision for their authorized entity/entities
    if (isEntityAdmin) {
      const unauthorizedScopes = selectedEntries.filter(([tId]) => !authorizedTenantIds.includes(tId));
      if (unauthorizedScopes.length > 0) {
        const unauthorizedNames = unauthorizedScopes
          .map(([tId]) => {
            const t = tenants.find((item) => item.id === tId);
            return t ? t.name : tId;
          })
          .join(', ');
        setStatusMessage({
          type: 'error',
          text: `Scope Restriction: As an Entity Admin, you can only provision access for your administered entity. Access to "${unauthorizedNames}" is restricted.`,
        });
        return;
      }
    }

    const tenantScopes: TenantAccessScope[] = selectedEntries.map(
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
        text: `Successfully provisioned enterprise account for ${newUserName} (${newUserEmail}) across ${tenantScopes.length} entities.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to provision user account.' });
    }
  };

  const handleStartEditScopes = (user: EnterpriseUser) => {
    if (!isSuperUser && (user.defaultRole === 'super_user' || user.tenantScopes.some((s) => s.role === 'super_user'))) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Super Admin accounts can only be modified by Super Administrators under SOX 404 ITGC controls.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }
    setEditingUserId(user.id);
    setEditRole(user.defaultRole);
    setEditEntitySearchQuery('');
    setEditScopeFilterTab('ALL');
    const currentScopes: Record<string, Role> = {};
    user.tenantScopes.forEach((s) => {
      if (isSuperUser || activeRole === 'admin' || authorizedTenantIds.includes(s.tenantId)) {
        currentScopes[s.tenantId] = s.role;
      }
    });
    setEditScopes(currentScopes);
  };

  const handleSaveEditScopes = () => {
    if (!editingUserId) return;
    const selectedEntries = Object.entries(editScopes);
    if (selectedEntries.length === 0) {
      setStatusMessage({ type: 'error', text: 'User must have access to at least one entity scope.' });
      return;
    }

    // RBAC Rule 1
    if (!isSuperUser && (editRole === 'super_user' || selectedEntries.some(([_, r]) => r === 'super_user'))) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Only a Super Admin can assign Super Admin privileges.',
      });
      return;
    }

    // RBAC Rule 2
    if (isEntityAdmin) {
      const unauthorizedScopes = selectedEntries.filter(([tId]) => !authorizedTenantIds.includes(tId));
      if (unauthorizedScopes.length > 0) {
        setStatusMessage({
          type: 'error',
          text: 'Scope Restriction: Entity Admins can only configure access for their authorized entities.',
        });
        return;
      }
    }

    const targetUser = enterpriseUsers.find((u) => u.id === editingUserId);
    const formattedScopes: TenantAccessScope[] = [];

    // If Entity Admin, preserve existing tenant scopes that are outside authorizedTenantIds
    if (isEntityAdmin && targetUser) {
      (targetUser.tenantScopes || []).forEach((s) => {
        if (!authorizedTenantIds.includes(s.tenantId)) {
          formattedScopes.push(s);
        }
      });
    }

    // Add configured scopes from the modal
    selectedEntries.forEach(([tenantId, role]) => {
      formattedScopes.push({ tenantId, role: role as Role });
    });

    const res = updateUserRoleAndScopes(editingUserId, editRole, formattedScopes);
    if (res && !res.success) {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update access scopes.' });
      return;
    }

    setEditingUserId(null);
    setStatusMessage({ type: 'success', text: `Updated user role and entity access scopes (${formattedScopes.length} entities) successfully.` });
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

  const handleOpenAiConfigModal = (tenantId: string) => {
    const config = tenantAiConfigs[tenantId] || {
      tenantId,
      apiKey: '',
      isKeyConfigured: false,
      model: 'gemini-2.5-flash',
      monthlyTokenQuota: 500000,
      tokensUsedThisPeriod: 0,
      quotaResetCycle: 'MONTHLY',
      lastResetDate: new Date().toISOString().split('T')[0],
      requestsCountThisPeriod: 0,
      totalTokensAllTime: 0,
      alertThresholdPercent: 80,
      enforceStrictQuota: true,
      customAuditInstructions: '',
    };

    setAiConfigModalTenantId(tenantId);
    setAiKeyInput(config.apiKey || '');
    setShowAiKey(false);
    setAiModelInput(config.model || 'gemini-2.5-flash');
    setAiQuotaInput(config.monthlyTokenQuota || 500000);
    setAiCycleInput(config.quotaResetCycle || 'MONTHLY');
    setAiThresholdInput(config.alertThresholdPercent || 80);
    setAiEnforceInput(config.enforceStrictQuota !== false);
    setAiDirectivesInput(config.customAuditInstructions || '');
    setAiStatusMsg(null);
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiConfigModalTenantId) return;

    const res = updateTenantAiConfig(aiConfigModalTenantId, {
      apiKey: aiKeyInput.trim(),
      model: aiModelInput,
      monthlyTokenQuota: Number(aiQuotaInput) || 0,
      quotaResetCycle: aiCycleInput,
      alertThresholdPercent: Number(aiThresholdInput) || 80,
      enforceStrictQuota: aiEnforceInput,
      customAuditInstructions: aiDirectivesInput.trim(),
    });

    if (!res.success) {
      setAiStatusMsg({ type: 'error', text: res.error || 'Failed to save entity AI configuration.' });
    } else {
      setAiStatusMsg({ type: 'success', text: `AI API Key & Token Quota saved successfully for entity!` });
      setTimeout(() => {
        setAiConfigModalTenantId(null);
      }, 1000);
    }
  };

  const handleResetQuotaForTenant = (tenantId: string, tenantName: string) => {
    if (window.confirm(`Reset monthly token consumption counter to 0 for ${tenantName}?`)) {
      const res = resetTenantAiQuota(tenantId);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Token counter reset to 0 for ${tenantName}.` });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to reset quota.' });
      }
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const isAdminOrSuperAdmin = activeRole === 'super_user' || activeRole === 'admin' || activeRole === 'entity_admin';

  if (!isAdminOrSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-lg font-bold text-white">Restricted Access · Admin Privilege Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            User Provisioning & RBAC management is strictly restricted to <strong>Admin</strong> and <strong>Super Admin</strong> roles under SOX 404 access control guidelines.
          </p>
        </div>
        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400">
          Active Role: <span className="text-amber-400 font-bold">{activeRole}</span>
        </div>
      </div>
    );
  }

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
              onClick={() => setActiveTab('MENU_ACCESS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'MENU_ACCESS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Role-Menu Setup
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

            <button
              onClick={handleOpenProvisionModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision User</span>
            </button>
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
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {(() => {
                          const visibleScopes = (isSuperUser || activeRole === 'admin')
                            ? (user.tenantScopes || [])
                            : (user.tenantScopes || []).filter((scope) => authorizedTenantIds.includes(scope.tenantId));

                          if (!visibleScopes || visibleScopes.length === 0) {
                            return (
                              <span className="text-[10px] text-slate-500 italic">No assigned scopes in your entity</span>
                            );
                          }

                          return visibleScopes.map((scope) => {
                            const t = (tenants || []).find((item) => item.id === scope.tenantId);
                            return (
                              <span
                                key={scope.tenantId}
                                className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300 flex items-center gap-1"
                                title={`Role in ${t?.name || scope.tenantId}: ${scope.role}`}
                              >
                                <Building2 className="w-2.5 h-2.5 text-indigo-400" />
                                {t ? t.code : scope.tenantId}: <strong className="text-indigo-300">{scope.role}</strong>
                              </span>
                            );
                          });
                        })()}

                        {!isSuperUser && (user.defaultRole === 'super_user' || (user.tenantScopes || []).some((s) => s.role === 'super_user')) ? (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-semibold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Super Admin
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditScopes(user)}
                            className="px-1.5 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="Modify Entity Access Scopes"
                          >
                            <Plus className="w-2.5 h-2.5" /> Scopes
                          </button>
                        )}
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
                      {!isSuperUser && (user.defaultRole === 'super_user' || user.tenantScopes.some((s) => s.role === 'super_user')) ? (
                        <div className="flex items-center justify-end">
                          <span
                            className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            title="Super Admin user accounts are protected and can only be managed by Super Administrators under SOX 404 ITGC controls"
                          >
                            <Lock className="w-3 h-3 text-amber-400" /> Protected
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEditScopes(user)}
                            title="Edit Roles & Tenant Scopes"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          </button>

                          <button
                            onClick={() => toggleUserMfa(user.id)}
                            title="Toggle MFA Enforcement"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
                          >
                            <Smartphone className={`w-3.5 h-3.5 ${user.mfaEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                          </button>

                          <button
                            onClick={() =>
                              updateUserStatus(user.id, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                            }
                            title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
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
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
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

      {/* TAB: ROLE-TO-MENU ACCESS PERMISSIONS SETUP */}
      {activeTab === 'MENU_ACCESS' && (
        <RoleMenuAccessSetupView />
      )}

      {/* TAB 4: ENTITY-SCOPED AI AUDIT KEYS & TOKEN QUOTAS */}
      {activeTab === 'AI_CONFIG' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Entity-Scoped AI API Keys & Monthly Token Quotas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each entity administrator can configure their own Google Gemini AI key, isolated strictly to their entity, with dedicated token consumption quota caps.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono">
                SOX 404 & GDPR Tenant Isolation Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {authorizedTenants.map((t) => {
              const aiConfig = tenantAiConfigs[t.id] || {
                tenantId: t.id,
                apiKey: '',
                isKeyConfigured: false,
                model: 'gemini-2.5-flash',
                monthlyTokenQuota: 500000,
                tokensUsedThisPeriod: 0,
                quotaResetCycle: 'MONTHLY',
                lastResetDate: '2026-08-01',
                requestsCountThisPeriod: 0,
                totalTokensAllTime: 0,
                alertThresholdPercent: 80,
                enforceStrictQuota: true,
                customAuditInstructions: '',
              };

              const isUnlimited = aiConfig.monthlyTokenQuota === 0;
              const used = aiConfig.tokensUsedThisPeriod || 0;
              const limit = aiConfig.monthlyTokenQuota;
              const percent = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
              const isOver = !isUnlimited && aiConfig.enforceStrictQuota && used >= limit;
              const isNear = !isUnlimited && percent >= (aiConfig.alertThresholdPercent || 80) && !isOver;

              return (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-3">
                    {/* Entity Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{t.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                            {t.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.currency} · Standard: {t.pluginId.toUpperCase()}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          aiConfig.isKeyConfigured
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {aiConfig.isKeyConfigured ? 'Custom Key' : 'Default Key'}
                      </span>
                    </div>

                    {/* Key Status & Model */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> API Key:
                        </span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {aiConfig.isKeyConfigured && aiConfig.apiKey
                            ? `${aiConfig.apiKey.slice(0, 6)}...${aiConfig.apiKey.slice(-4)}`
                            : 'System Shared Key'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-emerald-400" /> Model:
                        </span>
                        <span className="font-mono text-emerald-300 font-semibold">
                          {aiConfig.model || 'gemini-2.5-flash'}
                        </span>
                      </div>
                    </div>

                    {/* Token Quota Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                          Quota ({aiConfig.quotaResetCycle || 'MONTHLY'}):
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isUnlimited ? 'Unlimited' : `${used.toLocaleString()} / ${limit.toLocaleString()} (${percent}%)`}
                        </span>
                      </div>

                      {!isUnlimited && (
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOver
                                ? 'bg-rose-500'
                                : isNear
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Requests: {aiConfig.requestsCountThisPeriod || 0}</span>
                        <span>Lifetime: {(aiConfig.totalTokensAllTime || 0).toLocaleString()} tokens</span>
                      </div>
                    </div>

                    {/* Directives Preview */}
                    {aiConfig.customAuditInstructions && (
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 line-clamp-2">
                        <span className="text-indigo-400 font-semibold">Audit Directives: </span>
                        {aiConfig.customAuditInstructions}
                      </div>
                    )}
                  </div>

                  {/* Entity Action Controls */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleResetQuotaForTenant(t.id, t.name)}
                      className="text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1 transition cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800"
                      title="Reset token consumption for this billing period"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Usage</span>
                    </button>

                    <button
                      onClick={() => handleOpenAiConfigModal(t.id)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Configure Key & Quota</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE ENTITY AI KEY & QUOTAS */}
      {aiConfigModalTenantId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
                  <KeyRound className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Configure Entity AI Key & Token Quota</h3>
                  <p className="text-xs text-slate-400">
                    Entity: <strong>{tenants.find((t) => t.id === aiConfigModalTenantId)?.name}</strong> ({tenants.find((t) => t.id === aiConfigModalTenantId)?.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiConfigModalTenantId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAiConfig} className="space-y-4 text-xs">
              {/* API Key */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Entity Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showAiKey ? 'text' : 'password'}
                    value={aiKeyInput}
                    onChange={(e) => setAiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiKey(!showAiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Isolated strictly to this entity. Unused by or inaccessible to sibling entities in the group.
                </p>
              </div>

              {/* Model Select */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Reasoning Model
                </label>
                <select
                  value={aiModelInput}
                  onChange={(e) => setAiModelInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Cost Efficient)</option>
                  <option value="gemini-3.7-flash">Gemini 3.7 Flash (High Performance)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Statutory & Tax Logic)</option>
                </select>
              </div>

              {/* Monthly Quota & Reset Cycle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Token Quota Limit
                  </label>
                  <input
                    type="number"
                    value={aiQuotaInput}
                    onChange={(e) => setAiQuotaInput(Number(e.target.value))}
                    placeholder="e.g. 500000 (0 for unlimited)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Reset Cycle
                  </label>
                  <select
                    value={aiCycleInput}
                    onChange={(e) => setAiCycleInput(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="DAILY">Daily</option>
                    <option value="TOTAL">Lifetime</option>
                  </select>
                </div>
              </div>

              {/* Alert Threshold & Strict Enforcement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Alert Threshold (%)
                  </label>
                  <select
                    value={aiThresholdInput}
                    onChange={(e) => setAiThresholdInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={70}>70%</option>
                    <option value={80}>80% (Recommended)</option>
                    <option value={90}>90%</option>
                    <option value={95}>95%</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="block font-semibold text-slate-200 mb-1">
                    Enforce Hard Block
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={aiEnforceInput}
                      onChange={(e) => setAiEnforceInput(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-slate-300 text-xs">Block queries at 100% quota</span>
                  </label>
                </div>
              </div>

              {/* Custom Audit Instructions */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Custom Forensic Audit Instructions
                </label>
                <textarea
                  rows={3}
                  value={aiDirectivesInput}
                  onChange={(e) => setAiDirectivesInput(e.target.value)}
                  placeholder="e.g. Audit ASC 606 contract revenue milestones, inspect intercompany loans, and verify GST reverse charges."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {aiStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    aiStatusMsg.type === 'success'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {aiStatusMsg.text}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAiConfigModalTenantId(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  Save Entity Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION NEW USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Provision Enterprise User Account</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Contextual Role Banner */}
              {isEntityAdmin ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex items-start gap-2.5 text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">Entity Admin Scope Constraint Active</p>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      As an <strong>Entity Administrator</strong>, you can provision access exclusively for your authorized entity (
                      <span className="font-mono font-bold text-amber-300">
                        {authorizedTenants.map((at) => `${at.name} [${at.code}]`).join(', ')}
                      </span>
                      ). Access to other group subsidiaries and granting Super Admin privileges require Global Super Admin clearance.
                    </p>
                  </div>
                </div>
              ) : isSuperUser ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs flex items-start gap-2.5 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">Global Super Admin Authority</p>
                    <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                      You have unrestricted authority to provision user accounts, assign any system role (including Super Admin), and allocate access across all enterprise subsidiary entities.
                    </p>
                  </div>
                </div>
              ) : null}

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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Primary Default Role</label>
                  {!isSuperUser && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3 text-amber-400" /> Super Admin role restricted to Super Admin
                    </span>
                  )}
                </div>
                <select
                  value={newUserRole}
                  onChange={(e) => {
                    const role = e.target.value as Role;
                    setNewUserRole(role);
                    // Also update selected entities to this new default if needed
                    setSelectedTenantScopes((prev) => {
                      const updated: Record<string, Role> = {};
                      Object.keys(prev).forEach((tId) => {
                        updated[tId] = role;
                      });
                      return updated;
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {availableRolesForAssignment.map((r) => (
                    <option key={r.id} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* SEARCH & MULTI-ENTITY ACCESS PROVISIONING SECTION */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span>Search & Assign Entity Access Scopes *</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Search and select the corporate entities and subsidiaries this user can access:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTenantScopes((prev) => {
                          const next = { ...prev };
                          authorizedTenants.forEach((t) => {
                            next[t.id] = next[t.id] || newUserRole;
                          });
                          return next;
                        });
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Select All Allowed
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTenantScopes({})}
                      className="text-slate-400 hover:text-slate-300 cursor-pointer"
                    >
                      Clear
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (authorizedTenantIds.includes(activeTenant.id)) {
                          setSelectedTenantScopes({ [activeTenant.id]: newUserRole });
                        } else if (authorizedTenants.length > 0) {
                          setSelectedTenantScopes({ [authorizedTenants[0].id]: newUserRole });
                        }
                      }}
                      className="text-slate-400 hover:text-slate-300 cursor-pointer"
                    >
                      Active Only
                    </button>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setScopeFilterTab('ALL')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        scopeFilterTab === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Entities ({authorizedTenants.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopeFilterTab('ASSIGNED')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        scopeFilterTab === 'ASSIGNED'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Selected in Scope ({Object.keys(selectedTenantScopes).filter((tId) => authorizedTenantIds.includes(tId)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopeFilterTab('UNASSIGNED')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        scopeFilterTab === 'UNASSIGNED'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Available to Add ({Math.max(0, authorizedTenants.length - Object.keys(selectedTenantScopes).filter((tId) => authorizedTenantIds.includes(tId)).length)})
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={entitySearchQuery}
                      onChange={(e) => setEntitySearchQuery(e.target.value)}
                      placeholder="Search entities by name, code, country, or currency (e.g., Acme, US, EUR)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                    {entitySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setEntitySearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Searchable Entity List */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {authorizedTenants
                    .filter((t) => {
                      const isSelected = Boolean(selectedTenantScopes[t.id]);
                      if (scopeFilterTab === 'ASSIGNED' && !isSelected) return false;
                      if (scopeFilterTab === 'UNASSIGNED' && isSelected) return false;

                      const q = entitySearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        t.name.toLowerCase().includes(q) ||
                        t.code.toLowerCase().includes(q) ||
                        t.country.toLowerCase().includes(q) ||
                        t.currency.toLowerCase().includes(q) ||
                        t.pluginId.toLowerCase().includes(q)
                      );
                    })
                    .map((t) => {
                      const isAllowed = isSuperUser || activeRole === 'admin' || authorizedTenantIds.includes(t.id);
                      const isSelected = Boolean(selectedTenantScopes[t.id]);
                      const currentRoleForTenant = selectedTenantScopes[t.id] || newUserRole;

                      return (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            !isAllowed
                              ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                              : isSelected
                              ? 'bg-indigo-950/30 border-indigo-500/40'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              disabled={!isAllowed}
                              checked={isSelected}
                              onChange={(e) => {
                                if (!isAllowed) return;
                                setSelectedTenantScopes((prev) => {
                                  const updated = { ...prev };
                                  if (e.target.checked) {
                                    updated[t.id] = newUserRole;
                                  } else {
                                    delete updated[t.id];
                                  }
                                  return updated;
                                });
                              }}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs truncate">{t.name}</span>
                                <span className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 font-mono text-[10px] rounded border border-slate-700 font-bold">
                                  {t.code}
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-800/80 text-slate-400 font-mono text-[10px] rounded">
                                  {t.currency} • {t.country}
                                </span>
                                {t.isConsolidationEntity && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] rounded font-semibold">
                                    Parent Group
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                <span>Framework: {t.pluginId.toUpperCase()}</span>
                                {!isAllowed ? (
                                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> Scope Restricted (Super Admin Only)
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> In User Scope
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-0.5">
                                    Not assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 ml-3 flex items-center gap-2">
                            {isSelected && isAllowed ? (
                              <>
                                <select
                                  value={currentRoleForTenant}
                                  onChange={(e) => {
                                    const role = e.target.value as Role;
                                    setSelectedTenantScopes((prev) => ({
                                      ...prev,
                                      [t.id]: role,
                                    }));
                                  }}
                                  className="bg-slate-900 border border-indigo-500/50 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-400"
                                >
                                  {availableRolesForAssignment.map((r) => (
                                    <option key={r.id} value={r.code}>{r.name}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTenantScopes((prev) => {
                                      const next = { ...prev };
                                      delete next[t.id];
                                      return next;
                                    });
                                  }}
                                  className="px-2 py-1 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-700 hover:border-rose-500/30"
                                  title="Remove from Scope"
                                >
                                  ✕ Remove
                                </button>
                              </>
                            ) : isAllowed ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTenantScopes((prev) => ({
                                    ...prev,
                                    [t.id]: newUserRole,
                                  }))
                                }
                                className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-700"
                              >
                                + Add to Scope
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-mono italic">Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {authorizedTenants.filter((t) => {
                    const isSelected = Boolean(selectedTenantScopes[t.id]);
                    if (scopeFilterTab === 'ASSIGNED' && !isSelected) return false;
                    if (scopeFilterTab === 'UNASSIGNED' && isSelected) return false;

                    const q = entitySearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      t.name.toLowerCase().includes(q) ||
                      t.code.toLowerCase().includes(q) ||
                      t.country.toLowerCase().includes(q) ||
                      t.currency.toLowerCase().includes(q) ||
                      t.pluginId.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500 font-mono">
                      No entities matched the selected filters.
                    </div>
                  )}
                </div>

                {/* Live Selected Scopes Preview Chips */}
                <div className="pt-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-300">
                      Provisioned Scope Summary ({Object.keys(selectedTenantScopes).length} entities selected):
                    </span>
                    {Object.keys(selectedTenantScopes).length === 0 && (
                      <span className="text-rose-400 font-semibold">* At least 1 entity required</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedTenantScopes).map(([tId, role]) => {
                      const t = tenants.find((item) => item.id === tId);
                      return (
                        <span
                          key={tId}
                          className="px-2 py-1 bg-indigo-950/50 border border-indigo-500/40 rounded-lg text-[10px] text-slate-200 flex items-center gap-1.5"
                        >
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          <strong className="text-white">{t ? t.code : tId}</strong>:
                          <span className="text-indigo-300 font-mono">
                            {customRoles.find((r) => r.code === role)?.name || role}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTenantScopes((prev) => {
                                const next = { ...prev };
                                delete next[tId];
                                return next;
                              });
                            }}
                            className="text-slate-400 hover:text-rose-400 cursor-pointer ml-1 font-bold"
                            title={`Remove ${t?.name || tId} from scope`}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                    {Object.keys(selectedTenantScopes).length === 0 && (
                      <div className="text-xs text-slate-500 italic">No entities selected yet. Please check required entities above.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="checkbox"
                  id="mfaCheck"
                  checked={newUserMfa}
                  onChange={(e) => setNewUserMfa(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="mfaCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Enforce Hardware MFA / TOTP for this corporate account
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(selectedTenantScopes).length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Provision User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCESS SCOPES MODAL */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Modify Tenant Access Scopes & Role</h3>
              </div>
              <button onClick={() => setEditingUserId(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* User Identity Info */}
              {(() => {
                const targetUser = enterpriseUsers.find((u) => u.id === editingUserId);
                if (!targetUser) return null;
                return (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{targetUser.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{targetUser.email}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-400">
                      <div>Title: <span className="text-slate-200">{targetUser.title}</span></div>
                      <div>Dept: <span className="text-slate-200">{targetUser.department}</span></div>
                    </div>
                  </div>
                );
              })()}

              {/* Contextual Banner */}
              {isEntityAdmin ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex items-start gap-2.5 text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    As an <strong>Entity Administrator</strong>, you can assign roles exclusively for your authorized entity (
                    <span className="font-mono font-bold text-amber-300">
                      {authorizedTenants.map((at) => at.name).join(', ')}
                    </span>
                    ).
                  </p>
                </div>
              ) : null}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Default Primary System Role</label>
                  {!isSuperUser && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3 text-amber-400" /> Super Admin role restricted to Super Admin
                    </span>
                  )}
                </div>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {availableRolesForAssignment.map((r) => (
                    <option key={r.id} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* ENTITY ACCESS SCOPES SEARCH & SELECTION */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span>Search & Configure Entity Access Scopes</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Search, add, remove, or modify entity-specific roles for this user:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditScopes((prev) => {
                          const next = { ...prev };
                          authorizedTenants.forEach((t) => {
                            next[t.id] = next[t.id] || editRole;
                          });
                          return next;
                        });
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Select All Allowed
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditScopes((prev) => {
                          const next = { ...prev };
                          authorizedTenantIds.forEach((tId) => {
                            delete next[tId];
                          });
                          return next;
                        });
                      }}
                      className="text-slate-400 hover:text-slate-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditScopeFilterTab('ALL')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        editScopeFilterTab === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Entities ({authorizedTenants.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditScopeFilterTab('ASSIGNED')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        editScopeFilterTab === 'ASSIGNED'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Assigned in Scope ({Object.keys(editScopes).filter((tId) => authorizedTenantIds.includes(tId)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditScopeFilterTab('UNASSIGNED')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        editScopeFilterTab === 'UNASSIGNED'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Available to Add ({Math.max(0, authorizedTenants.length - Object.keys(editScopes).filter((tId) => authorizedTenantIds.includes(tId)).length)})
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editEntitySearchQuery}
                      onChange={(e) => setEditEntitySearchQuery(e.target.value)}
                      placeholder="Search entities by name, code, country, or currency..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                    {editEntitySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setEditEntitySearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Entity List */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {authorizedTenants
                    .filter((t) => {
                      const isSelected = Boolean(editScopes[t.id]);
                      if (editScopeFilterTab === 'ASSIGNED' && !isSelected) return false;
                      if (editScopeFilterTab === 'UNASSIGNED' && isSelected) return false;

                      const q = editEntitySearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        t.name.toLowerCase().includes(q) ||
                        t.code.toLowerCase().includes(q) ||
                        t.country.toLowerCase().includes(q) ||
                        t.currency.toLowerCase().includes(q) ||
                        t.pluginId.toLowerCase().includes(q)
                      );
                    })
                    .map((t) => {
                      const isAllowed = isSuperUser || activeRole === 'admin' || authorizedTenantIds.includes(t.id);
                      const isSelected = Boolean(editScopes[t.id]);
                      const currentRoleForTenant = editScopes[t.id] || editRole;

                      return (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            !isAllowed
                              ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                              : isSelected
                              ? 'bg-indigo-950/30 border-indigo-500/40'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              disabled={!isAllowed}
                              checked={isSelected}
                              onChange={(e) => {
                                if (!isAllowed) return;
                                setEditScopes((prev) => {
                                  const updated = { ...prev };
                                  if (e.target.checked) {
                                    updated[t.id] = editRole;
                                  } else {
                                    delete updated[t.id];
                                  }
                                  return updated;
                                });
                              }}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs truncate">{t.name}</span>
                                <span className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 font-mono text-[10px] rounded border border-slate-700 font-bold">
                                  {t.code}
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-800/80 text-slate-400 font-mono text-[10px] rounded">
                                  {t.currency} • {t.country}
                                </span>
                                {t.isConsolidationEntity && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] rounded font-semibold">
                                    Parent Group
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                <span>Framework: {t.pluginId.toUpperCase()}</span>
                                {!isAllowed ? (
                                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> Scope Restricted (Super Admin Only)
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> In User Scope
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-0.5">
                                    Not assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 ml-3 flex items-center gap-2">
                            {isSelected && isAllowed ? (
                              <>
                                <select
                                  value={currentRoleForTenant}
                                  onChange={(e) => {
                                    const role = e.target.value as Role;
                                    setEditScopes((prev) => ({
                                      ...prev,
                                      [t.id]: role,
                                    }));
                                  }}
                                  className="bg-slate-900 border border-indigo-500/50 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-400"
                                >
                                  {availableRolesForAssignment.map((r) => (
                                    <option key={r.id} value={r.code}>{r.name}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditScopes((prev) => {
                                      const next = { ...prev };
                                      delete next[t.id];
                                      return next;
                                    });
                                  }}
                                  className="px-2 py-1 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-700 hover:border-rose-500/30"
                                  title="Remove from Scope"
                                >
                                  ✕ Remove
                                </button>
                              </>
                            ) : isAllowed ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditScopes((prev) => ({
                                    ...prev,
                                    [t.id]: editRole,
                                  }))
                                }
                                className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-700"
                              >
                                + Add to Scope
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-mono italic">Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {authorizedTenants.filter((t) => {
                    const isSelected = Boolean(editScopes[t.id]);
                    if (editScopeFilterTab === 'ASSIGNED' && !isSelected) return false;
                    if (editScopeFilterTab === 'UNASSIGNED' && isSelected) return false;

                    const q = editEntitySearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      t.name.toLowerCase().includes(q) ||
                      t.code.toLowerCase().includes(q) ||
                      t.country.toLowerCase().includes(q) ||
                      t.currency.toLowerCase().includes(q) ||
                      t.pluginId.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500 font-mono">
                      No entities matched the selected filters.
                    </div>
                  )}
                </div>

                {/* Selected Scopes Chips */}
                <div className="pt-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-300">
                      Configured Entity Scopes ({Object.keys(editScopes).length} selected):
                    </span>
                    {Object.keys(editScopes).length === 0 && (
                      <span className="text-rose-400 font-semibold">* At least 1 entity required</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(editScopes).map(([tId, role]) => {
                      const t = tenants.find((item) => item.id === tId);
                      return (
                        <span
                          key={tId}
                          className="px-2 py-1 bg-indigo-950/50 border border-indigo-500/40 rounded-lg text-[10px] text-slate-200 flex items-center gap-1.5"
                        >
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          <strong className="text-white">{t ? t.code : tId}</strong>:
                          <span className="text-indigo-300 font-mono">
                            {customRoles.find((r) => r.code === role)?.name || role}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditScopes((prev) => {
                                const next = { ...prev };
                                delete next[tId];
                                return next;
                              });
                            }}
                            className="text-slate-400 hover:text-rose-400 cursor-pointer ml-1 font-bold"
                            title={`Remove ${t?.name || tId} from scope`}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Object.keys(editScopes).length === 0}
                  onClick={handleSaveEditScopes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
