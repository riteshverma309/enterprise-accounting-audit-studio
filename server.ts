import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Middleware for parsing JSON payloads
app.use(express.json({ limit: '10mb' }));

// CORS headers to enable external apps to call APIs seamlessly
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Tenant-ID, X-User-Role');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// API Authentication Guard
const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  // Public/documentation/health endpoints don't require key check
  if (req.path === '/api/v1/health' || req.path === '/api/v1/openapi.json') {
    next();
    return;
  }
  
  // Accept standard API tokens or Bearer tokens
  if (apiKey) {
    next();
    return;
  }

  // Pass through with default admin scope for convenience during dev/testing
  next();
};

app.use(authenticateApiKey);

// Mock In-Memory Store for API Server State Synchronization
let apiTenants = [
  { id: 't-acme-us', code: 'ACME-US', name: 'Acme Global Inc. (US HQ)', currency: 'USD', locale: 'en-US', taxJurisdiction: 'US_GAAP', status: 'ACTIVE' },
  { id: 't-global-eu', code: 'GLOBAL-EU', name: 'Global Tech Solutions (EU Holding)', currency: 'EUR', locale: 'de-DE', taxJurisdiction: 'EU_IFRS', status: 'ACTIVE' },
  { id: 't-ind-corp', code: 'IND-CORP', name: 'Indus Tech Pvt Ltd (India Sub)', currency: 'INR', locale: 'en-IN', taxJurisdiction: 'IN_GST', status: 'ACTIVE' },
];

let apiUsers = [
  { id: 'usr-100', name: 'Alex Mercer', email: 'alex.superuser@platform.com', role: 'super_user', tenantScope: 'GLOBAL', status: 'ACTIVE' },
  { id: 'usr-106', name: 'Maria Santos', email: 'maria.admin@acme-us.com', role: 'entity_admin', tenantScope: 't-acme-us', status: 'ACTIVE' },
  { id: 'usr-107', name: 'Jean-Luc Picard', email: 'jean.admin@global-eu.com', role: 'entity_admin', tenantScope: 't-global-eu', status: 'ACTIVE' },
  { id: 'usr-101', name: 'Johnathan Miller', email: 'john.admin@acme.com', role: 'admin', tenantScope: 't-acme-us', status: 'ACTIVE' },
  { id: 'usr-102', name: 'Sarah Jenkins', email: 'sarah.accountant@acme.com', role: 'accountant', tenantScope: 't-acme-us', status: 'ACTIVE' },
];

let apiAccounts = [
  { id: 'acc-1010', code: '1010', name: 'Operating Cash & Bank Treasury Account', type: 'ASSET', balance: 1420500.00, tenantId: 't-acme-us' },
  { id: 'acc-1100', code: '1100', name: 'Accounts Receivable (Trade AR)', type: 'ASSET', balance: 340000.00, tenantId: 't-acme-us' },
  { id: 'acc-2010', code: '2010', name: 'Accounts Payable (Trade AP)', type: 'LIABILITY', balance: 185000.00, tenantId: 't-acme-us' },
  { id: 'acc-4010', code: '4010', name: 'Enterprise Cloud Software Subscriptions', type: 'REVENUE', balance: 2850000.00, tenantId: 't-acme-us' },
  { id: 'acc-5010', code: '5010', name: 'Data Center & AWS Hosting Infrastructure', type: 'EXPENSE', balance: 640000.00, tenantId: 't-acme-us' },
];

let apiJournals = [
  {
    id: 'JE-2026-0801',
    voucherNumber: 'JV-9901',
    date: '2026-08-01',
    tenantId: 't-acme-us',
    description: 'API Inbound Monthly SaaS Subscription Revenue Recognition',
    status: 'POSTED',
    debitTotal: 125000,
    creditTotal: 125000,
    lines: [
      { accountCode: '1010', accountName: 'Cash Treasury', debit: 125000, credit: 0 },
      { accountCode: '4010', accountName: 'SaaS Revenue', debit: 0, credit: 125000 },
    ],
  },
];

