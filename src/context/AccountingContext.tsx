import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  Tenant,
  Organization,
  Branch,
  Role,
  PluginId,
  Account,
  JournalEntry,
  JournalLine,
  BankStatementLine,
  FixedAsset,
  AuditLogEvent,
  TrialBalanceRow,
  BalanceSheetData,
  IncomeStatementData,
  StatutoryReportData,
  ParsedTransactionUpload,
  CustomerInvoice,
  VendorBill,
  FiscalPeriod,
  CashFlowData,
  FinancialRatiosData,
  ConsolidatedEntityData,
  TreasuryAccount,
  DepartmentBudget,
  ApprovalItem,
  TaxJurisdiction,
  EnterpriseUser,
  CustomRoleDefinition,
  TenantAccessScope,
  PermissionKey,
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_ACCOUNTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_BANK_STATEMENTS,
  INITIAL_FIXED_ASSETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INVOICES,
  INITIAL_BILLS,
  INITIAL_FISCAL_PERIODS,
  INITIAL_TREASURY_ACCOUNTS,
  INITIAL_DEPARTMENT_BUDGETS,
  INITIAL_APPROVAL_ITEMS,
  INITIAL_TAX_JURISDICTIONS,
  INITIAL_ENTERPRISE_USERS,
  INITIAL_CUSTOM_ROLES,
  FX_RATES,
} from '../mockData';

interface AccountingContextType {
  // Tenant & Context Headers State
  tenants: Tenant[];
  activeTenant: Tenant;
  activeOrganization: Organization | null;
  activeBranch: Branch | null;
  activeRole: Role;
  userEmail: string;
  activePlugin: PluginId;

  // Actions for Switching Context
  setActiveTenantId: (tenantId: string) => void;
  setActiveOrganizationId: (orgId: string | null) => void;
  setActiveBranchId: (branchId: string | null) => void;
  setActiveRole: (role: Role) => void;
  setUserEmail: (email: string) => void;

  // Ledger & Sub-Ledger Data
  accounts: Account[];
  journalEntries: JournalEntry[];
  bankStatements: BankStatementLine[];
  fixedAssets: FixedAsset[];
  auditLogs: AuditLogEvent[];
  invoices: CustomerInvoice[];
  vendorBills: VendorBill[];
  fiscalPeriods: FiscalPeriod[];
  treasuryAccounts: TreasuryAccount[];
  departmentBudgets: DepartmentBudget[];
  approvalItems: ApprovalItem[];
  taxJurisdictions: TaxJurisdiction[];
  enterpriseUsers: EnterpriseUser[];
  customRoles: CustomRoleDefinition[];

  // User Access & Provisioning Engine
  createEnterpriseUser: (userData: Omit<EnterpriseUser, 'id' | 'createdAt' | 'lastLogin' | 'apiTokenCount'>) => { success: boolean; error?: string };
  updateUserStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED') => void;
  updateUserRoleAndScopes: (userId: string, defaultRole: Role, tenantScopes: TenantAccessScope[]) => void;
  toggleUserMfa: (userId: string) => void;
  deleteEnterpriseUser: (userId: string) => void;
  hasPermission: (permission: PermissionKey, tenantId?: string) => boolean;

  // Double-Entry Engine Functions
  postJournalEntry: (entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'totalDebit' | 'totalCredit' | 'createdAt' | 'postedBy' | 'postedRole' | 'status'>) => { success: boolean; error?: string; entryId?: string };
  reverseJournalEntry: (entryId: string, reason: string) => { success: boolean; error?: string };
  batchUploadTransactions: (parsedRows: ParsedTransactionUpload[]) => { success: boolean; postedCount: number; errors: string[] };
  
  // Sub-ledger Operations (AR / AP)
  createInvoice: (invoiceData: Omit<CustomerInvoice, 'id' | 'invoiceNumber' | 'amountPaid' | 'status'>) => { success: boolean; error?: string };
  receiveInvoicePayment: (invoiceId: string, paymentAmount: number, bankAccountId: string) => { success: boolean; error?: string };
  createVendorBill: (billData: Omit<VendorBill, 'id' | 'billNumber' | 'amountPaid' | 'status'>) => { success: boolean; error?: string };
  payVendorBill: (billId: string, paymentAmount: number, bankAccountId: string) => { success: boolean; error?: string };

  // Period Lock & Fiscal Year Close
  toggleFiscalPeriodStatus: (periodId: string, newStatus: 'OPEN' | 'LOCKED' | 'CLOSED') => void;
  executeYearEndClose: (fiscalYear: string) => { success: boolean; netIncomeClosed: number; entryId?: string; error?: string };

  // Treasury, FP&A, Approvals & Tax Engine Operations
  executeSweepTransfer: (fromAccId: string, toAccId: string, amount: number) => { success: boolean; error?: string };
  updateDepartmentBudget: (budgetId: string, newAnnualAmount: number) => void;
  processApprovalDecision: (approvalId: string, decision: 'APPROVED' | 'REJECTED') => void;
  postTaxSettlementVoucher: (jurisdictionId: string) => { success: boolean; entryId?: string; error?: string };

  // Bank & Assets
  reconcileBankLine: (statementId: string, accountId: string, matchingEntryId?: string) => { success: boolean; error?: string };
  importBankStatements: (lines: Omit<BankStatementLine, 'id' | 'tenantId' | 'reconciled'>[]) => { success: boolean; count: number; error?: string };
  autoMatchAndReconcile: () => { matchedCount: number; success: boolean };
  createAndReconcileGLLine: (statementId: string, accountCode: string, memo?: string) => { success: boolean; error?: string };
  runDepreciationForTenant: (asOfDate: string) => { success: boolean; totalDepreciation: number; entriesCreated: number };
  
  // Entity Management
  createTenant: (tenantData: Omit<Tenant, 'id' | 'organizations'>) => void;
  createAccount: (accountData: Omit<Account, 'id' | 'tenantId' | 'balance'>) => { success: boolean; error?: string };

  // Financial Reports & Intelligence Calculators
  trialBalance: TrialBalanceRow[];
  balanceSheet: BalanceSheetData;
  incomeStatement: IncomeStatementData;
  statutoryReport: StatutoryReportData;
  cashFlowStatement: CashFlowData;
  financialRatios: FinancialRatiosData;
  consolidatedFinancials: ConsolidatedEntityData;
  
  // Helper to parse CSV/JSON text
  parseCsvOrJsonUpload: (fileContent: string, format: 'csv' | 'json') => ParsedTransactionUpload[];
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [activeTenantId, setActiveTenantIdState] = useState<string>('t-acme-us');
  const [activeOrgId, setActiveOrgId] = useState<string | null>('org-acme-north');
  const [activeBranchId, setActiveBranchId] = useState<string | null>('br-ny-hq');
  
  const [activeRole, setActiveRole] = useState<Role>('accountant');
  const [userEmail, setUserEmail] = useState<string>('sarah.accountant@acme.com');

  const [accountsMap, setAccountsMap] = useState<Record<string, Account[]>>(INITIAL_ACCOUNTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [bankStatements, setBankStatements] = useState<BankStatementLine[]>(INITIAL_BANK_STATEMENTS);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(INITIAL_FIXED_ASSETS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(INITIAL_AUDIT_LOGS);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>(INITIAL_INVOICES);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>(INITIAL_BILLS);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>(INITIAL_FISCAL_PERIODS);
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccount[]>(INITIAL_TREASURY_ACCOUNTS);
  const [departmentBudgets, setDepartmentBudgets] = useState<DepartmentBudget[]>(INITIAL_DEPARTMENT_BUDGETS);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>(INITIAL_APPROVAL_ITEMS);
  const [taxJurisdictions, setTaxJurisdictions] = useState<TaxJurisdiction[]>(INITIAL_TAX_JURISDICTIONS);
  const [enterpriseUsers, setEnterpriseUsers] = useState<EnterpriseUser[]>(INITIAL_ENTERPRISE_USERS);
  const [customRoles] = useState<CustomRoleDefinition[]>(INITIAL_CUSTOM_ROLES);

  // Active Tenant object
  const activeTenant = useMemo(() => {
    return tenants.find((t) => t.id === activeTenantId) || tenants[0];
  }, [tenants, activeTenantId]);

  // Active Plugin based on Tenant
  const activePlugin = activeTenant.pluginId;

  // Active Organization
  const activeOrganization = useMemo(() => {
    if (!activeOrgId) return null;
    return activeTenant.organizations.find((o) => o.id === activeOrgId) || null;
  }, [activeTenant, activeOrgId]);

  // Active Branch
  const activeBranch = useMemo(() => {
    if (!activeBranchId || !activeOrganization) return null;
    return activeOrganization.branches.find((b) => b.id === activeBranchId) || null;
  }, [activeOrganization, activeBranchId]);

  // Change Active Tenant & reset org/branch
  const setActiveTenantId = (tId: string) => {
    const found = tenants.find((t) => t.id === tId);
    if (found) {
      setActiveTenantIdState(tId);
      const firstOrg = found.organizations[0] || null;
      setActiveOrgId(firstOrg ? firstOrg.id : null);
      setActiveBranchId(firstOrg && firstOrg.branches[0] ? firstOrg.branches[0].id : null);

      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: tId,
        userRole: activeRole,
        userEmail,
        details: `Switched request context scope to Tenant: ${found.name} (${found.code})`,
        status: 'SUCCESS',
        payloadSummary: `Header Scope: x-tenant-id=${tId} | Country: ${found.country} | Standard: ${found.pluginId}`,
      });
    }
  };

