import React, { useState, useEffect } from 'react';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { Sidebar, TabType, SUPER_ADMIN_ALLOWED_TABS } from './components/Sidebar';
import { SoxRestrictedBusinessDataView } from './components/SoxRestrictedBusinessDataView';
import { DashboardView } from './components/DashboardView';
import { BatchUploadView } from './components/BatchUploadView';
import { EntityManagementView } from './components/EntityManagementView';
import { ProductServicesView } from './components/ProductServicesView';
import { LedgerView } from './components/LedgerView';
import { InvoicingArView } from './components/InvoicingArView';
import { PayablesApView } from './components/PayablesApView';
import { ExpenseTrackingView } from './components/ExpenseTrackingView';
import { RecurringBillingView } from './components/RecurringBillingView';
import { InventoryManagementView } from './components/InventoryManagementView';
import { PayrollView } from './components/PayrollView';
import { EmployeeDirectoryView } from './components/EmployeeDirectoryView';
import { TreasuryView } from './components/TreasuryView';
import { FpaBudgetView } from './components/FpaBudgetView';
import { ApprovalsView } from './components/ApprovalsView';
import { TaxEngineView } from './components/TaxEngineView';
import { UserManagementView } from './components/UserManagementView';
import { AuditReportsView } from './components/AuditReportsView';

import { RegulatoryReportsView } from './components/RegulatoryReportsView';
import { ReconciliationView } from './components/ReconciliationView';
import { AssetsFxView } from './components/AssetsFxView';
import { FiscalCloseView } from './components/FiscalCloseView';
import { ConsolidationView } from './components/ConsolidationView';
import { AuditTrailView } from './components/AuditTrailView';
import { AiAuditCopilot } from './components/AiAuditCopilot';
import { HelpCenterView } from './components/HelpCenterView';
import { ApiManualView } from './components/ApiManualView';
import { TestSuiteView } from './components/TestSuiteView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { WebhooksDispatcherDashboard } from './components/WebhooksDispatcherDashboard';
import { ApiKeysDeveloperPortal } from './components/ApiKeysDeveloperPortal';
import { IntegrationsConnectorsHub } from './components/IntegrationsConnectorsHub';
import { PartnerFinancialPositionView } from './components/PartnerFinancialPositionView';
import { CompanyBackupModal } from './components/CompanyBackupModal';
import { NewJournalModal } from './components/NewJournalModal';
import { CreateTenantModal } from './components/CreateTenantModal';

