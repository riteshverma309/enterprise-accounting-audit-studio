export type Role = 'super_user' | 'entity_admin' | 'admin' | 'controller' | 'accountant' | 'junior_accountant' | 'auditor' | 'viewer';
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
    | 'INVOICE_BATCH_ROLLBACK';
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
  invoiceId: string;
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
  department: 'Engineering & R&D' | 'Sales & Marketing' | 'General & Administrative' | 'Customer Operations';
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
  entityType: 'JOURNAL_ENTRY' | 'VENDOR_BILL' | 'INVOICE';
  referenceNumber: string;
  amount: number;
  currency: string;
  description: string;
  requestedBy: string;
  requestedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  | 'journals:create'
  | 'journals:post'
  | 'journals:reverse'
  | 'ar:manage'
  | 'ap:manage'
  | 'treasury:sweep'
  | 'fpa:budget_edit'
  | 'governance:approve'
  | 'tax:settle'
  | 'fiscal:lock_period'
  | 'fiscal:year_end_close'
  | 'users:manage_provisioning'
  | 'users:manage_global'
  | 'users:manage_entity'
  | 'reports:export';

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
  permissions: PermissionKey[];
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




