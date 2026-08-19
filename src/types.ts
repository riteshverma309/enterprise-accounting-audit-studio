export type Role = 'super_user' | 'entity_admin' | 'admin' | 'controller' | 'accountant' | 'junior_accountant' | 'auditor' | 'viewer' | 'vendor' | 'customer';
export type PluginId = 'us_gaap' | 'eu_ifrs' | 'in_gst';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  currency: string;
  country: string;
  pluginId: PluginId;
  organizations: Organization[];
}

export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  organizationId: string;
  tenantId: string;
  name: string;
  code: string;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  parentAccountId?: string;
  isHeader?: boolean;
  subCategory?: string;
  description?: string;
  normalBalance?: 'DEBIT' | 'CREDIT';
  isActive?: boolean;
  isSystemAccount?: boolean;
  industryTag?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
  taxRate?: number;
  taxAmount?: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  tenantId: string;
  organizationId?: string;
  branchId?: string;
  date: string;
  description: string;
  reference?: string;
  pluginId: PluginId;
  postedBy: string;
  postedRole: Role;
  status: 'POSTED' | 'REVERSED' | 'DRAFT';
  reversalOfId?: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

export interface BankStatementLine {
  id: string;
  tenantId: string;
  date: string;
  description: string;
  amount: number; // positive for deposit, negative for withdrawal
  reference: string;
  reconciled: boolean;
  matchedJournalEntryId?: string;
  matchedJournalLineId?: string;
}

export interface FixedAsset {
  id: string;
  tenantId: string;
  assetNumber: string;
  name: string;
  category: string;
  acquisitionDate: string;
  cost: number;
  salvageValue: number;
  usefulLifeYears: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  lastDepreciationDate?: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  action:
    | 'POST_JOURNAL'
    | 'REVERSE_JOURNAL'
    | 'IMPORT_TRANSACTIONS'
    | 'RECONCILE_BANK'
    | 'RUN_DEPRECIATION'
    | 'FX_REVALUATION'
    | 'CREATE_TENANT'
    | 'INVOICE_CREATE'
    | 'INVOICE_PAYMENT'
    | 'BILL_CREATE'
    | 'BILL_PAYMENT'
    | 'PERIOD_LOCK'
    | 'YEAR_END_CLOSE'
    | 'PRODUCT_PRICE_UPDATE'
    | 'PRODUCT_CREATE'
    | 'PRODUCT_DELETE'
    | 'PRODUCT_UPDATE'
    | 'TEMPLATE_CREATE'
    | 'TEMPLATE_UPDATE'
    | 'TEMPLATE_DELETE'
    | 'OPENING_BALANCE_CREATE'
    | 'OPENING_BALANCE_BATCH'
    | 'PAYMENT_RECEIPT_CREATE'
    | 'PAYMENT_RECEIPT_VOID'
    | 'CUSTOMER_CREDIT_APPLY'
    | 'CUSTOMER_CREATE'
    | 'CUSTOMER_UPDATE'
    | 'CUSTOMER_DELETE'
    | 'CUSTOMER_BATCH_UPLOAD'
    | 'ATTRIBUTE_CREATE'
    | 'ATTRIBUTE_DELETE'
    | 'INVOICE_BATCH_GENERATE'
    | 'INVOICE_BATCH_ROLLBACK'
    | 'EXPORT_REPORT'
    | 'SYSTEM_CLOSE'
    | 'BACKUP_EXPORT'
    | 'BACKUP_RESTORE'
    | 'WEBHOOK_CREATE'
    | 'WEBHOOK_UPDATE'
    | 'WEBHOOK_DELETE'
    | 'WEBHOOK_DISPATCH'
    | 'API_KEY_CREATE'
    | 'API_KEY_REVOKE'
    | 'CONNECTOR_CONNECT'
    | 'CONNECTOR_SYNC'
    | 'CONNECTOR_DISCONNECT'
    | 'AI_ENTITY_KEY_CONFIGURED'
    | 'AI_TOKEN_QUOTA_RESET'
    | 'AI_COPILOT_QUERY'
    | 'UPDATE_ROLE_MENU_ACCESS'
    | 'RESET_ROLE_MENU_DEFAULTS';
  tenantId: string;
  organizationId?: string;
  branchId?: string;
  userRole: Role;
  userEmail: string;
  details: string;
  status: 'SUCCESS' | 'FORBIDDEN' | 'FAILED';
  ipAddress?: string;
  payloadSummary?: string;
}

