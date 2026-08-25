import { useLanguage } from '../context/LanguageContext';
import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { InvoiceTemplate, InvoiceTemplateLineItem, ProductServiceItem } from '../types';
import {
  FileText,
  Plus,
  Search,
  Layers,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  DollarSign,
  Package,
  Calendar,
  CreditCard,
  Download,
  Filter,
  Eye,
  Hash,
  BookOpen,
} from 'lucide-react';

interface InvoiceTemplatesViewProps {
  onSelectTemplateForInvoice?: (template: InvoiceTemplate) => void;
}

export const InvoiceTemplatesView: React.FC<InvoiceTemplatesViewProps> = ({
  onSelectTemplateForInvoice,
}) => {
  const { tr, t } = useLanguage();
  const {
    activeTenant,
    invoiceTemplates,
    productsServices,
    customers,
    createInvoiceTemplate,
    updateInvoiceTemplate,
    deleteInvoiceTemplate,
    duplicateInvoiceTemplate,
    activeRole,
  } = useAccounting();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Professional Services');
  const [formTermsDays, setFormTermsDays] = useState(30);
  const [formRevenueAcc, setFormRevenueAcc] = useState('4010');
  const [formNotes, setFormNotes] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Line items inside modal form
  const [formItems, setFormItems] = useState<InvoiceTemplateLineItem[]>([
    {
      id: `tmpl-item-${Date.now()}`,
      description: 'Standard Service Delivery',
      quantity: 1,
      unitPrice: 1000,
      taxRate: 10,
      unitOfMeasure: 'unit',
      amount: 1000,
    },
  ]);

  // Preview Drawer
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    invoiceTemplates.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [invoiceTemplates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return invoiceTemplates.filter((t) => {
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;

      const matchSearch =
        t.code.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.items.some(
          (i) =>
            i.description.toLowerCase().includes(q) ||
            (i.productCode && i.productCode.toLowerCase().includes(q))
        );

      return matchCat && matchSearch;
    });
  }, [invoiceTemplates, selectedCategory, searchQuery]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = invoiceTemplates.length;
    const active = invoiceTemplates.filter((t) => t.isActive).length;
    const totalLines = invoiceTemplates.reduce((sum, t) => sum + (t.items?.length || 0), 0);
    const mostUsed = [...invoiceTemplates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];

    return { total, active, totalLines, mostUsed };
  }, [invoiceTemplates]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTemplateId(null);
    setFormCode(`TMPL-${Date.now().toString().slice(-4)}`);
    setFormName('');
    setFormDescription('');
    setFormCategory('SaaS & Subscriptions');
    setFormTermsDays(30);
    setFormRevenueAcc('4010');
    setFormNotes('Standard billing invoice template. Payment due net 30 days.');
    setFormCustomerId('');
    setFormIsActive(true);
    setFormItems([
      {
        id: `tmpl-item-${Date.now()}-1`,
        description: 'Core Service Delivery',
        quantity: 1,
        unitPrice: 500,
        taxRate: 10,
        unitOfMeasure: 'unit',
        amount: 500,
      },
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (template: InvoiceTemplate) => {
    setEditingTemplateId(template.id);
    setFormCode(template.code);
    setFormName(template.name);
    setFormDescription(template.description || '');
    setFormCategory(template.category || 'Professional Services');
    setFormTermsDays(template.defaultPaymentTermsDays || 30);
    setFormRevenueAcc(template.defaultRevenueAccountCode || '4010');
    setFormNotes(template.defaultNotes || '');
    setFormCustomerId(template.defaultCustomerId || '');
    setFormIsActive(template.isActive);
    setFormItems(
      template.items.map((i) => ({
        ...i,
        id: i.id || `tmpl-item-${Date.now()}-${Math.random()}`,
        amount: (i.quantity || 1) * (i.unitPrice || 0),
      }))
    );
    setIsModalOpen(true);
  };

  // Duplicate
  const handleDuplicate = (template: InvoiceTemplate) => {
    const res = duplicateInvoiceTemplate(template.id);
    if (res.success) {
      showNotification('success', `Duplicated template as "${res.template?.name}"`);
    } else {
      showNotification('error', res.error || 'Failed to duplicate template');
    }
  };

  // Delete
  const handleDelete = (template: InvoiceTemplate) => {
    if (confirm(`Are you sure you want to delete template "${template.name}" (${template.code})?`)) {
      const res = deleteInvoiceTemplate(template.id);
      if (res.success) {
        showNotification('success', `Deleted template "${template.name}"`);
        if (previewTemplate?.id === template.id) setPreviewTemplate(null);
      } else {
        showNotification('error', res.error || 'Failed to delete template');
      }
    }
  };

  // Line Item Management in Form
  const addFormLineItem = (catalogProduct?: ProductServiceItem) => {
    if (catalogProduct) {
      const newItem: InvoiceTemplateLineItem = {
        id: `tmpl-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: catalogProduct.id,
        productCode: catalogProduct.code,
        description: catalogProduct.description || catalogProduct.name,
        quantity: 1,
        unitPrice: catalogProduct.unitPrice,
        taxRate: catalogProduct.defaultTaxRate ?? 10,
        unitOfMeasure: catalogProduct.unitOfMeasure || 'unit',
        amount: catalogProduct.unitPrice,
      };
      setFormItems((prev) => [...prev, newItem]);
    } else {
      const newItem: InvoiceTemplateLineItem = {
        id: `tmpl-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 10,
        unitOfMeasure: 'unit',
        amount: 0,
      };
      setFormItems((prev) => [...prev, newItem]);
    }
  };

  const updateFormLineItem = (
    id: string,
    field: keyof InvoiceTemplateLineItem,
    value: string | number
  ) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(value) || 0 : item.quantity;
          const price = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
          updated.amount = Math.round(qty * price * 100) / 100;
        }
        return updated;
      })
    );
  };

  const handleProductSelectForLine = (lineId: string, productId: string) => {
    const prod = productsServices.find((p) => p.id === productId);
    if (!prod) return;

    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item;
        const qty = item.quantity || 1;
        return {
          ...item,
          productId: prod.id,
          productCode: prod.code,
          description: prod.description || prod.name,
          unitPrice: prod.unitPrice,
          taxRate: prod.defaultTaxRate ?? item.taxRate,
          unitOfMeasure: prod.unitOfMeasure || item.unitOfMeasure,
          amount: Math.round(qty * prod.unitPrice * 100) / 100,
        };
      })
    );
  };

  const removeFormLineItem = (id: string) => {
    if (formItems.length === 1) {
      showNotification('error', 'A template must have at least one line item.');
      return;
    }
    setFormItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Form Calculations
  const formSubtotal = useMemo(() => {
    return formItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [formItems]);

  const formTaxTotal = useMemo(() => {
    return formItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)),
      0
    );
  }, [formItems]);

  const formTotalAmount = formSubtotal + formTaxTotal;

  // Save Template Submit
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showNotification('error', `${tr("Template Name")} ${tr("is required")}`);
      return;
    }

    if (!formCode.trim()) {
      showNotification('error', 'Template Code is required.');
      return;
    }

    if (formItems.length === 0 || formItems.some((i) => !i.description.trim())) {
      showNotification('error', 'All line items must have a valid description.');
      return;
    }

    if (editingTemplateId) {
      const res = updateInvoiceTemplate(editingTemplateId, {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        defaultPaymentTermsDays: Number(formTermsDays) || 30,
        defaultRevenueAccountCode: formRevenueAcc,
        defaultNotes: formNotes.trim(),
        defaultCustomerId: formCustomerId || undefined,
        isActive: formIsActive,
        items: formItems,
      });

      if (res.success) {
        showNotification('success', `Updated template "${formName}"`);
        setIsModalOpen(false);
      } else {
        showNotification('error', res.error || 'Failed to update template');
      }
    } else {
      const res = createInvoiceTemplate({
        tenantId: activeTenant.id,
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        defaultPaymentTermsDays: Number(formTermsDays) || 30,
        defaultRevenueAccountCode: formRevenueAcc,
        defaultNotes: formNotes.trim(),
        defaultCustomerId: formCustomerId || undefined,
        isActive: formIsActive,
        items: formItems,
      });

      if (res.success) {
        showNotification('success', `Created template "${formName}"`);
        setIsModalOpen(false);
      } else {
        showNotification('error', res.error || 'Failed to create template');
      }
    }
  };

  // Export JSON/CSV
  const handleExportTemplates = () => {
    const jsonStr = JSON.stringify(invoiceTemplates, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_templates_${activeTenant.code.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Exported templates JSON configuration.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              : 'bg-rose-950/90 text-rose-200 border-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{tr("Invoice Templates Master")}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                  {invoiceTemplates.length} configured
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pre-configure line items, billing terms, tax rates, and GL accounts for one-click invoice generation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportTemplates}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            title="Export templates as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{tr("Export Config")}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{tr("New Invoice Template")}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{tr("Total Templates")}</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">{metrics.total}</div>
          <div className="text-[11px] text-slate-400">
            {metrics.active} {tr("active for fast invoicing")}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{tr("Configured Line Items")}</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{metrics.totalLines}</div>
          <div className="text-[11px] text-slate-400">
            {tr("Across all recurring billing models")}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{tr("Most Active Template")}</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-300 truncate">
            {metrics.mostUsed ? metrics.mostUsed.name : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {metrics.mostUsed ? `${metrics.mostUsed.usageCount} invoices generated` : '0 usages'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>{tr("Catalog Sync Status")}</span>
            <BookOpen className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">
            {productsServices.length} Items
          </div>
          <div className="text-[11px] text-slate-400">
            {tr("Available to attach in line items")}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={tr("Search by code, template name, category, or line item details...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* TEMPLATES LIST: CARDS VIEW */}
      {viewMode === 'CARDS' ? (
        filteredTemplates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">{tr("No Invoice Templates Found")}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? `No templates matched "${searchQuery}". Try clearing search filters.`
                : 'Get started by creating your first pre-configured invoice template.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Create First Template")}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              const subtotal = template.items.reduce(
                (sum, i) => sum + (i.quantity || 1) * (i.unitPrice || 0),
                0
              );
              const taxTotal = template.items.reduce(
                (sum, i) =>
                  sum + (i.quantity || 1) * (i.unitPrice || 0) * ((i.taxRate || 0) / 100),
                0
              );
              const estTotal = subtotal + taxTotal;

              return (
                <div
                  key={template.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition group shadow-sm hover:shadow-xl"
                >
                  <div className="space-y-3">
                    {/* Header Code & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold tracking-wider">
                            {template.code}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            {template.category}
                          </span>
                          {!template.isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[9px] font-bold">
                              Inactive
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 pt-0.5">
                          {template.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/50 transition cursor-pointer"
                          title="Duplicate Template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(template)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-950/50 transition cursor-pointer"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {template.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Pre-configured Line Items List Preview */}
                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Pre-configured Lines ({template.items?.length || 0})</span>
                        <span className="text-slate-500 font-mono">{tr("Tax / Total")}</span>
                      </div>
                      <div className="space-y-1.5 divide-y divide-slate-800/60 max-h-36 overflow-y-auto pr-1">
                        {template.items.map((item, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="text-slate-200 truncate font-medium">
                                {item.description}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {item.quantity} {item.unitOfMeasure || 'unit'} @ {activeTenant.currency} {item.unitPrice.toLocaleString()} {item.taxRate > 0 ? `(+${item.taxRate}% tax)` : '(0% tax)'}
                              </div>
                            </div>
                            <div className="text-right font-mono text-slate-300 font-bold text-xs whitespace-nowrap">
                              {activeTenant.currency} {((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Specs / Meta Badges */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Net {template.defaultPaymentTermsDays || 30} Days</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GL Acc: {template.defaultRevenueAccountCode || '4010'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Summary & Trigger Button */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          {tr("Est. Total Value")}
                        </span>
                        <span className="text-base font-bold text-slate-100 font-mono">
                          {activeTenant.currency} {estTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {template.usageCount || 0} times used
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center transition border border-slate-700 cursor-pointer"
                        title="View full template details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {onSelectTemplateForInvoice && (
                        <button
                          onClick={() => onSelectTemplateForInvoice(template)}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{tr("Generate Invoice")}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">{tr("Code / Identifier")}</th>
                  <th className="p-3.5">{tr("Template Name & Category")}</th>
                  <th className="p-3.5 text-center">{tr("Lines")}</th>
                  <th className="p-3.5 text-center">{tr("Payment Terms")}</th>
                  <th className="p-3.5">{tr("GL Account")}</th>
                  <th className="p-3.5 text-right">{tr("Est. Total Amount")}</th>
                  <th className="p-3.5 text-center">{tr("Usage")}</th>
                  <th className="p-3.5 text-right pr-4">{tr("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTemplates.map((template) => {
                  const estSubtotal = template.items.reduce(
                    (sum, i) => sum + (i.quantity || 1) * (i.unitPrice || 0),
                    0
                  );
                  const estTax = template.items.reduce(
                    (sum, i) =>
                      sum + (i.quantity || 1) * (i.unitPrice || 0) * ((i.taxRate || 0) / 100),
                    0
                  );
                  const estTotal = estSubtotal + estTax;

                  return (
                    <tr key={template.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-400 whitespace-nowrap">
                        {template.code}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{template.name}</div>
                        <div className="text-[11px] text-slate-400">{template.category}</div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                        {template.items?.length || 0}
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-400">
                        Net {template.defaultPaymentTermsDays || 30}d
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">
                        {template.defaultRevenueAccountCode || '4010'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                        {activeTenant.currency} {estTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-400">
                        {template.usageCount || 0}
                      </td>
                      <td className="p-3.5 text-right pr-4 space-x-1 whitespace-nowrap">
                        {onSelectTemplateForInvoice && (
                          <button
                            onClick={() => onSelectTemplateForInvoice(template)}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                            title="Generate Invoice with this template"
                          >
                            <span>{tr("Use")}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(template)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
                          title={tr("Edit")}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                          title={tr("Duplicate")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title={tr("Delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  {editingTemplateId ? tr("Edit Invoice Template") : tr("Create New Invoice Template")}
                </h3>
                <p className="text-xs text-slate-400">
                  {tr("Configure reusable line items, default payment schedules, and account links.")}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tr("Template Code / SKU")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TMPL-SAAS-ANNUAL"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tr("Template Name")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise SaaS Annual Subscription & Premium Support"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tr("Business Category")}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SaaS & Subscriptions">{tr("SaaS & Subscriptions")}</option>
                    <option value="Professional Services">{tr("Professional Services")}</option>
                    <option value="Property & Facilities">{tr("Property & Facilities (HOA)")}</option>
                    <option value="Education">{tr("Education & Tuition")}</option>
                    <option value="Healthcare">{tr("Healthcare & Diagnostics")}</option>
                    <option value="Custom">{tr("Custom / General")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tr("Payment Terms (Days)")}
                  </label>
                  <select
                    value={formTermsDays}
                    onChange={(e) => setFormTermsDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>{tr("Due on Receipt (Immediate)")}</option>
                    <option value={7}>{tr("Net 7 Days")}</option>
                    <option value={15}>{tr("Net 15 Days")}</option>
                    <option value={30}>{tr("Net 30 Days")}</option>
                    <option value={45}>{tr("Net 45 Days")}</option>
                    <option value={60}>{tr("Net 60 Days")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tr("Default Revenue Account")}
                  </label>
                  <select
                    value={formRevenueAcc}
                    onChange={(e) => setFormRevenueAcc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="4010">4010 - Core Operating Revenue</option>
                    <option value="4020">4020 - Consulting & Service Revenue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tr("Optional Default Customer Binding")}
                  </label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Universal (Any Customer) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tr("Description / Memo")}
                  </label>
                  <input
                    type="text"
                    placeholder="Short description of this template's intent"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {tr("Default Payment Notes / Instructions")}
                </label>
                <textarea
                  rows={2}
                  placeholder="Terms, payment instructions, wire transfer coordinates..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* LINE ITEMS BUILDER */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Pre-configured Line Items ({formItems.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Link from products & services catalog or define custom line items.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {productsServices.length > 0 && (
                      <select
                        onChange={(e) => {
                          const prod = productsServices.find((p) => p.id === e.target.value);
                          if (prod) {
                            addFormLineItem(prod);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-950 border border-indigo-500/30 text-indigo-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-400 cursor-pointer"
                      >
                        <option value="" disabled>
                          {tr("+ Insert From Catalog...")}
                        </option>
                        {productsServices.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.type}] {p.name} ({activeTenant.currency} {p.unitPrice}/{p.unitOfMeasure || 'unit'})
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => addFormLineItem()}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tr("Custom Line")}</span>
                    </button>
                  </div>
                </div>

                {/* Table of Line Items */}
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                  <table className="w-full text-left text-xs text-slate-300 min-w-[650px]">
                    <thead className="text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="pb-2 pl-2 w-44">{tr("Catalog Item Link")}</th>
                        <th className="pb-2">{tr("Description / Memo")}</th>
                        <th className="pb-2 w-28 text-center">{tr("Qty / UoM")}</th>
                        <th className="pb-2 w-28 text-right">{tr("Unit Price")}</th>
                        <th className="pb-2 w-20 text-right">{tr("Tax %")}</th>
                        <th className="pb-2 w-28 text-right pr-2">{tr("Total Amount")}</th>
                        <th className="pb-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {formItems.map((item, index) => (
                        <tr key={item.id} className="group">
                          {/* Catalog Dropdown */}
                          <td className="py-2 pl-2 pr-1">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => handleProductSelectForLine(item.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500 truncate"
                            >
                              <option value="">{tr("-- Custom Line --")}</option>
                              {productsServices.map((p) => (
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
                              placeholder={`Line #${index + 1} item description`}
                              value={item.description}
                              onChange={(e) => updateFormLineItem(item.id, 'description', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          {/* Quantity & UoM */}
                          <td className="py-2 px-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.quantity}
                                onChange={(e) =>
                                  updateFormLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                placeholder="unit"
                                title="Unit of Measure"
                                value={item.unitOfMeasure || ''}
                                onChange={(e) => updateFormLineItem(item.id, 'unitOfMeasure', e.target.value)}
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
                              onChange={(e) =>
                                updateFormLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
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
                              onChange={(e) =>
                                updateFormLineItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-right font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-2 pr-2 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                            {activeTenant.currency}{' '}
                            {(item.quantity * item.unitPrice).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          {/* Delete Line */}
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeFormLineItem(item.id)}
                              disabled={formItems.length === 1}
                              className={`p-1.5 rounded transition ${
                                formItems.length === 1
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                              }`}
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Template Totals Summary */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>{tr("Subtotal:")}</span>
                    <span>
                      {activeTenant.currency} {formSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tr("Estimated Tax Total:")}</span>
                    <span>
                      {activeTenant.currency} {formTaxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-sm pt-2 border-t border-slate-800">
                    <span>{tr("Estimated Total Template Amount:")}</span>
                    <span className="text-indigo-400">
                      {activeTenant.currency} {formTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{tr("Active Template (Ready for invoice generation)")}</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {tr("Cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    {editingTemplateId ? tr("Save Template Changes") : tr("Create Template")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PREVIEW DRAWER */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 text-[10px] font-mono font-bold">
                    {previewTemplate.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                    {previewTemplate.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  {previewTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {previewTemplate.description && (
                <p className="text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {previewTemplate.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">{tr("Payment Terms:")}</span>
                  Net {previewTemplate.defaultPaymentTermsDays || 30} Days
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{tr("GL Revenue Account:")}</span>
                  {previewTemplate.defaultRevenueAccountCode || '4010'}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{tr("Usage Count:")}</span>
                  {previewTemplate.usageCount || 0} invoices created
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{tr("Status:")}</span>
                  {previewTemplate.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Itemized Line Items ({previewTemplate.items.length})
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-2.5">{tr("Item Description")}</th>
                        <th className="p-2.5 text-center">{tr("Qty / UoM")}</th>
                        <th className="p-2.5 text-right">{tr("Unit Price")}</th>
                        <th className="p-2.5 text-right">{tr("Tax Rate")}</th>
                        <th className="p-2.5 text-right pr-3">{tr("Line Amount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-xs">
                      {previewTemplate.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-slate-200 font-sans font-medium">
                            {item.description}
                          </td>
                          <td className="p-2.5 text-center text-slate-400">
                            {item.quantity} {item.unitOfMeasure || 'unit'}
                          </td>
                          <td className="p-2.5 text-right">
                            {activeTenant.currency} {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-slate-400">{item.taxRate}%</td>
                          <td className="p-2.5 text-right pr-3 font-bold text-slate-100">
                            {activeTenant.currency}{' '}
                            {((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {previewTemplate.defaultNotes && (
                <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-0.5">{tr("Default Notes / Wire Instructions:")}</span>
                  {previewTemplate.defaultNotes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              {onSelectTemplateForInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    const t = previewTemplate;
                    setPreviewTemplate(null);
                    onSelectTemplateForInvoice(t);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{tr("Use to Generate Invoice")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
