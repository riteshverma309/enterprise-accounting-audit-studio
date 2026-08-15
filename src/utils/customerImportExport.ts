import { CustomerContact, CustomAttributeDefinition } from '../types';

export interface CustomerParsedRow {
  rowNumber: number;
  code: string;
  name: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  category?: string;
  taxId?: string;
  paymentTermsDays?: number;
  notes?: string;
  customAttributes: Record<string, any>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isExistingCode: boolean;
}

/**
 * Clean and normalize attribute key from a name (snake_case)
 */
export function slugifyAttributeKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Generate CSV sample template based on active custom attributes
 */
export function generateCustomerCsvTemplate(
  tenantName: string = 'Enterprise Org',
  currency: string = 'USD',
  attributes: CustomAttributeDefinition[] = [],
  includeSamples: boolean = true
): string {
  const customerAttrs = attributes.filter(
    (a) => a.targetEntity === 'CUSTOMER' || a.targetEntity === 'BOTH'
  );

  const baseHeaders = [
    'code',
    'name',
    'email',
    'phone',
    'billingAddress',
    'category',
    'taxId',
    'paymentTermsDays',
    'notes',
  ];

  const attrHeaders = customerAttrs.map((a) => `attr_${a.key}`);
  const headerLine = [...baseHeaders, ...attrHeaders].join(',');

  if (!includeSamples) {
    return headerLine;
  }

  // Generate realistic sample rows matching attribute types
  const sampleRows: string[] = [];

  const sampleConfigs = [
    {
      code: 'CUST-001',
      name: 'Acme Global Technologies Inc',
      email: 'finance@acmeglobal.com',
      phone: '+1 (555) 234-5678',
      address: '100 Silicon Ave Suite 400 San Francisco CA',
      category: 'Enterprise Client',
      taxId: 'US-EIN-94827104',
      terms: '30',
      notes: 'Premier SaaS Client - Net 30 billing terms',
    },
    {
      code: 'CUST-002',
      name: 'Dr. Evelyn Reed (Flat B-502)',
      email: 'evelyn.reed@residence.org',
      phone: '+1 (555) 876-5432',
      address: 'Tower B Apt 502 Highgate Gardens',
      category: 'Housing Society Resident',
      taxId: 'TX-IND-48201',
      terms: '15',
      notes: 'HOA Maintenance Monthly Resident',
    },
    {
      code: 'CUST-003',
      name: 'St. Jude Academy (Roll # 2026-98)',
      email: 'admissions@stjude-edu.org',
      phone: '+1 (555) 345-6789',
      address: '450 University Way Cambridge MA',
      category: 'School Student',
      taxId: 'EDU-992019',
      terms: '30',
      notes: 'Education Tuition & Transport Enrollment',
    },
  ];

  sampleConfigs.forEach((cfg, idx) => {
    const baseValues = [
      cfg.code,
      `"${cfg.name}"`,
      cfg.email,
      `"${cfg.phone}"`,
      `"${cfg.address}"`,
      `"${cfg.category}"`,
      cfg.taxId,
      cfg.terms,
      `"${cfg.notes}"`,
    ];

    const attrValues = customerAttrs.map((attr) => {
      if (attr.dataType === 'boolean') {
        return idx % 2 === 0 ? 'TRUE' : 'FALSE';
      }
      if (attr.dataType === 'date') {
        return idx === 0 ? '2026-09-01' : idx === 1 ? '2026-08-15' : '2026-10-31';
      }
      if (attr.dataType === 'number') {
        if (attr.key.includes('flat') || attr.key.includes('unit')) return idx === 0 ? '402' : idx === 1 ? '502' : '101';
        if (attr.key.includes('area') || attr.key.includes('sqft')) return idx === 0 ? '1850' : idx === 1 ? '1200' : '950';
        if (attr.key.includes('bay') || attr.key.includes('parking')) return idx === 0 ? '2' : '1';
        return idx === 0 ? '100' : idx === 1 ? '45' : '12';
      }
      if (attr.dataType === 'decimal') {
        if (attr.key.includes('rate') || attr.key.includes('tariff') || attr.key.includes('price')) return idx === 0 ? '3.50' : idx === 1 ? '4.25' : '2.75';
        if (attr.key.includes('discount') || attr.key.includes('pct')) return idx === 0 ? '10.00' : idx === 1 ? '5.50' : '0.00';
        return idx === 0 ? '1250.75' : idx === 1 ? '450.00' : '99.50';
      }
      if (attr.dataType === 'select' && attr.options && attr.options.length > 0) {
        return `"${attr.options[idx % attr.options.length]}"`;
      }
      // Text default
      if (attr.key.includes('route') || attr.key.includes('transport')) return idx === 0 ? '"North Route Express"' : '"South Campus Shuttle"';
      if (attr.key.includes('wing') || attr.key.includes('block')) return idx === 0 ? '"Wing A"' : idx === 1 ? '"Tower B"' : '"Block C"';
      if (attr.key.includes('doctor') || attr.key.includes('physician')) return '"Dr. Sterling MD"';
      if (attr.key.includes('grade') || attr.key.includes('batch')) return idx === 0 ? '"Grade 11-B"' : '"Batch 2026"';
      return `"${attr.defaultValue || `${attr.name} sample`}"`;
    });

    sampleRows.push([...baseValues, ...attrValues].join(','));
  });

  return [headerLine, ...sampleRows].join('\n');
}

