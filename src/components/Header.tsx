import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Building2, ShieldCheck, UserCheck, Scale, Globe2, ChevronDown, Plus } from 'lucide-react';
import { Role } from '../types';

interface HeaderProps {
  onOpenCreateTenantModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateTenantModal }) => {
  const {
    tenants,
    activeTenant,
    activeOrganization,
    activeBranch,
    activeRole,
    activePlugin,
    userEmail,
    setActiveTenantId,
    setActiveOrganizationId,
    setActiveBranchId,
    setActiveRole,
    setUserEmail,
    balanceSheet,
  } = useAccounting();

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    if (role === 'super_user') setUserEmail('alex.superuser@platform.com');
    else if (role === 'entity_admin') setUserEmail('maria.admin@acme-us.com');
    else if (role === 'admin') setUserEmail('john.admin@acme.com');
    else if (role === 'controller') setUserEmail('sarah.accountant@acme.com');
    else if (role === 'accountant') setUserEmail('sarah.accountant@acme.com');
    else if (role === 'junior_accountant') setUserEmail('david.junior@acme.com');
    else if (role === 'auditor') setUserEmail('elena.auditor@kpmg-audit.com');
    else setUserEmail('guest.viewer@acme.com');
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

          {/* Scope Dropdown: Tenant Select */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <div className="relative">
              <select
                value={activeTenant.id}
                onChange={(e) => setActiveTenantId(e.target.value)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs rounded-lg px-3 py-1.5 border border-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer pr-8"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) - {t.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Org / Branch Selectors */}
            {activeTenant.organizations.length > 0 && (
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

            <button
              onClick={onOpenCreateTenantModal}
              title="Add New Tenant Entity"
              className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 rounded-lg border border-slate-700 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Request Context Headers, Plugin Standard, & Role Simulation */}
        <div className="flex items-center flex-wrap gap-3 text-xs">
          
          {/* Double-Entry Ledger Health Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-medium text-[11px] border ${
              balanceSheet.isBalanced
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${balanceSheet.isBalanced ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            {balanceSheet.isBalanced ? 'DEBITS = CREDITS BALANCED' : 'IMBALANCE DETECTED'}
          </div>

          {/* Plugin Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-slate-200">
              {activePlugin === 'us_gaap' && 'US GAAP'}
              {activePlugin === 'eu_ifrs' && 'EU IFRS'}
              {activePlugin === 'in_gst' && 'IN GST'}
            </span>
          </div>

          {/* Simulated User Role */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium hidden sm:inline">Role:</span>
            <select
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value as Role)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="super_user" className="bg-slate-900 text-purple-300 font-bold">
                ⚡ Super User (Global System Admin)
              </option>
              <option value="entity_admin" className="bg-slate-900 text-indigo-300 font-bold">
                🏢 Entity Admin (Organization Admin)
              </option>
              <option value="admin" className="bg-slate-900 text-emerald-300">
                Financial Admin (Tenant Admin)
              </option>
              <option value="controller" className="bg-slate-900 text-cyan-300">
                Controller (Approvals & Close)
              </option>
              <option value="accountant" className="bg-slate-900 text-slate-200">
                Senior Accountant (GL Write)
              </option>
              <option value="junior_accountant" className="bg-slate-900 text-slate-300">
                Junior Accountant (Draft Only)
              </option>
              <option value="auditor" className="bg-slate-900 text-amber-300">
                Auditor (Read-Only Audit Ledger)
              </option>
              <option value="viewer" className="bg-slate-900 text-rose-300">
                Viewer (Read-Only - 403 Test)
              </option>
            </select>
          </div>

          {/* Active Header Scope Summary */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800 font-mono text-[10px] text-slate-400">
            <span className="text-indigo-400">x-tenant-id:</span> {activeTenant.id}
          </div>
        </div>

      </div>
    </header>
  );
};
