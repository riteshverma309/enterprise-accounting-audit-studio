import React, { useState } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import {
  Workflow,
  Zap,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Sliders,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  Check,
  Copy,
  Plus,
  Trash2,
  DollarSign,
  Users,
  Building2,
  Package,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { IntegrationConnector, ConnectorPlatform } from '../types';

export const IntegrationsConnectorsHub: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    activeTenant,
    activeRole,
    accounts,
    integrationConnectors,
    connectIntegrationConnector,
    syncIntegrationConnector,
    disconnectIntegrationConnector,
  } = useAccounting();

  // Active Category filter
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'AUTOMATION' | 'ECOMMERCE' | 'PAYMENTS' | 'CRM' | 'PAYROLL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected connector for configuration modal
  const [selectedConfigConnector, setSelectedConfigConnector] = useState<IntegrationConnector | null>(null);
  const [configForm, setConfigForm] = useState<{
    apiKey: string;
    storeDomain: string;
    webhookUrl: string;
    clientId: string;
    autoSyncInvoices: boolean;
    autoSyncCustomers: boolean;
    autoPostJournals: boolean;
    syncIntervalMinutes: number;
    defaultIncomeAccountId: string;
    defaultExpenseAccountId: string;
    defaultBankAccountId: string;
    taxHandling: 'AUTO_CALCULATE' | 'PASSTHROUGH';
  }>({
    apiKey: '',
    storeDomain: '',
    webhookUrl: '',
    clientId: '',
    autoSyncInvoices: true,
    autoSyncCustomers: true,
    autoPostJournals: true,
    syncIntervalMinutes: 15,
    defaultIncomeAccountId: '',
    defaultExpenseAccountId: '',
    defaultBankAccountId: '',
    taxHandling: 'AUTO_CALCULATE',
  });

  // Syncing state
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{ id: string; message: string; count: number } | null>(null);

  // Filter connectors
  const tenantConnectors = integrationConnectors.filter((c) => c.tenantId === activeTenant.id);

  const filteredConnectors = tenantConnectors.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPlatform = c.platform.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      if (!matchName && !matchPlatform && !matchDesc) return false;
    }
    return true;
  });

  const handleOpenConfig = (conn: IntegrationConnector) => {
    setSelectedConfigConnector(conn);
    setConfigForm({
      apiKey: conn.credentials.apiKey || '',
      storeDomain: conn.credentials.storeDomain || '',
      webhookUrl: conn.credentials.webhookUrl || '',
      clientId: conn.credentials.clientId || '',
      autoSyncInvoices: conn.syncSettings.autoSyncInvoices,
      autoSyncCustomers: conn.syncSettings.autoSyncCustomers,
      autoPostJournals: conn.syncSettings.autoPostJournals,
      syncIntervalMinutes: conn.syncSettings.syncIntervalMinutes,
      defaultIncomeAccountId: conn.syncSettings.defaultIncomeAccountId || '',
      defaultExpenseAccountId: conn.syncSettings.defaultExpenseAccountId || '',
      defaultBankAccountId: conn.syncSettings.defaultBankAccountId || '',
      taxHandling: conn.syncSettings.taxHandling,
    });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigConnector) return;

    connectIntegrationConnector(
      selectedConfigConnector.platform,
      {
        apiKey: configForm.apiKey,
        storeDomain: configForm.storeDomain,
        webhookUrl: configForm.webhookUrl,
        clientId: configForm.clientId,
      },
      {
        autoSyncInvoices: configForm.autoSyncInvoices,
        autoSyncCustomers: configForm.autoSyncCustomers,
        autoPostJournals: configForm.autoPostJournals,
        syncIntervalMinutes: configForm.syncIntervalMinutes,
        defaultIncomeAccountId: configForm.defaultIncomeAccountId,
        defaultExpenseAccountId: configForm.defaultExpenseAccountId,
        defaultBankAccountId: configForm.defaultBankAccountId,
        taxHandling: configForm.taxHandling,
      }
    );

    setSelectedConfigConnector(null);
  };

  const handleRunSync = async (connId: string) => {
    setSyncingId(connId);
    const res = await syncIntegrationConnector(connId);
    setSyncingId(null);
    if (res.success) {
      setLastSyncResult({
        id: connId,
        message: res.message,
        count: res.syncedCount,
      });
      setTimeout(() => setLastSyncResult(null), 5000);
    }
  };

  const revenueAccounts = accounts.filter((a) => a.tenantId === activeTenant.id && a.type === 'REVENUE');
  const expenseAccounts = accounts.filter((a) => a.tenantId === activeTenant.id && a.type === 'EXPENSE');
  const bankAccounts = accounts.filter((a) => a.tenantId === activeTenant.id && a.type === 'ASSET' && (a.code.startsWith('10') || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash')));

  const getPlatformIcon = (platform: ConnectorPlatform) => {
    switch (platform) {
      case 'ZAPIER':
        return <Zap className="w-5 h-5 text-orange-400" />;
      case 'MAKE':
        return <Workflow className="w-5 h-5 text-purple-400" />;
      case 'STRIPE':
        return <CreditCard className="w-5 h-5 text-indigo-400" />;
      case 'SHOPIFY':
        return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
      case 'HUBSPOT':
      case 'SALESFORCE':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'GUSTO':
        return <Building2 className="w-5 h-5 text-rose-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div id="integrations-connectors-hub" className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Workflow className="w-3 h-3" />{tr('No-Code Integrations & Pre-Built Connectors')}</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-mono">{tr('Bidirectional Double-Entry Sync')}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{tr('Zapier, Make & E-Commerce Integration Hub')}</h1>
            <p className="text-sm text-slate-400 max-w-2xl">{tr('Connect external SaaS applications, e-commerce storefronts, payment gateways, and CRM platforms with automated GL mapping and instant synchronization.')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                tenantConnectors.filter((c) => c.status === 'CONNECTED').forEach((c) => handleRunSync(c.id));
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncingId ? 'animate-spin' : ''}`} />
              <span>{tr('Sync All Connected Apps')}</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('Active Connections')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400">
                {tenantConnectors.filter((c) => c.status === 'CONNECTED').length}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ {tenantConnectors.length} connectors</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('Total Synced Records')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-white">
                {tenantConnectors.reduce((acc, c) => acc + c.stats.totalSyncedRecords, 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">{tr('transactions')}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('Default Sync Frequency')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-indigo-300 font-mono">15 min</span>
              <span className="text-xs text-slate-500 font-mono">{tr('real-time webhook fallback')}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">{tr('Double-Entry Assurance')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-purple-300 font-mono">100% Balanced</span>
              <span className="text-xs text-emerald-400 font-mono">DR = CR Check</span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {lastSyncResult && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{lastSyncResult.message}</span>
          </div>
          <span className="font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
            +{lastSyncResult.count} records posted
          </span>
        </div>
      )}

      {/* FILTER BUTTONS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          {[
            { id: 'ALL', label: 'All Connectors' },
            { id: 'AUTOMATION', label: 'Zapier & Make' },
            { id: 'PAYMENTS', label: 'Stripe & Payments' },
            { id: 'ECOMMERCE', label: 'Shopify & Stores' },
            { id: 'CRM', label: 'CRM & Deals' },
            { id: 'PAYROLL', label: 'Gusto & Payroll' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat.id ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={tr('Search connectors by name...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* CONNECTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConnectors.map((conn) => {
          const isConnected = conn.status === 'CONNECTED';
          const isSyncing = syncingId === conn.id;

          return (
            <div
              key={conn.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg relative group"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                        isConnected
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      {getPlatformIcon(conn.platform)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{conn.name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono block uppercase tracking-wider">
                        {conn.category} • {conn.authType}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {conn.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{conn.description}</p>

                {/* SYNC CONFIG SUMMARY */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{tr("Sync Invoices / Orders:")}</span>
                    <span className={`font-bold ${conn.syncSettings.autoSyncInvoices ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {conn.syncSettings.autoSyncInvoices ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>{tr("Auto-Post to GL Ledger:")}</span>
                    <span className={`font-bold ${conn.syncSettings.autoPostJournals ? 'text-purple-400' : 'text-slate-500'}`}>
                      {conn.syncSettings.autoPostJournals ? 'Automatic' : 'Draft Review'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>{tr("Total Synced:")}</span>
                    <span className="font-mono text-white font-bold">{conn.stats.totalSyncedRecords.toLocaleString()} recs</span>
                  </div>
                </div>

                {conn.stats.lastSyncMessage && (
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 font-mono truncate">
                    <span>{conn.stats.lastSyncMessage}</span>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenConfig(conn)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tr('Configure')}</span>
                </button>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleRunSync(conn.id)}
                        disabled={isSyncing}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Disconnect ${conn.name}? Scheduled synchronization will stop.`)) {
                            disconnectIntegrationConnector(conn.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title={tr('Disconnect connector')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenConfig(conn)}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                    >{tr('Connect')}</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONNECTOR CONFIGURATION MODAL */}
      {selectedConfigConnector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  {getPlatformIcon(selectedConfigConnector.platform)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Configure {selectedConfigConnector.name}</h3>
                  <span className="text-xs text-slate-400">Scoped to company: {activeTenant.name}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedConfigConnector(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              {/* CREDENTIALS BASED ON PLATFORM */}
              <div className="space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">{tr('Authentication & Target Endpoint')}</span>

                {selectedConfigConnector.platform === 'STRIPE' && (
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">Stripe Restricted Secret API Key *</label>
                    <input
                      type="password"
                      required
                      placeholder={tr('rk_live_...')}
                      value={configForm.apiKey}
                      onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                      className="w-full bg-slate-900 text-slate-200 font-mono p-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}

                {selectedConfigConnector.platform === 'SHOPIFY' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold">Shopify Store URL *</label>
                      <input
                        type="text"
                        required
                        placeholder={tr('your-brand.myshopify.com')}
                        value={configForm.storeDomain}
                        onChange={(e) => setConfigForm({ ...configForm, storeDomain: e.target.value })}
                        className="w-full bg-slate-900 text-slate-200 font-mono p-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold">{tr('Custom App Admin Access Token')}</label>
                      <input
                        type="password"
                        placeholder={tr('shpat_...')}
                        value={configForm.apiKey}
                        onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                        className="w-full bg-slate-900 text-slate-200 font-mono p-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </>
                )}

                {(selectedConfigConnector.platform === 'ZAPIER' || selectedConfigConnector.platform === 'MAKE') && (
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">Inbound Webhook Catch URL *</label>
                    <input
                      type="url"
                      required
                      placeholder={tr('https://hooks.zapier.com/hooks/catch/...')}
                      value={configForm.webhookUrl}
                      onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                      className="w-full bg-slate-900 text-slate-200 font-mono p-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* GENERAL LEDGER MAPPINGS */}
              <div className="space-y-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">{tr('General Ledger Chart of Accounts Mapping')}</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">{tr("Default Revenue / Sales Account:")}</label>
                    <select
                      value={configForm.defaultIncomeAccountId}
                      onChange={(e) => setConfigForm({ ...configForm, defaultIncomeAccountId: e.target.value })}
                      className="w-full bg-slate-900 text-slate-200 p-2.5 rounded-xl border border-slate-800 outline-none"
                    >
                      <option value="">{tr('Select Revenue Account')}</option>
                      {revenueAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">{tr("Default Bank / Settlement Account:")}</label>
                    <select
                      value={configForm.defaultBankAccountId}
                      onChange={(e) => setConfigForm({ ...configForm, defaultBankAccountId: e.target.value })}
                      className="w-full bg-slate-900 text-slate-200 p-2.5 rounded-xl border border-slate-800 outline-none"
                    >
                      <option value="">{tr('Select Cash / Bank Account')}</option>
                      {bankAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">Processing Fee Expense Account (Optional):</label>
                  <select
                    value={configForm.defaultExpenseAccountId}
                    onChange={(e) => setConfigForm({ ...configForm, defaultExpenseAccountId: e.target.value })}
                    className="w-full bg-slate-900 text-slate-200 p-2.5 rounded-xl border border-slate-800 outline-none"
                  >
                    <option value="">{tr('Select Expense Account')}</option>
                    {expenseAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AUTOMATION TOGGLES */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-sync-inv"
                    checked={configForm.autoSyncInvoices}
                    onChange={(e) => setConfigForm({ ...configForm, autoSyncInvoices: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="auto-sync-inv" className="text-slate-300 font-medium cursor-pointer">{tr('Auto-create Accounts Receivable invoices from external orders')}</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-post-gl"
                    checked={configForm.autoPostJournals}
                    onChange={(e) => setConfigForm({ ...configForm, autoPostJournals: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="auto-post-gl" className="text-slate-300 font-medium cursor-pointer">{tr('Post double-entry journal vouchers to GL automatically upon settlement')}</label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedConfigConnector(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >{tr('Save & Connect Integration')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
