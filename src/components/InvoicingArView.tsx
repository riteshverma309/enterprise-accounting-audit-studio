import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Plus, Receipt, DollarSign, Clock, AlertCircle, CheckCircle2, User, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface LineItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export const InvoicingArView: React.FC = () => {
  const { activeTenant, invoices, createInvoice, receiveInvoicePayment, accounts } = useAccounting();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<string | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Form State for New Invoice
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dueDate, setDueDate] = useState('2026-09-15');
  const [revenueAccCode, setRevenueAccCode] = useState('4010');

  // Dynamic Line Items State
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { id: 'item-1', description: 'Enterprise Cloud Audit Services', quantity: 1, unitPrice: 25000, taxRate: 10 },
  ]);

  // Form State for Payment Receipt
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');

  const tenantInvoices = invoices.filter((i) => i.tenantId === activeTenant.id);

  // Line Item Calculations
  const calculatedItems = lineItems.map((item) => {
    const qty = Math.max(0, item.quantity || 0);
    const price = Math.max(0, item.unitPrice || 0);
    const lineAmt = qty * price;
    const tax = Math.round((lineAmt * ((item.taxRate || 0) / 100)) * 100) / 100;
    return { ...item, quantity: qty, unitPrice: price, amount: lineAmt, taxAmount: tax };
  });

  const calculatedSubtotal = calculatedItems.reduce((acc, curr) => acc + curr.amount, 0);
  const calculatedTaxTotal = calculatedItems.reduce((acc, curr) => acc + curr.taxAmount, 0);
  const calculatedTotalAmount = calculatedSubtotal + calculatedTaxTotal;

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, taxRate: 10 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItemRow, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // AR Metrics
  const totalAr = tenantInvoices.reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);
  const paidAr = tenantInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const overdueAr = tenantInvoices
    .filter((i) => i.status === 'OVERDUE' || (i.status === 'UNPAID' && new Date(i.dueDate) < new Date()))
    .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    createInvoice({
      tenantId: activeTenant.id,
      customerName,
      customerEmail,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      currency: activeTenant.currency,
      items: calculatedItems.map((ci) => ({
        description: ci.description || 'Line Item',
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        amount: ci.amount,
        taxRate: ci.taxRate,
      })),
      subtotal: calculatedSubtotal,
      taxTotal: calculatedTaxTotal,
      totalAmount: calculatedTotalAmount,
      revenueAccountCode: revenueAccCode,
    });

    setShowCreateModal(false);
    setCustomerName('');
    setCustomerEmail('');
    setLineItems([
      { id: `item-${Date.now()}`, description: 'Enterprise Cloud Audit Services', quantity: 1, unitPrice: 25000, taxRate: 10 },
    ]);
  };

  const handleReceivePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    const pmt = parseFloat(paymentAmount) || 0;
    receiveInvoicePayment(paymentModalInvoice, pmt, bankAccountId || accounts[0]?.id || '');
    setPaymentModalInvoice(null);
    setPaymentAmount('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-400" />
            Accounts Receivable (AR) & Customer Invoicing
          </h1>
          <p className="text-xs text-slate-400">
            Issue sub-ledger customer invoices, receive payments, and post automated double-entry GL entries for {activeTenant.name}.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Issue Customer Invoice
        </button>
      </div>

      {/* AR Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total AR Outstanding</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {activeTenant.currency} {totalAr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Uncollected customer balances</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Collected Cash Payments</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {activeTenant.currency} {paidAr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Settled into General Ledger bank accounts</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Overdue Receivables Risk</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {activeTenant.currency} {overdueAr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Invoices past standard payment terms</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Customer Invoice Register</h2>
          <span className="text-xs text-slate-400 font-mono">{tenantInvoices.length} Registered Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-right">Amount Paid</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {tenantInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    No customer invoices found for {activeTenant.name}. Click "Issue Customer Invoice" above.
                  </td>
                </tr>
              ) : (
                tenantInvoices.map((inv) => {
                  const isUnpaid = inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID';
                  const isExpanded = expandedInvoiceId === inv.id;
                  return (
                    <React.Fragment key={inv.id}>
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-indigo-400 flex items-center gap-2">
                          <button
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                            title="Toggle itemized line items"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <span>{inv.invoiceNumber}</span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded font-mono">
                            {inv.items?.length || 1} line(s)
                          </span>
                        </td>
                        <td className="p-3 font-sans font-medium text-slate-200">
                          {inv.customerName}
                          <div className="text-[10px] text-slate-500">{inv.customerEmail}</div>
                        </td>
                        <td className="p-3 text-slate-400">{inv.issueDate}</td>
                        <td className="p-3 text-slate-400">{inv.dueDate}</td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          {inv.currency} {inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-emerald-400">
                          {inv.currency} {inv.amountPaid.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          {isUnpaid ? (
                            <button
                              onClick={() => {
                                setPaymentModalInvoice(inv.id);
                                setPaymentAmount(String(inv.totalAmount - inv.amountPaid));
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold shadow transition cursor-pointer"
                            >
                              Receive Payment
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
                            <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                              <span>Invoice #{inv.invoiceNumber} — Itemized Line Items</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Subtotal: {inv.currency} {inv.subtotal?.toLocaleString() || inv.totalAmount.toLocaleString()} | Tax: {inv.currency} {inv.taxTotal?.toLocaleString() || 0}
                              </span>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                              <table className="w-full text-left text-[11px] text-slate-300">
                                <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[9px]">
                                  <tr>
                                    <th className="p-2">#</th>
                                    <th className="p-2">Item Description</th>
                                    <th className="p-2 text-right">Qty</th>
                                    <th className="p-2 text-right">Unit Price</th>
                                    <th className="p-2 text-right">Tax Rate</th>
                                    <th className="p-2 text-right">Line Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                  {inv.items && inv.items.length > 0 ? (
                                    inv.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="p-2 text-slate-500">{idx + 1}</td>
                                        <td className="p-2 text-slate-200 font-sans">{item.description}</td>
                                        <td className="p-2 text-right">{item.quantity}</td>
                                        <td className="p-2 text-right">{inv.currency} {item.unitPrice?.toLocaleString()}</td>
                                        <td className="p-2 text-right">{item.taxRate || 0}%</td>
                                        <td className="p-2 text-right font-bold text-slate-100">{inv.currency} {item.amount?.toLocaleString()}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={6} className="p-2 text-center text-slate-500">
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

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                  Issue New Customer Invoice
                </h3>
                <p className="text-xs text-slate-400">Add any number of line items with automatic subtotal, tax, and revenue GL posting.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Entity Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Acme Corp or Vanguard LLC"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Billing Email</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="billing@customer.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Revenue Account Code</label>
                  <select
                    value={revenueAccCode}
                    onChange={(e) => setRevenueAccCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="4010">4010 - Core SaaS Revenue</option>
                    <option value="4020">4020 - Consulting Revenue</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC LINE ITEMS SECTION */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Invoice Line Items ({lineItems.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">Specify products, services, quantities, prices, and tax rates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                  <table className="w-full text-left text-xs text-slate-300 min-w-[550px]">
                    <thead className="text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="pb-2 pl-2">Item Description</th>
                        <th className="pb-2 w-20 text-center">Qty</th>
                        <th className="pb-2 w-28 text-right">Unit Price</th>
                        <th className="pb-2 w-20 text-right">Tax Rate %</th>
                        <th className="pb-2 w-28 text-right pr-2">Total Amount</th>
                        <th className="pb-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {calculatedItems.map((item, index) => (
                        <tr key={item.id} className="group">
                          <td className="py-2 pl-2 pr-2">
                            <input
                              type="text"
                              required
                              placeholder={`Item #${index + 1} description`}
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-right font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={item.taxRate}
                              onChange={(e) => updateLineItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-right font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-2 pr-2 text-right font-mono font-bold text-slate-100">
                            {activeTenant.currency} {item.amount.toLocaleString()}
                          </td>
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              disabled={lineItems.length === 1}
                              className={`p-1.5 rounded transition ${
                                lineItems.length === 1
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                              }`}
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TOTALS SUMMARY */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>{activeTenant.currency} {calculatedSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Calculated Tax Total:</span>
                    <span>{activeTenant.currency} {calculatedTaxTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total Amount Due:</span>
                    <span className="text-indigo-400">{activeTenant.currency} {calculatedTotalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-[11px] text-indigo-300">
                <span className="font-semibold">Automated Double-Entry Posting:</span> Debit Accounts Receivable (1100), Credit Revenue Account ({revenueAccCode}), Credit Tax Liability Account.
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Issue & Post Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Receive Payment for Invoice
            </h3>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Amount ({activeTenant.currency})
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit To Bank Account</label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  {accounts
                    .filter((a) => a.type === 'ASSET')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({a.currency})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Confirm Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
