import React from 'react';
import { useAccounting } from '../context/AccountingContext';
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
  Car,
  Repeat,
  Boxes,
  Banknote,
  Database,
  HardDriveDownload,
  Webhook,
  KeyRound,
  Network,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'backup_restore'
  | 'batch_upload'
  | 'entity_master'
  | 'products_services'
  | 'partner_portal'
  | 'ledger'
  | 'invoicing_ar'
  | 'recurring_billing'
  | 'payables_ap'
  | 'expenses'
  | 'inventory'
  | 'employees'
  | 'payroll'
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
  | 'integrations_hub'
  | 'webhooks'
  | 'api_keys'
  | 'audit_trail'
  | 'ai_copilot'
  | 'help_center'
  | 'api_manual'
  | 'test_suite';

// SOX 404 Segregation of Duties (SoD): Super Admin is restricted to IT setup, IAM, and integrations
export const SUPER_ADMIN_ALLOWED_TABS: TabType[] = [
  'users_access',
  'integrations_hub',
  'webhooks',
  'api_keys',
  'backup_restore',
  'audit_trail',
  'help_center',
  'api_manual',
  'test_suite',
];

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { activeRole, activeTenant, getRoleAllowedMenus } = useAccounting();

  const isSuperAdmin = activeRole === 'super_user';
  const isPartnerRole = activeRole === 'vendor' || activeRole === 'customer';
  // Role check: Only Admin, Entity Admin, and Super Admins can see User Provisioning & RBAC
  const isAdminOrSuperAdmin = activeRole === 'super_user' || activeRole === 'admin' || activeRole === 'entity_admin';

  // Dynamic allowed menus for active role in the current tenant scope
  const allowedMenus = getRoleAllowedMenus(activeRole, activeTenant.id);

  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'backup_restore', label: 'Backup & Data Restore', icon: <HardDriveDownload className="w-4 h-4" />, badge: '1-Click' },
    { id: 'batch_upload', label: 'Bulk Upload Transactions', icon: <UploadCloud className="w-4 h-4" />, badge: 'CSV / JSON' },
    { id: 'entity_master', label: 'Customers & Vendors', icon: <Users className="w-4 h-4" />, badge: 'EAV Master' },
    { id: 'products_services', label: 'Products & Services', icon: <Package className="w-4 h-4" />, badge: 'Pricing' },
    { id: 'partner_portal', label: 'Financial Position Portal', icon: <Building2 className="w-4 h-4" />, badge: 'Portal 360°' },
    { id: 'ledger', label: 'General Ledger & CoA', icon: <BookOpenCheck className="w-4 h-4" /> },
    { id: 'invoicing_ar', label: 'Accounts Receivable (AR)', icon: <Receipt className="w-4 h-4" />, badge: 'Invoicing' },
    { id: 'recurring_billing', label: 'Recurring Billing', icon: <Repeat className="w-4 h-4" />, badge: 'Schedules' },
    { id: 'payables_ap', label: 'Accounts Payable (AP)', icon: <CreditCard className="w-4 h-4" />, badge: 'Bills' },
    { id: 'expenses', label: 'Expenses & Mileage', icon: <Car className="w-4 h-4" />, badge: 'Receipts' },
    { id: 'inventory', label: 'Inventory & Stock', icon: <Boxes className="w-4 h-4" />, badge: 'Valuation' },
    { id: 'employees', label: 'Employee Directory', icon: <Users className="w-4 h-4" />, badge: 'Staff 360°' },
    { id: 'payroll', label: 'Payroll & Compensation', icon: <Banknote className="w-4 h-4" />, badge: 'Wages' },
    { id: 'treasury', label: 'Treasury & Cash Forecast', icon: <Wallet className="w-4 h-4" />, badge: 'IAS 7' },
    { id: 'fpa_budget', label: 'FP&A Budget vs Actuals', icon: <PieChart className="w-4 h-4" />, badge: 'Cost Center' },
    { id: 'approvals', label: 'Approvals & Governance', icon: <ShieldCheck className="w-4 h-4" />, badge: 'SOX 404' },
    { id: 'tax_engine', label: 'Tax & Multi-Jurisdiction', icon: <Globe className="w-4 h-4" />, badge: 'VAT / GST' },
    { id: 'users_access', label: 'User Provisioning & RBAC', icon: <Users className="w-4 h-4" />, badge: 'SOX 404' },
    { id: 'audit_reports', label: 'Financial Audit Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'regulatory', label: 'Regulatory Tax Filing', icon: <FileCheck2 className="w-4 h-4" />, badge: 'GST / GAAP / IFRS' },
    { id: 'reconciliation', label: 'Bank Feeds & Reconciliation', icon: <Landmark className="w-4 h-4" />, badge: 'Live Feeds' },
    { id: 'assets_fx', label: 'Fixed Assets & FX', icon: <Layers className="w-4 h-4" /> },
    { id: 'fiscal_close', label: 'Fiscal Close & Lock', icon: <Lock className="w-4 h-4" />, badge: 'Period Lock' },
    { id: 'consolidation', label: 'Global Consolidation', icon: <Globe2 className="w-4 h-4" />, badge: 'Multi-Tenant' },
    { id: 'integrations_hub', label: 'Zapier / Make Connectors', icon: <Network className="w-4 h-4" />, badge: 'E-Comm' },
    { id: 'webhooks', label: 'Webhooks Dispatcher', icon: <Webhook className="w-4 h-4" />, badge: 'Logs' },
    { id: 'api_keys', label: 'API Keys & Developer Portal', icon: <KeyRound className="w-4 h-4" />, badge: 'Tokens' },
    { id: 'audit_trail', label: 'System Audit Logs', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'ai_copilot', label: 'AI Audit Copilot', icon: <Sparkles className="w-4 h-4" />, badge: 'Gemini' },
    { id: 'help_center', label: 'Help Center & User Guide', icon: <BookOpen className="w-4 h-4" />, badge: 'Guide & Sim' },
    { id: 'api_manual', label: 'REST API & User Manual', icon: <Terminal className="w-4 h-4" />, badge: 'OpenAPI 3.0' },
    { id: 'test_suite', label: 'Test Suite & Regressions', icon: <CheckCircle2 className="w-4 h-4" />, badge: '65+ Tests' },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    // Partner Portal users (Vendor / Customer) strictly see ONLY the Financial Position Portal page
    if (isPartnerRole) {
      return item.id === 'partner_portal';
    }
    // SOX 404 Segregation of Duties: Super Admin only sees system setup & administration tools
    if (isSuperAdmin) {
      return SUPER_ADMIN_ALLOWED_TABS.includes(item.id);
    }
    if (item.id === 'users_access') {
      return isAdminOrSuperAdmin;
    }
    // Dynamic Role-Menu permissions check
    return allowedMenus.includes(item.id);
  });

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-1">
        {isPartnerRole ? (
          <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{activeRole === 'vendor' ? 'VENDOR PORTAL' : 'CUSTOMER PORTAL'}</span>
            </div>
            <p className="text-[10px] text-blue-400/80 mt-0.5 leading-tight">
              Access restricted strictly to your financial position with this entity.
            </p>
          </div>
        ) : isSuperAdmin ? (
          <div className="mb-3 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOX 404 ITGC SETUP</span>
            </div>
            <p className="text-[10px] text-purple-400/80 mt-0.5 leading-tight">
              Business data menus restricted under Segregation of Duties.
            </p>
          </div>
        ) : (
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Navigation</p>
        )}
        {visibleMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? isSuperAdmin
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-semibold'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
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
                      ? isSuperAdmin
                        ? 'bg-purple-800 text-purple-100'
                        : 'bg-indigo-800 text-indigo-100'
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
