import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  BookOpen,
  Search,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Download,
  Calculator,
  FileText,
  Users,
  Building2,
  Receipt,
  CreditCard,
  Wallet,
  Landmark,
  ShieldCheck,
  Globe2,
  Lock,
  PieChart,
  FileSpreadsheet,
  Terminal,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Code2,
  Clock,
  ALargeSmall,
} from 'lucide-react';
import { TabType } from './Sidebar';
import { FontSizeControl } from './FontSizeControl';

interface HelpCenterViewProps {
  setActiveTab?: (tab: TabType) => void;
  initialSectionId?: string;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({
  setActiveTab,
  initialSectionId = 'bulk-invoicing',
}) => {
  const { activeTenant, customAttributeDefinitions, invoiceTemplates, customers } = useAccounting();

  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialSectionId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Interactive Live Simulator State
  const [simIsCommercial, setSimIsCommercial] = useState<boolean>(true);
  const [simCarpetArea, setSimCarpetArea] = useState<number>(2400);
  const [simParkingSlots, setSimParkingSlots] = useState<number>(4);
  const [simBaseRate, setSimBaseRate] = useState<number>(3.25);
  const [simParkingRate, setSimParkingRate] = useState<number>(120);
  const [simHvacRate, setSimHvacRate] = useState<number>(650);
  const [simTaxRate, setSimTaxRate] = useState<number>(18);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Download complete guide
  const handleDownloadCompleteGuide = () => {
    const markdownContent = `# Enterprise Accounting & Bulk Invoicing System - Complete User Guide & Reference Manual
Date: ${new Date().toISOString().split('T')[0]}
Tenant: ${activeTenant.name} (${activeTenant.currency})

## Table of Contents
1. Dynamic Custom Attribute Engine (EAV Model)
2. Master Invoice Templates Engine
3. Bulk Invoice Generation & Dynamic Segmentation Engine
4. Pre-Flight Validation & CSV Auditing
5. Double-Entry General Ledger Posting (Debits & Credits)
6. Audit Trails, Safety & Batch Rollback
7. Multi-Entity, Multi-Tenant & Multi-Standard Switching (US GAAP / EU IFRS / IN GST)
8. Treasury, Cash Forecast & 3-Way Bank Reconciliation
9. SOX 404 Role-Based Access Control & Approvals
10. AI Audit Copilot Powered by Gemini

... (Full guide available in in-app Help Center)
`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Enterprise-Accounting-User-Guide-${activeTenant.code}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulator Calculations
  const simCalculations = useMemo(() => {
    const baseMaintSubtotal = simCarpetArea * simBaseRate;
    const baseMaintTax = baseMaintSubtotal * (simTaxRate / 100);

    const parkingSubtotal = simParkingSlots * simParkingRate;
    const parkingTax = parkingSubtotal * (simTaxRate / 100);

    const hvacSubtotal = simIsCommercial ? simHvacRate : 0;
    const hvacTax = hvacSubtotal * (simTaxRate / 100);

    const sinkingFundSubtotal = !simIsCommercial ? 450 : 0;
    const sinkingFundTax = 0;

    const subtotal = baseMaintSubtotal + parkingSubtotal + hvacSubtotal + sinkingFundSubtotal;
    const totalTax = baseMaintTax + parkingTax + hvacTax + sinkingFundTax;
    const totalInvoice = subtotal + totalTax;

    return {
      baseMaintSubtotal,
      baseMaintTax,
      parkingSubtotal,
      parkingTax,
      hvacSubtotal,
      hvacTax,
      sinkingFundSubtotal,
      sinkingFundTax,
      subtotal,
      totalTax,
      totalInvoice,
    };
  }, [
    simIsCommercial,
    simCarpetArea,
    simParkingSlots,
    simBaseRate,
    simParkingRate,
    simHvacRate,
    simTaxRate,
  ]);

  // Documentation Topics
  const topics = [
    {
      id: 'bulk-invoicing',
      title: 'Bulk Invoicing & Segmentation',
      category: 'Invoicing & AR',
      badge: 'Core Feature',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      description:
        'Segment customer portfolios by custom attributes, map dynamic templates, calculate area multipliers, and post batches to the GL.',
    },
    {
      id: 'dynamic-attributes',
      title: 'Dynamic Custom Attributes (EAV)',
      category: 'Master Data',
      badge: 'Extensibility',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      description:
        'Define schema-driven Boolean, Number, Select, and Date fields on Customers without database migrations.',
    },
    {
      id: 'invoice-templates',
      title: 'Master Invoice Templates',
      category: 'Invoicing & AR',
      badge: 'Standardization',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      description:
        'Build reusable line items, default tax brackets, GL revenue accounts, and dynamic memo token templates.',
    },
    {
      id: 'gl-double-entry',
      title: 'General Ledger & Double-Entry Engine',
      category: 'Core Accounting',
      badge: 'Balance Sheet',
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
      description:
        'Guaranteed debits=credits balance, hierarchical Chart of Accounts, and real-time subledger synchronization.',
    },
    {
      id: 'multi-standard',
      title: 'Multi-Standard Switching (GAAP / IFRS / GST)',
      category: 'Compliance',
      badge: 'Global ERP',
      icon: <Globe2 className="w-4 h-4 text-amber-400" />,
      description:
        'Toggle seamlessly between US GAAP, EU IFRS (IAS 7), and India GST rules with specialized Chart of Accounts mappings.',
    },
    {
      id: 'ar-payments',
      title: 'Accounts Receivable & Payment Receipts',
      category: 'Invoicing & AR',
      badge: 'Cash Inflow',
      icon: <Receipt className="w-4 h-4 text-blue-400" />,
      description:
        'Track unpaid invoices, issue official numbered payment receipts, record opening balances, and view customer statements.',
    },
    {
      id: 'reconciliation',
      title: '3-Way Bank Reconciliation & Treasury',
      category: 'Banking',
      badge: 'IAS 7',
      icon: <Landmark className="w-4 h-4 text-teal-400" />,
      description:
        'Import bank statements, match against GL cash ledger, detect discrepancies, and forecast liquidity curves.',
    },
    {
      id: 'governance-rbac',
      title: 'SOX 404 RBAC & Approvals Governance',
      category: 'Security',
      badge: 'Compliance',
      icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
      description:
        'Separation of duties, dual-control maker-checker journal workflows, period locking, and immutable audit trails.',
    },
    {
      id: 'ai-copilot',
      title: 'AI Audit Copilot (Gemini)',
      category: 'Intelligence',
      badge: 'AI Powered',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      description:
        'Automated journal entry anomaly detection, variance explanation, and natural-language audit inquiries.',
    },
    {
      id: 'accessibility-display',
      title: 'Display & Font Sizing Settings',
      category: 'Accessibility',
      badge: 'User Preferences',
      icon: <ALargeSmall className="w-4 h-4 text-indigo-400" />,
      description:
        'Customize application typography scaling, compact spreadsheet density, standard layout, large audit views, or high accessibility mode.',
    },
  ];

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase();
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [searchQuery, topics]);

  const activeTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="help-center-root">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">
              <BookOpen className="w-4 h-4" />
              <span>Interactive Knowledge Base & Feature Manual</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                v1.4
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Application Help Center & User Guide
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Step-by-step interactive documentation, live calculation simulators, and code examples for all ERP capabilities, dynamic customer segmentation, invoice templates, and bulk billing runs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadCompleteGuide}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Download Full Markdown Guide
            </button>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('invoicing_ar')}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                Go to Invoicing & AR
              </button>
            )}
          </div>
        </div>

        {/* Fast Search Filter */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 relative">
          <div className="relative max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features (e.g. 'bulk invoicing', 'custom attributes', 'carpet area', 'double entry', 'reconciliation')..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigator + Detailed Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Topics */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 sticky top-20 shadow-md">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Topics ({filteredTopics.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Select to read</span>
          </div>

          <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/50 text-white shadow-sm'
                      : 'bg-slate-900/40 hover:bg-slate-800/60 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {topic.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold leading-tight text-slate-100">
                          {topic.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-8 space-y-6">
          {/* ========================================================================= */}
          {/* TOPIC 1: BULK INVOICING & SEGMENTATION */}
          {/* ========================================================================= */}
          {selectedTopicId === 'bulk-invoicing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    <Layers className="w-4 h-4" />
                    <span>Invoicing & Accounts Receivable</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Bulk Invoice Generation & Customer Segmentation Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Step-by-step workflow to group customers, map customized templates, apply dynamic rate multipliers, and post batches to the General Ledger.
                  </p>
                </div>

                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('invoicing_ar')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start"
                  >
                    Launch Bulk Invoicing Wizard
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 4-Step Process Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    1
                  </div>
                  <div className="text-xs font-bold text-slate-200">Customer Segmentation</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Choose Boolean flag (<code>is_commercial</code>) or categorical text (<code>unit_wing</code>) to partition customers.
                  </p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    2
                  </div>
                  <div className="text-xs font-bold text-slate-200">Template Mapping</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Assign a distinct Invoice Template and dynamic quantity multiplier field (e.g. <code>carpet_area_sqft</code>) per segment.
                  </p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    3
                  </div>
                  <div className="text-xs font-bold text-slate-200">Pre-Flight Review</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Verify all line items, area multiplications, and taxes in a live calculation grid; export preview to CSV.
                  </p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    4
                  </div>
                  <div className="text-xs font-bold text-slate-200">Atomic GL Commit</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Concurrently writes subledger invoices and balanced double-entry vouchers (Acc 1100 AR vs Acc 4010 Rev & Acc 2110 Tax).
                  </p>
                </div>
              </div>

              {/* Mathematical Formulation */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <Calculator className="w-4 h-4" />
                  <span>Calculation Formulas & Subledger Logic</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-indigo-300 font-bold">1. Line Amount Computation:</div>
                    <p>Effective Qty = Customer.Multiplier || Template.Qty</p>
                    <p>Line Amount = Effective Qty × Template.UnitPrice</p>
                    <p>Line Tax = Line Amount × (TaxRate / 100)</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-emerald-300 font-bold">2. General Ledger Balanced Voucher:</div>
                    <p>DEBIT : Acc 1100 (AR) = Total Invoice</p>
                    <p>CREDIT: Acc 4010 (Rev) = Net Subtotal</p>
                    <p>CREDIT: Acc 2110 (Tax) = Tax Total</p>
                  </div>
                </div>
              </div>

              {/* Interactive Simulator Section */}
              <div className="border border-indigo-500/30 rounded-xl p-5 bg-gradient-to-b from-indigo-950/30 to-slate-950/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Interactive Live Billing & Multiplier Simulator
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Adjust customer attributes below to test live rate scaling, tax computation, and GL entries.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Reactive
                  </span>
                </div>

                {/* Simulator Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Customer Segment:
                    </label>
                    <select
                      value={simIsCommercial ? 'COMMERCIAL' : 'RESIDENTIAL'}
                      onChange={(e) => setSimIsCommercial(e.target.value === 'COMMERCIAL')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="COMMERCIAL">Commercial (is_commercial: True)</option>
                      <option value="RESIDENTIAL">Residential (is_commercial: False)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Carpet Area (Sq Ft):
                    </label>
                    <input
                      type="number"
                      value={simCarpetArea}
                      onChange={(e) => setSimCarpetArea(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Base Rate Per Sq Ft ({activeTenant.currency}):
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={simBaseRate}
                      onChange={(e) => setSimBaseRate(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Tax Rate (%):
                    </label>
                    <input
                      type="number"
                      value={simTaxRate}
                      onChange={(e) => setSimTaxRate(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Simulator Output Preview Card */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-300">Generated Invoice Summary</span>
                    <span className="font-mono text-indigo-400">
                      Template: {simIsCommercial ? 'TMPL-SOCIETY-COMMERCIAL' : 'TMPL-SOCIETY-QTR'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Base Maintenance ({simCarpetArea.toLocaleString()} sq ft @ {activeTenant.currency} {simBaseRate.toFixed(2)}):</span>
                      <span className="font-mono font-semibold">
                        {activeTenant.currency} {simCalculations.baseMaintSubtotal.toFixed(2)} (Tax: {activeTenant.currency} {simCalculations.baseMaintTax.toFixed(2)})
                      </span>
                    </div>

                    {simIsCommercial && (
                      <>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Parking Bays ({simParkingSlots} slots @ {activeTenant.currency} {simParkingRate.toFixed(2)}):</span>
                          <span className="font-mono font-semibold">
                            {activeTenant.currency} {simCalculations.parkingSubtotal.toFixed(2)} (Tax: {activeTenant.currency} {simCalculations.parkingTax.toFixed(2)})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Commercial HVAC Chiller Surcharge:</span>
                          <span className="font-mono font-semibold">
                            {activeTenant.currency} {simCalculations.hvacSubtotal.toFixed(2)} (Tax: {activeTenant.currency} {simCalculations.hvacTax.toFixed(2)})
                          </span>
                        </div>
                      </>
                    )}

                    {!simIsCommercial && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Mandatory Sinking Fund Levy (Fixed):</span>
                        <span className="font-mono font-semibold">
                          {activeTenant.currency} {simCalculations.sinkingFundSubtotal.toFixed(2)} (Tax: $0.00)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Total Net Subtotal:</div>
                      <div className="text-sm font-bold text-slate-200">
                        {activeTenant.currency} {simCalculations.subtotal.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Total Tax Liability:</div>
                      <div className="text-sm font-bold text-slate-200">
                        {activeTenant.currency} {simCalculations.totalTax.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-emerald-400 font-semibold">Total Invoice Amount:</div>
                      <div className="text-lg font-black text-emerald-400">
                        {activeTenant.currency} {simCalculations.totalInvoice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 2: DYNAMIC CUSTOM ATTRIBUTES */}
          {/* ========================================================================= */}
          {selectedTopicId === 'dynamic-attributes' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                    <Sliders className="w-4 h-4" />
                    <span>Master Data & Schema Extensibility</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Dynamic Custom Attributes (EAV Schema Engine)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Extend Customer and Vendor records with typed fields without requiring SQL database migrations.
                  </p>
                </div>

                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('entity_master')}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start"
                  >
                    Open Custom Attributes Builder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Supported Types Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    BOOLEAN
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Binary Flags & Segmentation</h4>
                  <p className="text-xs text-slate-400">
                    Examples: <code>is_commercial</code>, <code>is_tax_exempt</code>, <code>has_parking_bay</code>.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Used by the bulk invoicing engine to automatically partition customers into True vs. False groups.
                  </p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    NUMBER
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Dynamic Multipliers</h4>
                  <p className="text-xs text-slate-400">
                    Examples: <code>carpet_area_sqft</code>, <code>seat_count</code>, <code>patient_cohort_size</code>.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Scales base line item unit rates dynamically per customer (e.g. 2,400 sq ft × $3.25).
                  </p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    SELECT & TEXT
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Categorical Grouping</h4>
                  <p className="text-xs text-slate-400">
                    Examples: <code>unit_wing</code> (Tower Alpha, Tower Beta, Commercial Plaza).
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Discovers all unique values and generates N distinct customer groups.
                  </p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    DATE
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Anniversary & Possession Dates</h4>
                  <p className="text-xs text-slate-400">
                    Examples: <code>possession_date</code>, <code>contract_renewal_date</code>.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Enables prorated billing cycles and milestone-based invoicing.
                  </p>
                </div>
              </div>

              {/* JSON Payload Example */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-300">
                    Sample Custom Attribute Schema Payload
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          [
                            {
                              key: 'is_commercial',
                              name: 'Is Commercial Unit',
                              dataType: 'boolean',
                              targetEntity: 'CUSTOMER',
                              defaultValue: false,
                            },
                            {
                              key: 'carpet_area_sqft',
                              name: 'Carpet Area (Sq Ft)',
                              dataType: 'number',
                              targetEntity: 'CUSTOMER',
                              defaultValue: 1200,
                            },
                          ],
                          null,
                          2
                        ),
                        'code-attr'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono"
                  >
                    {copiedCodeId === 'code-attr' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs font-mono text-indigo-200 bg-slate-900/90 p-3 rounded-lg overflow-x-auto">
{`[
  {
    "key": "is_commercial",
    "name": "Is Commercial Unit",
    "dataType": "boolean",
    "targetEntity": "CUSTOMER",
    "defaultValue": false
  },
  {
    "key": "carpet_area_sqft",
    "name": "Carpet Area (Sq Ft)",
    "dataType": "number",
    "targetEntity": "CUSTOMER",
    "defaultValue": 1200
  }
]`}
                </pre>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 3: INVOICE TEMPLATES */}
          {/* ========================================================================= */}
          {selectedTopicId === 'invoice-templates' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Invoicing Standardization</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Master Invoice Templates Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Create reusable, standardized templates with product codes, tax rates, GL revenue accounts, and dynamic tokens.
                  </p>
                </div>

                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('invoicing_ar')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start"
                  >
                    Manage Templates
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Template Architecture */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Template Fields & Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-200 mb-1">Standard Line Items</div>
                    <p className="text-slate-400">
                      Product code, description, default quantity, unit price, and tax bracket (0%, 5%, 12%, 18%).
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-200 mb-1">General Ledger Mapping</div>
                    <p className="text-slate-400">
                      Default Revenue Account Code (e.g. <code>4010</code> for Maintenance, <code>4020</code> for Consulting).
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-200 mb-1">Payment Terms</div>
                    <p className="text-slate-400">
                      Default due date offset (e.g. Net 15, Net 30, Due upon receipt).
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-200 mb-1">Dynamic Memo Tokens</div>
                    <p className="text-slate-400">
                      Supports dynamic replacement tokens: <code>{'{{customer_name}}'}</code>, <code>{'{{customer_code}}'}</code>, <code>{'{{billing_period}}'}</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 4: GENERAL LEDGER & DOUBLE-ENTRY */}
          {/* ========================================================================= */}
          {selectedTopicId === 'gl-double-entry' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Core Accounting</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    General Ledger & Balanced Double-Entry Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Every operational transaction (Invoice, Bill, Payment, Depreciation) enforces mathematical debits=credits equality.
                  </p>
                </div>

                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start"
                  >
                    Open General Ledger
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-cyan-300">
                  Standard Double-Entry Vouchers Generated by the System:
                </div>
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="font-bold text-white mb-1">Customer Invoice Generation:</div>
                    <div className="text-emerald-400">Debit: Acc 1100 (Accounts Receivable) - Total Due</div>
                    <div className="text-cyan-400">Credit: Acc 4010 (Revenue) - Subtotal</div>
                    <div className="text-amber-400">Credit: Acc 2110 (Tax / GST Payable) - Tax Total</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="font-bold text-white mb-1">Customer Payment Receipt:</div>
                    <div className="text-emerald-400">Debit: Acc 1010 (Operating Bank Account) - Amount Received</div>
                    <div className="text-rose-400">Credit: Acc 1100 (Accounts Receivable) - Clears Balance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 5: MULTI-STANDARD SWITCHING */}
          {/* ========================================================================= */}
          {selectedTopicId === 'multi-standard' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <Globe2 className="w-4 h-4" />
                  <span>Global Tax & Accounting Jurisdictions</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Multi-Standard Switching (US GAAP / EU IFRS / IN GST)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamically adjust reporting standards, tax validation rules, and Chart of Accounts per tenant.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-indigo-400 text-sm">US GAAP</div>
                  <p className="text-xs text-slate-400">
                    ASC 606 revenue recognition, LIFO/FIFO inventory, and Form 1099 vendor reporting.
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-400 text-sm">EU IFRS</div>
                  <p className="text-xs text-slate-400">
                    IAS 7 cash flow statements, IFRS 16 lease accounting, and pan-European VAT validation.
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 text-sm">IN GST</div>
                  <p className="text-xs text-slate-400">
                    Dual GST architecture (CGST + SGST for intra-state, IGST for inter-state), GSTR-1 and GSTR-3B filings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 6: AR PAYMENTS, AGING & EXCEL EXPORT */}
          {/* ========================================================================= */}
          {selectedTopicId === 'ar-payments' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    <Receipt className="w-4 h-4" />
                    <span>Accounts Receivable & Aging Analysis</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Customer Statements, AR Aging & Excel Exports
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    View customer 360 balances, track multi-bracket aging schedules, and export financial datasets directly to Microsoft Excel (.xlsx).
                  </p>
                </div>

                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('invoicing_ar')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Open Invoicing & AR
                  </button>
                )}
              </div>

              {/* Step by step features */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono">1</span>
                    Where to see Customer Invoice & Payment History and Balance?
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-7">
                    Go to <strong>Invoicing & AR</strong> in the main navigation. You can view balances in two comprehensive ways:
                  </p>
                  <ul className="list-disc pl-12 text-xs text-slate-300 space-y-1">
                    <li>
                      <strong>Customer Invoice Register:</strong> Shows all issued invoices, total amounts, paid amounts, balance due, and aging status (Current, 1-30, 31-60, 61-90, 90+ days past due).
                    </li>
                    <li>
                      <strong>Customer AR Statements (360° View):</strong> Switch to the <em>"Customer AR Statements"</em> sub-tab to inspect any individual customer's opening balances, chronological ledger, invoices register, and payment receipts breakdown.
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono">2</span>
                    How to Export Customer Invoices & Aging to Excel (.xlsx)?
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-7">
                    The platform generates native formatted Microsoft Excel XML Workbooks compatible with Excel 2007-2024, Microsoft 365, LibreOffice, and Google Sheets:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pl-7 pt-1 text-xs">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Invoices Register (.xlsx)
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Exports full register with header summaries, itemized invoice rows, tax splits, payments, balances, and revenue account codes.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        AR Aging Matrix (.xlsx)
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Multi-sheet workbook containing customer aging breakdown across 5 aging brackets (Current, 1-30, 31-60, 61-90, 90+) plus itemized overdue schedule.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        Customer Statement (.xlsx)
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Multi-tab statement workbook for a single customer with Statement Summary, Running Ledger, Invoices Register, and Payment Receipts log.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono">3</span>
                    Receiving Payments & Automatic Subledger-to-GL Posting
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-7">
                    Clicking <strong>"Receive Customer Payment"</strong> allows multi-invoice allocation or auto-allocation to oldest open invoices (FIFO). When confirmed, it automatically updates customer balances and posts balanced double-entry transactions (Debit Cash/Bank <code>1010</code>, Credit Accounts Receivable <code>1100</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 7: RECONCILIATION */}
          {/* ========================================================================= */}
          {selectedTopicId === 'reconciliation' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
                  <Landmark className="w-4 h-4" />
                  <span>Banking & Liquidity</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  3-Way Bank Reconciliation & Treasury Cash Flow
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Automated matching between bank statements, internal cash ledger entries, and vendor remittances.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  The reconciliation engine imports OFX, CSV, and CAMT.053 bank feeds, automatically matching reference IDs, dates, and amounts against General Ledger Account <code>1010</code>.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 8: GOVERNANCE & RBAC */}
          {/* ========================================================================= */}
          {selectedTopicId === 'governance-rbac' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Internal Controls & Compliance</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  SOX 404 RBAC, Approvals & Period Locking
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enterprise role hierarchy and maker-checker segregation of duties.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong>Super User & Entity Admin:</strong> Global tenant provisioning and organizational partition control.
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong>Controller & Admin:</strong> Fiscal period locking, batch rollback authority, and journal approval.
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong>Senior & Junior Accountant:</strong> Draft preparation and standard subledger operations.
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <strong>Auditor:</strong> Read-only access to immutable journal history, hash chains, and trial balances.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 9: AI AUDIT COPILOT */}
          {/* ========================================================================= */}
          {selectedTopicId === 'ai-copilot' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Artificial Intelligence</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  AI Audit Copilot Powered by Gemini
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Continuous audit monitoring, anomaly detection, and natural language ledger analysis.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  The AI Audit Copilot inspects journal lines for unusual amounts, round-trip transactions, unapproved weekend postings, and tax calculation variances.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOPIC 10: ACCESSIBILITY & DISPLAY SETTINGS */}
          {/* ========================================================================= */}
          {selectedTopicId === 'accessibility-display' && (
            <div className="space-y-6">
              <FontSizeControl variant="full_panel" />

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Font Size Scaling Architecture</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Enterprise Audit Studio uses standard REM-based visual typography calculations. When you modify the font size in the header toolbar or in this settings panel:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-semibold text-slate-200">Real-Time Fluid Scaling:</span>
                    <p>All chart labels, general ledger rows, journal inputs, and data grid tables adapt immediately without requiring page refresh.</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-semibold text-slate-200">Local Browser Persistence:</span>
                    <p>Your chosen zoom and font size preferences are automatically saved in local browser storage across all tenant entities and sessions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
