import React, { useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, FileText, UserCheck, Clock, Lock, Key, Sparkles, Check } from 'lucide-react';
import { ApprovalItem } from '../types';

export const ApprovalsView: React.FC = () => {
  const { approvalItems, processApprovalDecision, activeTenant, activeRole, userEmail } = useAccounting();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedItemForSignoff, setSelectedItemForSignoff] = useState<ApprovalItem | null>(null);
  const [checkerNotes, setCheckerNotes] = useState<string>('Dual-signature verification complete. Complies with SOX 404 internal financial controls.');
  const [signatureSuccessMsg, setSignatureSuccessMsg] = useState<string | null>(null);

  const currencySymbol = activeTenant.currency === 'EUR' ? '€' : activeTenant.currency === 'INR' ? '₹' : '$';

  const filteredItems = approvalItems.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const pendingCount = approvalItems.filter((i) => i.status === 'PENDING').length;

  const handleExecuteDualSignature = (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedItemForSignoff) return;
    
    processApprovalDecision(selectedItemForSignoff.id, decision);
    
    setSignatureSuccessMsg(`Successfully executed 2nd Checker Signature for ${selectedItemForSignoff.referenceNumber}! Status set to ${decision}.`);
    
    setTimeout(() => {
      setSignatureSuccessMsg(null);
      setSelectedItemForSignoff(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" /> Multi-Signature Governance & Maker-Checker Queue
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold animate-pulse">
                {pendingCount} Dual Sign-off Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforces SOX 404 Maker-Checker authorization policies for high-value general ledger vouchers, vendor payments, and customer credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* THRESHOLD POLICY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Journal Voucher Threshold</span>
            <Lock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">&gt; {currencySymbol}100,000</div>
          <p className="text-[11px] text-slate-500">Requires Senior Accountant (Maker) + Controller (Checker) Dual Signatures</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Vendor Payment Threshold</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">&gt; {currencySymbol}25,000</div>
          <p className="text-[11px] text-slate-500">Requires AP Specialist (Maker) + VP Finance (Checker) Dual Signatures</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Customer Invoice Credit Limit</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">&gt; {currencySymbol}50,000</div>
          <p className="text-[11px] text-slate-500">Requires AR Accountant (Maker) + Controller (Checker) Dual Signatures</p>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {signatureSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{signatureSuccessMsg}</span>
        </div>
      )}

      {/* APPROVAL ITEMS QUEUE TABLE */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" /> Dual-Signature Approval Requests
          </h2>
          <span className="text-xs text-slate-400 font-mono">SOX Section 404 Audit Control Queue</span>
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
                        <CheckCircle2 className="w-3 h-3" /> DUAL SIGNED & APPROVED
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-mono flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> REJECTED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300">{item.description}</p>

                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-4 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      1st Signature (Maker): <strong className="text-slate-200">{item.requestedBy}</strong>
                    </span>
                    <span>Date: <strong className="text-slate-200">{item.requestedDate}</strong></span>
                    {item.status === 'APPROVED' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        2nd Signature (Checker): Verified by {userEmail} ({activeRole})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-900 justify-between md:justify-end">
                  <div className="text-left md:text-right font-mono">
                    <div className="text-[10px] text-slate-500 uppercase">Amount</div>
                    <div className="text-lg font-black text-white">
                      {item.currency === 'EUR' ? '€' : item.currency === 'INR' ? '₹' : '$'}
                      {item.amount.toLocaleString()}
                    </div>
                  </div>

                  {item.status === 'PENDING' && (
                    <button
                      onClick={() => setSelectedItemForSignoff(item)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-amber-300" />
                      <span>Review & Execute 2nd Signature</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DUAL SIGNATURE CHECKER MODAL */}
      {selectedItemForSignoff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Execute 2nd Signature (Checker Authorizer)</h3>
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
                <span className="text-slate-400">Voucher Reference:</span>
                <span className="font-mono font-bold text-white">{selectedItemForSignoff.referenceNumber}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Amount & Currency:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {selectedItemForSignoff.currency === 'EUR' ? '€' : selectedItemForSignoff.currency === 'INR' ? '₹' : '$'}
                  {selectedItemForSignoff.amount.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Description / Memo:</span>
                <p className="text-slate-200 font-sans">{selectedItemForSignoff.description}</p>
              </div>

              {/* 1ST SIGNATURE BADGE */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1st Digital Signature (Maker):
                  </span>
                  <span className="font-mono text-[10px]">VERIFIED</span>
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  User: {selectedItemForSignoff.requestedBy} • Date: {selectedItemForSignoff.requestedDate}
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
              >
                Reject Voucher
              </button>
              <button
                onClick={() => handleExecuteDualSignature('APPROVED')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Execute 2nd Signature & Authorize GL Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

