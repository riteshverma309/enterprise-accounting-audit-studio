import {
  CustomerContact,
  CustomAttributeDefinition,
  InvoiceTemplate,
  CustomerGroupConfig,
  BulkInvoicePreviewItem,
  Tenant,
  InvoiceLineItem,
} from '../types';

export interface GroupingAttributeOption {
  key: string;
  name: string;
  dataType: 'boolean' | 'text' | 'select' | 'number' | 'date' | 'standard';
  isCustom: boolean;
  distinctValues: any[];
  distinctValuesCount: number;
  description?: string;
}

/**
 * Discovers all grouping attributes available across standard fields and dynamic custom schema
 */
export const discoverCustomerGroupingAttributes = (
  customers: CustomerContact[],
  attributeDefinitions: CustomAttributeDefinition[] = []
): GroupingAttributeOption[] => {
  const options: GroupingAttributeOption[] = [];

  // 1. Standard Fields
  // Category
  const categories = Array.from(
    new Set(customers.map((c) => (c.category ? c.category.trim() : '')).filter(Boolean))
  );
  options.push({
    key: 'category',
    name: 'Customer Category / Classification',
    dataType: 'standard',
    isCustom: false,
    distinctValues: categories,
    distinctValuesCount: categories.length,
    description: 'Group customers by category (e.g. Enterprise, Resident, Student, SMB)',
  });

  // Payment Terms Days
  const terms = Array.from(
    new Set(customers.map((c) => (c.paymentTermsDays !== undefined ? c.paymentTermsDays : 30)))
  ).sort((a, b) => a - b);
  options.push({
    key: 'paymentTermsDays',
    name: 'Credit Payment Terms (Days)',
    dataType: 'standard',
    isCustom: false,
    distinctValues: terms,
    distinctValuesCount: terms.length,
    description: 'Group customers by payment grace period (e.g. Net 15, Net 30, Net 60)',
  });

  // 2. Custom Schema Attributes registered in tenant
  const customerDefs = attributeDefinitions.filter(
    (def) => !def.targetEntity || def.targetEntity === 'CUSTOMER'
  );

  customerDefs.forEach((def) => {
    // Collect all present values from active customers
    const valuesSet = new Set<any>();
    customers.forEach((c) => {
      const val = c.customAttributes?.[def.key];
      if (val !== undefined && val !== null && val !== '') {
        valuesSet.add(val);
      }
    });

    const distinctVals = Array.from(valuesSet);

    options.push({
      key: def.key,
      name: `${def.name} (${def.dataType.toUpperCase()})`,
      dataType: def.dataType as any,
      isCustom: true,
      distinctValues: distinctVals,
      distinctValuesCount: def.dataType === 'boolean' ? 2 : distinctVals.length,
      description: def.description || `Custom dynamic field: ${def.key}`,
    });
  });

  // 3. Scan for any on-the-fly attributes in customer objects not yet in definitions
  const knownKeys = new Set([
    'category',
    'paymentTermsDays',
    'taxId',
    'code',
    'name',
    'email',
    'phone',
    'billingAddress',
    'notes',
    ...customerDefs.map((d) => d.key),
  ]);

  const onTheFlyKeys = new Set<string>();
  customers.forEach((c) => {
    if (c.customAttributes) {
      Object.keys(c.customAttributes).forEach((k) => {
        if (!knownKeys.has(k)) {
          onTheFlyKeys.add(k);
        }
      });
    }
  });

  onTheFlyKeys.forEach((key) => {
    const valuesSet = new Set<any>();
    customers.forEach((c) => {
      const val = c.customAttributes?.[key];
      if (val !== undefined && val !== null && val !== '') {
        valuesSet.add(val);
      }
    });
    const distinctVals = Array.from(valuesSet);
    const sampleVal = distinctVals[0];
    const inferredType: 'boolean' | 'number' | 'text' =
      typeof sampleVal === 'boolean' || key.toLowerCase().startsWith('is_')
        ? 'boolean'
        : typeof sampleVal === 'number'
        ? 'number'
        : 'text';

    options.push({
      key,
      name: `${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} (Discovered)`,
      dataType: inferredType,
      isCustom: true,
      distinctValues: distinctVals,
      distinctValuesCount: inferredType === 'boolean' ? 2 : distinctVals.length,
      description: `Discovered customer attribute key: ${key}`,
    });
  });

  return options;
};

/**
 * Generates initial customer group configurations given a chosen attribute key
 */
