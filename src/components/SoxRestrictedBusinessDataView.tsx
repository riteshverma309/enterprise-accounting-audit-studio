import { useLanguage } from '../context/LanguageContext';
import React from 'react';
import { ShieldAlert, Lock, UserCheck, Network, HardDriveDownload, FileText, ArrowRight } from 'lucide-react';
import { TabType } from './Sidebar';

interface SoxRestrictedBusinessDataViewProps {
  attemptedTab: string;
  onNavigateToTab: (tab: TabType) => void;
}

export const SoxRestrictedBusinessDataView: React.FC<SoxRestrictedBusinessDataViewProps> = ({
  attemptedTab,
  onNavigateToTab,
}) => {
  const { tr } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
      {/* Main Alert Card */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background gradient accent */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-500/10">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {tr("SOX 404 ITGC Compliance Enforcement")}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {tr("Segregation of Duties (SoD) Active")}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight">
              {tr("Entity Business Data Restricted for Super Administrator")}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {tr("Under Sarbanes-Oxley Act (SOX 404) IT General Controls (ITGC) and standard corporate governance frameworks, users holding the Super Administrator (Global IT / Setup) role are strictly restricted from accessing, inspecting, or operating upon entity-level business and financial data.")}
            </p>
          </div>
        </div>

        {/* Informational Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <UserCheck className="w-4 h-4" />
              <span>{tr("Super Administrator Scope & Mandate")}</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              {tr("Facilitate global system configuration, tenant entity provisioning, IAM role & user access assignment, AI API key & quota controls, webhook dispatchers, and system backup/disaster recovery.")}
            </p>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <Lock className="w-4 h-4" />
              <span>{tr("Segregated Operational Domains")}</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              {tr("General Ledger, Chart of Accounts, Invoices & AR, Vendor Bills & AP, Employee Payroll & Compensation, Financial Reports, Bank Feeds, and AI Audit Copilot ledger queries.")}
            </p>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400 font-mono">
            {tr("Attempted access to view:")} <strong className="text-slate-200 uppercase">{attemptedTab.replace('_', ' ')}</strong>
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigateToTab('users_access')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{tr("Go to User Provisioning & RBAC")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateToTab('integrations_hub')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <Network className="w-4 h-4" />
              <span>{tr("Integrations Hub")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authorized Super Admin Tools */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          {tr("Authorized System Setup & Administration Tools")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigateToTab('users_access')}
            className="flex items-center gap-3 p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white">{tr("User Provisioning & RBAC")}</p>
              <p className="text-[10px] text-slate-400">{tr("IAM, Scopes & AI Quotas")}</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('integrations_hub')}
            className="flex items-center gap-3 p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white">{tr("Connectors & Webhooks")}</p>
              <p className="text-[10px] text-slate-400">{tr("Zapier, Make & APIs")}</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('backup_restore')}
            className="flex items-center gap-3 p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl text-left transition group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white">{tr("Backup & Data Restore")}</p>
              <p className="text-[10px] text-slate-400">{tr("Disaster Recovery")}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
