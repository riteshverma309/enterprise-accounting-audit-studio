import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { Receipt, Landmark, CheckCircle2, AlertCircle, RefreshCw, Globe, Send } from 'lucide-react';

export const TaxEngineView: React.FC = () => {
  const { taxJurisdictions, postTaxSettlementVoucher, activeTenant } = useAccounting();

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'EUR': return '€';
      case 'INR': return '₹';
      case 'SAR': return 'SAR ';
      case 'QAR': return 'QAR ';
      case 'AED': return 'AED ';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(activeTenant.currency);

  const getJurCurrencySymbol = (jurCode: string) => {
    if (jurCode.startsWith('IN')) return '₹';
    if (jurCode.startsWith('EU') || jurCode.startsWith('NL') || jurCode.startsWith('DE')) return '€';
    if (jurCode.startsWith('SA') || jurCode.startsWith('ZATCA')) return 'SAR ';
    if (jurCode.startsWith('QA') || jurCode.startsWith('GTA')) return 'QAR ';
    if (jurCode.startsWith('AE') || jurCode.startsWith('FTA') || jurCode.startsWith('DXB')) return 'AED ';
    return '$';
  };

  const totalAccruedTax = taxJurisdictions.reduce((sum, j) => sum + j.ytdAccruedTax, 0);

  const handleSettleTax = (jId: string, name: string) => {
    const res = postTaxSettlementVoucher(jId);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Tax Settlement Voucher posted successfully for ${name}. GL Tax Liability Account cleared.` });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Tax settlement voucher posting failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Statutory Tax & Multi-Jurisdiction Engine</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold">
              Global Tax Provisioning
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated sales tax, VAT, and GST accrued liabilities, rate matrices, and settlement voucher creation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Accrued Tax Liability</div>
              <div className="text-lg font-black text-white font-mono">{currencySymbol}{totalAccruedTax.toLocaleString()}</div>
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

      {/* JURISDICTION MATRIX GRID */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" /> Active Statutory Tax Rate Matrix & Accrued Balances
          </h2>
          <span className="text-xs text-slate-400 font-mono">Automatic General Ledger Postings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taxJurisdictions.map((jur) => (
            <div
              key={jur.id}
              className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{jur.name}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono font-bold">
                      {jur.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Tax Structure: <strong className="text-slate-200">{jur.taxType}</strong> ({jur.ratePercent}%)
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-slate-900 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-mono font-bold uppercase">
                  {jur.filingFrequency}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Accrued Tax Liability</span>
                  <div className="text-xl font-extrabold text-indigo-400 font-mono">
                    {getJurCurrencySymbol(jur.code)}
                    {jur.ytdAccruedTax.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleSettleTax(jur.id, jur.name)}
                  disabled={jur.ytdAccruedTax <= 0}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors ${
                    jur.ytdAccruedTax > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> Post Tax Settlement
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
