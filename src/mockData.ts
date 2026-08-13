import { Tenant, Account, JournalEntry, BankStatementLine, FixedAsset, AuditLogEvent, FxRate, CustomerInvoice, VendorBill, FiscalPeriod, TreasuryAccount, DepartmentBudget, ApprovalItem, TaxJurisdiction, EnterpriseUser, CustomRoleDefinition } from './types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 't-acme-us',
    name: 'Acme Enterprise Inc.',
    code: 'ACME-US',
    currency: 'USD',
    country: 'United States',
    pluginId: 'us_gaap',
    organizations: [
      {
        id: 'org-acme-north',
        tenantId: 't-acme-us',
        name: 'Acme North America LLC',
        code: 'ACME-NA',
        branches: [
          { id: 'br-ny-hq', organizationId: 'org-acme-north', tenantId: 't-acme-us', name: 'New York HQ', code: 'NY-HQ' },
          { id: 'br-sf-tech', organizationId: 'org-acme-north', tenantId: 't-acme-us', name: 'San Francisco Hub', code: 'SF-HUB' },
        ],
      },
    ],
  },
  {
    id: 't-global-eu',
    name: 'TechGlobe Europe B.V.',
    code: 'GLOBE-EU',
    currency: 'EUR',
    country: 'Netherlands',
    pluginId: 'eu_ifrs',
    organizations: [
      {
        id: 'org-globe-west',
        tenantId: 't-global-eu',
        name: 'TechGlobe West Europe',
        code: 'GLOBE-WE',
        branches: [
          { id: 'br-ams-hq', organizationId: 'org-globe-west', tenantId: 't-global-eu', name: 'Amsterdam HQ', code: 'AMS-HQ' },
          { id: 'br-par-ops', organizationId: 'org-globe-west', tenantId: 't-global-eu', name: 'Paris Operations', code: 'PAR-OPS' },
        ],
      },
    ],
  },
  {
    id: 't-bharat-in',
    name: 'Bharat Retail & Tech Pvt Ltd',
    code: 'BHARAT-IN',
    currency: 'INR',
    country: 'India',
    pluginId: 'in_gst',
    organizations: [
      {
        id: 'org-bharat-south',
        tenantId: 't-bharat-in',
        name: 'Bharat Digital South',
        code: 'BHARAT-S',
        branches: [
          { id: 'br-blr-tech', organizationId: 'org-bharat-south', tenantId: 't-bharat-in', name: 'Bengaluru Tech Park', code: 'BLR-01' },
          { id: 'br-mum-fin', organizationId: 'org-bharat-south', tenantId: 't-bharat-in', name: 'Mumbai Financial Dist', code: 'MUM-01' },
        ],
      },
    ],
  },
];

