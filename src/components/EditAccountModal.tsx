import React, { useState, useEffect } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { Account, AccountType } from '../types';
import {
  X,
  PlusCircle,
  Edit3,
  BookOpen,
  ShieldAlert,
} from 'lucide-react';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null; // If null, we are creating a new account
  onSuccess?: (account: Account, isNew: boolean) => void;
}

const DEFAULT_SUB_CATEGORIES: Record<AccountType, string[]> = {
  ASSET: [
    'Cash and Cash Equivalents',
    'Accounts Receivable & Trade Debtors',
    'Prepaid Expenses & Advances',
    'Inventory & Consumables',
    'Fixed Assets & Equipment',
    'Accumulated Depreciation',
    'Intangible Assets & IP',
    'Security Deposits & Long-Term Assets',
  ],
  LIABILITY: [
    'Accounts Payable & Trade Creditors',
    'Accrued Liabilities & Provisions',
    'Short-Term Borrowings & Overdrafts',
    'Customer Advances & Unearned Revenue',
    'Statutory & Tax Payables (GST/VAT/TDS)',
    'Long-Term Debt & Mortgages',
    'Lease Liabilities',
  ],
  EQUITY: [
    'Common Stock / Member Shares',
    'Retained Earnings',
    'Capital Reserves & Sinking Fund',
    "Owner's Draw / Dividends",
    'Current Year Net Earnings',
  ],
  REVENUE: [
    'Primary Operating Revenue / Sales',
    'Subscription & Recurring SaaS ARR',
    'Service Fees & Consulting Income',
    'Maintenance & CAM Charges',
    'Other Operating Income',
    'Interest & Investment Income',
    'Gain on Asset Disposals',
  ],
  EXPENSE: [
    'Cost of Goods & Services Sold (COGS)',
    'Salaries, Wages & Payroll',
    'Cloud Hosting & Technical Infrastructure',
    'Sales, Marketing & Advertising',
    'Rent, Utilities & Facility Maintenance',
    'Professional & Legal Fees',
    'Depreciation & Amortization Expense',
    'Bank Fees, FX & Financial Charges',
    'General & Administrative (G&A)',
  ],
};

