import React, { useState, useMemo } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import {
  Search,
  Filter,
  User,
  Building2,
  DollarSign,
  Receipt,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Mail,
  Download,
  CreditCard,
  Layers,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  FileText,
  SlidersHorizontal,
  X,
  Eye,
  RotateCcw,
  Tag,
  Phone,
  MapPin,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { CustomerContact, CustomerInvoice, CustomerPaymentReceipt, CustomerLedgerTransaction } from '../types';
import { ReceiveCustomerPaymentModal } from './ReceiveCustomerPaymentModal';
import { CustomerOpeningBalanceModal } from './CustomerOpeningBalanceModal';
import {
  exportSingleCustomerStatementToExcel,
  exportArAgingScheduleToExcel,
  exportInvoicesToExcel,
  downloadCsvFile,
} from '../utils/excelExport';

interface CustomerArStatementViewProps {
  initialCustomerId?: string | null;
  onNavigateToCreateInvoice?: (customer?: CustomerContact) => void;
}

export const CustomerArStatementView: React.FC<CustomerArStatementViewProps> = ({ initialCustomerId,
  onNavigateToCreateInvoice,
}) => {
  const { tr, t } = useLanguage();
  const {
    activeTenant,
    customers,
    invoices,
    paymentReceipts,
    openingBalances,
    getCustomerStatementData,
    voidPaymentReceipt,
  } = useAccounting();

  // Search & Filters for Customers
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'HAS_BALANCE' | 'OVERDUE' | 'ZERO_BALANCE'>('ALL');

  // Selected Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    if (initialCustomerId) return initialCustomerId;
    if (customers.length > 0) return customers[0].id;
    return '';
  });

  // Statement Tab (Ledger vs Invoices vs Payments)
  const [statementSubTab, setStatementSubTab] = useState<'LEDGER' | 'INVOICES' | 'PAYMENTS'>('LEDGER');

  // Date Range Filter
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | 'FY' | '30D' | '90D' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<string | undefined>(undefined);
  const [showPrintStatementModal, setShowPrintStatementModal] = useState(false);
  const [viewReceiptDetails, setViewReceiptDetails] = useState<CustomerPaymentReceipt | null>(null);

  // Compute customer summaries for search list
  const customersWithMetrics = useMemo(() => {
    return customers.map((c) => {
      const data = getCustomerStatementData(c.id);
      return {
        ...c,
        metrics: data.metrics,
        invoiceCount: data.invoices.length,
        paymentCount: data.paymentReceipts.length,
      };
    });
  }, [customers, getCustomerStatementData, invoices, paymentReceipts, openingBalances, activeTenant.id]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customersWithMetrics.filter((c) => {
      // Search matching
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.code && c.code.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.category && c.category.toLowerCase().includes(term));

      // Category matching
      const matchCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

      // Balance filter
      let matchBalance = true;
      if (balanceFilter === 'HAS_BALANCE') {
        matchBalance = c.metrics.netOutstanding > 0.01;
      } else if (balanceFilter === 'OVERDUE') {
        matchBalance = c.metrics.overdueAmount > 0.01;
      } else if (balanceFilter === 'ZERO_BALANCE') {
        matchBalance = c.metrics.netOutstanding <= 0.01;
      }

      return matchSearch && matchCategory && matchBalance;
    });
  }, [customersWithMetrics, searchTerm, categoryFilter, balanceFilter]);

  // Categories list for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [customers]);

  // Active customer statement data
  const dateRangeParams = useMemo(() => {
    if (dateRangePreset === 'ALL') return undefined;
    if (dateRangePreset === 'FY') return { startDate: '2026-04-01', endDate: '2027-03-31' };
    if (dateRangePreset === '30D') return { startDate: '2026-07-14', endDate: '2026-08-13' };
    if (dateRangePreset === '90D') return { startDate: '2026-05-14', endDate: '2026-08-13' };
    if (dateRangePreset === 'CUSTOM') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    return undefined;
  }, [dateRangePreset, customStartDate, customEndDate]);

  const statementData = useMemo(() => {
    if (!selectedCustomerId) return null;
    return getCustomerStatementData(selectedCustomerId, dateRangeParams);
  }, [selectedCustomerId, getCustomerStatementData, dateRangeParams, invoices, paymentReceipts, openingBalances, activeTenant.id]);

  // Selected customer object
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Void receipt handler
  const handleVoidReceipt = (receiptId: string) => {
    const confirmed = window.confirm('Are you sure you want to void this payment receipt? This will reverse all applied invoice settlements and generate a reversing journal entry.');
    if (confirmed) {
      voidPaymentReceipt(receiptId, 'User voided from Customer Statement');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">{tr('AR Customer 360')}</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{tr('Consolidated AR & Payment Settlement Engine')}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">{tr('Consolidated Customer AR & Statements')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tr('Single-pane view for individual customer balances, fiscal year opening carryforwards, invoices, and multi-invoice payment receipts.')}</p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="global-export-aging-schedule-btn"
            onClick={() =>
              exportArAgingScheduleToExcel({
                tenant: activeTenant,
                customers,
                invoices,
                paymentReceipts,
                openingBalances,
                getCustomerStatementData,
                asOfDate: '2026-08-14',
              })
            }
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title={tr('Export full portfolio AR Aging matrix & detailed schedule to Microsoft Excel (.xlsx)')}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />{tr('Export Aging Schedule (.xlsx)')}</button>

          <button
            id="open-record-opening-balance-btn"
            onClick={() => setShowOpeningModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-amber-600" />{tr('Record FY Opening Balance')}</button>

          <button
            id="open-receive-payment-btn"
            onClick={() => {
              setTargetInvoiceForPayment(undefined);
              setShowPaymentModal(true);
            }}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" />{tr('Receive Customer Payment')}</button>
        </div>
      </div>

      {/* Main Split Layout: Customer Browser (Left) & Customer 360 Statement (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Search & Filter Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col max-h-[850px]">
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {tr('Customer Directory')} ({filteredCustomers.length})
              </span>
              <span className="text-[11px] text-slate-500">
                {activeTenant.name}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="customer-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tr('Search name, code, email, flat #...')}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 gap-2">
              <select
                id="customer-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">{tr('All Categories')}</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                id="customer-balance-filter"
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">{tr('All Balances')}</option>
                <option value="HAS_BALANCE">{tr('Has Open Balance')}</option>
                <option value="OVERDUE">{tr('Overdue Only')}</option>
                <option value="ZERO_BALANCE">{tr('Fully Settled')}</option>
              </select>
            </div>
          </div>

          {/* Customer Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">{tr('No matching customers found.')}</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('ALL');
                    setBalanceFilter('ALL');
                  }}
                  className="mt-2 text-xs text-emerald-600 hover:underline"
                >{tr('Reset search filters')}</button>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                const hasOverdue = c.metrics.overdueAmount > 0.01;
                const hasBalance = c.metrics.netOutstanding > 0.01;

                return (
                  <button
                    key={c.id}
                    id={`customer-select-card-${c.id}`}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50/80 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[200px]">
                        {c.name}
                      </span>
                      {c.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {c.code}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{c.category}</span>
                      <span className="text-slate-400">{c.invoiceCount} {tr('invoices')}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-xs">
                      <span className="text-slate-500 text-[11px]">{tr('Outstanding AR:')}</span>
                      <div className="flex items-center gap-1.5 font-bold font-mono">
                        <span className={hasOverdue ? 'text-rose-600' : hasBalance ? 'text-slate-900' : 'text-emerald-600'}>
                          {activeTenant.currency} {c.metrics.netOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {hasOverdue && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-sans font-semibold">{tr('Overdue')}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Customer 360 Consolidated Statement (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!activeCustomer || !statementData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <h3 className="text-base font-semibold text-slate-700">{tr('Select a customer')}</h3>
              <p className="text-xs text-slate-400 mt-1">{tr('Choose a customer from the left directory to inspect invoices, payments, opening balances, and run full ledger statements.')}</p>
            </div>
          ) : (
            <>
              {/* Customer Profile Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                      {activeCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{activeCustomer.name}</h2>
                        {activeCustomer.code && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                            {activeCustomer.code}
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                          {activeCustomer.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                        {activeCustomer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {activeCustomer.email}
                          </span>
                        )}
                        {activeCustomer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {activeCustomer.phone}
                          </span>
                        )}
                        {activeCustomer.billingAddress && (
                          <span className="flex items-center gap-1 truncate max-w-xs" title={activeCustomer.billingAddress}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {activeCustomer.billingAddress}
                          </span>
                        )}
                      </div>

                      {/* Custom Attributes Tags */}
                      {activeCustomer.customAttributes && Object.keys(activeCustomer.customAttributes).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {Object.entries(activeCustomer.customAttributes).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60 font-medium"
                            >
                              <strong className="font-semibold text-slate-900">{key.replace(/_/g, ' ')}:</strong> {String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Customer Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        id="customer-export-statement-excel-btn"
                        onClick={() =>
                          exportSingleCustomerStatementToExcel({
                            tenant: activeTenant,
                            customer: activeCustomer,
                            statementData,
                            asOfDate: '2026-08-14',
                          })
                        }
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title={tr('Export this customer\'s statement, ledger, and aging to Microsoft Excel (.xlsx)')}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />{tr('Export to Excel')}</button>

                      <button
                        id="customer-action-receive-payment-btn"
                        onClick={() => {
                          setTargetInvoiceForPayment(undefined);
                          setShowPaymentModal(true);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />{tr('Receive Payment')}</button>

                      <button
                        id="customer-action-new-invoice-btn"
                        onClick={() => {
                          if (onNavigateToCreateInvoice) {
                            onNavigateToCreateInvoice(activeCustomer);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />{tr('New Invoice')}</button>

                      <button
                        id="customer-print-statement-btn"
                        onClick={() => setShowPrintStatementModal(true)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
                        title={tr('Print / View Formal Statement')}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                </div>

                {/* 5 Financial Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{tr('Total Invoiced')}</div>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {activeTenant.currency} {statementData.metrics.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{statementData.invoices.length} {tr('invoices')}</div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">{tr('Payments Received')}</div>
                    <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                      {activeTenant.currency} {statementData.metrics.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">{statementData.paymentReceipts.length} {tr('receipts')}</div>
                  </div>

                  <div className={`p-3 rounded-xl shadow-2xs ${statementData.metrics.isCreditBalance ? 'bg-purple-900 text-white' : 'bg-slate-900 text-white'}`}>
                    <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      {statementData.metrics.isCreditBalance ? tr('Net Credit Balance (Overpaid)') : tr('Net Outstanding')}
                    </div>
                    <div className="text-base font-bold font-mono mt-0.5 flex items-center gap-1.5">
                      <span>
                        {activeTenant.currency} {Math.abs(statementData.metrics.netBalance ?? statementData.metrics.netOutstanding).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {statementData.metrics.isCreditBalance && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/40 text-purple-200 font-sans font-bold">
                          CR
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {statementData.metrics.isCreditBalance ? tr('Customer Advance / Overpayment') : tr('Current Balance Due')}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${statementData.metrics.overdueAmount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-wider ${statementData.metrics.overdueAmount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>{tr('Overdue Arrears')}</div>
                    <div className={`text-base font-bold font-mono mt-0.5 ${statementData.metrics.overdueAmount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                      {activeTenant.currency} {statementData.metrics.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${statementData.metrics.overdueAmount > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>{tr('Past Due Date')}</div>
                  </div>

                  <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100">
                    <div className="text-[11px] font-semibold text-cyan-800 uppercase tracking-wider">{tr('Available Advances')}</div>
                    <div className="text-base font-bold text-cyan-700 font-mono mt-0.5">
                      {activeTenant.currency} {statementData.metrics.totalAdvanceCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-cyan-600 mt-0.5">{tr('Unallocated Credits')}</div>
                  </div>
                </div>

                {/* Aging Breakdown Bar */}
                {statementData.metrics.netOutstanding > 0 && (
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />{tr('AR Aging Breakdown (as of August 2026)')}</span>
                      <span className="text-[11px] text-slate-500">
                        {tr('Terms:')} {activeCustomer.paymentTermsDays ? `${tr('Net')} ${activeCustomer.paymentTermsDays} ${tr('Days')}` : tr('Due on Receipt')}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-medium">{tr('Current (Not Due)')}</div>
                        <div className="font-bold text-slate-800 font-mono mt-0.5">
                          {activeTenant.currency} {statementData.metrics.aging.current.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-amber-700 font-medium">{tr('1 - 30 Days')}</div>
                        <div className="font-bold text-amber-800 font-mono mt-0.5">
                          {activeTenant.currency} {statementData.metrics.aging.days1To30.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-orange-700 font-medium">{tr('31 - 60 Days')}</div>
                        <div className="font-bold text-orange-800 font-mono mt-0.5">
                          {activeTenant.currency} {statementData.metrics.aging.days31To60.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-rose-700 font-medium">{tr('61 - 90 Days')}</div>
                        <div className="font-bold text-rose-800 font-mono mt-0.5">
                          {activeTenant.currency} {statementData.metrics.aging.days61To90.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                        <div className="text-[10px] text-red-800 font-medium">{tr('90+ Days')}</div>
                        <div className="font-bold text-red-900 font-mono mt-0.5">
                          {activeTenant.currency} {statementData.metrics.aging.days90Plus.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Statement Sub-tabs & Date Filter Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Sub-tabs */}
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                    <button
                      id="statement-subtab-ledger"
                      onClick={() => setStatementSubTab('LEDGER')}
                      className={`px-3.5 py-1.5 rounded-lg transition ${
                        statementSubTab === 'LEDGER'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tr('Consolidated Account Ledger')} ({statementData.transactions.length})
                    </button>
                    <button
                      id="statement-subtab-invoices"
                      onClick={() => setStatementSubTab('INVOICES')}
                      className={`px-3.5 py-1.5 rounded-lg transition ${
                        statementSubTab === 'INVOICES'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tr('Invoices & Open Balances')} ({statementData.invoices.length})
                    </button>
                    <button
                      id="statement-subtab-payments"
                      onClick={() => setStatementSubTab('PAYMENTS')}
                      className={`px-3.5 py-1.5 rounded-lg transition ${
                        statementSubTab === 'PAYMENTS'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tr('Payment Receipts')} ({statementData.paymentReceipts.length})
                    </button>
                  </div>

                  {/* Date Range Selector & Export */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">{tr('Period:')}</span>
                    <select
                      id="statement-daterange-select"
                      value={dateRangePreset}
                      onChange={(e) => setDateRangePreset(e.target.value as any)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ALL">{tr('All Time')}</option>
                      <option value="FY">{tr('Current FY (2026-2027)')}</option>
                      <option value="30D">{tr('Last 30 Days')}</option>
                      <option value="90D">{tr('Last 90 Days')}</option>
                      <option value="CUSTOM">{tr('Custom Date Range')}</option>
                    </select>

                    {dateRangePreset === 'CUSTOM' && (
                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                        <span className="text-slate-400">{tr('to')}</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                    )}

                    <button
                      id="statement-quick-export-excel-btn"
                      onClick={() =>
                        exportSingleCustomerStatementToExcel({
                          tenant: activeTenant,
                          customer: activeCustomer,
                          statementData,
                          asOfDate: '2026-08-14',
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
                      title={tr('Export this statement to Excel (.xlsx)')}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{tr('Export (.xlsx)')}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab 1: Consolidated Ledger Table */}
                {statementSubTab === 'LEDGER' && (
                  <div>
                    {statementData.transactions.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">{tr('No ledger transactions found for this period.')}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-3 w-28">{tr('Date')}</th>
                              <th className="p-3 w-28">{tr('Type')}</th>
                              <th className="p-3 w-32">{tr('Reference #')}</th>
                              <th className="p-3">{tr('Description / Remittance')}</th>
                              <th className="p-3 w-24">{tr('Due Date')}</th>
                              <th className="p-3 text-right w-28">{tr('Debit (Billed)')}</th>
                              <th className="p-3 text-right w-28">{tr('Credit (Paid)')}</th>
                              <th className="p-3 text-right w-32">{tr('Running Balance')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {statementData.transactions.map((tx) => {
                              const isOpening = tx.type === 'OPENING_BALANCE';
                              const isPayment = tx.type === 'PAYMENT';

                              return (
                                <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                                  <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                                    {tx.date}
                                  </td>

                                  <td className="p-3 whitespace-nowrap">
                                    {isOpening && (
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                          tx.balanceType === 'CR' || tx.credit > 0
                                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {tx.balanceType === 'CR' || tx.credit > 0
                                          ? tr('FY Opening (Advance/Overpaid)')
                                          : tr('FY Opening (Receivable)')}
                                      </span>
                                    )}
                                    {tx.type === 'INVOICE' && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">{tr('Invoice')}</span>
                                    )}
                                    {isPayment && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{tr('Payment')}</span>
                                    )}
                                  </td>

                                  <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                    {tx.referenceNumber}
                                  </td>

                                  <td className="p-3 text-slate-700">
                                    <div className="font-medium line-clamp-1">{tx.description}</div>
                                    {isPayment && tx.allocations && tx.allocations.length > 0 && (
                                      <div className="text-[11px] text-slate-400 mt-0.5">
                                        Applied to: {tx.allocations.map((a) => `${a.invoiceNumber} (${activeTenant.currency} ${a.allocatedAmount})`).join(', ')}
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-3 text-slate-500 whitespace-nowrap">
                                    {tx.dueDate || '-'}
                                  </td>

                                  <td className="p-3 text-right font-medium text-slate-900 whitespace-nowrap">
                                    {tx.debit > 0 ? (
                                      <span>{activeTenant.currency} {tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>

                                  <td className="p-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                                    {tx.credit > 0 ? (
                                      <span>{activeTenant.currency} {tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>

                                  <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                                    <span className={tx.runningBalance < 0 ? 'text-purple-700 font-extrabold' : 'text-slate-900'}>
                                      {activeTenant.currency} {Math.abs(tx.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      {tx.runningBalance < 0 ? ' CR' : ''}
                                    </span>
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

                {/* Sub-tab 2: Invoices & FY Opening Balances Table */}
                {statementSubTab === 'INVOICES' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">{tr('Invoice / Ref #')}</th>
                          <th className="p-3">{tr('Issue Date')}</th>
                          <th className="p-3">{tr('Due Date')}</th>
                          <th className="p-3 text-right">{tr('Total Amount')}</th>
                          <th className="p-3 text-right">{tr('Amount Paid')}</th>
                          <th className="p-3 text-right">{tr('Remaining Due')}</th>
                          <th className="p-3 text-center">{tr('Status')}</th>
                          <th className="p-3 text-right w-28">{tr('Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {statementData.invoices.map((inv) => {
                          const rem = Math.max(0, inv.totalAmount - inv.amountPaid);
                          const isOverdue = inv.status === 'OVERDUE' || (rem > 0 && new Date(inv.dueDate) < new Date('2026-08-13'));
                          const isSettled = rem <= 0.001;

                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                                  {inv.isOpeningBalance && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">{tr('FY Opening')}</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {inv.items?.map((it) => it.description).join(', ') || inv.notes}
                                </div>
                              </td>

                              <td className="p-3 text-slate-600 whitespace-nowrap">{inv.issueDate}</td>

                              <td className="p-3 whitespace-nowrap">
                                <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                  {inv.dueDate}
                                </span>
                              </td>

                              <td className="p-3 text-right font-medium text-slate-900 whitespace-nowrap">
                                {activeTenant.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                                {activeTenant.currency} {inv.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                {activeTenant.currency} {rem.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-center whitespace-nowrap">
                                {isSettled ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{tr('PAID')}</span>
                                ) : isOverdue ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">{tr('OVERDUE')}</span>
                                ) : inv.amountPaid > 0 ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">{tr('PARTIAL')}</span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{tr('UNPAID')}</span>
                                )}
                              </td>

                              <td className="p-3 text-right whitespace-nowrap">
                                {!isSettled && (
                                  <button
                                    id={`pay-single-invoice-btn-${inv.id}`}
                                    onClick={() => {
                                      setTargetInvoiceForPayment(inv.id);
                                      setShowPaymentModal(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                                  >{tr('Pay / Settle')}</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 3: Payment Receipts Table */}
                {statementSubTab === 'PAYMENTS' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">{tr('Receipt #')}</th>
                          <th className="p-3">{tr('Date')}</th>
                          <th className="p-3">{tr('Method')}</th>
                          <th className="p-3">{tr('Bank Account')}</th>
                          <th className="p-3">{tr('Reference / Check')}</th>
                          <th className="p-3 text-right">{tr('Total Received')}</th>
                          <th className="p-3 text-right">{tr('Allocated')}</th>
                          <th className="p-3 text-right">{tr('Advance Credit')}</th>
                          <th className="p-3 text-center">{tr('Status')}</th>
                          <th className="p-3 text-right w-24">{tr('Actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {statementData.paymentReceipts.map((rct) => {
                          const isVoided = rct.status === 'VOIDED';

                          return (
                            <tr key={rct.id} className={`hover:bg-slate-50/80 transition ${isVoided ? 'opacity-50 bg-slate-50' : ''}`}>
                              <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {rct.receiptNumber}
                              </td>

                              <td className="p-3 text-slate-700 whitespace-nowrap">{rct.paymentDate}</td>

                              <td className="p-3 text-slate-700 whitespace-nowrap">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                  {rct.paymentMethod}
                                </span>
                              </td>

                              <td className="p-3 text-slate-600 whitespace-nowrap">
                                {rct.bankAccountName || 'Bank Account'}
                              </td>

                              <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                                {rct.referenceNumber || '-'}
                              </td>

                              <td className="p-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                {activeTenant.currency} {rct.totalAmountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-right font-medium text-slate-900 whitespace-nowrap">
                                {activeTenant.currency} {rct.allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3 text-right font-medium text-cyan-700 whitespace-nowrap">
                                {rct.unallocatedCreditAmount > 0 ? `${activeTenant.currency} ${rct.unallocatedCreditAmount.toFixed(2)}` : '-'}
                              </td>

                              <td className="p-3 text-center whitespace-nowrap">
                                {isVoided ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">{tr('VOIDED')}</span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{tr('POSTED')}</span>
                                )}
                              </td>

                              <td className="p-3 text-right whitespace-nowrap">
                                {!isVoided && (
                                  <button
                                    id={`void-receipt-btn-${rct.id}`}
                                    onClick={() => handleVoidReceipt(rct.id)}
                                    className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                                    title={tr('Void and reverse this payment receipt')}
                                  >{tr('Void')}</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receive Customer Payment Modal */}
      {showPaymentModal && (
        <ReceiveCustomerPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setTargetInvoiceForPayment(undefined);
          }}
          preSelectedCustomerId={selectedCustomerId}
          preSelectedInvoiceId={targetInvoiceForPayment}
        />
      )}

      {/* Customer Opening Balance Modal */}
      {showOpeningModal && (
        <CustomerOpeningBalanceModal
          isOpen={showOpeningModal}
          onClose={() => setShowOpeningModal(false)}
          preSelectedCustomerId={selectedCustomerId}
        />
      )}

      {/* Formal Customer Account Statement Print/Preview Modal */}
      {showPrintStatementModal && activeCustomer && statementData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            id="print-statement-modal"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">{tr('Customer Account Statement')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />{tr('Print / Export PDF')}</button>
                <button
                  onClick={() => setShowPrintStatementModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white text-slate-900 print:p-0">
              {/* Statement Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">{activeTenant.name}</h1>
                  <p className="text-xs text-slate-500 mt-1">{tr('Multi-Entity Enterprise Financial Services')}</p>
                  <p className="text-xs text-slate-400">Statement Date: {new Date().toISOString().split('T')[0]}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{tr('Statement of Account')}</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{activeCustomer.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{activeCustomer.code}</div>
                  <div className="text-xs text-slate-500">{activeCustomer.email}</div>
                </div>
              </div>

              {/* Statement Summary Card */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">{tr('Total Invoiced:')}</span>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {activeTenant.currency} {statementData.metrics.totalInvoiced.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">{tr('Total Payments:')}</span>
                  <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    {activeTenant.currency} {statementData.metrics.totalPaid.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">{tr('Closing Balance Due:')}</span>
                  <div className="text-sm font-bold text-rose-700 font-mono mt-0.5">
                    {activeTenant.currency} {statementData.metrics.netOutstanding.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Statement Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">{tr('Date')}</th>
                      <th className="p-2.5">{tr('Ref #')}</th>
                      <th className="p-2.5">{tr('Description')}</th>
                      <th className="p-2.5 text-right">{tr('Debit (+)')}</th>
                      <th className="p-2.5 text-right">{tr('Credit (-)')}</th>
                      <th className="p-2.5 text-right">{tr('Balance')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statementData.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="p-2.5">{tx.date}</td>
                        <td className="p-2.5 font-mono font-bold">{tx.referenceNumber}</td>
                        <td className="p-2.5">{tx.description}</td>
                        <td className="p-2.5 text-right font-mono">{tx.debit > 0 ? tx.debit.toFixed(2) : '-'}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-700">{tx.credit > 0 ? tx.credit.toFixed(2) : '-'}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{tx.runningBalance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                Please remit payments directly to {activeTenant.name} Operating Treasury accounts. For inquiries, contact accounts@acme.com.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
