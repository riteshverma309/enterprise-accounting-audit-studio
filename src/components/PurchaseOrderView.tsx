import React, { useState, useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  PackageCheck,
  FileText,
  Sliders,
  AlertCircle,
  Building,
  User,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  Boxes,
  RotateCcw,
  Check,
  X,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  PurchaseOrder,
  PurchaseOrderLineItem,
  PurchaseOrderStatus,
  PoApprovalTierConfig,
  Role,
} from '../types';

export const PurchaseOrderView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    activeTenant,
    activeRole,
    currentUserEmail,
    hasPermission,
    vendors,
    productsServices,
    accounts,
    purchaseOrders,
    poApprovalTiers,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    submitPurchaseOrderForApproval,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    receiveGoodsForPurchaseOrder,
    convertPurchaseOrderToVendorBill,
    updatePoApprovalTiers,
    resetPoApprovalTiersToDefault,
  } = useAccounting();

  // Active sub-tab or view state
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'matrix'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [viewingPo, setViewingPo] = useState<PurchaseOrder | null>(null);
  const [receiveModalPo, setReceiveModalPo] = useState<PurchaseOrder | null>(null);
  const [isApprovalActionOpen, setIsApprovalActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingTier, setEditingTier] = useState<PoApprovalTierConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Filter purchase orders for current tenant
  const tenantPos = useMemo(() => {
    return purchaseOrders.filter((po) => po.tenantId === activeTenant.id);
  }, [purchaseOrders, activeTenant.id]);

  const filteredPos = useMemo(() => {
    return tenantPos.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.items.some((item) => item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const matchesDept = departmentFilter === 'ALL' || po.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [tenantPos, searchTerm, statusFilter, departmentFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = tenantPos.length;
    const totalSpend = tenantPos.reduce((sum, po) => sum + po.totalAmount, 0);
    const pendingPos = tenantPos.filter((po) => po.status === 'PENDING_APPROVAL');
    const pendingSpend = pendingPos.reduce((sum, po) => sum + po.totalAmount, 0);
    const approvedPos = tenantPos.filter((po) => po.status === 'APPROVED' || po.status === 'SENT_TO_VENDOR' || po.status === 'PARTIALLY_RECEIVED');
    const approvedSpend = approvedPos.reduce((sum, po) => sum + po.totalAmount, 0);
    const completedPos = tenantPos.filter((po) => po.status === 'RECEIVED' || po.status === 'BILLED');
    const completedSpend = completedPos.reduce((sum, po) => sum + po.totalAmount, 0);

    return {
      totalCount,
      totalSpend,
      pendingCount: pendingPos.length,
      pendingSpend,
      approvedCount: approvedPos.length,
      approvedSpend,
      completedCount: completedPos.length,
      completedSpend,
    };
  }, [tenantPos]);

  // Current tenant tiers
  const tenantTiers = useMemo(() => {
    return poApprovalTiers
      .filter((t) => t.tenantId === activeTenant.id)
      .sort((a, b) => a.level - b.level);
  }, [poApprovalTiers, activeTenant.id]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    tenantPos.forEach((po) => {
      if (po.department) depts.add(po.department);
    });
    return Array.from(depts);
  }, [tenantPos]);

  // Helpers for Status badge styling
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Edit className="w-3 h-3" />{tr('Draft')}</span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3" />{tr('Pending Approval')}</span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />{tr('Approved')}</span>
        );
      case 'SENT_TO_VENDOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Send className="w-3 h-3" />{tr('Sent to Vendor')}</span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Boxes className="w-3 h-3" />{tr('Partially Received')}</span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <PackageCheck className="w-3 h-3" />{tr('Received (GRN)')}</span>
        );
      case 'BILLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <FileText className="w-3 h-3" /> 3-Way Matched (AP)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />{tr('Rejected')}</span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 line-through">{tr('Cancelled')}</span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Export CSV handler
  const handleExportCsv = () => {
    if (filteredPos.length === 0) {
      showToast('No purchase orders available to export', 'info');
      return;
    }
    const headers = [
      'PO Number',
      'Vendor Name',
      'Department',
      'Issue Date',
      'Expected Delivery',
      'Requested By',
      'Status',
      'Subtotal',
      'Tax Total',
      'Total Amount',
      'Currency',
    ];
    const rows = filteredPos.map((po) => [
      `"${po.poNumber}"`,
      `"${po.vendorName}"`,
      `"${po.department}"`,
      po.issueDate,
      po.expectedDeliveryDate,
      `"${po.requestedBy}"`,
      po.status,
      po.subtotal.toFixed(2),
      po.taxTotal.toFixed(2),
      po.totalAmount.toFixed(2),
      po.currency,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Orders_${activeTenant.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported purchase orders CSV successfully');
  };

  return (
    <div className="space-y-6" id="purchase-orders-module">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
              : 'bg-slate-900/90 text-slate-200 border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">{tr('Purchase Order & Procurement Flow')}<span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{tr('SOX 404 Multi-Tier')}</span>
              </h1>
              <p className="text-xs text-slate-400">{tr('End-to-end purchasing governance: dynamic approval matrix, maker-checker segregation of duties, goods receipt note (GRN), and 3-way AP bill matching.')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Purchase Orders ({tenantPos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Approval Matrix ({tenantTiers.length} Tiers)
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />{tr('Export CSV')}</button>

          {hasPermission('po:create') && (
            <button
              onClick={() => {
                setEditingPo(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-colors"
              id="create-po-button"
            >
              <Plus className="w-4 h-4" />{tr('New Purchase Order')}</button>
          )}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>{tr('Total Orders & Commitments')}</span>
            <Building className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {activeTenant.currency} {metrics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.totalCount} active orders for {activeTenant.name}
          </div>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-1">
            <span>{tr('Awaiting Multi-Tier Approval')}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">
            {activeTenant.currency} {metrics.pendingSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-400/70 mt-1">
            {metrics.pendingCount} POs pending checker sign-off
          </div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-1">
            <span>{tr('Approved & In Procurement')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300">
            {activeTenant.currency} {metrics.approvedSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400/70 mt-1">
            {metrics.approvedCount} POs ready for receipt / shipping
          </div>
        </div>

        <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-xl">
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium mb-1">
            <span>{tr('Received & Billed (3-Way Matched)')}</span>
            <PackageCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300">
            {activeTenant.currency} {metrics.completedSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-400/70 mt-1">
            {metrics.completedCount} POs converted to AP subledger
          </div>
        </div>
      </div>

      {activeSubTab === 'orders' ? (
        /* ================= PURCHASE ORDERS LISTING TAB ================= */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={tr('Search PO #, vendor name, item description, requester...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 text-[11px]">{tr('Status:')}</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{tr('All Statuses')}</option>
                  <option value="DRAFT">{tr('Draft')}</option>
                  <option value="PENDING_APPROVAL">{tr('Pending Approval')}</option>
                  <option value="APPROVED">{tr('Approved')}</option>
                  <option value="SENT_TO_VENDOR">{tr('Sent to Vendor')}</option>
                  <option value="PARTIALLY_RECEIVED">{tr('Partially Received')}</option>
                  <option value="RECEIVED">{tr('Received')}</option>
                  <option value="BILLED">{tr('Billed (AP)')}</option>
                  <option value="REJECTED">{tr('Rejected')}</option>
                </select>
              </div>

              {departments.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[11px]">{tr('Dept:')}</span>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">{tr('All Departments')}</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(searchTerm || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setDepartmentFilter('ALL');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1"
                  title={tr('Reset filters')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">{tr('PO Number & Details')}</th>
                    <th className="px-4 py-3.5">{tr('Vendor & Department')}</th>
                    <th className="px-4 py-3.5">{tr('Timeline & Maker')}</th>
                    <th className="px-4 py-3.5">{tr('Status & Approval Tier')}</th>
                    <th className="px-4 py-3.5 text-right">{tr('Amount')}</th>
                    <th className="px-4 py-3.5 text-right">{tr('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-400">{tr('No Purchase Orders Found')}</p>
                        <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                          {searchTerm || statusFilter !== 'ALL'
                            ? 'No purchase orders match your active filter criteria.'
                            : 'Create your first purchase order to initiate the multi-level approval and receiving workflow.'}
                        </p>
                        {hasPermission('po:create') && (
                          <button
                            onClick={() => {
                              setEditingPo(null);
                              setIsCreateModalOpen(true);
                            }}
                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-4 h-4" />{tr('Create Purchase Order')}</button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredPos.map((po) => {
                      const totalQtyOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0);
                      const totalQtyReceived = po.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
                      const receiptPercent = totalQtyOrdered > 0 ? Math.round((totalQtyReceived / totalQtyOrdered) * 100) : 0;

                      // Check if current user can approve the current tier of this PO
                      const currentTierStep = po.approvalAuditTrail.find((s) => s.level === po.currentApprovalLevel);
                      const isPending = po.status === 'PENDING_APPROVAL';
                      const isCreator = po.requestedBy === currentUserEmail;
                      const tierConfig = tenantTiers.find((t) => t.level === po.currentApprovalLevel);
                      const makerCheckerBlocked = Boolean(isCreator && tierConfig?.enforceMakerChecker && activeRole !== 'super_user');
                      const userCanApprove =
                        isPending &&
                        currentTierStep &&
                        (activeRole === 'super_user' ||
                          activeRole === 'admin' ||
                          activeRole === 'entity_admin' ||
                          activeRole === currentTierStep.requiredRole) &&
                        !makerCheckerBlocked;

                      return (
                        <tr key={po.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* PO Number & Items */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                              <span className="text-indigo-400 font-mono">{po.poNumber}</span>
                              {po.vendorBillNumber && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                                  AP: {po.vendorBillNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                              {po.items.length} item{po.items.length !== 1 ? 's' : ''}:{' '}
                              {po.items.map((i) => `${i.quantity}x ${i.description}`).join(', ')}
                            </div>
                            {po.notes && (
                              <div className="text-[10px] text-slate-500 italic truncate max-w-xs mt-0.5">
                                "{po.notes}"
                              </div>
                            )}
                          </td>

                          {/* Vendor & Department */}
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-200 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{po.vendorName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                                {po.department}
                              </span>
                            </div>
                          </td>

                          {/* Dates & Maker */}
                          <td className="px-4 py-3.5">
                            <div className="text-[11px] text-slate-300 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>Issued: {po.issueDate}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span>Due: {po.expectedDeliveryDate}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <User className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[130px]">{po.requestedByName || po.requestedBy}</span>
                            </div>
                          </td>

                          {/* Status & Approval Progress */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1.5">
                              <div>{getStatusBadge(po.status)}</div>

                              {/* Progress bar or Approval Tier indicator */}
                              {po.status === 'PENDING_APPROVAL' && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-amber-400/90 font-medium">
                                    <span>
                                      Tier {po.currentApprovalLevel} of {po.requiredApprovalLevels}
                                    </span>
                                    <span>{currentTierStep?.tierName || 'Under Review'}</span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${Math.round(((po.currentApprovalLevel - 1) / Math.max(1, po.requiredApprovalLevels)) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  {makerCheckerBlocked && (
                                    <span className="text-[9px] text-amber-500/80 italic block leading-tight">{tr('SOX Maker-Checker: Independent reviewer required')}</span>
                                  )}
                                </div>
                              )}

                              {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED') && (
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>{tr('Goods Received')}</span>
                                    <span className="font-semibold text-slate-300">{receiptPercent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-1.5 rounded-full transition-all duration-300 ${
                                        receiptPercent === 100 ? 'bg-teal-400' : 'bg-indigo-500'
                                      }`}
                                      style={{ width: `${receiptPercent}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3.5 text-right font-mono">
                            <div className="font-bold text-slate-100 text-sm">
                              {po.currency} {po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Sub: {po.subtotal.toFixed(2)} + Tax: {po.taxTotal.toFixed(2)}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => setViewingPo(po)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                title={tr('View Purchase Order Details & Audit Trail')}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Submit for Approval (If Draft) */}
                              {po.status === 'DRAFT' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingPo(po);
                                      setIsCreateModalOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                    title={tr('Edit Draft')}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      submitPurchaseOrderForApproval(po.id);
                                      showToast(`Purchase order ${po.poNumber} submitted for multi-tier approval.`);
                                    }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                    title={tr('Submit for Approval')}
                                  >
                                    <Send className="w-3 h-3" />{tr('Submit')}</button>
                                </>
                              )}

                              {/* Direct Approve / Reject Quick Button */}
                              {userCanApprove && (
                                <button
                                  onClick={() => {
                                    setViewingPo(po);
                                    setActionType('APPROVE');
                                    setIsApprovalActionOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
                                  title={tr('Approve current level')}
                                >
                                  <Check className="w-3 h-3" /> Approve L{po.currentApprovalLevel}
                                </button>
                              )}

                              {/* Goods Receipt (GRN) Button */}
                              {(po.status === 'APPROVED' || po.status === 'SENT_TO_VENDOR' || po.status === 'PARTIALLY_RECEIVED') && (
                                <button
                                  onClick={() => setReceiveModalPo(po)}
                                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title={tr('Receive Goods / Generate GRN')}
                                >
                                  <Boxes className="w-3 h-3" />{tr('Receive')}</button>
                              )}

                              {/* Convert to AP Bill */}
                              {(po.status === 'APPROVED' || po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') && !po.isFullyBilled && (
                                <button
                                  onClick={() => {
                                    const billId = convertPurchaseOrderToVendorBill(po.id);
                                    if (billId) {
                                      showToast(`PO ${po.poNumber} converted to AP Vendor Bill and posted to GL successfully!`);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title={tr('3-Way Match & Convert to AP Vendor Bill')}
                                >
                                  <FileText className="w-3 h-3" />{tr('Create AP Bill')}</button>
                              )}

                              {/* Delete (Draft only) */}
                              {po.status === 'DRAFT' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete draft PO ${po.poNumber}?`)) {
                                      deletePurchaseOrder(po.id);
                                      showToast(`Draft PO ${po.poNumber} deleted.`);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-300 rounded-lg transition-colors"
                                  title={tr('Delete Draft PO')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
      ) : (
        /* ================= APPROVAL MATRIX CONFIGURATION TAB ================= */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />{tr('Configurable Purchase Order Approval Matrix')}</h2>
                <p className="text-xs text-slate-400 mt-1">{tr('Define tiered monetary thresholds, required approver roles, and mandatory SOX 404 segregation of duties (Maker-Checker separation).')}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('Reset approval matrix to default standard SOX 404 tiers?')) {
                      resetPoApprovalTiersToDefault(activeTenant.id);
                      showToast('Approval matrix reset to default configuration.');
                    }
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />{tr('Reset to Standard Matrix')}</button>
              </div>
            </div>

            {/* Matrix Tiers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">{tr('Level')}</th>
                    <th className="px-4 py-3">{tr('Tier Name & Scope')}</th>
                    <th className="px-4 py-3">Monetary Range ({activeTenant.currency})</th>
                    <th className="px-4 py-3">{tr('Authorized Role')}</th>
                    <th className="px-4 py-3 text-center">{tr('SOX Maker-Checker')}</th>
                    <th className="px-4 py-3 text-center">{tr('Status')}</th>
                    <th className="px-4 py-3 text-right">{tr('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {tenantTiers.map((tier) => (
                    <tr key={tier.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 font-mono font-bold text-indigo-400 flex items-center justify-center text-xs">
                          L{tier.level}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-100">{tier.name}</div>
                        <div className="text-[11px] text-slate-400">{tier.description}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        <div className="text-slate-200 font-semibold">
                          ${tier.minAmount.toLocaleString()} -{' '}
                          {tier.maxAmount !== null ? `$${tier.maxAmount.toLocaleString()}` : '∞ (Unlimited)'}
                        </div>
                        {tier.autoApproveBelowThreshold && (
                          <span className="text-[10px] text-teal-400">{tr('Auto-approve enabled below min')}</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 font-mono text-[11px] uppercase">
                          {tier.requiredRole}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {tier.enforceMakerChecker ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3" />{tr('Enforced')}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{tr('Optional')}</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => {
                            const updated = tenantTiers.map((t) =>
                              t.id === tier.id ? { ...t, isEnabled: !t.isEnabled } : t
                            );
                            updatePoApprovalTiers(updated);
                            showToast(`Tier ${tier.name} ${tier.isEnabled ? 'disabled' : 'enabled'}.`);
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                            tier.isEnabled
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {tier.isEnabled ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setEditingTier(tier)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                        >{tr('Configure')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SOX Guidance Banner */}
            <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-300 space-y-1">
                <p className="font-semibold text-slate-200">{tr('How the Dynamic Multi-Tier Engine Evaluates Orders:')}</p>
                <p className="text-slate-400 leading-relaxed">
                  When a user submits a Purchase Order, the system checks the grand total amount against active tiers. If the amount exceeds Tier 1 ceiling, Tier 2 approval is sequentially mandated; if it exceeds Tier 2, Tier 3 sign-off is automatically attached. Approvals proceed sequentially in ascending order of level.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE / EDIT PURCHASE ORDER MODAL ================= */}
      {isCreateModalOpen && (
        <PurchaseOrderFormModal
          tenantId={activeTenant.id}
          currency={activeTenant.currency}
          vendors={vendors}
          productsServices={productsServices}
          accounts={accounts}
          approvalTiers={tenantTiers}
          currentUserEmail={currentUserEmail}
          existingPo={editingPo}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPo(null);
          }}
          onSave={(poData, submitImmediately) => {
            if (editingPo) {
              updatePurchaseOrder(editingPo.id, poData);
              if (submitImmediately) {
                submitPurchaseOrderForApproval(editingPo.id);
                showToast(`Purchase order ${editingPo.poNumber} updated and submitted for approval!`);
              } else {
                showToast(`Purchase order ${editingPo.poNumber} updated successfully.`);
              }
            } else {
              const newPo = createPurchaseOrder(poData);
              if (submitImmediately) {
                submitPurchaseOrderForApproval(newPo.id);
                showToast(`Purchase order ${newPo.poNumber} created and submitted for multi-tier approval!`);
              } else {
                showToast(`Purchase order ${newPo.poNumber} saved as draft.`);
              }
            }
            setIsCreateModalOpen(false);
            setEditingPo(null);
          }}
        />
      )}

      {/* ================= DETAILED PO & AUDIT TRAIL MODAL ================= */}
      {viewingPo && (
        <PurchaseOrderDetailModal
          po={viewingPo}
          currency={activeTenant.currency}
          activeRole={activeRole}
          currentUserEmail={currentUserEmail}
          approvalTiers={tenantTiers}
          onClose={() => setViewingPo(null)}
          onApprove={(comments) => {
            approvePurchaseOrder(viewingPo.id, comments);
            showToast(`Approved level ${viewingPo.currentApprovalLevel} on PO ${viewingPo.poNumber}!`);
            // Refresh viewing PO state from updated context
            const updated = purchaseOrders.find((p) => p.id === viewingPo.id);
            if (updated) setViewingPo(updated);
            else setViewingPo(null);
          }}
          onReject={(reason) => {
            rejectPurchaseOrder(viewingPo.id, reason);
            showToast(`Rejected PO ${viewingPo.poNumber}.`, 'error');
            setViewingPo(null);
          }}
          onConvertToBill={() => {
            const billId = convertPurchaseOrderToVendorBill(viewingPo.id);
            if (billId) {
              showToast(`PO ${viewingPo.poNumber} converted to AP Vendor Bill!`);
              const updated = purchaseOrders.find((p) => p.id === viewingPo.id);
              if (updated) setViewingPo(updated);
            }
          }}
          onOpenReceiveModal={() => {
            setReceiveModalPo(viewingPo);
          }}
        />
      )}

      {/* ================= GOODS RECEIPT (GRN) MODAL ================= */}
      {receiveModalPo && (
        <GoodsReceiptModal
          po={receiveModalPo}
          onClose={() => setReceiveModalPo(null)}
          onConfirmReceipt={(receiptItems) => {
            receiveGoodsForPurchaseOrder(receiveModalPo.id, receiptItems);
            showToast(`Goods receipt processed for PO ${receiveModalPo.poNumber}! Inventory adjusted.`);
            setReceiveModalPo(null);
            if (viewingPo && viewingPo.id === receiveModalPo.id) {
              const updated = purchaseOrders.find((p) => p.id === receiveModalPo.id);
              if (updated) setViewingPo(updated);
            }
          }}
        />
      )}

      {/* ================= EDIT TIER MODAL ================= */}
      {editingTier && (
        <TierConfigModal
          tier={editingTier}
          onClose={() => setEditingTier(null)}
          onSave={(updatedTier) => {
            const updatedList = tenantTiers.map((t) => (t.id === updatedTier.id ? updatedTier : t));
            updatePoApprovalTiers(updatedList);
            showToast(`Tier ${updatedTier.name} configuration saved!`);
            setEditingTier(null);
          }}
        />
      )}
    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: Purchase Order Form Modal (Create / Edit)                 */
/* ========================================================================= */
interface PurchaseOrderFormModalProps {
  tenantId: string;
  currency: string;
  vendors: any[];
  productsServices: any[];
  accounts: any[];
  approvalTiers: PoApprovalTierConfig[];
  currentUserEmail: string;
  existingPo?: PurchaseOrder | null;
  onClose: () => void;
  onSave: (poData: Partial<PurchaseOrder>, submitImmediately: boolean) => void;
}

const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  tenantId,
  currency,
  vendors,
  productsServices,
  accounts,
  approvalTiers,
  currentUserEmail,
  existingPo,
  onClose,
  onSave,
}) => {
  const [vendorId, setVendorId] = useState(existingPo?.vendorId || (vendors[0]?.id || ''));
  const [vendorName, setVendorName] = useState(existingPo?.vendorName || (vendors[0]?.name || ''));
  const [vendorEmail, setVendorEmail] = useState(existingPo?.vendorEmail || (vendors[0]?.email || ''));
  const [issueDate, setIssueDate] = useState(existingPo?.issueDate || new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    existingPo?.expectedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [department, setDepartment] = useState(existingPo?.department || 'Operations');
  const [shippingAddress, setShippingAddress] = useState(
    existingPo?.shippingAddress || '100 Enterprise Way, Suite 400, Austin, TX 78701'
  );
  const [paymentTerms, setPaymentTerms] = useState(existingPo?.paymentTerms || 'Net 30');
  const [notes, setNotes] = useState(existingPo?.notes || '');

  // Line items state
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>(
    existingPo?.items || [
      {
        id: `item-${Date.now()}-1`,
        description: 'Server Infrastructure & Hardware Upgrade',
        quantity: 5,
        receivedQuantity: 0,
        unitPrice: 1200,
        taxRate: 10,
        taxAmount: 600,
        amount: 6000,
        totalAmount: 6600,
        unitOfMeasure: 'Units',
        expenseAccountCode: '5010',
      },
    ]
  );

  // Auto-fill vendor data when selected
  const handleVendorSelect = (id: string) => {
    setVendorId(id);
    const selected = vendors.find((v) => v.id === id);
    if (selected) {
      setVendorName(selected.name);
      setVendorEmail(selected.email || '');
      if (selected.paymentTerms) setPaymentTerms(selected.paymentTerms);
    }
  };

  // Line item mutation helpers
  const handleUpdateLine = (index: number, field: keyof PurchaseOrderLineItem, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };

    // Recompute amounts
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const taxRate = Number(item.taxRate) || 0;

    const subtotal = qty * price;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    item.amount = subtotal;
    item.taxAmount = taxAmount;
    item.totalAmount = total;

    updated[index] = item;
    setLineItems(updated);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = productsServices.find((p) => p.id === productId);
    if (prod) {
      const updated = [...lineItems];
      const item = {
        ...updated[index],
        productId: prod.id,
        productCode: prod.code || prod.sku,
        description: prod.name,
        unitPrice: prod.unitPrice || prod.price || updated[index].unitPrice,
        taxRate: prod.taxRate ?? 10,
      };

      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;
      const subtotal = qty * price;
      const taxAmount = (subtotal * taxRate) / 100;

      item.amount = subtotal;
      item.taxAmount = taxAmount;
      item.totalAmount = subtotal + taxAmount;

      updated[index] = item;
      setLineItems(updated);
    }
  };

  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      {
        id: `item-${Date.now()}-${lineItems.length + 1}`,
        description: '',
        quantity: 1,
        receivedQuantity: 0,
        unitPrice: 0,
        taxRate: 10,
        taxAmount: 0,
        amount: 0,
        totalAmount: 0,
        unitOfMeasure: 'Units',
        expenseAccountCode: '5010',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Grand totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = subtotal + taxTotal;

  // Dynamic preview of applicable tiers
  const applicableTiers = useMemo(() => {
    return approvalTiers.filter((tier) => {
      if (!tier.isEnabled) return false;
      if (totalAmount < tier.minAmount) return false;
      return true;
    });
  }, [approvalTiers, totalAmount]);

  const handleSubmit = (submitImmediately: boolean) => {
    if (!vendorName) {
      alert('Please select or specify a vendor.');
      return;
    }
    if (lineItems.some((i) => !i.description || i.quantity <= 0)) {
      alert('Please complete all line item descriptions and ensure quantities are positive.');
      return;
    }

    const payload: Partial<PurchaseOrder> = {
      vendorId,
      vendorName,
      vendorEmail,
      issueDate,
      expectedDeliveryDate,
      department,
      shippingAddress,
      paymentTerms,
      notes,
      items: lineItems,
      subtotal,
      taxTotal,
      totalAmount,
      currency,
    };

    onSave(payload, submitImmediately);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {existingPo ? `Edit Purchase Order ${existingPo.poNumber}` : 'Create New Purchase Order'}
              </h2>
              <p className="text-xs text-slate-400">{tr('Enter vendor details, procurement items, and view real-time approval matrix routing.')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Vendor / Supplier')}<span className="text-rose-400">*</span>
              </label>
              <select
                value={vendorId}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vendorCode || v.email || 'Vendor'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Department')}<span className="text-rose-400">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Operations">{tr('Operations')}</option>
                <option value="Engineering & IT">{tr('Engineering & IT')}</option>
                <option value="Facilities & Admin">{tr('Facilities & Admin')}</option>
                <option value="Finance & Accounting">{tr('Finance & Accounting')}</option>
                <option value="Marketing & Sales">{tr('Marketing & Sales')}</option>
                <option value="Human Resources">{tr('Human Resources')}</option>
                <option value="Procurement">{tr('Procurement')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Payment Terms')}</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Net 15">{tr('Net 15')}</option>
                <option value="Net 30">{tr('Net 30')}</option>
                <option value="Net 60">{tr('Net 60')}</option>
                <option value="Due on Receipt">{tr('Due on Receipt')}</option>
                <option value="Advance Payment">{tr('Advance Payment')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Issue Date')}</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Expected Delivery Date')}</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Vendor Contact Email')}</label>
              <input
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder={tr('vendor@company.com')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Line Items Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-indigo-400" />
                Procurement Items & Services ({lineItems.length})
              </h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />{tr('Add Item')}</button>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">{tr('Catalog Preset')}</th>
                    <th className="px-3 py-2.5">{tr('Item Description')}</th>
                    <th className="px-3 py-2.5 w-20">{tr('Qty')}</th>
                    <th className="px-3 py-2.5 w-24">{tr('Unit Price')}</th>
                    <th className="px-3 py-2.5 w-20">{tr('Tax %')}</th>
                    <th className="px-3 py-2.5 w-28">{tr('Expense GL')}</th>
                    <th className="px-3 py-2.5 text-right w-24">{tr('Total')}</th>
                    <th className="px-2 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      {/* Preset selector */}
                      <td className="px-3 py-2">
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                        >
                          <option value="">{tr('-- Custom Item --')}</option>
                          {productsServices.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.unitPrice || p.price})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateLine(idx, 'description', e.target.value)}
                          placeholder={tr('e.g. Dell PowerEdge Server R750')}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs focus:border-indigo-500"
                        />
                      </td>

                      {/* Qty */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateLine(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs font-mono text-center"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="px-3 py-2 font-mono">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs font-mono text-right"
                        />
                      </td>

                      {/* Tax % */}
                      <td className="px-3 py-2 font-mono">
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => handleUpdateLine(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs font-mono text-center"
                        />
                      </td>

                      {/* Expense Account */}
                      <td className="px-3 py-2">
                        <select
                          value={item.expenseAccountCode || '5010'}
                          onChange={(e) => handleUpdateLine(idx, 'expenseAccountCode', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 font-mono"
                        >
                          <option value="5010">{tr('5010 - Cost of Goods Sold')}</option>
                          <option value="6010">{tr('6010 - Rent & Facility')}</option>
                          <option value="6020">{tr('6020 - Software & Subscriptions')}</option>
                          <option value="6030">{tr('6030 - Hardware & Equipment')}</option>
                          <option value="6040">{tr('6040 - Professional Services')}</option>
                          <option value="6050">{tr('6050 - Office Supplies')}</option>
                        </select>
                      </td>

                      {/* Total */}
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-100">
                        ${item.totalAmount.toFixed(2)}
                      </td>

                      {/* Delete button */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lineItems.length === 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Summary & Real-Time Approval Matrix Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real-time Approval Preview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Required Approval Routing Preview:
              </div>
              <p className="text-[11px] text-slate-400">
                Based on grand total (${totalAmount.toFixed(2)}), this purchase order will activate{' '}
                <span className="font-semibold text-indigo-300">{applicableTiers.length} approval tier(s)</span>:
              </p>

              <div className="space-y-1.5 pt-1">
                {applicableTiers.length === 0 ? (
                  <div className="text-[11px] text-teal-400 bg-teal-500/10 p-2 rounded-lg border border-teal-500/20">
                    ✓ Total is below minimum threshold. Auto-approval eligible upon submission.
                  </div>
                ) : (
                  applicableTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-indigo-600/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center font-mono">
                          L{tier.level}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200 text-[11px]">{tier.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Required Role: <span className="uppercase text-slate-300 font-mono">{tier.requiredRole}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">{tr('Threshold Triggered')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totals Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{tr('Subtotal:')}</span>
                  <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{tr('Estimated Tax:')}</span>
                  <span className="font-mono text-slate-200">${taxTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-slate-100">
                  <span>Grand Total ({currency}):</span>
                  <span className="font-mono text-indigo-400 text-base">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">{tr('Notes / Delivery Instructions')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tr('e.g. Deliver to Loading Dock B, Attn: IT Ops')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >{tr('Cancel')}</button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Edit className="w-3.5 h-3.5" />{tr('Save as Draft')}</button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />{tr('Submit for Approval')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: Purchase Order Detail & Approval Audit Trail Modal         */
/* ========================================================================= */
interface PurchaseOrderDetailModalProps {
  po: PurchaseOrder;
  currency: string;
  activeRole: Role;
  currentUserEmail: string;
  approvalTiers: PoApprovalTierConfig[];
  onClose: () => void;
  onApprove: (comments?: string) => void;
  onReject: (reason: string) => void;
  onConvertToBill: () => void;
  onOpenReceiveModal: () => void;
}

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  po,
  currency,
  activeRole,
  currentUserEmail,
  approvalTiers,
  onClose,
  onApprove,
  onReject,
  onConvertToBill,
  onOpenReceiveModal,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');
  const [comments, setComments] = useState('');
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Check current tier step
  const currentStep = po.approvalAuditTrail.find((s) => s.level === po.currentApprovalLevel);
  const isPending = po.status === 'PENDING_APPROVAL';
  const isCreator = po.requestedBy === currentUserEmail;
  const currentTierConfig = approvalTiers.find((t) => t.level === po.currentApprovalLevel);
  const makerCheckerViolation = isCreator && currentTierConfig?.enforceMakerChecker && activeRole !== 'super_user';

  const canApprove =
    isPending &&
    currentStep &&
    (activeRole === 'super_user' ||
      activeRole === 'admin' ||
      activeRole === 'entity_admin' ||
      activeRole === currentStep.requiredRole) &&
    !makerCheckerViolation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 font-mono">{po.poNumber}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {po.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vendor: <span className="text-slate-200 font-medium">{po.vendorName}</span> • Department:{' '}
                <span className="text-slate-200 font-medium">{po.department}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'details' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >{tr('Order Breakdown')}</button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approval Audit Trail ({po.approvalAuditTrail.length})
              </button>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Top SOX Alert if user is Maker and cannot self-approve */}
          {makerCheckerViolation && (
            <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-300 space-y-1">
                <p className="font-bold">{tr('SOX 404 Segregation of Duties (Maker-Checker Policy):')}</p>
                <p className="text-amber-400/90 leading-relaxed">
                  You created this purchase order ({po.requestedBy}). In strict compliance with SOX 404 internal controls, self-approval is forbidden. An independent reviewer with the authorized role ({currentStep?.requiredRole}) must approve this tier.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">{tr('Vendor Details')}</div>
                  <div className="font-bold text-slate-200 text-xs mt-0.5">{po.vendorName}</div>
                  <div className="text-[11px] text-slate-400">{po.vendorEmail || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">{tr('Maker / Requested By')}</div>
                  <div className="font-bold text-slate-200 text-xs mt-0.5">{po.requestedByName || po.requestedBy}</div>
                  <div className="text-[11px] text-slate-400 uppercase font-mono">{po.requestedRole}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">{tr('Important Dates')}</div>
                  <div className="text-slate-200 text-xs mt-0.5">Issued: {po.issueDate}</div>
                  <div className="text-[11px] text-slate-400">Expected: {po.expectedDeliveryDate}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">{tr('Payment & Shipping')}</div>
                  <div className="text-slate-200 text-xs mt-0.5">{po.paymentTerms || 'Net 30'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{po.shippingAddress || 'Default HQ'}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-200 text-xs">{tr('Ordered Line Items')}</h3>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">{tr('Item Description')}</th>
                        <th className="px-3 py-2.5 text-center">{tr('Ordered')}</th>
                        <th className="px-3 py-2.5 text-center">{tr('Received')}</th>
                        <th className="px-4 py-2.5 text-right">{tr('Unit Price')}</th>
                        <th className="px-4 py-2.5 text-right">{tr('Tax Rate')}</th>
                        <th className="px-4 py-2.5 text-right">{tr('Total Amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {po.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200">{item.description}</div>
                            {item.expenseAccountCode && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                GL Code: {item.expenseAccountCode}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-medium">{item.quantity}</td>
                          <td className="px-3 py-3 text-center font-mono font-medium">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                item.receivedQuantity >= item.quantity
                                  ? 'bg-teal-500/20 text-teal-300'
                                  : item.receivedQuantity > 0
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.receivedQuantity || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">{item.taxRate}%</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-100">
                            ${item.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals strip */}
              <div className="flex justify-end">
                <div className="w-64 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>{tr('Subtotal:')}</span>
                    <span className="font-mono text-slate-200">${po.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{tr('Tax Total:')}</span>
                    <span className="font-mono text-slate-200">${po.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between text-sm font-bold text-slate-100">
                    <span>{tr('Grand Total:')}</span>
                    <span className="font-mono text-indigo-400 text-base">${po.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* APPROVAL AUDIT TRAIL VIEW */
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="font-bold text-slate-200 text-xs mb-3">{tr('Multi-Tier Approval Pipeline')}</h3>
                <div className="space-y-4">
                  {po.approvalAuditTrail.map((step, idx) => {
                    const isStepApproved = step.status === 'APPROVED';
                    const isStepRejected = step.status === 'REJECTED';
                    const isStepPending = step.status === 'PENDING';
                    const isStepNotStarted = step.status === 'NOT_STARTED';

                    return (
                      <div
                        key={step.id}
                        className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                          isStepApproved
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : isStepRejected
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : isStepPending
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-500/5'
                            : 'bg-slate-900/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                              isStepApproved
                                ? 'bg-emerald-600 text-white'
                                : isStepRejected
                                ? 'bg-rose-600 text-white'
                                : isStepPending
                                ? 'bg-amber-500 text-slate-950 animate-bounce'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isStepApproved ? (
                              <Check className="w-4 h-4" />
                            ) : isStepRejected ? (
                              <X className="w-4 h-4" />
                            ) : (
                              `L${step.level}`
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                              <span>{step.tierName}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono uppercase">
                                Role: {step.requiredRole}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 mt-1">
                              {isStepApproved && (
                                <span className="text-emerald-400">{tr('Approved by')}<span className="font-semibold">{step.actionBy}</span> on{' '}
                                  {step.actionDate?.slice(0, 16).replace('T', ' ')}
                                </span>
                              )}
                              {isStepRejected && (
                                <span className="text-rose-400">{tr('Rejected by')}<span className="font-semibold">{step.actionBy}</span>: "
                                  {step.rejectionReason || 'No reason specified'}"
                                </span>
                              )}
                              {isStepPending && (
                                <span className="text-amber-400 font-medium">
                                  Awaiting sign-off from authorized {step.requiredRole.toUpperCase()} reviewer...
                                </span>
                              )}
                              {isStepNotStarted && (
                                <span className="text-slate-500">{tr('Pending completion of prior approval tiers.')}</span>
                              )}
                            </div>

                            {step.comments && (
                              <p className="text-[10px] text-slate-300 italic bg-slate-900/80 px-2 py-1 rounded border border-slate-800 mt-1.5">
                                "{step.comments}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              isStepApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : isStepRejected
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : isStepPending
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Reviewer Approval Box (If user has right to approve) */}
          {canApprove && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Sign-Off Action (Level {po.currentApprovalLevel}: {currentStep?.tierName})
              </div>
              <p className="text-[11px] text-slate-300">
                You are logged in as an authorized reviewer (<span className="font-semibold text-emerald-400">{activeRole}</span>). Provide optional audit notes to approve or specify a rejection rationale.
              </p>

              <div>
                <input
                  type="text"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={tr('Optional approver sign-off notes / budget verification comment...')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectionModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />{tr('Reject Order')}</button>
                <button
                  type="button"
                  onClick={() => onApprove(comments)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve Level {po.currentApprovalLevel}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
          >{tr('Close')}</button>

          <div className="flex items-center gap-2">
            {(po.status === 'APPROVED' || po.status === 'SENT_TO_VENDOR' || po.status === 'PARTIALLY_RECEIVED') && (
              <button
                onClick={onOpenReceiveModal}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Boxes className="w-3.5 h-3.5" />{tr('Receive Goods (GRN)')}</button>
            )}

            {(po.status === 'APPROVED' || po.status === 'RECEIVED' || po.status === 'PARTIALLY_RECEIVED') && !po.isFullyBilled && (
              <button
                onClick={onConvertToBill}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> 3-Way Match & Convert to AP Bill
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Reject Purchase Order {po.poNumber}
            </h3>
            <p className="text-xs text-slate-300">{tr('Please enter the specific reason for rejecting this purchase order. This reason will be permanently recorded in the SOX audit trail.')}</p>

            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder={tr('e.g. Budget ceiling exceeded for Q3, or vendor pricing not negotiated according to enterprise agreement.')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 text-xs focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >{tr('Cancel')}</button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectionReasonInput.trim()) {
                    alert('Please enter a rejection reason.');
                    return;
                  }
                  onReject(rejectionReasonInput);
                  setRejectionModalOpen(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs"
              >{tr('Confirm Rejection')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: Goods Receipt (GRN) Modal                                  */
/* ========================================================================= */
interface GoodsReceiptModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onConfirmReceipt: (
    items: {
      lineItemId: string;
      description: string;
      orderedQuantity: number;
      previouslyReceivedQuantity: number;
      quantityToReceive: number;
      batchOrSerialNo?: string;
      conditionNotes?: string;
    }[]
  ) => void;
}

const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({ po, onClose, onConfirmReceipt }) => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const [receiptState, setReceiptState] = useState(
    po.items.map((item) => {
      const remaining = Math.max(0, item.quantity - (item.receivedQuantity || 0));
      return {
        lineItemId: item.id,
        description: item.description,
        orderedQuantity: item.quantity,
        previouslyReceivedQuantity: item.receivedQuantity || 0,
        quantityToReceive: remaining, // default to receiving all remaining
        batchOrSerialNo: '',
        conditionNotes: 'Inspected and verified in good condition.',
      };
    })
  );

  const handleQtyChange = (index: number, val: number) => {
    const updated = [...receiptState];
    const maxAllowed = updated[index].orderedQuantity - updated[index].previouslyReceivedQuantity;
    updated[index].quantityToReceive = Math.max(0, Math.min(maxAllowed, val));
    setReceiptState(updated);
  };

  const handleTextChange = (index: number, field: 'batchOrSerialNo' | 'conditionNotes', val: string) => {
    const updated = [...receiptState];
    updated[index][field] = val;
    setReceiptState(updated);
  };

  const totalToReceive = receiptState.reduce((sum, item) => sum + item.quantityToReceive, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Receive Goods Note (GRN) • {po.poNumber}</h2>
              <p className="text-xs text-slate-400">{tr('Log quantities delivered by vendor. Matching inventory stock quantities will automatically update.')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">{tr('Item Description')}</th>
                  <th className="px-3 py-2.5 text-center">{tr('Ordered')}</th>
                  <th className="px-3 py-2.5 text-center">{tr('Prev. Received')}</th>
                  <th className="px-3 py-2.5 text-center w-28">{tr('Receive Now')}</th>
                  <th className="px-4 py-2.5">{tr('Batch / Serial & Notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {receiptState.map((row, idx) => {
                  const remaining = row.orderedQuantity - row.previouslyReceivedQuantity;
                  return (
                    <tr key={row.lineItemId} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {row.description}
                      </td>

                      <td className="px-3 py-3 text-center font-mono">{row.orderedQuantity}</td>
                      <td className="px-3 py-3 text-center font-mono text-slate-400">{row.previouslyReceivedQuantity}</td>

                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={row.quantityToReceive}
                          onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 0)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-teal-400 focus:border-teal-500"
                        />
                        <div className="text-[9px] text-slate-500 mt-0.5">max: {remaining}</div>
                      </td>

                      <td className="px-4 py-3 space-y-1">
                        <input
                          type="text"
                          value={row.batchOrSerialNo}
                          onChange={(e) => handleTextChange(idx, 'batchOrSerialNo', e.target.value)}
                          placeholder={tr('Serial / Batch # (optional)')}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                        />
                        <input
                          type="text"
                          value={row.conditionNotes}
                          onChange={(e) => handleTextChange(idx, 'conditionNotes', e.target.value)}
                          placeholder={tr('Condition notes')}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
          >{tr('Cancel')}</button>

          <button
            onClick={() => onConfirmReceipt(receiptState)}
            disabled={totalToReceive <= 0}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <PackageCheck className="w-4 h-4" /> Confirm Goods Receipt ({totalToReceive} units)
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: Tier Configuration Modal                                   */
/* ========================================================================= */
interface TierConfigModalProps {
  tier: PoApprovalTierConfig;
  onClose: () => void;
  onSave: (tier: PoApprovalTierConfig) => void;
}

const TierConfigModal: React.FC<TierConfigModalProps> = ({ tier, onClose, onSave }) => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const [name, setName] = useState(tier.name);
  const [description, setDescription] = useState(tier.description);
  const [minAmount, setMinAmount] = useState(tier.minAmount);
  const [maxAmount, setMaxAmount] = useState<number | null>(tier.maxAmount);
  const [requiredRole, setRequiredRole] = useState<Role>(tier.requiredRole);
  const [enforceMakerChecker, setEnforceMakerChecker] = useState(tier.enforceMakerChecker);
  const [autoApproveBelowThreshold, setAutoApproveBelowThreshold] = useState(tier.autoApproveBelowThreshold);
  const [isEnabled, setIsEnabled] = useState(tier.isEnabled);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...tier,
      name,
      description,
      minAmount,
      maxAmount,
      requiredRole,
      enforceMakerChecker,
      autoApproveBelowThreshold,
      isEnabled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" /> Configure Approval Level {tier.level}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Tier Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Description / Policy Scope')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Min Amount ($)')}</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Max Ceiling ($ or empty)')}</label>
              <input
                type="number"
                value={maxAmount === null ? '' : maxAmount}
                onChange={(e) => setMaxAmount(e.target.value === '' ? null : parseFloat(e.target.value))}
                placeholder={tr('Unlimited')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">{tr('Required Approver Role')}</label>
            <select
              value={requiredRole}
              onChange={(e) => setRequiredRole(e.target.value as Role)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 uppercase font-mono"
            >
              <option value="manager">{tr('Manager / Department Head')}</option>
              <option value="auditor">{tr('Auditor / Finance Controller')}</option>
              <option value="entity_admin">{tr('Entity Admin / GM')}</option>
              <option value="admin">{tr('Global Financial Administrator')}</option>
              <option value="super_user">{tr('Super Admin')}</option>
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceMakerChecker}
                onChange={(e) => setEnforceMakerChecker(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">{tr('Enforce SOX 404 Maker-Checker (PO creator cannot approve)')}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">{tr('Enable this approval level')}</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >{tr('Cancel')}</button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs"
            >{tr('Save Tier Config')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