export const INITIAL_ACCOUNTS: Record<string, Account[]> = {
  't-acme-us': [
    { id: 'acc-1001', tenantId: 't-acme-us', code: '1010', name: 'Operating Cash - Chase Bank', type: 'ASSET', currency: 'USD', balance: 485000 },
    { id: 'acc-1002', tenantId: 't-acme-us', code: '1100', name: 'Accounts Receivable', type: 'ASSET', currency: 'USD', balance: 142000 },
    { id: 'acc-1003', tenantId: 't-acme-us', code: '1500', name: 'Computer Equipment & Servers', type: 'ASSET', currency: 'USD', balance: 95000 },
    { id: 'acc-1004', tenantId: 't-acme-us', code: '1510', name: 'Accumulated Depreciation - Servers', type: 'ASSET', currency: 'USD', balance: -19000 },
    { id: 'acc-2001', tenantId: 't-acme-us', code: '2010', name: 'Accounts Payable', type: 'LIABILITY', currency: 'USD', balance: 64000 },
    { id: 'acc-2002', tenantId: 't-acme-us', code: '2200', name: 'State Sales Tax Payable', type: 'LIABILITY', currency: 'USD', balance: 14200 },
    { id: 'acc-3001', tenantId: 't-acme-us', code: '3010', name: 'Common Stock & Capital', type: 'EQUITY', currency: 'USD', balance: 350000 },
    { id: 'acc-3002', tenantId: 't-acme-us', code: '3200', name: 'Retained Earnings', type: 'EQUITY', currency: 'USD', balance: 114800 },
    { id: 'acc-4001', tenantId: 't-acme-us', code: '4010', name: 'SaaS Subscription Revenue', type: 'REVENUE', currency: 'USD', balance: 290000 },
    { id: 'acc-4002', tenantId: 't-acme-us', code: '4020', name: 'Enterprise Consulting Revenue', type: 'REVENUE', currency: 'USD', balance: 85000 },
    { id: 'acc-5001', tenantId: 't-acme-us', code: '5010', name: 'Cloud Infrastructure & Hosting Expenses', type: 'EXPENSE', currency: 'USD', balance: 45000 },
    { id: 'acc-5002', tenantId: 't-acme-us', code: '5020', name: 'Engineering & Staff Salaries', type: 'EXPENSE', currency: 'USD', balance: 125000 },
    { id: 'acc-5003', tenantId: 't-acme-us', code: '5030', name: 'Depreciation Expense', type: 'EXPENSE', currency: 'USD', balance: 25000 },
  ],
  't-global-eu': [
    { id: 'acc-e101', tenantId: 't-global-eu', code: '1010', name: 'ING Bank EUR Main', type: 'ASSET', currency: 'EUR', balance: 620000 },
    { id: 'acc-e102', tenantId: 't-global-eu', code: '1100', name: 'Trade Debtors (Accounts Receivable)', type: 'ASSET', currency: 'EUR', balance: 185000 },
    { id: 'acc-e201', tenantId: 't-global-eu', code: '2010', name: 'Trade Creditors (Accounts Payable)', type: 'LIABILITY', currency: 'EUR', balance: 72000 },
    { id: 'acc-e202', tenantId: 't-global-eu', code: '2100', name: 'EU VAT Payable (21% Standard Rate)', type: 'LIABILITY', currency: 'EUR', balance: 38850 },
    { id: 'acc-e203', tenantId: 't-global-eu', code: '2110', name: 'EU Reverse Charge VAT Input Credit', type: 'ASSET', currency: 'EUR', balance: 12400 },
    { id: 'acc-e301', tenantId: 't-global-eu', code: '3010', name: 'Share Capital', type: 'EQUITY', currency: 'EUR', balance: 400000 },
    { id: 'acc-e401', tenantId: 't-global-eu', code: '4010', name: 'Cross-Border EU Software Sales', type: 'REVENUE', currency: 'EUR', balance: 380000 },
    { id: 'acc-e501', tenantId: 't-global-eu', code: '5010', name: 'Research & Development Costs', type: 'EXPENSE', currency: 'EUR', balance: 73450 },
  ],
  't-bharat-in': [
    { id: 'acc-i101', tenantId: 't-bharat-in', code: '1010', name: 'HDFC Current Account', type: 'ASSET', currency: 'INR', balance: 14500000 },
    { id: 'acc-i102', tenantId: 't-bharat-in', code: '1100', name: 'Trade Receivables', type: 'ASSET', currency: 'INR', balance: 4200000 },
    { id: 'acc-i201', tenantId: 't-bharat-in', code: '2010', name: 'Trade Payables', type: 'LIABILITY', currency: 'INR', balance: 1800000 },
    { id: 'acc-i202', tenantId: 't-bharat-in', code: '2201', name: 'CGST Payable (9%)', type: 'LIABILITY', currency: 'INR', balance: 378000 },
    { id: 'acc-i203', tenantId: 't-bharat-in', code: '2202', name: 'SGST Payable (9%)', type: 'LIABILITY', currency: 'INR', balance: 378000 },
    { id: 'acc-i204', tenantId: 't-bharat-in', code: '2203', name: 'IGST Payable (18% Inter-State)', type: 'LIABILITY', currency: 'INR', balance: 216000 },
    { id: 'acc-i205', tenantId: 't-bharat-in', code: '1301', name: 'Input Tax Credit (ITC) - GST', type: 'ASSET', currency: 'INR', balance: 180000 },
    { id: 'acc-i301', tenantId: 't-bharat-in', code: '3010', name: 'Paid Up Equity Capital', type: 'EQUITY', currency: 'INR', balance: 10000000 },
    { id: 'acc-i401', tenantId: 't-bharat-in', code: '4010', name: 'Domestic Enterprise Tech Sales', type: 'REVENUE', currency: 'INR', balance: 8000000 },
    { id: 'acc-i501', tenantId: 't-bharat-in', code: '5010', name: 'Office Operations & Server Maintenance', type: 'EXPENSE', currency: 'INR', balance: 1892000 },
  ],
};

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je-1001',
    entryNumber: 'JE-2026-0001',
    tenantId: 't-acme-us',
    organizationId: 'org-acme-north',
    branchId: 'br-ny-hq',
    date: '2026-08-01',
    description: 'Q3 Enterprise SaaS Subscription Invoice #INV-9821',
    reference: 'INV-9821',
    pluginId: 'us_gaap',
    postedBy: 'sarah.accountant@acme.com',
    postedRole: 'accountant',
    status: 'POSTED',
    lines: [
      { id: 'jl-1', accountId: 'acc-1002', accountCode: '1100', accountName: 'Accounts Receivable', debit: 110000, credit: 0, memo: 'Client Invoice' },
      { id: 'jl-2', accountId: 'acc-4001', accountCode: '4010', accountName: 'SaaS Subscription Revenue', debit: 0, credit: 100000, memo: 'Net Revenue' },
      { id: 'jl-3', accountId: 'acc-2002', accountCode: '2200', accountName: 'State Sales Tax Payable', debit: 0, credit: 10000, memo: '10% NY Sales Tax' },
    ],
    totalDebit: 110000,
    totalCredit: 110000,
    createdAt: '2026-08-01T10:15:00Z',
  },
  {
    id: 'je-1002',
    entryNumber: 'JE-2026-0002',
    tenantId: 't-acme-us',
    organizationId: 'org-acme-north',
    branchId: 'br-sf-tech',
    date: '2026-08-05',
    description: 'AWS Cloud Infrastructure Monthly Hosting Settlement',
    reference: 'PO-AWS-882',
    pluginId: 'us_gaap',
    postedBy: 'john.admin@acme.com',
    postedRole: 'admin',
    status: 'POSTED',
    lines: [
      { id: 'jl-4', accountId: 'acc-5001', accountCode: '5010', accountName: 'Cloud Infrastructure Expenses', debit: 25000, credit: 0, memo: 'AWS Cloud Usage' },
      { id: 'jl-5', accountId: 'acc-1001', accountCode: '1010', accountName: 'Operating Cash - Chase Bank', debit: 0, credit: 25000, memo: 'Direct Bank Debit' },
    ],
    totalDebit: 25000,
    totalCredit: 25000,
    createdAt: '2026-08-05T14:30:00Z',
  },
  {
    id: 'je-e101',
    entryNumber: 'JE-EU-2026-001',
    tenantId: 't-global-eu',
    organizationId: 'org-globe-west',
    branchId: 'br-ams-hq',
    date: '2026-08-02',
    description: 'B2B Software Licensing - EU Cross Border Customer',
    reference: 'EU-INV-401',
    pluginId: 'eu_ifrs',
    postedBy: 'marco.finance@techglobe.eu',
    postedRole: 'accountant',
    status: 'POSTED',
    lines: [
      { id: 'jl-e1', accountId: 'acc-e102', accountCode: '1100', accountName: 'Trade Debtors', debit: 121000, credit: 0 },
      { id: 'jl-e2', accountId: 'acc-e401', accountCode: '4010', accountName: 'Cross-Border EU Software Sales', debit: 0, credit: 100000 },
      { id: 'jl-e3', accountId: 'acc-e202', accountCode: '2100', accountName: 'EU VAT Payable (21%)', debit: 0, credit: 21000 },
    ],
    totalDebit: 121000,
    totalCredit: 121000,
    createdAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'je-i101',
    entryNumber: 'JE-IN-2026-001',
    tenantId: 't-bharat-in',
    organizationId: 'org-bharat-south',
    branchId: 'br-blr-tech',
    date: '2026-08-03',
    description: 'Enterprise ERP Implementation Contract - Domestic Sales',
    reference: 'GST-INV-8891',
    pluginId: 'in_gst',
    postedBy: 'priya.ca@bharat.in',
    postedRole: 'accountant',
    status: 'POSTED',
    lines: [
      { id: 'jl-i1', accountId: 'acc-i102', accountCode: '1100', accountName: 'Trade Receivables', debit: 2360000, credit: 0 },
      { id: 'jl-i2', accountId: 'acc-i401', accountCode: '4010', accountName: 'Domestic Enterprise Tech Sales', debit: 0, credit: 2000000 },
      { id: 'jl-i3', accountId: 'acc-i202', accountCode: '2201', accountName: 'CGST Payable (9%)', debit: 0, credit: 180000 },
      { id: 'jl-i4', accountId: 'acc-i203', accountCode: '2202', accountName: 'SGST Payable (9%)', debit: 0, credit: 180000 },
    ],
    totalDebit: 2360000,
    totalCredit: 2360000,
    createdAt: '2026-08-03T16:20:00Z',
  },
];

