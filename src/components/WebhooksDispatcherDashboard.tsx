import React, { useState } from 'react';
import {
  Webhook,
  Activity,
  Send,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Shield,
  Search,
  Filter,
  Copy,
  Check,
  Code2,
  Clock,
  ArrowUpRight,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { WebhookEndpoint, WebhookDeliveryLog, WebhookEventType } from '../types';

export const WebhooksDispatcherDashboard: React.FC = () => {
  const {
    activeTenant,
    activeRole,
    webhookEndpoints,
    webhookLogs,
    createWebhookEndpoint,
    updateWebhookEndpoint,
    deleteWebhookEndpoint,
    testDispatchWebhook,
    retryWebhookDelivery,
  } = useAccounting();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'ENDPOINTS' | 'LOGS' | 'TESTER'>('ENDPOINTS');

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modal / Drawer state for creating or editing endpoint
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    secret: '',
    events: ['invoice.created', 'invoice.paid'] as WebhookEventType[],
    isActive: true,
  });

  // Test trigger state
  const [selectedEndpointForTest, setSelectedEndpointForTest] = useState<string>('');
  const [testEventType, setTestEventType] = useState<WebhookEventType>('invoice.created');
  const [customTestPayload, setCustomTestPayload] = useState<string>('');
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);
  const [testResult, setTestResult] = useState<WebhookDeliveryLog | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected Log for detail modal
  const [selectedLogDetail, setSelectedLogDetail] = useState<WebhookDeliveryLog | null>(null);

  const availableEvents: { event: WebhookEventType; label: string; description: string; category: string }[] = [
    { event: 'invoice.created', label: 'invoice.created', description: 'Triggered when a customer invoice is created or approved', category: 'Accounts Receivable' },
    { event: 'invoice.paid', label: 'invoice.paid', description: 'Triggered when full or partial payment is settled on an invoice', category: 'Accounts Receivable' },
    { event: 'invoice.overdue', label: 'invoice.overdue', description: 'Triggered when an invoice passes its net due date', category: 'Accounts Receivable' },
    { event: 'payment.received', label: 'payment.received', description: 'Triggered when a customer payment receipt is recorded', category: 'Accounts Receivable' },
    { event: 'bill.created', label: 'bill.created', description: 'Triggered when a vendor bill is posted into Accounts Payable', category: 'Accounts Payable' },
    { event: 'bill.paid', label: 'bill.paid', description: 'Triggered when a vendor payment or disbursement is cleared', category: 'Accounts Payable' },
    { event: 'journal.posted', label: 'journal.posted', description: 'Triggered when a double-entry general ledger voucher is posted', category: 'General Ledger' },
    { event: 'period.closed', label: 'period.closed', description: 'Triggered when a fiscal accounting period is locked or finalized', category: 'Fiscal & Audit' },
    { event: 'customer.created', label: 'customer.created', description: 'Triggered when a new customer profile is registered', category: 'Entity Master' },
    { event: 'vendor.created', label: 'vendor.created', description: 'Triggered when a new supplier or vendor is provisioned', category: 'Entity Master' },
    { event: 'inventory.low_stock', label: 'inventory.low_stock', description: 'Triggered when stock quantity drops below safety reorder level', category: 'Inventory' },
    { event: 'payroll.executed', label: 'payroll.executed', description: 'Triggered when a bi-weekly or monthly pay run is processed to GL', category: 'Payroll' },
  ];

  const filteredEndpoints = (webhookEndpoints || []).filter((ep) => {
    if (ep.tenantId !== activeTenant?.id) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = ep.name.toLowerCase().includes(q);
      const matchUrl = ep.url.toLowerCase().includes(q);
      const matchDesc = (ep.description || '').toLowerCase().includes(q);
      if (!matchName && !matchUrl && !matchDesc) return false;
    }
    if (selectedEventFilter !== 'ALL' && !(ep.events || []).includes(selectedEventFilter as WebhookEventType)) {
      return false;
    }
    return true;
  });

  const tenantLogs = (webhookLogs || []).filter((log) => log.tenantId === activeTenant?.id);

  const filteredLogs = (tenantLogs || []).filter((log) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = log.endpointName.toLowerCase().includes(q);
      const matchEvent = log.event.toLowerCase().includes(q);
      const matchBody = log.responseBody.toLowerCase().includes(q);
      if (!matchName && !matchEvent && !matchBody) return false;
    }
    if (selectedEventFilter !== 'ALL' && log.event !== selectedEventFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'ALL' && log.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingEndpoint(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      secret: `whsec_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 10)}`,
      events: ['invoice.created', 'invoice.paid'],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ep: WebhookEndpoint) => {
    setEditingEndpoint(ep);
    setFormData({
      name: ep.name,
      url: ep.url,
      description: ep.description || '',
      secret: ep.secret,
      events: ep.events,
      isActive: ep.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSaveEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    if (editingEndpoint) {
      updateWebhookEndpoint(editingEndpoint.id, {
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim(),
        secret: formData.secret,
        events: formData.events,
        isActive: formData.isActive,
      });
    } else {
      createWebhookEndpoint({
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim(),
        secret: formData.secret,
        events: formData.events,
        isActive: formData.isActive,
        tenantId: activeTenant.id,
      });
    }
    setIsModalOpen(false);
  };

  const toggleEventInForm = (ev: WebhookEventType) => {
    if (formData.events.includes(ev)) {
      if (formData.events.length === 1) return; // keep at least 1
      setFormData({ ...formData, events: formData.events.filter((e) => e !== ev) });
    } else {
      setFormData({ ...formData, events: [...formData.events, ev] });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSamplePayload = (eventType: WebhookEventType) => {
    switch (eventType) {
      case 'invoice.created':
      case 'invoice.paid':
      case 'invoice.overdue':
        return JSON.stringify(
          {
            event: eventType,
            timestamp: new Date().toISOString(),
            tenantId: activeTenant.id,
            tenantCode: activeTenant.code,
            data: {
              invoiceNumber: 'INV-2026-088',
              customerName: 'Vertex Global Cloud Corp',
              customerEmail: 'finance@vertexglobal.com',
              invoiceDate: '2026-08-17',
              dueDate: '2026-09-16',
              subtotal: 12500.0,
              taxAmount: 1125.0,
              totalAmount: 13625.0,
              currency: activeTenant.currency,
              status: eventType === 'invoice.paid' ? 'PAID' : 'POSTED',
              lineItems: [
                { description: 'Enterprise Cloud ERP Platform Annual License', quantity: 1, unitPrice: 12500.0, total: 12500.0 },
              ],
            },
          },
          null,
          2
        );
      case 'journal.posted':
        return JSON.stringify(
          {
            event: eventType,
            timestamp: new Date().toISOString(),
            tenantId: activeTenant.id,
            tenantCode: activeTenant.code,
            data: {
              entryNumber: 'JE-2026-992',
              date: '2026-08-17',
              description: 'Customer SaaS Revenue Recognition & Deferred Accrual',
              totalDebit: 15000.0,
              totalCredit: 15000.0,
              currency: activeTenant.currency,
              postedBy: 'admin@platform.com',
              lines: [
                { accountCode: '1100', accountName: 'Accounts Receivable', debit: 15000.0, credit: 0.0 },
                { accountCode: '4010', accountName: 'SaaS Subscription Revenue', debit: 0.0, credit: 15000.0 },
              ],
            },
          },
          null,
          2
        );
      case 'inventory.low_stock':
        return JSON.stringify(
          {
            event: eventType,
            timestamp: new Date().toISOString(),
            tenantId: activeTenant.id,
            data: {
              sku: 'SKU-SRV-NV100',
              itemName: 'Enterprise NVMe Storage Rack Node 8TB',
              currentStock: 3,
              reorderThreshold: 10,
              unitCost: 1450.0,
              supplier: 'SuperMicro Systems LLC',
            },
          },
          null,
          2
        );
      case 'payroll.executed':
        return JSON.stringify(
          {
            event: eventType,
            timestamp: new Date().toISOString(),
            tenantId: activeTenant.id,
            data: {
              runId: 'PR-2026-08-B',
              payDate: '2026-08-17',
              employeeCount: 18,
              totalGrossWages: 94500.0,
              totalEmployeeTaxes: 18900.0,
              totalNetPayDisbursed: 75600.0,
              totalEmployerTaxes: 7229.25,
            },
          },
          null,
          2
        );
      default:
        return JSON.stringify(
          {
            event: eventType,
            timestamp: new Date().toISOString(),
            tenantId: activeTenant.id,
            data: {
              id: 'rec_99281a',
              status: 'COMPLETED',
              message: 'Standard accounting entity state mutation broadcast.',
            },
          },
          null,
          2
        );
    }
  };

  const handleSelectTestEvent = (ev: WebhookEventType) => {
    setTestEventType(ev);
    setCustomTestPayload(getSamplePayload(ev));
  };

  const handleRunTestDispatch = async () => {
    const targetId = selectedEndpointForTest || (filteredEndpoints[0] ? filteredEndpoints[0].id : '');
    if (!targetId) return;

    setIsDispatchingTest(true);
    setTestResult(null);

    let parsedPayload: any;
    try {
      parsedPayload = customTestPayload ? JSON.parse(customTestPayload) : JSON.parse(getSamplePayload(testEventType));
    } catch {
      parsedPayload = { event: testEventType, error: 'Malformed custom JSON payload provided in simulation editor' };
    }

    const res = await testDispatchWebhook(targetId, testEventType, parsedPayload);
    setIsDispatchingTest(false);
    if (res.log) {
      setTestResult(res.log);
    }
  };

  // Metrics summary
  const totalDeliveries = tenantLogs.length;
  const successfulDeliveries = tenantLogs.filter((l) => l.status === 'SUCCESS').length;
  const failedDeliveries = tenantLogs.filter((l) => l.status === 'FAILED').length;
  const successRate = totalDeliveries > 0 ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(1) : '100.0';
  const avgLatency =
    totalDeliveries > 0
      ? Math.round(tenantLogs.reduce((acc, curr) => acc + curr.latencyMs, 0) / totalDeliveries)
      : 0;

  return (
    <div id="webhooks-dispatcher-dashboard" className="space-y-6">
      {/* HEADER WITH STATS CARDS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Real-Time Outbound Event Gateway
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                HMAC-SHA256 Signed
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Webhooks Dispatcher & Logs</h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Broadcast high-fidelity JSON event payloads in real-time to external web servers, Zapier, Make.com, Slack bots, and internal data lakes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setSelectedEndpointForTest(filteredEndpoints[0]?.id || '');
                setCustomTestPayload(getSamplePayload('invoice.created'));
                setActiveTab('TESTER');
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-300 px-4 py-2.5 rounded-xl border border-slate-700 font-medium text-xs shadow transition cursor-pointer"
            >
              <Send className="w-4 h-4 text-purple-400" />
              <span>Test Payload Simulator</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-purple-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Webhook Endpoint</span>
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Active Subscriptions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-white">{filteredEndpoints.filter((e) => e.isActive).length}</span>
              <span className="text-xs text-slate-500 font-mono">/ {filteredEndpoints.length} registered</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Delivery Success Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400">{successRate}%</span>
              <span className="text-xs text-emerald-500/80 font-mono">({successfulDeliveries} ok)</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Failed Deliveries</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-bold ${failedDeliveries > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {failedDeliveries}
              </span>
              <span className="text-xs text-slate-500 font-mono">retries auto-queued</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium block">Average HTTP Latency</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-indigo-300 font-mono">{avgLatency} ms</span>
              <span className="text-xs text-slate-500 font-mono">p95 &lt; 280ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS & FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('ENDPOINTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ENDPOINTS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Configured Endpoints ({filteredEndpoints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'LOGS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Delivery Logs ({tenantLogs.length})</span>
          </button>
          <button
            onClick={() => {
              setSelectedEndpointForTest(filteredEndpoints[0]?.id || '');
              setCustomTestPayload(getSamplePayload('invoice.created'));
              setActiveTab('TESTER');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'TESTER'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Interactive Test Dispatcher</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by name, URL, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
            />
          </div>

          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="bg-slate-900 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
          >
            <option value="ALL">All Event Types</option>
            {availableEvents.map((ev) => (
              <option key={ev.event} value={ev.event}>
                {ev.label}
              </option>
            ))}
          </select>

          {activeTab === 'LOGS' && (
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-900 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success (2xx)</option>
              <option value="FAILED">Failed / Error</option>
              <option value="RETRYING">Retrying</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: CONFIGURED ENDPOINTS */}
      {activeTab === 'ENDPOINTS' && (
        <div className="space-y-4">
          {filteredEndpoints.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto text-purple-400 border border-purple-500/20">
                <Webhook className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">No Webhook Endpoints Configured</h3>
                <p className="text-xs text-slate-400">
                  Register your first HTTP destination URL to start receiving instantaneous accounting events.
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Webhook Endpoint</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEndpoints.map((ep) => (
                <div
                  key={ep.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition relative group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            ep.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          <Webhook className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{ep.name}</h4>
                          <span className="text-[11px] text-slate-400 font-mono block truncate max-w-[180px]">
                            {ep.id}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          ep.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {ep.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {ep.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ep.description}</p>
                    )}

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold">Destination URL</span>
                        <button
                          onClick={() => copyToClipboard(ep.url, `url-${ep.id}`)}
                          className="hover:text-purple-400 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `url-${ep.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-slate-200 truncate select-all">{ep.url}</div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Subscribed Events ({ep.events.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ep.events.map((ev) => (
                          <span
                            key={ev}
                            className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-mono"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 font-mono">
                      {ep.lastTriggeredAt ? (
                        <span>Last: {new Date(ep.lastTriggeredAt).toLocaleTimeString()}</span>
                      ) : (
                        <span>Never triggered</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedEndpointForTest(ep.id);
                          setTestEventType(ep.events[0] || 'invoice.created');
                          setCustomTestPayload(getSamplePayload(ep.events[0] || 'invoice.created'));
                          setActiveTab('TESTER');
                        }}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-purple-400 hover:text-purple-300 transition cursor-pointer"
                        title="Dispatch test payload"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ep)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                        title="Edit endpoint configuration"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the webhook "${ep.name}"?`)) {
                            deleteWebhookEndpoint(ep.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Delete endpoint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REAL-TIME DELIVERY LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Event Delivery Stream</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredLogs.length} of {tenantLogs.length} events
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No delivery logs matching the active filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Status & Code</th>
                    <th className="py-3 px-4">Event Trigger</th>
                    <th className="py-3 px-4">Destination Endpoint</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {filteredLogs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 ${
                                isSuccess
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {isSuccess ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              HTTP {log.responseStatus}
                            </span>
                            {log.attemptNumber > 1 && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                Try #{log.attemptNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {log.event}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-sans">
                          <div className="font-bold text-white">{log.endpointName}</div>
                          <span className="text-[11px] text-slate-500 font-mono truncate block max-w-xs">
                            {log.endpointId}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-indigo-300">
                          {log.latencyMs} ms
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 font-sans">
                            <button
                              onClick={() => setSelectedLogDetail(log)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                            >
                              Inspect Payload
                            </button>
                            <button
                              onClick={async () => {
                                await retryWebhookDelivery(log.id);
                              }}
                              className="p-1 hover:bg-slate-800 text-purple-400 rounded-lg transition cursor-pointer"
                              title="Re-dispatch payload now"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTERACTIVE PAYLOAD SIMULATOR & TESTER */}
      {activeTab === 'TESTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Send className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Event Simulation Parameters</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Webhook Endpoint:</label>
                  <select
                    value={selectedEndpointForTest}
                    onChange={(e) => setSelectedEndpointForTest(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:border-purple-500 outline-none font-mono"
                  >
                    {filteredEndpoints.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.name} — ({ep.url})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Select Event Type to Simulate:</label>
                  <select
                    value={testEventType}
                    onChange={(e) => handleSelectTestEvent(e.target.value as WebhookEventType)}
                    className="w-full bg-slate-950 text-purple-300 font-mono p-2.5 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
                  >
                    {availableEvents.map((ev) => (
                      <option key={ev.event} value={ev.event}>
                        {ev.label} ({ev.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-medium">JSON Event Payload (Editable):</label>
                    <button
                      onClick={() => setCustomTestPayload(getSamplePayload(testEventType))}
                      className="text-purple-400 hover:text-purple-300 text-[11px] font-medium cursor-pointer"
                    >
                      Reset to Schema Template
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={customTestPayload || getSamplePayload(testEventType)}
                    onChange={(e) => setCustomTestPayload(e.target.value)}
                    className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
                  />
                </div>

                <button
                  onClick={handleRunTestDispatch}
                  disabled={isDispatchingTest || filteredEndpoints.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isDispatchingTest ? (
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  ) : (
                    <Play className="w-4 h-4 fill-white text-white" />
                  )}
                  <span>{isDispatchingTest ? 'Transmitting HMAC Webhook...' : 'Fire Test Webhook Payload'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RESPONSE VIEWER */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm min-h-[460px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Live Execution Inspector</h3>
                </div>
                {testResult && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      testResult.status === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    HTTP {testResult.responseStatus} — {testResult.latencyMs}ms
                  </span>
                )}
              </div>

              {testResult ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Outgoing HTTP Headers Sent:</span>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-300 overflow-x-auto space-y-1">
                      {Object.entries(testResult.requestHeaders).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-purple-400">{k}:</span>
                          <span className="text-slate-200 truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Destination Server Response Body:</span>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 max-h-56 overflow-y-auto">
                      <pre>{testResult.responseBody}</pre>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span>HMAC-SHA256 Header Validated with Secret Key</span>
                    </div>
                    <span className="font-mono text-[11px] text-purple-400">RFC 2104 compliant</span>
                  </div>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <Activity className="w-10 h-10 text-slate-700" />
                  <p className="text-xs max-w-sm">
                    Select a registered endpoint on the left and click "Fire Test Webhook Payload" to view instant HTTP handshakes, headers, and destination responses.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ENDPOINT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Webhook className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingEndpoint ? 'Edit Webhook Endpoint' : 'Register New Webhook Endpoint'}
                  </h3>
                  <span className="text-xs text-slate-400">Scoped to company: {activeTenant.name}</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEndpoint} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Endpoint Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zapier Lead-to-Invoice Automation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">HTTPS Destination URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhooks/accounting"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 font-mono p-2.5 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">HMAC Signature Secret Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formData.secret}
                    className="flex-1 bg-slate-950 text-amber-300 font-mono p-2.5 rounded-xl border border-slate-800 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        secret: `whsec_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 10)}`,
                      })
                    }
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-bold cursor-pointer transition"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Used to compute the <code>X-Hub-Signature-256</code> header to verify payload origin.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Description / Intended System</label>
                <input
                  type="text"
                  placeholder="e.g. Forwards customer invoices to HubSpot deal sync pipeline."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:border-purple-500 outline-none"
                />
              </div>

              {/* EVENT SUBSCRIPTIONS SELECTOR */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold">Subscribe to Events ({formData.events.length} selected):</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.events.length === availableEvents.length) {
                        setFormData({ ...formData, events: ['invoice.created'] });
                      } else {
                        setFormData({ ...formData, events: availableEvents.map((e) => e.event) });
                      }
                    }}
                    className="text-purple-400 hover:text-purple-300 text-[11px] font-medium cursor-pointer"
                  >
                    {formData.events.length === availableEvents.length ? 'Clear All' : 'Select All 12 Events'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {availableEvents.map((ev) => {
                    const isChecked = formData.events.includes(ev.event);
                    return (
                      <div
                        key={ev.event}
                        onClick={() => toggleEventInForm(ev.event)}
                        className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-purple-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="truncate">
                          <span className="font-mono font-bold block truncate">{ev.label}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{ev.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ep-active-chk"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="ep-active-chk" className="text-slate-300 font-medium cursor-pointer">
                  Enable active webhook event forwarding immediately
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 transition cursor-pointer"
                >
                  {editingEndpoint ? 'Save Changes' : 'Create Webhook Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT LOG DETAIL MODAL */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Event Delivery Audit & Payload Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Event Type</span>
                  <span className="font-mono text-purple-300 font-bold">{selectedLogDetail.event}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">HTTP Response</span>
                  <span
                    className={`font-mono font-bold ${
                      selectedLogDetail.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    HTTP {selectedLogDetail.responseStatus}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Round-Trip Latency</span>
                  <span className="font-mono text-indigo-300 font-bold">{selectedLogDetail.latencyMs} ms</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Attempt Count</span>
                  <span className="font-mono text-amber-300 font-bold">#{selectedLogDetail.attemptNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Delivered JSON Payload:</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 max-h-52 overflow-y-auto">
                  <pre>{JSON.stringify(selectedLogDetail.payload, null, 2)}</pre>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Server Response Body:</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-300 max-h-32 overflow-y-auto">
                  <pre>{selectedLogDetail.responseBody}</pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition cursor-pointer text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
