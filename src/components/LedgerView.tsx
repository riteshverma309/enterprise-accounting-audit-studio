import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Account, AccountType } from '../types';
import { IndustryCoaPresetModal } from './IndustryCoaPresetModal';
import { EditAccountModal } from './EditAccountModal';
import { ImportCoaModal } from './ImportCoaModal';
import { exportChartOfAccountsExcel, downloadChartOfAccountsCsv } from '../utils/excelExport';
import {
  BookOpenCheck,
  Plus,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  X,
  ShieldAlert,
  Sparkles,
  Edit3,
  Trash2,
  Upload,
  FileSpreadsheet,
  Download,
  Filter,
  Layers,
  Archive,
  Info,
  Check,
} from 'lucide-react';

interface LedgerViewProps {
  onOpenNewJournalModal: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ onOpenNewJournalModal }) => {
  const {
    activeTenant,
    accounts,
    journalEntries,
    reverseJournalEntry,
    activeRole,
    deleteAccount,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'journal' | 'coa'>('journal');
  const [searchQuery, setSearchQuery] = useState('');
  const [reversalReason, setReversalReason] = useState('');
  const [reversalEntryId, setReversalEntryId] = useState<string | null>(null);

  // Modals state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // COA Filter state
  const [coaTypeFilter, setCoaTypeFilter] = useState<'ALL' | AccountType | 'ARCHIVED'>('ALL');
  const [bannerNotice, setBannerNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<Account | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredEntries = journalEntries.filter((je) => {
    const q = searchQuery.toLowerCase();
    return (
      je.entryNumber.toLowerCase().includes(q) ||
      je.description.toLowerCase().includes(q) ||
      (je.reference && je.reference.toLowerCase().includes(q))
    );
  });

  const filteredAccounts = accounts.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.subCategory && a.subCategory.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q)) ||
      (a.industryTag && a.industryTag.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (coaTypeFilter === 'ALL') return a.isActive !== false;
    if (coaTypeFilter === 'ARCHIVED') return a.isActive === false;
    return a.type === coaTypeFilter && a.isActive !== false;
  });

  const handleConfirmReversal = () => {
    if (!reversalEntryId || !reversalReason.trim()) return;
    const res = reverseJournalEntry(reversalEntryId, reversalReason);
    if (res.success) {
      setReversalEntryId(null);
      setReversalReason('');
      setBannerNotice({ text: 'Journal entry successfully reversed with equal and opposite posting.', type: 'success' });
    } else {
      alert(res.error || 'Failed to reverse journal entry');
    }
  };

  const handleOpenCreateAccount = () => {
    setAccountToEdit(null);
    setShowEditAccountModal(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    setAccountToEdit(acc);
    setShowEditAccountModal(true);
  };

  const handleConfirmDelete = (force: boolean = false) => {
    if (!deleteConfirmAccount) return;
    setDeleteError(null);
    const res = deleteAccount(deleteConfirmAccount.id, force);
    if (res.success) {
      if (res.isArchived) {
        setBannerNotice({
          text: `Account [${deleteConfirmAccount.code}] has historical transactions. It has been deactivated/archived to maintain audit compliance.`,
          type: 'info',
        });
      } else {
        setBannerNotice({
          text: `Account [${deleteConfirmAccount.code}] "${deleteConfirmAccount.name}" was deleted.`,
          type: 'success',
        });
      }
      setDeleteConfirmAccount(null);
    } else {
      setDeleteError(res.error || 'Failed to delete account.');
    }
  };

  // Summary Metrics for COA
  const totalAccountsCount = accounts.length;
  const activeAccountsCount = accounts.filter((a) => a.isActive !== false).length;
  const totalAssetCount = accounts.filter((a) => a.type === 'ASSET' && a.isActive !== false).length;
  const totalLiabilityCount = accounts.filter((a) => a.type === 'LIABILITY' && a.isActive !== false).length;
  const totalEquityCount = accounts.filter((a) => a.type === 'EQUITY' && a.isActive !== false).length;
  const totalRevenueCount = accounts.filter((a) => a.type === 'REVENUE' && a.isActive !== false).length;
  const totalExpenseCount = accounts.filter((a) => a.type === 'EXPENSE' && a.isActive !== false).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Notice */}
      {bannerNotice && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : bannerNotice.type === 'info'
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerNotice.text}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="p-1 hover:bg-slate-800/40 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">General Ledger & Chart of Accounts</h1>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[11px] rounded font-semibold border border-indigo-500/30">
              {activeTenant.name} ({activeTenant.currency})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Double-entry posted transactions, immutable audit vouchers, and domain-tailored Chart of Accounts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'journal' ? (
            <button
              onClick={onOpenNewJournalModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Journal Entry</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowPresetModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs px-3.5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Industry Sector Presets</span>
              </button>

              <button
                onClick={handleOpenCreateAccount}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
                title="Import COA from CSV or Excel"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>

              <button
                onClick={() => exportChartOfAccountsExcel({ tenant: activeTenant, accounts })}
                className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs px-3 py-2.5 rounded-xl border border-emerald-500/30 transition cursor-pointer"
                title="Export complete COA to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={() => downloadChartOfAccountsCsv(activeTenant, accounts)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab('journal');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Journal Entries Log ({journalEntries.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('coa');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'coa'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'journal'
                ? 'Search voucher, description, ref...'
                : 'Search code, name, category, purpose...'
            }
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* TAB 1: JOURNAL ENTRIES LOG */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <BookOpenCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Journal Entries Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No posted general ledger vouchers match your search criteria. Post a manual voucher or batch upload transactions.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`bg-slate-900 rounded-2xl border transition overflow-hidden shadow-sm ${
                  entry.status === 'REVERSED' ? 'border-slate-800/80 opacity-75' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Entry Header */}
                <div className="p-4 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-indigo-300">{entry.entryNumber}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                      entry.status === 'POSTED'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}>
                      {entry.status}
                    </span>
                    {entry.reversalOfId && (
                      <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Reversal Entry
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400">{entry.date}</span>
                    <span className="text-xs text-slate-200 font-semibold">{entry.description}</span>
                    {entry.reference && (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                        Ref: {entry.reference}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
                      {entry.pluginId}
                    </span>
                    {activeRole === 'CONTROLLER' && entry.status === 'POSTED' && (
                      <button
                        onClick={() => setReversalEntryId(entry.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title="Reverse Entry"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reverse</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Entry Lines Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3">Account Code</th>
                        <th className="p-3">Account Title</th>
                        <th className="p-3">Memo / Line Note</th>
                        <th className="p-3 text-right">Debit ({activeTenant.currency})</th>
                        <th className="p-3 text-right">Credit ({activeTenant.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                      {entry.lines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-indigo-300">{line.accountCode}</td>
                          <td className="p-3 font-sans text-slate-200">{line.accountName}</td>
                          <td className="p-3 font-sans text-slate-400">{line.memo || '-'}</td>
                          <td className="p-3 text-right font-medium text-slate-200">
                            {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-200">
                            {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-950/60 font-mono font-bold text-xs text-slate-300 border-t border-slate-800">
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-slate-400 uppercase text-[10px]">
                          Voucher Balance Total:
                        </td>
                        <td className="p-3 text-right text-indigo-300">
                          {entry.lines
                            .reduce((sum, l) => sum + l.debit, 0)
                            .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-indigo-300">
                          {entry.lines
                            .reduce((sum, l) => sum + l.credit, 0)
                            .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
              <p className="text-lg font-mono font-bold text-white mt-0.5">{totalAccountsCount}</p>
              <span className="text-[10px] text-emerald-400 font-medium">{activeAccountsCount} Active</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Assets</span>
              <p className="text-lg font-mono font-bold text-indigo-300 mt-0.5">{totalAssetCount}</p>
              <span className="text-[10px] text-slate-400">Debit Normal</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Liabilities</span>
              <p className="text-lg font-mono font-bold text-amber-300 mt-0.5">{totalLiabilityCount}</p>
              <span className="text-[10px] text-slate-400">Credit Normal</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Equity</span>
              <p className="text-lg font-mono font-bold text-purple-300 mt-0.5">{totalEquityCount}</p>
              <span className="text-[10px] text-slate-400">Reserves & Capital</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Revenue</span>
              <p className="text-lg font-mono font-bold text-emerald-300 mt-0.5">{totalRevenueCount}</p>
              <span className="text-[10px] text-slate-400">Income Accounts</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Expenses</span>
              <p className="text-lg font-mono font-bold text-rose-300 mt-0.5">{totalExpenseCount}</p>
              <span className="text-[10px] text-slate-400">COGS & Operating</span>
            </div>
          </div>

          {/* Classification Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Type Filter:
              </span>
              {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'ARCHIVED'] as const).map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setCoaTypeFilter(filterVal)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                    coaTypeFilter === filterVal
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {filterVal === 'ALL'
                    ? `All (${accounts.filter((a) => a.isActive !== false).length})`
                    : filterVal === 'ARCHIVED'
                    ? `Archived (${accounts.filter((a) => a.isActive === false).length})`
                    : `${filterVal} (${accounts.filter((a) => a.type === filterVal && a.isActive !== false).length})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 pr-2">
              <span className="text-[11px]">
                Showing <strong>{filteredAccounts.length}</strong> of {accounts.length} accounts
              </span>
            </div>
          </div>

          {/* Chart of Accounts Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Account Title & Description</th>
                    <th className="p-3.5">Major Type</th>
                    <th className="p-3.5">Group / Sub-Category</th>
                    <th className="p-3.5 text-center">Normal Bal</th>
                    <th className="p-3.5 text-right">Net GL Balance</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                        No accounts match the selected classification or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const defaultNormal = (acc.type === 'ASSET' || acc.type === 'EXPENSE') ? 'DEBIT' : 'CREDIT';
                      const normalBal = acc.normalBalance || defaultNormal;
                      const isArchived = acc.isActive === false;

                      return (
                        <tr
                          key={acc.id}
                          className={`hover:bg-slate-800/40 transition ${isArchived ? 'opacity-60 bg-slate-950/30' : ''}`}
                        >
                          <td className="p-3.5 font-bold text-indigo-300">
                            <span className="bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                              {acc.code}
                            </span>
                          </td>
                          <td className="p-3.5 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-100 font-bold text-xs">{acc.name}</span>
                              {acc.industryTag && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono border border-purple-500/20">
                                  {acc.industryTag}
                                </span>
                              )}
                            </div>
                            {acc.description && (
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{acc.description}</p>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acc.type === 'ASSET'
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : acc.type === 'LIABILITY'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : acc.type === 'EQUITY'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : acc.type === 'REVENUE'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {acc.type}
                            </span>
                          </td>
                          <td className="p-3.5 font-sans text-slate-300">
                            {acc.subCategory || (
                              <span className="text-slate-500 italic">General {acc.type}</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center font-bold text-[10px]">
                            <span className={normalBal === 'DEBIT' ? 'text-cyan-400' : 'text-amber-400'}>
                              {normalBal}
                            </span>
                          </td>
                          <td
                            className={`p-3.5 text-right font-bold text-xs ${
                              acc.balance > 0
                                ? 'text-slate-100'
                                : acc.balance < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {acc.currency || activeTenant.currency}{' '}
                            {(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-center">
                            {isArchived ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                Inactive
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditAccount(acc)}
                                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition cursor-pointer"
                                title="Edit / Modify Account"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmAccount(acc);
                                  setDeleteError(null);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                title="Delete or Archive Account"
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
        </div>
      )}

      {/* REVERSAL MODAL */}
      {reversalEntryId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                Immutable Journal Entry Reversal
              </h3>
              <button onClick={() => setReversalEntryId(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              In accordance with enterprise accounting immutability rules, posted entries cannot be deleted. Reversing creates an equal and opposite entry in the General Ledger.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Reversal *</label>
              <input
                type="text"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g., Duplicate billing correction, Client credit memo"
                className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReversalEntryId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!reversalReason.trim()}
                onClick={handleConfirmReversal}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE ACCOUNT CONFIRMATION MODAL */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                Remove or Archive Account
              </h3>
              <button onClick={() => setDeleteConfirmAccount(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
                <p className="font-semibold">{deleteError}</p>
              </div>
            )}

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Account:</span>
                <span className="text-indigo-300 font-bold">[{deleteConfirmAccount.code}] {deleteConfirmAccount.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="text-slate-300">{deleteConfirmAccount.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="text-slate-300">{activeTenant.currency} {(deleteConfirmAccount.balance || 0).toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If this account has historical journal transactions, it will be <strong>archived/deactivated</strong> to preserve legal double-entry ledger audit compliance.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAccount(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                Confirm Deactivate / Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDUSTRY COA PRESET MODAL */}
      <IndustryCoaPresetModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        onSuccess={(presetName, mode, count) => {
          setBannerNotice({
            text: `Successfully applied ${presetName} template (${mode === 'replace' ? `${count} total accounts replaced` : `${count} new industry accounts merged`})! You can now modify any account code or name.`,
            type: 'success',
          });
        }}
      />

      {/* EDIT / CREATE ACCOUNT MODAL */}
      <EditAccountModal
        isOpen={showEditAccountModal}
        onClose={() => {
          setShowEditAccountModal(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
        onSuccess={(acc, isNew) => {
          setBannerNotice({
            text: isNew
              ? `Account [${acc.code}] "${acc.name}" successfully created in Chart of Accounts.`
              : `Account [${acc.code}] "${acc.name}" successfully updated.`,
            type: 'success',
          });
        }}
      />

      {/* IMPORT COA MODAL */}
      <ImportCoaModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(count, mode) => {
          setBannerNotice({
            text: `Batch imported ${count} accounts in mode: ${mode.toUpperCase()}!`,
            type: 'success',
          });
        }}
      />
    </div>
  );
};
