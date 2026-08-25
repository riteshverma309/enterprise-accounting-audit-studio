import React, { useState, useRef, useMemo } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Info,
  Check,
  Search,
  Filter,
  Eye,
  AlertCircle,
  HelpCircle,
  Table,
  Copy,
  Layers,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import {
  generateCustomerCsvTemplate,
  generateCustomerJsonTemplate,
  exportCustomersToCsv,
  parseAndValidateCustomerUpload,
  CustomerParsedRow,
} from '../utils/customerImportExport';
import { downloadCsvFile } from '../utils/templateGenerator';
import { QuickAddAttributeModal } from './QuickAddAttributeModal';
import { CustomAttributeDefinition } from '../types';

interface CustomerBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CustomerBatchUploadModal: React.FC<CustomerBatchUploadModalProps> = ({ isOpen,
  onClose,
  onSuccess,
}) => {
  const { tr, t } = useLanguage();
  const {
    activeTenant,
    customers,
    customAttributeDefinitions,
    createCustomer,
    updateCustomer,
  } = useAccounting();

  // Active custom attributes for current tenant
  const customerAttributes = useMemo(() => {
    return customAttributeDefinitions.filter(
      (a) =>
        (!a.tenantId || a.tenantId === activeTenant.id || a.tenantId === 't-acme-us') &&
        (a.targetEntity === 'CUSTOMER' || a.targetEntity === 'BOTH')
    );
  }, [customAttributeDefinitions, activeTenant.id]);

  // Tab & Input modes: 'file' | 'paste' | 'manual'
  const [inputMode, setInputMode] = useState<'file' | 'paste' | 'manual'>('file');
  const [importStrategy, setImportStrategy] = useState<'append' | 'upsert'>('upsert');
  const [rawText, setRawText] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Parsed and validated rows
  const [parsedRows, setParsedRows] = useState<CustomerParsedRow[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ERRORS' | 'VALID'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // On the fly attribute modal inside upload flow
  const [isAddAttrModalOpen, setIsAddAttrModalOpen] = useState(false);

  // Status & Progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    success: boolean;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process and parse text content
  const handleParseContent = (content: string, fmt: 'csv' | 'json') => {
    if (!content.trim()) {
      setParsedRows([]);
      return;
    }
    const rows = parseAndValidateCustomerUpload(
      content,
      fmt,
      customAttributeDefinitions,
      customers
    );
    setParsedRows(rows);
    setImportSummary(null);
  };

  // Handle file drop or selection
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const isJson = file.name.endsWith('.json');
    const detectedFormat = isJson ? 'json' : 'csv';
    setFormat(detectedFormat);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawText(text);
      handleParseContent(text, detectedFormat);
    };
    reader.readAsText(file);
  };

  // Download Templates
  const handleDownloadCsvTemplate = () => {
    const csv = generateCustomerCsvTemplate(
      activeTenant.name,
      activeTenant.currency,
      customAttributeDefinitions,
      true
    );
    downloadCsvFile(
      `${activeTenant.code.toLowerCase()}_customers_template.csv`,
      csv
    );
  };

  const handleDownloadJsonTemplate = () => {
    const json = generateCustomerJsonTemplate(customAttributeDefinitions);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTenant.code.toLowerCase()}_customers_template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExistingToCsv = () => {
    const csv = exportCustomersToCsv(customers, customAttributeDefinitions);
    downloadCsvFile(
      `${activeTenant.code.toLowerCase()}_customers_export.csv`,
      csv
    );
  };

  // Inline Row Editor Handlers
  const handleUpdateRowCell = (rowIndex: number, field: string, value: any) => {
    setParsedRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[rowIndex] };

      if (field.startsWith('attr_')) {
        const attrKey = field.replace('attr_', '');
        target.customAttributes = {
          ...target.customAttributes,
          [attrKey]: value,
        };
      } else {
        (target as any)[field] = value;
      }

      // Revalidate target row
      const errors: string[] = [];
      const warnings: string[] = [];
      if (!target.name.trim()) errors.push('Customer Name is missing.');
      if (!target.email.trim()) errors.push('Customer Email is missing.');

      customerAttributes.forEach((attr) => {
        if (attr.isRequired && (target.customAttributes[attr.key] === undefined || target.customAttributes[attr.key] === '')) {
          errors.push(`Required field "${attr.name}" is missing.`);
        }
      });

      target.isValid = errors.length === 0;
      target.errors = errors;
      target.warnings = warnings;

      updated[rowIndex] = target;
      return updated;
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  const handleAddBlankRow = () => {
    const defaultAttrs: Record<string, any> = {};
    customerAttributes.forEach((a) => {
      if (a.defaultValue !== undefined) defaultAttrs[a.key] = a.defaultValue;
    });

    const newRow: CustomerParsedRow = {
      rowNumber: parsedRows.length + 1,
      code: `CUST-MAN-${String(parsedRows.length + 1).padStart(3, '0')}`,
      name: '',
      email: '',
      category: 'Enterprise Client',
      paymentTermsDays: 30,
      customAttributes: defaultAttrs,
      isValid: false,
      errors: ['Customer Name is missing.', 'Customer Email is missing.'],
      warnings: [],
      isExistingCode: false,
    };
    setParsedRows((prev) => [...prev, newRow]);
  };

  // Execute Batch Import
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    const validRows = parsedRows.filter((r) => r.isValid);

    validRows.forEach((row) => {
      const existing = customers.find(
        (c) => c.code.toLowerCase() === row.code.toLowerCase()
      );

      if (existing) {
        if (importStrategy === 'upsert') {
          updateCustomer(existing.id, {
            name: row.name,
            email: row.email,
            phone: row.phone || existing.phone,
            billingAddress: row.billingAddress || existing.billingAddress,
            category: row.category || existing.category,
            taxId: row.taxId || existing.taxId,
            paymentTermsDays: row.paymentTermsDays || existing.paymentTermsDays,
            notes: row.notes || existing.notes,
            customAttributes: {
              ...existing.customAttributes,
              ...row.customAttributes,
            },
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        const res = createCustomer({
          tenantId: activeTenant.id,
          code: row.code,
          name: row.name,
          email: row.email,
          phone: row.phone,
          billingAddress: row.billingAddress,
          category: row.category || 'Enterprise Client',
          status: 'ACTIVE',
          taxId: row.taxId,
          paymentTermsDays: row.paymentTermsDays || 30,
          notes: row.notes,
          customAttributes: row.customAttributes,
        });

        if (res.success) {
          createdCount++;
        } else {
          errors.push(`Row ${row.rowNumber} (${row.name}): ${res.error}`);
        }
      }
    });

    setIsProcessing(false);
    setImportSummary({
      success: errors.length === 0,
      createdCount,
      updatedCount,
      skippedCount,
      errors,
    });

    if (onSuccess && createdCount + updatedCount > 0) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  // Filtered rows for the preview table
  const displayedRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (filterMode === 'ERRORS' && r.isValid) return false;
      if (filterMode === 'VALID' && !r.isValid) return false;
      if (searchFilter) {
        const term = searchFilter.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(term);
        const matchesCode = r.code.toLowerCase().includes(term);
        const matchesEmail = r.email.toLowerCase().includes(term);
        return matchesName || matchesCode || matchesEmail;
      }
      return true;
    });
  }, [parsedRows, filterMode, searchFilter]);

  const validRowCount = parsedRows.filter((r) => r.isValid).length;
  const errorRowCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{tr('Customer Batch Upload & Directory Importer')}</h3>
                  <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-600/40 px-2 py-0.5 rounded-full font-semibold">{tr('Dynamic Schema Aware')}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Bulk import client records with full support for on-the-fly custom attributes ({customerAttributes.length} active custom fields).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-add-attr-inside-upload"
                onClick={() => setIsAddAttrModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title={tr('Add a new custom field to schema without leaving this upload view')}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{tr('+ Add Attribute On The Fly')}</span>
              </button>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Template Bar & Quick Actions */}
          <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                Upload Templates:
              </span>
              <button
                onClick={handleDownloadCsvTemplate}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3 text-indigo-400" />{tr('Download CSV Template')}</button>
              <button
                onClick={handleDownloadJsonTemplate}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3 text-emerald-400" />{tr('Download JSON Template')}</button>
              <button
                onClick={handleExportExistingToCsv}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
              >
                <FileText className="w-3 h-3 text-amber-400" />
                Export Current List ({customers.length})
              </button>
            </div>

            {/* Input Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setInputMode('file')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  inputMode === 'file'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >{tr('File Upload')}</button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  inputMode === 'paste'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >{tr('Copy & Paste Text')}</button>
              <button
                onClick={() => {
                  setInputMode('manual');
                  if (parsedRows.length === 0) handleAddBlankRow();
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  inputMode === 'manual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >{tr('Interactive Grid Entry')}</button>
            </div>
          </div>

          {/* Main Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Mode 1: File Drop Zone */}
            {inputMode === 'file' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl transition flex flex-col items-center justify-center text-center cursor-pointer ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-950/40 hover:border-indigo-400 hover:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.json,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400 mb-2">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-200 text-sm">
                  {fileName ? `Selected: ${fileName}` : 'Drag & Drop CSV, Excel/TSV, or JSON File here'}
                </h4>
                <p className="text-slate-400 text-xs mt-1">{tr('Supports .csv, .tsv, .json with auto-detection of standard fields and')}<span className="text-emerald-400 font-mono">{tr('attr_&lt;key&gt;')}</span>{tr('custom attribute headers.')}</p>
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold rounded-lg text-xs border border-slate-700 shadow-xs"
                >{tr('Browse Local Files')}</button>
              </div>
            )}

            {/* Mode 2: Paste Raw Text */}
            {inputMode === 'paste' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">
                    Paste Tabular Data from Excel, Sheets, or Raw CSV / JSON:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{tr('Format:')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormat('csv');
                        handleParseContent(rawText, 'csv');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        format === 'csv' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >{tr('CSV / TSV')}</button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormat('json');
                        handleParseContent(rawText, 'json');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        format === 'json' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >{tr('JSON')}</button>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    handleParseContent(e.target.value, format);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                  placeholder={tr('Paste rows here (e.g. code, name, email, phone, billingAddress, attr_flat_no, attr_carpet_area...)')}
                />
              </div>
            )}

            {/* Import Strategy & Dynamic Summary Cards */}
            {parsedRows.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                {/* Total card */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{tr('Total Rows')}</span>
                    <div className="text-base font-bold text-slate-100">{parsedRows.length}</div>
                  </div>
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>

                {/* Valid card */}
                <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400">{tr('Ready to Import')}</span>
                    <div className="text-base font-bold text-emerald-300">{validRowCount}</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>

                {/* Errors card */}
                <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-400">{tr('Validation Errors')}</span>
                    <div className="text-base font-bold text-rose-300">{errorRowCount}</div>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>

                {/* Strategy Selector */}
                <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{tr('Merge Strategy:')}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setImportStrategy('upsert')}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${
                        importStrategy === 'upsert'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={tr('Update existing customer code matches and insert new ones')}
                    >{tr('Upsert / Merge')}</button>
                    <button
                      type="button"
                      onClick={() => setImportStrategy('append')}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${
                        importStrategy === 'append'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={tr('Insert new customer records only')}
                    >{tr('Append Only')}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Toast / Execution Summary */}
            {importSummary && (
              <div
                className={`p-4 rounded-xl border ${
                  importSummary.success
                    ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-600/60 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {importSummary.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span>
                    Batch Import Completed: {importSummary.createdCount} Created, {importSummary.updatedCount} Updated, {importSummary.skippedCount} Skipped
                  </span>
                </div>
                {importSummary.errors.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-[11px] text-rose-300 space-y-0.5">
                    {importSummary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Interactive Data Table & Validation Grid */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs">
                      Customer Staging & Live Validation Grid ({displayedRows.length} rows)
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFilterMode('ALL')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          filterMode === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'
                        }`}
                      >
                        All ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode('ERRORS')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          filterMode === 'ERRORS' ? 'bg-rose-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Errors ({errorRowCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode('VALID')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          filterMode === 'VALID' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Valid ({validRowCount})
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder={tr('Search staging rows...')}
                        className="pl-7 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBlankRow}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />{tr('Add Staging Row')}</button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center">#</th>
                        <th className="py-2 px-3 w-20 text-center">{tr('Status')}</th>
                        <th className="py-2 px-3 min-w-[100px]">{tr('Code *')}</th>
                        <th className="py-2 px-3 min-w-[160px]">{tr('Customer Name *')}</th>
                        <th className="py-2 px-3 min-w-[160px]">{tr('Email Address *')}</th>
                        <th className="py-2 px-3 min-w-[120px]">{tr('Phone')}</th>
                        <th className="py-2 px-3 min-w-[140px]">{tr('Category')}</th>
                        <th className="py-2 px-3 min-w-[140px]">{tr('Tax ID / SSN')}</th>
                        <th className="py-2 px-3 min-w-[160px]">{tr('Billing Address')}</th>

                        {/* Dynamic Custom Attribute Columns */}
                        {customerAttributes.map((attr) => (
                          <th
                            key={attr.id}
                            className="py-2 px-3 min-w-[140px] bg-slate-900/90 text-indigo-300 font-mono"
                          >
                            <div className="flex items-center gap-1">
                              <span>{attr.name}</span>
                              {attr.isRequired && <span className="text-rose-400">*</span>}
                              {attr.unitOrSuffix && (
                                <span className="text-[9px] text-amber-400 font-mono">
                                  ({attr.unitOrSuffix})
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 block uppercase font-normal">
                              {attr.dataType}
                            </span>
                          </th>
                        ))}

                        <th className="py-2 px-3 min-w-[180px]">{tr('Validation Notes')}</th>
                        <th className="py-2 px-3 w-12 text-right">{tr('Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {displayedRows.map((row, idx) => {
                        const originalIdx = parsedRows.findIndex((r) => r.rowNumber === row.rowNumber);

                        return (
                          <tr
                            key={row.rowNumber}
                            className={`hover:bg-slate-900/50 transition-colors ${
                              !row.isValid ? 'bg-rose-950/20' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                              {row.rowNumber}
                            </td>

                            <td className="py-2 px-3 text-center">
                              {row.isValid ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" />{tr('Valid')}</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-0.5">
                                  <X className="w-2.5 h-2.5" />{tr('Error')}</span>
                              )}
                            </td>

                            {/* Code */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.code}
                                onChange={(e) =>
                                  handleUpdateRowCell(originalIdx, 'code', e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-[11px] focus:border-indigo-500 focus:outline-none"
                              />
                            </td>

                            {/* Name */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) =>
                                  handleUpdateRowCell(originalIdx, 'name', e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none font-medium"
                              />
                            </td>

                            {/* Email */}
                            <td className="py-1 px-2">
                              <input
                                type="email"
                                value={row.email}
                                onChange={(e) =>
                                  handleUpdateRowCell(originalIdx, 'email', e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none text-[11px]"
                              />
                            </td>

                            {/* Phone */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.phone || ''}
                                onChange={(e) =>
                                  handleUpdateRowCell(originalIdx, 'phone', e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none text-[11px]"
                              />
                            </td>

                            {/* Category */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.category || ''}
                                onChange={(e) =>
                                  handleUpdateRowCell(originalIdx, 'category', e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none text-[11px]"
                              />
                            </td>

                            {/* Tax ID */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.taxId || ''}
                                onChange={(e) =>
                                  handleUpdateRowCell(originalIdx, 'taxId', e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-[11px] focus:border-indigo-500 focus:outline-none"
                              />
                            </td>

                            {/* Billing Address */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                value={row.billingAddress || ''}
                                onChange={(e) =>
                                  handleUpdateRowCell(originalIdx, 'billingAddress', e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 focus:border-indigo-500 focus:outline-none text-[11px]"
                              />
                            </td>

                            {/* Custom Attributes Cells */}
                            {customerAttributes.map((attr) => {
                              const cellVal = row.customAttributes[attr.key];

                              return (
                                <td key={attr.key} className="py-1 px-2 bg-slate-950/40">
                                  {attr.dataType === 'boolean' ? (
                                    <select
                                      value={cellVal === true ? 'true' : cellVal === false ? 'false' : ''}
                                      onChange={(e) => {
                                        const v = e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined;
                                        handleUpdateRowCell(originalIdx, `attr_${attr.key}`, v);
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-[11px] focus:border-indigo-500 focus:outline-none"
                                    >
                                      <option value="">{tr('(None)')}</option>
                                      <option value="true">{tr('TRUE / Yes')}</option>
                                      <option value="false">{tr('FALSE / No')}</option>
                                    </select>
                                  ) : attr.dataType === 'date' ? (
                                    <input
                                      type="date"
                                      value={cellVal || ''}
                                      onChange={(e) =>
                                        handleUpdateRowCell(originalIdx, `attr_${attr.key}`, e.target.value)
                                      }
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-[11px] focus:border-indigo-500 focus:outline-none"
                                    />
                                  ) : attr.dataType === 'number' || attr.dataType === 'decimal' ? (
                                    <input
                                      type="number"
                                      step={attr.dataType === 'decimal' ? '0.01' : '1'}
                                      value={cellVal !== undefined ? cellVal : ''}
                                      onChange={(e) => {
                                        const v = e.target.value === '' ? '' : Number(e.target.value);
                                        handleUpdateRowCell(originalIdx, `attr_${attr.key}`, v);
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-[11px] focus:border-indigo-500 focus:outline-none"
                                    />
                                  ) : attr.dataType === 'select' && attr.options ? (
                                    <select
                                      value={cellVal || ''}
                                      onChange={(e) =>
                                        handleUpdateRowCell(originalIdx, `attr_${attr.key}`, e.target.value)
                                      }
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-[11px] focus:border-indigo-500 focus:outline-none"
                                    >
                                      <option value="">{tr('Select option')}</option>
                                      {attr.options.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={cellVal || ''}
                                      onChange={(e) =>
                                        handleUpdateRowCell(originalIdx, `attr_${attr.key}`, e.target.value)
                                      }
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-[11px] focus:border-indigo-500 focus:outline-none"
                                    />
                                  )}
                                </td>
                              );
                            })}

                            {/* Validation Notes */}
                            <td className="py-2 px-3 text-[11px]">
                              {row.errors.length > 0 && (
                                <div className="text-rose-400 flex flex-col gap-0.5">
                                  {row.errors.map((err, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      {err}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {row.warnings.length > 0 && (
                                <div className="text-amber-400 flex flex-col gap-0.5">
                                  {row.warnings.map((w, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                      <Info className="w-3 h-3 shrink-0" />
                                      {w}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {row.errors.length === 0 && row.warnings.length === 0 && (
                                <span className="text-emerald-400">
                                  {row.isExistingCode
                                    ? `Code matches existing customer (will ${importStrategy})`
                                    : 'Valid new customer record'}
                                </span>
                              )}
                            </td>

                            {/* Delete row */}
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(originalIdx)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
                                title={tr('Delete staging row')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Controls */}
          <div className="p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/90">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>
                {validRowCount} valid records ready to commit to {activeTenant.name} database.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >{tr('Cancel')}</button>

              <button
                type="button"
                disabled={validRowCount === 0 || isProcessing}
                onClick={handleExecuteImport}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                  validRowCount > 0 && !isProcessing
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing {validRowCount} Records...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Commit & Import {validRowCount} Customers</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded On-the-Fly Attribute Creator Modal */}
      <QuickAddAttributeModal
        isOpen={isAddAttrModalOpen}
        onClose={() => setIsAddAttrModalOpen(false)}
        defaultTargetEntity="CUSTOMER"
        onAttributeCreated={(newAttr) => {
          // Trigger re-validation of staging rows with new attribute schema
          if (rawText) {
            handleParseContent(rawText, format);
          }
        }}
      />
    </>
  );
};
