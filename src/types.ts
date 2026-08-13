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
  action: 'POST_JOURNAL' | 'REVERSE_JOURNAL' | 'IMPORT_TRANSACTIONS' | 'RECONCILE_BANK' | 'RUN_DEPRECIATION' | 'FX_REVALUATION' | 'CREATE_TENANT' | 'INVOICE_CREATE' | 'INVOICE_PAYMENT' | 'BILL_CREATE' | 'BILL_PAYMENT' | 'PERIOD_LOCK' | 'YEAR_END_CLOSE';
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
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
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
  vendorName: string;
  billDate: string;
  dueDate: string;
  currency: string;
  items: BillLineItem[];
  totalAmount: number;
  amountPaid: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
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

