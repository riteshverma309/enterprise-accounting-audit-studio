import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Plus,
  Calendar,
  ToggleLeft,
  Type,
  Hash,
  DollarSign,
  List,
  AlertCircle,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { CustomAttributeDefinition, CustomAttributeDataType } from '../types';
import { slugifyAttributeKey } from '../utils/customerImportExport';

interface QuickAddAttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttributeCreated?: (newAttr: CustomAttributeDefinition) => void;
  defaultTargetEntity?: 'CUSTOMER' | 'VENDOR' | 'BOTH';
}

export const QuickAddAttributeModal: React.FC<QuickAddAttributeModalProps> = ({
  isOpen,
  onClose,
  onAttributeCreated,
  defaultTargetEntity = 'CUSTOMER',
}) => {
  const { tr, t } = useLanguage();
  const { activeTenant, createCustomAttribute } = useAccounting();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [dataType, setDataType] = useState<CustomAttributeDataType>('text');
  const [targetEntity, setTargetEntity] = useState<'CUSTOMER' | 'VENDOR' | 'BOTH'>(defaultTargetEntity);
  const [unitOrSuffix, setUnitOrSuffix] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState<any>('');
  const [optionsText, setOptionsText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isKeyManuallyEdited) {
      setKey(slugifyAttributeKey(val));
    }
  };

  const handleTypeSelect = (type: CustomAttributeDataType) => {
    setDataType(type);
    if (type === 'boolean') {
      setDefaultValue(false);
    } else if (type === 'number' || type === 'decimal') {
      setDefaultValue('');
    } else if (type === 'date') {
      setDefaultValue('');
    } else {
      setDefaultValue('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const finalKey = (key.trim() || slugifyAttributeKey(trimmedName));

    if (!trimmedName) {
      setErrorMsg(tr('Please provide an Attribute Display Name.'));
      return;
    }

    if (!finalKey) {
      setErrorMsg(tr('Please specify a valid attribute Key.'));
      return;
    }

    let parsedOptions: string[] | undefined = undefined;
    if (dataType === 'select') {
      const opts = optionsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (opts.length === 0) {
        setErrorMsg(tr('Please enter at least one dropdown option separated by commas.'));
        return;
      }
      parsedOptions = opts;
    }

    let typedDefaultVal: any = defaultValue;
    if (dataType === 'number') {
      typedDefaultVal = defaultValue !== '' ? parseInt(defaultValue, 10) : undefined;
    } else if (dataType === 'decimal') {
      typedDefaultVal = defaultValue !== '' ? parseFloat(defaultValue) : undefined;
    } else if (dataType === 'boolean') {
      typedDefaultVal = Boolean(defaultValue);
    } else if (dataType === 'text' || dataType === 'date') {
      typedDefaultVal = defaultValue ? String(defaultValue).trim() : undefined;
    }

    const result = createCustomAttribute({
      tenantId: activeTenant.id,
      name: trimmedName,
      key: finalKey,
      dataType,
      targetEntity,
      industryPreset: 'CUSTOM',
      description: description.trim() || undefined,
      isRequired,
      unitOrSuffix: unitOrSuffix.trim() || undefined,
      defaultValue: typedDefaultVal,
      options: parsedOptions,
    });

    if (result.success && result.attribute) {
      if (onAttributeCreated) {
        onAttributeCreated(result.attribute);
      }
      onClose();
    } else {
      setErrorMsg(result.error || tr('Failed to save attribute.'));
    }
  };

  const dataTypesList: {
    type: CustomAttributeDataType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      type: 'text',
      label: 'Text / String',
      description: 'Names, serials, notes, alphanumeric codes',
      icon: Type,
      accentColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    },
    {
      type: 'date',
      label: 'Date (YYYY-MM-DD)',
      description: 'Registration, renewal, birth, admission dates',
      icon: Calendar,
      accentColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      type: 'boolean',
      label: 'Boolean (Yes / No)',
      description: 'Tax exempt, active status, bus route opts, flags',
      icon: ToggleLeft,
      accentColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
    {
      type: 'number',
      label: 'Numerical (Integer)',
      description: 'Whole counts, flat numbers, parking bays, roll #',
      icon: Hash,
      accentColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    },
    {
      type: 'decimal',
      label: 'Decimal (Float)',
      description: 'Square footage, discounts %, unit rates, currency',
      icon: DollarSign,
      accentColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    {
      type: 'select',
      label: 'Select / Dropdown',
      description: 'Predefined choice list (e.g. Bronze, Silver, Gold)',
      icon: List,
      accentColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  {tr('Quick Add Custom Attribute')}
                </h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-600/40 px-2 py-0.2 rounded-full font-semibold">{tr('Dynamic EAV')}</span>
              </div>
              <p className="text-xs text-slate-400">
                {tr('Instantly extend customer profiles & data schema with zero downtime.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Display Name & Auto-Generated Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {tr('Attribute Display Name')} *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder={tr('e.g. Carpet Area, Flat No, Admission Date')}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>{tr('Unique Schema Key')} *</span>
                <span className="text-[10px] text-slate-500 font-mono">{tr('attr_key')}</span>
              </label>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => {
                  setKey(slugifyAttributeKey(e.target.value));
                  setIsKeyManuallyEdited(true);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-indigo-300 font-mono text-[11px] focus:border-indigo-500 focus:outline-none"
                placeholder={tr('carpet_area')}
              />
            </div>
          </div>

          {/* Data Type Selector Grid */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">
              {tr('Attribute Data Type')} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dataTypesList.map((dt) => {
                const Icon = dt.icon;
                const isSelected = dataType === dt.type;
                return (
                  <button
                    key={dt.type}
                    type="button"
                    onClick={() => handleTypeSelect(dt.type)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${dt.accentColor} ring-2 ring-emerald-500/50 shadow-md`
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-bold text-[11px] text-slate-200">
                        {tr(dt.label.split(' ')[0])}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {tr(dt.description)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Options input if dataType === 'select' */}
          {dataType === 'select' && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                {tr('Dropdown Options (Comma-Separated)')} *
              </label>
              <input
                type="text"
                required
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                placeholder={tr('Tier 1, Tier 2, Tier 3, VIP')}
              />
              <p className="text-[10px] text-slate-500">
                {tr('Enter allowed values separated by commas.')}
              </p>
            </div>
          )}

          {/* Unit / Suffix & Default Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {tr('Unit / Suffix (Optional)')}
              </label>
              <input
                type="text"
                value={unitOrSuffix}
                onChange={(e) => setUnitOrSuffix(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                placeholder={tr('e.g. sq ft, days, %, $, bays, units')}
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {tr('Default Value (Optional)')}
              </label>
              {dataType === 'boolean' ? (
                <div className="flex items-center gap-3 h-9 pt-1">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultBool"
                      checked={defaultValue === true}
                      onChange={() => setDefaultValue(true)}
                      className="text-emerald-500"
                    />
                    <span>{tr('True / Yes')}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultBool"
                      checked={defaultValue === false}
                      onChange={() => setDefaultValue(false)}
                      className="text-emerald-500"
                    />
                    <span>{tr('False / No')}</span>
                  </label>
                </div>
              ) : dataType === 'date' ? (
                <input
                  type="date"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              ) : dataType === 'number' || dataType === 'decimal' ? (
                <input
                  type="number"
                  step={dataType === 'decimal' ? '0.01' : '1'}
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  placeholder="0"
                />
              ) : (
                <input
                  type="text"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  placeholder={tr('Default text')}
                />
              )}
            </div>
          </div>

          {/* Description & Mandatory Flag */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {tr('Field Description / User Tooltip (Optional)')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                placeholder={tr('Brief hint on how this field should be utilized.')}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-200 font-semibold block">
                  {tr('Mandatory Required Field')}
                </span>
                <span className="text-[10px] text-slate-500">
                  {tr('Enforce non-empty value during Customer Creation and Batch Import validation.')}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Target Entity */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="block text-slate-400 font-semibold mb-1 col-span-2">
              {tr('Apply Attribute To:')}
            </label>
            <button
              type="button"
              onClick={() => setTargetEntity('CUSTOMER')}
              className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                targetEntity === 'CUSTOMER'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-bold'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              {tr('Customers / Clients Only')}
            </button>
            <button
              type="button"
              onClick={() => setTargetEntity('BOTH')}
              className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                targetEntity === 'BOTH'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 font-bold'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              {tr('Both Customers & Vendors')}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              {tr('Cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {tr('Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
