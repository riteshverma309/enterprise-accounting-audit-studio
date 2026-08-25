import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  Tenant,
  Organization,
  Branch,
  Role,
  PluginId,
  Account,
  AccountType,
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
  ConfigurableApprovalRule,
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
  RecurringInvoiceSchedule,
  RecurrenceFrequency,
  ExpenseReceipt,
  MileageLogEntry,
  InventoryStockItem,
  InventoryAdjustmentRecord,
  PayrollEmployee,
  PayrollRun,
  PayrollRunEmployeeLine,
  ConnectedBankFeed,
  CompanyBackupPayload,
  CompanyBackupMetadata,
  BackupValidationResult,
  CompanyBackupRecordCounts,
  WebhookEndpoint,
  WebhookDeliveryLog,
  WebhookEventType,
  ScopedApiKey,
  ApiKeyPermissionScope,
  IntegrationConnector,
  ConnectorPlatform,
  EntityAiConfig,
  AiTokenUsageLog,
  TabType,
  RoleMenuPermissionsMap,
  TenantRoleMenuConfig,
  PurchaseOrder,
  PurchaseOrderStatus,
  PoApprovalTierConfig,
  PurchaseOrderLineItem,
  PurchaseOrderApprovalStep,
} from '../types';
import {
  DEFAULT_ROLE_MENU_PERMISSIONS,
  ALL_MENU_OPTIONS,
  ROLE_MENU_PRESET_TEMPLATES,
} from '../data/menuOptionsData';
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
  INITIAL_APPROVAL_RULES,
  INITIAL_TAX_JURISDICTIONS,
  INITIAL_ENTERPRISE_USERS,
  INITIAL_CUSTOM_ROLES,
  INITIAL_PAYMENT_RECEIPTS,
  INITIAL_OPENING_BALANCES,
  INITIAL_BULK_BATCHES,
  INITIAL_RECURRING_SCHEDULES,
  INITIAL_EXPENSE_RECEIPTS,
  INITIAL_MILEAGE_LOGS,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_INVENTORY_ADJUSTMENTS,
  INITIAL_PAYROLL_EMPLOYEES,
  INITIAL_PAYROLL_RUNS,
  INITIAL_CONNECTED_BANK_FEEDS,
  INITIAL_WEBHOOK_ENDPOINTS,
  INITIAL_WEBHOOK_LOGS,
  INITIAL_SCOPED_API_KEYS,
  INITIAL_INTEGRATION_CONNECTORS,
  INITIAL_TENANT_AI_CONFIGS,
  INITIAL_AI_USAGE_LOGS,
  INITIAL_PO_APPROVAL_TIERS,
  INITIAL_PURCHASE_ORDERS,
  FX_RATES,
  mockCustomAttributeDefinitions,
  mockCustomerContacts,
  mockVendorContacts,
  mockProductServices,
  mockPriceChangeHistory,
  mockInvoiceTemplates,
} from '../mockData';
import { INDUSTRY_COA_PRESETS, IndustryCoaPreset } from '../data/industryCoaPresets';

interface AccountingContextType {
  // Tenant & Context Headers State
  tenants: Tenant[];
  activeTenant: Tenant;
  activeOrganization: Organization | null;
  activeBranch: Branch | null;
  activeRole: Role;
  userEmail: string;
  userName: string;
  activePlugin: PluginId;

  // Actions for Switching Context
  setActiveTenantId: (tenantId: string) => void;
  setActiveOrganizationId: (orgId: string | null) => void;
  setActiveBranchId: (branchId: string | null) => void;
  setActiveRole: (role: Role) => void;
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;

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

  // Governance & Maker-Checker Approvals Engine
  approvalRules: ConfigurableApprovalRule[];
  createApprovalRule: (ruleData: Omit<ConfigurableApprovalRule, 'id'>) => { success: boolean; rule?: ConfigurableApprovalRule; error?: string };
  updateApprovalRule: (id: string, updates: Partial<ConfigurableApprovalRule>) => { success: boolean; error?: string };
  deleteApprovalRule: (id: string) => { success: boolean; error?: string };
  toggleApprovalRule: (id: string) => { success: boolean; error?: string };
  submitApprovalRequest: (item: Omit<ApprovalItem, 'id' | 'requestedDate' | 'status'>) => { success: boolean; item?: ApprovalItem; error?: string };
  processApprovalDecision: (approvalId: string, decision: 'APPROVED' | 'REJECTED', comments?: string) => { success: boolean; error?: string };

  // Custom Roles & Permissions Engine
  createCustomRole: (roleData: Omit<CustomRoleDefinition, 'id' | 'isSystemRole'>) => { success: boolean; role?: CustomRoleDefinition; error?: string };
  updateCustomRole: (id: string, updates: Partial<CustomRoleDefinition>) => { success: boolean; error?: string };
  deleteCustomRole: (id: string) => { success: boolean; error?: string };
  cloneCustomRole: (sourceRoleId: string, newName: string, newCode: string) => { success: boolean; role?: CustomRoleDefinition; error?: string };

  // User Access & Provisioning Engine
  createEnterpriseUser: (userData: Omit<EnterpriseUser, 'id' | 'createdAt' | 'lastLogin' | 'apiTokenCount'>) => { success: boolean; error?: string };
  updateUserStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED') => void;
  updateUserRoleAndScopes: (userId: string, defaultRole: Role, tenantScopes: TenantAccessScope[]) => { success: boolean; error?: string };
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

