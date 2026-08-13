/**
 * Utility functions for downloading and generating entity data import templates.
 */

export interface DownloadTemplateInfo {
  id: string;
  title: string;
  description: string;
  filename: string;
  category: 'General Ledger' | 'Sub-Ledgers' | 'Assets & Budgets' | 'Treasury & Banking';
  headers: string[];
  sampleCsv: (tenantName?: string, currency?: string) => string;
  sampleJson: (tenantName?: string, currency?: string) => string;
  fieldDocs: { field: string; required: boolean; description: string }[];
}

export const downloadCsvFile = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const UPLOAD_TEMPLATES: DownloadTemplateInfo[] = [
  {
    id: 'journal_entries',
    title: 'General Ledger Opening & Batch Journal Entries',
    description: 'Double-entry transaction batch upload template for posting debit/credit lines into GL.',
    filename: 'journal_entries_template.csv',
    category: 'General Ledger',
    headers: ['Date', 'Description', 'DebitAccountCode', 'CreditAccountCode', 'Amount', 'Reference'],
    sampleCsv: (tenantName = 'Acme Corp', currency = 'USD') => `Date, Description, DebitAccountCode, CreditAccountCode, Amount, Reference
2026-08-10, Initial Cash Deposit - Capital Contribution, 1010, 3010, 100000, REF-CAP-001
2026-08-11, Office Premises Monthly Rent Payment, 5010, 1010, 8500, RENT-AUG-26
2026-08-12, Enterprise SaaS License Sales Revenue, 1100, 4010, 35000, INV-2026-089
2026-08-13, IT Infrastructure Equipment Purchase, 5010, 2010, 14200, PO-HW-4091`,
    sampleJson: () => JSON.stringify(
      [
        { date: '2026-08-10', description: 'Initial Capital Deposit', accountCodeDebit: '1010', accountCodeCredit: '3010', amount: 100000, reference: 'REF-CAP-001' },
        { date: '2026-08-11', description: 'Office Rent Payment', accountCodeDebit: '5010', accountCodeCredit: '1010', amount: 8500, reference: 'RENT-AUG-26' },
      ],
      null,
      2
    ),
    fieldDocs: [
      { field: 'Date', required: true, description: 'Transaction date in YYYY-MM-DD format (e.g. 2026-08-12)' },
      { field: 'Description', required: true, description: 'Narrative description of the financial transaction' },
      { field: 'DebitAccountCode', required: true, description: 'Valid Account Code from Chart of Accounts (e.g., 1010, 5010)' },
      { field: 'CreditAccountCode', required: true, description: 'Valid Account Code from Chart of Accounts (e.g., 3010, 4010)' },
      { field: 'Amount', required: true, description: 'Positive numerical transaction total' },
      { field: 'Reference', required: false, description: 'Invoice/PO or external audit voucher reference' },
    ],
  },
  {
    id: 'chart_of_accounts',
    title: 'Chart of Accounts (CoA) Master Structure',
    description: 'Master structure upload for defining new GL account codes, names, and account types.',
    filename: 'chart_of_accounts_template.csv',
    category: 'General Ledger',
    headers: ['AccountCode', 'AccountName', 'AccountType', 'Currency', 'OpeningBalance'],
    sampleCsv: (_tenantName = 'Acme Corp', currency = 'USD') => `AccountCode, AccountName, AccountType, Currency, OpeningBalance
1015, Citi Bank Reserve Vault Account, ASSET, ${currency}, 250000.00
1120, Unbilled Accounts Receivable, ASSET, ${currency}, 18500.00
2020, Accrued Payroll & Bonuses Payable, LIABILITY, ${currency}, 42000.00
3020, Additional Paid-In Capital, EQUITY, ${currency}, 150000.00
4020, Advisory & Managed Services Revenue, REVENUE, ${currency}, 65000.00
5040, Cloud Server Hosting & Telemetry, EXPENSE, ${currency}, 12800.00`,
    sampleJson: (_t, currency = 'USD') => JSON.stringify(
      [
        { accountCode: '1015', accountName: 'Citi Bank Reserve Vault', accountType: 'ASSET', currency, openingBalance: 250000 },
        { accountCode: '4020', accountName: 'Advisory Revenue', accountType: 'REVENUE', currency, openingBalance: 65000 },
      ],
      null,
      2
    ),
    fieldDocs: [
      { field: 'AccountCode', required: true, description: 'Unique numerical or alphanumeric GL code (e.g. 1015, 2020)' },
      { field: 'AccountName', required: true, description: 'Official ledger title for the account' },
      { field: 'AccountType', required: true, description: 'Must be ASSET, LIABILITY, EQUITY, REVENUE, or EXPENSE' },
      { field: 'Currency', required: true, description: '3-letter ISO Currency code (e.g. USD, EUR, INR, GBP, JPY)' },
      { field: 'OpeningBalance', required: false, description: 'Initial balance at entity start date' },
    ],
  },
  {
    id: 'ar_invoices',
    title: 'Accounts Receivable (AR) Invoices Register',
    description: 'Customer sales invoices batch importer with revenue account mapping and due date tracking.',
    filename: 'ar_invoices_template.csv',
    category: 'Sub-Ledgers',
    headers: ['InvoiceNumber', 'CustomerName', 'IssueDate', 'DueDate', 'RevenueAccountCode', 'Subtotal', 'TaxAmount', 'TotalAmount'],
    sampleCsv: () => `InvoiceNumber, CustomerName, IssueDate, DueDate, RevenueAccountCode, Subtotal, TaxAmount, TotalAmount
INV-2026-101, Vanguard Global Holdings, 2026-08-01, 2026-08-31, 4010, 45000.00, 3600.00, 48600.00
INV-2026-102, Apex Cloud Systems Corp, 2026-08-05, 2026-09-04, 4010, 28000.00, 2240.00, 30240.00
INV-2026-103, Nexus Logistics EU B.V., 2026-08-10, 2026-09-09, 4020, 15500.00, 1240.00, 16740.00`,
    sampleJson: () => JSON.stringify(
      [
        { invoiceNumber: 'INV-2026-101', customerName: 'Vanguard Global', issueDate: '2026-08-01', dueDate: '2026-08-31', revenueAccountCode: '4010', subtotal: 45000, taxAmount: 3600, totalAmount: 48600 },
      ],
      null,
      2
    ),
    fieldDocs: [
      { field: 'InvoiceNumber', required: true, description: 'Unique customer invoice reference number' },
      { field: 'CustomerName', required: true, description: 'Legal corporate customer entity name' },
      { field: 'IssueDate', required: true, description: 'Invoice issuance date (YYYY-MM-DD)' },
      { field: 'DueDate', required: true, description: 'Payment due date (YYYY-MM-DD)' },
      { field: 'RevenueAccountCode', required: true, description: 'GL revenue account code (e.g. 4010)' },
      { field: 'Subtotal', required: true, description: 'Gross sale amount before taxes' },
      { field: 'TaxAmount', required: false, description: 'Sales tax / VAT / GST output tax liability' },
      { field: 'TotalAmount', required: true, description: 'Final invoice sum (Subtotal + TaxAmount)' },
    ],
  },
  {
    id: 'ap_bills',
    title: 'Accounts Payable (AP) Vendor Bills',
    description: 'Vendor bills and supplier disbursements batch importer.',
    filename: 'ap_bills_template.csv',
    category: 'Sub-Ledgers',
    headers: ['BillNumber', 'VendorName', 'BillDate', 'DueDate', 'ExpenseAccountCode', 'Amount', 'Description'],
    sampleCsv: () => `BillNumber, VendorName, BillDate, DueDate, ExpenseAccountCode, Amount, Description
BILL-2026-901, Amazon Web Services Infrastructure, 2026-08-02, 2026-08-17, 5010, 14850.00, August Cloud Computing & Database Instances
BILL-2026-902, WeWork Real Estate Corp, 2026-08-01, 2026-08-15, 5010, 9200.00, Monthly Executive Office Lease
BILL-2026-903, Salesforce.com SaaS License, 2026-08-04, 2026-08-24, 5010, 6400.00, Annual CRM Software Licenses`,
    sampleJson: () => JSON.stringify(
      [
        { billNumber: 'BILL-2026-901', vendorName: 'AWS Infrastructure', billDate: '2026-08-02', dueDate: '2026-08-17', expenseAccountCode: '5010', amount: 14850, description: 'Cloud Computing' },
      ],
      null,
      2
    ),
    fieldDocs: [
      { field: 'BillNumber', required: true, description: 'Supplier bill reference or voucher number' },
      { field: 'VendorName', required: true, description: 'Legal supplier or vendor company name' },
      { field: 'BillDate', required: true, description: 'Vendor bill date (YYYY-MM-DD)' },
      { field: 'DueDate', required: true, description: 'Disbursement due date (YYYY-MM-DD)' },
      { field: 'ExpenseAccountCode', required: true, description: 'GL expense code (e.g. 5010, 5040)' },
      { field: 'Amount', required: true, description: 'Total bill payable amount' },
      { field: 'Description', required: false, description: 'Details of goods/services rendered' },
    ],
  },
  {
    id: 'fixed_assets',
    title: 'Fixed Assets Register & Capital Expenditure',
    description: 'Capital assets register importer for straight-line / declining balance depreciation tracking.',
    filename: 'fixed_assets_template.csv',
    category: 'Assets & Budgets',
    headers: ['AssetNumber', 'AssetName', 'Category', 'AcquisitionDate', 'Cost', 'SalvageValue', 'UsefulLifeYears'],
    sampleCsv: () => `AssetNumber, AssetName, Category, AcquisitionDate, Cost, SalvageValue, UsefulLifeYears
FA-2026-01, High-Performance GPU Computing Cluster, IT Hardware, 2026-01-15, 65000.00, 5000.00, 3
FA-2026-02, Tokyo Office Executive Furniture, Furniture & Fixtures, 2026-03-01, 24000.00, 2000.00, 7
FA-2026-03, Headquarters Logistics Delivery Van, Vehicles, 2026-05-10, 48000.00, 8000.00, 5`,
    sampleJson: () => JSON.stringify(
      [
        { assetNumber: 'FA-2026-01', assetName: 'GPU Cluster', category: 'IT Hardware', acquisitionDate: '2026-01-15', cost: 65000, salvageValue: 5000, usefulLifeYears: 3 },
      ],
      null,
      2
    ),
    fieldDocs: [
      { field: 'AssetNumber', required: true, description: 'Asset Tag or serial identification code' },
      { field: 'AssetName', required: true, description: 'Descriptive title of capital equipment' },
      { field: 'Category', required: true, description: 'Asset classification (e.g., IT Hardware, Vehicles)' },
      { field: 'AcquisitionDate', required: true, description: 'Date put into service (YYYY-MM-DD)' },
      { field: 'Cost', required: true, description: 'Original capital purchase price' },
      { field: 'SalvageValue', required: false, description: 'Estimated residual value at end of useful life' },
      { field: 'UsefulLifeYears', required: true, description: 'Amortization period in years (e.g. 3, 5, 7, 10)' },
    ],
  },
  {
    id: 'department_budgets',
    title: 'FP&A Cost Center Annual Budgets',
    description: 'Departmental budget allocations importer for variance reporting and cost-center control.',
    filename: 'department_budgets_template.csv',
    category: 'Assets & Budgets',
    headers: ['DepartmentName', 'AnnualBudgetAmount'],
    sampleCsv: () => `DepartmentName, AnnualBudgetAmount
Engineering & Infrastructure, 450000.00
Sales & Global Business Development, 320000.00
Corporate Accounting & Finance, 180000.00
Legal & Regulatory Compliance, 140000.00
Human Resources & People Ops, 110000.00`,
    sampleJson: () => JSON.stringify(
      [
        { departmentName: 'Engineering & Infrastructure', annualBudgetAmount: 450000 },
        { departmentName: 'Sales & Business Development', annualBudgetAmount: 320000 },
      ],
      null,
      2
    ),
    fieldDocs: [
      { field: 'DepartmentName', required: true, description: 'Cost center or organizational unit name' },
      { field: 'AnnualBudgetAmount', required: true, description: 'Allocated annual fiscal expenditure limit' },
    ],
  },
  {
    id: 'bank_reconciliation',
    title: 'Bank Statement Feed & Reconciliation Feed',
    description: 'Bank statement line feed importer for automated matching against GL cash transactions.',
    filename: 'bank_statement_reconciliation_template.csv',
    category: 'Treasury & Banking',
    headers: ['Date', 'Reference', 'Description', 'Amount', 'PayeeOrPayer', 'AccountCode'],
    sampleCsv: (_tenantName = 'Acme Corp', currency = 'USD') => `Date, Reference, Description, Amount, PayeeOrPayer, AccountCode
2026-08-10, BANK-DEP-991, ACH Deposit - Customer Sales Remittance, 35000.00, Vanguard Global Holdings, 1010
2026-08-11, BANK-WD-402, Wire Disbursement - Monthly Office Lease, -8500.00, WeWork Real Estate Corp, 1010
2026-08-12, BANK-FEE-088, Monthly Treasury Account Maintenance & Service Fee, -150.00, Chase Commercial Banking, 1010
2026-08-13, BANK-DEP-992, Direct Wire Deposit - Managed Advisory Services, 18500.00, Nexus Logistics EU B.V., 1010`,
    sampleJson: () => JSON.stringify(
      [
        { date: '2026-08-10', reference: 'BANK-DEP-991', description: 'ACH Deposit - Customer Remittance', amount: 35000, payeeOrPayer: 'Vanguard Global', accountCode: '1010' },
        { date: '2026-08-11', reference: 'BANK-WD-402', description: 'Wire Disbursement - Monthly Lease', amount: -8500, payeeOrPayer: 'WeWork Real Estate', accountCode: '1010' },
      ],
      null,
      2
    ),
    fieldDocs: [
      { field: 'Date', required: true, description: 'Bank transaction date (YYYY-MM-DD)' },
      { field: 'Reference', required: true, description: 'Bank voucher, check number, or ACH clearance ref' },
      { field: 'Description', required: true, description: 'Bank statement memo or transaction narrative' },
      { field: 'Amount', required: true, description: 'Signed amount: Positive (+) for deposits/cash in, Negative (-) for withdrawals/cash out' },
      { field: 'PayeeOrPayer', required: false, description: 'Counterparty name on bank statement' },
      { field: 'AccountCode', required: false, description: 'Target Cash Account Code in GL (Defaults to 1010)' },
    ],
  },
];
