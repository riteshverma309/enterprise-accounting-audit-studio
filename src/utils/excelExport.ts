import { CustomerContact, CustomerInvoice, CustomerPaymentReceipt, CustomerStatementData, Tenant } from '../types';

/**
 * Escapes XML strings for Microsoft Excel 2003 XML format.
 */
function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates and triggers download of a standardized Microsoft Excel XML Workbook (.xls/.xlsx compatible).
 */
export function downloadExcelXmlWorkbook(
  filename: string,
  sheets: {
    name: string;
    rows: Array<Array<{ value: any; type?: 'String' | 'Number' | 'DateTime'; styleId?: string; formula?: string }>>;
  }[]
) {
  const styles = `
    <Styles>
      <Style ss:ID="Default" ss:Name="Normal">
        <Alignment ss:Vertical="Center"/>
        <Borders/>
        <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
        <Interior/>
        <NumberFormat/>
        <Protection/>
      </Style>
      <Style ss:ID="HeaderTitle">
        <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
        <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="SubHeader">
        <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#475569"/>
      </Style>
      <Style ss:ID="TableHeader">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#334155"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
        <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="TableHeaderGreen">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#065F46"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
        <Interior ss:Color="#047857" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="TableHeaderIndigo">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#3730A3"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
        <Interior ss:Color="#4338CA" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="CellText">
        <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>
      </Style>
      <Style ss:ID="CellTextBold">
        <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
      </Style>
      <Style ss:ID="CellNumber">
        <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
        <NumberFormat ss:Format="#,##0.00"/>
      </Style>
      <Style ss:ID="CellNumberBold">
        <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
        <NumberFormat ss:Format="#,##0.00"/>
      </Style>
      <Style ss:ID="CellOverdue">
        <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
        <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
        <NumberFormat ss:Format="#,##0.00"/>
      </Style>
      <Style ss:ID="CellStatusPaid">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#047857"/>
        <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="CellStatusUnpaid">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#B91C1C"/>
        <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="CellStatusPart">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#B45309"/>
        <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="CellEditHighlight">
        <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#92400E"/>
        <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
        <NumberFormat ss:Format="#,##0.00"/>
      </Style>
      <Style ss:ID="CellEditHighlightFlag">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#6366F1"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#6366F1"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#6366F1"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#6366F1"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#3730A3"/>
        <Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="TotalRow">
        <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
          <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
        <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
        <NumberFormat ss:Format="#,##0.00"/>
      </Style>
    </Styles>
  `;

  let workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>General Ledger ERP &amp; AR Subledger</Author>
    <LastAuthor>System Financial Engine</LastAuthor>
    <Created>${new Date().toISOString()}</Created>
    <Company>Multi-Tenant Enterprise ERP</Company>
  </DocumentProperties>
  ${styles}
  `;

  sheets.forEach((sheet) => {
    const cleanSheetName = escapeXml(sheet.name.substring(0, 31));
    workbookXml += `<Worksheet ss:Name="${cleanSheetName}">\n`;
    workbookXml += `<Table ss:DefaultRowHeight="20">\n`;

    sheet.rows.forEach((row) => {
      workbookXml += `  <Row>\n`;
      row.forEach((cell) => {
        const styleAttr = cell.styleId ? ` ss:StyleID="${cell.styleId}"` : '';
        const formulaAttr = cell.formula ? ` ss:Formula="${escapeXml(cell.formula)}"` : '';
        const valType = cell.type || (typeof cell.value === 'number' ? 'Number' : 'String');
        const val = typeof cell.value === 'number' ? cell.value : escapeXml(cell.value);

        workbookXml += `    <Cell${styleAttr}${formulaAttr}><Data ss:Type="${valType}">${val}</Data></Cell>\n`;
      });
      workbookXml += `  </Row>\n`;
    });

    workbookXml += `</Table>\n`;
    workbookXml += `</Worksheet>\n`;
  });

  workbookXml += `</Workbook>`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a standard CSV file for raw data exports.
 */
export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]) {
  const sanitize = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(sanitize).join(','),
    ...rows.map((row) => row.map(sanitize).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. EXPORT CUSTOMER INVOICES REGISTER TO EXCEL
 */
export function exportInvoicesToExcel(params: {
  tenant: Tenant;
  invoices: CustomerInvoice[];
  customers: CustomerContact[];
  asOfDate?: string;
}) {
  const { tenant, invoices, customers, asOfDate = '2026-08-14' } = params;
  const asOfTime = new Date(asOfDate).getTime();

  // Sort invoices by Issue Date descending
  const sortedInvoices = [...invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  const customerMap = new Map<string, CustomerContact>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const sheet1Rows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];

  // Title block
  sheet1Rows.push([
    { value: `${tenant.name} - Customer Invoices Register`, styleId: 'HeaderTitle' },
  ]);
  sheet1Rows.push([
    {
      value: `As of: ${asOfDate} | Currency: ${tenant.currency} | Total Invoices: ${sortedInvoices.length}`,
      styleId: 'SubHeader',
    },
  ]);
  sheet1Rows.push([]); // Blank row

  // Table Headers
  sheet1Rows.push([
    { value: 'Invoice #', styleId: 'TableHeader' },
    { value: 'Customer Code', styleId: 'TableHeader' },
    { value: 'Customer Name', styleId: 'TableHeader' },
    { value: 'Category / Segment', styleId: 'TableHeader' },
    { value: 'Issue Date', styleId: 'TableHeader' },
    { value: 'Due Date', styleId: 'TableHeader' },
    { value: 'Days Overdue', styleId: 'TableHeader' },
    { value: 'Aging Bracket', styleId: 'TableHeader' },
    { value: `Subtotal (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Tax (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Total Amount (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Amount Paid (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Balance Due (${tenant.currency})`, styleId: 'TableHeader' },
    { value: 'Status', styleId: 'TableHeader' },
    { value: 'Revenue Account', styleId: 'TableHeader' },
    { value: 'Itemized Descriptions', styleId: 'TableHeader' },
  ]);

  let sumSubtotal = 0;
  let sumTax = 0;
  let sumTotal = 0;
  let sumPaid = 0;
  let sumBalance = 0;

  sortedInvoices.forEach((inv) => {
    const cust = customerMap.get(inv.customerId);
    const balanceDue = Math.max(0, inv.totalAmount - inv.amountPaid);
    const dueTime = new Date(inv.dueDate).getTime();
    const diffDays = Math.floor((asOfTime - dueTime) / (1000 * 60 * 60 * 24));
    
    let agingBracket = 'Current (Not Due)';
    let overdueDays = 0;
    if (balanceDue > 0.001) {
      if (diffDays > 0) {
        overdueDays = diffDays;
        if (diffDays <= 30) agingBracket = '1 - 30 Days';
        else if (diffDays <= 60) agingBracket = '31 - 60 Days';
        else if (diffDays <= 90) agingBracket = '61 - 90 Days';
        else agingBracket = '90+ Days';
      }
    } else {
      agingBracket = 'Settled (Paid)';
    }

    sumSubtotal += inv.subtotal;
    sumTax += inv.taxTotal;
    sumTotal += inv.totalAmount;
    sumPaid += inv.amountPaid;
    sumBalance += balanceDue;

    const itemsSummary = inv.items?.map((it) => `${it.quantity}x ${it.description} @ ${it.unitPrice}`).join(' | ') || inv.notes || '';
    const statusStyle = inv.status === 'PAID' ? 'CellStatusPaid' : inv.status === 'PARTIALLY_PAID' ? 'CellStatusPart' : 'CellStatusUnpaid';

    sheet1Rows.push([
      { value: inv.invoiceNumber, styleId: 'CellTextBold' },
      { value: cust?.code || inv.customerId || '-', styleId: 'CellText' },
      { value: inv.customerName, styleId: 'CellText' },
      { value: cust?.category || 'General', styleId: 'CellText' },
      { value: inv.issueDate, styleId: 'CellText' },
      { value: inv.dueDate, styleId: 'CellText' },
      { value: overdueDays, type: 'Number', styleId: overdueDays > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: agingBracket, styleId: overdueDays > 0 ? 'CellOverdue' : 'CellText' },
      { value: inv.subtotal, type: 'Number', styleId: 'CellNumber' },
      { value: inv.taxTotal, type: 'Number', styleId: 'CellNumber' },
      { value: inv.totalAmount, type: 'Number', styleId: 'CellNumberBold' },
      { value: inv.amountPaid, type: 'Number', styleId: 'CellNumber' },
      { value: balanceDue, type: 'Number', styleId: balanceDue > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: inv.status, styleId: statusStyle },
      { value: inv.revenueAccountCode || '4010', styleId: 'CellText' },
      { value: itemsSummary, styleId: 'CellText' },
    ]);
  });

  // Totals Row
  sheet1Rows.push([
    { value: 'TOTALS', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: sumSubtotal, type: 'Number', styleId: 'TotalRow' },
    { value: sumTax, type: 'Number', styleId: 'TotalRow' },
    { value: sumTotal, type: 'Number', styleId: 'TotalRow' },
    { value: sumPaid, type: 'Number', styleId: 'TotalRow' },
    { value: sumBalance, type: 'Number', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
  ]);

  downloadExcelXmlWorkbook(`${tenant.code || 'ERP'}_Invoices_Register_${asOfDate}`, [
    { name: 'Invoices Register', rows: sheet1Rows },
  ]);
}

/**
 * 2. EXPORT COMPREHENSIVE AR AGING SCHEDULE & MATRIX TO EXCEL
 */
export function exportArAgingScheduleToExcel(params: {
  tenant: Tenant;
  customers: CustomerContact[];
  invoices: CustomerInvoice[];
  paymentReceipts: CustomerPaymentReceipt[];
  openingBalances: any[];
  getCustomerStatementData: (customerId: string) => CustomerStatementData;
  asOfDate?: string;
}) {
  const { tenant, customers, invoices, getCustomerStatementData, asOfDate = '2026-08-14' } = params;
  const asOfTime = new Date(asOfDate).getTime();

  // Sheet 1: Customer Portfolio Aging Summary Matrix
  const summaryRows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];

  summaryRows.push([
    { value: `${tenant.name} - Accounts Receivable (AR) Aging Summary Matrix`, styleId: 'HeaderTitle' },
  ]);
  summaryRows.push([
    {
      value: `As of Date: ${asOfDate} | Reporting Standard: ${tenant.pluginId.toUpperCase()} | Currency: ${tenant.currency}`,
      styleId: 'SubHeader',
    },
  ]);
  summaryRows.push([]); // Blank row

  // Headers
  summaryRows.push([
    { value: 'Customer Code', styleId: 'TableHeaderIndigo' },
    { value: 'Customer Name', styleId: 'TableHeaderIndigo' },
    { value: 'Category', styleId: 'TableHeaderIndigo' },
    { value: 'Payment Terms', styleId: 'TableHeaderIndigo' },
    { value: `Current (Not Due)`, styleId: 'TableHeaderIndigo' },
    { value: `1 - 30 Days`, styleId: 'TableHeaderIndigo' },
    { value: `31 - 60 Days`, styleId: 'TableHeaderIndigo' },
    { value: `61 - 90 Days`, styleId: 'TableHeaderIndigo' },
    { value: `90+ Days`, styleId: 'TableHeaderIndigo' },
    { value: `Total Outstanding`, styleId: 'TableHeaderIndigo' },
    { value: `Overdue Arrears`, styleId: 'TableHeaderIndigo' },
    { value: `Available Advances`, styleId: 'TableHeaderIndigo' },
    { value: `Total Invoiced YTD`, styleId: 'TableHeaderIndigo' },
    { value: `Total Paid YTD`, styleId: 'TableHeaderIndigo' },
  ]);

  let totalCurrent = 0;
  let total1To30 = 0;
  let total31To60 = 0;
  let total61To90 = 0;
  let total90Plus = 0;
  let grandOutstanding = 0;
  let grandOverdue = 0;
  let grandAdvances = 0;
  let grandInvoiced = 0;
  let grandPaid = 0;

  customers.forEach((cust) => {
    const data = getCustomerStatementData(cust.id);
    const m = data.metrics;

    totalCurrent += m.aging.current;
    total1To30 += m.aging.days1To30;
    total31To60 += m.aging.days31To60;
    total61To90 += m.aging.days61To90;
    total90Plus += m.aging.days90Plus;
    grandOutstanding += m.netOutstanding;
    grandOverdue += m.overdueAmount;
    grandAdvances += m.totalAdvanceCredits;
    grandInvoiced += m.totalInvoiced;
    grandPaid += m.totalPaid;

    summaryRows.push([
      { value: cust.code || cust.id, styleId: 'CellTextBold' },
      { value: cust.name, styleId: 'CellText' },
      { value: cust.category || 'Standard', styleId: 'CellText' },
      { value: cust.paymentTermsDays ? `${cust.paymentTermsDays} Days` : 'Due on Receipt', styleId: 'CellText' },
      { value: m.aging.current, type: 'Number', styleId: 'CellNumber' },
      { value: m.aging.days1To30, type: 'Number', styleId: m.aging.days1To30 > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: m.aging.days31To60, type: 'Number', styleId: m.aging.days31To60 > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: m.aging.days61To90, type: 'Number', styleId: m.aging.days61To90 > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: m.aging.days90Plus, type: 'Number', styleId: m.aging.days90Plus > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: m.netOutstanding, type: 'Number', styleId: 'CellNumberBold' },
      { value: m.overdueAmount, type: 'Number', styleId: m.overdueAmount > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: m.totalAdvanceCredits, type: 'Number', styleId: 'CellNumber' },
      { value: m.totalInvoiced, type: 'Number', styleId: 'CellNumber' },
      { value: m.totalPaid, type: 'Number', styleId: 'CellNumber' },
    ]);
  });

  // Grand Total Summary
  summaryRows.push([
    { value: 'GRAND TOTALS', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: '', styleId: 'TotalRow' },
    { value: totalCurrent, type: 'Number', styleId: 'TotalRow' },
    { value: total1To30, type: 'Number', styleId: 'TotalRow' },
    { value: total31To60, type: 'Number', styleId: 'TotalRow' },
    { value: total61To90, type: 'Number', styleId: 'TotalRow' },
    { value: total90Plus, type: 'Number', styleId: 'TotalRow' },
    { value: grandOutstanding, type: 'Number', styleId: 'TotalRow' },
    { value: grandOverdue, type: 'Number', styleId: 'TotalRow' },
    { value: grandAdvances, type: 'Number', styleId: 'TotalRow' },
    { value: grandInvoiced, type: 'Number', styleId: 'TotalRow' },
    { value: grandPaid, type: 'Number', styleId: 'TotalRow' },
  ]);

  // Sheet 2: Outstanding Invoices Itemized Aging Detail
  const detailRows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];

  detailRows.push([
    { value: `${tenant.name} - Detailed Outstanding Invoice Aging Schedule`, styleId: 'HeaderTitle' },
  ]);
  detailRows.push([
    { value: `Itemized breakdown of all unpaid & partially paid invoices by aging bucket`, styleId: 'SubHeader' },
  ]);
  detailRows.push([]);

  detailRows.push([
    { value: 'Invoice #', styleId: 'TableHeader' },
    { value: 'Customer Name', styleId: 'TableHeader' },
    { value: 'Issue Date', styleId: 'TableHeader' },
    { value: 'Due Date', styleId: 'TableHeader' },
    { value: 'Days Past Due', styleId: 'TableHeader' },
    { value: 'Aging Bucket', styleId: 'TableHeader' },
    { value: `Invoice Total (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Amount Paid (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Current (Not Due)`, styleId: 'TableHeader' },
    { value: `1 - 30 Days`, styleId: 'TableHeader' },
    { value: `31 - 60 Days`, styleId: 'TableHeader' },
    { value: `61 - 90 Days`, styleId: 'TableHeader' },
    { value: `90+ Days`, styleId: 'TableHeader' },
    { value: `Net Outstanding`, styleId: 'TableHeader' },
  ]);

  const unpaidInvoices = invoices.filter((i) => i.totalAmount - i.amountPaid > 0.001);
  unpaidInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  unpaidInvoices.forEach((inv) => {
    const unpaid = inv.totalAmount - inv.amountPaid;
    const dueTime = new Date(inv.dueDate).getTime();
    const diffDays = Math.floor((asOfTime - dueTime) / (1000 * 60 * 60 * 24));

    let bucket = 'Current';
    let cCurrent = 0;
    let c1To30 = 0;
    let c31To60 = 0;
    let c61To90 = 0;
    let c90Plus = 0;

    if (diffDays <= 0) {
      cCurrent = unpaid;
      bucket = 'Current';
    } else {
      if (diffDays <= 30) {
        c1To30 = unpaid;
        bucket = '1 - 30 Days';
      } else if (diffDays <= 60) {
        c31To60 = unpaid;
        bucket = '31 - 60 Days';
      } else if (diffDays <= 90) {
        c61To90 = unpaid;
        bucket = '61 - 90 Days';
      } else {
        c90Plus = unpaid;
        bucket = '90+ Days';
      }
    }

    detailRows.push([
      { value: inv.invoiceNumber, styleId: 'CellTextBold' },
      { value: inv.customerName, styleId: 'CellText' },
      { value: inv.issueDate, styleId: 'CellText' },
      { value: inv.dueDate, styleId: 'CellText' },
      { value: diffDays > 0 ? diffDays : 0, type: 'Number', styleId: diffDays > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: bucket, styleId: diffDays > 0 ? 'CellOverdue' : 'CellText' },
      { value: inv.totalAmount, type: 'Number', styleId: 'CellNumber' },
      { value: inv.amountPaid, type: 'Number', styleId: 'CellNumber' },
      { value: cCurrent, type: 'Number', styleId: 'CellNumber' },
      { value: c1To30, type: 'Number', styleId: c1To30 > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: c31To60, type: 'Number', styleId: c31To60 > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: c61To90, type: 'Number', styleId: c61To90 > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: c90Plus, type: 'Number', styleId: c90Plus > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: unpaid, type: 'Number', styleId: 'CellNumberBold' },
    ]);
  });

  downloadExcelXmlWorkbook(`${tenant.code || 'ERP'}_AR_Aging_Schedule_${asOfDate}`, [
    { name: 'AR Aging Summary', rows: summaryRows },
    { name: 'Detailed Aging Invoices', rows: detailRows },
  ]);
}

/**
 * 3. EXPORT SINGLE CUSTOMER 360 STATEMENT & TRANSACTION LEDGER TO EXCEL
 */
export function exportSingleCustomerStatementToExcel(params: {
  tenant: Tenant;
  customer: CustomerContact;
  statementData: CustomerStatementData;
  asOfDate?: string;
}) {
  const { tenant, customer, statementData, asOfDate = '2026-08-14' } = params;
  const m = statementData.metrics;

  // Sheet 1: Statement Summary & Running Ledger
  const ledgerRows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];

  ledgerRows.push([
    { value: `${tenant.name} - Statement of Account & Ledger`, styleId: 'HeaderTitle' },
  ]);
  ledgerRows.push([
    {
      value: `Customer: ${customer.name} (${customer.code || customer.id}) | Category: ${customer.category || 'General'} | Terms: Net ${customer.paymentTermsDays || 30} Days`,
      styleId: 'SubHeader',
    },
  ]);
  ledgerRows.push([
    {
      value: `Contact: ${customer.email || 'N/A'} | Phone: ${customer.phone || 'N/A'} | Billing: ${customer.billingAddress || 'N/A'}`,
      styleId: 'SubHeader',
    },
  ]);
  ledgerRows.push([]);

  // KPI Summary Block
  ledgerRows.push([
    { value: 'FINANCIAL KPI SUMMARY', styleId: 'TableHeaderGreen' },
    { value: '', styleId: 'TableHeaderGreen' },
  ]);
  ledgerRows.push([
    { value: 'Total Invoiced:', styleId: 'CellTextBold' },
    { value: m.totalInvoiced, type: 'Number', styleId: 'CellNumberBold' },
  ]);
  ledgerRows.push([
    { value: 'Total Payments Received:', styleId: 'CellTextBold' },
    { value: m.totalPaid, type: 'Number', styleId: 'CellNumberBold' },
  ]);
  ledgerRows.push([
    { value: 'NET CURRENT OUTSTANDING:', styleId: 'CellTextBold' },
    { value: m.netOutstanding, type: 'Number', styleId: 'TotalRow' },
  ]);
  ledgerRows.push([
    { value: 'Total Overdue Arrears:', styleId: 'CellTextBold' },
    { value: m.overdueAmount, type: 'Number', styleId: m.overdueAmount > 0 ? 'CellOverdue' : 'CellNumber' },
  ]);
  ledgerRows.push([
    { value: 'Unallocated Advances / Credits:', styleId: 'CellTextBold' },
    { value: m.totalAdvanceCredits, type: 'Number', styleId: 'CellNumber' },
  ]);
  ledgerRows.push([]);

  // Aging Summary Block
  ledgerRows.push([
    { value: 'AR AGING BRACKET BREAKDOWN', styleId: 'TableHeaderIndigo' },
    { value: '', styleId: 'TableHeaderIndigo' },
  ]);
  ledgerRows.push([
    { value: 'Current (Not Due):', styleId: 'CellText' },
    { value: m.aging.current, type: 'Number', styleId: 'CellNumber' },
  ]);
  ledgerRows.push([
    { value: '1 - 30 Days Past Due:', styleId: 'CellText' },
    { value: m.aging.days1To30, type: 'Number', styleId: m.aging.days1To30 > 0 ? 'CellOverdue' : 'CellNumber' },
  ]);
  ledgerRows.push([
    { value: '31 - 60 Days Past Due:', styleId: 'CellText' },
    { value: m.aging.days31To60, type: 'Number', styleId: m.aging.days31To60 > 0 ? 'CellOverdue' : 'CellNumber' },
  ]);
  ledgerRows.push([
    { value: '61 - 90 Days Past Due:', styleId: 'CellText' },
    { value: m.aging.days61To90, type: 'Number', styleId: m.aging.days61To90 > 0 ? 'CellOverdue' : 'CellNumber' },
  ]);
  ledgerRows.push([
    { value: '90+ Days Past Due:', styleId: 'CellText' },
    { value: m.aging.days90Plus, type: 'Number', styleId: m.aging.days90Plus > 0 ? 'CellOverdue' : 'CellNumber' },
  ]);
  ledgerRows.push([]);

  // Running Ledger
  ledgerRows.push([
    { value: 'Date', styleId: 'TableHeader' },
    { value: 'Type', styleId: 'TableHeader' },
    { value: 'Reference #', styleId: 'TableHeader' },
    { value: 'Description / Memo', styleId: 'TableHeader' },
    { value: 'Due Date', styleId: 'TableHeader' },
    { value: `Debit / Invoice (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Credit / Payment (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Running Balance (${tenant.currency})`, styleId: 'TableHeader' },
  ]);

  statementData.transactions.forEach((tx) => {
    ledgerRows.push([
      { value: tx.date, styleId: 'CellText' },
      { value: tx.type, styleId: 'CellTextBold' },
      { value: tx.referenceNumber, styleId: 'CellText' },
      { value: tx.description, styleId: 'CellText' },
      { value: tx.dueDate || '-', styleId: 'CellText' },
      { value: tx.debit, type: 'Number', styleId: 'CellNumber' },
      { value: tx.credit, type: 'Number', styleId: 'CellNumber' },
      { value: tx.runningBalance, type: 'Number', styleId: 'CellNumberBold' },
    ]);
  });

  // Sheet 2: Itemized Invoices List
  const invRows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];
  invRows.push([
    { value: `${customer.name} - Invoices History Register`, styleId: 'HeaderTitle' },
  ]);
  invRows.push([]);
  invRows.push([
    { value: 'Invoice #', styleId: 'TableHeader' },
    { value: 'Issue Date', styleId: 'TableHeader' },
    { value: 'Due Date', styleId: 'TableHeader' },
    { value: `Subtotal (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Tax (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Total (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Paid (${tenant.currency})`, styleId: 'TableHeader' },
    { value: `Balance (${tenant.currency})`, styleId: 'TableHeader' },
    { value: 'Status', styleId: 'TableHeader' },
    { value: 'Notes / Lines', styleId: 'TableHeader' },
  ]);

  statementData.invoices.forEach((inv) => {
    const bal = Math.max(0, inv.totalAmount - inv.amountPaid);
    invRows.push([
      { value: inv.invoiceNumber, styleId: 'CellTextBold' },
      { value: inv.issueDate, styleId: 'CellText' },
      { value: inv.dueDate, styleId: 'CellText' },
      { value: inv.subtotal, type: 'Number', styleId: 'CellNumber' },
      { value: inv.taxTotal, type: 'Number', styleId: 'CellNumber' },
      { value: inv.totalAmount, type: 'Number', styleId: 'CellNumberBold' },
      { value: inv.amountPaid, type: 'Number', styleId: 'CellNumber' },
      { value: bal, type: 'Number', styleId: bal > 0 ? 'CellOverdue' : 'CellNumber' },
      { value: inv.status, styleId: inv.status === 'PAID' ? 'CellStatusPaid' : 'CellStatusUnpaid' },
      { value: inv.items?.map((it) => `${it.quantity}x ${it.description}`).join('; ') || inv.notes || '', styleId: 'CellText' },
    ]);
  });

  // Sheet 3: Payment Receipts Log
  const pmtRows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];
  pmtRows.push([
    { value: `${customer.name} - Payment Receipts Log`, styleId: 'HeaderTitle' },
  ]);
  pmtRows.push([]);
  pmtRows.push([
    { value: 'Receipt #', styleId: 'TableHeaderGreen' },
    { value: 'Payment Date', styleId: 'TableHeaderGreen' },
    { value: 'Payment Method', styleId: 'TableHeaderGreen' },
    { value: 'Bank Account Credited', styleId: 'TableHeaderGreen' },
    { value: 'Reference #', styleId: 'TableHeaderGreen' },
    { value: `Total Received (${tenant.currency})`, styleId: 'TableHeaderGreen' },
    { value: `Applied to Invoices (${tenant.currency})`, styleId: 'TableHeaderGreen' },
    { value: `Advance Credit (${tenant.currency})`, styleId: 'TableHeaderGreen' },
    { value: 'Invoices Settled', styleId: 'TableHeaderGreen' },
  ]);

  statementData.paymentReceipts.forEach((rct) => {
    const invList = rct.allocations.map((a) => `${a.invoiceNumber} (${tenant.currency} ${a.allocatedAmount})`).join(', ');
    pmtRows.push([
      { value: rct.receiptNumber, styleId: 'CellTextBold' },
      { value: rct.paymentDate, styleId: 'CellText' },
      { value: rct.paymentMethod, styleId: 'CellText' },
      { value: rct.bankAccountName || 'Bank', styleId: 'CellText' },
      { value: rct.referenceNumber || '-', styleId: 'CellText' },
      { value: rct.totalAmountReceived, type: 'Number', styleId: 'CellNumberBold' },
      { value: rct.allocatedAmount, type: 'Number', styleId: 'CellNumber' },
      { value: rct.unallocatedCreditAmount || 0, type: 'Number', styleId: 'CellNumber' },
      { value: invList || 'Advance Credit', styleId: 'CellText' },
    ]);
  });

  const sanitizedCustName = customer.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadExcelXmlWorkbook(`Statement_${sanitizedCustName}_${asOfDate}`, [
    { name: 'Consolidated Statement', rows: ledgerRows },
    { name: 'Invoices Register', rows: invRows },
    { name: 'Payment Receipts', rows: pmtRows },
  ]);
}

/**
 * Generates and downloads a pre-populated Microsoft Excel XML template (.xlsx)
 * for Customer FY Opening Balances containing ALL active customers pre-filled row by row.
 * Users only need to update the OpeningBalanceAmount and CreditDebitFlag (DR/CR) columns!
 */
export function exportCustomerOpeningBalanceTemplateExcel(params: {
  tenant: Tenant;
  customers: CustomerContact[];
  fiscalYear?: string;
  asOfDate?: string;
  defaultDueDate?: string;
  defaultOffsetAccountCode?: string;
}) {
  const {
    tenant,
    customers,
    fiscalYear = 'FY 2026-2027',
    asOfDate = '2026-04-01',
    defaultDueDate = '2026-04-30',
    defaultOffsetAccountCode = '3010',
  } = params;

  // Filter customers belonging to this tenant
  const tenantCustomers = customers.filter(
    (c) => !c.tenantId || c.tenantId === tenant.id || c.tenantId === 't-acme-us'
  );

  // Sheet 1: Customer FY Opening Balances (Pre-populated rows)
  const templateRows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];

  templateRows.push([
    { value: `${tenant.name} - Customer FY Opening Balances Upload Template`, styleId: 'HeaderTitle' },
  ]);
  templateRows.push([
    {
      value: `Pre-populated with ${tenantCustomers.length} registered customers. Simply enter OpeningBalanceAmount and CreditDebitFlag (DR for Customer Owes / CR for Customer Overpaid / Advance Credit).`,
      styleId: 'SubHeader',
    },
  ]);
  templateRows.push([]);

  // Table Headers
  templateRows.push([
    { value: 'Customer Code', styleId: 'TableHeader' },
    { value: 'Customer Name', styleId: 'TableHeader' },
    { value: 'Category / Group', styleId: 'TableHeader' },
    { value: 'Fiscal Year', styleId: 'TableHeader' },
    { value: 'As Of Date (YYYY-MM-DD)', styleId: 'TableHeader' },
    { value: 'Original Ref / Invoice #', styleId: 'TableHeader' },
    { value: 'Due Date (YYYY-MM-DD)', styleId: 'TableHeader' },
    { value: `Opening Balance Amount (${tenant.currency}) [EDITABLE]`, styleId: 'TableHeaderGreen' },
    { value: 'Credit/Debit Flag (DR/CR) [EDITABLE]', styleId: 'TableHeaderIndigo' },
    { value: 'Offset GL Account', styleId: 'TableHeader' },
    { value: 'Notes / Remarks', styleId: 'TableHeader' },
  ]);

  tenantCustomers.forEach((cust, idx) => {
    const custRef = cust.code ? `OPN-${cust.code}` : `OPN-2026-${String(idx + 1).padStart(3, '0')}`;
    templateRows.push([
      { value: cust.code || `CUST-${String(idx + 1).padStart(3, '0')}`, styleId: 'CellTextBold' },
      { value: cust.name, styleId: 'CellText' },
      { value: cust.category || 'Standard Client', styleId: 'CellText' },
      { value: fiscalYear, styleId: 'CellText' },
      { value: asOfDate, styleId: 'CellText' },
      { value: custRef, styleId: 'CellText' },
      { value: defaultDueDate, styleId: 'CellText' },
      { value: 0.0, type: 'Number', styleId: 'CellEditHighlight' }, // Highlighted yellow for user to update!
      { value: 'DR', styleId: 'CellEditHighlightFlag' }, // Highlighted indigo DR/CR flag!
      { value: defaultOffsetAccountCode, styleId: 'CellText' },
      { value: `FY ${fiscalYear} Opening balance carryforward`, styleId: 'CellText' },
    ]);
  });

  // Sheet 2: Field Guide & Debit/Credit Instructions
  const guideRows: Array<Array<{ value: any; type?: 'String' | 'Number'; styleId?: string }>> = [];

  guideRows.push([
    { value: 'Customer FY Opening Balances - Instructions & Field Guide', styleId: 'HeaderTitle' },
  ]);
  guideRows.push([
    {
      value: 'Please review these guidelines before uploading your completed spreadsheet into the ERP.',
      styleId: 'SubHeader',
    },
  ]);
  guideRows.push([]);

  guideRows.push([
    { value: 'Field / Topic', styleId: 'TableHeader' },
    { value: 'Requirement & Usage Instructions', styleId: 'TableHeader' },
    { value: 'Example Values', styleId: 'TableHeader' },
  ]);

  guideRows.push([
    { value: 'Customer Code & Name', styleId: 'CellTextBold' },
    { value: 'Pre-populated automatically with all active customers in the system. Do not modify Customer Code or Name if you want automatic master matching.', styleId: 'CellText' },
    { value: 'CUST-001 | Acme Technologies Inc', styleId: 'CellText' },
  ]);

  guideRows.push([
    { value: 'Opening Balance Amount', styleId: 'CellTextBold' },
    { value: 'The monetary balance outstanding at fiscal year start. Enter positive numbers (e.g. 5000.00). If amount is 0 or left blank, the row is safely skipped during upload.', styleId: 'CellText' },
    { value: '12500.00 | 450.00 | 0.00', styleId: 'CellText' },
  ]);

  guideRows.push([
    { value: 'Credit/Debit Flag (DR / CR)', styleId: 'CellTextBold' },
    { value: 'DR (Debit) = Customer owes company money (Receivable balance / unpaid past invoice).\nCR (Credit) = Customer has overpaid or has advance deposit / credit note (negative net AR / advance credit balance).', styleId: 'CellText' },
    { value: 'DR (Debit) or CR (Credit)', styleId: 'CellText' },
  ]);

  guideRows.push([
    { value: 'Negative Amounts Handling', styleId: 'CellTextBold' },
    { value: 'If an amount is entered as a negative number (e.g. -1500.00), the system automatically treats it as a Credit (CR) balance / overpayment carryforward.', styleId: 'CellText' },
    { value: '-1500.00 -> Recorded as $1,500 CR', styleId: 'CellText' },
  ]);

  guideRows.push([
    { value: 'Offset GL Account', styleId: 'CellTextBold' },
    { value: 'Account code credited/debited to balance the opening balance entry in the General Ledger. Typically Account 3010 (Opening Balance Equity) or 3200 (Retained Earnings).', styleId: 'CellText' },
    { value: '3010 (Opening Balance Equity)', styleId: 'CellText' },
  ]);

  guideRows.push([
    { value: 'Double-Entry Posting in GL', styleId: 'CellTextBold' },
    { value: 'For DR: Debit Accounts Receivable (1100), Credit Opening Balance Equity (3010).\nFor CR: Debit Opening Balance Equity (3010), Credit Accounts Receivable / Advance Liability (1100/2030).', styleId: 'CellText' },
    { value: 'Automated Real-time GL Entry', styleId: 'CellText' },
  ]);

  const sanitizedTenantName = tenant.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  downloadExcelXmlWorkbook(`Customer_FY_Opening_Balances_Template_${sanitizedTenantName}_${safeDate}`, [
    { name: 'Customer Opening Balances', rows: templateRows },
    { name: 'Instructions & Field Guide', rows: guideRows },
  ]);
}

/**
 * Generates and triggers download of CSV formatted Customer FY Opening Balances template with all customers pre-populated.
 */
export function downloadCustomerOpeningBalanceTemplateCsv(params: {
  tenant: Tenant;
  customers: CustomerContact[];
  fiscalYear?: string;
  asOfDate?: string;
  defaultDueDate?: string;
  defaultOffsetAccountCode?: string;
}) {
  const {
    tenant,
    customers,
    fiscalYear = 'FY 2026-2027',
    asOfDate = '2026-04-01',
    defaultDueDate = '2026-04-30',
    defaultOffsetAccountCode = '3010',
  } = params;

  const tenantCustomers = customers.filter(
    (c) => !c.tenantId || c.tenantId === tenant.id || c.tenantId === 't-acme-us'
  );

  const headers = [
    'CustomerCode',
    'CustomerName',
    'Category',
    'FiscalYear',
    'AsOfDate',
    'OriginalInvoiceNumber',
    'DueDate',
    'OpeningBalanceAmount',
    'CreditDebitFlag',
    'OffsetAccountCode',
    'Notes',
  ];

  const rows = tenantCustomers.map((cust, idx) => {
    const custRef = cust.code ? `OPN-${cust.code}` : `OPN-2026-${String(idx + 1).padStart(3, '0')}`;
    return [
      cust.code || `CUST-${String(idx + 1).padStart(3, '0')}`,
      cust.name,
      cust.category || 'Standard Client',
      fiscalYear,
      asOfDate,
      custRef,
      defaultDueDate,
      '0.00', // User updates this!
      'DR', // User updates this (DR / CR)!
      defaultOffsetAccountCode,
      `FY ${fiscalYear} Opening balance carryforward`,
    ];
  });

  const sanitizedTenantName = tenant.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  downloadCsvFile(`Customer_FY_Opening_Balances_${sanitizedTenantName}_${safeDate}`, headers, rows);
}