export const INITIAL_BANK_STATEMENTS: BankStatementLine[] = [
  { id: 'bs-101', tenantId: 't-acme-us', date: '2026-08-02', description: 'Wire Transfer In - Client SaaS Payment', amount: 110000, reference: 'INV-9821', reconciled: true, matchedJournalEntryId: 'je-1001', matchedJournalLineId: 'jl-1' },
  { id: 'bs-102', tenantId: 't-acme-us', date: '2026-08-05', description: 'ACH Direct Debit - AWS Cloud Services', amount: -25000, reference: 'PO-AWS-882', reconciled: true, matchedJournalEntryId: 'je-1002', matchedJournalLineId: 'jl-5' },
  { id: 'bs-103', tenantId: 't-acme-us', date: '2026-08-10', description: 'Unassigned Deposit - Client Corp Deposit', amount: 45000, reference: 'DEP-9012', reconciled: false },
  { id: 'bs-104', tenantId: 't-acme-us', date: '2026-08-12', description: 'Office Depot Office Supplies', amount: -1450, reference: 'CARD-4412', reconciled: false },
];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  { id: 'fa-101', tenantId: 't-acme-us', assetNumber: 'AST-2025-01', name: 'High Performance GPU AI Cluster', category: 'IT Servers', acquisitionDate: '2025-01-15', cost: 120000, salvageValue: 20000, usefulLifeYears: 4, accumulatedDepreciation: 25000, netBookValue: 95000, depreciationMethod: 'STRAIGHT_LINE', lastDepreciationDate: '2026-07-31' },
  { id: 'fa-102', tenantId: 't-acme-us', assetNumber: 'AST-2025-02', name: 'New York HQ Executive Office Furniture', category: 'Furniture & Fixtures', acquisitionDate: '2025-03-01', cost: 35000, salvageValue: 5000, usefulLifeYears: 7, accumulatedDepreciation: 6428, netBookValue: 28572, depreciationMethod: 'STRAIGHT_LINE', lastDepreciationDate: '2026-07-31' },
];