export interface InvoiceLineItem {
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  unitOfMeasure?: string;
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  revenueAccountCode: string;
  customerAttributesSnapshot?: Record<string, any>;
  notes?: string;
  isOpeningBalance?: boolean;
  balanceType?: 'DR' | 'CR'; // DR = Receivable / Owes, CR = Advance / Overpayment
  fiscalYearOpening?: string;
  offsetAccountCode?: string;
}

export type PaymentMethodType = 'BANK_TRANSFER' | 'ACH' | 'CHECK' | 'CREDIT_CARD' | 'UPI' | 'CASH' | 'OTHER';

export interface InvoicePaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
  discountAmount?: number;
  writeOffAmount?: number;
}

export interface CustomerPaymentReceipt {
  id: string;
  receiptNumber: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  paymentDate: string;
  paymentMethod: PaymentMethodType;
  bankAccountId: string;
  bankAccountName?: string;
  referenceNumber?: string; // Check #, Wire Ref, UTR
  totalAmountReceived: number;
  allocatedAmount: number;
  unallocatedCreditAmount: number; // Excess payment stored as advance
  allocations: InvoicePaymentAllocation[];
  discountTotal?: number;
  notes?: string;
  createdAt: string;
  journalEntryId?: string;
  status: 'POSTED' | 'VOIDED';
}

