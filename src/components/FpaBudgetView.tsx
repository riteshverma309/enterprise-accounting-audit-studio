import React, { useState } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import { PieChart, TrendingUp, AlertTriangle, CheckCircle2, Edit3, DollarSign, Layers, Sparkles } from 'lucide-react';

export const FpaBudgetView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { departmentBudgets, updateDepartmentBudget, activeTenant } = useAccounting();

  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<number>(0);

  const currencySymbol = activeTenant.currency === 'EUR' ? '€' : activeTenant.currency === 'INR' ? '₹' : '$';

  const totalAnnualBudget = departmentBudgets.reduce((sum, b) => sum + b.annualBudget, 0);
  const totalYtdActual = departmentBudgets.reduce((sum, b) => sum + b.ytdActual, 0);
  const totalNetVariance = totalAnnualBudget - totalYtdActual;

  const handleEditClick = (bId: string, currentAmount: number) => {
    setSelectedBudgetId(bId);
    setEditingAmount(currentAmount);
  };

  const handleSaveBudget = (bId: string) => {
    updateDepartmentBudget(bId, Number(editingAmount));
    setSelectedBudgetId(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">{tr('FP&A Budget vs. Actual Variance Analysis')}</h1>
            <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full text-xs font-semibold">{tr('Cost Center Control')}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{tr('Departmental financial planning, real-time general ledger expense tracking, and variance burn indicators.')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
            <PieChart className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{tr('Total Corporate Budget')}</div>
              <div className="text-lg font-black text-white font-mono">{currencySymbol}{totalAnnualBudget.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400">{tr('Total YTD General Ledger Spend')}</span>
          <div className="text-2xl font-black text-indigo-400 font-mono">
            {currencySymbol}{totalYtdActual.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">{tr('P&L Expense Accounts Aggregate')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400">{tr('Net Unused Remaining Allocation')}</span>
          <div className={`text-2xl font-black font-mono ${totalNetVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {currencySymbol}{totalNetVariance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">{tr('Available Cap for Fiscal Year')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400">{tr('Overall Budget Burn Rate')}</span>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {Math.round((totalYtdActual / totalAnnualBudget) * 100)}%
          </div>
          <p className="text-[11px] text-slate-500">{tr('Target Benchmark: &lt; 75% for Q3')}</p>
        </div>
      </div>

      {/* DEPARTMENTAL BUDGET TABLE & CONTROLS */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />{tr('Department Cost-Center Allocations')}</h2>
          <span className="text-xs text-slate-400 font-mono">{tr('Live Sync with General Ledger')}</span>
        </div>

        <div className="space-y-4">
          {departmentBudgets.map((b) => {
            const usedPercentage = Math.min(100, Math.round((b.ytdActual / b.annualBudget) * 100));

            return (
              <div
                key={b.id}
                className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white">{b.department}</h3>
                    {b.status === 'ON_TRACK' && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />{tr('ON TRACK')}</span>
                    )}
                    {b.status === 'WARNING' && (
                      <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{tr('HIGH BURN')}</span>
                    )}
                    {b.status === 'EXCEEDED' && (
                      <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{tr('OVER BUDGET')}</span>
                    )}
                  </div>

                  {selectedBudgetId === b.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editingAmount}
                        onChange={(e) => setEditingAmount(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono w-32 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleSaveBudget(b.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg"
                      >{tr('Save')}</button>
                      <button
                        onClick={() => setSelectedBudgetId(null)}
                        className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg"
                      >{tr('Cancel')}</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(b.id, b.annualBudget)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />{tr('Adjust Budget')}</button>
                  )}
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        b.status === 'EXCEEDED'
                          ? 'bg-rose-500'
                          : b.status === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usedPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Used: {usedPercentage}%</span>
                    <span>Remaining: {currencySymbol}{b.variance.toLocaleString()}</span>
                  </div>
                </div>

                {/* METRICS ROW */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">{tr('Annual Allocation')}</span>
                    <div className="font-bold text-slate-200">{currencySymbol}{b.annualBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">{tr('YTD Actual Spend')}</span>
                    <div className="font-bold text-indigo-400">{currencySymbol}{b.ytdActual.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">{tr('Variance ($)')}</span>
                    <div className={`font-bold ${b.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencySymbol}{b.variance.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">{tr('Headroom (%)')}</span>
                    <div className={`font-bold ${b.variancePercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {b.variancePercentage}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
