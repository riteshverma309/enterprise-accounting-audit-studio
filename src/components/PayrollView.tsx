import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { PayrollEmployee, PayrollRun, PayrollRunEmployeeLine } from '../types';
import {
  Users,
  Plus,
  Play,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  DollarSign,
  Building,
  Calendar,
  Percent,
  Download,
  Eye,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  CreditCard,
  Briefcase,
  Layers,
} from 'lucide-react';

interface PayrollViewProps {
  onNavigateToEmployees?: () => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ onNavigateToEmployees }) => {
  const {
    activeTenant,
    payrollEmployees,
    payrollRuns,
    createPayrollEmployee,
    updatePayrollEmployee,
    deletePayrollEmployee,
    calculatePayRunPreview,
    executePayRun,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'employees' | 'payruns' | 'wizard'>('employees');

  // Employee Modal
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [employmentType, setEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR'>('FULL_TIME');
  const [baseSalaryAnnual, setBaseSalaryAnnual] = useState<number>(120000);
  const [taxFilingStatus, setTaxFilingStatus] = useState<'SINGLE' | 'MARRIED_JOINT' | 'HEAD_OF_HOUSEHOLD'>('SINGLE');
  const [withholdingAllowances, setWithholdingAllowances] = useState<number>(1);
  const [bankAccountMasked, setBankAccountMasked] = useState('Chase Direct Deposit (•••• 4920)');

  // Pay Run Wizard State
  const [payPeriodStart, setPayPeriodStart] = useState('2026-08-01');
  const [payPeriodEnd, setPayPeriodEnd] = useState('2026-08-15');
  const [payDate, setPayDate] = useState('2026-08-15');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isPayRunExecuting, setIsPayRunExecuting] = useState(false);
  const [notification, setNotification] = useState('');

  // Selected Paystub for view modal
  const [selectedPaystub, setSelectedPaystub] = useState<PayrollRunEmployeeLine | null>(null);

  // Departments
  const departments = ['Engineering', 'Product & Design', 'Sales & Accounts', 'Marketing', 'Finance & Ops'];

  // Active Tenant Employees
  const activeEmployees = useMemo(() => {
    return payrollEmployees.filter((e) => e.tenantId === activeTenant.id);
  }, [payrollEmployees, activeTenant.id]);

  // Active Tenant Pay Runs
  const activePayRuns = useMemo(() => {
    return payrollRuns.filter((r) => r.tenantId === activeTenant.id);
  }, [payrollRuns, activeTenant.id]);

  // Live calculation for Pay Run Wizard Preview
  const livePreview = useMemo(() => {
    return calculatePayRunPreview(
      payPeriodStart,
      payPeriodEnd,
      payDate,
      selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined
    );
  }, [calculatePayRunPreview, payPeriodStart, payPeriodEnd, payDate, selectedEmployeeIds]);

  // Metrics
  const totalAnnualPayroll = useMemo(() => {
    return activeEmployees
      .filter((e) => e.status === 'ACTIVE')
      .reduce((sum, e) => sum + (e.baseSalaryAnnual || 0), 0);
  }, [activeEmployees]);

  const totalDisbursedYtd = useMemo(() => {
    return activePayRuns.reduce((sum, r) => sum + r.totalNetPay, 0);
  }, [activePayRuns]);

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) return;

    createPayrollEmployee({
      tenantId: activeTenant.id,
      name,
      email,
      role,
      department,
      employmentType,
      baseSalaryAnnual: Number(baseSalaryAnnual),
      payFrequency: 'SEMI_MONTHLY',
      taxFilingStatus,
      withholdingAllowances: Number(withholdingAllowances),
      directDepositInfo: {
        bankName: 'Chase Bank NA',
        accountNumberMasked: bankAccountMasked,
        routingNumberMasked: '•••• 0210',
      },
      status: 'ACTIVE',
      hireDate: new Date().toISOString().split('T')[0],
    });

    setIsEmployeeModalOpen(false);
    resetEmployeeForm();
    setNotification(`Employee record for ${name} created successfully.`);
    setTimeout(() => setNotification(''), 4000);
  };

  const resetEmployeeForm = () => {
    setName('');
    setEmail('');
    setRole('');
    setDepartment('Engineering');
    setEmploymentType('FULL_TIME');
    setBaseSalaryAnnual(120000);
    setTaxFilingStatus('SINGLE');
    setWithholdingAllowances(1);
    setBankAccountMasked('Chase Direct Deposit (•••• 4920)');
  };

  const handleExecutePayRun = () => {
    setIsPayRunExecuting(true);
    setTimeout(() => {
      const res = executePayRun({
        payPeriodStart,
        payPeriodEnd,
        payDate,
        employeeIds: selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
        postToGl: true,
      });
      setIsPayRunExecuting(false);
      if (res.success) {
        setNotification(`Pay Run ${res.run?.runNumber} successfully processed & balanced in General Ledger!`);
        setActiveTab('payruns');
        setTimeout(() => setNotification(''), 4000);
      }
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Human Capital & Payroll Engine
            </span>
            <span className="text-xs text-slate-400">IRS Form 941 & Automated Double-Entry GL</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-400" />
            Payroll Management & Tax Withholdings
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Process compensation runs, compute Federal/State FICA withholdings, and automate balanced General Ledger disbursements with zero manual reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToEmployees && (
            <button
              onClick={onNavigateToEmployees}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Employee Directory (Staff 360°)
            </button>
          )}
          <button
            onClick={() => setActiveTab('wizard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4" />
            Run Payroll Wizard
          </button>
          <button
            onClick={() => {
              if (onNavigateToEmployees) {
                onNavigateToEmployees();
              } else {
                resetEmployeeForm();
                setIsEmployeeModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          {notification}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Staff Headcount</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {activeEmployees.filter((e) => e.status === 'ACTIVE').length} <span className="text-xs text-slate-400 font-normal">employees</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {departments.length} corporate cost centers
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Annualized Payroll Base</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">
            ${totalAnnualPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total active annual salary commitments
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Direct Deposit YTD</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            ${totalDisbursedYtd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Net disbursed across {activePayRuns.length} completed cycles
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tax Compliance Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400">100% Balanced GL</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Acc 5020 Salaries Dr = Acc 2200 Taxes + Acc 1010 Cash Cr
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'employees'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory ({activeEmployees.length})
        </button>
        <button
          onClick={() => setActiveTab('wizard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'wizard'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Play className="w-4 h-4" />
          Live Pay Run Wizard & Calculations
        </button>
        <button
          onClick={() => setActiveTab('payruns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'payruns'
              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Historical Pay Runs ({activePayRuns.length})
        </button>
      </div>

      {/* Tab Content 1: Employee Directory */}
      {activeTab === 'employees' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee Name</th>
                  <th className="px-4 py-3 font-semibold">Job Title & Role</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold text-right">Annual Salary</th>
                  <th className="px-4 py-3 font-semibold">Filing Status</th>
                  <th className="px-4 py-3 font-semibold">Direct Deposit Account</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {activeEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No employees registered. Click &quot;Add Employee&quot; to set up staff payroll profiles.
                    </td>
                  </tr>
                ) : (
                  activeEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-sans font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                            {emp.name.charAt(0)}
                          </span>
                          <div>
                            <div>{emp.name}</div>
                            <div className="text-[10px] text-slate-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-300">{emp.role}</td>
                      <td className="px-4 py-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-100">
                        ${(emp.baseSalaryAnnual || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-400 text-[11px]">
                        {emp.taxFilingStatus.replace('_', ' ')} (Allowances: {emp.withholdingAllowances})
                      </td>
                      <td className="px-4 py-3 font-sans text-[11px] text-slate-300">
                        {emp.directDepositInfo.accountNumberMasked}
                      </td>
                      <td className="px-4 py-3 text-center font-sans">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          {onNavigateToEmployees && (
                            <button
                              onClick={onNavigateToEmployees}
                              className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded text-[11px] font-semibold transition"
                              title="Open Employee 360° Profile & Linked Records"
                            >
                              360° Profile
                            </button>
                          )}
                          <button
                            onClick={() => deletePayrollEmployee(emp.id)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                            title="Remove Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Live Pay Run Wizard */}
      {activeTab === 'wizard' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  Live Pay Run Calculation & Double-Entry Preview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select pay period dates to calculate real-time Gross Wages, Federal/State Taxes, FICA matching, and Net Direct Deposits.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Period Start</label>
                  <input
                    type="date"
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Period End</label>
                  <input
                    type="date"
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pay Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Breakdown Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Staff Name</th>
                    <th className="px-3 py-2.5">Cost Center</th>
                    <th className="px-3 py-2.5 text-right">Gross Pay</th>
                    <th className="px-3 py-2.5 text-right">Federal Tax</th>
                    <th className="px-3 py-2.5 text-right">State Tax</th>
                    <th className="px-3 py-2.5 text-right">Social Security</th>
                    <th className="px-3 py-2.5 text-right">Medicare</th>
                    <th className="px-3 py-2.5 text-right">Benefits (401k)</th>
                    <th className="px-3 py-2.5 text-right font-bold text-emerald-400">Net Pay</th>
                    <th className="px-3 py-2.5 text-right text-indigo-400">Employer Cost</th>
                    <th className="px-3 py-2.5 text-center">Paystub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {livePreview.lines.map((line) => (
                    <tr key={line.employeeId} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-sans font-medium text-slate-100">{line.employeeName}</td>
                      <td className="px-3 py-2.5 font-sans text-slate-400 text-[11px]">{line.department}</td>
                      <td className="px-3 py-2.5 text-right text-slate-200">${line.grossPay.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">-${line.federalTax.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">-${line.stateTax.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">-${line.socialSecurityTax.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">-${line.medicareTax.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">-${line.benefitsDeduction.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-400">${line.netPay.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-indigo-400">${line.totalEmployerCost.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <button
                          onClick={() => setSelectedPaystub(line)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                          title="View Digital Paystub"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950 font-bold border-t border-slate-800 text-xs">
                  <tr>
                    <td colSpan={2} className="px-3 py-3 font-sans text-slate-100">
                      Total Cycle Disbursements ({livePreview.lines.length} staff):
                    </td>
                    <td className="px-3 py-3 text-right text-slate-100">${livePreview.totalGrossPay.toFixed(2)}</td>
                    <td colSpan={5} className="px-3 py-3 text-right text-amber-400">
                      Withholdings: -${livePreview.totalEmployeeTaxWithholdings.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 text-sm font-extrabold">
                      ${livePreview.totalNetPay.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right text-indigo-400 font-bold">
                      ${(livePreview.totalGrossPay + livePreview.totalEmployerTaxes).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* General Ledger Auto-Posting Schema Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Automated Double-Entry General Ledger Post Preview
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-semibold mb-1">DEBIT (Expenses Incurred)</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Acc 5020 Staff Gross Wages Expense</span>
                    <span className="font-bold">${livePreview.totalGrossPay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Acc 5020 Employer FICA & FUTA Tax Expense</span>
                    <span className="font-bold">${livePreview.totalEmployerTaxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span>Total Debits</span>
                    <span>${(livePreview.totalGrossPay + livePreview.totalEmployerTaxes).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-indigo-400 font-semibold mb-1">CREDIT (Liabilities & Disbursements)</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Acc 2200 Payroll Tax & Withholdings Payable</span>
                    <span className="font-bold">
                      ${(livePreview.totalEmployeeTaxWithholdings + livePreview.totalEmployerTaxes).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Acc 1010 Operating Cash (Direct Deposit)</span>
                    <span className="font-bold">${livePreview.totalNetPay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-400 font-bold pt-1 border-t border-slate-800">
                    <span>Total Credits</span>
                    <span>${(livePreview.totalGrossPay + livePreview.totalEmployerTaxes).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleExecutePayRun}
                disabled={isPayRunExecuting || livePreview.lines.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPayRunExecuting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Executing GL Posting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Post Pay Run to General Ledger
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Historical Pay Runs */}
      {activeTab === 'payruns' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Run ID</th>
                  <th className="px-4 py-3 font-semibold">Pay Period</th>
                  <th className="px-4 py-3 font-semibold">Disbursement Date</th>
                  <th className="px-4 py-3 font-semibold text-center">Headcount</th>
                  <th className="px-4 py-3 font-semibold text-right">Gross Wages</th>
                  <th className="px-4 py-3 font-semibold text-right">Tax Withholdings</th>
                  <th className="px-4 py-3 font-semibold text-right">Employer Taxes</th>
                  <th className="px-4 py-3 font-semibold text-right">Net Cash Disbursed</th>
                  <th className="px-4 py-3 font-semibold">GL Voucher</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {activePayRuns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No completed pay runs yet. Use the Live Pay Run Wizard to execute a cycle.
                    </td>
                  </tr>
                ) : (
                  activePayRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-100">{run.runNumber}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {run.payPeriodStart} → {run.payPeriodEnd}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{run.payDate}</td>
                      <td className="px-4 py-3 text-center">{run.employeeCount}</td>
                      <td className="px-4 py-3 text-right text-slate-200">${run.totalGrossPay.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-amber-400">-${run.totalEmployeeTaxWithholdings.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-indigo-400">${run.totalEmployerTaxes.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">${run.totalNetPay.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 text-[11px]">{run.journalEntryId || 'N/A'}</td>
                      <td className="px-4 py-3 text-center font-sans">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Balanced GL
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Add Staff Employee Profile
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure compensation, IRS tax filing status, and direct deposit details.
                </p>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. david.vance@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Position / Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Security Architect"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department / Cost Center *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Annual Base Salary ($) *</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={baseSalaryAnnual}
                    onChange={(e) => setBaseSalaryAnnual(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">IRS W-4 Filing Status</label>
                  <select
                    value={taxFilingStatus}
                    onChange={(e) => setTaxFilingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED_JOINT">Married Filing Jointly</option>
                    <option value="HEAD_OF_HOUSEHOLD">Head of Household</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Direct Deposit Account</label>
                <input
                  type="text"
                  value={bankAccountMasked}
                  onChange={(e) => setBankAccountMasked(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL PAYSTUB MODAL */}
      {selectedPaystub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Official Earnings Statement / Paystub
                </h3>
                <div className="text-xs text-slate-400">{activeTenant.name} • Period: {payPeriodStart} to {payPeriodEnd}</div>
              </div>
              <button
                onClick={() => setSelectedPaystub(null)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-slate-400 text-[11px]">Employee Name:</div>
                  <div className="text-sm font-bold text-slate-100">{selectedPaystub.employeeName}</div>
                  <div className="text-[11px] text-slate-400">Department: {selectedPaystub.department}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[11px]">Net Direct Deposit:</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">${selectedPaystub.netPay.toFixed(2)}</div>
                </div>
              </div>

              {/* Earnings breakdown */}
              <div className="space-y-1 font-mono">
                <div className="flex justify-between text-slate-300 font-sans font-semibold border-b border-slate-800 pb-1">
                  <span>Gross Earnings:</span>
                  <span className="font-mono text-slate-100 font-bold">${selectedPaystub.grossPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Federal Income Tax Withholding (15%):</span>
                  <span>-${selectedPaystub.federalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>State Income Tax Withholding (5%):</span>
                  <span>-${selectedPaystub.stateTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Social Security (OASDI 6.2%):</span>
                  <span>-${selectedPaystub.socialSecurityTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Medicare Withholding (1.45%):</span>
                  <span>-${selectedPaystub.medicareTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pre-Tax Health & 401(k) Benefits:</span>
                  <span>-${selectedPaystub.benefitsDeduction.toFixed(2)}</span>
                </div>
              </div>

              {/* Employer Contributions */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono">
                <div className="text-indigo-400 font-sans font-semibold mb-1">Employer Paid Contributions & Taxes</div>
                <div className="flex justify-between text-slate-400">
                  <span>Employer FICA Match (7.65%):</span>
                  <span>+${selectedPaystub.employerFicaMatch.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Employer FUTA Federal Unemployment (0.6%):</span>
                  <span>+${selectedPaystub.employerFuta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800">
                  <span>Total Employer Cost:</span>
                  <span>${selectedPaystub.totalEmployerCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedPaystub(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