function MainLayout() {
  const { activeRole } = useAccounting();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState<any>(null);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<any>(null);
  const [selectedProductForInvoice, setSelectedProductForInvoice] = useState<any>(null);
  const [selectedVendorForBill, setSelectedVendorForBill] = useState<any>(null);

  const isSuperAdmin = activeRole === 'super_user';
  const isPartnerRole = activeRole === 'vendor' || activeRole === 'customer';

  // Automatically redirect Super Admin away from business data tabs
  useEffect(() => {
    if (isSuperAdmin && !SUPER_ADMIN_ALLOWED_TABS.includes(activeTab)) {
      setActiveTab('users_access');
    }
  }, [activeRole, isSuperAdmin, activeTab]);

  // Automatically redirect Vendor or Customer strictly to partner_portal and forbid all other tabs
  useEffect(() => {
    if (isPartnerRole && activeTab !== 'partner_portal') {
      setActiveTab('partner_portal');
    }
  }, [activeRole, isPartnerRole, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Header bar */}
      <Header
        onOpenCreateTenantModal={() => setIsTenantModalOpen(true)}
        onOpenHelpCenter={() => setActiveTab('help_center')}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6">
          {/* Vendor / Customer strict single page access */}
          {isPartnerRole ? (
            <PartnerFinancialPositionView />
          ) : isSuperAdmin && !SUPER_ADMIN_ALLOWED_TABS.includes(activeTab) ? (
            <SoxRestrictedBusinessDataView
              attemptedTab={activeTab}
              onNavigateToTab={setActiveTab}
            />
          ) : (
            <>
              {activeTab === 'partner_portal' && <PartnerFinancialPositionView />}

              {activeTab === 'dashboard' && (
                <DashboardView
                  setActiveTab={setActiveTab}
                  onOpenNewJournalModal={() => setIsJournalModalOpen(true)}
                />
              )}

              {activeTab === 'backup_restore' && <BackupRestoreView />}

              {activeTab === 'batch_upload' && <BatchUploadView />}

              {activeTab === 'entity_master' && (
                <EntityManagementView
                  onSelectCustomerForInvoice={(cust) => {
                    setSelectedCustomerForInvoice(cust);
                    setActiveTab('invoicing_ar');
                  }}
                  onSelectCustomerForStatement={(cust) => {
                    setSelectedCustomerForStatement(cust);
                    setActiveTab('invoicing_ar');
                  }}
                  onSelectVendorForBill={(vend) => {
                    setSelectedVendorForBill(vend);
                    setActiveTab('payables_ap');
                  }}
                />
              )}

              {activeTab === 'products_services' && (
                <ProductServicesView
                  onSelectProductForInvoice={(prod) => {
                    setSelectedProductForInvoice(prod);
                    setActiveTab('invoicing_ar');
                  }}
                />
              )}

              {activeTab === 'ledger' && (
                <LedgerView onOpenNewJournalModal={() => setIsJournalModalOpen(true)} />
              )}

              {activeTab === 'invoicing_ar' && (
                <InvoicingArView
                  preSelectedCustomer={selectedCustomerForInvoice}
                  preSelectedProduct={selectedProductForInvoice}
                  initialCustomerForStatement={selectedCustomerForStatement}
                  onNavigateToHelpCenter={() => setActiveTab('help_center')}
                />
              )}

              {activeTab === 'recurring_billing' && <RecurringBillingView />}

              {activeTab === 'payables_ap' && (
                <PayablesApView preSelectedVendor={selectedVendorForBill} />
              )}

              {activeTab === 'expenses' && <ExpenseTrackingView />}

              {activeTab === 'inventory' && <InventoryManagementView />}

              {activeTab === 'employees' && (
                <EmployeeDirectoryView
                  onNavigateToPayroll={() => setActiveTab('payroll')}
                  onNavigateToExpenses={() => setActiveTab('expenses')}
                />
              )}

              {activeTab === 'payroll' && (
                <PayrollView onNavigateToEmployees={() => setActiveTab('employees')} />
              )}

              {activeTab === 'treasury' && <TreasuryView />}

              {activeTab === 'fpa_budget' && <FpaBudgetView />}

              {activeTab === 'approvals' && <ApprovalsView />}

              {activeTab === 'tax_engine' && <TaxEngineView />}

              {activeTab === 'users_access' && <UserManagementView />}

              {activeTab === 'audit_reports' && <AuditReportsView />}

              {activeTab === 'regulatory' && <RegulatoryReportsView />}

              {activeTab === 'reconciliation' && <ReconciliationView />}

              {activeTab === 'assets_fx' && <AssetsFxView />}

              {activeTab === 'fiscal_close' && <FiscalCloseView />}

              {activeTab === 'consolidation' && <ConsolidationView />}

              {activeTab === 'integrations_hub' && (
                <IntegrationsConnectorsHub
                  onNavigateToWebhooks={() => setActiveTab('webhooks')}
                  onNavigateToApiKeys={() => setActiveTab('api_keys')}
                />
              )}

              {activeTab === 'webhooks' && (
                <WebhooksDispatcherDashboard onNavigateToApiKeys={() => setActiveTab('api_keys')} />
              )}

              {activeTab === 'api_keys' && (
                <ApiKeysDeveloperPortal onNavigateToWebhooks={() => setActiveTab('webhooks')} />
              )}

              {activeTab === 'audit_trail' && <AuditTrailView />}

              {activeTab === 'ai_copilot' && <AiAuditCopilot />}

              {activeTab === 'help_center' && <HelpCenterView setActiveTab={setActiveTab} />}

              {activeTab === 'api_manual' && <ApiManualView />}

              {activeTab === 'test_suite' && <TestSuiteView />}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <NewJournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
      />

      <CreateTenantModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onNavigateToImporter={() => setActiveTab('batch_upload')}
      />

      <CompanyBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <FontSizeProvider>
        <AccountingProvider>
          <MainLayout />
        </AccountingProvider>
      </FontSizeProvider>
    </LanguageProvider>
  );
}