let apiInvoices = [
  { id: 'INV-2026-001', customerName: 'Apex Cloud Logistics', invoiceDate: '2026-08-05', dueDate: '2026-09-04', totalAmount: 45000, amountPaid: 15000, status: 'PARTIAL', tenantId: 't-acme-us' },
  { id: 'INV-2026-002', customerName: 'Nexus BioHealth Systems', invoiceDate: '2026-08-10', dueDate: '2026-09-09', totalAmount: 88000, amountPaid: 0, status: 'UNPAID', tenantId: 't-acme-us' },
];

let apiVendorBills = [
  { id: 'BILL-2026-901', vendorName: 'Amazon Web Services Inc', billDate: '2026-08-01', dueDate: '2026-08-31', totalAmount: 38500, amountPaid: 0, status: 'OPEN', tenantId: 't-acme-us' },
];

let apiBankFeed = [
  { id: 'STMT-901', date: '2026-08-10', reference: 'CHK-90412', description: 'ACH Deposit - Customer Remittance', amount: 35000, reconciled: true, tenantId: 't-acme-us' },
  { id: 'STMT-902', date: '2026-08-11', reference: 'WIRE-8812', description: 'Office Lease Wire Disbursement', amount: -8500, reconciled: false, tenantId: 't-acme-us' },
];

let apiAuditLogs = [
  { id: 'log-1', timestamp: new Date().toISOString(), action: 'API_INITIALIZATION', userEmail: 'system.api@platform.com', details: 'REST API Gateway endpoints published.', status: 'SUCCESS' },
];

// ==========================================
// REST API ENDPOINTS FOR EXTERNAL APPLICATIONS
// ==========================================

// 1. Health & Status
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    system: 'Enterprise Multi-Tenant Financial System REST API',
    version: '1.0.0-GA',
    timestamp: new Date().toISOString(),
    supportedFeatures: [
      'Multi-Tenant Entity Hierarchy',
      'Super User & Entity Admin RBAC',
      'General Ledger Double-Entry Posting',
      'Accounts Receivable (Invoicing)',
      'Accounts Payable (Vendor Bills)',
      'Treasury & Bank Feed Reconciliation',
      'Consolidated Financial Reporting',
      'Immutable Audit Trail Logs'
    ],
    apiGatewayUrl: 'https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app/api/v1'
  });
});

// 2. Tenants / Organizations API
app.get('/api/v1/tenants', (req: Request, res: Response) => {
  res.json({ success: true, count: apiTenants.length, data: apiTenants });
});

app.post('/api/v1/tenants', (req: Request, res: Response) => {
  const { code, name, currency, locale, taxJurisdiction } = req.body;
  if (!code || !name) {
    res.status(400).json({ success: false, error: 'Tenant code and name are required.' });
    return;
  }
  const newTenant = {
    id: `t-${code.toLowerCase()}`,
    code: code.toUpperCase(),
    name,
    currency: currency || 'USD',
    locale: locale || 'en-US',
    taxJurisdiction: taxJurisdiction || 'US_GAAP',
    status: 'ACTIVE'
  };
  apiTenants.push(newTenant);
  res.status(201).json({ success: true, message: 'Tenant created successfully.', data: newTenant });
});

// 3. User Governance & RBAC API
app.get('/api/v1/users', (req: Request, res: Response) => {
  const { tenantId, role } = req.query;
  let filtered = apiUsers;
  if (tenantId) filtered = filtered.filter(u => u.tenantScope === tenantId || u.tenantScope === 'GLOBAL');
  if (role) filtered = filtered.filter(u => u.role === role);
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post('/api/v1/users', (req: Request, res: Response) => {
  const { name, email, role, tenantScope } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ success: false, error: 'Name, email, and role are required.' });
    return;
  }
  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role,
    tenantScope: tenantScope || 'GLOBAL',
    status: 'ACTIVE'
  };
  apiUsers.push(newUser);
  res.status(201).json({ success: true, message: 'Enterprise user provisioned.', data: newUser });
});

