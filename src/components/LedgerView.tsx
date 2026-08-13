import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
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
} from 'lucide-react';
import { JournalLine } from '../types';

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
    createAccount,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'journal' | 'coa'>('journal');
  const [searchQuery, setSearchQuery] = useState('');
  const [reversalReason, setReversalReason] = useState('');
  const [reversalEntryId, setReversalEntryId] = useState<string | null>(null);

  // New CoA state
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('ASSET');
  const [accError, setAccError] = useState<string | null>(null);

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
    return a.code.includes(q) || a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
  });

  const handleConfirmReversal = () => {
    if (!reversalEntryId || !reversalReason.trim()) return;
    const res = reverseJournalEntry(reversalEntryId, reversalReason);
    if (res.success) {
      setReversalEntryId(null);
      setReversalReason('');
    } else {
      alert(res.error || 'Failed to reverse journal entry');
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccError(null);
    if (!newAccCode.trim() || !newAccName.trim()) {
      setAccError('Code and Name are required.');
      return;
    }
    const res = createAccount({
      code: newAccCode.trim(),
      name: newAccName.trim(),
      type: newAccType,
      currency: activeTenant.currency,
    });
    if (res.success) {
      setShowNewAccountModal(false);
      setNewAccCode('');
      setNewAccName('');
    } else {
      setAccError(res.error || 'Failed to create account.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
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
            Immutable transaction postings, SELECT FOR UPDATE concurrency, and account balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewJournalModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'journal'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Journal Entries Log ({journalEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('coa')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'coa'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries, accounts..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* TAB 1: JOURNAL ENTRIES LOG */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
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
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Date: <strong className="text-slate-200">{entry.date}</strong></span>
                  <span>Posted By: <strong className="text-slate-200">{entry.postedBy}</strong></span>
                  
                  {entry.status === 'POSTED' && (
                    <button
                      onClick={() => setReversalEntryId(entry.id)}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 cursor-pointer transition text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" /> Reverse Entry
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Reference */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <p className="text-slate-200 font-medium">{entry.description}</p>
                {entry.reference && (
                  <span className="font-mono text-slate-400 text-[11px]">Ref: {entry.reference}</span>
                )}
              </div>

              {/* Lines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/40 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800/60">
                    <tr>
                      <th className="p-3">Acc Code</th>
                      <th className="p-3">Account Name</th>
                      <th className="p-3">Memo</th>
                      <th className="p-3 text-right">Debit ({activeTenant.currency})</th>
                      <th className="p-3 text-right">Credit ({activeTenant.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono">
                    {entry.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-indigo-300">{line.accountCode}</td>
                        <td className="p-3 font-sans text-slate-200 font-medium">{line.accountName}</td>
                        <td className="p-3 text-slate-400 italic font-sans">{line.memo || '-'}</td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950/80 font-mono font-bold text-slate-100 text-xs border-t border-slate-800">
                    <tr>
                      <td colSpan={3} className="p-3 text-right uppercase text-slate-400">Total Double-Entry Balance:</td>
                      <td className="p-3 text-right text-emerald-400">
                        {entry.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-emerald-400">
                        {entry.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Chart of Accounts - {activeTenant.name}</h3>
              <p className="text-xs text-slate-400">Maintained in currency: {activeTenant.currency}</p>
            </div>
            <button
              onClick={() => setShowNewAccountModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Account Code
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Currency</th>
                  <th className="p-3 text-right">Current Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-indigo-300">{acc.code}</td>
                    <td className="p-3 font-sans text-slate-100 font-semibold">{acc.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.type === 'ASSET' ? 'bg-indigo-500/20 text-indigo-300' :
                        acc.type === 'LIABILITY' ? 'bg-amber-500/20 text-amber-300' :
                        acc.type === 'EQUITY' ? 'bg-purple-500/20 text-purple-300' :
                        acc.type === 'REVENUE' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{acc.currency}</td>
                    <td className={`p-3 text-right font-bold text-sm ${acc.balance >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
                      {acc.currency} {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* ADD ACCOUNT MODAL */}
      {showNewAccountModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateAccount} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Chart of Account</h3>
              <button type="button" onClick={() => setShowNewAccountModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {accError && (
              <p className="text-xs font-mono text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">{accError}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Code *</label>
                <input
                  type="text"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  placeholder="e.g. 1020, 5040"
                  className="w-full bg-slate-950 text-slate-100 text-xs font-mono p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Name *</label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g. Petty Cash, Software License Revenue"
                  className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Type *</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ASSET">ASSET</option>
                  <option value="LIABILITY">LIABILITY</option>
                  <option value="EQUITY">EQUITY</option>
                  <option value="REVENUE">REVENUE</option>
                  <option value="EXPENSE">EXPENSE</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewAccountModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
