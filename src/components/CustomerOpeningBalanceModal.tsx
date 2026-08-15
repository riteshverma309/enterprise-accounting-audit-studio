import React, { useState, useMemo, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  X,
  Calendar,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  DollarSign,
  ArrowRight,
  BookOpen,
  Download,
  Upload,
  FileText,
  FileDown,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  exportCustomerOpeningBalanceTemplateExcel,
  downloadCustomerOpeningBalanceTemplateCsv,
} from '../utils/excelExport';

interface CustomerOpeningBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCustomerId?: string;
}

interface BatchRow {
  id: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  fiscalYear: string;
  asOfDate: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  dueDate: string;
  openingAmount: number;
  balanceType: 'DR' | 'CR';
  offsetAccountCode: string;
  notes?: string;
}

interface ParsedUploadRow {
  id: string;
  customerId?: string;
  customerCode: string;
  customerName: string;
  category?: string;
  fiscalYear: string;
  asOfDate: string;
  originalInvoiceNumber: string;
  dueDate: string;
  openingAmount: number;
  balanceType: 'DR' | 'CR';
  offsetAccountCode: string;
  notes: string;
  isValid: boolean;
  validationError?: string;
}

export const CustomerOpeningBalanceModal: React.FC<CustomerOpeningBalanceModalProps> = ({
  isOpen,
  onClose,
  preSelectedCustomerId,
}) => {
  const {
    activeTenant,
    customers,
    accounts,
    recordOpeningBalanceInvoice,
    batchImportOpeningBalances,
  } = useAccounting();

  // Mode: TEMPLATE_UPLOAD vs GRID_BATCH vs SINGLE
  const [entryMode, setEntryMode] = useState<'GRID_BATCH' | 'FILE_UPLOAD' | 'SINGLE'>('GRID_BATCH');

  // Single Form State
  const [customerId, setCustomerId] = useState<string>(preSelectedCustomerId || (customers[0]?.id ?? ''));
  const [fiscalYear, setFiscalYear] = useState<string>('FY 2026-2027');
  const [asOfDate, setAsOfDate] = useState<string>('2026-04-01');
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState<string>('OPN-2026-');
  const [originalInvoiceDate, setOriginalInvoiceDate] = useState<string>('2026-03-15');
  const [dueDate, setDueDate] = useState<string>('2026-04-30');
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [singleBalanceType, setSingleBalanceType] = useState<'DR' | 'CR'>('DR');
  const [offsetAccountCode, setOffsetAccountCode] = useState<string>('3010');
  const [notes, setNotes] = useState<string>('Prior Financial Year closing outstanding balance.');

  // Grid Batch Form State - Pre-populated with tenant customers
  const initialBatchRows = useMemo(() => {
    const tenantCustomers = customers.filter(
      (c) => !c.tenantId || c.tenantId === activeTenant.id || c.tenantId === 't-acme-us'
    );

    return tenantCustomers.map((c, idx) => ({
      id: `brow-${c.id}-${idx}`,
      customerId: c.id,
      customerCode: c.code || `CUST-${String(idx + 1).padStart(3, '0')}`,
      customerName: c.name,
      fiscalYear: 'FY 2026-2027',
      asOfDate: '2026-04-01',
      originalInvoiceNumber: c.code ? `OPN-${c.code}` : `OPN-2026-${String(idx + 1).padStart(2, '0')}`,
      originalInvoiceDate: '2026-03-25',
      dueDate: '2026-04-30',
      openingAmount: 0,
      balanceType: 'DR' as 'DR' | 'CR',
      offsetAccountCode: '3010',
      notes: 'FY 2026-2027 opening balance carryforward.',
    }));
  }, [customers, activeTenant.id]);

  const [batchRows, setBatchRows] = useState<BatchRow[]>(initialBatchRows);
  const [gridSearchTerm, setGridSearchTerm] = useState('');
  const [gridOnlyNonZero, setGridOnlyNonZero] = useState(false);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUploadRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Available Equity Accounts for Offset
  const equityAccounts = accounts.filter(
    (a) => a.type === 'EQUITY' || a.code.startsWith('3')
  );

  // Download Handlers
  const handleDownloadExcelTemplate = () => {
    exportCustomerOpeningBalanceTemplateExcel({
      tenant: activeTenant,
      customers,
      fiscalYear,
      asOfDate,
      defaultDueDate: dueDate,
      defaultOffsetAccountCode: offsetAccountCode,
    });
  };

  const handleDownloadCsvTemplate = () => {
    downloadCustomerOpeningBalanceTemplateCsv({
      tenant: activeTenant,
      customers,
      fiscalYear,
      asOfDate,
      defaultDueDate: dueDate,
      defaultOffsetAccountCode: offsetAccountCode,
    });
  };

  // Quick helper to reset/populate all customer rows
  const handleResetToAllCustomers = () => {
    setBatchRows(initialBatchRows);
  };

  const handleAddBatchRow = () => {
    const nextIdx = batchRows.length + 1;
    const firstCust = customers[0];
    const newRow: BatchRow = {
      id: `brow-${Date.now()}-${nextIdx}`,
      customerId: firstCust?.id || '',
      customerCode: firstCust?.code || `CUST-${nextIdx}`,
      customerName: firstCust?.name || '',
      fiscalYear,
      asOfDate,
      originalInvoiceNumber: `OPN-2026-${String(nextIdx).padStart(2, '0')}`,
      originalInvoiceDate: '2026-03-20',
      dueDate: '2026-04-30',
      openingAmount: 0,
      balanceType: 'DR',
      offsetAccountCode: '3010',
      notes: 'FY opening carryforward.',
    };
    setBatchRows([...batchRows, newRow]);
  };

  const handleRemoveBatchRow = (rowId: string) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((r) => r.id !== rowId));
  };

  const handleBatchRowChange = (rowId: string, updates: Partial<BatchRow>) => {
    setBatchRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updated = { ...r, ...updates };
        // If customer changed, sync name & code
        if (updates.customerId) {
          const cust = customers.find((c) => c.id === updates.customerId);
          if (cust) {
            updated.customerName = cust.name;
            updated.customerCode = cust.code;
            if (!r.originalInvoiceNumber || r.originalInvoiceNumber.startsWith('OPN-')) {
              updated.originalInvoiceNumber = cust.code ? `OPN-${cust.code}` : `OPN-${cust.id.slice(-4)}`;
            }
          }
        }
        // If amount was typed as negative, auto switch to CR
        if (updates.openingAmount !== undefined && updates.openingAmount < 0) {
          updated.balanceType = 'CR';
          updated.openingAmount = Math.abs(updates.openingAmount);
        }
        return updated;
      })
    );
  };

  // Calculations for Batch Grid
  const filteredGridRows = useMemo(() => {
    return batchRows.filter((r) => {
      if (gridOnlyNonZero && (Number(r.openingAmount) || 0) === 0) return false;
      if (!gridSearchTerm.trim()) return true;
      const term = gridSearchTerm.toLowerCase();
      return (
        r.customerName?.toLowerCase().includes(term) ||
        r.customerCode?.toLowerCase().includes(term) ||
        r.originalInvoiceNumber?.toLowerCase().includes(term)
      );
    });
  }, [batchRows, gridSearchTerm, gridOnlyNonZero]);

  const totalGridDebit = useMemo(() => {
    return batchRows
      .filter((r) => r.balanceType === 'DR')
      .reduce((sum, r) => sum + (Number(r.openingAmount) || 0), 0);
  }, [batchRows]);

  const totalGridCredit = useMemo(() => {
    return batchRows
      .filter((r) => r.balanceType === 'CR')
      .reduce((sum, r) => sum + (Number(r.openingAmount) || 0), 0);
  }, [batchRows]);

  const netGridBalance = totalGridDebit - totalGridCredit;
  const activeCountWithAmount = batchRows.filter((r) => (Number(r.openingAmount) || 0) > 0).length;

  // CSV / TSV Parsing logic
  const parseUploadedContent = (text: string, fileName: string) => {
    setUploadError(null);
    setUploadedFileName(fileName);

    try {
      // Split into lines
      const rawLines = text.split(/\r\n|\n|\r/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (rawLines.length === 0) {
        setUploadError('Uploaded file is empty.');
        return;
      }

      // Check for XML Excel Workbook
      if (text.includes('<?xml') && text.includes('Workbook')) {
        parseXmlExcelWorkbook(text);
        return;
      }

      // Detect delimiter: comma, tab, or semicolon
      const firstLine = rawLines[0];
      let delimiter = ',';
      if (firstLine.includes('\t')) delimiter = '\t';
      else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

      // Parse header line
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(cur.trim().replace(/^["']|["']$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const headerCells = parseCsvLine(firstLine).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      // Find column indices
      const colCode = headerCells.findIndex((h) => h.includes('customercode') || h.includes('code') || h.includes('custid') || h === 'id');
      const colName = headerCells.findIndex((h) => h.includes('customername') || h.includes('customer') || h.includes('client') || h.includes('name'));
      const colAmount = headerCells.findIndex((h) => h.includes('amount') || h.includes('balance') || h.includes('opening'));
      const colFlag = headerCells.findIndex((h) => h.includes('flag') || h.includes('drcr') || h.includes('debitcredit') || h.includes('type') || h === 'dr' || h === 'cr');
      const colInv = headerCells.findIndex((h) => h.includes('invoice') || h.includes('ref') || h.includes('number'));
      const colDate = headerCells.findIndex((h) => h.includes('asof') || h.includes('date'));
      const colDueDate = headerCells.findIndex((h) => h.includes('due'));
      const colNotes = headerCells.findIndex((h) => h.includes('notes') || h.includes('memo') || h.includes('desc'));

      const parsed: ParsedUploadRow[] = [];

      for (let i = 1; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (!line.trim() || line.startsWith('#') || line.startsWith('//')) continue;

        const cells = parseCsvLine(line);
        if (cells.length < 2) continue;

        const rawCode = colCode >= 0 ? cells[colCode] : (cells[0] || '');
        const rawName = colName >= 0 ? cells[colName] : (cells[1] || '');
        const rawAmtStr = colAmount >= 0 ? cells[colAmount] : (cells[7] || cells[2] || '0');
        const rawFlagStr = colFlag >= 0 ? cells[colFlag] : (cells[8] || 'DR');

        // Sanitize amount
        const cleanAmtStr = String(rawAmtStr).replace(/[$€£,\s]/g, '');
        let isNegative = false;
        let numVal = 0;
        if (cleanAmtStr.startsWith('(') && cleanAmtStr.endsWith(')')) {
          isNegative = true;
          numVal = parseFloat(cleanAmtStr.slice(1, -1)) || 0;
        } else {
          numVal = parseFloat(cleanAmtStr) || 0;
          if (numVal < 0) {
            isNegative = true;
            numVal = Math.abs(numVal);
          }
        }

        // Determine DR / CR flag
        let balanceType: 'DR' | 'CR' = 'DR';
        const upperFlag = (rawFlagStr || '').toUpperCase().trim();
        if (upperFlag === 'CR' || upperFlag === 'CREDIT' || upperFlag === 'C' || isNegative) {
          balanceType = 'CR';
        }

        // Match customer
        const matchedCust = customers.find(
          (c) =>
            (rawCode && c.code && c.code.toLowerCase().trim() === rawCode.toLowerCase().trim()) ||
            (rawName && c.name.toLowerCase().trim() === rawName.toLowerCase().trim()) ||
            (rawCode && c.id.toLowerCase().trim() === rawCode.toLowerCase().trim())
        );

        const custCode = matchedCust?.code || rawCode || `CUST-${i}`;
        const custName = matchedCust?.name || rawName || 'Unknown Customer';
        const invNum = (colInv >= 0 ? cells[colInv] : '') || `OPN-${custCode}`;
        const asOf = (colDate >= 0 ? cells[colDate] : '') || '2026-04-01';
        const due = (colDueDate >= 0 ? cells[colDueDate] : '') || '2026-04-30';
        const note = (colNotes >= 0 ? cells[colNotes] : '') || (balanceType === 'CR' ? 'FY Overpayment / advance credit carryforward.' : 'FY opening receivable carryforward.');

        parsed.push({
          id: `upload-row-${i}`,
          customerId: matchedCust?.id,
          customerCode: custCode,
          customerName: custName,
          category: matchedCust?.category || 'General',
          fiscalYear: 'FY 2026-2027',
          asOfDate: asOf,
          originalInvoiceNumber: invNum,
          dueDate: due,
          openingAmount: numVal,
          balanceType,
          offsetAccountCode: '3010',
          notes: note,
          isValid: Boolean(matchedCust || rawName),
          validationError: !matchedCust && !rawName ? 'Customer not identified' : undefined,
        });
      }

      if (parsed.length === 0) {
        setUploadError('No valid data rows found in the uploaded file.');
        return;
      }

      setParsedRows(parsed);
    } catch (err: any) {
      setUploadError(`Failed to parse file: ${err.message || 'Unknown format'}`);
    }
  };

  const parseXmlExcelWorkbook = (xmlText: string) => {
    try {
      const rows: ParsedUploadRow[] = [];
      const rowMatches = xmlText.match(/<Row[\s\S]*?<\/Row>/g);
      if (!rowMatches || rowMatches.length <= 1) {
        setUploadError('Could not find data rows in Excel XML.');
        return;
      }

      // First data rows usually start after header row (skip title & header)
      let rowIndex = 0;
      for (const rowXml of rowMatches) {
        rowIndex++;
        const cellDataMatches = Array.from(rowXml.matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>/g)).map((m) => m[1].trim());
        if (cellDataMatches.length < 3) continue;

        // Skip title/header rows
        const firstCell = cellDataMatches[0] || '';
        if (firstCell.includes('Customer Code') || firstCell.includes('COMPANY') || firstCell.includes('CUSTOMER')) continue;

        const custCode = cellDataMatches[0] || '';
        const custName = cellDataMatches[1] || '';
        const rawAmt = cellDataMatches[7] || cellDataMatches[2] || '0';
        const rawFlag = cellDataMatches[8] || cellDataMatches[3] || 'DR';

        let numVal = parseFloat(String(rawAmt).replace(/[^0-9.-]/g, '')) || 0;
        let balanceType: 'DR' | 'CR' = 'DR';
        if (numVal < 0 || rawFlag.toUpperCase().trim() === 'CR' || rawFlag.toUpperCase().includes('CREDIT')) {
          balanceType = 'CR';
          numVal = Math.abs(numVal);
        }

        const matchedCust = customers.find(
          (c) =>
            (custCode && c.code && c.code.toLowerCase().trim() === custCode.toLowerCase().trim()) ||
            (custName && c.name.toLowerCase().trim() === custName.toLowerCase().trim())
        );

        rows.push({
          id: `xml-row-${rowIndex}`,
          customerId: matchedCust?.id,
          customerCode: matchedCust?.code || custCode,
          customerName: matchedCust?.name || custName,
          category: matchedCust?.category || cellDataMatches[2] || 'General',
          fiscalYear: cellDataMatches[3] || 'FY 2026-2027',
          asOfDate: cellDataMatches[4] || '2026-04-01',
          originalInvoiceNumber: cellDataMatches[5] || `OPN-${custCode}`,
          dueDate: cellDataMatches[6] || '2026-04-30',
          openingAmount: numVal,
          balanceType,
          offsetAccountCode: cellDataMatches[9] || '3010',
          notes: cellDataMatches[10] || 'FY Opening Balance carryforward.',
          isValid: Boolean(matchedCust || custName),
        });
      }

      setParsedRows(rows);
    } catch (e: any) {
      setUploadError(`Failed to parse Excel XML format: ${e.message}`);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        parseUploadedContent(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Submit from Parsed Upload Table
  const handleCommitUpload = () => {
    setErrorMsg(null);
    const validRowsToImport = parsedRows.filter((r) => r.isValid && r.openingAmount > 0);

    if (validRowsToImport.length === 0) {
      setErrorMsg('No valid rows with an opening amount greater than 0 found to import.');
      return;
    }

    const res = batchImportOpeningBalances(
      validRowsToImport.map((r) => ({
        customerId: r.customerId,
        customerCode: r.customerCode,
        customerName: r.customerName,
        fiscalYear: r.fiscalYear,
        asOfDate: r.asOfDate,
        originalInvoiceNumber: r.originalInvoiceNumber,
        dueDate: r.dueDate,
        openingAmount: r.openingAmount,
        balanceType: r.balanceType,
        offsetAccountCode: r.offsetAccountCode,
        notes: r.notes,
      }))
    );

    if (res.success) {
      setSuccessBanner(`Successfully established ${res.count} customer opening balances from ${uploadedFileName}!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to commit batch opening balances.');
    }
  };

  // Submit from Batch Grid
  const handleSubmitBatchGrid = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rowsWithAmount = batchRows.filter((r) => (Number(r.openingAmount) || 0) > 0);

    if (rowsWithAmount.length === 0) {
      setErrorMsg('Please enter an opening balance amount (> 0) for at least one customer.');
      return;
    }

    const res = batchImportOpeningBalances(
      rowsWithAmount.map((r) => ({
        customerId: r.customerId,
        fiscalYear: r.fiscalYear,
        asOfDate: r.asOfDate,
        originalInvoiceNumber: r.originalInvoiceNumber,
        originalInvoiceDate: r.originalInvoiceDate,
        dueDate: r.dueDate,
        openingAmount: r.openingAmount,
        balanceType: r.balanceType,
        offsetAccountCode: r.offsetAccountCode,
        notes: r.notes,
      }))
    );

    if (res.success) {
      setSuccessBanner(`Successfully established ${res.count} customer opening balances with double-entry GL journals!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to post batch opening balances.');
    }
  };

  // Submit Single Form
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    if (openingAmount <= 0) {
      setErrorMsg('Please enter an opening amount greater than 0.');
      return;
    }

    if (!originalInvoiceNumber.trim()) {
      setErrorMsg('Please enter an original invoice or reference number.');
      return;
    }

    const res = recordOpeningBalanceInvoice({
      customerId,
      fiscalYear,
      asOfDate,
      originalInvoiceNumber: originalInvoiceNumber.trim(),
      originalInvoiceDate,
      dueDate,
      openingAmount,
      balanceType: singleBalanceType,
      offsetAccountCode,
      notes: notes.trim() || undefined,
    });

    if (res.success) {
      setSuccessBanner(
        `Customer opening ${singleBalanceType === 'CR' ? 'credit / overpayment' : 'receivable'} balance created successfully!`
      );
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Failed to establish opening balance.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div
        id="customer-opening-balance-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Customer FY Opening Balances
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-400/30">
                  Fiscal Year Cutover
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">
                  DR (Receivable) / CR (Overpayment)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Establish outstanding receivables or customer credit advances with pre-populated customer lists and automated double-entry GL postings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                type="button"
                id="mode-grid-btn"
                onClick={() => setEntryMode('GRID_BATCH')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  entryMode === 'GRID_BATCH'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Quick Customer Grid
              </button>
              <button
                type="button"
                id="mode-upload-btn"
                onClick={() => setEntryMode('FILE_UPLOAD')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  entryMode === 'FILE_UPLOAD'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Template
              </button>
              <button
                type="button"
                id="mode-single-btn"
                onClick={() => setEntryMode('SINGLE')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  entryMode === 'SINGLE'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Single
              </button>
            </div>

            <button
              id="close-opening-balance-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Download Notification & Quick Action Bar */}
        <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-emerald-50 px-5 py-3 border-b border-amber-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5 md:mt-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Download Pre-Populated Customer Upload Template
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-200/60 text-amber-900 font-mono rounded">
                  {customers.length} Customers Updated
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                All existing customers are already listed. You only need to fill in the <strong>Opening Balance Amount</strong> and <strong>Credit / Debit Flag (DR/CR)</strong>!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="download-opening-template-excel-btn"
              onClick={handleDownloadExcelTemplate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="Download Excel spreadsheet (.xls) with all customers pre-populated"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel Template (.xls)
            </button>

            <button
              type="button"
              id="download-opening-template-csv-btn"
              onClick={handleDownloadCsvTemplate}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="Download CSV format template (.csv)"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              Download CSV (.csv)
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* MODE 1: Interactive Quick Customer Grid */}
          {entryMode === 'GRID_BATCH' && (
            <form onSubmit={handleSubmitBatchGrid} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={gridSearchTerm}
                    onChange={(e) => setGridSearchTerm(e.target.value)}
                    placeholder="Filter customer name, code or ref # in table..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-amber-500"
                  />
                  {gridSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setGridSearchTerm('')}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={gridOnlyNonZero}
                      onChange={(e) => setGridOnlyNonZero(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Show only rows with Amount &gt; 0</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddBatchRow}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-semibold hover:bg-amber-100 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    Add Row
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToAllCustomers}
                    className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-100 flex items-center gap-1 transition"
                    title="Reload all master customers"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset List
                  </button>
                </div>
              </div>

              {/* Grid Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 w-12 text-center text-slate-400">#</th>
                        <th className="p-2.5 w-60">Customer Master</th>
                        <th className="p-2.5 w-32">Original Ref #</th>
                        <th className="p-2.5 w-28">As-of Date</th>
                        <th className="p-2.5 w-36 text-right bg-amber-100/50 text-amber-900">
                          Amount ({activeTenant.currency}) *
                        </th>
                        <th className="p-2.5 w-32 text-center bg-amber-100/50 text-amber-900">
                          DR / CR Flag *
                        </th>
                        <th className="p-2.5">Notes</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredGridRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No customer rows match the search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredGridRows.map((row, idx) => {
                          const hasAmount = (Number(row.openingAmount) || 0) > 0;
                          return (
                            <tr
                              key={row.id}
                              className={`transition ${
                                hasAmount
                                  ? row.balanceType === 'CR'
                                    ? 'bg-purple-50/40 hover:bg-purple-50/70'
                                    : 'bg-amber-50/30 hover:bg-amber-50/60'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="p-2 text-center font-mono text-slate-400 text-[11px]">
                                {idx + 1}
                              </td>

                              <td className="p-2">
                                <select
                                  value={row.customerId}
                                  onChange={(e) =>
                                    handleBatchRowChange(row.id, { customerId: e.target.value })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium truncate"
                                  required
                                >
                                  <option value="">-- Select Customer --</option>
                                  {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} {c.code ? `(${c.code})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.originalInvoiceNumber}
                                  onChange={(e) =>
                                    handleBatchRowChange(row.id, { originalInvoiceNumber: e.target.value })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                                  placeholder="OPN-..."
                                  required
                                />
                              </td>

                              <td className="p-2">
                                <input
                                  type="date"
                                  value={row.asOfDate}
                                  onChange={(e) =>
                                    handleBatchRowChange(row.id, { asOfDate: e.target.value })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                                  required
                                />
                              </td>

                              {/* Editable Amount */}
                              <td className="p-2 text-right bg-amber-50/30">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.openingAmount === 0 ? '' : row.openingAmount}
                                  onChange={(e) =>
                                    handleBatchRowChange(row.id, {
                                      openingAmount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="0.00"
                                  className="w-full px-2 py-1 bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded text-right font-bold text-slate-900 text-xs"
                                />
                              </td>

                              {/* DR / CR Flag Selector */}
                              <td className="p-2 text-center bg-amber-50/30">
                                <div className="inline-flex rounded-md shadow-2xs border border-slate-300 bg-white p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleBatchRowChange(row.id, { balanceType: 'DR' })}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                      row.balanceType === 'DR'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="Debit: Customer owes company money (Receivable)"
                                  >
                                    DR (Due)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleBatchRowChange(row.id, { balanceType: 'CR' })}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                      row.balanceType === 'CR'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="Credit: Customer overpaid / has advance deposit"
                                  >
                                    CR (Overpaid)
                                  </button>
                                </div>
                              </td>

                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.notes || ''}
                                  onChange={(e) =>
                                    handleBatchRowChange(row.id, { notes: e.target.value })
                                  }
                                  placeholder="Carryforward context"
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                                />
                              </td>

                              <td className="p-2 text-center">
                                {batchRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBatchRow(row.id)}
                                    className="text-slate-400 hover:text-red-600 p-1"
                                    title="Remove row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Batch Summary & Posting Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-xl shadow-md">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">
                      Updated Customers
                    </div>
                    <div className="text-base font-bold text-white font-mono">
                      {activeCountWithAmount} / {batchRows.length} with amount
                    </div>
                  </div>

                  <div className="border-l border-slate-800 pl-4">
                    <div className="text-[11px] text-blue-300 font-semibold uppercase flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      Total Debits (Receivable)
                    </div>
                    <div className="text-base font-bold text-blue-400 font-mono">
                      +{activeTenant.currency} {totalGridDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="border-l border-slate-800 pl-4">
                    <div className="text-[11px] text-purple-300 font-semibold uppercase flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3" />
                      Total Credits (Overpayment)
                    </div>
                    <div className="text-base font-bold text-purple-400 font-mono">
                      -{activeTenant.currency} {totalGridCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="border-l border-slate-800 pl-4">
                    <div className="text-[11px] text-amber-300 font-semibold uppercase">
                      Net AR Impact
                    </div>
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {activeTenant.currency} {netGridBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="submit-grid-opening-btn"
                    disabled={activeCountWithAmount === 0}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Post {activeCountWithAmount} Opening Balances
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE 2: Upload Excel / CSV File */}
          {entryMode === 'FILE_UPLOAD' && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,.xml,.txt,.tsv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Drag & drop your completed template here, or browse files'}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports Microsoft Excel XML (.xls), CSV (.csv), and Tab-Delimited (.txt)
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 pointer-events-none"
                >
                  Select File from Computer
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Parsed Staging Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Parsed {parsedRows.length} Rows from File (Preview & Validation)
                    </div>
                    <div className="text-xs text-slate-500">
                      {parsedRows.filter((r) => r.openingAmount > 0).length} rows with amounts
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2 w-10 text-center">Status</th>
                          <th className="p-2 w-28">Code</th>
                          <th className="p-2">Customer Name</th>
                          <th className="p-2 w-28">Ref #</th>
                          <th className="p-2 w-28">As-of Date</th>
                          <th className="p-2 w-28 text-right">Amount ({activeTenant.currency})</th>
                          <th className="p-2 w-24 text-center">Flag</th>
                          <th className="p-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedRows.map((r, idx) => (
                          <tr key={r.id} className={r.openingAmount > 0 ? 'bg-amber-50/30' : ''}>
                            <td className="p-2 text-center">
                              {r.isValid ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Valid"></span>
                              ) : (
                                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" title={r.validationError}></span>
                              )}
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-700">{r.customerCode}</td>
                            <td className="p-2 font-semibold text-slate-900">{r.customerName}</td>
                            <td className="p-2 font-mono text-slate-600">{r.originalInvoiceNumber}</td>
                            <td className="p-2 text-slate-600">{r.asOfDate}</td>
                            <td className="p-2 text-right font-bold text-slate-900 font-mono">
                              {r.openingAmount > 0 ? `${activeTenant.currency} ${r.openingAmount.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.balanceType === 'CR'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {r.balanceType} {r.balanceType === 'CR' ? '(Credit)' : '(Debit)'}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500 truncate max-w-xs">{r.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Confirm Commit */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
                    <div className="text-xs text-slate-400">
                      Ready to create opening invoices, advance credits, and initial GL journals for valid records.
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setParsedRows([]);
                          setUploadedFileName(null);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        id="commit-upload-opening-btn"
                        onClick={handleCommitUpload}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Import & Post Opening Balances
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Single Customer Entry */}
          {entryMode === 'SINGLE' && (
            <form onSubmit={handleSubmitSingle} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Customer */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Master <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="single-opening-customer"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(${c.code})` : ''} - {c.category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fiscal Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="single-opening-fy"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="FY 2026-2027">FY 2026-2027 (Current)</option>
                    <option value="FY 2025-2026">FY 2025-2026 (Prior Year)</option>
                    <option value="FY 2024-2025">FY 2024-2025</option>
                  </select>
                </div>

                {/* As of Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    As-of Opening Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="single-opening-asof-date"
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>

                {/* Original Invoice # */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prior Original Invoice / Ref # <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="single-opening-inv-num"
                    type="text"
                    value={originalInvoiceNumber}
                    onChange={(e) => setOriginalInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2025-889"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>

                {/* Balance Type (DR vs CR) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Balance Type (DR / CR) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleBalanceType('DR')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                        singleBalanceType === 'DR'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Debit (Receivable)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleBalanceType('CR')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                        singleBalanceType === 'CR'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Credit (Overpayment)
                    </button>
                  </div>
                </div>

                {/* Opening Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Amount ({activeTenant.currency}) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">
                      {activeTenant.currency}
                    </span>
                    <input
                      id="single-opening-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={openingAmount || ''}
                      onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="single-opening-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>

                {/* Offset Equity Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Balancing Offset Account (GL Offset) <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="single-opening-offset-account"
                    value={offsetAccountCode}
                    onChange={(e) => setOffsetAccountCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {equityAccounts.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.code} - {a.name} ({a.type})
                      </option>
                    ))}
                    <option value="3010">3010 - Opening Balance Equity</option>
                    <option value="3200">3200 - Retained Earnings</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arrears / Advance Description & Context
                </label>
                <input
                  id="single-opening-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Outstanding balance or customer advance transferred from legacy software."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Double Entry GL Simulation */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Double-Entry Ledger Opening Impact Preview ({singleBalanceType === 'DR' ? 'Receivable' : 'Customer Overpayment Credit'})
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                    <span className="text-slate-500 font-sans block text-[10px]">
                      {singleBalanceType === 'DR' ? 'DEBIT ENTRY (Receivable Asset)' : 'DEBIT ENTRY (Balancing Equity)'}
                    </span>
                    <span className="font-bold text-slate-900">
                      {singleBalanceType === 'DR'
                        ? '1100 - Trade Accounts Receivable'
                        : `${offsetAccountCode} - Opening Balance Equity`}
                    </span>
                    <div className="text-emerald-700 font-bold mt-1">
                      +{activeTenant.currency} {openingAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                    <span className="text-slate-500 font-sans block text-[10px]">
                      {singleBalanceType === 'DR' ? 'CREDIT ENTRY (Balancing Equity)' : 'CREDIT ENTRY (Advance / AR Liability)'}
                    </span>
                    <span className="font-bold text-slate-900">
                      {singleBalanceType === 'DR'
                        ? `${offsetAccountCode} - Opening Balance Equity / Retained Earnings`
                        : '1100 - Customer Advance Credit / AR'}
                    </span>
                    <div className="text-slate-800 font-bold mt-1">
                      +{activeTenant.currency} {openingAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-single-opening-btn"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Post Opening Balance
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
