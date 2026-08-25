import React, { useState, useMemo } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import {
  PayrollEmployee,
  EmployeeStatus,
  EmployeeEmploymentType,
  EmployeePayType,
  EmployeePayFrequency,
  EmployeeFilingStatus,
  EmployeePaymentMethod,
  PayrollRunEmployeeLine,
  ExpenseReceipt,
  MileageLogEntry,
} from '../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Building,
  Briefcase,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  Receipt,
  Car,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Landmark,
  X,
  Check,
  FileText,
  BadgeDollarSign,
  HeartPulse,
  PiggyBank,
} from 'lucide-react';

interface EmployeeDirectoryViewProps {
  onNavigateToPayroll?: () => void;
  onNavigateToExpenses?: () => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({ onNavigateToPayroll,
  onNavigateToExpenses,
}) => {
  const { tr, t } = useLanguage();
  const {
    activeTenant,
    payrollEmployees,
    payrollRuns,
    expenseReceipts,
    mileageLogs,
    createPayrollEmployee,
    updatePayrollEmployee,
    deletePayrollEmployee,
    createExpenseReceipt,
  } = useAccounting();

  // View Layout state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPayType, setSelectedPayType] = useState<string>('ALL');

  // Selected Employee for 360° Profile Drawer / Modal
  const [activeProfileEmployee, setActiveProfileEmployee] = useState<PayrollEmployee | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'payruns' | 'expenses'>('overview');
  const [showSensitiveData, setShowSensitiveData] = useState<boolean>(false);

  // Selected Paystub for View / Print Modal
  const [selectedPaystubLine, setSelectedPaystubLine] = useState<{
    line: PayrollRunEmployeeLine;
    runNumber: string;
    payDate: string;
    payPeriodStart: string;
    payPeriodEnd: string;
  } | null>(null);

  // Add / Edit Employee Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'personal' | 'compensation' | 'taxes' | 'banking'>('personal');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmployeeNumber, setFormEmployeeNumber] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDepartment, setFormDepartment] = useState('Engineering & R&D');
  const [formEmploymentType, setFormEmploymentType] = useState<EmployeeEmploymentType>('FULL_TIME');
  const [formStatus, setFormStatus] = useState<EmployeeStatus>('ACTIVE');
  const [formHireDate, setFormHireDate] = useState('2024-01-15');
  const [formTerminationDate, setFormTerminationDate] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxId, setFormTaxId] = useState('•••-••-1234');

  // Compensation Fields
  const [formPayType, setFormPayType] = useState<EmployeePayType>('SALARY');
  const [formBaseSalaryAnnual, setFormBaseSalaryAnnual] = useState<number>(125000);
  const [formHourlyRate, setFormHourlyRate] = useState<number>(65);
  const [formStandardHoursPerWeek, setFormStandardHoursPerWeek] = useState<number>(40);
  const [formPayFrequency, setFormPayFrequency] = useState<EmployeePayFrequency>('SEMI_MONTHLY');

  // Tax & Benefits Fields
  const [formFilingStatus, setFormFilingStatus] = useState<EmployeeFilingStatus>('SINGLE');
  const [formStateFilingStatus, setFormStateFilingStatus] = useState('NY (Single / 1 Allowance)');
  const [formAllowances, setFormAllowances] = useState<number>(1);
  const [formAdditionalWithholding, setFormAdditionalWithholding] = useState<number>(0);
  const [form401kContributionRate, setForm401kContributionRate] = useState<number>(6);
  const [form401kEmployerMatchRate, setForm401kEmployerMatchRate] = useState<number>(4);
  const [formHealthBenefitDeduction, setFormHealthBenefitDeduction] = useState<number>(125);
  const [formDentalVisionDeduction, setFormDentalVisionDeduction] = useState<number>(25);

