import React from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import { ShieldAlert, CheckCircle2, XCircle, Terminal, Lock } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { activeTenant, activeOrganization, activeBranch, auditLogs, activeRole, userEmail } = useAccounting();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{tr('Immutable System Security & Scope Audit Log')}</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[11px] rounded font-semibold border border-indigo-500/30">{tr('Audit Stream v1.4')}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{tr('Real-time audit record of API request context headers, scope enforcement, role permissions, and journal postings.')}</p>
        </div>
      </div>

      {/* Active Header Context Inspector Panel */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
          <Terminal className="w-4 h-4" />
          <span>{tr('Active Request Context Headers Inspection')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{tr('x-tenant-id')}</span>
            <p className="text-indigo-300 font-bold truncate mt-1">{activeTenant.id}</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{tr('x-organization-id')}</span>
            <p className="text-indigo-300 font-bold truncate mt-1">{activeOrganization?.id || 'GLOBAL_ALL'}</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{tr('x-branch-id')}</span>
            <p className="text-indigo-300 font-bold truncate mt-1">{activeBranch?.id || 'HQ_BRANCH'}</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{tr('Active Auth Token Role')}</span>
            <p className={`font-bold mt-1 ${activeRole === 'viewer' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeRole.toUpperCase()} ({userEmail})
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">{tr('System Security Events Feed')}</h3>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs ${
                log.status === 'SUCCESS'
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                  : log.status === 'FORBIDDEN'
                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {log.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{log.action}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {log.status === 'SUCCESS' ? 'HTTP 200 OK' : 'HTTP 403 FORBIDDEN'}
                    </span>
                    <span className="text-[10px] text-slate-500">[{log.userRole}] {log.userEmail}</span>
                  </div>
                  <p className="font-sans text-slate-200 text-xs font-medium">{log.details}</p>
                  <p className="text-[11px] text-slate-400">{log.payloadSummary}</p>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 shrink-0">
                <p>{new Date(log.timestamp).toLocaleString()}</p>
                <p>IP: {log.ipAddress}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
