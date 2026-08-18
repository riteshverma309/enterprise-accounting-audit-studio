import React, { useState, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Account, AccountType } from '../types';
import { downloadChartOfAccountsCsv, exportChartOfAccountsExcel } from '../utils/excelExport';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface ImportCoaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number, mode: 'merge' | 'replace') => void;
}

export const ImportCoaModal: React.FC<ImportCoaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeTenant, accounts, batchImportAccounts } = useAccounting();

  const [dragActive, setDragActive] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<Partial<Account>>>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors(['CSV file must contain a header row and at least one data row.']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    
    // Map column indexes
    const codeIdx = headers.findIndex((h) => h.includes('code') || h === 'accountcode' || h === 'number');
    const nameIdx = headers.findIndex((h) => h.includes('name') || h === 'accountname' || h === 'title');
    const typeIdx = headers.findIndex((h) => h.includes('type') || h === 'accounttype' || h === 'classification');
    const subCategoryIdx = headers.findIndex((h) => h.includes('sub') || h.includes('category') || h.includes('group'));
    const normalBalIdx = headers.findIndex((h) => h.includes('normal') || h.includes('dr') || h.includes('cr'));
    const currIdx = headers.findIndex((h) => h.includes('curr'));
    const balIdx = headers.findIndex((h) => h.includes('balance') || h.includes('opening'));
    const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('note') || h.includes('memo'));

    const rows: Array<Partial<Account>> = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i];
      // Basic CSV splitter handling quotes
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;
      for (let c = 0; c < rawLine.length; c++) {
        const ch = rawLine[c];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += ch;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      if (values.every((v) => !v)) continue;

      const code = codeIdx >= 0 && values[codeIdx] ? values[codeIdx].trim() : values[0] ? values[0].trim() : '';
      const name = nameIdx >= 0 && values[nameIdx] ? values[nameIdx].trim() : values[1] ? values[1].trim() : '';
      let rawType = typeIdx >= 0 && values[typeIdx] ? values[typeIdx].trim().toUpperCase() : values[2] ? values[2].trim().toUpperCase() : 'ASSET';

      if (!code) {
        errors.push(`Row ${i + 1}: Missing Account Code`);
        continue;
      }
      if (!name) {
        errors.push(`Row ${i + 1}: Missing Account Name for code "${code}"`);
        continue;
      }

      if (!['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].includes(rawType)) {
        if (rawType.startsWith('ASS')) rawType = 'ASSET';
        else if (rawType.startsWith('LIA')) rawType = 'LIABILITY';
        else if (rawType.startsWith('EQU')) rawType = 'EQUITY';
        else if (rawType.startsWith('REV') || rawType.startsWith('INC')) rawType = 'REVENUE';
        else if (rawType.startsWith('EXP') || rawType.startsWith('COS')) rawType = 'EXPENSE';
        else rawType = 'ASSET';
      }

      const subCategory = subCategoryIdx >= 0 ? values[subCategoryIdx] : undefined;
      const normalBalance = normalBalIdx >= 0 && values[normalBalIdx]?.toUpperCase().includes('CR') ? 'CREDIT' : 'DEBIT';
      const currency = currIdx >= 0 && values[currIdx] ? values[currIdx] : activeTenant.currency;
      const balance = balIdx >= 0 && values[balIdx] ? parseFloat(values[balIdx].replace(/[^0-9.-]/g, '')) || 0 : 0;
      const description = descIdx >= 0 ? values[descIdx] : undefined;

      rows.push({
        code,
        name,
        type: rawType as AccountType,
        subCategory,
        normalBalance,
        currency,
        balance,
        description,
        isActive: true,
      });
    }

    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleFileChange = (file: File) => {
    setFileName(file.name);
    setSuccessMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      parseCsvText(text);
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      const res = batchImportAccounts(parsedRows, importMode);
      if (res.success) {
        setSuccessMsg(`Successfully imported ${res.count} Chart of Accounts in mode: ${importMode.toUpperCase()}!`);
        if (onSuccess) {
          onSuccess(res.count, importMode);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setParseErrors(res.errors || ['Failed to import accounts.']);
      }
    } catch (err: any) {
      setParseErrors([err.message || 'Import failed unexpectedly.']);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import Chart of Accounts</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload CSV or Excel file to batch import accounts into <strong>{activeTenant.name}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Download Template Bar */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Need an import template format?</h4>
                <p className="text-[11px] text-slate-400">
                  Download the official Chart of Accounts template with your active organization structure.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => downloadChartOfAccountsCsv(activeTenant, accounts)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download CSV Template</span>
              </button>
              <button
                type="button"
                onClick={() => exportChartOfAccountsExcel({ tenant: activeTenant, accounts })}
                className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx) Master</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              {fileName ? (
                <span className="text-emerald-400 font-mono flex items-center gap-1.5 justify-center">
                  <CheckCircle2 className="w-4 h-4" /> {fileName}
                </span>
              ) : (
                'Click to upload or drag & drop CSV file'
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supported format: CSV (AccountCode, AccountName, AccountType, SubCategory, NormalBalance, Description)
            </p>
          </div>

          {/* Import Strategy Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Import Mode Strategy:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setImportMode('merge')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  importMode === 'merge'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-white">
                  <CheckCircle2 className={`w-4 h-4 ${importMode === 'merge' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  Smart Merge (Safe)
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Appends new accounts and updates existing account descriptions/categories without touching historical transactions or balances.
                </p>
              </div>

              <div
                onClick={() => setImportMode('replace')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  importMode === 'replace'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-100 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-amber-300">
                  <AlertCircle className={`w-4 h-4 ${importMode === 'replace' ? 'text-amber-400' : 'text-slate-500'}`} />
                  Overwrite / Replace (Full Reset)
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Replaces the current tenant Chart of Accounts entirely with the uploaded list.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl space-y-1.5 text-xs text-rose-300">
              <div className="flex items-center gap-2 font-semibold text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Found {parseErrors.length} Issue(s) in Uploaded Data:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {parseErrors.length > 5 && <li>...and {parseErrors.length - 5} more issues</li>}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Parsed Accounts Preview</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {parsedRows.length} Valid Rows
                  </span>
                </h4>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden max-h-[220px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Account Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Sub-Category</th>
                      <th className="p-2.5 text-center">Normal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="p-2.5 font-bold text-indigo-300">{row.code}</td>
                        <td className="p-2.5 font-sans font-medium text-slate-200">{row.name}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              row.type === 'ASSET'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : row.type === 'LIABILITY'
                                ? 'bg-amber-500/20 text-amber-300'
                                : row.type === 'EQUITY'
                                ? 'bg-purple-500/20 text-purple-300'
                                : row.type === 'REVENUE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="p-2.5 font-sans text-slate-400">{row.subCategory || 'General'}</td>
                        <td className="p-2.5 text-center font-bold text-[10px]">
                          <span className={row.normalBalance === 'DEBIT' ? 'text-cyan-400' : 'text-amber-400'}>
                            {row.normalBalance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleImportSubmit}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Process & Import ({parsedRows.length} Accounts)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
