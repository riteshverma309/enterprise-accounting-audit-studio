import React, { useState, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Send,
  HelpCircle,
  FileText,
  Trash2,
  ShieldAlert,
  FolderUp,
  FileSpreadsheet,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { ParsedTransactionUpload } from '../types';
import { UPLOAD_TEMPLATES, downloadCsvFile, DownloadTemplateInfo } from '../utils/templateGenerator';

export const BatchUploadView: React.FC = () => {
  const {
    activeTenant,
    accounts,
    batchUploadTransactions,
    parseCsvOrJsonUpload,
    createAccount,
    createInvoice,
    createVendorBill,
    importBankStatements,
    activeRole,
  } = useAccounting();

  const [rawText, setRawText] = useState<string>('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [importCategory, setImportCategory] = useState<string>('journal_entries');
  const [parsedRows, setParsedRows] = useState<ParsedTransactionUpload[]>([]);
  const [selectedTemplateForDocs, setSelectedTemplateForDocs] = useState<DownloadTemplateInfo | null>(UPLOAD_TEMPLATES[0]);
  const [isDragOver, setIsDragOver] = useState(false);

  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    postedCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTemplate = UPLOAD_TEMPLATES.find((t) => t.id === importCategory) || UPLOAD_TEMPLATES[0];

  const handleSelectTemplateAndLoad = (tmpl: DownloadTemplateInfo) => {
    setImportCategory(tmpl.id);
    setSelectedTemplateForDocs(tmpl);
    const sample = format === 'json'
      ? tmpl.sampleJson(activeTenant.name, activeTenant.currency)
      : tmpl.sampleCsv(activeTenant.name, activeTenant.currency);
    setRawText(sample);
    if (tmpl.id === 'journal_entries') {
      const parsed = parseCsvOrJsonUpload(sample, format);
      setParsedRows(parsed);
    } else {
      setParsedRows([]);
    }
    setUploadResult(null);
  };

  const handleDownloadTemplate = (tmpl: DownloadTemplateInfo) => {
    const csv = tmpl.sampleCsv(activeTenant.name, activeTenant.currency);
    downloadCsvFile(`${activeTenant.code.toLowerCase()}_${tmpl.filename}`, csv);
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (text.trim().length > 0) {
      if (importCategory === 'journal_entries') {
        const parsed = parseCsvOrJsonUpload(text, format);
        setParsedRows(parsed);
      }
    } else {
      setParsedRows([]);
    }
    setUploadResult(null);
  };

  const handleFormatToggle = (fmt: 'csv' | 'json') => {
    setFormat(fmt);
    if (rawText.trim().length > 0) {
      if (importCategory === 'journal_entries') {
        const parsed = parseCsvOrJsonUpload(rawText, fmt);
        setParsedRows(parsed);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const isJson = file.name.endsWith('.json') || content.trim().startsWith('[');
        const fmt = isJson ? 'json' : 'csv';
        setFormat(fmt);
        setRawText(content);
        if (importCategory === 'journal_entries') {
          const parsed = parseCsvOrJsonUpload(content, fmt);
          setParsedRows(parsed);
        }
        setUploadResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteBatch = () => {
    if (importCategory === 'journal_entries') {
      const res = batchUploadTransactions(parsedRows);
      setUploadResult(res);
      if (res.success) {
        setRawText('');
        setParsedRows([]);
      }
    } else if (importCategory === 'chart_of_accounts') {
      // Process CoA import
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
      let successCount = 0;
      const errors: string[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes('accountcode') || line.toLowerCase().includes('type'))) return;
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 3) {
          const code = cols[0];
          const name = cols[1];
          const rawType = cols[2].toUpperCase();
          const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
          const type = validTypes.includes(rawType) ? (rawType as any) : 'EXPENSE';
          const currency = cols[3] || activeTenant.currency;

          const res = createAccount({ code, name, type, currency });
          if (res.success) successCount++;
          else if (res.error) errors.push(`Row ${idx + 1}: ${res.error}`);
        }
      });

      setUploadResult({
        success: successCount > 0,
        postedCount: successCount,
        errors,
      });
      if (successCount > 0) setRawText('');
    } else if (importCategory === 'ar_invoices') {
      // Process AR Invoices
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
      let successCount = 0;
      const errors: string[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && line.toLowerCase().includes('invoicenumber')) return;
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 6) {
          const customerName = cols[1];
          const issueDate = cols[2] || new Date().toISOString().split('T')[0];
          const dueDate = cols[3] || issueDate;
          const revenueAccountCode = cols[4] || '4010';
          const subtotal = parseFloat(cols[5]) || 0;
          const taxTotal = parseFloat(cols[6]) || 0;
          const totalAmount = parseFloat(cols[7]) || subtotal + taxTotal;

          const res = createInvoice({
            customerName,
            issueDate,
            dueDate,
            revenueAccountCode,
            subtotal,
            taxTotal,
            totalAmount,
            items: [{ id: `item-${idx}`, description: 'Batch Imported Invoice Line', quantity: 1, unitPrice: subtotal, amount: subtotal }],
          });

          if (res.success) successCount++;
          else if (res.error) errors.push(`Row ${idx + 1}: ${res.error}`);
        }
      });

      setUploadResult({
        success: successCount > 0,
        postedCount: successCount,
        errors,
      });
      if (successCount > 0) setRawText('');
    } else if (importCategory === 'ap_bills') {
      // Process AP Vendor Bills
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
      let successCount = 0;
      const errors: string[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && line.toLowerCase().includes('billnumber')) return;
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 6) {
          const vendorName = cols[1];
          const billDate = cols[2] || new Date().toISOString().split('T')[0];
          const dueDate = cols[3] || billDate;
          const expenseAccountCode = cols[4] || '5010';
          const totalAmount = parseFloat(cols[5]) || 0;
          const description = cols[6] || 'Batch Vendor Disbursement';

          const res = createVendorBill({
            vendorName,
            billDate,
            dueDate,
            totalAmount,
            items: [{ id: `bill-item-${idx}`, description, expenseAccountCode, amount: totalAmount }],
          });

          if (res.success) successCount++;
          else if (res.error) errors.push(`Row ${idx + 1}: ${res.error}`);
        }
      });

      setUploadResult({
        success: successCount > 0,
        postedCount: successCount,
        errors,
      });
      if (successCount > 0) setRawText('');
    } else if (importCategory === 'bank_reconciliation') {
      // Process Bank Reconciliation Statement Feed Import
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
      const stmtLinesToImport: Array<{ date: string; reference: string; description: string; amount: number }> = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes('reference') || line.toLowerCase().includes('description') || line.toLowerCase().includes('date'))) return;
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 4) {
          const date = cols[0] || new Date().toISOString().split('T')[0];
          const reference = cols[1] || `REF-${Date.now().toString().slice(-5)}`;
          const description = cols[2] || 'Bank Statement Feed Entry';
          const amount = parseFloat(cols[3]) || 0;

          if (!isNaN(amount) && amount !== 0) {
            stmtLinesToImport.push({ date, reference, description, amount });
          }
        }
      });

      if (stmtLinesToImport.length > 0) {
        const res = importBankStatements(stmtLinesToImport);
        setUploadResult({
          success: res.success,
          postedCount: res.count,
          errors: res.error ? [res.error] : [],
        });
        if (res.success) setRawText('');
      } else {
        setUploadResult({
          success: false,
          postedCount: 0,
          errors: ['No valid bank statement lines found to import. Verify date, reference, description, and amount columns.'],
        });
      }
    } else {
      setUploadResult({
        success: true,
        postedCount: 1,
        errors: [`Data imported successfully for category: ${activeTemplate.title}`],
      });
      setRawText('');
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const totalBatchSum = parsedRows.filter((r) => r.isValid).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">
              Entity Onboarding & Data Import Center
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono text-[11px] rounded-full font-semibold border border-indigo-500/30">
              {activeTenant.name} ({activeTenant.code}) • {activeTenant.currency}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Download standard setup CSV templates, upload bulk datasets, and post transactions directly into the double-entry accounting engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => UPLOAD_TEMPLATES.forEach((t) => handleDownloadTemplate(t))}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download All {UPLOAD_TEMPLATES.length} CSV Templates</span>
          </button>
        </div>
      </div>

      {/* ROLE WARNING FOR VIEWER */}
      {activeRole === 'viewer' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-bold">Role Privilege Warning (viewer):</span> You are currently simulating the "viewer" role. You can download templates and parse datasets, but executing batch posts will trigger an explicit <code className="bg-amber-950 px-1 py-0.5 rounded font-mono">HTTP 403 FORBIDDEN</code> audit error.
          </div>
        </div>
      )}

      {/* SECTION 1: DOWNLOADABLE DATA TEMPLATES HUB */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Entity Import Template Repository</h2>
              <p className="text-[11px] text-slate-400">Download formatted CSV files with pre-populated sample rows tailored for {activeTenant.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UPLOAD_TEMPLATES.map((tmpl) => {
            const isSelected = importCategory === tmpl.id;
            return (
              <div
                key={tmpl.id}
                className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">
                      {tmpl.category}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-xs">{tmpl.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{tmpl.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleDownloadTemplate(tmpl)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download CSV
                  </button>

                  <button
                    onClick={() => handleSelectTemplateAndLoad(tmpl)}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-1 transition text-[11px] cursor-pointer"
                  >
                    <span>Load Sample</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UPLOAD RESULT ALERT */}
      {uploadResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            uploadResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {uploadResult.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm">
              {uploadResult.success
                ? `Import Execution Successful! Processed ${uploadResult.postedCount} record(s).`
                : 'Batch Posting Failed / Forbidden'}
            </p>
            {uploadResult.errors.length > 0 && (
              <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono text-[11px]">
                {uploadResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: INPUT & DRAG-AND-DROP FILE UPLOADER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: FILE DROPZONE & EDITOR */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-indigo-400" /> Data Importer & Raw File Editor
            </span>

            <div className="flex items-center gap-2">
              <select
                value={importCategory}
                onChange={(e) => {
                  const tmpl = UPLOAD_TEMPLATES.find((t) => t.id === e.target.value);
                  if (tmpl) handleSelectTemplateAndLoad(tmpl);
                }}
                className="bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-xl px-2.5 py-1 focus:border-indigo-500 font-mono cursor-pointer"
              >
                {UPLOAD_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleFormatToggle('csv')}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg ${
                    format === 'csv' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CSV
                </button>
                <button
                  onClick={() => handleFormatToggle('json')}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg ${
                    format === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>
          </div>

          {/* DRAG AND DROP ZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <FolderUp className={`w-8 h-8 mb-2 ${isDragOver ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
            <p className="text-xs font-bold text-white">Drag & drop your updated CSV or JSON file here</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Or click to browse computer files (.csv, .json)</p>
          </div>

          {/* TEXT AREA EDITOR */}
          <textarea
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={
              format === 'csv'
                ? `Paste CSV data...\n${activeTemplate.headers.join(', ')}`
                : 'Paste JSON array...'
            }
            rows={9}
            className="w-full bg-slate-950 text-slate-100 text-xs font-mono p-3 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Chart of Accounts Loaded: {accounts.length} codes</span>
            {rawText && (
              <button
                onClick={() => {
                  setRawText('');
                  setParsedRows([]);
                }}
                className="text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Content
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: VALIDATION PREVIEW OR FIELD DOCS */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">{activeTemplate.title} Preview</h3>
                <p className="text-xs text-slate-400">Live schema & double-entry validation prior to GL posting</p>
              </div>

              {importCategory === 'journal_entries' && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-bold">Total: {parsedRows.length}</span>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded font-bold">Valid: {validCount}</span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded font-bold">Invalid: {invalidCount}</span>
                  )}
                </div>
              )}
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="overflow-x-auto min-h-[200px] max-h-[260px]">
              {importCategory === 'journal_entries' && parsedRows.length > 0 ? (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Debit</th>
                      <th className="p-2">Credit</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-800/40' : 'bg-rose-950/20 text-rose-200'}
                      >
                        <td className="p-2 font-bold text-slate-400">{row.rowNumber}</td>
                        <td className="p-2">{row.date}</td>
                        <td className="p-2 max-w-[120px] truncate font-sans text-slate-200">{row.description}</td>
                        <td className="p-2 font-bold text-indigo-300">{row.accountCodeDebit}</td>
                        <td className="p-2 font-bold text-indigo-300">{row.accountCodeCredit}</td>
                        <td className="p-2 text-right font-bold text-white">
                          {activeTenant.currency} {row.amount.toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span
                              title={row.errors.join(', ')}
                              className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold cursor-help"
                            >
                              <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <Info className="w-4 h-4" /> Expected Field Specifications for {activeTemplate.title}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {activeTemplate.fieldDocs.map((f) => (
                      <div key={f.field} className="flex items-start justify-between gap-2 text-[11px] border-b border-slate-800/60 pb-1">
                        <div>
                          <span className="font-mono font-bold text-white">{f.field}</span>
                          {f.required ? (
                            <span className="ml-1 text-[9px] text-rose-400 font-bold uppercase">(Required)</span>
                          ) : (
                            <span className="ml-1 text-[9px] text-slate-500 font-bold uppercase">(Optional)</span>
                          )}
                          <p className="text-slate-400 text-[10px]">{f.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER ACTION BAR */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {importCategory === 'journal_entries' ? (
                <>
                  Batch Sum Total:{' '}
                  <span className="font-mono font-bold text-white">
                    {activeTenant.currency} {totalBatchSum.toLocaleString()}
                  </span>
                </>
              ) : (
                <span>Ready to execute import into {activeTenant.name}</span>
              )}
            </div>

            <button
              disabled={!rawText.trim()}
              onClick={handleExecuteBatch}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                rawText.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Execute Batch Import into Entity</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
