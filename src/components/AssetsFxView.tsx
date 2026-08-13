import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Layers, Play, DollarSign, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import { FX_RATES } from '../mockData';

export const AssetsFxView: React.FC = () => {
  const { activeTenant, fixedAssets, runDepreciationForTenant } = useAccounting();

  const tenantAssets = fixedAssets.filter((fa) => fa.tenantId === activeTenant.id);
  const [depDate, setDepDate] = useState('2026-08-31');
  const [depMessage, setDepMessage] = useState<string | null>(null);

  const handleRunDepreciation = () => {
    const res = runDepreciationForTenant(depDate);
    if (res.success) {
      setDepMessage(`Successfully posted depreciation entries! Depreciated ${activeTenant.currency} ${res.totalDepreciation.toLocaleString()} across ${res.entriesCreated} assets.`);
    } else {
      setDepMessage('No assets found for depreciation run.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Fixed Assets & Multi-Currency FX Engine</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[11px] rounded font-semibold border border-indigo-500/30">
              {activeTenant.name} ({activeTenant.currency})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated straight-line asset depreciation runs and month-end unrealized foreign exchange revaluations.
          </p>
        </div>
      </div>

      {/* Dep Message Alert */}
      {depMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{depMessage}</span>
        </div>
      )}

      {/* SECTION 1: FIXED ASSETS REGISTER */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Fixed Assets Register (ASC 360 / IAS 16)</h3>
            <p className="text-xs text-slate-400">Track acquisition cost, accumulated depreciation, and net book value.</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={depDate}
              onChange={(e) => setDepDate(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 font-mono outline-none"
            />
            <button
              onClick={handleRunDepreciation}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-medium shadow transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Depreciation</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Asset #</th>
                <th className="p-3">Asset Description</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Cost ({activeTenant.currency})</th>
                <th className="p-3 text-right">Accum Depreciation</th>
                <th className="p-3 text-right">Net Book Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {tenantAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No fixed assets registered for {activeTenant.name}.</td>
                </tr>
              ) : (
                tenantAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-indigo-300">{asset.assetNumber}</td>
                    <td className="p-3 font-sans text-slate-100 font-semibold">{asset.name}</td>
                    <td className="p-3 text-slate-400">{asset.category}</td>
                    <td className="p-3 text-right font-bold text-slate-200">{asset.cost.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-rose-400">-{asset.accumulatedDepreciation.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-emerald-400 text-sm">{asset.netBookValue.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: MULTI-CURRENCY FX ENGINE */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Multi-Currency Exchange Rates & FX Engine</h3>
        <p className="text-xs text-slate-400">Active foreign currency exchange conversion rates for revaluation</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          {FX_RATES.map((fx, idx) => (
            <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-indigo-400 font-bold text-sm">{fx.fromCurrency} / {fx.toCurrency}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">As of: {fx.asOfDate}</p>
              </div>
              <span className="text-white font-extrabold text-base">{fx.rate}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
