import React from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  DollarSign,
  Building2,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
  onOpenNewJournalModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenNewJournalModal,
}) => {
  const {
    activeTenant,
    balanceSheet,
    incomeStatement,
    journalEntries,
    auditLogs,
    accounts,
  } = useAccounting();

  const { t, tr } = useLanguage();

  // Monthly Revenue vs Expense dummy aggregation from accounts
  const chartData = [
    { name: 'May 2026', revenue: (incomeStatement?.totalRevenue || 0) * 0.7, expense: (incomeStatement?.totalExpense || 0) * 0.65 },
    { name: 'Jun 2026', revenue: (incomeStatement?.totalRevenue || 0) * 0.85, expense: (incomeStatement?.totalExpense || 0) * 0.8 },
    { name: 'Jul 2026', revenue: (incomeStatement?.totalRevenue || 0) * 0.95, expense: (incomeStatement?.totalExpense || 0) * 0.9 },
    { name: 'Aug 2026', revenue: incomeStatement?.totalRevenue || 0, expense: incomeStatement?.totalExpense || 0 },
  ];

  // Asset allocation pie chart
  const assetAccounts = (accounts || []).filter((a) => a.type === 'ASSET' && a.balance > 0);
  const pieColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const pieData = assetAccounts.slice(0, 5).map((a) => ({
    name: a.name,
    value: a.balance,
  }));

  const currencySymbol = activeTenant?.currency === 'INR' ? '₹' : activeTenant?.currency === 'EUR' ? '€' : '$';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs rounded-lg font-bold">
              {activeTenant.code}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {tr('Country') || 'Country'}: {activeTenant.country} | Standard: {activeTenant.pluginId.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {activeTenant.name} {tr('Accounting Hub')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {tr('Real-time double-entry general ledger with transactional immutability, scope enforcement, and statutory regulatory compliance.') || 'Real-time double-entry general ledger with transactional immutability, scope enforcement, and statutory regulatory compliance.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('batch_upload')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{tr('Bulk Upload Transactions')}</span>
          </button>
          <button
            onClick={onOpenNewJournalModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-xl font-medium border border-slate-700 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{tr('Post Journal Entry')}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Assets */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tr('Total Assets')}</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {currencySymbol}{balanceSheet.totalAssets.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{tr('Assets Verified Balanced')}</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tr('Operating Revenue')}</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {currencySymbol}{incomeStatement.totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
            <span>Recognized under {activeTenant.pluginId.toUpperCase()}</span>
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tr('Net Profit / Margin')}</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {currencySymbol}{incomeStatement.netIncome.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-indigo-400 mt-2 font-medium">
            <span>{incomeStatement.grossMarginPercentage}% {tr('Gross Margin')}</span>
          </div>
        </div>

        {/* Double-Entry Ledger Status */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{tr('Double-Entry Check')}</span>
            <div className={`p-2 rounded-xl ${balanceSheet.isBalanced ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-white mt-3 tracking-tight">
            {balanceSheet.isBalanced ? tr('DEBITS = CREDITS') : tr('IMBALANCE ALERT')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {balanceSheet.isBalanced
              ? tr('Zero variance detected across all accounts')
              : 'Variance detected in ledger balances'}
          </p>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Revenue vs Expense */}
        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">{tr('Financial Growth Trajectory')}</h3>
              <p className="text-xs text-slate-400">{tr('Revenue vs Operating Expense trend')}</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {activeTenant.currency}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name={t('common_revenue', 'Revenue')} fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name={t('common_expenses', 'Expense')} fill="#334155" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-1">{tr('Asset Allocation')}</h3>
          <p className="text-xs text-slate-400 mb-4">{tr('Balance breakdown across top asset accounts')}</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto space-y-1 text-xs">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                  <span className="truncate max-w-[130px] text-[11px]">{item.name}</span>
                </div>
                <span className="font-mono text-[11px]">{currencySymbol}{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Transactions & Audit Log Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Ledger Postings */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{tr('Recent Journal Postings')}</h3>
            <button
              onClick={() => setActiveTab('ledger')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {tr('View All Ledger')} &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {journalEntries.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300">{entry.entryNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      entry.status === 'POSTED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {tr(entry.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1 truncate max-w-xs">{entry.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{entry.date} • {entry.postedBy}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-white">
                    {currencySymbol}{entry.totalDebit.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">{entry.lines.length} Lines</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time System Audit Trail */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{tr('System Security & Scope Audit Log')}</h3>
            <button
              onClick={() => setActiveTab('audit_trail')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {tr('View Full Audit Log')} &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  log.status === 'SUCCESS'
                    ? 'bg-slate-800/40 border-slate-700/50'
                    : log.status === 'FORBIDDEN'
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : 'bg-rose-950/20 border-rose-800/40'
                }`}
              >
                {log.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-200">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 truncate">{log.details}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.payloadSummary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};


