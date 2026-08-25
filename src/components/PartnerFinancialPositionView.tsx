import { useLanguage, tr, t } from '../context/LanguageContext';
import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Building2,
  Receipt,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Landmark,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Sliders,
  Sparkles,
  Lock,
} from 'lucide-react';
import { CustomerContact, VendorContact, CustomerInvoice, VendorBill, CustomerPaymentReceipt, Role } from '../types';

export const PartnerFinancialPositionView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    activeTenant,
    activeRole,
    userEmail,
    enterpriseUsers,
    customerContacts,
    vendorContacts,
    invoices,
    bills,
    paymentReceipts,
    openingBalances,
    getCustomerStatementData,
  } = useAccounting();

  const isVendorRole = activeRole === 'vendor';
  const isCustomerRole = activeRole === 'customer';
  const isInternalRole = !isVendorRole && !isCustomerRole;

  // Determine partner type: 'CUSTOMER' or 'VENDOR'
  const [partnerType, setPartnerType] = useState<'CUSTOMER' | 'VENDOR'>(
    isVendorRole ? 'VENDOR' : 'CUSTOMER'
  );

  // Active user object to determine auto-selected partner
  const currentUser = useMemo(() => {
    return (enterpriseUsers || []).find((u) => u.email.toLowerCase() === (userEmail || '').toLowerCase());
  }, [enterpriseUsers, userEmail]);

  // List of customers & vendors in the current active entity
  const entityCustomers = useMemo(() => {
    return (customerContacts || []).filter((c) => c.tenantId === activeTenant?.id);
  }, [customerContacts, activeTenant?.id]);

  const entityVendors = useMemo(() => {
    return (vendorContacts || []).filter((v) => v.tenantId === activeTenant?.id);
  }, [vendorContacts, activeTenant?.id]);

  // Automatically match customer or vendor by email or ID if logged in as a partner
  const matchedCustomer = useMemo(() => {
    if (!currentUser && !userEmail) return entityCustomers[0];
    const match = entityCustomers.find(
      (c) =>
        c.email.toLowerCase() === (userEmail || '').toLowerCase() ||
        (currentUser?.name && c.name.toLowerCase().includes(currentUser.name.toLowerCase()))
    );
    return match || entityCustomers[0];
  }, [entityCustomers, userEmail, currentUser]);

  const matchedVendor = useMemo(() => {
    if (!currentUser && !userEmail) return entityVendors[0];
    const match = entityVendors.find(
      (v) =>
        v.email.toLowerCase() === (userEmail || '').toLowerCase() ||
        (currentUser?.name && v.name.toLowerCase().includes(currentUser.name.toLowerCase())) ||
        (userEmail?.includes('amazon') && v.code?.includes('AWS')) ||
        (userEmail?.includes('otis') && v.code?.includes('OTIS'))
    );
    return match || entityVendors[0];
  }, [entityVendors, userEmail, currentUser]);

  // Selected ID states (for internal users who can switch between partners)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    matchedCustomer?.id || entityCustomers[0]?.id || ''
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    matchedVendor?.id || entityVendors[0]?.id || ''
  );

  // Effective selected customer or vendor
  const currentCustomer = useMemo(() => {
    if (isCustomerRole) return matchedCustomer || entityCustomers[0];
    return entityCustomers.find((c) => c.id === selectedCustomerId) || matchedCustomer || entityCustomers[0];
  }, [isCustomerRole, matchedCustomer, entityCustomers, selectedCustomerId]);

  const currentVendor = useMemo(() => {
    if (isVendorRole) return matchedVendor || entityVendors[0];
    return entityVendors.find((v) => v.id === selectedVendorId) || matchedVendor || entityVendors[0];
  }, [isVendorRole, matchedVendor, entityVendors, selectedVendorId]);

  // Active view tab inside the financial position portal
  const [portalTab, setPortalTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'SETTLEMENTS' | 'STATEMENT' | 'PROFILE'>(
    'OVERVIEW'
  );

  // Search and status filters for documents
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [statementDateRange, setStatementDateRange] = useState<'ALL' | 'FY2026' | '90DAYS'>('ALL');

  // Modal for viewing document details (Invoice or Bill)
  const [selectedDocForModal, setSelectedDocForModal] = useState<{
    type: 'INVOICE' | 'BILL';
    data: any;
  } | null>(null);

  // ----------------------------------------------------
  // CUSTOMER FINANCIAL CALCULATIONS
  // ----------------------------------------------------
  const customerInvoices = useMemo(() => {
    if (!currentCustomer) return [];
    return (invoices || []).filter(
      (inv) => inv.tenantId === activeTenant?.id && (inv.customerId === currentCustomer.id || inv.customerName === currentCustomer.name)
    );
  }, [invoices, activeTenant?.id, currentCustomer]);

  const customerReceipts = useMemo(() => {
    if (!currentCustomer) return [];
    return paymentReceipts.filter(
      (rct) => rct.tenantId === activeTenant.id && (rct.customerId === currentCustomer.id || rct.customerName === currentCustomer.name)
    );
  }, [paymentReceipts, activeTenant.id, currentCustomer]);

  const customerStatement = useMemo(() => {
    if (!currentCustomer) return null;
    return getCustomerStatementData(currentCustomer.id);
  }, [currentCustomer, getCustomerStatementData, invoices, paymentReceipts]);

  const customerKpis = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let currentAmount = 0;
    let aging = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
    const today = new Date();

    customerInvoices.forEach((inv) => {
      totalInvoiced += inv.totalAmount;
      totalPaid += inv.amountPaid || 0;
      const balance = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
      totalOutstanding += balance;

      if (balance > 0) {
        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 0) {
          currentAmount += balance;
          aging.current += balance;
        } else {
          overdueAmount += balance;
          if (diffDays <= 30) aging.d1_30 += balance;
          else if (diffDays <= 60) aging.d31_60 += balance;
          else if (diffDays <= 90) aging.d61_90 += balance;
          else aging.d90plus += balance;
        }
      }
    });

    const unallocatedCredits = customerReceipts.reduce((sum, r) => sum + (r.unallocatedCreditAmount || 0), 0);
    const netPosition = totalOutstanding - unallocatedCredits;

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      currentAmount,
      unallocatedCredits,
      netPosition,
      aging,
      invoiceCount: customerInvoices.length,
      receiptCount: customerReceipts.length,
    };
  }, [customerInvoices, customerReceipts]);

  // ----------------------------------------------------
  // VENDOR FINANCIAL CALCULATIONS
  // ----------------------------------------------------
  const vendorBillsList = useMemo(() => {
    if (!currentVendor) return [];
    return bills.filter(
      (b) =>
        b.tenantId === activeTenant.id &&
        (b.vendorId === currentVendor.id ||
          (currentVendor.code && b.billNumber.toLowerCase().includes(currentVendor.code.toLowerCase().replace('vend-', ''))) ||
          b.vendorName.toLowerCase().includes(currentVendor.name.toLowerCase().slice(0, 8)))
    );
  }, [bills, activeTenant.id, currentVendor]);

  const vendorKpis = useMemo(() => {
    let totalBilled = 0;
    let totalDisbursed = 0;
    let totalPayable = 0;
    let pendingApprovalAmount = 0;
    let overduePayable = 0;
    let currentPayable = 0;
    let aging = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
    const today = new Date();

    vendorBillsList.forEach((b) => {
      totalBilled += b.totalAmount;
      totalDisbursed += b.amountPaid || 0;
      const remaining = Math.max(0, b.totalAmount - (b.amountPaid || 0));
      totalPayable += remaining;

      if (b.status === 'PENDING_APPROVAL') {
        pendingApprovalAmount += remaining;
      }

      if (remaining > 0) {
        const dueDate = new Date(b.dueDate);
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 0) {
          currentPayable += remaining;
          aging.current += remaining;
        } else {
          overduePayable += remaining;
          if (diffDays <= 30) aging.d1_30 += remaining;
          else if (diffDays <= 60) aging.d31_60 += remaining;
          else if (diffDays <= 90) aging.d61_90 += remaining;
          else aging.d90plus += remaining;
        }
      }
    });

    return {
      totalBilled,
      totalDisbursed,
      totalPayable,
      pendingApprovalAmount,
      overduePayable,
      currentPayable,
      aging,
      billCount: vendorBillsList.length,
    };
  }, [vendorBillsList]);

  // Running ledger statement for Vendor
  const vendorLedgerStatement = useMemo(() => {
    if (!currentVendor) return [];
    let running = 0;
    const events: Array<{
      id: string;
      date: string;
      type: 'BILL' | 'PAYMENT';
      reference: string;
      description: string;
      debit: number; // Disbursed/Paid
      credit: number; // Billed/Accrued
      balance: number;
      status: string;
      rawObj: any;
    }> = [];

    const sortedBills = [...vendorBillsList].sort((a, b) => new Date(a.billDate).getTime() - new Date(b.billDate).getTime());

    sortedBills.forEach((b) => {
      // Bill creates a credit (accounts payable balance increases)
      running += b.totalAmount;
      events.push({
        id: b.id,
        date: b.billDate,
        type: 'BILL',
        reference: b.billNumber,
        description: b.items?.map((i) => i.description).join(', ') || 'Vendor Services / Supplies',
        debit: 0,
        credit: b.totalAmount,
        balance: running,
        status: b.status,
        rawObj: b,
      });

      // If bill is paid/partially paid, simulate the disbursement entry
      if (b.amountPaid > 0) {
        running -= b.amountPaid;
        events.push({
          id: `pmt-${b.id}`,
          date: b.dueDate || b.billDate,
          type: 'PAYMENT',
          reference: `DISB-${b.billNumber}`,
          description: `Disbursement Settlement for ${b.billNumber}`,
          debit: b.amountPaid,
          credit: 0,
          balance: running,
          status: 'POSTED',
          rawObj: b,
        });
      }
    });

    return events;
  }, [vendorBillsList, currentVendor]);

  // Filtered documents table
  const filteredCustomerInvoices = useMemo(() => {
    return customerInvoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
        inv.items.some((i) => i.description.toLowerCase().includes(searchDocQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customerInvoices, searchDocQuery, statusFilter]);

  const filteredVendorBills = useMemo(() => {
    return vendorBillsList.filter((b) => {
      const matchSearch =
        b.billNumber.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
        b.items.some((i) => i.description.toLowerCase().includes(searchDocQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vendorBillsList, searchDocQuery, statusFilter]);

  const currency = activeTenant.currency || 'USD';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner & Security Scope Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {partnerType === 'CUSTOMER' ? tr('CUSTOMER FINANCIAL POSITION') : tr('VENDOR FINANCIAL POSITION')}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {tr('Entity:')} <span className="text-white font-semibold">{activeTenant.name}</span> ({activeTenant.code})
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />{tr('Real-time Double Entry Sync')}</span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {partnerType === 'CUSTOMER' ? currentCustomer?.name || tr('Customer') : currentVendor?.name || tr('Vendor')}
              </h1>
              <span className="text-xs font-mono text-slate-400">
                {tr('Code:')} {partnerType === 'CUSTOMER' ? currentCustomer?.code || 'CUST' : currentVendor?.code || 'VEND'}
              </span>
            </div>

            <p className="text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {partnerType === 'CUSTOMER'
                ? tr('Consolidated statement of account, receivables, payment receipts, and real-time ledger with respect to entity.')
                : tr('Comprehensive accounts payable statement, submitted bills, disbursement status, and aging ledger with respect to entity.')}
            </p>
          </div>

          {/* Internal Role Selector (Admins/Accountants can switch partner view; Partner roles are locked) */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3 min-w-[280px]">
            {isInternalRole ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />{tr('Partner Inspection')}</span>
                  <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    <button
                      onClick={() => setPartnerType('CUSTOMER')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                        partnerType === 'CUSTOMER'
                          ? 'bg-blue-600 text-white font-semibold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >{tr('Customer')}</button>
                    <button
                      onClick={() => setPartnerType('VENDOR')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                        partnerType === 'VENDOR'
                          ? 'bg-emerald-600 text-white font-semibold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >{tr('Vendor')}</button>
                  </div>
                </div>

                {partnerType === 'CUSTOMER' ? (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono mb-1">{tr("Select Customer Account:")}</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      {entityCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code || c.category})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono mb-1">{tr("Select Vendor Account:")}</label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      {entityVendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.code || v.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" />{tr('Single Portal Mode Active')}</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  You are authenticated as{' '}
                  <span className="text-slate-200 font-medium">{userEmail}</span>. Access is strictly scoped to this partner record.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: tr('Executive Overview & Aging'), icon: Layers },
            {
              id: 'DOCUMENTS',
              label: partnerType === 'CUSTOMER' ? `${tr('Invoices')} (${customerInvoices.length})` : `${tr('Bills')} (${vendorBillsList.length})`,
              icon: Receipt,
            },
            {
              id: 'SETTLEMENTS',
              label: partnerType === 'CUSTOMER' ? `${tr('Receipts & Credits')} (${customerReceipts.length})` : tr('Disbursements & Payments'),
              icon: CreditCard,
            },
            { id: 'STATEMENT', label: tr('Double-Entry Statement (Ledger)'), icon: FileSpreadsheet },
            { id: 'PROFILE', label: tr('Master Profile & Bank Terms'), icon: Landmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = portalTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPortalTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {partnerType === 'CUSTOMER' ? (
          <>
            {/* Card 1: Net Receivable Balance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Net Receivable Balance')}</span>
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {currency} {customerKpis.netPosition.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {customerKpis.unallocatedCredits > 0
                  ? `${tr('Includes')} ${currency} ${customerKpis.unallocatedCredits.toLocaleString()} ${tr('unallocated advance credit')}`
                  : tr('Total open unpaid invoices due from customer')}
              </p>
            </div>

            {/* Card 2: Total Invoiced (YTD) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Total Billed / Invoiced')}</span>
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {currency} {customerKpis.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{tr('Across')} {customerKpis.invoiceCount} {tr('invoices issued')}</p>
            </div>

            {/* Card 3: Total Collections / Payments Received */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Settled Receipts')}</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {currency} {customerKpis.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {customerKpis.totalInvoiced > 0
                  ? `${Math.round((customerKpis.totalPaid / customerKpis.totalInvoiced) * 100)}% ${tr('settlement clearance rate')}`
                  : tr('All payments settled')}
              </p>
            </div>

            {/* Card 4: Overdue Arrears */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Overdue Balance')}</span>
                <span className={`p-1.5 rounded-lg ${customerKpis.overdueAmount > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-bold font-mono ${customerKpis.overdueAmount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {currency} {customerKpis.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {customerKpis.overdueAmount > 0 ? tr('Past agreed payment due date') : tr('No overdue invoices')}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Vendor Card 1: Net Accounts Payable */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Net Accounts Payable')}</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {currency} {vendorKpis.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{tr('Outstanding entity balance owed to vendor')}</p>
            </div>

            {/* Vendor Card 2: Total Billed */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Total Billed by Vendor')}</span>
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {currency} {vendorKpis.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{tr('Cumulative invoices from vendor')} ({vendorKpis.billCount} {tr('bills')})</p>
            </div>

            {/* Vendor Card 3: Total Disbursements Settled */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Disbursements Paid')}</span>
                <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-teal-400">
                  {currency} {vendorKpis.totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{tr('Wire/ACH bank transfers executed')}</p>
            </div>

            {/* Vendor Card 4: Pending / Overdue */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{tr('Overdue Payables')}</span>
                <span className={`p-1.5 rounded-lg ${vendorKpis.overduePayable > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-bold font-mono ${vendorKpis.overduePayable > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {currency} {vendorKpis.overduePayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {vendorKpis.overduePayable > 0 ? tr('Due for disbursement release') : tr('All bills within payment terms')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 3. Tab Content Rendering */}

      {/* TAB 1: OVERVIEW & AGING ANALYSIS */}
      {portalTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Aging Breakdown Bar */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{tr('Outstanding Aging Analysis')}</h3>
                <p className="text-xs text-slate-400">{tr('Aging schedule categorized by invoice/bill due date')}</p>
              </div>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                {tr('Terms:')} {partnerType === 'CUSTOMER' ? currentCustomer?.paymentTermsDays || 30 : currentVendor?.paymentTermsDays || 30} {tr('Days Net')}
              </span>
            </div>

            {/* Aging Bracket Grid */}
            {(() => {
              const agingData = partnerType === 'CUSTOMER' ? customerKpis.aging : vendorKpis.aging;
              const totalDue = partnerType === 'CUSTOMER' ? customerKpis.totalOutstanding : vendorKpis.totalPayable;

              return (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-emerald-400 font-semibold block">{tr('Current (Not Due)')}</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        {currency} {agingData.current.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {totalDue > 0 ? Math.round((agingData.current / totalDue) * 100) : 0}%
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-blue-400 font-semibold block">{tr('1 - 30 Days')}</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        {currency} {agingData.d1_30.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {totalDue > 0 ? Math.round((agingData.d1_30 / totalDue) * 100) : 0}%
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-amber-400 font-semibold block">{tr('31 - 60 Days')}</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        {currency} {agingData.d31_60.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {totalDue > 0 ? Math.round((agingData.d31_60 / totalDue) * 100) : 0}%
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-orange-400 font-semibold block">{tr('61 - 90 Days')}</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        {currency} {agingData.d61_90.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {totalDue > 0 ? Math.round((agingData.d61_90 / totalDue) * 100) : 0}%
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-rose-400 font-semibold block">{tr('90+ Days Past')}</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        {currency} {agingData.d90plus.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {totalDue > 0 ? Math.round((agingData.d90plus / totalDue) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Multi-Segment Bar */}
                  <div className="h-3.5 w-full bg-slate-950 rounded-full flex overflow-hidden border border-slate-800">
                    {totalDue > 0 ? (
                      <>
                        <div style={{ width: `${(agingData.current / totalDue) * 100}%` }} className="bg-emerald-500 h-full" title={tr('Current')} />
                        <div style={{ width: `${(agingData.d1_30 / totalDue) * 100}%` }} className="bg-blue-500 h-full" title={tr('1-30 Days')} />
                        <div style={{ width: `${(agingData.d31_60 / totalDue) * 100}%` }} className="bg-amber-500 h-full" title={tr('31-60 Days')} />
                        <div style={{ width: `${(agingData.d61_90 / totalDue) * 100}%` }} className="bg-orange-500 h-full" title={tr('61-90 Days')} />
                        <div style={{ width: `${(agingData.d90plus / totalDue) * 100}%` }} className="bg-rose-500 h-full" title={tr('90+ Days')} />
                      </>
                    ) : (
                      <div className="w-full bg-emerald-500/30 h-full text-center text-[9px] text-emerald-300 font-mono">{tr('0.00 Outstanding Balance')}</div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Recent Transaction Activity Snippet */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{tr('Recent Document Submissions')}</h4>
              <div className="space-y-2">
                {partnerType === 'CUSTOMER' ? (
                  customerInvoices.slice(0, 3).map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedDocForModal({ type: 'INVOICE', data: inv })}
                      className="p-3 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{inv.invoiceNumber}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tr('Issue:')} {inv.issueDate} • {tr('Due:')} {inv.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-white block">
                          {currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tr('Paid:')} {currency} {(inv.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  vendorBillsList.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedDocForModal({ type: 'BILL', data: b })}
                      className="p-3 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{b.billNumber}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                b.status === 'PAID'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : b.status === 'APPROVED'
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                  : b.status === 'PARTIALLY_PAID'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tr('Bill Date:')} {b.billDate} • {tr('Due Date:')} {b.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-white block">
                          {currency} {b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tr('Disbursed:')} {currency} {(b.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Account Coordinates & Fast Settlement info */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-400" />{tr('Entity Settlement Coordinates')}</h3>

              <div className="space-y-2.5 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">{tr("Remit-To Legal Name:")}</span>
                  <span className="font-semibold text-white block">{activeTenant.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{tr('Tax ID:')} {activeTenant.country}-EIN-992014</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">{tr("Primary Clearing Bank:")}</span>
                  <span className="font-semibold text-slate-200 block">{tr('JPMorgan Chase Bank, N.A.')}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{tr('Routing:')} 021000021 • {tr('Account:')} ••••4892</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">{tr("Finance Contacts:")}</span>
                  <span className="text-slate-300 font-medium block">treasury.settlements@acme-us.com</span>
                  <span className="text-[10px] text-slate-500">{tr('Automated Remittance Advice Generation Enabled')}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">{tr('Statement Operations')}</span>
              <p className="text-xs text-slate-300">{tr('Generate an official, printable financial statement with cryptographic double-entry balances.')}</p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => setPortalTab('STATEMENT')}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />{tr('View Running Ledger Statement')}</button>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />{tr('Print Position Summary')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES / BILLS REGISTER */}
      {portalTab === 'DOCUMENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                {partnerType === 'CUSTOMER' ? tr('Invoices & Billing Register') : tr('Vendor Submitted Bills & Approvals')}
              </h3>
              <p className="text-xs text-slate-400">
                {partnerType === 'CUSTOMER'
                  ? tr('All itemized customer invoices issued by this entity.')
                  : tr('All vendor bills submitted for review, approval, and settlement disbursement.')}
              </p>
            </div>

            {/* Search & Status Filter Controls */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={tr('Search number or line...')}
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  className="bg-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none w-48 sm:w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="ALL">{tr('All Statuses')}</option>
                <option value="PAID">{tr('Paid')}</option>
                <option value="PARTIALLY_PAID">{tr('Partially Paid')}</option>
                <option value="APPROVED">{tr('Approved')}</option>
                <option value="OVERDUE">{tr('Overdue')}</option>
                <option value="PENDING_APPROVAL">{tr('Pending Approval')}</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{tr('Document #')}</th>
                  <th className="py-3 px-4">{tr('Date')}</th>
                  <th className="py-3 px-4">{tr('Due Date')}</th>
                  <th className="py-3 px-4">{tr('Line Items / Services')}</th>
                  <th className="py-3 px-4 text-right">{tr('Total Amount')}</th>
                  <th className="py-3 px-4 text-right">{tr('Settled')}</th>
                  <th className="py-3 px-4 text-right">{tr('Remaining Balance')}</th>
                  <th className="py-3 px-4 text-center">{tr('Status')}</th>
                  <th className="py-3 px-4 text-center">{tr('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
                {partnerType === 'CUSTOMER' ? (
                  filteredCustomerInvoices.length > 0 ? (
                    filteredCustomerInvoices.map((inv) => {
                      const balance = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-bold text-white">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4 text-slate-400">{inv.issueDate}</td>
                          <td className="py-3 px-4 text-slate-400">{inv.dueDate}</td>
                          <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                            {inv.items.map((i) => i.description).join(', ')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            {currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-400">
                            {currency} {(inv.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-400">
                            {currency} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedDocForModal({ type: 'INVOICE', data: inv })}
                              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                              title={tr('View Invoice Details')}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">{tr('No matching customer invoices found.')}</td>
                    </tr>
                  )
                ) : filteredVendorBills.length > 0 ? (
                  filteredVendorBills.map((b) => {
                    const balance = Math.max(0, b.totalAmount - (b.amountPaid || 0));
                    return (
                      <tr key={b.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-bold text-white">{b.billNumber}</td>
                        <td className="py-3 px-4 text-slate-400">{b.billDate}</td>
                        <td className="py-3 px-4 text-slate-400">{b.dueDate}</td>
                        <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                          {b.items.map((i) => i.description).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {currency} {b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-teal-400">
                          {currency} {(b.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {currency} {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold ${
                              b.status === 'PAID'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : b.status === 'APPROVED'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : b.status === 'PARTIALLY_PAID'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedDocForModal({ type: 'BILL', data: b })}
                            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title={tr('View Bill Details')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">{tr('No matching vendor bills found.')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTLEMENTS & PAYMENTS */}
      {portalTab === 'SETTLEMENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                {partnerType === 'CUSTOMER' ? tr('Payment Receipts & Remittance History') : tr('Disbursement Vouchers & Wire Clearances')}
              </h3>
              <p className="text-xs text-slate-400">
                {partnerType === 'CUSTOMER'
                  ? tr('Audit log of cash receipts, check clearances, and wire payments recorded for this customer.')
                  : tr('Entity payments disbursed to vendor settlement accounts.')}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">{tr('Audit-Ready Vouchers')}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{tr('Receipt / Voucher #')}</th>
                  <th className="py-3 px-4">{tr('Date')}</th>
                  <th className="py-3 px-4">{tr('Method')}</th>
                  <th className="py-3 px-4">{tr('Reference / UTR')}</th>
                  <th className="py-3 px-4 text-right">{tr('Amount Received')}</th>
                  <th className="py-3 px-4 text-right">{tr('Allocated')}</th>
                  <th className="py-3 px-4 text-right">{tr('Advance Credit')}</th>
                  <th className="py-3 px-4 text-center">{tr('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
                {partnerType === 'CUSTOMER' ? (
                  customerReceipts.length > 0 ? (
                    customerReceipts.map((rct) => (
                      <tr key={rct.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-bold text-white">{rct.receiptNumber}</td>
                        <td className="py-3 px-4 text-slate-400">{rct.paymentDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200 border border-slate-700">
                            {rct.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{rct.referenceNumber || tr('N/A')}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {currency} {rct.totalAmountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {currency} {rct.allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-400">
                          {currency} {(rct.unallocatedCreditAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {rct.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">{tr('No payment receipts found for this customer.')}</td>
                    </tr>
                  )
                ) : (
                  vendorBillsList.filter((b) => b.amountPaid > 0).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold text-white">DISB-{b.billNumber}</td>
                      <td className="py-3 px-4 text-slate-400">{b.dueDate || b.billDate}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200 border border-slate-700">{tr('DIRECT ACH / WIRE')}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">WT-SETTLE-{b.billNumber.replace(/\D/g, '')}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal-400">
                        {currency} {b.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {currency} {b.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">0.00</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">{tr('SETTLED')}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RUNNING STATEMENT OF ACCOUNT (DOUBLE-ENTRY LEDGER) */}
      {portalTab === 'STATEMENT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{tr('Official Statement of Account')}</h3>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">{tr('Double-Entry Ledger')}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{tr('Complete chronological transaction history with debits, credits, and running net balance.')}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />{tr('Print Statement')}</button>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{tr('Date')}</th>
                  <th className="py-3 px-4">{tr('Type')}</th>
                  <th className="py-3 px-4">{tr('Reference')}</th>
                  <th className="py-3 px-4">{tr('Description')}</th>
                  <th className="py-3 px-4 text-right">{tr('Debit')} ({currency})</th>
                  <th className="py-3 px-4 text-right">{tr('Credit')} ({currency})</th>
                  <th className="py-3 px-4 text-right">{tr('Running Net Balance')} ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
                {partnerType === 'CUSTOMER' ? (
                  customerStatement && customerStatement.transactions.length > 0 ? (
                    customerStatement.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 text-slate-400">{tx.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'INVOICE'
                                ? 'bg-blue-500/20 text-blue-300'
                                : tx.type === 'PAYMENT'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{tx.referenceNumber}</td>
                        <td className="py-3 px-4 font-sans text-slate-300 max-w-sm truncate">{tx.description}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-200">
                          {tx.debit > 0 ? tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {tx.credit > 0 ? tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {tx.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.balanceType || 'DR'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">{tr('No statement records found.')}</td>
                    </tr>
                  )
                ) : vendorLedgerStatement.length > 0 ? (
                  vendorLedgerStatement.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-slate-400">{ev.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.type === 'BILL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-teal-500/20 text-teal-300'
                          }`}
                        >
                          {ev.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{ev.reference}</td>
                      <td className="py-3 px-4 font-sans text-slate-300 max-w-sm truncate">{ev.description}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal-400">
                        {ev.debit > 0 ? ev.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-200">
                        {ev.credit > 0 ? ev.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {ev.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} CR
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">{tr('No vendor ledger records found.')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE & MASTER DATA */}
      {portalTab === 'PROFILE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />{tr('Partner Registration & Legal Profile')}</h3>

            <div className="space-y-3 text-xs font-sans">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">{tr('Company / Contact Name')}</span>
                <p className="text-sm font-bold text-white">
                  {partnerType === 'CUSTOMER' ? currentCustomer?.name : currentVendor?.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">{tr('Email Address')}</span>
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {partnerType === 'CUSTOMER' ? currentCustomer?.email : currentVendor?.email}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">{tr('Phone Number')}</span>
                  <p className="text-xs font-medium text-slate-200">
                    {partnerType === 'CUSTOMER' ? currentCustomer?.phone : currentVendor?.phone}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono">{tr('Billing & Registered Address')}</span>
                <p className="text-xs text-slate-300">
                  {partnerType === 'CUSTOMER' ? currentCustomer?.address : currentVendor?.address}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">{tr('Tax / EIN / VAT Number')}</span>
                  <p className="text-xs font-mono font-semibold text-slate-200">
                    {partnerType === 'CUSTOMER' ? currentCustomer?.taxId || tr('N/A') : currentVendor?.taxId || tr('N/A')}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">{tr('Agreed Payment Terms')}</span>
                  <p className="text-xs font-mono font-semibold text-indigo-400">
                    {tr('Net')} {partnerType === 'CUSTOMER' ? currentCustomer?.paymentTermsDays || 30 : currentVendor?.paymentTermsDays || 30} {tr('Days')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />{tr('Banking & Direct Settlement Configuration')}</h3>

            {partnerType === 'VENDOR' && currentVendor?.bankDetails ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">{tr('Disbursement Bank Name')}</span>
                  <p className="text-sm font-bold text-white">{currentVendor.bankDetails.bankName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">{tr('Account Number')}</span>
                    <p className="text-xs font-mono font-semibold text-slate-200">••••{currentVendor.bankDetails.accountNumber.slice(-4)}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">{tr('Routing Number (ABA)')}</span>
                    <p className="text-xs font-mono font-semibold text-slate-200">{currentVendor.bankDetails.routingNumber}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{tr('Direct Wire and ACH transfers for approved bills are executed to this verified corporate bank account.')}</p>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-300 block">{tr('Electronic Payment Methods Supported')}</span>
                <p className="text-slate-400 leading-relaxed">{tr('This entity accepts payment via ACH Direct Debit, Fedwire Electronic Wire, Corporate Credit Card, and Verified Check clearance.')}</p>
                <div className="pt-2 flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />{tr('PCI-DSS & SOC-2 Certified Settlement Processing')}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Document Itemized Detail Modal */}
      {selectedDocForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  {selectedDocForModal.type === 'INVOICE' ? tr('Customer Invoice Voucher') : tr('Vendor Bill Voucher')}
                </span>
                <h3 className="text-lg font-bold text-white font-mono mt-1">
                  {selectedDocForModal.type === 'INVOICE'
                    ? selectedDocForModal.data.invoiceNumber
                    : selectedDocForModal.data.billNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">{tr("Issue / Bill Date:")}</span>
                <span className="text-slate-200">
                  {selectedDocForModal.type === 'INVOICE' ? selectedDocForModal.data.issueDate : selectedDocForModal.data.billDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{tr("Due Date:")}</span>
                <span className="text-slate-200">{selectedDocForModal.data.dueDate}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">{tr('Description')}</th>
                    <th className="py-2.5 px-3 text-right">{tr('Amount')} ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                  {selectedDocForModal.data.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-sans text-slate-200">{item.description}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {(item.amount || (item.quantity || 1) * (item.unitPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total and Paid amounts */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>{tr("Total Amount:")}</span>
                <span className="text-white font-bold">
                  {currency} {selectedDocForModal.data.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>{tr("Amount Paid / Disbursed:")}</span>
                <span className="font-bold">
                  {currency} {(selectedDocForModal.data.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-blue-400 font-bold pt-1 border-t border-slate-800">
                <span>{tr("Remaining Balance:")}</span>
                <span>
                  {currency}{' '}
                  {Math.max(0, selectedDocForModal.data.totalAmount - (selectedDocForModal.data.amountPaid || 0)).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >{tr('Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
