import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { Building2, X, Download, CheckCircle2, ArrowRight, Sparkles, FileSpreadsheet, Layers } from 'lucide-react';
import { PluginId } from '../types';
import { UPLOAD_TEMPLATES, downloadCsvFile } from '../utils/templateGenerator';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToImporter?: () => void;
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ isOpen,
  onClose,
  onNavigateToImporter,
}) => {
  const { tr, t } = useLanguage();
  const { createTenant } = useAccounting();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('United States');
  const [pluginId, setPluginId] = useState<PluginId>('us_gaap');
  const [createdEntityName, setCreatedEntityName] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setName('');
    setCode('');
    setCurrency('USD');
    setCountry('United States');
    setPluginId('us_gaap');
    setCreatedEntityName('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    createTenant({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      currency,
      country,
      pluginId,
    });

    setCreatedEntityName(`${name.trim()} (${code.trim().toUpperCase()})`);
    setStep(2);
  };

  const handleDownloadAllTemplates = () => {
    UPLOAD_TEMPLATES.forEach((tmpl) => {
      const csv = tmpl.sampleCsv(createdEntityName, currency);
      downloadCsvFile(`${code.toLowerCase() || 'entity'}_${tmpl.filename}`, csv);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              {step === 1 ? <Building2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {step === 1 ? tr('Create Corporate Tenant Entity') : tr('Entity Initial Onboarding & Data Import Setup')}
              </h2>
              <p className="text-[11px] text-slate-400">{tr('Step')} {step} of 2 • SOX 404 Entity Provisioning</p>
            </div>
          </div>
          <button type="button" onClick={handleReset} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Company / Entity Name')} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tr('e.g., Tokyo Robotics Japan K.K.')}
                  className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Entity Code (Prefix)')} *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={tr('e.g., TOKYO-JP')}
                  className="w-full bg-slate-950 text-slate-100 text-xs font-mono p-2.5 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Functional Currency')}</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 outline-none cursor-pointer font-mono"
                  >
                    <option value="USD">{tr('USD ($)')}</option>
                    <option value="EUR">{tr('EUR (€)')}</option>
                    <option value="INR">{tr('INR (₹)')}</option>
                    <option value="GBP">{tr('GBP (£)')}</option>
                    <option value="JPY">{tr('JPY (¥)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Country Jurisdiction')}</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Localization & Tax Plugin Standard')}</label>
                <select
                  value={pluginId}
                  onChange={(e) => setPluginId(e.target.value as PluginId)}
                  className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 outline-none cursor-pointer font-bold text-indigo-300"
                >
                  <option value="us_gaap">{tr('US GAAP (SEC Form 10-K & State Sales Tax)')}</option>
                  <option value="eu_ifrs">{tr('EU IFRS (IAS-1 & Cross-Border Reverse Charge VAT)')}</option>
                  <option value="in_gst">{tr('India GST (GSTR-1, CGST/SGST/IGST Act 2017)')}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                {tr('Cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <span>{tr('Provision Entity & Next Step')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: ONBOARDING & TEMPLATE DOWNLOAD HUB */
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold">{tr('Entity Created Successfully!')}</span>
                <p className="text-[11px] text-emerald-200/80">
                  {createdEntityName} is now active. Standard Chart of Accounts seeded with currency {currency}.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> {tr('Quick Data Import CSV Templates')}
                </span>
                <button
                  type="button"
                  onClick={handleDownloadAllTemplates}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Download className="w-3 h-3" /> {tr('Download All (6 CSVs)')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {UPLOAD_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="font-bold text-white text-[11px] truncate max-w-[170px]">{tmpl.title}</div>
                      <div className="text-[10px] text-indigo-400 font-mono">{tmpl.filename}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadCsvFile(`${code.toLowerCase() || 'entity'}_${tmpl.filename}`, tmpl.sampleCsv(createdEntityName, currency))}
                      title={`Download ${tmpl.title} CSV`}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg border border-slate-700 cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                {tr('Close')}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  if (onNavigateToImporter) onNavigateToImporter();
                }}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" /> {tr('Bulk Upload Transactions')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
