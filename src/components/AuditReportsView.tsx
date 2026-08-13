import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Scale,
  TrendingUp,
  Activity,
  HeartPulse,
} from 'lucide-react';

export const AuditReportsView: React.FC = () => {
  const {
    activeTenant,
    trialBalance,
    balanceSheet,
    incomeStatement,
    cashFlowStatement,
    financialRatios,
  } = useAccounting();

  const [reportTab, setReportTab] = useState<'tb' | 'bs' | 'is' | 'cf' | 'ratios'>('tb');

  const totalTbDebit = trialBalance.reduce((sum, r) => sum + r.debit, 0);
  const totalTbCredit = trialBalance.reduce((sum, r) => sum + r.credit, 0);
  const isTbBalanced = Math.abs(totalTbDebit - totalTbCredit) < 0.01;

  const currencySymbol = activeTenant.currency === 'INR' ? '₹' : activeTenant.currency === 'EUR' ? '€' : '$';

  const handleExportReport = () => {
    const jsonReport = JSON.stringify(
      {
        tenant: activeTenant.name,
        currency: activeTenant.currency,
        asOfDate: new Date().toISOString(),
        trialBalance,
        balanceSheet,
        incomeStatement,
      },
      null,
      2
    );

    const blob = new Blob([jsonReport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Financial_Audit_Report_${activeTenant.code}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Financial Audit Reports Engine</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[11px] rounded font-semibold border border-indigo-500/30">
              {activeTenant.name} ({activeTenant.currency})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Trial Balance, Balance Sheet, and Statement of Profit & Loss prepared under {activeTenant.pluginId.toUpperCase()}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Package (JSON / Audit Pack)</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setReportTab('tb')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            reportTab === 'tb'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Trial Balance</span>
        </button>

        <button
          onClick={() => setReportTab('bs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            reportTab === 'bs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Balance Sheet</span>
        </button>

        <button
          onClick={() => setReportTab('is')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            reportTab === 'is'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Income Statement (P&L)</span>
        </button>

        <button
          onClick={() => setReportTab('cf')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            reportTab === 'cf'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Statement of Cash Flows</span>
        </button>

        <button
          onClick={() => setReportTab('ratios')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            reportTab === 'ratios'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span>Financial Ratios & Health Score</span>
        </button>
      </div>

      {/* 1. TRIAL BALANCE VIEW */}
      {reportTab === 'tb' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-base font-bold text-white">General Ledger Trial Balance</h2>
              <p className="text-xs text-slate-400">As of {new Date().toISOString().split('T')[0]} • Entity: {activeTenant.name}</p>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              isTbBalanced ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {isTbBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{isTbBalanced ? 'TRIAL BALANCE IN EQUILIBRIUM' : 'VARIANCE DETECTED'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Acc Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3 text-right">Debit Balance ({activeTenant.currency})</th>
                  <th className="p-3 text-right">Credit Balance ({activeTenant.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {trialBalance.map((row) => (
                  <tr key={row.accountId} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-indigo-300">{row.accountCode}</td>
                    <td className="p-3 font-sans text-slate-100 font-semibold">{row.accountName}</td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {row.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-100">
                      {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-100">
                      {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-mono font-bold text-sm text-slate-100 border-t-2 border-slate-800">
                <tr>
                  <td colSpan={3} className="p-3 text-right uppercase text-slate-400">Total Trial Balance Sums:</td>
                  <td className="p-3 text-right text-emerald-400">
                    {currencySymbol}{totalTbDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-emerald-400">
                    {currencySymbol}{totalTbCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. BALANCE SHEET VIEW */}
      {reportTab === 'bs' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Statement of Financial Position (Balance Sheet)</h2>
              <p className="text-xs text-slate-400">Under {activeTenant.pluginId.toUpperCase()} • Equation: Assets = Liabilities + Equity</p>
            </div>
            
            <div className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
              balanceSheet.isBalanced ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {balanceSheet.isBalanced ? 'ASSETS = LIABILITIES + EQUITY' : 'UNBALANCED BALANCE SHEET'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ASSETS COLUMN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-500/30">
                <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider">Total Assets</h3>
                <span className="font-mono text-base font-bold text-indigo-300">
                  {currencySymbol}{balanceSheet.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {balanceSheet.assets.map((item) => (
                  <div key={item.accountId} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-indigo-300 font-bold mr-2">[{item.accountCode}]</span>
                      <span className="font-sans text-slate-200">{item.accountName}</span>
                    </div>
                    <span className="font-bold text-white">
                      {currencySymbol}{(item.debit - item.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-6">
              
              {/* Liabilities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                  <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider">Total Liabilities</h3>
                  <span className="font-mono text-base font-bold text-amber-300">
                    {currencySymbol}{balanceSheet.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {balanceSheet.liabilities.map((item) => (
                    <div key={item.accountId} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-amber-300 font-bold mr-2">[{item.accountCode}]</span>
                        <span className="font-sans text-slate-200">{item.accountName}</span>
                      </div>
                      <span className="font-bold text-white">
                        {currencySymbol}{(item.credit - item.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                  <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">Total Owners Equity</h3>
                  <span className="font-mono text-base font-bold text-emerald-300">
                    {currencySymbol}{balanceSheet.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {balanceSheet.equity.map((item) => (
                    <div key={item.accountId} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-emerald-300 font-bold mr-2">[{item.accountCode}]</span>
                        <span className="font-sans text-slate-200">{item.accountName}</span>
                      </div>
                      <span className="font-bold text-white">
                        {currencySymbol}{(item.credit - item.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}

                  {/* Retained Earnings from P&L */}
                  <div className="flex items-center justify-between p-2.5 bg-indigo-950/30 rounded-xl border border-indigo-800/50">
                    <div>
                      <span className="text-indigo-400 font-bold mr-2">[3200]</span>
                      <span className="font-sans text-indigo-200 font-bold">Retained Earnings (Current Year P&L)</span>
                    </div>
                    <span className="font-bold text-indigo-300">
                      {currencySymbol}{balanceSheet.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 3. INCOME STATEMENT VIEW */}
      {reportTab === 'is' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Statement of Profit & Loss (Income Statement)</h2>
              <p className="text-xs text-slate-400">Revenue Recognition under {activeTenant.pluginId.toUpperCase()}</p>
            </div>
            
            <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-xl font-mono text-xs font-bold">
              Gross Margin: {incomeStatement.grossMarginPercentage}%
            </div>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
            
            {/* Revenue Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">1. Operating Revenues</h3>
                <span className="font-mono text-base font-bold text-emerald-300">
                  {currencySymbol}{incomeStatement.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                {incomeStatement.revenues.map((item) => (
                  <div key={item.accountId} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-sans text-slate-200 font-medium">{item.accountName}</span>
                    <span className="font-bold text-white">
                      {currencySymbol}{(item.credit - item.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/30">
                <h3 className="text-sm font-extrabold text-rose-400 uppercase tracking-wider">2. Operating Expenses</h3>
                <span className="font-mono text-base font-bold text-rose-300">
                  {currencySymbol}{incomeStatement.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                {incomeStatement.expenses.map((item) => (
                  <div key={item.accountId} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-sans text-slate-200 font-medium">{item.accountName}</span>
                    <span className="font-bold text-white">
                      {currencySymbol}{(item.debit - item.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Operating Income Summary Box */}
            <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 rounded-2xl border border-indigo-500/40 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">Net Operating Profit</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Calculated as Total Revenue minus Operating Expenses</p>
              </div>
              <span className="font-mono text-2xl font-black text-white">
                {currencySymbol}{incomeStatement.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* 4. STATEMENT OF CASH FLOWS VIEW */}
      {reportTab === 'cf' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Statement of Cash Flows (IAS 7 / ASC 230)</h2>
              <p className="text-xs text-slate-400">Indirect Method reconciles Net Income to Operating, Investing, and Financing Cash Movements</p>
            </div>
            
            <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl font-mono text-xs font-bold">
              Net Cash Change: {currencySymbol}{cashFlowStatement.netCashChange.toLocaleString()}
            </div>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
            {/* Operating Activities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-500/30">
                <h3 className="text-sm font-extrabold text-indigo-400 font-sans uppercase">1. Cash Flows from Operating Activities</h3>
                <span className="text-base font-bold text-indigo-300">
                  {currencySymbol}{cashFlowStatement.totalOperatingCashFlow.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                {cashFlowStatement.operatingActivities.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-sans text-slate-200">{act.category}</span>
                    <span className={`font-bold ${act.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencySymbol}{act.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Investing Activities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                <h3 className="text-sm font-extrabold text-purple-400 font-sans uppercase">2. Cash Flows from Investing Activities</h3>
                <span className="text-base font-bold text-purple-300">
                  {currencySymbol}{cashFlowStatement.totalInvestingCashFlow.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                {cashFlowStatement.investingActivities.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-sans text-slate-200">{act.category}</span>
                    <span className={`font-bold ${act.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencySymbol}{act.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financing Activities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                <h3 className="text-sm font-extrabold text-amber-400 font-sans uppercase">3. Cash Flows from Financing Activities</h3>
                <span className="text-base font-bold text-amber-300">
                  {currencySymbol}{cashFlowStatement.totalFinancingCashFlow.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                {cashFlowStatement.financingActivities.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="font-sans text-slate-200">{act.category}</span>
                    <span className={`font-bold ${act.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencySymbol}{act.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Net Cash Change Box */}
            <div className="p-4 bg-slate-950 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between font-sans">
              <div>
                <h4 className="text-sm font-bold text-slate-100">NET INCREASE / (DECREASE) IN CASH & CASH EQUIVALENTS</h4>
                <p className="text-[11px] text-slate-400">Sum of Operating, Investing, and Financing Cash Flows</p>
              </div>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {currencySymbol}{cashFlowStatement.netCashChange.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. FINANCIAL RATIOS & HEALTH SCORE VIEW */}
      {reportTab === 'ratios' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Financial Intelligence & Liquidity Health Score</h2>
              <p className="text-xs text-slate-400">Automated Financial Ratio Analysis & Solvency Diagnostics for {activeTenant.name}</p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-semibold">Audit Health Index:</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{financialRatios.healthScore} / 100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Current Ratio (Liquidity)</span>
              <div className="text-2xl font-bold text-indigo-400 font-mono">{financialRatios.currentRatio}x</div>
              <p className="text-[10px] text-slate-500">(Cash + AR) / Total Liabilities. Target: &gt; 1.5x</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Quick Ratio (Acid Test)</span>
              <div className="text-2xl font-bold text-indigo-400 font-mono">{financialRatios.quickRatio}x</div>
              <p className="text-[10px] text-slate-500">Liquid Cash / Short-term Debt. Target: &gt; 1.0x</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Working Capital</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {currencySymbol}{financialRatios.workingCapital.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Current Assets minus Current Liabilities</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Debt-to-Equity Ratio</span>
              <div className="text-2xl font-bold text-purple-400 font-mono">{financialRatios.debtToEquity}x</div>
              <p className="text-[10px] text-slate-500">Total Liabilities / Total Owners Equity</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Gross Profit Margin</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{financialRatios.grossMarginPercentage}%</div>
              <p className="text-[10px] text-slate-500">Gross Margin as percentage of Revenue</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Net Profit Margin</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{financialRatios.netProfitMarginPercentage}%</div>
              <p className="text-[10px] text-slate-500">Bottom-line Net Income / Total Revenue</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