export interface CustomerOpeningBalanceRecord {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerCode?: string;
  fiscalYear: string; // e.g. "FY 2026-2027"
  asOfDate: string; // e.g. "2026-04-01"
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  dueDate: string;
  originalAmount: number;
  amountPaid: number;
  currentBalance: number;
  balanceType?: 'DR' | 'CR'; // DR = Receivable (Customer owes us), CR = Credit / Overpayment (We owe customer / advance)
  offsetAccountCode: string; // e.g. "3010" Opening Balance Equity / "3200" Retained Earnings
  notes?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface CustomerLedgerTransaction {
  id: string;
  date: string;
  type: 'OPENING_BALANCE' | 'INVOICE' | 'PAYMENT' | 'CREDIT_MEMO';
  referenceNumber: string;
  description: string;
  dueDate?: string;
  debit: number; // Increases customer receivable
  credit: number; // Decreases customer receivable
  runningBalance: number;
  balanceType?: 'DR' | 'CR';
  status?: string;
  documentId: string; // Invoice ID or Payment Receipt ID
  paymentMethod?: string;
  allocations?: InvoicePaymentAllocation[];
}

export interface BillLineItem {
  description: string;
  amount: number;
  expenseAccountCode: string;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  tenantId: string;
  vendorId?: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  currency: string;
  items: BillLineItem[];
  totalAmount: number;
  amountPaid: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  vendorAttributesSnapshot?: Record<string, any>;
  notes?: string;
}

export interface FiscalPeriod {
  id: string;
  tenantId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
}

export interface CashFlowData {
  operatingActivities: { category: string; amount: number }[];
  investingActivities: { category: string; amount: number }[];
  financingActivities: { category: string; amount: number }[];
  totalOperatingCashFlow: number;
  totalInvestingCashFlow: number;
  totalFinancingCashFlow: number;
  netCashChange: number;
}

export interface FinancialRatiosData {
  currentRatio: number;
  quickRatio: number;
  workingCapital: number;
  debtToEquity: number;
  grossMarginPercentage: number;
  netProfitMarginPercentage: number;
  receivablesTurnover: number;
  healthScore: number; // 0 to 100
}

export interface ConsolidatedEntityData {
  presentationCurrency: string;
  entities: {
    tenantId: string;
    tenantName: string;
    localCurrency: string;
    fxRateToPresentation: number;
    localRevenue: number;
    translatedRevenue: number;
    localAssets: number;
    translatedAssets: number;
  }[];
  totalConsolidatedRevenue: number;
  totalConsolidatedAssets: number;
  intercompanyEliminationAmount: number;
  netConsolidatedRevenue: number;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  type: AccountType;
  debit: number;
  credit: number;
  netBalance: number;
}

export interface BalanceSheetData {
  assets: TrialBalanceRow[];
  liabilities: TrialBalanceRow[];
  equity: TrialBalanceRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
  isBalanced: boolean;
}

export interface IncomeStatementData {
  revenues: TrialBalanceRow[];
  expenses: TrialBalanceRow[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  grossMarginPercentage: number;
}

export interface StatutoryReportData {
  pluginId: PluginId;
  title: string;
  standardName: string;
  period: string;
  tenantName: string;
  taxIdentifier: string;
  taxBreakdown: {
    name: string;
    taxableAmount: number;
    taxCollected: number;
    taxPaidCredit: number;
    netLiability: number;
  }[];
  summaryNotes: string[];
  isCompliant: boolean;
}

export interface FxRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  asOfDate: string;
}

export interface ParsedTransactionUpload {
  rowNumber: number;
  date: string;
  description: string;
  accountCodeDebit: string;
  accountCodeCredit: string;
  amount: number;
  reference?: string;
  tenantId?: string;
  isValid: boolean;
  errors: string[];
}

export interface TreasuryAccount {
  id: string;
  tenantId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  balance: number;
  type: 'CHECKING' | 'MONEY_MARKET' | 'FX_RESERVE' | 'OPERATING';
}

export interface CashFlowForecastItem {
  period: '30_DAYS' | '60_DAYS' | '90_DAYS';
  projectedInflows: number;
  projectedOutflows: number;
  netForecast: number;
  confidenceScore: number;
}

export interface DepartmentBudget {
  id: string;
  tenantId: string;
  department: string;
  annualBudget: number;
  ytdActual: number;
  variance: number;
  variancePercentage: number;
  status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
}

export interface ApprovalPolicy {
  id: string;
  tenantId: string;
  entityType: 'JOURNAL_ENTRY' | 'VENDOR_BILL' | 'INVOICE';
  thresholdAmount: number;
  requiredRole: Role;
}

export interface ApprovalItem {
  id: string;
  tenantId: string;
  entityType: 'JOURNAL_ENTRY' | 'VENDOR_BILL' | 'INVOICE' | 'PAYROLL_RUN' | 'EXPENSE_CLAIM' | 'PERIOD_REOPEN' | 'BACKUP_RESTORE';
  referenceNumber: string;
  amount: number;
  currency: string;
  description: string;
  requestedBy: string; // Maker email
  requestedRole?: Role;
  requestedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string; // Checker email
  approvedRole?: Role;
  approvalDate?: string;
  approverComments?: string;
  rejectionReason?: string;
  ruleIdMatched?: string;
}

export interface TaxJurisdiction {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  taxType: 'SALES_TAX' | 'VAT' | 'GST';
  ratePercent: number;
  filingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  ytdAccruedTax: number;
}

export type PermissionKey =
  // General Ledger
  | 'journals:create'
  | 'journals:post'
  | 'journals:reverse'
  | 'coa:manage'
  // Accounts Receivable (AR)
  | 'ar:view'
  | 'ar:manage'
  | 'ar:create_invoice'
  | 'ar:approve_invoice'
  | 'ar:collect_payment'
  | 'ar:write_off'
  // Accounts Payable (AP)
  | 'ap:view'
  | 'ap:manage'
  | 'ap:create_bill'
  | 'ap:approve_bill'
  | 'ap:disburse_funds'
  // Expenses & Mileage
  | 'expenses:submit'
  | 'expenses:approve'
  | 'expenses:post_gl'
  // Inventory & Stock
  | 'inventory:view'
  | 'inventory:adjust'
  | 'inventory:manage'
  // Employees & Payroll
  | 'employees:view'
  | 'employees:manage'
  | 'payroll:view'
  | 'payroll:draft_run'
  | 'payroll:approve_and_post'
  // Treasury & Banking
  | 'treasury:view'
  | 'treasury:sweep'
  | 'bank:connect_feed'
  | 'bank:reconcile'
  // FP&A & Budgets
  | 'fpa:view'
  | 'fpa:budget_edit'
  // Tax & Statutory
  | 'tax:view'
  | 'tax:settle'
  | 'tax:configure'
  // Fiscal Close & Period Controls
  | 'fiscal:view'
  | 'fiscal:lock_period'
  | 'fiscal:year_end_close'
  | 'fiscal:reopen_period'
  // Multi-Signature Governance & Approvals
  | 'governance:approve'
  | 'governance:configure_rules'
  // Backup & Data Restore
  | 'backup:export'
  | 'backup:restore'
  // Developer & Integrations
  | 'webhooks:manage'
  | 'apikeys:manage'
  | 'connectors:manage'
  // Identity & User Administration
  | 'users:manage_provisioning'
  | 'users:manage_global'
  | 'users:manage_entity'
  | 'roles:manage_custom'
  | 'ai:use_copilot'
  | 'ai:configure_entity_key'
  // Reports & Audits
  | 'reports:view'
  | 'reports:export'
  // External Partner Financial Position Portal
  | 'partner:view_portal'
  // Automated Test Suite & Regression Engine
  | 'test:run';

export interface EntityAiConfig {
  tenantId: string;
  apiKey: string;
  isKeyConfigured: boolean;
  model: string;
  monthlyTokenQuota: number; // 0 = unlimited, otherwise e.g. 500,000
  tokensUsedThisPeriod: number;
  quotaResetCycle: 'MONTHLY' | 'DAILY' | 'TOTAL';
  lastResetDate: string;
  requestsCountThisPeriod: number;
  totalTokensAllTime: number;
  alertThresholdPercent: number; // e.g. 80
  enforceStrictQuota: boolean;
  customAuditInstructions?: string;
  configuredByEmail?: string;
  configuredAt?: string;
  lastUsedAt?: string;
}

export interface AiTokenUsageLog {
  id: string;
  timestamp: string;
  tenantId: string;
  userEmail: string;
  model: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  queryTopic: string;
}

export interface TenantAccessScope {
  tenantId: string;
  role: Role;
  customPermissions?: PermissionKey[];
}

export interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  mfaEnabled: boolean;
  defaultRole: Role;
  tenantScopes: TenantAccessScope[];
  lastLogin: string;
  createdAt: string;
  apiTokenCount: number;
}