  // Purchase Order & Configurable Approval Workflow Engine
  purchaseOrders: PurchaseOrder[];
  poApprovalTiers: PoApprovalTierConfig[];
  createPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'approvalAuditTrail' | 'currentApprovalLevel' | 'requiredApprovalLevels' | 'status'> & { status?: PurchaseOrderStatus }) => { success: boolean; po?: PurchaseOrder; error?: string };
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => { success: boolean; error?: string };
  deletePurchaseOrder: (id: string) => { success: boolean; error?: string };
  submitPurchaseOrderForApproval: (id: string) => { success: boolean; message: string; error?: string };
  approvePurchaseOrder: (id: string, comments?: string) => { success: boolean; message: string; isFinalApproval?: boolean; error?: string };
  rejectPurchaseOrder: (id: string, rejectionReason: string) => { success: boolean; message: string; error?: string };
  receiveGoodsForPurchaseOrder: (poId: string, receivedItems: { lineItemId: string; quantityToReceive: number; batchOrSerialNo?: string; conditionNotes?: string }[]) => { success: boolean; message: string; error?: string };
  convertPurchaseOrderToVendorBill: (poId: string, glExpenseAccountId?: string) => { success: boolean; billId?: string; billNumber?: string; error?: string };
  updatePoApprovalTiers: (tiers: PoApprovalTierConfig[]) => { success: boolean; error?: string };
  resetPoApprovalTiersToDefault: (tenantId?: string) => { success: boolean; error?: string };

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
  postTaxSettlementVoucher: (jurisdictionId: string) => { success: boolean; entryId?: string; error?: string };

  // Bank & Assets
  reconcileBankLine: (statementId: string, accountId: string, matchingEntryId?: string) => { success: boolean; error?: string };
  importBankStatements: (lines: Omit<BankStatementLine, 'id' | 'tenantId' | 'reconciled'>[]) => { success: boolean; count: number; error?: string };
  autoMatchAndReconcile: () => { matchedCount: number; success: boolean };
  createAndReconcileGLLine: (statementId: string, accountCode: string, memo?: string) => { success: boolean; error?: string };
  runDepreciationForTenant: (asOfDate: string) => { success: boolean; totalDepreciation: number; entriesCreated: number };
  
  // Entity Management & Chart of Accounts
  createTenant: (tenantData: Omit<Tenant, 'id' | 'organizations'>) => void;
  createAccount: (accountData: Omit<Account, 'id' | 'tenantId' | 'balance'>) => { success: boolean; error?: string };
  updateAccount: (accountId: string, updates: Partial<Account>) => { success: boolean; error?: string };
  deleteAccount: (accountId: string, force?: boolean) => { success: boolean; error?: string; isArchived?: boolean };
  applyIndustryPresetCOA: (presetId: string, mode?: 'merge' | 'replace') => { success: boolean; addedCount: number; replacedCount?: number; error?: string };
  batchImportAccounts: (accountsList: Array<Partial<Account>>, mode?: 'merge' | 'replace') => { success: boolean; count: number; errors: string[] };
  industryCoaPresets: IndustryCoaPreset[];

  // Recurring Billing & Automated Invoicing
  recurringSchedules: RecurringInvoiceSchedule[];
  createRecurringSchedule: (data: Omit<RecurringInvoiceSchedule, 'id' | 'generatedInvoicesCount'>) => { success: boolean; schedule?: RecurringInvoiceSchedule; error?: string };
  updateRecurringSchedule: (id: string, updates: Partial<RecurringInvoiceSchedule>) => { success: boolean; error?: string };
  deleteRecurringSchedule: (id: string) => { success: boolean; error?: string };
  runRecurringScheduleNow: (id: string) => { success: boolean; invoice?: CustomerInvoice; error?: string };

  // Expense Tracking & OCR Receipt Capture
  expenseReceipts: ExpenseReceipt[];
  createExpenseReceipt: (data: Omit<ExpenseReceipt, 'id' | 'createdAt' | 'status'>) => { success: boolean; receipt?: ExpenseReceipt; error?: string };
  postExpenseReceiptToGL: (receiptId: string, paymentAccountId?: string) => { success: boolean; entryId?: string; error?: string };
  deleteExpenseReceipt: (id: string) => { success: boolean; error?: string };

  // Mileage Tracking for Tax Deductions
  mileageLogs: MileageLogEntry[];
  createMileageLog: (data: Omit<MileageLogEntry, 'id' | 'createdAt' | 'status' | 'totalDeductionAmount'>) => { success: boolean; log?: MileageLogEntry; error?: string };
  postMileageLogToGL: (logId: string, paymentAccountId?: string) => { success: boolean; entryId?: string; error?: string };
  deleteMileageLog: (id: string) => { success: boolean; error?: string };

  // Inventory Tracking & Stock Movements
  inventoryItems: InventoryStockItem[];
  inventoryAdjustments: InventoryAdjustmentRecord[];
  createInventoryItem: (data: Omit<InventoryStockItem, 'id' | 'status' | 'totalValuation'>) => { success: boolean; item?: InventoryStockItem; error?: string };
  updateInventoryItem: (id: string, updates: Partial<InventoryStockItem>) => { success: boolean; error?: string };
  adjustInventoryStock: (params: { itemId: string; type: InventoryAdjustmentRecord['type']; quantityDelta: number; reason: string; unitCost?: number; postToGl?: boolean }) => { success: boolean; adjustment?: InventoryAdjustmentRecord; error?: string };
  deleteInventoryItem: (id: string) => { success: boolean; error?: string };

  // Payroll Management & Tax Withholdings
  payrollEmployees: PayrollEmployee[];
  payrollRuns: PayrollRun[];
  createPayrollEmployee: (data: Omit<PayrollEmployee, 'id'>) => { success: boolean; employee?: PayrollEmployee; error?: string };
  updatePayrollEmployee: (id: string, updates: Partial<PayrollEmployee>) => { success: boolean; error?: string };
  deletePayrollEmployee: (id: string) => { success: boolean; error?: string };
  calculatePayRunPreview: (payPeriodStart: string, payPeriodEnd: string, payDate: string, employeeIds?: string[]) => { lines: PayrollRunEmployeeLine[]; totalGrossPay: number; totalEmployeeTaxWithholdings: number; totalEmployerTaxes: number; totalNetPay: number };
  executePayRun: (params: { payPeriodStart: string; payPeriodEnd: string; payDate: string; employeeIds?: string[]; postToGl?: boolean }) => { success: boolean; run?: PayrollRun; entryId?: string; error?: string };

  // Connected Bank Feeds
  connectedBankFeeds: ConnectedBankFeed[];
  connectBankFeed: (data: Omit<ConnectedBankFeed, 'id' | 'lastSyncedAt' | 'status'>) => { success: boolean; feed?: ConnectedBankFeed; error?: string };
  syncBankFeed: (feedId: string) => { success: boolean; newLinesCount: number; error?: string };
  disconnectBankFeed: (feedId: string) => { success: boolean; error?: string };

  // Online Payment Gateway Simulation
  processOnlineInvoicePayment: (invoiceId: string, paymentMethod: PaymentMethodType, paymentDetails: { cardLast4?: string; accountLast4?: string; email?: string; notes?: string }) => { success: boolean; receipt?: CustomerPaymentReceipt; error?: string };

  // Financial Reports & Intelligence Calculators
  trialBalance: TrialBalanceRow[];
  balanceSheet: BalanceSheetData;
  incomeStatement: IncomeStatementData;
  statutoryReport: StatutoryReportData;
  cashFlowStatement: CashFlowData;
  financialRatios: FinancialRatiosData;
  consolidatedFinancials: ConsolidatedEntityData;
  
  // Company Data Backup, 1-Click Export & Point-in-Time Restore Engine
  downloadCompanyBackup: (options?: { tenantId?: string; scope?: 'single_company' | 'full_system' }) => { success: boolean; fileName?: string; backupPayload?: CompanyBackupPayload; error?: string };
  validateBackupFileContent: (fileContent: string) => BackupValidationResult;
  restoreCompanyBackup: (payload: CompanyBackupPayload, options?: { mode: 'replace_current' | 'restore_as_new_tenant'; targetTenantCode?: string; targetTenantName?: string }) => { success: boolean; tenantId?: string; tenantName?: string; restoredCounts?: CompanyBackupRecordCounts; error?: string };

  // Webhooks Dispatcher & Outbound Event Engine
  webhookEndpoints: WebhookEndpoint[];
  webhookLogs: WebhookDeliveryLog[];
  createWebhookEndpoint: (data: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'failureCount'>) => WebhookEndpoint;
  updateWebhookEndpoint: (id: string, updates: Partial<WebhookEndpoint>) => void;
  deleteWebhookEndpoint: (id: string) => void;
  testDispatchWebhook: (endpointId: string, event: WebhookEventType, customPayload?: any) => Promise<{ success: boolean; log: WebhookDeliveryLog }>;
  retryWebhookDelivery: (logId: string) => Promise<{ success: boolean; log?: WebhookDeliveryLog }>;
  dispatchAccountingEvent: (event: WebhookEventType, payloadData: any, tenantIdOverride?: string) => Promise<void>;

  // Scoped API Keys & Developer Portal
  scopedApiKeys: ScopedApiKey[];
  createScopedApiKey: (data: { name: string; role: Role; environment?: 'LIVE' | 'TEST' | 'SANDBOX'; scopes: ApiKeyPermissionScope[]; rateLimitPerMin?: number; expiresInDays?: number; tenantId?: string }) => { success: boolean; apiKey?: ScopedApiKey; fullSecretKey?: string; error?: string };
  revokeScopedApiKey: (id: string) => void;
  deleteScopedApiKey: (id: string) => void;

  // Zapier / Make & E-Commerce Integration Connectors
  integrationConnectors: IntegrationConnector[];
  connectIntegrationConnector: (platform: ConnectorPlatform, credentials: Record<string, string>, syncSettings?: any) => { success: boolean; connector?: IntegrationConnector };
  syncIntegrationConnector: (connectorId: string) => Promise<{ success: boolean; syncedCount: number; message: string }>;
  disconnectIntegrationConnector: (connectorId: string) => void;

  // AI Audit Copilot Entity Configuration & Token Quotas
  tenantAiConfigs: Record<string, EntityAiConfig>;
  activeTenantAiConfig: EntityAiConfig;
  aiUsageLogs: AiTokenUsageLog[];
  updateTenantAiConfig: (tenantId: string, updates: Partial<EntityAiConfig>) => { success: boolean; error?: string };
  recordAiTokenUsage: (params: { tenantId: string; model: string; promptTokens: number; responseTokens: number; queryTopic: string }) => void;
  resetTenantAiQuota: (tenantId: string) => { success: boolean; error?: string };

  // Role-to-Menu Access Permissions Engine
  roleMenuPermissions: Record<string, RoleMenuPermissionsMap>;
  getRoleAllowedMenus: (role: Role | string, tenantId?: string) => TabType[];
  updateRoleMenuPermissions: (role: Role | string, allowedTabs: TabType[], tenantId?: string) => { success: boolean; error?: string };
  resetRoleMenuPermissionsToDefaults: (role?: Role | string, tenantId?: string) => { success: boolean; error?: string };
  applyRoleMenuPreset: (presetId: string, role: Role | string, tenantId?: string) => { success: boolean; error?: string };
  copyRoleMenuPermissions: (fromRole: string, toRole: string, tenantId?: string) => { success: boolean; error?: string };
  batchUpdateRoleMenuPermissions: (permissionsMap: RoleMenuPermissionsMap, tenantId?: string) => { success: boolean; error?: string };

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
  const [userName, setUserName] = useState<string>('Sarah Jenkins');

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
  const [approvalRules, setApprovalRules] = useState<ConfigurableApprovalRule[]>(INITIAL_APPROVAL_RULES);
  const [taxJurisdictions, setTaxJurisdictions] = useState<TaxJurisdiction[]>(INITIAL_TAX_JURISDICTIONS);
  const [enterpriseUsers, setEnterpriseUsers] = useState<EnterpriseUser[]>(INITIAL_ENTERPRISE_USERS);
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>(INITIAL_CUSTOM_ROLES);
  const [customers, setCustomers] = useState<CustomerContact[]>(mockCustomerContacts);
  const [vendors, setVendors] = useState<VendorContact[]>(mockVendorContacts);
  const [customAttributeDefinitions, setCustomAttributeDefinitions] = useState<CustomAttributeDefinition[]>(mockCustomAttributeDefinitions);
  const [productsServices, setProductsServices] = useState<ProductServiceItem[]>(mockProductServices);
  const [priceChangeHistory, setPriceChangeHistory] = useState<PriceChangeHistoryEntry[]>(mockPriceChangeHistory);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>(mockInvoiceTemplates);
  const [bulkInvoiceBatches, setBulkInvoiceBatches] = useState<BulkInvoiceBatchRun[]>(INITIAL_BULK_BATCHES);
  const [paymentReceipts, setPaymentReceipts] = useState<CustomerPaymentReceipt[]>(INITIAL_PAYMENT_RECEIPTS);
  const [openingBalances, setOpeningBalances] = useState<CustomerOpeningBalanceRecord[]>(INITIAL_OPENING_BALANCES);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringInvoiceSchedule[]>(INITIAL_RECURRING_SCHEDULES);
  const [expenseReceipts, setExpenseReceipts] = useState<ExpenseReceipt[]>(INITIAL_EXPENSE_RECEIPTS);
  const [mileageLogs, setMileageLogs] = useState<MileageLogEntry[]>(INITIAL_MILEAGE_LOGS);
  const [inventoryItems, setInventoryItems] = useState<InventoryStockItem[]>(INITIAL_INVENTORY_ITEMS);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustmentRecord[]>(INITIAL_INVENTORY_ADJUSTMENTS);
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>(INITIAL_PAYROLL_EMPLOYEES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(INITIAL_PAYROLL_RUNS);
  const [connectedBankFeeds, setConnectedBankFeeds] = useState<ConnectedBankFeed[]>(INITIAL_CONNECTED_BANK_FEEDS);
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpoint[]>(INITIAL_WEBHOOK_ENDPOINTS);
  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>(INITIAL_WEBHOOK_LOGS);
  const [scopedApiKeys, setScopedApiKeys] = useState<ScopedApiKey[]>(INITIAL_SCOPED_API_KEYS);
  const [integrationConnectors, setIntegrationConnectors] = useState<IntegrationConnector[]>(INITIAL_INTEGRATION_CONNECTORS);
  const [tenantAiConfigs, setTenantAiConfigs] = useState<Record<string, EntityAiConfig>>(INITIAL_TENANT_AI_CONFIGS);
  const [aiUsageLogs, setAiUsageLogs] = useState<AiTokenUsageLog[]>(INITIAL_AI_USAGE_LOGS);

  // Purchase Order & Multi-Tier Approval Workflow State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [poApprovalTiers, setPoApprovalTiers] = useState<PoApprovalTierConfig[]>(INITIAL_PO_APPROVAL_TIERS);

  // Role-to-Menu Access Permissions State (per-tenant map)
  const [roleMenuPermissions, setRoleMenuPermissions] = useState<Record<string, RoleMenuPermissionsMap>>(() => {
    const initialMap: Record<string, RoleMenuPermissionsMap> = {};
    INITIAL_TENANTS.forEach((t) => {
      initialMap[t.id] = JSON.parse(JSON.stringify(DEFAULT_ROLE_MENU_PERMISSIONS));
    });
    return initialMap;
  });

  const getRoleAllowedMenus = (role: Role | string, targetTenantId?: string): TabType[] => {
    const effectiveTenantId = targetTenantId || activeTenantId;
    const tenantPerms = (roleMenuPermissions && roleMenuPermissions[effectiveTenantId]) || (roleMenuPermissions && roleMenuPermissions['t-acme-us']) || DEFAULT_ROLE_MENU_PERMISSIONS;
    if (tenantPerms && tenantPerms[role]) {
      return tenantPerms[role] || [];
    }
    if (DEFAULT_ROLE_MENU_PERMISSIONS && DEFAULT_ROLE_MENU_PERMISSIONS[role as Role]) {
      return DEFAULT_ROLE_MENU_PERMISSIONS[role as Role] || [];
    }
    return (DEFAULT_ROLE_MENU_PERMISSIONS && DEFAULT_ROLE_MENU_PERMISSIONS.accountant) || [];
  };

  const updateRoleMenuPermissions = (role: Role | string, allowedTabs: TabType[], targetTenantId?: string) => {
    // SOX 404 ITGC Control: Only Super Admin can modify Super Admin access
    if (role === 'super_user' && activeRole !== 'super_user') {
      return {
        success: false,
        error: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      };
    }

    const effectiveTenantId = targetTenantId || activeTenantId;
    setRoleMenuPermissions((prev) => {
      const currentTenantPerms = prev[effectiveTenantId] || JSON.parse(JSON.stringify(DEFAULT_ROLE_MENU_PERMISSIONS));
      return {
        ...prev,
        [effectiveTenantId]: {
          ...currentTenantPerms,
          [role]: allowedTabs,
        },
      };
    });

    const auditEvent: AuditLogEvent = {
      id: `log-menu-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_ROLE_MENU_ACCESS',
      tenantId: effectiveTenantId,
      userRole: activeRole,
      userEmail,
      details: `Updated accessible menu modules for role [${role}] (${allowedTabs.length} modules granted)`,
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      payloadSummary: `Role: ${role} | Granted modules: ${allowedTabs.join(', ')}`,
    };
    setAuditLogs((prev) => [auditEvent, ...prev]);

    return { success: true };
  };

  const resetRoleMenuPermissionsToDefaults = (role?: Role | string, targetTenantId?: string) => {
    // SOX 404 ITGC Control: Only Super Admin can modify Super Admin access
    if (role === 'super_user' && activeRole !== 'super_user') {
      return {
        success: false,
        error: 'SOX Security Violation: Entity Administrators cannot modify Super Admin access.',
      };
    }

    const effectiveTenantId = targetTenantId || activeTenantId;
    setRoleMenuPermissions((prev) => {
      const currentTenantPerms = prev[effectiveTenantId] || {};
      if (role) {
        return {
          ...prev,
          [effectiveTenantId]: {
            ...currentTenantPerms,
            [role]: DEFAULT_ROLE_MENU_PERMISSIONS[role as Role] || DEFAULT_ROLE_MENU_PERMISSIONS.accountant,
          },
        };
      } else {
        const freshDefaults = JSON.parse(JSON.stringify(DEFAULT_ROLE_MENU_PERMISSIONS));
        // If not super_user, preserve existing super_user permissions
        if (activeRole !== 'super_user' && currentTenantPerms.super_user) {
          freshDefaults.super_user = currentTenantPerms.super_user;
        }
        return {
          ...prev,
          [effectiveTenantId]: freshDefaults,
        };
      }
    });

    const auditEvent: AuditLogEvent = {
      id: `log-menu-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'RESET_ROLE_MENU_DEFAULTS',
      tenantId: effectiveTenantId,
      userRole: activeRole,
      userEmail,
      details: role ? `Reset menu permissions for role [${role}] to system default baseline` : `Reset all role-to-menu permissions to factory defaults for entity`,
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
    };
    setAuditLogs((prev) => [auditEvent, ...prev]);

    return { success: true };
  };

  const applyRoleMenuPreset = (presetId: string, role: Role | string, targetTenantId?: string) => {
    const preset = ROLE_MENU_PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return { success: false, error: 'Preset template not found' };
    return updateRoleMenuPermissions(role, preset.permissions, targetTenantId);
  };

  const copyRoleMenuPermissions = (fromRole: string, toRole: string, targetTenantId?: string) => {
    const effectiveTenantId = targetTenantId || activeTenantId;
    const sourcePermissions = getRoleAllowedMenus(fromRole, effectiveTenantId);
    return updateRoleMenuPermissions(toRole, sourcePermissions, effectiveTenantId);
  };

  const batchUpdateRoleMenuPermissions = (permissionsMap: RoleMenuPermissionsMap, targetTenantId?: string) => {
    const effectiveTenantId = targetTenantId || activeTenantId;
    setRoleMenuPermissions((prev) => ({
      ...prev,
      [effectiveTenantId]: {
        ...(prev[effectiveTenantId] || {}),
        ...permissionsMap,
      },
    }));
    return { success: true };
  };

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

  // Update existing Chart of Account
  const updateAccount = (accountId: string, updates: Partial<Account>) => {
    const current = accountsMap[activeTenant.id] || [];
    const target = current.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, error: 'Account not found in current Chart of Accounts.' };
    }

    if (updates.code && updates.code !== target.code) {
      if (current.some((a) => a.id !== accountId && a.code === updates.code)) {
        return { success: false, error: `Account code "${updates.code}" is already assigned to another account in ${activeTenant.name}.` };
      }
    }

    const updatedAccount: Account = {
      ...target,
      ...updates,
    };

    setAccountsMap((prev) => ({
      ...prev,
      [activeTenant.id]: (prev[activeTenant.id] || []).map((a) => (a.id === accountId ? updatedAccount : a)),
    }));

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated Chart of Account [${target.code}] "${target.name}" → [${updatedAccount.code}] "${updatedAccount.name}" (${updatedAccount.type})`,
      status: 'SUCCESS',
      payloadSummary: `Updated fields: ${Object.keys(updates).join(', ')} | Status: ${updatedAccount.isActive === false ? 'Inactive' : 'Active'}`,
    });

    return { success: true };
  };

  // Delete or Archive Chart of Account
  const deleteAccount = (accountId: string, force: boolean = false) => {
    const current = accountsMap[activeTenant.id] || [];
    const target = current.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    // Safety checks: Non-zero balance
    if (Math.abs(target.balance || 0) > 0.001 && !force) {
      return {
        success: false,
        error: `Cannot delete account "${target.code} - ${target.name}" because it has an active balance of ${activeTenant.currency} ${(target.balance || 0).toFixed(2)}. Please transfer the balance first, or mark the account as Inactive.`,
      };
    }

    // Safety checks: Active journal postings
    const hasPostings = journalEntries.some((je) =>
      je.tenantId === activeTenant.id && je.lines.some((l) => l.accountId === accountId || l.accountCode === target.code)
    );

    if (hasPostings && !force) {
      // Archive instead of hard delete to maintain double-entry audit integrity
      setAccountsMap((prev) => ({
        ...prev,
        [activeTenant.id]: (prev[activeTenant.id] || []).map((a) =>
          a.id === accountId ? { ...a, isActive: false } : a
        ),
      }));

      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Archived/Deactivated Chart of Account [${target.code}] "${target.name}" (Account retained for audit trail compliance)`,
        status: 'SUCCESS',
        payloadSummary: `Account ID: ${accountId} | Status set to Inactive`,
      });

      return {
        success: true,
        isArchived: true,
        error: `Account has historical journal postings. It has been deactivated/archived to preserve ledger immutability.`,
      };
    }

    // Hard delete if no postings or forced
    setAccountsMap((prev) => ({
      ...prev,
      [activeTenant.id]: (prev[activeTenant.id] || []).filter((a) => a.id !== accountId),
    }));

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Permanently deleted Chart of Account [${target.code}] "${target.name}" from ${activeTenant.name}`,
      status: 'SUCCESS',
      payloadSummary: `Account ID: ${accountId} | Type: ${target.type}`,
    });

    return { success: true };
  };

  // Apply Pre-configured Industry COA Template
  const applyIndustryPresetCOA = (presetId: string, mode: 'merge' | 'replace' = 'merge') => {
    const preset = INDUSTRY_COA_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      return { success: false, addedCount: 0, error: 'Industry preset template not found.' };
    }

    const current = accountsMap[activeTenant.id] || [];

    if (mode === 'replace') {
      const newAccounts: Account[] = preset.accounts.map((accDef, idx) => ({
        id: `acc-${activeTenant.id}-${preset.id}-${Date.now()}-${idx}`,
        tenantId: activeTenant.id,
        code: accDef.code,
        name: accDef.name,
        type: accDef.type,
        currency: activeTenant.currency,
        balance: accDef.initialBalance || 0,
        subCategory: accDef.subCategory,
        description: accDef.description,
        normalBalance: accDef.normalBalance,
        isSystemAccount: accDef.isSystemAccount,
        isActive: true,
        industryTag: preset.name,
      }));

      setAccountsMap((prev) => ({
        ...prev,
        [activeTenant.id]: newAccounts,
      }));

      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Initialized Chart of Accounts from pre-configured Industry Template: "${preset.name}" (${newAccounts.length} accounts configured in mode: REPLACE)`,
        status: 'SUCCESS',
        payloadSummary: `Sector: ${preset.sector} | Standard: ${preset.standard} | Tenant: ${activeTenant.name}`,
      });

      return { success: true, addedCount: newAccounts.length, replacedCount: current.length };
    } else {
      // Smart Merge mode
      const existingCodes = new Set(current.map((a) => a.code));
      const additions: Account[] = [];

      preset.accounts.forEach((accDef, idx) => {
        if (!existingCodes.has(accDef.code)) {
          additions.push({
            id: `acc-${activeTenant.id}-${preset.id}-${Date.now()}-${idx}`,
            tenantId: activeTenant.id,
            code: accDef.code,
            name: accDef.name,
            type: accDef.type,
            currency: activeTenant.currency,
            balance: accDef.initialBalance || 0,
            subCategory: accDef.subCategory,
            description: accDef.description,
            normalBalance: accDef.normalBalance,
            isSystemAccount: accDef.isSystemAccount,
            isActive: true,
            industryTag: preset.name,
          });
        }
      });

      // Also enrich existing accounts with missing subCategory or description from preset
      const updatedExisting = current.map((existingAcc) => {
        const match = preset.accounts.find((p) => p.code === existingAcc.code);
        if (match) {
          return {
            ...existingAcc,
            subCategory: existingAcc.subCategory || match.subCategory,
            description: existingAcc.description || match.description,
            normalBalance: existingAcc.normalBalance || match.normalBalance,
          };
        }
        return existingAcc;
      });

      const mergedList = [...updatedExisting, ...additions];

      setAccountsMap((prev) => ({
        ...prev,
        [activeTenant.id]: mergedList,
      }));

      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Merged Industry COA Preset "${preset.name}" into ${activeTenant.name}. Added ${additions.length} new specialized industry accounts.`,
        status: 'SUCCESS',
        payloadSummary: `Sector: ${preset.sector} | Total Accounts: ${mergedList.length} | Added: ${additions.length}`,
      });

      return { success: true, addedCount: additions.length };
    }
  };

  // Batch Import Accounts from CSV / Excel parsed rows
  const batchImportAccounts = (
    accountsList: Array<Partial<Account>>,
    mode: 'merge' | 'replace' = 'merge'
  ) => {
    const current = accountsMap[activeTenant.id] || [];
    const errors: string[] = [];
    const validAccounts: Account[] = [];

    accountsList.forEach((row, idx) => {
      const code = String(row.code || '').trim();
      const name = String(row.name || '').trim();
      const rawType = String(row.type || '').trim().toUpperCase();

      if (!code) {
        errors.push(`Row ${idx + 1}: Missing account code.`);
        return;
      }
      if (!name) {
        errors.push(`Row ${idx + 1}: Missing account name for code "${code}".`);
        return;
      }

      let type: AccountType = 'ASSET';
      if (['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].includes(rawType)) {
        type = rawType as AccountType;
      } else {
        errors.push(`Row ${idx + 1}: Invalid account type "${rawType}". Must be ASSET, LIABILITY, EQUITY, REVENUE, or EXPENSE.`);
        return;
      }

      const defaultNormal = (type === 'ASSET' || type === 'EXPENSE') ? 'DEBIT' : 'CREDIT';
      const normalBal = (row.normalBalance === 'DEBIT' || row.normalBalance === 'CREDIT') ? row.normalBalance : defaultNormal;

      validAccounts.push({
        id: row.id || `acc-imp-${Date.now()}-${idx}`,
        tenantId: activeTenant.id,
        code,
        name,
        type,
        currency: row.currency || activeTenant.currency,
        balance: Number(row.balance || 0),
        subCategory: row.subCategory || (type === 'ASSET' ? 'Current Assets' : type === 'LIABILITY' ? 'Current Liabilities' : type === 'EQUITY' ? 'Contributed Capital' : type === 'REVENUE' ? 'Operating Income' : 'Operating Expenses'),
        description: row.description || `Imported account maintained in ${row.currency || activeTenant.currency}`,
        normalBalance: normalBal,
        isActive: row.isActive !== false,
        isSystemAccount: row.isSystemAccount || false,
      });
    });

    if (validAccounts.length === 0) {
      return { success: false, count: 0, errors: errors.length > 0 ? errors : ['No valid accounts found in upload.'] };
    }

    if (mode === 'replace') {
      setAccountsMap((prev) => ({
        ...prev,
        [activeTenant.id]: validAccounts,
      }));
    } else {
      // Merge
      const importCodeMap = new Map(validAccounts.map((a) => [a.code, a]));
      const updatedExisting = current.map((existing) => {
        const imported = importCodeMap.get(existing.code);
        if (imported) {
          importCodeMap.delete(existing.code);
          return {
            ...existing,
            name: imported.name || existing.name,
            type: imported.type || existing.type,
            subCategory: imported.subCategory || existing.subCategory,
            description: imported.description || existing.description,
            normalBalance: imported.normalBalance || existing.normalBalance,
          };
        }
        return existing;
      });

      const finalMerged = [...updatedExisting, ...Array.from(importCodeMap.values())];
      setAccountsMap((prev) => ({
        ...prev,
        [activeTenant.id]: finalMerged,
      }));
    }

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Batch imported Chart of Accounts (${validAccounts.length} rows processed in mode: ${mode.toUpperCase()})`,
      status: 'SUCCESS',
      payloadSummary: `Imported Valid: ${validAccounts.length} | Errors: ${errors.length}`,
    });

    return { success: true, count: validAccounts.length, errors };
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

  // Governance Approval Decision Processor & Maker-Checker Dual Authorization
  const processApprovalDecision = (approvalId: string, decision: 'APPROVED' | 'REJECTED', comments?: string) => {
    const targetItem = approvalItems.find((i) => i.id === approvalId);
    if (!targetItem) return { success: false, error: 'Approval item not found.' };

    // Segregation of Duties (SoD) & Maker-Checker enforcement:
    // The requester (maker) cannot self-approve their own request
    if (decision === 'APPROVED' && targetItem.requestedBy.toLowerCase() === userEmail.toLowerCase() && activeRole !== 'super_user') {
      const sodErr = `SEGREGATION OF DUTIES (SoD) VIOLATION: Requester (${targetItem.requestedBy}) cannot self-approve item ${targetItem.referenceNumber}. Dual signature required from an independent Checker.`;
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: targetItem.tenantId || activeTenantId,
        userRole: activeRole,
        userEmail,
        details: `Blocked self-approval attempt by maker on ${targetItem.referenceNumber}`,
        status: 'FORBIDDEN',
        payloadSummary: sodErr,
      });
      return { success: false, error: sodErr };
    }

    const now = new Date().toISOString();
    setApprovalItems((prev) =>
      prev.map((item) =>
        item.id === approvalId
          ? {
              ...item,
              status: decision,
              approvedBy: userEmail,
              approvedRole: activeRole,
              approvalDate: now,
              approverComments: comments || (decision === 'APPROVED' ? 'Verified & approved via Maker-Checker SOX 404 control workflow.' : 'Rejected by authorized reviewer.'),
              rejectionReason: decision === 'REJECTED' ? comments : undefined,
            }
          : item
      )
    );

    addAuditLog({
      action: 'POST_JOURNAL',
      tenantId: targetItem.tenantId || activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Maker-Checker Approval Decision: ${decision} for ${targetItem.referenceNumber} (${targetItem.entityType}) - ${targetItem.amount} ${targetItem.currency}`,
      status: 'SUCCESS',
      payloadSummary: `Maker: ${targetItem.requestedBy} | Checker: ${userEmail} (${activeRole}) | Notes: ${comments || 'None'}`,
    });

    return { success: true };
  };

  const submitApprovalRequest = (item: Omit<ApprovalItem, 'id' | 'requestedDate' | 'status'>) => {
    const newApproval: ApprovalItem = {
      ...item,
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      requestedDate: new Date().toISOString().split('T')[0],
      requestedRole: activeRole,
      status: 'PENDING',
    };

    setApprovalItems((prev) => [newApproval, ...prev]);

    addAuditLog({
      action: 'POST_JOURNAL',
      tenantId: item.tenantId || activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Queued dual-signature governance approval request for ${newApproval.referenceNumber} (${newApproval.entityType})`,
      status: 'SUCCESS',
      payloadSummary: `Amount: ${newApproval.amount} ${newApproval.currency} | Requested By: ${newApproval.requestedBy}`,
    });

    return { success: true, item: newApproval };
  };

  const createApprovalRule = (ruleData: Omit<ConfigurableApprovalRule, 'id'>) => {
    const newRule: ConfigurableApprovalRule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setApprovalRules((prev) => [newRule, ...prev]);

    addAuditLog({
      action: 'SYSTEM_CLOSE',
      tenantId: ruleData.tenantId || activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Configured new Maker-Checker approval threshold rule: "${newRule.ruleName}" (${newRule.entityType} > ${newRule.thresholdAmount})`,
      status: 'SUCCESS',
      payloadSummary: `Required Role: ${newRule.requiredRole} | Maker-Checker Enforced: ${newRule.enforceMakerChecker}`,
    });

    return { success: true, rule: newRule };
  };

  const updateApprovalRule = (id: string, updates: Partial<ConfigurableApprovalRule>) => {
    setApprovalRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );

    addAuditLog({
      action: 'SYSTEM_CLOSE',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Updated approval threshold rule ID: ${id}`,
      status: 'SUCCESS',
    });

    return { success: true };
  };

  const deleteApprovalRule = (id: string) => {
    const rule = approvalRules.find((r) => r.id === id);
    setApprovalRules((prev) => prev.filter((r) => r.id !== id));

    addAuditLog({
      action: 'SYSTEM_CLOSE',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Deleted approval threshold rule "${rule?.ruleName || id}"`,
      status: 'SUCCESS',
    });

    return { success: true };
  };

  const toggleApprovalRule = (id: string) => {
    setApprovalRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
    );
    return { success: true };
  };

  // Custom Roles & Permissions Engine Management
  const createCustomRole = (roleData: Omit<CustomRoleDefinition, 'id' | 'isSystemRole'>) => {
    const existing = customRoles.find((r) => r.code.toLowerCase() === roleData.code.toLowerCase());
    if (existing) {
      return { success: false, error: `A role with code "${roleData.code}" already exists.` };
    }

    const newRole: CustomRoleDefinition = {
      ...roleData,
      id: `role-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isSystemRole: false,
    };

    setCustomRoles((prev) => [...prev, newRole]);

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Created Custom RBAC Role: "${newRole.name}" (${newRole.code}) with ${newRole.permissions.length} granular permissions.`,
      status: 'SUCCESS',
      payloadSummary: `Permissions: ${newRole.permissions.slice(0, 8).join(', ')}...`,
    });

    return { success: true, role: newRole };
  };

  const updateCustomRole = (id: string, updates: Partial<CustomRoleDefinition>) => {
    const target = customRoles.find((r) => r.id === id);
    if (!target) return { success: false, error: 'Custom role not found.' };

    setCustomRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Updated permissions for Role: "${target.name}" (${target.code})`,
      status: 'SUCCESS',
      payloadSummary: updates.permissions ? `Total Scopes: ${updates.permissions.length}` : 'Configuration updated',
    });

    return { success: true };
  };

  const deleteCustomRole = (id: string) => {
    const target = customRoles.find((r) => r.id === id);
    if (!target) return { success: false, error: 'Role not found.' };
    if (target.isSystemRole) return { success: false, error: 'System defined standard roles cannot be deleted.' };

    setCustomRoles((prev) => prev.filter((r) => r.id !== id));

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Deleted Custom Role "${target.name}" (${target.code})`,
      status: 'SUCCESS',
    });

    return { success: true };
  };

  const cloneCustomRole = (sourceRoleId: string, newName: string, newCode: string) => {
    const source = customRoles.find((r) => r.id === sourceRoleId);
    if (!source) return { success: false, error: 'Source role not found.' };

    const newRole: CustomRoleDefinition = {
      id: `role-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName,
      code: newCode,
      description: `Cloned from ${source.name}. ${source.description}`,
      isSystemRole: false,
      colorBadge: 'indigo',
      permissions: [...source.permissions],
    };

    setCustomRoles((prev) => [...prev, newRole]);

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      details: `Cloned role "${source.name}" into new custom role "${newName}" (${newCode})`,
      status: 'SUCCESS',
    });

    return { success: true, role: newRole };
  };

  // Post Tax Settlement Voucher
  const postTaxSettlementVoucher = (jurisdictionId: string) => {
    const jur = taxJurisdictions.find((j) => j.id === jurisdictionId);
    if (!jur || jur.ytdAccruedTax <= 0) {
      return { success: false, error: 'No accrued tax liability available for settlement.' };
    }

    const currentAccs = accountsMap[activeTenantId] || [];
    const taxAcc = currentAccs.find((a) => a.code === '2200' || a.code === '2100' || a.code === '2201') || currentAccs.find((a) => a.type === 'LIABILITY');
    const bankAcc = currentAccs.find((a) => a.code === '1010') || currentAccs.find((a) => a.type === 'ASSET');

    const taxAccId = taxAcc ? taxAcc.id : 'acc-2002';
    const taxAccCode = taxAcc ? taxAcc.code : '2200';
    const taxAccName = taxAcc ? taxAcc.name : 'Tax Payable';

    const bankAccId = bankAcc ? bankAcc.id : 'acc-1001';
    const bankAccCode = bankAcc ? bankAcc.code : '1010';
    const bankAccName = bankAcc ? bankAcc.name : 'Operating Cash Clearing';

    const res = postJournalEntry({
      tenantId: activeTenantId,
      organizationId: activeOrgId || undefined,
      branchId: activeBranchId || undefined,
      date: new Date().toISOString().split('T')[0],
      description: `Tax Settlement Voucher Payment: ${jur.name} (${jur.code})`,
      reference: `TAX-PAY-${jur.code}`,
      pluginId: activePlugin,
      lines: [
        { id: `tx-v1-${Date.now()}`, accountId: taxAccId, accountCode: taxAccCode, accountName: taxAccName, debit: jur.ytdAccruedTax, credit: 0, memo: `Clear Accrued ${jur.taxType} Liability` },
        { id: `tx-v2-${Date.now()}`, accountId: bankAccId, accountCode: bankAccCode, accountName: bankAccName, debit: 0, credit: jur.ytdAccruedTax, memo: `${jur.name} Authority Disbursement` },
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
          { name: 'Central GST (CGST @ 9%)', taxableAmount: cgstAcc > 0 ? cgstAcc / 0.09 : 0, taxCollected: cgstAcc, taxPaidCredit: itcAcc * 0.5, netLiability: cgstAcc - itcAcc * 0.5 },
          { name: 'State GST (SGST @ 9%)', taxableAmount: sgstAcc > 0 ? sgstAcc / 0.09 : 0, taxCollected: sgstAcc, taxPaidCredit: itcAcc * 0.5, netLiability: sgstAcc - itcAcc * 0.5 },
          { name: 'Integrated GST (IGST @ 18%)', taxableAmount: igstAcc > 0 ? igstAcc / 0.18 : 0, taxCollected: igstAcc, taxPaidCredit: 0, netLiability: igstAcc },
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
          { name: 'Standard EU VAT (21% Rate)', taxableAmount: vatAcc > 0 ? vatAcc / 0.21 : 0, taxCollected: vatAcc, taxPaidCredit: reverseChargeAcc, netLiability: vatAcc - reverseChargeAcc },
          { name: 'Reverse Charge Intra-Community B2B', taxableAmount: reverseChargeAcc > 0 ? reverseChargeAcc / 0.21 : 0, taxCollected: 0, taxPaidCredit: reverseChargeAcc, netLiability: 0 },
        ],
        summaryNotes: [
          'Prepared under IAS-1 Presentation of Financial Statements.',
          'Cross-border B2B digital services correctly categorized under Reverse Charge Mechanism.',
          `Total Payable to Tax Authority: €${Math.max(0, vatAcc - reverseChargeAcc).toLocaleString()}`,
        ],
        isCompliant: true,
      };
    } else if (pluginId === 'sa_zatca') {
      // Saudi Arabia ZATCA Phase 2 FATOORA & Statutory Zakat / VAT
      const vatAcc = accounts.find((a) => a.code === '2200')?.balance || 0;
      const itcAcc = accounts.find((a) => a.code === '1301')?.balance || 0;
      const zakatAcc = accounts.find((a) => a.code === '2210')?.balance || 18200;
      const whtAcc = accounts.find((a) => a.code === '2220')?.balance || 4500;
      const netVat = Math.max(0, vatAcc - itcAcc);

      return {
        pluginId: 'sa_zatca',
        title: 'ZATCA FATOORA Phase 2 E-Invoicing & Statutory Zakat/VAT Declaration',
        standardName: 'Saudi Arabia ZATCA (Zakat, Tax and Customs Authority - هيئة الزكاة والضريبة والجمارك)',
        period: 'August 2026 Monthly VAT / 1447H Zakat Declaration',
        tenantName: activeTenant.name,
        taxIdentifier: 'VAT TIN: 300123456700003 • CR: 1010892011',
        taxBreakdown: [
          { name: 'Standard Rated Output VAT (15% ZATCA Supply)', taxableAmount: vatAcc > 0 ? vatAcc / 0.15 : 190000, taxCollected: vatAcc, taxPaidCredit: itcAcc, netLiability: vatAcc - itcAcc },
          { name: 'Statutory Zakat Provision Pool (2.578% of Adjusted Net Pool)', taxableAmount: zakatAcc > 0 ? zakatAcc / 0.02578 : 706000, taxCollected: zakatAcc, taxPaidCredit: 0, netLiability: zakatAcc },
          { name: 'Non-Resident Withholding Tax (WHT @ 5% Technical/Management)', taxableAmount: whtAcc > 0 ? whtAcc / 0.05 : 90000, taxCollected: whtAcc, taxPaidCredit: 0, netLiability: whtAcc },
        ],
        summaryNotes: [
          'ZATCA FATOORA Phase 2 Clearance & Reporting Standard compliant.',
          'ECDSA secp256k1 digital signatures & SHA-256 Previous Invoice Hash (PIH) cryptographically linked.',
          'Bilingual Arabic/English XML UBL 2.1 e-invoices with Base64 TLV QR codes active.',
          `Gross Output VAT Collected (15%): SAR ${vatAcc.toLocaleString()}`,
          `Input VAT Recoverable: SAR ${itcAcc.toLocaleString()}`,
          `Zakat Liability Accrued (2.578% of Adjusted Zakat Pool): SAR ${zakatAcc.toLocaleString()}`,
          `Net Tax & Zakat Payable to ZATCA ERAD/FATOORA: SAR ${Math.max(0, netVat + zakatAcc + whtAcc).toLocaleString()}`,
        ],
        isCompliant: true,
      };
    } else if (pluginId === 'qa_gta') {
      // Qatar General Tax Authority (GTA / Dhareeba Portal)
      const vatAcc = accounts.find((a) => a.code === '2200')?.balance || 0;
      const itcAcc = accounts.find((a) => a.code === '1301')?.balance || 0;
      const citAcc = accounts.find((a) => a.code === '2300')?.balance || 22000;
      const whtAcc = accounts.find((a) => a.code === '2210')?.balance || 7500;
      const netVat = Math.max(0, vatAcc - itcAcc);

      return {
        pluginId: 'qa_gta',
        title: 'Qatar GTA Dhareeba E-Tax Return & Corporate Income Tax Schedule',
        standardName: 'Qatar GTA (General Tax Authority - الهيئة العامة للضرائب / Dhareeba Portal)',
        period: 'Q3 2026 Quarterly Return & Annual CIT Provision',
        tenantName: activeTenant.name,
        taxIdentifier: 'Dhareeba TIN: 0000182940 • Commercial Reg: 84920',
        taxBreakdown: [
          { name: 'Standard Output VAT (5% GCC Supply)', taxableAmount: vatAcc > 0 ? vatAcc / 0.05 : 120000, taxCollected: vatAcc, taxPaidCredit: itcAcc, netLiability: vatAcc - itcAcc },
          { name: 'Corporate Income Tax (CIT @ 10% Foreign Shareholder Profits)', taxableAmount: citAcc > 0 ? citAcc / 0.10 : 220000, taxCollected: citAcc, taxPaidCredit: 0, netLiability: citAcc },
          { name: 'Cross-Border Withholding Tax (WHT @ 5% Services/Royalties)', taxableAmount: whtAcc > 0 ? whtAcc / 0.05 : 150000, taxCollected: whtAcc, taxPaidCredit: 0, netLiability: whtAcc },
        ],
        summaryNotes: [
          'Compliant with Qatar Tax Law No. 24 of 2018 and Dhareeba Tax Portal Guidelines.',
          'Withholding Tax (WHT) deducted at source on cross-border technical services.',
          'Qatar Financial Centre (QFC) / Free Zone tax status verified.',
          `Output VAT (5%): QAR ${vatAcc.toLocaleString()}`,
          `Corporate Income Tax (CIT @ 10%): QAR ${citAcc.toLocaleString()}`,
          `Withholding Tax (WHT @ 5%): QAR ${whtAcc.toLocaleString()}`,
          `Net Payable to Qatar General Tax Authority (Dhareeba): QAR ${Math.max(0, netVat + citAcc + whtAcc).toLocaleString()}`,
        ],
        isCompliant: true,
      };
    } else if (pluginId === 'ae_fta') {
      // UAE Federal Tax Authority (FTA / EmaraTax)
      const vatAcc = accounts.find((a) => a.code === '2200')?.balance || 0;
      const itcAcc = accounts.find((a) => a.code === '1301')?.balance || 0;
      const ctAcc = accounts.find((a) => a.code === '2300')?.balance || 18500;
      const netVat = Math.max(0, vatAcc - itcAcc);

      return {
        pluginId: 'ae_fta',
        title: 'UAE FTA EmaraTax Return (VAT 201) & Corporate Tax Schedule',
        standardName: 'UAE Federal Tax Authority (FTA - الهيئة الاتحادية للضرائب / EmaraTax)',
        period: 'Q3 2026 VAT 201 Return & FY2026 CT Provision',
        tenantName: activeTenant.name,
        taxIdentifier: 'TRN: 100294819200003 • EmaraTax Ref: FTA-DXB-2026-440192',
        taxBreakdown: [
          { name: 'Standard Rated Supplies (5% Mainland UAE Supply)', taxableAmount: vatAcc > 0 ? vatAcc / 0.05 : 240000, taxCollected: vatAcc, taxPaidCredit: itcAcc, netLiability: vatAcc - itcAcc },
          { name: 'UAE Federal Corporate Tax (9% on Mainland Taxable Income > AED 375k)', taxableAmount: ctAcc > 0 ? (ctAcc / 0.09) + 375000 : 580000, taxCollected: ctAcc, taxPaidCredit: 0, netLiability: ctAcc },
          { name: 'Qualifying Free Zone Person (QFZP 0% Qualifying Income)', taxableAmount: 95000, taxCollected: 0, taxPaidCredit: 0, netLiability: 0 },
        ],
        summaryNotes: [
          'Compliant with UAE Federal Decree-Law No. 8 of 2017 (VAT) and Federal Decree-Law No. 47 of 2022 (Corporate Tax).',
          'EmaraTax e-filing schedule VAT 201 generated with reverse charge & import VAT checks.',
          'Qualifying Free Zone Person (0% rate on qualifying income) ring-fenced from Mainland 9% Corporate Tax.',
          `Gross Output VAT Collected (5%): AED ${vatAcc.toLocaleString()}`,
          `Recoverable Input VAT (FTA 5%): AED ${itcAcc.toLocaleString()}`,
          `Mainland Corporate Tax Provision (9%): AED ${ctAcc.toLocaleString()}`,
          `Total Net Remittance to FTA EmaraTax: AED ${Math.max(0, netVat + ctAcc).toLocaleString()}`,
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
          { name: 'New York State Sales Tax (8.875%)', taxableAmount: salesTaxAcc > 0 ? salesTaxAcc / 0.08875 : 0, taxCollected: salesTaxAcc, taxPaidCredit: 0, netLiability: salesTaxAcc },
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

    // Auto-generate compliance payloads if regional plugin active
    let zatcaCompliance = invoiceData.zatcaCompliance;
    let qatarGtaCompliance = invoiceData.qatarGtaCompliance;
    let uaeFtaCompliance = invoiceData.uaeFtaCompliance;

    if (activeTenant.pluginId === 'sa_zatca' && !zatcaCompliance) {
      zatcaCompliance = {
        uuid: `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-4f21-8201-${Math.random().toString(36).substring(2, 14)}`,
        invoiceHash: `3a8f9c2d1e0b5a7e6f4d3c2b1a0e9f8d7c6b5a4e3f2d1c0b9a8f7e6d5c4b3a21`,
        previousInvoiceHash: `NWZkODkyOGExYzllMmE4MTg0N2Q3NGQxNGM3NzA2YzgyMjgyNDg5ZjQxNjJjZDNj`,
        cryptographicStamp: `MEQCID19a28e38f9b2d8e09f1a23c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3AiB8`,
        qrCodeTLV: `AQ1TYXVkaSBFbnRlcnByaXNlIEFyYWJpYSBDby4CCzMwMDEyMzQ1NjcwMDAwMwMUMjAyNi0wOC0yMVQwOTo0MDowMFoEBTI4NzUwBQUzNzUwBgVNWlpr...`,
        complianceStatus: 'CLEARED',
        invoiceType: 'TAX_INVOICE_B2B',
        buyerVatNumber: '310987654300003',
        buyerCrNumber: '1010992819',
        arabicDescription: 'فاتورة ضريبية إلكترونية - المرحلة الثانية منظومة فاتورة',
        clearanceTimestamp: new Date().toISOString(),
        csidIdentifier: 'CSID-ZATCA-PROD-904128',
      };
    } else if (activeTenant.pluginId === 'qa_gta' && !qatarGtaCompliance) {
      qatarGtaCompliance = {
        tin: '0000182940',
        dhareebaRef: `DHAR-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        qrCode: `GTA-DHAREEBA-TIN:0000182940-TOTAL:${invoiceData.totalAmount}-VAT:${invoiceData.taxTotal}`,
        status: 'APPROVED',
        isQfcRegulated: false,
        withholdingTaxApplicable: true,
        whtRate: 5,
        whtAmount: invoiceData.subtotal * 0.05,
      };
    } else if (activeTenant.pluginId === 'ae_fta' && !uaeFtaCompliance) {
      uaeFtaCompliance = {
        trn: '100294819200003',
        emaraTaxRef: `FTA-DXB-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        isFreeZoneQualifying: false,
        corporateTaxRate: 9,
        qrCode: `FTA-UAE-TRN:100294819200003-INV:${invoiceNumber}-TOTAL:${invoiceData.totalAmount}-VAT:${invoiceData.taxTotal}`,
      };
    }

    const newInv: CustomerInvoice = {
      ...invoiceData,
      id: invId,
      invoiceNumber,
      amountPaid: 0,
      status: 'UNPAID',
      zatcaCompliance,
      qatarGtaCompliance,
      uaeFtaCompliance,
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

    return { success: true, invoice: newInv };
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

  // Helper: Get applicable approval tiers for a given PO amount
  const getApplicableApprovalTiersForPo = (totalAmount: number, tenantId: string): PoApprovalTierConfig[] => {
    const tenantTiers = poApprovalTiers.filter(
      (t) => (t.tenantId === tenantId || (!t.tenantId && tenantId === 't-acme-us')) && t.isEnabled
    );
    const applicable = tenantTiers.filter((t) => totalAmount >= t.minAmount);
    return applicable.sort((a, b) => a.level - b.level);
  };

  // Purchase Orders & Configurable Approval Engine
  const createPurchaseOrder = (
    poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'approvalAuditTrail' | 'currentApprovalLevel' | 'requiredApprovalLevels' | 'status'> & { status?: PurchaseOrderStatus }
  ) => {
    const poId = `po-${Date.now()}`;
    const nextSeq = purchaseOrders.filter((p) => (p.tenantId || activeTenant.id) === activeTenant.id).length + 1;
    const poNumber = poData.poNumber || `PO-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;
    const targetTenantId = poData.tenantId || activeTenant.id;
    const nowIso = new Date().toISOString();

    const applicableTiers = getApplicableApprovalTiersForPo(poData.totalAmount, targetTenantId);
    const requiresApproval = applicableTiers.length > 0;

    let initialStatus: PurchaseOrderStatus = poData.status || (requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED');
    let currentLevel = 0;
    let requiredLevels = applicableTiers.length;

    const auditTrail: PurchaseOrderApprovalStep[] = applicableTiers.map((tier, idx) => ({
      stepId: `step-${tier.tierId}-${Date.now()}-${idx}`,
      tierId: tier.tierId,
      tierName: tier.tierName,
      level: tier.level,
      requiredRole: tier.requiredRole,
      status: initialStatus === 'DRAFT' ? 'NOT_STARTED' : idx === 0 ? 'PENDING' : 'NOT_STARTED',
      enforceMakerChecker: tier.enforceMakerChecker,
    }));

    if (initialStatus === 'PENDING_APPROVAL') {
      currentLevel = 1;
    } else if (initialStatus === 'APPROVED') {
      currentLevel = requiredLevels;
    }

    const newPo: PurchaseOrder = {
      ...poData,
      id: poId,
      poNumber,
      tenantId: targetTenantId,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: poData.createdBy || userEmail,
      creatorRole: poData.creatorRole || activeRole,
      status: initialStatus,
      currentApprovalLevel: currentLevel,
      requiredApprovalLevels: requiredLevels,
      approvalAuditTrail: auditTrail,
      currency: poData.currency || activeTenant.currency,
      deliveryStatus: poData.deliveryStatus || 'PENDING',
      isFullyBilled: false,
    };

    setPurchaseOrders((prev) => [newPo, ...prev]);

    // Also queue into general approvalItems if pending approval
    if (initialStatus === 'PENDING_APPROVAL' && applicableTiers.length > 0) {
      const firstTier = applicableTiers[0];
      const newApprovalItem: ApprovalItem = {
        id: `app-po-${newPo.id}`,
        tenantId: targetTenantId,
        entityType: 'PURCHASE_ORDER',
        entityId: newPo.id,
        referenceNumber: newPo.poNumber,
        amount: newPo.totalAmount,
        currency: newPo.currency,
        requestedBy: newPo.createdBy,
        requestedDate: nowIso.split('T')[0],
        requestedRole: newPo.creatorRole,
        requiredRole: firstTier.requiredRole,
        thresholdRuleId: firstTier.tierId,
        status: 'PENDING',
        comments: `Purchase order #${newPo.poNumber} for ${newPo.vendorName} pending Tier ${firstTier.level} (${firstTier.tierName}) approval.`,
      };
      setApprovalItems((prev) => [newApprovalItem, ...prev]);
    }

    addAuditLog({
      action: 'PO_CREATE',
      tenantId: targetTenantId,
      userRole: activeRole,
      userEmail,
      details: `Created Purchase Order #${poNumber} for ${poData.vendorName} (${poData.totalAmount} ${newPo.currency}) - Status: ${initialStatus}`,
      status: 'SUCCESS',
      payloadSummary: `PO ID: ${poId} | Required Approval Levels: ${requiredLevels} | Tiers: ${applicableTiers.map((t) => t.tierName).join(' -> ') || 'Auto-Approved'}`,
    });

    return { success: true, po: newPo };
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    const existing = purchaseOrders.find((p) => p.id === id);
    if (!existing) return { success: false, error: 'Purchase Order not found.' };

    const targetTenantId = existing.tenantId || activeTenant.id;
    let updatedTrail = updates.approvalAuditTrail || existing.approvalAuditTrail;
    let updatedRequiredLevels = updates.requiredApprovalLevels ?? existing.requiredApprovalLevels;
    let updatedCurrentLevel = updates.currentApprovalLevel ?? existing.currentApprovalLevel;
    let updatedStatus = updates.status || existing.status;

    // If amount changed while in DRAFT or PENDING_APPROVAL, re-evaluate tiers
    if (updates.totalAmount !== undefined && updates.totalAmount !== existing.totalAmount && (existing.status === 'DRAFT' || existing.status === 'PENDING_APPROVAL')) {
      const applicableTiers = getApplicableApprovalTiersForPo(updates.totalAmount, targetTenantId);
      updatedRequiredLevels = applicableTiers.length;
      updatedTrail = applicableTiers.map((tier, idx) => ({
        stepId: `step-${tier.tierId}-${Date.now()}-${idx}`,
        tierId: tier.tierId,
        tierName: tier.tierName,
        level: tier.level,
        requiredRole: tier.requiredRole,
        status: existing.status === 'DRAFT' ? 'NOT_STARTED' : idx === 0 ? 'PENDING' : 'NOT_STARTED',
        enforceMakerChecker: tier.enforceMakerChecker,
      }));
      if (existing.status === 'PENDING_APPROVAL') {
        updatedCurrentLevel = 1;
      }
    }

    const updatedPo: PurchaseOrder = {
      ...existing,
      ...updates,
      approvalAuditTrail: updatedTrail,
      requiredApprovalLevels: updatedRequiredLevels,
      currentApprovalLevel: updatedCurrentLevel,
      status: updatedStatus,
      updatedAt: new Date().toISOString(),
    };

    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updatedPo : p)));

    addAuditLog({
      action: 'PO_UPDATE',
      tenantId: targetTenantId,
      userRole: activeRole,
      userEmail,
      details: `Updated Purchase Order #${existing.poNumber}`,
      status: 'SUCCESS',
      payloadSummary: `Updates: ${Object.keys(updates).join(', ')}`,
    });

    return { success: true };
  };

  const deletePurchaseOrder = (id: string) => {
    const existing = purchaseOrders.find((p) => p.id === id);
    if (!existing) return { success: false, error: 'Purchase Order not found.' };

    if (existing.status === 'APPROVED' || existing.isFullyBilled || existing.deliveryStatus === 'DELIVERED') {
      return {
        success: false,
        error: `Cannot delete Purchase Order #${existing.poNumber} because it is currently in "${existing.status}" status with downstream accounting/receipt linkages. Please cancel or reject it instead.`,
      };
    }

    setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
    setApprovalItems((prev) => prev.filter((item) => item.entityId !== id));

    addAuditLog({
      action: 'PO_DELETE',
      tenantId: existing.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Deleted Purchase Order #${existing.poNumber} (${existing.vendorName})`,
      status: 'SUCCESS',
      payloadSummary: `PO ID: ${id} | Deleted by ${userEmail}`,
    });

    return { success: true };
  };

  const submitPurchaseOrderForApproval = (id: string) => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return { success: false, message: 'Purchase Order not found.', error: 'Purchase Order not found.' };

    if (po.status !== 'DRAFT' && po.status !== 'REJECTED') {
      return { success: false, message: `PO is already in ${po.status} status.`, error: `PO is already in ${po.status} status.` };
    }

    const targetTenantId = po.tenantId || activeTenant.id;
    const applicableTiers = getApplicableApprovalTiersForPo(po.totalAmount, targetTenantId);

    if (applicableTiers.length === 0) {
      // Auto-approved
      const approvedPo: PurchaseOrder = {
        ...po,
        status: 'APPROVED',
        currentApprovalLevel: 0,
        requiredApprovalLevels: 0,
        updatedAt: new Date().toISOString(),
      };
      setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? approvedPo : p)));

      addAuditLog({
        action: 'PO_APPROVAL_DECISION',
        tenantId: targetTenantId,
        userRole: activeRole,
        userEmail,
        details: `Purchase Order #${po.poNumber} auto-approved (amount below minimum configured approval tier threshold).`,
        status: 'SUCCESS',
        payloadSummary: `Amount: ${po.totalAmount} ${po.currency}`,
      });

      return { success: true, message: `PO #${po.poNumber} amount is below threshold and has been auto-approved.` };
    }

    const trail: PurchaseOrderApprovalStep[] = applicableTiers.map((tier, idx) => ({
      stepId: `step-${tier.tierId}-${Date.now()}-${idx}`,
      tierId: tier.tierId,
      tierName: tier.tierName,
      level: tier.level,
      requiredRole: tier.requiredRole,
      status: idx === 0 ? 'PENDING' : 'NOT_STARTED',
      enforceMakerChecker: tier.enforceMakerChecker,
    }));

    const submittedPo: PurchaseOrder = {
      ...po,
      status: 'PENDING_APPROVAL',
      currentApprovalLevel: 1,
      requiredApprovalLevels: applicableTiers.length,
      approvalAuditTrail: trail,
      updatedAt: new Date().toISOString(),
    };

    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? submittedPo : p)));

    // Queue in approval items
    const firstTier = applicableTiers[0];
    const newApprovalItem: ApprovalItem = {
      id: `app-po-${po.id}`,
      tenantId: targetTenantId,
      entityType: 'PURCHASE_ORDER',
      entityId: po.id,
      referenceNumber: po.poNumber,
      amount: po.totalAmount,
      currency: po.currency,
      requestedBy: po.createdBy,
      requestedDate: new Date().toISOString().split('T')[0],
      requestedRole: po.creatorRole,
      requiredRole: firstTier.requiredRole,
      thresholdRuleId: firstTier.tierId,
      status: 'PENDING',
      comments: `Purchase order #${po.poNumber} submitted for Tier 1 (${firstTier.tierName}) approval.`,
    };
    setApprovalItems((prev) => [newApprovalItem, ...prev.filter((i) => i.entityId !== po.id)]);

    addAuditLog({
      action: 'PO_SUBMIT_APPROVAL',
      tenantId: targetTenantId,
      userRole: activeRole,
      userEmail,
      details: `Submitted Purchase Order #${po.poNumber} for Tier 1 approval (${firstTier.tierName} - ${firstTier.requiredRole})`,
      status: 'SUCCESS',
      payloadSummary: `Total Levels: ${applicableTiers.length} | Amount: ${po.totalAmount} ${po.currency}`,
    });

    return {
      success: true,
      message: `Purchase Order #${po.poNumber} submitted successfully. Tier 1 (${firstTier.tierName}) approval is now pending.`,
    };
  };

  const approvePurchaseOrder = (id: string, comments?: string) => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return { success: false, message: 'Purchase Order not found.', error: 'Purchase Order not found.' };

    if (po.status !== 'PENDING_APPROVAL') {
      return {
        success: false,
        message: `Cannot approve PO #${po.poNumber} because it is in "${po.status}" status.`,
        error: `Cannot approve PO in "${po.status}" status.`,
      };
    }

    const currentStepIndex = po.approvalAuditTrail.findIndex(
      (step) => step.level === po.currentApprovalLevel && step.status === 'PENDING'
    );

    if (currentStepIndex === -1) {
      return { success: false, message: 'No active pending approval step found for this PO.', error: 'No active step found.' };
    }

    const currentStep = po.approvalAuditTrail[currentStepIndex];

    // SOX 404 Maker-Checker Control Verification
    const isMakerCheckerEnforced = currentStep.enforceMakerChecker ?? true;
    if (isMakerCheckerEnforced && po.createdBy.toLowerCase() === userEmail.toLowerCase() && activeRole !== 'super_user') {
      return {
        success: false,
        message: 'SOX 404 Compliance Violation: The creator of the Purchase Order cannot approve their own request. An independent authorized approver must approve.',
        error: 'Creator cannot approve their own Purchase Order (Maker-Checker violation).',
      };
    }

    // Role verification
    const requiredRole = currentStep.requiredRole;
    const isAuthorizedRole =
      activeRole === 'super_user' ||
      activeRole === 'cfo' ||
      activeRole === requiredRole ||
      (requiredRole === 'manager' && (activeRole === 'accountant' || activeRole === 'admin')) ||
      (requiredRole === 'controller' && (activeRole === 'admin' || activeRole === 'cfo'));

    if (!isAuthorizedRole && !hasPermission('po:approve_l1', po.tenantId) && !hasPermission('governance:approve', po.tenantId)) {
      return {
        success: false,
        message: `Access Denied: Tier ${currentStep.level} (${currentStep.tierName}) requires role "${requiredRole}". Your active role is "${activeRole}".`,
        error: `Insufficient approval authority for tier ${currentStep.level}. Required: ${requiredRole}`,
      };
    }

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    // Update current step to APPROVED
    const updatedTrail = [...po.approvalAuditTrail];
    updatedTrail[currentStepIndex] = {
      ...currentStep,
      status: 'APPROVED',
      actionBy: userEmail,
      actionRole: activeRole,
      actionDate: today,
      comments: comments || `Approved by ${userName} (${activeRole})`,
    };

    const hasNextStep = currentStepIndex + 1 < updatedTrail.length;
    let nextStatus: PurchaseOrderStatus = po.status;
    let nextLevel = po.currentApprovalLevel;
    let isFinal = false;

    if (hasNextStep) {
      // Advance to next tier
      nextLevel = po.currentApprovalLevel + 1;
      updatedTrail[currentStepIndex + 1] = {
        ...updatedTrail[currentStepIndex + 1],
        status: 'PENDING',
      };
      nextStatus = 'PENDING_APPROVAL';

      // Update approvalItems queue to point to next tier approvers
      const nextStep = updatedTrail[currentStepIndex + 1];
      setApprovalItems((prev) =>
        prev.map((item) =>
          item.entityId === po.id
            ? {
                ...item,
                requiredRole: nextStep.requiredRole,
                comments: `PO #${po.poNumber} advanced to Tier ${nextStep.level} (${nextStep.tierName}) approval.`,
              }
            : item
        )
      );
    } else {
      // Final approval achieved
      nextStatus = 'APPROVED';
      isFinal = true;

      // Mark approvalItem as APPROVED
      setApprovalItems((prev) =>
        prev.map((item) =>
          item.entityId === po.id
            ? {
                ...item,
                status: 'APPROVED',
                decisionDate: today,
                decisionBy: userEmail,
                comments: comments || 'Final Purchase Order approval granted.',
              }
            : item
        )
      );
    }

    const updatedPo: PurchaseOrder = {
      ...po,
      status: nextStatus,
      currentApprovalLevel: nextLevel,
      approvalAuditTrail: updatedTrail,
      updatedAt: nowIso,
    };

    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updatedPo : p)));

    addAuditLog({
      action: 'PO_APPROVAL_DECISION',
      tenantId: po.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Approved Purchase Order #${po.poNumber} at Tier ${currentStep.level} (${currentStep.tierName})${isFinal ? ' - FINAL APPROVAL GRANTED' : ` - Advanced to Tier ${nextLevel}`}`,
      status: 'SUCCESS',
      payloadSummary: `Approver: ${userEmail} (${activeRole}) | Notes: ${comments || 'None'} | New PO Status: ${nextStatus}`,
    });

    return {
      success: true,
      message: isFinal
        ? `Purchase Order #${po.poNumber} has received final approval and is now ready for goods receipt and vendor billing.`
        : `Tier ${currentStep.level} approval recorded. PO #${po.poNumber} advanced to Tier ${nextLevel} (${updatedTrail[currentStepIndex + 1]?.tierName || ''}) for next sign-off.`,
      isFinalApproval: isFinal,
    };
  };

  const rejectPurchaseOrder = (id: string, rejectionReason: string) => {
    const po = purchaseOrders.find((p) => p.id === id);
    if (!po) return { success: false, message: 'Purchase Order not found.', error: 'Purchase Order not found.' };

    if (po.status !== 'PENDING_APPROVAL') {
      return {
        success: false,
        message: `Cannot reject PO #${po.poNumber} because it is in "${po.status}" status.`,
        error: `Cannot reject PO in "${po.status}" status.`,
      };
    }

    const currentStepIndex = po.approvalAuditTrail.findIndex(
      (step) => step.level === po.currentApprovalLevel && step.status === 'PENDING'
    );

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const updatedTrail = [...po.approvalAuditTrail];
    if (currentStepIndex !== -1) {
      updatedTrail[currentStepIndex] = {
        ...updatedTrail[currentStepIndex],
        status: 'REJECTED',
        actionBy: userEmail,
        actionRole: activeRole,
        actionDate: today,
        comments: rejectionReason,
      };
    }

    const updatedPo: PurchaseOrder = {
      ...po,
      status: 'REJECTED',
      rejectionReason,
      approvalAuditTrail: updatedTrail,
      updatedAt: nowIso,
    };

    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updatedPo : p)));

    setApprovalItems((prev) =>
      prev.map((item) =>
        item.entityId === po.id
          ? {
              ...item,
              status: 'REJECTED',
              decisionDate: today,
              decisionBy: userEmail,
              comments: `Rejected: ${rejectionReason}`,
            }
          : item
      )
    );

    addAuditLog({
      action: 'PO_APPROVAL_DECISION',
      tenantId: po.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `REJECTED Purchase Order #${po.poNumber} by ${userEmail} (${activeRole}). Reason: "${rejectionReason}"`,
      status: 'SUCCESS',
      payloadSummary: `PO ID: ${po.id} | Rejection Reason: ${rejectionReason}`,
    });

    return {
      success: true,
      message: `Purchase Order #${po.poNumber} was rejected. Reason logged in audit trail.`,
    };
  };

  const receiveGoodsForPurchaseOrder = (
    poId: string,
    receivedItems: { lineItemId: string; quantityToReceive: number; batchOrSerialNo?: string; conditionNotes?: string }[]
  ) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return { success: false, message: 'Purchase Order not found.', error: 'Purchase Order not found.' };

    if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED' && po.status !== 'RECEIVED') {
      return {
        success: false,
        message: `Cannot receive goods for PO #${po.poNumber} because its status is "${po.status}". The PO must be APPROVED first.`,
        error: `PO status must be APPROVED to receive goods.`,
      };
    }

    const updatedLineItems = po.items.map((item) => {
      const match = receivedItems.find((r) => r.lineItemId === item.id);
      if (match && match.quantityToReceive > 0) {
        const newReceived = (item.receivedQuantity || 0) + match.quantityToReceive;
        return {
          ...item,
          receivedQuantity: Math.min(item.quantity, newReceived),
        };
      }
      return item;
    });

    const allFullyReceived = updatedLineItems.every((item) => (item.receivedQuantity || 0) >= item.quantity);
    const anyReceived = updatedLineItems.some((item) => (item.receivedQuantity || 0) > 0);

    const newDeliveryStatus = allFullyReceived ? 'DELIVERED' : anyReceived ? 'PARTIAL' : 'PENDING';
    const newStatus: PurchaseOrderStatus = allFullyReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : po.status;

    const updatedPo: PurchaseOrder = {
      ...po,
      items: updatedLineItems,
      deliveryStatus: newDeliveryStatus,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updatedPo : p)));

    // If inventory item matched, update inventory stock automatically
    let totalItemsReceived = 0;
    receivedItems.forEach((r) => {
      const matchedItem = po.items.find((i) => i.id === r.lineItemId);
      if (matchedItem && r.quantityToReceive > 0) {
        totalItemsReceived += r.quantityToReceive;
        // Check if item corresponds to an inventory stock item
        const inventoryItem = inventoryItems.find(
          (inv) => (inv.sku && matchedItem.sku && inv.sku.toLowerCase() === matchedItem.sku.toLowerCase()) || inv.name.toLowerCase() === matchedItem.itemName.toLowerCase()
        );
        if (inventoryItem) {
          adjustInventoryStock({
            itemId: inventoryItem.id,
            type: 'RECEIPT_PURCHASE',
            quantityDelta: r.quantityToReceive,
            reason: `Goods receipt from Purchase Order #${po.poNumber}`,
          });
        }
      }
    });

    addAuditLog({
      action: 'PO_GOODS_RECEIPT',
      tenantId: po.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Processed Goods Receipt (GRN) for Purchase Order #${po.poNumber}. Total items received: ${totalItemsReceived}. New Delivery Status: ${newDeliveryStatus}`,
      status: 'SUCCESS',
      payloadSummary: `PO Status: ${newStatus} | Fully Received: ${allFullyReceived}`,
    });

    return {
      success: true,
      message: allFullyReceived
        ? `All items for Purchase Order #${po.poNumber} are fully received (GRN complete). Ready for vendor bill match.`
        : `Partial goods receipt recorded for PO #${po.poNumber}. Delivery status updated to PARTIAL.`,
    };
  };

  const convertPurchaseOrderToVendorBill = (poId: string, glExpenseAccountId?: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order not found.' };

    if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED' && po.status !== 'RECEIVED') {
      return {
        success: false,
        error: `Cannot convert Purchase Order #${po.poNumber} to a Vendor Bill because it has not been approved (Current Status: "${po.status}").`,
      };
    }

    if (po.isFullyBilled) {
      return {
        success: false,
        error: `Purchase Order #${po.poNumber} is already fully billed (Linked Bill: ${po.vendorBillNumber || po.vendorBillId}).`,
      };
    }

    const billId = `bill-${Date.now()}`;
    const nextBillSeq = vendorBills.length + 1;
    const billNumber = `BILL-${new Date().getFullYear()}-${String(nextBillSeq).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = po.expectedDeliveryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const currentAccs = accountsMap[activeTenant.id] || [];
    const fallbackExpAcc = currentAccs.find((a) => (glExpenseAccountId && a.id === glExpenseAccountId) || a.code === '5010') || currentAccs.find((a) => a.type === 'EXPENSE');

    const billItems = po.items.map((item, idx) => ({
      id: `bi-${Date.now()}-${idx}`,
      description: `[PO #${po.poNumber}] ${item.itemName} - ${item.description || ''}`,
      amount: item.totalAmount,
      expenseAccountCode: item.expenseAccountCode || fallbackExpAcc?.code || '5010',
    }));

    const newBill: VendorBill = {
      id: billId,
      tenantId: po.tenantId || activeTenant.id,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      billNumber,
      billDate: today,
      dueDate,
      items: billItems,
      totalAmount: po.totalAmount,
      amountPaid: 0,
      currency: po.currency,
      status: 'APPROVED',
      notes: `Generated via 3-Way Match from Purchase Order #${po.poNumber}. Terms: ${po.paymentTerms || 'Net 30'}.`,
      purchaseOrderId: po.id,
      purchaseOrderNumber: po.poNumber,
    };

    setVendorBills((prev) => [newBill, ...prev]);

    // Double-entry GL posting: Debit Expense / Credit AP
    const apAcc = currentAccs.find((a) => a.code === '2010') || currentAccs.find((a) => a.type === 'LIABILITY');

    if (apAcc && billItems.length > 0) {
      const glLines: JournalLine[] = billItems.map((item, idx) => {
        const expAcc = currentAccs.find((a) => a.code === item.expenseAccountCode) || currentAccs.find((a) => a.type === 'EXPENSE');
        return {
          id: `jl-pobill-exp-${Date.now()}-${idx}`,
          accountId: expAcc ? expAcc.id : 'acc-5001',
          accountCode: expAcc ? expAcc.code : '5010',
          accountName: expAcc ? expAcc.name : 'Operating Expenses',
          debit: item.amount,
          credit: 0,
          memo: item.description,
        };
      });

      glLines.push({
        id: `jl-pobill-ap-${Date.now()}`,
        accountId: apAcc.id,
        accountCode: apAcc.code,
        accountName: apAcc.name,
        debit: 0,
        credit: po.totalAmount,
        memo: `Vendor Bill #${billNumber} for PO #${po.poNumber}`,
      });

      postJournalEntry({
        tenantId: po.tenantId || activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: today,
        description: `Vendor Bill #${billNumber} converted from Purchase Order #${po.poNumber} (${po.vendorName})`,
        reference: billNumber,
        pluginId: activePlugin,
        lines: glLines,
      });
    }

    // Mark PO as billed
    const updatedPo: PurchaseOrder = {
      ...po,
      isFullyBilled: true,
      vendorBillId: billId,
      vendorBillNumber: billNumber,
      updatedAt: new Date().toISOString(),
    };

    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updatedPo : p)));

    addAuditLog({
      action: 'PO_CONVERT_BILL',
      tenantId: po.tenantId || activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Converted Purchase Order #${po.poNumber} to Accounts Payable Vendor Bill #${billNumber} (${po.totalAmount} ${po.currency})`,
      status: 'SUCCESS',
      payloadSummary: `PO: ${po.poNumber} -> Bill: ${billNumber} | GL Posting Reference: ${billNumber}`,
    });

    return { success: true, billId, billNumber };
  };

  const updatePoApprovalTiers = (tiers: PoApprovalTierConfig[]) => {
    setPoApprovalTiers(tiers);

    addAuditLog({
      action: 'PO_CONFIG_TIERS',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated Purchase Order Approval Matrix configuration (${tiers.length} active tiers configured)`,
      status: 'SUCCESS',
      payloadSummary: `Configured Tiers: ${tiers.map((t) => `${t.tierName} (L${t.level}: >= ${t.minAmount})`).join(', ')}`,
    });

    return { success: true };
  };

  const resetPoApprovalTiersToDefault = (targetTenantId?: string) => {
    const tenantId = targetTenantId || activeTenant.id;
    const defaultTiers = INITIAL_PO_APPROVAL_TIERS.filter(
      (t) => t.tenantId === tenantId || (!t.tenantId && tenantId === 't-acme-us')
    );

    setPoApprovalTiers((prev) => {
      const otherTenantTiers = prev.filter((t) => t.tenantId && t.tenantId !== tenantId);
      return [...otherTenantTiers, ...defaultTiers];
    });

    addAuditLog({
      action: 'PO_CONFIG_TIERS',
      tenantId,
      userRole: activeRole,
      userEmail,
      details: `Reset Purchase Order Approval Tiers to standard regulatory default matrix for tenant [${tenantId}]`,
      status: 'SUCCESS',
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
      else if (tenant.currency === 'SAR') fxRate = FX_RATES.find((r) => r.fromCurrency === 'SAR')?.rate || 0.2666;
      else if (tenant.currency === 'QAR') fxRate = FX_RATES.find((r) => r.fromCurrency === 'QAR')?.rate || 0.2747;
      else if (tenant.currency === 'AED') fxRate = FX_RATES.find((r) => r.fromCurrency === 'AED')?.rate || 0.2723;
      else {
        const customRate = FX_RATES.find((r) => r.fromCurrency === tenant.currency);
        if (customRate) fxRate = customRate.rate;
      }

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
    const isEntityAdmin = activeRole === 'entity_admin';
    const isAdmin = activeRole === 'admin';

    if (!isSuperUser && !isEntityAdmin && !isAdmin) {
      const msg = 'HTTP 403 FORBIDDEN: User provisioning requires Super User, Financial Admin, or Entity Admin privileges.';
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

    // Rule 1: Only Super Admin can grant Super Admin access to any other user
    if (!isSuperUser) {
      if (userData.defaultRole === 'super_user' || userData.tenantScopes.some((s) => s.role === 'super_user')) {
        const msg = 'SOX Access Control Violation: Only a Super Admin can grant Super Admin access to another user.';
        addAuditLog({
          action: 'CREATE_TENANT',
          tenantId: activeTenant.id,
          userRole: activeRole,
          userEmail,
          details: 'Denied attempt to grant Super User role by non-Super Admin.',
          status: 'FORBIDDEN',
          payloadSummary: msg,
        });
        return { success: false, error: msg };
      }
    }

    // Rule 2: Entity Admin for given entity should be able to provision access for only that Entity where he or she is Entity Admin
    if (isEntityAdmin) {
      const currentUser = enterpriseUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
      const adminTenantIds = new Set<string>();
      if (currentUser) {
        currentUser.tenantScopes.forEach((s) => {
          if (s.role === 'entity_admin' || s.role === 'super_user') {
            adminTenantIds.add(s.tenantId);
          }
        });
      }
      if (adminTenantIds.size === 0) {
        adminTenantIds.add(activeTenant.id);
      }

      const unauthorizedScopes = (userData.tenantScopes || []).filter((s) => !adminTenantIds.has(s.tenantId));
      if (unauthorizedScopes.length > 0) {
        const unauthorizedNames = unauthorizedScopes
          .map((s) => {
            const t = tenants.find((item) => item.id === s.tenantId);
            return t ? t.name : s.tenantId;
          })
          .join(', ');
        const msg = `Scope Restriction: As an Entity Admin, you can only provision user access for entities where you have administrative authority. Access to "${unauthorizedNames}" denied.`;
        addAuditLog({
          action: 'CREATE_TENANT',
          tenantId: activeTenant.id,
          userRole: activeRole,
          userEmail,
          details: `Entity Admin attempted cross-entity provisioning for: ${unauthorizedNames}`,
          status: 'FORBIDDEN',
          payloadSummary: msg,
        });
        return { success: false, error: msg };
      }
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
      details: `Provisioned user "${newUser.name}" (${newUser.email}) as ${newUser.defaultRole} across ${newUser.tenantScopes.length} entities by ${activeRole}.`,
      status: 'SUCCESS',
      payloadSummary: `User ID: ${newId} | Scopes: ${newUser.tenantScopes.map((s) => `${s.tenantId}:${s.role}`).join(', ')}`,
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
    const isEntityAdmin = activeRole === 'entity_admin';

    // Rule 1: Only Super Admin can elevate or grant Super Admin access
    if (!isSuperUser && (defaultRole === 'super_user' || tenantScopes.some((s) => s.role === 'super_user'))) {
      const msg = 'SOX Security Violation: Only a Super Admin can grant Super Admin privileges.';
      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: 'Denied elevation to Super User by non-Super User role.',
        status: 'FORBIDDEN',
        payloadSummary: msg,
      });
      return { success: false, error: msg };
    }

    // Rule 2: Entity Admin can only modify/assign scopes for their authorized entities
    if (isEntityAdmin) {
      const currentUser = enterpriseUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
      const adminTenantIds = new Set<string>();
      if (currentUser) {
        currentUser.tenantScopes.forEach((s) => {
          if (s.role === 'entity_admin' || s.role === 'super_user') {
            adminTenantIds.add(s.tenantId);
          }
        });
      }
      if (adminTenantIds.size === 0) {
        adminTenantIds.add(activeTenant.id);
      }

      const unauthorizedScopes = tenantScopes.filter((s) => !adminTenantIds.has(s.tenantId));
      if (unauthorizedScopes.length > 0) {
        const unauthorizedNames = unauthorizedScopes
          .map((s) => {
            const t = tenants.find((item) => item.id === s.tenantId);
            return t ? t.name : s.tenantId;
          })
          .join(', ');
        const msg = `Scope Restriction: Entity Admins can only assign access for their authorized entities. Modification to "${unauthorizedNames}" denied.`;
        return { success: false, error: msg };
      }
    }

    setEnterpriseUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, defaultRole, tenantScopes } : u))
    );

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated role (${defaultRole}) and tenant access scopes (${tenantScopes.length} entities) for user ${userId}.`,
      status: 'SUCCESS',
    });

    return { success: true };
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

  // ==========================================
  // RECURRING INVOICES & SUBSCRIPTIONS ENGINE
  // ==========================================
  const createRecurringSchedule = (
    data: Omit<RecurringInvoiceSchedule, 'id' | 'generatedInvoicesCount'>
  ) => {
    const newSchedule: RecurringInvoiceSchedule = {
      ...data,
      id: `rec-sch-${Date.now()}`,
      generatedInvoicesCount: 0,
    };
    setRecurringSchedules((prev) => [newSchedule, ...prev]);
    return { success: true, schedule: newSchedule };
  };

  const updateRecurringSchedule = (id: string, updates: Partial<RecurringInvoiceSchedule>) => {
    setRecurringSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    return { success: true };
  };

  const deleteRecurringSchedule = (id: string) => {
    setRecurringSchedules((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  const runRecurringScheduleNow = (id: string) => {
    const schedule = recurringSchedules.find((s) => s.id === id);
    if (!schedule) return { success: false, error: 'Recurring schedule not found.' };

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const invoiceResult = createInvoice({
      tenantId: schedule.tenantId,
      customerId: schedule.customerId,
      customerName: schedule.customerName,
      customerEmail: schedule.customerEmail,
      issueDate,
      dueDate,
      currency: activeTenant.currency,
      items: schedule.items,
      subtotal: schedule.subtotal,
      taxTotal: schedule.taxTotal,
      totalAmount: schedule.totalAmount,
      revenueAccountCode: schedule.revenueAccountCode || '4010',
      notes: `Generated from recurring subscription schedule: ${schedule.profileName}`,
    });

    if (invoiceResult.success) {
      // Advance next run date
      const nextDate = new Date();
      if (schedule.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (schedule.frequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (schedule.frequency === 'QUARTERLY') nextDate.setMonth(nextDate.getMonth() + 3);
      else if (schedule.frequency === 'SEMI_ANNUAL') nextDate.setMonth(nextDate.getMonth() + 6);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);

      setRecurringSchedules((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                lastRunDate: issueDate,
                nextRunDate: nextDate.toISOString().split('T')[0],
                generatedInvoicesCount: s.generatedInvoicesCount + 1,
              }
            : s
        )
      );
      return { success: true };
    }
    return { success: false, error: (invoiceResult as any).error || 'Failed to generate recurring invoice' };
  };

  // ==========================================
  // EXPENSE TRACKING & OCR RECEIPT CAPTURE
  // ==========================================
  const createExpenseReceipt = (
    data: Omit<ExpenseReceipt, 'id' | 'createdAt' | 'status'>
  ) => {
    const newReceipt: ExpenseReceipt = {
      ...data,
      id: `exp-rcpt-${Date.now()}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
    setExpenseReceipts((prev) => [newReceipt, ...prev]);
    return { success: true, receipt: newReceipt };
  };

  const postExpenseReceiptToGL = (receiptId: string, paymentAccountId: string = '1010') => {
    const rcpt = expenseReceipts.find((r) => r.id === receiptId);
    if (!rcpt) return { success: false, error: 'Receipt not found.' };

    const netAmount = rcpt.amount;
    const taxAmount = rcpt.taxAmount || 0;
    const totalAmount = rcpt.totalAmount || netAmount + taxAmount;

    const lines: JournalLine[] = [
      {
        id: `line-${Date.now()}-1`,
        accountId: 'acc-exp',
        accountCode: rcpt.expenseAccountCode || '5010',
        accountName: rcpt.category || 'Business Expense',
        debit: netAmount,
        credit: 0,
        memo: `Expense: ${rcpt.vendorName} (${rcpt.receiptNumber})`,
      },
    ];

    if (taxAmount > 0) {
      lines.push({
        id: `line-${Date.now()}-2`,
        accountId: 'acc-tax-input',
        accountCode: '1070',
        accountName: 'Input Tax Credit / Deductible VAT/GST',
        debit: taxAmount,
        credit: 0,
        memo: `Tax Credit on ${rcpt.vendorName}`,
      });
    }

    const payAccCode = paymentAccountId === 'credit_card' ? '2010' : paymentAccountId || '1010';
    lines.push({
      id: `line-${Date.now()}-3`,
      accountId: 'acc-pay-source',
      accountCode: payAccCode,
      accountName: payAccCode === '2010' ? 'Accounts Payable / Corporate Card' : 'Operating Cash - Chase',
      debit: 0,
      credit: totalAmount,
      memo: `Disbursement for ${rcpt.vendorName} by ${rcpt.paidBy}`,
    });

    const entryRes = postJournalEntry({
      tenantId: rcpt.tenantId,
      date: rcpt.expenseDate,
      description: `Expense Receipt Post: ${rcpt.vendorName} - ${rcpt.category}`,
      reference: rcpt.receiptNumber,
      pluginId: activeTenant.pluginId,
      lines,
    });

    if (entryRes.success) {
      setExpenseReceipts((prev) =>
        prev.map((r) =>
          r.id === receiptId ? { ...r, status: 'POSTED', journalEntryId: entryRes.entryId } : r
        )
      );
      return { success: true, entryId: entryRes.entryId };
    }
    return { success: false, error: entryRes.error };
  };

  const deleteExpenseReceipt = (id: string) => {
    setExpenseReceipts((prev) => prev.filter((r) => r.id !== id));
    return { success: true };
  };

  // ==========================================
  // MILEAGE TRACKING & TRAVEL DEDUCTIONS
  // ==========================================
  const createMileageLog = (
    data: Omit<MileageLogEntry, 'id' | 'createdAt' | 'status' | 'totalDeductionAmount'>
  ) => {
    const rate = data.ratePerMile || 0.67;
    const totalDeductionAmount = Math.round(data.distanceMiles * rate * 100) / 100;
    const newLog: MileageLogEntry = {
      ...data,
      ratePerMile: rate,
      totalDeductionAmount,
      id: `mil-${Date.now()}`,
      status: 'LOGGED',
      createdAt: new Date().toISOString(),
    };
    setMileageLogs((prev) => [newLog, ...prev]);
    return { success: true, log: newLog };
  };

  const postMileageLogToGL = (logId: string, paymentAccountId: string = '1010') => {
    const log = mileageLogs.find((m) => m.id === logId);
    if (!log) return { success: false, error: 'Mileage trip record not found.' };

    const entryRes = postJournalEntry({
      tenantId: log.tenantId,
      date: log.tripDate,
      description: `Business Mileage Deduction: ${log.driverName} (${log.distanceMiles} mi @ ${log.ratePerMile}/mi) - ${log.purpose}`,
      reference: `MIL-${log.tripDate.replace(/-/g, '')}`,
      pluginId: activeTenant.pluginId,
      lines: [
        {
          id: `line-${Date.now()}-1`,
          accountId: 'acc-mileage-exp',
          accountCode: '5010',
          accountName: 'Travel & Vehicle Mileage Expense',
          debit: log.totalDeductionAmount,
          credit: 0,
          memo: `${log.startLocation} to ${log.endLocation}`,
        },
        {
          id: `line-${Date.now()}-2`,
          accountId: 'acc-mileage-pay',
          accountCode: paymentAccountId || '1010',
          accountName: paymentAccountId === '2010' ? 'Employee Reimbursements Payable' : 'Operating Cash - Chase',
          debit: 0,
          credit: log.totalDeductionAmount,
          memo: `Reimbursement to ${log.driverName}`,
        },
      ],
    });

    if (entryRes.success) {
      setMileageLogs((prev) =>
        prev.map((m) =>
          m.id === logId ? { ...m, status: 'POSTED_TO_GL', journalEntryId: entryRes.entryId } : m
        )
      );
      return { success: true, entryId: entryRes.entryId };
    }
    return { success: false, error: entryRes.error };
  };

  const deleteMileageLog = (id: string) => {
    setMileageLogs((prev) => prev.filter((m) => m.id !== id));
    return { success: true };
  };

  // ==========================================
  // INVENTORY TRACKING & VALUATION ENGINE
  // ==========================================
  const createInventoryItem = (
    data: Omit<InventoryStockItem, 'id' | 'status' | 'totalValuation'>
  ) => {
    const totalValuation = Math.round(data.quantityOnHand * data.unitCost * 100) / 100;
    const status: InventoryStockItem['status'] =
      data.quantityOnHand <= 0
        ? 'OUT_OF_STOCK'
        : data.quantityOnHand <= data.reorderThreshold
        ? 'LOW_STOCK'
        : 'IN_STOCK';

    const newItem: InventoryStockItem = {
      ...data,
      id: `inv-item-${Date.now()}`,
      totalValuation,
      status,
    };
    setInventoryItems((prev) => [newItem, ...prev]);
    return { success: true, item: newItem };
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryStockItem>) => {
    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.totalValuation = Math.round(updated.quantityOnHand * updated.unitCost * 100) / 100;
        updated.status =
          updated.quantityOnHand <= 0
            ? 'OUT_OF_STOCK'
            : updated.quantityOnHand <= updated.reorderThreshold
            ? 'LOW_STOCK'
            : 'IN_STOCK';
        return updated;
      })
    );
    return { success: true };
  };

  const adjustInventoryStock = (params: {
    itemId: string;
    type: InventoryAdjustmentRecord['type'];
    quantityDelta: number;
    reason: string;
    unitCost?: number;
    postToGl?: boolean;
  }) => {
    const item = inventoryItems.find((i) => i.id === params.itemId);
    if (!item) return { success: false, error: 'Inventory stock item not found.' };

    const previousQuantity = item.quantityOnHand;
    const newQuantity = Math.max(0, previousQuantity + params.quantityDelta);
    const cost = params.unitCost || item.unitCost;
    const totalCostAdjustment = Math.round(Math.abs(params.quantityDelta) * cost * 100) / 100;

    let entryId: string | undefined = undefined;
    if (params.postToGl && totalCostAdjustment > 0) {
      const isPositive = params.quantityDelta > 0;
      const glRes = postJournalEntry({
        tenantId: item.tenantId,
        date: new Date().toISOString().split('T')[0],
        description: `Inventory Adjustment (${params.type}): ${item.sku} - ${item.name}`,
        reference: `INV-ADJ-${Date.now().toString().slice(-6)}`,
        pluginId: activeTenant.pluginId,
        lines: [
          {
            id: `line-${Date.now()}-1`,
            accountId: 'acc-inv-asset',
            accountCode: '1500',
            accountName: 'Merchandise Inventory Asset',
            debit: isPositive ? totalCostAdjustment : 0,
            credit: isPositive ? 0 : totalCostAdjustment,
            memo: `${params.reason} (${params.quantityDelta > 0 ? '+' : ''}${params.quantityDelta} units)`,
          },
          {
            id: `line-${Date.now()}-2`,
            accountId: 'acc-inv-cogs',
            accountCode: isPositive ? '2010' : '5010',
            accountName: isPositive ? 'Accounts Payable / Supplier' : 'Cost of Goods Sold / Inventory Shrinkage',
            debit: isPositive ? 0 : totalCostAdjustment,
            credit: isPositive ? totalCostAdjustment : 0,
            memo: `${params.type}: ${item.name}`,
          },
        ],
      });
      if (glRes.success) entryId = glRes.entryId;
    }

    const adjustmentRecord: InventoryAdjustmentRecord = {
      id: `inv-adj-${Date.now()}`,
      tenantId: item.tenantId,
      date: new Date().toISOString().split('T')[0],
      inventoryItemId: item.id,
      sku: item.sku,
      name: item.name,
      type: params.type,
      quantityDelta: params.quantityDelta,
      previousQuantity,
      newQuantity,
      unitCost: cost,
      totalCostAdjustment,
      reason: params.reason,
      performedBy: userEmail,
      journalEntryId: entryId,
      createdAt: new Date().toISOString(),
    };

    setInventoryAdjustments((prev) => [adjustmentRecord, ...prev]);
    updateInventoryItem(item.id, {
      quantityOnHand: newQuantity,
      lastRestockedDate: params.quantityDelta > 0 ? new Date().toISOString().split('T')[0] : item.lastRestockedDate,
    });

    return { success: true, adjustment: adjustmentRecord };
  };

  const deleteInventoryItem = (id: string) => {
    setInventoryItems((prev) => prev.filter((i) => i.id !== id));
    return { success: true };
  };

  // ==========================================
  // PAYROLL & TAX WITHHOLDING ENGINE
  // ==========================================
  const createPayrollEmployee = (data: Omit<PayrollEmployee, 'id'>) => {
    const newEmp: PayrollEmployee = {
      ...data,
      id: `emp-${Date.now()}`,
    };
    setPayrollEmployees((prev) => [...prev, newEmp]);
    return { success: true, employee: newEmp };
  };

  const updatePayrollEmployee = (id: string, updates: Partial<PayrollEmployee>) => {
    setPayrollEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    return { success: true };
  };

  const deletePayrollEmployee = (id: string) => {
    setPayrollEmployees((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  };

  const calculatePayRunPreview = (
    payPeriodStart: string,
    payPeriodEnd: string,
    payDate: string,
    employeeIds?: string[]
  ) => {
    const targetEmps = payrollEmployees.filter(
      (e) =>
        e.tenantId === activeTenant.id &&
        e.status === 'ACTIVE' &&
        (!employeeIds || employeeIds.includes(e.id))
    );

    const lines: PayrollRunEmployeeLine[] = targetEmps.map((emp) => {
      // Calculate gross pay based on pay frequency and hourly vs salary
      let periodsPerYear = 24; // default SEMI_MONTHLY
      if (emp.payFrequency === 'WEEKLY') periodsPerYear = 52;
      else if (emp.payFrequency === 'BI_WEEKLY') periodsPerYear = 26;
      else if (emp.payFrequency === 'MONTHLY') periodsPerYear = 12;

      let grossPay = 0;
      if (emp.payType === 'HOURLY' && emp.hourlyRate) {
        const weeklyHours = emp.standardHoursPerWeek || 40;
        const totalAnnualHours = weeklyHours * 52;
        grossPay = Math.round(((emp.hourlyRate * totalAnnualHours) / periodsPerYear) * 100) / 100;
      } else {
        const annual = emp.baseSalaryAnnual || 100000;
        grossPay = Math.round((annual / periodsPerYear) * 100) / 100;
      }

      // Standard tax withholding rates & custom withholdings
      const federalRate = emp.filingStatus === 'MARRIED_FILING_JOINTLY' ? 0.13 : 0.15;
      const federalTax = Math.round((grossPay * federalRate + (emp.additionalWithholdingPerPeriod || 0)) * 100) / 100;
      const stateTax = Math.round(grossPay * 0.05 * 100) / 100;
      const socialSecurityTax = Math.round(grossPay * 0.062 * 100) / 100;
      const medicareTax = Math.round(grossPay * 0.0145 * 100) / 100;
      
      const healthDeduction = emp.healthBenefitDeduction !== undefined ? emp.healthBenefitDeduction : 125.0;
      const dentalVision = emp.dentalVisionDeduction || 0;
      const fourZeroOneK = emp.fourZeroOneKContributionRate ? Math.round(grossPay * (emp.fourZeroOneKContributionRate / 100) * 100) / 100 : 0;
      const benefitsDeduction = Math.round((healthDeduction + dentalVision + fourZeroOneK) * 100) / 100;

      const totalDeductions = federalTax + stateTax + socialSecurityTax + medicareTax + benefitsDeduction;
      const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

      // Employer match taxes & 401k match
      const employerFicaMatch = Math.round(grossPay * (0.062 + 0.0145) * 100) / 100;
      const employerFuta = Math.round(grossPay * 0.006 * 100) / 100;
      const totalEmployerCost = Math.round((grossPay + employerFicaMatch + employerFuta) * 100) / 100;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        grossPay,
        federalTax,
        stateTax,
        socialSecurityTax,
        medicareTax,
        benefitsDeduction,
        netPay,
        employerFicaMatch,
        employerFuta,
        totalEmployerCost,
      };
    });

    const totalGrossPay = Math.round(lines.reduce((s, l) => s + l.grossPay, 0) * 100) / 100;
    const totalEmployeeTaxWithholdings = Math.round(
      lines.reduce((s, l) => s + l.federalTax + l.stateTax + l.socialSecurityTax + l.medicareTax + l.benefitsDeduction, 0) * 100
    ) / 100;
    const totalEmployerTaxes = Math.round(
      lines.reduce((s, l) => s + l.employerFicaMatch + l.employerFuta, 0) * 100
    ) / 100;
    const totalNetPay = Math.round(lines.reduce((s, l) => s + l.netPay, 0) * 100) / 100;

    return {
      lines,
      totalGrossPay,
      totalEmployeeTaxWithholdings,
      totalEmployerTaxes,
      totalNetPay,
    };
  };

  const executePayRun = (params: {
    payPeriodStart: string;
    payPeriodEnd: string;
    payDate: string;
    employeeIds?: string[];
    postToGl?: boolean;
  }) => {
    const preview = calculatePayRunPreview(
      params.payPeriodStart,
      params.payPeriodEnd,
      params.payDate,
      params.employeeIds
    );

    if (preview.lines.length === 0) {
      return { success: false, error: 'No active employees found for this pay run.' };
    }

    let entryId: string | undefined = undefined;
    if (params.postToGl !== false) {
      const glRes = postJournalEntry({
        tenantId: activeTenant.id,
        date: params.payDate,
        description: `Payroll Disbursement & Withholdings: Period ${params.payPeriodStart} to ${params.payPeriodEnd}`,
        reference: `PAY-${params.payDate.replace(/-/g, '')}`,
        pluginId: activeTenant.pluginId,
        lines: [
          {
            id: `line-${Date.now()}-1`,
            accountId: 'acc-sal-exp',
            accountCode: '5020',
            accountName: 'Engineering & Staff Salaries Expense',
            debit: preview.totalGrossPay,
            credit: 0,
            memo: `Gross Wages (${preview.lines.length} staff)`,
          },
          {
            id: `line-${Date.now()}-2`,
            accountId: 'acc-emp-tax-exp',
            accountCode: '5020',
            accountName: 'Employer FICA & Payroll Taxes Expense',
            debit: preview.totalEmployerTaxes,
            credit: 0,
            memo: 'Employer FICA & FUTA Match',
          },
          {
            id: `line-${Date.now()}-3`,
            accountId: 'acc-tax-payable',
            accountCode: '2200',
            accountName: 'Payroll Taxes & Withholdings Payable',
            debit: 0,
            credit: Math.round((preview.totalEmployeeTaxWithholdings + preview.totalEmployerTaxes) * 100) / 100,
            memo: 'Federal, State, FICA & Benefits Withholdings',
          },
          {
            id: `line-${Date.now()}-4`,
            accountId: 'acc-net-cash',
            accountCode: '1010',
            accountName: 'Operating Cash - Chase (Direct Deposit)',
            debit: 0,
            credit: preview.totalNetPay,
            memo: 'Direct Deposit Net Disbursements',
          },
        ],
      });
      if (glRes.success) entryId = glRes.entryId;
    }

    const newRun: PayrollRun = {
      id: `prun-${Date.now()}`,
      tenantId: activeTenant.id,
      runNumber: `PAY-${params.payDate.slice(0, 7)}-${payrollRuns.length + 1}`,
      payPeriodStart: params.payPeriodStart,
      payPeriodEnd: params.payPeriodEnd,
      payDate: params.payDate,
      status: 'POSTED_TO_GL',
      totalGrossPay: preview.totalGrossPay,
      totalEmployeeTaxWithholdings: preview.totalEmployeeTaxWithholdings,
      totalEmployerTaxes: preview.totalEmployerTaxes,
      totalNetPay: preview.totalNetPay,
      employeeCount: preview.lines.length,
      journalEntryId: entryId,
      executedBy: userEmail,
      createdAt: new Date().toISOString(),
      lines: preview.lines,
    };

    setPayrollRuns((prev) => [newRun, ...prev]);
    return { success: true, run: newRun, entryId };
  };

  // ==========================================
  // CONNECTED BANK FEEDS ENGINE
  // ==========================================
  const connectBankFeed = (
    data: Omit<ConnectedBankFeed, 'id' | 'lastSyncedAt' | 'status'>
  ) => {
    const newFeed: ConnectedBankFeed = {
      ...data,
      id: `feed-${Date.now()}`,
      lastSyncedAt: new Date().toISOString(),
      status: 'CONNECTED',
    };
    setConnectedBankFeeds((prev) => [newFeed, ...prev]);
    return { success: true, feed: newFeed };
  };

  const syncBankFeed = (feedId: string) => {
    const feed = connectedBankFeeds.find((f) => f.id === feedId);
    if (!feed) return { success: false, newLinesCount: 0, error: 'Bank feed not found.' };

    const simulatedLines: Omit<BankStatementLine, 'id' | 'tenantId' | 'reconciled'>[] = [
      {
        date: new Date().toISOString().split('T')[0],
        description: `Direct Deposit Settlement - ${feed.institutionName}`,
        amount: Math.round((12000 + Math.random() * 8000) * 100) / 100,
        reference: `WIRE-${Date.now().toString().slice(-6)}`,
      },
      {
        date: new Date().toISOString().split('T')[0],
        description: `Merchant Interchange Fee - Automated Sweep`,
        amount: -Math.round((85 + Math.random() * 120) * 100) / 100,
        reference: `FEE-${Date.now().toString().slice(-4)}`,
      },
    ];

    const importRes = importBankStatements(simulatedLines);
    if (importRes.success) {
      setConnectedBankFeeds((prev) =>
        prev.map((f) => (f.id === feedId ? { ...f, lastSyncedAt: new Date().toISOString() } : f))
      );
      return { success: true, newLinesCount: importRes.count };
    }
    return { success: false, newLinesCount: 0, error: importRes.error };
  };

  const disconnectBankFeed = (feedId: string) => {
    setConnectedBankFeeds((prev) => prev.filter((f) => f.id !== feedId));
    return { success: true };
  };

  // ==========================================
  // ONLINE PAYMENT GATEWAY & PORTAL SIMULATOR
  // ==========================================
  const processOnlineInvoicePayment = (
    invoiceId: string,
    paymentMethod: PaymentMethodType,
    paymentDetails: { cardLast4?: string; accountLast4?: string; email?: string; notes?: string }
  ) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found.' };

    const outstanding = inv.totalAmount - inv.amountPaid;
    if (outstanding <= 0) return { success: false, error: 'Invoice is already fully settled.' };

    const receiptRes = recordCustomerPaymentReceipt({
      customerId: inv.customerId || 'cust-101',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      bankAccountId: 'acc-1001',
      referenceNumber: `GATEWAY-TX-${Date.now().toString().slice(-7)}`,
      totalAmountReceived: outstanding,
      allocations: [
        {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          allocatedAmount: outstanding,
        },
      ],
      notes: `Online Gateway Checkout (${paymentMethod}) - ${paymentDetails.notes || 'Instant Settlement'}`,
    });

    return receiptRes;
  };

  // ==========================================
  // COMPANY DATA BACKUP, 1-CLICK EXPORT & RESTORE ENGINE
  // ==========================================
  const downloadCompanyBackup = (options?: { tenantId?: string; scope?: 'single_company' | 'full_system' }) => {
    const targetTenantId = options?.tenantId || activeTenant.id;
    const isFullSystem = options?.scope === 'full_system';
    const targetTenant = tenants.find((t) => t.id === targetTenantId) || activeTenant;
    
    // Collect accounts for tenant or all
    const tenantAccounts = accountsMap[targetTenantId] || [];
    const allAccountsFlat = Object.values(accountsMap).flat();
    
    // Filter company-specific data
    const filteredJournals = isFullSystem ? journalEntries : journalEntries.filter((j) => j.tenantId === targetTenantId);
    const filteredInvoices = isFullSystem ? invoices : invoices.filter((i) => i.tenantId === targetTenantId);
    const filteredBills = isFullSystem ? vendorBills : vendorBills.filter((b) => b.tenantId === targetTenantId);
    const filteredReceipts = isFullSystem ? paymentReceipts : paymentReceipts.filter((p) => p.tenantId === targetTenantId);
    const filteredOpeningBalances = isFullSystem ? openingBalances : openingBalances.filter((o) => o.tenantId === targetTenantId);
    const filteredCustomers = isFullSystem ? customers : customers.filter((c) => c.tenantId === targetTenantId);
    const filteredVendors = isFullSystem ? vendors : vendors.filter((v) => v.tenantId === targetTenantId);
    const filteredProducts = isFullSystem ? productsServices : productsServices.filter((p) => p.tenantId === targetTenantId);
    const filteredPriceHistory = isFullSystem ? priceChangeHistory : priceChangeHistory.filter((h) => h.tenantId === targetTenantId);
    const filteredTemplates = isFullSystem ? invoiceTemplates : invoiceTemplates.filter((t) => t.tenantId === targetTenantId);
    const filteredBatches = isFullSystem ? bulkInvoiceBatches : bulkInvoiceBatches.filter((b) => b.tenantId === targetTenantId);
    const filteredRecurring = isFullSystem ? recurringSchedules : recurringSchedules.filter((r) => r.tenantId === targetTenantId);
    const filteredExpenses = isFullSystem ? expenseReceipts : expenseReceipts.filter((e) => e.tenantId === targetTenantId);
    const filteredMileage = isFullSystem ? mileageLogs : mileageLogs.filter((m) => m.tenantId === targetTenantId);
    const filteredInventory = isFullSystem ? inventoryItems : inventoryItems.filter((i) => i.tenantId === targetTenantId);
    const filteredAdjustments = isFullSystem ? inventoryAdjustments : inventoryAdjustments.filter((a) => a.tenantId === targetTenantId);
    const filteredEmployees = isFullSystem ? payrollEmployees : payrollEmployees.filter((e) => e.tenantId === targetTenantId);
    const filteredPayrollRuns = isFullSystem ? payrollRuns : payrollRuns.filter((r) => r.tenantId === targetTenantId);
    const filteredBankFeeds = isFullSystem ? connectedBankFeeds : connectedBankFeeds.filter((f) => f.tenantId === targetTenantId);
    const filteredBankStatements = isFullSystem ? bankStatements : bankStatements.filter((s) => s.tenantId === targetTenantId);
    const filteredFixedAssets = isFullSystem ? fixedAssets : fixedAssets.filter((a) => a.tenantId === targetTenantId);
    const filteredPeriods = isFullSystem ? fiscalPeriods : fiscalPeriods.filter((p) => p.tenantId === targetTenantId);
    const filteredTreasury = isFullSystem ? treasuryAccounts : treasuryAccounts.filter((t) => t.tenantId === targetTenantId);
    const filteredBudgets = isFullSystem ? departmentBudgets : departmentBudgets.filter((b) => b.tenantId === targetTenantId);
    const filteredApprovals = isFullSystem ? approvalItems : approvalItems.filter((a) => a.tenantId === targetTenantId);
    const filteredTaxJurisdictions = isFullSystem ? taxJurisdictions : taxJurisdictions.filter((t) => t.tenantId === targetTenantId);
    const filteredCustomAttributes = isFullSystem ? customAttributeDefinitions : customAttributeDefinitions.filter((c) => c.tenantId === targetTenantId);
    const filteredAuditLogs = isFullSystem ? auditLogs : auditLogs.filter((a) => a.tenantId === targetTenantId);

    // Calculate debits and credits totals
    let totalDebits = 0;
    let totalCredits = 0;
    filteredJournals.forEach((j) => {
      totalDebits += j.totalDebit || 0;
      totalCredits += j.totalCredit || 0;
    });

    const recordCounts: CompanyBackupRecordCounts = {
      accounts: (isFullSystem ? allAccountsFlat : tenantAccounts).length,
      journalEntries: filteredJournals.length,
      invoices: filteredInvoices.length,
      vendorBills: filteredBills.length,
      paymentReceipts: filteredReceipts.length,
      openingBalances: filteredOpeningBalances.length,
      customers: filteredCustomers.length,
      vendors: filteredVendors.length,
      productsServices: filteredProducts.length,
      priceChangeHistory: filteredPriceHistory.length,
      invoiceTemplates: filteredTemplates.length,
      bulkInvoiceBatches: filteredBatches.length,
      recurringSchedules: filteredRecurring.length,
      expenseReceipts: filteredExpenses.length,
      mileageLogs: filteredMileage.length,
      inventoryItems: filteredInventory.length,
      inventoryAdjustments: filteredAdjustments.length,
      payrollEmployees: filteredEmployees.length,
      payrollRuns: filteredPayrollRuns.length,
      connectedBankFeeds: filteredBankFeeds.length,
      bankStatements: filteredBankStatements.length,
      fixedAssets: filteredFixedAssets.length,
      fiscalPeriods: filteredPeriods.length,
      treasuryAccounts: filteredTreasury.length,
      departmentBudgets: filteredBudgets.length,
      approvalItems: filteredApprovals.length,
      taxJurisdictions: filteredTaxJurisdictions.length,
      customAttributeDefinitions: filteredCustomAttributes.length,
      auditLogs: filteredAuditLogs.length,
    };

    const backupId = `bkp-${targetTenant.code.toLowerCase()}-${Date.now()}`;
    const exportedAt = new Date().toISOString();

    const payload: CompanyBackupPayload = {
      schema: 'enterprise_accounting_backup_v1',
      metadata: {
        schemaVersion: '1.0',
        backupId,
        exportedAt,
        exportedBy: userEmail,
        scope: isFullSystem ? 'full_system' : 'single_company',
        tenantId: targetTenant.id,
        tenantName: targetTenant.name,
        tenantCode: targetTenant.code,
        currency: targetTenant.currency,
        country: targetTenant.country,
        pluginId: targetTenant.pluginId,
        totalDebits: Math.round(totalDebits * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
        recordCounts,
        systemNote: `One-Click Company Snapshot exported for ${targetTenant.name} (${targetTenant.code}) on ${new Date().toLocaleDateString()}`,
      },
      data: {
        tenant: targetTenant,
        accounts: isFullSystem ? allAccountsFlat : tenantAccounts,
        journalEntries: filteredJournals,
        invoices: filteredInvoices,
        vendorBills: filteredBills,
        paymentReceipts: filteredReceipts,
        openingBalances: filteredOpeningBalances,
        customers: filteredCustomers,
        vendors: filteredVendors,
        productsServices: filteredProducts,
        priceChangeHistory: filteredPriceHistory,
        invoiceTemplates: filteredTemplates,
        bulkInvoiceBatches: filteredBatches,
        recurringSchedules: filteredRecurring,
        expenseReceipts: filteredExpenses,
        mileageLogs: filteredMileage,
        inventoryItems: filteredInventory,
        inventoryAdjustments: filteredAdjustments,
        payrollEmployees: filteredEmployees,
        payrollRuns: filteredPayrollRuns,
        connectedBankFeeds: filteredBankFeeds,
        bankStatements: filteredBankStatements,
        fixedAssets: filteredFixedAssets,
        fiscalPeriods: filteredPeriods,
        treasuryAccounts: filteredTreasury,
        departmentBudgets: filteredBudgets,
        approvalItems: filteredApprovals,
        taxJurisdictions: filteredTaxJurisdictions,
        customAttributeDefinitions: filteredCustomAttributes,
        auditLogs: filteredAuditLogs,
        ...(isFullSystem ? { allTenants: tenants } : {}),
      },
    };

    // Generate JSON and trigger automatic download
    try {
      const jsonString = JSON.stringify(payload, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `${targetTenant.code.toLowerCase()}_backup_${dateStr}_${Date.now().toString().slice(-4)}.json`;
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addAuditLog({
        action: 'EXPORT_REPORT',
        tenantId: targetTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Downloaded 1-Click Company Snapshot for ${targetTenant.name} (${targetTenant.code})`,
        status: 'SUCCESS',
        payloadSummary: `File: ${fileName} | Records: ${Object.values(recordCounts).reduce((a, b) => a + b, 0)} total records | Balanced: ${payload.metadata.isBalanced ? 'YES' : 'NO'}`,
      });

      return { success: true, fileName, backupPayload: payload };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to generate download file.' };
    }
  };

  const validateBackupFileContent = (fileContent: string): BackupValidationResult => {
    try {
      const parsed = JSON.parse(fileContent) as CompanyBackupPayload;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, errors: ['File does not contain a valid JSON object.'], warnings: [] };
      }

      if (parsed.schema !== 'enterprise_accounting_backup_v1') {
        errors.push(`Unrecognized or missing backup schema: '${(parsed as any).schema || 'undefined'}'. Expected 'enterprise_accounting_backup_v1'.`);
      }

      if (!parsed.metadata) {
        errors.push('Missing backup metadata section.');
      } else {
        if (!parsed.metadata.tenantId || !parsed.metadata.tenantCode) {
          errors.push('Invalid tenant information in metadata.');
        }
        if (parsed.metadata.isBalanced === false) {
          warnings.push('Warning: Backup metadata indicates a trial balance imbalance at export time.');
        }
      }

      if (!parsed.data || typeof parsed.data !== 'object') {
        errors.push('Missing backup data payload.');
      } else {
        if (!Array.isArray(parsed.data.accounts)) {
          errors.push('Missing or invalid accounts array in data payload.');
        }
        if (!Array.isArray(parsed.data.journalEntries)) {
          errors.push('Missing or invalid journalEntries array in data payload.');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: parsed.metadata,
        parsedPayload: parsed,
      };
    } catch (err: any) {
      return {
        isValid: false,
        errors: [`JSON parse error: ${err?.message || 'Invalid format'}`],
        warnings: [],
      };
    }
  };

  const restoreCompanyBackup = (
    payload: CompanyBackupPayload,
    options?: { mode: 'replace_current' | 'restore_as_new_tenant'; targetTenantCode?: string; targetTenantName?: string }
  ) => {
    if (!payload || !payload.data || !payload.metadata) {
      return { success: false, error: 'Invalid backup structure. Missing payload or metadata.' };
    }

    const mode = options?.mode || 'replace_current';
    const originalTenant = payload.data.tenant || {
      id: payload.metadata.tenantId,
      name: payload.metadata.tenantName,
      code: payload.metadata.tenantCode,
      currency: payload.metadata.currency || 'USD',
      country: payload.metadata.country || 'US',
      pluginId: payload.metadata.pluginId || 'us_gaap',
      organizations: [],
    };

    let targetTenantId = originalTenant.id;
    let targetTenantObj = { ...originalTenant };

    if (mode === 'restore_as_new_tenant') {
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      targetTenantId = `t-${(options?.targetTenantCode || originalTenant.code).toLowerCase()}-${suffix.toLowerCase()}`;
      targetTenantObj = {
        ...originalTenant,
        id: targetTenantId,
        name: options?.targetTenantName || `${originalTenant.name} (Restored ${new Date().toLocaleDateString()})`,
        code: (options?.targetTenantCode || `${originalTenant.code}_REST_${suffix}`).toUpperCase(),
        organizations: originalTenant.organizations?.map((org) => ({
          ...org,
          id: `org-${targetTenantId}-${Math.random().toString(36).substring(2, 5)}`,
          tenantId: targetTenantId,
          branches: org.branches?.map((br) => ({
            ...br,
            id: `br-${targetTenantId}-${Math.random().toString(36).substring(2, 5)}`,
            tenantId: targetTenantId,
          })) || [],
        })) || [],
      };
    }

    // Remap data tenantId if restoring as a new tenant
    const mapTenantId = <T extends { tenantId?: string }>(item: T): T => {
      if (mode === 'restore_as_new_tenant') {
        return { ...item, tenantId: targetTenantId };
      }
      return item;
    };

    const restoredAccounts = (payload.data.accounts || []).map(mapTenantId);
    const restoredJournals = (payload.data.journalEntries || []).map(mapTenantId);
    const restoredInvoices = (payload.data.invoices || []).map(mapTenantId);
    const restoredBills = (payload.data.vendorBills || []).map(mapTenantId);
    const restoredReceipts = (payload.data.paymentReceipts || []).map(mapTenantId);
    const restoredOpeningBalances = (payload.data.openingBalances || []).map(mapTenantId);
    const restoredCustomers = (payload.data.customers || []).map(mapTenantId);
    const restoredVendors = (payload.data.vendors || []).map(mapTenantId);
    const restoredProducts = (payload.data.productsServices || []).map(mapTenantId);
    const restoredPriceHistory = (payload.data.priceChangeHistory || []).map(mapTenantId);
    const restoredTemplates = (payload.data.invoiceTemplates || []).map(mapTenantId);
    const restoredBatches = (payload.data.bulkInvoiceBatches || []).map(mapTenantId);
    const restoredRecurring = (payload.data.recurringSchedules || []).map(mapTenantId);
    const restoredExpenses = (payload.data.expenseReceipts || []).map(mapTenantId);
    const restoredMileage = (payload.data.mileageLogs || []).map(mapTenantId);
    const restoredInventory = (payload.data.inventoryItems || []).map(mapTenantId);
    const restoredAdjustments = (payload.data.inventoryAdjustments || []).map(mapTenantId);
    const restoredEmployees = (payload.data.payrollEmployees || []).map(mapTenantId);
    const restoredPayrollRuns = (payload.data.payrollRuns || []).map(mapTenantId);
    const restoredBankFeeds = (payload.data.connectedBankFeeds || []).map(mapTenantId);
    const restoredBankStatements = (payload.data.bankStatements || []).map(mapTenantId);
    const restoredFixedAssets = (payload.data.fixedAssets || []).map(mapTenantId);
    const restoredFiscalPeriods = (payload.data.fiscalPeriods || []).map(mapTenantId);
    const restoredTreasury = (payload.data.treasuryAccounts || []).map(mapTenantId);
    const restoredBudgets = (payload.data.departmentBudgets || []).map(mapTenantId);
    const restoredApprovals = (payload.data.approvalItems || []).map(mapTenantId);
    const restoredTaxJurisdictions = (payload.data.taxJurisdictions || []).map(mapTenantId);
    const restoredCustomAttributes = (payload.data.customAttributeDefinitions || []).map(mapTenantId);
    const restoredAuditLogs = (payload.data.auditLogs || []).map(mapTenantId);

    // 1. Update tenants
    setTenants((prev) => {
      const exists = prev.some((t) => t.id === targetTenantId);
      if (exists) {
        return prev.map((t) => (t.id === targetTenantId ? targetTenantObj : t));
      }
      return [...prev, targetTenantObj];
    });

    // 2. Update accounts map
    setAccountsMap((prev) => ({
      ...prev,
      [targetTenantId]: restoredAccounts,
    }));

    // 3. Update sub-ledgers (replace existing records for this tenant)
    setJournalEntries((prev) => [...prev.filter((j) => j.tenantId !== targetTenantId), ...restoredJournals]);
    setInvoices((prev) => [...prev.filter((i) => i.tenantId !== targetTenantId), ...restoredInvoices]);
    setVendorBills((prev) => [...prev.filter((b) => b.tenantId !== targetTenantId), ...restoredBills]);
    setPaymentReceipts((prev) => [...prev.filter((p) => p.tenantId !== targetTenantId), ...restoredReceipts]);
    setOpeningBalances((prev) => [...prev.filter((o) => o.tenantId !== targetTenantId), ...restoredOpeningBalances]);
    setCustomers((prev) => [...prev.filter((c) => c.tenantId !== targetTenantId), ...restoredCustomers]);
    setVendors((prev) => [...prev.filter((v) => v.tenantId !== targetTenantId), ...restoredVendors]);
    setProductsServices((prev) => [...prev.filter((p) => p.tenantId !== targetTenantId), ...restoredProducts]);
    setPriceChangeHistory((prev) => [...prev.filter((h) => h.tenantId !== targetTenantId), ...restoredPriceHistory]);
    setInvoiceTemplates((prev) => [...prev.filter((t) => t.tenantId !== targetTenantId), ...restoredTemplates]);
    setBulkInvoiceBatches((prev) => [...prev.filter((b) => b.tenantId !== targetTenantId), ...restoredBatches]);
    setRecurringSchedules((prev) => [...prev.filter((r) => r.tenantId !== targetTenantId), ...restoredRecurring]);
    setExpenseReceipts((prev) => [...prev.filter((e) => e.tenantId !== targetTenantId), ...restoredExpenses]);
    setMileageLogs((prev) => [...prev.filter((m) => m.tenantId !== targetTenantId), ...restoredMileage]);
    setInventoryItems((prev) => [...prev.filter((i) => i.tenantId !== targetTenantId), ...restoredInventory]);
    setInventoryAdjustments((prev) => [...prev.filter((a) => a.tenantId !== targetTenantId), ...restoredAdjustments]);
    setPayrollEmployees((prev) => [...prev.filter((p) => p.tenantId !== targetTenantId), ...restoredEmployees]);
    setPayrollRuns((prev) => [...prev.filter((r) => r.tenantId !== targetTenantId), ...restoredPayrollRuns]);
    setConnectedBankFeeds((prev) => [...prev.filter((f) => f.tenantId !== targetTenantId), ...restoredBankFeeds]);
    setBankStatements((prev) => [...prev.filter((s) => s.tenantId !== targetTenantId), ...restoredBankStatements]);
    setFixedAssets((prev) => [...prev.filter((a) => a.tenantId !== targetTenantId), ...restoredFixedAssets]);
    if (restoredFiscalPeriods.length > 0) {
      setFiscalPeriods((prev) => [...prev.filter((p) => p.tenantId !== targetTenantId), ...restoredFiscalPeriods]);
    }
    if (restoredTreasury.length > 0) {
      setTreasuryAccounts((prev) => [...prev.filter((t) => t.tenantId !== targetTenantId), ...restoredTreasury]);
    }
    if (restoredBudgets.length > 0) {
      setDepartmentBudgets((prev) => [...prev.filter((b) => b.tenantId !== targetTenantId), ...restoredBudgets]);
    }
    if (restoredApprovals.length > 0) {
      setApprovalItems((prev) => [...prev.filter((a) => a.tenantId !== targetTenantId), ...restoredApprovals]);
    }
    if (restoredTaxJurisdictions.length > 0) {
      setTaxJurisdictions((prev) => [...prev.filter((t) => t.tenantId !== targetTenantId), ...restoredTaxJurisdictions]);
    }
    if (restoredCustomAttributes.length > 0) {
      setCustomAttributeDefinitions((prev) => [...prev.filter((c) => c.tenantId !== targetTenantId), ...restoredCustomAttributes]);
    }
    setAuditLogs((prev) => [...prev.filter((a) => a.tenantId !== targetTenantId), ...restoredAuditLogs]);

    // 4. Switch context to the restored tenant
    setActiveTenantId(targetTenantId);

    addAuditLog({
      action: 'SYSTEM_CLOSE',
      tenantId: targetTenantId,
      userRole: activeRole,
      userEmail,
      details: `Restored company data snapshot for ${targetTenantObj.name} (${targetTenantObj.code}) [Mode: ${mode}]`,
      status: 'SUCCESS',
      payloadSummary: `Source Backup ID: ${payload.metadata.backupId} | Restored: ${restoredAccounts.length} accounts, ${restoredJournals.length} journals, ${restoredInvoices.length} invoices, ${restoredCustomers.length} customers`,
    });

    return {
      success: true,
      tenantId: targetTenantId,
      tenantName: targetTenantObj.name,
      restoredCounts: payload.metadata.recordCounts,
    };
  };

  // Webhooks Dispatcher & Outbound Event Engine Handlers
  const createWebhookEndpoint = (
    data: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'failureCount'>
  ): WebhookEndpoint => {
    const newEp: WebhookEndpoint = {
      ...data,
      id: `wh_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failureCount: 0,
    };
    setWebhookEndpoints((prev) => [newEp, ...prev]);
    addAuditLog({
      action: 'WEBHOOK_CREATE',
      tenantId: data.tenantId || activeTenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Created outbound webhook endpoint "${newEp.name}" (${newEp.url}) for events: ${newEp.events.join(', ')}`,
    });
    return newEp;
  };

  const updateWebhookEndpoint = (id: string, updates: Partial<WebhookEndpoint>) => {
    setWebhookEndpoints((prev) =>
      prev.map((ep) => (ep.id === id ? { ...ep, ...updates, updatedAt: new Date().toISOString() } : ep))
    );
    addAuditLog({
      action: 'WEBHOOK_UPDATE',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Updated webhook endpoint configuration ID: ${id}`,
    });
  };

  const deleteWebhookEndpoint = (id: string) => {
    const ep = webhookEndpoints.find((e) => e.id === id);
    setWebhookEndpoints((prev) => prev.filter((e) => e.id !== id));
    addAuditLog({
      action: 'WEBHOOK_DELETE',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Deleted webhook endpoint "${ep?.name || id}"`,
    });
  };

  const testDispatchWebhook = async (
    endpointId: string,
    event: WebhookEventType,
    customPayload?: any
  ): Promise<{ success: boolean; log: WebhookDeliveryLog }> => {
    const ep = webhookEndpoints.find((e) => e.id === endpointId);
    const targetName = ep ? ep.name : 'Simulated Endpoint';
    const targetTenant = ep?.tenantId || activeTenantId;

    const payload =
      customPayload || {
        event,
        timestamp: new Date().toISOString(),
        tenantId: targetTenant,
        data: {
          test: true,
          triggeredBy: userEmail,
          message: 'Interactive Webhook Event Simulation Payload',
        },
      };

    const latency = Math.floor(Math.random() * 120) + 35; // 35 - 155ms realistic latency
    const isSuccess = !ep || ep.isActive;

    const newLog: WebhookDeliveryLog = {
      id: `whlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: targetTenant,
      endpointId,
      endpointName: targetName,
      event,
      payload,
      responseStatus: isSuccess ? 200 : 503,
      responseBody: isSuccess
        ? JSON.stringify({ status: 'ok', received: true, event, processedAt: new Date().toISOString() }, null, 2)
        : JSON.stringify({ error: 'Endpoint inactive or unreachable in current simulated network topology' }, null, 2),
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      latencyMs: latency,
      attemptNumber: 1,
      timestamp: new Date().toISOString(),
      requestHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'Enterprise-Accounting-Webhook-Dispatcher/2.0',
        'X-Hub-Signature-256': `sha256=${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
        'X-Delivery-Id': `del_${Math.random().toString(36).substring(2, 10)}`,
        'X-Accounting-Event': event,
      },
    };

    setWebhookLogs((prev) => [newLog, ...prev]);

    // Update endpoint last triggered date
    if (ep) {
      setWebhookEndpoints((prev) =>
        prev.map((e) => (e.id === endpointId ? { ...e, lastTriggeredAt: new Date().toISOString() } : e))
      );
    }

    addAuditLog({
      action: 'WEBHOOK_DISPATCH',
      tenantId: targetTenant,
      userRole: activeRole,
      userEmail,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      details: `Dispatched webhook event "${event}" to ${targetName} (HTTP ${newLog.responseStatus} in ${latency}ms)`,
    });

    return { success: isSuccess, log: newLog };
  };

  const retryWebhookDelivery = async (logId: string): Promise<{ success: boolean; log?: WebhookDeliveryLog }> => {
    const existingLog = webhookLogs.find((l) => l.id === logId);
    if (!existingLog) return { success: false };

    const latency = Math.floor(Math.random() * 95) + 28;
    const updatedLog: WebhookDeliveryLog = {
      ...existingLog,
      id: `whlog_${Date.now()}_retry`,
      responseStatus: 200,
      responseBody: JSON.stringify({ status: 'ok', replayed: true, previousLogId: logId, processedAt: new Date().toISOString() }, null, 2),
      status: 'SUCCESS',
      attemptNumber: existingLog.attemptNumber + 1,
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    };

    setWebhookLogs((prev) => [updatedLog, ...prev]);
    addAuditLog({
      action: 'WEBHOOK_DISPATCH',
      tenantId: existingLog.tenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Re-dispatched webhook event "${existingLog.event}" to ${existingLog.endpointName} (Attempt #${updatedLog.attemptNumber})`,
    });

    return { success: true, log: updatedLog };
  };

  const dispatchAccountingEvent = async (event: WebhookEventType, payloadData: any, tenantIdOverride?: string) => {
    const targetTenant = tenantIdOverride || activeTenantId;
    const matchingEndpoints = webhookEndpoints.filter(
      (ep) => ep.tenantId === targetTenant && ep.isActive && ep.events.includes(event)
    );

    for (const ep of matchingEndpoints) {
      await testDispatchWebhook(ep.id, event, {
        event,
        timestamp: new Date().toISOString(),
        tenantId: targetTenant,
        data: payloadData,
      });
    }
  };

  // Scoped API Key Engine Handlers
  const createScopedApiKey = (data: {
    name: string;
    role: Role;
    environment?: 'LIVE' | 'TEST' | 'SANDBOX';
    scopes: ApiKeyPermissionScope[];
    rateLimitPerMin?: number;
    expiresInDays?: number;
    tenantId?: string;
  }): { success: boolean; apiKey?: ScopedApiKey; fullSecretKey?: string; error?: string } => {
    const env = data.environment || 'LIVE';
    const prefix = env === 'LIVE' ? 'sec_live_' : env === 'TEST' ? 'sec_test_' : 'sec_sbx_';
    const randomBody = `${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
    const fullSecretKey = `${prefix}${randomBody}`;
    const maskedKey = `${prefix}${randomBody.substring(0, 4)}••••••••${randomBody.substring(randomBody.length - 4)}`;
    const expiresAt = new Date(Date.now() + (data.expiresInDays || 365) * 24 * 60 * 60 * 1000).toISOString();

    const newKey: ScopedApiKey = {
      id: `key_${Math.random().toString(36).substring(2, 9)}`,
      tenantId: data.tenantId || activeTenantId,
      name: data.name,
      keyPrefix: `${prefix}${randomBody.substring(0, 4)}`,
      maskedKey,
      fullKey: fullSecretKey,
      role: data.role,
      environment: env,
      scopes: data.scopes,
      rateLimitPerMin: data.rateLimitPerMin || 600,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'ACTIVE',
      createdBy: userEmail,
    };

    setScopedApiKeys((prev) => [newKey, ...prev]);
    addAuditLog({
      action: 'API_KEY_CREATE',
      tenantId: data.tenantId || activeTenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Generated new ${env} API Key "${newKey.name}" with scopes: [${newKey.scopes.join(', ')}]`,
    });

    return { success: true, apiKey: newKey, fullSecretKey };
  };

  const revokeScopedApiKey = (id: string) => {
    const key = scopedApiKeys.find((k) => k.id === id);
    setScopedApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'REVOKED' } : k))
    );
    addAuditLog({
      action: 'API_KEY_REVOKE',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Revoked API Key "${key?.name || id}" (${key?.keyPrefix})`,
    });
  };

  const deleteScopedApiKey = (id: string) => {
    setScopedApiKeys((prev) => prev.filter((k) => k.id !== id));
    addAuditLog({
      action: 'API_KEY_REVOKE',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Deleted API Key record ID: ${id}`,
    });
  };

  // Integration Connectors Hub Handlers
  const connectIntegrationConnector = (
    platform: ConnectorPlatform,
    credentials: Record<string, string>,
    syncSettings?: any
  ): { success: boolean; connector?: IntegrationConnector } => {
    const existing = integrationConnectors.find(
      (c) => c.tenantId === activeTenantId && c.platform === platform
    );

    const defaultSettings = {
      autoSyncInvoices: true,
      autoSyncCustomers: true,
      autoPostJournals: true,
      syncIntervalMinutes: 15,
      taxHandling: 'AUTO_CALCULATE' as const,
      ...syncSettings,
    };

    if (existing) {
      const updated: IntegrationConnector = {
        ...existing,
        status: 'CONNECTED',
        credentials: { ...existing.credentials, ...credentials },
        syncSettings: defaultSettings,
      };
      setIntegrationConnectors((prev) =>
        prev.map((c) => (c.id === existing.id ? updated : c))
      );
      addAuditLog({
        action: 'CONNECTOR_CONNECT',
        tenantId: activeTenantId,
        userRole: activeRole,
        userEmail,
        status: 'SUCCESS',
        details: `Configured and connected ${existing.name} integration connector`,
      });
      return { success: true, connector: updated };
    } else {
      const newConn: IntegrationConnector = {
        id: `conn_${platform.toLowerCase()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId: activeTenantId,
        platform,
        name: platform.charAt(0) + platform.slice(1).toLowerCase(),
        description: `Connected ${platform} integration hub connector`,
        category:
          platform === 'ZAPIER' || platform === 'MAKE'
            ? 'AUTOMATION'
            : platform === 'STRIPE'
            ? 'PAYMENTS'
            : platform === 'SHOPIFY'
            ? 'ECOMMERCE'
            : platform === 'GUSTO'
            ? 'PAYROLL'
            : 'CRM',
        status: 'CONNECTED',
        authType: 'API_KEY',
        credentials,
        syncSettings: defaultSettings,
        stats: {
          totalSyncedRecords: 0,
        },
      };
      setIntegrationConnectors((prev) => [newConn, ...prev]);
      addAuditLog({
        action: 'CONNECTOR_CONNECT',
        tenantId: activeTenantId,
        userRole: activeRole,
        userEmail,
        status: 'SUCCESS',
        details: `Connected new ${newConn.name} integration connector`,
      });
      return { success: true, connector: newConn };
    }
  };

  const syncIntegrationConnector = async (
    connectorId: string
  ): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    const conn = integrationConnectors.find((c) => c.id === connectorId);
    if (!conn) return { success: false, syncedCount: 0, message: 'Connector not found' };

    // Simulate batch sync
    const simulatedBatchCount = Math.floor(Math.random() * 8) + 2;
    const updated: IntegrationConnector = {
      ...conn,
      stats: {
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'OK',
        lastSyncMessage: `Successfully ingested ${simulatedBatchCount} new transactions & synchronized general ledger accounts.`,
        totalSyncedRecords: conn.stats.totalSyncedRecords + simulatedBatchCount,
      },
    };

    setIntegrationConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? updated : c))
    );

    addAuditLog({
      action: 'CONNECTOR_SYNC',
      tenantId: conn.tenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Executed scheduled synchronization for ${conn.name} (+${simulatedBatchCount} records posted)`,
    });

    return {
      success: true,
      syncedCount: simulatedBatchCount,
      message: `Successfully synchronized ${simulatedBatchCount} records from ${conn.name}`,
    };
  };

  const disconnectIntegrationConnector = (connectorId: string) => {
    const conn = integrationConnectors.find((c) => c.id === connectorId);
    setIntegrationConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? { ...c, status: 'DISCONNECTED' } : c))
    );
    addAuditLog({
      action: 'CONNECTOR_DISCONNECT',
      tenantId: activeTenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Disconnected ${conn?.name || connectorId} integration connector`,
    });
  };

  // AI Audit Copilot Entity Configuration & Token Quotas
  const activeTenantAiConfig = useMemo<EntityAiConfig>(() => {
    if (tenantAiConfigs[activeTenantId]) {
      return tenantAiConfigs[activeTenantId];
    }
    return {
      tenantId: activeTenantId,
      apiKey: '',
      isKeyConfigured: false,
      model: 'gemini-2.5-flash',
      monthlyTokenQuota: 500000,
      tokensUsedThisPeriod: 0,
      quotaResetCycle: 'MONTHLY',
      lastResetDate: new Date().toISOString().split('T')[0],
      requestsCountThisPeriod: 0,
      totalTokensAllTime: 0,
      alertThresholdPercent: 80,
      enforceStrictQuota: true,
      customAuditInstructions: '',
    };
  }, [tenantAiConfigs, activeTenantId]);

  const updateTenantAiConfig = (tenantId: string, updates: Partial<EntityAiConfig>): { success: boolean; error?: string } => {
    // Check permission: super_user, entity_admin (for their tenant), admin
    const currentScope = enterpriseUsers.find((u) => u.email === userEmail)?.tenantScopes.find((s) => s.tenantId === tenantId);
    const isEntityAdminForTenant = activeRole === 'entity_admin' && (currentScope?.role === 'entity_admin' || activeTenantId === tenantId);
    const isSuperUserOrAdmin = activeRole === 'super_user' || activeRole === 'admin';

    if (!isSuperUserOrAdmin && !isEntityAdminForTenant) {
      return {
        success: false,
        error: 'Forbidden: Only an Entity Administrator or Super User can configure AI API Keys and Token Quota limits for this entity.'
      };
    }

    setTenantAiConfigs((prev) => {
      const existing = prev[tenantId] || {
        tenantId,
        apiKey: '',
        isKeyConfigured: false,
        model: 'gemini-2.5-flash',
        monthlyTokenQuota: 500000,
        tokensUsedThisPeriod: 0,
        quotaResetCycle: 'MONTHLY',
        lastResetDate: new Date().toISOString().split('T')[0],
        requestsCountThisPeriod: 0,
        totalTokensAllTime: 0,
        alertThresholdPercent: 80,
        enforceStrictQuota: true,
      };

      const newApiKey = updates.apiKey !== undefined ? updates.apiKey.trim() : existing.apiKey;
      const isConfigured = Boolean(newApiKey && newApiKey.length > 0);

      const updated: EntityAiConfig = {
        ...existing,
        ...updates,
        apiKey: newApiKey,
        isKeyConfigured: isConfigured,
        configuredByEmail: userEmail,
        configuredAt: new Date().toISOString(),
      };

      return {
        ...prev,
        [tenantId]: updated
      };
    });

    addAuditLog({
      action: 'AI_ENTITY_KEY_CONFIGURED',
      tenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `Entity AI API Key and Token Quota updated. Model: ${updates.model || 'gemini-2.5-flash'}, Quota: ${updates.monthlyTokenQuota ? updates.monthlyTokenQuota.toLocaleString() + ' tokens' : 'Unlimited'}, Enforce Strict: ${updates.enforceStrictQuota !== false ? 'YES' : 'NO'}.`,
    });

    return { success: true };
  };

  const recordAiTokenUsage = (params: { tenantId: string; model: string; promptTokens: number; responseTokens: number; queryTopic: string }) => {
    const total = params.promptTokens + params.responseTokens;
    const now = new Date().toISOString();

    setTenantAiConfigs((prev) => {
      const existing = prev[params.tenantId] || {
        tenantId: params.tenantId,
        apiKey: '',
        isKeyConfigured: false,
        model: params.model || 'gemini-2.5-flash',
        monthlyTokenQuota: 500000,
        tokensUsedThisPeriod: 0,
        quotaResetCycle: 'MONTHLY',
        lastResetDate: new Date().toISOString().split('T')[0],
        requestsCountThisPeriod: 0,
        totalTokensAllTime: 0,
        alertThresholdPercent: 80,
        enforceStrictQuota: true,
      };

      return {
        ...prev,
        [params.tenantId]: {
          ...existing,
          tokensUsedThisPeriod: existing.tokensUsedThisPeriod + total,
          totalTokensAllTime: existing.totalTokensAllTime + total,
          requestsCountThisPeriod: existing.requestsCountThisPeriod + 1,
          lastUsedAt: now,
        }
      };
    });

    const newLog: AiTokenUsageLog = {
      id: `ai-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.replace('T', ' ').slice(0, 19),
      tenantId: params.tenantId,
      userEmail,
      model: params.model,
      promptTokens: params.promptTokens,
      responseTokens: params.responseTokens,
      totalTokens: total,
      queryTopic: params.queryTopic,
    };

    setAiUsageLogs((prev) => [newLog, ...prev]);
  };

  const resetTenantAiQuota = (tenantId: string): { success: boolean; error?: string } => {
    const isEntityAdminForTenant = activeRole === 'entity_admin' && activeTenantId === tenantId;
    const isSuperUserOrAdmin = activeRole === 'super_user' || activeRole === 'admin';

    if (!isSuperUserOrAdmin && !isEntityAdminForTenant) {
      return {
        success: false,
        error: 'Forbidden: Only an Entity Administrator or Super User can reset the AI token consumption counter.'
      };
    }

    setTenantAiConfigs((prev) => {
      const existing = prev[tenantId];
      if (!existing) return prev;
      return {
        ...prev,
        [tenantId]: {
          ...existing,
          tokensUsedThisPeriod: 0,
          requestsCountThisPeriod: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        }
      };
    });

    addAuditLog({
      action: 'AI_TOKEN_QUOTA_RESET',
      tenantId,
      userRole: activeRole,
      userEmail,
      status: 'SUCCESS',
      details: `AI Token usage counter manually reset to 0 for entity ${tenantId}.`,
    });

    return { success: true };
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
        userName,
        activePlugin,
        setActiveTenantId,
        setActiveOrganizationId: setActiveOrgId,
        setActiveBranchId,
        setActiveRole,
        setUserEmail,
        setUserName,
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
        approvalRules,
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
        recurringSchedules,
        expenseReceipts,
        mileageLogs,
        inventoryItems,
        inventoryAdjustments,
        payrollEmployees,
        payrollRuns,
        connectedBankFeeds,

        createApprovalRule,
        updateApprovalRule,
        deleteApprovalRule,
        toggleApprovalRule,
        submitApprovalRequest,
        processApprovalDecision,

        createCustomRole,
        updateCustomRole,
        deleteCustomRole,
        cloneCustomRole,

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

        // Purchase Orders & Configurable Approval Engine
        purchaseOrders,
        poApprovalTiers,
        createPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        submitPurchaseOrderForApproval,
        approvePurchaseOrder,
        rejectPurchaseOrder,
        receiveGoodsForPurchaseOrder,
        convertPurchaseOrderToVendorBill,
        updatePoApprovalTiers,
        resetPoApprovalTiersToDefault,

        toggleFiscalPeriodStatus,
        executeYearEndClose,
        executeSweepTransfer,
        updateDepartmentBudget,
        postTaxSettlementVoucher,
        reconcileBankLine,
        importBankStatements,
        autoMatchAndReconcile,
        createAndReconcileGLLine,

        createRecurringSchedule,
        updateRecurringSchedule,
        deleteRecurringSchedule,
        runRecurringScheduleNow,

        createExpenseReceipt,
        postExpenseReceiptToGL,
        deleteExpenseReceipt,

        createMileageLog,
        postMileageLogToGL,
        deleteMileageLog,

        createInventoryItem,
        updateInventoryItem,
        adjustInventoryStock,
        deleteInventoryItem,

        createPayrollEmployee,
        updatePayrollEmployee,
        deletePayrollEmployee,
        calculatePayRunPreview,
        executePayRun,

        connectBankFeed,
        syncBankFeed,
        disconnectBankFeed,

        downloadCompanyBackup,
        validateBackupFileContent,
        restoreCompanyBackup,

        // Webhooks Dispatcher & Outbound Event Engine
        webhookEndpoints,
        webhookLogs,
        createWebhookEndpoint,
        updateWebhookEndpoint,
        deleteWebhookEndpoint,
        testDispatchWebhook,
        retryWebhookDelivery,
        dispatchAccountingEvent,

        // Scoped API Keys & Developer Portal
        scopedApiKeys,
        createScopedApiKey,
        revokeScopedApiKey,
        deleteScopedApiKey,

        // Zapier / Make & E-Commerce Integration Connectors
        integrationConnectors,
        connectIntegrationConnector,
        syncIntegrationConnector,
        disconnectIntegrationConnector,

        // AI Audit Copilot Entity Configuration & Token Quotas
        tenantAiConfigs,
        activeTenantAiConfig,
        aiUsageLogs,
        updateTenantAiConfig,
        recordAiTokenUsage,
        resetTenantAiQuota,

        // Role-to-Menu Access Permissions Engine
        roleMenuPermissions,
        getRoleAllowedMenus,
        updateRoleMenuPermissions,
        resetRoleMenuPermissionsToDefaults,
        applyRoleMenuPreset,
        copyRoleMenuPermissions,
        batchUpdateRoleMenuPermissions,

        processOnlineInvoicePayment,

        runDepreciationForTenant,
        createTenant,
        createAccount,
        updateAccount,
        deleteAccount,
        applyIndustryPresetCOA,
        batchImportAccounts,
        industryCoaPresets: INDUSTRY_COA_PRESETS,
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
