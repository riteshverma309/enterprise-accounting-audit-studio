import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Globe2, ArrowRightLeft, DollarSign, Layers, CheckCircle2 } from 'lucide-react';

export const ConsolidationView: React.FC = () => {
  const { consolidatedFinancials, tenants } = useAccounting();
  const [applyEliminations, setApplyEliminations] = useState(true);

  const elimAmount = applyEliminations ? consolidatedFinancials.intercompanyEliminationAmount : 0;
  const netRev = consolidatedFinancials.totalConsolidatedRevenue - elimAmount;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-blue-400" />
          Global Multi-Tenant Corporate Consolidation & FX Translation
        </h1>
        <p className="text-xs text-slate-400">
          Consolidate financial statements across global operating entities in {consolidatedFinancials.presentationCurrency} presentation currency with IAS 21 Foreign Exchange translation and intercompany balance eliminations.
        </p>
      </div>

      {/* Top Level Group Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Gross Consolidated Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {consolidatedFinancials.presentationCurrency} {consolidatedFinancials.totalConsolidatedRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Aggregated across all {tenants.length} corporate entities</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Intercompany Eliminations</span>
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            - {consolidatedFinancials.presentationCurrency} {elimAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Elimination of intercompany sales & service fees</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Net Consolidated Group Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {consolidatedFinancials.presentationCurrency} {netRev.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Final SEC 10-K / IFRS consolidated income statement</p>
        </div>
      </div>

      {/* Intercompany Elimination Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-xs font-bold text-slate-200">Intercompany Balance & Revenue Eliminations</h3>
            <p className="text-[11px] text-slate-400">
              Eliminate double-counted intercompany receivables, payables, and cross-entity licensing revenue.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={applyEliminations}
            onChange={(e) => setApplyEliminations(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* Entity Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Operating Entity Consolidation Ledger</h2>
          <span className="text-xs text-slate-400 font-mono">IAS 21 Foreign Currency Translation Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Entity Name</th>
                <th className="p-3">Local Currency</th>
                <th className="p-3 text-right">Local Revenue</th>
                <th className="p-3 text-right">FX Rate to {consolidatedFinancials.presentationCurrency}</th>
                <th className="p-3 text-right">Translated Revenue ({consolidatedFinancials.presentationCurrency})</th>
                <th className="p-3 text-right">Translated Total Assets ({consolidatedFinancials.presentationCurrency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {consolidatedFinancials.entities.map((e) => (
                <tr key={e.tenantId} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-semibold text-slate-100 font-sans">{e.tenantName}</td>
                  <td className="p-3 font-bold text-indigo-400">{e.localCurrency}</td>
                  <td className="p-3 text-right font-medium text-slate-200">
                    {e.localCurrency} {e.localRevenue.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-slate-400">{e.fxRateToPresentation.toFixed(4)}</td>
                  <td className="p-3 text-right font-bold text-slate-100">
                    {consolidatedFinancials.presentationCurrency} {e.translatedRevenue.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-emerald-400">
                    {consolidatedFinancials.presentationCurrency} {e.translatedAssets.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-950/80 font-bold">
                <td colSpan={4} className="p-3 text-slate-300 font-sans">Gross Subtotal before Eliminations</td>
                <td className="p-3 text-right text-indigo-300">
                  {consolidatedFinancials.presentationCurrency} {consolidatedFinancials.totalConsolidatedRevenue.toLocaleString()}
                </td>
                <td className="p-3 text-right text-emerald-300">
                  {consolidatedFinancials.presentationCurrency} {consolidatedFinancials.totalConsolidatedAssets.toLocaleString()}
                </td>
              </tr>
              {applyEliminations && (
                <tr className="bg-amber-950/20 text-amber-300 font-semibold">
                  <td colSpan={4} className="p-3 font-sans">Intercompany Elimination Adjustments</td>
                  <td className="p-3 text-right font-mono">
                    - {consolidatedFinancials.presentationCurrency} {consolidatedFinancials.intercompanyEliminationAmount.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono">$0.00</td>
                </tr>
              )}
              <tr className="bg-slate-950 text-slate-100 font-bold border-t-2 border-slate-700">
                <td colSpan={4} className="p-3 font-sans text-sm">FINAL NET CONSOLIDATED GROUP TOTAL</td>
                <td className="p-3 text-right text-sm text-emerald-400 font-mono">
                  {consolidatedFinancials.presentationCurrency} {netRev.toLocaleString()}
                </td>
                <td className="p-3 text-right text-sm text-emerald-400 font-mono">
                  {consolidatedFinancials.presentationCurrency} {consolidatedFinancials.totalConsolidatedAssets.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
