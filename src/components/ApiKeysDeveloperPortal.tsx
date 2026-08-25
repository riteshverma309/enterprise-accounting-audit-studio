import React, { useState } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import {
  Key,
  Shield,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  FileText,
  Search,
  ExternalLink,
  BookOpen,
  Terminal,
  Lock,
  RotateCcw,
  Sparkles,
  Download,
  Server,
  Layers,
  ChevronRight,
  ShieldAlert,
  Play,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { ScopedApiKey, ApiKeyPermissionScope, Role } from '../types';

export const ApiKeysDeveloperPortal: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    activeTenant,
    activeRole,
    userEmail,
    scopedApiKeys,
    createScopedApiKey,
    revokeScopedApiKey,
    deleteScopedApiKey,
  } = useAccounting();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'API_KEYS' | 'SWAGGER_DOCS' | 'CODE_GENERATOR' | 'OPENAPI_SPEC'>('API_KEYS');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>('ALL');

  // Modal create state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState<{
    name: string;
    role: Role;
    environment: 'LIVE' | 'TEST' | 'SANDBOX';
    scopes: ApiKeyPermissionScope[];
    rateLimitPerMin: number;
    expiresInDays: number;
  }>({
    name: '',
    role: 'entity_admin',
    environment: 'LIVE',
    scopes: ['read:all', 'write:invoices', 'read:invoices', 'read:journals'],
    rateLimitPerMin: 600,
    expiresInDays: 365,
  });

  // Newly generated key modal display (shown once)
  const [justGeneratedToken, setJustGeneratedToken] = useState<string | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Code generator state
  const [selectedLanguage, setSelectedLanguage] = useState<'CURL' | 'TYPESCRIPT' | 'PYTHON' | 'GO'>('CURL');
  const [selectedEndpointForCode, setSelectedEndpointForCode] = useState<string>('POST /api/v1/invoices');

  const availablePermissionScopes: { scope: ApiKeyPermissionScope; label: string; description: string }[] = [
    { scope: 'read:all', label: 'read:all', description: 'Global read-only access to all charts, journals, and reports' },
    { scope: 'write:all', label: 'write:all', description: 'Global write access (requires Entity Admin or Super User role)' },
    { scope: 'read:invoices', label: 'read:invoices', description: 'Query accounts receivable invoices and customer balance records' },
    { scope: 'write:invoices', label: 'write:invoices', description: 'Post new customer invoices, void, and record payments' },
    { scope: 'read:bills', label: 'read:bills', description: 'Query vendor bills, purchase orders, and payment vouchers' },
    { scope: 'write:bills', label: 'write:bills', description: 'Create and disburse accounts payable vendor bills' },
    { scope: 'read:journals', label: 'read:journals', description: 'Query general ledger double-entry journal vouchers' },
    { scope: 'write:journals', label: 'write:journals', description: 'Post balanced double-entry vouchers directly to the General Ledger' },
    { scope: 'read:customers', label: 'read:customers', description: 'Read customer profiles, contacts, and custom attributes' },
    { scope: 'write:customers', label: 'write:customers', description: 'Create and update customer and vendor master records' },
    { scope: 'read:reports', label: 'read:reports', description: 'Generate Trial Balance, Balance Sheet, and P&L statements' },
    { scope: 'execute:sync', label: 'execute:sync', description: 'Trigger bank feeds or e-commerce sync connectors' },
  ];

  const filteredKeys = scopedApiKeys.filter((k) => {
    if (k.tenantId !== activeTenant.id) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = k.name.toLowerCase().includes(q);
      const matchPrefix = k.keyPrefix.toLowerCase().includes(q);
      if (!matchName && !matchPrefix) return false;
    }
    if (selectedScopeFilter !== 'ALL' && !k.scopes.includes(selectedScopeFilter as ApiKeyPermissionScope)) {
      return false;
    }
    return true;
  });

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyForm.name.trim()) return;

    const res = createScopedApiKey({
      name: newKeyForm.name.trim(),
      role: newKeyForm.role,
      environment: newKeyForm.environment,
      scopes: newKeyForm.scopes,
      rateLimitPerMin: Number(newKeyForm.rateLimitPerMin) || 600,
      expiresInDays: Number(newKeyForm.expiresInDays) || 365,
      tenantId: activeTenant.id,
    });

    if (res.success && res.fullSecretKey) {
      setJustGeneratedToken(res.fullSecretKey);
      setIsCreateModalOpen(false);
      setNewKeyForm({
        name: '',
        role: 'entity_admin',
        environment: 'LIVE',
        scopes: ['read:all', 'write:invoices', 'read:invoices'],
        rateLimitPerMin: 600,
        expiresInDays: 365,
      });
    }
  };

  const toggleScopeSelection = (scope: ApiKeyPermissionScope) => {
    const currentScopes = newKeyForm.scopes || [];
    if (currentScopes.includes(scope)) {
      if (currentScopes.length === 1) return;
      setNewKeyForm({ ...newKeyForm, scopes: currentScopes.filter((s) => s !== scope) });
    } else {
      setNewKeyForm({ ...newKeyForm, scopes: [...currentScopes, scope] });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Swagger Documentation Endpoints
  const apiCatalog = [
    {
      group: 'Authentication & Health',
      routes: [
        { method: 'GET', path: '/api/v1/health', summary: 'Gateway Health Check', description: 'Returns system uptime and supported double-entry plugins.' },
        { method: 'GET', path: '/api/v1/tenants', summary: 'List Authorized Tenant Entities', description: 'List companies the provided API token has RBAC authority over.' },
      ],
    },
    {
      group: 'General Ledger & Chart of Accounts',
      routes: [
        { method: 'GET', path: '/api/v1/accounts', summary: 'Query Chart of Accounts', description: 'Retrieve ledger accounts with real-time debit/credit balances.' },
        { method: 'POST', path: '/api/v1/journals', summary: 'Post Double-Entry Journal Voucher', description: 'Post balanced multi-line debits and credits with currency conversion.' },
        { method: 'GET', path: '/api/v1/journals/{id}', summary: 'Get Journal Entry Voucher', description: 'Fetch itemized voucher lines and SOX 404 audit stamps.' },
      ],
    },
    {
      group: 'Accounts Receivable & Invoicing',
      routes: [
        { method: 'GET', path: '/api/v1/invoices', summary: 'Query Customer Invoices', description: 'Filter by status (DRAFT, POSTED, PAID, OVERDUE) and customer ID.' },
        { method: 'POST', path: '/api/v1/invoices', summary: 'Create & Post Sales Invoice', description: 'Generates invoice, computes jurisdiction tax, and posts AR entry.' },
        { method: 'POST', path: '/api/v1/invoices/{id}/payments', summary: 'Record Invoice Payment Receipt', description: 'Allocates payment, adjusts invoice balance, and debits operating cash.' },
      ],
    },
    {
      group: 'Entity Master & E-Commerce',
      routes: [
        { method: 'GET', path: '/api/v1/customers', summary: 'List Customer Directory', description: 'Fetch customers with nested dynamic EAV attributes.' },
        { method: 'POST', path: '/api/v1/customers', summary: 'Create Customer Contact', description: 'Provision new client account with custom tax registration numbers.' },
        { method: 'GET', path: '/api/v1/products', summary: 'Query Products & Services Catalog', description: 'Retrieve item codes, stock quantities, and price book tiers.' },
      ],
    },
    {
      group: 'Financial Intelligence Reports',
      routes: [
        { method: 'GET', path: '/api/v1/reports/trial-balance', summary: 'Generate Trial Balance', description: 'Calculates debit/credit trial balance with balance verification.' },
        { method: 'GET', path: '/api/v1/reports/consolidated', summary: 'Multi-Tenant Consolidated Financials', description: 'Aggregates group statements with intercompany eliminations.' },
      ],
    },
  ];

  const generateCodeSnippet = (lang: string, endpoint: string) => {
    const defaultKey = filteredKeys[0]?.fullKey || 'sec_live_9f82a10b42c8d7e1e83910bb38f1';
    const baseUrl = window.location.origin;

    if (lang === 'CURL') {
      if (endpoint === 'POST /api/v1/invoices') {
        return `curl -X POST "${baseUrl}/api/v1/invoices" \\
  -H "Authorization: Bearer ${defaultKey}" \\
  -H "X-Tenant-ID: ${activeTenant.id}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "cust-101",
    "customerName": "Vertex Global Technologies",
    "invoiceDate": "2026-08-17",
    "dueDate": "2026-09-16",
    "lineItems": [
      {
        "description": "Enterprise Cloud Accounting API Tier",
        "quantity": 1,
        "unitPrice": 4800.00,
        "taxRate": 8.875
      }
    ],
    "memo": "Monthly API Subscription Consumption"
  }'`;
      }
      return `curl -X GET "${baseUrl}/api/v1/accounts?tenantId=${activeTenant.id}" \\
  -H "Authorization: Bearer ${defaultKey}" \\
  -H "X-Tenant-ID: ${activeTenant.id}" \\
  -H "Accept: application/json"`;
    }

    if (lang === 'TYPESCRIPT') {
      if (endpoint === 'POST /api/v1/invoices') {
        return `import axios from 'axios';

interface CreateInvoicePayload {
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; taxRate?: number }>;
  memo?: string;
}

const client = axios.create({
  baseURL: '${baseUrl}/api/v1',
  headers: {
    'Authorization': 'Bearer ${defaultKey}',
    'X-Tenant-ID': '${activeTenant.id}',
    'Content-Type': 'application/json',
  },
});

async function postNewInvoice() {
  const payload: CreateInvoicePayload = {
    customerId: 'cust-101',
    customerName: 'Vertex Global Technologies',
    invoiceDate: '2026-08-17',
    dueDate: '2026-09-16',
    lineItems: [
      {
        description: 'Enterprise Cloud Accounting API Tier',
        quantity: 1,
        unitPrice: 4800.00,
        taxRate: 8.875,
      },
    ],
    memo: 'Automated Billing Sync from Customer Portal',
  };

  const response = await client.post('/invoices', payload);
  console.log('Invoice Created Successfully:', response.data);
  return response.data;
}

postNewInvoice().catch(console.error);`;
      }

      return `import axios from 'axios';

const client = axios.create({
  baseURL: '${baseUrl}/api/v1',
  headers: {
    'Authorization': 'Bearer ${defaultKey}',
    'X-Tenant-ID': '${activeTenant.id}',
  },
});

async function fetchAccounts() {
  const response = await client.get('/accounts');
  console.log('Chart of Accounts:', response.data);
}

fetchAccounts().catch(console.error);`;
    }

    if (lang === 'PYTHON') {
      if (endpoint === 'POST /api/v1/invoices') {
        return `import requests

BASE_URL = "${baseUrl}/api/v1"
API_KEY = "${defaultKey}"
TENANT_ID = "${activeTenant.id}"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "X-Tenant-ID": TENANT_ID,
    "Content-Type": "application/json"
}

payload = {
    "customerId": "cust-101",
    "customerName": "Vertex Global Technologies",
    "invoiceDate": "2026-08-17",
    "dueDate": "2026-09-16",
    "lineItems": [
        {
            "description": "Enterprise Cloud Accounting API Tier",
            "quantity": 1,
            "unitPrice": 4800.00,
            "taxRate": 8.875
        }
    ],
    "memo": "Automated Billing Sync from Python Script"
}

response = requests.post(f"{BASE_URL}/invoices", json=payload, headers=headers)
print("Status:", response.status_code)
print("Response:", response.json())`;
      }

      return `import requests

BASE_URL = "${baseUrl}/api/v1"
API_KEY = "${defaultKey}"
TENANT_ID = "${activeTenant.id}"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "X-Tenant-ID": TENANT_ID
}

response = requests.get(f"{BASE_URL}/accounts", headers=headers)
print(response.json())`;
    }

    if (lang === 'GO') {
      return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "${baseUrl}/api/v1/invoices"
	apiKey := "${defaultKey}"
	tenantId := "${activeTenant.id}"

	payload := map[string]interface{}{
		"customerId":   "cust-101",
		"customerName": "Vertex Global Technologies",
		"invoiceDate":  "2026-08-17",
		"dueDate":      "2026-09-16",
		"lineItems": []map[string]interface{}{
			{
				"description": "Enterprise Cloud Accounting API Tier",
				"quantity":    1,
				"unitPrice":   4800.00,
				"taxRate":     8.875,
			},
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("X-Tenant-ID", tenantId)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response Status:", resp.Status)
	fmt.Println("Response Body:", string(body))
}`;
    }

    return '';
  };

  return (
    <div id="api-keys-developer-portal" className="space-y-6">
      {/* HEADER HERO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3 h-3" />{tr('RESTful Developer API Gateway')}</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-mono">{tr('OpenAPI 3.0 / OAuth2 Compatible')}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{tr('API Keys & Developer Portal')}</h1>
            <p className="text-sm text-slate-400 max-w-2xl">{tr('Generate fine-grained scoped API keys, explore interactive Swagger REST endpoints, and copy ready-made integration code snippets for any programming language.')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('CODE_GENERATOR')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 font-medium text-xs shadow transition cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>{tr('Interactive Code Snippets')}</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{tr('Generate Scoped API Key')}</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('Active API Tokens')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-white">{filteredKeys.filter((k) => k.status === 'ACTIVE').length}</span>
              <span className="text-xs text-slate-500 font-mono">/ {filteredKeys.length} total</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('Default Rate Limit')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-indigo-300 font-mono">1,200</span>
              <span className="text-xs text-slate-500 font-mono">{tr('req / min')}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('RBAC Permission Model')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400">{tr('Scoped')}</span>
              <span className="text-xs text-emerald-500/80 font-mono">{tr('Least Privilege')}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('Active Entity Scope')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-purple-300 font-mono">{activeTenant.code}</span>
              <span className="text-xs text-slate-500 font-mono truncate">{activeTenant.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('API_KEYS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'API_KEYS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Key Management ({filteredKeys.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SWAGGER_DOCS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'SWAGGER_DOCS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{tr('Interactive Swagger API Docs')}</span>
          </button>
          <button
            onClick={() => setActiveTab('CODE_GENERATOR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'CODE_GENERATOR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{tr('Code Generator')}</span>
          </button>
          <button
            onClick={() => setActiveTab('OPENAPI_SPEC')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'OPENAPI_SPEC' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{tr('OpenAPI 3.0 Schema')}</span>
          </button>
        </div>

        {activeTab === 'API_KEYS' && (
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={tr('Search API keys by name or prefix...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>

            <select
              value={selectedScopeFilter}
              onChange={(e) => setSelectedScopeFilter(e.target.value)}
              className="bg-slate-900 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
            >
              <option value="ALL">{tr('All Permission Scopes')}</option>
              {availablePermissionScopes.map((s) => (
                <option key={s.scope} value={s.scope}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: API KEYS MANAGEMENT */}
      {activeTab === 'API_KEYS' && (
        <div className="space-y-4">
          {filteredKeys.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 border border-indigo-500/20">
                <Key className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">{tr('No API Keys Generated')}</h3>
                <p className="text-xs text-slate-400">{tr('Create a scoped secret API token to connect your custom ERP scripts, portals, or Zapier connectors.')}</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{tr('Generate First API Key')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKeys.map((k) => {
                const isActive = k.status === 'ACTIVE';
                return (
                  <div
                    key={k.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition relative"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                              isActive
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}
                          >
                            <Key className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{k.name}</h4>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              Created by {k.createdBy}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {k.status}
                        </span>
                      </div>

                      {/* KEY DISPLAY STRIP */}
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold">{tr('Token Secret')}</span>
                          <button
                            onClick={() => copyToClipboard(k.fullKey || k.maskedKey, `key-${k.id}`)}
                            className="hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `key-${k.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-xs text-amber-300 truncate select-all">{k.maskedKey}</div>
                      </div>

                      {/* SCOPES LIST */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Granted Scopes ({k.scopes.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                          <span className="text-slate-500 block">{tr('Rate Limit')}</span>
                          <span className="font-mono text-slate-200 font-bold">{k.rateLimitPerMin} rpm</span>
                        </div>
                        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                          <span className="text-slate-500 block">{tr('Environment')}</span>
                          <span className="font-mono text-purple-300 font-bold">{k.environment}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 font-mono">
                        {k.lastUsedAt ? (
                          <span>Used: {new Date(k.lastUsedAt).toLocaleTimeString()}</span>
                        ) : (
                          <span>{tr('Never used')}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <button
                            onClick={() => {
                              if (confirm(`Revoke API Key "${k.name}"? External apps using this key will immediately fail with 401 Unauthorized.`)) {
                                revokeScopedApiKey(k.id);
                              }
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/20 transition cursor-pointer"
                          >{tr('Revoke')}</button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Permanently delete API Key record "${k.name}"?`)) {
                              deleteScopedApiKey(k.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title={tr('Delete key')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE SWAGGER REST API DOCS */}
      {activeTab === 'SWAGGER_DOCS' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">{tr('RESTful API Endpoints & Route Definitions')}</h3>
                <p className="text-xs text-slate-400">{tr('Standardized JSON endpoints with tenant isolation headers and double-entry general ledger integrity verification.')}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">{tr('Base URL:')}</span>
                <code className="bg-slate-950 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
                  {window.location.origin}/api/v1
                </code>
              </div>
            </div>

            <div className="space-y-6">
              {apiCatalog.map((cat, idx) => (
                <div key={idx} className="space-y-2.5">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{cat.group}</span>
                  </h4>

                  <div className="space-y-2">
                    {cat.routes.map((r, rIdx) => {
                      const isGet = r.method === 'GET';
                      return (
                        <div
                          key={rIdx}
                          className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                                isGet
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}
                            >
                              {r.method}
                            </span>
                            <div>
                              <span className="font-mono text-xs font-bold text-white block">{r.path}</span>
                              <span className="text-xs text-slate-400 block">{r.description}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedEndpointForCode(`${r.method} ${r.path}`);
                              setActiveTab('CODE_GENERATOR');
                            }}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-bold cursor-pointer shrink-0 self-start md:self-auto"
                          >
                            <span>{tr('Generate Code')}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CODE GENERATOR */}
      {activeTab === 'CODE_GENERATOR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">{tr('SDK & cURL Code Generator')}</h3>
                <span className="text-xs text-slate-400">{tr('Pre-configured with active tenant authorization tokens')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                {(['CURL', 'TYPESCRIPT', 'PYTHON', 'GO'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
                      selectedLanguage === lang ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  copyToClipboard(generateCodeSnippet(selectedLanguage, selectedEndpointForCode), 'snippet-main')
                }
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow cursor-pointer transition"
              >
                {copiedId === 'snippet-main' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'snippet-main' ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">{tr('Selected Endpoint Target:')}</span>
              <select
                value={selectedEndpointForCode}
                onChange={(e) => setSelectedEndpointForCode(e.target.value)}
                className="w-full bg-slate-900 text-indigo-300 font-mono p-2 rounded-lg border border-slate-800 outline-none"
              >
                <option value="POST /api/v1/invoices">{tr('POST /api/v1/invoices (Create Invoice)')}</option>
                <option value="GET /api/v1/accounts">{tr('GET /api/v1/accounts (Query Chart of Accounts)')}</option>
                <option value="POST /api/v1/journals">{tr('POST /api/v1/journals (Post Journal Voucher)')}</option>
                <option value="GET /api/v1/customers">{tr('GET /api/v1/customers (List Customers)')}</option>
              </select>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">{tr('Active Tenant Context (X-Tenant-ID):')}</span>
              <div className="font-mono text-purple-300 font-bold p-2 bg-slate-900 rounded-lg">
                {activeTenant.name} ({activeTenant.id})
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">{tr('Authentication Header:')}</span>
              <div className="font-mono text-amber-300 truncate p-2 bg-slate-900 rounded-lg">
                Authorization: Bearer sec_live_••••••
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner">
            <pre>{generateCodeSnippet(selectedLanguage, selectedEndpointForCode)}</pre>
          </div>
        </div>
      )}

      {/* TAB 4: OPENAPI SPEC */}
      {activeTab === 'OPENAPI_SPEC' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">{tr('OpenAPI 3.0.3 JSON Specification')}</h3>
            </div>

            <button
              onClick={() => {
                const specData = {
                  openapi: '3.0.3',
                  info: {
                    title: 'Enterprise Financial Accounting & Multi-Entity Ledger REST API',
                    version: '1.0.0-GA',
                    description: 'Complete programmatic interface for external applications, ERP integrations, microservices, and mobile apps.',
                  },
                  servers: [{ url: `${window.location.origin}/api/v1` }],
                };
                const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'openapi-accounting-spec.json';
                a.click();
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{tr('Export OpenAPI JSON')}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 max-h-[500px] overflow-y-auto">
            <pre>{JSON.stringify({
              openapi: '3.0.3',
              info: {
                title: 'Enterprise Multi-Entity Financial Accounting Engine',
                version: '1.0.0-GA',
                description: 'Full-featured REST gateway with double-entry validation, multi-currency conversion, and SOX 404 audit log tracking.',
              },
              servers: [{ url: `${window.location.origin}/api/v1` }],
              paths: {
                '/accounts': { get: { summary: 'List Chart of Accounts' } },
                '/journals': { get: { summary: 'Query General Ledger Vouchers' }, post: { summary: 'Post Balanced Journal' } },
                '/invoices': { get: { summary: 'List AR Invoices' }, post: { summary: 'Create Customer Invoice' } },
                '/bills': { get: { summary: 'List AP Vendor Bills' }, post: { summary: 'Record Vendor Bill' } },
                '/webhooks': { get: { summary: 'List Subscribed Webhooks' }, post: { summary: 'Register Webhook Destination' } },
              }
            }, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* CREATE API KEY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{tr('Generate Scoped API Key')}</h3>
                  <span className="text-xs text-slate-400">Scoped to company: {activeTenant.name}</span>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">{tr('Key Name / Description *')}</label>
                <input
                  type="text"
                  required
                  placeholder={tr('e.g. Production Shopify Billing Webhook Ingest')}
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">{tr('Environment')}</label>
                  <select
                    value={newKeyForm.environment}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, environment: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 outline-none"
                  >
                    <option value="LIVE">{tr('Live Production')}</option>
                    <option value="TEST">{tr('Staging / Test')}</option>
                    <option value="SANDBOX">{tr('Sandbox Playground')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">{tr('Rate Limit (req/min)')}</label>
                  <input
                    type="number"
                    min="60"
                    max="6000"
                    value={newKeyForm.rateLimitPerMin}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, rateLimitPerMin: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              {/* SCOPES SELECTION */}
              <div className="space-y-2 pt-2">
                <label className="block text-slate-300 font-bold">
                  Permission Scopes ({newKeyForm.scopes.length} selected):
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {availablePermissionScopes.map((s) => {
                    const isChecked = newKeyForm.scopes.includes(s.scope);
                    return (
                      <div
                        key={s.scope}
                        onClick={() => toggleScopeSelection(s.scope)}
                        className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="truncate">
                          <span className="font-mono font-bold block truncate">{s.label}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{s.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                >{tr('Generate Secret Token')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONE-TIME SECRET TOKEN DISPLAY MODAL */}
      {justGeneratedToken && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{tr('API Key Successfully Generated')}</h3>
                <span className="text-xs text-amber-400">{tr('Save this secret key now. It will not be shown again!')}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 text-xs font-bold block">{tr('Bearer Authorization Token:')}</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={justGeneratedToken}
                  className="flex-1 bg-slate-900 text-amber-300 font-mono text-xs p-2.5 rounded-lg border border-slate-800 select-all"
                />
                <button
                  onClick={() => copyToClipboard(justGeneratedToken, 'just-gen')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === 'just-gen' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'just-gen' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{tr('For security compliance, this raw secret token is hashed and cannot be retrieved later.')}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setJustGeneratedToken(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >{tr('I Have Stored the Key Safely')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
