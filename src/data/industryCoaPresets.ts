import { AccountType } from '../types';

export interface PresetAccountDefinition {
  code: string;
  name: string;
  type: AccountType;
  subCategory: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  description: string;
  isSystemAccount?: boolean;
  initialBalance?: number;
}

export interface IndustryCoaPreset {
  id: string;
  name: string;
  sector: string;
  description: string;
  badge: string;
  iconName: string;
  standard: string;
  accounts: PresetAccountDefinition[];
}

export const INDUSTRY_COA_PRESETS: IndustryCoaPreset[] = [
  {
    id: 'preset-saas-tech',
    name: 'Technology, SaaS & Digital Services',
    sector: 'Technology / Cloud / Software',
    description: 'Tailored for subscription-based recurring revenue, deferred revenue, cloud infrastructure, R&D capitalization, and customer acquisition costs.',
    badge: 'SaaS / B2B',
    iconName: 'Laptop',
    standard: 'ASC 606 / IFRS 15',
    accounts: [
      // Assets
      { code: '1010', name: 'Operating Cash - Main Clearing Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Primary operational bank account for collections and vendor disbursements', isSystemAccount: true, initialBalance: 150000 },
      { code: '1020', name: 'Stripe / Payment Gateway Clearing', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'In-flight customer payments held by Stripe, Adyen, or payment processors', initialBalance: 28500 },
      { code: '1030', name: 'Money Market & High-Yield Treasury Funds', type: 'ASSET', subCategory: 'Cash Equivalents', normalBalance: 'DEBIT', description: 'Short-term liquid reserves for working capital optimization', initialBalance: 250000 },
      { code: '1100', name: 'Trade Accounts Receivable', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Invoiced customer subscriptions and consulting receivables', isSystemAccount: true, initialBalance: 75000 },
      { code: '1150', name: 'Allowance for Doubtful SaaS Accounts', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'CREDIT', description: 'Contra-asset reserve for credit card churn and delinquent billings', initialBalance: -3500 },
      { code: '1200', name: 'Prepaid Cloud & Software Licenses', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Annual pre-paid developer tooling (AWS upfront, GitHub, Datadog)', initialBalance: 18000 },
      { code: '1500', name: 'Computer Servers & Developer Laptops', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Capitalized hardware, laptops, and networking equipment', initialBalance: 65000 },
      { code: '1510', name: 'Accumulated Depreciation - Hardware', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Accumulated straight-line depreciation on hardware assets', initialBalance: -15000 },
      { code: '1600', name: 'Capitalized Software Development Costs', type: 'ASSET', subCategory: 'Intangible Assets', normalBalance: 'DEBIT', description: 'Internal development costs capitalized under ASC 350-40', initialBalance: 120000 },
      { code: '1610', name: 'Accumulated Amortization - Intangibles', type: 'ASSET', subCategory: 'Intangible Assets', normalBalance: 'CREDIT', description: 'Amortization of internally generated IP and proprietary modules', initialBalance: -24000 },

      // Liabilities
      { code: '2010', name: 'Trade Accounts Payable', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Vendor invoices due for SaaS tools, contractors, and services', isSystemAccount: true, initialBalance: 42000 },
      { code: '2030', name: 'Accrued Engineering & Staff Bonuses', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Quarterly performance accruals and compensation', initialBalance: 32000 },
      { code: '2100', name: 'Deferred Subscription Revenue (Current)', type: 'LIABILITY', subCategory: 'Deferred Revenue', normalBalance: 'CREDIT', description: 'Unearned revenue for annual/multi-year upfront customer contracts (ASC 606)', initialBalance: 180000 },
      { code: '2200', name: 'State Sales Tax & Digital VAT Payable', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Sales tax collected on digital goods awaiting statutory remittance', initialBalance: 12500 },

      // Equity
      { code: '3010', name: 'Common Stock & Contributed Capital', type: 'EQUITY', subCategory: 'Contributed Capital', normalBalance: 'CREDIT', description: 'Founders equity and venture investment capital', isSystemAccount: true, initialBalance: 400000 },
      { code: '3020', name: 'Stock-Based Compensation Reserve', type: 'EQUITY', subCategory: 'Contributed Capital', normalBalance: 'CREDIT', description: 'Cumulative fair value of granted and vested employee stock options', initialBalance: 45000 },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', subCategory: 'Retained Earnings', normalBalance: 'CREDIT', description: 'Cumulative historical net operating income / loss', isSystemAccount: true, initialBalance: 156000 },

      // Revenue
      { code: '4010', name: 'SaaS Monthly / Annual Subscriptions', type: 'REVENUE', subCategory: 'Operating Revenue', normalBalance: 'CREDIT', description: 'Recurring subscription license revenues recognized over time', isSystemAccount: true, initialBalance: 310000 },
      { code: '4020', name: 'Usage-Based API & Compute Consumption', type: 'REVENUE', subCategory: 'Operating Revenue', normalBalance: 'CREDIT', description: 'Overage and variable transactional API call billing', initialBalance: 85000 },
      { code: '4030', name: 'Enterprise Implementation & Onboarding', type: 'REVENUE', subCategory: 'Services Revenue', normalBalance: 'CREDIT', description: 'One-time setup fees, solution architecture, and training', initialBalance: 45000 },

      // Expenses
      { code: '5010', name: 'Cloud Infrastructure & Hosting (AWS/GCP)', type: 'EXPENSE', subCategory: 'Cost of Goods Sold (COGS)', normalBalance: 'DEBIT', description: 'Server instances, CDN, databases, and LLM token API expenses', isSystemAccount: true, initialBalance: 48000 },
      { code: '5020', name: 'Customer Support & Success Salaries', type: 'EXPENSE', subCategory: 'Cost of Goods Sold (COGS)', normalBalance: 'DEBIT', description: 'Direct support personnel costs required to deliver the SaaS service', initialBalance: 36000 },
      { code: '6010', name: 'Research & Engineering Staff Salaries', type: 'EXPENSE', subCategory: 'R&D Expenses', normalBalance: 'DEBIT', description: 'Software developers, QA, DevOps, and product design payroll', initialBalance: 145000 },
      { code: '6020', name: 'Sales & Customer Acquisition (CAC)', type: 'EXPENSE', subCategory: 'Sales & Marketing', normalBalance: 'DEBIT', description: 'Paid digital ads, webinars, event sponsorships, and SDR commissions', initialBalance: 62000 },
      { code: '6030', name: 'General & Administrative (G&A) Office Expenses', type: 'EXPENSE', subCategory: 'Administrative', normalBalance: 'DEBIT', description: 'Legal counsel, accounting retainers, office rent, and executive salaries', initialBalance: 29000 },
      { code: '6040', name: 'Depreciation & Amortization Expense', type: 'EXPENSE', subCategory: 'Depreciation', normalBalance: 'DEBIT', description: 'Periodic non-cash depreciation and IP amortizations', initialBalance: 8500 },
    ],
  },
  {
    id: 'preset-housing-hoa',
    name: 'Housing Society & Property Management (HOA)',
    sector: 'Real Estate / Resident Associations',
    description: 'Configured for monthly maintenance dues, sinking funds, repair reserves, clubhouse amenities, security personnel, lift AMC, and water charges.',
    badge: 'HOA / Society',
    iconName: 'Building2',
    standard: 'HOA Statutory Accounting',
    accounts: [
      // Assets
      { code: '1010', name: 'Society Main Maintenance Current Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Primary operational bank account for member maintenance dues', isSystemAccount: true, initialBalance: 85000 },
      { code: '1020', name: 'Sinking Fund Reserve Fixed Deposit (FD)', type: 'ASSET', subCategory: 'Restricted Reserves', normalBalance: 'DEBIT', description: 'Statutory long-term emergency fixed deposit for major repairs', initialBalance: 350000 },
      { code: '1030', name: 'Petty Cash - Estate Manager Float', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'On-site petty cash for emergency repairs and supplies', initialBalance: 2500 },
      { code: '1100', name: 'Resident Maintenance Dues Receivable', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Outstanding quarterly and monthly dues from apartment/villa owners', isSystemAccount: true, initialBalance: 45000 },
      { code: '1150', name: 'Utility & Security Deposits with Govt Boards', type: 'ASSET', subCategory: 'Deposits', normalBalance: 'DEBIT', description: 'Refundable deposits with Electricity Board and Municipal Water Authority', initialBalance: 30000 },
      { code: '1500', name: 'Common Area Assets & Solar Panels', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Rooftop solar plant, diesel generator sets, clubhouse gym equipment', initialBalance: 120000 },
      { code: '1510', name: 'Accumulated Depreciation - Society Assets', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Depreciation on generators, CCTV network, and gym infrastructure', initialBalance: -24000 },

      // Liabilities
      { code: '2010', name: 'Vendor Payables (Security, Housekeeping, AMC)', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Invoices due to facilities management, elevator AMC, and gardeners', isSystemAccount: true, initialBalance: 28000 },
      { code: '2020', name: 'Residents Advance Maintenance Dues', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Advance payments made by owners for upcoming financial quarters', initialBalance: 35000 },
      { code: '2040', name: 'Clubhouse & Fitout Caution Deposits', type: 'LIABILITY', subCategory: 'Deposits Held', normalBalance: 'CREDIT', description: 'Refundable security deposits from residents for interior renovations', initialBalance: 15000 },
      { code: '2200', name: 'Statutory GST & TDS Deductions Payable', type: 'LIABILITY', subCategory: 'Statutory Dues', normalBalance: 'CREDIT', description: 'TDS deducted on contractor payments awaiting govt deposit', initialBalance: 6500 },

      // Equity
      { code: '3010', name: 'Society Corpus / Capital Fund', type: 'EQUITY', subCategory: 'Capital Reserves', normalBalance: 'CREDIT', description: 'One-time builder handover capital contributions from all members', isSystemAccount: true, initialBalance: 400000 },
      { code: '3020', name: 'Statutory Sinking Fund Reserve', type: 'EQUITY', subCategory: 'Restricted Reserves', normalBalance: 'CREDIT', description: 'Earmarked sinking fund balance for building structural overhaul', initialBalance: 180000 },
      { code: '3200', name: 'General Reserve / Accumulated Surplus', type: 'EQUITY', subCategory: 'Surplus', normalBalance: 'CREDIT', description: 'Accumulated excess of income over expenditure', isSystemAccount: true, initialBalance: 68000 },

      // Revenue
      { code: '4010', name: 'Monthly Resident Maintenance Dues', type: 'REVENUE', subCategory: 'Operating Income', normalBalance: 'CREDIT', description: 'Base sq ft or flat maintenance charges collected from members', isSystemAccount: true, initialBalance: 195000 },
      { code: '4020', name: 'Clubhouse & Party Hall Rental Income', type: 'REVENUE', subCategory: 'Amenities Income', normalBalance: 'CREDIT', description: 'Booking fees for community banquet hall and swimming pool guest passes', initialBalance: 18500 },
      { code: '4030', name: 'Interest on Bank Fixed Deposits (Sinking Fund)', type: 'REVENUE', subCategory: 'Interest Income', normalBalance: 'CREDIT', description: 'Accrued interest on society corpus investments', initialBalance: 24000 },
      { code: '4040', name: 'Late Payment Surcharge / Penalties', type: 'REVENUE', subCategory: 'Other Income', normalBalance: 'CREDIT', description: 'Interest charged on overdue maintenance balances', initialBalance: 3200 },

      // Expenses
      { code: '5010', name: '24x7 Security Guard & Gate Management', type: 'EXPENSE', subCategory: 'Operating Expenses', normalBalance: 'DEBIT', description: 'Agency monthly billing for physical security and boom barrier staff', isSystemAccount: true, initialBalance: 45000 },
      { code: '5020', name: 'Housekeeping, Cleaning & Waste Disposal', type: 'EXPENSE', subCategory: 'Operating Expenses', normalBalance: 'DEBIT', description: 'Daily corridor cleaning, garbage segregation, and sanitization', initialBalance: 32000 },
      { code: '5030', name: 'Elevator & Lift AMC Maintenance', type: 'EXPENSE', subCategory: 'Maintenance', normalBalance: 'DEBIT', description: 'Annual maintenance contracts for passenger and service lifts', initialBalance: 16000 },
      { code: '5040', name: 'Common Electricity & Diesel Generator Fuel', type: 'EXPENSE', subCategory: 'Utilities', normalBalance: 'DEBIT', description: 'Power for corridor lighting, water pump motors, and DG backup fuel', initialBalance: 38000 },
      { code: '5050', name: 'Gardening, Landscaping & Swimming Pool Chemicals', type: 'EXPENSE', subCategory: 'Maintenance', normalBalance: 'DEBIT', description: 'Horticulture services and pool filtration maintenance', initialBalance: 12000 },
      { code: '5060', name: 'Estate Office Staff, Accounting & Audit Fees', type: 'EXPENSE', subCategory: 'Administrative', normalBalance: 'DEBIT', description: 'Statutory auditor fees and resident manager salary', initialBalance: 14000 },
    ],
  },
  {
    id: 'preset-school-education',
    name: 'School, College & Educational Institution',
    sector: 'Education / Academic',
    description: 'Designed for academic term tuition, transport fees, laboratory funds, faculty compensation, library management, scholarships, and campus facilities.',
    badge: 'Education',
    iconName: 'GraduationCap',
    standard: 'Educational Trust Accounting',
    accounts: [
      // Assets
      { code: '1010', name: 'Fee Collection Primary Bank Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Bank account dedicated to receiving student term fee online transfers', isSystemAccount: true, initialBalance: 220000 },
      { code: '1020', name: 'Scholarship & Endowment Trust Funds', type: 'ASSET', subCategory: 'Restricted Assets', normalBalance: 'DEBIT', description: 'Earmarked funds for student merit awards and fee waivers', initialBalance: 150000 },
      { code: '1100', name: 'Student Tuition Fees Receivable', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Uncollected academic term and semester tuition fees', isSystemAccount: true, initialBalance: 65000 },
      { code: '1200', name: 'School Uniform & Bookstore Inventory', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Textbooks, stationery, and student uniform stock on hand', initialBalance: 24000 },
      { code: '1500', name: 'School Buildings, Classrooms & Smartboards', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Campus land, academic buildings, interactive digital projectors', initialBalance: 850000 },
      { code: '1510', name: 'School Buses & Student Transport Fleet', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Transport fleet vehicles and mini-vans', initialBalance: 180000 },
      { code: '1520', name: 'Accumulated Depreciation - Campus Assets', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Depreciation on bus fleet, laboratory apparatus, and computers', initialBalance: -65000 },

      // Liabilities
      { code: '2010', name: 'Accounts Payable - Educational Vendors', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Bills due for catering, exam boards, lab chemicals, and uniforms', isSystemAccount: true, initialBalance: 32000 },
      { code: '2030', name: 'Caution & Library Security Deposits Refundable', type: 'LIABILITY', subCategory: 'Deposits Held', normalBalance: 'CREDIT', description: 'Student security deposits refundable upon graduation/transfer', initialBalance: 55000 },
      { code: '2050', name: 'Advance Fees Collected for Next Term', type: 'LIABILITY', subCategory: 'Unearned Revenue', normalBalance: 'CREDIT', description: 'Pre-paid semester fees received prior to academic session start', initialBalance: 120000 },

      // Equity
      { code: '3010', name: 'Educational Trust Corpus Fund', type: 'EQUITY', subCategory: 'Capital Reserves', normalBalance: 'CREDIT', description: 'Founding endowment and permanent capital of the institution', isSystemAccount: true, initialBalance: 800000 },
      { code: '3020', name: 'Campus Building Expansion Development Fund', type: 'EQUITY', subCategory: 'Restricted Reserves', normalBalance: 'CREDIT', description: 'Earmarked capital fund for new sports complex and science wing', initialBalance: 250000 },
      { code: '3200', name: 'Accumulated Educational Surplus', type: 'EQUITY', subCategory: 'Surplus', normalBalance: 'CREDIT', description: 'Retained academic operating surplus', isSystemAccount: true, initialBalance: 177000 },

      // Revenue
      { code: '4010', name: 'Academic Tuition & Semester Fees', type: 'REVENUE', subCategory: 'Tuition Revenue', normalBalance: 'CREDIT', description: 'Core classroom instructional and tuition charges', isSystemAccount: true, initialBalance: 450000 },
      { code: '4020', name: 'Student Bus & Transport Service Fees', type: 'REVENUE', subCategory: 'Ancillary Revenue', normalBalance: 'CREDIT', description: 'Route-based bus pass collections from day scholars', initialBalance: 68000 },
      { code: '4030', name: 'Science Laboratory & Computer Lab Fees', type: 'REVENUE', subCategory: 'Academic Fees', normalBalance: 'CREDIT', description: 'Specialized STEM lab, robotics, and physics equipment usage fees', initialBalance: 34000 },
      { code: '4040', name: 'Admission Application & Registration Fees', type: 'REVENUE', subCategory: 'Other Income', normalBalance: 'CREDIT', description: 'Non-refundable application processing and entrance exam fees', initialBalance: 22000 },

      // Expenses
      { code: '5010', name: 'Teaching Faculty & Professor Salaries', type: 'EXPENSE', subCategory: 'Instructional', normalBalance: 'DEBIT', description: 'Academic staff, department heads, and guest lecturers payroll', isSystemAccount: true, initialBalance: 180000 },
      { code: '5020', name: 'Administrative & Campus Support Staff Payroll', type: 'EXPENSE', subCategory: 'Administrative', normalBalance: 'DEBIT', description: 'Registrar, accountants, admissions officers, and librarians', initialBalance: 42000 },
      { code: '5030', name: 'Bus Diesel, Fleet Maintenance & Driver Wages', type: 'EXPENSE', subCategory: 'Transport', normalBalance: 'DEBIT', description: 'Vehicle fuel, routine oil servicing, insurance, and road tax', initialBalance: 38000 },
      { code: '5040', name: 'Science Lab Consumables & Library Books', type: 'EXPENSE', subCategory: 'Academic', normalBalance: 'DEBIT', description: 'Chemicals, specimen slides, textbook subscriptions, online journals', initialBalance: 16500 },
      { code: '5050', name: 'Student Scholarships & Merit Fee Concessions', type: 'EXPENSE', subCategory: 'Student Welfare', normalBalance: 'DEBIT', description: 'Need-based scholarships and sports excellence fee waivers', initialBalance: 25000 },
      { code: '5060', name: 'Campus Utilities, Electricity & Janitorial', type: 'EXPENSE', subCategory: 'Facilities', normalBalance: 'DEBIT', description: 'Air conditioning, sports ground upkeep, and campus sanitization', initialBalance: 29000 },
    ],
  },
  {
    id: 'preset-hospital-healthcare',
    name: 'Healthcare, Hospital & Clinical Services',
    sector: 'Healthcare / Medical',
    description: 'Structured for Inpatient/Outpatient billing, pharmacy dispensary, diagnostic radiology, surgical equipment, doctor retainers, and bio-waste management.',
    badge: 'Healthcare',
    iconName: 'Activity',
    standard: 'Healthcare Financial Management',
    accounts: [
      // Assets
      { code: '1010', name: 'Hospital Operating Bank Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Main operational account for insurance claims and billing settlements', isSystemAccount: true, initialBalance: 310000 },
      { code: '1020', name: 'Emergency Triage Cash Float', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Counter billing cash for immediate casualty admissions', initialBalance: 12000 },
      { code: '1100', name: 'Insurance & TPA Medical Receivables', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Cashless claims pending reimbursement from health insurers and TPAs', isSystemAccount: true, initialBalance: 145000 },
      { code: '1200', name: 'Hospital Pharmacy & Drug Inventory', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Life-saving drugs, antibiotics, surgical sutures, and consumables on hand', initialBalance: 85000 },
      { code: '1500', name: 'Diagnostic Imaging & Surgical Medical Equipment', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'MRI scanners, CT machines, ventilators, dialysis units, OT tables', initialBalance: 950000 },
      { code: '1510', name: 'Accumulated Depreciation - Medical Equipment', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Straight-line medical machine depreciation', initialBalance: -180000 },

      // Liabilities
      { code: '2010', name: 'Trade Payables - Pharmaceutical Suppliers', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Credit balances due to drug manufacturers and surgical vendors', isSystemAccount: true, initialBalance: 65000 },
      { code: '2030', name: 'Visiting Specialist & Doctor Fees Payable', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Consultation share and surgical honorariums due to visiting doctors', initialBalance: 48000 },
      { code: '2050', name: 'Patient Inpatient Bed Admission Deposits', type: 'LIABILITY', subCategory: 'Deposits Held', normalBalance: 'CREDIT', description: 'Advance payments made upon ICU/IPD bed admission', initialBalance: 52000 },

      // Equity
      { code: '3010', name: 'Healthcare Institution Equity Capital', type: 'EQUITY', subCategory: 'Capital Reserves', normalBalance: 'CREDIT', description: 'Hospital founding partnership / promoter capital', isSystemAccount: true, initialBalance: 900000 },
      { code: '3200', name: 'Retained Hospital Earnings', type: 'EQUITY', subCategory: 'Retained Earnings', normalBalance: 'CREDIT', description: 'Accumulated operating reserves for medical facility upgrades', isSystemAccount: true, initialBalance: 257000 },

      // Revenue
      { code: '4010', name: 'Inpatient (IPD) Room & Nursing Charges', type: 'REVENUE', subCategory: 'Hospital Services', normalBalance: 'CREDIT', description: 'Daily room tariffs, ICU bed charges, and bedside nursing care', isSystemAccount: true, initialBalance: 380000 },
      { code: '4020', name: 'Outpatient (OPD) Consultation Revenue', type: 'REVENUE', subCategory: 'Clinical Services', normalBalance: 'CREDIT', description: 'Doctor chamber consultations and specialist OPD charges', initialBalance: 120000 },
      { code: '4030', name: 'Operation Theatre & Surgical Procedure Fees', type: 'REVENUE', subCategory: 'Surgical Services', normalBalance: 'CREDIT', description: 'OT consumable charges, anesthesia fees, and surgical setup', initialBalance: 190000 },
      { code: '4040', name: 'Diagnostic Pathology & Radiology Revenue', type: 'REVENUE', subCategory: 'Diagnostics', normalBalance: 'CREDIT', description: 'Blood tests, MRI, CT Scan, Ultrasound, and X-ray billings', initialBalance: 95000 },
      { code: '4050', name: 'In-House Pharmacy Dispensary Sales', type: 'REVENUE', subCategory: 'Pharmacy Sales', normalBalance: 'CREDIT', description: 'Retail medicine and surgical kit sales to patients', initialBalance: 140000 },

      // Expenses
      { code: '5010', name: 'Cost of Drugs, Implants & Medical Consumables', type: 'EXPENSE', subCategory: 'Cost of Healthcare', normalBalance: 'DEBIT', description: 'Cost of dispensed pharmaceuticals, orthopedic implants, and stents', isSystemAccount: true, initialBalance: 92000 },
      { code: '5020', name: 'Nursing, Technicians & Paramedical Payroll', type: 'EXPENSE', subCategory: 'Direct Care Staff', normalBalance: 'DEBIT', description: 'Staff nurses, OT technicians, radiology operators, and lab staff', initialBalance: 110000 },
      { code: '5030', name: 'Consultant Surgeons & Specialist Honorariums', type: 'EXPENSE', subCategory: 'Doctor Compensation', normalBalance: 'DEBIT', description: 'Fee share paid to visiting on-call surgeons and clinicians', initialBalance: 85000 },
      { code: '5040', name: 'Medical Equipment AMC & Calibration Charges', type: 'EXPENSE', subCategory: 'Equipment Upkeep', normalBalance: 'DEBIT', description: 'OEM maintenance contracts for Siemens, GE, and Philips machinery', initialBalance: 24000 },
      { code: '5050', name: 'Bio-Medical Hazardous Waste Disposal', type: 'EXPENSE', subCategory: 'Statutory Sanitation', normalBalance: 'DEBIT', description: 'Certified bio-hazard incineration and contaminated waste management', initialBalance: 9500 },
      { code: '5060', name: 'Oxygen & Medical Gas Pipeline Refills', type: 'EXPENSE', subCategory: 'Critical Utilities', normalBalance: 'DEBIT', description: 'Liquid oxygen tank refills and nitrous oxide cylinders', initialBalance: 18000 },
    ],
  },
  {
    id: 'preset-retail-ecommerce',
    name: 'Retail, E-Commerce & Wholesale Trade',
    sector: 'Trade / Commerce',
    description: 'Engineered for merchant inventory on hand, shipping & 3PL logistics, merchant gateway commissions, customer sales returns, and vendor rebates.',
    badge: 'Retail / E-Com',
    iconName: 'ShoppingCart',
    standard: 'Retail Inventory Accounting (FIFO/WAC)',
    accounts: [
      // Assets
      { code: '1010', name: 'Commercial Operating Bank Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Primary clearing account for merchant settlements and payroll', isSystemAccount: true, initialBalance: 190000 },
      { code: '1020', name: 'E-Commerce Merchant Gateway Escrow', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Unsettled customer payments in Shopify Payments, Amazon Pay, PayPal', initialBalance: 42000 },
      { code: '1030', name: 'POS Cash Register Float (Retail Stores)', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Daily cash drawer change across physical retail outlets', initialBalance: 8500 },
      { code: '1100', name: 'Wholesale B2B Accounts Receivable', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Net 30 trade receivables from retail store partners and distributors', isSystemAccount: true, initialBalance: 68000 },
      { code: '1200', name: 'Merchandise Inventory on Hand', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Finished goods in warehouse ready for dispatch at cost', initialBalance: 245000 },
      { code: '1210', name: 'Goods in Transit (Inbound Shipments)', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Inventory shipped by overseas suppliers under FOB terms', initialBalance: 38000 },
      { code: '1500', name: 'Warehouse Shelving, Barcode Scanners & POS', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Forklifts, racking units, thermal receipt printers, checkout counters', initialBalance: 95000 },
      { code: '1510', name: 'Accumulated Depreciation - Store Fixtures', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Depreciation on store fit-outs and logistics machinery', initialBalance: -22000 },

      // Liabilities
      { code: '2010', name: 'Trade Payables - Merchandise Suppliers', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Vendor invoices due for purchased stock and packaging material', isSystemAccount: true, initialBalance: 78000 },
      { code: '2020', name: 'Customer Gift Card & Store Credit Liability', type: 'LIABILITY', subCategory: 'Deferred Liabilities', normalBalance: 'CREDIT', description: 'Unredeemed digital gift cards and customer wallet balances', initialBalance: 16500 },
      { code: '2100', name: 'Sales Tax & VAT Collected on Orders', type: 'LIABILITY', subCategory: 'Statutory Taxes', normalBalance: 'CREDIT', description: 'Indirect sales taxes collected on checkout cart totals', initialBalance: 24000 },

      // Equity
      { code: '3010', name: 'Retail Venture Paid-In Capital', type: 'EQUITY', subCategory: 'Capital Reserves', normalBalance: 'CREDIT', description: 'Owners equity and working capital investments', isSystemAccount: true, initialBalance: 450000 },
      { code: '3200', name: 'Retained Commercial Earnings', type: 'EQUITY', subCategory: 'Retained Earnings', normalBalance: 'CREDIT', description: 'Cumulative net profits reinvested in inventory expansion', isSystemAccount: true, initialBalance: 191000 },

      // Revenue
      { code: '4010', name: 'Direct-to-Consumer (D2C) Online Sales', type: 'REVENUE', subCategory: 'Sales Revenue', normalBalance: 'CREDIT', description: 'E-commerce platform orders shipped to individual consumers', isSystemAccount: true, initialBalance: 420000 },
      { code: '4020', name: 'Physical Retail Store Point-of-Sale (POS)', type: 'REVENUE', subCategory: 'Sales Revenue', normalBalance: 'CREDIT', description: 'Over-the-counter sales in retail brick-and-mortar locations', initialBalance: 180000 },
      { code: '4030', name: 'Wholesale B2B Bulk Volume Sales', type: 'REVENUE', subCategory: 'B2B Trade', normalBalance: 'CREDIT', description: 'Large batch consignments to partner retailers and franchisees', initialBalance: 110000 },
      { code: '4090', name: 'Sales Returns & Customer Refund Allowances', type: 'REVENUE', subCategory: 'Contra-Revenue', normalBalance: 'DEBIT', description: 'Contra-revenue account for RMA customer returns and restocking', initialBalance: -18500 },

      // Expenses
      { code: '5010', name: 'Cost of Goods Sold (COGS) - Merchandise', type: 'EXPENSE', subCategory: 'Cost of Sales', normalBalance: 'DEBIT', description: 'Landed purchase cost of goods sold during the financial period', isSystemAccount: true, initialBalance: 265000 },
      { code: '5020', name: 'Outbound Courier, Freight & 3PL Logistics', type: 'EXPENSE', subCategory: 'Fulfillment', normalBalance: 'DEBIT', description: 'FedEx, DHL, UPS shipping labels and warehouse pick-and-pack fees', initialBalance: 46000 },
      { code: '5030', name: 'Payment Gateway Processing Commissions', type: 'EXPENSE', subCategory: 'Merchant Fees', normalBalance: 'DEBIT', description: 'Stripe, Visa, Mastercard 2.9% interchange fees on transactions', initialBalance: 17500 },
      { code: '5040', name: 'Packaging, Corrugated Boxes & Branded Polybags', type: 'EXPENSE', subCategory: 'Fulfillment', normalBalance: 'DEBIT', description: 'Custom printed cartons, bubble wrap, and adhesive thermal labels', initialBalance: 12500 },
      { code: '6010', name: 'Digital Ad Spend (Meta, Google, TikTok Ads)', type: 'EXPENSE', subCategory: 'Performance Marketing', normalBalance: 'DEBIT', description: 'ROAS campaign spend driving traffic to the online storefront', initialBalance: 58000 },
      { code: '6020', name: 'Warehouse Rent & Storefront Lease', type: 'EXPENSE', subCategory: 'Occupancy', normalBalance: 'DEBIT', description: 'Monthly lease for distribution center and retail store space', initialBalance: 32000 },
    ],
  },
  {
    id: 'preset-manufacturing-industrial',
    name: 'Manufacturing & Industrial Production',
    sector: 'Manufacturing / Industrial',
    description: 'Designed for Raw Materials, Work-in-Progress (WIP), Finished Goods, Direct Labor absorption, Factory overhead, Scrap sales, and Equipment maintenance.',
    badge: 'Manufacturing',
    iconName: 'Factory',
    standard: 'Cost Accounting / IAS 2',
    accounts: [
      // Assets
      { code: '1010', name: 'Corporate Industrial Operating Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Operating checking account for supplier letters of credit and payroll', isSystemAccount: true, initialBalance: 350000 },
      { code: '1100', name: 'Trade Receivables - OEM & Industrial Clients', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Trade accounts receivable from contract manufacturing clients', isSystemAccount: true, initialBalance: 185000 },
      { code: '1210', name: 'Inventory - Raw Materials & Components', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Steel sheets, plastics, chemical precursors, unmachined castings', initialBalance: 195000 },
      { code: '1220', name: 'Inventory - Work In Progress (WIP)', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Goods on the assembly line with accumulated direct labor and overhead', initialBalance: 88000 },
      { code: '1230', name: 'Inventory - Finished Manufactured Goods', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Packaged machinery, calibrated tools, and parts ready for dispatch', initialBalance: 160000 },
      { code: '1500', name: 'Plant Machinery, CNC Lathes & Tooling', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Heavy fabrication machines, hydraulic presses, automated assembly lines', initialBalance: 1200000 },
      { code: '1510', name: 'Accumulated Depreciation - Plant & Machinery', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Units-of-production or straight-line plant machine depreciation', initialBalance: -240000 },

      // Liabilities
      { code: '2010', name: 'Trade Accounts Payable - Raw Material Vendors', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Credit terms with suppliers of metals, chemicals, and packaging', isSystemAccount: true, initialBalance: 110000 },
      { code: '2040', name: 'Machinery Equipment Financing Loan (Long Term)', type: 'LIABILITY', subCategory: 'Long Term Debt', normalBalance: 'CREDIT', description: 'Term loans secured against heavy factory plant equipment', initialBalance: 350000 },

      // Equity
      { code: '3010', name: 'Industrial Enterprise Share Capital', type: 'EQUITY', subCategory: 'Capital Reserves', normalBalance: 'CREDIT', description: 'Paid up capital of manufacturing corporation', isSystemAccount: true, initialBalance: 1100000 },
      { code: '3200', name: 'Retained Manufacturing Surplus', type: 'EQUITY', subCategory: 'Retained Earnings', normalBalance: 'CREDIT', description: 'Cumulative industrial earnings retained for factory expansion', isSystemAccount: true, initialBalance: 378000 },

      // Revenue
      { code: '4010', name: 'Finished Manufactured Goods Sales', type: 'REVENUE', subCategory: 'Manufacturing Revenue', normalBalance: 'CREDIT', description: 'Revenue from sale of proprietary manufactured product lines', isSystemAccount: true, initialBalance: 580000 },
      { code: '4020', name: 'Contract Assembly & OEM Fabrication Income', type: 'REVENUE', subCategory: 'Contract Revenue', normalBalance: 'CREDIT', description: 'Third-party toll manufacturing and contract assembly billing', initialBalance: 140000 },
      { code: '4030', name: 'Sale of Industrial Scrap & By-Products', type: 'REVENUE', subCategory: 'Other Operating Income', normalBalance: 'CREDIT', description: 'Revenue from sale of scrap metal shavings, slag, and recyclable drums', initialBalance: 18500 },

      // Expenses
      { code: '5010', name: 'Direct Raw Materials Consumed', type: 'EXPENSE', subCategory: 'Direct Cost of Production', normalBalance: 'DEBIT', description: 'Physical raw material parts transferred into production line', isSystemAccount: true, initialBalance: 240000 },
      { code: '5020', name: 'Direct Factory Assembly Labor Wages', type: 'EXPENSE', subCategory: 'Direct Cost of Production', normalBalance: 'DEBIT', description: 'Machine operators, assembly line workers, and welders hourly wages', initialBalance: 95000 },
      { code: '5030', name: 'Factory Power, High-Voltage Electricity & Fuel', type: 'EXPENSE', subCategory: 'Factory Overhead', normalBalance: 'DEBIT', description: 'Industrial furnace gas, 3-phase power tariffs, compressed air systems', initialBalance: 48000 },
      { code: '5040', name: 'Plant Machine Repair & Preventative AMC', type: 'EXPENSE', subCategory: 'Factory Overhead', normalBalance: 'DEBIT', description: 'Hydraulic oil changes, CNC cutting bit replacements, calibration', initialBalance: 22000 },
      { code: '6010', name: 'Quality Assurance (QA) & ISO Certification', type: 'EXPENSE', subCategory: 'Administrative', normalBalance: 'DEBIT', description: 'Third-party metallurgical testing, ISO 9001 compliance audit fees', initialBalance: 14000 },
    ],
  },
  {
    id: 'preset-prof-services',
    name: 'Professional Services (Legal, Accounting & Advisory)',
    sector: 'Consulting / Legal / Financial',
    description: 'Designed for billable client WIP, retainer fee schedules, associate partner compensation, professional indemnity insurance, and project disbursements.',
    badge: 'Advisory / Legal',
    iconName: 'Briefcase',
    standard: 'Professional Practice Accounting',
    accounts: [
      // Assets
      { code: '1010', name: 'Firm Operating Bank Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Main business operating checking account', isSystemAccount: true, initialBalance: 180000 },
      { code: '1020', name: 'Client Trust / Escrow IOLTA Account', type: 'ASSET', subCategory: 'Restricted Trust', normalBalance: 'DEBIT', description: 'Fiduciary client trust funds held in compliance with legal/bar regulations', initialBalance: 95000 },
      { code: '1100', name: 'Billed Client Trade Receivables', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Invoiced professional advisory and legal service fees', isSystemAccount: true, initialBalance: 82000 },
      { code: '1120', name: 'Unbilled Client Work-In-Progress (WIP)', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Accumulated billable associate hours not yet invoiced to clients', initialBalance: 44000 },
      { code: '1500', name: 'Office Furniture & High-End Tech Fixtures', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Conference room tech, boardroom tables, executive laptops', initialBalance: 75000 },
      { code: '1510', name: 'Accumulated Depreciation - Office Equipment', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Depreciation on technology and boardroom furniture', initialBalance: -18000 },

      // Liabilities
      { code: '2010', name: 'Accounts Payable - Vendors & Subcontractors', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Bills due to expert witnesses, research databases, and IT vendors', isSystemAccount: true, initialBalance: 24000 },
      { code: '2030', name: 'Client Retainer Deposits Held in Trust', type: 'LIABILITY', subCategory: 'Trust Liabilities', normalBalance: 'CREDIT', description: 'Unearned client retainers held against future billable hours', initialBalance: 95000 },

      // Equity
      { code: '3010', name: 'Partner Capital Accounts', type: 'EQUITY', subCategory: 'Partnership Equity', normalBalance: 'CREDIT', description: 'Equity contributions of senior equity partners', isSystemAccount: true, initialBalance: 320000 },
      { code: '3200', name: 'Retained Firm Earnings / Undistributed Profits', type: 'EQUITY', subCategory: 'Retained Earnings', normalBalance: 'CREDIT', description: 'Accumulated profits awaiting partner distribution drawdowns', isSystemAccount: true, initialBalance: 119000 },

      // Revenue
      { code: '4010', name: 'Hourly Billable Advisory & Legal Fees', type: 'REVENUE', subCategory: 'Fee Income', normalBalance: 'CREDIT', description: 'Hourly fees billed across partners, counsel, and associate attorneys', isSystemAccount: true, initialBalance: 320000 },
      { code: '4020', name: 'Monthly Managed Retainer Fees', type: 'REVENUE', subCategory: 'Retainer Revenue', normalBalance: 'CREDIT', description: 'Fixed recurring monthly corporate retainer agreements', initialBalance: 140000 },
      { code: '4030', name: 'Success Fees & Transaction Advisory', type: 'REVENUE', subCategory: 'Specialized Fees', normalBalance: 'CREDIT', description: 'Contingency and M&A completion milestones', initialBalance: 75000 },

      // Expenses
      { code: '5010', name: 'Associate Consultants & Paralegal Salaries', type: 'EXPENSE', subCategory: 'Direct Service Costs', normalBalance: 'DEBIT', description: 'Direct staff delivering billable client engagements', isSystemAccount: true, initialBalance: 145000 },
      { code: '5020', name: 'External Specialist & Subcontractor Fees', type: 'EXPENSE', subCategory: 'Direct Service Costs', normalBalance: 'DEBIT', description: 'Engaged external domain experts and forensic auditors', initialBalance: 38000 },
      { code: '6010', name: 'Professional Indemnity & E&O Insurance', type: 'EXPENSE', subCategory: 'Administrative', normalBalance: 'DEBIT', description: 'Errors & Omissions liability insurance coverage', initialBalance: 18000 },
      { code: '6020', name: 'Legal Research Software (LexisNexis / Westlaw)', type: 'EXPENSE', subCategory: 'Tools & Subscriptions', normalBalance: 'DEBIT', description: 'Subscriptions to statutory libraries and case law databases', initialBalance: 12000 },
      { code: '6030', name: 'Client Entertainment & Business Travel', type: 'EXPENSE', subCategory: 'Business Development', normalBalance: 'DEBIT', description: 'Out-of-pocket business development flights and client meals', initialBalance: 16500 },
    ],
  },
  {
    id: 'preset-hospitality-food',
    name: 'Hospitality, Hotel & Restaurant Operations',
    sector: 'Hospitality / F&B',
    description: 'Structured for room revenue, banquet catering, perishable kitchen food stock, POS shift cash clearing, kitchen equipment AMC, and linen services.',
    badge: 'Hotel / Dining',
    iconName: 'Utensils',
    standard: 'Uniform System of Accounts for the Lodging Industry (USALI)',
    accounts: [
      // Assets
      { code: '1010', name: 'Hotel & Restaurant Primary Current Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Primary business operating bank account', isSystemAccount: true, initialBalance: 140000 },
      { code: '1020', name: 'Front Desk & Bar Cash Register Floats', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Cash floats across bars, cashier counters, and valet desk', initialBalance: 6500 },
      { code: '1100', name: 'Corporate & Banquet Receivables', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Outstanding corporate banquet and event billing balances', isSystemAccount: true, initialBalance: 38000 },
      { code: '1210', name: 'Inventory - Perishable Food, Meat & Produce', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Walk-in freezer food supplies and chef ingredients', initialBalance: 28000 },
      { code: '1220', name: 'Inventory - Wine, Spirits & Beverage Cellar', type: 'ASSET', subCategory: 'Inventory', normalBalance: 'DEBIT', description: 'Bottled spirits, craft beers, vintage wines in cellar', initialBalance: 45000 },
      { code: '1500', name: 'Commercial Kitchen Ovens, Refrigeration & Fixtures', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Industrial range cookers, combi ovens, walk-in coolers, dining tables', initialBalance: 280000 },
      { code: '1510', name: 'Accumulated Depreciation - Restaurant Assets', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Depreciation on heavy kitchen equipment and interior fit-outs', initialBalance: -62000 },

      // Liabilities
      { code: '2010', name: 'Accounts Payable - Produce & Beverage Vendors', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Credit accounts with dairy, seafood, and liquor distributors', isSystemAccount: true, initialBalance: 34000 },
      { code: '2040', name: 'Banquet & Wedding Event Advance Deposits', type: 'LIABILITY', subCategory: 'Unearned Revenue', normalBalance: 'CREDIT', description: 'Booking advances for future wedding receptions and conferences', initialBalance: 48000 },

      // Equity
      { code: '3010', name: 'Hospitality Venture Capital', type: 'EQUITY', subCategory: 'Capital Reserves', normalBalance: 'CREDIT', description: 'Restaurant founding equity capital', isSystemAccount: true, initialBalance: 350000 },
      { code: '3200', name: 'Retained Hospitality Surplus', type: 'EQUITY', subCategory: 'Retained Earnings', normalBalance: 'CREDIT', description: 'Accumulated operating profits', isSystemAccount: true, initialBalance: 93500 },

      // Revenue
      { code: '4010', name: 'Restaurant Food Dine-In & Takeaway Sales', type: 'REVENUE', subCategory: 'Food Revenue', normalBalance: 'CREDIT', description: 'Breakfast, lunch, and a la carte dinner meal billings', isSystemAccount: true, initialBalance: 240000 },
      { code: '4020', name: 'Bar & Alcoholic Beverage Sales', type: 'REVENUE', subCategory: 'Beverage Revenue', normalBalance: 'CREDIT', description: 'Cocktails, wine, and beer beverage revenue', initialBalance: 125000 },
      { code: '4030', name: 'Guest Room & Suite Accommodation Revenue', type: 'REVENUE', subCategory: 'Lodging Revenue', normalBalance: 'CREDIT', description: 'Nightly hotel guest room charges and suite upgrades', initialBalance: 190000 },
      { code: '4040', name: 'Banquet Catering & Conference Hall Rentals', type: 'REVENUE', subCategory: 'Events Revenue', normalBalance: 'CREDIT', description: 'Buffet catering packages and hall hire fees', initialBalance: 85000 },

      // Expenses
      { code: '5010', name: 'Cost of Food - Meat, Dairy & Produce Used', type: 'EXPENSE', subCategory: 'Food & Beverage Cost', normalBalance: 'DEBIT', description: 'Direct food cost calculated via inventory consumption', isSystemAccount: true, initialBalance: 84000 },
      { code: '5020', name: 'Cost of Liquor, Wine & Beverage Ingredients', type: 'EXPENSE', subCategory: 'Food & Beverage Cost', normalBalance: 'DEBIT', description: 'Direct beverage pour cost', initialBalance: 31000 },
      { code: '5030', name: 'Executive Chef, Kitchen Cooks & Stewarding Wages', type: 'EXPENSE', subCategory: 'Kitchen Labor', normalBalance: 'DEBIT', description: 'Culinary team, line cooks, and dishwashing stewards payroll', initialBalance: 78000 },
      { code: '5040', name: 'Front-of-House Waitstaff & Bartender Wages', type: 'EXPENSE', subCategory: 'Service Labor', normalBalance: 'DEBIT', description: 'Captains, servers, hosts, and mixologists wages', initialBalance: 52000 },
      { code: '5050', name: 'Linen Laundry, Tableware & Glass Breakage', type: 'EXPENSE', subCategory: 'Operating Supplies', normalBalance: 'DEBIT', description: 'Tablecloth dry cleaning and glassware replacement cost', initialBalance: 12000 },
      { code: '5060', name: 'Kitchen Gas, Exhaust Cleaning & Pest Control', type: 'EXPENSE', subCategory: 'Kitchen Operations', normalBalance: 'DEBIT', description: 'Commercial LPG pipeline, hood exhaust degreasing, sanitization', initialBalance: 18500 },
    ],
  },
  {
    id: 'preset-universal-standard',
    name: 'Universal Standard Commercial Business',
    sector: 'General Business / Enterprise',
    description: 'Clean, versatile standard Chart of Accounts suitable for general trading, consulting, agency operations, and multi-currency commercial corporations.',
    badge: 'Universal',
    iconName: 'Globe',
    standard: 'Standard Multi-Jurisdiction GAAP/IFRS',
    accounts: [
      // Assets
      { code: '1010', name: 'Operating Cash - Main Clearing Account', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Primary operational bank account', isSystemAccount: true, initialBalance: 200000 },
      { code: '1020', name: 'Short-Term Deposit & Liquid Reserves', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Interest-bearing operational reserve fund', initialBalance: 100000 },
      { code: '1100', name: 'Trade Accounts Receivable', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Open customer trade billing balances', isSystemAccount: true, initialBalance: 95000 },
      { code: '1200', name: 'Prepaid Expenses & Advances', type: 'ASSET', subCategory: 'Current Assets', normalBalance: 'DEBIT', description: 'Prepaid insurance, advance rent, vendor deposits', initialBalance: 15000 },
      { code: '1500', name: 'Office Furniture & Computer Equipment', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'DEBIT', description: 'Capital equipment, computers, workstations', initialBalance: 80000 },
      { code: '1510', name: 'Accumulated Depreciation - Fixed Assets', type: 'ASSET', subCategory: 'Fixed Assets', normalBalance: 'CREDIT', description: 'Accumulated depreciation on capital assets', initialBalance: -16000 },

      // Liabilities
      { code: '2010', name: 'Trade Accounts Payable', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Vendor invoices awaiting disbursement', isSystemAccount: true, initialBalance: 52000 },
      { code: '2020', name: 'Accrued Payroll & Statutory Liabilities', type: 'LIABILITY', subCategory: 'Current Liabilities', normalBalance: 'CREDIT', description: 'Accrued staff compensation and tax witholdings', initialBalance: 28000 },
      { code: '2200', name: 'Sales Tax / VAT / GST Output Payable', type: 'LIABILITY', subCategory: 'Statutory Taxes', normalBalance: 'CREDIT', description: 'Tax collected on commercial invoices', initialBalance: 14000 },

      // Equity
      { code: '3010', name: 'Paid-Up Share Capital', type: 'EQUITY', subCategory: 'Contributed Capital', normalBalance: 'CREDIT', description: 'Issued and paid-up capital of the entity', isSystemAccount: true, initialBalance: 350000 },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', subCategory: 'Retained Earnings', normalBalance: 'CREDIT', description: 'Accumulated net earnings from prior fiscal periods', isSystemAccount: true, initialBalance: 130000 },

      // Revenue
      { code: '4010', name: 'Core Commercial Sales Revenue', type: 'REVENUE', subCategory: 'Operating Revenue', normalBalance: 'CREDIT', description: 'Primary commercial goods and services invoiced', isSystemAccount: true, initialBalance: 290000 },
      { code: '4020', name: 'Secondary Service & Ancillary Revenue', type: 'REVENUE', subCategory: 'Operating Revenue', normalBalance: 'CREDIT', description: 'Ancillary support and consulting fees', initialBalance: 45000 },

      // Expenses
      { code: '5010', name: 'Direct Cost of Sales / Operations', type: 'EXPENSE', subCategory: 'Direct Costs', normalBalance: 'DEBIT', description: 'Direct expenses associated with service delivery or product sales', isSystemAccount: true, initialBalance: 88000 },
      { code: '6010', name: 'Staff Salaries & Executive Compensation', type: 'EXPENSE', subCategory: 'Payroll', normalBalance: 'DEBIT', description: 'Employee payroll, benefits, and insurance', initialBalance: 120000 },
      { code: '6020', name: 'Rent, Facilities & Utilities', type: 'EXPENSE', subCategory: 'Occupancy', normalBalance: 'DEBIT', description: 'Office lease, power, water, and telecom', initialBalance: 32000 },
      { code: '6030', name: 'Marketing, Advertising & Travel', type: 'EXPENSE', subCategory: 'General & Administrative', normalBalance: 'DEBIT', description: 'Client acquisition, promotional campaigns, and travel', initialBalance: 24000 },
      { code: '6040', name: 'Depreciation Expense', type: 'EXPENSE', subCategory: 'Depreciation', normalBalance: 'DEBIT', description: 'Periodic depreciation write-down on fixed assets', initialBalance: 6000 },
    ],
  },
];