export const INITIAL_AUDIT_LOGS: AuditLogEvent[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-13T00:01:00Z',
    action: 'POST_JOURNAL',
    tenantId: 't-acme-us',
    organizationId: 'org-acme-north',
    branchId: 'br-ny-hq',
    userRole: 'accountant',
    userEmail: 'sarah.accountant@acme.com',
    details: 'Posted Journal Entry JE-2026-0001 ($110,000.00)',
    status: 'SUCCESS',
    ipAddress: '192.168.1.104',
    payloadSummary: 'Debit: 110000 | Credit: 110000 | Double-Entry Verified',
  },
  {
    id: 'log-102',
    timestamp: '2026-08-12T18:40:00Z',
    action: 'POST_JOURNAL',
    tenantId: 't-acme-us',
    userRole: 'viewer',
    userEmail: 'guest.viewer@acme.com',
    details: 'Attempted to post manual journal entry without accountant/admin role',
    status: 'FORBIDDEN',
    ipAddress: '10.0.4.12',
    payloadSummary: 'HTTP 403 - Role viewer lacks permission for write endpoints',
  },
  {
    id: 'log-103',
    timestamp: '2026-08-11T14:10:00Z',
    action: 'IMPORT_TRANSACTIONS',
    tenantId: 't-acme-us',
    userRole: 'admin',
    userEmail: 'john.admin@acme.com',
    details: 'Batch uploaded 12 journal entries via CSV importer',
    status: 'SUCCESS',
    ipAddress: '172.16.0.44',
    payloadSummary: 'Batch Size: 12 entries | Validated against Chart of Accounts',
  },
];