export interface CustomRoleDefinition {
  id: string;
  name: string;
  code: Role | string;
  description: string;
  isSystemRole: boolean;
  colorBadge?: string;
  permissions: PermissionKey[];
}

export type TabType =
  | 'dashboard'
  | 'backup_restore'
  | 'batch_upload'
  | 'entity_master'
  | 'products_services'
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
  | 'partner_portal'
  | 'test_suite';

export type MenuCategory =
  | 'CORE_FINANCIALS'
  | 'RECEIVABLES_SALES'
  | 'PAYABLES_SPEND'
  | 'OPERATIONS_PRODUCTS'
  | 'PEOPLE_PAYROLL'
  | 'BANKING_TREASURY_FPA'
  | 'GOVERNANCE_TAX_AUDIT'
  | 'IT_ADMIN_DEV';

export interface MenuOptionMetadata {
  id: TabType;
  label: string;
  category: MenuCategory;
  categoryLabel: string;
  description: string;
  badge?: string;
  iconName: string;
  sodRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type RoleMenuPermissionsMap = Record<string, TabType[]>;

export interface TenantRoleMenuConfig {
  tenantId: string;
  permissionsByRole: RoleMenuPermissionsMap;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface ConfigurableApprovalRule {
  id: string;
  tenantId: string;
  ruleName: string;
  entityType: 'JOURNAL_ENTRY' | 'VENDOR_BILL' | 'INVOICE' | 'PAYROLL_RUN' | 'EXPENSE_CLAIM' | 'PERIOD_REOPEN' | 'BACKUP_RESTORE';
  thresholdAmount: number; // 0 means all requests require approval
  requiredRole: Role;
  requiredPermission: PermissionKey;
  enforceMakerChecker: boolean; // Requester cannot self-approve
  isEnabled: boolean;
  description: string;
}

export type CustomAttributeDataType = 'text' | 'number' | 'decimal' | 'date' | 'boolean' | 'select';

export type IndustryPresetType = 'GENERIC' | 'SCHOOL' | 'HOUSING_SOCIETY' | 'HOSPITAL' | 'SAAS' | 'CUSTOM';

export interface CustomAttributeDefinition {
  id: string;
  tenantId: string;
  name: string;
  key: string;
  dataType: CustomAttributeDataType;
  options?: string[]; // for 'select'
  targetEntity: 'CUSTOMER' | 'VENDOR' | 'BOTH';
  industryPreset?: IndustryPresetType;
  description?: string;
  isRequired?: boolean;
  defaultValue?: any;
  unitOrSuffix?: string; // e.g. "sq ft", "%", "$", "days"
}

export interface CustomerContact {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  category?: string; // e.g. "Student / Parent", "Flat Owner", "Inpatient", "Corporate Client"
  status: 'ACTIVE' | 'INACTIVE';
  customAttributes: Record<string, any>;
  taxId?: string;
  paymentTermsDays?: number;
  notes?: string;
  createdAt: string;
}

export interface VendorContact {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  category?: string; // e.g. "Facility AMC", "Mess / Catering", "Medical Pharma", "Cloud Hosting"
  status: 'ACTIVE' | 'INACTIVE';
  customAttributes: Record<string, any>;
  taxId?: string;
  defaultExpenseAccountCode?: string;
  paymentTermsDays?: number;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
  };
  notes?: string;
  createdAt: string;
}

export type ItemType = 'PRODUCT' | 'SERVICE';

export interface PriceChangeHistoryEntry {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  tenantId: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  changeDate: string; // ISO / UTC timestamp
  effectiveDate: string; // YYYY-MM-DD
  changedBy: string; // User email
  changedRole: Role;
  reason: string; // Audit justification
  changePercentage: number; // e.g. +12.5 or -5.0
  notes?: string;
}

export interface ProductServiceItem {
  id: string;
  tenantId: string;
  code: string; // SKU / Code e.g. "PRD-001", "SRV-CONSULT"
  name: string;
  description?: string;
  type: ItemType;
  category: string; // e.g. "Software", "Professional Services", "Maintenance", "Education", "Healthcare", "Hardware"
  unitPrice: number;
  unitOfMeasure?: string; // e.g. "unit", "hour", "sq ft", "month", "user/mo", "term", "bed/day", "session"
  defaultTaxRate?: number; // e.g. 0, 5, 10, 18
  defaultRevenueAccountCode?: string; // e.g. "4010", "4020"
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  priceHistory?: PriceChangeHistoryEntry[];
  lastPriceUpdatedAt?: string;
  lastPriceUpdatedBy?: string;
  lastPriceChangeReason?: string;
}

export interface InvoiceTemplateLineItem {
  id: string;
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  unitOfMeasure?: string;
  amount?: number;
}

export interface InvoiceTemplate {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  items: InvoiceTemplateLineItem[];
  defaultPaymentTermsDays?: number;
  defaultRevenueAccountCode?: string;
  defaultNotes?: string;
  defaultCustomerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  usageCount: number;
}

export interface CustomerGroupConfig {
  id: string;
  name: string;
  filterAttributeKey: string; // e.g. 'is_commercial', 'category', 'paymentTermsDays', 'unit_wing', 'grade_batch', 'CUSTOM_MANUAL'
  matchValue: any; // e.g. true, false, 'Tower A', 'Grade 10', '__UNSET__'
  displayValueLabel?: string;
  customerIds: string[];
  templateId: string; // ID of selected InvoiceTemplate
  customLineItems?: InvoiceLineItem[];
  overrideRateMultiplier?: number;
  quantityAttributeMultiplierKey?: string; // Optional dynamic quantity multiplier e.g. 'carpet_area_sqft'
  defaultRevenueAccountCode?: string;
  billingPeriod?: string; // e.g. "August 2026", "Q3 2026"
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  notesTemplate?: string;
  isExcluded?: boolean;
}

export interface BulkInvoicePreviewItem {
  id: string;
  groupId: string;
  groupName: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerEmail: string;
  billingAddress?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  revenueAccountCode: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  notes?: string;
  isExcluded?: boolean;
  customAttributesSnapshot?: Record<string, any>;
  calculationTrace?: string;
}

export interface BulkInvoiceBatchRun {
  id: string;
  batchNumber: string; // e.g. "BAT-2026-08-001"
  tenantId: string;
  title: string;
  createdAt: string; // ISO String
  createdBy: string; // user email
  groupingAttributeKey: string;
  groupingAttributeName: string;
  groupsCount: number;
  totalCustomers: number;
  totalInvoicesGenerated: number;
  totalBatchAmount: number;
  totalTaxAmount: number;
  generatedInvoiceIds: string[];
  status: 'COMMITTED' | 'ROLLED_BACK';
  groupBreakdowns: {
    groupId: string;
    groupName: string;
    templateCode: string;
    templateName: string;
    customerCount: number;
    groupTotalAmount: number;
  }[];
}

export interface CustomerStatementData {
  customer?: CustomerContact;
  invoices: CustomerInvoice[];
  paymentReceipts: CustomerPaymentReceipt[];
  openingBalances: CustomerOpeningBalanceRecord[];
  transactions: CustomerLedgerTransaction[];
  metrics: {
    totalInvoiced: number;
    totalPaid: number;
    netOutstanding: number;
    netBalance?: number; // Can be positive (Receivable) or negative (Credit Balance / Overpayment)
    isCreditBalance?: boolean; // True if customer has overpaid or net advance
    totalAdvanceCredits: number;
    overdueAmount: number;
    aging: {
      current: number;
      days1To30: number;
      days31To60: number;
      days61To90: number;
      days90Plus: number;
    };
  };
}

export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export interface RecurringInvoiceSchedule {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  profileName: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  revenueAccountCode: string;
  autoSendEmail: boolean;
  autoChargePayment: boolean;
  paymentMethodType?: PaymentMethodType;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  generatedInvoicesCount: number;
  notes?: string;
}

export interface ExpenseReceipt {
  id: string;
  tenantId: string;
  receiptNumber: string;
  expenseDate: string;
  vendorName: string;
  category: string;
  expenseAccountCode: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'COMPANY_CARD' | 'CASH' | 'PETTY_CASH' | 'BANK_TRANSFER' | 'PERSONAL_EXPENSE';
  paidBy: string;
  receiptImageUrl?: string;
  receiptFileName?: string;
  ocrExtractedData?: {
    rawText?: string;
    confidenceScore?: number;
    detectedTaxRate?: number;
    detectedVendor?: string;
    detectedDate?: string;
  };
  status: 'DRAFT' | 'POSTED' | 'REIMBURSED';
  journalEntryId?: string;
  notes?: string;
  createdAt: string;
}

export interface MileageLogEntry {
  id: string;
  tenantId: string;
  tripDate: string;
  driverName: string;
  driverEmail: string;
  vehicleName: string;
  vehicleType: 'CAR' | 'SUV' | 'TRUCK' | 'ELECTRIC' | 'MOTORCYCLE';
  startLocation: string;
  endLocation: string;
  purpose: string;
  distanceMiles: number;
  ratePerMile: number;
  totalDeductionAmount: number;
  isReimbursable: boolean;
  status: 'LOGGED' | 'APPROVED' | 'POSTED_TO_GL';
  journalEntryId?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryStockItem {
  id: string;
  tenantId: string;
  productId?: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  quantityOnHand: number;
  reorderThreshold: number;
  reorderQuantity: number;
  unitCost: number;
  totalValuation: number;
  valuationMethod: 'FIFO' | 'WEIGHTED_AVG' | 'SPECIFIC_ID';
  unitOfMeasure: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastRestockedDate?: string;
  notes?: string;
}

export interface InventoryAdjustmentRecord {
  id: string;
  tenantId: string;
  date: string;
  inventoryItemId: string;
  sku: string;
  name: string;
  type: 'RECEIPT_PURCHASE' | 'CYCLE_COUNT_GAIN' | 'DAMAGE_SPOILAGE_LOSS' | 'THEFT_SHRINKAGE' | 'RETURN_RESTOCK';
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  unitCost: number;
  totalCostAdjustment: number;
  reason: string;
  performedBy: string;
  journalEntryId?: string;
  createdAt: string;
}

export type EmployeeEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type EmployeePayType = 'SALARY' | 'HOURLY';
export type EmployeePayFrequency = 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY';
export type EmployeeFilingStatus = 'SINGLE' | 'MARRIED_FILING_JOINTLY' | 'MARRIED_FILING_SEPARATELY' | 'HEAD_OF_HOUSEHOLD';
export type EmployeePaymentMethod = 'DIRECT_DEPOSIT' | 'CHECK' | 'WIRE' | 'CASH';

export interface PayrollEmployee {
  id: string;
  tenantId: string;
  employeeNumber: string;
  name: string;
  email: string;
  phone?: string;
  role: string; // Job Title
  department: string;
  employmentType: EmployeeEmploymentType;
  status: EmployeeStatus;
  hireDate: string; // YYYY-MM-DD
  terminationDate?: string;
  address?: string;
  taxId?: string; // SSN / TIN masked e.g. "•••-••-8821"