export const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen,
  onClose,
  accountToEdit,
  onSuccess,
}) => {
  const { tr, t } = useLanguage();
  const { activeTenant, createAccount, updateAccount } = useAccounting();

  const isEditMode = Boolean(accountToEdit);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('ASSET');
  const [subCategory, setSubCategory] = useState('');
  const [customSubCategory, setCustomSubCategory] = useState('');
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [normalBalance, setNormalBalance] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (accountToEdit) {
      setCode(accountToEdit.code);
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      const subCats = DEFAULT_SUB_CATEGORIES[accountToEdit.type] || [];
      if (accountToEdit.subCategory && !subCats.includes(accountToEdit.subCategory)) {
        setIsCustomSubCategory(true);
        setCustomSubCategory(accountToEdit.subCategory);
        setSubCategory('OTHER');
      } else {
        setIsCustomSubCategory(false);
        setSubCategory(accountToEdit.subCategory || subCats[0] || '');
      }
      setNormalBalance(
        accountToEdit.normalBalance ||
          ((accountToEdit.type === 'ASSET' || accountToEdit.type === 'EXPENSE') ? 'DEBIT' : 'CREDIT')
      );
      setDescription(accountToEdit.description || '');
      setIsActive(accountToEdit.isActive !== false);
    } else {
      // New account defaults
      setCode('');
      setName('');
      setType('ASSET');
      setSubCategory(DEFAULT_SUB_CATEGORIES.ASSET[0]);
      setIsCustomSubCategory(false);
      setCustomSubCategory('');
      setNormalBalance('DEBIT');
      setDescription('');
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [accountToEdit, isOpen]);

  // When type changes in Create mode, update default normal balance & sub-categories
  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    const defaultNormal = (newType === 'ASSET' || newType === 'EXPENSE') ? 'DEBIT' : 'CREDIT';
    setNormalBalance(defaultNormal);
    const subCats = DEFAULT_SUB_CATEGORIES[newType] || [];
    setSubCategory(subCats[0] || '');
    setIsCustomSubCategory(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const resolvedSubCategory = isCustomSubCategory ? customSubCategory.trim() : subCategory.trim();

    if (!trimmedCode) {
      setErrorMsg(tr('Please enter an account code.'));
      return;
    }
    if (!trimmedName) {
      setErrorMsg(tr('Please enter an account name.'));
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && accountToEdit) {
        const res = updateAccount(accountToEdit.id, {
          code: trimmedCode,
          name: trimmedName,
          type,
          subCategory: resolvedSubCategory,
          normalBalance,
          description: description.trim(),
          isActive,
        });

        if (res.success) {
          if (onSuccess) {
            onSuccess(
              {
                ...accountToEdit,
                code: trimmedCode,
                name: trimmedName,
                type,
                subCategory: resolvedSubCategory,
                normalBalance,
                description: description.trim(),
                isActive,
              },
              false
            );
          }
          onClose();
        } else {
          setErrorMsg(res.error || tr('Failed to update account.'));
        }
      } else {
        // Create mode
        const res = createAccount({
          code: trimmedCode,
          name: trimmedName,
          type,
          currency: activeTenant.currency,
          subCategory: resolvedSubCategory,
          normalBalance,
          description: description.trim(),
          isActive,
        });

        if (res.success) {
          if (onSuccess) {
            onSuccess(
              {
                id: `acc-${Date.now()}`,
                tenantId: activeTenant.id,
                code: trimmedCode,
                name: trimmedName,
                type,
                currency: activeTenant.currency,
                balance: 0,
                subCategory: resolvedSubCategory,
                normalBalance,
                description: description.trim(),
                isActive,
              },
              true
            );
          }
          onClose();
        } else {
          setErrorMsg(res.error || tr('Failed to create account.'));
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || tr('An unexpected error occurred.'));
    } finally {
      setIsSaving(false);
    }
  };

  const financialStatementMapping =
    type === 'ASSET' || type === 'LIABILITY' || type === 'EQUITY'
      ? `${tr('Balance Sheet')} (${tr('Permanent Account')})`
      : `${tr('Income Statement')} (${tr('Nominal Account')})`;

  const availableSubCategories = DEFAULT_SUB_CATEGORIES[type] || [];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                isEditMode
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                  : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
              }`}
            >
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditMode ? `${tr('Edit Account Master')} [${accountToEdit?.code}]` : tr('Create New Chart of Account')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditMode
                  ? tr('Update configuration, classification, and metadata for this ledger account.')
                  : tr(`Add a custom account to ${activeTenant.name}'s General Ledger.`)}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Account Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              {tr('Account Classification / Major Type')} <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`p-2.5 rounded-xl border text-center font-semibold text-xs transition cursor-pointer ${
                    type === t
                      ? t === 'ASSET'
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                        : t === 'LIABILITY'
                        ? 'bg-amber-500/25 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                        : t === 'EQUITY'
                        ? 'bg-purple-500/25 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                        : t === 'REVENUE'
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-rose-500/25 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tr(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Account Code & Account Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {tr('Account Code')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 1010, 4020"
                className="w-full bg-slate-950 text-white font-mono text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
              <p className="text-[10px] text-slate-500">{tr('Unique alphanumeric code.')}</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {tr('Account Name / Title')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tr('e.g. SaaS Subscription Revenue')}
                className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
              <p className="text-[10px] text-slate-500">{tr('Official general ledger descriptor.')}</p>
            </div>
          </div>

          {/* Sub-Category / Grouping */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {tr('Sub-Category / Reporting Group')}
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSubCategory(!isCustomSubCategory)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                {isCustomSubCategory ? `← ${tr('Choose standard preset group')}` : `+ ${tr('Enter custom group')}`}
              </button>
            </div>

            {isCustomSubCategory ? (
              <input
                type="text"
                value={customSubCategory}
                onChange={(e) => setCustomSubCategory(e.target.value)}
                placeholder={tr('e.g. R&D Cloud Compute Infrastructure')}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            ) : (
              <select
                value={subCategory}
                onChange={(e) => {
                  if (e.target.value === 'OTHER') {
                    setIsCustomSubCategory(true);
                  } else {
                    setSubCategory(e.target.value);
                  }
                }}
                className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {availableSubCategories.map((sc) => (
                  <option key={sc} value={sc}>
                    {tr(sc)}
                  </option>
                ))}
                <option value="OTHER">+ {tr('Other / Custom Group...')}</option>
              </select>
            )}
          </div>

          {/* Normal Balance & Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {tr('Normal Balance Convention')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNormalBalance('DEBIT')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    normalBalance === 'DEBIT'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tr('DEBIT')} (DR)
                </button>
                <button
                  type="button"
                  onClick={() => setNormalBalance('CREDIT')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    normalBalance === 'CREDIT'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tr('CREDIT')} (CR)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {tr('Account Status')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tr('Active')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    !isActive
                      ? 'bg-slate-700 border-slate-500 text-slate-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tr('Archived')}
                </button>
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              {tr('Accounting Notes & Usage Description (Optional)')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={tr('e.g. Used for monthly and annual SaaS ARR subscription billings recognized under ASC 606 / IFRS 15.')}
              className="w-full bg-slate-950 text-slate-300 text-xs p-3 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            />
          </div>

          {/* Accounting Intelligence Card */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>{tr('Reporting & Ledger Behavior:')}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              • Maps to: <strong className="text-slate-200">{financialStatementMapping}</strong>
              <br />
              • Debits <strong className="text-slate-200">{type === 'ASSET' || type === 'EXPENSE' ? tr('increase') : tr('decrease')}</strong> {tr('the account balance;')}; Credits <strong className="text-slate-200">{type === 'LIABILITY' || type === 'EQUITY' || type === 'REVENUE' ? tr('increase') : tr('decrease')}</strong> {tr('the account balance.')}
            </p>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              {tr('Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              {isEditMode ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{isEditMode ? tr('Save Changes') : tr('Create Account')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
