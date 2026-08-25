import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { X, Plus, Trash2, Scale, AlertTriangle, ShieldAlert } from 'lucide-react';
import { JournalLine } from '../types';

interface NewJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewJournalModal: React.FC<NewJournalModalProps> = ({ isOpen, onClose }) => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { activeTenant, activeOrganization, activeBranch, accounts, postJournalEntry, activePlugin, activeRole } = useAccounting();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial 2 lines for double-entry
  const [lines, setLines] = useState<Omit<JournalLine, 'id' | 'accountName'>[]>([
    { accountId: accounts[0]?.id || '', accountCode: accounts[0]?.code || '1010', debit: 0, credit: 0, memo: '' },
    { accountId: accounts[1]?.id || '', accountCode: accounts[1]?.code || '4010', debit: 0, credit: 0, memo: '' },
  ]);

  if (!isOpen) return null;

  const handleAccountChange = (index: number, accCode: string) => {
    const acc = accounts.find((a) => a.code === accCode);
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        accountCode: accCode,
        accountId: acc?.id || '',
      };
      return copy;
    });
  };

  const handleAmountChange = (index: number, field: 'debit' | 'credit', val: number) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: val,
        // Reset opposite field to enforce clean line
        [field === 'debit' ? 'credit' : 'debit']: 0,
      };
      return copy;
    });
  };

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { accountId: accounts[0]?.id || '', accountCode: accounts[0]?.code || '1010', debit: 0, credit: 0, memo: '' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return; // Keep at least 2 lines for double-entry
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const variance = Math.abs(totalDebit - totalCredit);
  const isBalanced = variance < 0.01 && totalDebit > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg(tr('Description is required.'));
      return;
    }

    if (!isBalanced) {
      setErrorMsg(`${tr('Double-Entry Check')}: ${tr('Debit')} (${totalDebit}) ≠ ${tr('Credit')} (${totalCredit}). ${tr('Balance')}: ${variance.toFixed(2)}`);
      return;
    }

    const formattedLines: JournalLine[] = lines.map((l, idx) => {
      const acc = accounts.find((a) => a.code === l.accountCode);
      return {
        id: `jl-m-${Date.now()}-${idx}`,
        accountId: acc?.id || '',
        accountCode: l.accountCode,
        accountName: acc?.name || 'General Account',
        debit: l.debit,
        credit: l.credit,
        memo: l.memo,
      };
    });

    const res = postJournalEntry({
      tenantId: activeTenant.id,
      organizationId: activeOrganization?.id,
      branchId: activeBranch?.id,
      date,
      description,
      reference,
      pluginId: activePlugin,
      lines: formattedLines,
    });

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || tr('Posting failed.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl my-8">
        
        {/* Title */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">{tr('Post Journal Entry')}</h2>
              <p className="text-xs text-slate-400">{activeTenant.name} ({activeTenant.currency})</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Warning */}
        {activeRole === 'viewer' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{tr('Simulating "viewer" role. Submitting will trigger a 403 Forbidden audit log response.')}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Basic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Transaction Date')} *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 text-xs font-mono p-2.5 rounded-xl border border-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Description')} *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Enterprise Software Licensing Fee"
              className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Reference / PO #')}</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., INV-2026-88"
              className="w-full bg-slate-950 text-slate-100 text-xs font-mono p-2.5 rounded-xl border border-slate-800 outline-none"
            />
          </div>
        </div>

        {/* Journal Lines Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">{tr('Journal Entry Line Items')}</span>
            <button
              type="button"
              onClick={handleAddLine}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {tr('Add Line')}
            </button>
          </div>

          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-3 text-xs font-mono">
                
                {/* Account Code Select */}
                <select
                  value={line.accountCode}
                  onChange={(e) => handleAccountChange(idx, e.target.value)}
                  className="bg-slate-900 text-slate-100 text-xs p-2 rounded-lg border border-slate-700 outline-none flex-1"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.code}>
                      [{a.code}] {a.name} ({tr(a.type)})
                    </option>
                  ))}
                </select>

                {/* Debit */}
                <input
                  type="number"
                  step="0.01"
                  value={line.debit || ''}
                  onChange={(e) => handleAmountChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                  placeholder={tr('Debit')}
                  className="w-28 bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 outline-none text-right font-bold"
                />

                {/* Credit */}
                <input
                  type="number"
                  step="0.01"
                  value={line.credit || ''}
                  onChange={(e) => handleAmountChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                  placeholder={tr('Credit')}
                  className="w-28 bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 outline-none text-right font-bold"
                />

                {/* Delete Line */}
                <button
                  type="button"
                  disabled={lines.length <= 2}
                  onClick={() => handleRemoveLine(idx)}
                  className="text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            ))}
          </div>
        </div>

        {/* Double-Entry Balance Calculation Bar */}
        <div className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
          isBalanced ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div>
            <span className="font-bold">{tr('Debit')}:</span> {formatCurrency(totalDebit, activeTenant.currency)} |{' '}
            <span className="font-bold">{tr('Credit')}:</span> {formatCurrency(totalCredit, activeTenant.currency)}
          </div>
          <span className="font-extrabold text-sm">
            {isBalanced ? `✓ ${tr('DEBITS = CREDITS')}` : `${tr('Double-Entry Check')} ${tr('Balance')}: ${variance.toFixed(2)}`}
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
          >
            {tr('Cancel')}
          </button>
          <button
            type="submit"
            disabled={!isBalanced}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg transition cursor-pointer ${
              isBalanced
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {tr('Post Journal Entry')}
          </button>
        </div>

      </form>
    </div>
  );
};
