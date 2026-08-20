import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { IndustryCoaPreset } from '../data/industryCoaPresets';
import {
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Building2,
  GraduationCap,
  Activity,
  ShoppingCart,
  Factory,
  Briefcase,
  Utensils,
  Globe,
  Search,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface IndustryCoaPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (presetName: string, mode: 'merge' | 'replace', count: number) => void;
}

const PRESET_ICONS: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  GraduationCap: <GraduationCap className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  ShoppingCart: <ShoppingCart className="w-5 h-5" />,
  Factory: <Factory className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Utensils: <Utensils className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
};

export const IndustryCoaPresetModal: React.FC<IndustryCoaPresetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeTenant, accounts, industryCoaPresets, applyIndustryPresetCOA } = useAccounting();

  const [selectedPresetId, setSelectedPresetId] = useState<string>(industryCoaPresets[0]?.id || '');
  const [applicationMode, setApplicationMode] = useState<'merge' | 'replace'>('merge');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTab, setPreviewTab] = useState<'ALL' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('ALL');
  const [isApplying, setIsApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPreset: IndustryCoaPreset | undefined = industryCoaPresets.find(
    (p) => p.id === selectedPresetId
  );

  const filteredPresets = (industryCoaPresets || []).filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.badge.toLowerCase().includes(q)
    );
  });

  const previewAccounts = selectedPreset && selectedPreset.accounts
    ? selectedPreset.accounts.filter((a) => previewTab === 'ALL' || a.type === previewTab)
    : [];

  const existingAccountCodes = new Set((accounts || []).map((a) => a.code));
  const newAccountsCount = selectedPreset && selectedPreset.accounts
    ? selectedPreset.accounts.filter((a) => !existingAccountCodes.has(a.code)).length
    : 0;

  const handleApply = () => {
    if (!selectedPreset) return;
    setErrorMsg(null);
    setIsApplying(true);

    try {
      const res = applyIndustryPresetCOA(selectedPreset.id, applicationMode);
      if (res.success) {
        if (onSuccess) {
          onSuccess(
            selectedPreset.name,
            applicationMode,
            applicationMode === 'replace' ? res.addedCount : newAccountsCount
          );
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to apply preset.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Pre-Configured Industry Chart of Accounts</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold border border-indigo-500/30">
                  {industryCoaPresets.length} Industry Sectors
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a domain-tailored Chart of Accounts (CoA) template for <strong>{activeTenant.name}</strong> ({activeTenant.currency}).
                You can customize and modify every account after selection.
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

        {/* Content Area (Two Columns: Industry Selector & Account Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Industry Template List (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col p-4 space-y-3 overflow-y-auto max-h-[55vh] lg:max-h-[68vh]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sector, industry, or model..."
                className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">Available Sector Blueprints</p>

            <div className="space-y-2">
              {filteredPresets.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                const icon = PRESET_ICONS[preset.iconName] || <Layers className="w-5 h-5" />;

                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{preset.name}</h4>
                          <p className="text-[10px] font-mono text-slate-400">{preset.sector}</p>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                        {preset.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                      <span>{preset.accounts.length} Standard Accounts</span>
                      <span className="text-indigo-400 font-semibold">{preset.standard}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Preset Details & Accounts Preview (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col p-5 space-y-4 overflow-y-auto max-h-[55vh] lg:max-h-[68vh] bg-slate-950/40">
            {selectedPreset ? (
              <>
                {/* Preset Header Card */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {selectedPreset.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedPreset.sector}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 font-mono font-semibold border border-emerald-500/20">
                      Standard: {selectedPreset.standard}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    {selectedPreset.description}
                  </p>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Template Import Strategy:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setApplicationMode('merge')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          applicationMode === 'merge'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-100">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${applicationMode === 'merge' ? 'text-indigo-400' : 'text-slate-500'}`} />
                          Smart Merge & Append
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Retains all existing accounts & balances; adds <strong>{newAccountsCount}</strong> new industry-specific accounts.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setApplicationMode('replace')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          applicationMode === 'replace'
                            ? 'bg-amber-500/15 border-amber-500 text-amber-100 ring-1 ring-amber-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                          <AlertCircle className={`w-3.5 h-3.5 ${applicationMode === 'replace' ? 'text-amber-400' : 'text-slate-500'}`} />
                          Fresh Setup (Replace)
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Replaces current CoA with fresh {selectedPreset.accounts.length} industry accounts. (Balances reset to template standards).
                        </p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Category Filter Tabs */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300">Accounts in Template ({selectedPreset.accounts.length}):</span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-semibold">
                    {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setPreviewTab(tab)}
                        className={`px-2 py-1 rounded-lg transition ${
                          previewTab === tab
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accounts Preview Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex-1 min-h-[220px]">
                  <div className="overflow-x-auto max-h-[260px]">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Account Name</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Group / Sub-Category</th>
                          <th className="p-2.5 text-center">Normal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                        {previewAccounts.map((acc) => {
                          const alreadyExists = existingAccountCodes.has(acc.code);
                          return (
                            <tr key={acc.code} className="hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold text-indigo-300 flex items-center gap-1.5">
                                {acc.code}
                                {alreadyExists && applicationMode === 'merge' && (
                                  <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded">
                                    Current
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-sans font-medium text-slate-200">{acc.name}</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
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
                              <td className="p-2.5 font-sans text-slate-400">{acc.subCategory}</td>
                              <td className="p-2.5 text-center font-bold text-[10px]">
                                <span
                                  className={
                                    acc.normalBalance === 'DEBIT' ? 'text-cyan-400' : 'text-amber-400'
                                  }
                                >
                                  {acc.normalBalance}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-start gap-2 text-xs text-indigo-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                  <p className="text-[11px] leading-relaxed">
                    Once applied, you can <strong>modify names, add custom codes, adjust categories</strong>, or archive any accounts directly from the Chart of Accounts manager table.
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Select an industry preset from the left to view details.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {errorMsg && (
              <p className="text-rose-400 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> {errorMsg}
              </p>
            )}
            {!errorMsg && selectedPreset && (
              <span>
                Ready to configure <strong>{selectedPreset.name}</strong> for {activeTenant.name} ({applicationMode === 'merge' ? `+${newAccountsCount} new accounts` : `${selectedPreset.accounts.length} total accounts`}).
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isApplying || !selectedPreset}
              onClick={handleApply}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{applicationMode === 'replace' ? 'Apply & Overwrite COA' : 'Apply & Merge Accounts'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