/**
 * Generate JSON sample template
 */
export function generateCustomerJsonTemplate(
  attributes: CustomAttributeDefinition[] = []
): string {
  const customerAttrs = attributes.filter(
    (a) => a.targetEntity === 'CUSTOMER' || a.targetEntity === 'BOTH'
  );

  const sampleCustomers = [
    {
      code: 'CUST-001',
      name: 'Acme Global Technologies Inc',
      email: 'finance@acmeglobal.com',
      phone: '+1 (555) 234-5678',
      billingAddress: '100 Silicon Ave Suite 400 San Francisco CA',
      category: 'Enterprise Client',
      taxId: 'US-EIN-94827104',
      paymentTermsDays: 30,
      notes: 'Premier SaaS Client - Net 30 billing terms',
      customAttributes: Object.fromEntries(
        customerAttrs.map((a) => {
          if (a.dataType === 'boolean') return [a.key, true];
          if (a.dataType === 'date') return [a.key, '2026-09-01'];
          if (a.dataType === 'number') return [a.key, 1200];
          if (a.dataType === 'decimal') return [a.key, 3.5];
          if (a.dataType === 'select' && a.options?.length) return [a.key, a.options[0]];
          return [a.key, a.defaultValue || 'Sample Text'];
        })
      ),
    },
    {
      code: 'CUST-002',
      name: 'Dr. Evelyn Reed (Flat B-502)',
      email: 'evelyn.reed@residence.org',
      phone: '+1 (555) 876-5432',
      billingAddress: 'Tower B Apt 502 Highgate Gardens',
      category: 'Housing Society Resident',
      taxId: 'TX-IND-48201',
      paymentTermsDays: 15,
      notes: 'HOA Maintenance Monthly Resident',
      customAttributes: Object.fromEntries(
        customerAttrs.map((a) => {
          if (a.dataType === 'boolean') return [a.key, false];
          if (a.dataType === 'date') return [a.key, '2026-08-15'];
          if (a.dataType === 'number') return [a.key, 502];
          if (a.dataType === 'decimal') return [a.key, 4.25];
          if (a.dataType === 'select' && a.options?.length) return [a.key, a.options[0]];
          return [a.key, a.defaultValue || 'Sample Text'];
        })
      ),
    },
  ];

  return JSON.stringify(sampleCustomers, null, 2);
}

/**
 * Export existing customers to CSV
 */