  // Compensation & Pay Type
  payType: EmployeePayType;
  baseSalaryAnnual?: number;
  hourlyRate?: number;
  standardHoursPerWeek?: number;
  payFrequency: EmployeePayFrequency;

  // Tax Withholding & Benefits
  filingStatus: EmployeeFilingStatus;
  stateFilingStatus?: string;
  allowances: number;
  additionalWithholdingPerPeriod?: number;
  fourZeroOneKContributionRate?: number; // % e.g. 5
  fourZeroOneKEmployerMatchRate?: number; // % e.g. 4
  healthBenefitDeduction?: number; // $ amount per period
  dentalVisionDeduction?: number; // $ amount per period

  // Direct Deposit / Payment Details
  paymentMethod: EmployeePaymentMethod;
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  accountType?: 'CHECKING' | 'SAVINGS';

  // Notes & Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdAt?: string;
}

export interface PayrollRunEmployeeLine {
  employeeId: string;
  employeeName: string;
  department: string;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  benefitsDeduction: number;
  netPay: number;
  employerFicaMatch: number;
  employerFuta: number;
  totalEmployerCost: number;
}

export interface PayrollRun {
  id: string;
  tenantId: string;
  runNumber: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED_TO_GL';
  totalGrossPay: number;
  totalEmployeeTaxWithholdings: number;
  totalEmployerTaxes: number;
  totalNetPay: number;
  employeeCount: number;
  journalEntryId?: string;
  executedBy: string;
  createdAt: string;
  lines: PayrollRunEmployeeLine[];
}

export interface ConnectedBankFeed {
  id: string;
  tenantId: string;
  institutionName: string;
  accountName: string;
  accountNumberMasked: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'MERCHANT';
  balance: number;
  currency: string;
  lastSyncedAt: string;
  status: 'CONNECTED' | 'SYNCING' | 'NEEDS_REAUTH' | 'DISCONNECTED';
  autoSyncIntervalHours: number;
  matchedGlAccountId: string;
  logoUrl?: string;
}

export interface CompanyBackupRecordCounts {
  accounts: number;
  journalEntries: number;
  invoices: number;
  vendorBills: number;
  paymentReceipts: number;
  openingBalances: number;
  customers: number;
  vendors: number;
  productsServices: number;
  priceChangeHistory: number;
  invoiceTemplates: number;
  bulkInvoiceBatches: number;
  recurringSchedules: number;
  expenseReceipts: number;
  mileageLogs: number;
  inventoryItems: number;
  inventoryAdjustments: number;
  payrollEmployees: number;
  payrollRuns: number;
  connectedBankFeeds: number;
  bankStatements: number;
  fixedAssets: number;
  fiscalPeriods: number;
  treasuryAccounts: number;
  departmentBudgets: number;
  approvalItems: number;
  taxJurisdictions: number;
  customAttributeDefinitions: number;
  auditLogs: number;
}

export interface CompanyBackupMetadata {
  schemaVersion: '1.0';
  backupId: string;
  exportedAt: string;
  exportedBy: string;
  scope: 'single_company' | 'full_system';
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  currency: string;
  country: string;
  pluginId: PluginId;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  recordCounts: CompanyBackupRecordCounts;
  systemNote?: string;
}

export interface CompanyBackupPayload {
  schema: 'enterprise_accounting_backup_v1';
  metadata: CompanyBackupMetadata;
  data: {
    tenant: Tenant;
    accounts: Account[];
    journalEntries: JournalEntry[];
    invoices: CustomerInvoice[];
    vendorBills: VendorBill[];
    paymentReceipts: CustomerPaymentReceipt[];
    openingBalances: CustomerOpeningBalanceRecord[];
    customers: CustomerContact[];
    vendors: VendorContact[];
    productsServices: ProductServiceItem[];
    priceChangeHistory: PriceChangeHistoryEntry[];
    invoiceTemplates: InvoiceTemplate[];
    bulkInvoiceBatches: BulkInvoiceBatchRun[];
    recurringSchedules: RecurringInvoiceSchedule[];
    expenseReceipts: ExpenseReceipt[];
    mileageLogs: MileageLogEntry[];
    inventoryItems: InventoryStockItem[];
    inventoryAdjustments: InventoryAdjustmentRecord[];
    payrollEmployees: PayrollEmployee[];
    payrollRuns: PayrollRun[];
    connectedBankFeeds: ConnectedBankFeed[];
    bankStatements: BankStatementLine[];
    fixedAssets: FixedAsset[];
    fiscalPeriods: FiscalPeriod[];
    treasuryAccounts: TreasuryAccount[];
    departmentBudgets: DepartmentBudget[];
    approvalItems: ApprovalItem[];
    taxJurisdictions: TaxJurisdiction[];
    customAttributeDefinitions: CustomAttributeDefinition[];
    auditLogs: AuditLogEvent[];
    allTenants?: Tenant[];
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: CompanyBackupMetadata;
  parsedPayload?: CompanyBackupPayload;
}

// ----------------------------------------------------
// INTEGRATIONS & INTERFACE SUITE (WEBHOOKS, API KEYS, CONNECTORS)
// ----------------------------------------------------

export type WebhookEventType =
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'bill.created'
  | 'bill.paid'
  | 'journal.posted'
  | 'customer.created'
  | 'vendor.created'
  | 'payment.received'
  | 'period.closed'
  | 'inventory.low_stock'
  | 'payroll.executed';

export interface WebhookEndpoint {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  secret: string; // HMAC signing secret
  events: WebhookEventType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
  headers?: { key: string; value: string }[];
  failureCount: number;
  lastTriggeredAt?: string;
  lastStatusCode?: number;
}

export interface WebhookDeliveryLog {
  id: string;
  endpointId: string;
  endpointName: string;
  tenantId: string;
  event: WebhookEventType;
  payload: any;
  requestHeaders: Record<string, string>;
  responseStatus: number;
  responseBody: string;
  latencyMs: number;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  attemptNumber: number;
  error?: string;
}

export type ApiKeyPermissionScope =
  | 'read:all'
  | 'write:all'
  | 'read:invoices'
  | 'write:invoices'
  | 'read:bills'
  | 'write:bills'
  | 'read:journals'
  | 'write:journals'
  | 'read:customers'
  | 'write:customers'
  | 'read:reports'
  | 'execute:sync';

export interface ScopedApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  fullKey?: string; // Only shown on generation
  scopes: ApiKeyPermissionScope[];
  role: Role;
  environment: 'LIVE' | 'TEST' | 'SANDBOX';
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  rateLimitPerMin: number;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  createdBy: string;
}

export type ConnectorPlatform =
  | 'ZAPIER'
  | 'MAKE'
  | 'STRIPE'
  | 'SHOPIFY'
  | 'WOOCOMMERCE'
  | 'SALESFORCE'
  | 'HUBSPOT'
  | 'GUSTO'
  | 'PAYPAL';

export interface IntegrationConnector {
  id: string;
  tenantId: string;
  platform: ConnectorPlatform;
  name: string;
  category: 'AUTOMATION' | 'ECOMMERCE' | 'PAYMENTS' | 'CRM' | 'PAYROLL';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  description: string;
  authType: 'API_KEY' | 'OAUTH2' | 'WEBHOOK_PAIR';
  credentials: {
    apiKey?: string;
    storeDomain?: string;
    webhookUrl?: string;
    clientId?: string;
    accountEmail?: string;
  };
  syncSettings: {
    autoSyncInvoices: boolean;
    autoSyncCustomers: boolean;
    autoPostJournals: boolean;
    syncIntervalMinutes: number;
    defaultIncomeAccountId?: string;
    defaultExpenseAccountId?: string;
    defaultBankAccountId?: string;
    taxHandling: 'AUTO_CALCULATE' | 'PASSTHROUGH';
  };
  stats: {
    totalSyncedRecords: number;
    lastSyncTimestamp?: string;
    lastSyncStatus?: 'OK' | 'ERROR' | 'PARTIAL';
    lastSyncMessage?: string;
  };
  presetTriggerSample?: any;
}

