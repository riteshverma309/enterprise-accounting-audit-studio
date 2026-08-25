import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Calendar,
  RotateCcw,
  Sliders,
  DollarSign,
  Download,
  Filter,
  Check,
  Building2,
  FileText,
  Clock,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  CustomerGroupConfig,
  BulkInvoicePreviewItem,
  CustomerContact,
  InvoiceTemplate,
  BulkInvoiceBatchRun,
} from '../types';
import {
  discoverCustomerGroupingAttributes,
  generateGroupsForAttribute,
  buildCustomerInvoicePreview,
  exportBulkInvoicePreviewToCsv,
  GroupingAttributeOption,
} from '../utils/customerGroupingEngine';

interface BulkInvoiceGenerationViewProps {
  onNavigateToInvoice?: (invoiceId: string) => void;
  onNavigateToTemplates?: () => void;
}

export const BulkInvoiceGenerationView: React.FC<BulkInvoiceGenerationViewProps> = ({ onNavigateToInvoice,
  onNavigateToTemplates,
}) => {
  const { tr, t } = useLanguage();
  const {
    activeTenant,
    customers,
    customAttributeDefinitions,
    invoiceTemplates,
    bulkInvoiceBatches,
    batchCreateInvoices,
    rollbackInvoiceBatch,
    hasPermission,
  } = useAccounting();

  const canGenerate = hasPermission('EXECUTE_BULK_OPERATIONS') || hasPermission('CREATE_JOURNALS');

  // Top level mode: 'WIZARD' or 'BATCH_HISTORY'
  const [viewMode, setViewMode] = useState<'WIZARD' | 'HISTORY'>('WIZARD');

  // Wizard Step: 1 = Grouping, 2 = Template Mapping, 3 = Preview & Validate, 4 = Success
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Discovery attributes
  const groupingOptions = useMemo(() => {
    return discoverCustomerGroupingAttributes(customers, customAttributeDefinitions);
  }, [customers, customAttributeDefinitions]);

  // Selected grouping key (e.g. 'is_commercial', 'category', 'unit_wing', 'paymentTermsDays', etc.)
  const [selectedAttributeKey, setSelectedAttributeKey] = useState<string>('is_commercial');
  const [batchTitle, setBatchTitle] = useState<string>('Society Maintenance & Assessment Run - August 2026');
  const [billingPeriod, setBillingPeriod] = useState<string>('August 2026');

  // Group configurations state
  const [groupConfigs, setGroupConfigs] = useState<CustomerGroupConfig[]>([]);

  // Preview items state
  const [previewItems, setPreviewItems] = useState<BulkInvoicePreviewItem[]>([]);
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewGroupFilter, setPreviewGroupFilter] = useState<string>('ALL');

  // Committed batch result
  const [lastCommittedBatch, setLastCommittedBatch] = useState<BulkInvoiceBatchRun | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Initialize group configs when attribute changes or on mount
  useEffect(() => {
    if (groupingOptions.length > 0) {
      // If default 'is_commercial' is in options, use it, else first available
      const keyToUse = groupingOptions.some((g) => g.key === selectedAttributeKey)
        ? selectedAttributeKey
        : groupingOptions[0].key;

      const generated = generateGroupsForAttribute(
        keyToUse,
        customers,
        invoiceTemplates,
        activeTenant,
        billingPeriod
      );
      setGroupConfigs(generated);
    }
  }, [selectedAttributeKey, customers, invoiceTemplates, activeTenant]);

  // Update preview items whenever group configs or templates change
  useEffect(() => {
    if (wizardStep >= 2) {
      const items: BulkInvoicePreviewItem[] = [];
      const customerMap = new Map<string, CustomerContact>(customers.map((c) => [c.id, c]));
      const templateMap = new Map<string, InvoiceTemplate>(invoiceTemplates.map((t) => [t.id, t]));

      let runningIdx = 1;
      groupConfigs.forEach((grp) => {
        if (grp.isExcluded) return;
        const tmpl = templateMap.get(grp.templateId) || invoiceTemplates[0];

        grp.customerIds.forEach((custId) => {
          const cust = customerMap.get(custId);
          if (cust) {
            const prev = buildCustomerInvoicePreview(cust, grp, tmpl, activeTenant, runningIdx);
            items.push(prev);
            runningIdx += 1;
          }
        });
      });

      setPreviewItems(items);
    }
  }, [groupConfigs, wizardStep, invoiceTemplates, customers, activeTenant]);

  // Selected attribute details
  const currentAttrOption = groupingOptions.find((g) => g.key === selectedAttributeKey);

  // Group metrics calculation
  const totalEligibleCustomers = useMemo(() => {
    return groupConfigs
      .filter((g) => !g.isExcluded)
      .reduce((sum, g) => sum + g.customerIds.length, 0);
  }, [groupConfigs]);

  const previewMetrics = useMemo(() => {
    const activePreviews = previewItems.filter((p) => !p.isExcluded);
    const subtotal = activePreviews.reduce((sum, p) => sum + p.subtotal, 0);
    const taxTotal = activePreviews.reduce((sum, p) => sum + p.taxTotal, 0);
    const totalAmount = activePreviews.reduce((sum, p) => sum + p.totalAmount, 0);
    return {
      count: activePreviews.length,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }, [previewItems]);

  // Handler to update a specific group config
  const handleUpdateGroup = (groupId: string, updates: Partial<CustomerGroupConfig>) => {
    setGroupConfigs((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  };

  // Toggle item exclusion in preview table
  const handleToggleExcludeItem = (itemId: string) => {
    setPreviewItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, isExcluded: !it.isExcluded } : it))
    );
  };

  // Export Preview to CSV
  const handleDownloadPreviewCsv = () => {
    const csvData = exportBulkInvoicePreviewToCsv(previewItems, activeTenant.currency);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk-invoice-preview-${billingPeriod.replace(/\s+/g, '-').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Commit Batch Invoices Execution
  const handleCommitBatch = () => {
    setIsProcessing(true);
    setFeedbackError(null);

    try {
      const activePreviews = previewItems.filter((p) => !p.isExcluded);
      if (activePreviews.length === 0) {
        setFeedbackError('No active customer invoices to commit in this batch.');
        setIsProcessing(false);
        return;
      }

      // Group breakdowns
      const breakdowns = groupConfigs
        .filter((g) => !g.isExcluded)
        .map((g) => {
          const tmpl = invoiceTemplates.find((t) => t.id === g.templateId);
          const grpItems = activePreviews.filter((p) => p.groupId === g.id);
          const grpTotal = grpItems.reduce((s, p) => s + p.totalAmount, 0);

          return {
            groupId: g.id,
            groupName: g.name,
            templateCode: tmpl?.code || 'CUSTOM',
            templateName: tmpl?.name || 'Custom Group Configuration',
            customerCount: grpItems.length,
            groupTotalAmount: Math.round(grpTotal * 100) / 100,
          };
        });

      const templateIds = Array.from(
        new Set(groupConfigs.filter((g) => !g.isExcluded).map((g) => g.templateId).filter(Boolean))
      );

      const invoicesData = activePreviews.map((p) => ({
        tenantId: activeTenant.id,
        customerId: p.customerId,
        customerName: p.customerName,
        customerEmail: p.customerEmail,
        issueDate: p.issueDate,
        dueDate: p.dueDate,
        currency: p.currency,
        revenueAccountCode: p.revenueAccountCode,
        items: p.items,
        subtotal: p.subtotal,
        taxTotal: p.taxTotal,
        totalAmount: p.totalAmount,
        notes: p.notes,
        billingAddress: p.billingAddress,
      }));

      const res = batchCreateInvoices({
        title: batchTitle,
        groupingAttributeKey: selectedAttributeKey,
        groupingAttributeName: currentAttrOption?.name || selectedAttributeKey,
        invoicesData,
        groupBreakdowns: breakdowns,
        templateIdsUsed: templateIds,
      });

      if (res.success && res.batchRun) {
        setLastCommittedBatch(res.batchRun);
        setWizardStep(4);
      } else {
        setFeedbackError(res.error || 'Failed to generate bulk invoices batch.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'An unexpected error occurred during batch generation.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Rollback Past Batch
  const handleRollbackBatch = (batchId: string) => {
    if (window.confirm('Are you sure you want to rollback this batch run? All generated invoices in this batch will be marked as VOID.')) {
      const res = rollbackInvoiceBatch(batchId, 'Manual rollback from Bulk Invoicing History');
      if (!res.success) {
        alert(res.error || 'Failed to rollback batch.');
      }
    }
  };

  return (
    <div className="space-y-6" id="bulk-invoice-engine-root">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Bulk Invoice Generation Engine
              </h2>
              <p className="text-sm text-slate-500">
                Segment customers by custom attributes, apply specialized templates, and post batch subledger invoices to General Ledger.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode('WIZARD');
              setWizardStep(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'WIZARD'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            New Batch Run
          </button>
          <button
            type="button"
            onClick={() => setViewMode('HISTORY')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'HISTORY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Batch History ({bulkInvoiceBatches.length})
          </button>
        </div>
      </div>

      {/* VIEW MODE: BATCH HISTORY */}
      {viewMode === 'HISTORY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{tr('Bulk Invoicing Batch Audit Logs')}</h3>
              <p className="text-sm text-slate-500">
                History of all atomic bulk invoice runs, segment breakdowns, and reversal status.
              </p>
            </div>
          </div>

          {bulkInvoiceBatches.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-700">{tr('No bulk batches generated yet')}</p>
              <p className="text-sm mt-1">{tr('Start a new batch run to generate invoices for customer groups.')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {bulkInvoiceBatches.map((batch) => (
                <div key={batch.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {batch.batchNumber}
                        </span>
                        <h4 className="text-base font-semibold text-slate-900">{batch.title}</h4>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            batch.status === 'COMMITTED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span>
                          <strong>{tr('Run Date:')}</strong> {new Date(batch.createdAt).toLocaleString()}
                        </span>
                        <span>
                          <strong>{tr('Operator:')}</strong> {batch.createdBy}
                        </span>
                        <span>
                          <strong>{tr('Grouping Field:')}</strong> {batch.groupingAttributeName}
                        </span>
                        <span>
                          <strong>{tr('Groups Count:')}</strong> {batch.groupsCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{tr('Total Batch Value')}</div>
                        <div className="text-lg font-bold text-slate-900">
                          {activeTenant.currency} {batch.totalBatchAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-emerald-600">
                          {batch.totalInvoicesGenerated} Invoices Generated
                        </div>
                      </div>

                      {batch.status === 'COMMITTED' && (
                        <button
                          type="button"
                          onClick={() => handleRollbackBatch(batch.id)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Rollback Batch
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Group breakdown chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-2">{tr('Group Breakdown & Assigned Templates:')}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {batch.groupBreakdowns.map((grp) => (
                        <div
                          key={grp.groupId}
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{grp.groupName}</div>
                            <div className="text-slate-500 font-mono text-[11px]">
                              {grp.templateCode} - {grp.templateName}
                            </div>
                          </div>
                          <div className="text-right pl-2">
                            <div className="font-bold text-slate-900">
                              {activeTenant.currency} {grp.groupTotalAmount.toFixed(2)}
                            </div>
                            <div className="text-slate-500">{grp.customerCount} customers</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: WIZARD */}
      {viewMode === 'WIZARD' && (
        <div className="space-y-6">
          {/* Step Progress Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                onClick={() => wizardStep > 1 && setWizardStep(1)}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                  wizardStep === 1
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                    : wizardStep > 1
                    ? 'text-emerald-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 1
                      ? 'bg-indigo-600 text-white'
                      : wizardStep > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {wizardStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{tr('Step 1')}</div>
                  <div className="text-sm font-medium leading-none">{tr('Customer Segmentation')}</div>
                </div>
              </div>

              <div
                onClick={() => wizardStep > 2 && setWizardStep(2)}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                  wizardStep === 2
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                    : wizardStep > 2
                    ? 'text-emerald-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 2
                      ? 'bg-indigo-600 text-white'
                      : wizardStep > 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {wizardStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{tr('Step 2')}</div>
                  <div className="text-sm font-medium leading-none">{tr('Template Mapping')}</div>
                </div>
              </div>

              <div
                onClick={() => wizardStep > 3 && setWizardStep(3)}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                  wizardStep === 3
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                    : wizardStep > 3
                    ? 'text-emerald-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 3
                      ? 'bg-indigo-600 text-white'
                      : wizardStep > 3
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {wizardStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{tr('Step 3')}</div>
                  <div className="text-sm font-medium leading-none">{tr('Preview & Validate')}</div>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-2.5 rounded-lg ${
                  wizardStep === 4
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  4
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{tr('Step 4')}</div>
                  <div className="text-sm font-medium leading-none">{tr('Post & Ledger Summary')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: CUSTOMER SEGMENTATION */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">{tr('Configure Customer Segmentation Attribute')}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Select a customer attribute (Boolean flag like <code>{tr('IsCommercial')}</code>{tr(', or text fields like')} <code>{tr('unit_wing')}</code>, <code>{tr('category')}</code>, or custom attributes) to dynamically generate target customer groups.
                  </p>
                </div>

                {/* Batch Header info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Batch Invoicing Run Title *
                    </label>
                    <input
                      type="text"
                      value={batchTitle}
                      onChange={(e) => setBatchTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                      placeholder={tr('e.g. Society Maintenance & Assessment Run - August 2026')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Billing Period / Assessment Cycle *
                    </label>
                    <input
                      type="text"
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                      placeholder={tr('e.g. August 2026 or Q3 2026')}
                    />
                  </div>
                </div>

                {/* Attribute Selector Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Choose Dynamic Grouping Attribute ({groupingOptions.length} available fields)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {/* All customers single option */}
                    <div
                      onClick={() => setSelectedAttributeKey('ALL_CUSTOMERS')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAttributeKey === 'ALL_CUSTOMERS'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Single Group
                        </span>
                        {selectedAttributeKey === 'ALL_CUSTOMERS' && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{tr('All Customers (Unified)')}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Apply a uniform invoice template across all {customers.length} customer records.
                      </p>
                    </div>

                    {/* Dynamic discovered attributes */}
                    {groupingOptions.map((opt) => (
                      <div
                        key={opt.key}
                        onClick={() => setSelectedAttributeKey(opt.key)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAttributeKey === opt.key
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              opt.dataType === 'boolean'
                                ? 'bg-amber-100 text-amber-800'
                                : opt.isCustom
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {opt.dataType.toUpperCase()}
                          </span>
                          {selectedAttributeKey === opt.key && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{opt.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {opt.description || `Key: ${opt.key}`}
                        </p>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {opt.dataType === 'boolean'
                              ? 'Creates 2 Groups (True / False)'
                              : `${opt.distinctValuesCount} distinct values discovered`}
                          </span>
                          <span className="font-mono text-[11px] text-indigo-600 font-semibold">
                            {opt.key}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Groups Preview */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Generated Target Groups for "{currentAttrOption?.name || selectedAttributeKey}"
                      </h4>
                      <p className="text-xs text-slate-500">
                        The system has segmented {customers.length} customers into {groupConfigs.length} distinct groups.
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                      {totalEligibleCustomers} Total Customers Included
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupConfigs.map((grp) => {
                      const matchedCusts = customers.filter((c) => grp.customerIds.includes(c.id));
                      return (
                        <div
                          key={grp.id}
                          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                              <span className="font-bold text-slate-900 text-sm">{grp.name}</span>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {grp.customerIds.length} Customers
                            </span>
                          </div>

                          <div className="text-xs text-slate-500">
                            <strong>{tr('Filter Criteria:')}</strong> {grp.displayValueLabel || String(grp.matchValue)}
                          </div>

                          <div className="text-xs text-slate-600 line-clamp-1">
                            <strong>{tr('Members:')}</strong>{' '}
                            {matchedCusts.map((c) => c.name).join(', ') || 'No customers in this segment'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    disabled={groupConfigs.length === 0 || totalEligibleCustomers === 0}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors"
                  >
                    Proceed to Template Mapping
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TEMPLATE MAPPING PER GROUP */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{tr('Map Invoice Templates & Dynamic Rules')}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Assign a distinct invoice template, rate multiplier, and dynamic formula per customer group.
                    </p>
                  </div>
                  {onNavigateToTemplates && (
                    <button
                      type="button"
                      onClick={onNavigateToTemplates}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      Manage Master Templates
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {groupConfigs.map((group, gIdx) => {
                    const assignedTmpl = invoiceTemplates.find((t) => t.id === group.templateId);
                    return (
                      <div
                        key={group.id}
                        className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                              {gIdx + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{group.name}</h4>
                              <span className="text-xs text-slate-500">
                                Segment condition: {group.displayValueLabel || String(group.matchValue)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded">
                              {group.customerIds.length} Customers in Group
                            </span>
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer ml-2">
                              <input
                                type="checkbox"
                                checked={group.isExcluded || false}
                                onChange={(e) => handleUpdateGroup(group.id, { isExcluded: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              Exclude Group
                            </label>
                          </div>
                        </div>

                        {!group.isExcluded && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Template Selector & Settings */}
                            <div className="lg:col-span-5 space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                  Applied Invoice Template *
                                </label>
                                <select
                                  value={group.templateId}
                                  onChange={(e) => handleUpdateGroup(group.id, { templateId: e.target.value })}
                                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                  {invoiceTemplates.map((tmpl) => (
                                    <option key={tmpl.id} value={tmpl.id}>
                                      [{tmpl.code}] {tmpl.name} ({tmpl.category})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Issue Date
                                  </label>
                                  <input
                                    type="date"
                                    value={group.issueDate}
                                    onChange={(e) => handleUpdateGroup(group.id, { issueDate: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Due Date
                                  </label>
                                  <input
                                    type="date"
                                    value={group.dueDate}
                                    onChange={(e) => handleUpdateGroup(group.id, { dueDate: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                                  />
                                </div>
                              </div>

                              {/* Dynamic Attribute Quantity Multiplier */}
                              <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                  Dynamic Quantity Multiplier Field (Optional)
                                </label>
                                <select
                                  value={group.quantityAttributeMultiplierKey || ''}
                                  onChange={(e) =>
                                    handleUpdateGroup(group.id, {
                                      quantityAttributeMultiplierKey: e.target.value || undefined,
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                                >
                                  <option value="">{tr('-- No Multiplier (Fixed Template Quantities) --')}</option>
                                  <option value="carpet_area_sqft">{tr('Carpet Area in Sq Ft (carpet_area_sqft)')}</option>
                                  <option value="seat_count">{tr('Enterprise User Seats (seat_count)')}</option>
                                  <option value="patient_cohort_size">{tr('Cohort Patient Size (patient_cohort_size)')}</option>
                                  {customAttributeDefinitions
                                    .filter((d) => d.dataType === 'number')
                                    .map((d) => (
                                      <option key={d.key} value={d.key}>
                                        {d.name} ({d.key})
                                      </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  If chosen, multiplies unit base rates by the customer's attribute value (e.g. 2,400 sq ft × $3.25).
                                </p>
                              </div>
                            </div>

                            {/* Template Line Items Preview Box */}
                            <div className="lg:col-span-7 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                                <span>Template Items Breakdown ({assignedTmpl?.items.length || 0} lines)</span>
                                <span className="font-mono text-indigo-700">{assignedTmpl?.code}</span>
                              </div>

                              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                {assignedTmpl?.items.map((line) => (
                                  <div
                                    key={line.id}
                                    className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded border border-slate-100"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-semibold text-slate-800">{line.description}</div>
                                      <div className="text-[11px] text-slate-500">
                                        Base: {line.quantity} {line.unitOfMeasure || 'unit'} @ {activeTenant.currency} {line.unitPrice.toFixed(2)} | Tax: {line.taxRate}%
                                      </div>
                                    </div>
                                    <div className="font-bold text-slate-900 text-right">
                                      {activeTenant.currency} {((line.quantity || 1) * (line.unitPrice || 0)).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                  Dynamic Memo / Notes Template
                                </label>
                                <input
                                  type="text"
                                  value={group.notesTemplate || ''}
                                  onChange={(e) => handleUpdateGroup(group.id, { notesTemplate: e.target.value })}
                                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                                  placeholder="e.g. Assessment for {{customer_name}} - {{billing_period}}"
                                />
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Available tokens: <code>{'{{customer_name}}'}</code>, <code>{'{{customer_code}}'}</code>, <code>{'{{billing_period}}'}</code>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Segmentation
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors"
                  >
                    Proceed to Preview & Validate
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & PRE-FLIGHT VALIDATE */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{tr('Pre-Flight Batch Validation & Invoice Preview')}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Review all computed line items, area-multipliers, tax totals, and customer details before posting to the ledger.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPreviewCsv}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Preview CSV
                  </button>
                </div>

                {/* Pre-flight Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                    <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">{tr('Total Invoices')}</div>
                    <div className="text-2xl font-black text-indigo-950 mt-1">{previewMetrics.count}</div>
                    <div className="text-xs text-indigo-600 mt-0.5">Across {groupConfigs.filter(g => !g.isExcluded).length} groups</div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{tr('Subtotal Value')}</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {activeTenant.currency} {previewMetrics.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{tr('Base net revenue')}</div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{tr('Tax Liability')}</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {activeTenant.currency} {previewMetrics.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{tr('Credit to Acc 2110')}</div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">{tr('Total Batch Amount')}</div>
                    <div className="text-2xl font-black text-emerald-950 mt-1">
                      {activeTenant.currency} {previewMetrics.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-emerald-700 mt-0.5">{tr('Debit to Acc 1100 AR')}</div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      placeholder={tr('Search customer name or code...')}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">{tr('Filter Group:')}</span>
                    <select
                      value={previewGroupFilter}
                      onChange={(e) => setPreviewGroupFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      <option value="ALL">All Groups ({groupConfigs.length})</option>
                      {groupConfigs.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Previews Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">{tr('Include')}</th>
                        <th className="py-3 px-3">{tr('Customer')}</th>
                        <th className="py-3 px-3">{tr('Group & Template')}</th>
                        <th className="py-3 px-3">{tr('Line Items Summary & Formula Trace')}</th>
                        <th className="py-3 px-3 text-right">{tr('Subtotal')}</th>
                        <th className="py-3 px-3 text-right">{tr('Tax')}</th>
                        <th className="py-3 px-3 text-right">Total ({activeTenant.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {previewItems
                        .filter((item) => {
                          if (previewGroupFilter !== 'ALL' && item.groupId !== previewGroupFilter) return false;
                          if (
                            previewSearch &&
                            !item.customerName.toLowerCase().includes(previewSearch.toLowerCase()) &&
                            !item.customerCode.toLowerCase().includes(previewSearch.toLowerCase())
                          ) {
                            return false;
                          }
                          return true;
                        })
                        .map((item) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              item.isExcluded ? 'opacity-40 bg-slate-50' : ''
                            }`}
                          >
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={!item.isExcluded}
                                onChange={() => handleToggleExcludeItem(item.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.customerName}</div>
                              <div className="font-mono text-[11px] text-slate-500">{item.customerCode}</div>
                              <div className="text-[11px] text-slate-400">{item.customerEmail}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{item.groupName}</div>
                              <div className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                {item.templateCode}
                              </div>
                            </td>
                            <td className="py-3 px-3 max-w-md">
                              <div className="space-y-1">
                                {item.items.map((line, lIdx) => (
                                  <div key={lIdx} className="text-slate-700">
                                    • {line.description}{' '}
                                    <span className="text-slate-500 font-mono text-[11px]">
                                      ({line.quantity} @ {activeTenant.currency} {line.unitPrice.toFixed(2)})
                                    </span>
                                  </div>
                                ))}
                                {item.calculationTrace && (
                                  <div className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono inline-block">
                                    ⚡ {item.calculationTrace}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                              {item.subtotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-500">
                              {item.taxTotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {item.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {feedbackError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{feedbackError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Template Mapping
                  </button>

                  <button
                    type="button"
                    onClick={handleCommitBatch}
                    disabled={isProcessing || previewMetrics.count === 0 || !canGenerate}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating Batch & Journal Entries...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Commit Batch & Post {previewMetrics.count} Invoices to General Ledger
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS & SUMMARY */}
          {wizardStep === 4 && lastCommittedBatch && (
            <div className="bg-white p-8 rounded-xl border border-emerald-200 shadow-sm space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">
                  Bulk Invoicing Batch Successfully Committed!
                </h3>
                <p className="text-sm text-slate-600 max-w-xl mx-auto">
                  Batch <strong>{lastCommittedBatch.batchNumber}</strong> has been generated and posted to the General Ledger with atomic double-entry journal vouchers.
                </p>
              </div>

              {/* Batch Receipt Summary */}
              <div className="max-w-2xl mx-auto bg-slate-50 p-6 rounded-xl border border-slate-200 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{tr('Batch Reference')}</span>
                    <div className="text-lg font-mono font-black text-indigo-700">{lastCommittedBatch.batchNumber}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{tr('Total Value')}</span>
                    <div className="text-lg font-black text-emerald-700">
                      {activeTenant.currency} {lastCommittedBatch.totalBatchAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">{tr('Invoices Generated:')}</span>
                    <div className="font-bold text-slate-900">{lastCommittedBatch.totalInvoicesGenerated}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{tr('Groups Processed:')}</span>
                    <div className="font-bold text-slate-900">{lastCommittedBatch.groupsCount} Groups</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{tr('Tax Payable (Acc 2110):')}</span>
                    <div className="font-bold text-slate-900">{activeTenant.currency} {lastCommittedBatch.totalTaxAmount.toFixed(2)}</div>
                  </div>
                </div>

                {/* Groups list */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-xs font-bold text-slate-700 mb-2">{tr('Group Breakdown:')}</div>
                  <div className="space-y-1.5">
                    {lastCommittedBatch.groupBreakdowns.map((grp) => (
                      <div key={grp.groupId} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-slate-200">
                        <span className="font-medium text-slate-800">{grp.groupName}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {grp.customerCount} invoices | {activeTenant.currency} {grp.groupTotalAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('HISTORY')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm rounded-lg transition-colors"
                >
                  View in Batch History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardStep(1);
                    setSelectedAttributeKey('is_commercial');
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition-colors"
                >
                  Create Another Batch Run
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