export const FX_RATES: FxRate[] = [
  { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.0925, asOfDate: '2026-08-12' },
  { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.01205, asOfDate: '2026-08-12' },
  { fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.2840, asOfDate: '2026-08-12' },
];

export const INITIAL_INVOICES: CustomerInvoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-001',
    tenantId: 't-acme-us',
    customerName: 'Starlight Financial Corp',
    customerEmail: 'billing@starlight.com',
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    currency: 'USD',
    items: [
      { description: 'Enterprise SaaS Annual Platform License', quantity: 1, unitPrice: 100000, amount: 100000, taxRate: 10 },
    ],
    subtotal: 100000,
    taxTotal: 10000,
    totalAmount: 110000,
    amountPaid: 110000,
    status: 'PAID',
    revenueAccountCode: '4010',
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-002',
    tenantId: 't-acme-us',
    customerName: 'Apex Logistics Inc',
    customerEmail: 'ap@apexlogistics.com',
    issueDate: '2026-08-08',
    dueDate: '2026-09-07',
    currency: 'USD',
    items: [
      { description: 'Cloud Audit Automation Services', quantity: 1, unitPrice: 32000, amount: 32000, taxRate: 10 },
    ],
    subtotal: 32000,
    taxTotal: 3200,
    totalAmount: 35200,
    amountPaid: 0,
    status: 'UNPAID',
    revenueAccountCode: '4020',
  },
];

export const INITIAL_BILLS: VendorBill[] = [
  {
    id: 'bill-2001',
    billNumber: 'BILL-AWS-8812',
    tenantId: 't-acme-us',
    vendorName: 'Amazon Web Services Inc.',
    billDate: '2026-08-01',
    dueDate: '2026-08-15',
    currency: 'USD',
    items: [
      { description: 'US East EC2 & RDS Infrastructure Hosting', amount: 25000, expenseAccountCode: '5010' },
    ],
    totalAmount: 25000,
    amountPaid: 25000,
    status: 'PAID',
  },
  {
    id: 'bill-2002',
    billNumber: 'BILL-SNOW-901',
    tenantId: 't-acme-us',
    vendorName: 'Snowflake Data Cloud',
    billDate: '2026-08-05',
    dueDate: '2026-08-25',
    currency: 'USD',
    items: [
      { description: 'Enterprise Data Warehouse Usage & Credits', amount: 18500, expenseAccountCode: '5010' },
    ],
    totalAmount: 18500,
    amountPaid: 0,
    status: 'APPROVED',
  },
];

export const INITIAL_FISCAL_PERIODS: FiscalPeriod[] = [
  { id: 'fp-2026-q1', tenantId: 't-acme-us', periodName: '2026 Q1 Fiscal Quarter', startDate: '2026-01-01', endDate: '2026-03-31', status: 'CLOSED' },
  { id: 'fp-2026-q2', tenantId: 't-acme-us', periodName: '2026 Q2 Fiscal Quarter', startDate: '2026-04-01', endDate: '2026-06-30', status: 'LOCKED' },
  { id: 'fp-2026-q3', tenantId: 't-acme-us', periodName: '2026 Q3 Fiscal Quarter', startDate: '2026-07-01', endDate: '2026-09-30', status: 'OPEN' },
  { id: 'fp-2026-q4', tenantId: 't-acme-us', periodName: '2026 Q4 Fiscal Quarter', startDate: '2026-10-01', endDate: '2026-12-31', status: 'OPEN' },
];

