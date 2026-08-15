# Dynamic Customer Attributes & Invoice Templates for Bulk Invoicing

A comprehensive guide on configuring dynamic customer attributes, creating reusable invoice templates, and orchestrating automated bulk billing runs with atomic General Ledger (GL) posting and group-level segmentation.

---

## 1. Executive Summary & Core Concepts

In multi-tenant ERP and accounting systems (e.g., Housing Societies, Property Management, SaaS Subscriptions, Healthcare Clinics, and Professional Services), recurring billing across hundreds of customers requires flexibility beyond rigid database schemas.

The system provides a two-pillar architecture:
1. **Dynamic Custom Attribute Schema (EAV Model)**: Attach schema-driven fields (`BOOLEAN`, `NUMBER`, `TEXT`, `DATE`, `SELECT`) to Customer records without database migrations.
2. **Template-Driven Bulk Invoicing Engine**: Group customers dynamically by attribute values (e.g., `is_commercial`, `unit_wing`, `payment_terms`), map distinct invoice templates with dynamic rate multipliers, preview pre-flight calculations, and atomically commit balanced double-entry journal entries to the General Ledger.

---

## 2. Dynamic Attribute Architecture

### 2.1 Supported Attribute Types & Accounting Behaviors

| Attribute Data Type | Value Representation | Best Use Case in Invoicing | Segmentation Behavior |
| :--- | :--- | :--- | :--- |
| **`BOOLEAN`** | `true` / `false` | `is_commercial`, `is_tax_exempt`, `has_parking_slot` | Automatically partitions customers into **2 distinct groups** (True vs. False). |
| **`NUMBER`** | Numeric (`float`/`int`) | `carpet_area_sqft`, `seat_count`, `patient_cohort_size` | Acts as a **dynamic multiplier** (`Line Amount = Area × Unit Rate`). |
| **`SELECT` / `TEXT`** | String enumerations | `unit_wing`, `membership_tier`, `property_type` | Discovers all distinct values and generates **N individual groups**. |
| **`DATE`** | ISO-8601 Date (`YYYY-MM-DD`) | `possession_date`, `contract_renewal_date` | Enables prorated calculation cycles and anniversary billing. |

### 2.2 Schema Definition Example (`CustomAttributeDefinition`)

Dynamic attributes are registered per tenant in the custom schema engine:

```json
[
  {
    "id": "attr-comm-flag",
    "tenantId": "t-acme-us",
    "key": "is_commercial",
    "name": "Is Commercial Establishment",
    "dataType": "boolean",
    "targetEntity": "CUSTOMER",
    "isRequired": false,
    "defaultValue": false,
    "description": "Flags whether the member operates a commercial office/retail shop incurring commercial tariffs."
  },
  {
    "id": "attr-carpet-area",
    "tenantId": "t-acme-us",
    "key": "carpet_area_sqft",
    "name": "Carpet Area (Sq Ft)",
    "dataType": "number",
    "targetEntity": "CUSTOMER",
    "isRequired": true,
    "defaultValue": 1200,
    "description": "Floor carpet area utilized for calculating variable per-sqft maintenance assessments."
  },
  {
    "id": "attr-unit-wing",
    "tenantId": "t-acme-us",
    "key": "unit_wing",
    "name": "Building Tower / Wing",
    "dataType": "select",
    "options": ["Tower Alpha", "Tower Beta", "Tower Gamma", "Commercial Plaza"],
    "targetEntity": "CUSTOMER",
    "isRequired": false,
    "description": "Physical block/wing identifier for localized amenity billing."
  }
]
```

### 2.3 Customer Record with Dynamic Attributes

Customer objects store these values inside the `customAttributes` dictionary:

```json
{
  "id": "cust-001",
  "tenantId": "t-acme-us",
  "code": "CUST-A-101",
  "name": "Apex Commercial Dental Clinic",
  "email": "billing@apexdental.com",
  "category": "Commercial",
  "paymentTermsDays": 15,
  "billingAddress": "Suite 101, Commercial Plaza, Metro Gardens",
  "customAttributes": {
    "is_commercial": true,
    "carpet_area_sqft": 2400,
    "unit_wing": "Commercial Plaza",
    "unit_flat_no": "CP-101",
    "parking_slots_count": 4,
    "has_high_voltage_backup": true
  }
}
```

---

## 3. Invoice Templates Engine

### 3.1 Invoice Template Schema

An **Invoice Template** defines standardized line items, tax rates, revenue accounts, payment terms, and memo token templates.

```typescript
export interface InvoiceTemplate {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  items: InvoiceTemplateLineItem[];
  defaultPaymentTermsDays?: number;
  defaultRevenueAccountCode?: string;
  defaultNotes?: string;
  isActive: boolean;
  usageCount: number;
}
```

### 3.2 Real-World Template Examples

#### Template A: Housing Society Commercial Unit Maintenance (`TMPL-SOCIETY-COMMERCIAL`)
Used for commercial members with higher utility and infrastructure overheads:

```json
{
  "id": "tmpl-society-commercial",
  "code": "TMPL-SOCIETY-COMMERCIAL",
  "name": "Housing Society Commercial Unit Maintenance & HVAC Surcharge",
  "category": "Property & Facilities",
  "defaultPaymentTermsDays": 15,
  "defaultRevenueAccountCode": "4010",
  "defaultNotes": "Commercial establishment monthly maintenance. Includes commercial HVAC and priority parking. Net 15 days.",
  "items": [
    {
      "productCode": "SRV-MAINT-SQFT",
      "description": "Commercial Space Base Maintenance Tariff (Per Sq Ft)",
      "quantity": 1,
      "unitPrice": 3.25,
      "taxRate": 18.0,
      "unitOfMeasure": "sq ft"
    },
    {
      "productCode": "SRV-PARK-BAY",
      "description": "Commercial Dedicated Customer Parking Slots",
      "quantity": 4,
      "unitPrice": 120.00,
      "taxRate": 18.0,
      "unitOfMeasure": "bay/mo"
    },
    {
      "productCode": "SRV-COMM-HVAC",
      "description": "Commercial Central Chiller & High Load Diesel Generator Surcharge",
      "quantity": 1,
      "unitPrice": 650.00,
      "taxRate": 18.0,
      "unitOfMeasure": "month"
    }
  ]
}
```

#### Template B: Residential Flat Quarterly Maintenance (`TMPL-SOCIETY-QTR`)
Used for standard residential members:

```json
{
  "id": "tmpl-society-maint",
  "code": "TMPL-SOCIETY-QTR",
  "name": "Housing Society Quarterly Maintenance Assessment & Sinking Fund",
  "category": "Property & Facilities",
  "defaultPaymentTermsDays": 30,
  "defaultRevenueAccountCode": "4010",
  "defaultNotes": "Quarterly maintenance and sinking fund levy. Net 30 days.",
  "items": [
    {
      "productCode": "SRV-MAINT-SQFT",
      "description": "Residential Society Maintenance Assessment (Per Sq Ft)",
      "quantity": 1,
      "unitPrice": 2.10,
      "taxRate": 5.0,
      "unitOfMeasure": "sq ft"
    },
    {
      "productCode": "SRV-SINK-FUND",
      "description": "Mandatory Capital Replacement Sinking Fund Levy",
      "quantity": 1,
      "unitPrice": 450.00,
      "taxRate": 0.0,
      "unitOfMeasure": "quarter"
    }
  ]
}
```

---

## 4. End-to-End Walkthrough: Housing Society Bulk Invoicing

Here is a step-by-step example demonstrating how the system processes 8 customers with different attributes.

### Step 1: Customer Segmentation by Boolean Attribute `is_commercial`

The operator selects `is_commercial` in the Bulk Invoicing Wizard:

1. **Group 1: Commercial Members (`is_commercial: true`)**
   - Customers:
     - `CUST-A-101`: Apex Commercial Dental Clinic (2,400 sq ft)
     - `CUST-A-102`: Blue Horizon Realty Office (1,800 sq ft)
     - `CUST-A-103`: Gourmet Express Café (3,200 sq ft)
   - Assigned Template: `TMPL-SOCIETY-COMMERCIAL`
   - Multiplier Attribute: `carpet_area_sqft`

2. **Group 2: Residential Members (`is_commercial: false`)**
   - Customers:
     - `CUST-R-201`: John Doe (Flat 201, 1,250 sq ft)
     - `CUST-R-202`: Emily Chen (Flat 202, 1,500 sq ft)
     - `CUST-R-301`: Michael & Sarah Smith (Flat 301, 1,750 sq ft)
     - `CUST-R-302`: David Miller (Flat 302, 1,100 sq ft)
     - `CUST-R-401`: Linda Taylor (Flat 401, 2,100 sq ft)
   - Assigned Template: `TMPL-SOCIETY-QTR`
   - Multiplier Attribute: `carpet_area_sqft`

---

### Step 2: Dynamic Line-Item Calculation Logic

For each customer, the calculation engine dynamically evaluates line items:

$$\text{Line Amount} = \text{Effective Quantity} \times \text{Effective Unit Price}$$

$$\text{Tax Amount} = \text{Line Amount} \times \left(\frac{\text{Tax Rate}}{100}\right)$$

#### Detailed Computation for `CUST-A-101` (Commercial: 2,400 sq ft):
1. **Base Maintenance**:
   - $\text{Quantity} = 2,400 \text{ sq ft}$ (from `customer.customAttributes.carpet_area_sqft`)
   - $\text{Unit Price} = \$3.25$
   - $\text{Line Amount} = 2,400 \times 3.25 = \$7,800.00$
   - $\text{Tax (18\%)} = 7,800 \times 0.18 = \$1,404.00$
2. **Parking Bays (4 slots)**:
   - $\text{Line Amount} = 4 \times \$120.00 = \$480.00$
   - $\text{Tax (18\%)} = 480 \times 0.18 = \$86.40$
3. **Commercial HVAC Chiller**:
   - $\text{Line Amount} = 1 \times \$650.00 = \$650.00$
   - $\text{Tax (18\%)} = 650 \times 0.18 = \$117.00$
