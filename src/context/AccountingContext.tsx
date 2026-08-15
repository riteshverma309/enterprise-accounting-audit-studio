import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  Tenant,
  Organization,
  Branch,
  Role,
  PluginId,
  Account,
  JournalEntry,
  JournalLine,
  BankStatementLine,
  FixedAsset,
  AuditLogEvent,
  TrialBalanceRow,
  BalanceSheetData,
  IncomeStatementData,
  StatutoryReportData,
  ParsedTransactionUpload,
  CustomerInvoice,
  VendorBill,
  FiscalPeriod,
  CashFlowData,
  FinancialRatiosData,
  ConsolidatedEntityData,
  TreasuryAccount,
  DepartmentBudget,
  ApprovalItem,
  TaxJurisdiction,
  EnterpriseUser,
  CustomRoleDefinition,
  TenantAccessScope,
  PermissionKey,
  CustomerContact,
  VendorContact,
  CustomAttributeDefinition,
  IndustryPresetType,
  ProductServiceItem,
  ItemType,
  PriceChangeHistoryEntry,
  InvoiceTemplate,
  CustomerPaymentReceipt,
  CustomerOpeningBalanceRecord,
  CustomerLedgerTransaction,
  PaymentMethodType,
  InvoicePaymentAllocation,
  BulkInvoiceBatchRun,
  CustomerStatementData,
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_ACCOUNTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_BANK_STATEMENTS,
  INITIAL_FIXED_ASSETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INVOICES,
  INITIAL_BILLS,
  INITIAL_FISCAL_PERIODS,
  INITIAL_TREASURY_ACCOUNTS,
  INITIAL_DEPARTMENT_BUDGETS,
  INITIAL_APPROVAL_ITEMS,
  INITIAL_TAX_JURISDICTIONS,
  INITIAL_ENTERPRISE_USERS,
  INITIAL_CUSTOM_ROLES,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_OPENING_BALANCES,
  INITIAL_BULK_BATCHES,
  FX_RATES,
  mockCustomAttributeDefinitions,
  mockCustomerContacts,
  mockVendorContacts,
  mockProductServices,
  mockPriceChangeHistory,
  mockInvoiceTemplates,
} from '../mockData';

interface AccountingContextType {
  // Tenant & Context Headers State
  tenants: Tenant[];
  activeTenant: Tenant;
  activeOrganization: Organization | null;
  activeBranch: Branch | null;
  activeRole: Role;
  userEmail: string;
  activePlugin: PluginId;

  // Actions for Switching Context
  setActiveTenantId: (tenantId: string) => void;
  setActiveOrganizationId: (orgId: string | null) => void;
  setActiveBranchId: (branchId: string | null) => void;
  setActiveRole: (role: Role) => void;
  setUserEmail: (email: string) => void;

  // Ledger & Sub-Ledger Data
  accounts: Account[];
  journalEntries: JournalEntry[];
  bankStatements: BankStatementLine[];
  fixedAssets: FixedAsset[];
  auditLogs: AuditLogEvent[];
  invoices: CustomerInvoice[];
  vendorBills: VendorBill[];
  fiscalPeriods: FiscalPeriod[];
  treasuryAccounts: TreasuryAccount[];
  departmentBudgets: DepartmentBudget[];
  approvalItems: ApprovalItem[];
  taxJurisdictions: TaxJurisdiction[];
  enterpriseUsers: EnterpriseUser[];
  customRoles: CustomRoleDefinition[];
  customers: CustomerContact[];
  vendors: VendorContact[];
  customAttributeDefinitions: CustomAttributeDefinition[];
  productsServices: ProductServiceItem[];
  priceChangeHistory: PriceChangeHistoryEntry[];

  // Entity Master & Custom Dynamic Attributes Management
  createCustomer: (customerData: Omit<CustomerContact, 'id' | 'createdAt'>) => { success: boolean; customer?: CustomerContact; error?: string };
  updateCustomer: (id: string, updates: Partial<CustomerContact>) => { success: boolean; error?: string };
  deleteCustomer: (id: string) => { success: boolean; error?: string };
  batchCreateCustomers: (
    customersList: Array<Omit<CustomerContact, 'id' | 'createdAt'>>,
    strategy?: 'append' | 'upsert'
  ) => { success: boolean; createdCount: number; updatedCount: number; skippedCount: number; errors: string[] };
  createVendor: (vendorData: Omit<VendorContact, 'id' | 'createdAt'>) => { success: boolean; vendor?: VendorContact; error?: string };
  updateVendor: (id: string, updates: Partial<VendorContact>) => { success: boolean; error?: string };
  deleteVendor: (id: string) => { success: boolean; error?: string };
  createCustomAttribute: (attrData: Omit<CustomAttributeDefinition, 'id'>) => { success: boolean; attribute?: CustomAttributeDefinition; error?: string };
  deleteCustomAttribute: (id: string) => { success: boolean; error?: string };
  applyIndustryPresetAttributes: (preset: IndustryPresetType, tenantId: string) => { success: boolean; count: number };

  // Products & Services Catalog Management
  createProductService: (data: Omit<ProductServiceItem, 'id' | 'createdAt'>) => { success: boolean; item?: ProductServiceItem; error?: string };
  updateProductService: (id: string, updates: Partial<ProductServiceItem>, reason?: string) => { success: boolean; error?: string };
  updateProductPrice: (itemId: string, newPrice: number, reason: string, effectiveDate?: string, notes?: string) => { success: boolean; historyEntry?: PriceChangeHistoryEntry; error?: string };
  deleteProductService: (id: string) => { success: boolean; error?: string };
  applyIndustryPresetProducts: (preset: IndustryPresetType, tenantId: string) => { success: boolean; count: number };

  // Invoice Templates Management Engine
  invoiceTemplates: InvoiceTemplate[];
  createInvoiceTemplate: (templateData: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'usageCount'>) => { success: boolean; template?: InvoiceTemplate; error?: string };
  updateInvoiceTemplate: (id: string, updates: Partial<InvoiceTemplate>) => { success: boolean; error?: string };
  deleteInvoiceTemplate: (id: string) => { success: boolean; error?: string };
  duplicateInvoiceTemplate: (id: string) => { success: boolean; template?: InvoiceTemplate; error?: string };
  incrementTemplateUsage: (templateId: string) => void;

  // Bulk Invoice Generation & Batch Operations Engine
  bulkInvoiceBatches: BulkInvoiceBatchRun[];
  batchCreateInvoices: (params: {
    title: string;
    groupingAttributeKey: string;
    groupingAttributeName: string;
    invoicesData: Omit<CustomerInvoice, 'id' | 'invoiceNumber' | 'amountPaid' | 'status'>[];
    groupBreakdowns: {
      groupId: string;
      groupName: string;
      templateCode: string;
      templateName: string;
      customerCount: number;
      groupTotalAmount: number;
    }[];
    templateIdsUsed: string[];
  }) => { success: boolean; batchRun?: BulkInvoiceBatchRun; createdInvoicesCount: number; error?: string };
  rollbackInvoiceBatch: (batchId: string, reason?: string) => { success: boolean; error?: string };

  // User Access & Provisioning Engine
  createEnterpriseUser: (userData: Omit<EnterpriseUser, 'id' | 'createdAt' | 'lastLogin' | 'apiTokenCount'>) => { success: boolean; error?: string };
  updateUserStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED') => void;
  updateUserRoleAndScopes: (userId: string, defaultRole: Role, tenantScopes: TenantAccessScope[]) => void;
  toggleUserMfa: (userId: string) => void;
  deleteEnterpriseUser: (userId: string) => void;
  hasPermission: (permission: PermissionKey, tenantId?: string) => boolean;

  // Double-Entry Engine Functions
  postJournalEntry: (entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'totalDebit' | 'totalCredit' | 'createdAt' | 'postedBy' | 'postedRole' | 'status'>) => { success: boolean; error?: string; entryId?: string };
  reverseJournalEntry: (entryId: string, reason: string) => { success: boolean; error?: string };
  batchUploadTransactions: (parsedRows: ParsedTransactionUpload[]) => { success: boolean; postedCount: number; errors: string[] };
  
  // Sub-ledger Operations (AR / AP)
  createInvoice: (invoiceData: Omit<CustomerInvoice, 'id' | 'invoiceNumber' | 'amountPaid' | 'status'>) => { success: boolean; error?: string };
  receiveInvoicePayment: (invoiceId: string, paymentAmount: number, bankAccountId: string) => { success: boolean; error?: string };
  createVendorBill: (billData: Omit<VendorBill, 'id' | 'billNumber' | 'amountPaid' | 'status'>) => { success: boolean; error?: string };
  payVendorBill: (billId: string, paymentAmount: number, bankAccountId: string) => { success: boolean; error?: string };

  // Advanced Customer AR, Payment Receipts & Opening Balances Engine
  paymentReceipts: CustomerPaymentReceipt[];
  openingBalances: CustomerOpeningBalanceRecord[];
  recordCustomerPaymentReceipt: (params: {
    customerId: string;
    paymentDate: string;
    paymentMethod: PaymentMethodType;
    bankAccountId: string;
    referenceNumber?: string;
    totalAmountReceived: number;
    allocations: { invoiceId: string; invoiceNumber: string; allocatedAmount: number; discountAmount?: number; writeOffAmount?: number }[];
    notes?: string;
  }) => { success: boolean; receipt?: CustomerPaymentReceipt; error?: string };
  voidPaymentReceipt: (receiptId: string, reason?: string) => { success: boolean; error?: string };
  recordOpeningBalanceInvoice: (params: {
    customerId: string;
    fiscalYear: string;
    asOfDate: string;
    originalInvoiceNumber: string;
    originalInvoiceDate: string;
    dueDate: string;
    openingAmount: number;
    balanceType?: 'DR' | 'CR';
    offsetAccountCode?: string;
    notes?: string;
  }) => { success: boolean; invoice?: CustomerInvoice; openingRecord?: CustomerOpeningBalanceRecord; error?: string };
  batchImportOpeningBalances: (records: {
    customerId?: string;
    customerCode?: string;
    customerName?: string;
    fiscalYear?: string;
    asOfDate?: string;
    originalInvoiceNumber?: string;
    originalInvoiceDate?: string;
    dueDate?: string;
    openingAmount: number;
    balanceType?: 'DR' | 'CR';
    creditDebitFlag?: string;
    offsetAccountCode?: string;
    notes?: string;
  }[]) => { success: boolean; count: number; error?: string };
  getCustomerStatementData: (customerId: string, dateRange?: { startDate?: string; endDate?: string }) => CustomerStatementData;

  // Period Lock & Fiscal Year Close
  toggleFiscalPeriodStatus: (periodId: string, newStatus: 'OPEN' | 'LOCKED' | 'CLOSED') => void;
  executeYearEndClose: (fiscalYear: string) => { success: boolean; netIncomeClosed: number; entryId?: string; error?: string };

  // Treasury, FP&A, Approvals & Tax Engine Operations
  executeSweepTransfer: (fromAccId: string, toAccId: string, amount: number) => { success: boolean; error?: string };
  updateDepartmentBudget: (budgetId: string, newAnnualAmount: number) => void;
  processApprovalDecision: (approvalId: string, decision: 'APPROVED' | 'REJECTED') => void;
  postTaxSettlementVoucher: (jurisdictionId: string) => { success: boolean; entryId?: string; error?: string };

  // Bank & Assets
  reconcileBankLine: (statementId: string, accountId: string, matchingEntryId?: string) => { success: boolean; error?: string };
  importBankStatements: (lines: Omit<BankStatementLine, 'id' | 'tenantId' | 'reconciled'>[]) => { success: boolean; count: number; error?: string };
  autoMatchAndReconcile: () => { matchedCount: number; success: boolean };
  createAndReconcileGLLine: (statementId: string, accountCode: string, memo?: string) => { success: boolean; error?: string };
  runDepreciationForTenant: (asOfDate: string) => { success: boolean; totalDepreciation: number; entriesCreated: number };
  
  // Entity Management
  createTenant: (tenantData: Omit<Tenant, 'id' | 'organizations'>) => void;
  createAccount: (accountData: Omit<Account, 'id' | 'tenantId' | 'balance'>) => { success: boolean; error?: string };

  // Financial Reports & Intelligence Calculators
  trialBalance: TrialBalanceRow[];
  balanceSheet: BalanceSheetData;
  incomeStatement: IncomeStatementData;
  statutoryReport: StatutoryReportData;
  cashFlowStatement: CashFlowData;
  financialRatios: FinancialRatiosData;
  consolidatedFinancials: ConsolidatedEntityData;
  
  // Helper to parse CSV/JSON text
  parseCsvOrJsonUpload: (fileContent: string, format: 'csv' | 'json') => ParsedTransactionUpload[];
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [activeTenantId, setActiveTenantIdState] = useState<string>('t-acme-us');
  const [activeOrgId, setActiveOrgId] = useState<string | null>('org-acme-north');
  const [activeBranchId, setActiveBranchId] = useState<string | null>('br-ny-hq');
  
  const [activeRole, setActiveRole] = useState<Role>('accountant');
  const [userEmail, setUserEmail] = useState<string>('sarah.accountant@acme.com');

  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>(INITIAL_ACCOUNTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [bankStatements, setBankStatements] = useState<BankStatementLine[]>(INITIAL_BANK_STATEMENTS);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(INITIAL_FIXED_ASSETS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(INITIAL_AUDIT_LOGS);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>(INITIAL_INVOICES);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>(INITIAL_BILLS);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>(INITIAL_FISCAL_PERIODS);
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccount[]>(INITIAL_TREASURY_ACCOUNTS);
  const [departmentBudgets, setDepartmentBudgets] = useState<DepartmentBudget[]>(INITIAL_DEPARTMENT_BUDGETS);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>(INITIAL_APPROVAL_ITEMS);
  const [taxJurisdictions, setTaxJurisdictions] = useState<TaxJurisdiction[]>(INITIAL_TAX_JURISDICTIONS);
  const [enterpriseUsers, setEnterpriseUsers] = useState<EnterpriseUser[]>(INITIAL_ENTERPRISE_USERS);
  const [customRoles] = useState<CustomRoleDefinition[]>(INITIAL_CUSTOM_ROLES);
  const [customers, setCustomers] = useState<CustomerContact[]>(mockCustomerContacts);
  const [vendors, setVendors] = useState<VendorContact[]>(mockVendorContacts);
  const [customAttributeDefinitions, setCustomAttributeDefinitions] = useState<CustomAttributeDefinition[]>(mockCustomAttributeDefinitions);
  const [productsServices, setProductsServices] = useState<ProductServiceItem[]>(mockProductServices);
  const [priceChangeHistory, setPriceChangeHistory] = useState<PriceChangeHistoryEntry[]>(mockPriceChangeHistory);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>(mockInvoiceTemplates);
  const [bulkInvoiceBatches, setBulkInvoiceBatches] = useState<BulkInvoiceBatchRun[]>(INITIAL_BULK_BATCHES);
  const [paymentReceipts, setPaymentReceipts] = useState<CustomerPaymentReceipt[]>(INITIAL_PAYMENT_RECEIPTS);
  const [openingBalances, setOpeningBalances] = useState<CustomerOpeningBalanceRecord[]>(INITIAL_OPENING_BALANCES);

  // Active Tenant object
  const activeTenant = useMemo(() => {
    return tenants.find((t) => t.id === activeTenantId) || tenants[0];
  }, [tenants, activeTenantId]);

  // Active Plugin based on Tenant
  const activePlugin = activeTenant.pluginId;

  // Active Organization
  const activeOrganization = useMemo(() => {
    if (!activeOrgId) return null;
    return activeTenant.organizations.find((o) => o.id === activeOrgId) || null;
  }, [activeTenant, activeOrgId]);

  // Active Branch
  const activeBranch = useMemo(() => {
    if (!activeBranchId || !activeOrganization) return null;
    return activeOrganization.branches.find((b) => b.id === activeBranchId) || null;
  }, [activeOrganization, activeBranchId]);

  // Change Active Tenant & reset org/branch
  const setActiveTenantId = (tId: string) => {
    const found = tenants.find((t) => t.id === tId);
    if (found) {
      setActiveTenantIdState(tId);
      const firstOrg = found.organizations[0] || null;
      setActiveOrgId(firstOrg ? firstOrg.id : null);
      setActiveBranchId(firstOrg && firstOrg.branches[0] ? firstOrg.branches[0].id : null);

      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: tId,
        userRole: activeRole,
        userEmail,
        details: `Switched request context scope to Tenant: ${found.name} (${found.code})`,
        status: 'SUCCESS',
        payloadSummary: `Header Scope: x-tenant-id=${tId} | Country: ${found.country} | Standard: ${found.pluginId}`,
      });
    }
  };

