import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  BookOpenCheck,
  BookOpen,
  FileSpreadsheet,
  FileCheck2,
  Landmark,
  Layers,
  ShieldAlert,
  Sparkles,
  Receipt,
  CreditCard,
  Lock,
  Globe2,
  Wallet,
  PieChart,
  ShieldCheck,
  Globe,
  Users,
  Terminal,
  Package,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'batch_upload'
  | 'entity_master'
  | 'products_services'
  | 'ledger'
  | 'invoicing_ar'
  | 'payables_ap'
  | 'treasury'
  | 'fpa_budget'
  | 'approvals'
  | 'tax_engine'
  | 'users_access'
  | 'audit_reports'
  | 'regulatory'
  | 'reconciliation'
  | 'assets_fx'
  | 'fiscal_close'
  | 'consolidation'
  | 'audit_trail'
  | 'ai_copilot'
  | 'help_center'
  | 'api_manual';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'batch_upload', label: 'Bulk Upload Transactions', icon: <UploadCloud className="w-4 h-4" />, badge: 'CSV / JSON' },
    { id: 'entity_master', label: 'Customers & Vendors', icon: <Users className="w-4 h-4" />, badge: 'EAV Master' },
    { id: 'products_services', label: 'Products & Services', icon: <Package className="w-4 h-4" />, badge: 'Pricing' },
    { id: 'ledger', label: 'General Ledger & CoA', icon: <BookOpenCheck className="w-4 h-4" /> },
    { id: 'invoicing_ar', label: 'Accounts Receivable (AR)', icon: <Receipt className="w-4 h-4" />, badge: 'Invoicing' },
    { id: 'payables_ap', label: 'Accounts Payable (AP)', icon: <CreditCard className="w-4 h-4" />, badge: 'Bills' },
    { id: 'treasury', label: 'Treasury & Cash Forecast', icon: <Wallet className="w-4 h-4" />, badge: 'IAS 7' },
    { id: 'fpa_budget', label: 'FP&A Budget vs Actuals', icon: <PieChart className="w-4 h-4" />, badge: 'Cost Center' },
    { id: 'approvals', label: 'Approvals & Governance', icon: <ShieldCheck className="w-4 h-4" />, badge: 'SOX 404' },
    { id: 'tax_engine', label: 'Tax & Multi-Jurisdiction', icon: <Globe className="w-4 h-4" />, badge: 'VAT / GST' },
    { id: 'users_access', label: 'User Provisioning & RBAC', icon: <Users className="w-4 h-4" />, badge: 'SOX 404' },
    { id: 'audit_reports', label: 'Financial Audit Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'regulatory', label: 'Regulatory Tax Filing', icon: <FileCheck2 className="w-4 h-4" />, badge: 'GST / GAAP / IFRS' },
    { id: 'reconciliation', label: 'Bank Reconciliation', icon: <Landmark className="w-4 h-4" /> },
    { id: 'assets_fx', label: 'Fixed Assets & FX', icon: <Layers className="w-4 h-4" /> },
    { id: 'fiscal_close', label: 'Fiscal Close & Lock', icon: <Lock className="w-4 h-4" />, badge: 'Period Lock' },
    { id: 'consolidation', label: 'Global Consolidation', icon: <Globe2 className="w-4 h-4" />, badge: 'Multi-Tenant' },
    { id: 'audit_trail', label: 'System Audit Logs', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'ai_copilot', label: 'AI Audit Copilot', icon: <Sparkles className="w-4 h-4" />, badge: 'Gemini' },
    { id: 'help_center', label: 'Help Center & User Guide', icon: <BookOpen className="w-4 h-4" />, badge: 'Guide & Sim' },
    { id: 'api_manual', label: 'REST API & User Manual', icon: <Terminal className="w-4 h-4" />, badge: 'OpenAPI 3.0' },
  ];


  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-1">
        <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Navigation</p>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isActive
                      ? 'bg-indigo-800 text-indigo-100'
                      : item.badge === 'Gemini'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-300">FastAPI Engine Status</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            SELECT FOR UPDATE: Active
            <br />
            SAVEPOINT Isolation: Enabled
          </p>
        </div>
      </div>
    </aside>
  );
};
