import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  FileCheck2,
  Globe2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Building,
  Info,
  Download,
} from 'lucide-react';

export const RegulatoryReportsView: React.FC = () => {
  const { activeTenant, statutoryReport } = useAccounting();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Statutory Regulatory Tax & Compliance Engine</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[11px] rounded font-semibold border border-indigo-500/30">
              Plugin: {activeTenant.pluginId.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Country-specific statutory tax reporting, tax liability calculations, and regulatory filings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>STATUTORY COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Main Statutory Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-6">
        
        {/* Title & Metadata */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">{statutoryReport.title}</h2>
            </div>
            <p className="text-xs text-slate-400">{statutoryReport.standardName}</p>
          </div>

          <div className="text-right text-xs font-mono space-y-1">
            <p className="text-indigo-300 font-bold">{statutoryReport.taxIdentifier}</p>
            <p className="text-slate-400">Period: {statutoryReport.period}</p>
          </div>
        </div>

        {/* Tax Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Statutory Tax Component Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Tax Component</th>
                  <th className="p-3 text-right">Taxable Base Amount</th>
                  <th className="p-3 text-right">Gross Output Tax Collected</th>
                  <th className="p-3 text-right">Input Tax Credit (ITC)</th>
                  <th className="p-3 text-right">Net Statutory Liability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {statutoryReport.taxBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-semibold text-slate-100">{row.name}</td>
                    <td className="p-3 text-right font-bold text-slate-300">
                      {activeTenant.currency} {row.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-indigo-300">
                      {activeTenant.currency} {row.taxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {activeTenant.currency} {row.taxPaidCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-white text-sm">
                      {activeTenant.currency} {row.netLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Notes & Disclosures */}
        <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <Info className="w-4 h-4" />
            <span>Statutory Disclosures & Statutory Audit Notes</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-mono">
            {statutoryReport.summaryNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>

        {/* Interactive Country Switcher Hint */}
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs text-indigo-300">
          <span>
            💡 <strong>Pro Tip:</strong> Switch between entities (e.g. Acme Inc USD for US GAAP vs Bharat Retail INR for India GST vs TechGlobe EUR for EU IFRS) in the top header to inspect localized regulatory tax engines.
          </span>
        </div>

      </div>

    </div>
  );
};