export function exportCustomersToCsv(
  customers: CustomerContact[],
  attributes: CustomAttributeDefinition[]
): string {
  const customerAttrs = attributes.filter(
    (a) => a.targetEntity === 'CUSTOMER' || a.targetEntity === 'BOTH'
  );

  const baseHeaders = [
    'code',
    'name',
    'email',
    'phone',
    'billingAddress',
    'category',
    'taxId',
    'paymentTermsDays',
    'status',
    'notes',
  ];

  const attrHeaders = customerAttrs.map((a) => `attr_${a.key}`);
  const headerLine = [...baseHeaders, ...attrHeaders].join(',');

  const rows = customers.map((c) => {
    const baseCols = [
      c.code || '',
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.email || '',
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.billingAddress || '').replace(/"/g, '""')}"`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      c.taxId || '',
      c.paymentTermsDays || 30,
      c.status || 'ACTIVE',
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ];

    const attrCols = customerAttrs.map((attr) => {
      const val = c.customAttributes?.[attr.key];
      if (val === undefined || val === null || val === '') return '';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'number') return String(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    });

    return [...baseCols, ...attrCols].join(',');
  });

  return [headerLine, ...rows].join('\n');
}

/**
 * Robust CSV parser that handles quoted strings with commas and newlines
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  const sanitized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const nextChar = sanitized[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === ',' || char === '\t') && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      // Only push non-empty rows
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse dynamic typed attribute value
 */
export function parseTypedAttributeValue(
  rawVal: any,
  attribute: CustomAttributeDefinition
): { value: any; error?: string } {
  if (rawVal === undefined || rawVal === null || rawVal === '') {
    if (attribute.isRequired) {
      return { value: undefined, error: `Required field "${attribute.name}" is missing.` };
    }
    return { value: attribute.defaultValue !== undefined ? attribute.defaultValue : '' };
  }

  const str = String(rawVal).trim();

  switch (attribute.dataType) {
    case 'boolean': {
      const lower = str.toLowerCase();
      if (['true', '1', 'yes', 'y', 't', 'active'].includes(lower)) {
        return { value: true };
      }
      if (['false', '0', 'no', 'n', 'f', 'inactive'].includes(lower)) {
        return { value: false };
      }
      return {
        value: Boolean(str),
        error: `Value "${str}" cannot be converted to boolean (expected TRUE/FALSE or YES/NO).`,
      };
    }

    case 'number': {
      const cleaned = str.replace(/,/g, '');
      const num = parseInt(cleaned, 10);
      if (isNaN(num)) {
        return {
          value: str,
          error: `Field "${attribute.name}" requires a whole number, got "${str}".`,
        };
      }
      return { value: num };
    }

    case 'decimal': {
      // Strip currency symbols and commas
      const cleaned = str.replace(/[$€£₹¥,]/g, '').trim();
      const num = parseFloat(cleaned);
      if (isNaN(num)) {
        return {
          value: str,
          error: `Field "${attribute.name}" requires a decimal number, got "${str}".`,
        };
      }
      return { value: Math.round(num * 100) / 100 };
    }

    case 'date': {
      // Validate date
      const timestamp = Date.parse(str);
      if (isNaN(timestamp)) {
        return {
          value: str,
          error: `Field "${attribute.name}" requires date format (YYYY-MM-DD), got "${str}".`,
        };
      }
      const d = new Date(timestamp);
      const isoDate = d.toISOString().split('T')[0];
      return { value: isoDate };
    }

    case 'select': {
      if (attribute.options && attribute.options.length > 0) {
        const match = attribute.options.find(
          (opt) => opt.toLowerCase() === str.toLowerCase()
        );
        if (match) return { value: match };
        return {
          value: str,
          error: `Value "${str}" not among allowed options: [${attribute.options.join(', ')}]`,
        };
      }
      return { value: str };
    }

    case 'text':
    default:
      return { value: str };
  }
}

/**
 * Main parser and validator for customer batch uploads
 */
export function parseAndValidateCustomerUpload(
  fileContent: string,
  format: 'csv' | 'json',
  attributes: CustomAttributeDefinition[],
  existingCustomers: CustomerContact[] = []
): CustomerParsedRow[] {
  const customerAttrs = attributes.filter(
    (a) => a.targetEntity === 'CUSTOMER' || a.targetEntity === 'BOTH'
  );

  const existingCodesMap = new Map(existingCustomers.map((c) => [c.code.toLowerCase(), c]));
  const seenCodesInBatch = new Set<string>();

  if (format === 'json') {
    try {
      const parsed = JSON.parse(fileContent);
      const array = Array.isArray(parsed) ? parsed : [parsed];

      return array.map((item: any, idx: number) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        const code = String(item.code || `CUST-IMP-${String(idx + 1).padStart(3, '0')}`).trim();
        const name = String(item.name || '').trim();
        const email = String(item.email || '').trim();

        if (!name) errors.push('Customer Name is required.');
        if (!email) errors.push('Customer Email is required.');
        else if (!email.includes('@') || !email.includes('.')) warnings.push('Email format appears non-standard.');

        const isExistingCode = existingCodesMap.has(code.toLowerCase());
        if (seenCodesInBatch.has(code.toLowerCase())) {
          errors.push(`Duplicate code "${code}" encountered multiple times in batch.`);
        } else {
          seenCodesInBatch.add(code.toLowerCase());
        }

        const customAttributes: Record<string, any> = {};

        // Parse custom attributes from item.customAttributes or root keys
        customerAttrs.forEach((attr) => {
          let rawVal = item.customAttributes?.[attr.key];
          if (rawVal === undefined) rawVal = item[`attr_${attr.key}`];
          if (rawVal === undefined) rawVal = item[attr.key];
          if (rawVal === undefined) rawVal = item[attr.name];

          const parsedAttr = parseTypedAttributeValue(rawVal, attr);
          if (parsedAttr.error) {
            errors.push(parsedAttr.error);
          }
          if (parsedAttr.value !== undefined) {
            customAttributes[attr.key] = parsedAttr.value;
          }
        });

        return {
          rowNumber: idx + 1,
          code,
          name,
          email,
          phone: item.phone ? String(item.phone) : undefined,
          billingAddress: item.billingAddress || item.address ? String(item.billingAddress || item.address) : undefined,
          category: item.category ? String(item.category) : 'Enterprise Client',
          taxId: item.taxId ? String(item.taxId) : undefined,
          paymentTermsDays: Number(item.paymentTermsDays) || 30,
          notes: item.notes ? String(item.notes) : undefined,
          customAttributes,
          isValid: errors.length === 0,
          errors,
          warnings,
          isExistingCode,
        };
      });
    } catch (err: any) {
      return [
        {
          rowNumber: 1,
          code: 'ERR',
          name: 'Invalid JSON',
          email: '',
          customAttributes: {},
          isValid: false,
          errors: [`JSON Parse Error: ${err.message}`],
          warnings: [],
          isExistingCode: false,
        },
      ];
    }
  }

  // CSV parsing
  const rawRows = parseCsvRows(fileContent);
  if (rawRows.length === 0) return [];

  const headers = rawRows[0].map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));
  const dataRows = rawRows.slice(1);

  // Build column index map
  const getColIndex = (aliases: string[]): number => {
    return headers.findIndex((h) => aliases.some((a) => h === a.toLowerCase() || h.includes(a.toLowerCase())));
  };

  const codeIdx = getColIndex(['code', 'customercode', 'cust_code', 'customer_code', 'id']);
  const nameIdx = getColIndex(['name', 'customername', 'customer_name', 'client_name', 'full_name']);
  const emailIdx = getColIndex(['email', 'customeremail', 'customer_email', 'mail', 'contact_email']);
  const phoneIdx = getColIndex(['phone', 'mobile', 'telephone', 'phone_number', 'contact_phone']);
  const addressIdx = getColIndex(['billingaddress', 'address', 'billing_address', 'residence', 'street']);
  const categoryIdx = getColIndex(['category', 'entity_category', 'type', 'client_type', 'group']);
  const taxIdIdx = getColIndex(['taxid', 'tax_id', 'gstin', 'tin', 'ssn', 'ein']);
  const termsIdx = getColIndex(['paymenttermsdays', 'payment_terms', 'terms', 'paymentterms', 'net_days']);
  const notesIdx = getColIndex(['notes', 'memo', 'comments', 'remarks', 'description']);

  // Custom attribute column mappings
  const attrColMap: { attr: CustomAttributeDefinition; colIdx: number }[] = [];
  customerAttrs.forEach((attr) => {
    const keyMatchIdx = headers.findIndex(
      (h) =>
        h === `attr_${attr.key.toLowerCase()}` ||
        h === attr.key.toLowerCase() ||
        h === attr.name.toLowerCase() ||
        h.includes(attr.key.toLowerCase())
    );
    if (keyMatchIdx !== -1) {
      attrColMap.push({ attr, colIdx: keyMatchIdx });
    }
  });

  return dataRows.map((cols, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const code = (codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx] : `CUST-IMP-${String(idx + 1).padStart(3, '0')}`).trim();
    const name = (nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : '').trim();
    const email = (emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : '').trim();

    if (!name) errors.push('Customer Name is missing.');
    if (!email) errors.push('Customer Email is missing.');
    else if (!email.includes('@') || !email.includes('.')) warnings.push('Email format appears non-standard.');

    const isExistingCode = existingCodesMap.has(code.toLowerCase());
    if (seenCodesInBatch.has(code.toLowerCase())) {
      errors.push(`Duplicate code "${code}" encountered multiple times in batch.`);
    } else {
      seenCodesInBatch.add(code.toLowerCase());
    }

    const customAttributes: Record<string, any> = {};

    customerAttrs.forEach((attr) => {
      const mapping = attrColMap.find((m) => m.attr.key === attr.key);
      const rawVal = mapping && mapping.colIdx !== -1 ? cols[mapping.colIdx] : undefined;

      const parsedAttr = parseTypedAttributeValue(rawVal, attr);
      if (parsedAttr.error) {
        errors.push(parsedAttr.error);
      }
      if (parsedAttr.value !== undefined) {
        customAttributes[attr.key] = parsedAttr.value;
      }
    });

    return {
      rowNumber: idx + 2, // 1-indexed plus header row
      code,
      name,
      email,
      phone: phoneIdx !== -1 && cols[phoneIdx] ? cols[phoneIdx] : undefined,
      billingAddress: addressIdx !== -1 && cols[addressIdx] ? cols[addressIdx] : undefined,
      category: categoryIdx !== -1 && cols[categoryIdx] ? cols[categoryIdx] : 'Enterprise Client',
      taxId: taxIdIdx !== -1 && cols[taxIdIdx] ? cols[taxIdIdx] : undefined,
      paymentTermsDays: termsIdx !== -1 && cols[termsIdx] ? Number(cols[termsIdx]) || 30 : 30,
      notes: notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx] : undefined,
      customAttributes,
      isValid: errors.length === 0,
      errors,
      warnings,
      isExistingCode,
    };
  });
}