  // Helper for adding Audit Logs
  const addAuditLog = (event: Omit<AuditLogEvent, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEvent = {
      ...event,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Accounts for active tenant
  const accounts = useMemo(() => {
    return accountsMap[activeTenant.id] || [];
  }, [accountsMap, activeTenant.id]);

  // Scope & Permission Guard
  const checkScopeAndPermission = (targetTenantId: string): { allowed: boolean; error?: string } => {
    // 1. Role Check: Viewer cannot write
    if (activeRole === 'viewer') {
      const msg = 'HTTP 403 FORBIDDEN: Role "viewer" is read-only. Accountant or Admin role required.';
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: targetTenantId,
        userRole: activeRole,
        userEmail,
        details: 'Attempted write operation with unauthorized "viewer" role.',
        status: 'FORBIDDEN',
        payloadSummary: msg,
      });
      return { allowed: false, error: msg };
    }

    // 2. Tenant Context Scope Guard
    if (targetTenantId !== activeTenant.id) {
      const msg = `HTTP 403 SCOPE MISMATCH: Incoming transaction tenant (${targetTenantId}) does not match current request header x-tenant-id (${activeTenant.id}).`;
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: targetTenantId,
        userRole: activeRole,
        userEmail,
        details: 'Tenant scope validation failed.',
        status: 'FORBIDDEN',
        payloadSummary: msg,
      });
      return { allowed: false, error: msg };
    }

    return { allowed: true };
  };

  // Post Single Journal Entry with Double-Entry Guard
  const postJournalEntry = (
    entryData: Omit<JournalEntry, 'id' | 'entryNumber' | 'totalDebit' | 'totalCredit' | 'createdAt' | 'postedBy' | 'postedRole' | 'status'>
  ) => {
    const guard = checkScopeAndPermission(entryData.tenantId);
    if (!guard.allowed) {
      return { success: false, error: guard.error };
    }

    // Fiscal Period Lock Guard
    const entryDate = entryData.date;
    const lockedPeriod = fiscalPeriods.find(
      (p) => p.tenantId === entryData.tenantId && p.status !== 'OPEN' && entryDate >= p.startDate && entryDate <= p.endDate
    );
    if (lockedPeriod) {
      const lockErr = `HTTP 423 PERIOD LOCKED: Fiscal Period "${lockedPeriod.periodName}" is currently ${lockedPeriod.status}. Journal postings on ${entryDate} are blocked.`;
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: entryData.tenantId,
        userRole: activeRole,
        userEmail,
        details: `Blocked entry posting on ${entryDate} due to ${lockedPeriod.status} fiscal period.`,
        status: 'FORBIDDEN',
        payloadSummary: lockErr,
      });
      return { success: false, error: lockErr };
    }

    // Double-Entry Validation
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of entryData.lines) {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(roundedDebit - roundedCredit) > 0.01) {
      const err = `DOUBLE-ENTRY VALIDATION FAILED: Sum of Debits (${roundedDebit} ${activeTenant.currency}) does not equal Sum of Credits (${roundedCredit} ${activeTenant.currency}). Imbalance: ${Math.abs(roundedDebit - roundedCredit).toFixed(2)}`;
      addAuditLog({
        action: 'POST_JOURNAL',
        tenantId: entryData.tenantId,
        userRole: activeRole,
        userEmail,
        details: `Rejected unbalanced journal entry: ${entryData.description}`,
        status: 'FAILED',
        payloadSummary: err,
      });
      return { success: false, error: err };
    }

    const entryId = `je-${Date.now()}`;
    const entryNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`;

    const newEntry: JournalEntry = {
      ...entryData,
      id: entryId,
      entryNumber,
      totalDebit: roundedDebit,
      totalCredit: roundedCredit,
      postedBy: userEmail,
      postedRole: activeRole,
      status: 'POSTED',
      createdAt: new Date().toISOString(),
    };

    // Update Accounts Balances with SELECT FOR UPDATE simulation
    setAccountsMap((prev) => {
      const currentList = [...(prev[entryData.tenantId] || [])];
      entryData.lines.forEach((line) => {
        const accIndex = currentList.findIndex((a) => a.id === line.accountId || a.code === line.accountCode);
        if (accIndex !== -1) {
          const acc = currentList[accIndex];
          // Normal Balances: ASSET / EXPENSE = Debit (+), Credit (-)
          // LIABILITY / EQUITY / REVENUE = Credit (+), Debit (-)
          let change = 0;
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            change = line.debit - line.credit;
          } else {
            change = line.credit - line.debit;
          }
          currentList[accIndex] = {
            ...acc,
            balance: Math.round((acc.balance + change) * 100) / 100,
          };
        }
      });
      return { ...prev, [entryData.tenantId]: currentList };
    });

    setJournalEntries((prev) => [newEntry, ...prev]);

    addAuditLog({
      action: 'POST_JOURNAL',
      tenantId: entryData.tenantId,
      organizationId: entryData.organizationId,
      branchId: entryData.branchId,
      userRole: activeRole,
      userEmail,
      details: `Successfully posted ${entryNumber}: "${entryData.description}" (${roundedDebit} ${activeTenant.currency})`,
      status: 'SUCCESS',
      payloadSummary: `SELECT FOR UPDATE executed | Plugin: ${entryData.pluginId} | ${entryData.lines.length} lines posted`,
    });

    return { success: true, entryId };
  };

  // Reverse Entry (Immutable Audit Trail)
  const reverseJournalEntry = (entryId: string, reason: string) => {
    const target = journalEntries.find((je) => je.id === entryId);
    if (!target) return { success: false, error: 'Journal entry not found.' };

    const guard = checkScopeAndPermission(target.tenantId);
    if (!guard.allowed) return { success: false, error: guard.error };

    if (target.status === 'REVERSED') {
      return { success: false, error: 'This journal entry has already been reversed.' };
    }

    // Create reversing lines by swapping debit and credit
    const reversalLines: JournalLine[] = target.lines.map((line) => ({
      ...line,
      id: `jl-rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      debit: line.credit,
      credit: line.debit,
      memo: `Reversal of ${target.entryNumber}: ${reason}`,
    }));

    const result = postJournalEntry({
      tenantId: target.tenantId,
      organizationId: target.organizationId,
      branchId: target.branchId,
      date: new Date().toISOString().split('T')[0],
      description: `REVERSAL of ${target.entryNumber} - ${reason}`,
      reference: `REV-${target.entryNumber}`,
      pluginId: target.pluginId,
      lines: reversalLines,
      reversalOfId: target.id,
    });

    if (result.success) {
      setJournalEntries((prev) =>
        prev.map((je) => (je.id === entryId ? { ...je, status: 'REVERSED' } : je))
      );
      addAuditLog({
        action: 'REVERSE_JOURNAL',
        tenantId: target.tenantId,
        userRole: activeRole,
        userEmail,
        details: `Reversed Journal Entry ${target.entryNumber}. Reason: ${reason}`,
        status: 'SUCCESS',
        payloadSummary: `Created Reversal Entry ID: ${result.entryId}`,
      });
    }

    return result;
  };

  // Parse CSV/JSON Upload text
  const parseCsvOrJsonUpload = (fileContent: string, format: 'csv' | 'json'): ParsedTransactionUpload[] => {
    const currentAccs = accountsMap[activeTenant.id] || [];
    const accCodes = new Set(currentAccs.map((a) => a.code));

    if (format === 'json') {
      try {
        const parsed = JSON.parse(fileContent);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((row: any, idx: number) => {
          const errors: string[] = [];
          if (!row.date) errors.push('Missing date');
          if (!row.accountCodeDebit) errors.push('Missing Debit Account Code');
          else if (!accCodes.has(String(row.accountCodeDebit))) errors.push(`Debit account code "${row.accountCodeDebit}" not in Chart of Accounts`);
          
          if (!row.accountCodeCredit) errors.push('Missing Credit Account Code');
          else if (!accCodes.has(String(row.accountCodeCredit))) errors.push(`Credit account code "${row.accountCodeCredit}" not in Chart of Accounts`);
          
          if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) errors.push('Amount must be a positive number');

          return {
            rowNumber: idx + 1,
            date: row.date || new Date().toISOString().split('T')[0],
            description: row.description || `Uploaded transaction #${idx + 1}`,
            accountCodeDebit: String(row.accountCodeDebit || ''),
            accountCodeCredit: String(row.accountCodeCredit || ''),
            amount: Number(row.amount) || 0,
            reference: row.reference || `CSV-BATCH-${idx + 1}`,
            tenantId: row.tenantId || activeTenant.id,
            isValid: errors.length === 0,
            errors,
          };
        });
      } catch (err) {
        return [];
      }
    } else {
      // CSV format: Date, Description, DebitAccount, CreditAccount, Amount, Reference
      const lines = fileContent.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) return [];

      const rows: ParsedTransactionUpload[] = [];
      const headerLine = lines[0].toLowerCase();
      const startIndex = headerLine.includes('date') || headerLine.includes('amount') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 5) continue;

        const date = cols[0] || new Date().toISOString().split('T')[0];
        const description = cols[1] || `Batch upload row #${i}`;
        const accountCodeDebit = cols[2] || '';
        const accountCodeCredit = cols[3] || '';
        const amount = parseFloat(cols[4]) || 0;
        const reference = cols[5] || `CSV-BATCH-${i}`;

        const errors: string[] = [];
        if (!date) errors.push('Invalid Date');
        if (!accountCodeDebit || !accCodes.has(accountCodeDebit)) {
          errors.push(`Debit Code "${accountCodeDebit}" invalid for ${activeTenant.name}`);
        }
        if (!accountCodeCredit || !accCodes.has(accountCodeCredit)) {
          errors.push(`Credit Code "${accountCodeCredit}" invalid for ${activeTenant.name}`);
        }
        if (amount <= 0) errors.push('Amount must be > 0');

        rows.push({
          rowNumber: i,
          date,
          description,
          accountCodeDebit,
          accountCodeCredit,
          amount,
          reference,
          tenantId: activeTenant.id,
          isValid: errors.length === 0,
          errors,
        });
      }
      return rows;
    }
  };

  // Batch Upload Executer
  const batchUploadTransactions = (parsedRows: ParsedTransactionUpload[]) => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      return { success: false, postedCount: 0, errors: ['No valid rows found to post.'] };
    }

    const currentAccs = accountsMap[activeTenant.id] || [];
    let postedCount = 0;
    const errors: string[] = [];

    validRows.forEach((row) => {
      const debitAcc = currentAccs.find((a) => a.code === row.accountCodeDebit);
      const creditAcc = currentAccs.find((a) => a.code === row.accountCodeCredit);

      if (!debitAcc || !creditAcc) {
        errors.push(`Row ${row.rowNumber}: Account lookup failed.`);
        return;
      }

      const res = postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization ? activeOrganization.id : undefined,
        branchId: activeBranch ? activeBranch.id : undefined,
        date: row.date,
        description: row.description,
        reference: row.reference,
        pluginId: activePlugin,
        lines: [
          {
            id: `jl-b-d-${Math.random()}`,
            accountId: debitAcc.id,
            accountCode: debitAcc.code,
            accountName: debitAcc.name,
            debit: row.amount,
            credit: 0,
            memo: row.description,
          },
          {
            id: `jl-b-c-${Math.random()}`,
            accountId: creditAcc.id,
            accountCode: creditAcc.code,
            accountName: creditAcc.name,
            debit: 0,
            credit: row.amount,
            memo: row.description,
          },
        ],
      });

      if (res.success) postedCount++;
      else if (res.error) errors.push(`Row ${row.rowNumber}: ${res.error}`);
    });

    addAuditLog({
      action: 'IMPORT_TRANSACTIONS',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Batch transaction upload executed. Successfully posted ${postedCount}/${validRows.length} transactions.`,
      status: postedCount > 0 ? 'SUCCESS' : 'FAILED',
      payloadSummary: `Total Rows: ${parsedRows.length} | Valid: ${validRows.length} | Posted: ${postedCount}`,
    });

    return { success: postedCount > 0, postedCount, errors };
  };

  // Reconcile Bank Line
  const reconcileBankLine = (statementId: string, accountId: string, matchingEntryId?: string) => {
    setBankStatements((prev) =>
      prev.map((line) =>
        line.id === statementId
          ? { ...line, reconciled: true, matchedJournalEntryId: matchingEntryId }
          : line
      )
    );
    addAuditLog({
      action: 'RECONCILE_BANK',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Reconciled Bank Statement Line ${statementId} with General Ledger`,
      status: 'SUCCESS',
      payloadSummary: `Account ID: ${accountId} | Matched JE: ${matchingEntryId || 'Manual Approval'}`,
    });
    return { success: true };
  };

  // Import Bank Statements
  const importBankStatements = (
    lines: Omit<BankStatementLine, 'id' | 'tenantId' | 'reconciled'>[]
  ) => {
    if (lines.length === 0) return { success: false, count: 0, error: 'No statement lines provided.' };

    const newLines: BankStatementLine[] = lines.map((l, idx) => ({
      ...l,
      id: `bs-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      tenantId: activeTenant.id,
      reconciled: false,
    }));

    setBankStatements((prev) => [...newLines, ...prev]);

    addAuditLog({
      action: 'IMPORT_TRANSACTIONS',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Imported ${newLines.length} bank statement feed lines into ${activeTenant.name}`,
      status: 'SUCCESS',
      payloadSummary: `Feed Lines Count: ${newLines.length}`,
    });

    return { success: true, count: newLines.length };
  };

  // Auto-Match & Reconcile Engine
  const autoMatchAndReconcile = () => {
    const activeStatements = bankStatements.filter(
      (b) => b.tenantId === activeTenant.id && !b.reconciled
    );
    const activeJEs = journalEntries.filter(
      (je) => je.tenantId === activeTenant.id && je.status === 'POSTED'
    );

    let matchedCount = 0;
    const updatedStatementIds = new Map<string, string>(); // statementId -> matchedJEId

    activeStatements.forEach((stmt) => {
      // Find matching JE
      const matchedJE = activeJEs.find((je) => {
        if (Array.from(updatedStatementIds.values()).includes(je.id)) return false;

        // Check lines for amount match
        return je.lines.some((l) => {
          if (stmt.amount > 0) {
            // Deposit -> Debit to Cash (or Revenue)
            return Math.abs((l.debit || 0) - stmt.amount) < 0.01;
          } else {
            // Withdrawal -> Credit to Cash
            return Math.abs((l.credit || 0) - Math.abs(stmt.amount)) < 0.01;
          }
        });
      });

      if (matchedJE) {
        updatedStatementIds.set(stmt.id, matchedJE.id);
        matchedCount++;
      }
    });

    if (matchedCount > 0) {
      setBankStatements((prev) =>
        prev.map((b) => {
          if (updatedStatementIds.has(b.id)) {
            return {
              ...b,
              reconciled: true,
              matchedJournalEntryId: updatedStatementIds.get(b.id),
            };
          }
          return b;
        })
      );

      addAuditLog({
        action: 'RECONCILE_BANK',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Smart AI Auto-Match Engine reconciled ${matchedCount} bank statement lines automatically.`,
        status: 'SUCCESS',
        payloadSummary: `Automated Matches: ${matchedCount}`,
      });
    }

    return { success: true, matchedCount };
  };

  // Create GL Journal Entry and Reconcile Bank Line on the fly
  const createAndReconcileGLLine = (
    statementId: string,
    accountCode: string,
    memo?: string
  ) => {
    const stmt = bankStatements.find((b) => b.id === statementId);
    if (!stmt) return { success: false, error: 'Bank statement line not found.' };

    const currentAccs = accountsMap[activeTenant.id] || [];
    const cashAcc = currentAccs.find((a) => a.code === '1010') || currentAccs[0];
    const targetAcc = currentAccs.find((a) => a.code === accountCode);

    if (!targetAcc) {
      return { success: false, error: `Account code "${accountCode}" not found in Chart of Accounts.` };
    }

    const absAmount = Math.abs(stmt.amount);
    const description = memo || stmt.description;

    let lines = [];
    if (stmt.amount < 0) {
      // Outflow / Expense
      lines = [
        { id: `jl-c1-${Date.now()}`, accountId: targetAcc.id, accountCode: targetAcc.code, accountName: targetAcc.name, debit: absAmount, credit: 0, memo: description },
        { id: `jl-c2-${Date.now()}`, accountId: cashAcc.id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: 0, credit: absAmount, memo: description },
      ];
    } else {
      // Inflow / Income
      lines = [
        { id: `jl-c1-${Date.now()}`, accountId: cashAcc.id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: absAmount, credit: 0, memo: description },
        { id: `jl-c2-${Date.now()}`, accountId: targetAcc.id, accountCode: targetAcc.code, accountName: targetAcc.name, debit: 0, credit: absAmount, memo: description },
      ];
    }

    const res = postJournalEntry({
      tenantId: activeTenant.id,
      organizationId: activeOrganization ? activeOrganization.id : undefined,
      branchId: activeBranch ? activeBranch.id : undefined,
      date: stmt.date,
      description: `Bank Reconciliation Quick Post: ${description}`,
      reference: stmt.reference || `BANK-REC-${Date.now().toString().slice(-6)}`,
      pluginId: activePlugin,
      lines,
    });

    if (res.success && res.entryId) {
      reconcileBankLine(statementId, cashAcc.id, res.entryId);
      return { success: true };
    }

    return { success: false, error: res.error || 'Failed to create GL journal entry.' };
  };

  // Fixed Asset Depreciation Run
  const runDepreciationForTenant = (asOfDate: string) => {
    const tenantAssets = fixedAssets.filter((fa) => fa.tenantId === activeTenant.id);
    if (tenantAssets.length === 0) {
      return { success: false, totalDepreciation: 0, entriesCreated: 0 };
    }

    let totalDep = 0;
    let entriesCreated = 0;

    const currentAccs = accountsMap[activeTenant.id] || [];
    const depExpenseAcc = currentAccs.find((a) => a.code === '5030') || currentAccs.find((a) => a.type === 'EXPENSE');
    const accumDepAcc = currentAccs.find((a) => a.code === '1510') || currentAccs.find((a) => a.type === 'ASSET' && a.name.includes('Accumulated'));

    tenantAssets.forEach((asset) => {
      const monthlyDep = Math.round(((asset.cost - asset.salvageValue) / (asset.usefulLifeYears * 12)) * 100) / 100;
      totalDep += monthlyDep;

      if (depExpenseAcc && accumDepAcc) {
        postJournalEntry({
          tenantId: activeTenant.id,
          organizationId: activeOrganization?.id,
          branchId: activeBranch?.id,
          date: asOfDate,
          description: `Monthly Depreciation Run for Asset ${asset.assetNumber} (${asset.name})`,
          reference: `DEP-${asset.assetNumber}`,
          pluginId: activePlugin,
          lines: [
            { id: `jl-dep-1-${asset.id}`, accountId: depExpenseAcc.id, accountCode: depExpenseAcc.code, accountName: depExpenseAcc.name, debit: monthlyDep, credit: 0 },
            { id: `jl-dep-2-${asset.id}`, accountId: accumDepAcc.id, accountCode: accumDepAcc.code, accountName: accumDepAcc.name, debit: 0, credit: monthlyDep },
          ],
        });
        entriesCreated++;
      }
    });

    setFixedAssets((prev) =>
      prev.map((fa) => {
        if (fa.tenantId === activeTenant.id) {
          const monthlyDep = Math.round(((fa.cost - fa.salvageValue) / (fa.usefulLifeYears * 12)) * 100) / 100;
          return {
            ...fa,
            accumulatedDepreciation: fa.accumulatedDepreciation + monthlyDep,
            netBookValue: fa.netBookValue - monthlyDep,
            lastDepreciationDate: asOfDate,
          };
        }
        return fa;
      })
    );

    addAuditLog({
      action: 'RUN_DEPRECIATION',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Executed monthly depreciation run for ${tenantAssets.length} fixed assets. Total depreciated: ${totalDep} ${activeTenant.currency}`,
      status: 'SUCCESS',
      payloadSummary: `Journal Entries Created: ${entriesCreated} | Asset Net Book Values Updated`,
    });

    return { success: true, totalDepreciation: totalDep, entriesCreated };
  };

  // Create New Account
  const createAccount = (accountData: Omit<Account, 'id' | 'tenantId' | 'balance'>) => {
    const current = accountsMap[activeTenant.id] || [];
    if (current.some((a) => a.code === accountData.code)) {
      return { success: false, error: `Account code "${accountData.code}" already exists in ${activeTenant.name}` };
    }

    const newAcc: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
      tenantId: activeTenant.id,
      balance: 0,
    };

    setAccountsMap((prev) => ({
      ...prev,
      [activeTenant.id]: [...(prev[activeTenant.id] || []), newAcc],
    }));

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created new Chart of Account ${newAcc.code} - ${newAcc.name} (${newAcc.type})`,
      status: 'SUCCESS',
      payloadSummary: `Currency: ${newAcc.currency} | Initial Balance: 0.00`,
    });

    return { success: true };
  };

  // Create New Tenant
  const createTenant = (tenantData: Omit<Tenant, 'id' | 'organizations'>) => {
    const tId = `t-${Date.now()}`;
    const orgId = `org-${Date.now()}`;
    const branchId = `br-${Date.now()}`;

    const newTenant: Tenant = {
      ...tenantData,
      id: tId,
      organizations: [
        {
          id: orgId,
          tenantId: tId,
          name: `${tenantData.name} Main HQ`,
          code: `${tenantData.code}-HQ`,
          branches: [
            { id: branchId, organizationId: orgId, tenantId: tId, name: 'Primary Branch', code: 'BR-01' },
          ],
        },
      ],
    };

    setTenants((prev) => [...prev, newTenant]);

    // Initialize Default Standard Chart of Accounts
    const defaultAccounts: Account[] = [
      { id: `acc-${tId}-1`, tenantId: tId, code: '1010', name: 'Primary Operating Bank Account', type: 'ASSET', currency: tenantData.currency, balance: 100000 },
      { id: `acc-${tId}-2`, tenantId: tId, code: '1100', name: 'Trade Accounts Receivable', type: 'ASSET', currency: tenantData.currency, balance: 25000 },
      { id: `acc-${tId}-3`, tenantId: tId, code: '2010', name: 'Trade Accounts Payable', type: 'LIABILITY', currency: tenantData.currency, balance: 15000 },
      { id: `acc-${tId}-4`, tenantId: tId, code: '2200', name: 'Local Statutory Tax Payable', type: 'LIABILITY', currency: tenantData.currency, balance: 2500 },
      { id: `acc-${tId}-5`, tenantId: tId, code: '3010', name: 'Contributed Share Capital', type: 'EQUITY', currency: tenantData.currency, balance: 100000 },
      { id: `acc-${tId}-6`, tenantId: tId, code: '4010', name: 'Core Commercial Sales Revenue', type: 'REVENUE', currency: tenantData.currency, balance: 35000 },
      { id: `acc-${tId}-7`, tenantId: tId, code: '5010', name: 'Operating & Admin Expenses', type: 'EXPENSE', currency: tenantData.currency, balance: 22500 },
    ];

    setAccountsMap((prev) => ({ ...prev, [tId]: defaultAccounts }));
    setActiveTenantId(tId);
  };

  // Execute Sweep Transfer between Treasury Accounts
  const executeSweepTransfer = (fromAccId: string, toAccId: string, amount: number) => {
    if (amount <= 0) return { success: false, error: 'Sweep amount must be greater than zero.' };
    const fromAcc = treasuryAccounts.find((a) => a.id === fromAccId);
    const toAcc = treasuryAccounts.find((a) => a.id === toAccId);
    if (!fromAcc || !toAcc) return { success: false, error: 'Treasury account not found.' };
    if (fromAcc.balance < amount) return { success: false, error: 'Insufficient liquid funds in source treasury vault.' };

    setTreasuryAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccId) return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );

    // Auto-post GL journal entry for sweep liquidity transfer
    postJournalEntry({
      tenantId: activeTenantId,
      organizationId: activeOrgId || undefined,
      branchId: activeBranchId || undefined,
      date: new Date().toISOString().split('T')[0],
      description: `Liquidity Sweep Transfer: ${fromAcc.name} to ${toAcc.name}`,
      reference: `SWEEP-${Date.now().toString().slice(-6)}`,
      pluginId: activePlugin,
      lines: [
        { id: 'sw-1', accountId: 'acc-1001', accountCode: '1010', accountName: `Operating Cash - ${toAcc.name}`, debit: amount, credit: 0, memo: 'Destination Treasury Credit' },
        { id: 'sw-2', accountId: 'acc-1001', accountCode: '1010', accountName: `Operating Cash - ${fromAcc.name}`, debit: 0, credit: amount, memo: 'Source Treasury Debit' },
      ],
    });

    return { success: true };
  };

  // FP&A Budget Updater
  const updateDepartmentBudget = (budgetId: string, newAnnualAmount: number) => {
    setDepartmentBudgets((prev) =>
      prev.map((b) => {
        if (b.id === budgetId) {
          const variance = newAnnualAmount - b.ytdActual;
          const variancePct = Math.round((variance / newAnnualAmount) * 1000) / 10;
          let status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED' = 'ON_TRACK';
          if (variancePct < 0) status = 'EXCEEDED';
          else if (variancePct < 25) status = 'WARNING';
          return {
            ...b,
            annualBudget: newAnnualAmount,
            variance,
            variancePercentage: variancePct,
            status,
          };
        }
        return b;
      })
    );
  };

  // Governance Approval Decision Processor
  const processApprovalDecision = (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setApprovalItems((prev) =>
      prev.map((item) => (item.id === approvalId ? { ...item, status: decision } : item))
    );

    const targetItem = approvalItems.find((i) => i.id === approvalId);
    if (targetItem) {
      setAuditLogs((prev) => [
        {
          id: `log-app-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorEmail: userEmail,
          actorRole: activeRole,
          actionType: decision === 'APPROVED' ? 'POST_ENTRY' : 'REVERSE_ENTRY',
          resourceType: targetItem.entityType,
          resourceId: targetItem.referenceNumber,
          changesDescription: `Governance Approval decision ${decision} for ${targetItem.description} ($${targetItem.amount.toLocaleString()})`,
          hash: `hash-app-${Math.random().toString(36).substring(2, 9)}`,
          tenantId: activeTenantId,
        },
        ...prev,
      ]);
    }
  };

  // Post Tax Settlement Voucher
  const postTaxSettlementVoucher = (jurisdictionId: string) => {
    const jur = taxJurisdictions.find((j) => j.id === jurisdictionId);
    if (!jur || jur.ytdAccruedTax <= 0) {
      return { success: false, error: 'No accrued tax liability available for settlement.' };
    }

    const res = postJournalEntry({
      tenantId: activeTenantId,
      organizationId: activeOrgId || undefined,
      branchId: activeBranchId || undefined,
      date: new Date().toISOString().split('T')[0],
      description: `Tax Settlement Voucher Payment: ${jur.name} (${jur.code})`,
      reference: `TAX-PAY-${jur.code}`,
      pluginId: activePlugin,
      lines: [
        { id: 'tx-v1', accountId: 'acc-2002', accountCode: '2200', accountName: 'Tax Payable', debit: jur.ytdAccruedTax, credit: 0, memo: 'Clear Accrued Tax Liability' },
        { id: 'tx-v2', accountId: 'acc-1001', accountCode: '1010', accountName: 'Operating Cash - Chase Bank', debit: 0, credit: jur.ytdAccruedTax, memo: 'Tax Authority Disbursement' },
      ],
    });

    if (res.success) {
      setTaxJurisdictions((prev) =>
        prev.map((j) => (j.id === jurisdictionId ? { ...j, ytdAccruedTax: 0 } : j))
      );
    }

    return res;
  };

  // Trial Balance Generator

  const trialBalance: TrialBalanceRow[] = useMemo(() => {
    const current = accountsMap[activeTenant.id] || [];
    return current.map((acc) => {
      let debit = 0;
      let credit = 0;
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        if (acc.balance >= 0) debit = acc.balance;
        else credit = Math.abs(acc.balance);
      } else {
        if (acc.balance >= 0) credit = acc.balance;
        else debit = Math.abs(acc.balance);
      }

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        type: acc.type,
        debit,
        credit,
        netBalance: acc.balance,
      };
    });
  }, [accountsMap, activeTenant.id]);

  // Balance Sheet Data Generator
  const balanceSheet: BalanceSheetData = useMemo(() => {
    const assets = trialBalance.filter((r) => r.type === 'ASSET');
    const liabilities = trialBalance.filter((r) => r.type === 'LIABILITY');
    const equity = trialBalance.filter((r) => r.type === 'EQUITY');

    const totalAssets = assets.reduce((sum, a) => sum + (a.debit - a.credit), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.credit - l.debit), 0);
    const rawEquity = equity.reduce((sum, e) => sum + (e.credit - e.debit), 0);

    const revenues = trialBalance.filter((r) => r.type === 'REVENUE');
    const expenses = trialBalance.filter((r) => r.type === 'EXPENSE');
    const totalRev = revenues.reduce((sum, r) => sum + (r.credit - r.debit), 0);
    const totalExp = expenses.reduce((sum, ex) => sum + (ex.debit - ex.credit), 0);
    const retainedEarnings = totalRev - totalExp;

    const totalEquity = rawEquity + retainedEarnings;
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      assets,
      liabilities,
      equity,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      retainedEarnings: Math.round(retainedEarnings * 100) / 100,
      isBalanced,
    };
  }, [trialBalance]);

  // Income Statement Generator
  const incomeStatement: IncomeStatementData = useMemo(() => {
    const revenues = trialBalance.filter((r) => r.type === 'REVENUE');
    const expenses = trialBalance.filter((r) => r.type === 'EXPENSE');

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.credit - r.debit), 0);
    const totalExpense = expenses.reduce((sum, ex) => sum + (ex.debit - ex.credit), 0);
    const netIncome = totalRevenue - totalExpense;
    const grossMarginPercentage = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    return {
      revenues,
      expenses,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      grossMarginPercentage: Math.round(grossMarginPercentage * 10) / 10,
    };
  }, [trialBalance]);

  // Statutory Regulatory Report Generator
  const statutoryReport: StatutoryReportData = useMemo(() => {
    const pluginId = activeTenant.pluginId;

    if (pluginId === 'in_gst') {
      const cgstAcc = accounts.find((a) => a.code === '2201')?.balance || 0;
      const sgstAcc = accounts.find((a) => a.code === '2202')?.balance || 0;
      const igstAcc = accounts.find((a) => a.code === '2203')?.balance || 0;
      const itcAcc = accounts.find((a) => a.code === '1301')?.balance || 0;

      const totalTaxLiability = cgstAcc + sgstAcc + igstAcc;

      return {
        pluginId: 'in_gst',
        title: 'GSTR-1 Monthly Tax Return & Tax Ledger Breakdown',
        standardName: 'India Goods and Services Tax (GST Act 2017)',
        period: 'August 2026 Monthly Filing',
        tenantName: activeTenant.name,
        taxIdentifier: 'GSTIN: 29AABCB1234H1Z5',
        taxBreakdown: [
          { name: 'Central GST (CGST @ 9%)', taxableAmount: cgstAcc / 0.09, taxCollected: cgstAcc, taxPaidCredit: itcAcc * 0.5, netLiability: cgstAcc - itcAcc * 0.5 },
          { name: 'State GST (SGST @ 9%)', taxableAmount: sgstAcc / 0.09, taxCollected: sgstAcc, taxPaidCredit: itcAcc * 0.5, netLiability: sgstAcc - itcAcc * 0.5 },
          { name: 'Integrated GST (IGST @ 18%)', taxableAmount: igstAcc / 0.18, taxCollected: igstAcc, taxPaidCredit: 0, netLiability: igstAcc },
        ],
        summaryNotes: [
          'All intra-state supplies matched against HSN/SAC codes.',
          `Total Gross Output GST Collected: ₹${totalTaxLiability.toLocaleString('en-IN')}`,
          `Input Tax Credit (ITC) Available: ₹${itcAcc.toLocaleString('en-IN')}`,
          `Net Tax Payable to Government Treasury: ₹${Math.max(0, totalTaxLiability - itcAcc).toLocaleString('en-IN')}`,
        ],
        isCompliant: true,
      };
    } else if (pluginId === 'eu_ifrs') {
      const vatAcc = accounts.find((a) => a.code === '2100')?.balance || 0;
      const reverseChargeAcc = accounts.find((a) => a.code === '2110')?.balance || 0;

      return {
        pluginId: 'eu_ifrs',
        title: 'IAS-1 Financial Statement & EU VAT Return Schedule',
        standardName: 'EU IFRS Compliance & Cross-Border VAT Directive 2006/112/EC',
        period: 'Q3 2026 Quarterly Return',
        tenantName: activeTenant.name,
        taxIdentifier: 'VAT ID: NL882910291B01',
        taxBreakdown: [
          { name: 'Standard EU VAT (21% Rate)', taxableAmount: vatAcc / 0.21, taxCollected: vatAcc, taxPaidCredit: reverseChargeAcc, netLiability: vatAcc - reverseChargeAcc },
          { name: 'Reverse Charge Intra-Community B2B', taxableAmount: reverseChargeAcc / 0.21, taxCollected: 0, taxPaidCredit: reverseChargeAcc, netLiability: 0 },
        ],
        summaryNotes: [
          'Prepared under IAS-1 Presentation of Financial Statements.',
          'Cross-border B2B digital services correctly categorized under Reverse Charge Mechanism.',
          `Total Payable to Tax Authority: €${Math.max(0, vatAcc - reverseChargeAcc).toLocaleString()}`,
        ],
        isCompliant: true,
      };
    } else {
      // US GAAP
      const salesTaxAcc = accounts.find((a) => a.code === '2200')?.balance || 0;
      return {
        pluginId: 'us_gaap',
        title: 'SEC Form 10-K & State Sales Tax Return Schedule',
        standardName: 'US GAAP (FASB ASC 606 Revenue Recognition)',
        period: 'Q3 2026 Fiscal Quarter',
        tenantName: activeTenant.name,
        taxIdentifier: 'EIN: 12-3456789',
        taxBreakdown: [
          { name: 'New York State Sales Tax (8.875%)', taxableAmount: salesTaxAcc / 0.08875, taxCollected: salesTaxAcc, taxPaidCredit: 0, netLiability: salesTaxAcc },
        ],
        summaryNotes: [
          'Full compliance with FASB ASC 606 revenue performance obligations.',
          `State Sales Tax collected and accrued: $${salesTaxAcc.toLocaleString()}`,
          'Depreciation calculated under Straight-Line method (ASC 360).',
        ],
        isCompliant: true,
      };
    }
  }, [activeTenant, accounts]);

  // Sub-ledger: Customer Invoices (AR)
  const createInvoice = (invoiceData: Omit<CustomerInvoice, 'id' | 'invoiceNumber' | 'amountPaid' | 'status'>) => {
    const invId = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInv: CustomerInvoice = {
      ...invoiceData,
      id: invId,
      invoiceNumber,
      amountPaid: 0,
      status: 'UNPAID',
    };
    setInvoices((prev) => [newInv, ...prev]);

    const currentAccs = accountsMap[activeTenant.id] || [];
    const arAcc = currentAccs.find((a) => a.code === '1100') || currentAccs.find((a) => a.type === 'ASSET');
    const revAcc = currentAccs.find((a) => a.code === invoiceData.revenueAccountCode) || currentAccs.find((a) => a.type === 'REVENUE');
    const taxAcc = currentAccs.find((a) => a.code === '2200') || currentAccs.find((a) => a.code === '2100') || currentAccs.find((a) => a.code === '2201');

    if (arAcc && revAcc) {
      const lines: JournalLine[] = [
        { id: `jl-inv-ar-${Date.now()}`, accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: invoiceData.totalAmount, credit: 0, memo: `Invoice ${invoiceNumber}` },
      ];

      if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach((item, idx) => {
          lines.push({
            id: `jl-inv-rev-${Date.now()}-${idx}`,
            accountId: revAcc.id,
            accountCode: revAcc.code,
            accountName: revAcc.name,
            debit: 0,
            credit: item.amount,
            memo: item.description || `Sales Revenue Line ${idx + 1}`,
          });
        });
      } else {
        lines.push({ id: `jl-inv-rev-${Date.now()}`, accountId: revAcc.id, accountCode: revAcc.code, accountName: revAcc.name, debit: 0, credit: invoiceData.subtotal, memo: `Sales Revenue` });
      }

      if (invoiceData.taxTotal > 0 && taxAcc) {
        lines.push({ id: `jl-inv-tax-${Date.now()}`, accountId: taxAcc.id, accountCode: taxAcc.code, accountName: taxAcc.name, debit: 0, credit: invoiceData.taxTotal, memo: `Sales Tax Output` });
      }

      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: invoiceData.issueDate,
        description: `Customer Invoice #${invoiceNumber} issued to ${invoiceData.customerName}`,
        reference: invoiceNumber,
        pluginId: activePlugin,
        lines,
      });
    }

    addAuditLog({
      action: 'INVOICE_CREATE',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created Customer Invoice #${invoiceNumber} for ${invoiceData.customerName} (${invoiceData.totalAmount} ${activeTenant.currency})`,
      status: 'SUCCESS',
      payloadSummary: `Due Date: ${invoiceData.dueDate} | Revenue Acc: ${invoiceData.revenueAccountCode}`,
    });

    return { success: true };
  };

  const receiveInvoicePayment = (invoiceId: string, paymentAmount: number, bankAccountId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found.' };

    const newAmountPaid = inv.amountPaid + paymentAmount;
    const newStatus = newAmountPaid >= inv.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, amountPaid: newAmountPaid, status: newStatus } : i))
    );

    const currentAccs = accountsMap[activeTenant.id] || [];
    const bankAcc = currentAccs.find((a) => a.id === bankAccountId || a.code === '1010');
    const arAcc = currentAccs.find((a) => a.code === '1100');

    if (bankAcc && arAcc) {
      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: new Date().toISOString().split('T')[0],
        description: `Payment Receipt for Invoice #${inv.invoiceNumber} from ${inv.customerName}`,
        reference: `PMT-${inv.invoiceNumber}`,
        pluginId: activePlugin,
        lines: [
          { id: `jl-pmt-b-${Date.now()}`, accountId: bankAcc.id, accountCode: bankAcc.code, accountName: bankAcc.name, debit: paymentAmount, credit: 0, memo: 'Cash Receipt' },
          { id: `jl-pmt-ar-${Date.now()}`, accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: 0, credit: paymentAmount, memo: 'Clear AR' },
        ],
      });
    }

    addAuditLog({
      action: 'INVOICE_PAYMENT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Received payment of ${paymentAmount} ${activeTenant.currency} for Invoice #${inv.invoiceNumber}`,
      status: 'SUCCESS',
      payloadSummary: `New Status: ${newStatus} | Remaining Balance: ${inv.totalAmount - newAmountPaid}`,
    });

    return { success: true };
  };

  // Sub-ledger: Vendor Bills (AP)
  const createVendorBill = (billData: Omit<VendorBill, 'id' | 'billNumber' | 'amountPaid' | 'status'>) => {
    const billId = `bill-${Date.now()}`;
    const billNumber = `BILL-${new Date().getFullYear()}-${String(vendorBills.length + 1).padStart(3, '0')}`;
    const newBill: VendorBill = {
      ...billData,
      id: billId,
      billNumber,
      amountPaid: 0,
      status: 'APPROVED',
    };
    setVendorBills((prev) => [newBill, ...prev]);

    const currentAccs = accountsMap[activeTenant.id] || [];
    const apAcc = currentAccs.find((a) => a.code === '2010') || currentAccs.find((a) => a.type === 'LIABILITY');

    if (apAcc && billData.items.length > 0) {
      const lines: JournalLine[] = billData.items.map((item, idx) => {
        const expAcc = currentAccs.find((a) => a.code === item.expenseAccountCode) || currentAccs.find((a) => a.type === 'EXPENSE');
        return {
          id: `jl-bill-exp-${Date.now()}-${idx}`,
          accountId: expAcc ? expAcc.id : 'acc-5001',
          accountCode: expAcc ? expAcc.code : '5010',
          accountName: expAcc ? expAcc.name : 'Operating Expenses',
          debit: item.amount,
          credit: 0,
          memo: item.description,
        };
      });
      lines.push({
        id: `jl-bill-ap-${Date.now()}`,
        accountId: apAcc.id,
        accountCode: apAcc.code,
        accountName: apAcc.name,
        debit: 0,
        credit: billData.totalAmount,
        memo: `Vendor Bill ${billNumber}`,
      });

      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: billData.billDate,
        description: `Vendor Bill #${billNumber} received from ${billData.vendorName}`,
        reference: billNumber,
        pluginId: activePlugin,
        lines,
      });
    }

    addAuditLog({
      action: 'BILL_CREATE',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Created Vendor Bill #${billNumber} for ${billData.vendorName} (${billData.totalAmount} ${activeTenant.currency})`,
      status: 'SUCCESS',
      payloadSummary: `Due Date: ${billData.dueDate}`,
    });

    return { success: true };
  };

  const payVendorBill = (billId: string, paymentAmount: number, bankAccountId: string) => {
    const bill = vendorBills.find((b) => b.id === billId);
    if (!bill) return { success: false, error: 'Vendor Bill not found.' };

    const newAmountPaid = bill.amountPaid + paymentAmount;
    const newStatus = newAmountPaid >= bill.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    setVendorBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, amountPaid: newAmountPaid, status: newStatus } : b))
    );

    const currentAccs = accountsMap[activeTenant.id] || [];
    const bankAcc = currentAccs.find((a) => a.id === bankAccountId || a.code === '1010');
    const apAcc = currentAccs.find((a) => a.code === '2010');

    if (bankAcc && apAcc) {
      postJournalEntry({
        tenantId: activeTenant.id,
        organizationId: activeOrganization?.id,
        branchId: activeBranch?.id,
        date: new Date().toISOString().split('T')[0],
        description: `Disbursement Payment for Bill #${bill.billNumber} to ${bill.vendorName}`,
        reference: `DISB-${bill.billNumber}`,
        pluginId: activePlugin,
        lines: [
          { id: `jl-disb-ap-${Date.now()}`, accountId: apAcc.id, accountCode: apAcc.code, accountName: apAcc.name, debit: paymentAmount, credit: 0, memo: 'Clear AP' },
          { id: `jl-disb-b-${Date.now()}`, accountId: bankAcc.id, accountCode: bankAcc.code, accountName: bankAcc.name, debit: 0, credit: paymentAmount, memo: 'Bank Disbursement' },
        ],
      });
    }

    addAuditLog({
      action: 'BILL_PAYMENT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Disbursed ${paymentAmount} ${activeTenant.currency} for Vendor Bill #${bill.billNumber}`,
      status: 'SUCCESS',
      payloadSummary: `New Status: ${newStatus}`,
    });

    return { success: true };
  };

  // Period Lock & Year-End Closing
  const toggleFiscalPeriodStatus = (periodId: string, newStatus: 'OPEN' | 'LOCKED' | 'CLOSED') => {
    setFiscalPeriods((prev) =>
      prev.map((p) => (p.id === periodId ? { ...p, status: newStatus } : p))
    );
    addAuditLog({
      action: 'PERIOD_LOCK',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Changed Fiscal Period status for ${periodId} to ${newStatus}`,
      status: 'SUCCESS',
      payloadSummary: `Status Transition -> ${newStatus}`,
    });
  };

  const executeYearEndClose = (fiscalYear: string) => {
    const netInc = incomeStatement.netIncome;

    if (Math.abs(netInc) < 0.01) {
      return { success: false, netIncomeClosed: 0, error: 'Net income is 0. Nothing to close.' };
    }

    const currentAccs = accountsMap[activeTenant.id] || [];
    const retainedAcc = currentAccs.find((a) => a.code === '3200') || currentAccs.find((a) => a.type === 'EQUITY');
    if (!retainedAcc) return { success: false, netIncomeClosed: 0, error: 'Retained Earnings account (3200) not found.' };

    const lines: JournalLine[] = [];
    incomeStatement.revenues.forEach((r, idx) => {
      lines.push({
        id: `jl-ye-r-${idx}`,
        accountId: r.accountId,
        accountCode: r.accountCode,
        accountName: r.accountName,
        debit: r.netBalance,
        credit: 0,
        memo: `Year-End Close ${fiscalYear} Zeroing Revenue`,
      });
    });
    incomeStatement.expenses.forEach((ex, idx) => {
      lines.push({
        id: `jl-ye-ex-${idx}`,
        accountId: ex.accountId,
        accountCode: ex.accountCode,
        accountName: ex.accountName,
        debit: 0,
        credit: ex.netBalance,
        memo: `Year-End Close ${fiscalYear} Zeroing Expense`,
      });
    });

    if (netInc > 0) {
      lines.push({
        id: `jl-ye-re`,
        accountId: retainedAcc.id,
        accountCode: retainedAcc.code,
        accountName: retainedAcc.name,
        debit: 0,
        credit: netInc,
        memo: `Transfer Net Profit to Retained Earnings`,
      });
    } else {
      lines.push({
        id: `jl-ye-re`,
        accountId: retainedAcc.id,
        accountCode: retainedAcc.code,
        accountName: retainedAcc.name,
        debit: Math.abs(netInc),
        credit: 0,
        memo: `Transfer Net Loss from Retained Earnings`,
      });
    }

    const res = postJournalEntry({
      tenantId: activeTenant.id,
      organizationId: activeOrganization?.id,
      branchId: activeBranch?.id,
      date: `${fiscalYear}-12-31`,
      description: `AUTOMATED YEAR-END FINANCIAL CLOSE ${fiscalYear} - Retained Earnings Transfer`,
      reference: `CLOSE-${fiscalYear}`,
      pluginId: activePlugin,
      lines,
    });

    if (res.success) {
      addAuditLog({
        action: 'YEAR_END_CLOSE',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: `Successfully executed Year-End Close for FY ${fiscalYear}. Net Income transferred to Retained Earnings: ${netInc} ${activeTenant.currency}`,
        status: 'SUCCESS',
        payloadSummary: `Journal Entry Posted: ${res.entryId}`,
      });
    }

    return { success: res.success, netIncomeClosed: netInc, entryId: res.entryId, error: res.error };
  };

  // Cash Flow Statement Calculator
  const cashFlowStatement: CashFlowData = useMemo(() => {
    const netInc = incomeStatement.netIncome;
    const depExpense = trialBalance.find((r) => r.accountCode === '5030')?.debit || 0;
    const arChange = trialBalance.find((r) => r.accountCode === '1100')?.netBalance || 0;
    const apChange = trialBalance.find((r) => r.accountCode === '2010')?.netBalance || 0;

    const opAct = [
      { category: 'Net Income (P&L)', amount: netInc },
      { category: 'Add Back: Non-Cash Depreciation Expense', amount: depExpense },
      { category: 'Change in Accounts Receivable (AR)', amount: -arChange },
      { category: 'Change in Accounts Payable (AP)', amount: apChange },
    ];
    const totalOperating = opAct.reduce((sum, item) => sum + item.amount, 0);

    const invAct = [
      { category: 'Capital Expenditures (Fixed Assets Acquisition)', amount: -35000 },
    ];
    const totalInvesting = invAct.reduce((sum, item) => sum + item.amount, 0);

    const finAct = [
      { category: 'Capital Contributions / Stock Issued', amount: 50000 },
    ];
    const totalFinancing = finAct.reduce((sum, item) => sum + item.amount, 0);

    return {
      operatingActivities: opAct,
      investingActivities: invAct,
      financingActivities: finAct,
      totalOperatingCashFlow: Math.round(totalOperating * 100) / 100,
      totalInvestingCashFlow: Math.round(totalInvesting * 100) / 100,
      totalFinancingCashFlow: Math.round(totalFinancing * 100) / 100,
      netCashChange: Math.round((totalOperating + totalInvesting + totalFinancing) * 100) / 100,
    };
  }, [incomeStatement, trialBalance]);

  // Financial Health Ratios Calculator
  const financialRatios: FinancialRatiosData = useMemo(() => {
    const totLiab = balanceSheet.totalLiabilities;
    const totEq = balanceSheet.totalEquity;
    const cash = trialBalance.find((r) => r.accountCode === '1010')?.debit || 0;
    const ar = trialBalance.find((r) => r.accountCode === '1100')?.debit || 0;
    const rev = incomeStatement.totalRevenue;
    const netInc = incomeStatement.netIncome;

    const currentRatio = totLiab > 0 ? (cash + ar) / totLiab : 3.5;
    const quickRatio = totLiab > 0 ? cash / totLiab : 2.5;
    const workingCapital = (cash + ar) - totLiab;
    const debtToEquity = totEq > 0 ? totLiab / totEq : 0.2;
    const grossMarginPercentage = incomeStatement.grossMarginPercentage;
    const netProfitMarginPercentage = rev > 0 ? (netInc / rev) * 100 : 0;
    const receivablesTurnover = ar > 0 ? rev / ar : 4.2;

    let healthScore = 88;
    if (currentRatio < 1.0) healthScore -= 20;
    if (netProfitMarginPercentage < 0) healthScore -= 25;
    if (debtToEquity > 1.5) healthScore -= 15;

    return {
      currentRatio: Math.round(currentRatio * 100) / 100,
      quickRatio: Math.round(quickRatio * 100) / 100,
      workingCapital: Math.round(workingCapital * 100) / 100,
      debtToEquity: Math.round(debtToEquity * 100) / 100,
      grossMarginPercentage: Math.round(grossMarginPercentage * 10) / 10,
      netProfitMarginPercentage: Math.round(netProfitMarginPercentage * 10) / 10,
      receivablesTurnover: Math.round(receivablesTurnover * 10) / 10,
      healthScore: Math.max(0, Math.min(100, healthScore)),
    };
  }, [balanceSheet, trialBalance, incomeStatement]);

  // Corporate Entity Consolidation Calculator
  const consolidatedFinancials: ConsolidatedEntityData = useMemo(() => {
    const presentationCurrency = 'USD';
    const entities = tenants.map((tenant) => {
      const accs = accountsMap[tenant.id] || [];
      const revAccs = accs.filter((a) => a.type === 'REVENUE');
      const assetAccs = accs.filter((a) => a.type === 'ASSET');

      const localRevenue = revAccs.reduce((sum, a) => sum + a.balance, 0);
      const localAssets = assetAccs.reduce((sum, a) => sum + a.balance, 0);

      let fxRate = 1.0;
      if (tenant.currency === 'EUR') fxRate = FX_RATES.find((r) => r.fromCurrency === 'EUR')?.rate || 1.0925;
      else if (tenant.currency === 'INR') fxRate = FX_RATES.find((r) => r.fromCurrency === 'INR')?.rate || 0.01205;

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        localCurrency: tenant.currency,
        fxRateToPresentation: fxRate,
        localRevenue: Math.round(localRevenue * 100) / 100,
        translatedRevenue: Math.round(localRevenue * fxRate * 100) / 100,
        localAssets: Math.round(localAssets * 100) / 100,
        translatedAssets: Math.round(localAssets * fxRate * 100) / 100,
      };
    });

    const totalConsolidatedRevenue = entities.reduce((sum, e) => sum + e.translatedRevenue, 0);
    const totalConsolidatedAssets = entities.reduce((sum, e) => sum + e.translatedAssets, 0);
    const intercompanyEliminationAmount = 25000;
    const netConsolidatedRevenue = totalConsolidatedRevenue - intercompanyEliminationAmount;

    return {
      presentationCurrency,
      entities,
      totalConsolidatedRevenue: Math.round(totalConsolidatedRevenue * 100) / 100,
      totalConsolidatedAssets: Math.round(totalConsolidatedAssets * 100) / 100,
      intercompanyEliminationAmount,
      netConsolidatedRevenue: Math.round(netConsolidatedRevenue * 100) / 100,
    };
  }, [tenants, accountsMap]);

  // User Management & Provisioning Functions
  const createEnterpriseUser = (
    userData: Omit<EnterpriseUser, 'id' | 'createdAt' | 'lastLogin' | 'apiTokenCount'>
  ) => {
    const isSuperUser = activeRole === 'super_user';
    const isEntityAdmin = activeRole === 'entity_admin' || activeRole === 'admin';

    if (!isSuperUser && !isEntityAdmin) {
      const msg = 'HTTP 403 FORBIDDEN: User provisioning requires Super User or Entity Admin privileges.';
      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: 'Unauthorized attempt to provision new enterprise user.',
        status: 'FORBIDDEN',
        payloadSummary: msg,
      });
      return { success: false, error: msg };
    }

    if (!isSuperUser && userData.defaultRole === 'super_user') {
      const msg = 'HTTP 403 FORBIDDEN: Only Global Super Users can grant Super User access.';
      return { success: false, error: msg };
    }

    const newId = `usr-${Date.now()}`;
    const newUser: EnterpriseUser = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      apiTokenCount: 1,
    };

    setEnterpriseUsers((prev) => [newUser, ...prev]);

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Provisioned user "${newUser.name}" (${newUser.email}) as ${newUser.defaultRole} by ${activeRole}.`,
      status: 'SUCCESS',
      payloadSummary: `User ID: ${newId}`,
    });

    return { success: true };
  };

  const updateUserStatus = (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setEnterpriseUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated status for user ${userId} to ${newStatus}.`,
      status: 'SUCCESS',
    });
  };

  const updateUserRoleAndScopes = (
    userId: string,
    defaultRole: Role,
    tenantScopes: TenantAccessScope[]
  ) => {
    const isSuperUser = activeRole === 'super_user';
    if (!isSuperUser && defaultRole === 'super_user') {
      addAuditLog({
        action: 'CREATE_TENANT',
        tenantId: activeTenant.id,
        userRole: activeRole,
        userEmail,
        details: 'Denied elevation to Super User by non-Super User role.',
        status: 'FORBIDDEN',
      });
      return;
    }

    setEnterpriseUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, defaultRole, tenantScopes } : u))
    );

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Updated role (${defaultRole}) and tenant access scopes for user ${userId}.`,
      status: 'SUCCESS',
    });
  };

  const toggleUserMfa = (userId: string) => {
    setEnterpriseUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, mfaEnabled: !u.mfaEnabled } : u))
    );
  };

  const deleteEnterpriseUser = (userId: string) => {
    setEnterpriseUsers((prev) => prev.filter((u) => u.id !== userId));

    addAuditLog({
      action: 'CREATE_TENANT',
      tenantId: activeTenant.id,
      userRole: activeRole,
      userEmail,
      details: `Deleted user record ${userId}.`,
      status: 'SUCCESS',
    });
  };

  const hasPermission = (permission: PermissionKey, tenantId?: string): boolean => {
    const targetTenant = tenantId || activeTenant.id;
    if (activeRole === 'super_user') return true;
    if (activeRole === 'admin' && permission !== 'users:manage_global') return true;

    const user = enterpriseUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
    if (user && user.status === 'SUSPENDED') return false;

    const scope = user?.tenantScopes.find((s) => s.tenantId === targetTenant);
    const effectiveRole = scope ? scope.role : activeRole;

    if (effectiveRole === 'super_user') return true;
    if (effectiveRole === 'entity_admin' && permission !== 'users:manage_global') return true;

    const roleDef = customRoles.find((r) => r.code === effectiveRole);
    if (roleDef && roleDef.permissions.includes(permission)) return true;

    if (scope && scope.customPermissions && scope.customPermissions.includes(permission)) {
      return true;
    }

    return false;
  };

  return (
    <AccountingContext.Provider
      value={{
        tenants,
        activeTenant,
        activeOrganization,
        activeBranch,
        activeRole,
        userEmail,
        activePlugin,
        setActiveTenantId,
        setActiveOrganizationId: setActiveOrgId,
        setActiveBranchId,
        setActiveRole,
        setUserEmail,
        accounts,
        journalEntries,
        bankStatements,
        fixedAssets,
        auditLogs,
        invoices,
        vendorBills,
        fiscalPeriods,
        treasuryAccounts,
        departmentBudgets,
        approvalItems,
        taxJurisdictions,
        enterpriseUsers,
        customRoles,

        createEnterpriseUser,
        updateUserStatus,
        updateUserRoleAndScopes,
        toggleUserMfa,
        deleteEnterpriseUser,
        hasPermission,

        postJournalEntry,
        reverseJournalEntry,
        batchUploadTransactions,
        createInvoice,
        receiveInvoicePayment,
        createVendorBill,
        payVendorBill,
        toggleFiscalPeriodStatus,
        executeYearEndClose,
        executeSweepTransfer,
        updateDepartmentBudget,
        processApprovalDecision,
        postTaxSettlementVoucher,
        reconcileBankLine,
        importBankStatements,
        autoMatchAndReconcile,
        createAndReconcileGLLine,

        runDepreciationForTenant,
        createTenant,
        createAccount,
        trialBalance,
        balanceSheet,
        incomeStatement,
        statutoryReport,
        cashFlowStatement,
        financialRatios,
        consolidatedFinancials,
        parseCsvOrJsonUpload,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const ctx = useContext(AccountingContext);
  if (!ctx) throw new Error('useAccounting must be used within an AccountingProvider');
  return ctx;
};