export const INITIAL_TREASURY_ACCOUNTS: TreasuryAccount[] = [
  { id: 'tr-101', tenantId: 't-acme-us', name: 'JPMorgan Chase Commercial Checking', accountNumber: '•••• 8821', bankName: 'JPMorgan Chase Bank N.A.', currency: 'USD', balance: 1450000, type: 'CHECKING' },
  { id: 'tr-102', tenantId: 't-acme-us', name: 'Goldman Sachs High-Yield Treasury Vault', accountNumber: '•••• 4091', bankName: 'Goldman Sachs Bank USA', currency: 'USD', balance: 3500000, type: 'MONEY_MARKET' },
  { id: 'tr-103', tenantId: 't-acme-us', name: 'Barclays International FX Reserve', accountNumber: '•••• 1109', bankName: 'Barclays Bank PLC', currency: 'EUR', balance: 850000, type: 'FX_RESERVE' },
];

export const INITIAL_DEPARTMENT_BUDGETS: DepartmentBudget[] = [
  { id: 'bgt-101', tenantId: 't-acme-us', department: 'Engineering & R&D', annualBudget: 850000, ytdActual: 320000, variance: 530000, variancePercentage: 62.3, status: 'ON_TRACK' },
  { id: 'bgt-102', tenantId: 't-acme-us', department: 'Sales & Marketing', annualBudget: 600000, ytdActual: 480000, variance: 120000, variancePercentage: 20.0, status: 'WARNING' },
  { id: 'bgt-103', tenantId: 't-acme-us', department: 'General & Administrative', annualBudget: 350000, ytdActual: 180000, variance: 170000, variancePercentage: 48.5, status: 'ON_TRACK' },
  { id: 'bgt-104', tenantId: 't-acme-us', department: 'Customer Operations', annualBudget: 250000, ytdActual: 265000, variance: -15000, variancePercentage: -6.0, status: 'EXCEEDED' },
];

export const INITIAL_APPROVAL_ITEMS: ApprovalItem[] = [
  { id: 'app-301', tenantId: 't-acme-us', entityType: 'JOURNAL_ENTRY', referenceNumber: 'JE-2026-0089', amount: 150000, currency: 'USD', description: 'Acquisition of Datacenter Hardware Assets', requestedBy: 'sarah.accountant@acme.com', requestedDate: '2026-08-10', status: 'PENDING' },
  { id: 'app-302', tenantId: 't-acme-us', entityType: 'VENDOR_BILL', referenceNumber: 'BILL-GCP-9021', amount: 42000, currency: 'USD', description: 'Google Cloud Platform Monthly Compute Bill', requestedBy: 'john.admin@acme.com', requestedDate: '2026-08-11', status: 'PENDING' },
  { id: 'app-303', tenantId: 't-acme-us', entityType: 'INVOICE', referenceNumber: 'INV-2026-012', amount: 85000, currency: 'USD', description: 'Custom Enterprise Software Licensing Agreement', requestedBy: 'sarah.accountant@acme.com', requestedDate: '2026-08-08', status: 'APPROVED' },
];

export const INITIAL_TAX_JURISDICTIONS: TaxJurisdiction[] = [
  { id: 'tx-101', tenantId: 't-acme-us', code: 'US-NY-TAX', name: 'New York State & City Sales Tax', taxType: 'SALES_TAX', ratePercent: 8.875, filingFrequency: 'MONTHLY', ytdAccruedTax: 42500 },
  { id: 'tx-102', tenantId: 't-acme-us', code: 'US-CA-TAX', name: 'California State Board of Equalization', taxType: 'SALES_TAX', ratePercent: 7.25, filingFrequency: 'QUARTERLY', ytdAccruedTax: 31000 },
  { id: 'tx-103', tenantId: 't-global-eu', code: 'EU-NL-VAT', name: 'Netherlands Belastingdienst VAT', taxType: 'VAT', ratePercent: 21.0, filingFrequency: 'QUARTERLY', ytdAccruedTax: 88400 },
  { id: 'tx-104', tenantId: 't-ind-corp', code: 'IN-GST-18', name: 'India Central GST (CGST/SGST)', taxType: 'GST', ratePercent: 18.0, filingFrequency: 'MONTHLY', ytdAccruedTax: 1250000 },
];

