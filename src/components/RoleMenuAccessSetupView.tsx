import { useLanguage, tr, t } from '../context/LanguageContext';
import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Role, TabType, MenuCategory, Tenant } from '../types';
import {
  ALL_MENU_OPTIONS,
  MENU_CATEGORIES,
  DEFAULT_ROLE_MENU_PERMISSIONS,
  ROLE_MENU_PRESET_TEMPLATES,
} from '../data/menuOptionsData';
import {
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Check,
  X,
  RotateCcw,
  Copy,
  Sparkles,
  Search,
  Filter,
  Layers,
  Building2,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  BookOpenCheck,
  Receipt,
  CreditCard,
  Boxes,
  Users,
  Landmark,
  KeyRound,
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  FileCheck2,
  Globe,
  Globe2,
  PieChart,
  Wallet,
  Car,
  Repeat,
  Banknote,
  HardDriveDownload,
  Webhook,
  Terminal,
  BookOpen,
} from 'lucide-react';

interface RoleMenuAccessSetupViewProps {
  onSimulateRole?: (role: Role) => void;
}

export const RoleMenuAccessSetupView: React.FC<RoleMenuAccessSetupViewProps> = ({ onSimulateRole }) => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    tenants,
    activeTenant,
    activeRole,
    userEmail,
    enterpriseUsers,
    customRoles,
    setActiveTenantId,
    setActiveRole,
    getRoleAllowedMenus,
    updateRoleMenuPermissions,
    resetRoleMenuPermissionsToDefaults,
    applyRoleMenuPreset,
    copyRoleMenuPermissions,
  } = useAccounting();

  // Find the currently logged in enterprise user
  const currentUser = useMemo(() => {
    return enterpriseUsers.find((u) => u.email === userEmail) || enterpriseUsers[0];
  }, [enterpriseUsers, userEmail]);

  const isSuperUser = activeRole === 'super_user';

  // Compute authorized tenants for Entity Admin vs Super Admin
  const authorizedTenantIds = useMemo(() => {
    if (isSuperUser || activeRole === 'admin') {
      return tenants.map((t) => t.id);
    }
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
  }, [isSuperUser, activeRole, currentUser, tenants, activeTenant.id]);

  const authorizedTenants = useMemo(() => {
    return (tenants || []).filter((t) => authorizedTenantIds.includes(t.id));
  }, [tenants, authorizedTenantIds]);

  // Selected Target Tenant for Menu Configuration
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    authorizedTenants.some((t) => t.id === activeTenant.id) ? activeTenant.id : authorizedTenants[0]?.id || 't-acme-us'
  );

  const currentConfigTenant = useMemo(() => {
    return (tenants || []).find((t) => t.id === selectedTenantId) || activeTenant;
  }, [tenants, selectedTenantId, activeTenant]);

  // View Mode: Role Detail vs Full Matrix Grid
  const [viewMode, setViewMode] = useState<'ROLE_DETAIL' | 'FULL_MATRIX'>('ROLE_DETAIL');

  // Selected Role to configure in Role Detail mode
  const [selectedRole, setSelectedRole] = useState<Role | string>('accountant');

  // Check if selected role is Super User and the current user is not a Super User
  const isSuperUserRoleLocked = selectedRole === 'super_user' && !isSuperUser;

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'ALL'>('ALL');

  // Toast / Status Notification
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Clone from Role Modal State
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneSourceRole, setCloneSourceRole] = useState<string>('controller');

  // Available Roles list (Combining system roles & custom roles)
  const allRolesList = useMemo(() => {
    const systemRolesOrder: Role[] = [
      'super_user',
      'entity_admin',
      'admin',
      'controller',
      'accountant',
      'junior_accountant',
      'auditor',
      'viewer',
    ];

    const standardRoles = systemRolesOrder.map((code) => {
      const customMatch = (customRoles || []).find((r) => r.code === code);
      return {
        code,
        name: customMatch?.name || code.replace('_', ' ').toUpperCase(),
        description: customMatch?.description || '',
        isSystemRole: true,
        colorBadge: customMatch?.colorBadge || 'indigo',
      };
    });

    const additionalCustom = (customRoles || [])
      .filter((r) => !systemRolesOrder.includes(r.code as Role))
      .map((r) => ({
        code: r.code,
        name: r.name,
        description: r.description,
        isSystemRole: false,
        colorBadge: r.colorBadge || 'cyan',
      }));

    return [...standardRoles, ...additionalCustom];
  }, [customRoles]);

  // Currently allowed menus for selected role in selected tenant
  const currentAllowedMenus = useMemo(() => {
    return (getRoleAllowedMenus && getRoleAllowedMenus(selectedRole, selectedTenantId)) || [];
  }, [getRoleAllowedMenus, selectedRole, selectedTenantId]);

  // Filtered menu options based on search and category
  const filteredMenuOptions = useMemo(() => {
    return (ALL_MENU_OPTIONS || []).filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Helper to render icon by name
  const renderMenuIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard className={className} />;
      case 'BookOpenCheck': return <BookOpenCheck className={className} />;
      case 'FileSpreadsheet': return <FileSpreadsheet className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Lock': return <Lock className={className} />;
      case 'Globe2': return <Globe2 className={className} />;
      case 'Receipt': return <Receipt className={className} />;
      case 'Repeat': return <Repeat className={className} />;
      case 'UploadCloud': return <UploadCloud className={className} />;
      case 'CreditCard': return <CreditCard className={className} />;
      case 'Car': return <Car className={className} />;
      case 'Users': return <Users className={className} />;
      case 'Package': return <Boxes className={className} />;
      case 'Boxes': return <Boxes className={className} />;
      case 'Banknote': return <Banknote className={className} />;
      case 'Landmark': return <Landmark className={className} />;
      case 'Wallet': return <Wallet className={className} />;
      case 'PieChart': return <PieChart className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Globe': return <Globe className={className} />;
      case 'FileCheck2': return <FileCheck2 className={className} />;
      case 'ShieldAlert': return <ShieldAlert className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'HardDriveDownload': return <HardDriveDownload className={className} />;
      case 'Network': return <Layers className={className} />;
      case 'Webhook': return <Webhook className={className} />;
      case 'KeyRound': return <KeyRound className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Terminal': return <Terminal className={className} />;
      default: return <BookOpenCheck className={className} />;
    }
  };

  // Toggle single menu option for selected role
  const handleToggleMenu = (tabId: TabType) => {
    if (isSuperUserRoleLocked) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const isGranted = currentAllowedMenus.includes(tabId);
    let updated: TabType[];
    if (isGranted) {
      updated = currentAllowedMenus.filter((t) => t !== tabId);
    } else {
      updated = [...currentAllowedMenus, tabId];
    }
    const res = updateRoleMenuPermissions(selectedRole, updated, selectedTenantId);
    if (res.success) {
      setStatusMessage({
        type: 'info',
        text: `${isGranted ? 'Revoked' : 'Granted'} access to "${ALL_MENU_OPTIONS.find((m) => m.id === tabId)?.label}" for role [${selectedRole}].`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update permissions' });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Toggle menu for specific role directly (used in Matrix mode)
  const handleToggleMenuForRole = (roleCode: string, tabId: TabType) => {
    if (roleCode === 'super_user' && !isSuperUser) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const roleMenus = getRoleAllowedMenus(roleCode, selectedTenantId);
    const isGranted = roleMenus.includes(tabId);
    let updated: TabType[];
    if (isGranted) {
      updated = roleMenus.filter((t) => t !== tabId);
    } else {
      updated = [...roleMenus, tabId];
    }
    updateRoleMenuPermissions(roleCode, updated, selectedTenantId);
  };

  // Batch toggle all in a category
  const handleToggleCategory = (category: MenuCategory, grant: boolean) => {
    if (isSuperUserRoleLocked) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const categoryTabs = ALL_MENU_OPTIONS.filter((m) => m.category === category).map((m) => m.id);
    let updated: TabType[];
    if (grant) {
      const set = new Set([...currentAllowedMenus, ...categoryTabs]);
      updated = Array.from(set);
    } else {
      updated = currentAllowedMenus.filter((t) => !categoryTabs.includes(t));
    }
    const res = updateRoleMenuPermissions(selectedRole, updated, selectedTenantId);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `${grant ? 'Granted all' : 'Revoked all'} menu options in "${MENU_CATEGORIES.find((c) => c.id === category)?.label}" for [${selectedRole}].`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update permissions' });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Grant All 31 Menus
  const handleGrantAll = () => {
    if (isSuperUserRoleLocked) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const allTabs = ALL_MENU_OPTIONS.map((m) => m.id);
    const res = updateRoleMenuPermissions(selectedRole, allTabs, selectedTenantId);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Granted unrestricted access to all 31 menu options for role [${selectedRole}].`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update permissions' });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Revoke All Menus
  const handleRevokeAll = () => {
    if (isSuperUserRoleLocked) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const res = updateRoleMenuPermissions(selectedRole, [], selectedTenantId);
    if (res.success) {
      setStatusMessage({
        type: 'info',
        text: `Revoked all menu access for role [${selectedRole}].`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update permissions' });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Reset to Best Default Options
  const handleResetToDefaults = () => {
    if (isSuperUserRoleLocked) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const res = resetRoleMenuPermissionsToDefaults(selectedRole, selectedTenantId);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Reset role [${selectedRole}] to recommended standard best-practice menu permissions!`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to reset permissions' });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Reset ALL roles to best defaults for entity
  const handleResetAllRolesToDefaults = () => {
    if (window.confirm(`Are you sure you want to reset ALL roles to recommended default menu permissions for ${currentConfigTenant.name}?`)) {
      resetRoleMenuPermissionsToDefaults(undefined, selectedTenantId);
      setStatusMessage({
        type: 'success',
        text: `Successfully restored factory default menu permissions for roles in ${currentConfigTenant.name}.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Apply Preset Template
  const handleApplyPreset = (presetId: string) => {
    if (isSuperUserRoleLocked) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const res = applyRoleMenuPreset(presetId, selectedRole, selectedTenantId);
    if (res.success) {
      const preset = ROLE_MENU_PRESET_TEMPLATES.find((p) => p.id === presetId);
      setStatusMessage({
        type: 'success',
        text: `Applied "${preset?.name}" preset to role [${selectedRole}] (${preset?.permissions.length} modules configured).`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to apply preset' });
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  // Clone from role
  const handleExecuteClone = () => {
    if (isSuperUserRoleLocked) {
      setStatusMessage({
        type: 'error',
        text: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    if (cloneSourceRole === selectedRole) {
      setStatusMessage({ type: 'error', text: 'Source and target roles cannot be identical.' });
      return;
    }
    const res = copyRoleMenuPermissions(cloneSourceRole, selectedRole as string, selectedTenantId);
    if (res.success) {
      setIsCloneModalOpen(false);
      setStatusMessage({
        type: 'success',
        text: `Cloned menu access profile from [${cloneSourceRole}] to [${selectedRole}].`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to clone permissions' });
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  // Live SOX Segregation of Duties (SoD) Analysis
  const sodRiskAnalysis = useMemo(() => {
    const risks: { level: 'HIGH' | 'MEDIUM' | 'INFO'; title: string; message: string }[] = [];

    // Super user risk check
    if (selectedRole === 'super_user') {
      const businessMenus = currentAllowedMenus.filter(
        (m) => !['users_access', 'integrations_hub', 'webhooks', 'api_keys', 'backup_restore', 'audit_trail', 'help_center', 'api_manual'].includes(m)
      );
      if (businessMenus.length > 0) {
        risks.push({
          level: 'HIGH',
          title: 'SOX 404 ITGC Boundary Breach',
          message: `Super Admin currently has access to ${businessMenus.length} business data menus. Under SOX 404 ITGC Segregation of Duties, IT administrators must not access accounting ledgers or disbursement workflows.`,
        });
      }
    }

    // Maker-Checker AP Conflict
    if (currentAllowedMenus.includes('payables_ap') && currentAllowedMenus.includes('approvals') && selectedRole !== 'entity_admin' && selectedRole !== 'admin') {
      risks.push({
        level: 'MEDIUM',
        title: 'Disbursement & Dual Authorization Overlap',
        message: 'This role has access to both AP Vendor Bills and Approvals & Governance. Ensure maker-checker rules are enforced so users cannot authorize their own bills.',
      });
    }

    // Direct GL Posting + Fiscal Period Lock
    if (currentAllowedMenus.includes('ledger') && currentAllowedMenus.includes('fiscal_close') && selectedRole !== 'controller' && selectedRole !== 'entity_admin' && selectedRole !== 'admin') {
      risks.push({
        level: 'HIGH',
        title: 'Period Lock & Ledger Posting Concentration',
        message: 'Granting Fiscal Close & Period Lock alongside General Ledger entry allows period reopening without independent oversight.',
      });
    }

    // IT Keys + Financial Ledgers
    if (currentAllowedMenus.includes('api_keys') && currentAllowedMenus.includes('ledger') && selectedRole !== 'admin' && selectedRole !== 'entity_admin') {
      risks.push({
        level: 'MEDIUM',
        title: 'Developer Portal & Financial Subledger Access',
        message: 'API Key generation privileges combined with manual GL access poses potential programmatic data injection risks.',
      });
    }

    return risks;
  }, [selectedRole, currentAllowedMenus]);

  return (
    <div className="space-y-6">
      {/* SCOPE SELECTION & STATUS BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Role-to-Menu Access Control Engine
                </h2>
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-[11px] font-bold">
                  Entity Admin Setup
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
                  SOX 404 Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Configure module navigation visibility and access permissions for each user role within your authorized corporate entity.
              </p>
            </div>
          </div>

          {/* ENTITY SELECTOR & GLOBAL RESET */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="text-[10px] text-slate-400 uppercase font-mono">{tr("Entity Scope:")}</div>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
              >
                {authorizedTenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleResetAllRolesToDefaults}
              title="Reset all roles to factory default best practices"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{tr("Reset All Roles")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOAST / NOTIFICATION */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border shadow-lg transition-all animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW MODE TOGGLE & QUICK STATS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('ROLE_DETAIL')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'ROLE_DETAIL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Role Detail View
            </span>
          </button>
          <button
            onClick={() => setViewMode('FULL_MATRIX')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'FULL_MATRIX'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Cross-Role Matrix Grid ({ALL_MENU_OPTIONS.length} Menus)
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <strong>31</strong> Total Navigable Modules
          </span>
          <span className="text-slate-700">|</span>
          <span>
            <strong>{allRolesList.length}</strong> Defined Roles
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ROLE DETAIL WORKSPACE */}
      {/* ========================================================================= */}
      {viewMode === 'ROLE_DETAIL' && (
        <div className="space-y-6">
          {/* ROLE SELECTOR CARDS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {allRolesList.map((r) => {
              const isSelected = selectedRole === r.code;
              const allowedCount = getRoleAllowedMenus(r.code, selectedTenantId).length;
              return (
                <button
                  key={r.code}
                  onClick={() => setSelectedRole(r.code)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.code}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate" title={r.name}>
                      {r.name}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{tr("Allowed:")}</span>
                    <span
                      className={`font-mono font-bold ${
                        allowedCount === 31
                          ? 'text-emerald-400'
                          : allowedCount === 0
                          ? 'text-rose-400'
                          : 'text-indigo-300'
                      }`}
                    >
                      {allowedCount}/31
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE ROLE CONTROL TOOLBAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      Configuring Menu Access for: <span className="text-indigo-400">{allRolesList.find((r) => r.code === selectedRole)?.name}</span>
                    </h3>
                    <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono">
                      {selectedRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {allRolesList.find((r) => r.code === selectedRole)?.description || 'Custom organizational role permission profile.'}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS & PRESETS */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleGrantAll}
                  disabled={isSuperUserRoleLocked}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Grant All (31)
                </button>

                <button
                  onClick={handleRevokeAll}
                  disabled={isSuperUserRoleLocked}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Revoke All
                </button>

                <button
                  onClick={handleResetToDefaults}
                  disabled={isSuperUserRoleLocked}
                  title="Reset to recommended standard baseline for this role"
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" /> Best Defaults
                </button>

                <button
                  onClick={() => setIsCloneModalOpen(true)}
                  disabled={isSuperUserRoleLocked}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-400" /> Clone From...
                </button>

                {/* Role Simulation Button */}
                <button
                  onClick={() => {
                    setActiveRole(selectedRole as Role);
                    if (onSimulateRole) onSimulateRole(selectedRole as Role);
                    setStatusMessage({
                      type: 'success',
                      text: `Switched active preview role to [${selectedRole}]. Sidebar navigation updated in real time!`,
                    });
                    setTimeout(() => setStatusMessage(null), 3500);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  title="Simulate how the sidebar and pages look for this role right now"
                >
                  <Eye className="w-3.5 h-3.5" /> Simulate Role Now
                </button>
              </div>
            </div>

            {/* PRESET QUICK PILLS */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Quick Presets:
              </span>
              {ROLE_MENU_PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  disabled={isSuperUserRoleLocked}
                  title={preset.description}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950/60 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 hover:border-indigo-500/50 rounded-lg text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{preset.name}</span>
                  <span className="text-[9px] px-1 bg-slate-800 text-indigo-300 rounded font-mono">
                    {preset.permissions.length} modules
                  </span>
                </button>
              ))}
            </div>

            {/* SUPER ADMIN ACCESS PROTECTED BANNER */}
            {isSuperUserRoleLocked && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-300">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-amber-200">{tr("Super Admin Menu Access is Protected & Immutable")}</div>
                  <div className="text-[11px] text-amber-300/80 leading-relaxed">
                    Under SOX 404 ITGC standards, Super Administrator menu permissions are immutable and managed strictly by Super Users. Entity Administrators cannot alter Super Admin menu visibility.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SOX SEGREGATION OF DUTIES REAL-TIME RISK ADVISORY */}
          {sodRiskAnalysis.length > 0 && (
            <div className="space-y-2">
              {sodRiskAnalysis.map((risk, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                    risk.level === 'HIGH'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${risk.level === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`} />
                  <div className="space-y-1">
                    <div className="font-bold">{risk.title}</div>
                    <p className="text-[11px] leading-relaxed text-slate-300">{risk.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SEARCH AND CATEGORY FILTER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menus by keyword, category, or key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Categories ({ALL_MENU_OPTIONS.length})
              </button>
              {MENU_CATEGORIES.map((cat) => {
                const count = ALL_MENU_OPTIONS.filter((m) => m.category === cat.id).length;
                const isCatActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isCatActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORIZED MENU CARDS GRID */}
          <div className="space-y-6">
            {MENU_CATEGORIES.filter((cat) => selectedCategory === 'ALL' || selectedCategory === cat.id).map((category) => {
              const categoryItems = filteredMenuOptions.filter((m) => m.category === category.id);
              if (categoryItems.length === 0) return null;

              const grantedCount = categoryItems.filter((m) => currentAllowedMenus.includes(m.id)).length;
              const isAllGranted = grantedCount === categoryItems.length;

              return (
                <div
                  key={category.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
                >
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {category.label}
                        </h4>
                        <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono font-bold">
                          {grantedCount} / {categoryItems.length} Enabled
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCategory(category.id, true)}
                        disabled={isSuperUserRoleLocked}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-400 rounded-lg text-[11px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        Enable All
                      </button>
                      <button
                        onClick={() => handleToggleCategory(category.id, false)}
                        disabled={isSuperUserRoleLocked}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 rounded-lg text-[11px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        Disable All
                      </button>
                    </div>
                  </div>

                  {/* Menu Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryItems.map((menuItem) => {
                      const isGranted = currentAllowedMenus.includes(menuItem.id);
                      return (
                        <div
                          key={menuItem.id}
                          onClick={() => {
                            if (!isSuperUserRoleLocked) {
                              handleToggleMenu(menuItem.id);
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all select-none flex flex-col justify-between ${
                            isSuperUserRoleLocked
                              ? 'cursor-not-allowed opacity-80'
                              : 'cursor-pointer'
                          } ${
                            isGranted
                              ? 'bg-slate-950/90 border-indigo-500/60 shadow-md shadow-indigo-500/5 hover:border-indigo-400'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`p-2 rounded-lg ${
                                    isGranted
                                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                      : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {renderMenuIcon(menuItem.iconName)}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{menuItem.label}</span>
                                    {menuItem.badge && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-bold">
                                        {menuItem.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    tab_id: {menuItem.id}
                                  </div>
                                </div>
                              </div>

                              {/* Toggle Checkbox */}
                              {isSuperUserRoleLocked ? (
                                <div
                                  className="w-5 h-5 rounded-md flex items-center justify-center bg-slate-900 border border-amber-500/30 text-amber-400"
                                  title="Locked: Super Admin access is immutable"
                                >
                                  <Lock className="w-3 h-3" />
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                    isGranted
                                      ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-bold'
                                      : 'border border-slate-700 bg-slate-900 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                              {menuItem.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                                menuItem.sodRiskLevel === 'CRITICAL'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : menuItem.sodRiskLevel === 'HIGH'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : menuItem.sodRiskLevel === 'MEDIUM'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              Risk: {menuItem.sodRiskLevel || 'LOW'}
                            </span>

                            <span
                              className={`font-bold ${
                                isGranted ? 'text-emerald-400' : 'text-slate-600'
                              }`}
                            >
                              {isGranted ? 'Authorized' : 'Hidden'}
                            </span>
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
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FULL CROSS-ROLE MATRIX GRID */}
      {/* ========================================================================= */}
      {viewMode === 'FULL_MATRIX' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Interactive Cross-Role Menu Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any cell in the matrix below to grant or revoke specific menu visibility for that role in real time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Categories ({ALL_MENU_OPTIONS.length} Menus)</option>
                {MENU_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-mono bg-slate-950/40">
                  <th className="py-3 px-4 min-w-[280px]">{tr("Application Menu / Functional Module")}</th>
                  <th className="py-3 px-2 text-center min-w-[70px]">{tr("Category")}</th>
                  {allRolesList.map((r) => {
                    const isSuperLockedCol = r.code === 'super_user' && !isSuperUser;
                    return (
                      <th key={r.code} className="py-3 px-3 text-center min-w-[110px]">
                        <div className="font-bold text-white truncate flex items-center justify-center gap-1">
                          {r.name}
                          {isSuperLockedCol && <Lock className="w-3 h-3 text-amber-400" />}
                        </div>
                        <div className="text-[9px] text-indigo-400 font-mono lowercase">({r.code})</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredMenuOptions.map((menuItem) => (
                  <tr key={menuItem.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{renderMenuIcon(menuItem.iconName, 'w-3.5 h-3.5')}</span>
                        <span className="font-bold text-white text-xs">{menuItem.label}</span>
                        {menuItem.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono font-bold">
                            {menuItem.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{menuItem.id}</div>
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span className="text-[9px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-full font-mono">
                        {menuItem.category.split('_')[0]}
                      </span>
                    </td>

                    {allRolesList.map((r) => {
                      const isGranted = getRoleAllowedMenus(r.code, selectedTenantId).includes(menuItem.id);
                      const isSuperLockedCol = r.code === 'super_user' && !isSuperUser;

                      if (isSuperLockedCol) {
                        return (
                          <td key={r.code} className="py-2.5 px-3 text-center">
                            <div
                              title="Super Admin menu permissions are immutable and managed only by Super Users"
                              className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-slate-950/60 border border-amber-500/30 text-amber-400 opacity-80 cursor-not-allowed mx-auto"
                            >
                              {isGranted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Lock className="w-3 h-3" />}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={r.code} className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleMenuForRole(r.code, menuItem.id)}
                            title={`${isGranted ? 'Revoke' : 'Grant'} ${menuItem.label} for ${r.name}`}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                              isGranted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm'
                                : 'bg-slate-950 text-slate-600 border border-slate-800 hover:border-slate-700 hover:text-slate-400'
                            }`}
                          >
                            {isGranted ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-3.5 h-3.5" />}
                          </button>
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

      {/* CLONE ROLE MODAL */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-400" /> Clone Menu Configuration
              </h3>
              <button onClick={() => setIsCloneModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copy all configured menu module visibility rules from an existing source role to{' '}
              <strong className="text-white">[{allRolesList.find((r) => r.code === selectedRole)?.name}]</strong> for entity{' '}
              <strong className="text-indigo-400">{currentConfigTenant.name}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">{tr("Select Source Role to Copy From:")}</label>
              <select
                value={cloneSourceRole}
                onChange={(e) => setCloneSourceRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                {allRolesList
                  .filter((r) => r.code !== selectedRole)
                  .map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.code}) — {getRoleAllowedMenus(r.code, selectedTenantId).length} modules enabled
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCloneModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClone}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Apply Cloned Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
