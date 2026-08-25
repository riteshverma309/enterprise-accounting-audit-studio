import React, { useState, useMemo } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import { ExpenseReceipt, MileageLogEntry } from '../types';
import {
  Receipt,
  Car,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  MapPin,
  Trash2,
  BookOpenCheck,
  Building,
  Upload,
  Check,
} from 'lucide-react';

export const ExpenseTrackingView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    activeTenant,
    expenseReceipts,
    mileageLogs,
    createExpenseReceipt,
    postExpenseReceiptToGL,
    deleteExpenseReceipt,
    createMileageLog,
    postMileageLogToGL,
    deleteMileageLog,
    accounts,
  } = useAccounting();

  const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'mileage'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState('Software & Subscriptions');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'COMPANY_CARD'>('COMPANY_CARD');
  const [paidBy, setPaidBy] = useState('Sarah Jenkins (Finance)');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseAccountCode, setExpenseAccountCode] = useState('5010');
  const [isSimulatingOcr, setIsSimulatingOcr] = useState(false);
  const [ocrSuccessMessage, setOcrSuccessMessage] = useState('');

  // Mileage Modal State
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('Sarah Jenkins');
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [ratePerMile, setRatePerMile] = useState<number>(0.67);
  const [purpose, setPurpose] = useState('Client on-site consultation');
  const [vehicle, setVehicle] = useState('Tesla Model Y (Corporate Fleet #12)');
  const [odometerStart, setOdometerStart] = useState<number | undefined>(undefined);
  const [odometerEnd, setOdometerEnd] = useState<number | undefined>(undefined);
  const [mileageNotes, setMileageNotes] = useState('');

  // Selected receipt for view details
  const [selectedReceipt, setSelectedReceipt] = useState<ExpenseReceipt | null>(null);

  // Available expense categories
  const categories = [
    'Software & Subscriptions',
    'Travel & Lodging',
    'Meals & Client Entertainment',
    'Office Supplies & Equipment',
    'Professional & Legal Fees',
    'Advertising & Marketing',
    'Utilities & Telecommunications',
    'Vehicle & Transportation',
  ];

  // OCR Scan Simulation Sample Presets
  const simulateOcrCapture = () => {
    setIsSimulatingOcr(true);
    setOcrSuccessMessage('');
    setTimeout(() => {
      const presets = [
        {
          vendor: 'Amazon Web Services Inc.',
          cat: 'Software & Subscriptions',
          amt: 2450.00,
          tax: 196.00,
          rcptNo: `AWS-INV-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: 'Production EC2 clusters & S3 data lake storage hosting',
          code: '5010',
        },
        {
          vendor: 'Marriott Marquis New York',
          cat: 'Travel & Lodging',
          amt: 685.50,
          tax: 95.97,
          rcptNo: `HTL-${Math.floor(10000 + Math.random() * 90000)}`,
          notes: '2 nights corporate hotel stay for investor summit',
          code: '5010',
        },
        {
          vendor: 'Delta Air Lines',
          cat: 'Travel & Lodging',
          amt: 540.20,
          tax: 40.50,
          rcptNo: `DAL-ETKT-${Math.floor(1000000 + Math.random() * 9000000)}`,
          notes: 'Roundtrip flight NYC -> SFO executive client meeting',
          code: '5010',
        },
        {
          vendor: 'Apple Store 5th Ave',
          cat: 'Office Supplies & Equipment',
          amt: 1999.00,
          tax: 177.41,
          rcptNo: `APPL-R-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: 'MacBook Pro M3 workstation for engineering lead',
          code: '1500',
        },
      ];
      const randomPreset = presets[Math.floor(Math.random() * presets.length)];
      setVendorName(randomPreset.vendor);
      setCategory(randomPreset.cat);
      setAmount(randomPreset.amt);
      setTaxAmount(randomPreset.tax);
      setReceiptNumber(randomPreset.rcptNo);
      setNotes(randomPreset.notes);
      setExpenseAccountCode(randomPreset.code);
      setIsSimulatingOcr(false);
      setOcrSuccessMessage('OCR Receipt scanned: Merchant, Date, Tax, and Line Items extracted.');
    }, 850);
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenseReceipts.filter((r) => {
      if (r.tenantId !== activeTenant.id) return false;
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          r.vendorName.toLowerCase().includes(q) ||
          r.receiptNumber.toLowerCase().includes(q) ||
          r.paidBy.toLowerCase().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [expenseReceipts, activeTenant.id, categoryFilter, statusFilter, searchTerm]);

  // Filtered Mileage Logs
  const filteredMileage = useMemo(() => {
    return mileageLogs.filter((m) => {
      if (m.tenantId !== activeTenant.id) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          m.driverName.toLowerCase().includes(q) ||
          m.purpose.toLowerCase().includes(q) ||
          m.startLocation.toLowerCase().includes(q) ||
          m.endLocation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mileageLogs, activeTenant.id, searchTerm]);

  // Metrics
  const totalExpenseAmount = useMemo(() => {
    return expenseReceipts
      .filter((r) => r.tenantId === activeTenant.id)
      .reduce((sum, r) => sum + r.totalAmount, 0);
  }, [expenseReceipts, activeTenant.id]);

  const pendingGlExpenseCount = useMemo(() => {
    return expenseReceipts.filter((r) => r.tenantId === activeTenant.id && r.status === 'DRAFT').length;
  }, [expenseReceipts, activeTenant.id]);

  const totalMileageDeduction = useMemo(() => {
    return mileageLogs
      .filter((m) => m.tenantId === activeTenant.id)
      .reduce((sum, m) => sum + m.totalDeductionAmount, 0);
  }, [mileageLogs, activeTenant.id]);

  const totalMileageMiles = useMemo(() => {
    return mileageLogs
      .filter((m) => m.tenantId === activeTenant.id)
      .reduce((sum, m) => sum + m.distanceMiles, 0);
  }, [mileageLogs, activeTenant.id]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || amount <= 0) return;

    createExpenseReceipt({
      tenantId: activeTenant.id,
      vendorName,
      category,
      expenseDate,
      amount: Number(amount),
      taxAmount: Number(taxAmount),
      totalAmount: Number(amount) + Number(taxAmount),
      currency: activeTenant.currency,
      paymentMethod,
      paidBy,
      receiptNumber: receiptNumber || `RCP-${Date.now().toString().slice(-6)}`,
      notes,
      expenseAccountCode,
    });

    setIsExpenseModalOpen(false);
    resetExpenseForm();
  };

  const resetExpenseForm = () => {
    setVendorName('');
    setCategory('Software & Subscriptions');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setAmount(0);
    setTaxAmount(0);
    setPaymentMethod('COMPANY_CARD');
    setPaidBy('Sarah Jenkins (Finance)');
    setReceiptNumber('');
    setNotes('');
    setExpenseAccountCode('5010');
    setOcrSuccessMessage('');
  };

  const handleSaveMileage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || distanceMiles <= 0 || !startLocation || !endLocation) return;

    createMileageLog({
      tenantId: activeTenant.id,
      driverName,
      tripDate,
      startLocation,
      endLocation,
      distanceMiles: Number(distanceMiles),
      ratePerMile: Number(ratePerMile),
      purpose,
      vehicle,
      odometerStart: odometerStart ? Number(odometerStart) : undefined,
      odometerEnd: odometerEnd ? Number(odometerEnd) : undefined,
      notes: mileageNotes,
    });

    setIsMileageModalOpen(false);
    resetMileageForm();
  };

  const resetMileageForm = () => {
    setDriverName('Sarah Jenkins');
    setTripDate(new Date().toISOString().split('T')[0]);
    setStartLocation('');
    setEndLocation('');
    setDistanceMiles(0);
    setRatePerMile(0.67);
    setPurpose('Client on-site consultation');
    setVehicle('Tesla Model Y (Corporate Fleet #12)');
    setOdometerStart(undefined);
    setOdometerEnd(undefined);
    setMileageNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">{tr('Spend Management')}</span>
            <span className="text-xs text-slate-400">{tr('IRS Form 2106 & SOX Expense Compliance')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-emerald-400" />{tr('Expense & Mileage Tracking')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tr('Capture OCR digital receipts, categorize daily business disbursements, and compute tax-deductible mileage logs with 1-click General Ledger posting.')}</p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'expenses' ? (
            <button
              onClick={() => {
                resetExpenseForm();
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />{tr('Capture / Log Expense')}</button>
          ) : (
            <button
              onClick={() => {
                resetMileageForm();
                setIsMileageModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />{tr('Log Business Trip')}</button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{tr('Total Logged Expenses')}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            ${totalExpenseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">{expenseReceipts.filter((r) => r.tenantId === activeTenant.id).length}</span>{tr('receipts across active fiscal period')}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{tr('Pending GL Posting')}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{pendingGlExpenseCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{tr('Receipts awaiting journal posting & double-entry sync')}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{tr('Mileage Tax Deductions')}</span>
            <Car className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">
            ${totalMileageDeduction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standard IRS deduction rate ($0.67 / mile)
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{tr('Business Travel Miles')}</span>
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {totalMileageMiles.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-400">{tr('miles')}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {mileageLogs.filter((m) => m.tenantId === activeTenant.id).length} recorded trips
          </div>
        </div>
      </div>

      {/* Tab Switcher & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'expenses'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Receipts & Daily Expenses ({expenseReceipts.filter((r) => r.tenantId === activeTenant.id).length})
          </button>
          <button
            onClick={() => setActiveSubTab('mileage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'mileage'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Car className="w-4 h-4" />
            Mileage Logs & Tax Travel ({mileageLogs.filter((m) => m.tenantId === activeTenant.id).length})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeSubTab === 'expenses' ? 'Search vendor, receipt #...' : 'Search driver, location, purpose...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
            />
          </div>

          {activeSubTab === 'expenses' && (
            <>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">{tr('All Categories')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">{tr('All Statuses')}</option>
                <option value="DRAFT">{tr('Draft / Unposted')}</option>
                <option value="POSTED">{tr('Posted to GL')}</option>
                <option value="REJECTED">{tr('Rejected')}</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Main SubTab Content */}
      {activeSubTab === 'expenses' ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">{tr('Expense Date')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Vendor / Merchant')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Category')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Receipt #')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Paid By & Method')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Net Amount')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Tax / VAT')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Total')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('Status')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No expense receipts found matching criteria. Click &quot;Capture / Log Expense&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((rcpt) => {
                    const isPosted = rcpt.status === 'POSTED';
                    return (
                      <tr key={rcpt.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{rcpt.expenseDate}</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-slate-800 rounded-lg text-emerald-400">
                              <Building className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div>{rcpt.vendorName}</div>
                              {rcpt.notes && <div className="text-[10px] text-slate-400 font-sans line-clamp-1">{rcpt.notes}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {rcpt.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{rcpt.receiptNumber}</td>
                        <td className="px-4 py-3 font-sans text-slate-300">
                          <div className="text-[11px] font-medium">{rcpt.paidBy}</div>
                          <div className="text-[10px] text-slate-400">{rcpt.paymentMethod.replace('_', ' ')}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-200">
                          ${rcpt.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">
                          ${(rcpt.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                          ${rcpt.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isPosted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                              <CheckCircle2 className="w-3 h-3" />{tr('GL Posted')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
                              <Clock className="w-3 h-3" />{tr('Draft')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isPosted && (
                              <button
                                onClick={() => postExpenseReceiptToGL(rcpt.id, '1010')}
                                title={tr('Post directly to General Ledger')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-[11px] font-medium border border-emerald-500/30 transition-all cursor-pointer"
                              >
                                <BookOpenCheck className="w-3 h-3" />{tr('Post GL')}</button>
                            )}
                            <button
                              onClick={() => setSelectedReceipt(rcpt)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                              title={tr('View Details')}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteExpenseReceipt(rcpt.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                              title={tr('Delete')}
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
      ) : (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">{tr('Trip Date')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Driver / Employee')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Route (Origin → Destination)')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Business Purpose')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Vehicle')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Distance (mi)')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('IRS Rate')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Deduction')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('Status')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredMileage.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No mileage logs found. Click &quot;Log Business Trip&quot; to record tax-deductible travel.
                    </td>
                  </tr>
                ) : (
                  filteredMileage.map((log) => {
                    const isPosted = log.status === 'POSTED_TO_GL';
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{log.tripDate}</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-100">{log.driverName}</td>
                        <td className="px-4 py-3 font-sans text-slate-300">
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span>{log.startLocation}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{log.endLocation}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300 max-w-[200px] truncate" title={log.purpose}>
                          {log.purpose}
                        </td>
                        <td className="px-4 py-3 font-sans text-[11px] text-slate-400">{log.vehicle || 'Personal Vehicle'}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-200">{log.distanceMiles} mi</td>
                        <td className="px-4 py-3 text-right text-slate-400">${log.ratePerMile}/mi</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-400">
                          ${log.totalDeductionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isPosted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-sans">
                              <CheckCircle2 className="w-3 h-3" />{tr('GL Posted')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600 font-sans">
                              <Clock className="w-3 h-3" />{tr('Logged')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isPosted && (
                              <button
                                onClick={() => postMileageLogToGL(log.id, '1010')}
                                title={tr('Post reimbursement to General Ledger')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[11px] font-medium border border-indigo-500/30 transition-all cursor-pointer"
                              >
                                <BookOpenCheck className="w-3 h-3" />{tr('Post GL')}</button>
                            )}
                            <button
                              onClick={() => deleteMileageLog(log.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                              title={tr('Delete')}
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
      )}

      {/* EXPENSE OCR MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />{tr('Capture / Log Expense Receipt')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{tr('Record vendor receipt details, calculate deductible tax credits, and assign GL accounts.')}</p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Smart OCR Auto-Fill Trigger */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-slate-900 rounded-xl border border-emerald-500/30 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-300">{tr('AI Receipt Auto-Scanner (OCR)')}</div>
                  <div className="text-[11px] text-slate-400">{tr('Instantly extract Merchant, Tax & Total from digital bill')}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={simulateOcrCapture}
                disabled={isSimulatingOcr}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isSimulatingOcr ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />{tr('Scanning...')}</>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />{tr('Simulate OCR Scan')}</>
                )}
              </button>
            </div>

            {ocrSuccessMessage && (
              <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {ocrSuccessMessage}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Merchant / Vendor Name *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={tr('e.g. AWS, Delta Airlines, Staples')}
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Expense Category *')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Expense Date *')}</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Receipt / Invoice Ref #')}</label>
                  <input
                    type="text"
                    placeholder={tr('e.g. INV-98421')}
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Net Amount ($) *')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Sales Tax / VAT ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={taxAmount || ''}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Payment Method')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="COMPANY_CARD">{tr('Corporate Credit Card')}</option>
                    <option value="BANK_TRANSFER">{tr('Direct Wire / ACH')}</option>
                    <option value="CREDIT_CARD">{tr('Personal Card (Reimbursable)')}</option>
                    <option value="CASH">{tr('Petty Cash')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Paid By / Employee')}</label>
                  <input
                    type="text"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{tr('General Ledger Expense Account Code')}</label>
                <input
                  type="text"
                  value={expenseAccountCode}
                  onChange={(e) => setExpenseAccountCode(e.target.value)}
                  placeholder={tr('5010 (Operating Expense)')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Business Purpose & Notes')}</label>
                <textarea
                  rows={2}
                  placeholder={tr('Detailed business justification for accounting audit trail...')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Total Calculation Preview */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{tr('Total Disbursement Amount:')}</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  ${(Number(amount) + Number(taxAmount)).toFixed(2)} {activeTenant.currency}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >{tr('Save & Log Receipt')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MILEAGE MODAL */}
      {isMileageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-400" />{tr('Log Business Mileage Trip')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{tr('Record vehicle business travel distance for tax deductions and employee reimbursements.')}</p>
              </div>
              <button
                onClick={() => setIsMileageModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMileage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Driver / Employee Name *')}</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Trip Date *')}</label>
                  <input
                    type="date"
                    required
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Starting Location (Origin) *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={tr('e.g. NYC Corporate HQ')}
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Ending Location (Destination) *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={tr('e.g. JFK Airport Terminal 4')}
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Distance Driven (Miles) *')}</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 42.5"
                    value={distanceMiles || ''}
                    onChange={(e) => setDistanceMiles(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('IRS Standard Rate ($/mi)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ratePerMile}
                    onChange={(e) => setRatePerMile(parseFloat(e.target.value) || 0.67)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Business Purpose *')}</label>
                <input
                  type="text"
                  required
                  placeholder={tr('e.g. Client executive meeting & site inspection')}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Vehicle Description')}</label>
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Odometer Start')}</label>
                    <input
                      type="number"
                      placeholder="e.g. 14200"
                      value={odometerStart || ''}
                      onChange={(e) => setOdometerStart(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Odometer End')}</label>
                    <input
                      type="number"
                      placeholder="e.g. 14242"
                      value={odometerEnd || ''}
                      onChange={(e) => setOdometerEnd(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Total Deduction Preview */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{tr('Total Tax Deduction Amount:')}</span>
                <span className="text-base font-bold text-indigo-400 font-mono">
                  ${(Number(distanceMiles) * Number(ratePerMile)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMileageModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >{tr('Save & Log Trip')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT VIEW DETAILS MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Receipt Voucher: {selectedReceipt.receiptNumber}
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{tr('Merchant / Vendor:')}</span>
                <span className="font-semibold text-slate-200">{selectedReceipt.vendorName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{tr('Category:')}</span>
                <span className="text-slate-200">{selectedReceipt.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{tr('Expense Date:')}</span>
                <span className="text-slate-200 font-mono">{selectedReceipt.expenseDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{tr('Paid By:')}</span>
                <span className="text-slate-200">{selectedReceipt.paidBy}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{tr('Payment Method:')}</span>
                <span className="text-slate-200">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{tr('GL Account:')}</span>
                <span className="font-mono text-slate-300">{selectedReceipt.expenseAccountCode || '5010'}</span>
              </div>
              {selectedReceipt.journalEntryId && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{tr('Linked Journal Entry:')}</span>
                  <span className="font-mono text-emerald-400">{selectedReceipt.journalEntryId}</span>
                </div>
              )}
              {selectedReceipt.notes && (
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">{tr('Notes:')}</span>
                  <p className="text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    {selectedReceipt.notes}
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mt-4 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>{tr('Net Amount:')}</span>
                  <span>${selectedReceipt.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{tr('Tax Credit / VAT:')}</span>
                  <span>${(selectedReceipt.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-400 pt-1.5 border-t border-slate-800">
                  <span>{tr('Total Disbursement:')}</span>
                  <span>${selectedReceipt.totalAmount.toFixed(2)} {selectedReceipt.currency}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
              >{tr('Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
