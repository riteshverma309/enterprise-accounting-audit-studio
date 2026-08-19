import React, { useMemo, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Building2, ShieldCheck, UserCheck, Scale, Globe2, ChevronDown, Plus, BookOpen, HelpCircle, HardDriveDownload, User, ShieldAlert } from 'lucide-react';
import { Role } from '../types';

interface HeaderProps {
  onOpenCreateTenantModal: () => void;
  onOpenHelpCenter?: () => void;
  onOpenBackupModal?: () => void;
}

interface SimulatedUserDetail {
  name: string;
  email: string;
  title: string;
  roleLabel: string;
  initials: string;
  avatarGradient: string;
  badgeClass: string;
}

export const SIMULATED_USERS_MAP: Record<Role, SimulatedUserDetail> = {
  super_user: {
    name: 'Alex Mercer',
    email: 'alex.superuser@platform.com',
    title: 'Global Systems Super Admin',
    roleLabel: 'Super Admin',
    initials: 'AM',
    avatarGradient: 'from-purple-600 to-indigo-600',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  entity_admin: {
    name: 'Maria Santos',
    email: 'maria.admin@acme-us.com',
    title: 'Acme US Entity Administrator',
    roleLabel: 'Entity Admin',
    initials: 'MS',
    avatarGradient: 'from-indigo-600 to-blue-600',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  admin: {
    name: 'Johnathan Miller',
    email: 'john.admin@acme.com',
    title: 'Chief Financial Officer (CFO)',
    roleLabel: 'Financial Admin',
    initials: 'JM',
    avatarGradient: 'from-emerald-600 to-teal-600',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  controller: {
    name: 'Sarah Jenkins',
    email: 'sarah.accountant@acme.com',
    title: 'Senior GL Controller',
    roleLabel: 'Controller',
    initials: 'SJ',
    avatarGradient: 'from-cyan-600 to-blue-600',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  accountant: {
    name: 'Rachel Adams',
    email: 'rachel.accountant@acme.com',
    title: 'Senior GL Accountant',
    roleLabel: 'Senior Accountant',
    initials: 'RA',
    avatarGradient: 'from-blue-600 to-indigo-600',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  junior_accountant: {
    name: 'David Vance',
    email: 'david.junior@acme.com',
    title: 'Staff AP/AR Accountant',
    roleLabel: 'Junior Accountant',
    initials: 'DV',
    avatarGradient: 'from-amber-600 to-orange-600',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  auditor: {
    name: 'Elena Rostova',
    email: 'elena.auditor@kpmg-audit.com',
    title: 'Principal SOX 404 Lead Auditor',
    roleLabel: 'SOX Auditor',
    initials: 'ER',
    avatarGradient: 'from-rose-600 to-pink-600',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  viewer: {
    name: 'Arthur Dent',
    email: 'guest.viewer@acme.com',
    title: 'Executive Read-Only Viewer',
    roleLabel: 'Viewer',
    initials: 'AD',
    avatarGradient: 'from-slate-600 to-zinc-600',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
  vendor: {
    name: 'Amazon Web Services (Vendor)',
    email: 'aws-invoicing@amazon.com',
    title: 'AWS Enterprise Billing Representative',
    roleLabel: 'Vendor',
    initials: 'AW',
    avatarGradient: 'from-emerald-600 to-teal-700',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  customer: {
    name: 'Vanguard Global (Customer)',
    email: 'finance.ap@vanguardglobal.com',
    title: 'Client AP Lead',
    roleLabel: 'Customer',
    initials: 'VG',
    avatarGradient: 'from-blue-600 to-sky-700',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
};

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateTenantModal,
  onOpenHelpCenter,
  onOpenBackupModal,
}) => {
  const {
    tenants,
    activeTenant,
    activeOrganization,
    activeBranch,
    activeRole,
    activePlugin,
    userEmail,
    userName,
    setActiveTenantId,
    setActiveOrganizationId,
    setActiveBranchId,
    setActiveRole,
    setUserEmail,
    setUserName,
    enterpriseUsers,
    balanceSheet,
    downloadCompanyBackup,
  } = useAccounting();

  // Identify currently simulated/active user from enterprise directory
  const currentUserObj = useMemo(() => {
    const users = enterpriseUsers || [];
    return (
      users.find((u) => u.email.toLowerCase() === (userEmail || '').toLowerCase()) ||
      users.find((u) => u.defaultRole === activeRole) ||
      users[0]
    );
  }, [enterpriseUsers, userEmail, activeRole]);

  // Compute allowed entities for the currently selected user
  const allowedTenants = useMemo(() => {
    const allTenants = tenants || [];
    if (!currentUserObj) return allTenants;

    // Super Admin has global system-level access to all tenants
    if (currentUserObj.defaultRole === 'super_user' || activeRole === 'super_user') {
      return allTenants;
    }

    // Filter tenants strictly to those provisioned in user's tenantScopes
    const scopedTenantIds = new Set((currentUserObj.tenantScopes || []).map((s) => s.tenantId));
    const filtered = allTenants.filter((t) => scopedTenantIds.has(t.id));

    return filtered.length > 0 ? filtered : allTenants;
  }, [tenants, currentUserObj, activeRole]);

  // Safeguard: Ensure active tenant is always one of the user's provisioned entities
  useEffect(() => {
    if (allowedTenants.length > 0 && !allowedTenants.some((t) => t.id === activeTenant?.id)) {
      const firstAllowed = allowedTenants[0];
      setActiveTenantId(firstAllowed.id);
      const scopeRole = currentUserObj?.tenantScopes?.find((s) => s.tenantId === firstAllowed.id)?.role;
      if (scopeRole) {
        setActiveRole(scopeRole);
      }
    }
  }, [allowedTenants, activeTenant?.id, currentUserObj, setActiveTenantId, setActiveRole]);

  // Handle switching active simulated user
  const handleUserSelect = (selectedUserId: string) => {
    const users = enterpriseUsers || [];
    const allTenants = tenants || [];
    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser) return;

    setUserEmail(selectedUser.email);
    setUserName(selectedUser.name);

    // Determine allowed tenants for the newly selected user
    let userAllowedTenants = allTenants;
    if (selectedUser.defaultRole !== 'super_user') {
      const scopedIds = new Set((selectedUser.tenantScopes || []).map((s) => s.tenantId));
      const filtered = allTenants.filter((t) => scopedIds.has(t.id));
      if (filtered.length > 0) {
        userAllowedTenants = filtered;
      }
    }

    // If current active tenant is not in provisioned scope, switch to first provisioned entity
    let targetTenantId = activeTenant?.id;
    if (!userAllowedTenants.some((t) => t.id === activeTenant?.id)) {
      targetTenantId = userAllowedTenants[0].id;
      setActiveTenantId(targetTenantId);
    }

    // Set role for the target entity
    const scopeForTenant = selectedUser.tenantScopes?.find((s) => s.tenantId === targetTenantId);
    const effectiveRole = scopeForTenant?.role || selectedUser.defaultRole;
    setActiveRole(effectiveRole);
  };

  // Handle switching tenant from entity dropdown
  const handleTenantSelect = (tenantId: string) => {
    setActiveTenantId(tenantId);
    if (currentUserObj) {
      const scope = currentUserObj.tenantScopes?.find((s) => s.tenantId === tenantId);
      if (scope?.role) {
        setActiveRole(scope.role);
      }
    }
  };

  const roleDetails = SIMULATED_USERS_MAP[activeRole] || {
    name: userName || currentUserObj?.name || 'Enterprise User',
    email: userEmail || currentUserObj?.email || 'user@acme.com',
    title: currentUserObj?.title || 'Corporate Finance User',
    roleLabel: activeRole.replace('_', ' '),
    initials: (userName || currentUserObj?.name || 'EU').split(' ').map((n) => n[0]).join('').slice(0, 2),
    avatarGradient: 'from-indigo-600 to-slate-700',
    badgeClass: 'bg-slate-700 text-slate-200 border-slate-600',
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-3 sticky top-0 z-30 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Brand + Entity Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  Enterprise Audit Studio
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  API v1.4
                </span>
              </div>
              <p className="text-xs text-slate-400">Double-Entry Engine & Multi-Standard Auditor</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          {/* Scope Dropdown: Tenant Select (Restricted strictly to user's provisioned entities) */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <div className="relative">
              <select
                value={activeTenant.id}
                onChange={(e) => handleTenantSelect(e.target.value)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs rounded-lg px-3 py-1.5 border border-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer pr-8"
                title={`Provisioned Entities (${allowedTenants.length} of ${tenants.length} available to ${currentUserObj?.name || 'user'})`}
              >
                {allowedTenants.map((t) => {
                  const scopeRole = currentUserObj?.tenantScopes?.find((s) => s.tenantId === t.id)?.role;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) - {t.currency} {scopeRole ? `• [${scopeRole.replace('_', ' ')}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Entity Scope Counter Pill */}
            <span
              className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700 whitespace-nowrap"
              title={`${currentUserObj?.name || 'Selected user'} is provisioned for ${allowedTenants.length} out of ${tenants.length} total corporate entities.`}
            >
              {allowedTenants.length === tenants.length ? 'Global Scope' : `${allowedTenants.length} of ${tenants.length} Entities`}
            </span>

            {/* Org / Branch Selectors */}
            {activeTenant.organizations && activeTenant.organizations.length > 0 && (
              <select
                value={activeOrganization?.id || ''}
                onChange={(e) => {
                  setActiveOrganizationId(e.target.value || null);
                  const org = activeTenant.organizations.find((o) => o.id === e.target.value);
                  if (org && org.branches.length > 0) {
                    setActiveBranchId(org.branches[0].id);
                  }
                }}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 font-mono outline-none cursor-pointer hidden md:block"
              >
                {activeTenant.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    Org: {org.code}
                  </option>
                ))}
              </select>
            )}

            {/* Only allow creating new tenant if authorized */}
            {(activeRole === 'super_user' || activeRole === 'admin') && (
              <button
                onClick={onOpenCreateTenantModal}
                title="Add New Tenant Entity"
                className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 rounded-lg border border-slate-700 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Request Context Headers, Plugin Standard, & User Role Simulation */}
        <div className="flex items-center flex-wrap gap-3 text-xs">
          
          {/* Double-Entry Ledger Health Indicator OR SOX ITGC Indicator */}
          {activeRole === 'super_user' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-medium text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>SOX 404 SoD: SETUP ONLY</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-medium text-[11px] border ${
                balanceSheet.isBalanced
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${balanceSheet.isBalanced ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="hidden xl:inline">{balanceSheet.isBalanced ? 'DEBITS = CREDITS BALANCED' : 'IMBALANCE DETECTED'}</span>
              <span className="xl:hidden">{balanceSheet.isBalanced ? 'BALANCED' : 'IMBALANCE'}</span>
            </div>
          )}

          {/* Plugin Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-slate-200">
              {activePlugin === 'us_gaap' && 'US GAAP'}
              {activePlugin === 'eu_ifrs' && 'EU IFRS'}
              {activePlugin === 'in_gst' && 'IN GST'}
            </span>
          </div>

          {/* Simulated User Profile & User Switcher Dropdown */}
          <div className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-sm transition">
            {/* User Avatar with Initials */}
            <div
              className={`w-7 h-7 rounded-full bg-gradient-to-tr ${roleDetails.avatarGradient} flex items-center justify-center font-bold text-[11px] text-white shadow-inner shrink-0 ring-1 ring-white/10`}
              title={`${roleDetails.name} (${roleDetails.email}) - ${roleDetails.title}`}
            >
              {roleDetails.initials}
            </div>

            {/* User Name & Details */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight leading-none whitespace-nowrap">
                  {currentUserObj?.name || roleDetails.name}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 font-mono font-bold rounded border ${roleDetails.badgeClass}`}>
                  {roleDetails.roleLabel}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none truncate max-w-[140px] hidden sm:inline">
                {currentUserObj?.email || roleDetails.email}
              </span>
            </div>

            <div className="h-5 w-px bg-slate-700/80 mx-0.5 hidden sm:block" />

            {/* User Switcher Dropdown with Real-Time Provisioned Scope Count */}
            <div className="relative flex items-center">
              <select
                value={currentUserObj?.id || ''}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1 border border-slate-700/80 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                title="Select Active User & Simulate Provisioned Tenant Access"
              >
                {enterpriseUsers.map((u) => {
                  const scopeCount = u.defaultRole === 'super_user' ? 'Global' : `${u.tenantScopes?.length || 0} Entities`;
                  return (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                      {u.name} ({u.defaultRole.replace('_', ' ')}) • {scopeCount}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Backup & Restore Data Button */}
          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              title="1-Click Company Data Backup & Point-in-Time Restore"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Backup & Restore</span>
              <span className="sm:hidden">Backup</span>
            </button>
          )}

          {/* Help Center Quick Access Button */}
          {onOpenHelpCenter && (
            <button
              onClick={onOpenHelpCenter}
              title="Open Application Help Center & User Guide"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>User Guide</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

