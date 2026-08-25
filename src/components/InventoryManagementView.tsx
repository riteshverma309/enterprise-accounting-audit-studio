import React, { useState, useMemo } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { useAccounting } from '../context/AccountingContext';
import { InventoryStockItem, InventoryAdjustmentRecord } from '../types';
import {
  Boxes,
  PackagePlus,
  ArrowUpDown,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  History,
  DollarSign,
  Layers,
  BookOpenCheck,
  Building,
  Plus,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';

export const InventoryManagementView: React.FC = () => {
  const { t, tr, formatCurrency, formatNumber, formatDate } = useLanguage();
  const {
    activeTenant,
    inventoryItems,
    inventoryAdjustments,
    createInventoryItem,
    updateInventoryItem,
    adjustInventoryStock,
    deleteInventoryItem,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Add Item Modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hardware & Networking');
  const [unitOfMeasure, setUnitOfMeasure] = useState('UNITS');
  const [quantityOnHand, setQuantityOnHand] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [reorderThreshold, setReorderThreshold] = useState<number>(10);
  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'WEIGHTED_AVERAGE'>('FIFO');
  const [location, setLocation] = useState('Warehouse Bay 4A');
  const [supplierName, setSupplierName] = useState('');

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryStockItem | null>(null);
  const [adjustType, setAdjustType] = useState<InventoryAdjustmentRecord['type']>('PURCHASE_RECEIPT');
  const [quantityDelta, setQuantityDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('New vendor stock receipt batch');
  const [postToGl, setPostToGl] = useState(true);

  // Success Notification
  const [notification, setNotification] = useState('');

  const categories = [
    'Hardware & Networking',
    'Electronics & Workstations',
    'Sensors & IoT Devices',
    'Server Accessories',
    'Packaging & Materials',
  ];

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (item.tenantId !== activeTenant.id) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.supplierName && item.supplierName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [inventoryItems, activeTenant.id, statusFilter, categoryFilter, searchTerm]);

  // Filtered Adjustments
  const filteredAdjustments = useMemo(() => {
    return inventoryAdjustments.filter((adj) => {
      if (adj.tenantId !== activeTenant.id) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          adj.sku.toLowerCase().includes(q) ||
          adj.name.toLowerCase().includes(q) ||
          adj.reason.toLowerCase().includes(q) ||
          adj.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventoryAdjustments, activeTenant.id, searchTerm]);

  // Total Valuation
  const totalValuation = useMemo(() => {
    return inventoryItems
      .filter((i) => i.tenantId === activeTenant.id)
      .reduce((sum, i) => sum + i.totalValuation, 0);
  }, [inventoryItems, activeTenant.id]);

  const lowStockCount = useMemo(() => {
    return inventoryItems.filter((i) => i.tenantId === activeTenant.id && i.status === 'LOW_STOCK').length;
  }, [inventoryItems, activeTenant.id]);

  const outOfStockCount = useMemo(() => {
    return inventoryItems.filter((i) => i.tenantId === activeTenant.id && i.status === 'OUT_OF_STOCK').length;
  }, [inventoryItems, activeTenant.id]);

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || unitCost <= 0) return;

    createInventoryItem({
      tenantId: activeTenant.id,
      sku: sku.toUpperCase(),
      name,
      category,
      unitOfMeasure,
      quantityOnHand: Number(quantityOnHand),
      unitCost: Number(unitCost),
      sellingPrice: Number(sellingPrice),
      reorderThreshold: Number(reorderThreshold),
      valuationMethod,
      location,
      supplierName: supplierName || undefined,
      lastRestockedDate: new Date().toISOString().split('T')[0],
    });

    setIsAddItemModalOpen(false);
    resetNewItemForm();
    setNotification(`Stock item ${name} (${sku}) created successfully.`);
    setTimeout(() => setNotification(''), 4000);
  };

  const resetNewItemForm = () => {
    setSku('');
    setName('');
    setCategory('Hardware & Networking');
    setUnitOfMeasure('UNITS');
    setQuantityOnHand(0);
    setUnitCost(0);
    setSellingPrice(0);
    setReorderThreshold(10);
    setValuationMethod('FIFO');
    setLocation('Warehouse Bay 4A');
    setSupplierName('');
  };

  const handleOpenAdjustModal = (item: InventoryStockItem) => {
    setSelectedItemForAdjust(item);
    setAdjustType('PURCHASE_RECEIPT');
    setQuantityDelta(10);
    setAdjustReason('Regular inventory replenishment');
    setPostToGl(true);
    setIsAdjustModalOpen(true);
  };

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust || quantityDelta === 0) return;

    const finalDelta =
      adjustType === 'DAMAGE_SHRINKAGE' || adjustType === 'SALES_DELIVERY' || adjustType === 'SUPPLIER_RETURN'
        ? -Math.abs(quantityDelta)
        : Math.abs(quantityDelta);

    const res = adjustInventoryStock({
      itemId: selectedItemForAdjust.id,
      type: adjustType,
      quantityDelta: finalDelta,
      reason: adjustReason,
      unitCost: selectedItemForAdjust.unitCost,
      postToGl,
    });

    if (res.success) {
      setIsAdjustModalOpen(false);
      setSelectedItemForAdjust(null);
      setNotification(`Stock adjusted for ${selectedItemForAdjust.name} (${finalDelta > 0 ? '+' : ''}${finalDelta} units).`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">{tr('Asset & Stock Control')}</span>
            <span className="text-xs text-slate-400">{tr('FIFO / Weighted Average Perpetual Inventory')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-amber-400" />{tr('Inventory Tracking & Stock Movements')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tr('Track merchandise stock levels, reorder thresholds, automated valuation balances, and perpetual General Ledger COGS postings.')}</p>
        </div>

        <button
          onClick={() => {
            resetNewItemForm();
            setIsAddItemModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
        >
          <PackagePlus className="w-4 h-4" />{tr('Add New Stock Item')}</button>
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
            <span className="text-xs font-medium">{tr('Total Inventory Asset Value')}</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{tr('General Ledger Asset Balance (Acc 1500)')}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{tr('Total Catalog SKUs')}</span>
            <Layers className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {inventoryItems.filter((i) => i.tenantId === activeTenant.id).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{tr('Active tracked product lines')}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{tr('Low Stock Alerts')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{lowStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{tr('Units below safety reorder threshold')}</div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{tr('Stock Adjustments Logged')}</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {inventoryAdjustments.filter((a) => a.tenantId === activeTenant.id).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{tr('Perpetual audit movement records')}</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'stock'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Live Stock & Valuations ({inventoryItems.filter((i) => i.tenantId === activeTenant.id).length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'movements'
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            Stock Movement & Audit Log ({inventoryAdjustments.filter((a) => a.tenantId === activeTenant.id).length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={tr('Search SKU, item name, location...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-52 sm:w-64"
            />
          </div>

          {activeTab === 'stock' && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">{tr('All Stock Levels')}</option>
                <option value="IN_STOCK">{tr('In Stock')}</option>
                <option value="LOW_STOCK">{tr('Low Stock Alert')}</option>
                <option value="OUT_OF_STOCK">{tr('Out of Stock')}</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">{tr('All Categories')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'stock' ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">{tr('SKU / Code')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Product Name')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Category')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Location')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('On Hand')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Unit Cost')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Total Valuation')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('Status')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No stock items found. Click &quot;Add New Stock Item&quot; to begin inventory tracking.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.status === 'LOW_STOCK';
                    const isOut = item.status === 'OUT_OF_STOCK';
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-amber-400 whitespace-nowrap">{item.sku}</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-100">
                          <div>{item.name}</div>
                          {item.supplierName && (
                            <div className="text-[10px] text-slate-400">Vendor: {item.supplierName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300">{item.location || 'Default Bay'}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-100">
                          {item.quantityOnHand} <span className="text-[10px] font-normal text-slate-400">{item.unitOfMeasure.toLowerCase()}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">${item.unitCost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-400">
                          ${item.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              <XCircle className="w-3 h-3" />{tr('Out of Stock')}</span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" /> Low Stock ({item.quantityOnHand}/{item.reorderThreshold})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />{tr('In Stock')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded text-[11px] font-medium border border-amber-500/30 transition-all cursor-pointer"
                              title={tr('Adjust Stock Quantity')}
                            >
                              <ArrowUpDown className="w-3 h-3" />{tr('Adjust')}</button>
                            <button
                              onClick={() => deleteInventoryItem(item.id)}
                              className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                              title={tr('Delete Item')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      ) : (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">{tr('Date')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('SKU & Product')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Movement Type')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{tr('Change')}</th>
                  <th className="px-4 py-3 font-semibold text-center">Before → After</th>
                  <th className="px-4 py-3 font-semibold text-right">{tr('Cost Impact')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Reason / Audit Trail')}</th>
                  <th className="px-4 py-3 font-semibold">{tr('Logged By')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">{tr('No stock movement audit records yet.')}</td>
                  </tr>
                ) : (
                  filteredAdjustments.map((adj) => {
                    const isPositive = adj.quantityDelta > 0;
                    return (
                      <tr key={adj.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{adj.date}</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-100">
                          <span className="font-mono text-amber-400 font-bold mr-1.5">{adj.sku}</span>
                          {adj.name}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {adj.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-center font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+${adj.quantityDelta}` : adj.quantityDelta}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400">
                          {adj.previousQuantity} → <span className="text-slate-100 font-bold">{adj.newQuantity}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-200">
                          ${adj.totalCostAdjustment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300">
                          <div>{adj.reason}</div>
                          {adj.journalEntryId && (
                            <div className="text-[10px] text-emerald-400 font-mono">GL Entry: {adj.journalEntryId}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans text-[11px] text-slate-400">{adj.performedBy}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD STOCK ITEM MODAL */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-amber-400" />{tr('Add New Stock Inventory Item')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{tr('Define SKU code, purchase unit cost, safety reorder thresholds, and warehouse location.')}</p>
              </div>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder={tr('e.g. SRV-RACK-01')}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Product / Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder={tr('e.g. 42U Server Rack Enclosure')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Unit of Measure')}</label>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="UNITS">{tr('Units (Each)')}</option>
                    <option value="BOXES">{tr('Boxes')}</option>
                    <option value="METERS">{tr('Meters')}</option>
                    <option value="KILOGRAMS">{tr('Kilograms')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Initial Quantity On Hand')}</label>
                  <input
                    type="number"
                    min={0}
                    value={quantityOnHand}
                    onChange={(e) => setQuantityOnHand(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Safety Reorder Alert Level')}</label>
                  <input
                    type="number"
                    min={1}
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={unitCost || ''}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Retail Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Valuation Method')}</label>
                  <select
                    value={valuationMethod}
                    onChange={(e) => setValuationMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="FIFO">{tr('FIFO (First-In, First-Out)')}</option>
                    <option value="WEIGHTED_AVERAGE">{tr('Weighted Average Cost')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Warehouse Bay / Shelf')}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={tr('e.g. Warehouse Bay 4A')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{tr('Primary Supplier Name')}</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder={tr('e.g. Dell Enterprise Hardware OEM')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Total Initial Valuation Box */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400 font-sans">{tr("Initial Stock Asset Valuation:")}</span>
                <span className="text-base font-bold text-amber-400">
                  ${(Number(quantityOnHand) * Number(unitCost)).toFixed(2)} {activeTenant.currency}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
                >{tr('Save Stock Item')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {isAdjustModalOpen && selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-amber-400" />
                Adjust Stock: {selectedItemForAdjust.name}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Type *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="PURCHASE_RECEIPT">Purchase Receipt (+ Stock)</option>
                  <option value="PHYSICAL_COUNT">{tr('Physical Inventory Count Reconciliation')}</option>
                  <option value="DAMAGE_SHRINKAGE">{tr('Damage / Shrinkage (- Stock)')}</option>
                  <option value="SALES_DELIVERY">{tr('Manual Sales Dispatch (- Stock)')}</option>
                  <option value="SUPPLIER_RETURN">{tr('Supplier Return / RMA (- Stock)')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quantity Delta (Units) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason / Justification *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="postToGl"
                  checked={postToGl}
                  onChange={(e) => setPostToGl(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="postToGl" className="text-xs text-slate-300 cursor-pointer">{tr('Post Double-Entry to General Ledger (Acc 1500 Inventory & Acc 5010 COGS)')}</label>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{tr("Current Qty:")}</span>
                  <span>{selectedItemForAdjust.quantityOnHand} units</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{tr("New Qty After Adjustment:")}</span>
                  <span className="font-bold text-slate-100">
                    {adjustType === 'DAMAGE_SHRINKAGE' || adjustType === 'SALES_DELIVERY' || adjustType === 'SUPPLIER_RETURN'
                      ? Math.max(0, selectedItemForAdjust.quantityOnHand - quantityDelta)
                      : selectedItemForAdjust.quantityOnHand + quantityDelta}{' '}
                    units
                  </span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                  <span>{tr("Valuation Impact:")}</span>
                  <span>${(quantityDelta * selectedItemForAdjust.unitCost).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >{tr('Cancel')}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
                >{tr('Apply Stock Adjustment')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
