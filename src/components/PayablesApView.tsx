import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Plus, CreditCard, DollarSign, AlertCircle, CheckCircle2, Building, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface BillLineItemRow {
  id: string;
  description: string;
  amount: number;
  expenseAccountCode: string;
}

export const PayablesApView: React.FC = () => {
  const { activeTenant, vendorBills, createVendorBill, payVendorBill, accounts } = useAccounting();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payModalBill, setPayModalBill] = useState<string | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  // Form State for New Vendor Bill
  const [vendorName, setVendorName] = useState('');
  const [dueDate, setDueDate] = useState('2026-08-25');

  // Dynamic Line Items State
  const [billLineItems, setBillLineItems] = useState<BillLineItemRow[]>([
    { id: 'bitem-1', description: 'Data Cloud Infrastructure Hosting', amount: 18500, expenseAccountCode: '5010' },
  ]);

  // Form State for Payment Disbursement
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');

  const tenantBills = vendorBills.filter((b) => b.tenantId === activeTenant.id);

  // Bill Calculations
  const calculatedBillTotal = billLineItems.reduce((acc, curr) => acc + (Math.max(0, curr.amount || 0)), 0);

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
    });

    setShowCreateModal(false);
    setVendorName('');
    setBillLineItems([
      { id: `bitem-${Date.now()}`, description: 'Data Cloud Infrastructure Hosting', amount: 18500, expenseAccountCode: '5010' },
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
            Accounts Payable (AP) & Vendor Bills
          </h1>
          <p className="text-xs text-slate-400">
            Track vendor liability bills, schedule payments, and execute disbursements with double-entry GL ledger updates for {activeTenant.name}.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-purple-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Enter Vendor Bill
        </button>
      </div>

      {/* AP Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Accounts Payable</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {activeTenant.currency} {totalAp.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pending vendor liabilities</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Disbursed Cash Payments</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {activeTenant.currency} {paidAp.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Settled vendor payments</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Overdue Payables Alert</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {activeTenant.currency} {overdueAp.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Vendor bills past due date</p>
        </div>
      </div>

      {/* Vendor Bills Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Vendor Bill Register</h2>
          <span className="text-xs text-slate-400 font-mono">{tenantBills.length} Registered Bills</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Bill #</th>
                <th className="p-3">Vendor / Service Provider</th>
                <th className="p-3">Bill Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-right">Amount Paid</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
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
                          {bill.vendorName}
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
                              <span>Bill #{bill.billNumber} — Itemized Expense Lines</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Total Bill Liability: {bill.currency} {bill.totalAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                              <table className="w-full text-left text-[11px] text-slate-300">
                                <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[9px]">
                                  <tr>
                                    <th className="p-2">#</th>
                                    <th className="p-2">Expense Line Description</th>
                                    <th className="p-2 font-mono">Account Code</th>
                                    <th className="p-2 text-right">Line Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                  {bill.items && bill.items.length > 0 ? (
                                    bill.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="p-2 text-slate-500">{idx + 1}</td>
                                        <td className="p-2 text-slate-200 font-sans">{item.description}</td>
                                        <td className="p-2 font-mono text-purple-300">{item.expenseAccountCode || '5010'}</td>
                                        <td className="p-2 text-right font-bold text-slate-100">{bill.currency} {item.amount.toLocaleString()}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="p-2 text-center text-slate-500">
                                        Single summary bill expense
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

      {/* Create Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  Record Vendor Liability Bill
                </h3>
                <p className="text-xs text-slate-400">Add any number of expense lines with dedicated GL account codes.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor / Supplier Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="e.g. Amazon Web Services or Snowflake"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* DYNAMIC EXPENSE LINE ITEMS SECTION */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Bill Expense Lines ({billLineItems.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">Specify item description, amount, and expense GL code.</p>
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
                              placeholder={`Expense line #${index + 1} description`}
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
                              <option value="5010">5010 - Hosting & Infra</option>
                              <option value="5020">5020 - Engineering Staff</option>
                              <option value="5030">5030 - Office & Equipment</option>
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
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
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 font-bold">Total Bill Liability Amount:</span>
                  <span className="text-purple-400 font-bold text-sm">
                    {activeTenant.currency} {calculatedBillTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
                <span className="font-semibold">Automated Double-Entry Posting:</span> Debit Expense Account(s), Credit Accounts Payable (2010).
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
              <DollarSign className="w-5 h-5 text-purple-400" />
              Disburse Payment for Vendor Bill
            </h3>

            <form onSubmit={handlePayBillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Disbursement Amount ({activeTenant.currency})
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Disburse From Bank Account</label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
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
                  onClick={() => setPayModalBill(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
