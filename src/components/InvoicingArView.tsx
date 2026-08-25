import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
import {
  Plus,
  Receipt,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Building2,
  GraduationCap,
  HeartPulse,
  Briefcase,
  FileSpreadsheet,
  Package,
  FileText,
  BookmarkPlus,
  ArrowRight,
  BookOpen,
  Download,
  FileDown,
  Search,
  Filter,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CustomerContact, ProductServiceItem, InvoiceTemplate } from '../types';
import { InvoiceTemplatesView } from './InvoiceTemplatesView';
import { CustomerArStatementView } from './CustomerArStatementView';
import { ReceiveCustomerPaymentModal } from './ReceiveCustomerPaymentModal';
import { CustomerOpeningBalanceModal } from './CustomerOpeningBalanceModal';
import { BulkInvoiceGenerationView } from './BulkInvoiceGenerationView';
import {
  exportInvoicesToExcel,
  exportArAgingScheduleToExcel,
  downloadCsvFile,
} from '../utils/excelExport';

interface LineItemRow {
  id: string;
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  unitOfMeasure?: string;
}

interface InvoicingArViewProps {
  preSelectedCustomer?: CustomerContact | null;
  preSelectedProduct?: ProductServiceItem | null;
  initialCustomerForStatement?: CustomerContact | null;
  initialSubTab?: 'INVOICES' | 'BULK_GENERATION' | 'STATEMENTS' | 'TEMPLATES';
  onNavigateToHelpCenter?: () => void;
}

