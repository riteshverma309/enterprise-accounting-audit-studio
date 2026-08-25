import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
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
  ClipboardCheck,
} from 'lucide-react';
import { TranslationKey } from '../i18n/translations';

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
  | 'purchase_orders'
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
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { activeRole, activeTenant, getRoleAllowedMenus } = useAccounting();

  const isSuperAdmin = activeRole === 'super_user';
  const isPartnerRole = activeRole === 'vendor' || activeRole === 'customer';
  // Role check: Only Admin, Entity Admin, and Super Admins can see User Provisioning & RBAC
  const isAdminOrSuperAdmin = activeRole === 'super_user' || activeRole === 'admin' || activeRole === 'entity_admin';

  // Dynamic allowed menus for active role in the current tenant scope
  const allowedMenus = getRoleAllowedMenus ? (getRoleAllowedMenus(activeRole, activeTenant?.id) || []) : [];

  const menuItems: { id: TabType; translationKey: TranslationKey; labelFallback: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', translationKey: 'tab_dashboard', labelFallback: 'Executive Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'backup_restore', translationKey: 'tab_backup_restore', labelFallback: 'Backup & Data Restore', icon: <HardDriveDownload className="w-4 h-4" />, badge: '1-Click' },
    { id: 'batch_upload', translationKey: 'tab_batch_upload', labelFallback: 'Bulk Upload Transactions', icon: <UploadCloud className="w-4 h-4" />, badge: 'CSV / JSON' },
    { id: 'entity_master', translationKey: 'tab_entity_master', labelFallback: 'Customers & Vendors', icon: <Users className="w-4 h-4" />, badge: 'EAV Master' },
    { id: 'products_services', translationKey: 'tab_products_services', labelFallback: 'Products & Services', icon: <Package className="w-4 h-4" />, badge: 'Pricing' },
    { id: 'partner_portal', translationKey: 'tab_partner_portal', labelFallback: 'Financial Position Portal', icon: <Building2 className="w-4 h-4" />, badge: 'Portal 360°' },
    { id: 'ledger', translationKey: 'tab_ledger', labelFallback: 'General Ledger & CoA', icon: <BookOpenCheck className="w-4 h-4" /> },
    { id: 'invoicing_ar', translationKey: 'tab_invoicing_ar', labelFallback: 'Accounts Receivable (AR)', icon: <Receipt className="w-4 h-4" />, badge: 'Invoicing' },
    { id: 'recurring_billing', translationKey: 'tab_recurring_billing', labelFallback: 'Recurring Billing', icon: <Repeat className="w-4 h-4" />, badge: 'Schedules' },
    { id: 'purchase_orders', translationKey: 'tab_purchase_orders', labelFallback: 'Purchase Orders (PO)', icon: <ClipboardCheck className="w-4 h-4" />, badge: 'Approvals' },
    { id: 'payables_ap', translationKey: 'tab_payables_ap', labelFallback: 'Accounts Payable (AP)', icon: <CreditCard className="w-4 h-4" />, badge: 'Bills' },
    { id: 'expenses', translationKey: 'tab_expenses', labelFallback: 'Expenses & Mileage', icon: <Car className="w-4 h-4" />, badge: 'Receipts' },
    { id: 'inventory', translationKey: 'tab_inventory', labelFallback: 'Inventory & Stock', icon: <Boxes className="w-4 h-4" />, badge: 'Valuation' },
    { id: 'employees', translationKey: 'tab_employees', labelFallback: 'Employee Directory', icon: <Users className="w-4 h-4" />, badge: 'Staff 360°' },
    { id: 'payroll', translationKey: 'tab_payroll', labelFallback: 'Payroll & Compensation', icon: <Banknote className="w-4 h-4" />, badge: 'Wages' },
    { id: 'treasury', translationKey: 'tab_treasury', labelFallback: 'Treasury & Cash Forecast', icon: <Wallet className="w-4 h-4" />, badge: 'IAS 7' },
    { id: 'fpa_budget', translationKey: 'tab_fpa_budget', labelFallback: 'FP&A Budget vs Actuals', icon: <PieChart className="w-4 h-4" />, badge: 'Cost Center' },
    { id: 'approvals', translationKey: 'tab_approvals', labelFallback: 'Approvals & Governance', icon: <ShieldCheck className="w-4 h-4" />, badge: 'SOX 404' },
    { id: 'tax_engine', translationKey: 'tab_tax_engine', labelFallback: 'Tax & Multi-Jurisdiction', icon: <Globe className="w-4 h-4" />, badge: 'VAT / GST' },
    { id: 'users_access', translationKey: 'tab_users_access', labelFallback: 'User Provisioning & RBAC', icon: <Users className="w-4 h-4" />, badge: 'SOX 404' },
    { id: 'audit_reports', translationKey: 'tab_audit_reports', labelFallback: 'Financial Audit Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'regulatory', translationKey: 'tab_regulatory', labelFallback: 'Regulatory Tax Filing', icon: <FileCheck2 className="w-4 h-4" />, badge: 'GST / GAAP / IFRS' },
    { id: 'reconciliation', translationKey: 'tab_reconciliation', labelFallback: 'Bank Feeds & Reconciliation', icon: <Landmark className="w-4 h-4" />, badge: 'Live Feeds' },
    { id: 'assets_fx', translationKey: 'tab_assets_fx', labelFallback: 'Fixed Assets & FX', icon: <Layers className="w-4 h-4" /> },
    { id: 'fiscal_close', translationKey: 'tab_fiscal_close', labelFallback: 'Fiscal Close & Lock', icon: <Lock className="w-4 h-4" />, badge: 'Period Lock' },
    { id: 'consolidation', translationKey: 'tab_consolidation', labelFallback: 'Global Consolidation', icon: <Globe2 className="w-4 h-4" />, badge: 'Multi-Tenant' },
    { id: 'integrations_hub', translationKey: 'tab_integrations_hub', labelFallback: 'Zapier / Make Connectors', icon: <Network className="w-4 h-4" />, badge: 'E-Comm' },
    { id: 'webhooks', translationKey: 'tab_webhooks', labelFallback: 'Webhooks Dispatcher', icon: <Webhook className="w-4 h-4" />, badge: 'Logs' },
    { id: 'api_keys', translationKey: 'tab_api_keys', labelFallback: 'API Keys & Developer Portal', icon: <KeyRound className="w-4 h-4" />, badge: 'Tokens' },
    { id: 'audit_trail', translationKey: 'tab_audit_trail', labelFallback: 'System Audit Logs', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'ai_copilot', translationKey: 'tab_ai_copilot', labelFallback: 'AI Audit Copilot', icon: <Sparkles className="w-4 h-4" />, badge: 'Gemini' },
    { id: 'help_center', translationKey: 'tab_help_center', labelFallback: 'Help Center & User Guide', icon: <BookOpen className="w-4 h-4" />, badge: 'Guide & Sim' },
    { id: 'api_manual', translationKey: 'tab_api_manual', labelFallback: 'REST API & User Manual', icon: <Terminal className="w-4 h-4" />, badge: 'OpenAPI 3.0' },
    { id: 'test_suite', translationKey: 'tab_test_suite', labelFallback: 'Test Suite & Regressions', icon: <CheckCircle2 className="w-4 h-4" />, badge: '65+ Tests' },
  ];

  const visibleMenuItems = (menuItems || []).filter((item) => {
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
    return (allowedMenus || []).includes(item.id);
  });

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-1">
        {isPartnerRole ? (
          <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{activeRole === 'vendor' ? t('vendor_portal_title') : t('customer_portal_title')}</span>
            </div>
            <p className="text-[10px] text-blue-400/80 mt-0.5 leading-tight">
              {t('partner_portal_desc')}
            </p>
          </div>
        ) : isSuperAdmin ? (
          <div className="mb-3 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('sox_setup_banner_title')}</span>
            </div>
            <p className="text-[10px] text-purple-400/80 mt-0.5 leading-tight">
              {t('sox_setup_banner_desc')}
            </p>
          </div>
        ) : (
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">{t('nav_heading')}</p>
        )}
        {visibleMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          const localizedLabel = t(item.translationKey, item.labelFallback);
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
                <span className="truncate">{localizedLabel}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1.5 ${
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
            <span className="text-[11px] font-semibold text-slate-300">{t('fastapi_engine_status')}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {t('select_for_update_active')}
            <br />
            {t('savepoint_isolation_enabled')}
          </p>
        </div>
      </div>
    </aside>
  );
};
