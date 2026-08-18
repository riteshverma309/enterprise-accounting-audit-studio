import React, { useState, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  DownloadCloud,
  UploadCloud,
  Database,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Layers,
  Sparkles,
  FileJson,
  RotateCcw,
  Info,
  Clock,
  ArrowDownToLine,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { BackupValidationResult } from '../types';

export const BackupRestoreView: React.FC = () => {
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
    fixedAssets,
    balanceSheet,
    downloadCompanyBackup,
    validateBackupFileContent,
    restoreCompanyBackup,
  } = useAccounting();

  const [selectedTenantId, setSelectedTenantId] = useState<string>(activeTenant.id);
  const [downloadSuccess, setDownloadSuccess] = useState<{ fileName: string; count: number } | null>(null);

  // Restore states
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace_current' | 'restore_as_new_tenant'>('replace_current');
  const [customTenantName, setCustomTenantName] = useState('');
  const [customTenantCode, setCustomTenantCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<{ tenantName: string; count: number } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetTenant = tenants.find((t) => t.id === selectedTenantId) || activeTenant;

  // 1-Click Download Handler
  const handleDownload = (scope: 'single_company' | 'full_system' = 'single_company') => {
    const res = downloadCompanyBackup({
      tenantId: targetTenant.id,
      scope,
    });

    if (res.success && res.fileName && res.backupPayload) {
      const totalRecs = Object.values(res.backupPayload.metadata.recordCounts).reduce((a: number, b: number) => a + b, 0);
      setDownloadSuccess({
        fileName: res.fileName,
        count: totalRecs,
      });
      setTimeout(() => setDownloadSuccess(null), 8000);
    }
  };

  // Process Upload
  const processUploadedFile = (file: File) => {
    setRestoreError(null);
    setRestoreSuccess(null);

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
      setRestoreError('Failed to read file.');
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
          count: total,
        });
        setValidationResult(null);
      } else {
        setRestoreError(res.error || 'Failed to restore backup snapshot.');
      }
    }, 400);
  };

  // Stats for the active company
  const activeStats = {
    accounts: accounts.length,
    journals: journalEntries.filter((j) => j.tenantId === targetTenant.id).length,
    invoices: invoices.filter((i) => i.tenantId === targetTenant.id).length,
    bills: vendorBills.filter((b) => b.tenantId === targetTenant.id).length,
    customers: customers.filter((c) => c.tenantId === targetTenant.id).length,
    vendors: vendors.filter((v) => v.tenantId === targetTenant.id).length,
    products: productsServices.filter((p) => p.tenantId === targetTenant.id).length,
    inventory: inventoryItems.filter((i) => i.tenantId === targetTenant.id).length,
    payroll: payrollEmployees.filter((p) => p.tenantId === targetTenant.id).length,
    bankFeeds: connectedBankFeeds.filter((b) => b.tenantId === targetTenant.id).length,
    fixedAssets: fixedAssets.filter((a) => a.tenantId === targetTenant.id).length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                Company Data Backup & Point-in-Time Restore
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1-Click Export
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly export complete company datasets, sub-ledgers, and audit logs into a self-contained snapshot for point-in-time rollback.
            </p>
          </div>
        </div>

        {/* Fast Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownload('single_company')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Download Active Company Data</span>
          </button>
        </div>
      </div>

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-emerald-200">Company Data Backup Downloaded Successfully!</p>
            <p className="text-emerald-300/80 font-mono mt-0.5">
              Saved as: <span className="underline">{downloadSuccess.fileName}</span> ({downloadSuccess.count} sub-ledger records packaged)
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Section 1 (1-Click Download) + Section 2 (Restore from Backup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 1-Click Backup Export */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">1-Click Company Data Export</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">JSON Archive v1.0</span>
            </div>

            {/* Entity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Target Company Entity:</span>
                <span className="text-[11px] text-slate-400 font-mono">Scope: {targetTenant.code}</span>
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) - Currency: {t.currency} | Standard: {t.pluginId.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Card Overview */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-100">{targetTenant.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    balanceSheet.isBalanced
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {balanceSheet.isBalanced ? 'Balanced Ledger (DR=CR)' : 'Imbalance'}
                </span>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Accounts</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.accounts}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Journals</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.journals}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">AR Invoices</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.invoices}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">AP Bills</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.bills}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Customers</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.customers}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Vendors</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.vendors}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Inventory</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.inventory}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Payroll</span>
                  <span className="font-bold text-slate-100 font-mono">{activeStats.payroll}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleDownload('single_company')}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Download {targetTenant.code} Data (.JSON)</span>
              </button>

              <button
                onClick={() => handleDownload('full_system')}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Full System Snapshot</span>
              </button>
            </div>

            {/* Info Footer */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                The downloaded backup contains full double-entry journals, line tax metadata, customer/vendor contact definitions,
                and sub-ledger balances formatted for seamless one-click point-in-time recovery.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Restore from Backup */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Point-in-Time Restore</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">Rollback Engine</span>
            </div>

            {/* Upload Zone */}
            {!validationResult && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
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
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  Select or drop backup file to restore
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">Accepts valid *.json company snapshots</p>
              </div>
            )}

            {/* Inspection Card */}
            {validationResult && validationResult.metadata && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      Snapshot Validated
                    </span>
                    <button
                      onClick={() => setValidationResult(null)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-slate-300">
                      Target Company:{' '}
                      <span className="font-bold text-white">
                        {validationResult.metadata.tenantName} ({validationResult.metadata.tenantCode})
                      </span>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Created: {new Date(validationResult.metadata.exportedAt).toLocaleString()} by{' '}
                      {validationResult.metadata.exportedBy}
                    </p>
                    <p className="text-emerald-400 text-[11px] font-mono">
                      {Object.values(validationResult.metadata.recordCounts).reduce((a: number, b: number) => a + b, 0)} total entities verified
                    </p>
                  </div>

                  {/* Mode select */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-[11px] font-semibold text-slate-300 block">Restore Mode:</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreModeView"
                          checked={restoreMode === 'replace_current'}
                          onChange={() => setRestoreMode('replace_current')}
                          className="text-indigo-600"
                        />
                        <span>Restore & Overwrite Active Company ({validationResult.metadata.tenantCode})</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="restoreModeView"
                          checked={restoreMode === 'restore_as_new_tenant'}
                          onChange={() => setRestoreMode('restore_as_new_tenant')}
                          className="text-indigo-600"
                        />
                        <span>Restore as New Cloned Entity</span>
                      </label>
                    </div>
                  </div>

                  {restoreMode === 'restore_as_new_tenant' && (
                    <div className="pt-2 space-y-2">
                      <input
                        type="text"
                        placeholder="New Company Name"
                        value={customTenantName}
                        onChange={(e) => setCustomTenantName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="New Company Code"
                        value={customTenantCode}
                        onChange={(e) => setCustomTenantCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 uppercase font-mono"
                      />
                    </div>
                  )}

                  <button
                    disabled={isRestoring}
                    onClick={handleExecuteRestore}
                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isRestoring ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    <span>Execute Restore to this Point</span>
                  </button>
                </div>
              </div>
            )}

            {/* Restore Success Banner */}
            {restoreSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Company Restored Successfully!</span>
                </div>
                <p className="text-emerald-300/80">
                  Loaded {restoreSuccess.count} entities for <span className="font-bold text-white">{restoreSuccess.tenantName}</span>.
                </p>
              </div>
            )}

            {/* Restore Error Banner */}
            {restoreError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