export const INITIAL_CUSTOM_ROLES: CustomRoleDefinition[] = [
  {
    id: 'role-superuser',
    name: 'Global System Super Admin',
    code: 'super_user',
    description: 'Unrestricted global authority to manage system users, appoint Entity Admins across any entity, and grant global access.',
    isSystemRole: true,
    permissions: [
      'journals:create', 'journals:post', 'journals:reverse', 'ar:manage', 'ap:manage',
      'treasury:sweep', 'fpa:budget_edit', 'governance:approve', 'tax:settle',
      'fiscal:lock_period', 'fiscal:year_end_close', 'users:manage_provisioning',
      'users:manage_global', 'users:manage_entity', 'reports:export'
    ],
  },
  {
    id: 'role-entityadmin',
    name: 'Entity Administrator',
    code: 'entity_admin',
    description: 'Entity-level administrator with authority to manage and provision user access within their assigned organization/entity.',
    isSystemRole: true,
    permissions: [
      'journals:create', 'journals:post', 'journals:reverse', 'ar:manage', 'ap:manage',
      'treasury:sweep', 'fpa:budget_edit', 'governance:approve', 'tax:settle',
      'fiscal:lock_period', 'users:manage_provisioning', 'users:manage_entity', 'reports:export'
    ],
  },
  {
    id: 'role-admin',
    name: 'Global Financial Administrator',
    code: 'admin',
    description: 'Unrestricted financial system privileges including tenant creation, role assignments, and period closes.',
    isSystemRole: true,
    permissions: [
      'journals:create', 'journals:post', 'journals:reverse', 'ar:manage', 'ap:manage',
      'treasury:sweep', 'fpa:budget_edit', 'governance:approve', 'tax:settle',
      'fiscal:lock_period', 'fiscal:year_end_close', 'users:manage_provisioning', 'reports:export'
    ],
  },
  {
    id: 'role-controller',
    name: 'Corporate Financial Controller',
    code: 'controller',
    description: 'Financial sign-off authority, period locks, year-end closes, and high-value approvals.',
    isSystemRole: true,
    permissions: [
      'journals:create', 'journals:post', 'journals:reverse', 'ar:manage', 'ap:manage',
      'treasury:sweep', 'fpa:budget_edit', 'governance:approve', 'tax:settle',
      'fiscal:lock_period', 'fiscal:year_end_close', 'reports:export'
    ],
  },
  {
    id: 'role-senior-accountant',
    name: 'Senior GL Accountant',
    code: 'accountant',
    description: 'Post and reverse journal entries, manage AR/AP sub-ledgers, and run bank reconciliations.',
    isSystemRole: true,
    permissions: [
      'journals:create', 'journals:post', 'journals:reverse', 'ar:manage', 'ap:manage',
      'treasury:sweep', 'fpa:budget_edit', 'reports:export'
    ],
  },
  {
    id: 'role-junior-accountant',
    name: 'Staff / Junior Accountant',
    code: 'junior_accountant',
    description: 'Draft journal entries, invoices, and bills subject to supervisory approval.',
    isSystemRole: true,
    permissions: ['journals:create', 'ar:manage', 'ap:manage'],
  },
  {
    id: 'role-auditor',
    name: 'External SOX / Compliance Auditor',
    code: 'auditor',
    description: 'Read-only access to double-entry ledger trails, cryptographic hashes, and audit reports.',
    isSystemRole: true,
    permissions: ['reports:export'],
  },
  {
    id: 'role-viewer',
    name: 'Executive Read-Only Viewer',
    code: 'viewer',
    description: 'Read-only access to high-level financial dashboards.',
    isSystemRole: true,
    permissions: [],
  },
];

