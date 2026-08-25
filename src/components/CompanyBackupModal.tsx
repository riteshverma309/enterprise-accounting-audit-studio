import React, { useState, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
import {
  DownloadCloud,
  UploadCloud,
  Database,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  FileJson,
  X,
  History,
  HardDriveDownload,
  RotateCcw,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CompanyBackupPayload, BackupValidationResult } from '../types';

interface CompanyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'backup' | 'restore';
}

export const CompanyBackupModal: React.FC<CompanyBackupModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'backup',
}) => {
  const { tr, t } = useLanguage();
  const {
    activeTenant,
    tenants,
    accounts,
    journalEntries,
    invoices,
    vendorBills,
    customers,
    vendors,
    productsServices,
    inventoryItems,
    payrollEmployees,
    payrollRuns,
    connectedBankFeeds,
    bankStatements,
    fixedAssets,
    balanceSheet,
    downloadCompanyBackup,
    validateBackupFileContent,
    restoreCompanyBackup,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>(initialTab);
  const [backupScope, setBackupScope] = useState<'single_company' | 'full_system'>('single_company');
  const [downloadSuccess, setDownloadSuccess] = useState<{ fileName: string; recordCount: number } | null>(null);

  // Restore States
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace_current' | 'restore_as_new_tenant'>('replace_current');
  const [customTenantName, setCustomTenantName] = useState('');
  const [customTenantCode, setCustomTenantCode] = useState('');
  const [restoreSuccess, setRestoreSuccess] = useState<{ tenantName: string; restoredCount: number } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle 1-Click Download
  const handleDownload = () => {
    const res = downloadCompanyBackup({
      tenantId: activeTenant.id,
      scope: backupScope,
    });

    if (res.success && res.fileName && res.backupPayload) {
      const totalRecs = Object.values(res.backupPayload.metadata.recordCounts).reduce((a: number, b: number) => a + b, 0);
      setDownloadSuccess({
        fileName: res.fileName,
        recordCount: totalRecs,
      });
      setTimeout(() => {
        setDownloadSuccess(null);
      }, 6000);
    }
  };

  // Handle File Upload and Validation
  const processUploadedFile = (file: File) => {
    setRestoreError(null);
    setRestoreSuccess(null);
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setValidationResult({
          isValid: false,
          errors: ['Empty file content.'],
          warnings: [],
        });
        return;
      }

      const result = validateBackupFileContent(content);
      setValidationResult(result);
      if (result.metadata) {
        setCustomTenantName(`${result.metadata.tenantName} (Restored)`);
        setCustomTenantCode(`${result.metadata.tenantCode}_REST`);
      }
    };
    reader.onerror = () => {
      setRestoreError('Failed to read backup file.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Restore Action
  const handleExecuteRestore = () => {
    if (!validationResult || !validationResult.parsedPayload) return;

    setIsRestoring(true);
    setRestoreError(null);

    setTimeout(() => {
      const res = restoreCompanyBackup(validationResult.parsedPayload!, {
        mode: restoreMode,
        targetTenantName: customTenantName.trim() || undefined,
        targetTenantCode: customTenantCode.trim() || undefined,
      });

      setIsRestoring(false);

      if (res.success && res.tenantName) {
        const total = res.restoredCounts
          ? Object.values(res.restoredCounts).reduce((a: number, b: number) => a + b, 0)
          : 0;
        setRestoreSuccess({
          tenantName: res.tenantName,
          restoredCount: total,
        });
        setValidationResult(null);
        setUploadedFile(null);
      } else {
        setRestoreError(res.error || 'Failed to restore backup snapshot.');
      }
    }, 400);
  };

  // Summary counts for active tenant
  const activeStats = {
    accounts: accounts.length,
    journals: journalEntries.filter((j) => j.tenantId === activeTenant.id).length,
    invoices: invoices.filter((i) => i.tenantId === activeTenant.id).length,
    bills: vendorBills.filter((b) => b.tenantId === activeTenant.id).length,
    customers: customers.filter((c) => c.tenantId === activeTenant.id).length,
    vendors: vendors.filter((v) => v.tenantId === activeTenant.id).length,
    products: productsServices.filter((p) => p.tenantId === activeTenant.id).length,
    inventory: inventoryItems.filter((i) => i.tenantId === activeTenant.id).length,
    payroll: payrollEmployees.filter((p) => p.tenantId === activeTenant.id).length,
    bankFeeds: connectedBankFeeds.filter((b) => b.tenantId === activeTenant.id).length,
    assets: fixedAssets.filter((a) => a.tenantId === activeTenant.id).length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {tr('Company Data Backup & Restore')}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  1-Click Snapshot
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {tr('Export complete company financials and sub-ledgers, or restore the system to an exact point in time.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('backup');
              setRestoreError(null);
              setRestoreSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-slate-900 text-indigo-400 border-slate-800 border-b-transparent shadow'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>{tr('Download Company Backup')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('restore');
              setDownloadSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-t border-x cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-slate-900 text-indigo-400 border-slate-800 border-b-transparent shadow'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{tr('Restore from Point-in-Time Backup')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: DOWNLOAD BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              
              {/* Active Company Target Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold font-mono">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-base">{activeTenant.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {activeTenant.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Currency: <span className="font-semibold text-slate-200">{activeTenant.currency}</span> | Standard:{' '}
                        <span className="font-semibold text-slate-200 uppercase">{activeTenant.pluginId.replace('_', ' ')}</span> | Country:{' '}
                        <span className="font-semibold text-slate-200">{activeTenant.country}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 ${
                        balanceSheet.isBalanced
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          balanceSheet.isBalanced ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      {balanceSheet.isBalanced ? 'Ledger Balanced (DR=CR)' : 'Imbalance Detected'}
                    </div>
                  </div>
                </div>

                {/* Live Entities Preview Grid */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Chart of Accounts')}</span>
                    <p className="text-base font-bold text-slate-100 font-mono mt-0.5">{activeStats.accounts}</p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Journal Entries')}</span>
                    <p className="text-base font-bold text-slate-100 font-mono mt-0.5">{activeStats.journals}</p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('AR Invoices')}</span>
                    <p className="text-base font-bold text-slate-100 font-mono mt-0.5">{activeStats.invoices}</p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('AP Bills')}</span>
                    <p className="text-base font-bold text-slate-100 font-mono mt-0.5">{activeStats.bills}</p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Customers & Vend')}</span>
                    <p className="text-base font-bold text-slate-100 font-mono mt-0.5">
                      {activeStats.customers + activeStats.vendors}
                    </p>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Inventory & Payroll')}</span>
                    <p className="text-base font-bold text-slate-100 font-mono mt-0.5">
                      {activeStats.inventory + activeStats.payroll}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300">{tr('Backup Export Scope')}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() => setBackupScope('single_company')}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      backupScope === 'single_company'
                        ? 'bg-indigo-600/10 border-indigo-500 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-100">Current Company Only ({activeTenant.code})</span>
                      <Building2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Exports all accounts, journals, AR/AP, inventory, payroll, and sub-ledgers specifically for{' '}
                      <span className="text-slate-200">{activeTenant.name}</span>.
                    </p>
                  </div>

                  <div
                    onClick={() => setBackupScope('full_system')}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      backupScope === 'full_system'
                        ? 'bg-indigo-600/10 border-indigo-500 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-100">Full System Snapshot ({tenants.length} Companies)</span>
                      <Layers className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Exports complete multi-tenant database snapshot across all active corporate entities and entities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Success Banner */}
              {downloadSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-200">{tr('Company Data Backup Downloaded Successfully!')}</p>
                    <p className="text-emerald-300/80 font-mono mt-0.5">
                      File: {downloadSuccess.fileName} ({downloadSuccess.recordCount} total records exported)
                    </p>
                  </div>
                </div>
              )}

              {/* Action Banner */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{tr('Self-Contained JSON Backup Archive')}</h4>
                    <p className="text-[11px] text-slate-400">
                      Standardized schema format compatible with immediate 1-click restore.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>{tr('Download Company Data Now')}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE FROM BACKUP */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              
              {/* Instructions Callout */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-300">
                <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <p>
                  Select or drop a previously downloaded company backup JSON file. The system will inspect and validate the
                  schema before giving you the option to restore and revert to that point in time.
                </p>
              </div>

              {/* Upload Dropzone */}
              {!validationResult && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processUploadedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Drag and drop your company backup JSON file here
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{tr('or click to browse files from your computer')}</p>
                  <span className="inline-block mt-3 text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Supports: *.json (schema v1.0)
                  </span>
                </div>
              )}

              {/* Validation Inspection Card */}
              {validationResult && validationResult.metadata && (
                <div className="space-y-4">
                  <div
                    className={`border rounded-xl p-5 ${
                      validationResult.isValid
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-slate-100">{tr('Backup Inspection & Integrity Check')}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                            validationResult.isValid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {validationResult.isValid ? 'VALID SCHEMA' : 'INVALID BACKUP'}
                        </span>
                        <button
                          onClick={() => {
                            setValidationResult(null);
                            setUploadedFile(null);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-200 underline ml-2 cursor-pointer"
                        >
                          Choose another file
                        </button>
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Target Company')}</span>
                        <p className="font-bold text-slate-100 mt-0.5">
                          {validationResult.metadata.tenantName} ({validationResult.metadata.tenantCode})
                        </p>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Exported At')}</span>
                        <p className="font-mono text-slate-200 mt-0.5 text-[11px]">
                          {new Date(validationResult.metadata.exportedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Exported By')}</span>
                        <p className="font-mono text-slate-200 mt-0.5 text-[11px] truncate">
                          {validationResult.metadata.exportedBy}
                        </p>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{tr('Ledger Status')}</span>
                        <p
                          className={`font-semibold mt-0.5 ${
                            validationResult.metadata.isBalanced ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {validationResult.metadata.isBalanced ? 'Debits = Credits' : 'Trial Imbalance'}
                        </p>
                      </div>
                    </div>

                    {/* Counts Breakdown Chips */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-300 mb-2 block">
                        Included Dataset Breakdown:
                      </span>
                      <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Accounts: {validationResult.metadata.recordCounts.accounts}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Journals: {validationResult.metadata.recordCounts.journalEntries}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Invoices: {validationResult.metadata.recordCounts.invoices}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Bills: {validationResult.metadata.recordCounts.vendorBills}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Customers: {validationResult.metadata.recordCounts.customers}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Vendors: {validationResult.metadata.recordCounts.vendors}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Inventory: {validationResult.metadata.recordCounts.inventoryItems}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Payroll: {validationResult.metadata.recordCounts.payrollEmployees}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          Bank Feeds: {validationResult.metadata.recordCounts.connectedBankFeeds}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Errors / Warnings */}
                  {validationResult.errors.length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>{tr('Validation Errors Detected')}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {validationResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Restore Options */}
                  {validationResult.isValid && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                      <h4 className="text-xs font-bold text-slate-200">{tr('Restoration Mode')}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div
                          onClick={() => setRestoreMode('replace_current')}
                          className={`p-4 rounded-xl border cursor-pointer transition ${
                            restoreMode === 'replace_current'
                              ? 'bg-indigo-600/10 border-indigo-500 text-slate-100'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-100">
                              Restore to Company ({validationResult.metadata.tenantCode})
                            </span>
                            <RotateCcw className="w-4 h-4 text-indigo-400" />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Replaces this company's current active database with the exact snapshot state at that point in time.
                          </p>
                        </div>

                        <div
                          onClick={() => setRestoreMode('restore_as_new_tenant')}
                          className={`p-4 rounded-xl border cursor-pointer transition ${
                            restoreMode === 'restore_as_new_tenant'
                              ? 'bg-indigo-600/10 border-indigo-500 text-slate-100'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-100">{tr('Restore as New Cloned Entity')}</span>
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Creates a fresh, parallel company entity and loads all data without modifying existing records.
                          </p>
                        </div>
                      </div>

                      {restoreMode === 'restore_as_new_tenant' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              New Company Name
                            </label>
                            <input
                              type="text"
                              value={customTenantName}
                              onChange={(e) => setCustomTenantName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              New Company Code
                            </label>
                            <input
                              type="text"
                              value={customTenantCode}
                              onChange={(e) => setCustomTenantCode(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 uppercase font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Execute Restore Button */}
                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setValidationResult(null);
                            setUploadedFile(null);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={isRestoring}
                          onClick={handleExecuteRestore}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                          {isRestoring ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{tr('Restoring Company State...')}</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              <span>{tr('Execute Restore to this Point')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Restore Success Notification */}
              {restoreSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 space-y-2 text-emerald-300">
                  <div className="flex items-center gap-2 font-bold text-emerald-200 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{tr('Company Successfully Restored & Loaded!')}</span>
                  </div>
                  <p className="text-xs text-emerald-300/90">
                    The accounting suite has been successfully reverted to the selected snapshot for{' '}
                    <span className="font-bold text-white">{restoreSuccess.tenantName}</span> ({restoreSuccess.restoredCount}{' '}
                    total sub-ledger entities synchronized).
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                    >
                      Close & View Restored Ledger
                    </button>
                  </div>
                </div>
              )}

              {/* Restore Error Notification */}
              {restoreError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-300">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{tr('SOX 404 & GAAP Audit Compliant Snapshots')}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
