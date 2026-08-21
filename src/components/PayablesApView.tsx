import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Plus,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Building,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { VendorContact } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BillLineItemRow {
  id: string;
  description: string;
  amount: number;
  expenseAccountCode: string;
}

export const PayablesApView: React.FC<{ preSelectedVendor?: VendorContact | null }> = ({
  preSelectedVendor,
}) => {
  const { t, tr } = useLanguage();
  const {
    activeTenant,
    vendorBills,
    vendors,
    customAttributeDefinitions,
    createVendorBill,
    payVendorBill,
    accounts,
  } = useAccounting();

  const [showCreateModal, setShowCreateModal] = useState(Boolean(preSelectedVendor));
  const [payModalBill, setPayModalBill] = useState<string | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  // Form State for New Vendor Bill
  const [selectedVendorId, setSelectedVendorId] = useState<string>(preSelectedVendor?.id || '');
  const [vendorName, setVendorName] = useState(preSelectedVendor?.name || '');
  const [dueDate, setDueDate] = useState('2026-08-25');
  const [billNotes, setBillNotes] = useState('');
  const [vendorAttributesSnapshot, setVendorAttributesSnapshot] = useState<Record<string, any>>(
    preSelectedVendor?.customAttributes || {}
  );

  // Dynamic Line Items State
  const [billLineItems, setBillLineItems] = useState<BillLineItemRow[]>([
    { id: 'bitem-1', description: 'Facility AMC & Infrastructure Service', amount: 8500, expenseAccountCode: '5010' },
  ]);

  // Form State for Payment Disbursement
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');

  const tenantBills = vendorBills.filter((b) => b.tenantId === activeTenant.id);

  // Available vendors for current tenant
  const availableVendors = useMemo(() => {
    return vendors.filter(
      (v) => !v.tenantId || v.tenantId === activeTenant.id || v.tenantId === 't-acme-us'
    );
  }, [vendors, activeTenant.id]);

  // When selected vendor changes from dropdown
  const handleSelectVendor = (vendId: string) => {
    setSelectedVendorId(vendId);
    if (!vendId) {
      setVendorAttributesSnapshot({});
      return;
    }
    const vend = availableVendors.find((v) => v.id === vendId);
    if (vend) {
      setVendorName(vend.name);
      const attrs = vend.customAttributes || {};
      setVendorAttributesSnapshot(attrs);

      // Auto-compute payment due date based on payment terms
      const days = vend.paymentTermsDays || 30;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      setDueDate(targetDate.toISOString().split('T')[0]);

      // Set default expense GL code
      const expCode = vend.defaultExpenseAccountCode || '5010';
      setBillLineItems([
        {
          id: `bitem-${Date.now()}`,
          description: `${vend.name} - Service Invoicing`,
          amount: 5000,
          expenseAccountCode: expCode,
        },
      ]);
    }
  };

  // Bill Calculations
  const calculatedBillTotal = billLineItems.reduce((acc, curr) => acc + Math.max(0, curr.amount || 0), 0);

  const addBillLineItem = () => {
    setBillLineItems((prev) => [
      ...prev,
      { id: `bitem-${Date.now()}`, description: '', amount: 0, expenseAccountCode: '5010' },
    ]);
  };

  const removeBillLineItem = (id: string) => {
    if (billLineItems.length === 1) return;
    setBillLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateBillLineItem = (id: string, field: keyof BillLineItemRow, value: any) => {
    setBillLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // AP Metrics
  const totalAp = tenantBills.reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);
  const paidAp = tenantBills.reduce((sum, b) => sum + b.amountPaid, 0);
  const overdueAp = tenantBills
    .filter((b) => b.status === 'OVERDUE' || (b.status !== 'PAID' && new Date(b.dueDate) < new Date()))
    .reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();

    createVendorBill({
      tenantId: activeTenant.id,
      vendorId: selectedVendorId || undefined,
      vendorName,
      billDate: new Date().toISOString().split('T')[0],
      dueDate,
      currency: activeTenant.currency,
      items: billLineItems.map((item) => ({
        description: item.description || 'Vendor Expense Line',
        amount: Math.max(0, item.amount || 0),
        expenseAccountCode: item.expenseAccountCode || '5010',
      })),
      totalAmount: calculatedBillTotal,
      notes: billNotes,
      vendorAttributesSnapshot: Object.keys(vendorAttributesSnapshot).length > 0 ? vendorAttributesSnapshot : undefined,
    });

    setShowCreateModal(false);
    setSelectedVendorId('');
    setVendorName('');
    setVendorAttributesSnapshot({});
    setBillNotes('');
    setBillLineItems([
      { id: `bitem-${Date.now()}`, description: 'Facility AMC & Infrastructure Service', amount: 8500, expenseAccountCode: '5010' },
    ]);
  };

  const handlePayBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalBill) return;
    const pmt = parseFloat(paymentAmount) || 0;
    payVendorBill(payModalBill, pmt, bankAccountId || accounts[0]?.id || '');
    setPayModalBill(null);
    setPaymentAmount('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            {tr('Accounts Payable (AP) & Vendor Bills')}
          </h1>
          <p className="text-xs text-slate-400">
            {tr('Track vendor liability bills linked to Vendor Master profiles, capture contract SLA terms, and execute disbursements with double-entry GL ledger updates.')}
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            if (availableVendors.length > 0 && !selectedVendorId) {
              handleSelectVendor(availableVendors[0].id);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-purple-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {tr('Enter Vendor Bill')}
        </button>
      </div>

      {/* AP Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{tr('Total Accounts Payable')}</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {activeTenant.currency} {totalAp.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tr('Pending vendor liabilities')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{tr('Disbursed Cash Payments')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {activeTenant.currency} {paidAp.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tr('Settled vendor payments')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{tr('Overdue Payables Alert')}</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {activeTenant.currency} {overdueAp.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tr('Vendor bills past due date')}</p>
        </div>
      </div>

      {/* Vendor Bills Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">{tr('Vendor Bill Register')}</h2>
          <span className="text-xs text-slate-400 font-mono">{tenantBills.length} {tr('Registered Bills')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-3">{tr('Bill #')}</th>
                <th className="p-3">{tr('Vendor / Service Provider')}</th>
                <th className="p-3">{tr('Bill Date')}</th>
                <th className="p-3">{tr('Due Date')}</th>
                <th className="p-3 text-right">{tr('Total Amount')}</th>
                <th className="p-3 text-right">{tr('Amount Paid')}</th>
                <th className="p-3 text-center">{t('common_status', 'Status')}</th>
                <th className="p-3 text-right">{t('common_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {tenantBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    No vendor bills recorded for {activeTenant.name}. Click "Enter Vendor Bill" above.
                  </td>
                </tr>
              ) : (
                tenantBills.map((bill) => {
                  const isUnpaid = bill.status !== 'PAID';
                  const isExpanded = expandedBillId === bill.id;
                  const snap = bill.vendorAttributesSnapshot || {};

                  return (
                    <React.Fragment key={bill.id}>
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-purple-400 flex items-center gap-2">
                          <button
                            onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                            title="Toggle itemized expense lines"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <span>{bill.billNumber}</span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded font-mono">
                            {bill.items?.length || 1} line(s)
                          </span>
                        </td>
                        <td className="p-3 font-sans font-medium text-slate-200">
                          <div>{bill.vendorName}</div>
                          <div className="text-[10px] text-slate-500">
                            {bill.items && bill.items.length > 0
                              ? bill.items.map((i) => i.description).join(', ')
                              : 'Vendor Expense'}
                          </div>
                        </td>
                        <td className="p-3 text-slate-400">{bill.billDate}</td>
                        <td className="p-3 text-slate-400">{bill.dueDate}</td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          {bill.currency} {bill.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-emerald-400">
                          {bill.currency} {bill.amountPaid.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              bill.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : bill.status === 'APPROVED'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          {isUnpaid ? (
                            <button
                              onClick={() => {
                                setPayModalBill(bill.id);
                                setPaymentAmount(String(bill.totalAmount - bill.amountPaid));
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-semibold shadow transition cursor-pointer"
                            >
                              Pay Bill
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Settled</span>
                          )}
                        </td>
                      </tr>

                      {/* EXPANDED ITEM DETAILS ROW */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={8} className="p-4 space-y-2">
                            <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                              <span>Vendor Bill #{bill.billNumber} — Itemized Expense Allocation</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Total Liability: {bill.currency} {bill.totalAmount.toLocaleString()}
                              </span>
                            </div>

                            {/* Snapshot of Custom Attributes */}
                            {Object.keys(snap).length > 0 && (
                              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 flex-wrap text-xs">
                                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                                  Captured Vendor Contract Snapshot:
                                </span>
                                {Object.entries(snap).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono"
                                  >
                                    <strong className="text-slate-400">{k}:</strong> {String(v)}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                              <table className="w-full text-left text-[11px] text-slate-300">
                                <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[9px]">
                                  <tr>
                                    <th className="p-2">#</th>
                                    <th className="p-2">Expense Line Description</th>
                                    <th className="p-2">GL Expense Account</th>
                                    <th className="p-2 text-right">Line Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                  {bill.items && bill.items.length > 0 ? (
                                    bill.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="p-2 text-slate-500">{idx + 1}</td>
                                        <td className="p-2 text-slate-200 font-sans">{item.description}</td>
                                        <td className="p-2 text-indigo-400">{item.expenseAccountCode}</td>
                                        <td className="p-2 text-right font-bold text-slate-100">
                                          {bill.currency} {item.amount?.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="p-2 text-center text-slate-500">
                                        Single summary item
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Vendor Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  Enter New Vendor Liability Bill
                </h3>
                <p className="text-xs text-slate-400">
                  Select from Vendor Directory or enter supplier details with line item GL distribution.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-5">
              {/* Vendor Selection from Directory */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Vendor Directory Selector
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {availableVendors.length} master suppliers available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => handleSelectVendor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Manual / Custom Vendor --</option>
                      {availableVendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          [{v.code}] {v.name} ({v.category || 'Supplier'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Vendor / Supplier Name"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Vendor Attributes Snapshot */}
                {Object.keys(vendorAttributesSnapshot).length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Contract & SLA Snapshot:
                    </span>
                    {Object.entries(vendorAttributesSnapshot).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[11px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-200 font-mono flex items-center gap-1"
                      >
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-bold">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bill Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* DYNAMIC LINE ITEMS SECTION */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Bill Expense Allocation Lines ({billLineItems.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">Allocate expenses to specific General Ledger accounts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addBillLineItem}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Expense Line</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                  <table className="w-full text-left text-xs text-slate-300 min-w-[500px]">
                    <thead className="text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="pb-2 pl-2">Line Description</th>
                        <th className="pb-2 w-48">GL Expense Account</th>
                        <th className="pb-2 w-32 text-right pr-2">Amount ({activeTenant.currency})</th>
                        <th className="pb-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {billLineItems.map((item, index) => (
                        <tr key={item.id} className="group">
                          <td className="py-2 pl-2 pr-2">
                            <input
                              type="text"
                              required
                              placeholder={`Expense #${index + 1} details`}
                              value={item.description}
                              onChange={(e) => updateBillLineItem(item.id, 'description', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <select
                              value={item.expenseAccountCode}
                              onChange={(e) => updateBillLineItem(item.id, 'expenseAccountCode', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                            >
                              <option value="5010">5010 - Hosting & Infrastructure</option>
                              <option value="5020">5020 - Engineering Staff & Personnel</option>
                              <option value="5030">5030 - Office, Transport & Facilities</option>
                              <option value="5040">5040 - Professional Legal & Advisory</option>
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              required
                              value={item.amount}
                              onChange={(e) => updateBillLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-right font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeBillLineItem(item.id)}
                              disabled={billLineItems.length === 1}
                              className={`p-1.5 rounded transition ${
                                billLineItems.length === 1
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                              }`}
                              title="Remove line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TOTAL SUMMARY */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Total Vendor Payable Liability:</span>
                  <span className="text-purple-400 font-bold text-sm">
                    {activeTenant.currency} {calculatedBillTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
                <span className="font-semibold">Automated Double-Entry Posting:</span> Debit Selected Expense Accounts, Credit Accounts Payable (2010).
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  Record & Post Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {payModalBill && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Disburse Payment for Vendor Bill
            </h3>

            <form onSubmit={handlePayBillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Disbursement Amount ({activeTenant.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Disburse From Bank Account
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                >
                  {accounts
                    .filter((a) => a.type === 'ASSET' && a.code.startsWith('10'))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({activeTenant.currency} {a.balance.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
                <span className="font-semibold">Automated Double-Entry Posting:</span> Debit Accounts Payable (2010), Credit Selected Bank Account.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalBill(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  Disburse & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
