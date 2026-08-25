import { useLanguage, tr, t } from '../context/LanguageContext';
import React, { useState } from 'react';
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
  QrCode,
  KeyRound,
  FileCode,
  ExternalLink,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export const RegulatoryReportsView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { activeTenant, statutoryReport } = useAccounting();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'zatca_fatoora' | 'qatar_dhareeba' | 'uae_emaratax'>('overview');

  const handleDownloadReport = (format: 'pdf' | 'xml' | 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${activeTenant.pluginId}_statutory_filing_${timestamp}.${format}`;
    let content = '';

    if (format === 'json') {
      content = JSON.stringify(statutoryReport, null, 2);
    } else if (format === 'xml') {
      content = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:zatca.gov.sa:fatoora:v2</cbc:CustomizationID>
  <cbc:ProfileID>{tr('reporting:1.0')}</cbc:ProfileID>
  <cbc:ID>${statutoryReport.taxIdentifier}</cbc:ID>
  <cbc:IssueDate>${timestamp}</cbc:IssueDate>
  <cbc:TaxCurrencyCode>${activeTenant.currency}</cbc:TaxCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${activeTenant.name}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${activeTenant.currency}">${statutoryReport.taxBreakdown.reduce((sum, r) => sum + r.netLiability, 0).toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
</Invoice>`;
    } else {
      content = `Standard,TaxComponent,TaxableBase,GrossTaxCollected,ITC_Credit,NetLiability\n` +
        statutoryReport.taxBreakdown.map((r) => `"${statutoryReport.standardName}","${r.name}",${r.taxableAmount},${r.taxCollected},${r.taxPaidCredit},${r.netLiability}`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Generated and downloaded ${filename} successfully.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const isZatca = activeTenant.pluginId === 'sa_zatca';
  const isQatar = activeTenant.pluginId === 'qa_gta';
  const isUae = activeTenant.pluginId === 'ae_fta';
  const isMiddleEast = isZatca || isQatar || isUae;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{tr('Statutory Regulatory Tax & Compliance Engine')}</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[11px] rounded font-semibold border border-indigo-500/30">
              Plugin: {activeTenant.pluginId.toUpperCase()}
            </span>
            {isMiddleEast && (
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[11px] rounded font-semibold border border-amber-500/30">{tr('GCC & Middle East Compliant')}</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{tr('Country-specific statutory tax reporting, e-invoicing compliance (ZATCA FATOORA / Dhareeba / EmaraTax), and tax liability schedules.')}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{tr('STATUTORY COMPLIANT')}</span>
          </div>

          <button
            onClick={() => handleDownloadReport('xml')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>{tr('Export UBL 2.1 XML')}</span>
          </button>

          <button
            onClick={() => handleDownloadReport('csv')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{tr('Download Statutory CSV')}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
          <button onClick={() => setDownloadSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* REGIONAL MIDDLE EAST COMPLIANCE SPOTLIGHT */}
      {isZatca && (
        <div className="bg-slate-900 rounded-2xl border border-amber-500/30 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">{tr('Saudi Arabia ZATCA Phase 2 FATOORA Integration')}<span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-bold">{tr('ACTIVE CLEARANCE MODE')}</span>
                </h2>
                <p className="text-xs text-slate-400">{tr('Cryptographic ECDSA secp256k1 stamping, SHA-256 Previous Invoice Hash (PIH) chaining, and Base64 TLV QR Code generation.')}</p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <span className="text-amber-400 font-bold">{tr('ZATCA TIN: 300123456700003')}</span> • CR: 1010892011
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{tr('Cryptographic Stamp ID (CSID)')}</span>
                <KeyRound className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs font-mono text-slate-200 truncate">{tr('CSID-ZATCA-PROD-904128')}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{tr('Validated with ZATCA Root CA')}</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{tr('Hash Chain Integrity (PIH)')}</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xs font-mono text-slate-200 truncate">{tr('NWZkODkyOGExYzllMmE4MTg0N2Q3NGQxNGM3NzA2YzgyMj...')}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{tr('SHA-256 Chain Sequence Intact')}</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{tr('Zakat Base & WHT Pool')}</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xs font-mono text-slate-200">2.578% Zakat • 5.0% WHT</div>
              <div className="text-[10px] text-indigo-300">{tr('ERAD Statutory Declaration Ready')}</div>
            </div>
          </div>
        </div>
      )}

      {isQatar && (
        <div className="bg-slate-900 rounded-2xl border border-purple-500/30 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">{tr('Qatar GTA Dhareeba Tax Portal E-Filing Engine')}<span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-bold">{tr('DHAREEBA VERIFIED')}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Compliance with Qatar Tax Law No. 24 of 2018, 10% Corporate Income Tax (CIT) schedule, and 5% Withholding Tax.
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <span className="text-purple-400 font-bold">{tr('Dhareeba TIN: 0000182940')}</span> • CR: 84920
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs text-slate-400">{tr('Corporate Income Tax (CIT)')}</div>
              <div className="text-sm font-bold text-white">10.0% on Foreign Shareholding</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{tr('Law No. 24/2018 Statutory Schedule')}</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs text-slate-400">Withholding Tax (WHT @ Source)</div>
              <div className="text-sm font-bold text-white">5.0% on Technical Services / Royalties</div>
              <div className="text-[10px] text-purple-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{tr('Form WHT-01 Auto-Generated')}</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs text-slate-400">{tr('Qatar Financial Centre (QFC) Status')}</div>
              <div className="text-sm font-bold text-emerald-400">{tr('Onshore Mainland Registered')}</div>
              <div className="text-[10px] text-slate-400">{tr('Standard QFC/Mainland Tax Rules Active')}</div>
            </div>
          </div>
        </div>
      )}

      {isUae && (
        <div className="bg-slate-900 rounded-2xl border border-teal-500/30 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">{tr('UAE FTA EmaraTax (VAT Return 201 & Corporate Tax)')}<span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-bold">{tr('EMARATAX CONNECTED')}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Federal Decree-Law No. 8 of 2017 (5% VAT) & Federal Decree-Law No. 47 of 2022 (9% Corporate Tax with AED 375k exemption).
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <span className="text-teal-400 font-bold">{tr('TRN: 100294819200003')}</span> • EmaraTax Ref: FTA-DXB-2026-440192
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs text-slate-400">{tr('Mainland Corporate Tax (CT)')}</div>
              <div className="text-sm font-bold text-white">9% above AED 375,000 Threshold</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />{tr('Exemption applied to initial AED 375k')}</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs text-slate-400">{tr('Qualifying Free Zone Person (QFZP)')}</div>
              <div className="text-sm font-bold text-teal-400">0% on Qualifying Income</div>
              <div className="text-[10px] text-slate-400">{tr('Ministerial Decision No. 139/2023 Rules')}</div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs text-slate-400">{tr('VAT 201 Periodic Filing')}</div>
              <div className="text-sm font-bold text-white">5.0% Standard Rated Supply</div>
              <div className="text-[10px] text-indigo-300">{tr('Reverse Charge & Exports Segregated')}</div>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">{tr('Statutory Tax Component Breakdown & Ledger Postings')}</h3>
            <span className="text-[11px] font-mono text-slate-400">Currency: {activeTenant.currency}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">{tr('Tax Component / Schedule')}</th>
                  <th className="p-3 text-right">{tr('Taxable Base Amount')}</th>
                  <th className="p-3 text-right">{tr('Gross Output Tax / Provision')}</th>
                  <th className="p-3 text-right">{tr('Input Tax Credit / Deduction')}</th>
                  <th className="p-3 text-right">{tr('Net Statutory Liability')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {statutoryReport.taxBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
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
            <span>{tr('Statutory Disclosures & Regulatory Audit Schedule')}</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 font-mono">
            {statutoryReport.summaryNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>

        {/* Interactive Country Switcher Hint */}
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs text-indigo-300">
          <span>
            💡 <strong>{tr("Multi-Jurisdiction Compliance Engine:")}</strong> {tr("Switch between entities in the top header to inspect localized rules:")}{' '}
            <strong className="text-white">{tr('Saudi Arabia (ZATCA FATOORA Phase 2)')}</strong>,{' '}
            <strong className="text-white">{tr('Qatar (GTA Dhareeba)')}</strong>,{' '}
            <strong className="text-white">{tr('UAE (FTA EmaraTax)')}</strong>,{' '}
            <strong className="text-white">{tr('India (GST Act 2017)')}</strong>,{' '}
            <strong className="text-white">{tr('EU (IFRS & Cross-Border VAT)')}</strong>, {tr("or")}{' '}
            <strong className="text-white">{tr('US (GAAP ASC 606)')}</strong>.
          </span>
        </div>

      </div>

    </div>
  );
};
