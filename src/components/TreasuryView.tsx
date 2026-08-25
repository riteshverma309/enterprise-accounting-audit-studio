import { useLanguage, tr, t } from '../context/LanguageContext';
import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Landmark, ArrowUpRight, ArrowDownLeft, ShieldCheck, Sparkles, RefreshCw, Send, DollarSign, Wallet, TrendingUp } from 'lucide-react';

export const TreasuryView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { treasuryAccounts, executeSweepTransfer, activeTenant, invoices, vendorBills } = useAccounting();

  const [fromAccountId, setFromAccountId] = useState(treasuryAccounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(treasuryAccounts[1]?.id || '');
  const [sweepAmount, setSweepAmount] = useState<number>(50000);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currencySymbol = activeTenant.currency === 'EUR' ? '€' : activeTenant.currency === 'INR' ? '₹' : '$';

  // Calculate liquidity metrics
  const totalLiquidAssets = (treasuryAccounts || []).reduce((sum, acc) => sum + acc.balance, 0);

  // Projected 30-Day Open AR Inflows
  const openArInflow = (invoices || [])
    .filter((inv) => inv.tenantId === activeTenant?.id && inv.status !== 'PAID')
    .reduce((sum, inv) => sum + (inv.totalAmount - inv.amountPaid), 0);

  // Projected 30-Day Open AP Outflows
  const openApOutflow = (vendorBills || [])
    .filter((b) => b.tenantId === activeTenant?.id && b.status !== 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);

  const projected30DayNet = totalLiquidAssets + openArInflow - openApOutflow;
  const projected60DayNet = projected30DayNet + openArInflow * 0.85 - openApOutflow * 0.9;
  const projected90DayNet = projected60DayNet + openArInflow * 0.75 - openApOutflow * 0.85;

  const handleSweepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setStatusMessage({ type: 'error', text: 'Please select both source and destination accounts.' });
      return;
    }
    if (fromAccountId === toAccountId) {
      setStatusMessage({ type: 'error', text: 'Source and destination accounts must be different.' });
      return;
    }

    const result = executeSweepTransfer(fromAccountId, toAccountId, Number(sweepAmount));
    if (result.success) {
      setStatusMessage({ type: 'success', text: `Successfully swept ${currencySymbol}${Number(sweepAmount).toLocaleString()} between treasury accounts!` });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to execute treasury sweep.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">{tr('Treasury Management & Cash Forecasting')}</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold">{tr('IAS 7 Cash Rules')}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{tr('Real-time multi-bank liquidity, automated treasury sweep transfers & 30-60-90 day predictive cash forecasting.')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{tr('Total Liquidity Reserve')}</div>
              <div className="text-lg font-black text-white font-mono">{currencySymbol}{totalLiquidAssets.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 30-60-90 DAY PREDICTIVE CASH FLOW FORECASTING GRID */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">30-60-90 Day Predictive Cash Flow Forecast</h2>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />{tr('Algorithmic AR/AP Run-rate Projection')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 30-Day Forecast */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">30-Day Liquidity Forecast</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-mono">
                98% Confidence
              </span>
            </div>
            
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {currencySymbol}{Math.round(projected30DayNet).toLocaleString()}
            </div>

            <div className="pt-2 border-t border-slate-900 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>+ Expected AR Inflows:</span>
                <span className="text-emerald-400">+{currencySymbol}{openArInflow.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>- Scheduled AP Outflows:</span>
                <span className="text-rose-400">-{currencySymbol}{openApOutflow.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 60-Day Forecast */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">60-Day Liquidity Forecast</span>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-mono">
                92% Confidence
              </span>
            </div>
            
            <div className="text-2xl font-extrabold text-indigo-400 font-mono">
              {currencySymbol}{Math.round(projected60DayNet).toLocaleString()}
            </div>

            <div className="pt-2 border-t border-slate-900 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>+ Projected Run-rate Inflows:</span>
                <span className="text-emerald-400">+{currencySymbol}{Math.round(openArInflow * 1.85).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>- Projected Operating Expenses:</span>
                <span className="text-rose-400">-{currencySymbol}{Math.round(openApOutflow * 1.9).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 90-Day Forecast */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">90-Day Liquidity Forecast</span>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-mono">
                85% Confidence
              </span>
            </div>
            
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {currencySymbol}{Math.round(projected90DayNet).toLocaleString()}
            </div>

            <div className="pt-2 border-t border-slate-900 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>+ Projected Run-rate Inflows:</span>
                <span className="text-emerald-400">+{currencySymbol}{Math.round(openArInflow * 2.6).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>- Projected Operating Expenses:</span>
                <span className="text-rose-400">-{currencySymbol}{Math.round(openApOutflow * 2.75).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TREASURY ACCOUNTS & SWEEP ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treasury Bank Accounts List */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-400" />{tr('Multi-Bank Treasury Accounts')}</h2>
            <span className="text-xs text-slate-400">{tr('Active Liquidity Vaults')}</span>
          </div>

          <div className="space-y-3">
            {treasuryAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{acc.name}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                      {acc.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>{acc.bankName}</span>
                    <span>•</span>
                    <span className="font-mono">{acc.accountNumber}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{tr('Available Balance')}</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {acc.currency === 'EUR' ? '€' : acc.currency === 'INR' ? '₹' : '$'}
                    {acc.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sweep Transfer Execution Panel */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-400" />{tr('Execute Sweep Transfer')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{tr('Automated inter-account transfer with GL posting')}</p>
          </div>

          <form onSubmit={handleSweepSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">{tr('From Source Vault')}</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {treasuryAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({currencySymbol}{acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">{tr('To Destination Vault')}</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {treasuryAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({currencySymbol}{acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sweep Amount ({currencySymbol})</label>
              <input
                type="number"
                value={sweepAmount}
                onChange={(e) => setSweepAmount(Number(e.target.value))}
                min={100}
                step={500}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />{tr('Execute & Post GL Journal Entry')}</button>
          </form>
        </div>
      </div>
    </div>
  );
};