export const INITIAL_ENTERPRISE_USERS: EnterpriseUser[] = [
  {
    id: 'usr-100',
    name: 'Alex Mercer',
    email: 'alex.superuser@platform.com',
    title: 'Global Systems Super Administrator',
    department: 'Global Technology & Governance',
    status: 'ACTIVE',
    mfaEnabled: true,
    defaultRole: 'super_user',
    tenantScopes: [
      { tenantId: 't-acme-us', role: 'super_user' },
      { tenantId: 't-global-eu', role: 'super_user' },
      { tenantId: 't-ind-corp', role: 'super_user' },
    ],
    lastLogin: '2026-08-13 02:00 UTC',
    createdAt: '2024-11-01',
    apiTokenCount: 5,
  },
  {
    id: 'usr-106',
    name: 'Maria Santos',
    email: 'maria.admin@acme-us.com',
    title: 'Acme US Corporate Entity Admin',
    department: 'Entity Administration',
    status: 'ACTIVE',
    mfaEnabled: true,
    defaultRole: 'entity_admin',
    tenantScopes: [
      { tenantId: 't-acme-us', role: 'entity_admin' },
    ],
    lastLogin: '2026-08-12 21:10 UTC',
    createdAt: '2025-03-15',
    apiTokenCount: 2,
  },
  {
    id: 'usr-107',
    name: 'Jean-Luc Picard',
    email: 'jean.admin@global-eu.com',
    title: 'EU Subsidiary Entity Admin',
    department: 'European Operations',
    status: 'ACTIVE',
    mfaEnabled: true,
    defaultRole: 'entity_admin',
    tenantScopes: [
      { tenantId: 't-global-eu', role: 'entity_admin' },
    ],
    lastLogin: '2026-08-12 16:22 UTC',
    createdAt: '2025-04-01',
    apiTokenCount: 1,
  },
  {
    id: 'usr-101',
    name: 'Johnathan Miller',
    email: 'john.admin@acme.com',
    title: 'Chief Financial Officer (CFO)',
    department: 'Executive Leadership',
    status: 'ACTIVE',
    mfaEnabled: true,
    defaultRole: 'admin',
    tenantScopes: [
      { tenantId: 't-acme-us', role: 'admin' },
      { tenantId: 't-global-eu', role: 'admin' },
      { tenantId: 't-ind-corp', role: 'admin' },
    ],
    lastLogin: '2026-08-13 01:15 UTC',
    createdAt: '2025-01-15',
    apiTokenCount: 3,
  },
  {
    id: 'usr-102',
    name: 'Sarah Jenkins',
    email: 'sarah.accountant@acme.com',
    title: 'Senior General Ledger Controller',
    department: 'Corporate Accounting',
    status: 'ACTIVE',
    mfaEnabled: true,
    defaultRole: 'controller',
    tenantScopes: [
      { tenantId: 't-acme-us', role: 'controller' },
      { tenantId: 't-global-eu', role: 'accountant' },
    ],
    lastLogin: '2026-08-12 18:40 UTC',
    createdAt: '2025-02-01',
    apiTokenCount: 1,
  },
  {
    id: 'usr-103',
    name: 'David Vance',
    email: 'david.junior@acme.com',
    title: 'Staff AP/AR Accountant',
    department: 'Finance Operations',
    status: 'ACTIVE',
    mfaEnabled: false,
    defaultRole: 'junior_accountant',
    tenantScopes: [
      { tenantId: 't-acme-us', role: 'junior_accountant' },
    ],
    lastLogin: '2026-08-11 09:12 UTC',
    createdAt: '2025-06-10',
    apiTokenCount: 0,
  },
  {
    id: 'usr-104',
    name: 'Elena Rostova',
    email: 'elena.auditor@kpmg-audit.com',
    title: 'Principal SOX 404 Lead Auditor',
    department: 'External Audit Advisory',
    status: 'ACTIVE',
    mfaEnabled: true,
    defaultRole: 'auditor',
    tenantScopes: [
      { tenantId: 't-acme-us', role: 'auditor' },
      { tenantId: 't-global-eu', role: 'auditor' },
    ],
    lastLogin: '2026-08-10 14:05 UTC',
    createdAt: '2026-01-10',
    apiTokenCount: 2,
  },
  {
    id: 'usr-105',
    name: 'Guest Viewer',
    email: 'guest.viewer@acme.com',
    title: 'Board Observer',
    department: 'Investor Relations',
    status: 'ACTIVE',
    mfaEnabled: false,
    defaultRole: 'viewer',
    tenantScopes: [
      { tenantId: 't-acme-us', role: 'viewer' },
    ],
    lastLogin: '2026-08-05 11:30 UTC',
    createdAt: '2026-03-20',
    apiTokenCount: 0,
  },
];

