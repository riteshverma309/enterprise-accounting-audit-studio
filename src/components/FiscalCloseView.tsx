import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Lock, Unlock, CheckCircle, ShieldAlert, Calendar, RefreshCw, AlertOctagon } from 'lucide-react';

export const FiscalCloseView: React.FC = () => {
  const { activeTenant, fiscalPeriods, toggleFiscalPeriodStatus, executeYearEndClose, incomeStatement } = useAccounting();
  const [closingYear, setClosingYear] = useState('2026');
  const [closeResult, setCloseResult] = useState<{ success: boolean; msg: string } | null>(null);

  const tenantPeriods = (fiscalPeriods || []).filter((p) => p.tenantId === activeTenant?.id);

  const handleRunYearEndClose = () => {
    const res = executeYearEndClose(closingYear);
    if (res.success) {
      setCloseResult({
        success: true,
        msg: `Year-End Close for FY ${closingYear} completed successfully! Net Income of ${activeTenant.currency} ${res.netIncomeClosed?.toLocaleString()} transferred to Retained Earnings (Account 3200). Entry ID: ${res.entryId}`,
      });
    } else {
      setCloseResult({
        success: false,
        msg: res.error || 'Failed to execute Year-End Close.',
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Lock className="w-6 h-6 text-amber-400" />
          Fiscal Period Governance & Year-End Close
        </h1>
        <p className="text-xs text-slate-400">
          Enforce accounting lock dates to prevent backdated postings, manage monthly/quarterly fiscal periods, and execute automated retained earnings closing journals for {activeTenant.name}.
        </p>
      </div>

      {/* Period Lock Status Schedule */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Fiscal Accounting Calendar & Lock Controls
          </h2>
          <span className="text-xs text-slate-400 font-mono">Double-Entry Engine Enforcement Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Fiscal Period Name</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3 text-center">Governance Status</th>
                <th className="p-3 text-right">Lock / Unlock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {tenantPeriods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                    No custom fiscal periods defined. All transactions defaulting to open status.
                  </td>
                </tr>
              ) : (
                tenantPeriods.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-slate-200">{p.periodName}</td>
                    <td className="p-3 text-slate-400">{p.startDate}</td>
                    <td className="p-3 text-slate-400">{p.endDate}</td>
                    <td className="p-3 text-center font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'OPEN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'LOCKED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {p.status === 'OPEN' ? (
                          <Unlock className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'OPEN' && (
                          <button
                            onClick={() => toggleFiscalPeriodStatus(p.id, 'OPEN')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition"
                          >
                            Open Period
                          </button>
                        )}
                        {p.status !== 'LOCKED' && (
                          <button
                            onClick={() => toggleFiscalPeriodStatus(p.id, 'LOCKED')}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium transition"
                          >
                            Soft Lock
                          </button>
                        )}
                        {p.status !== 'CLOSED' && (
                          <button
                            onClick={() => toggleFiscalPeriodStatus(p.id, 'CLOSED')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition"
                          >
                            Hard Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Year-End Close Automation Engine */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              Automated Year-End Financial Closing Engine
            </h2>
            <p className="text-xs text-slate-400">
              Zeroes out nominal Revenue and Expense balances into Equity Retained Earnings (Account 3200) via a balanced Year-End Closing Journal.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Current P&L Net Income:</span>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {activeTenant.currency} {incomeStatement.netIncome.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Target Fiscal Close Year</label>
            <select
              value={closingYear}
              onChange={(e) => setClosingYear(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="2026">2026 Fiscal Year</option>
              <option value="2025">2025 Fiscal Year</option>
            </select>
          </div>

          <button
            onClick={handleRunYearEndClose}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <CheckCircle className="w-4 h-4" />
            Execute FY {closingYear} Retained Earnings Close
          </button>
        </div>

        {closeResult && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono ${
              closeResult.success
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {closeResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              )}
              {closeResult.success ? 'Closing Journal Posted' : 'Year-End Close Blocked'}
            </div>
            {closeResult.msg}
          </div>
        )}
      </div>
    </div>
  );
};
