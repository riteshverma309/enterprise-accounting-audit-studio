import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Receipt,
  Sparkles,
  Building2,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Layers,
  Calculator,
  Tag,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  History,
  DollarSign,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react';
import {
  ProductServiceItem,
  ItemType,
  IndustryPresetType,
  PriceChangeHistoryEntry,
} from '../types';

interface ProductServicesViewProps {
  onSelectProductForInvoice?: (product: ProductServiceItem) => void;
}

export const ProductServicesView: React.FC<ProductServicesViewProps> = ({
  onSelectProductForInvoice,
}) => {
  const {
    activeTenant,
    activeRole,
    userEmail,
    productsServices,
    priceChangeHistory,
    createProductService,
    updateProductService,
    updateProductPrice,
    deleteProductService,
    applyIndustryPresetProducts,
  } = useAccounting();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'AUDIT_TRAIL'>('CATALOG');

  // Search and Filter State for Catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Search and Filter State for Audit Trail
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditDirectionFilter, setAuditDirectionFilter] = useState<'ALL' | 'INCREASE' | 'DECREASE' | 'INITIAL'>('ALL');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductServiceItem | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Price Update Modal State
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceUpdatingItem, setPriceUpdatingItem] = useState<ProductServiceItem | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);
  const [priceChangeReasonType, setPriceChangeReasonType] = useState<string>('Annual Contract Indexation');
  const [priceChangeCustomReason, setPriceChangeCustomReason] = useState<string>('');
  const [priceEffectiveDate, setPriceEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [priceChangeNotes, setPriceChangeNotes] = useState<string>('');
  const [confirmSignificantChange, setConfirmSignificantChange] = useState<boolean>(false);

  // Item Specific Price History Drawer / Modal
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyDrawerItem, setHistoryDrawerItem] = useState<ProductServiceItem | null>(null);

  // Form State for Add / Edit Item General Info
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'SERVICE' as ItemType,
    category: 'General Services',
    unitPrice: 100,
    unitOfMeasure: 'unit',
    defaultTaxRate: 10,
    defaultRevenueAccountCode: '4010',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Simulator / Quick Pricing Calculator State
  const [calcProductId, setCalcProductId] = useState<string>('');
  const [calcQuantity, setCalcQuantity] = useState<number>(1);
  const [calcCustomPrice, setCalcCustomPrice] = useState<number | null>(null);
  const [calcTaxRate, setCalcTaxRate] = useState<number>(10);

  // Tenant-filtered items
  const tenantItems = useMemo(() => {
    return productsServices.filter(
      (item) => !item.tenantId || item.tenantId === activeTenant.id || item.tenantId === 't-acme-us'
    );
  }, [productsServices, activeTenant.id]);

  // Tenant-filtered price audit history
  const tenantPriceHistory = useMemo(() => {
    return priceChangeHistory.filter(
      (entry) => !entry.tenantId || entry.tenantId === activeTenant.id || entry.tenantId === 't-acme-us'
    );
  }, [priceChangeHistory, activeTenant.id]);

  // Filtered Price History for Audit Tab
  const filteredAuditHistory = useMemo(() => {
    return tenantPriceHistory.filter((entry) => {
      const matchesSearch =
        entry.itemCode.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        entry.itemName.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        entry.reason.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        entry.changedBy.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(auditSearchTerm.toLowerCase()));

      let matchesDirection = true;
      if (auditDirectionFilter === 'INCREASE') {
        matchesDirection = entry.newPrice > entry.oldPrice && entry.oldPrice > 0;
      } else if (auditDirectionFilter === 'DECREASE') {
        matchesDirection = entry.newPrice < entry.oldPrice;
      } else if (auditDirectionFilter === 'INITIAL') {
        matchesDirection = entry.oldPrice === 0;
      }

      return matchesSearch && matchesDirection;
    });
  }, [tenantPriceHistory, auditSearchTerm, auditDirectionFilter]);

  // Distinct Categories for Filter
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    tenantItems.forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats).sort();
  }, [tenantItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return tenantItems.filter((item) => {
      // Search
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Type Filter
      const matchType = typeFilter === 'ALL' || item.type === typeFilter;

      // Category Filter
      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      // Status Filter
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchType && matchCategory && matchStatus;
    });
  }, [tenantItems, searchTerm, typeFilter, categoryFilter, statusFilter]);

  // Summary Metrics
  const totalCount = tenantItems.length;
  const productCount = tenantItems.filter((i) => i.type === 'PRODUCT').length;
  const serviceCount = tenantItems.filter((i) => i.type === 'SERVICE').length;
  const activeCount = tenantItems.filter((i) => i.status === 'ACTIVE').length;
  const avgPrice =
    totalCount > 0 ? tenantItems.reduce((acc, i) => acc + i.unitPrice, 0) / totalCount : 0;
  const priceUpdatesCount = tenantPriceHistory.length;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      code: `ITEM-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      description: '',
      type: 'SERVICE',
      category: 'Professional Services',
      unitPrice: 150,
      unitOfMeasure: 'hour',
      defaultTaxRate: 10,
      defaultRevenueAccountCode: '4010',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ProductServiceItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      type: item.type,
      category: item.category || 'General',
      unitPrice: item.unitPrice,
      unitOfMeasure: item.unitOfMeasure || 'unit',
      defaultTaxRate: item.defaultTaxRate !== undefined ? item.defaultTaxRate : 10,
      defaultRevenueAccountCode: item.defaultRevenueAccountCode || '4010',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  // Open the dedicated Price Revision modal
  const handleOpenPriceModal = (item: ProductServiceItem) => {
    setPriceUpdatingItem(item);
    setNewPriceValue(item.unitPrice);
    setPriceChangeReasonType('Annual Contract Indexation');
    setPriceChangeCustomReason('');
    setPriceEffectiveDate(new Date().toISOString().split('T')[0]);
    setPriceChangeNotes('');
    setConfirmSignificantChange(false);
    setIsPriceModalOpen(true);
  };

  // Open the item history drawer
  const handleOpenItemHistory = (item: ProductServiceItem) => {
    setHistoryDrawerItem(item);
    setIsHistoryDrawerOpen(true);
  };

  // Submit Price Update
  const handleSavePriceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceUpdatingItem) return;

    if (newPriceValue < 0 || isNaN(newPriceValue)) {
      showNotification('Price must be a valid positive number.');
      return;
    }

    const oldPrice = priceUpdatingItem.unitPrice;
    const diffPct = oldPrice > 0 ? Math.abs((newPriceValue - oldPrice) / oldPrice) * 100 : 0;

    // Check if large change (>50%) requires confirmation flag
    if (diffPct > 50 && !confirmSignificantChange && oldPrice > 0) {
      showNotification('Please acknowledge the significant price revision (>50%) by checking the confirmation box.');
      return;
    }

    const finalReason =
      priceChangeReasonType === 'Other / Custom Business Reason'
        ? priceChangeCustomReason.trim() || 'Custom price adjustment'
        : priceChangeReasonType + (priceChangeCustomReason ? `: ${priceChangeCustomReason}` : '');

    const res = updateProductPrice(
      priceUpdatingItem.id,
      Number(newPriceValue),
      finalReason,
      priceEffectiveDate,
      priceChangeNotes.trim() || undefined
    );

    if (res.success) {
      showNotification(
        `Price for [${priceUpdatingItem.code}] updated to ${activeTenant.currency} ${Number(newPriceValue).toFixed(2)} with complete audit record.`
      );
      setIsPriceModalOpen(false);
    } else {
      showNotification(res.error || 'Failed to update price');
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showNotification('Item name and SKU/Code are required.');
      return;
    }

    if (editingItem) {
      updateProductService(
        editingItem.id,
        {
          ...formData,
          unitPrice: Number(formData.unitPrice) || 0,
          defaultTaxRate: Number(formData.defaultTaxRate) || 0,
        },
        'Catalog master item specification update'
      );
      showNotification(`Updated item "${formData.name}" successfully.`);
    } else {
      createProductService({
        tenantId: activeTenant.id,
        ...formData,
        unitPrice: Number(formData.unitPrice) || 0,
        defaultTaxRate: Number(formData.defaultTaxRate) || 0,
      });
      showNotification(`Created catalog item "${formData.name}" (${formData.code}).`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the product & service catalog?`)) {
      deleteProductService(id);
      showNotification(`Deleted item "${name}".`);
    }
  };

  const handleApplyPreset = (preset: IndustryPresetType) => {
    const res = applyIndustryPresetProducts(preset, activeTenant.id);
    setIsPresetModalOpen(false);
    showNotification(`Applied ${preset.replace('_', ' ')} preset: Added ${res.count} standardized products/services.`);
  };

  // Export audit logs as CSV
  const handleExportAuditCsv = () => {
    const headers = [
      'Audit ID',
      'SKU / Code',
      'Product / Service Name',
      'Old Price',
      'New Price',
      'Delta (%)',
      'Currency',
      'Effective Date',
      'Change Timestamp',
      'Authorized By',
      'User Role',
      'Business Reason',
      'Audit Notes',
    ];

    const rows = filteredAuditHistory.map((h) => [
      h.id,
      `"${h.itemCode}"`,
      `"${h.itemName.replace(/"/g, '""')}"`,
      h.oldPrice,
      h.newPrice,
      h.changePercentage !== undefined ? `${h.changePercentage}%` : 'N/A',
      h.currency,
      h.effectiveDate,
      h.changeDate,
      h.changedBy,
      h.changedRole || 'accountant',
      `"${(h.reason || '').replace(/"/g, '""')}"`,
      `"${(h.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Price_Revision_Audit_Trail_${activeTenant.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported price change audit records to CSV.');
  };

  // Selected item for calculator
  const selectedCalcItem = tenantItems.find((i) => i.id === calcProductId) || tenantItems[0];
  const activeCalcPrice = calcCustomPrice !== null ? calcCustomPrice : (selectedCalcItem?.unitPrice || 0);
  const calcSubtotal = (calcQuantity || 0) * activeCalcPrice;
  const calcTaxAmount = calcSubtotal * (((calcTaxRate ?? selectedCalcItem?.defaultTaxRate ?? 0)) / 100);
  const calcTotal = calcSubtotal + calcTaxAmount;

  // Quick price delta calculations for modal
  const modalOldPrice = priceUpdatingItem?.unitPrice || 0;
  const modalDelta = newPriceValue - modalOldPrice;
  const modalDeltaPct = modalOldPrice > 0 ? ((newPriceValue - modalOldPrice) / modalOldPrice) * 100 : 0;
  const isSignificantDelta = Math.abs(modalDeltaPct) > 50 && modalOldPrice > 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-indigo-400/30 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-100">Products & Services Catalog</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Standardized goods, subscriptions, and hourly services with complete historical price revision tracking,
            audit logs, and instant customer invoice line-item integration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Load Industry Presets</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product / Service</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Pills */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'CATALOG'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Catalog Items & Pricing ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_TRAIL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'AUDIT_TRAIL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Price Change Audit Trail</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-indigo-300 font-mono">
            {priceUpdatesCount}
          </span>
        </button>
      </div>

      {/* TAB 1: CATALOG VIEW */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Catalog Items</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">{totalCount}</span>
                <span className="text-[11px] text-emerald-400">({activeCount} Active)</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tangible Products</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400">{productCount}</span>
                <span className="text-[11px] text-slate-500">Items / Goods</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Services & Fees</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-400">{serviceCount}</span>
                <span className="text-[11px] text-slate-500">Hourly / Recurring</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Price Revisions Tracked</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400 font-mono">{priceUpdatesCount}</span>
                <span className="text-[11px] text-slate-400">Audit Logs</span>
              </div>
            </div>
          </div>

          {/* Interactive Pricing Estimator & Invoice Simulator */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 p-4 rounded-2xl">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Quick Price & Quantity Estimator
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Simulate line-item totals before creating invoices</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block text-[11px] text-slate-400 mb-1">Select Catalog Item</label>
                <select
                  value={calcProductId || (tenantItems[0]?.id || '')}
                  onChange={(e) => {
                    setCalcProductId(e.target.value);
                    const found = tenantItems.find((i) => i.id === e.target.value);
                    if (found) {
                      setCalcCustomPrice(found.unitPrice);
                      setCalcTaxRate(found.defaultTaxRate || 0);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {tenantItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.type}] {item.name} ({activeTenant.currency} {item.unitPrice}/{item.unitOfMeasure || 'unit'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Quantity ({selectedCalcItem?.unitOfMeasure || 'units'})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Unit Price ({activeTenant.currency})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={activeCalcPrice}
                  onChange={(e) => setCalcCustomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Tax Rate %</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={calcTaxRate}
                  onChange={(e) => setCalcTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="md:col-span-2">
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Estimated Total</div>
                  <div className="text-sm font-bold text-indigo-300 font-mono">
                    {activeTenant.currency} {calcTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {selectedCalcItem && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Item code: <strong className="text-slate-200 font-mono">{selectedCalcItem.code}</strong></span>
                  {selectedCalcItem.lastPriceUpdatedAt && (
                    <span className="text-[11px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                      Price Effective: {selectedCalcItem.lastPriceUpdatedAt}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPriceModal(selectedCalcItem)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Update Base Price</span>
                  </button>
                  {onSelectProductForInvoice && (
                    <button
                      onClick={() => onSelectProductForInvoice(selectedCalcItem)}
                      className="px-3 py-1.5 bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Issue Customer Invoice</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by SKU, item name, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Type Filter */}
              <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    typeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setTypeFilter('PRODUCT')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    typeFilter === 'PRODUCT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📦 Products ({productCount})
                </button>
                <button
                  onClick={() => setTypeFilter('SERVICE')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    typeFilter === 'SERVICE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚙️ Services ({serviceCount})
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Catalog Price List ({filteredItems.length})</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Currency: {activeTenant.currency}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">SKU / Code</th>
                    <th className="p-3">Item Details</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-center">Unit of Measure</th>
                    <th className="p-3 text-right">Tax Rate</th>
                    <th className="p-3 text-center">Price Audit Status</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No products or services found matching current filters. Click "Add Product / Service" or "Load Industry Presets" to populate your catalog.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const itemHist = tenantPriceHistory.filter((h) => h.itemId === item.id || h.itemCode === item.code);
                      const hasHistory = itemHist.length > 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-indigo-300">
                            <span className="px-2 py-1 bg-indigo-950/70 border border-indigo-800/50 rounded-md">
                              {item.code}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="font-semibold text-slate-100">{item.name}</div>
                            {item.description && (
                              <div className="text-[11px] text-slate-400 truncate max-w-sm" title={item.description}>
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.type === 'PRODUCT'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                  : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                              }`}
                            >
                              {item.type === 'PRODUCT' ? '📦 Product' : '⚙️ Service'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="font-mono font-bold text-slate-100">
                              {activeTenant.currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: item.unitPrice % 1 !== 0 ? 2 : 0 })}
                            </div>
                            {item.lastPriceUpdatedAt && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Eff: {item.lastPriceUpdatedAt}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                            /{item.unitOfMeasure || 'unit'}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300">
                            {item.defaultTaxRate !== undefined ? `${item.defaultTaxRate}%` : '0%'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleOpenItemHistory(item)}
                              title="Click to view full price change audit trail"
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-[11px] text-slate-300 hover:text-indigo-300 transition cursor-pointer"
                            >
                              <History className="w-3 h-3 text-indigo-400" />
                              <span>{itemHist.length} Revisions</span>
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            {/* Update Price Button */}
                            <button
                              onClick={() => handleOpenPriceModal(item)}
                              title="Update Price with Audit Reason"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/20 transition cursor-pointer"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                            {/* History Drawer */}
                            <button
                              onClick={() => handleOpenItemHistory(item)}
                              title="View Audit Trail"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            {/* Invoice Button */}
                            {onSelectProductForInvoice && (
                              <button
                                onClick={() => onSelectProductForInvoice(item)}
                                title="Generate Invoice with this Item"
                                className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg transition cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* General Edit */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Item Details"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Delete Item"
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICE CHANGE AUDIT TRAIL */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="space-y-6">
          {/* Audit Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Price Changes</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">{tenantPriceHistory.length}</span>
                <span className="text-[11px] text-indigo-400">Recorded</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Price Increases</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">
                  {tenantPriceHistory.filter((h) => h.newPrice > h.oldPrice && h.oldPrice > 0).length}
                </span>
                <span className="text-[11px] text-emerald-500">Upward revisions</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Price Reductions</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-400">
                  {tenantPriceHistory.filter((h) => h.newPrice < h.oldPrice).length}
                </span>
                <span className="text-[11px] text-blue-500">Discounts / Lowered</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Audit Compliance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">100%</span>
                <span className="text-[11px] text-emerald-400">Immutable SOX Log</span>
              </div>
            </div>
          </div>

          {/* Audit Controls & Export Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail by SKU, reason, user..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={auditDirectionFilter}
                onChange={(e) => setAuditDirectionFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Price Changes</option>
                <option value="INCREASE">Price Increases (▲)</option>
                <option value="DECREASE">Price Decreases (▼)</option>
                <option value="INITIAL">Initial Baseline Setup</option>
              </select>

              <button
                onClick={handleExportAuditCsv}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  Historical Price Revision Register ({filteredAuditHistory.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">Includes user attribution & stated business rationale</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Audit ID</th>
                    <th className="p-3">SKU & Item</th>
                    <th className="p-3 text-right">Old Price</th>
                    <th className="p-3 text-right">New Price</th>
                    <th className="p-3 text-center">Delta / Change %</th>
                    <th className="p-3">Effective Date</th>
                    <th className="p-3">Changed By</th>
                    <th className="p-3">Business Reason & Notes</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredAuditHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No price change audit events match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditHistory.map((h) => {
                      const isUp = h.newPrice > h.oldPrice && h.oldPrice > 0;
                      const isDown = h.newPrice < h.oldPrice;
                      const isInitial = h.oldPrice === 0;

                      return (
                        <tr key={h.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono text-[11px] text-slate-500">
                            {h.id.substring(0, 12)}...
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-indigo-300">{h.itemCode}</div>
                            <div className="text-slate-200 font-medium text-xs truncate max-w-xs">{h.itemName}</div>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-400">
                            {h.oldPrice === 0 ? '—' : `${h.currency} ${h.oldPrice.toFixed(2)}`}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-100">
                            {h.currency} {h.newPrice.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            {isInitial ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Initial Setup
                              </span>
                            ) : isUp ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                                <ArrowUpRight className="w-3 h-3" />
                                +{h.changePercentage || Math.round(((h.newPrice - h.oldPrice) / h.oldPrice) * 100)}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
                                <ArrowDownRight className="w-3 h-3" />
                                {h.changePercentage || Math.round(((h.newPrice - h.oldPrice) / h.oldPrice) * 100)}%
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-300">
                            {h.effectiveDate || h.changeDate.split('T')[0]}
                          </td>
                          <td className="p-3">
                            <div className="text-slate-200 text-xs font-medium">{h.changedBy}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-mono">{h.changedRole || 'accountant'}</div>
                          </td>
                          <td className="p-3 max-w-sm">
                            <div className="text-slate-200 font-semibold text-xs">{h.reason}</div>
                            {h.notes && (
                              <div className="text-[11px] text-slate-400 truncate">{h.notes}</div>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {h.changeDate.replace('T', ' ').substring(0, 16)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: UPDATE PRICE WITH AUDIT REASON */}
      {isPriceModalOpen && priceUpdatingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Update Catalog Price & Log Audit Reason
                </h3>
                <p className="text-xs text-slate-400">
                  Every price adjustment is permanently recorded in the immutable audit log for compliance.
                </p>
              </div>
              <button
                onClick={() => setIsPriceModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Item Card */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono text-xs font-bold">
                  {priceUpdatingItem.code}
                </span>
                <span className="text-[11px] text-slate-400">
                  Unit of Measure: <strong className="text-slate-200">{priceUpdatingItem.unitOfMeasure || 'unit'}</strong>
                </span>
              </div>
              <div className="font-bold text-slate-100 text-sm">{priceUpdatingItem.name}</div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Current Base Price:</span>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  {activeTenant.currency} {priceUpdatingItem.unitPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePriceUpdate} className="space-y-4">
              {/* New Price Input & Live Delta */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Unit Price ({activeTenant.currency}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={newPriceValue}
                    onChange={(e) => setNewPriceValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-base font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500 text-right pr-4"
                  />
                </div>

                {/* Live Differential Display */}
                <div className="mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Price Adjustment:</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className={modalDelta >= 0 ? 'text-emerald-400 font-bold' : 'text-blue-400 font-bold'}>
                      {modalDelta >= 0 ? '+' : ''}{activeTenant.currency} {modalDelta.toFixed(2)}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                        modalDelta >= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {modalDelta >= 0 ? '+' : ''}{modalDeltaPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Effective Date & Authorization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Effective Date *</label>
                  <input
                    type="date"
                    required
                    value={priceEffectiveDate}
                    onChange={(e) => setPriceEffectiveDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Authorized User</label>
                  <input
                    type="text"
                    disabled
                    value={`${userEmail} (${activeRole})`}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              {/* Reason for Price Adjustment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Reason for Price Adjustment *
                </label>
                <select
                  value={priceChangeReasonType}
                  onChange={(e) => setPriceChangeReasonType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Annual Contract Indexation">Annual Contract Indexation / Inflation</option>
                  <option value="Cost of Goods / Provider Cost Realignment">Cost of Goods / Cloud / Provider Cost Realignment</option>
                  <option value="Market Rate Realignment">Market Standard Rate Realignment</option>
                  <option value="Promotional / Discount Tier Revision">Promotional / Volume Tier Revision</option>
                  <option value="Regulatory & Statutory Surcharge Update">Regulatory & Statutory Surcharge Update</option>
                  <option value="Contract Renegotiation">Contract Renegotiation / Scope Expansion</option>
                  <option value="Other / Custom Business Reason">Other / Custom Business Reason...</option>
                </select>
              </div>

              {/* Custom Reason Details or Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Notes / Detailed Justification
                </label>
                <textarea
                  rows={2}
                  value={priceChangeCustomReason || priceChangeNotes}
                  onChange={(e) => {
                    if (priceChangeReasonType === 'Other / Custom Business Reason') {
                      setPriceChangeCustomReason(e.target.value);
                    } else {
                      setPriceChangeNotes(e.target.value);
                    }
                  }}
                  placeholder="Provide reference to board resolution, customer amendment, or CPI index..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Significant Change Warning Guardrail */}
              {isSignificantDelta && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Significant Price Revision Detected ({modalDeltaPct > 0 ? `+${modalDeltaPct.toFixed(1)}%` : `${modalDeltaPct.toFixed(1)}%`})</span>
                  </div>
                  <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmSignificantChange}
                      onChange={(e) => setConfirmSignificantChange(e.target.checked)}
                      className="mt-0.5 text-amber-600 rounded"
                    />
                    <span>
                      I confirm this price revision is deliberate and complies with the tenant's pricing policy and customer notification terms.
                    </span>
                  </label>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Commit Price Revision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ITEM SPECIFIC PRICE HISTORY DRAWER */}
      {isHistoryDrawerOpen && historyDrawerItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Price Revision History: [{historyDrawerItem.code}] {historyDrawerItem.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Chronological price changes recorded for this item with user attribution.
                </p>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Status Header */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Current Unit Price</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {activeTenant.currency} {historyDrawerItem.unitPrice.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal"> / {historyDrawerItem.unitOfMeasure || 'unit'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsHistoryDrawerOpen(false);
                  handleOpenPriceModal(historyDrawerItem);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Adjust Price Now</span>
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Price Timeline & Audit Trail
              </h4>

              {(() => {
                const itemHistory = tenantPriceHistory.filter(
                  (h) => h.itemId === historyDrawerItem.id || h.itemCode === historyDrawerItem.code
                );

                if (itemHistory.length === 0) {
                  return (
                    <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                      No separate price adjustment events found. The initial base price is currently active.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {itemHistory.map((h, idx) => {
                      const isUp = h.newPrice > h.oldPrice && h.oldPrice > 0;
                      const isInitial = h.oldPrice === 0;

                      return (
                        <div
                          key={h.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              {isInitial ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  Initial Baseline
                                </span>
                              ) : isUp ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                                  <ArrowUpRight className="w-3 h-3" />
                                  +{h.changePercentage}%
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1 font-mono">
                                  <ArrowDownRight className="w-3 h-3" />
                                  {h.changePercentage}%
                                </span>
                              )}

                              <span className="font-mono font-bold text-slate-100 text-sm">
                                {h.oldPrice > 0 ? `${h.currency} ${h.oldPrice.toFixed(2)} → ` : ''}
                                {h.currency} {h.newPrice.toFixed(2)}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                              <span>Eff: <strong>{h.effectiveDate || h.changeDate.split('T')[0]}</strong></span>
                              <span>•</span>
                              <span>{h.changeDate.split('T')[0]}</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 font-medium">
                            <strong>Reason:</strong> {h.reason}
                          </div>

                          {h.notes && (
                            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                              {h.notes}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <span>Authorized by: <strong className="text-slate-400">{h.changedBy}</strong> ({h.changedRole || 'accountant'})</span>
                            <span className="font-mono">Log ID: {h.id.substring(0, 10)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE / EDIT PRODUCT GENERAL SPECS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  {editingItem ? 'Edit Product / Service Specifications' : 'Add New Product / Service'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure catalog codes, default prices, and tax rates for automatic invoicing.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'SERVICE', unitOfMeasure: 'hour' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                      formData.type === 'SERVICE'
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg">⚙️</span>
                    <div className="text-left">
                      <div className="text-xs font-bold">Service / Fee</div>
                      <div className="text-[10px] text-slate-400">Hourly, maintenance, tuition, consultation</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'PRODUCT', unitOfMeasure: 'unit' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                      formData.type === 'PRODUCT'
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg">📦</span>
                    <div className="text-left">
                      <div className="text-xs font-bold">Physical / Digital Product</div>
                      <div className="text-[10px] text-slate-400">Goods, uniforms, software licenses, kits</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* SKU & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SRV-CONSULT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Item Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Monthly Maintenance Fee / Senior Advisory"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed breakdown shown on customer invoices..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category & Unit of Measure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Professional Services, Tuition, HOA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="unit">unit (Single count)</option>
                    <option value="hour">hour (Time based)</option>
                    <option value="sq ft">sq ft (Area maintenance)</option>
                    <option value="month">month (Recurring)</option>
                    <option value="user/mo">user/mo (Seat license)</option>
                    <option value="term">term (School semester)</option>
                    <option value="bed/day">bed/day (Hospital ward)</option>
                    <option value="session">session (Consultation)</option>
                    <option value="set">set (Uniform / Pack)</option>
                    <option value="event/day">event/day (Facility booking)</option>
                    <option value="kWh">kWh (Utility electric)</option>
                  </select>
                </div>
              </div>

              {/* Price, Tax, Revenue Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit Price ({activeTenant.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default Tax %</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.defaultTaxRate}
                    onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Revenue Account</label>
                  <select
                    value={formData.defaultRevenueAccountCode}
                    onChange={(e) => setFormData({ ...formData, defaultRevenueAccountCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="4010">4010 - Core Sales & Operations</option>
                    <option value="4020">4020 - Consulting & Services</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catalog Status</label>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.status === 'ACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                      className="text-indigo-600"
                    />
                    <span>Active (Available in Invoicing)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.status === 'INACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                      className="text-indigo-600"
                    />
                    <span>Inactive (Archived)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: LOAD INDUSTRY PRESETS */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Load Industry Products & Services
                </h3>
                <p className="text-xs text-slate-400">
                  Select an industry archetype to instantly seed standardized pricing models, service descriptions, and units of measure.
                </p>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Housing Society */}
              <button
                onClick={() => handleApplyPreset('HOUSING_SOCIETY')}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 hover:bg-indigo-950/20 text-left transition group cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                  <span>Housing Society & HOA</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Maintenance assessments per sq ft, parking bay charges, banquet hall bookings, EV charging.
                </p>
              </button>

              {/* School & University */}
              <button
                onClick={() => handleApplyPreset('SCHOOL')}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 hover:bg-indigo-950/20 text-left transition group cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                  <span>School & University</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Semester tuition fees, bus transport routes, STEM robotics lab fees, uniform blazer sets.
                </p>
              </button>

              {/* Hospital & Healthcare */}
              <button
                onClick={() => handleApplyPreset('HOSPITAL')}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 hover:bg-indigo-950/20 text-left transition group cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <HeartPulse className="w-4 h-4" />
                  <span>Hospital & Healthcare</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Specialist physician consults, deluxe inpatient bed tariffs, MRI diagnostic scans, surgical packs.
                </p>
              </button>

              {/* SaaS & Enterprise */}
              <button
                onClick={() => handleApplyPreset('SAAS')}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-indigo-500 hover:bg-indigo-950/20 text-left transition group cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Briefcase className="w-4 h-4" />
                  <span>SaaS & Enterprise</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Annual platform licenses, user per-seat additions, cloud architecture advisory, SOX audit audits.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