export const InvoicingArView: React.FC<InvoicingArViewProps> = ({
  preSelectedCustomer,
  preSelectedProduct,
  initialCustomerForStatement,
  initialSubTab,
  onNavigateToHelpCenter,
}) => {
  const { tr, t } = useLanguage();
  const {
    activeTenant,
    invoices,
    customers,
    productsServices,
    customAttributeDefinitions,
    createInvoice,
    receiveInvoicePayment,
    accounts,
    invoiceTemplates,
    bulkInvoiceBatches,
    createInvoiceTemplate,
    incrementTemplateUsage,
    paymentReceipts,
    openingBalances,
    getCustomerStatementData,
    processOnlineInvoicePayment,
  } = useAccounting();

  // Online Payment Modal state
  const [onlinePayInvoice, setOnlinePayInvoice] = useState<any | null>(null);
  const [onlinePayMethod, setOnlinePayMethod] = useState<'CREDIT_CARD' | 'ACH' | 'APPLE_PAY'>('CREDIT_CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessingOnlinePay, setIsProcessingOnlinePay] = useState(false);
  const [onlinePaySuccessMessage, setOnlinePaySuccessMessage] = useState<string | null>(null);

  // Tab View: Invoices Register vs Bulk Generation vs Customer Statements vs Invoice Templates Master
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'BULK_GENERATION' | 'STATEMENTS' | 'TEMPLATES'>(() => {
    if (initialSubTab) return initialSubTab;
    if (initialCustomerForStatement) return 'STATEMENTS';
    return 'INVOICES';
  });
  const [selectedStatementCustomerId, setSelectedStatementCustomerId] = useState<string | null>(() => {
    if (initialCustomerForStatement) return initialCustomerForStatement.id;
    return null;
  });

  // Search & Filter state for Invoices Register
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'>('ALL');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Global modals
  const [showGlobalPaymentModal, setShowGlobalPaymentModal] = useState(false);
  const [showGlobalOpeningModal, setShowGlobalOpeningModal] = useState(false);
  const [globalPaymentTargetInvoiceId, setGlobalPaymentTargetInvoiceId] = useState<string | undefined>(undefined);
  const [globalPaymentTargetCustomerId, setGlobalPaymentTargetCustomerId] = useState<string | undefined>(undefined);

  const [showCreateModal, setShowCreateModal] = useState(Boolean(preSelectedCustomer || preSelectedProduct));
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<string | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Template Quick Selector inside Modal
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [appliedTemplateBanner, setAppliedTemplateBanner] = useState<string | null>(null);

  // Save current lines as template modal state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTmplCode, setSaveTmplCode] = useState('');
  const [saveTmplName, setSaveTmplName] = useState('');
  const [saveTmplCategory, setSaveTmplCategory] = useState('Professional Services');
  const [saveTmplTerms, setSaveTmplTerms] = useState(30);

  // Selected Customer from Master Directory
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preSelectedCustomer?.id || '');
  const [customerName, setCustomerName] = useState(preSelectedCustomer?.name || '');
  const [customerEmail, setCustomerEmail] = useState(preSelectedCustomer?.email || '');
  const [dueDate, setDueDate] = useState('2026-09-15');
  const [revenueAccCode, setRevenueAccCode] = useState(preSelectedProduct?.defaultRevenueAccountCode || '4010');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [customerAttributesSnapshot, setCustomerAttributesSnapshot] = useState<Record<string, any>>(
    preSelectedCustomer?.customAttributes || {}
  );

  // Dynamic Line Items State with initial prefill if preSelectedProduct is supplied
  const [lineItems, setLineItems] = useState<LineItemRow[]>(() => {
    if (preSelectedProduct) {
      return [
        {
          id: `item-init-${Date.now()}`,
          productId: preSelectedProduct.id,
          productCode: preSelectedProduct.code,
          description: `[${preSelectedProduct.code}] ${preSelectedProduct.name}${preSelectedProduct.description ? ` - ${preSelectedProduct.description}` : ''}`,
          quantity: 1,
          unitPrice: preSelectedProduct.unitPrice,
          taxRate: preSelectedProduct.defaultTaxRate !== undefined ? preSelectedProduct.defaultTaxRate : 10,
          unitOfMeasure: preSelectedProduct.unitOfMeasure || 'unit',
        },
      ];
    }
    return [
      { id: 'item-1', description: 'Enterprise Services', quantity: 1, unitPrice: 5000, taxRate: 10, unitOfMeasure: 'unit' },
    ];
  });

  // Form State for Payment Receipt
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');

  const tenantInvoices = invoices.filter((i) => i.tenantId === activeTenant.id);

  // Filtered Invoices according to search and status
  const filteredInvoices = useMemo(() => {
    return tenantInvoices.filter((inv) => {
      const term = invoiceSearchTerm.toLowerCase().trim();
      const snap = inv.customerAttributesSnapshot || {};
      const matchSearch =
        !term ||
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        (inv.customerEmail && inv.customerEmail.toLowerCase().includes(term)) ||
        (snap.unit_number && String(snap.unit_number).toLowerCase().includes(term)) ||
        (snap.student_roll_no && String(snap.student_roll_no).toLowerCase().includes(term)) ||
        (snap.patient_mrn && String(snap.patient_mrn).toLowerCase().includes(term));

      let matchStatus = true;
      if (invoiceStatusFilter === 'UNPAID') matchStatus = inv.status === 'UNPAID';
      else if (invoiceStatusFilter === 'PARTIALLY_PAID') matchStatus = inv.status === 'PARTIALLY_PAID';
      else if (invoiceStatusFilter === 'PAID') matchStatus = inv.status === 'PAID';
      else if (invoiceStatusFilter === 'OVERDUE') {
        const isPastDue = new Date(inv.dueDate).getTime() < new Date('2026-08-14').getTime();
        const hasUnpaid = inv.totalAmount - inv.amountPaid > 0.001;
        matchStatus = isPastDue && hasUnpaid;
      }

      return matchSearch && matchStatus;
    });
  }, [tenantInvoices, invoiceSearchTerm, invoiceStatusFilter]);

  // Export handlers
  const handleExportInvoicesExcel = (useFilteredOnly = false) => {
    const listToExport = useFilteredOnly && (invoiceSearchTerm || invoiceStatusFilter !== 'ALL')
      ? filteredInvoices
      : tenantInvoices;
    
    exportInvoicesToExcel({
      tenant: activeTenant,
      invoices: listToExport,
      customers,
      asOfDate: '2026-08-14',
    });
    setShowExportDropdown(false);
  };

  const handleExportAgingExcel = () => {
    exportArAgingScheduleToExcel({
      tenant: activeTenant,
      customers,
      invoices: tenantInvoices,
      paymentReceipts,
      openingBalances,
      getCustomerStatementData,
      asOfDate: '2026-08-14',
    });
    setShowExportDropdown(false);
  };

  const handleExportInvoicesCsv = () => {
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Customer Email',
      'Issue Date',
      'Due Date',
      'Currency',
      'Subtotal',
      'Tax Total',
      'Total Amount',
      'Amount Paid',
      'Balance Due',
      'Status',
      'Revenue Account',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.customerName,
      inv.customerEmail,
      inv.issueDate,
      inv.dueDate,
      inv.currency,
      inv.subtotal,
      inv.taxTotal,
      inv.totalAmount,
      inv.amountPaid,
      Math.max(0, inv.totalAmount - inv.amountPaid),
      inv.status,
      inv.revenueAccountCode || '4010',
    ]);

    downloadCsvFile(`${activeTenant.code || 'ERP'}_Invoices_${new Date().toISOString().split('T')[0]}`, headers, rows);
    setShowExportDropdown(false);
  };

  // Available customers for current tenant
  const availableCustomers = useMemo(() => {
    return customers.filter(
      (c) => !c.tenantId || c.tenantId === activeTenant.id || c.tenantId === 't-acme-us'
    );
  }, [customers, activeTenant.id]);

  // Available products & services for current tenant
  const availableProducts = useMemo(() => {
    return productsServices.filter(
      (p) => !p.tenantId || p.tenantId === activeTenant.id || p.tenantId === 't-acme-us'
    );
  }, [productsServices, activeTenant.id]);

  // When selected customer changes from dropdown
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerAttributesSnapshot({});
      return;
    }
    const cust = availableCustomers.find((c) => c.id === custId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerEmail(cust.email);
      const attrs = cust.customAttributes || {};
      setCustomerAttributesSnapshot(attrs);

      // Auto-compute payment due date based on payment terms
      const days = cust.paymentTermsDays || 30;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      setDueDate(targetDate.toISOString().split('T')[0]);

      // Smart Invoicing Prefill based on Industry Attributes
      const prefillItems: LineItemRow[] = [];

      // 1. Housing Society prefill: Area * Rate
      if (attrs.carpet_area_sqft && attrs.maintenance_rate_sqft) {
        const area = Number(attrs.carpet_area_sqft);
        const rate = Number(attrs.maintenance_rate_sqft);
        prefillItems.push({
          id: `item-maint-${Date.now()}`,
          description: `Monthly Society Maintenance Fee (${area} sq ft @ ${activeTenant.currency} ${rate}/sq ft - Unit ${attrs.unit_number || cust.code})`,
          quantity: area,
          unitPrice: rate,
          taxRate: 5,
        });
        if (attrs.parking_bays && Number(attrs.parking_bays) > 0) {
          prefillItems.push({
            id: `item-park-${Date.now()}`,
            description: `Parking Bay Maintenance Allocation (${attrs.parking_bays} Bay(s))`,
            quantity: Number(attrs.parking_bays),
            unitPrice: 50,
            taxRate: 5,
          });
        }
      }
      // 2. School prefill: Grade & Transport
      else if (attrs.grade_batch || attrs.student_roll_no) {
        prefillItems.push({
          id: `item-tuition-${Date.now()}`,
          description: `Academic Tuition Fee (Roll: ${attrs.student_roll_no || cust.code} | Grade: ${attrs.grade_batch || 'General'})`,
          quantity: 1,
          unitPrice: 3500,
          taxRate: 0,
        });
        if (attrs.bus_route) {
          prefillItems.push({
            id: `item-bus-${Date.now()}`,
            description: `Transport Route Fee: ${attrs.bus_route}`,
            quantity: 1,
            unitPrice: 450,
            taxRate: 0,
          });
        }
      }
      // 3. Hospital prefill: Bed Tariff
      else if (attrs.patient_mrn || attrs.daily_bed_tariff) {
        const bedRate = Number(attrs.daily_bed_tariff) || 350;
        prefillItems.push({
          id: `item-bed-${Date.now()}`,
          description: `Inpatient Bed & Nursing Care (MRN: ${attrs.patient_mrn || cust.code} | Ward: ${attrs.ward_bed_no || 'General'})`,
          quantity: 3,
          unitPrice: bedRate,
          taxRate: 0,
        });
        prefillItems.push({
          id: `item-doc-${Date.now()}`,
          description: `Attending Specialist Consultation (${attrs.attending_doctor || 'Dr. On Duty'})`,
          quantity: 1,
          unitPrice: 250,
          taxRate: 0,
        });
      }

      if (prefillItems.length > 0) {
        setLineItems(prefillItems);
      }
    }
  };

  // Line Item Calculations
  const calculatedItems = lineItems.map((item) => {
    const qty = Math.max(0, item.quantity || 0);
    const price = Math.max(0, item.unitPrice || 0);
    const lineAmt = qty * price;
    const tax = Math.round(lineAmt * ((item.taxRate || 0) / 100) * 100) / 100;
    return { ...item, quantity: qty, unitPrice: price, amount: lineAmt, taxAmount: tax };
  });

  const calculatedSubtotal = calculatedItems.reduce((acc, curr) => acc + curr.amount, 0);
  const calculatedTaxTotal = calculatedItems.reduce((acc, curr) => acc + curr.taxAmount, 0);
  const calculatedTotalAmount = calculatedSubtotal + calculatedTaxTotal;

  const addLineItem = (prod?: ProductServiceItem) => {
    if (prod) {
      setLineItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: prod.id,
          productCode: prod.code,
          description: `[${prod.code}] ${prod.name}${prod.description ? ` - ${prod.description}` : ''}`,
          quantity: 1,
          unitPrice: prod.unitPrice,
          taxRate: prod.defaultTaxRate !== undefined ? prod.defaultTaxRate : 10,
          unitOfMeasure: prod.unitOfMeasure || 'unit',
        },
      ]);
    } else {
      setLineItems((prev) => [
        ...prev,
        { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, taxRate: 10, unitOfMeasure: 'unit' },
      ]);
    }
  };

  const handleProductSelect = (rowId: string, prodId: string) => {
    if (!prodId) {
      setLineItems((prev) =>
        prev.map((item) => (item.id === rowId ? { ...item, productId: undefined, productCode: undefined } : item))
      );
      return;
    }
    const prod = availableProducts.find((p) => p.id === prodId);
    if (prod) {
      setLineItems((prev) =>
        prev.map((item) => {
          if (item.id !== rowId) return item;
          return {
            ...item,
            productId: prod.id,
            productCode: prod.code,
            description: `[${prod.code}] ${prod.name}${prod.description ? ` - ${prod.description}` : ''}`,
            unitPrice: prod.unitPrice,
            taxRate: prod.defaultTaxRate !== undefined ? prod.defaultTaxRate : 10,
            unitOfMeasure: prod.unitOfMeasure || 'unit',
          };
        })
      );
    }
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItemRow, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // --- Invoice Template Helpers ---
  const handleApplyTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplateId(template.id);
    setAppliedTemplateBanner(`Applied: "${template.name}" (${template.code}) — ${template.items.length} line item(s)`);

    if (template.items && template.items.length > 0) {
      setLineItems(
        template.items.map((i, idx) => ({
          id: `item-from-tmpl-${Date.now()}-${idx}`,
          productId: i.productId,
          productCode: i.productCode,
          description: i.description,
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          taxRate: i.taxRate ?? 10,
          unitOfMeasure: i.unitOfMeasure || 'unit',
        }))
      );
    }

    if (template.defaultRevenueAccountCode) {
      setRevenueAccCode(template.defaultRevenueAccountCode);
    }

    if (template.defaultNotes) {
      setInvoiceNotes(template.defaultNotes);
    }

    if (template.defaultPaymentTermsDays !== undefined) {
      const d = new Date();
      d.setDate(d.getDate() + template.defaultPaymentTermsDays);
      setDueDate(d.toISOString().split('T')[0]);
    }

    if (template.defaultCustomerId) {
      handleSelectCustomer(template.defaultCustomerId);
    }

    incrementTemplateUsage(template.id);
  };

  const handleLaunchInvoiceFromTemplate = (template: InvoiceTemplate) => {
    setActiveTab('INVOICES');
    handleApplyTemplate(template);
    setShowCreateModal(true);
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTmplName.trim() || !saveTmplCode.trim()) return;

    const res = createInvoiceTemplate({
      tenantId: activeTenant.id,
      code: saveTmplCode.trim().toUpperCase(),
      name: saveTmplName.trim(),
      category: saveTmplCategory,
      defaultPaymentTermsDays: saveTmplTerms,
      defaultRevenueAccountCode: revenueAccCode,
      defaultNotes: invoiceNotes,
      defaultCustomerId: selectedCustomerId || undefined,
      isActive: true,
      items: lineItems.map((li) => ({
        id: `tmpl-item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        productId: li.productId,
        productCode: li.productCode,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        taxRate: li.taxRate,
        unitOfMeasure: li.unitOfMeasure || 'unit',
        amount: li.quantity * li.unitPrice,
      })),
    });

    if (res.success && res.template) {
      setSelectedTemplateId(res.template.id);
      setAppliedTemplateBanner(`Saved & Applied: "${res.template.name}" (${res.template.code})`);
      setShowSaveTemplateModal(false);
      setSaveTmplCode('');
      setSaveTmplName('');
    }
  };

  // AR Metrics
  const totalAr = tenantInvoices.reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);
  const paidAr = tenantInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const overdueAr = tenantInvoices
    .filter((i) => (i.status === 'OVERDUE' || (i.status === 'UNPAID' && new Date(i.dueDate) < new Date())))
    .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    createInvoice({
      tenantId: activeTenant.id,
      customerId: selectedCustomerId || undefined,
      customerName,
      customerEmail,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      currency: activeTenant.currency,
      items: calculatedItems.map((ci) => ({
        productId: ci.productId,
        productCode: ci.productCode,
        description: ci.description || 'Line Item',
        quantity: ci.quantity,
        unitOfMeasure: ci.unitOfMeasure,
        unitPrice: ci.unitPrice,
        amount: ci.amount,
        taxRate: ci.taxRate,
      })),
      subtotal: calculatedSubtotal,
      taxTotal: calculatedTaxTotal,
      totalAmount: calculatedTotalAmount,
      revenueAccountCode: revenueAccCode,
      notes: invoiceNotes,
      customerAttributesSnapshot: Object.keys(customerAttributesSnapshot).length > 0 ? customerAttributesSnapshot : undefined,
    });

    setShowCreateModal(false);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerAttributesSnapshot({});
    setInvoiceNotes('');
    setLineItems([
      { id: `item-${Date.now()}`, description: 'Enterprise Services', quantity: 1, unitPrice: 5000, taxRate: 10, unitOfMeasure: 'unit' },
    ]);
  };

  const handleReceivePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    const pmt = parseFloat(paymentAmount) || 0;
    receiveInvoicePayment(paymentModalInvoice, pmt, bankAccountId || accounts[0]?.id || '');
    setPaymentModalInvoice(null);
    setPaymentAmount('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-400" />
            {t('tab_invoicing_ar', 'Accounts Receivable (AR) & Customer Invoicing')}
          </h1>
          <p className="text-xs text-slate-400">
            {tr('Issue invoices linked to Customer Directory profiles, configure reusable line item templates, record opening FY balances, and inspect consolidated AR statements.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="invoicing-bulk-generate-btn"
            onClick={() => setActiveTab('BULK_GENERATION')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            {tr('Bulk Generate Invoices')}
          </button>

          <button
            id="invoicing-record-opening-bal-btn"
            onClick={() => setShowGlobalOpeningModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold rounded-lg text-xs border border-amber-500/30 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            {tr('Record FY Opening Balance')}
          </button>

          <button
            id="invoicing-receive-payment-btn"
            onClick={() => {
              setGlobalPaymentTargetInvoiceId(undefined);
              setGlobalPaymentTargetCustomerId(undefined);
              setShowGlobalPaymentModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            {tr('Receive Customer Payment')}
          </button>

          <button
            onClick={() => {
              setShowCreateModal(true);
              if (availableCustomers.length > 0 && !selectedCustomerId) {
                handleSelectCustomer(availableCustomers[0].id);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {tr('Issue Customer Invoice')}
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          id="tab-invoices-register"
          onClick={() => setActiveTab('INVOICES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'INVOICES'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{tr('Customer Invoices & Aging')}</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'INVOICES' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {tenantInvoices.length}
          </span>
        </button>

        <button
          id="tab-bulk-invoicing"
          onClick={() => setActiveTab('BULK_GENERATION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'BULK_GENERATION'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>{tr('Bulk Invoicing Engine')}</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'BULK_GENERATION' ? 'bg-indigo-800 text-indigo-100' : 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
            }`}
          >
            {bulkInvoiceBatches.length} {tr('Runs')}
          </span>
        </button>

        <button
          id="tab-customer-statements"
          onClick={() => setActiveTab('STATEMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'STATEMENTS'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <User className="w-4 h-4 text-emerald-400" />
          <span>{tr('Customer 360 & Consolidated AR')}</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'STATEMENTS' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {customers.length}
          </span>
        </button>

        <button
          id="tab-invoice-templates"
          onClick={() => setActiveTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'TEMPLATES'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{tr('Invoice Templates Master')}</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'TEMPLATES' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {invoiceTemplates.length}
          </span>
        </button>

        {onNavigateToHelpCenter && (
          <button
            onClick={onNavigateToHelpCenter}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>{tr('Help Guide & Simulator')}</span>
          </button>
        )}
      </div>

      {activeTab === 'BULK_GENERATION' ? (
        <BulkInvoiceGenerationView
          onNavigateToTemplates={() => setActiveTab('TEMPLATES')}
          onNavigateToInvoice={(invId) => {
            setActiveTab('INVOICES');
            setExpandedInvoiceId(invId);
          }}
        />
      ) : activeTab === 'STATEMENTS' ? (
        <CustomerArStatementView
          initialCustomerId={selectedStatementCustomerId}
          onNavigateToCreateInvoice={(cust) => {
            if (cust) {
              handleSelectCustomer(cust.id);
            }
            setShowCreateModal(true);
          }}
        />
      ) : activeTab === 'TEMPLATES' ? (
        <InvoiceTemplatesView onSelectTemplateForInvoice={handleLaunchInvoiceFromTemplate} />
      ) : (
        <>
          {/* AR Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{tr('Total AR Outstanding')}</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {activeTenant.currency} {totalAr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tr('Uncollected customer balances')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{tr('Collected Cash Payments')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {activeTenant.currency} {paidAr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tr('Settled into General Ledger bank accounts')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{tr('Overdue Receivables Risk')}</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {activeTenant.currency} {overdueAr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tr('Invoices past standard payment terms')}</p>
        </div>
      </div>

      {/* Invoices Table & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>{tr('Customer Invoice Register')}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {filteredInvoices.length} {tr('of')} {tenantInvoices.length} {tr('Invoices')}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {tr('Sub-ledger transaction register with aging analysis and GL integration')}
              </p>
            </div>
          </div>

          {/* Table Actions: Search, Status Filter, Excel Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="invoice-search-input"
                type="text"
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                placeholder={tr('Search invoice #, customer...')}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {invoiceSearchTerm && (
                <button
                  onClick={() => setInvoiceSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              {(['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setInvoiceStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    invoiceStatusFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL' ? t('common_all', 'All') : tr(st)}
                </button>
              ))}
            </div>

            {/* Excel Export Dropdown */}
            <div className="relative">
              <button
                id="btn-export-invoices-excel"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shadow-2xs cursor-pointer"
                title={tr('Export customer invoices & aging to Excel (.xlsx)')}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{tr('Export to Excel')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              {showExportDropdown && (
                <div
                  className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 py-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    {tr('Export Financial Data')}
                  </div>

                  <button
                    id="export-invoices-register-excel"
                    onClick={() => handleExportInvoicesExcel(false)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-100">{tr('Customer Invoices Register (.xlsx)')}</div>
                      <div className="text-[10px] text-slate-400">{tr('All invoices with line items & aging status')}</div>
                    </div>
                  </button>

                  <button
                    id="export-aging-matrix-excel"
                    onClick={handleExportAgingExcel}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-100">{tr('AR Aging Matrix & Schedule (.xlsx)')}</div>
                      <div className="text-[10px] text-slate-400">{tr('Customer portfolio matrix + itemized aging buckets')}</div>
                    </div>
                  </button>

                  {invoiceSearchTerm || invoiceStatusFilter !== 'ALL' ? (
                    <button
                      id="export-filtered-invoices-excel"
                      onClick={() => handleExportInvoicesExcel(true)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer border-t border-slate-800"
                    >
                      <Filter className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-100">{tr('Filtered Invoices Only (.xlsx)')}</div>
                        <div className="text-[10px] text-slate-400">{tr('Export active search & filter records')}</div>
                      </div>
                    </button>
                  ) : null}

                  <button
                    id="export-invoices-csv"
                    onClick={handleExportInvoicesCsv}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer border-t border-slate-800"
                  >
                    <FileDown className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-100">{tr('Export Invoices as CSV (.csv)')}</div>
                      <div className="text-[10px] text-slate-400">{tr('Standard delimited format for pipelines')}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="p-3">{tr('Invoice #')}</th>
                <th className="p-3">{tr('Customer / Entity')}</th>
                <th className="p-3">{tr('Issue Date')}</th>
                <th className="p-3">{tr('Due Date')}</th>
                <th className="p-3 text-right">{tr('Total Amount')}</th>
                <th className="p-3 text-right">{tr('Amount Paid')}</th>
                <th className="p-3 text-center">{t('common_status', 'Status')}</th>
                <th className="p-3 text-right">{t('common_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    {tenantInvoices.length === 0
                      ? `No customer invoices found for ${activeTenant.name}. Click "Issue Customer Invoice" above.`
                      : `No invoices match your search or filter criteria.`}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isUnpaid = inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID';
                  const isExpanded = expandedInvoiceId === inv.id;
                  const snap = inv.customerAttributesSnapshot || {};

                  return (
                    <React.Fragment key={inv.id}>
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-indigo-400 flex items-center gap-2">
                          <button
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                            title={tr('Toggle itemized line items')}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <span>{inv.invoiceNumber}</span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded font-mono">
                            {inv.items?.length || 1} line(s)
                          </span>
                        </td>
                        <td className="p-3 font-sans font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>{inv.customerName}</span>
                            {snap.unit_number && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                Unit: {snap.unit_number}
                              </span>
                            )}
                            {snap.student_roll_no && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                Roll: {snap.student_roll_no}
                              </span>
                            )}
                            {snap.patient_mrn && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                                MRN: {snap.patient_mrn}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">{inv.customerEmail}</div>
                        </td>
                        <td className="p-3 text-slate-400">{inv.issueDate}</td>
                        <td className="p-3 text-slate-400">{inv.dueDate}</td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          {inv.currency} {inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right text-emerald-400">
                          {inv.currency} {inv.amountPaid.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {tr(inv.status)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            {isUnpaid ? (
                              <>
                                <button
                                  onClick={() => {
                                    setOnlinePayInvoice(inv);
                                    setOnlinePaySuccessMessage(null);
                                  }}
                                  className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-[11px] font-semibold shadow transition cursor-pointer flex items-center gap-1"
                                  title={tr('Open Online Customer Checkout & Payment Portal')}
                                >
                                  <CreditCard className="w-3 h-3" /> {tr('Pay Online')}
                                </button>
                                <button
                                  onClick={() => {
                                    setGlobalPaymentTargetInvoiceId(inv.id);
                                    setGlobalPaymentTargetCustomerId(inv.customerId);
                                    setShowGlobalPaymentModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold shadow transition cursor-pointer"
                                >
                                  {tr('Receive Payment')}
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-500 text-[11px] px-2 py-0.5">{tr('Settled')}</span>
                            )}
                            <button
                              onClick={() => {
                                setSelectedStatementCustomerId(inv.customerId);
                                setActiveTab('STATEMENTS');
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
                              title={tr('View Customer Statement')}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ITEM DETAILS ROW */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={8} className="p-4 space-y-3">
                            <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                              <span>Invoice #{inv.invoiceNumber} — Itemized Line Items</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Subtotal: {inv.currency} {inv.subtotal?.toLocaleString() || inv.totalAmount.toLocaleString()} | Tax: {inv.currency} {inv.taxTotal?.toLocaleString() || 0}
                              </span>
                            </div>

                            {/* Snapshot of Custom Attributes */}
                            {Object.keys(snap).length > 0 && (
                              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 flex-wrap text-xs">
                                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                                  Captured Attributes Snapshot:
                                </span>
                                {Object.entries(snap).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono"
                                  >
                                    <strong className="text-slate-400">{k}:</strong> {String(v)}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                              <table className="w-full text-left text-[11px] text-slate-300">
                                <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[9px]">
                                  <tr>
                                    <th className="p-2">#</th>
                                    <th className="p-2">{tr('Item Description')}</th>
                                    <th className="p-2 text-right">{tr('Qty')}</th>
                                    <th className="p-2 text-right">{tr('Unit Price')}</th>
                                    <th className="p-2 text-right">{tr('Tax Rate')}</th>
                                    <th className="p-2 text-right">{tr('Line Amount')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                  {inv.items && inv.items.length > 0 ? (
                                    inv.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="p-2 text-slate-500">{idx + 1}</td>
                                        <td className="p-2 text-slate-200 font-sans">{item.description}</td>
                                        <td className="p-2 text-right">{item.quantity}</td>
                                        <td className="p-2 text-right">{inv.currency} {item.unitPrice?.toLocaleString()}</td>
                                        <td className="p-2 text-right">{item.taxRate || 0}%</td>
                                        <td className="p-2 text-right font-bold text-slate-100">{inv.currency} {item.amount?.toLocaleString()}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={6} className="p-2 text-center text-slate-500">{tr('Single summary item')}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-400" />{tr('Issue New Customer Invoice')}</h3>
                <p className="text-xs text-slate-400">{tr('Select from pre-configured Invoice Templates, Customer Master directory, or enter custom details.')}</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setAppliedTemplateBanner(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-5">
              {/* QUICK INVOICE TEMPLATE SELECTOR TOOLBAR */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 p-3.5 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>{tr('Apply Pre-configured Invoice Template')}</span>
                  </label>
                  <span className="text-[11px] text-indigo-300/80 font-mono">
                    {invoiceTemplates.length} templates available
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      const tmpl = invoiceTemplates.find((t) => t.id === e.target.value);
                      if (tmpl) handleApplyTemplate(tmpl);
                    }}
                    className="flex-1 min-w-[240px] bg-slate-950 border border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">{tr('-- Choose a Reusable Template --')}</option>
                    {invoiceTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.code}] {t.name} ({t.items?.length || 0} lines • {t.category})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSaveTmplCode(`TMPL-${Date.now().toString().slice(-4)}`);
                      setSaveTmplName(customerName ? `${customerName} Custom Billing` : 'Custom Billing Template');
                      setSaveTmplCategory('Custom');
                      setSaveTmplTerms(30);
                      setShowSaveTemplateModal(true);
                    }}
                    className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title={tr('Save current line items as a new reusable template')}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>{tr('Save Current as Template')}</span>
                  </button>
                </div>

                {appliedTemplateBanner && (
                  <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{appliedTemplateBanner}</span>
                  </div>
                )}
              </div>

              {/* Customer Selection from Directory */}
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" />{tr('Customer Directory Selector')}</label>
                  <span className="text-[11px] text-slate-400">
                    {availableCustomers.length} master profiles available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">{tr('-- Manual / Custom Customer --')}</option>
                      {availableCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{c.code}] {c.name} ({c.category || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      required
                      placeholder={tr('Customer Name')}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <input
                      type="email"
                      required
                      placeholder={tr('Billing Email')}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Customer Dynamic Attributes Chips */}
                {Object.keys(customerAttributesSnapshot).length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Entity Attributes:
                    </span>
                    {Object.entries(customerAttributesSnapshot).map(([k, v]) => {
                      if (v === undefined || v === null || v === '') return null;
                      const def = customAttributeDefinitions.find((d) => d.key === k);
                      const label = def?.name || k;
                      const suffix = def?.unitOrSuffix ? ` ${def.unitOrSuffix}` : '';
                      return (
                        <span
                          key={k}
                          className="text-[11px] px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 font-mono flex items-center gap-1"
                        >
                          <span className="text-slate-400">{label}:</span>
                          <span className="font-bold">{String(v)}{suffix}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Payment Due Date')}</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{tr('Revenue Account Code')}</label>
                  <select
                    value={revenueAccCode}
                    onChange={(e) => setRevenueAccCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="4010">{tr('4010 - Core Operating Revenue')}</option>
                    <option value="4020">{tr('4020 - Consulting & Service Revenue')}</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC LINE ITEMS SECTION */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Invoice Line Items & Catalog Products ({lineItems.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">{tr('Select standard products/services from catalog or type custom line items.')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {availableProducts.length > 0 && (
                      <select
                        onChange={(e) => {
                          const prod = availableProducts.find((p) => p.id === e.target.value);
                          if (prod) {
                            addLineItem(prod);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-950 border border-indigo-500/30 text-indigo-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-400 cursor-pointer"
                      >
                        <option value="" disabled>{tr('+ Insert Catalog Item...')}</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.type}] {p.name} ({activeTenant.currency} {p.unitPrice}/{p.unitOfMeasure || 'unit'})
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => addLineItem()}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tr('Custom Line')}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                  <table className="w-full text-left text-xs text-slate-300 min-w-[650px]">
                    <thead className="text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="pb-2 pl-2 w-44">{tr('Product / Service')}</th>
                        <th className="pb-2">{tr('Description / Memo')}</th>
                        <th className="pb-2 w-28 text-center">{tr('Qty / UoM')}</th>
                        <th className="pb-2 w-28 text-right">{tr('Unit Price')}</th>
                        <th className="pb-2 w-20 text-right">{tr('Tax %')}</th>
                        <th className="pb-2 w-28 text-right pr-2">{tr('Total Amount')}</th>
                        <th className="pb-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {calculatedItems.map((item, index) => (
                        <tr key={item.id} className="group">
                          {/* Catalog Dropdown Selector */}
                          <td className="py-2 pl-2 pr-1">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => handleProductSelect(item.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500 truncate"
                            >
                              <option value="">{tr('-- Custom Item --')}</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({activeTenant.currency} {p.unitPrice})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Description */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              required
                              placeholder={`Item #${index + 1} description`}
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          {/* Quantity & Unit of Measure */}
                          <td className="py-2 px-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                placeholder={tr('unit')}
                                title={tr('Unit of Measure')}
                                value={item.unitOfMeasure || ''}
                                onChange={(e) => updateLineItem(item.id, 'unitOfMeasure', e.target.value)}
                                className="w-14 bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-center font-mono text-slate-400 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </td>

                          {/* Unit Price */}
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-right font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          {/* Tax Rate % */}
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={item.taxRate}
                              onChange={(e) => updateLineItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-right font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-2 pr-2 text-right font-mono font-bold text-slate-100">
                            {activeTenant.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Remove */}
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              disabled={lineItems.length === 1}
                              className={`p-1.5 rounded transition ${
                                lineItems.length === 1
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                              }`}
                              title={tr('Remove item')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TOTALS SUMMARY */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>{tr('Subtotal:')}</span>
                    <span>{activeTenant.currency} {calculatedSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tr('Calculated Tax Total:')}</span>
                    <span>{activeTenant.currency} {calculatedTaxTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-sm pt-2 border-t border-slate-800">
                    <span>{tr('Total Amount Due:')}</span>
                    <span className="text-indigo-400">{activeTenant.currency} {calculatedTotalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-[11px] text-indigo-300">
                <span className="font-semibold">{tr('Automated Double-Entry Posting')}:</span> {tr('Debit Accounts Receivable (1100), Credit Revenue Account')}, {tr('Credit Tax Liability Account')}.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  {t('common_cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {tr('Issue & Post Invoice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              {tr('Receive Payment for Invoice')}
            </h3>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {tr('Payment Amount')} ({activeTenant.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {tr('Deposit to GL Bank Account')}
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  {accounts
                    .filter((a) => a.type === 'ASSET' && a.code.startsWith('10'))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({activeTenant.currency} {a.balance.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300">
                <span className="font-semibold">{tr('Automated Double-Entry Posting')}:</span> {tr('Debit Selected Bank Account, Credit Accounts Receivable (1100).')}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  {t('common_cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {tr('Record & Post Receipt')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVE CURRENT LINES AS REUSABLE TEMPLATE MODAL */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-indigo-400" />{tr('Save Line Items as Template')}</h3>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">{tr('Template Code')}</label>
                <input
                  type="text"
                  required
                  placeholder={tr('e.g. TMPL-CONSULTING-MONTHLY')}
                  value={saveTmplCode}
                  onChange={(e) => setSaveTmplCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{tr('Template Name')}</label>
                <input
                  type="text"
                  required
                  placeholder={tr('e.g. Monthly Retainer Advisory & Architecture')}
                  value={saveTmplName}
                  onChange={(e) => setSaveTmplName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{tr('Category')}</label>
                  <select
                    value={saveTmplCategory}
                    onChange={(e) => setSaveTmplCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Professional Services">{tr('Professional Services')}</option>
                    <option value="SaaS & Subscriptions">{tr('SaaS & Subscriptions')}</option>
                    <option value="Property & Facilities">{tr('Property & Facilities')}</option>
                    <option value="Education">{tr('Education')}</option>
                    <option value="Healthcare">{tr('Healthcare')}</option>
                    <option value="Custom">{tr('Custom')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{tr('Payment Terms')}</label>
                  <select
                    value={saveTmplTerms}
                    onChange={(e) => setSaveTmplTerms(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>{tr('Due on Receipt')}</option>
                    <option value={15}>{tr('Net 15 Days')}</option>
                    <option value={30}>{tr('Net 30 Days')}</option>
                    <option value={45}>{tr('Net 45 Days')}</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">{tr('Will store')}<strong className="text-indigo-300">{lineItems.length} line item(s)</strong>{tr('with pre-set unit prices, tax rates, and GL account bindings.')}</div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
                >{tr('Save Template')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Global Receive Customer Payment Modal */}
      <ReceiveCustomerPaymentModal
        isOpen={showGlobalPaymentModal}
        onClose={() => {
          setShowGlobalPaymentModal(false);
          setGlobalPaymentTargetInvoiceId(undefined);
          setGlobalPaymentTargetCustomerId(undefined);
        }}
        initialInvoiceId={globalPaymentTargetInvoiceId}
        initialCustomerId={globalPaymentTargetCustomerId}
      />

      {/* Global Customer Opening Balance Modal */}
      <CustomerOpeningBalanceModal
        isOpen={showGlobalOpeningModal}
        onClose={() => setShowGlobalOpeningModal(false)}
      />

      {/* ONLINE PAYMENT GATEWAY CHECKOUT MODAL */}
      {onlinePayInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{tr('Online Payment Gateway')}</h3>
                  <p className="text-[11px] text-slate-400">Secure Merchant Checkout for Invoice #{onlinePayInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setOnlinePayInvoice(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {onlinePaySuccessMessage ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">{tr('Payment Authorized & Settled!')}</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">{onlinePaySuccessMessage}</p>
                <button
                  onClick={() => setOnlinePayInvoice(null)}
                  className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                >{tr('Close Checkout')}</button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsProcessingOnlinePay(true);
                  setTimeout(() => {
                    const fee = onlinePayMethod === 'CREDIT_CARD' ? Math.round(onlinePayInvoice.totalAmount * 0.029 + 0.3) : 0;
                    const res = processOnlineInvoicePayment(onlinePayInvoice.id, onlinePayMethod, fee);
                    setIsProcessingOnlinePay(false);
                    if (res.success) {
                      setOnlinePaySuccessMessage(`Captured ${onlinePayInvoice.currency} ${onlinePayInvoice.totalAmount.toLocaleString()} via ${onlinePayMethod}. Auto-reconciled against Accounts Receivable with instant GL double-entry voucher posted.`);
                    }
                  }, 800);
                }}
                className="space-y-4 text-xs"
              >
                {/* INVOICE SUMMARY CARD */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>{tr('Customer Payee:')}</span>
                    <span className="text-white font-sans font-bold">{onlinePayInvoice.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tr('Due Date:')}</span>
                    <span className="text-slate-300">{onlinePayInvoice.dueDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 text-sm">
                    <span className="font-bold">{tr('Total Amount Due:')}</span>
                    <span className="font-black text-emerald-400">
                      {onlinePayInvoice.currency} {(onlinePayInvoice.totalAmount - onlinePayInvoice.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTOR */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">{tr('Select Payment Gateway Method')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlinePayMethod('CREDIT_CARD')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        onlinePayMethod === 'CREDIT_CARD'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-[10px]">{tr('Credit Card')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlinePayMethod('ACH')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        onlinePayMethod === 'ACH'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="text-[10px]">{tr('ACH Bank Wire')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlinePayMethod('APPLE_PAY')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                        onlinePayMethod === 'APPLE_PAY'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="text-[10px]">{tr('Apple / Google Pay')}</span>
                    </button>
                  </div>
                </div>

                {onlinePayMethod === 'CREDIT_CARD' && (
                  <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">{tr('Card Number')}</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">{tr('Expiration')}</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">{tr('CVC / CVV')}</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{tr('Encrypted with Stripe & Level 1 PCI DSS')}</span>
                  </div>
                  <span className="font-bold text-slate-200">{tr('Instant GL Settlement')}</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOnlinePayInvoice(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >{tr('Cancel')}</button>
                  <button
                    type="submit"
                    disabled={isProcessingOnlinePay}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isProcessingOnlinePay ? (
                      <span>{tr('Authorizing Payment...')}</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Pay {onlinePayInvoice.currency} {(onlinePayInvoice.totalAmount - onlinePayInvoice.amountPaid).toLocaleString()} Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
