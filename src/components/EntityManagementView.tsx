import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
  Trash2,
  Edit2,
  Eye,
  FileText,
  CreditCard,
  Calendar,
  Sparkles,
  Info,
  ChevronDown,
  Layers,
  Check,
  X,
  ArrowRight,
  Hash,
  ToggleLeft,
  ToggleRight,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Download,
  UploadCloud,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import {
  CustomerContact,
  VendorContact,
  CustomAttributeDefinition,
  CustomAttributeDataType,
  IndustryPresetType,
} from '../types';
import { QuickAddAttributeModal } from './QuickAddAttributeModal';
import { CustomerBatchUploadModal } from './CustomerBatchUploadModal';
import {
  generateCustomerCsvTemplate,
  generateCustomerJsonTemplate,
  exportCustomersToCsv,
} from '../utils/customerImportExport';
import { downloadCsvFile } from '../utils/templateGenerator';
import { useLanguage } from '../context/LanguageContext';

export const EntityManagementView: React.FC<{
  onSelectCustomerForInvoice?: (customer: CustomerContact) => void;
  onSelectCustomerForStatement?: (customer: CustomerContact) => void;
  onSelectVendorForBill?: (vendor: VendorContact) => void;
}> = ({ onSelectCustomerForInvoice, onSelectCustomerForStatement, onSelectVendorForBill }) => {
  const { t, tr } = useLanguage();
  const {
    activeTenant,
    customers,
    vendors,
    customAttributeDefinitions,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createVendor,
    updateVendor,
    deleteVendor,
    createCustomAttribute,
    deleteCustomAttribute,
    applyIndustryPresetAttributes,
  } = useAccounting();

  // Navigation tab within Entity Manager
  const [activeTab, setActiveTab] = useState<'customers' | 'vendors' | 'schema_designer'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerContact | null>(null);
  const [customerFormData, setCustomerFormData] = useState<{
    code: string;
    name: string;
    email: string;
    phone: string;
    billingAddress: string;
    category: string;
    taxId: string;
    paymentTermsDays: number;
    notes: string;
    customAttributes: Record<string, any>;
  }>({
    code: '',
    name: '',
    email: '',
    phone: '',
    billingAddress: '',
    category: 'Housing Society Resident',
    taxId: '',
    paymentTermsDays: 30,
    notes: '',
    customAttributes: {},
  });

  // Vendor Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorContact | null>(null);
  const [vendorFormData, setVendorFormData] = useState<{
    code: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    category: string;
    taxId: string;
    defaultExpenseAccountCode: string;
    paymentTermsDays: number;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    notes: string;
    customAttributes: Record<string, any>;
  }>({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    category: 'Facility AMC',
    taxId: '',
    defaultExpenseAccountCode: '5010',
    paymentTermsDays: 30,
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    notes: '',
    customAttributes: {},
  });

  // Attribute Definition Modal State
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [attrFormData, setAttrFormData] = useState<{
    name: string;
    key: string;
    dataType: CustomAttributeDataType;
    targetEntity: 'CUSTOMER' | 'VENDOR' | 'BOTH';
    industryPreset: IndustryPresetType;
    description: string;
    isRequired: boolean;
    unitOrSuffix: string;
    optionsText: string;
  }>({
    name: '',
    key: '',
    dataType: 'text',
    targetEntity: 'CUSTOMER',
    industryPreset: 'CUSTOM',
    description: '',
    isRequired: false,
    unitOrSuffix: '',
    optionsText: '',
  });

  // Quick Preset Toast / Notice
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Batch Upload & On-the-fly Attribute Modals State
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
  const [isQuickAddAttrModalOpen, setIsQuickAddAttrModalOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Filtered definitions for current tenant
  const tenantAttributes = useMemo(() => {
    return customAttributeDefinitions.filter(
      (a) => !a.tenantId || a.tenantId === activeTenant.id || a.tenantId === 't-acme-us'
    );
  }, [customAttributeDefinitions, activeTenant.id]);

  const customerAttributes = useMemo(() => {
    return tenantAttributes.filter((a) => a.targetEntity === 'CUSTOMER' || a.targetEntity === 'BOTH');
  }, [tenantAttributes]);

  const vendorAttributes = useMemo(() => {
    return tenantAttributes.filter((a) => a.targetEntity === 'VENDOR' || a.targetEntity === 'BOTH');
  }, [tenantAttributes]);

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (c.tenantId && c.tenantId !== activeTenant.id && c.tenantId !== 't-acme-us') return false;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.category && c.category.toLowerCase().includes(term)) ||
        Object.values(c.customAttributes || {}).some(
          (val) => val && String(val).toLowerCase().includes(term)
        );
      const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [customers, activeTenant.id, searchTerm, categoryFilter]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (v.tenantId && v.tenantId !== activeTenant.id && v.tenantId !== 't-acme-us') return false;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(term) ||
        v.code.toLowerCase().includes(term) ||
        v.email.toLowerCase().includes(term) ||
        (v.category && v.category.toLowerCase().includes(term)) ||
        Object.values(v.customAttributes || {}).some(
          (val) => val && String(val).toLowerCase().includes(term)
        );
      const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vendors, activeTenant.id, searchTerm, categoryFilter]);

  // Open Add/Edit Customer Modal
  const handleOpenCustomerModal = (customer?: CustomerContact) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerFormData({
        code: customer.code,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        billingAddress: customer.billingAddress || '',
        category: customer.category || 'Housing Society Resident',
        taxId: customer.taxId || '',
        paymentTermsDays: customer.paymentTermsDays || 30,
        notes: customer.notes || '',
        customAttributes: { ...(customer.customAttributes || {}) },
      });
    } else {
      setEditingCustomer(null);
      const defaultAttrs: Record<string, any> = {};
      customerAttributes.forEach((attr) => {
        if (attr.defaultValue !== undefined) {
          defaultAttrs[attr.key] = attr.defaultValue;
        }
      });
      setCustomerFormData({
        code: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
        name: '',
        email: '',
        phone: '',
        billingAddress: '',
        category: 'Housing Society Resident',
        taxId: '',
        paymentTermsDays: 30,
        notes: '',
        customAttributes: defaultAttrs,
      });
    }
    setIsCustomerModalOpen(true);
  };

  // Submit Customer Form
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        code: customerFormData.code,
        name: customerFormData.name,
        email: customerFormData.email,
        phone: customerFormData.phone,
        billingAddress: customerFormData.billingAddress,
        category: customerFormData.category,
        taxId: customerFormData.taxId,
        paymentTermsDays: Number(customerFormData.paymentTermsDays),
        notes: customerFormData.notes,
        customAttributes: customerFormData.customAttributes,
      });
      showNotification(`Customer "${customerFormData.name}" updated successfully.`);
    } else {
      createCustomer({
        tenantId: activeTenant.id,
        code: customerFormData.code,
        name: customerFormData.name,
        email: customerFormData.email,
        phone: customerFormData.phone,
        billingAddress: customerFormData.billingAddress,
        category: customerFormData.category,
        status: 'ACTIVE',
        taxId: customerFormData.taxId,
        paymentTermsDays: Number(customerFormData.paymentTermsDays),
        notes: customerFormData.notes,
        customAttributes: customerFormData.customAttributes,
      });
      showNotification(`New Customer profile "${customerFormData.name}" created.`);
    }
    setIsCustomerModalOpen(false);
  };

  // Open Add/Edit Vendor Modal
  const handleOpenVendorModal = (vendor?: VendorContact) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorFormData({
        code: vendor.code,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone || '',
        address: vendor.address || '',
        category: vendor.category || 'Facility AMC',
        taxId: vendor.taxId || '',
        defaultExpenseAccountCode: vendor.defaultExpenseAccountCode || '5010',
        paymentTermsDays: vendor.paymentTermsDays || 30,
        bankName: vendor.bankDetails?.bankName || '',
        accountNumber: vendor.bankDetails?.accountNumber || '',
        routingNumber: vendor.bankDetails?.routingNumber || '',
        notes: vendor.notes || '',
        customAttributes: { ...(vendor.customAttributes || {}) },
      });
    } else {
      setEditingVendor(null);
      const defaultAttrs: Record<string, any> = {};
      vendorAttributes.forEach((attr) => {
        if (attr.defaultValue !== undefined) {
          defaultAttrs[attr.key] = attr.defaultValue;
        }
      });
      setVendorFormData({
        code: `VEND-${String(vendors.length + 1).padStart(3, '0')}`,
        name: '',
        email: '',
        phone: '',
        address: '',
        category: 'Facility AMC',
        taxId: '',
        defaultExpenseAccountCode: '5010',
        paymentTermsDays: 30,
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        notes: '',
        customAttributes: defaultAttrs,
      });
    }
    setIsVendorModalOpen(true);
  };

  // Save Vendor
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorFormData.name.trim()) return;

    const bankDetails =
      vendorFormData.bankName || vendorFormData.accountNumber
        ? {
            bankName: vendorFormData.bankName,
            accountNumber: vendorFormData.accountNumber,
            routingNumber: vendorFormData.routingNumber,
          }
        : undefined;

    if (editingVendor) {
      updateVendor(editingVendor.id, {
        code: vendorFormData.code,
        name: vendorFormData.name,
        email: vendorFormData.email,
        phone: vendorFormData.phone,
        address: vendorFormData.address,
        category: vendorFormData.category,
        taxId: vendorFormData.taxId,
        defaultExpenseAccountCode: vendorFormData.defaultExpenseAccountCode,
        paymentTermsDays: Number(vendorFormData.paymentTermsDays),
        bankDetails,
        notes: vendorFormData.notes,
        customAttributes: vendorFormData.customAttributes,
      });
      showNotification(`Vendor "${vendorFormData.name}" updated successfully.`);
    } else {
      createVendor({
        tenantId: activeTenant.id,
        code: vendorFormData.code,
        name: vendorFormData.name,
        email: vendorFormData.email,
        phone: vendorFormData.phone,
        address: vendorFormData.address,
        category: vendorFormData.category,
        status: 'ACTIVE',
        taxId: vendorFormData.taxId,
        defaultExpenseAccountCode: vendorFormData.defaultExpenseAccountCode,
        paymentTermsDays: Number(vendorFormData.paymentTermsDays),
        bankDetails,
        notes: vendorFormData.notes,
        customAttributes: vendorFormData.customAttributes,
      });
      showNotification(`New Vendor profile "${vendorFormData.name}" created.`);
    }
    setIsVendorModalOpen(false);
  };

  // Save New Custom Attribute
  const handleSaveAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrFormData.name.trim() || !attrFormData.key.trim()) return;

    const options =
      attrFormData.dataType === 'select'
        ? attrFormData.optionsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    createCustomAttribute({
      tenantId: activeTenant.id,
      name: attrFormData.name,
      key: attrFormData.key.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      dataType: attrFormData.dataType,
      targetEntity: attrFormData.targetEntity,
      industryPreset: attrFormData.industryPreset,
      description: attrFormData.description,
      isRequired: attrFormData.isRequired,
      unitOrSuffix: attrFormData.unitOrSuffix || undefined,
      options,
    });

    showNotification(`Custom field "${attrFormData.name}" registered in schema dictionary.`);
    setIsAttrModalOpen(false);
    setAttrFormData({
      name: '',
      key: '',
      dataType: 'text',
      targetEntity: 'CUSTOMER',
      industryPreset: 'CUSTOM',
      description: '',
      isRequired: false,
      unitOrSuffix: '',
      optionsText: '',
    });
  };

  // Handle Preset Loader
  const handleApplyPreset = (preset: IndustryPresetType, label: string) => {
    const res = applyIndustryPresetAttributes(preset, activeTenant.id);
    showNotification(`Applied ${label} schema preset! Loaded custom attributes into active tenant dictionary.`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {tr('Customer & Vendor Master Management')}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  {tr('Dynamic Schema EAV')}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {tr('Versatile directory engine adaptable for Schools, Housing Societies, Hospitals, SaaS & Corporate entities with extensible custom attributes.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'customers' && (
            <>
              {/* Dynamic Template & Export Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
                  title={tr('Download dynamic upload template or export active customers')}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tr('Templates & Export')}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isDownloadMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDownloadMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 p-2 space-y-1 text-xs">
                      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        {tr('Dynamic Schema Templates')}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const csv = generateCustomerCsvTemplate(activeTenant.name, activeTenant.currency, customerAttributes, true);
                          downloadCsvFile(`${activeTenant.code.toLowerCase()}_customer_upload_template.csv`, csv);
                          setIsDownloadMenuOpen(false);
                          showNotification(tr('Downloaded dynamic CSV upload template with active custom attributes.'));
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          {tr('Download CSV Template')}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">.csv</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const json = generateCustomerJsonTemplate(customerAttributes);
                          downloadCsvFile(`${activeTenant.code.toLowerCase()}_customer_upload_template.json`, json);
                          setIsDownloadMenuOpen(false);
                          showNotification(tr('Downloaded dynamic JSON upload template with active custom attributes.'));
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          {tr('Download JSON Template')}
                        </span>
                        <span className="text-[10px] font-mono text-blue-400">.json</span>
                      </button>
                      <div className="my-1 border-t border-slate-800" />
                      <button
                        type="button"
                        onClick={() => {
                          const exportCsv = exportCustomersToCsv(customers, customerAttributes);
                          downloadCsvFile(`${activeTenant.code.toLowerCase()}_customers_export_${new Date().toISOString().split('T')[0]}.csv`, exportCsv);
                          setIsDownloadMenuOpen(false);
                          showNotification(tr('Exported active customers to CSV.'));
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          {tr('Export Active Customers')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{customers.length} {tr('rows')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Upload Customer List Button */}
              <button
                type="button"
                onClick={() => setIsBatchUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title={tr('Bulk upload customer list from CSV or JSON file')}
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                {tr('Upload Customer List')}
              </button>

              {/* On-The-Fly Attribute Quick Modal Button */}
              <button
                type="button"
                onClick={() => setIsQuickAddAttrModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title={tr('Add on-the-fly custom schema attribute (date, boolean, decimal, text, number, select)')}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {tr('+ Add Attribute On The Fly')}
              </button>

              {/* Add Customer Profile */}
              <button
                type="button"
                onClick={() => handleOpenCustomerModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {tr('Add Customer')}
              </button>
            </>
          )}
          {activeTab === 'vendors' && (
            <button
              onClick={() => handleOpenVendorModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {tr('Add Vendor / Supplier')}
            </button>
          )}
          {activeTab === 'schema_designer' && (
            <button
              onClick={() => setIsAttrModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {tr('Add Custom Attribute')}
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Industry Archetype Quick Presets Showcase */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {tr('One-Click Industry Archetype Presets')}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {tenantAttributes.length} {tr('Active Schema Attributes')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Housing Society Preset */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-200">{tr('Housing Society / HOA')}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {tr('Unit / Flat No, Wing/Block, Carpet Area (sq ft), Parking Bays, Owner Occupancy, Maintenance Rate ($/sq ft).')}
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('HOUSING_SOCIETY', 'Housing Society & HOA')}
              className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3 h-3" /> {tr('Apply Housing Fields')}
            </button>
          </div>

          {/* School / Education Preset */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-200">{tr('School & Academy')}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {tr('Student Roll No, Grade / Batch, Bus Transport Route, Scholarship Discount %, Hostel Boarding status.')}
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('SCHOOL', 'School & Academy')}
              className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3 h-3" /> {tr('Apply School Fields')}
            </button>
          </div>

          {/* Hospital / Healthcare Preset */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-rose-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400">
                <HeartPulse className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-200">{tr('Hospital & Clinic')}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {tr('Patient MRN, Admission Care Type, Ward & Bed No, Attending Doctor, Insurance Policy ID, Daily Bed Tariff.')}
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('HOSPITAL', 'Hospital & Healthcare')}
              className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3 h-3" /> {tr('Apply Hospital Fields')}
            </button>
          </div>

          {/* Enterprise / SaaS Preset */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400">
                <Briefcase className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-200">{tr('Enterprise & SaaS')}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {tr('Corporate Tax ID / GSTIN, Contract SLA Tier, SSO Mandatory flag, Vendor AMC Contract Expiry Date.')}
              </p>
            </div>
            <button
              onClick={() => handleApplyPreset('SAAS', 'Enterprise SaaS')}
              className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3 h-3" /> {tr('Apply Enterprise Fields')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => {
            setActiveTab('customers');
            setCategoryFilter('ALL');
          }}
          className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'customers'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          {tr('Customers Directory')} ({filteredCustomers.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('vendors');
            setCategoryFilter('ALL');
          }}
          className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'vendors'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          {tr('Vendors Directory')} ({filteredVendors.length})
        </button>

        <button
          onClick={() => setActiveTab('schema_designer')}
          className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'schema_designer'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {tr('Schema & Custom Attributes Designer')} ({tenantAttributes.length})
        </button>
      </div>

      {/* Search & Filtering Bar */}
      {activeTab !== 'schema_designer' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab} by name, code, email, or custom attributes...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {activeTab === 'customers' ? (
                <>
                  <option value="Housing Society Resident">Housing Society Resident</option>
                  <option value="School Student">School Student</option>
                  <option value="Hospital Inpatient">Hospital Inpatient</option>
                  <option value="Enterprise Client">Enterprise Client</option>
                </>
              ) : (
                <>
                  <option value="Facility AMC">Facility & Lift AMC</option>
                  <option value="Student Bus Transport">Student Bus Transport</option>
                  <option value="Medical Devices & Pharma">Medical Devices & Pharma</option>
                  <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* --- Tab 1: Customers Directory --- */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Customers Found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or add a new customer.</p>
              <button
                onClick={() => handleOpenCustomerModal()}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Add First Customer
              </button>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const attrs = cust.customAttributes || {};
              return (
                <div
                  key={cust.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {cust.code}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {cust.category || 'General Client'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5">{cust.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenCustomerModal(cust)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete customer ${cust.name}?`)) {
                              deleteCustomer(cust.id);
                              showNotification(`Customer ${cust.name} removed.`);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                      {cust.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      {cust.billingAddress && (
                        <div className="flex items-center gap-2 col-span-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{cust.billingAddress}</span>
                        </div>
                      )}
                    </div>

                    {/* Custom Attributes Badges */}
                    {Object.keys(attrs).length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Specific Entity Attributes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(attrs).map(([key, val]) => {
                            if (val === undefined || val === null || val === '') return null;
                            const def = customAttributeDefinitions.find((d) => d.key === key);
                            const label = def ? def.name : key;
                            const suffix = def?.unitOrSuffix ? ` ${def.unitOrSuffix}` : '';
                            const displayVal =
                              typeof val === 'boolean' ? (val ? 'Yes' : 'No') : `${val}${suffix}`;

                            return (
                              <span
                                key={key}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center gap-1 font-mono"
                              >
                                <span className="text-slate-400">{label}:</span>
                                <span className="font-semibold text-indigo-300">{displayVal}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {cust.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-950/20 p-2 rounded border border-slate-800/40">
                        "{cust.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400">
                      Payment Terms: <strong className="text-slate-200">{cust.paymentTermsDays || 30} Days</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {onSelectCustomerForStatement && (
                        <button
                          onClick={() => onSelectCustomerForStatement(cust)}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                          title="View Invoices, Payments, Opening Balances, and Statement of Account"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Statement & History
                        </button>
                      )}
                      {onSelectCustomerForInvoice && (
                        <button
                          onClick={() => onSelectCustomerForInvoice(cust)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Issue Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- Tab 2: Vendors Directory --- */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVendors.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
              <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Vendors Found</h3>
              <p className="text-xs text-slate-500 mt-1">Add a new supplier or contractor profile.</p>
              <button
                onClick={() => handleOpenVendorModal()}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
              >
                Add First Vendor
              </button>
            </div>
          ) : (
            filteredVendors.map((vend) => {
              const attrs = vend.customAttributes || {};
              return (
                <div
                  key={vend.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {vend.code}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {vend.category || 'General Supplier'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 mt-1.5">{vend.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenVendorModal(vend)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all"
                          title="Edit Vendor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete vendor ${vend.name}?`)) {
                              deleteVendor(vend.id);
                              showNotification(`Vendor ${vend.name} removed.`);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contact & Banking Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{vend.email}</span>
                      </div>
                      {vend.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{vend.phone}</span>
                        </div>
                      )}
                      {vend.defaultExpenseAccountCode && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Default Expense GL: <strong className="text-slate-200">{vend.defaultExpenseAccountCode}</strong></span>
                        </div>
                      )}
                      {vend.bankDetails && (
                        <div className="flex items-center gap-2 col-span-2 truncate text-slate-400">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Bank: {vend.bankDetails.bankName} (A/C: ••••{vend.bankDetails.accountNumber?.slice(-4)})</span>
                        </div>
                      )}
                    </div>

                    {/* Custom Attributes */}
                    {Object.keys(attrs).length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Vendor Attributes & Contracts
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(attrs).map(([key, val]) => {
                            if (val === undefined || val === null || val === '') return null;
                            const def = customAttributeDefinitions.find((d) => d.key === key);
                            const label = def ? def.name : key;
                            return (
                              <span
                                key={key}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/80 flex items-center gap-1 font-mono"
                              >
                                <span className="text-slate-400">{label}:</span>
                                <span className="font-semibold text-purple-300">{String(val)}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Payment Terms: <strong className="text-slate-200">{vend.paymentTermsDays || 30} Days</strong>
                    </span>
                    {onSelectVendorForBill && (
                      <button
                        onClick={() => onSelectVendorForBill(vend)}
                        className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Record Vendor Bill
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- Tab 3: Custom Schema & Attributes Designer --- */}
      {activeTab === 'schema_designer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Extensible Entity Schema Definitions
              </h3>
              <p className="text-xs text-slate-400">
                Define text, numerical, decimal, boolean, date, or dropdown fields. These attributes seamlessly appear on customer/vendor profiles and flow into Invoicing and Billing.
              </p>
            </div>
            <button
              onClick={() => setIsAttrModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              Define New Field
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Field Name & Key</th>
                  <th className="py-3 px-4">Data Type</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Industry Domain</th>
                  <th className="py-3 px-4">Unit / Suffix</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {tenantAttributes.map((attr) => (
                  <tr key={attr.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{attr.name}</div>
                      <div className="text-[10px] font-mono text-indigo-400">key: {attr.key}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {attr.dataType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          attr.targetEntity === 'CUSTOMER'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : attr.targetEntity === 'VENDOR'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {attr.targetEntity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {attr.industryPreset || 'CUSTOM'}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300">
                      {attr.unitOrSuffix || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {attr.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove attribute "${attr.name}" from schema?`)) {
                            deleteCustomAttribute(attr.id);
                            showNotification(`Removed attribute ${attr.name}.`);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Attribute"
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
      )}

      {/* --- Modal: Add / Edit Customer --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {editingCustomer ? 'Edit Customer Profile' : 'New Customer Profile'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fill core contact info and entity-specific custom attributes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    value={customerFormData.code}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. RES-402 or STU-88"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Customer / Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={customerFormData.name}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Alexander Sterling (Flat A-402) or Maya Lin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerFormData.email}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="contact@entity.org"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Entity Category</label>
                  <select
                    value={customerFormData.category}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Housing Society Resident">Housing Society Resident</option>
                    <option value="School Student">School Student</option>
                    <option value="Hospital Inpatient">Hospital Inpatient</option>
                    <option value="Enterprise Client">Enterprise Client</option>
                    <option value="General Client">General Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tax ID / GSTIN / SSN</label>
                  <input
                    type="text"
                    value={customerFormData.taxId}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, taxId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                    placeholder="Tax Reg ID"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={customerFormData.paymentTermsDays}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Billing / Residence Address</label>
                <input
                  type="text"
                  value={customerFormData.billingAddress}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, billingAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  placeholder="Unit address, street, city, zip"
                />
              </div>

              {/* Dynamic Custom Attributes Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Dynamic Schema Custom Attributes ({customerAttributes.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddAttrModalOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    + Add Field On-the-Fly
                  </button>
                </div>

                {customerAttributes.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">No custom attributes configured for customers yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    {customerAttributes.map((attr) => {
                      const currentVal = customerFormData.customAttributes[attr.key];

                      return (
                        <div key={attr.key} className={attr.dataType === 'boolean' ? 'sm:col-span-1' : ''}>
                          <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                            <span>
                              {attr.name} {attr.isRequired && <span className="text-rose-400">*</span>}
                            </span>
                            {attr.unitOrSuffix && (
                              <span className="text-[10px] text-amber-400 font-mono">({attr.unitOrSuffix})</span>
                            )}
                          </label>

                          {attr.dataType === 'text' && (
                            <input
                              type="text"
                              required={attr.isRequired}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomerFormData({
                                  ...customerFormData,
                                  customAttributes: {
                                    ...customerFormData.customAttributes,
                                    [attr.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                              placeholder={attr.description || ''}
                            />
                          )}

                          {(attr.dataType === 'number' || attr.dataType === 'decimal') && (
                            <input
                              type="number"
                              step={attr.dataType === 'decimal' ? '0.01' : '1'}
                              required={attr.isRequired}
                              value={currentVal !== undefined ? currentVal : ''}
                              onChange={(e) =>
                                setCustomerFormData({
                                  ...customerFormData,
                                  customAttributes: {
                                    ...customerFormData.customAttributes,
                                    [attr.key]: e.target.value === '' ? '' : Number(e.target.value),
                                  },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                              placeholder="0.00"
                            />
                          )}

                          {attr.dataType === 'date' && (
                            <input
                              type="date"
                              required={attr.isRequired}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomerFormData({
                                  ...customerFormData,
                                  customAttributes: {
                                    ...customerFormData.customAttributes,
                                    [attr.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                            />
                          )}

                          {attr.dataType === 'select' && (
                            <select
                              required={attr.isRequired}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomerFormData({
                                  ...customerFormData,
                                  customAttributes: {
                                    ...customerFormData.customAttributes,
                                    [attr.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="">-- Select {attr.name} --</option>
                              {attr.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}

                          {attr.dataType === 'boolean' && (
                            <label className="flex items-center gap-2 cursor-pointer mt-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
                              <input
                                type="checkbox"
                                checked={!!currentVal}
                                onChange={(e) =>
                                  setCustomerFormData({
                                    ...customerFormData,
                                    customAttributes: {
                                      ...customerFormData.customAttributes,
                                      [attr.key]: e.target.checked,
                                    },
                                  })
                                }
                                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-slate-300 text-xs">{attr.description || 'Enable flag'}</span>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Internal Notes & Remarks</label>
                <textarea
                  rows={2}
                  value={customerFormData.notes}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  placeholder="Special billing instructions, discounts, or contacts..."
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
                >
                  {editingCustomer ? 'Update Profile' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Add / Edit Vendor --- */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {editingVendor ? 'Edit Vendor Profile' : 'New Vendor Profile'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage contractor details, bank accounts, and SLA contracts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vendor Code *</label>
                  <input
                    type="text"
                    required
                    value={vendorFormData.code}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. VEND-OTIS"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Vendor / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={vendorFormData.name}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Otis Elevator AMC & Maintenance Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={vendorFormData.email}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="invoicing@vendor.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={vendorFormData.phone}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="+1 (800) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={vendorFormData.category}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Facility AMC">Facility & Lift AMC</option>
                    <option value="Student Bus Transport">Student Bus Transport</option>
                    <option value="Medical Devices & Pharma">Medical Devices & Pharma</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="General Supplier">General Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Default Expense GL</label>
                  <select
                    value={vendorFormData.defaultExpenseAccountCode}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, defaultExpenseAccountCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="5010">5010 - Hosting & Infrastructure</option>
                    <option value="5020">5020 - Engineering Staff & Personnel</option>
                    <option value="5030">5030 - Office, Transport & Facilities</option>
                    <option value="5040">5040 - Professional Legal & Advisory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={vendorFormData.paymentTermsDays}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Settlement Info */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Bank Disbursement Settlement Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={vendorFormData.bankName}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, bankName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
                      placeholder="e.g. Chase Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={vendorFormData.accountNumber}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, accountNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none"
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Routing Number / IFSC</label>
                    <input
                      type="text"
                      value={vendorFormData.routingNumber}
                      onChange={(e) => setVendorFormData({ ...vendorFormData, routingNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none"
                      placeholder="Routing ID"
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Custom Attributes */}
              {vendorAttributes.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Vendor Custom Schema Fields ({vendorAttributes.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    {vendorAttributes.map((attr) => {
                      const currentVal = vendorFormData.customAttributes[attr.key];
                      return (
                        <div key={attr.key}>
                          <label className="block text-slate-300 font-medium mb-1">
                            {attr.name}
                          </label>
                          {attr.dataType === 'date' ? (
                            <input
                              type="date"
                              value={currentVal || ''}
                              onChange={(e) =>
                                setVendorFormData({
                                  ...vendorFormData,
                                  customAttributes: {
                                    ...vendorFormData.customAttributes,
                                    [attr.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentVal || ''}
                              onChange={(e) =>
                                setVendorFormData({
                                  ...vendorFormData,
                                  customAttributes: {
                                    ...vendorFormData.customAttributes,
                                    [attr.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                              placeholder={attr.description || ''}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={vendorFormData.notes}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                  placeholder="SLA response guarantees, emergency helpline numbers..."
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow"
                >
                  {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Define Custom Schema Attribute --- */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Define New Schema Attribute</h3>
                  <p className="text-xs text-slate-400">
                    Add custom text, numerical, boolean, or date fields to entities.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAttrModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttribute} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Display Label *</label>
                  <input
                    type="text"
                    required
                    value={attrFormData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const autoKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                      setAttrFormData({
                        ...attrFormData,
                        name,
                        key: attrFormData.key || autoKey,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Carpet Area or Bed No"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Internal Key *</label>
                  <input
                    type="text"
                    required
                    value={attrFormData.key}
                    onChange={(e) => setAttrFormData({ ...attrFormData, key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. carpet_area_sqft"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Data Type *</label>
                  <select
                    value={attrFormData.dataType}
                    onChange={(e) => setAttrFormData({ ...attrFormData, dataType: e.target.value as CustomAttributeDataType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none font-medium"
                  >
                    <option value="text">Text / String</option>
                    <option value="number">Integer Number</option>
                    <option value="decimal">Decimal Currency / Rate</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean (Yes / No Toggle)</option>
                    <option value="select">Select Dropdown Menu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Entity *</label>
                  <select
                    value={attrFormData.targetEntity}
                    onChange={(e) => setAttrFormData({ ...attrFormData, targetEntity: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CUSTOMER">Customer / Resident / Student</option>
                    <option value="VENDOR">Vendor / Supplier</option>
                    <option value="BOTH">Both Customers & Vendors</option>
                  </select>
                </div>
              </div>

              {attrFormData.dataType === 'select' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Dropdown Options (one per line)</label>
                  <textarea
                    rows={3}
                    value={attrFormData.optionsText}
                    onChange={(e) => setAttrFormData({ ...attrFormData, optionsText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                    placeholder="Tower A&#10;Tower B&#10;Tower C"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Unit or Suffix Badge</label>
                  <input
                    type="text"
                    value={attrFormData.unitOrSuffix}
                    onChange={(e) => setAttrFormData({ ...attrFormData, unitOrSuffix: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. sq ft, %, $/day, seats"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Industry Tag</label>
                  <select
                    value={attrFormData.industryPreset}
                    onChange={(e) => setAttrFormData({ ...attrFormData, industryPreset: e.target.value as IndustryPresetType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CUSTOM">Custom Entity</option>
                    <option value="HOUSING_SOCIETY">Housing Society & HOA</option>
                    <option value="SCHOOL">School & Academy</option>
                    <option value="HOSPITAL">Hospital & Healthcare</option>
                    <option value="SAAS">Enterprise SaaS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Help Description</label>
                <input
                  type="text"
                  value={attrFormData.description}
                  onChange={(e) => setAttrFormData({ ...attrFormData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  placeholder="Guidance for users filling this attribute during invoicing"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={attrFormData.isRequired}
                  onChange={(e) => setAttrFormData({ ...attrFormData, isRequired: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-300 font-medium">Mandate this attribute as Required</span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAttrModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  Save Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Reusable On-The-Fly Quick Attribute Modal --- */}
      <QuickAddAttributeModal
        isOpen={isQuickAddAttrModalOpen}
        onClose={() => setIsQuickAddAttrModalOpen(false)}
        targetEntity="CUSTOMER"
        onAttributeCreated={(newAttr, defaultValue) => {
          showNotification(`Added new attribute "${newAttr.name}" (${newAttr.dataType}) on the fly!`);
          // If customer edit modal is open, auto-inject this attribute into the current form state
          if (isCustomerModalOpen) {
            setCustomerFormData((prev) => ({
              ...prev,
              customAttributes: {
                ...prev.customAttributes,
                [newAttr.key]: defaultValue !== undefined ? defaultValue : (newAttr.dataType === 'boolean' ? false : ''),
              },
            }));
          }
        }}
      />

      {/* --- Robust Customer Batch Upload Modal --- */}
      <CustomerBatchUploadModal
        isOpen={isBatchUploadModalOpen}
        onClose={() => setIsBatchUploadModalOpen(false)}
        onSuccess={(result) => {
          showNotification(`Batch upload complete: ${result.createdCount} created, ${result.updatedCount} updated.`);
        }}
      />
    </div>
  );
};
