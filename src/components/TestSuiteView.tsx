import { useLanguage, tr, t } from '../context/LanguageContext';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Terminal,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  FileCheck2,
  Clock,
  ChevronDown,
  ChevronRight,
  BookOpenCheck,
  Receipt,
  CreditCard,
  Building2,
  Globe2,
  Landmark,
  Globe,
  UploadCloud,
  ShieldAlert,
  Banknote,
  HardDriveDownload,
  Copy,
  Check,
  Bug,
  Sparkles,
} from 'lucide-react';
import {
  ALL_TEST_CASES,
  TestCase,
  TestResult,
  TestSuiteSummary,
  TestCategory,
  TestSeverity,
  TEST_CATEGORY_METADATA,
  runTestCases,
} from '../utils/testEngine';
import { useAccounting } from '../context/AccountingContext';

export const TestSuiteView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { activeTenant, activeRole } = useAccounting();
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunningIndex, setCurrentRunningIndex] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'PENDING'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | TestSeverity>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Mutation simulation test state
  const [isSimulatingMutation, setIsSimulatingMutation] = useState(false);

  // Filtered test cases
  const filteredTests = useMemo(() => {
    return ALL_TEST_CASES.filter((test) => {
      // Category filter
      if (selectedCategory !== 'ALL' && test.category !== selectedCategory) {
        return false;
      }
      // Severity filter
      if (severityFilter !== 'ALL' && test.severity !== severityFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL') {
        const res = testResults[test.id];
        if (statusFilter === 'PENDING' && res) return false;
        if (statusFilter === 'PASSED' && res?.status !== 'PASSED') return false;
        if (statusFilter === 'FAILED' && res?.status !== 'FAILED') return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = test.name.toLowerCase().includes(q);
        const matchesCode = test.code.toLowerCase().includes(q);
        const matchesDesc = test.description.toLowerCase().includes(q);
        const matchesTag = test.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesDesc && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, severityFilter, statusFilter, searchQuery, testResults]);

  // Execute all or filtered test suite
  const handleRunAllTests = async (testsToRun: TestCase[] = ALL_TEST_CASES) => {
    setIsRunning(true);
    setCurrentRunningIndex(0);
    const newResults: Record<string, TestResult> = { ...testResults };

    try {
      const { results, summary: execSummary } = await runTestCases(testsToRun, (res, idx, total) => {
        newResults[res.testId] = res;
        setTestResults({ ...newResults });
        setCurrentRunningIndex(idx);
      });

      setSummary(execSummary);
    } catch (err) {
      console.error('Error running test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Run a single test case
  const handleRunSingleTest = async (test: TestCase) => {
    setIsRunning(true);
    try {
      const { results } = await runTestCases([test]);
      if (results.length > 0) {
        const res = results[0];
        setTestResults((prev) => ({ ...prev, [res.testId]: res }));
        if (res.status === 'FAILED') {
          setExpandedTestId(res.testId);
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Export Test Certification Report (JSON)
  const handleExportJson = () => {
    const report = {
      title: 'Enterprise Accounting Audit Studio - Test Execution Certificate',
      timestamp: new Date().toISOString(),
      activeTenant: {
        id: activeTenant.id,
        name: activeTenant.name,
        code: activeTenant.code,
        standard: activeTenant.pluginId,
      },
      auditorRole: activeRole,
      summary: summary || {
        total: ALL_TEST_CASES.length,
        executed: Object.keys(testResults).length,
      },
      results: Object.values(testResults),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit-Test-Report-${activeTenant.code}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy test logs to clipboard
  const handleCopyLogs = (testId: string, logs: string[]) => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedLogId(testId);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  // Get icon for category
  const getCategoryIcon = (category: TestCategory) => {
    switch (category) {
      case 'GENERAL_LEDGER':
        return <BookOpenCheck className="w-4 h-4 text-emerald-400" />;
      case 'ACCOUNTS_RECEIVABLE':
        return <Receipt className="w-4 h-4 text-indigo-400" />;
      case 'ACCOUNTS_PAYABLE':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'RBAC_SOX_SECURITY':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'MULTI_TENANT_ISOLATION':
        return <Globe2 className="w-4 h-4 text-cyan-400" />;
      case 'HOUSING_SOCIETY':
        return <Building2 className="w-4 h-4 text-teal-400" />;
      case 'SCHOOL_ACADEMY':
        return <Landmark className="w-4 h-4 text-blue-400" />;
      case 'PARTNER_PORTAL':
        return <Building2 className="w-4 h-4 text-violet-400" />;
      case 'BANK_RECONCILIATION':
        return <Landmark className="w-4 h-4 text-green-400" />;
      case 'FIXED_ASSETS_FX':
        return <Layers className="w-4 h-4 text-rose-400" />;
      case 'TAX_COMPLIANCE':
        return <Globe className="w-4 h-4 text-orange-400" />;
      case 'BATCH_IMPORTER':
        return <UploadCloud className="w-4 h-4 text-fuchsia-400" />;
      case 'AUDIT_IMMUTABILITY':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'PAYROLL_FPA_TREASURY':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'INTEGRATIONS_BACKUP':
        return <HardDriveDownload className="w-4 h-4 text-sky-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const executedCount = Object.keys(testResults).length;
  const passedCount = Object.values(testResults).filter((r: TestResult) => r.status === 'PASSED').length;
  const failedCount = Object.values(testResults).filter((r: TestResult) => r.status === 'FAILED').length;
  const passRate = executedCount > 0 ? ((passedCount / executedCount) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Execution Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />{tr('Automated Verification & QA Test Harness')}</span>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-semibold">
                65+ Assertions
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">{tr('System Test Suite & Regression Verification')}</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Execute comprehensive automated tests verifying double-entry arithmetic, SOX 404 RBAC controls,
              multi-tenant boundaries, Housing Society maintenance, School tuition, and Partner Financial Portals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => handleRunAllTests(ALL_TEST_CASES)}
              disabled={isRunning}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing ({currentRunningIndex}/{ALL_TEST_CASES.length})...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{tr('Run Complete Regression Suite')}</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportJson}
              disabled={executedCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>{tr('Export Audit Certificate')}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar when running */}
        {isRunning && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-mono">
                Running Test {currentRunningIndex} of {ALL_TEST_CASES.length}...
              </span>
              <span className="font-bold text-indigo-400 font-mono">
                {Math.round((currentRunningIndex / ALL_TEST_CASES.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${(currentRunningIndex / ALL_TEST_CASES.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{tr('Total Test Scenarios')}</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">{ALL_TEST_CASES.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{tr('Across 15 functional domains')}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{tr('Passed Tests')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {passedCount} <span className="text-xs text-slate-500 font-normal">/ {executedCount || ALL_TEST_CASES.length}</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5 font-mono">{passRate}% Pass Rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{tr('Failed / Regressions')}</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{failedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {failedCount === 0 ? 'Zero regressions detected' : 'Requires developer remediation'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{tr('Execution Benchmark')}</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {summary?.durationMs ? `${summary.durationMs} ms` : '< 50 ms'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{tr('Fast sub-millisecond execution')}</div>
        </div>
      </div>

      {/* Categories Horizontal Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Module Categories ({Object.keys(TEST_CATEGORY_METADATA).length})
          </h2>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Show All ({ALL_TEST_CASES.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {(Object.keys(TEST_CATEGORY_METADATA) as TestCategory[]).map((cat) => {
            const meta = TEST_CATEGORY_METADATA[cat];
            const isSelected = selectedCategory === cat;
            const categoryTests = ALL_TEST_CASES.filter((t) => t.category === cat);
            const categoryPassed = categoryTests.filter((t) => testResults[t.id]?.status === 'PASSED').length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-col items-start p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(cat)}
                    <span className="text-[11px] font-bold text-slate-200 truncate">{meta.label.split('&')[0]}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {categoryPassed}/{categoryTests.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={tr('Search test name, code (e.g. GL-001, RBAC), or tag...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {(['ALL', 'PASSED', 'FAILED', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev as any)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  severityFilter === sev
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {filteredTests.length > 0 && (
            <button
              onClick={() => handleRunAllTests(filteredTests)}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Filtered ({filteredTests.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filteredTests.length} Test Scenarios</span>
          <span>{tr('Click on any test to inspect assertions and execution logs')}</span>
        </div>

        {filteredTests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Filter className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-medium">{tr('No test cases match the current filter criteria.')}</p>
            <p className="text-xs text-slate-500 mt-1">{tr('Try resetting the search query or category filters.')}</p>
          </div>
        ) : (
          filteredTests.map((test) => {
            const result = testResults[test.id];
            const isExpanded = expandedTestId === test.id;
            const isPassed = result?.status === 'PASSED';
            const isFailed = result?.status === 'FAILED';
            const isTestRunning = isRunning && currentRunningIndex === ALL_TEST_CASES.indexOf(test) + 1;

            return (
              <div
                key={test.id}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                  isFailed
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : isPassed
                    ? 'border-emerald-500/30 bg-slate-900/80'
                    : 'border-slate-800'
                }`}
              >
                {/* Main Card Header */}
                <div
                  onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="mt-0.5 shrink-0">
                      {isTestRunning ? (
                        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                      ) : isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isFailed ? (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {test.code}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            test.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : test.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {test.severity}
                        </span>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          {getCategoryIcon(test.category)}
                          <span>{TEST_CATEGORY_METADATA[test.category]?.label}</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-100">{test.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{test.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {test.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Result Indicators */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {result && (
                      <div className="text-right">
                        <div
                          className={`text-xs font-mono font-bold ${
                            isPassed ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPassed ? 'PASSED' : 'FAILED'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {result.durationMs}ms | {result.passedAssertions}/{result.assertionsCount} asserts
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunSingleTest(test);
                      }}
                      disabled={isRunning}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-slate-300" />
                      <span>{tr("Run")}</span>
                    </button>

                    <div className="text-slate-500">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expandable Debug Console & Logs */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/80 p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-slate-200">{tr('Execution Output & Assertion Logs')}</span>
                      </div>
                      {result?.logs && result.logs.length > 0 && (
                        <button
                          onClick={() => handleCopyLogs(test.id, result.logs)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {copiedLogId === test.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">{tr('Copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{tr('Copy Logs')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {result ? (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
                        {result.logs.map((log, i) => (
                          <div
                            key={i}
                            className={`p-1.5 rounded text-[11px] ${
                              log.startsWith('❌') || log.startsWith('💥')
                                ? 'bg-rose-950/30 text-rose-300 border border-rose-500/20'
                                : log.startsWith('✅')
                                ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/20'
                                : 'text-slate-300'
                            }`}
                          >
                            {log}
                          </div>
                        ))}

                        {result.errorMessage && (
                          <div className="mt-2 p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-200 text-xs">
                            <div className="font-bold flex items-center gap-1.5 text-rose-300 mb-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{tr("Error Diagnostic:")}</span>
                            </div>
                            <p>{result.errorMessage}</p>
                            {result.errorStack && (
                              <pre className="mt-2 text-[10px] text-rose-300/70 overflow-x-auto">
                                {result.errorStack}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic py-2">
                        Test has not been executed in this session. Click &quot;Run&quot; above to execute.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom SOX 404 Audit & Compliance Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            Automated Audit Certification: Tests are executable in CI/CD via{' '}
            <code className="text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded font-mono">{tr('npm test')}</code>.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-500">Session ID: {activeTenant.id}</span>
          <button
            onClick={() => handleRunAllTests(ALL_TEST_CASES)}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >{tr('Re-run All Tests')}</button>
        </div>
      </div>
    </div>
  );
};
