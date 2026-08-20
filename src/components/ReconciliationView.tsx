import React, { useState, useRef } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Landmark,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ShieldCheck,
  Sparkles,
  Download,
  UploadCloud,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Check,
  X,
  FileText,
  Trash2,
  DollarSign,
  Zap,
  Info,
  Radio,
  Unplug,
  Link2,
} from 'lucide-react';
import { UPLOAD_TEMPLATES, downloadCsvFile } from '../utils/templateGenerator';

export const ReconciliationView: React.FC = () => {
  const {
    activeTenant,
    bankStatements,
    reconcileBankLine,
    importBankStatements,
    autoMatchAndReconcile,
    createAndReconcileGLLine,
    accounts,
    journalEntries,
    activeRole,
    connectedBankFeeds,
    connectBankFeed,
    syncBankFeed,
    disconnectBankFeed,
  } = useAccounting();

  // Search & Filter state
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'RECONCILED' | 'FEEDS'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('1010');

  // Connect Bank Modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState('Chase Commercial Treasury');
  const [accountName, setAccountName] = useState('Operating Checking');
  const [accountNumberMasked, setAccountNumberMasked] = useState('•••• 9042');
  const [initialBalance, setInitialBalance] = useState<number>(125000);
  const [syncingFeedId, setSyncingFeedId] = useState<string | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal / Quick GL Create state
  const [quickPostStatementId, setQuickPostStatementId] = useState<string | null>(null);
  const [selectedOffsetAccountCode, setSelectedOffsetAccountCode] = useState('5010');
  const [quickMemo, setQuickMemo] = useState('');

  // Notification / Alert message state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Upload state
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter bank statements for active tenant
  const tenantStatements = (bankStatements || []).filter((b) => b.tenantId === activeTenant?.id);
  const tenantBankFeeds = (connectedBankFeeds || []).filter((f) => f.tenantId === activeTenant?.id);

  // Calculations for summary stats
  const reconciledCount = tenantStatements.filter((b) => b.reconciled).length;
  const pendingCount = tenantStatements.filter((b) => !b.reconciled).length;

  const totalBankFeedSum = tenantStatements.reduce((sum, b) => sum + b.amount, 0);
  const reconciledBankSum = tenantStatements.filter((b) => b.reconciled).reduce((sum, b) => sum + b.amount, 0);
  const pendingBankSum = tenantStatements.filter((b) => !b.reconciled).reduce((sum, b) => sum + b.amount, 0);

  // Current Cash Account GL balance
  const cashAcc = (accounts || []).find((a) => a.code === selectedAccountId) || (accounts || [])[0];
  const glCashBalance = cashAcc ? cashAcc.balance : 0;
  const discrepancy = glCashBalance - totalBankFeedSum;

  const handleSyncFeed = (feedId: string, instName: string) => {
    setSyncingFeedId(feedId);
    setTimeout(() => {
      const res = syncBankFeed(feedId);
      setSyncingFeedId(null);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Direct feed from ${instName} synchronized. Imported ${res.count} new pending bank transactions.`,
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    }, 700);
  };

  const handleConnectNewBank = (e: React.FormEvent) => {
    e.preventDefault();
    connectBankFeed({
      tenantId: activeTenant.id,
      institutionName,
      accountName,
      accountNumberMasked,
      currency: activeTenant.currency,
      balance: Number(initialBalance),
      status: 'CONNECTED',
      lastSyncedAt: new Date().toISOString(),
      glAccountCode: selectedAccountId,
    });
    setIsConnectModalOpen(false);
    setToastMessage({
      type: 'success',
      text: `Secure Open Banking feed established with ${institutionName} (${accountNumberMasked}).`,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered rows for table
  const filteredStatements = tenantStatements.filter((line) => {
    if (activeTab === 'PENDING' && line.reconciled) return false;
    if (activeTab === 'RECONCILED' && !line.reconciled) return false;

    if (searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase();
      const matchDesc = line.description.toLowerCase().includes(term);
      const matchRef = line.reference.toLowerCase().includes(term);
      const matchAmt = line.amount.toString().includes(term);
      if (!matchDesc && !matchRef && !matchAmt) return false;
    }

    return true;
  });

  // Reconcile Single Item
  const handleReconcile = (statementId: string) => {
    const res = reconcileBankLine(statementId, cashAcc ? cashAcc.id : 'acc-1001');
    if (res.success) {
      setToastMessage({ type: 'success', text: `Reconciled statement line ${statementId} to GL Cash account (${cashAcc?.code}).` });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Reconcile Batch Selected Items
  const handleBatchReconcile = () => {
    if (selectedIds.length === 0) return;
    let count = 0;
    selectedIds.forEach((id) => {
      const res = reconcileBankLine(id, cashAcc ? cashAcc.id : 'acc-1001');
      if (res.success) count++;
    });
    setSelectedIds([]);
    setToastMessage({ type: 'success', text: `Successfully batch reconciled ${count} bank statement line(s).` });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Smart Auto-Match Execution
  const handleAutoMatch = () => {
    const res = autoMatchAndReconcile();
    if (res.matchedCount > 0) {
      setToastMessage({
        type: 'success',
        text: `Smart Auto-Match Engine automatically matched and reconciled ${res.matchedCount} bank statement line(s)!`,
      });
    } else {
      setToastMessage({
        type: 'error',
        text: 'No additional exact GL matches found for remaining pending bank statement lines.',
      });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick GL Posting Execution
  const handleExecuteQuickPost = () => {
    if (!quickPostStatementId) return;
    const res = createAndReconcileGLLine(
      quickPostStatementId,
      selectedOffsetAccountCode,
      quickMemo.trim().length > 0 ? quickMemo : undefined
    );

    if (res.success) {
      setToastMessage({
        type: 'success',
        text: `Created new GL Journal Entry and reconciled bank line against account ${selectedOffsetAccountCode}.`,
      });
      setQuickPostStatementId(null);
      setQuickMemo('');
    } else {
      setToastMessage({
        type: 'error',
        text: res.error || 'Failed to create GL journal entry for bank statement.',
      });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Download Bank Template
  const handleDownloadTemplate = () => {
    const bankTmpl = UPLOAD_TEMPLATES.find((t) => t.id === 'bank_reconciliation') || UPLOAD_TEMPLATES[0];
    const csv = bankTmpl.sampleCsv(activeTenant.name, activeTenant.currency);
    downloadCsvFile(`${activeTenant.code.toLowerCase()}_bank_reconciliation_template.csv`, csv);
  };

  // File Upload Handler directly on Bank Reconciliation Screen
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        const stmtLinesToImport: Array<{ date: string; reference: string; description: string; amount: number }> = [];

        lines.forEach((line, idx) => {
          if (idx === 0 && (line.toLowerCase().includes('reference') || line.toLowerCase().includes('description') || line.toLowerCase().includes('date'))) return;
          const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 4) {
            const date = cols[0] || new Date().toISOString().split('T')[0];
            const reference = cols[1] || `REF-${Date.now().toString().slice(-5)}`;
            const description = cols[2] || 'Bank Statement Entry';
            const amount = parseFloat(cols[3]) || 0;

            if (!isNaN(amount) && amount !== 0) {
              stmtLinesToImport.push({ date, reference, description, amount });
            }
          }
        });

        if (stmtLinesToImport.length > 0) {
          const res = importBankStatements(stmtLinesToImport);
          if (res.success) {
            setToastMessage({
              type: 'success',
              text: `Successfully imported ${res.count} bank statement feed line(s) into ${activeTenant.name}!`,
            });
            setIsUploadingFile(false);
          }
        } else {
          setToastMessage({
            type: 'error',
            text: 'Could not parse bank statement lines. Please ensure CSV has columns: Date, Reference, Description, Amount.',
          });
        }
        setTimeout(() => setToastMessage(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // Load Preset Sample Bank Feed
  const handleLoadSampleFeed = () => {
    const sampleFeed = [
      { date: '2026-08-10', reference: 'CHK-90412', description: 'ACH Deposit - Customer Invoice Sales Remittance', amount: 35000 },
      { date: '2026-08-11', reference: 'WIRE-8812', description: 'Wire Disbursement - Executive Office Lease Rent', amount: -8500 },
      { date: '2026-08-12', reference: 'FEE-00912', description: 'Monthly Commercial Treasury Bank Service Fee', amount: -150 },
      { date: '2026-08-13', reference: 'STRIPE-771', description: 'Stripe Credit Card Merchant Payout - Subscriptions', amount: 18500 },
      { date: '2026-08-14', reference: 'AWS-40123', description: 'Direct Debit - Amazon Web Services Infrastructure', amount: -14850 },
    ];

    const res = importBankStatements(sampleFeed);
    if (res.success) {
      setToastMessage({
        type: 'success',
        text: `Loaded ${res.count} sample bank statement lines into feed for ${activeTenant.name}.`,
      });
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const currentStatementForModal = tenantStatements.find((b) => b.id === quickPostStatementId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Landmark className="w-6 h-6 text-indigo-400" /> Bank Statement Matching & Treasury Reconciliation Hub
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono text-[11px] rounded-full font-semibold border border-indigo-500/30">
              {activeTenant.name} ({activeTenant.currency})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated bank feed matching, AI rule suggestions, and instant GL entry generation for seamless period-end closing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>CSV Template</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import CSV Feed</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <button
            onClick={handleLoadSampleFeed}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Load Sample Feed</span>
          </button>

          <button
            onClick={handleAutoMatch}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Auto-Match Engine</span>
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUMMARY BALANCE RECONCILIATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* CARD 1: GL CASH BALANCE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>GL Cash Account ({cashAcc?.code || '1010'})</span>
            <Landmark className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {activeTenant.currency} {glCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">{cashAcc?.name || 'Primary Operating Cash'}</p>
        </div>

        {/* CARD 2: BANK FEED TOTAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Bank Feed Statement Total</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {activeTenant.currency} {totalBankFeedSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Total of all imported bank statement lines</p>
        </div>

        {/* CARD 3: RECONCILED PROGRESS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Reconciliation Progress</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {reconciledCount} / {tenantStatements.length} <span className="text-xs font-normal text-slate-400">Lines</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {pendingCount === 0 ? '100% Reconciled' : `${pendingCount} item(s) awaiting approval`}
          </p>
        </div>

        {/* CARD 4: RECONCILIATION DISCREPANCY */}
        <div
          className={`border rounded-2xl p-4 space-y-1 shadow-sm ${
            Math.abs(discrepancy) < 0.01
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-amber-950/20 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={Math.abs(discrepancy) < 0.01 ? 'text-emerald-300' : 'text-amber-300'}>
              GL vs Bank Variance
            </span>
            {Math.abs(discrepancy) < 0.01 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className={`text-xl font-black font-mono ${Math.abs(discrepancy) < 0.01 ? 'text-emerald-300' : 'text-amber-300'}`}>
            {activeTenant.currency} {Math.abs(discrepancy).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400">
            {Math.abs(discrepancy) < 0.01 ? 'Perfect match! Ledger & Bank balanced.' : 'Discrepancy pending reconciliation.'}
          </p>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        
        {/* TABS */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('RECONCILED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'RECONCILED'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reconciled ({reconciledCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({tenantStatements.length})
          </button>

          <button
            onClick={() => setActiveTab('FEEDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FEEDS'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Connected Bank Feeds ({tenantBankFeeds.length})</span>
          </button>
        </div>

        {/* SEARCH & ACCOUNT SELECTOR */}
        {activeTab !== 'FEEDS' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference or payee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none w-48 md:w-64"
              />
            </div>

            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none font-mono cursor-pointer"
            >
              {accounts
                .filter((a) => a.type === 'ASSET' && (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash')))
                .map((acc) => (
                  <option key={acc.id} value={acc.code}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
            </select>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBatchReconcile}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Reconcile Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'FEEDS' && (
          <div>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Open Banking Feed</span>
            </button>
          </div>
        )}
      </div>

      {/* CONNECTED BANK FEEDS VIEW */}
      {activeTab === 'FEEDS' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenantBankFeeds.map((feed) => {
              const isSyncing = syncingFeedId === feed.id;
              return (
                <div key={feed.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{feed.institutionName}</h4>
                        <p className="text-xs text-slate-400">{feed.accountName} ({feed.accountNumberMasked})</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                      <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Available Balance:</span>
                      <span className="text-emerald-400 font-bold">
                        ${feed.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {feed.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Mapped GL Account:</span>
                      <span>{feed.glAccountCode || '1010'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Last Synced:</span>
                      <span>{new Date(feed.lastSyncedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleSyncFeed(feed.id, feed.institutionName)}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>

                    <button
                      onClick={() => disconnectBankFeed(feed.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
                      title="Disconnect Feed"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* BANK STATEMENT FEED LINES TABLE */
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-400" /> Bank Feed Transactions Register
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredStatements.length} of {tenantStatements.length} line(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredStatements.length > 0 &&
                      filteredStatements.every((line) => selectedIds.includes(line.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredStatements.map((l) => l.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3">Date</th>
                <th className="p-3">Bank Reference</th>
                <th className="p-3">Statement Narrative / Payee</th>
                <th className="p-3 text-right">Amount ({activeTenant.currency})</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">GL Match Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredStatements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    No bank statement lines match the selected filter. Click "Load Sample Feed" or "Import CSV Feed" to add statement lines.
                  </td>
                </tr>
              ) : (
                filteredStatements.map((line) => {
                  const isSelected = selectedIds.includes(line.id);
                  return (
                    <tr key={line.id} className={isSelected ? 'bg-indigo-950/30' : 'hover:bg-slate-800/40'}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds((prev) => [...prev, line.id]);
                            else setSelectedIds((prev) => prev.filter((id) => id !== line.id));
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-400">{line.date}</td>
                      <td className="p-3 font-bold text-indigo-300">{line.reference}</td>
                      <td className="p-3 font-sans text-slate-200 font-medium max-w-xs truncate">{line.description}</td>
                      <td
                        className={`p-3 text-right font-bold text-sm ${
                          line.amount >= 0 ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {line.amount >= 0 ? `+${line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        {line.reconciled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Reconciled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-sans">
                        {line.reconciled ? (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Linked JE: {line.matchedJournalEntryId || 'Manual Approval'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            Candidate Match Ready
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {!line.reconciled ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setQuickPostStatementId(line.id);
                                setSelectedOffsetAccountCode(line.amount < 0 ? '5010' : '4010');
                                setQuickMemo(line.description);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-purple-300 px-2.5 py-1 rounded-lg font-bold text-[11px] border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                              title="Post missing entry to GL & reconcile immediately"
                            >
                              <Plus className="w-3 h-3" /> Quick GL Post
                            </button>

                            <button
                              onClick={() => handleReconcile(line.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg font-bold text-[11px] shadow transition cursor-pointer"
                            >
                              Reconcile to GL
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Audit Clear</span>
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
      )}

      {/* CONNECT OPEN BANKING FEED MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Connect Open Banking Feed</h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectNewBank} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Financial Institution *</label>
                <select
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none cursor-pointer"
                >
                  <option value="Chase Commercial Treasury">JPMorgan Chase Commercial Bank</option>
                  <option value="Bank of America Corporate">Bank of America Merrill Lynch</option>
                  <option value="Silicon Valley Bank (SVB)">Silicon Valley Bank Commercial</option>
                  <option value="Citibank NA Treasury">Citibank Corporate Treasury</option>
                  <option value="Wells Fargo Commercial">Wells Fargo Commercial Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Account Nickname *</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Operating Payroll Checking"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Masked Number</label>
                  <input
                    type="text"
                    value={accountNumberMasked}
                    onChange={(e) => setAccountNumberMasked(e.target.value)}
                    placeholder="•••• 9042"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Starting Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>256-bit TLS encrypted direct read-only Open Banking connection.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Link2 className="w-4 h-4" /> Establish Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CREATE GL ENTRY MODAL */}
      {quickPostStatementId && currentStatementForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Quick Create GL Entry & Reconcile</h3>
              </div>
              <button
                onClick={() => setQuickPostStatementId(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Bank Reference:</span>
                <span className="text-indigo-400 font-bold">{currentStatementForModal.reference}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Statement Date:</span>
                <span className="text-white">{currentStatementForModal.date}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bank Statement Amount:</span>
                <span
                  className={`font-bold text-sm ${
                    currentStatementForModal.amount >= 0 ? 'text-emerald-400' : 'text-slate-100'
                  }`}
                >
                  {activeTenant.currency} {currentStatementForModal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Select Offsetting Chart of Account:
                </label>
                <select
                  value={selectedOffsetAccountCode}
                  onChange={(e) => setSelectedOffsetAccountCode(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none font-mono cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.code}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  This will generate a balanced 2-line double-entry voucher in GL between Cash ({cashAcc?.code}) and {selectedOffsetAccountCode}.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Journal Entry Description / Memo:</label>
                <input
                  type="text"
                  value={quickMemo}
                  onChange={(e) => setQuickMemo(e.target.value)}
                  placeholder="e.g. Bank Fee / Office Expense / Revenue Adjustment"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setQuickPostStatementId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteQuickPost}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Post GL & Reconcile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