export const generateGroupsForAttribute = (
  attributeKey: string,
  customers: CustomerContact[],
  templates: InvoiceTemplate[],
  activeTenant: Tenant,
  billingPeriodLabel: string = 'Current Month'
): CustomerGroupConfig[] => {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date();
  due.setDate(due.getDate() + 30);
  const defaultDueDate = due.toISOString().split('T')[0];

  const defaultTemplateId = templates.length > 0 ? templates[0].id : '';

  // Case 1: All in One Single Group
  if (!attributeKey || attributeKey === 'ALL_CUSTOMERS') {
    return [
      {
        id: 'grp-all',
        name: `All Customers (${customers.length})`,
        filterAttributeKey: 'ALL_CUSTOMERS',
        matchValue: '__ALL__',
        displayValueLabel: 'All Active Customer Records',
        customerIds: customers.map((c) => c.id),
        templateId: defaultTemplateId,
        defaultRevenueAccountCode: '4010',
        billingPeriod: billingPeriodLabel,
        issueDate: today,
        dueDate: defaultDueDate,
        notesTemplate: `Periodic billing for ${billingPeriodLabel}. Thank you for your business.`,
      },
    ];
  }

  // Case 2: Boolean Attribute (e.g. IsCommercial, IsTaxExempt, HasParking, etc.)
  const isBooleanLike =
    attributeKey.toLowerCase().startsWith('is_') ||
    attributeKey.toLowerCase().startsWith('has_') ||
    attributeKey.toLowerCase().includes('boolean') ||
    attributeKey === 'is_commercial' ||
    attributeKey === 'is_tax_exempt';

  if (isBooleanLike) {
    const trueCustomers: string[] = [];
    const falseCustomers: string[] = [];

    customers.forEach((c) => {
      const rawVal =
        attributeKey === 'category'
          ? c.category
          : c.customAttributes?.[attributeKey];

      const isTrue =
        rawVal === true ||
        rawVal === 'true' ||
        rawVal === 'TRUE' ||
        rawVal === 1 ||
        rawVal === '1' ||
        rawVal === 'yes' ||
        rawVal === 'YES';

      if (isTrue) {
        trueCustomers.push(c.id);
      } else {
        falseCustomers.push(c.id);
      }
    });

    const cleanName = attributeKey
      .replace(/^is_|^has_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    // Try finding specialized templates matching names
    const trueTemplate =
      templates.find((t) =>
        t.name.toLowerCase().includes(cleanName.toLowerCase()) ||
        t.name.toLowerCase().includes('commercial') ||
        t.name.toLowerCase().includes('premium') ||
        t.category.toLowerCase().includes('commercial')
      )?.id || defaultTemplateId;

    const falseTemplate =
      templates.find((t) =>
        t.name.toLowerCase().includes('residential') ||
        t.name.toLowerCase().includes('standard') ||
        t.name.toLowerCase().includes('basic') ||
        t.category.toLowerCase().includes('maintenance')
      )?.id || defaultTemplateId;

    const groups: CustomerGroupConfig[] = [];

    // Group 1: True / Positive
    groups.push({
      id: `grp-${attributeKey}-true`,
      name: `${cleanName} Members / Commercial (${trueCustomers.length})`,
      filterAttributeKey: attributeKey,
      matchValue: true,
      displayValueLabel: `${cleanName}: TRUE / YES`,
      customerIds: trueCustomers,
      templateId: trueTemplate,
      defaultRevenueAccountCode: '4010',
      billingPeriod: billingPeriodLabel,
      issueDate: today,
      dueDate: defaultDueDate,
      notesTemplate: `Commercial billing fee for ${billingPeriodLabel}. Includes commercial facility tariff and priority allocation.`,
    });

    // Group 2: False / Negative / Standard
    groups.push({
      id: `grp-${attributeKey}-false`,
      name: `Residential / Non-${cleanName} (${falseCustomers.length})`,
      filterAttributeKey: attributeKey,
      matchValue: false,
      displayValueLabel: `${cleanName}: FALSE / NO`,
      customerIds: falseCustomers,
      templateId: falseTemplate,
      defaultRevenueAccountCode: '4010',
      billingPeriod: billingPeriodLabel,
      issueDate: today,
      dueDate: defaultDueDate,
      notesTemplate: `Standard society maintenance fee for ${billingPeriodLabel}.`,
    });

    return groups;
  }

  // Case 3: Text / Dropdown / Category / Payment Terms (Discrete values like 4 wings, 4 grades, etc.)
  const valueBuckets = new Map<string, string[]>();
  const unsetCustomers: string[] = [];

  customers.forEach((c) => {
    let rawVal: any;
    if (attributeKey === 'category') {
      rawVal = c.category;
    } else if (attributeKey === 'paymentTermsDays') {
      rawVal = c.paymentTermsDays !== undefined ? `Net ${c.paymentTermsDays} Days` : 'Net 30 Days';
    } else {
      rawVal = c.customAttributes?.[attributeKey];
    }

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      unsetCustomers.push(c.id);
    } else {
      const stringKey = String(rawVal).trim();
      if (!valueBuckets.has(stringKey)) {
        valueBuckets.set(stringKey, []);
      }
      valueBuckets.get(stringKey)!.push(c.id);
    }
  });

  const groups: CustomerGroupConfig[] = [];
  const entries = Array.from(valueBuckets.entries());

  entries.forEach(([valString, custIds], index) => {
    // Attempt to match template by name or category similarity
    const matchedTemplate =
      templates.find((t) =>
        t.name.toLowerCase().includes(valString.toLowerCase()) ||
        t.category.toLowerCase().includes(valString.toLowerCase()) ||
        t.description?.toLowerCase().includes(valString.toLowerCase())
      )?.id ||
      templates[index % templates.length]?.id ||
      defaultTemplateId;

    const friendlyLabel = attributeKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    groups.push({
      id: `grp-${attributeKey}-${index}-${valString.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: `${valString} (${custIds.length} Customers)`,
      filterAttributeKey: attributeKey,
      matchValue: valString,
      displayValueLabel: `${friendlyLabel}: "${valString}"`,
      customerIds: custIds,
      templateId: matchedTemplate,
      defaultRevenueAccountCode: '4010',
      billingPeriod: billingPeriodLabel,
      issueDate: today,
      dueDate: defaultDueDate,
      notesTemplate: `Periodic billing for ${valString} - ${billingPeriodLabel}.`,
    });
  });

  // If some customers had unset/empty value, create a bucket for them too
  if (unsetCustomers.length > 0) {
    groups.push({
      id: `grp-${attributeKey}-unassigned`,
      name: `Unassigned / Other (${unsetCustomers.length} Customers)`,
      filterAttributeKey: attributeKey,
      matchValue: '__UNSET__',
      displayValueLabel: 'No Value Set / Default',
      customerIds: unsetCustomers,
      templateId: defaultTemplateId,
      defaultRevenueAccountCode: '4010',
      billingPeriod: billingPeriodLabel,
      issueDate: today,
      dueDate: defaultDueDate,
      notesTemplate: `Standard billing for ${billingPeriodLabel}.`,
    });
  }

  return groups;
};

/**
 * Builds preview invoice for a single customer inside a group configuration
 */
export const buildCustomerInvoicePreview = (
  customer: CustomerContact,
  group: CustomerGroupConfig,
  template: InvoiceTemplate | undefined,
  activeTenant: Tenant,
  invoiceIndex: number = 1
): BulkInvoicePreviewItem => {
  const attrs = customer.customAttributes || {};
  const currency = activeTenant.currency;
  const issueDate = group.issueDate;
  const dueDate = group.dueDate;
  const revAcc = group.defaultRevenueAccountCode || template?.defaultRevenueAccountCode || '4010';

  let items: InvoiceLineItem[] = [];
  let calculationTrace = '';

  // If group has specific custom line items override
  if (group.customLineItems && group.customLineItems.length > 0) {
    items = group.customLineItems.map((it) => ({
      ...it,
      amount: Math.round((it.quantity || 1) * (it.unitPrice || 0) * 100) / 100,
    }));
    calculationTrace = 'Using group-level custom line items override';
  } else if (template && template.items && template.items.length > 0) {
    items = template.items.map((tmplItem) => {
      let qty = tmplItem.quantity || 1;
      let price = tmplItem.unitPrice || 0;
      let lineDesc = tmplItem.description;

      // Smart Attribute Dynamic Quantity Substitution
      // 1. If group specifies a dynamic multiplier attribute key (e.g. 'carpet_area_sqft', 'seat_count')
      if (group.quantityAttributeMultiplierKey && attrs[group.quantityAttributeMultiplierKey]) {
        const factor = Number(attrs[group.quantityAttributeMultiplierKey]);
        if (!isNaN(factor) && factor > 0) {
          qty = factor;
          calculationTrace = `Multiplied quantity (${factor} ${tmplItem.unitOfMeasure || 'units'}) by customer attribute "${group.quantityAttributeMultiplierKey}"`;
        }
      }
      // 2. Or if template line item is for maintenance and customer has carpet_area_sqft
      else if (
        (tmplItem.unitOfMeasure === 'sq ft' || tmplItem.description.toLowerCase().includes('sq ft') || tmplItem.description.toLowerCase().includes('area')) &&
        attrs.carpet_area_sqft
      ) {
        const area = Number(attrs.carpet_area_sqft);
        if (!isNaN(area) && area > 0) {
          qty = area;
          calculationTrace = `Auto-substituted carpet area: ${area} sq ft`;
        }
      }
      // 3. Or if customer has a custom rate override
      if (attrs.maintenance_rate_sqft && tmplItem.unitOfMeasure === 'sq ft') {
        price = Number(attrs.maintenance_rate_sqft);
      }

      // Dynamic rate multiplier
      if (group.overrideRateMultiplier && group.overrideRateMultiplier !== 1) {
        price = Math.round(price * group.overrideRateMultiplier * 100) / 100;
      }

      // Dynamic description token replacement: {{code}}, {{name}}, {{unit}}, {{flat_no}}
      lineDesc = lineDesc
        .replace(/\{\{customer_name\}\}/gi, customer.name)
        .replace(/\{\{customer_code\}\}/gi, customer.code)
        .replace(/\{\{period\}\}/gi, group.billingPeriod || '')
        .replace(/\{\{flat_no\}\}/gi, String(attrs.unit_flat_no || attrs.unit_number || ''))
        .replace(/\{\{grade\}\}/gi, String(attrs.grade_batch || ''));

      const lineAmt = Math.round(qty * price * 100) / 100;

      return {
        productId: tmplItem.productId,
        productCode: tmplItem.productCode,
        description: lineDesc,
        quantity: qty,
        unitPrice: price,
        amount: lineAmt,
        taxRate: tmplItem.taxRate !== undefined ? tmplItem.taxRate : 10,
        unitOfMeasure: tmplItem.unitOfMeasure || 'unit',
      };
    });
  } else {
    // Fallback default line item
    items = [
      {
        description: `Standard Billing Charge - ${group.billingPeriod || 'Current Period'}`,
        quantity: 1,
        unitPrice: 1000,
        amount: 1000,
        taxRate: 10,
        unitOfMeasure: 'unit',
      },
    ];
    calculationTrace = 'Fallback standard charge';
  }

  // Calculate totals
  const subtotal = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const taxTotal = items.reduce((acc, curr) => {
    const taxAmt = (curr.amount || 0) * ((curr.taxRate || 0) / 100);
    return acc + Math.round(taxAmt * 100) / 100;
  }, 0);
  const totalAmount = Math.round((subtotal + taxTotal) * 100) / 100;

  // Render dynamic notes
  let renderedNotes = group.notesTemplate || template?.defaultNotes || `Periodic invoice for ${customer.name}.`;
  renderedNotes = renderedNotes
    .replace(/\{\{customer_name\}\}/gi, customer.name)
    .replace(/\{\{customer_code\}\}/gi, customer.code)
    .replace(/\{\{billing_period\}\}/gi, group.billingPeriod || '')
    .replace(/\{\{due_date\}\}/gi, dueDate);

  return {
    id: `prev-${group.id}-${customer.id}`,
    groupId: group.id,
    groupName: group.name,
    templateId: template?.id || 'none',
    templateCode: template?.code || 'CUSTOM',
    templateName: template?.name || 'Custom Group Configuration',
    customerId: customer.id,
    customerCode: customer.code,
    customerName: customer.name,
    customerEmail: customer.email,
    billingAddress: customer.billingAddress,
    issueDate,
    dueDate,
    currency,
    revenueAccountCode: revAcc,
    items,
    subtotal,
    taxTotal,
    totalAmount,
    notes: renderedNotes,
    isExcluded: false,
    customAttributesSnapshot: attrs,
    calculationTrace,
  };
};

/**
 * Converts preview items to downloadable CSV summary
 */
export const exportBulkInvoicePreviewToCsv = (
  previewItems: BulkInvoicePreviewItem[],
  tenantCurrency: string = 'USD'
): string => {
  const headers = [
    'Group Name',
    'Customer Code',
    'Customer Name',
    'Customer Email',
    'Template Code',
    'Line Items Summary',
    `Subtotal (${tenantCurrency})`,
    `Tax Total (${tenantCurrency})`,
    `Total Amount (${tenantCurrency})`,
    'Issue Date',
    'Due Date',
    'Revenue Account',
    'Notes',
  ];

  const rows = previewItems
    .filter((p) => !p.isExcluded)
    .map((item) => {
      const lineSummary = item.items
        .map((it) => `${it.description} (${it.quantity} @ ${it.unitPrice})`)
        .join('; ');

      return [
        `"${item.groupName.replace(/"/g, '""')}"`,
        `"${item.customerCode}"`,
        `"${item.customerName.replace(/"/g, '""')}"`,
        `"${item.customerEmail}"`,
        `"${item.templateCode}"`,
        `"${lineSummary.replace(/"/g, '""')}"`,
        item.subtotal.toFixed(2),
        item.taxTotal.toFixed(2),
        item.totalAmount.toFixed(2),
        item.issueDate,
        item.dueDate,
        item.revenueAccountCode,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

  return [headers.join(','), ...rows].join('\n');
};