4. **Invoice Totals**:
   - $\text{Subtotal} = \$8,930.00$
   - $\text{Tax Total} = \$1,607.40$
   - $\text{Total Invoice Amount} = \mathbf{\$10,537.40}$

#### Detailed Computation for `CUST-R-201` (Residential: 1,250 sq ft):
1. **Base Maintenance**:
   - $\text{Quantity} = 1,250 \text{ sq ft}$
   - $\text{Unit Price} = \$2.10$
   - $\text{Line Amount} = 1,250 \times 2.10 = \$2,625.00$
   - $\text{Tax (5\%)} = 2,625 \times 0.05 = \$131.25$
2. **Sinking Fund**:
   - $\text{Line Amount} = \$450.00$
   - $\text{Tax (0\%)} = \$0.00$
3. **Invoice Totals**:
   - $\text{Subtotal} = \$3,075.00$
   - $\text{Tax Total} = \$131.25$
   - $\text{Total Invoice Amount} = \mathbf{\$3,206.25}$

---

### Step 3: Pre-Flight Validation Grid

Before any data is written to the database, the operator reviews the **Pre-Flight Validation Grid**:

```
+-------------------------------------------------------------------------------------------------------------+
| Customer Code | Customer Name             | Group / Template       | Subtotal   | Tax Total | Total Due     |
+---------------+---------------------------+------------------------+------------+-----------+---------------+
| CUST-A-101    | Apex Commercial Clinic    | Commercial (TMPL-COMM) | $8,930.00  | $1,607.40 | $10,537.40    |
| CUST-A-102    | Blue Horizon Realty       | Commercial (TMPL-COMM) | $6,980.00  | $1,256.40 |  $8,236.40    |
| CUST-A-103    | Gourmet Express Café      | Commercial (TMPL-COMM) | $11,530.00 | $2,075.40 | $13,605.40    |
| CUST-R-201    | John Doe (Flat 201)       | Residential (TMPL-QTR) | $3,075.00  |   $131.25 |  $3,206.25    |
| CUST-R-202    | Emily Chen (Flat 202)     | Residential (TMPL-QTR) | $3,600.00  |   $157.50 |  $3,757.50    |
| CUST-R-301    | Michael Smith (Flat 301)  | Residential (TMPL-QTR) | $4,125.00  |   $183.75 |  $4,308.75    |
| CUST-R-302    | David Miller (Flat 302)   | Residential (TMPL-QTR) | $2,760.00  |   $115.50 |  $2,875.50    |
| CUST-R-401    | Linda Taylor (Flat 401)   | Residential (TMPL-QTR) | $4,860.00  |   $220.50 |  $5,080.50    |
+---------------+---------------------------+------------------------+------------+-----------+---------------+
| TOTALS (8 Invoices Generated)                                      | $45,860.00 | $5,747.70 | $51,607.70    |
+-------------------------------------------------------------------------------------------------------------+
```

Operators can also click **"Export Preview CSV"** to audit calculations offline.

---

### Step 4: Atomic General Ledger Journal Posting

When the operator clicks **"Commit & Post Batch Invoices"**, the engine executes the following atomic transactions:
1. Generates sequential invoice documents (`INV-2026-0001` through `INV-2026-0008`).
2. Creates an audit batch record (`BAT-2026-001`).
3. Posts balanced double-entry journal entries for every generated invoice:

$$\begin{aligned}
\text{Debit: } & \text{Account 1100 (Accounts Receivable)} & \$51,607.70 \\
\text{Credit: } & \text{Account 4010 (Maintenance Revenue)} & \$45,860.00 \\
\text{Credit: } & \text{Account 2110 (Tax / GST Payable)} & \$5,747.70
\end{aligned}$$

---

## 5. Reversal & Audit Safety (Rollback Engine)

If an error is discovered post-run (e.g., incorrect billing rate entered):
1. Navigate to **Invoicing & AR** $\rightarrow$ **Bulk Invoicing Engine** $\rightarrow$ **Batch History**.
2. Locate the batch run (e.g., `BAT-2026-001`).
3. Click **"Rollback Batch"**.
4. The system:
   - Sets the batch status to `ROLLED_BACK`.
   - Voids all linked customer invoices.
   - Posts reversing journal entries to zero out the AR balances.
   - Logs an immutable security audit trail event with user timestamp.

---

## 6. Summary Checklist for Operators

- [x] **Step 1: Define Attributes** $\rightarrow$ Configure keys like `is_commercial` or `carpet_area_sqft` under **Custom Attributes**.
- [x] **Step 2: Create Master Templates** $\rightarrow$ Create distinct templates with appropriate items and tax brackets under **Invoice Templates**.
- [x] **Step 3: Run Bulk Wizard** $\rightarrow$ Open **Bulk Invoicing Engine**, select the grouping attribute, verify member counts.
- [x] **Step 4: Map Templates & Multipliers** $\rightarrow$ Select the dynamic multiplier field (e.g., `carpet_area_sqft`).
- [x] **Step 5: Pre-Flight Validate & Post** $\rightarrow$ Inspect the calculation table and commit to General Ledger.