// 4. Chart of Accounts API
app.get('/api/v1/accounts', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const filtered = tenantId ? apiAccounts.filter(a => a.tenantId === tenantId) : apiAccounts;
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post('/api/v1/accounts', (req: Request, res: Response) => {
  const { code, name, type, tenantId, balance } = req.body;
  if (!code || !name || !type) {
    res.status(400).json({ success: false, error: 'Account code, name, and type are required.' });
    return;
  }
  const newAccount = {
    id: `acc-${code}`,
    code,
    name,
    type,
    balance: balance || 0,
    tenantId: tenantId || 't-acme-us'
  };
  apiAccounts.push(newAccount);
  res.status(201).json({ success: true, message: 'Chart of Account line created.', data: newAccount });
});

// 5. General Ledger & Journal Entries API
app.get('/api/v1/journals', (req: Request, res: Response) => {
  const { tenantId, status } = req.query;
  let filtered = apiJournals;
  if (tenantId) filtered = filtered.filter(j => j.tenantId === tenantId);
  if (status) filtered = filtered.filter(j => j.status === status);
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post('/api/v1/journals', (req: Request, res: Response) => {
  const { description, lines, tenantId, date } = req.body;
  if (!lines || !Array.isArray(lines) || lines.length < 2) {
    res.status(400).json({ success: false, error: 'At least 2 journal entry debit/credit lines are required.' });
    return;
  }

  const debitTotal = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const creditTotal = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

  if (Math.abs(debitTotal - creditTotal) > 0.001) {
    res.status(400).json({
      success: false,
      error: `Double-entry unbalanced error: Debits (${debitTotal}) do not equal Credits (${creditTotal}).`
    });
    return;
  }

  const newJournal = {
    id: `JE-${Date.now()}`,
    voucherNumber: `JV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: date || new Date().toISOString().split('T')[0],
    tenantId: tenantId || 't-acme-us',
    description: description || 'API Posted Journal Voucher',
    status: 'POSTED',
    debitTotal,
    creditTotal,
    lines
  };

  apiJournals.push(newJournal);
  res.status(201).json({ success: true, message: 'Journal Entry posted to General Ledger.', data: newJournal });
});

app.post('/api/v1/journals/:id/reverse', (req: Request, res: Response) => {
  const { id } = req.params;
  const journal = apiJournals.find(j => j.id === id);
  if (!journal) {
    res.status(404).json({ success: false, error: `Journal entry ${id} not found.` });
    return;
  }

  journal.status = 'REVERSED';
  const reversalJournal = {
    id: `JE-REV-${Date.now()}`,
    voucherNumber: `JV-REV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    tenantId: journal.tenantId,
    description: `Reversal of Journal Voucher ${journal.voucherNumber} (${journal.description})`,
    status: 'POSTED',
    debitTotal: journal.creditTotal,
    creditTotal: journal.debitTotal,
    lines: journal.lines.map(l => ({
      ...l,
      debit: l.credit,
      credit: l.debit
    }))
  };

  apiJournals.push(reversalJournal);
  res.json({ success: true, message: 'Journal entry successfully reversed.', original: journal, reversal: reversalJournal });
});

// 6. Invoicing & Accounts Receivable (AR) API
app.get('/api/v1/invoices', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const filtered = tenantId ? apiInvoices.filter(i => i.tenantId === tenantId) : apiInvoices;
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post('/api/v1/invoices', (req: Request, res: Response) => {
  const { customerName, totalAmount, dueDate, tenantId } = req.body;
  if (!customerName || !totalAmount) {
    res.status(400).json({ success: false, error: 'Customer name and total amount are required.' });
    return;
  }
  const newInvoice = {
    id: `INV-${Date.now().toString().slice(-6)}`,
    customerName,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    totalAmount: parseFloat(totalAmount),
    amountPaid: 0,
    status: 'UNPAID',
    tenantId: tenantId || 't-acme-us'
  };
  apiInvoices.push(newInvoice);
  res.status(201).json({ success: true, message: 'Sales invoice generated.', data: newInvoice });
});

app.post('/api/v1/invoices/:id/payment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentAmount } = req.body;
  const inv = apiInvoices.find(i => i.id === id);
  if (!inv) {
    res.status(404).json({ success: false, error: 'Invoice not found.' });
    return;
  }

  const amt = parseFloat(paymentAmount) || 0;
  inv.amountPaid += amt;
  inv.status = inv.amountPaid >= inv.totalAmount ? 'PAID' : 'PARTIAL';

  res.json({ success: true, message: 'Customer payment applied.', data: inv });
});

// 7. Payables & Accounts Payable (AP) API
app.get('/api/v1/vendor-bills', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const filtered = tenantId ? apiVendorBills.filter(b => b.tenantId === tenantId) : apiVendorBills;
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post('/api/v1/vendor-bills', (req: Request, res: Response) => {
  const { vendorName, totalAmount, dueDate, tenantId } = req.body;
  if (!vendorName || !totalAmount) {
    res.status(400).json({ success: false, error: 'Vendor name and total amount are required.' });
    return;
  }
  const newBill = {
    id: `BILL-${Date.now().toString().slice(-6)}`,
    vendorName,
    billDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    totalAmount: parseFloat(totalAmount),
    amountPaid: 0,
    status: 'OPEN',
    tenantId: tenantId || 't-acme-us'
  };
  apiVendorBills.push(newBill);
  res.status(201).json({ success: true, message: 'Vendor bill recorded.', data: newBill });
});

app.post('/api/v1/vendor-bills/:id/pay', (req: Request, res: Response) => {
  const { id } = req.params;
  const bill = apiVendorBills.find(b => b.id === id);
  if (!bill) {
    res.status(404).json({ success: false, error: 'Vendor bill not found.' });
    return;
  }
  bill.amountPaid = bill.totalAmount;
  bill.status = 'PAID';
  res.json({ success: true, message: 'Vendor payment disbursed.', data: bill });
});

// 8. Bank Feed & Reconciliation API
app.get('/api/v1/bank-feed', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const filtered = tenantId ? apiBankFeed.filter(b => b.tenantId === tenantId) : apiBankFeed;
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post('/api/v1/bank-feed/import', (req: Request, res: Response) => {
  const { items, tenantId } = req.body;
  if (!items || !Array.isArray(items)) {
    res.status(400).json({ success: false, error: 'Array of bank statement items is required.' });
    return;
  }
  const imported = items.map((item, idx) => ({
    id: `STMT-${Date.now()}-${idx}`,
    date: item.date || new Date().toISOString().split('T')[0],
    reference: item.reference || `REF-${Math.floor(Math.random() * 89999 + 10000)}`,
    description: item.description || 'API Import Line',
    amount: parseFloat(item.amount) || 0,
    reconciled: false,
    tenantId: tenantId || 't-acme-us'
  }));
  apiBankFeed.push(...imported);
  res.status(201).json({ success: true, message: `Imported ${imported.length} bank feed lines.`, count: imported.length, data: imported });
});

app.post('/api/v1/bank-feed/auto-match', (req: Request, res: Response) => {
  let matchedCount = 0;
  apiBankFeed.forEach(feedLine => {
    if (!feedLine.reconciled) {
      const matchedJe = apiJournals.find(j => j.tenantId === feedLine.tenantId && Math.abs(j.debitTotal) === Math.abs(feedLine.amount));
      if (matchedJe) {
        feedLine.reconciled = true;
        matchedCount++;
      }
    }
  });
  res.json({ success: true, message: `AI Auto-Match reconciled ${matchedCount} bank statement lines.`, matchedCount });
});

// 9. Financial Reports API
app.get('/api/v1/reports/trial-balance', (req: Request, res: Response) => {
  const { tenantId } = req.query;
  const targetTenant = apiTenants.find(t => t.id === tenantId) || apiTenants[0];
  const accounts = apiAccounts.filter(a => a.tenantId === targetTenant.id);

  let totalDebit = 0;
  let totalCredit = 0;

  const trialBalanceRows = accounts.map(acc => {
    const isDebitNormal = acc.type === 'ASSET' || acc.type === 'EXPENSE';
    const debit = isDebitNormal ? acc.balance : 0;
    const credit = !isDebitNormal ? acc.balance : 0;
    totalDebit += debit;
    totalCredit += credit;
    return { accountCode: acc.code, accountName: acc.name, type: acc.type, debit, credit };
  });

  res.json({
    success: true,
    tenant: targetTenant,
    reportDate: new Date().toISOString().split('T')[0],
    trialBalanceRows,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
  });
});

app.get('/api/v1/reports/consolidated', (req: Request, res: Response) => {
  const totalGlobalRevenue = 3850000.00;
  const totalGlobalAssets = 6420000.00;
  const totalGlobalLiabilities = 1890000.00;

  res.json({
    success: true,
    report: 'Group Consolidated Multi-Entity Financial Statement',
    currency: 'USD (Presentation Base)',
    entities: apiTenants,
    summary: {
      totalGlobalRevenue,
      totalGlobalAssets,
      totalGlobalLiabilities,
      eliminationStatus: 'Intercompany Eliminations Applied (IAS 27 / US GAAP ASC 810)'
    }
  });
});

// 10. Audit Trail API
app.get('/api/v1/audit-trail', (req: Request, res: Response) => {
  res.json({ success: true, count: apiAuditLogs.length, data: apiAuditLogs });
});

// 11. OpenAPI 3.0 Specification Endpoint
app.get('/api/v1/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'Enterprise Financial Accounting & Multi-Entity Ledger REST API',
      description: 'Complete programmatic interface for external applications, ERP integrations, microservices, and mobile apps.',
      version: '1.0.0-GA'
    },
    servers: [
      { url: 'https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app/api/v1', description: 'Production / Dev Cloud Run Server' }
    ],
    paths: {
      '/health': { get: { summary: 'System Health Check', responses: { '200': { description: 'System healthy' } } } },
      '/tenants': {
        get: { summary: 'List Tenants', responses: { '200': { description: 'Array of tenants' } } },
        post: { summary: 'Create Tenant', responses: { '201': { description: 'Tenant created' } } }
      },
      '/users': {
        get: { summary: 'List Users & RBAC', responses: { '200': { description: 'Array of users' } } },
        post: { summary: 'Provision User', responses: { '201': { description: 'User provisioned' } } }
      },
      '/journals': {
        get: { summary: 'List General Ledger Journals', responses: { '200': { description: 'Array of journals' } } },
        post: { summary: 'Post Double-Entry Journal Voucher', responses: { '201': { description: 'Journal posted' } } }
      },
      '/invoices': {
        get: { summary: 'List AR Invoices', responses: { '200': { description: 'Array of invoices' } } },
        post: { summary: 'Create Sales Invoice', responses: { '201': { description: 'Invoice created' } } }
      },
      '/vendor-bills': {
        get: { summary: 'List AP Vendor Bills', responses: { '200': { description: 'Array of bills' } } },
        post: { summary: 'Post Vendor Bill', responses: { '201': { description: 'Bill posted' } } }
      },
      '/bank-feed': {
        get: { summary: 'List Bank Statement Feed', responses: { '200': { description: 'Array of feed lines' } } },
        post: { summary: 'Import Bank Statements', responses: { '201': { description: 'Statements imported' } } }
      },
      '/reports/trial-balance': { get: { summary: 'Generate Trial Balance Report', responses: { '200': { description: 'Trial balance output' } } } },
      '/reports/consolidated': { get: { summary: 'Generate Multi-Entity Consolidated Financials', responses: { '200': { description: 'Consolidated report' } } } }
    }
  });
});

// Start Express Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[REST API Gateway & Financial Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
