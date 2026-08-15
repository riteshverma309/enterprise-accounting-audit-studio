import React, { useState, useMemo, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  X,
  DollarSign,
  Receipt,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Percent,
} from 'lucide-react';
import { PaymentMethodType } from '../types';

interface ReceiveCustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCustomerId?: string;
  preSelectedInvoiceId?: string;
}

interface AllocationRowState {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  isOpeningBalance?: boolean;
  allocatedAmount: number;
  discountAmount: number;
}

export const ReceiveCustomerPaymentModal: React.FC<ReceiveCustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  preSelectedCustomerId,
  preSelectedInvoiceId,
}) => {
  const {
    activeTenant,
    customers,
    invoices,
    accounts,
    recordCustomerPaymentReceipt,
  } = useAccounting();

  // Find bank accounts
  const bankAccounts = useMemo(() => {
    return accounts.filter(
      (a) => a.type === 'ASSET' && (a.code.startsWith('10') || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash'))
    );
  }, [accounts]);

  const defaultBankAcc = bankAccounts[0]?.id || (accounts[0]?.id ?? '');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preSelectedCustomerId || '');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('BANK_TRANSFER');
  const [bankAccountId, setBankAccountId] = useState<string>(defaultBankAcc);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [totalAmountReceived, setTotalAmountReceived] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [allocations, setAllocations] = useState<AllocationRowState[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync customer selection when modal opens or prop changes
  useEffect(() => {
    if (preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [preSelectedCustomerId, customers, isOpen]);

  // Sync bank account default
  useEffect(() => {
    if (bankAccounts.length > 0 && (!bankAccountId || !bankAccounts.some((b) => b.id === bankAccountId))) {
      setBankAccountId(bankAccounts[0].id);
    }
  }, [bankAccounts, bankAccountId]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Load unpaid / partially paid invoices for the selected customer
  useEffect(() => {
    if (!selectedCustomerId) {
      setAllocations([]);
      return;
    }

    const custInvoices = invoices.filter((inv) => {
      const matchCust = inv.customerId === selectedCustomerId || (selectedCustomer && inv.customerName.toLowerCase() === selectedCustomer.name.toLowerCase());
      const matchTenant = inv.tenantId === activeTenant.id;
      const hasBalance = inv.totalAmount - inv.amountPaid > 0.001;
      return matchCust && matchTenant && hasBalance;
    });

    // Sort by due date ascending (oldest first)
    custInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const initialRows: AllocationRowState[] = custInvoices.map((inv) => {
      const rem = Math.max(0, inv.totalAmount - inv.amountPaid);
      const isTarget = preSelectedInvoiceId && inv.id === preSelectedInvoiceId;
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        remainingBalance: rem,
        isOpeningBalance: inv.isOpeningBalance,
        allocatedAmount: isTarget ? rem : 0,
        discountAmount: 0,
      };
    });

    setAllocations(initialRows);

    if (preSelectedInvoiceId) {
      const target = initialRows.find((r) => r.invoiceId === preSelectedInvoiceId);
      if (target) {
        setTotalAmountReceived(target.remainingBalance);
      }
    }
  }, [selectedCustomerId, selectedCustomer, invoices, activeTenant.id, preSelectedInvoiceId, isOpen]);

  // Calculations
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, r) => sum + (Number(r.allocatedAmount) || 0), 0);
  }, [allocations]);

  const totalDiscount = useMemo(() => {
    return allocations.reduce((sum, r) => sum + (Number(r.discountAmount) || 0), 0);
  }, [allocations]);

  const unallocatedCredit = useMemo(() => {
    return Math.max(0, totalAmountReceived - totalAllocated);
  }, [totalAmountReceived, totalAllocated]);

  const totalCustomerOutstanding = useMemo(() => {
    return allocations.reduce((sum, r) => sum + r.remainingBalance, 0);
  }, [allocations]);

  // Auto Allocate Oldest First (FIFO)
  const handleAutoAllocateFifo = () => {
    let remainingToAllocate = totalAmountReceived;
    const updated = allocations.map((row) => {
      if (remainingToAllocate <= 0) {
        return { ...row, allocatedAmount: 0, discountAmount: 0 };
      }
      const canAlloc = Math.min(row.remainingBalance, remainingToAllocate);
      remainingToAllocate -= canAlloc;
      return {
        ...row,
        allocatedAmount: Math.round(canAlloc * 100) / 100,
      };
    });
    setAllocations(updated);
  };

  // Pay single invoice in full
  const handlePayInFullToggle = (invoiceId: string) => {
    setAllocations((prev) =>
      prev.map((row) => {
        if (row.invoiceId !== invoiceId) return row;
        const isAlreadyFull = Math.abs(row.allocatedAmount + row.discountAmount - row.remainingBalance) < 0.01;
        const newAlloc = isAlreadyFull ? 0 : Math.max(0, row.remainingBalance - row.discountAmount);
        return {
          ...row,
          allocatedAmount: Math.round(newAlloc * 100) / 100,
        };
      })
    );
  };

  // Update allocation amount on a row
  const handleRowAllocChange = (invoiceId: string, val: number) => {
    setAllocations((prev) =>
      prev.map((row) => {
        if (row.invoiceId !== invoiceId) return row;
        const capped = Math.min(row.remainingBalance - row.discountAmount, Math.max(0, val));
        return {
          ...row,
          allocatedAmount: Math.round(capped * 100) / 100,
        };
      })
    );
  };

  // Update discount amount on a row
  const handleRowDiscountChange = (invoiceId: string, val: number) => {
    setAllocations((prev) =>
      prev.map((row) => {
        if (row.invoiceId !== invoiceId) return row;
        const cappedDisc = Math.min(row.remainingBalance - row.allocatedAmount, Math.max(0, val));
        return {
          ...row,
          discountAmount: Math.round(cappedDisc * 100) / 100,
        };
      })
    );
  };

  // Handle Submit & Post Receipt
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer to receive payment from.');
      return;
    }

    if (totalAmountReceived <= 0) {
      setErrorMsg('Please enter a valid Payment Amount Received (> 0).');
      return;
    }

    if (!bankAccountId) {
      setErrorMsg('Please choose the destination Bank / Cash Account.');
      return;
    }

    if (totalAllocated > totalAmountReceived) {
      setErrorMsg(`Allocated amount (${totalAllocated.toFixed(2)}) exceeds Total Amount Received (${totalAmountReceived.toFixed(2)}).`);
      return;
    }

    const filteredAllocations = allocations
      .filter((r) => r.allocatedAmount > 0 || r.discountAmount > 0)
      .map((r) => ({
        invoiceId: r.invoiceId,
        invoiceNumber: r.invoiceNumber,
        allocatedAmount: r.allocatedAmount,
        discountAmount: r.discountAmount,
      }));

    const res = recordCustomerPaymentReceipt({
      customerId: selectedCustomerId,
      paymentDate,
      paymentMethod,
      bankAccountId,
      referenceNumber: referenceNumber.trim() || undefined,
      totalAmountReceived,
      allocations: filteredAllocations,
      notes: notes.trim() || undefined,
    });

    if (res.success && res.receipt) {
      setSuccessBanner(`Payment Receipt #${res.receipt.receiptNumber} successfully posted!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Failed to record payment receipt.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="receive-payment-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Receive Customer Payment
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">
                  AR Multi-Invoice Settlement
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Post customer funds received, apply across outstanding invoices or FY opening balances, and create double-entry GL ledger vouchers.
              </p>
            </div>
          </div>
          <button
            id="close-receive-payment-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Primary Receipt Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Customer Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <select
                id="payment-customer-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ''}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
                  <span>{selectedCustomer.category}</span>
                  <span className="font-semibold text-slate-700">
                    Total Due: {activeTenant.currency} {totalCustomerOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Total Amount Received */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Amount Received ({activeTenant.currency}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">{activeTenant.currency}</span>
                <input
                  id="payment-total-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={totalAmountReceived || ''}
                  onChange={(e) => setTotalAmountReceived(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTotalAmountReceived(totalCustomerOutstanding)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  Pay All Outstanding ({totalCustomerOutstanding.toFixed(2)})
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                id="payment-date-input"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                id="payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="BANK_TRANSFER">Bank Wire / Electronic Transfer</option>
                <option value="ACH">Direct ACH Debit / Direct Deposit</option>
                <option value="CHECK">Paper Check / Cheque Voucher</option>
                <option value="CREDIT_CARD">Credit Card / Gateway Settlement</option>
                <option value="UPI">UPI / Instant QR Payment</option>
                <option value="CASH">Cash Over Counter</option>
                <option value="OTHER">Other / Clearing House</option>
              </select>
            </div>

            {/* Receiving Bank Account */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deposit to Account (GL Debit) <span className="text-red-500">*</span>
              </label>
              <select
                id="payment-bank-account-select"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference / Check # */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reference / Check / UTR Number
              </label>
              <input
                id="payment-reference-input"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. WIRE-9941, CHK-1082"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Allocation Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Invoice Settlement Allocations
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {allocations.length} Unpaid / Open Invoices
                </span>
              </div>

              {allocations.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="auto-allocate-fifo-btn"
                    onClick={handleAutoAllocateFifo}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Allocate Oldest (FIFO)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAllocations((prev) => prev.map((r) => ({ ...r, allocatedAmount: 0, discountAmount: 0 })));
                    }}
                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {allocations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                <p className="text-sm font-medium">No open invoices or opening balances found for this customer.</p>
                <p className="text-xs mt-1 text-slate-400">
                  Any amount entered ({activeTenant.currency} {totalAmountReceived.toFixed(2)}) will be recorded as an unallocated Customer Advance / Credit Deposit on account.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Invoice Details</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Original Amount</th>
                      <th className="p-3 text-right">Already Paid</th>
                      <th className="p-3 text-right">Remaining Due</th>
                      <th className="p-3 w-32 text-right">Payment Allocated</th>
                      <th className="p-3 w-28 text-right">Discount / Write-off</th>
                      <th className="p-3 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allocations.map((row) => {
                      const isFull = Math.abs(row.allocatedAmount + row.discountAmount - row.remainingBalance) < 0.01;
                      const isPastDue = new Date(row.dueDate) < new Date(paymentDate);

                      return (
                        <tr key={row.invoiceId} className={`hover:bg-slate-50/80 transition ${isFull ? 'bg-emerald-50/30' : ''}`}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {row.invoiceNumber}
                              {row.isOpeningBalance && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                                  FY Opening
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">Issued: {row.issueDate}</div>
                          </td>

                          <td className="p-3">
                            <div className={`font-medium ${isPastDue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                              {row.dueDate}
                            </div>
                            {isPastDue && (
                              <span className="text-[10px] text-rose-500 font-semibold">Overdue</span>
                            )}
                          </td>

                          <td className="p-3 text-right font-medium text-slate-700">
                            {activeTenant.currency} {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right text-slate-500">
                            {activeTenant.currency} {row.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right font-bold text-slate-900">
                            {activeTenant.currency} {row.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={row.remainingBalance}
                              value={row.allocatedAmount || ''}
                              onChange={(e) => handleRowAllocChange(row.invoiceId, parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={row.remainingBalance - row.allocatedAmount}
                              value={row.discountAmount || ''}
                              onChange={(e) => handleRowDiscountChange(row.invoiceId, parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handlePayInFullToggle(row.invoiceId)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                                isFull
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isFull ? 'Paid in Full' : 'Pay Full'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Real-Time Allocation & Double Entry Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Summary KPI Panel */}
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Settlement Financial Summary</div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total Received from Customer:</span>
                <span className="font-bold text-white">{activeTenant.currency} {totalAmountReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Total Applied to Invoices:</span>
                <span className="font-bold">{activeTenant.currency} {totalAllocated.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-xs text-amber-400">
                  <span>Early Settlement Discounts Allowed:</span>
                  <span className="font-bold">{activeTenant.currency} {totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                <span className="text-slate-300">Unallocated Advance / Credit Balance:</span>
                <span className={`font-bold ${unallocatedCredit > 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {activeTenant.currency} {unallocatedCredit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Double-Entry Preview Panel */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Automatic GL Journal Voucher Impact
              </div>
              <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>[DR] Bank / Cash ({bankAccounts.find((b) => b.id === bankAccountId)?.code || '1010'})</span>
                  <span className="text-emerald-700 font-bold">+{activeTenant.currency} {totalAmountReceived.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>[DR] Sales Discount Allowed (4090)</span>
                    <span className="font-bold">+{activeTenant.currency} {totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700">
                  <span>[CR] Accounts Receivable (1100)</span>
                  <span className="font-bold">-{activeTenant.currency} {(totalAllocated + totalDiscount).toFixed(2)}</span>
                </div>
                {unallocatedCredit > 0 && (
                  <div className="flex justify-between text-cyan-700">
                    <span>[CR] Customer Advances & Deposits (2150)</span>
                    <span className="font-bold">+{activeTenant.currency} {unallocatedCredit.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Settlement Notes & Remittance Details
            </label>
            <input
              id="payment-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wire transfer confirmed via JPMorgan Treasury Portal. Batch #8812."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            id="submit-receive-payment-btn"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Post Payment Receipt & Update Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
