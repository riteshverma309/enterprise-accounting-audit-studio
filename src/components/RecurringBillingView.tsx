import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { RecurringInvoiceSchedule, RecurrenceFrequency } from '../types';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  DollarSign,
  Users,
  FileText,
  Building,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Check,
} from 'lucide-react';

export const RecurringBillingView: React.FC = () => {
  const {
    activeTenant,
    recurringSchedules,
    createRecurringSchedule,
    updateRecurringSchedule,
    deleteRecurringSchedule,
    runRecurringScheduleNow,
    customers,
    productsServices,
  } = useAccounting();

  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [revenueAccountCode, setRevenueAccountCode] = useState('4010');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemDescription, setItemDescription] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; amount: number }>>([]);
  const [successBanner, setSuccessBanner] = useState('');

  // Filtered recurring schedules
  const filteredSchedules = useMemo(() => {
    return recurringSchedules.filter((s) => {
      if (s.tenantId !== activeTenant.id) return false;
      if (frequencyFilter !== 'ALL' && s.frequency !== frequencyFilter) return false;
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          s.profileName.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          (s.customerEmail && s.customerEmail.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [recurringSchedules, activeTenant.id, frequencyFilter, statusFilter, searchTerm]);

  // Total MRR calculation (normalize annual/quarterly/monthly to monthly)
  const monthlyRecurringRevenue = useMemo(() => {
    return recurringSchedules
      .filter((s) => s.tenantId === activeTenant.id && s.status === 'ACTIVE')
      .reduce((sum, s) => {
        let monthlyAmount = s.totalAmount;
        if (s.frequency === 'WEEKLY') monthlyAmount = s.totalAmount * 4.33;
        else if (s.frequency === 'QUARTERLY') monthlyAmount = s.totalAmount / 3;
        else if (s.frequency === 'SEMI_ANNUAL') monthlyAmount = s.totalAmount / 6;
        else if (s.frequency === 'ANNUAL') monthlyAmount = s.totalAmount / 12;
        return sum + monthlyAmount;
      }, 0);
  }, [recurringSchedules, activeTenant.id]);

  const totalGeneratedInvoices = useMemo(() => {
    return recurringSchedules
      .filter((s) => s.tenantId === activeTenant.id)
      .reduce((sum, s) => sum + s.generatedInvoicesCount, 0);
  }, [recurringSchedules, activeTenant.id]);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = productsServices.find((p) => p.id === prodId);
    if (prod) {
      setItemDescription(prod.name);
      setItemUnitPrice(prod.unitPrice);
    }
  };

  const handleAddItem = () => {
    if (!itemDescription || itemUnitPrice <= 0 || itemQuantity <= 0) return;
    const amount = Math.round(itemQuantity * itemUnitPrice * 100) / 100;
    setItems((prev) => [
      ...prev,
      {
        description: itemDescription,
        quantity: Number(itemQuantity),
        unitPrice: Number(itemUnitPrice),
        amount,
      },
    ]);
    setItemDescription('');
    setItemQuantity(1);
    setItemUnitPrice(0);
    setSelectedProductId('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.amount, 0);
  }, [items]);

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !customerId || items.length === 0) return;

    const cust = customers.find((c) => c.id === customerId);
    const customerName = cust ? cust.name : 'Valued Client';
    const customerEmail = cust ? cust.email : undefined;

    const subtotal = Math.round(calculateSubtotal * 100) / 100;
    const taxTotal = Math.round(subtotal * 0.08 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxTotal) * 100) / 100;

    createRecurringSchedule({
      tenantId: activeTenant.id,
      profileName,
      customerId,
      customerName,
      customerEmail,
      frequency,
      status: 'ACTIVE',
      startDate,
      endDate: endDate || undefined,
      nextRunDate: startDate,
      autoSendEmail,
      items: items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxRate: 8,
        total: it.amount,
      })),
      subtotal,
      taxTotal,
      totalAmount,
      revenueAccountCode,
    });

    setIsModalOpen(false);
    resetForm();
    setSuccessBanner(`Recurring subscription profile "${profileName}" created successfully.`);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  const resetForm = () => {
    setProfileName('');
    setCustomerId('');
    setFrequency('MONTHLY');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setAutoSendEmail(true);
    setRevenueAccountCode('4010');
    setItems([]);
  };

  const handleRunNow = (id: string, name: string) => {
    const res = runRecurringScheduleNow(id);
    if (res.success) {
      setSuccessBanner(`Instant invoice generated & posted to AR for subscription profile "${name}".`);
      setTimeout(() => setSuccessBanner(''), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              Automated Invoicing Engine
            </span>
            <span className="text-xs text-slate-400">Recurring Billing & Retainers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Repeat className="w-6 h-6 text-indigo-400" />
            Recurring Billing & Subscriptions
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Automate routine client invoices, SaaS retainers, and SLA service agreements with automated double-entry General Ledger syncing.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Recurring Schedule
        </button>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          {successBanner}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Recurring (MRR)</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">
            ${monthlyRecurringRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Normalized monthly recurring contract volume
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Subscriptions</span>
            <Repeat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {recurringSchedules.filter((s) => s.tenantId === activeTenant.id && s.status === 'ACTIVE').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active auto-billing customer profiles
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Invoices Generated</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{totalGeneratedInvoices}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Invoices automatically issued to AR
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Fiscal Tenant</span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 truncate">{activeTenant.name}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Currency: <span className="font-mono text-emerald-400 font-bold">{activeTenant.currency}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search schedule name, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52 sm:w-64"
            />
          </div>

          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Frequencies</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="SEMI_ANNUAL">Semi-Annual</option>
            <option value="ANNUAL">Annual</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Schedule Profile</th>
                <th className="px-4 py-3 font-semibold">Customer / Client</th>
                <th className="px-4 py-3 font-semibold">Cadence</th>
                <th className="px-4 py-3 font-semibold">Next Run Date</th>
                <th className="px-4 py-3 font-semibold">Auto-Email</th>
                <th className="px-4 py-3 font-semibold text-right">Amount / Cycle</th>
                <th className="px-4 py-3 font-semibold text-center">Invoices Run</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No recurring schedules found. Click &quot;Create Recurring Schedule&quot; to set up subscription billing.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((sch) => {
                  const isActive = sch.status === 'ACTIVE';
                  return (
                    <tr key={sch.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-sans font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-slate-800 rounded-lg text-indigo-400">
                            <Repeat className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <div>{sch.profileName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Revenue Acc: {sch.revenueAccountCode || '4010'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-200">
                        <div>{sch.customerName}</div>
                        {sch.customerEmail && (
                          <div className="text-[10px] text-slate-400">{sch.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {sch.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{sch.nextRunDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        {sch.autoSendEmail ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Enabled
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Draft Only</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-100">
                        ${sch.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold">
                          {sch.generatedInvoicesCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-sans">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Pause className="w-3 h-3" /> Paused
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleRunNow(sch.id, sch.profileName)}
                            title="Generate and post invoice right now"
                            className="flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[11px] font-medium border border-indigo-500/30 transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            Run Now
                          </button>
                          <button
                            onClick={() =>
                              updateRecurringSchedule(sch.id, {
                                status: isActive ? 'PAUSED' : 'ACTIVE',
                              })
                            }
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                            title={isActive ? 'Pause Schedule' : 'Resume Schedule'}
                          >
                            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteRecurringSchedule(sch.id)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE RECURRING SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-indigo-400" />
                  Create Recurring Billing Schedule
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set up automated subscription cadence, product line items, and revenue recognition rules.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Profile / Contract Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly Enterprise Cloud Retainer"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select customer contact...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Billing Cadence *</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="SEMI_ANNUAL">Semi-Annual</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200">Subscription Line Items</div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Choose item catalog...</option>
                      {productsServices.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.unitPrice})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={itemUnitPrice || ''}
                      onChange={(e) => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                {items.length > 0 && (
                  <table className="w-full text-left text-xs text-slate-300 font-mono mt-2">
                    <thead>
                      <tr className="text-[10px] text-slate-500 border-b border-slate-800">
                        <th className="py-1">Description</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Unit Price</th>
                        <th className="py-1 text-right">Amount</th>
                        <th className="py-1 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 font-sans">{it.description}</td>
                          <td className="py-1.5 text-center">{it.quantity}</td>
                          <td className="py-1.5 text-right">${it.unitPrice.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-bold text-slate-100">${it.amount.toFixed(2)}</td>
                          <td className="py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-400 hover:text-red-300 p-0.5"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoSendEmail"
                  checked={autoSendEmail}
                  onChange={(e) => setAutoSendEmail(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="autoSendEmail" className="text-xs text-slate-300 cursor-pointer">
                  Automatically dispatch branded PDF invoice via email upon schedule trigger
                </label>
              </div>

              {/* Total Summary Box */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400 font-sans">Recurring Cycle Total (Subtotal + 8% Tax):</span>
                <span className="text-base font-bold text-indigo-400">
                  ${(calculateSubtotal * 1.08).toFixed(2)} {activeTenant.currency}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  Save Recurring Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
