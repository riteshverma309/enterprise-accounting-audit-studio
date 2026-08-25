import React, { useState } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Lock,
  Key,
  Check,
  Plus,
  Sliders,
  Trash2,
  Edit2,
  AlertTriangle,
  UserCheck,
  FileCheck2,
  DollarSign,
} from 'lucide-react';
import { ApprovalItem, ConfigurableApprovalRule, Role, PermissionKey } from '../types';

export const ApprovalsView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    approvalItems,
    approvalRules,
    processApprovalDecision,
    createApprovalRule,
    updateApprovalRule,
    deleteApprovalRule,
    toggleApprovalRule,
    submitApprovalRequest,
    activeTenant,
    activeRole,
    userEmail,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'RULES'>('QUEUE');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedItemForSignoff, setSelectedItemForSignoff] = useState<ApprovalItem | null>(null);
  const [checkerNotes, setCheckerNotes] = useState<string>('Dual-signature verification complete. Complies with SOX 404 internal financial controls.');
  const [signatureSuccessMsg, setSignatureSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleEntityType, setNewRuleEntityType] = useState<ConfigurableApprovalRule['entityType']>('JOURNAL_ENTRY');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(50000);
  const [newRuleRole, setNewRuleRole] = useState<Role>('controller');
  const [newRulePermission, setNewRulePermission] = useState<PermissionKey>('governance:approve');
  const [newRuleMakerChecker, setNewRuleMakerChecker] = useState<boolean>(true);
  const [newRuleDescription, setNewRuleDescription] = useState('');

  // Quick Mock Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqEntityType, setReqEntityType] = useState<ApprovalItem['entityType']>('JOURNAL_ENTRY');
  const [reqAmount, setReqAmount] = useState<number>(75000);
  const [reqRef, setReqRef] = useState<string>('');
  const [reqDesc, setReqDesc] = useState<string>('');

  const currencySymbol = activeTenant.currency === 'EUR' ? '€' : activeTenant.currency === 'INR' ? '₹' : '$';

  const filteredItems = approvalItems.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const pendingCount = approvalItems.filter((i) => i.status === 'PENDING').length;

  const handleExecuteDualSignature = (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedItemForSignoff) return;
    
    const res = processApprovalDecision(selectedItemForSignoff.id, decision, checkerNotes);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to process signature.');
      return;
    }
    
    setSignatureSuccessMsg(`Successfully executed 2nd Checker Signature for ${selectedItemForSignoff.referenceNumber}! Status set to ${decision}.`);
    setErrorMessage(null);
    
    setTimeout(() => {
      setSignatureSuccessMsg(null);
      setSelectedItemForSignoff(null);
    }, 2000);
  };

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    createApprovalRule({
      tenantId: activeTenant.id,
      ruleName: newRuleName.trim(),
      entityType: newRuleEntityType,
      thresholdAmount: Number(newRuleThreshold),
      requiredRole: newRuleRole,
      requiredPermission: newRulePermission,
      enforceMakerChecker: newRuleMakerChecker,
      isEnabled: true,
      description: newRuleDescription.trim() || `Requires dual signoff when ${newRuleEntityType} exceeds ${currencySymbol}${newRuleThreshold.toLocaleString()}`,
    });

    setIsRuleModalOpen(false);
    setNewRuleName('');
    setNewRuleDescription('');
  };

  const handleCreateRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqRef.trim() || reqAmount <= 0) return;

    submitApprovalRequest({
      tenantId: activeTenant.id,
      entityType: reqEntityType,
      referenceNumber: reqRef.trim(),
      amount: Number(reqAmount),
      currency: activeTenant.currency,
      requestedBy: userEmail,
      requestedRole: activeRole,
      description: reqDesc.trim() || `High-value ${reqEntityType} submitted for dual authorization.`,
    });

    setIsRequestModalOpen(false);
    setReqRef('');
    setReqDesc('');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />{tr('Multi-Signature Governance & Approval Engine')}</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold animate-pulse">
                {pendingCount} Dual Sign-off Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{tr('Enforces SOX 404 Maker-Checker authorization policies, dual-signature workflows, and configurable value thresholds.')}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'QUEUE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Approval Queue ({pendingCount})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('RULES')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'RULES'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Threshold Rules ({approvalRules.length})
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              setReqRef(`VOUCHER-${Date.now().toString().slice(-4)}`);
              setReqDesc('Quarterly enterprise infrastructure settlement payment.');
              setIsRequestModalOpen(true);
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />{tr('Request Approval')}</button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-300 hover:text-white text-sm">✕</button>
        </div>
      )}

      {/* SUCCESS NOTIFICATION */}
      {signatureSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{signatureSuccessMsg}</span>
        </div>
      )}

      {activeTab === 'QUEUE' ? (
        <>
          {/* THRESHOLD POLICY HIGHLIGHT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {approvalRules.slice(0, 3).map((rule) => (
              <div key={rule.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="truncate">{rule.ruleName}</span>
                  <Lock className={`w-4 h-4 ${rule.isEnabled ? 'text-indigo-400' : 'text-slate-600'}`} />
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  &gt; {currencySymbol}{rule.thresholdAmount.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{rule.description}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{tr('Authorizer:')} <strong className="text-indigo-300 uppercase">{rule.requiredRole}</strong></span>
                  <span className={rule.enforceMakerChecker ? 'text-emerald-400' : 'text-amber-400'}>
                    {rule.enforceMakerChecker ? '✓ Maker-Checker (SoD)' : 'Single Signoff'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* APPROVAL ITEMS QUEUE TABLE */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />{tr('Dual-Signature Approval Queue')}</h2>
                <span className="text-xs text-slate-400 font-mono">{tr('SOX Section 404 Maker-Checker Audit Trail')}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      filterStatus === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No approval requests found for filter: <span className="font-bold text-slate-400">{filterStatus}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono font-bold">
                          {item.entityType}
                        </span>
                        <span className="text-sm font-bold text-white font-mono">{item.referenceNumber}</span>
                        
                        {item.status === 'PENDING' && (
                          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> MAKER SIGNED • CHECKER PENDING
                          </span>
                        )}
                        {item.status === 'APPROVED' && (
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />{tr('DUAL SIGNED & APPROVED')}</span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-mono flex items-center gap-1">
                            <XCircle className="w-3 h-3" />{tr('REJECTED')}</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300">{item.description}</p>

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-400" />
                          1st Signature (Maker): <strong className="text-slate-200">{item.requestedBy}</strong> ({item.requestedRole || 'Accountant'})
                        </span>
                        <span>{tr('Date:')} <strong className="text-slate-200">{item.requestedDate}</strong></span>
                        {item.status === 'APPROVED' && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            2nd Signature (Checker): {item.approvedBy} ({item.approvedRole}) on {item.approvalDate?.split('T')[0]}
                          </span>
                        )}
                        {item.status === 'REJECTED' && item.rejectionReason && (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reason: {item.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-900 justify-between md:justify-end">
                      <div className="text-left md:text-right font-mono">
                        <div className="text-[10px] text-slate-500 uppercase">{tr('Amount')}</div>
                        <div className="text-lg font-black text-white">
                          {item.currency === 'EUR' ? '€' : item.currency === 'INR' ? '₹' : '$'}
                          {item.amount.toLocaleString()}
                        </div>
                      </div>

                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setErrorMessage(null);
                            setSelectedItemForSignoff(item);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 text-amber-300" />
                          <span>{tr('Review & Execute 2nd Signature')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* RULES CONFIGURATION TAB */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />{tr('Configurable Multi-Signature Threshold Rules')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{tr('Define the financial thresholds and role-based sign-off requirements for sensitive operations.')}</p>
            </div>

            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />{tr('Create Threshold Rule')}</button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {approvalRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  rule.isEnabled
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">{rule.ruleName}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono">
                      {rule.entityType}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                      Threshold: &gt; {currencySymbol}{rule.thresholdAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{rule.description}</p>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
                    <span>{tr('Required Checker Role:')} <strong className="text-slate-300 uppercase">{rule.requiredRole}</strong></span>
                    <span>•</span>
                    <span>{tr('Permission Scope:')} <strong className="text-indigo-400">{rule.requiredPermission}</strong></span>
                    <span>•</span>
                    <span className={rule.enforceMakerChecker ? 'text-emerald-400' : 'text-amber-400'}>
                      {rule.enforceMakerChecker ? 'Maker-Checker Enforced (No Self-Approval)' : 'Self-Approval Permitted'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleApprovalRule(rule.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      rule.isEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rule.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => deleteApprovalRule(rule.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition"
                    title={tr('Delete rule')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DUAL SIGNATURE CHECKER MODAL */}
      {selectedItemForSignoff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">{tr('Execute 2nd Signature (Checker Authorizer)')}</h3>
              </div>
              <button
                onClick={() => setSelectedItemForSignoff(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">{tr('Voucher Reference:')}</span>
                <span className="font-mono font-bold text-white">{selectedItemForSignoff.referenceNumber}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">{tr('Amount & Currency:')}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {selectedItemForSignoff.currency === 'EUR' ? '€' : selectedItemForSignoff.currency === 'INR' ? '₹' : '$'}
                  {selectedItemForSignoff.amount.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">{tr('Description / Memo:')}</span>
                <p className="text-slate-200 font-sans">{selectedItemForSignoff.description}</p>
              </div>

              {/* 1ST SIGNATURE BADGE */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1st Digital Signature (Maker):
                  </span>
                  <span className="font-mono text-[10px]">{tr('VERIFIED')}</span>
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  Maker User: {selectedItemForSignoff.requestedBy} • Date: {selectedItemForSignoff.requestedDate}
                </div>
              </div>

              {/* 2ND SIGNATURE INPUT */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> 2nd Digital Signature (Checker):
                  </span>
                  <span className="font-mono text-[10px] uppercase text-purple-400">{activeRole}</span>
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  Signer: {userEmail} ({activeRole.toUpperCase()})
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Checker Compliance Notes & SOX Verification Memo:
                  </label>
                  <textarea
                    rows={2}
                    value={checkerNotes}
                    onChange={(e) => setCheckerNotes(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded-lg border border-slate-800 text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleExecuteDualSignature('REJECTED')}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl cursor-pointer"
              >{tr('Reject Voucher')}</button>
              <button
                onClick={() => handleExecuteDualSignature('APPROVED')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{tr('Execute 2nd Signature & Authorize Post')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />{tr('Create Multi-Signature Threshold Rule')}</h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRuleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{tr('Rule Name *')}</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder={tr('e.g. Executive Treasury Wire Approval')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{tr('Entity Type')}</label>
                  <select
                    value={newRuleEntityType}
                    onChange={(e) => setNewRuleEntityType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="JOURNAL_ENTRY">{tr('Journal Entry')}</option>
                    <option value="VENDOR_BILL">{tr('Vendor Bill')}</option>
                    <option value="INVOICE">{tr('Customer Invoice')}</option>
                    <option value="PAYROLL_RUN">{tr('Payroll Run')}</option>
                    <option value="EXPENSE_CLAIM">{tr('Expense Claim')}</option>
                    <option value="PERIOD_REOPEN">{tr('Fiscal Period Re-open')}</option>
                    <option value="BACKUP_RESTORE">{tr('Disaster Recovery Restore')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Threshold Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{tr('Required Checker Role')}</label>
                  <select
                    value={newRuleRole}
                    onChange={(e) => setNewRuleRole(e.target.value as Role)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="super_user">{tr('⚡ Super User')}</option>
                    <option value="entity_admin">{tr('🏢 Entity Admin')}</option>
                    <option value="admin">{tr('Financial Admin')}</option>
                    <option value="controller">{tr('Controller')}</option>
                    <option value="accountant">{tr('Senior Accountant')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{tr('Required Permission Key')}</label>
                  <input
                    type="text"
                    value={newRulePermission}
                    onChange={(e) => setNewRulePermission(e.target.value as PermissionKey)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="makerCheckerCheck"
                  checked={newRuleMakerChecker}
                  onChange={(e) => setNewRuleMakerChecker(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="makerCheckerCheck" className="text-slate-300 font-semibold cursor-pointer">{tr('Enforce Segregation of Duties (Maker cannot approve their own submission)')}</label>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{tr('Description')}</label>
                <textarea
                  rows={2}
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  placeholder={tr('Compliance and control description...')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >{tr('Save Rule')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SUBMIT REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />{tr('Submit Voucher for Approval')}</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{tr('Entity Type')}</label>
                <select
                  value={reqEntityType}
                  onChange={(e) => setReqEntityType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="JOURNAL_ENTRY">{tr('Journal Entry')}</option>
                  <option value="VENDOR_BILL">{tr('Vendor Bill')}</option>
                  <option value="INVOICE">{tr('Customer Invoice')}</option>
                  <option value="PAYROLL_RUN">{tr('Payroll Run')}</option>
                  <option value="EXPENSE_CLAIM">{tr('Expense Claim')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{tr('Reference #')}</label>
                  <input
                    type="text"
                    required
                    value={reqRef}
                    onChange={(e) => setReqRef(e.target.value)}
                    placeholder={tr('e.g. JE-2026-091')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={reqAmount}
                    onChange={(e) => setReqAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">{tr('Description / Purpose')}</label>
                <textarea
                  rows={2}
                  required
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder={tr('Reason for financial transaction...')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >{tr('Submit for Signoff')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