  // Direct Deposit & Banking Fields
  const [formPaymentMethod, setFormPaymentMethod] = useState<EmployeePaymentMethod>('DIRECT_DEPOSIT');
  const [formBankName, setFormBankName] = useState('JPMorgan Chase Bank, N.A.');
  const [formBankAccountNumber, setFormBankAccountNumber] = useState('••••4829');
  const [formBankRoutingNumber, setFormBankRoutingNumber] = useState('021000021');
  const [formAccountType, setFormAccountType] = useState<'CHECKING' | 'SAVINGS'>('CHECKING');
  const [formEmergencyContactName, setFormEmergencyContactName] = useState('');
  const [formEmergencyContactPhone, setFormEmergencyContactPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Quick Expense Claim Modal for linked employee
  const [isExpenseClaimModalOpen, setIsExpenseClaimModalOpen] = useState(false);
  const [claimVendor, setClaimVendor] = useState('');
  const [claimCategory, setClaimCategory] = useState('Travel & Client Meetings');
  const [claimAmount, setClaimAmount] = useState<number>(150);
  const [claimNotes, setClaimNotes] = useState('');

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Departments List
  const departments = useMemo(() => {
    const set = new Set<string>();
    payrollEmployees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [payrollEmployees]);

  // Tenant filtered employees
  const tenantEmployees = useMemo(() => {
    return payrollEmployees.filter((e) => e.tenantId === activeTenant.id);
  }, [payrollEmployees, activeTenant.id]);

  // Filtered employees list based on search & filters
  const filteredEmployees = useMemo(() => {
    return tenantEmployees.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q));

      const matchesDept = selectedDept === 'ALL' || e.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus;
      const matchesType = selectedType === 'ALL' || e.employmentType === selectedType;
      const matchesPayType = selectedPayType === 'ALL' || e.payType === selectedPayType;

      return matchesSearch && matchesDept && matchesStatus && matchesType && matchesPayType;
    });
  }, [tenantEmployees, searchQuery, selectedDept, selectedStatus, selectedType, selectedPayType]);

  // Workforce Metrics
  const metrics = useMemo(() => {
    const total = tenantEmployees.length;
    const active = tenantEmployees.filter((e) => e.status === 'ACTIVE').length;
    const onLeave = tenantEmployees.filter((e) => e.status === 'ON_LEAVE').length;
    const terminated = tenantEmployees.filter((e) => e.status === 'TERMINATED').length;
    const contractors = tenantEmployees.filter((e) => e.employmentType === 'CONTRACTOR').length;

    const totalAnnualPayroll = tenantEmployees
      .filter((e) => e.status === 'ACTIVE')
      .reduce((sum, e) => {
        if (e.payType === 'HOURLY' && e.hourlyRate) {
          const annualHours = (e.standardHoursPerWeek || 40) * 52;
          return sum + e.hourlyRate * annualHours;
        }
        return sum + (e.baseSalaryAnnual || 0);
      }, 0);

    const avgSalary = active > 0 ? Math.round(totalAnnualPayroll / active) : 0;

    return { total, active, onLeave, terminated, contractors, totalAnnualPayroll, avgSalary };
  }, [tenantEmployees]);

  // Helper to open Add modal
  const handleOpenAddModal = () => {
    setEditingEmployeeId(null);
    const nextNum = `EMP-${String(tenantEmployees.length + 101).padStart(5, '0')}`;
    setFormEmployeeNumber(nextNum);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('');
    setFormDepartment('Engineering & R&D');
    setFormEmploymentType('FULL_TIME');
    setFormStatus('ACTIVE');
    setFormHireDate(new Date().toISOString().split('T')[0]);
    setFormTerminationDate('');
    setFormAddress('');
    setFormTaxId('•••-••-' + Math.floor(1000 + Math.random() * 9000));
    setFormPayType('SALARY');
    setFormBaseSalaryAnnual(130000);
    setFormHourlyRate(65);
    setFormStandardHoursPerWeek(40);
    setFormPayFrequency('SEMI_MONTHLY');
    setFormFilingStatus('SINGLE');
    setFormStateFilingStatus('NY (Single / 1 Allowance)');
    setFormAllowances(1);
    setFormAdditionalWithholding(0);
    setForm401kContributionRate(6);
    setForm401kEmployerMatchRate(4);
    setFormHealthBenefitDeduction(125);
    setFormDentalVisionDeduction(25);
    setFormPaymentMethod('DIRECT_DEPOSIT');
    setFormBankName('JPMorgan Chase Bank, N.A.');
    setFormBankAccountNumber('••••' + Math.floor(1000 + Math.random() * 9000));
    setFormBankRoutingNumber('021000021');
    setFormAccountType('CHECKING');
    setFormEmergencyContactName('');
    setFormEmergencyContactPhone('');
    setFormNotes('');
    setModalTab('personal');
    setIsFormModalOpen(true);
  };

  // Helper to open Edit modal
  const handleOpenEditModal = (emp: PayrollEmployee) => {
    setEditingEmployeeId(emp.id);
    setFormEmployeeNumber(emp.employeeNumber);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormRole(emp.role);
    setFormDepartment(emp.department);
    setFormEmploymentType(emp.employmentType);
    setFormStatus(emp.status);
    setFormHireDate(emp.hireDate);
    setFormTerminationDate(emp.terminationDate || '');
    setFormAddress(emp.address || '');
    setFormTaxId(emp.taxId || '•••-••-9999');
    setFormPayType(emp.payType || 'SALARY');
    setFormBaseSalaryAnnual(emp.baseSalaryAnnual || 120000);
    setFormHourlyRate(emp.hourlyRate || 65);
    setFormStandardHoursPerWeek(emp.standardHoursPerWeek || 40);
    setFormPayFrequency(emp.payFrequency || 'SEMI_MONTHLY');
    setFormFilingStatus(emp.filingStatus || 'SINGLE');
    setFormStateFilingStatus(emp.stateFilingStatus || 'NY (Single)');
    setFormAllowances(emp.allowances || 1);
    setFormAdditionalWithholding(emp.additionalWithholdingPerPeriod || 0);
    setForm401kContributionRate(emp.fourZeroOneKContributionRate ?? 6);
    setForm401kEmployerMatchRate(emp.fourZeroOneKEmployerMatchRate ?? 4);
    setFormHealthBenefitDeduction(emp.healthBenefitDeduction ?? 125);
    setFormDentalVisionDeduction(emp.dentalVisionDeduction ?? 25);
    setFormPaymentMethod(emp.paymentMethod || 'DIRECT_DEPOSIT');
    setFormBankName(emp.bankName || 'JPMorgan Chase Bank, N.A.');
    setFormBankAccountNumber(emp.bankAccountNumber || '••••4892');
    setFormBankRoutingNumber(emp.bankRoutingNumber || '021000021');
    setFormAccountType(emp.accountType || 'CHECKING');
    setFormEmergencyContactName(emp.emergencyContactName || '');
    setFormEmergencyContactPhone(emp.emergencyContactPhone || '');
    setFormNotes(emp.notes || '');
    setModalTab('personal');
    setIsFormModalOpen(true);
  };

  // Save Employee Form Handler
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formRole) {
      showToast('Please fill in required fields (Name, Email, Job Title).');
      return;
    }

    const payload: Omit<PayrollEmployee, 'id'> = {
      tenantId: activeTenant.id,
      employeeNumber: formEmployeeNumber || `EMP-${Date.now().toString().slice(-5)}`,
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim() || undefined,
      role: formRole.trim(),
      department: formDepartment,
      employmentType: formEmploymentType,
      status: formStatus,
      hireDate: formHireDate,
      terminationDate: formStatus === 'TERMINATED' ? formTerminationDate || new Date().toISOString().split('T')[0] : undefined,
      address: formAddress.trim() || undefined,
      taxId: formTaxId.trim() || undefined,
      payType: formPayType,
      baseSalaryAnnual: formPayType === 'SALARY' ? Number(formBaseSalaryAnnual) : undefined,
      hourlyRate: formPayType === 'HOURLY' ? Number(formHourlyRate) : undefined,
      standardHoursPerWeek: Number(formStandardHoursPerWeek) || 40,
      payFrequency: formPayFrequency,
      filingStatus: formFilingStatus,
      stateFilingStatus: formStateFilingStatus,
      allowances: Number(formAllowances) || 0,
      additionalWithholdingPerPeriod: Number(formAdditionalWithholding) || 0,
      fourZeroOneKContributionRate: Number(form401kContributionRate) || 0,
      fourZeroOneKEmployerMatchRate: Number(form401kEmployerMatchRate) || 0,
      healthBenefitDeduction: Number(formHealthBenefitDeduction) || 0,
      dentalVisionDeduction: Number(formDentalVisionDeduction) || 0,
      paymentMethod: formPaymentMethod,
      bankName: formBankName,
      bankAccountNumber: formBankAccountNumber,
      bankRoutingNumber: formBankRoutingNumber,
      accountType: formAccountType,
      emergencyContactName: formEmergencyContactName.trim() || undefined,
      emergencyContactPhone: formEmergencyContactPhone.trim() || undefined,
      notes: formNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (editingEmployeeId) {
      updatePayrollEmployee(editingEmployeeId, payload);
      showToast(`Updated employee record for ${formName}.`);
      if (activeProfileEmployee?.id === editingEmployeeId) {
        setActiveProfileEmployee({ ...payload, id: editingEmployeeId });
      }
    } else {
      const res = createPayrollEmployee(payload);
      if (res.success) {
        showToast(`Created new employee profile: ${formName} (${payload.employeeNumber}).`);
      }
    }

    setIsFormModalOpen(false);
  };

  // Delete Employee Handler
  const handleDeleteEmployee = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the employee directory?`)) {
      deletePayrollEmployee(id);
      showToast(`Employee ${name} removed.`);
      if (activeProfileEmployee?.id === id) {
        setActiveProfileEmployee(null);
      }
    }
  };

  // Helper for Exporting Employee Directory
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Job Title',
      'Department',
      'Employment Type',
      'Status',
      'Hire Date',
      'Pay Type',
      'Annual Salary',
      'Hourly Rate',
      'Pay Frequency',
      'Filing Status',
      'Payment Method',
      'Bank Name',
      'Bank Account Masked',
    ];

    const rows = filteredEmployees.map((e) => [
      `"${e.employeeNumber}"`,
      `"${e.name}"`,
      `"${e.email}"`,
      `"${e.role}"`,
      `"${e.department}"`,
      `"${e.employmentType}"`,
      `"${e.status}"`,
      `"${e.hireDate}"`,
      `"${e.payType}"`,
      e.baseSalaryAnnual || 0,
      e.hourlyRate || 0,
      `"${e.payFrequency}"`,
      `"${e.filingStatus}"`,
      `"${e.paymentMethod}"`,
      `"${e.bankName || ''}"`,
      `"${e.bankAccountNumber || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Employee_Directory_${activeTenant.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported employee directory to CSV.');
  };

  // Linked Records calculation for active profile
  const linkedPayRuns = useMemo(() => {
    if (!activeProfileEmployee) return [];
    const results: {
      run: (typeof payrollRuns)[0];
      line: PayrollRunEmployeeLine;
    }[] = [];

    payrollRuns.forEach((run) => {
      const line = run.lines?.find((l) => l.employeeId === activeProfileEmployee.id);
      if (line) {
        results.push({ run, line });
      }
    });

    return results;
  }, [activeProfileEmployee, payrollRuns]);

  const linkedExpenses = useMemo(() => {
    if (!activeProfileEmployee) return [];
    const empName = activeProfileEmployee.name.toLowerCase();
    const empEmail = activeProfileEmployee.email.toLowerCase();

    return expenseReceipts.filter(
      (r) =>
        r.tenantId === activeTenant.id &&
        (r.paidBy.toLowerCase().includes(empName) ||
          r.paidBy.toLowerCase().includes(empEmail) ||
          r.paidBy.toLowerCase().includes(activeProfileEmployee.name.split(' ')[0].toLowerCase()))
    );
  }, [activeProfileEmployee, expenseReceipts, activeTenant.id]);

  const linkedMileage = useMemo(() => {
    if (!activeProfileEmployee) return [];
    const empName = activeProfileEmployee.name.toLowerCase();
    return mileageLogs.filter(
      (m) =>
        m.tenantId === activeTenant.id &&
        (m.driverName.toLowerCase().includes(empName) || m.driverEmail?.toLowerCase() === activeProfileEmployee.email.toLowerCase())
    );
  }, [activeProfileEmployee, mileageLogs, activeTenant.id]);

  // Submit Quick Expense for Profile Employee
  const handleQuickExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileEmployee || !claimVendor || !claimAmount) return;

    createExpenseReceipt({
      tenantId: activeTenant.id,
      receiptNumber: `EXP-${Date.now().toString().slice(-6)}`,
      expenseDate: new Date().toISOString().split('T')[0],
      vendorName: claimVendor,
      category: claimCategory,
      expenseAccountCode: '5010',
      amount: Number(claimAmount),
      taxAmount: Math.round(Number(claimAmount) * 0.08 * 100) / 100,
      totalAmount: Math.round(Number(claimAmount) * 1.08 * 100) / 100,
      paymentMethod: 'PERSONAL_EXPENSE',
      paidBy: activeProfileEmployee.name,
      notes: claimNotes || `Expense reimbursement claim filed for ${activeProfileEmployee.name}`,
    });

    setIsExpenseClaimModalOpen(false);
    setClaimVendor('');
    setClaimAmount(150);
    setClaimNotes('');
    showToast(`Logged expense claim for ${activeProfileEmployee.name}.`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{tr('Employee Directory & Workforce Management')}</h1>
              <p className="text-sm text-slate-500">{tr('Manage employee master profiles, tax withholding elections, direct deposit accounts, and linked payroll/expense records.')}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToPayroll && (
            <button
              id="btn-nav-payroll"
              onClick={onNavigateToPayroll}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />{tr('Payroll & Pay Runs')}</button>
          )}
          <button
            id="btn-export-employees-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Download className="w-4 h-4 text-slate-500" />{tr('Export CSV')}</button>
          <button
            id="btn-add-new-employee"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />{tr('Add Employee')}</button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tr('Total Workforce')}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.total} Staff</h3>
            <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> {metrics.active} Active ({Math.round((metrics.active / (metrics.total || 1)) * 100)}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tr('Annualized Payroll')}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {activeTenant.currency} {metrics.totalAnnualPayroll.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{tr('Active staff base liability')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tr('Average Compensation')}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {activeTenant.currency} {metrics.avgSalary.toLocaleString()}/yr
            </h3>
            <p className="text-xs text-slate-500 mt-1">{tr('Across full & part-time staff')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BadgeDollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tr('Leave & Contractors')}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {metrics.onLeave} Leave / {metrics.contractors} 1099
            </h3>
            <p className="text-xs text-slate-500 mt-1">{departments.length} Functional departments</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar & View Mode Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-employees"
            type="text"
            placeholder={tr('Search by name, email, job title, or ID...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Department */}
          <select
            id="select-filter-dept"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">{tr('All Departments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            id="select-filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">{tr('All Statuses')}</option>
            <option value="ACTIVE">{tr('Active Only')}</option>
            <option value="ON_LEAVE">{tr('On Leave')}</option>
            <option value="TERMINATED">{tr('Terminated')}</option>
          </select>

          {/* Employment Type */}
          <select
            id="select-filter-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">{tr('All Employment Types')}</option>
            <option value="FULL_TIME">{tr('Full Time')}</option>
            <option value="PART_TIME">{tr('Part Time')}</option>
            <option value="CONTRACTOR">{tr('1099 Contractor')}</option>
            <option value="INTERN">{tr('Intern')}</option>
          </select>

          {/* Pay Type */}
          <select
            id="select-filter-paytype"
            value={selectedPayType}
            onChange={(e) => setSelectedPayType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">{tr('All Pay Types')}</option>
            <option value="SALARY">{tr('Salary')}</option>
            <option value="HOURLY">{tr('Hourly Rate')}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden ml-auto">
            <button
              id="btn-view-grid"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >{tr('Grid')}</button>
            <button
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >{tr('Table')}</button>
          </div>
        </div>
      </div>

      {/* Main Content: Grid vs Table */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">{tr('No employees match your search')}</h3>
          <p className="text-sm text-slate-500 mt-1">{tr('Try clearing some filters or add a new employee profile.')}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDept('ALL');
              setSelectedStatus('ALL');
              setSelectedType('ALL');
              setSelectedPayType('ALL');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >{tr('Clear All Filters')}</button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => {
            const initials = emp.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const isSalary = emp.payType !== 'HOURLY';
            const payDisplay = isSalary
              ? `${activeTenant.currency} ${(emp.baseSalaryAnnual || 0).toLocaleString()}/yr`
              : `${activeTenant.currency} ${emp.hourlyRate || 0}/hr`;

            const statusColors = {
              ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
              TERMINATED: 'bg-slate-100 text-slate-600 border-slate-300',
            };

            return (
              <div
                key={emp.id}
                id={`emp-card-${emp.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Top Bar: Avatar, Badges & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-sm relative">
                        {initials}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : emp.status === 'ON_LEAVE'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{emp.name}</h4>
                        </div>
                        <p className="text-xs text-indigo-600 font-medium">{emp.role}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        statusColors[emp.status] || statusColors.ACTIVE
                      }`}
                    >
                      {emp.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Badges & Meta */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                      {emp.department}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                      {emp.employmentType.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">
                      {emp.employeeNumber}
                    </span>
                  </div>

                  {/* Compensation & Bank Info Grid */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Compensation:
                      </span>
                      <span className="font-bold text-slate-800">{payDisplay}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Pay Frequency:
                      </span>
                      <span className="font-medium text-slate-700">{emp.payFrequency.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-purple-600" />
                        Disbursement:
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">
                        {emp.paymentMethod === 'DIRECT_DEPOSIT' ? emp.bankAccountNumber || 'Direct Deposit' : emp.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        Hired:
                      </span>
                      <span className="font-medium text-slate-700">{emp.hireDate}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: 1-Click 360° Profile & Edit */}
                <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                  <button
                    id={`btn-view-profile-${emp.id}`}
                    onClick={() => {
                      setActiveProfileEmployee(emp);
                      setProfileActiveTab('overview');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    360° Profile & Linked Records
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-emp-${emp.id}`}
                      onClick={() => handleOpenEditModal(emp)}
                      title={tr('Edit Profile')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-del-emp-${emp.id}`}
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      title={tr('Delete Profile')}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">{tr('Employee ID')}</th>
                  <th className="py-3 px-4">{tr('Full Name & Contact')}</th>
                  <th className="py-3 px-4">{tr('Job Title & Dept')}</th>
                  <th className="py-3 px-4">{tr('Status & Type')}</th>
                  <th className="py-3 px-4">{tr('Compensation & Frequency')}</th>
                  <th className="py-3 px-4">{tr('Filing Status')}</th>
                  <th className="py-3 px-4">{tr('Payment Method')}</th>
                  <th className="py-3 px-4 text-right">{tr('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const isSalary = emp.payType !== 'HOURLY';
                  const payDisplay = isSalary
                    ? `${activeTenant.currency} ${(emp.baseSalaryAnnual || 0).toLocaleString()}`
                    : `${activeTenant.currency} ${emp.hourlyRate || 0}/hr`;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-indigo-600">{emp.employeeNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-slate-500 text-[11px]">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{emp.role}</div>
                        <div className="text-slate-500 text-[11px]">{emp.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : emp.status === 'ON_LEAVE'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {emp.status.replace('_', ' ')}
                        </span>
                        <div className="text-slate-500 text-[11px] mt-0.5">{emp.employmentType.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{payDisplay}</div>
                        <div className="text-slate-500 text-[11px]">{emp.payFrequency.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{emp.filingStatus.replace(/_/g, ' ')}</div>
                        <div className="text-slate-500 text-[11px]">{emp.stateFilingStatus || 'State: N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{emp.paymentMethod.replace('_', ' ')}</div>
                        <div className="text-slate-500 text-[11px]">{emp.bankAccountNumber || '••••4892'}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-table-view-profile-${emp.id}`}
                            onClick={() => {
                              setActiveProfileEmployee(emp);
                              setProfileActiveTab('overview');
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-semibold text-xs transition"
                          >
                            360° Profile
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title={tr('Edit')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title={tr('Delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 360° EMPLOYEE PROFILE & LINKED RECORDS DRAWER / MODAL                      */}
      {/* ========================================================================= */}
      {activeProfileEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center border-2 border-indigo-400 shadow-md">
                  {activeProfileEmployee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{activeProfileEmployee.name}</h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeProfileEmployee.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : activeProfileEmployee.status === 'ON_LEAVE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {activeProfileEmployee.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-300 font-medium">
                    {activeProfileEmployee.role} &bull; {activeProfileEmployee.department}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: <span className="font-mono text-white">{activeProfileEmployee.employeeNumber}</span> &bull; Hired: {activeProfileEmployee.hireDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
                  title={tr('Toggle Masking for SSN & Bank details')}
                >
                  {showSensitiveData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showSensitiveData ? 'Mask Sensitive Info' : 'Reveal Sensitive Info'}
                </button>
                <button
                  onClick={() => setActiveProfileEmployee(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-6 text-sm font-semibold">
              <button
                id="tab-profile-overview"
                onClick={() => setProfileActiveTab('overview')}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                  profileActiveTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />{tr('Profile & Compensation Details')}</button>

              <button
                id="tab-profile-payruns"
                onClick={() => setProfileActiveTab('payruns')}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                  profileActiveTab === 'payruns'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Linked Pay Runs & Stubs ({linkedPayRuns.length})
              </button>

              <button
                id="tab-profile-expenses"
                onClick={() => setProfileActiveTab('expenses')}
                className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                  profileActiveTab === 'expenses'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Expense Claims & Mileage ({linkedExpenses.length + linkedMileage.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {profileActiveTab === 'overview' && (
                <div className="space-y-6">
                  {/* Grid of details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Section 1: Employment & Contact Details */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-600" />{tr('Personal & Employment Details')}</h4>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Work Email:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.email}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Phone Number:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.phone || '+1 (555) 019-2831'}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Employment Type:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.employmentType.replace('_', ' ')}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Work Location:')}</dt>
                          <dd className="font-semibold text-slate-900 text-right max-w-[200px] truncate">
                            {activeProfileEmployee.address || 'Acme HQ - 450 Lexington Ave, NY'}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('SSN / Tax Identification:')}</dt>
                          <dd className="font-mono font-semibold text-indigo-700">
                            {showSensitiveData ? '048-29-4892 (Verified)' : activeProfileEmployee.taxId || '•••-••-4892'}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-slate-500">{tr('Emergency Contact:')}</dt>
                          <dd className="font-semibold text-slate-900">
                            {activeProfileEmployee.emergencyContactName || 'Robert Accountant'} ({activeProfileEmployee.emergencyContactPhone || '+1 555-9011'})
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Section 2: Compensation & Pay Type */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-600" />{tr('Compensation & Pay Structure')}</h4>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Pay Model:')}</dt>
                          <dd className="font-bold text-slate-900">
                            {activeProfileEmployee.payType === 'HOURLY' ? 'Hourly Wage Rate' : 'Annual Base Salary'}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Base Compensation:')}</dt>
                          <dd className="font-bold text-emerald-700 text-sm">
                            {activeProfileEmployee.payType === 'HOURLY'
                              ? `${activeTenant.currency} ${activeProfileEmployee.hourlyRate || 0}/hour`
                              : `${activeTenant.currency} ${(activeProfileEmployee.baseSalaryAnnual || 0).toLocaleString()}/year`}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Pay Frequency:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.payFrequency.replace('_', ' ')}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Expected Standard Hours:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.standardHoursPerWeek || 40} hrs/week</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-slate-500">{tr('Est. Gross Per Paycheck:')}</dt>
                          <dd className="font-bold text-slate-900">
                            {activeTenant.currency}{' '}
                            {(
                              (activeProfileEmployee.baseSalaryAnnual ||
                                (activeProfileEmployee.hourlyRate || 65) * (activeProfileEmployee.standardHoursPerWeek || 40) * 52) /
                              (activeProfileEmployee.payFrequency === 'WEEKLY'
                                ? 52
                                : activeProfileEmployee.payFrequency === 'BI_WEEKLY'
                                ? 26
                                : activeProfileEmployee.payFrequency === 'MONTHLY'
                                ? 12
                                : 24)
                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Section 3: Tax Withholding & Benefits */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />{tr('Tax Withholding & Pre-Tax Benefits')}</h4>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Federal Filing Status:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.filingStatus.replace(/_/g, ' ')}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('State Filing Status:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.stateFilingStatus || 'NY (Single / 1 Allowance)'}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Withholding Allowances:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.allowances} allowances</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('401(k) Retirement Plan:')}</dt>
                          <dd className="font-semibold text-indigo-700">
                            {activeProfileEmployee.fourZeroOneKContributionRate || 6}% Employee (Match: {activeProfileEmployee.fourZeroOneKEmployerMatchRate || 4}%)
                          </dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-slate-500">{tr('Health & Dental Deduction:')}</dt>
                          <dd className="font-semibold text-slate-900">
                            ${activeProfileEmployee.healthBenefitDeduction || 125} Health + ${activeProfileEmployee.dentalVisionDeduction || 25} Dental / period
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Section 4: Direct Deposit & Banking */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-blue-600" />{tr('Direct Deposit & Payment Details')}</h4>
                      <dl className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Payment Method:')}</dt>
                          <dd className="font-bold text-slate-900">{activeProfileEmployee.paymentMethod.replace('_', ' ')}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Bank Financial Institution:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.bankName || 'JPMorgan Chase Bank, N.A.'}</dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Routing Number (ABA):')}</dt>
                          <dd className="font-mono font-semibold text-slate-900">
                            {showSensitiveData ? '021000021 (JPMC NY)' : '••••' + (activeProfileEmployee.bankRoutingNumber?.slice(-4) || '0021')}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <dt className="text-slate-500">{tr('Account Number:')}</dt>
                          <dd className="font-mono font-semibold text-slate-900">
                            {showSensitiveData ? '982341908234' : activeProfileEmployee.bankAccountNumber || '••••4892'}
                          </dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-slate-500">{tr('Account Type:')}</dt>
                          <dd className="font-semibold text-slate-900">{activeProfileEmployee.accountType || 'CHECKING'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Notes / HR Remarks */}
                  {activeProfileEmployee.notes && (
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-1">{tr('HR & Compliance Remarks:')}</span>
                      <p className="text-amber-800">{activeProfileEmployee.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {profileActiveTab === 'payruns' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tr('Historical Pay Runs & Disbursed Pay Stubs')}</h4>
                      <p className="text-xs text-slate-500">All audited payroll distributions processed for {activeProfileEmployee.name}.</p>
                    </div>
                    {onNavigateToPayroll && (
                      <button
                        onClick={onNavigateToPayroll}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />{tr('Run Next Payroll')}</button>
                    )}
                  </div>

                  {linkedPayRuns.length === 0 ? (
                    <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                      <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">{tr('No historical pay runs recorded yet for this employee.')}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tr('Run a pay period in the Payroll module to generate official pay stubs.')}</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="py-2.5 px-3">{tr('Run Ref')}</th>
                            <th className="py-2.5 px-3">{tr('Pay Period')}</th>
                            <th className="py-2.5 px-3">{tr('Pay Date')}</th>
                            <th className="py-2.5 px-3">{tr('Gross Wages')}</th>
                            <th className="py-2.5 px-3">{tr('Taxes & Deductions')}</th>
                            <th className="py-2.5 px-3">{tr('Net Disbursed')}</th>
                            <th className="py-2.5 px-3 text-right">{tr('Pay Stub Voucher')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {linkedPayRuns.map(({ run, line }) => (
                            <tr key={run.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-3 font-mono font-bold text-indigo-600">{run.runNumber}</td>
                              <td className="py-3 px-3 text-slate-700">
                                {run.payPeriodStart} &rarr; {run.payPeriodEnd}
                              </td>
                              <td className="py-3 px-3 font-medium text-slate-900">{run.payDate}</td>
                              <td className="py-3 px-3 font-bold text-slate-900">
                                {activeTenant.currency} {line.grossPay.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                -{activeTenant.currency}{' '}
                                {(line.federalTax + line.stateTax + line.socialSecurityTax + line.medicareTax + line.benefitsDeduction).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 font-bold text-emerald-600">
                                {activeTenant.currency} {line.netPay.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  id={`btn-paystub-${run.id}`}
                                  onClick={() =>
                                    setSelectedPaystubLine({
                                      line,
                                      runNumber: run.runNumber,
                                      payDate: run.payDate,
                                      payPeriodStart: run.payPeriodStart,
                                      payPeriodEnd: run.payPeriodEnd,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded font-semibold text-xs transition"
                                >
                                  <Printer className="w-3.5 h-3.5" />{tr('View Pay Stub')}</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {profileActiveTab === 'expenses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tr('Expense Claims & Mileage Reimbursements')}</h4>
                      <p className="text-xs text-slate-500">Corporate out-of-pocket receipts, travel, and mileage logged by {activeProfileEmployee.name}.</p>
                    </div>
                    <button
                      id="btn-file-expense-claim"
                      onClick={() => setIsExpenseClaimModalOpen(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />{tr('File Expense Claim')}</button>
                  </div>

                  {linkedExpenses.length === 0 && linkedMileage.length === 0 ? (
                    <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                      <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">{tr('No expense receipts or mileage submitted yet for this employee.')}</p>
                      <button
                        onClick={() => setIsExpenseClaimModalOpen(true)}
                        className="mt-3 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                      >
                        + Log First Expense Claim
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedExpenses.map((rcpt) => (
                        <div
                          key={rcpt.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{rcpt.vendorName}</span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    rcpt.status === 'POSTED'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : rcpt.status === 'REIMBURSED'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {rcpt.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {rcpt.category} &bull; Date: {rcpt.expenseDate} &bull; #{rcpt.receiptNumber}
                              </p>
                              {rcpt.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">{rcpt.notes}</p>}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-slate-900 text-sm">
                              {activeTenant.currency} {rcpt.totalAmount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{rcpt.paymentMethod.replace('_', ' ')}</span>
                          </div>
                        </div>
                      ))}

                      {linkedMileage.map((mil) => (
                        <div
                          key={mil.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{mil.purpose}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                  {mil.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {mil.startLocation} &rarr; {mil.endLocation} ({mil.distanceMiles} miles @ ${mil.ratePerMile}/mi)
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-emerald-600 text-sm">
                              {activeTenant.currency} {mil.totalDeductionAmount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{tr('Reimbursable Mileage')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => {
                  handleOpenEditModal(activeProfileEmployee);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />{tr('Edit Full Profile')}</button>

              <button
                onClick={() => setActiveProfileEmployee(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >{tr('Close Profile')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT EMPLOYEE MODAL (4-TAB COMPREHENSIVE WIZARD)                    */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <form onSubmit={handleSaveEmployee} className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {editingEmployeeId ? `Edit Employee Record: ${formName}` : 'Add New Employee Profile'}
                    </h3>
                    <p className="text-xs text-slate-400">{tr('Configure personal employment, compensation tier, tax withholding elections, and direct deposit.')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Wizard Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-xs font-bold gap-4">
                <button
                  type="button"
                  onClick={() => setModalTab('personal')}
                  className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                    modalTab === 'personal'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  1. Personal & Employment
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('compensation')}
                  className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                    modalTab === 'compensation'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  2. Compensation & Pay Type
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('taxes')}
                  className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                    modalTab === 'taxes'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  3. Tax Withholdings & Benefits
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('banking')}
                  className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                    modalTab === 'banking'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  4. Direct Deposit & Banking
                </button>
              </div>

              {/* Modal Body Tabs */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* TAB 1: Personal & Employment Details */}
                {modalTab === 'personal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Full Legal Name')}<span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-form-name"
                          type="text"
                          required
                          placeholder={tr('e.g. Sarah Jenkins, CPA')}
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Work Email Address')}<span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-form-email"
                          type="email"
                          required
                          placeholder={tr('e.g. sarah.jenkins@acme.com')}
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Employee ID / Number')}</label>
                        <input
                          type="text"
                          value={formEmployeeNumber}
                          onChange={(e) => setFormEmployeeNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Phone Number')}</label>
                        <input
                          type="text"
                          placeholder="+1 (555) 019-2831"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('SSN / Tax ID (Masked)')}</label>
                        <input
                          type="text"
                          placeholder="•••-••-1234"
                          value={formTaxId}
                          onChange={(e) => setFormTaxId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Job Title')}<span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={tr('e.g. Senior Financial Controller')}
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Department')}</label>
                        <select
                          value={formDepartment}
                          onChange={(e) => setFormDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="Engineering & R&D">{tr('Engineering & R&D')}</option>
                          <option value="Finance & Compliance">{tr('Finance & Compliance')}</option>
                          <option value="Sales & Marketing">{tr('Sales & Marketing')}</option>
                          <option value="Product & Design">{tr('Product & Design')}</option>
                          <option value="Executive & Legal">{tr('Executive & Legal')}</option>
                          <option value="Customer Operations">{tr('Customer Operations')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Employment Type')}</label>
                        <select
                          value={formEmploymentType}
                          onChange={(e) => setFormEmploymentType(e.target.value as EmployeeEmploymentType)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="FULL_TIME">{tr('Full Time (W-2)')}</option>
                          <option value="PART_TIME">{tr('Part Time (W-2)')}</option>
                          <option value="CONTRACTOR">{tr('1099 Independent Contractor')}</option>
                          <option value="INTERN">{tr('Intern')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Status')}</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as EmployeeStatus)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="ACTIVE">{tr('Active')}</option>
                          <option value="ON_LEAVE">{tr('On Leave')}</option>
                          <option value="TERMINATED">{tr('Terminated')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Hire Date')}</label>
                        <input
                          type="date"
                          value={formHireDate}
                          onChange={(e) => setFormHireDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">{tr('Work Address / Location')}</label>
                      <input
                        type="text"
                        placeholder={tr('e.g. 450 Lexington Ave, New York, NY 10017')}
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: Compensation & Pay Type */}
                {modalTab === 'compensation' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-indigo-950">{tr('Compensation & Wage Schedule')}</p>
                        <p className="text-indigo-800 text-[11px]">{tr('Choose between fixed annual salary (divided evenly across pay runs) or hourly rate calculated on standard scheduled hours.')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Pay Type')}</label>
                        <select
                          value={formPayType}
                          onChange={(e) => setFormPayType(e.target.value as EmployeePayType)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="SALARY">{tr('Fixed Annual Salary ($/yr)')}</option>
                          <option value="HOURLY">{tr('Hourly Wage Rate ($/hr)')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Pay Frequency')}</label>
                        <select
                          value={formPayFrequency}
                          onChange={(e) => setFormPayFrequency(e.target.value as EmployeePayFrequency)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="WEEKLY">{tr('Weekly (52 pay periods/yr)')}</option>
                          <option value="BI_WEEKLY">{tr('Bi-Weekly (26 pay periods/yr)')}</option>
                          <option value="SEMI_MONTHLY">{tr('Semi-Monthly (24 pay periods/yr)')}</option>
                          <option value="MONTHLY">{tr('Monthly (12 pay periods/yr)')}</option>
                        </select>
                      </div>
                    </div>

                    {formPayType === 'SALARY' ? (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Annual Base Salary ({activeTenant.currency})
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={formBaseSalaryAnnual}
                            onChange={(e) => setFormBaseSalaryAnnual(Number(e.target.value))}
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Calculates to approx. {activeTenant.currency}{' '}
                          {(
                            formBaseSalaryAnnual /
                            (formPayFrequency === 'WEEKLY'
                              ? 52
                              : formPayFrequency === 'BI_WEEKLY'
                              ? 26
                              : formPayFrequency === 'MONTHLY'
                              ? 12
                              : 24)
                          ).toFixed(2)}{' '}
                          gross per paycheck.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">{tr('Hourly Wage Rate ($/hr)')}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={formHourlyRate}
                            onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">{tr('Standard Hours Per Week')}</label>
                          <input
                            type="number"
                            min="1"
                            max="80"
                            value={formStandardHoursPerWeek}
                            onChange={(e) => setFormStandardHoursPerWeek(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Tax Withholdings & Benefits */}
                {modalTab === 'taxes' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Federal W-4 Filing Status')}</label>
                        <select
                          value={formFilingStatus}
                          onChange={(e) => setFormFilingStatus(e.target.value as EmployeeFilingStatus)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="SINGLE">{tr('Single or Married filing separately')}</option>
                          <option value="MARRIED_FILING_JOINTLY">{tr('Married filing jointly')}</option>
                          <option value="HEAD_OF_HOUSEHOLD">{tr('Head of Household')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('State Tax Withholding Jurisdiction')}</label>
                        <input
                          type="text"
                          placeholder={tr('e.g. NY (Single / 1 Allowance)')}
                          value={formStateFilingStatus}
                          onChange={(e) => setFormStateFilingStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Withholding Allowances')}</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formAllowances}
                          onChange={(e) => setFormAllowances(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Additional Per-Period Withholding ($)')}</label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={formAdditionalWithholding}
                          onChange={(e) => setFormAdditionalWithholding(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <PiggyBank className="w-4 h-4 text-emerald-600" />
                        401(k) Retirement & Pre-Tax Benefit Deductions
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">{tr('401(k) Employee Contribution (%)')}</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={form401kContributionRate}
                            onChange={(e) => setForm401kContributionRate(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">{tr('401(k) Employer Match (%)')}</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={form401kEmployerMatchRate}
                            onChange={(e) => setForm401kEmployerMatchRate(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">{tr('Health Insurance Deduction ($/period)')}</label>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={formHealthBenefitDeduction}
                            onChange={(e) => setFormHealthBenefitDeduction(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">{tr('Dental & Vision Deduction ($/period)')}</label>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={formDentalVisionDeduction}
                            onChange={(e) => setFormDentalVisionDeduction(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Direct Deposit & Banking */}
                {modalTab === 'banking' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Disbursement Method')}</label>
                        <select
                          value={formPaymentMethod}
                          onChange={(e) => setFormPaymentMethod(e.target.value as EmployeePaymentMethod)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="DIRECT_DEPOSIT">{tr('Direct Deposit (ACH Transfer)')}</option>
                          <option value="CHECK">{tr('Paper Payroll Check')}</option>
                          <option value="WIRE">{tr('Wire Transfer')}</option>
                          <option value="CASH">{tr('Cash Disbursement')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Bank Name')}</label>
                        <input
                          type="text"
                          placeholder={tr('e.g. JPMorgan Chase Bank, N.A.')}
                          value={formBankName}
                          onChange={(e) => setFormBankName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Routing Number (9-digits)')}</label>
                        <input
                          type="text"
                          placeholder="021000021"
                          value={formBankRoutingNumber}
                          onChange={(e) => setFormBankRoutingNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Account Number')}</label>
                        <input
                          type="text"
                          placeholder="••••4892"
                          value={formBankAccountNumber}
                          onChange={(e) => setFormBankAccountNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Account Type')}</label>
                        <select
                          value={formAccountType}
                          onChange={(e) => setFormAccountType(e.target.value as 'CHECKING' | 'SAVINGS')}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="CHECKING">{tr('Checking Account')}</option>
                          <option value="SAVINGS">{tr('Savings Account')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Emergency Contact Name')}</label>
                        <input
                          type="text"
                          placeholder={tr('e.g. Robert Accountant (Spouse)')}
                          value={formEmergencyContactName}
                          onChange={(e) => setFormEmergencyContactName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">{tr('Emergency Contact Phone')}</label>
                        <input
                          type="text"
                          placeholder="+1 (555) 901-2910"
                          value={formEmergencyContactPhone}
                          onChange={(e) => setFormEmergencyContactPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">{tr('HR & Compliance Remarks / Notes')}</label>
                      <textarea
                        rows={2}
                        placeholder={tr('Internal notes, special certifications, SOX access, etc.')}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {modalTab !== 'personal' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'banking') setModalTab('taxes');
                        else if (modalTab === 'taxes') setModalTab('compensation');
                        else if (modalTab === 'compensation') setModalTab('personal');
                      }}
                      className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition"
                    >
                      &larr; Back
                    </button>
                  )}
                  {modalTab !== 'banking' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'personal') setModalTab('compensation');
                        else if (modalTab === 'compensation') setModalTab('taxes');
                        else if (modalTab === 'taxes') setModalTab('banking');
                      }}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition"
                    >
                      Next Step &rarr;
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >{tr('Cancel')}</button>
                  <button
                    id="btn-submit-employee-form"
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    {editingEmployeeId ? 'Save Changes' : 'Create Employee Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK EXPENSE CLAIM MODAL                                                 */}
      {/* ========================================================================= */}
      {isExpenseClaimModalOpen && activeProfileEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <form onSubmit={handleQuickExpenseSubmit}>
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">File Expense Claim for {activeProfileEmployee.name}</h3>
                  <p className="text-xs text-slate-400">{tr('Log employee out-of-pocket expenditure for reimbursement.')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpenseClaimModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{tr('Merchant / Vendor Name')}</label>
                  <input
                    type="text"
                    required
                    placeholder={tr('e.g. Delta Air Lines, Marriott, Amazon')}
                    value={claimVendor}
                    onChange={(e) => setClaimVendor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{tr('Expense Category')}</label>
                  <select
                    value={claimCategory}
                    onChange={(e) => setClaimCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Travel & Client Meetings">{tr('Travel & Client Meetings')}</option>
                    <option value="Meals & Entertainment">{tr('Meals & Entertainment')}</option>
                    <option value="Office Equipment & Hardware">{tr('Office Equipment & Hardware')}</option>
                    <option value="Software Subscriptions">{tr('Software Subscriptions')}</option>
                    <option value="Training & Certifications">{tr('Training & Certifications')}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount ({activeTenant.currency})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{tr('Business Purpose / Notes')}</label>
                  <input
                    type="text"
                    placeholder={tr('e.g. Client dinner with Apex Logistics executives')}
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseClaimModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >{tr('Submit Expense Claim')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL PAY STUB VOUCHER MODAL (PRINTABLE)                               */}
      {/* ========================================================================= */}
      {selectedPaystubLine && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Paystub Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-1">{tr('Official Corporate Earnings Statement')}</p>
                <h3 className="text-xl font-bold">{activeTenant.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tenant: {activeTenant.code} &bull; Standard: {activeTenant.pluginId} &bull; Currency: {activeTenant.currency}
                </p>
              </div>
              <button
                onClick={() => setSelectedPaystubLine(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paystub Body */}
            <div className="p-6 space-y-6 text-xs bg-white">
              {/* Employee & Pay Period Meta */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-500 font-medium">{tr('Employee Name:')}</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedPaystubLine.line.employeeName}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Department: {selectedPaystubLine.line.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-medium">{tr('Pay Date:')}</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedPaystubLine.payDate}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Period: {selectedPaystubLine.payPeriodStart} to {selectedPaystubLine.payPeriodEnd}
                  </p>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gross Earnings */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200">{tr('Gross Earnings')}</div>
                  <div className="p-3.5 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{tr('Base Salary / Regular Wages:')}</span>
                      <span className="font-bold text-slate-900">
                        {activeTenant.currency} {selectedPaystubLine.line.grossPay.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900">
                      <span>{tr('Total Gross Pay:')}</span>
                      <span className="text-indigo-600">
                        {activeTenant.currency} {selectedPaystubLine.line.grossPay.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions & Withholdings */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200">{tr('Taxes & Pre-tax Deductions')}</div>
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{tr('Federal Withholding Tax:')}</span>
                      <span className="font-medium text-slate-900">
                        -{activeTenant.currency} {selectedPaystubLine.line.federalTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{tr('State / Local Income Tax:')}</span>
                      <span className="font-medium text-slate-900">
                        -{activeTenant.currency} {selectedPaystubLine.line.stateTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{tr('Social Security (OASDI 6.2%):')}</span>
                      <span className="font-medium text-slate-900">
                        -{activeTenant.currency} {selectedPaystubLine.line.socialSecurityTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{tr('Medicare Tax (1.45%):')}</span>
                      <span className="font-medium text-slate-900">
                        -{activeTenant.currency} {selectedPaystubLine.line.medicareTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{tr('Health & 401(k) Deductions:')}</span>
                      <span className="font-medium text-slate-900">
                        -{activeTenant.currency} {selectedPaystubLine.line.benefitsDeduction.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold text-emerald-800 tracking-wider">{tr('Net Take-Home Pay')}</p>
                  <p className="text-[11px] text-emerald-700">{tr('Directly deposited to verified corporate checking account')}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-700">
                    {activeTenant.currency} {selectedPaystubLine.line.netPay.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Employer Contributions Note */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <span>Employer FICA & FUTA Contributions (Paid by {activeTenant.name}):</span>
                <span className="font-semibold text-slate-700">
                  {activeTenant.currency}{' '}
                  {(selectedPaystubLine.line.employerFicaMatch + selectedPaystubLine.line.employerFuta).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />{tr('Print / Save PDF')}</button>

              <button
                onClick={() => setSelectedPaystubLine(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >{tr('Close Statement')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
