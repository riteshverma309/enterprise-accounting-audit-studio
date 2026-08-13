import React, { useState } from 'react';
import {
  Terminal,
  BookOpen,
  Key,
  Code2,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Server,
  ShieldCheck,
  Globe,
  Download,
  Layers,
  FileText,
  Search,
  Sparkles,
  Users,
  BookOpenCheck,
  Receipt,
  CreditCard,
  Wallet,
  Landmark,
  Lock,
  Globe2,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';

export const ApiManualView: React.FC = () => {
  const { activeTenant, activeRole, userEmail } = useAccounting();

  // Navigation tabs within this view
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'SWAGGER_UI' | 'API_EXPLORER' | 'API_KEYS' | 'OPENAPI'>('SWAGGER_UI');

  // Manual Section Search Filter
  const [manualSearch, setManualSearch] = useState('');

  // API Explorer state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/v1/health');
  const [requestBody, setRequestBody] = useState<string>('');
  const [customTenantHeader, setCustomTenantHeader] = useState<string>(activeTenant.id);
  const [apiResponse, setApiResponse] = useState<{ status: number; statusText: string; latency: number; body: any } | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Copy state
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<'CURL' | 'JS' | 'PYTHON'>('CURL');

  // Generated API Key state
  const [generatedKey, setGeneratedKey] = useState<string>('sec_live_9f82a10b42c8d7e1');

  // Endpoint Definitions
  const endpoints = [
    {
      id: 'GET /api/v1/health',
      method: 'GET',
      path: '/api/v1/health',
      title: 'System Health & Version Check',
      description: 'Retrieves current API gateway status, system uptime, and supported feature capabilities.',
      defaultBody: '',
    },
    {
      id: 'GET /api/v1/tenants',
      method: 'GET',
      path: '/api/v1/tenants',
      title: 'List Multi-Entity Tenants',
      description: 'Fetch all registered tenants, jurisdictions, presentation currencies, and status.',
      defaultBody: '',
    },
    {
      id: 'POST /api/v1/tenants',
      method: 'POST',
      path: '/api/v1/tenants',
      title: 'Create New Tenant Entity',
      description: 'Provision a new multi-tenant organization entity with custom currency and tax framework.',
      defaultBody: JSON.stringify({ code: 'APAC-SGP', name: 'APAC Tech Ventures Pte Ltd', currency: 'SGD', locale: 'en-SG', taxJurisdiction: 'US_GAAP' }, null, 2),
    },
    {
      id: 'GET /api/v1/users',
      method: 'GET',
      path: '/api/v1/users',
      title: 'List Enterprise Users & RBAC',
      description: 'Retrieve system users, assigned roles (Super User, Entity Admin, Accountant), and scopes.',
      defaultBody: '',
    },
    {
      id: 'POST /api/v1/users',
      method: 'POST',
      path: '/api/v1/users',
      title: 'Provision Enterprise User',
      description: 'Provision a new user with Super User, Entity Admin, or functional role access.',
      defaultBody: JSON.stringify({ name: 'David Kim', email: 'david.kim@platform.com', role: 'entity_admin', tenantScope: activeTenant.id }, null, 2),
    },
    {
      id: 'GET /api/v1/accounts',
      method: 'GET',
      path: `/api/v1/accounts?tenantId=${activeTenant.id}`,
      title: 'Fetch Chart of Accounts',
      description: 'Fetch all general ledger account codes, names, types (ASSET, LIABILITY, REVENUE), and balances.',
      defaultBody: '',
    },
    {
      id: 'GET /api/v1/journals',
      method: 'GET',
      path: `/api/v1/journals?tenantId=${activeTenant.id}`,
      title: 'List Posted Journal Entries',
      description: 'Retrieve general ledger journal vouchers and double-entry line items for an entity.',
      defaultBody: '',
    },
    {
      id: 'POST /api/v1/journals',
      method: 'POST',
      path: '/api/v1/journals',
      title: 'Post Double-Entry Journal Voucher',
      description: 'Post a balanced double-entry journal entry to the general ledger.',
      defaultBody: JSON.stringify({
        tenantId: activeTenant.id,
        description: 'API Inbound Webhook: Cloud Infrastructure Hosting Fee',
        lines: [
          { accountCode: '5010', accountName: 'AWS Data Center', debit: 1850.00, credit: 0 },
          { accountCode: '1010', accountName: 'Cash Treasury Account', debit: 0, credit: 1850.00 }
        ]
      }, null, 2),
    },
    {
      id: 'POST /api/v1/journals/JE-2026-0801/reverse',
      method: 'POST',
      path: '/api/v1/journals/JE-2026-0801/reverse',
      title: 'Reverse Posted Journal Voucher',
      description: 'Creates a balanced reversal entry in General Ledger for a specified journal voucher ID.',
      defaultBody: '',
    },
    {
      id: 'GET /api/v1/invoices',
      method: 'GET',
      path: `/api/v1/invoices?tenantId=${activeTenant.id}`,
      title: 'List Accounts Receivable Invoices',
      description: 'Fetch AR sales invoices, customer balances, and payment statuses.',
      defaultBody: '',
    },
    {
      id: 'POST /api/v1/invoices',
      method: 'POST',
      path: '/api/v1/invoices',
      title: 'Create Sales Invoice',
      description: 'Generate an accounts receivable invoice for external customer billing.',
      defaultBody: JSON.stringify({ customerName: 'Cyberdyne Systems Corp', totalAmount: 75000.00, dueDate: '2026-09-30', tenantId: activeTenant.id }, null, 2),
    },
    {
      id: 'GET /api/v1/vendor-bills',
      method: 'GET',
      path: `/api/v1/vendor-bills?tenantId=${activeTenant.id}`,
      title: 'List Accounts Payable Vendor Bills',
      description: 'Fetch AP vendor bills, payment due dates, and open balances.',
      defaultBody: '',
    },
    {
      id: 'POST /api/v1/bank-feed/import',
      method: 'POST',
      path: '/api/v1/bank-feed/import',
      title: 'Batch Import Bank Statement Lines',
      description: 'Stream bank statement feed lines into the bank reconciliation engine.',
      defaultBody: JSON.stringify({
        tenantId: activeTenant.id,
        items: [
          { date: '2026-08-12', reference: 'PAY-9001', description: 'Stripe Payout - Web Sales', amount: 14200.00 },
          { date: '2026-08-13', reference: 'ACH-4011', description: 'Office Supplies Direct Debit', amount: -650.00 }
        ]
      }, null, 2),
    },
    {
      id: 'GET /api/v1/reports/trial-balance',
      method: 'GET',
      path: `/api/v1/reports/trial-balance?tenantId=${activeTenant.id}`,
      title: 'Generate Trial Balance Report',
      description: 'Computes trial balance debits and credits to verify debit-credit equilibrium.',
      defaultBody: '',
    },
    {
      id: 'GET /api/v1/reports/consolidated',
      method: 'GET',
      path: '/api/v1/reports/consolidated',
      title: 'Generate Consolidated Multi-Entity Financials',
      description: 'Generates group-wide consolidated financials with intercompany eliminations.',
      defaultBody: '',
    },
  ];

  const currentEp = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  // Execute API Request to live express backend server
  const handleExecuteApiCall = async () => {
    setIsLoadingApi(true);
    setApiResponse(null);
    const startTime = performance.now();

    try {
      const url = currentEp.path;
      const options: RequestInit = {
        method: currentEp.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': generatedKey,
          'X-Tenant-ID': customTenantHeader,
        },
      };

      if ((currentEp.method === 'POST' || currentEp.method === 'PUT' || currentEp.method === 'PATCH') && requestBody.trim()) {
        options.body = requestBody;
      }

      const response = await fetch(url, options);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        data = { rawText: 'Response was not valid JSON' };
      }

      setApiResponse({
        status: response.status,
        statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
        latency,
        body: data,
      });
    } catch (error: any) {
      const endTime = performance.now();
      setApiResponse({
        status: 500,
        statusText: 'Network / Gateway Error',
        latency: Math.round(endTime - startTime),
        body: { error: error?.message || 'Failed to connect to API Gateway server.' },
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Helper copy function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  // Code snippet generators
  const getCurlSnippet = () => {
    if (currentEp.method === 'GET') {
      return `curl -X GET "https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app${currentEp.path}" \\
  -H "X-API-Key: ${generatedKey}" \\
  -H "X-Tenant-ID: ${activeTenant.id}"`;
    }
    return `curl -X POST "https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app${currentEp.path}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${generatedKey}" \\
  -H "X-Tenant-ID: ${activeTenant.id}" \\
  -d '${requestBody || currentEp.defaultBody}'`;
  };

  const getJsSnippet = () => {
    if (currentEp.method === 'GET') {
      return `const response = await fetch("https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app${currentEp.path}", {
  method: "GET",
  headers: {
    "X-API-Key": "${generatedKey}",
    "X-Tenant-ID": "${activeTenant.id}"
  }
});
const data = await response.json();
console.log(data);`;
    }
    return `const response = await fetch("https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app${currentEp.path}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${generatedKey}",
    "X-Tenant-ID": "${activeTenant.id}"
  },
  body: JSON.stringify(${requestBody || currentEp.defaultBody})
});
const data = await response.json();
console.log(data);`;
  };

  const getPythonSnippet = () => {
    if (currentEp.method === 'GET') {
      return `import requests

url = "https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app${currentEp.path}"
headers = {
    "X-API-Key": "${generatedKey}",
    "X-Tenant-ID": "${activeTenant.id}"
}

response = requests.get(url, headers=headers)
print(response.json())`;
    }
    return `import requests

url = "https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app${currentEp.path}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${generatedKey}",
    "X-Tenant-ID": "${activeTenant.id}"
}
payload = ${requestBody || currentEp.defaultBody}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
  };

  // User Manual Chapters
  const manualSections = [
    {
      id: 'sec-1',
      title: '1. Architecture & Multi-Tenant System Design',
      icon: <Globe className="w-4 h-4 text-indigo-400" />,
      content: `This enterprise financial application is engineered as a multi-tenant double-entry accounting engine designed to support multi-entity global enterprises.

Key Architectural Principles:
• Double-Entry Strict Invariant: Every transaction requires equal Total Debits and Total Credits (Sum(Debits) = Sum(Credits)). Unbalanced transactions are rejected by the kernel.
• Real-time Isolation: Each organization operates within a distinct tenant context (e.g., US GAAP HQ, EU IFRS Holding, India GST Subsidiary) with localized base presentation currencies and local tax regulatory frameworks.
• REST API Gateway: External applications, mobile apps, custom webhooks, or third-party ERPs (SAP, NetSuite, Salesforce) can integrate directly via OpenAPI 3.0 REST endpoints.`,
    },
    {
      id: 'sec-2',
      title: '2. User Governance, Super User & Entity Admin Hierarchy',
      icon: <Users className="w-4 h-4 text-purple-400" />,
      content: `The system enforces strict Role-Based Access Control (RBAC) with hierarchical administrative privileges:

Roles & Authorization Levels:
1. ⚡ Global Super User (super_user): Unrestricted global administration. Holds permission to create new tenants, provision users across all organizations, delegate Entity Admin rights, and manage global security policies.
2. 🏢 Entity Administrator (entity_admin): Organization-scoped administrator. Can provision users and grant functional role access (Controller, Senior Accountant, Auditor) within their assigned entity (e.g., Acme US Corp). Cannot grant Super User status.
3. 🛡️ Financial Admin (admin): Manages entity chart of accounts, fiscal periods, and team access scopes.
4. 📊 Financial Controller (controller): Holds authorization to approve SOX 404 journal vouchers, lock fiscal periods, and execute hard Year-End Financial Close.
5. ✍️ Senior Accountant (accountant): Authorized to draft and post double-entry journal vouchers, manage AR invoices, and post AP vendor bills.
6. 📝 Junior Accountant (junior_accountant): Prepares draft vouchers requiring Controller or Senior Accountant sign-off.
7. 🔍 Auditor (auditor): Read-only access to immutable audit trails, trial balances, and forensic reports.
8. 👁️ Viewer (viewer): Summary dashboard read-only view.`,
    },
    {
      id: 'sec-3',
      title: '3. General Ledger & Double-Entry Voucher Engine',
      icon: <BookOpenCheck className="w-4 h-4 text-emerald-400" />,
      content: `The General Ledger forms the immutable source of truth for all accounting transactions:

Voucher Posting Workflow:
• Voucher Creation: Select target tenant, enter voucher date, narrative description, and debit/credit line items.
• Dynamic Validation: Live validation checks that debit total equals credit total before submission.
• Reversal Engine: Reversing a posted journal automatically generates an offset journal entry reversing all debits and credits while preserving audit history.
• Bulk CSV Importer: Supports posting hundreds of vouchers via standardized batch CSV or JSON templates.`,
    },
    {
      id: 'sec-4',
      title: '4. Accounts Receivable (AR) & Revenue Accounting',
      icon: <Receipt className="w-4 h-4 text-cyan-400" />,
      content: `The Accounts Receivable module manages the end-to-end customer billing and revenue recognition lifecycle:

Features:
• Invoicing: Create customer sales invoices with automatic tax rate calculation (Sales Tax, VAT, GST).
• Payment Processing: Record partial or full customer payments, updating invoice status from UNPAID to PARTIAL or PAID.
• AR Aging Analysis: Real-time aging buckets (Current, 1-30 days, 31-60 days, 61-90 days, 90+ days) to monitor credit risk and cash collection performance.`,
    },
    {
      id: 'sec-5',
      title: '5. Accounts Payable (AP) & Vendor Payment Chains',
      icon: <CreditCard className="w-4 h-4 text-amber-400" />,
      content: `Manage vendor relationships, incoming bills, and disbursement approval workflows:

Features:
• Bill Entry: Log incoming vendor invoices, match against purchase orders, and assign cost centers.
• Payment Approval: Enforce multi-level approval for bill payments exceeding threshold limits.
• Cash Disbursement: Process ACH, Wire, or check payments directly updating AP liability balances.`,
    },
    {
      id: 'sec-6',
      title: '6. Treasury, Cash Flow Forecasting & IAS 7 Compliance',
      icon: <Wallet className="w-4 h-4 text-indigo-400" />,
      content: `The Treasury module delivers real-time visibility into liquidity, operating bank accounts, and multi-currency cash positioning:

Features:
• Cash Position Monitoring: Tracks bank balances across all multi-entity liquidity accounts.
• Rolling 13-Week Cash Forecast: Predictive cash flow projections combining AR expected receipts and AP scheduled outflows.
• IAS 7 Statement of Cash Flows: Automated generation of Operating, Investing, and Financing cash flow activities.`,
    },
    {
      id: 'sec-7',
      title: '7. FP&A Cost Center Budgeting & Variance Analytics',
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      content: `Financial Planning & Analysis (FP&A) suite for budget allocation and operational performance tracking:

Features:
• Cost Center Budgeting: Define departmental expenditure caps (Engineering, Sales & Marketing, Executive Operations).
• Real-time Variance Analysis: Live comparison of Actual General Ledger expenses against Approved Budgets, highlighting favorable/unfavorable variances.`,
    },
    {
      id: 'sec-8',
      title: '8. Multi-Jurisdictional Tax Engine (US GAAP, EU VAT, India GST)',
      icon: <Globe2 className="w-4 h-4 text-emerald-400" />,
      content: `Supports multi-national statutory compliance across key global tax regimes:

Supported Frameworks:
• US GAAP Sales & Use Tax: State-level nexus rules, taxable item categorization, and sales tax accruals.
• EU VAT (Value Added Tax): Reverse charge mechanisms, intracommunipautary supply tracking, and VIES report outputs.
• India GST (Goods & Services Tax): CGST, SGST, and IGST tax splits, HSN/SAC code mapping, and GSTR-1/GSTR-3B filings.`,
    },
    {
      id: 'sec-9',
      title: '9. Bank Statement Feed, AI Auto-Match & Reconciliation',
      icon: <Landmark className="w-4 h-4 text-amber-400" />,
      content: `Automated bank reconciliation engine to eliminate manual bank statement matching:

Features:
• Statement Import: Stream bank feeds via CSV, JSON, or direct API webhooks.
• AI Smart Auto-Match Engine: Automatically scans posted GL cash entries and matches statement lines by amount, reference, and date proximity.
• Quick GL Post: Instant creation of missing GL vouchers (e.g., bank service charges, direct debits) directly from statement lines.`,
    },
    {
      id: 'sec-10',
      title: '10. Fixed Assets Depreciation & FX Revaluation',
      icon: <Layers className="w-4 h-4 text-rose-400" />,
      content: `Manage tangible asset registers and foreign currency balances:

Features:
• Fixed Assets Schedule: Track asset cost, useful life, straight-line/declining balance depreciation, and net book value (NBV).
• Multi-Currency FX Revaluation: Period-end revaluation of foreign currency balances with automatic posting of realized/unrealized FX gains and losses.`,
    },
    {
      id: 'sec-11',
      title: '11. Fiscal Period Locks & Hard Year-End Financial Close',
      icon: <Lock className="w-4 h-4 text-red-400" />,
      content: `Enforce governance controls to prevent backdated adjustments during financial audits:

Features:
• Soft & Hard Period Locks: Prevent posting or modifying journal vouchers in closed accounting periods.
• Year-End Financial Close: Automated roll-forward of temporary revenue/expense accounts into Retained Earnings.`,
    },
    {
      id: 'sec-12',
      title: '12. Global Multi-Tenant Consolidation & Intercompany Eliminations',
      icon: <Globe className="w-4 h-4 text-indigo-400" />,
      content: `Consolidate multi-entity financials into a single presentation base currency:

Features:
• Currency Translation: Real-time translation of subsidiary balances using closing and weighted average exchange rates.
• Intercompany Eliminations: Automatically detect and eliminate intercompany receivables, payables, and transactions under IAS 27 / ASC 810.`,
    },
    {
      id: 'sec-13',
      title: '13. Immutable System Audit Logs & Forensic AI Audit Copilot',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      content: `Complete auditability and compliance with SOX Section 404:

Features:
• Immutable Audit Log: Records every user action, tenant modification, voucher posting, and security permission update.
• Forensic AI Copilot: Powered by Gemini AI to analyze transaction logs for anomalies, policy violations, or duplicate payments.`,
    },
    {
      id: 'sec-14',
      title: '14. REST API Gateway & Third-Party System Integration',
      icon: <Terminal className="w-4 h-4 text-purple-400" />,
      content: `Full programmatic control enabling any third-party application (web apps, mobile apps, ERPs, webhooks) to call backend endpoints:

API Authentication & Headers:
• Base URL: https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app/api/v1
• Authentication Header: X-API-Key: <your_secret_api_key> or Authorization: Bearer <your_token>
• Tenant Context Header: X-Tenant-ID: <tenant_id> (e.g., t-acme-us)
• Response Format: Standard JSON with success boolean, status code, metadata, and structured data payloads.`,
    },
  ];

  const filteredManualSections = manualSections.filter(sec => {
    if (!manualSearch.trim()) return true;
    const q = manualSearch.toLowerCase();
    return sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Terminal className="w-6 h-6 text-purple-400" /> Complete User Manual & Developer REST API Suite
            </h1>
            <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-300 font-mono text-[11px] rounded-full font-bold border border-purple-500/30">
              OpenAPI 3.0 Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exhaustive operational user guide and direct REST API integration interface for third-party applications, microservices, and mobile apps.
          </p>
        </div>

        {/* TOP LEVEL NAVIGATION TABS */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm flex-wrap">
          <button
            onClick={() => setActiveTab('SWAGGER_UI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SWAGGER_UI'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Interactive Swagger UI</span>
          </button>

          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'MANUAL'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Exhaustive User Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('API_EXPLORER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'API_EXPLORER'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-amber-300" />
            <span>API Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('API_KEYS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'API_KEYS'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys & Snippets</span>
          </button>

          <button
            onClick={() => setActiveTab('OPENAPI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'OPENAPI'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>OpenAPI Spec</span>
          </button>
        </div>
      </div>

      {/* TAB 0: INTERACTIVE SWAGGER UI */}
      {activeTab === 'SWAGGER_UI' && (
        <div className="space-y-6">
          {/* SWAGGER UI BANNER HEADER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono text-xs font-bold">
                    Swagger UI 3.0
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Enterprise Multi-Tenant Financial REST API v1.0-GA
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  OpenAPI 3.0.3 Specification • Server: <code className="text-purple-300 font-mono">https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app/api/v1</code>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Auth:</span>
                  <span className="text-amber-300 font-bold">{generatedKey ? 'X-API-Key Active' : 'Unauthenticated'}</span>
                </div>

                <button
                  onClick={() => {
                    const newKey = `sec_live_${Math.random().toString(36).substring(2, 18)}`;
                    setGeneratedKey(newKey);
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Authorize / Rotate Token
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-white">X-API-Key Security</div>
                  <div className="text-[11px] text-slate-400">Header-based token authorization</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="font-bold text-white">X-Tenant-ID Header</div>
                  <div className="text-[11px] text-slate-400">Multi-tenant context isolation</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                <Code2 className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-bold text-white">JSON Payloads</div>
                  <div className="text-[11px] text-slate-400">RFC 8259 Compliant JSON</div>
                </div>
              </div>
            </div>
          </div>

          {/* SWAGGER ENDPOINT LISTING & INTERACTIVE TRY-IT-OUT */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>API Gateway Routes ({endpoints.length} Endpoints Available)</span>
              <span className="text-purple-400">Click any endpoint to Expand & Try It Out</span>
            </div>

            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint === ep.id;
              const isGet = ep.method === 'GET';

              return (
                <div
                  key={ep.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-purple-500/60 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* ACCORDION BAR */}
                  <div
                    onClick={() => {
                      if (isSelected) {
                        setSelectedEndpoint('');
                      } else {
                        setSelectedEndpoint(ep.id);
                        setRequestBody(ep.defaultBody);
                        setApiResponse(null);
                      }
                    }}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span
                        className={`px-3 py-1 rounded-lg font-bold text-xs ${
                          isGet
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-bold text-white text-sm">{ep.path}</span>
                      <span className="text-slate-400 font-sans hidden sm:inline text-xs">— {ep.title}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 hidden md:inline">{ep.description}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-purple-400' : ''}`}
                      />
                    </div>
                  </div>

                  {/* INTERACTIVE EXPANDED SWAGGER PANEL */}
                  {isSelected && (
                    <div className="p-5 border-t border-slate-800 bg-slate-950/70 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                          <h4 className="text-sm font-bold text-white">{ep.title}</h4>
                          <p className="text-xs text-slate-400">{ep.description}</p>
                        </div>

                        <button
                          onClick={handleExecuteApiCall}
                          disabled={isLoadingApi}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
                        >
                          {isLoadingApi ? (
                            <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                          ) : (
                            <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
                          )}
                          <span>{isLoadingApi ? 'Sending API Request...' : 'Try It Out!'}</span>
                        </button>
                      </div>

                      {/* PARAMETERS & HEADERS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                          <label className="block text-slate-400 font-bold">X-API-Key (Header):</label>
                          <input
                            type="text"
                            value={generatedKey}
                            onChange={(e) => setGeneratedKey(e.target.value)}
                            className="w-full bg-slate-950 text-amber-300 font-mono p-2 rounded-lg border border-slate-800 outline-none"
                          />
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                          <label className="block text-slate-400 font-bold">X-Tenant-ID (Header):</label>
                          <input
                            type="text"
                            value={customTenantHeader}
                            onChange={(e) => setCustomTenantHeader(e.target.value)}
                            className="w-full bg-slate-950 text-indigo-300 font-mono p-2 rounded-lg border border-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      {/* REQUEST BODY IF POST */}
                      {!isGet && (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-400">Request Body Schema (application/json):</label>
                          <textarea
                            rows={6}
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
                          />
                        </div>
                      )}

                      {/* LIVE SWAGGER RESPONSE VIEW */}
                      {apiResponse && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">HTTP Server Response:</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                  apiResponse.status >= 200 && apiResponse.status < 300
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {apiResponse.status} {apiResponse.statusText}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-purple-400 font-bold">{apiResponse.latency} ms</span>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-200 max-h-72 overflow-y-auto border border-slate-800">
                            <pre>{JSON.stringify(apiResponse.body, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: EXHAUSTIVE USER MANUAL */}
      {activeTab === 'MANUAL' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search manual by topic, role, module, or regulation (e.g. SOX, Super User, General Ledger, Tax)..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredManualSections.length} of {manualSections.length} Sections
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredManualSections.map((sec) => (
              <div
                key={sec.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  {sec.icon}
                  <h3 className="text-sm font-bold text-white tracking-tight">{sec.title}</h3>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                  {sec.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE REST API EXPLORER */}
      {activeTab === 'API_EXPLORER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ENDPOINT SELECTOR SIDEBAR */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" /> REST API Endpoints
              </span>
              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                v1.0-GA
              </span>
            </div>

            <div className="space-y-1 max-h-[580px] overflow-y-auto pr-1">
              {endpoints.map((ep) => {
                const isSelected = selectedEndpoint === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEndpoint(ep.id);
                      setRequestBody(ep.defaultBody);
                      setApiResponse(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500/50 text-white shadow'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ep.method === 'GET'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-bold truncate text-slate-200">{ep.path}</span>
                    </div>
                    <span className="text-[11px] font-sans text-slate-400 line-clamp-1">{ep.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ENDPOINT EXECUTION CANVAS */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        currentEp.method === 'GET'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {currentEp.method}
                    </span>
                    <span className="text-sm font-bold text-white">{currentEp.path}</span>
                  </div>
                  <p className="text-xs text-slate-400">{currentEp.description}</p>
                </div>

                <button
                  onClick={handleExecuteApiCall}
                  disabled={isLoadingApi}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isLoadingApi ? (
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  ) : (
                    <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
                  )}
                  <span>{isLoadingApi ? 'Sending API Request...' : 'Execute API Call'}</span>
                </button>
              </div>

              {/* REQUEST HEADERS & PARAMS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">X-API-Key Header:</label>
                  <input
                    type="text"
                    value={generatedKey}
                    onChange={(e) => setGeneratedKey(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded-xl border border-slate-800 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">X-Tenant-ID Context Header:</label>
                  <input
                    type="text"
                    value={customTenantHeader}
                    onChange={(e) => setCustomTenantHeader(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded-xl border border-slate-800 font-mono outline-none"
                  />
                </div>
              </div>

              {/* REQUEST BODY EDITOR (IF POST) */}
              {(currentEp.method === 'POST' || currentEp.method === 'PUT') && (
                <div>
                  <label className="block text-slate-400 font-bold text-xs mb-1">
                    JSON Request Payload Body:
                  </label>
                  <textarea
                    rows={6}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* LIVE RESPONSE PANEL */}
            {apiResponse && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">Live API Server Response:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        apiResponse.status >= 200 && apiResponse.status < 300
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      HTTP {apiResponse.status} {apiResponse.statusText}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    Latency: <strong className="text-purple-400">{apiResponse.latency} ms</strong>
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto font-mono text-xs text-slate-200">
                  <pre>{JSON.stringify(apiResponse.body, null, 2)}</pre>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 3: API KEYS & CODE SNIPPETS */}
      {activeTab === 'API_KEYS' && (
        <div className="space-y-6">
          
          {/* API KEY MANAGEMENT PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">API Keys & Authentication Secret Tokens</h3>
              </div>
              <button
                onClick={() => setGeneratedKey(`sec_live_${Math.random().toString(36).substring(2, 18)}`)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Rotate API Key
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Active API Gateway Token:</span>
                <div className="font-mono text-amber-300 font-bold truncate">{generatedKey}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Granted Scope Level:</span>
                <div className="font-mono text-purple-300 font-bold uppercase">{activeRole}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px]">Default Entity Context:</span>
                <div className="font-mono text-indigo-300 font-bold">{activeTenant.name} ({activeTenant.id})</div>
              </div>
            </div>
          </div>

          {/* READY-TO-COPY CODE SNIPPETS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Code Snippets for Selected Endpoint ({currentEp.title})</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setActiveCodeLang('CURL')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                      activeCodeLang === 'CURL' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveCodeLang('JS')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                      activeCodeLang === 'JS' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={() => setActiveCodeLang('PYTHON')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                      activeCodeLang === 'PYTHON' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                </div>

                <button
                  onClick={() => {
                    const snippet = activeCodeLang === 'CURL' ? getCurlSnippet() : activeCodeLang === 'JS' ? getJsSnippet() : getPythonSnippet();
                    copyToClipboard(snippet, activeCodeLang);
                  }}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow cursor-pointer"
                >
                  {copiedSnippet === activeCodeLang ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === activeCodeLang ? 'Copied!' : 'Copy Snippet'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <pre>{activeCodeLang === 'CURL' ? getCurlSnippet() : activeCodeLang === 'JS' ? getJsSnippet() : getPythonSnippet()}</pre>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: OPENAPI 3.0 SPECIFICATION */}
      {activeTab === 'OPENAPI' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">OpenAPI 3.0 JSON Specification</h3>
            </div>

            <button
              onClick={() => {
                const specUrl = '/api/v1/openapi.json';
                window.open(specUrl, '_blank');
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export OpenAPI JSON</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            You can import this OpenAPI 3.0 JSON specification directly into Postman, Insomnia, Swagger UI, or automated client code generators (Swagger Codegen / OpenAPI Generator).
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 max-h-[500px] overflow-y-auto">
            <pre>{JSON.stringify({
              openapi: '3.0.3',
              info: {
                title: 'Enterprise Financial Accounting & Multi-Entity Ledger REST API',
                description: 'Complete programmatic interface for external applications, ERP integrations, microservices, and mobile apps.',
                version: '1.0.0-GA'
              },
              servers: [
                { url: 'https://ais-dev-gx4djmas3nxo3hsvf3shud-164105144910.asia-east1.run.app/api/v1', description: 'Production API Gateway' }
              ],
              paths: {
                '/health': { get: { summary: 'System Health Check' } },
                '/tenants': { get: { summary: 'List Tenants' }, post: { summary: 'Create Tenant' } },
                '/users': { get: { summary: 'List Users & RBAC' }, post: { summary: 'Provision User' } },
                '/journals': { get: { summary: 'List General Ledger Journals' }, post: { summary: 'Post Double-Entry Journal Voucher' } },
                '/invoices': { get: { summary: 'List AR Invoices' }, post: { summary: 'Create Sales Invoice' } },
                '/vendor-bills': { get: { summary: 'List AP Vendor Bills' }, post: { summary: 'Post Vendor Bill' } },
                '/bank-feed': { get: { summary: 'List Bank Statement Feed' }, post: { summary: 'Import Bank Statements' } },
                '/reports/trial-balance': { get: { summary: 'Generate Trial Balance Report' } },
                '/reports/consolidated': { get: { summary: 'Generate Multi-Entity Consolidated Financials' } }
              }
            }, null, 2)}</pre>
          </div>
        </div>
      )}

    </div>
  );
};
