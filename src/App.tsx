import React, { useState } from 'react';
import { AccountingProvider } from './context/AccountingContext';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BatchUploadView } from './components/BatchUploadView';
import { EntityManagementView } from './components/EntityManagementView';
import { ProductServicesView } from './components/ProductServicesView';
import { LedgerView } from './components/LedgerView';
import { InvoicingArView } from './components/InvoicingArView';
import { PayablesApView } from './components/PayablesApView';
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
import { NewJournalModal } from './components/NewJournalModal';
import { CreateTenantModal } from './components/CreateTenantModal';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState<any>(null);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<any>(null);
  const [selectedProductForInvoice, setSelectedProductForInvoice] = useState<any>(null);
  const [selectedVendorForBill, setSelectedVendorForBill] = useState<any>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Header bar */}
      <Header
        onOpenCreateTenantModal={() => setIsTenantModalOpen(true)}
        onOpenHelpCenter={() => setActiveTab('help_center')}
      />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenNewJournalModal={() => setIsJournalModalOpen(true)}
            />
          )}

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

          {activeTab === 'payables_ap' && (
            <PayablesApView preSelectedVendor={selectedVendorForBill} />
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

          {activeTab === 'audit_trail' && <AuditTrailView />}

          {activeTab === 'ai_copilot' && <AiAuditCopilot />}

          {activeTab === 'help_center' && <HelpCenterView setActiveTab={setActiveTab} />}

          {activeTab === 'api_manual' && <ApiManualView />}
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
    </div>
  );
}

export default function App() {
  return (
    <AccountingProvider>
      <MainLayout />
    </AccountingProvider>
  );
}