  // Helper for adding Audit Logs
  const addAuditLog = (event: Omit<AuditLogEvent, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEvent = {
      ...event,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Accounts for active tenant
  const accounts = useMemo(() => {
    return accountsMap[activeTenant.id] || [];
  }, [accountsMap, activeTenant.id]);

  // Scope & Permission Guard
  const checkScopeAndPermission = (targetTenantId: string): { allowed: boolean; error?: string } => {
    // 1. Role Check: Viewer cannot write
    if (activeRole === 'viewer') {
      const msg = 'HTTP 403 FORBIDDEN: Role "viewer" is read-only. Accountant or Admin role required.';
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: targetTenantId,
        userRole: activeRole,
        userEmail,
        details: 'Attempted write operation with unauthorized "viewer" role.',
        status: 'FORBIDDEN',
        payloadSummary: msg,
      });
      return { allowed: false, error: msg };
    }

    // 2. Tenant Context Scope Guard
    if (targetTenantId !== activeTenant.id) {
      const msg = `HTTP 403 SCOPE MISMATCH: Incoming transaction tenant (${targetTenantId}) does not match current request header x-tenant-id (${activeTenant.id}).`;
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: targetTenantId,
        userRole: activeRole,
        userEmail,
        details: 'Tenant scope validation failed.',
        status: 'FORBIDDEN',
        payloadSummary: msg,
      });
      return { allowed: false, error: msg };
    }

    return { allowed: true };
  };

  // Post Single Journal Entry with Double-Entry Guard
  const postJournalEntry = (
    entryData: Omit<JournalEntry, 'id' | 'entryNumber' | 'totalDebit' | 'totalCredit' | 'createdAt' | 'postedBy' | 'postedRole' | 'status'>
  ) => {
    const guard = checkScopeAndPermission(entryData.tenantId);
    if (!guard.allowed) {
      return { success: false, error: guard.error };
    }

    // Fiscal Period Lock Guard
    const entryDate = entryData.date;
    const lockedPeriod = fiscalPeriods.find(
      (p) => p.tenantId === entryData.tenantId && p.status !== 'OPEN' && entryDate >= p.startDate && entryDate <= p.endDate
    );
    if (lockedPeriod) {
      const lockErr = `HTTP 423 PERIOD LOCKED: Fiscal Period "${lockedPeriod.periodName}" is currently ${lockedPeriod.status}. Journal postings on ${entryDate} are blocked.`;
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: entryData.tenantId,
        userRole: activeRole,
        userEmail,
        details: `Blocked entry posting on ${entryDate} due to ${lockedPeriod.status} fiscal period.`,
        status: 'FORBIDDEN',
        payloadSummary: lockErr,
      });
      return { success: false, error: lockErr };
    }

    // Double-Entry Validation
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of entryData.lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(roundedDebit - roundedCredit) > 0.01) {
      const err = `DOUBLE-ENTRY VALIDATION FAILED: Sum of Debits (${roundedDebit} ${activeTenant.currency}) does not equal Sum of Credits (${roundedCredit} ${activeTenant.currency}). Imbalance: ${Math.abs(roundedDebit - roundedCredit).toFixed(2)}`;
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: entryData.tenantId,
        userRole: activeRole,
        userEmail,
        details: `Rejected unbalanced journal entry: ${entryData.description}`,
        status: 'FAILED',
        payloadSummary: err,
      });
      return { success: false, error: err };
    }

    const entryId = `je-${Date.now()}`;
    const entryNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`;

    const newEntry: JournalEntry = {
      ...entryData,
      id: entryId,
      entryNumber,
      totalDebit: roundedDebit,
      totalCredit: roundedCredit,
      postedBy: userEmail,
      postedRole: activeRole,
      status: 'POSTED',
      createdAt: new Date().toISOString(),
    };

    // Update Accounts Balances with SELECT FOR UPDATE simulation
    setAccountsMap((prev) => {
      const currentList = [...(prev[entryData.tenantId] || [])];
      entryData.lines.forEach((line) => {
        const accIndex = currentList.findIndex((a) => a.id === line.accountId || a.code === line.accountCode);
        if (accIndex !== -1) {
          const acc = currentList[accIndex];
          // Normal Balances: ASSET / EXPENSE = Debit (+), Credit (-)
          // LIABILITY / EQUITY / REVENUE = Credit (+), Debit (-)
          let change = 0;
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            change = line.debit - line.credit;
          } else {
            change = line.credit - line.debit;
          }
          currentList[accIndex] = {
            ...acc,
            balance: Math.round((acc.balance + change) * 100) / 100,
          };
        }
      });
      return { ...prev, [entryData.tenantId]: currentList };
    });

    setJournalEntries((prev) => [newEntry, ...prev]);

    addAuditLog({
      action: 'POST_JOURNAL',
      tenantId: entryData.tenantId,
      organizationId: entryData.organizationId,
      branchId: entryData.branchId,
      userRole: activeRole,
      userEmail,
      details: `Successfully posted ${entryNumber}: "${entryData.description}" (${roundedDebit} ${activeTenant.currency})`,
      status: 'SUCCESS',
      payloadSummary: `SELECT FOR UPDATE executed | Plugin: ${entryData.pluginId} | ${entryData.lines.length} lines posted`,
    });

    return { success: true, entryId };
  };

  // Reverse Entry (Immutable Audit Trail)
  const reverseJournalEntry = (entryId: string, reason: string) => {
    const target = journalEntries.find((je) => je.id === entryId);
    if (!target) return { success: false, error: 'Journal entry not found.' };

    const guard = checkScopeAndPermission(target.tenantId);
    if (!guard.allowed) return { success: false, error: guard.error };

    if (target.status === 'REVERSED') {
      return { success: false, error: 'This journal entry has already been reversed.' };
    }

    // Create reversing lines by swapping debit and credit
    const reversalLines: JournalLine[] = target.lines.map((line) => ({
      ...line,
      id: `jl-rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      debit: line.credit,
      credit: line.debit,
      memo: `Reversal of ${target.entryNumber}: ${reason}`,
    }));

    const result = postJournalEntry({
      tenantId: target.tenantId,
      organizationId: target.organizationId,
      branchId: target.branchId,
      date: new Date().toISOString().split('T')[0],
      description: `REVERSAL of ${target.entryNumber} - ${reason}`,
      reference: `REV-${target.entryNumber}`,
      pluginId: target.pluginId,
      lines: reversalLines,
      reversalOfId: target.id,
    });

    if (result.success) {
      setJournalEntries((prev) =>
        prev.map((je) => (je.id === entryId ? { ...je, status: 'REVERSED' } : je))
      );
      addAuditLog({
        action: 'REVERSE_JOURNAL',
        tenantId: target.tenantId,
        userRole: activeRole,
        userEmail,
        details: `Reversed Journal Entry ${target.entryNumber}. Reason: ${reason}`,
        status: 'SUCCESS',
        payloadSummary: `Created Reversal Entry ID: ${result.entryId}`,
      });
    }

    return result;
  };

  // Parse CSV/JSON Upload text
  const parseCsvOrJsonUpload = (fileContent: string, format: 'csv' | 'json'): ParsedTransactionUpload[] => {
    const currentAccs = accountsMap[activeTenant.id] || [];
    const accCodes = new Set(currentAccs.map((a) => a.code));

    if (format === 'json') {
      try {
        const parsed = JSON.parse(fileContent);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((row: any, idx: number) => {
          const errors: string[] = [];
          if (!row.date) errors.push('Missing date');
          if (!row.accountCodeDebit) errors.push('Missing Debit Account Code');
          else if (!accCodes.has(String(row.accountCodeDebit))) errors.push(`Debit account code "${row.accountCodeDebit}" not in Chart of Accounts`);
          
          if (!row.accountCodeCredit) errors.push('Missing Credit Account Code');
          else if (!accCodes.has(String(row.accountCodeCredit))) errors.push(`Credit account code "${row.accountCodeCredit}" not in Chart of Accounts`);
          
          if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) errors.push('Amount must be a positive number');

          return {
            rowNumber: idx + 1,
            date: row.date || new Date().toISOString().split('T')[0],
            description: row.description || `Uploaded transaction #${idx + 1}`,
            accountCodeDebit: String(row.accountCodeDebit || ''),
            accountCodeCredit: String(row.accountCodeCredit || ''),
            amount: Number(row.amount) || 0,
            reference: row.reference || `CSV-BATCH-${idx + 1}`,
            tenantId: row.tenantId || activeTenant.id,
            isValid: errors.length === 0,
            errors,
          };
        });
      } catch (err) {
        return [];
      }
    } else {
      // CSV format: Date, Description, DebitAccount, CreditAccount, Amount, Reference
      const lines = fileContent.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) return [];

      const rows: ParsedTransactionUpload[] = [];
      const headerLine = lines[0].toLowerCase();
      const startIndex = headerLine.includes('date') || headerLine.includes('amount') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 5) continue;

        const date = cols[0] || new Date().toISOString().split('T')[0];
        const description = cols[1] || `Batch upload row #${i}`;
        const accountCodeDebit = cols[2] || '';
        const accountCodeCredit = cols[3] || '';
        const amount = parseFloat(cols[4]) || 0;
        const reference = cols[5] || `CSV-BATCH-${i}`;

        const errors: string[] = [];
        if (!date) errors.push('Invalid Date');
        if (!accountCodeDebit || !accCodes.has(accountCodeDebit)) {
          errors.push(`Debit Code "${accountCodeDebit}" invalid for ${activeTenant.name}`);
        }
        if (!accountCodeCredit || !accCodes.has(accountCodeCredit)) {
          errors.push(`Credit Code "${accountCodeCredit}" invalid for ${activeTenant.name}`);
        }
        if (amount <= 0) errors.push('Amount must be > 0');

        rows.push({
          rowNumber: i,
          date,
          description,
          accountCodeDebit,
          accountCodeCredit,
          amount,
          reference,
          tenantId: activeTenant.id,
          isValid: errors.length === 0,
          errors,
        });
      }
      return rows;
    }
  };

  // Batch Upload Executer
  const batchUploadTransactions = (parsedRows: ParsedTransactionUpload[]) => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      return { success: false, postedCount: 0, errors: ['No valid rows found to post.'] };
    }

    const currentAccs = accountsMap[activeTenant.id] || [];
    let postedCount = 0;
    const errors: string[] = [];

    validRows.forEach((row) => {
      const debitAcc = currentAccs.find((a) => a.code === row.accountCodeDebit);
      const creditAcc = currentAccs.find((a) => a.code === row.accountCodeCredit);

      if (!debitAcc || !creditAcc) {
        errors.push(`Row ${row.rowNumber}: Account lookup failed.`);
        return;
      }

      const res = postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization ? activeOrganization.id : undefined,
        branchId: activeBranch ? activeBranch.id : undefined,
        date: row.date,
        description: row.description,
        reference: row.reference,
        pluginId: activePlugin,
        lines: [
          {
            id: `jl-b-d-${Math.random()}`,
            accountId: debitAcc.id,
            accountCode: debitAcc.code,
            accountName: debitAcc.name,
            debit: row.amount,
            credit: 0,
            memo: row.description,
          },
          {
            id: `jl-b-c-${Math.random()}`,
            accountId: creditAcc.id,
            accountCode: creditAcc.code,
            accountName: creditAcc.name,
            debit: 0,
            credit: row.amount,
            memo: row.description,
          },
        ],
      });

      if (res.success) postedCount++;
      else if (res.error) errors.push(`Row ${row.rowNumber}: ${res.error}`);
    });

    addAuditLog({
      action: 'IMPORT_TRANSACTIONS',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Batch transaction upload executed. Successfully posted ${postedCount}/${validRows.length} transactions.`,
      status: postedCount > 0 ? 'SUCCESS' : 'FAILED',
      payloadSummary: `Total Rows: ${parsedRows.length} | Valid: ${validRows.length} | Posted: ${postedCount}`,
    });

    return { success: postedCount > 0, postedCount, errors };
  };

  // Reconcile Bank Line
  const reconcileBankLine = (statementId: string, accountId: string, matchingEntryId?: string) => {
    setBankStatements((prev) =>
      prev.map((line) =>
        line.id === statementId
          ? { ...line, reconciled: true, matchedJournalEntryId: matchingEntryId }
          : line
      )
    );
    addAuditLog({
      action: 'RECONCILE_BANK',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Reconciled Bank Statement Line ${statementId} with General Ledger`,
      status: 'SUCCESS',
      payloadSummary: `Account ID: ${accountId} | Matched JE: ${matchingEntryId || 'Manual Approval'}`,
    });
    return { success: true };
  };

  // Import Bank Statements
  const importBankStatements = (
    lines: Omit<BankStatementLine, 'id' | 'tenantId' | 'reconciled'>[]
  ) => {
    if (lines.length === 0) return { success: false, count: 0, error: 'No statement lines provided.' };

    const newLines: BankStatementLine[] = lines.map((l, idx) => ({
      ...l,
      id: `bs-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      tenantId: activeTenant.id,
      reconciled: false,
    }));

    setBankStatements((prev) => [...newLines, ...prev]);

    addAuditLog({
      action: 'IMPORT_TRANSACTIONS',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Imported ${newLines.length} bank statement feed lines into ${activeTenant.name}`,
      status: 'SUCCESS',
      payloadSummary: `Feed Lines Count: ${newLines.length}`,
    });

    return { success: true, count: newLines.length };
  };

  // Auto-Match & Reconcile Engine
  const autoMatchAndReconcile = () => {
    const activeStatements = bankStatements.filter(
      (b) => b.tenantId === activeTenant.id && !b.reconciled
    );
    const activeJEs = journalEntries.filter(
      (je) => je.tenantId === activeTenant.id && je.status === 'POSTED'
    );

    let matchedCount = 0;
    const updatedStatementIds = new Map<string, string>(); // statementId -> matchedJEId

    activeStatements.forEach((stmt) => {
      // Find matching JE
      const matchedJE = activeJEs.find((je) => {
        if (Array.from(updatedStatementIds.values()).includes(je.id)) return false;

        // Check lines for amount match
        return je.lines.some((l) => {
          if (stmt.amount > 0) {
            // Deposit -> Debit to Cash (or Revenue)
            return Math.abs((l.debit || 0) - stmt.amount) < 0.01;
          } else {
            // Withdrawal -> Credit to Cash
            return Math.abs((l.credit || 0) - Math.abs(stmt.amount)) < 0.01;
          }
        });
      });

      if (matchedJE) {
        updatedStatementIds.set(stmt.id, matchedJE.id);
        matchedCount++;
      }
    });

    if (matchedCount > 0) {
      setBankStatements((prev) =>
        prev.map((b) => {
          if (updatedStatementIds.has(b.id)) {
            return {
              ...b,
              reconciled: true,
              matchedJournalEntryId: updatedStatementIds.get(b.id),
            };
          }
          return b;
        })
      );

      addAuditLog({
        action: 'RECONCILE_BANK',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Smart AI Auto-Match Engine reconciled ${matchedCount} bank statement lines automatically.`,
        status: 'SUCCESS',
        payloadSummary: `Automated Matches: ${matchedCount}`,
      });
    }

    return { success: true, matchedCount };
  };

  // Create GL Journal Entry and Reconcile Bank Line on the fly
  const createAndReconcileGLLine = (
    statementId: string,
    accountCode: string,
    memo?: string
  ) => {
    const stmt = bankStatements.find((b) => b.id === statementId);
    if (!stmt) return { success: false, error: 'Bank statement line not found.' };

    const currentAccs = accountsMap[activeTenant.id] || [];
    const cashAcc = currentAccs.find((a) => a.code === '1010') || currentAccs[0];
    const targetAcc = currentAccs.find((a) => a.code === accountCode);

    if (!targetAcc) {
      return { success: false, error: `Account code "${accountCode}" not found in Chart of Accounts.` };
    }

    const absAmount = Math.abs(stmt.amount);
    const description = memo || stmt.description;

    let lines = [];
    if (stmt.amount < 0) {
      // Outflow / Expense
      lines = [
        { id: `jl-c1-${Date.now()}`, accountId: targetAcc.id, accountCode: targetAcc.code, accountName: targetAcc.name, debit: absAmount, credit: 0, memo: description },
        { id: `jl-c2-${Date.now()}`, accountId: cashAcc.id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: 0, credit: absAmount, memo: description },
      ];
    } else {
      // Inflow / Income
      lines = [
        { id: `jl-c1-${Date.now()}`, accountId: cashAcc.id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: absAmount, credit: 0, memo: description },
        { id: `jl-c2-${Date.now()}`, accountId: targetAcc.id, accountCode: targetAcc.code, accountName: targetAcc.name, debit: 0, credit: absAmount, memo: description },
      ];
    }

    const res = postJournalEntry({
      tenantId: activeTenant.id,
      organizationId: activeOrganization ? activeOrganization.id : undefined,
      branchId: activeBranch ? activeBranch.id : undefined,
      date: stmt.date,
      description: `Bank Reconciliation Quick Post: ${description}`,
      reference: stmt.reference || `BANK-REC-${Date.now().toString().slice(-6)}`,
      pluginId: activePlugin,
      lines,
    });

    if (res.success && res.entryId) {
      reconcileBankLine(statementId, cashAcc.id, res.entryId);
      return { success: true };
    }

    return { success: false, error: res.error || 'Failed to create GL journal entry.' };
  };

  // Fixed Asset Depreciation Run
  const runDepreciationForTenant = (asOfDate: string) => {
    const tenantAssets = fixedAssets.filter((fa) => fa.tenantId === activeTenant.id);
    if (tenantAssets.length === 0) {
      return { success: false, totalDepreciation: 0, entriesCreated: 0 };
    }

    let totalDep = 0;
    let entriesCreated = 0;

    const currentAccs = accountsMap[activeTenant.id] || [];
    const depExpenseAcc = currentAccs.find((a) => a.code === '5030') || currentAccs.find((a) => a.type === 'EXPENSE');
    const accumDepAcc = currentAccs.find((a) => a.code === '1510') || currentAccs.find((a) => a.type === 'ASSET' && a.name.includes('Accumulated'));

    tenantAssets.forEach((asset) => {
      const monthlyDep = Math.round(((asset.cost - asset.salvageValue) / (asset.usefulLifeYears * 12)) * 100) / 100;
      totalDep += monthlyDep;

      if (depExpenseAcc && accumDepAcc) {
        postJournalEntry({
          tenantId: activeTenant.id,
          organizationId: activeOrganization?.id,
          branchId: activeBranch?.id,
          date: asOfDate,
          description: `Monthly Depreciation Run for Asset ${asset.assetNumber} (${asset.name})`,
          reference: `DEP-${asset.assetNumber}`,
          pluginId: activePlugin,
          lines: [
            { id: `jl-dep-1-${asset.id}`, accountId: depExpenseAcc.id, accountCode: depExpenseAcc.code, accountName: depExpenseAcc.name, debit: monthlyDep, credit: 0 },
            { id: `jl-dep-2-${asset.id}`, accountId: accumDepAcc.id, accountCode: accumDepAcc.code, accountName: accumDepAcc.name, debit: 0, credit: monthlyDep },
          ],
        });
        entriesCreated++;
      }
    });

    setFixedAssets((prev) =>
      prev.map((fa) => {
        if (fa.tenantId === activeTenant.id) {
          const monthlyDep = Math.round(((fa.cost - fa.salvageValue) / (fa.usefulLifeYears * 12)) * 100) / 100;
          return {
            ...fa,
            accumulatedDepreciation: fa.accumulatedDepreciation + monthlyDep,
            netBookValue: fa.netBookValue - monthlyDep,
            lastDepreciationDate: asOfDate,
          };
        }
        return fa;
      })
    );

    addAuditLog({
      action: 'RUN_DEPRECIATION',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Executed monthly depreciation run for ${tenantAssets.length} fixed assets. Total depreciated: ${totalDep} ${activeTenant.currency}`,
      status: 'SUCCESS',
      payloadSummary: `Journal Entries Created: ${entriesCreated} | Asset Net Book Values Updated`,
    });

    return { success: true, totalDepreciation: totalDep, entriesCreated };
  };

  // Create New Account
  const createAccount = (accountData: Omit<Account, 'id' | 'tenantId' | 'balance'>) => {
    const current = accountsMap[activeTenant.id] || [];
    if (current.some((a) => a.code === accountData.code)) {
      return { success: false, error: `Account code "${accountData.code}" already exists in ${activeTenant.name}` };
    }

    const newAcc: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
      tenantId: activeTenant.id,
      balance: 0,
    };

    setAccountsMap((prev) => ({
      ...prev,
      [activeTenant.id]: [...(prev[activeTenant.id] || []), newAcc],
    }));

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created new Chart of Account ${newAcc.code} - ${newAcc.name} (${newAcc.type})`,
      status: 'SUCCESS',
      payloadSummary: `Currency: ${newAcc.currency} | Initial Balance: 0.00`,
    });

    return { success: true };
  };

  // Create New Tenant
  const createTenant = (tenantData: Omit<Tenant, 'id' | 'organizations'>) => {
    const tId = `t-${Date.now()}`;
    const orgId = `org-${Date.now()}`;
    const branchId = `br-${Date.now()}`;

    const newTenant: Tenant = {
      ...tenantData,
      id: tId,
      organizations: [
        {
          id: orgId,
          tenantId: tId,
          name: `${tenantData.name} Main HQ`,
          code: `${tenantData.code}-HQ`,
          branches: [
            { id: branchId, organizationId: orgId, tenantId: tId, name: 'Primary Branch', code: 'BR-01' },
          ],
        },
      ],
    };

    setTenants((prev) => [...prev, newTenant]);

    // Initialize Default Standard Chart of Accounts
    const defaultAccounts: Account[] = [
      { id: `acc-${tId}-1`, tenantId: tId, code: '1010', name: 'Primary Operating Bank Account', type: 'ASSET', currency: tenantData.currency, balance: 100000 },
      { id: `acc-${tId}-2`, tenantId: tId, code: '1100', name: 'Trade Accounts Receivable', type: 'ASSET', currency: tenantData.currency, balance: 25000 },
      { id: `acc-${tId}-3`, tenantId: tId, code: '2010', name: 'Trade Accounts Payable', type: 'LIABILITY', currency: tenantData.currency, balance: 15000 },
      { id: `acc-${tId}-4`, tenantId: tId, code: '2200', name: 'Local Statutory Tax Payable', type: 'LIABILITY', currency: tenantData.currency, balance: 2500 },
      { id: `acc-${tId}-5`, tenantId: tId, code: '3010', name: 'Contributed Share Capital', type: 'EQUITY', currency: tenantData.currency, balance: 100000 },
      { id: `acc-${tId}-6`, tenantId: tId, code: '4010', name: 'Core Commercial Sales Revenue', type: 'REVENUE', currency: tenantData.currency, balance: 35000 },
      { id: `acc-${tId}-7`, tenantId: tId, code: '5010', name: 'Operating & Admin Expenses', type: 'EXPENSE', currency: tenantData.currency, balance: 22500 },
    ];

    setAccountsMap((prev) => ({ ...prev, [tId]: defaultAccounts }));
    setActiveTenantId(tId);
  };

  // Execute Sweep Transfer between Treasury Accounts
  const executeSweepTransfer = (fromAccId: string, toAccId: string, amount: number) => {
    if (amount <= 0) return { success: false, error: 'Sweep amount must be greater than zero.' };
    const fromAcc = treasuryAccounts.find((a) => a.id === fromAccId);
    const toAcc = treasuryAccounts.find((a) => a.id === toAccId);
    if (!fromAcc || !toAcc) return { success: false, error: 'Treasury account not found.' };
    if (fromAcc.balance < amount) return { success: false, error: 'Insufficient liquid funds in source treasury vault.' };

    setTreasuryAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccId) return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );

    // Auto-post GL journal entry for sweep liquidity transfer
    postJournalEntry({
      tenantId: activeTenantId,
      organizationId: activeOrgId || undefined,
      branchId: activeBranchId || undefined,
      date: new Date().toISOString().split('T')[0],
      description: `Liquidity Sweep Transfer: ${fromAcc.name} to ${toAcc.name}`,
      reference: `SWEEP-${Date.now().toString().slice(-6)}`,
      pluginId: activePlugin,
      lines: [
        { id: 'sw-1', accountId: 'acc-1001', accountCode: '1010', accountName: `Operating Cash - ${toAcc.name}`, debit: amount, credit: 0, memo: 'Destination Treasury Credit' },
        { id: 'sw-2', accountId: 'acc-1001', accountCode: '1010', accountName: `Operating Cash - ${fromAcc.name}`, debit: 0, credit: amount, memo: 'Source Treasury Debit' },
      ],
    });

    return { success: true };
  };

  // FP&A Budget Updater
  const updateDepartmentBudget = (budgetId: string, newAnnualAmount: number) => {
    setDepartmentBudgets((prev) =>
      prev.map((b) => {
        if (b.id === budgetId) {
          const variance = newAnnualAmount - b.ytdActual;
          const variancePct = Math.round((variance / newAnnualAmount) * 1000) / 10;
          let status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED' = 'ON_TRACK';
          if (variancePct < 0) status = 'EXCEEDED';
          else if (variancePct < 25) status = 'WARNING';
          return {
            ...b,
            annualBudget: newAnnualAmount,
            variance,
            variancePercentage: variancePct,
            status,
          };
        }
        return b;
      })
    );
  };

  // Governance Approval Decision Processor
  const processApprovalDecision = (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setApprovalItems((prev) =>
      prev.map((item) => (item.id === approvalId ? { ...item, status: decision } : item))
    );

    const targetItem = approvalItems.find((i) => i.id === approvalId);
    if (targetItem) {
      setAuditLogs((prev) => [
        {
          id: `log-app-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorEmail: userEmail,
          actorRole: activeRole,
          actionType: decision === 'APPROVED' ? 'POST_ENTRY' : 'REVERSE_ENTRY',
          resourceType: targetItem.entityType,
          resourceId: targetItem.referenceNumber,
          changesDescription: `Governance Approval decision ${decision} for ${targetItem.description} ($${targetItem.amount.toLocaleString()})`,
          hash: `hash-app-${Math.random().toString(36).substring(2, 9)}`,
          tenantId: activeTenantId,
        },
        ...prev,
      ]);
    }
  };

  // Post Tax Settlement Voucher
  const postTaxSettlementVoucher = (jurisdictionId: string) => {
    const jur = taxJurisdictions.find((j) => j.id === jurisdictionId);
    if (!jur || jur.ytdAccruedTax <= 0) {
      return { success: false, error: 'No accrued tax liability available for settlement.' };
    }

    const res = postJournalEntry({
      tenantId: activeTenantId,
      organizationId: activeOrgId || undefined,
      branchId: activeBranchId || undefined,
      date: new Date().toISOString().split('T')[0],
      description: `Tax Settlement Voucher Payment: ${jur.name} (${jur.code})`,
      reference: `TAX-PAY-${jur.code}`,
      pluginId: activePlugin,
      lines: [
        { id: 'tx-v1', accountId: 'acc-2002', accountCode: '2200', accountName: 'Tax Payable', debit: jur.ytdAccruedTax, credit: 0, memo: 'Clear Accrued Tax Liability' },
        { id: 'tx-v2', accountId: 'acc-1001', accountCode: '1010', accountName: 'Operating Cash - Chase Bank', debit: 0, credit: jur.ytdAccruedTax, memo: 'Tax Authority Disbursement' },
      ],
    });

    if (res.success) {
      setTaxJurisdictions((prev) =>
        prev.map((j) => (j.id === jurisdictionId ? { ...j, ytdAccruedTax: 0 } : j))
      );
    }

    return res;
  };

  // Trial Balance Generator

  const trialBalance: TrialBalanceRow[] = useMemo(() => {
    const current = accountsMap[activeTenant.id] || [];
    return current.map((acc) => {
      let debit = 0;
      let credit = 0;
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        if (acc.balance >= 0) debit = acc.balance;
        else credit = Math.abs(acc.balance);
      } else {
        if (acc.balance >= 0) credit = acc.balance;
        else debit = Math.abs(acc.balance);
      }

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        type: acc.type,
        debit,
        credit,
        netBalance: acc.balance,
      };
    });
  }, [accountsMap, activeTenant.id]);

  // Balance Sheet Data Generator
  const balanceSheet: BalanceSheetData = useMemo(() => {
    const assets = trialBalance.filter((r) => r.type === 'ASSET');
    const liabilities = trialBalance.filter((r) => r.type === 'LIABILITY');
    const equity = trialBalance.filter((r) => r.type === 'EQUITY');

    const totalAssets = assets.reduce((sum, a) => sum + (a.debit - a.credit), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.credit - l.debit), 0);
    const rawEquity = equity.reduce((sum, e) => sum + (e.credit - e.debit), 0);

    const revenues = trialBalance.filter((r) => r.type === 'REVENUE');
    const expenses = trialBalance.filter((r) => r.type === 'EXPENSE');
    const totalRev = revenues.reduce((sum, r) => sum + (r.credit - r.debit), 0);
    const totalExp = expenses.reduce((sum, ex) => sum + (ex.debit - ex.credit), 0);
    const retainedEarnings = totalRev - totalExp;

    const totalEquity = rawEquity + retainedEarnings;
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      assets,
      liabilities,
      equity,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      retainedEarnings: Math.round(retainedEarnings * 100) / 100,
      isBalanced,
    };
  }, [trialBalance]);

  // Income Statement Generator
  const incomeStatement: IncomeStatementData = useMemo(() => {
    const revenues = trialBalance.filter((r) => r.type === 'REVENUE');
    const expenses = trialBalance.filter((r) => r.type === 'EXPENSE');

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.credit - r.debit), 0);
    const totalExpense = expenses.reduce((sum, ex) => sum + (ex.debit - ex.credit), 0);
    const netIncome = totalRevenue - totalExpense;
    const grossMarginPercentage = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    return {
      revenues,
      expenses,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      grossMarginPercentage: Math.round(grossMarginPercentage * 10) / 10,
    };
  }, [trialBalance]);

  // Statutory Regulatory Report Generator
  const statutoryReport: StatutoryReportData = useMemo(() => {
    const pluginId = activeTenant.pluginId;

    if (pluginId === 'in_gst') {
      const cgstAcc = accounts.find((a) => a.code === '2201')?.balance || 0;
      const sgstAcc = accounts.find((a) => a.code === '2202')?.balance || 0;
      const igstAcc = accounts.find((a) => a.code === '2203')?.balance || 0;
      const itcAcc = accounts.find((a) => a.code === '1301')?.balance || 0;

      const totalTaxLiability = cgstAcc + sgstAcc + igstAcc;

      return {
        pluginId: 'in_gst',
        title: 'GSTR-1 Monthly Tax Return & Tax Ledger Breakdown',
        standardName: 'India Goods and Services Tax (GST Act 2017)',
        period: 'August 2026 Monthly Filing',
        tenantName: activeTenant.name,
        taxIdentifier: 'GSTIN: 29AABCB1234H1Z5',
        taxBreakdown: [
          { name: 'Central GST (CGST @ 9%)', taxableAmount: cgstAcc / 0.09, taxCollected: cgstAcc, taxPaidCredit: itcAcc * 0.5, netLiability: cgstAcc - itcAcc * 0.5 },
          { name: 'State GST (SGST @ 9%)', taxableAmount: sgstAcc / 0.09, taxCollected: sgstAcc, taxPaidCredit: itcAcc * 0.5, netLiability: sgstAcc - itcAcc * 0.5 },
          { name: 'Integrated GST (IGST @ 18%)', taxableAmount: igstAcc / 0.18, taxCollected: igstAcc, taxPaidCredit: 0, netLiability: igstAcc },
        ],
        summaryNotes: [
          'All intra-state supplies matched against HSN/SAC codes.',
          `Total Gross Output GST Collected: ₹${totalTaxLiability.toLocaleString('en-IN')}`,
          `Input Tax Credit (ITC) Available: ₹${itcAcc.toLocaleString('en-IN')}`,
          `Net Tax Payable to Government Treasury: ₹${Math.max(0, totalTaxLiability - itcAcc).toLocaleString('en-IN')}`,
        ],
        isCompliant: true,
      };
    } else if (pluginId === 'eu_ifrs') {
      const vatAcc = accounts.find((a) => a.code === '2100')?.balance || 0;
      const reverseChargeAcc = accounts.find((a) => a.code === '2110')?.balance || 0;

      return {
        pluginId: 'eu_ifrs',
        title: 'IAS-1 Financial Statement & EU VAT Return Schedule',
        standardName: 'EU IFRS Compliance & Cross-Border VAT Directive 2006/112/EC',
        period: 'Q3 2026 Quarterly Return',
        tenantName: activeTenant.name,
        taxIdentifier: 'VAT ID: NL882910291B01',
        taxBreakdown: [
          { name: 'Standard EU VAT (21% Rate)', taxableAmount: vatAcc / 0.21, taxCollected: vatAcc, taxPaidCredit: reverseChargeAcc, netLiability: vatAcc - reverseChargeAcc },
          { name: 'Reverse Charge Intra-Community B2B', taxableAmount: reverseChargeAcc / 0.21, taxCollected: 0, taxPaidCredit: reverseChargeAcc, netLiability: 0 },
        ],
        summaryNotes: [
          'Prepared under IAS-1 Presentation of Financial Statements.',
          'Cross-border B2B digital services correctly categorized under Reverse Charge Mechanism.',
          `Total Payable to Tax Authority: €${Math.max(0, vatAcc - reverseChargeAcc).toLocaleString()}`,
        ],
        isCompliant: true,
      };
    } else {
      // US GAAP
      const salesTaxAcc = accounts.find((a) => a.code === '2200')?.balance || 0;
      return {
        pluginId: 'us_gaap',
        title: 'SEC Form 10-K & State Sales Tax Return Schedule',
        standardName: 'US GAAP (FASB ASC 606 Revenue Recognition)',
        period: 'Q3 2026 Fiscal Quarter',
        tenantName: activeTenant.name,
        taxIdentifier: 'EIN: 12-3456789',
        taxBreakdown: [
          { name: 'New York State Sales Tax (8.875%)', taxableAmount: salesTaxAcc / 0.08875, taxCollected: salesTaxAcc, taxPaidCredit: 0, netLiability: salesTaxAcc },
        ],
        summaryNotes: [
          'Full compliance with FASB ASC 606 revenue performance obligations.',
          `State Sales Tax collected and accrued: $${salesTaxAcc.toLocaleString()}`,
          'Depreciation calculated under Straight-Line method (ASC 360).',
        ],
        isCompliant: true,
      };
    }
  }, [activeTenant, accounts]);

  // Sub-ledger: Customer Invoices (AR)
  const createInvoice = (invoiceData: Omit<CustomerInvoice, 'id' | 'invoiceNumber' | 'amountPaid' | 'status'>) => {
    const invId = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInv: CustomerInvoice = {
      ...invoiceData,
      id: invId,
      invoiceNumber,
      amountPaid: 0,
      status: 'UNPAID',
    };
    setInvoices((prev) => [newInv, ...prev]);

    const currentAccs = accountsMap[activeTenant.id] || [];
    const arAcc = currentAccs.find((a) => a.code === '1100') || currentAccs.find((a) => a.type === 'ASSET');
    const revAcc = currentAccs.find((a) => a.code === invoiceData.revenueAccountCode) || currentAccs.find((a) => a.type === 'REVENUE');
    const taxAcc = currentAccs.find((a) => a.code === '2200') || currentAccs.find((a) => a.code === '2100') || currentAccs.find((a) => a.code === '2201');

    if (arAcc && revAcc) {
      const lines: JournalLine[] = [
        { id: `jl-inv-ar-${Date.now()}`, accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: invoiceData.totalAmount, credit: 0, memo: `Invoice ${invoiceNumber}` },
      ];

      if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach((item, idx) => {
          lines.push({
            id: `jl-inv-rev-${Date.now()}-${idx}`,
            accountId: revAcc.id,
            accountCode: revAcc.code,
            accountName: revAcc.name,
            debit: 0,
            credit: item.amount,
            memo: item.description || `Sales Revenue Line ${idx + 1}`,
          });
        });
      } else {
        lines.push({ id: `jl-inv-rev-${Date.now()}`, accountId: revAcc.id, accountCode: revAcc.code, accountName: revAcc.name, debit: 0, credit: invoiceData.subtotal, memo: `Sales Revenue` });
      }

      if (invoiceData.taxTotal > 0 && taxAcc) {
        lines.push({ id: `jl-inv-tax-${Date.now()}`, accountId: taxAcc.id, accountCode: taxAcc.code, accountName: taxAcc.name, debit: 0, credit: invoiceData.taxTotal, memo: `Sales Tax Output` });
      }

      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: invoiceData.issueDate,
        description: `Customer Invoice #${invoiceNumber} issued to ${invoiceData.customerName}`,
        reference: invoiceNumber,
        pluginId: activePlugin,
        lines,
      });
    }

    addAuditLog({
      action: 'INVOICE_CREATE',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created Customer Invoice #${invoiceNumber} for ${invoiceData.customerName} (${invoiceData.totalAmount} ${activeTenant.currency})`,
      status: 'SUCCESS',
      payloadSummary: `Due Date: ${invoiceData.dueDate} | Revenue Acc: ${invoiceData.revenueAccountCode}`,
    });

    return { success: true };
  };

  const receiveInvoicePayment = (invoiceId: string, paymentAmount: number, bankAccountId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found.' };

    const newAmountPaid = inv.amountPaid + paymentAmount;
    const newStatus = newAmountPaid >= inv.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, amountPaid: newAmountPaid, status: newStatus } : i))
    );

    const currentAccs = accountsMap[activeTenant.id] || [];
    const bankAcc = currentAccs.find((a) => a.id === bankAccountId || a.code === '1010');
    const arAcc = currentAccs.find((a) => a.code === '1100');

    if (bankAcc && arAcc) {
      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: new Date().toISOString().split('T')[0],
        description: `Payment Receipt for Invoice #${inv.invoiceNumber} from ${inv.customerName}`,
        reference: `PMT-${inv.invoiceNumber}`,
        pluginId: activePlugin,
        lines: [
          { id: `jl-pmt-b-${Date.now()}`, accountId: bankAcc.id, accountCode: bankAcc.code, accountName: bankAcc.name, debit: paymentAmount, credit: 0, memo: 'Cash Receipt' },
          { id: `jl-pmt-ar-${Date.now()}`, accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: 0, credit: paymentAmount, memo: 'Clear AR' },
        ],
      });
    }

    addAuditLog({
      action: 'INVOICE_PAYMENT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Received payment of ${paymentAmount} ${activeTenant.currency} for Invoice #${inv.invoiceNumber}`,
      status: 'SUCCESS',
      payloadSummary: `New Status: ${newStatus} | Remaining Balance: ${inv.totalAmount - newAmountPaid}`,
    });

    return { success: true };
  };

  // Sub-ledger: Vendor Bills (AP)
  const createVendorBill = (billData: Omit<VendorBill, 'id' | 'billNumber' | 'amountPaid' | 'status'>) => {
    const billId = `bill-${Date.now()}`;
    const billNumber = `BILL-${new Date().getFullYear()}-${String(vendorBills.length + 1).padStart(3, '0')}`;
    const newBill: VendorBill = {
      ...billData,
      id: billId,
      billNumber,
      amountPaid: 0,
      status: 'APPROVED',
    };
    setVendorBills((prev) => [newBill, ...prev]);

    const currentAccs = accountsMap[activeTenant.id] || [];
    const apAcc = currentAccs.find((a) => a.code === '2010') || currentAccs.find((a) => a.type === 'LIABILITY');

    if (apAcc && billData.items.length > 0) {
      const lines: JournalLine[] = billData.items.map((item, idx) => {
        const expAcc = currentAccs.find((a) => a.code === item.expenseAccountCode) || currentAccs.find((a) => a.type === 'EXPENSE');
        return {
          id: `jl-bill-exp-${Date.now()}-${idx}`,
          accountId: expAcc ? expAcc.id : 'acc-5001',
          accountCode: expAcc ? expAcc.code : '5010',
          accountName: expAcc ? expAcc.name : 'Operating Expenses',
          debit: item.amount,
          credit: 0,
          memo: item.description,
        };
      });
      lines.push({
        id: `jl-bill-ap-${Date.now()}`,
        accountId: apAcc.id,
        accountCode: apAcc.code,
        accountName: apAcc.name,
        debit: 0,
        credit: billData.totalAmount,
        memo: `Vendor Bill ${billNumber}`,
      });

      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: billData.billDate,
        description: `Vendor Bill #${billNumber} received from ${billData.vendorName}`,
        reference: billNumber,
        pluginId: activePlugin,
        lines,
      });
    }

    addAuditLog({
      action: 'BILL_CREATE',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created Vendor Bill #${billNumber} for ${billData.vendorName} (${billData.totalAmount} ${activeTenant.currency})`,
      status: 'SUCCESS',
      payloadSummary: `Due Date: ${billData.dueDate}`,
    });

    return { success: true };
  };

  const payVendorBill = (billId: string, paymentAmount: number, bankAccountId: string) => {
    const bill = vendorBills.find((b) => b.id === billId);
    if (!bill) return { success: false, error: 'Vendor Bill not found.' };

    const newAmountPaid = bill.amountPaid + paymentAmount;
    const newStatus = newAmountPaid >= bill.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    setVendorBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, amountPaid: newAmountPaid, status: newStatus } : b))
    );

    const currentAccs = accountsMap[activeTenant.id] || [];
    const bankAcc = currentAccs.find((a) => a.id === bankAccountId || a.code === '1010');
    const apAcc = currentAccs.find((a) => a.code === '2010');

    if (bankAcc && apAcc) {
      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: new Date().toISOString().split('T')[0],
        description: `Disbursement Payment for Bill #${bill.billNumber} to ${bill.vendorName}`,
        reference: `DISB-${bill.billNumber}`,
        pluginId: activePlugin,
        lines: [
          { id: `jl-disb-ap-${Date.now()}`, accountId: apAcc.id, accountCode: apAcc.code, accountName: apAcc.name, debit: paymentAmount, credit: 0, memo: 'Clear AP' },
          { id: `jl-disb-b-${Date.now()}`, accountId: bankAcc.id, accountCode: bankAcc.code, accountName: bankAcc.name, debit: 0, credit: paymentAmount, memo: 'Bank Disbursement' },
        ],
      });
    }

    addAuditLog({
      action: 'BILL_PAYMENT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Disbursed ${paymentAmount} ${activeTenant.currency} for Vendor Bill #${bill.billNumber}`,
      status: 'SUCCESS',
      payloadSummary: `New Status: ${newStatus}`,
    });

    return { success: true };
  };

  // Period Lock & Year-End Closing
  const toggleFiscalPeriodStatus = (periodId: string, newStatus: 'OPEN' | 'LOCKED' | 'CLOSED') => {
    setFiscalPeriods((prev) =>
      prev.map((p) => (p.id === periodId ? { ...p, status: newStatus } : p))
    );
    addAuditLog({
      action: 'PERIOD_LOCK',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Changed Fiscal Period status for ${periodId} to ${newStatus}`,
      status: 'SUCCESS',
      payloadSummary: `Status Transition -> ${newStatus}`,
    });
  };

  const executeYearEndClose = (fiscalYear: string) => {
    const netInc = incomeStatement.netIncome;

    if (Math.abs(netInc) < 0.01) {
      return { success: false, netIncomeClosed: 0, error: 'Net income is 0. Nothing to close.' };
    }

    const currentAccs = accountsMap[activeTenant.id] || [];
    const retainedAcc = currentAccs.find((a) => a.code === '3200') || currentAccs.find((a) => a.type === 'EQUITY');
    if (!retainedAcc) return { success: false, netIncomeClosed: 0, error: 'Retained Earnings account (3200) not found.' };

    const lines: JournalLine[] = [];
    incomeStatement.revenues.forEach((r, idx) => {
      lines.push({
        id: `jl-ye-r-${idx}`,
        accountId: r.accountId,
        accountCode: r.accountCode,
        accountName: r.accountName,
        debit: r.netBalance,
        credit: 0,
        memo: `Year-End Close ${fiscalYear} Zeroing Revenue`,
      });
    });
    incomeStatement.expenses.forEach((ex, idx) => {
      lines.push({
        id: `jl-ye-ex-${idx}`,
        accountId: ex.accountId,
        accountCode: ex.accountCode,
        accountName: ex.accountName,
        debit: 0,
        credit: ex.netBalance,
        memo: `Year-End Close ${fiscalYear} Zeroing Expense`,
      });
    });

    if (netInc > 0) {
      lines.push({
        id: `jl-ye-re`,
        accountId: retainedAcc.id,
        accountCode: retainedAcc.code,
        accountName: retainedAcc.name,
        debit: 0,
        credit: netInc,
        memo: `Transfer Net Profit to Retained Earnings`,
      });
    } else {
      lines.push({
        id: `jl-ye-re`,
        accountId: retainedAcc.id,
        accountCode: retainedAcc.code,
        accountName: retainedAcc.name,
        debit: Math.abs(netInc),
        credit: 0,
        memo: `Transfer Net Loss from Retained Earnings`,
      });
    }

    const res = postJournalEntry({
      tenantId: activeTenant.id,
      organizationId: activeOrganization?.id,
      branchId: activeBranch?.id,
      date: `${fiscalYear}-12-31`,
      description: `AUTOMATED YEAR-END FINANCIAL CLOSE ${fiscalYear} - Retained Earnings Transfer`,
      reference: `CLOSE-${fiscalYear}`,
      pluginId: activePlugin,
      lines,
    });

    if (res.success) {
      addAuditLog({
        action: 'YEAR_END_CLOSE',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Successfully executed Year-End Close for FY ${fiscalYear}. Net Income transferred to Retained Earnings: ${netInc} ${activeTenant.currency}`,
        status: 'SUCCESS',
        payloadSummary: `Journal Entry Posted: ${res.entryId}`,
      });
    }

    return { success: res.success, netIncomeClosed: netInc, entryId: res.entryId, error: res.error };
  };

  // Cash Flow Statement Calculator
  const cashFlowStatement: CashFlowData = useMemo(() => {
    const netInc = incomeStatement.netIncome;
    const depExpense = trialBalance.find((r) => r.accountCode === '5030')?.debit || 0;
    const arChange = trialBalance.find((r) => r.accountCode === '1100')?.netBalance || 0;
    const apChange = trialBalance.find((r) => r.accountCode === '2010')?.netBalance || 0;

    const opAct = [
      { category: 'Net Income (P&L)', amount: netInc },
      { category: 'Add Back: Non-Cash Depreciation Expense', amount: depExpense },
      { category: 'Change in Accounts Receivable (AR)', amount: -arChange },
      { category: 'Change in Accounts Payable (AP)', amount: apChange },
    ];
    const totalOperating = opAct.reduce((sum, item) => sum + item.amount, 0);

    const invAct = [
      { category: 'Capital Expenditures (Fixed Assets Acquisition)', amount: -35000 },
    ];
    const totalInvesting = invAct.reduce((sum, item) => sum + item.amount, 0);

    const finAct = [
      { category: 'Capital Contributions / Stock Issued', amount: 50000 },
    ];
    const totalFinancing = finAct.reduce((sum, item) => sum + item.amount, 0);

    return {
      operatingActivities: opAct,
      investingActivities: invAct,
      financingActivities: finAct,
      totalOperatingCashFlow: Math.round(totalOperating * 100) / 100,
      totalInvestingCashFlow: Math.round(totalInvesting * 100) / 100,
      totalFinancingCashFlow: Math.round(totalFinancing * 100) / 100,
      netCashChange: Math.round((totalOperating + totalInvesting + totalFinancing) * 100) / 100,
    };
  }, [incomeStatement, trialBalance]);

  // Financial Health Ratios Calculator
  const financialRatios: FinancialRatiosData = useMemo(() => {
    const totLiab = balanceSheet.totalLiabilities;
    const totEq = balanceSheet.totalEquity;
    const cash = trialBalance.find((r) => r.accountCode === '1010')?.debit || 0;
    const ar = trialBalance.find((r) => r.accountCode === '1100')?.debit || 0;
    const rev = incomeStatement.totalRevenue;
    const netInc = incomeStatement.netIncome;

    const currentRatio = totLiab > 0 ? (cash + ar) / totLiab : 3.5;
    const quickRatio = totLiab > 0 ? cash / totLiab : 2.5;
    const workingCapital = (cash + ar) - totLiab;
    const debtToEquity = totEq > 0 ? totLiab / totEq : 0.2;
    const grossMarginPercentage = incomeStatement.grossMarginPercentage;
    const netProfitMarginPercentage = rev > 0 ? (netInc / rev) * 100 : 0;
    const receivablesTurnover = ar > 0 ? rev / ar : 4.2;

    let healthScore = 88;
    if (currentRatio < 1.0) healthScore -= 20;
    if (netProfitMarginPercentage < 0) healthScore -= 25;
    if (debtToEquity > 1.5) healthScore -= 15;

    return {
      currentRatio: Math.round(currentRatio * 100) / 100,
      quickRatio: Math.round(quickRatio * 100) / 100,
      workingCapital: Math.round(workingCapital * 100) / 100,
      debtToEquity: Math.round(debtToEquity * 100) / 100,
      grossMarginPercentage: Math.round(grossMarginPercentage * 10) / 10,
      netProfitMarginPercentage: Math.round(netProfitMarginPercentage * 10) / 10,
      receivablesTurnover: Math.round(receivablesTurnover * 10) / 10,
      healthScore: Math.max(0, Math.min(100, healthScore)),
    };
  }, [balanceSheet, trialBalance, incomeStatement]);

  // Corporate Entity Consolidation Calculator
  const consolidatedFinancials: ConsolidatedEntityData = useMemo(() => {
    const presentationCurrency = 'USD';
    const entities = tenants.map((tenant) => {
      const accs = accountsMap[tenant.id] || [];
      const revAccs = accs.filter((a) => a.type === 'REVENUE');
      const assetAccs = accs.filter((a) => a.type === 'ASSET');

      const localRevenue = revAccs.reduce((sum, a) => sum + a.balance, 0);
      const localAssets = assetAccs.reduce((sum, a) => sum + a.balance, 0);

      let fxRate = 1.0;
      if (tenant.currency === 'EUR') fxRate = FX_RATES.find((r) => r.fromCurrency === 'EUR')?.rate || 1.0925;
      else if (tenant.currency === 'INR') fxRate = FX_RATES.find((r) => r.fromCurrency === 'INR')?.rate || 0.01205;

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        localCurrency: tenant.currency,
        fxRateToPresentation: fxRate,
        localRevenue: Math.round(localRevenue * 100) / 100,
        translatedRevenue: Math.round(localRevenue * fxRate * 100) / 100,
        localAssets: Math.round(localAssets * 100) / 100,
        translatedAssets: Math.round(localAssets * fxRate * 100) / 100,
      };
    });

    const totalConsolidatedRevenue = entities.reduce((sum, e) => sum + e.translatedRevenue, 0);
    const totalConsolidatedAssets = entities.reduce((sum, e) => sum + e.translatedAssets, 0);
    const intercompanyEliminationAmount = 25000;
    const netConsolidatedRevenue = totalConsolidatedRevenue - intercompanyEliminationAmount;

    return {
      presentationCurrency,
      entities,
      totalConsolidatedRevenue: Math.round(totalConsolidatedRevenue * 100) / 100,
      totalConsolidatedAssets: Math.round(totalConsolidatedAssets * 100) / 100,
      intercompanyEliminationAmount,
      netConsolidatedRevenue: Math.round(netConsolidatedRevenue * 100) / 100,
    };
  }, [tenants, accountsMap]);

  // User Management & Provisioning Functions
  const createEnterpriseUser = (
    userData: Omit<EnterpriseUser, 'id' | 'createdAt' | 'lastLogin' | 'apiTokenCount'>
  ) => {
    const isSuperUser = activeRole === 'super_user';
    const isEntityAdmin = activeRole === 'entity_admin' || activeRole === 'admin';

    if (!isSuperUser && !isEntityAdmin) {
      const msg = 'HTTP 403 FORBIDDEN: User provisioning requires Super User or Entity Admin privileges.';
      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: 'Unauthorized attempt to provision new enterprise user.',
        status: 'FORBIDDEN',
        payloadSummary: msg,
      });
      return { success: false, error: msg };
    }

    if (!isSuperUser && userData.defaultRole === 'super_user') {
      const msg = 'HTTP 403 FORBIDDEN: Only Global Super Users can grant Super User access.';
      return { success: false, error: msg };
    }

    const newId = `usr-${Date.now()}`;
    const newUser: EnterpriseUser = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      apiTokenCount: 1,
    };

    setEnterpriseUsers((prev) => [newUser, ...prev]);

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Provisioned user "${newUser.name}" (${newUser.email}) as ${newUser.defaultRole} by ${activeRole}.`,
      status: 'SUCCESS',
      payloadSummary: `User ID: ${newId}`,
    });

    return { success: true };
  };

  const updateUserStatus = (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setEnterpriseUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated status for user ${userId} to ${newStatus}.`,
      status: 'SUCCESS',
    });
  };

  const updateUserRoleAndScopes = (
    userId: string,
    defaultRole: Role,
    tenantScopes: TenantAccessScope[]
  ) => {
    const isSuperUser = activeRole === 'super_user';
    if (!isSuperUser && defaultRole === 'super_user') {
      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: 'Denied elevation to Super User by non-Super User role.',
        status: 'FORBIDDEN',
      });
      return;
    }

    setEnterpriseUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, defaultRole, tenantScopes } : u))
    );

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated role (${defaultRole}) and tenant access scopes for user ${userId}.`,
      status: 'SUCCESS',
    });
  };

  const toggleUserMfa = (userId: string) => {
    setEnterpriseUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, mfaEnabled: !u.mfaEnabled } : u))
    );
  };

  const deleteEnterpriseUser = (userId: string) => {
    setEnterpriseUsers((prev) => prev.filter((u) => u.id !== userId));

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Deleted user record ${userId}.`,
      status: 'SUCCESS',
    });
  };

  const hasPermission = (permission: PermissionKey, tenantId?: string): boolean => {
    const targetTenant = tenantId || activeTenant.id;
    if (activeRole === 'super_user') return true;
    if (activeRole === 'admin' && permission !== 'users:manage_global') return true;

    const user = enterpriseUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
    if (user && user.status === 'SUSPENDED') return false;

    const scope = user?.tenantScopes.find((s) => s.tenantId === targetTenant);
    const effectiveRole = scope ? scope.role : activeRole;

    if (effectiveRole === 'super_user') return true;
    if (effectiveRole === 'entity_admin' && permission !== 'users:manage_global') return true;

    const roleDef = customRoles.find((r) => r.code === effectiveRole);
    if (roleDef && roleDef.permissions.includes(permission)) return true;

    if (scope && scope.customPermissions && scope.customPermissions.includes(permission)) {
      return true;
    }

    return false;
  };

  // --- Entity Master & Dynamic Attributes Management ---
  const createCustomer = (customerData: Omit<CustomerContact, 'id' | 'createdAt'>) => {
    const newCust: CustomerContact = {
      ...customerData,
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCustomers((prev) => [newCust, ...prev]);

    addAuditLog({
      action: 'INVOICE_CREATE',
      tenantId: customerData.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created Customer Profile: ${newCust.name} (${newCust.code}) - Category: ${newCust.category || 'General'}`,
      status: 'SUCCESS',
      payloadSummary: `Custom Attributes: ${Object.keys(newCust.customAttributes || {}).length} configured`,
    });

    return { success: true, customer: newCust };
  };

  const updateCustomer = (id: string, updates: Partial<CustomerContact>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    const target = customers.find((c) => c.id === id);
    if (target) {
      addAuditLog({
        action: 'CUSTOMER_UPDATE',
        tenantId: target.tenantId || activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Updated Customer Profile: ${target.name} (${target.code})`,
        status: 'SUCCESS',
        payloadSummary: `Updated fields: ${Object.keys(updates).join(', ')}`,
      });
    }
    return { success: true };
  };

  const deleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    if (target) {
      addAuditLog({
        action: 'CUSTOMER_DELETE',
        tenantId: target.tenantId || activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Deleted Customer Profile: ${target.name} (${target.code})`,
        status: 'SUCCESS',
      });
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  const batchCreateCustomers = (
    customersList: Array<Omit<CustomerContact, 'id' | 'createdAt'>>,
    strategy: 'append' | 'upsert' = 'upsert'
  ) => {
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    setCustomers((prev) => {
      let currentList = [...prev];

      customersList.forEach((incoming, idx) => {
        const existingIdx = currentList.findIndex(
          (c) => c.code.toLowerCase() === incoming.code.toLowerCase()
        );

        if (existingIdx !== -1) {
          if (strategy === 'upsert') {
            currentList[existingIdx] = {
              ...currentList[existingIdx],
              ...incoming,
              customAttributes: {
                ...currentList[existingIdx].customAttributes,
                ...incoming.customAttributes,
              },
            };
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          const newCust: CustomerContact = {
            ...incoming,
            id: `cust-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            createdAt: today,
          };
          currentList.push(newCust);
          createdCount++;
        }
      });

      return currentList;
    });

    addAuditLog({
      action: 'CUSTOMER_BATCH_UPLOAD',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Customer Batch Upload (${strategy.toUpperCase()} mode): ${createdCount} Created, ${updatedCount} Updated, ${skippedCount} Skipped`,
      status: 'SUCCESS',
      payloadSummary: `Total Batch Rows Processed: ${customersList.length}`,
    });

    return {
      success: true,
      createdCount,
      updatedCount,
      skippedCount,
      errors,
    };
  };

  const createVendor = (vendorData: Omit<VendorContact, 'id' | 'createdAt'>) => {
    const newVend: VendorContact = {
      ...vendorData,
      id: `vend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setVendors((prev) => [newVend, ...prev]);

    addAuditLog({
      action: 'BILL_CREATE',
      tenantId: vendorData.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created Vendor Profile: ${newVend.name} (${newVend.code}) - Category: ${newVend.category || 'General'}`,
      status: 'SUCCESS',
      payloadSummary: `Expense Account: ${newVend.defaultExpenseAccountCode || 'Default'}`,
    });

    return { success: true, vendor: newVend };
  };

  const updateVendor = (id: string, updates: Partial<VendorContact>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    return { success: true };
  };

  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    return { success: true };
  };

  const createCustomAttribute = (attrData: Omit<CustomAttributeDefinition, 'id'>) => {
    const newAttr: CustomAttributeDefinition = {
      ...attrData,
      id: `attr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setCustomAttributeDefinitions((prev) => [...prev, newAttr]);

    addAuditLog({
      action: 'ATTRIBUTE_CREATE',
      tenantId: attrData.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Registered Custom Schema Attribute on the fly: "${newAttr.name}" (${newAttr.dataType})`,
      status: 'SUCCESS',
      payloadSummary: `Key: ${newAttr.key} | Target: ${newAttr.targetEntity} | Required: ${newAttr.isRequired ? 'Yes' : 'No'} | Unit: ${newAttr.unitOrSuffix || 'None'}`,
    });

    return { success: true, attribute: newAttr };
  };

  const deleteCustomAttribute = (id: string) => {
    const target = customAttributeDefinitions.find((a) => a.id === id);
    if (target) {
      addAuditLog({
        action: 'ATTRIBUTE_DELETE',
        tenantId: target.tenantId || activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Deleted Custom Schema Attribute: "${target.name}" (${target.key})`,
        status: 'SUCCESS',
      });
    }
    setCustomAttributeDefinitions((prev) => prev.filter((a) => a.id !== id));
    return { success: true };
  };

  const applyIndustryPresetAttributes = (preset: IndustryPresetType, tenantId: string) => {
    const presetDefinitions = mockCustomAttributeDefinitions.filter(
      (a) => a.industryPreset === preset
    );

    let count = 0;
    setCustomAttributeDefinitions((prev) => {
      const existingKeys = new Set(prev.map((a) => a.key));
      const additions = presetDefinitions
        .filter((a) => !existingKeys.has(a.key))
        .map((a) => ({
          ...a,
          id: `attr-${preset.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tenantId,
        }));
      count = additions.length;
      return [...prev, ...additions];
    });

    return { success: true, count };
  };

  // --- Products & Services Catalog Management ---
  const createProductService = (data: Omit<ProductServiceItem, 'id' | 'createdAt'>) => {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const today = new Date().toISOString().split('T')[0];
    const initialPriceHistory: PriceChangeHistoryEntry = {
      id: `pch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: newId,
      itemCode: data.code,
      itemName: data.name,
      tenantId: data.tenantId || activeTenant.id,
      oldPrice: 0,
      newPrice: data.unitPrice,
      currency: activeTenant.currency,
      changeDate: new Date().toISOString(),
      effectiveDate: today,
      changedBy: userEmail,
      changedRole: activeRole,
      reason: 'Initial item creation & base price configuration',
      changePercentage: 100,
      notes: 'Initial catalog creation',
    };

    const newItem: ProductServiceItem = {
      ...data,
      id: newId,
      createdAt: today,
      lastPriceUpdatedAt: today,
      lastPriceUpdatedBy: userEmail,
      lastPriceChangeReason: 'Initial item creation & base price configuration',
      priceHistory: [initialPriceHistory],
    };

    setProductsServices((prev) => [newItem, ...prev]);
    setPriceChangeHistory((prev) => [initialPriceHistory, ...prev]);

    addAuditLog({
      action: 'PRODUCT_CREATE',
      tenantId: data.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created Catalog ${newItem.type}: "${newItem.name}" (${newItem.code}) - Base Price: ${activeTenant.currency} ${newItem.unitPrice.toFixed(2)} / ${newItem.unitOfMeasure || 'unit'}`,
      status: 'SUCCESS',
      payloadSummary: `Category: ${newItem.category} | Default Tax: ${newItem.defaultTaxRate || 0}% | Account: ${newItem.defaultRevenueAccountCode || '4010'}`,
    });

    return { success: true, item: newItem };
  };

  const updateProductPrice = (
    itemId: string,
    newPrice: number,
    reason: string,
    effectiveDate?: string,
    notes?: string
  ) => {
    const item = productsServices.find((p) => p.id === itemId);
    if (!item) {
      return { success: false, error: 'Product or Service not found' };
    }

    if (newPrice < 0 || isNaN(newPrice)) {
      return { success: false, error: 'Price must be a valid non-negative number' };
    }

    const oldPrice = item.unitPrice;
    const changeDate = new Date().toISOString();
    const effective = effectiveDate || new Date().toISOString().split('T')[0];
    const changePercentage = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

    const historyEntry: PriceChangeHistoryEntry = {
      id: `pch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      tenantId: item.tenantId || activeTenant.id,
      oldPrice,
      newPrice,
      currency: activeTenant.currency,
      changeDate,
      effectiveDate: effective,
      changedBy: userEmail,
      changedRole: activeRole,
      reason: reason || 'Standard catalog price revision',
      changePercentage: Number(changePercentage.toFixed(2)),
      notes: notes || undefined,
    };

    // Update in-memory price history
    setPriceChangeHistory((prev) => [historyEntry, ...prev]);

    // Update product item
    setProductsServices((prev) =>
      prev.map((p) => {
        if (p.id !== itemId) return p;
        const currentHist = p.priceHistory || [];
        return {
          ...p,
          unitPrice: newPrice,
          lastPriceUpdatedAt: effective,
          lastPriceUpdatedBy: userEmail,
          lastPriceChangeReason: reason,
          priceHistory: [historyEntry, ...currentHist],
        };
      })
    );

    const deltaSign = newPrice >= oldPrice ? '+' : '';
    const diff = Math.abs(newPrice - oldPrice).toFixed(2);
    const diffPct = changePercentage.toFixed(1);

    addAuditLog({
      action: 'PRODUCT_PRICE_UPDATE',
      tenantId: item.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Price Revision for [${item.code}] "${item.name}": ${activeTenant.currency} ${oldPrice.toFixed(2)} → ${activeTenant.currency} ${newPrice.toFixed(2)} (${deltaSign}${activeTenant.currency}${diff}, ${deltaSign}${diffPct}%)`,
      status: 'SUCCESS',
      payloadSummary: `Reason: ${reason} | Effective: ${effective} | Authorized By: ${userEmail} (${activeRole}) ${notes ? `| Notes: ${notes}` : ''}`,
    });

    return { success: true, historyEntry };
  };

  const updateProductService = (id: string, updates: Partial<ProductServiceItem>, reason?: string) => {
    const existing = productsServices.find((p) => p.id === id);
    if (!existing) return { success: false, error: 'Item not found' };

    // If unit price has changed, trigger price update workflow
    if (updates.unitPrice !== undefined && updates.unitPrice !== existing.unitPrice) {
      updateProductPrice(
        id,
        updates.unitPrice,
        reason || 'Direct catalog item specification update',
        undefined,
        'Updated via item details editor'
      );
    }

    setProductsServices((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    addAuditLog({
      action: 'PRODUCT_UPDATE',
      tenantId: existing.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated Catalog Item details: "${existing.name}" (${existing.code})`,
      status: 'SUCCESS',
      payloadSummary: `Updated fields: ${Object.keys(updates).join(', ')} | User: ${userEmail}`,
    });

    return { success: true };
  };

  const deleteProductService = (id: string) => {
    const existing = productsServices.find((p) => p.id === id);
    if (existing) {
      addAuditLog({
        action: 'PRODUCT_DELETE',
        tenantId: existing.tenantId || activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Archived/Deleted Catalog Item: "${existing.name}" (${existing.code})`,
        status: 'SUCCESS',
        payloadSummary: `Type: ${existing.type} | Category: ${existing.category} | Final Price: ${activeTenant.currency} ${existing.unitPrice}`,
      });
    }
    setProductsServices((prev) => prev.filter((p) => p.id !== id));
    return { success: true };
  };

  const applyIndustryPresetProducts = (preset: IndustryPresetType, tenantId: string) => {
    let presetItems: ProductServiceItem[] = [];
    if (preset === 'HOUSING_SOCIETY') {
      presetItems = mockProductServices.filter((p) => p.category.includes('HOA') || p.category.includes('Amenities') || p.category.includes('Utilities'));
    } else if (preset === 'SCHOOL') {
      presetItems = mockProductServices.filter((p) => p.category.includes('Education') || p.category.includes('Student') || p.category.includes('Lab') || p.category.includes('Uniform'));
    } else if (preset === 'HOSPITAL') {
      presetItems = mockProductServices.filter((p) => p.category.includes('Medical') || p.category.includes('Room') || p.category.includes('Diagnostics') || p.category.includes('Pharma'));
    } else {
      // SAAS or GENERIC / CUSTOM
      presetItems = mockProductServices.filter((p) => p.category.includes('Software') || p.category.includes('Professional') || p.category.includes('Advisory'));
    }

    let count = 0;
    setProductsServices((prev) => {
      const existingCodes = new Set(prev.map((p) => p.code));
      const additions = presetItems
        .filter((p) => !existingCodes.has(p.code))
        .map((p) => ({
          ...p,
          id: `prod-${preset.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          tenantId,
        }));
      count = additions.length;
      return [...prev, ...additions];
    });

    return { success: true, count };
  };

  // --- Invoice Templates Management Engine ---
  const createInvoiceTemplate = (
    templateData: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'usageCount'>
  ) => {
    const newId = `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newTemplate: InvoiceTemplate = {
      ...templateData,
      id: newId,
      code: templateData.code.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      items: templateData.items.map((item, idx) => ({
        ...item,
        id: item.id || `tmpl-item-${Date.now()}-${idx}`,
        amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
      })),
    };

    setInvoiceTemplates((prev) => [newTemplate, ...prev]);

    addAuditLog({
      action: 'TEMPLATE_CREATE',
      tenantId: templateData.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created reusable Invoice Template: "${newTemplate.name}" (${newTemplate.code}) with ${newTemplate.items.length} pre-configured line items.`,
      status: 'SUCCESS',
      payloadSummary: `Category: ${newTemplate.category} | Terms: Net ${newTemplate.defaultPaymentTermsDays || 30} Days | Revenue Account: ${newTemplate.defaultRevenueAccountCode || '4010'}`,
    });

    return { success: true, template: newTemplate };
  };

  const updateInvoiceTemplate = (id: string, updates: Partial<InvoiceTemplate>) => {
    const existing = invoiceTemplates.find((t) => t.id === id);
    if (!existing) return { success: false, error: 'Invoice template not found' };

    const now = new Date().toISOString();
    const updatedItems = updates.items
      ? updates.items.map((item, idx) => ({
          ...item,
          id: item.id || `tmpl-item-${Date.now()}-${idx}`,
          amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
        }))
      : existing.items;

    setInvoiceTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              code: updates.code ? updates.code.trim().toUpperCase() : t.code,
              items: updatedItems,
              updatedAt: now,
            }
          : t
      )
    );

    addAuditLog({
      action: 'TEMPLATE_UPDATE',
      tenantId: existing.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated Invoice Template: "${existing.name}" (${existing.code})`,
      status: 'SUCCESS',
      payloadSummary: `Updated fields: ${Object.keys(updates).join(', ')}`,
    });

    return { success: true };
  };

  const deleteInvoiceTemplate = (id: string) => {
    const existing = invoiceTemplates.find((t) => t.id === id);
    if (existing) {
      addAuditLog({
        action: 'TEMPLATE_DELETE',
        tenantId: existing.tenantId || activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Deleted/Archived Invoice Template: "${existing.name}" (${existing.code})`,
        status: 'SUCCESS',
        payloadSummary: `Category: ${existing.category} | Prior Usage Count: ${existing.usageCount}`,
      });
    }
    setInvoiceTemplates((prev) => prev.filter((t) => t.id !== id));
    return { success: true };
  };

  const duplicateInvoiceTemplate = (id: string) => {
    const existing = invoiceTemplates.find((t) => t.id === id);
    if (!existing) return { success: false, error: 'Template not found to duplicate' };

    const newId = `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const duplicated: InvoiceTemplate = {
      ...existing,
      id: newId,
      code: `${existing.code}-COPY`,
      name: `${existing.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      items: existing.items.map((item, idx) => ({
        ...item,
        id: `tmpl-item-copy-${Date.now()}-${idx}`,
      })),
    };

    setInvoiceTemplates((prev) => [duplicated, ...prev]);

    addAuditLog({
      action: 'TEMPLATE_CREATE',
      tenantId: existing.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Duplicated Invoice Template: "${existing.name}" → "${duplicated.name}" (${duplicated.code})`,
      status: 'SUCCESS',
      payloadSummary: `Cloned ${duplicated.items.length} line items from source template ${existing.id}`,
    });

    return { success: true, template: duplicated };
  };

  const incrementTemplateUsage = (templateId: string) => {
    setInvoiceTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t))
    );
  };

  // Bulk Invoice Generation & Batch Operations Engine
  const batchCreateInvoices = (params: {
    title: string;
    groupingAttributeKey: string;
    groupingAttributeName: string;
    invoicesData: Omit<CustomerInvoice, 'id' | 'invoiceNumber' | 'amountPaid' | 'status'>[];
    groupBreakdowns: {
      groupId: string;
      groupName: string;
      templateCode: string;
      templateName: string;
      customerCount: number;
      groupTotalAmount: number;
    }[];
    templateIdsUsed: string[];
  }) => {
    const {
      title,
      groupingAttributeKey,
      groupingAttributeName,
      invoicesData,
      groupBreakdowns,
      templateIdsUsed,
    } = params;

    if (!invoicesData || invoicesData.length === 0) {
      return { success: false, createdInvoicesCount: 0, error: 'No invoices provided to generate in batch' };
    }

    const currentYear = new Date().getFullYear();
    const batchId = `bat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const batchNumber = `BAT-${currentYear}-${String(bulkInvoiceBatches.length + 1).padStart(3, '0')}`;

    let lastNum = invoices.length;
    const newInvoices: CustomerInvoice[] = [];
    const generatedInvoiceIds: string[] = [];
    let totalBatchAmount = 0;
    let totalTaxAmount = 0;

    invoicesData.forEach((invData) => {
      lastNum += 1;
      const invId = `inv-batch-${Date.now()}-${lastNum}-${Math.random().toString(36).substring(2, 4)}`;
      const invNumber = `INV-${currentYear}-${String(lastNum).padStart(4, '0')}`;

      const newInv: CustomerInvoice = {
        ...invData,
        id: invId,
        invoiceNumber: invNumber,
        amountPaid: 0,
        status: 'UNPAID',
      };

      newInvoices.push(newInv);
      generatedInvoiceIds.push(invId);
      totalBatchAmount += newInv.totalAmount;
      totalTaxAmount += (newInv.taxTotal || 0);

      // Post Balanced Journal Entry into General Ledger for Subledger consistency
      const issueDate = newInv.issueDate || new Date().toISOString().split('T')[0];
      const revAccCode = newInv.revenueAccountCode || '4010';
      const arAcc = accounts.find((a) => a.code === '1100') || accounts[0];
      const revAcc = accounts.find((a) => a.code === revAccCode) || accounts[1] || arAcc;
      const taxAcc = accounts.find((a) => a.code === '2110') || accounts[2] || arAcc;

      const lines: JournalLine[] = [
        {
          id: `jl-ar-${invId}`,
          accountId: arAcc.id,
          accountCode: arAcc.code,
          accountName: arAcc.name,
          debit: newInv.totalAmount,
          credit: 0,
          memo: `Batch Invoice ${invNumber} for ${newInv.customerName} (${batchNumber})`,
        },
        {
          id: `jl-rev-${invId}`,
          accountId: revAcc.id,
          accountCode: revAcc.code,
          accountName: revAcc.name,
          debit: 0,
          credit: newInv.subtotal,
          memo: `Revenue from ${invNumber} (${batchNumber})`,
        },
      ];

      if (newInv.taxTotal && newInv.taxTotal > 0) {
        lines.push({
          id: `jl-tax-${invId}`,
          accountId: taxAcc.id,
          accountCode: taxAcc.code,
          accountName: taxAcc.name,
          debit: 0,
          credit: newInv.taxTotal,
          memo: `Tax on Batch Invoice ${invNumber}`,
        });
      }

      postJournalEntry({
        tenantId: newInv.tenantId || activeTenant.id,
        organizationId: activeOrgId || undefined,
        branchId: activeBranchId || undefined,
        date: issueDate,
        description: `Batch AR Invoice: ${invNumber} - ${newInv.customerName} [${title}]`,
        reference: invNumber,
        pluginId: activeTenant.pluginId,
        lines,
      });
    });

    // Update Invoices state
    setInvoices((prev) => [...newInvoices, ...prev]);

    // Increment usage for templates used
    templateIdsUsed.forEach((tid) => {
      incrementTemplateUsage(tid);
    });

    const newBatchRun: BulkInvoiceBatchRun = {
      id: batchId,
      batchNumber,
      tenantId: activeTenant.id,
      title,
      createdAt: new Date().toISOString(),
      createdBy: userEmail,
      groupingAttributeKey,
      groupingAttributeName,
      groupsCount: groupBreakdowns.length,
      totalCustomers: invoicesData.length,
      totalInvoicesGenerated: newInvoices.length,
      totalBatchAmount: Math.round(totalBatchAmount * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      generatedInvoiceIds,
      status: 'COMMITTED',
      groupBreakdowns,
    };

    setBulkInvoiceBatches((prev) => [newBatchRun, ...prev]);

    addAuditLog({
      action: 'INVOICE_BATCH_GENERATE',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Generated Bulk Invoicing Batch ${batchNumber} (${title}). Generated ${newInvoices.length} invoices across ${groupBreakdowns.length} customer groups.`,
      status: 'SUCCESS',
      payloadSummary: `Total Batch Amount: ${activeTenant.currency} ${totalBatchAmount.toFixed(2)} | Groups: ${groupBreakdowns.map((g) => `${g.groupName} (${g.customerCount})`).join(', ')}`,
    });

    return {
      success: true,
      batchRun: newBatchRun,
      createdInvoicesCount: newInvoices.length,
    };
  };

  const rollbackInvoiceBatch = (batchId: string, reason: string = 'User batch rollback request') => {
    const targetBatch = bulkInvoiceBatches.find((b) => b.id === batchId);
    if (!targetBatch) {
      return { success: false, error: 'Batch run not found' };
    }

    if (targetBatch.status === 'ROLLED_BACK') {
      return { success: false, error: 'Batch has already been rolled back' };
    }

    const idsToRollback = new Set(targetBatch.generatedInvoiceIds);

    // 1. Mark target invoices as VOID or filter them
    setInvoices((prev) =>
      prev.map((inv) => (idsToRollback.has(inv.id) ? { ...inv, status: 'VOID' as any } : inv))
    );

    // 2. Update batch status to ROLLED_BACK
    setBulkInvoiceBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: 'ROLLED_BACK' as const } : b))
    );

    addAuditLog({
      action: 'INVOICE_BATCH_ROLLBACK',
      tenantId: targetBatch.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Rolled back Bulk Invoicing Batch ${targetBatch.batchNumber} (${targetBatch.title}). Voided ${targetBatch.totalInvoicesGenerated} invoices. Reason: ${reason}`,
      status: 'SUCCESS',
      payloadSummary: `Reversed Batch Value: ${activeTenant.currency} ${targetBatch.totalBatchAmount.toFixed(2)} | Invoice IDs: ${targetBatch.generatedInvoiceIds.slice(0, 5).join(', ')}...`,
    });

    return { success: true };
  };

  // Advanced Customer AR, Payment Receipts & Opening Balances Engine
  const recordCustomerPaymentReceipt = (params: {
    customerId: string;
    paymentDate: string;
    paymentMethod: PaymentMethodType;
    bankAccountId: string;
    referenceNumber?: string;
    totalAmountReceived: number;
    allocations: { invoiceId: string; invoiceNumber: string; allocatedAmount: number; discountAmount?: number; writeOffAmount?: number }[];
    notes?: string;
  }) => {
    const {
      customerId,
      paymentDate,
      paymentMethod,
      bankAccountId,
      referenceNumber,
      totalAmountReceived,
      allocations,
      notes,
    } = params;

    const customer = customers.find((c) => c.id === customerId);
    const customerName = customer?.name || 'Customer';
    const customerEmail = customer?.email || '';

    const allocatedSum = allocations.reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0);
    const discountSum = allocations.reduce((sum, a) => sum + (Number(a.discountAmount) || 0), 0);
    const unallocatedCreditAmount = Math.max(0, totalAmountReceived - allocatedSum);

    const receiptId = `rct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const receiptNumber = `RCT-${new Date().getFullYear()}-${String(paymentReceipts.length + 1).padStart(3, '0')}`;

    // 1. Update Invoices state
    setInvoices((prev) =>
      prev.map((inv) => {
        const alloc = allocations.find((a) => a.invoiceId === inv.id);
        if (!alloc) return inv;
        const addPaid = (Number(alloc.allocatedAmount) || 0) + (Number(alloc.discountAmount) || 0);
        const updatedPaid = inv.amountPaid + addPaid;
        const updatedStatus = updatedPaid >= inv.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
        return {
          ...inv,
          amountPaid: updatedPaid,
          status: updatedStatus,
        };
      })
    );

    // 2. Update Opening Balances if allocated
    setOpeningBalances((prev) =>
      prev.map((opb) => {
        const alloc = allocations.find((a) => a.invoiceId === opb.invoiceId);
        if (!alloc) return opb;
        const addPaid = (Number(alloc.allocatedAmount) || 0) + (Number(alloc.discountAmount) || 0);
        const updatedPaid = opb.amountPaid + addPaid;
        const currentBal = Math.max(0, opb.originalAmount - updatedPaid);
        return {
          ...opb,
          amountPaid: updatedPaid,
          currentBalance: currentBal,
        };
      })
    );

    // 3. Post GL Journal Entry
    const currentAccs = accountsMap[activeTenant.id] || [];
    const bankAcc = currentAccs.find((a) => a.id === bankAccountId || a.code === '1010') || currentAccs.find((a) => a.type === 'ASSET');
    const arAcc = currentAccs.find((a) => a.code === '1100') || currentAccs.find((a) => a.type === 'ASSET');
    const discountAcc = currentAccs.find((a) => a.code === '4090' || a.code === '5010') || currentAccs.find((a) => a.type === 'EXPENSE');
    const advanceLiabilityAcc = currentAccs.find((a) => a.code === '2150' || a.code === '2010') || currentAccs.find((a) => a.type === 'LIABILITY');

    const lines: JournalLine[] = [];
    if (bankAcc && totalAmountReceived > 0) {
      lines.push({
        id: `jl-rct-bank-${Date.now()}`,
        accountId: bankAcc.id,
        accountCode: bankAcc.code,
        accountName: bankAcc.name,
        debit: totalAmountReceived,
        credit: 0,
        memo: `Payment Receipt #${receiptNumber} from ${customerName}`,
      });
    }

    if (discountSum > 0 && discountAcc) {
      lines.push({
        id: `jl-rct-disc-${Date.now()}`,
        accountId: discountAcc.id,
        accountCode: discountAcc.code,
        accountName: discountAcc.name,
        debit: discountSum,
        credit: 0,
        memo: `Early Payment Discount (${customerName})`,
      });
    }

    const totalArCredit = allocatedSum + discountSum;
    if (arAcc && totalArCredit > 0) {
      lines.push({
        id: `jl-rct-ar-${Date.now()}`,
        accountId: arAcc.id,
        accountCode: arAcc.code,
        accountName: arAcc.name,
        debit: 0,
        credit: totalArCredit,
        memo: `Clear AR for ${allocations.map((a) => a.invoiceNumber).join(', ') || 'Invoices'}`,
      });
    }

    if (unallocatedCreditAmount > 0 && advanceLiabilityAcc) {
      lines.push({
        id: `jl-rct-adv-${Date.now()}`,
        accountId: advanceLiabilityAcc.id,
        accountCode: advanceLiabilityAcc.code,
        accountName: advanceLiabilityAcc.name,
        debit: 0,
        credit: unallocatedCreditAmount,
        memo: `Customer Advance / Excess Deposit for ${customerName}`,
      });
    }

    let postedJournalId: string | undefined;
    if (lines.length > 0) {
      const jeRes = postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: paymentDate,
        description: `Customer Payment Receipt #${receiptNumber} - ${customerName} (${paymentMethod})`,
        reference: referenceNumber || receiptNumber,
        pluginId: activePlugin,
        lines,
      });
      postedJournalId = jeRes.entryId;
    }

    const newReceipt: CustomerPaymentReceipt = {
      id: receiptId,
      receiptNumber,
      tenantId: activeTenant.id,
      customerId,
      customerName,
      customerEmail,
      paymentDate,
      paymentMethod,
      bankAccountId,
      bankAccountName: bankAcc?.name || 'Operating Bank Account',
      referenceNumber,
      totalAmountReceived,
      allocatedAmount: allocatedSum,
      unallocatedCreditAmount,
      allocations,
      discountTotal: discountSum,
      notes,
      createdAt: new Date().toISOString(),
      journalEntryId: postedJournalId,
      status: 'POSTED',
    };

    setPaymentReceipts((prev) => [newReceipt, ...prev]);

    addAuditLog({
      action: 'PAYMENT_RECEIPT_CREATE',
      tenantId: activeTenant.id,
      organizationId: activeOrganization?.id,
      branchId: activeBranch?.id,
      userRole: activeRole,
      userEmail,
      details: `Recorded Customer Payment Receipt #${receiptNumber} for ${customerName} (${totalAmountReceived} ${activeTenant.currency}) via ${paymentMethod}`,
      status: 'SUCCESS',
      payloadSummary: `Allocated: ${allocatedSum} | Advance Credit: ${unallocatedCreditAmount} | Invoices: ${allocations.map((a) => a.invoiceNumber).join(', ') || 'Advance Only'}`,
    });

    return { success: true, receipt: newReceipt };
  };

  const voidPaymentReceipt = (receiptId: string, reason?: string) => {
    const rct = paymentReceipts.find((r) => r.id === receiptId);
    if (!rct) return { success: false, error: 'Payment receipt not found.' };
    if (rct.status === 'VOIDED') return { success: false, error: 'Receipt is already voided.' };

    // Reverse invoice paid amounts
    setInvoices((prev) =>
      prev.map((inv) => {
        const alloc = rct.allocations.find((a) => a.invoiceId === inv.id);
        if (!alloc) return inv;
        const deductPaid = (Number(alloc.allocatedAmount) || 0) + (Number(alloc.discountAmount) || 0);
        const updatedPaid = Math.max(0, inv.amountPaid - deductPaid);
        const updatedStatus = updatedPaid === 0 ? 'UNPAID' : updatedPaid >= inv.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
        return {
          ...inv,
          amountPaid: updatedPaid,
          status: updatedStatus,
        };
      })
    );

    // Reverse opening balance paid amounts
    setOpeningBalances((prev) =>
      prev.map((opb) => {
        const alloc = rct.allocations.find((a) => a.invoiceId === opb.invoiceId);
        if (!alloc) return opb;
        const deductPaid = (Number(alloc.allocatedAmount) || 0) + (Number(alloc.discountAmount) || 0);
        const updatedPaid = Math.max(0, opb.amountPaid - deductPaid);
        const currentBal = Math.max(0, opb.originalAmount - updatedPaid);
        return {
          ...opb,
          amountPaid: updatedPaid,
          currentBalance: currentBal,
        };
      })
    );

    setPaymentReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId
          ? {
              ...r,
              status: 'VOIDED',
              notes: `${r.notes || ''} [VOIDED: ${reason || 'User voided'}]`,
            }
          : r
      )
    );

    if (rct.journalEntryId) {
      reverseJournalEntry(rct.journalEntryId, `Reversal of voided Payment Receipt #${rct.receiptNumber} (${reason || 'Voided'})`);
    }

    addAuditLog({
      action: 'PAYMENT_RECEIPT_VOID',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Voided Customer Payment Receipt #${rct.receiptNumber} for ${rct.customerName} (${rct.totalAmountReceived} ${activeTenant.currency})`,
      status: 'SUCCESS',
      payloadSummary: `Reason: ${reason || 'Voided by user'}`,
    });

    return { success: true };
  };

  const recordOpeningBalanceInvoice = (params: {
    customerId: string;
    fiscalYear: string;
    asOfDate: string;
    originalInvoiceNumber: string;
    originalInvoiceDate: string;
    dueDate: string;
    openingAmount: number;
    balanceType?: 'DR' | 'CR';
    offsetAccountCode?: string;
    notes?: string;
  }) => {
    const {
      customerId,
      fiscalYear,
      asOfDate,
      originalInvoiceNumber,
      originalInvoiceDate,
      dueDate,
      openingAmount,
      balanceType: explicitBalanceType,
      offsetAccountCode = '3010',
      notes,
    } = params;

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return { success: false, error: 'Customer not found in master records.' };

    const rawAmt = Number(openingAmount) || 0;
    const absAmount = Math.abs(rawAmt);
    if (absAmount === 0) {
      return { success: false, error: 'Opening balance amount must be non-zero.' };
    }

    // Identify if Debit (Customer owes money) or Credit (Customer overpaid / Advance deposit)
    const isCredit =
      explicitBalanceType === 'CR' ||
      rawAmt < 0 ||
      (explicitBalanceType && explicitBalanceType.toUpperCase().startsWith('C'));
    const balanceType: 'DR' | 'CR' = isCredit ? 'CR' : 'DR';

    const invoiceId = `inv-op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cleanNum = (originalInvoiceNumber || `OPN-${customer.code || customer.id}`).trim();
    const invoiceNumber = cleanNum.startsWith('OPN-') || cleanNum.startsWith('INV-') || cleanNum.startsWith('ADV-')
      ? cleanNum
      : `OPN-${cleanNum}`;

    const newInvoice: CustomerInvoice = {
      id: invoiceId,
      invoiceNumber,
      tenantId: activeTenant.id,
      customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      issueDate: originalInvoiceDate || asOfDate,
      dueDate: dueDate || asOfDate,
      currency: activeTenant.currency,
      items: [
        {
          description: isCredit
            ? `Opening FY ${fiscalYear} Overpayment / Advance Credit Carryforward (#${cleanNum})`
            : `Opening FY ${fiscalYear} Outstanding Receivable Carryforward (#${cleanNum})`,
          quantity: 1,
          unitPrice: absAmount,
          amount: absAmount,
          taxRate: 0,
        },
      ],
      subtotal: absAmount,
      taxTotal: 0,
      totalAmount: absAmount,
      amountPaid: isCredit ? absAmount : 0,
      status: isCredit ? 'PAID' : 'UNPAID',
      revenueAccountCode: offsetAccountCode,
      isOpeningBalance: true,
      balanceType,
      fiscalYearOpening: fiscalYear,
      offsetAccountCode,
      notes: notes || (isCredit
        ? `Opening customer advance / overpayment credit as of ${asOfDate} for ${fiscalYear}.`
        : `Opening AR receivable balance carryforward as of ${asOfDate} for ${fiscalYear}.`),
    };

    const newOpeningRecord: CustomerOpeningBalanceRecord = {
      id: `opb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: activeTenant.id,
      customerId,
      customerName: customer.name,
      customerCode: customer.code,
      fiscalYear,
      asOfDate,
      originalInvoiceNumber: cleanNum,
      originalInvoiceDate: originalInvoiceDate || asOfDate,
      dueDate: dueDate || asOfDate,
      originalAmount: absAmount,
      amountPaid: isCredit ? absAmount : 0,
      currentBalance: isCredit ? -absAmount : absAmount,
      balanceType,
      offsetAccountCode,
      invoiceId,
      notes,
      createdAt: new Date().toISOString(),
    };

    // If Credit (Customer Overpaid/Advance), also register an unallocated customer credit receipt
    if (isCredit) {
      const newCreditReceipt: CustomerPaymentReceipt = {
        id: `rct-opb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        receiptNumber: invoiceNumber.startsWith('OPN-') ? invoiceNumber.replace('OPN-', 'ADV-OPN-') : `ADV-${invoiceNumber}`,
        tenantId: activeTenant.id,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        paymentDate: asOfDate,
        paymentMethod: 'OTHER',
        bankAccountId: 'acc-1010-us',
        bankAccountName: 'Opening Balance Equity Offset',
        referenceNumber: cleanNum,
        totalAmountReceived: absAmount,
        allocatedAmount: 0,
        unallocatedCreditAmount: absAmount,
        allocations: [],
        notes: notes || `Opening FY ${fiscalYear} advance credit balance / customer overpayment carryforward.`,
        createdAt: new Date().toISOString(),
        status: 'POSTED',
      };
      setPaymentReceipts((prev) => [newCreditReceipt, ...prev]);
    }

    setInvoices((prev) => [newInvoice, ...prev]);
    setOpeningBalances((prev) => [newOpeningRecord, ...prev]);

    // Post opening balance GL Journal Entry:
    // If DR: Debit AR (1100), Credit Opening Balance Equity (3010)
    // If CR: Debit Opening Balance Equity (3010), Credit AR / Advance Liability (1100/2030)
    const currentAccs = accountsMap[activeTenant.id] || [];
    const arAcc = currentAccs.find((a) => a.code === '1100') || currentAccs.find((a) => a.type === 'ASSET');
    const equityAcc =
      currentAccs.find((a) => a.code === offsetAccountCode) ||
      currentAccs.find((a) => a.code === '3010' || a.code === '3200') ||
      currentAccs.find((a) => a.type === 'EQUITY');

    if (arAcc && equityAcc) {
      if (!isCredit) {
        postJournalEntry({
          tenantId: activeTenant.id,
          organizationId: activeOrganization?.id,
          branchId: activeBranch?.id,
          date: asOfDate,
          description: `Opening FY ${fiscalYear} Outstanding Receivable: ${customer.name} (Ref #${cleanNum})`,
          reference: invoiceNumber,
          pluginId: activePlugin,
          lines: [
            {
              id: `jl-opb-ar-${Date.now()}`,
              accountId: arAcc.id,
              accountCode: arAcc.code,
              accountName: arAcc.name,
              debit: absAmount,
              credit: 0,
              memo: `Opening AR for ${customer.name}`,
            },
            {
              id: `jl-opb-eq-${Date.now()}`,
              accountId: equityAcc.id,
              accountCode: equityAcc.code,
              accountName: equityAcc.name,
              debit: 0,
              credit: absAmount,
              memo: `Offset to ${equityAcc.name}`,
            },
          ],
        });
      } else {
        postJournalEntry({
          tenantId: activeTenant.id,
          organizationId: activeOrganization?.id,
          branchId: activeBranch?.id,
          date: asOfDate,
          description: `Opening FY ${fiscalYear} Customer Overpayment / Credit: ${customer.name} (Ref #${cleanNum})`,
          reference: invoiceNumber,
          pluginId: activePlugin,
          lines: [
            {
              id: `jl-opb-eq-${Date.now()}`,
              accountId: equityAcc.id,
              accountCode: equityAcc.code,
              accountName: equityAcc.name,
              debit: absAmount,
              credit: 0,
              memo: `Opening Equity Offset for Overpayment - ${customer.name}`,
            },
            {
              id: `jl-opb-ar-${Date.now()}`,
              accountId: arAcc.id,
              accountCode: arAcc.code,
              accountName: arAcc.name,
              debit: 0,
              credit: absAmount,
              memo: `Opening Credit Balance / Advance for ${customer.name}`,
            },
          ],
        });
      }
    }

    addAuditLog({
      action: 'OPENING_BALANCE_CREATE',
      tenantId: activeTenant.id,
      organizationId: activeOrganization?.id,
      branchId: activeBranch?.id,
      userRole: activeRole,
      userEmail,
      details: `Established Opening FY Balance of ${absAmount} ${activeTenant.currency} (${balanceType}) for ${customer.name} (${fiscalYear})`,
      status: 'SUCCESS',
      payloadSummary: `Invoice: ${invoiceNumber} | Flag: ${balanceType} | Offset Account: ${offsetAccountCode}`,
    });

    return { success: true, invoice: newInvoice, openingRecord: newOpeningRecord };
  };

  const batchImportOpeningBalances = (records: {
    customerId?: string;
    customerCode?: string;
    customerName?: string;
    fiscalYear?: string;
    asOfDate?: string;
    originalInvoiceNumber?: string;
    originalInvoiceDate?: string;
    dueDate?: string;
    openingAmount: number;
    balanceType?: 'DR' | 'CR';
    creditDebitFlag?: string;
    offsetAccountCode?: string;
    notes?: string;
  }[]) => {
    let successCount = 0;
    records.forEach((rec) => {
      let custId = rec.customerId;
      if (!custId && rec.customerCode) {
        const found = customers.find((c) => c.code?.toLowerCase().trim() === rec.customerCode?.toLowerCase().trim());
        if (found) custId = found.id;
      }
      if (!custId && rec.customerName) {
        const found = customers.find((c) => c.name.toLowerCase().trim() === rec.customerName?.toLowerCase().trim());
        if (found) custId = found.id;
      }
      if (!custId) return;

      const amt = Number(rec.openingAmount) || 0;
      if (amt === 0) return; // Safely skip rows left at 0 or empty

      let balanceType: 'DR' | 'CR' = 'DR';
      const flagUpper = (rec.creditDebitFlag || rec.balanceType || '').toUpperCase().trim();
      if (flagUpper === 'CR' || flagUpper === 'CREDIT' || flagUpper === 'C' || amt < 0) {
        balanceType = 'CR';
      }

      const res = recordOpeningBalanceInvoice({
        customerId: custId,
        fiscalYear: rec.fiscalYear || 'FY 2026-2027',
        asOfDate: rec.asOfDate || '2026-04-01',
        originalInvoiceNumber: rec.originalInvoiceNumber || `OPN-${rec.customerCode || '2026'}`,
        originalInvoiceDate: rec.originalInvoiceDate || rec.asOfDate || '2026-03-25',
        dueDate: rec.dueDate || '2026-04-30',
        openingAmount: Math.abs(amt),
        balanceType,
        offsetAccountCode: rec.offsetAccountCode || '3010',
        notes: rec.notes || (balanceType === 'CR'
          ? 'Prior FY customer overpayment / advance deposit carryforward.'
          : 'Prior FY closing receivable carryforward.'),
      });

      if (res.success) successCount++;
    });

    addAuditLog({
      action: 'OPENING_BALANCE_BATCH',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Batch established ${successCount} opening customer balances for financial year start.`,
      status: 'SUCCESS',
      payloadSummary: `Total records processed: ${records.length} | Created: ${successCount}`,
    });

    return { success: true, count: successCount };
  };

  const getCustomerStatementData = (customerId: string, dateRange?: { startDate?: string; endDate?: string }): CustomerStatementData => {
    const customer = customers.find((c) => c.id === customerId);
    
    // Invoices for this customer & tenant
    const custInvoices = invoices.filter((i) => {
      const matchCustomer = i.customerId === customerId || (customer && i.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim());
      const matchTenant = i.tenantId === activeTenant.id;
      if (!matchCustomer || !matchTenant) return false;
      if (dateRange?.startDate && i.issueDate < dateRange.startDate) return false;
      if (dateRange?.endDate && i.issueDate > dateRange.endDate) return false;
      return true;
    });

    // Payment Receipts for this customer & tenant
    const custReceipts = paymentReceipts.filter((r) => {
      const matchCustomer = r.customerId === customerId || (customer && r.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim());
      const matchTenant = r.tenantId === activeTenant.id;
      if (!matchCustomer || !matchTenant) return false;
      if (dateRange?.startDate && r.paymentDate < dateRange.startDate) return false;
      if (dateRange?.endDate && r.paymentDate > dateRange.endDate) return false;
      return true;
    });

    // Opening balances
    const custOpening = openingBalances.filter((o) => {
      const matchCustomer = o.customerId === customerId || (customer && o.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim());
      return matchCustomer && o.tenantId === activeTenant.id;
    });

    // Build chronological transaction stream
    const rawTx: Omit<CustomerLedgerTransaction, 'runningBalance'>[] = [];

    custInvoices.forEach((inv) => {
      const isCreditBalance = inv.isOpeningBalance && inv.balanceType === 'CR';
      rawTx.push({
        id: `tx-inv-${inv.id}`,
        date: inv.issueDate,
        type: inv.isOpeningBalance ? 'OPENING_BALANCE' : 'INVOICE',
        referenceNumber: inv.invoiceNumber,
        description: inv.isOpeningBalance
          ? (inv.notes || (isCreditBalance
              ? `Opening FY Overpayment / Advance Credit (${inv.fiscalYearOpening || 'Carryforward'})`
              : `Opening FY Receivable Balance (${inv.fiscalYearOpening || 'Carryforward'})`))
          : (inv.items?.map((it) => it.description).join(', ') || 'Sales Invoice'),
        dueDate: inv.dueDate,
        debit: isCreditBalance ? 0 : inv.totalAmount,
        credit: isCreditBalance ? inv.totalAmount : 0,
        balanceType: inv.balanceType || (isCreditBalance ? 'CR' : 'DR'),
        documentId: inv.id,
        status: inv.status,
      });
    });

    custReceipts.forEach((rct) => {
      if (rct.status === 'VOIDED') return;
      // If this receipt is an opening advance credit and already represented, avoid duplicate counting if attached to an invoice
      const isOpeningAdvance = rct.receiptNumber.startsWith('ADV-OPN-');
      if (isOpeningAdvance && custInvoices.some((i) => i.isOpeningBalance && i.balanceType === 'CR')) {
        return; // Already represented in ledger stream above
      }

      const targetInvs = rct.allocations.map((a) => a.invoiceNumber).join(', ');
      rawTx.push({
        id: `tx-rct-${rct.id}`,
        date: rct.paymentDate,
        type: 'PAYMENT',
        referenceNumber: rct.receiptNumber,
        description: `Payment Receipt via ${rct.paymentMethod}${rct.referenceNumber ? ` (${rct.referenceNumber})` : ''}${targetInvs ? ` - Applied to: ${targetInvs}` : ' (Advance Credit)'}`,
        debit: 0,
        credit: rct.allocatedAmount || rct.totalAmountReceived,
        documentId: rct.id,
        status: rct.status,
        paymentMethod: rct.paymentMethod,
        allocations: rct.allocations,
      });
    });

    // Sort by date ascending
    rawTx.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const priority: Record<string, number> = { OPENING_BALANCE: 1, INVOICE: 2, CREDIT_MEMO: 3, PAYMENT: 4 };
      return (priority[a.type] || 5) - (priority[b.type] || 5);
    });

    let running = 0;
    const transactions: CustomerLedgerTransaction[] = rawTx.map((tx) => {
      running += (tx.debit - tx.credit);
      return {
        ...tx,
        runningBalance: Math.round(running * 100) / 100,
      };
    });

    const standardInvoices = custInvoices.filter((i) => !(i.isOpeningBalance && i.balanceType === 'CR'));
    const totalInvoiced = standardInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = standardInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
    
    // Net balance can be negative (customer has overpaid / credit balance)
    const netBalance = Math.round(running * 100) / 100;
    const isCreditBalance = netBalance < -0.01;
    const netOutstanding = isCreditBalance ? 0 : Math.max(0, netBalance);
    
    // Total advance credits includes unallocated payment credits + opening credit balances
    const unallocatedCredits = custReceipts.reduce((sum, r) => sum + (r.unallocatedCreditAmount || 0), 0);
    const openingCredits = custOpening.filter((o) => o.balanceType === 'CR').reduce((sum, o) => sum + o.originalAmount, 0);
    const totalAdvanceCredits = Math.round((unallocatedCredits + (isCreditBalance ? Math.abs(netBalance) : openingCredits)) * 100) / 100;

    // Aging calculation (as of 2026-08-13 or today)
    const asOfTimestamp = new Date('2026-08-13').getTime();
    let current = 0;
    let days1To30 = 0;
    let days31To60 = 0;
    let days61To90 = 0;
    let days90Plus = 0;
    let overdueAmount = 0;

    standardInvoices.forEach((inv) => {
      const unpaid = inv.totalAmount - inv.amountPaid;
      if (unpaid > 0.001) {
        const dueTimestamp = new Date(inv.dueDate).getTime();
        const diffDays = Math.floor((asOfTimestamp - dueTimestamp) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          current += unpaid;
        } else {
          overdueAmount += unpaid;
          if (diffDays <= 30) days1To30 += unpaid;
          else if (diffDays <= 60) days31To60 += unpaid;
          else if (diffDays <= 90) days61To90 += unpaid;
          else days90Plus += unpaid;
        }
      }
    });

    return {
      customer,
      invoices: custInvoices,
      paymentReceipts: custReceipts,
      openingBalances: custOpening,
      transactions,
      metrics: {
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        netOutstanding: Math.round(netOutstanding * 100) / 100,
        netBalance,
        isCreditBalance,
        totalAdvanceCredits,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        aging: {
          current: Math.round(current * 100) / 100,
          days1To30: Math.round(days1To30 * 100) / 100,
          days31To60: Math.round(days31To60 * 100) / 100,
          days61To90: Math.round(days61To90 * 100) / 100,
          days90Plus: Math.round(days90Plus * 100) / 100,
        },
      },
    };
  };

  return (
    <AccountingContext.Provider
      value={{
        tenants,
        activeTenant,
        activeOrganization,
        activeBranch,
        activeRole,
        userEmail,
        activePlugin,
        setActiveTenantId,
        setActiveOrganizationId: setActiveOrgId,
        setActiveBranchId,
        setActiveRole,
        setUserEmail,
        accounts,
        journalEntries,
        bankStatements,
        fixedAssets,
        auditLogs,
        invoices,
        vendorBills,
        fiscalPeriods,
        treasuryAccounts,
        departmentBudgets,
        approvalItems,
        taxJurisdictions,
        enterpriseUsers,
        customRoles,
        customers,
        vendors,
        customAttributeDefinitions,
        productsServices,
        priceChangeHistory,
        invoiceTemplates,
        bulkInvoiceBatches,
        paymentReceipts,
        openingBalances,

        createCustomer,
        updateCustomer,
        deleteCustomer,
        batchCreateCustomers,
        createVendor,
        updateVendor,
        deleteVendor,
        createCustomAttribute,
        deleteCustomAttribute,
        applyIndustryPresetAttributes,

        createProductService,
        updateProductService,
        updateProductPrice,
        deleteProductService,
        applyIndustryPresetProducts,

        createInvoiceTemplate,
        updateInvoiceTemplate,
        deleteInvoiceTemplate,
        duplicateInvoiceTemplate,
        incrementTemplateUsage,

        batchCreateInvoices,
        rollbackInvoiceBatch,

        recordCustomerPaymentReceipt,
        voidPaymentReceipt,
        recordOpeningBalanceInvoice,
        batchImportOpeningBalances,
        getCustomerStatementData,

        createEnterpriseUser,
        updateUserStatus,
        updateUserRoleAndScopes,
        toggleUserMfa,
        deleteEnterpriseUser,
        hasPermission,

        postJournalEntry,
        reverseJournalEntry,
        batchUploadTransactions,
        createInvoice,
        receiveInvoicePayment,
        createVendorBill,
        payVendorBill,
        toggleFiscalPeriodStatus,
        executeYearEndClose,
        executeSweepTransfer,
        updateDepartmentBudget,
        processApprovalDecision,
        postTaxSettlementVoucher,
        reconcileBankLine,
        importBankStatements,
        autoMatchAndReconcile,
        createAndReconcileGLLine,

        runDepreciationForTenant,
        createTenant,
        createAccount,
        trialBalance,
        balanceSheet,
        incomeStatement,
        statutoryReport,
        cashFlowStatement,
        financialRatios,
        consolidatedFinancials,
        parseCsvOrJsonUpload,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const ctx = useContext(AccountingContext);
  if (!ctx) throw new Error('useAccounting must be used within an AccountingProvider');
  return ctx;
};
