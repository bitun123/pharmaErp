# Pharma ERP — Product Requirements Document (PRD)

---

## 1. Document Information

| Field | Value |
|---|---|
| Product name | Pharma ERP (working name) |
| Document version | 0.4 |
| Status | **DRAFT — not approved.** Remains a draft until the high-impact open questions in Section 21 are decided. |
| Purpose | Define what the product must do, for whom, and under which business rules, independent of implementation. |
| Intended readers | Product owner, developers, QA engineers, AI coding agents, business stakeholders |
| Related documents | None exist yet. No `SRS.md`, prior `PRD.md` or planning notes were found in the repository (reviewed 2026-10-20). |
| Source of requirements | The product owner's project brief (confirmed decisions) plus analyst proposals, which are labelled as such. |

**Decision-status legend (used throughout):**
- **Confirmed**: stated by the product owner; may be implemented.
- **Proposed**: analyst recommendation; **not approved**; must not be implemented until approved.
- **Open**: unresolved; blocks or constrains the related work (see Section 21).

**Change history**

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-10-20 | Claude (drafted for product owner) | Initial draft |
| 0.2 | 2026-10-20 | Claude (drafted for product owner) | Recorded owner decisions: Express backend; Redis, BullMQ and Swagger approved as technologies; customer analysis covers aggregate and per-customer; pharmacy web is a PWA (online-only) |
| 0.3 | 2026-10-20 | Claude (drafted for product owner) | Recorded owner approval of recommendations for open questions (see Section 21 and approval log); still open: OQ-2, 7, 33, 37, 38, 42; OQ-8 conditional on regulations |
| 0.4 | 2026-10-20 | Claude (drafted for product owner) | OQ-8: cancellation allowed same-day and on later days, plus defined returns (regulations still to confirm); OQ-19: email password reset, MFA later; OQ-30: FEFO default with permitted manual override; OQ-2 stays with the accountant |

### 1.1 Repository findings relevant to this PRD
- The repository contains a backend skeleton (Express 5, TypeScript, pnpm) and an empty `frontend/` folder. **No requirement in this PRD is implemented.**
- **Conflict C-1 — RESOLVED (v0.2):** the owner decided the backend uses **Express** (not NestJS). OQ-17 closed.
- **Conflict C-2 — RESOLVED (v0.2):** the owner approved Redis/`ioredis`, BullMQ and Swagger as project technologies. The approval covers the technology, **not** any feature: no product requirement yet specifies what Redis or BullMQ must do, so each use must trace to a confirmed requirement (candidates: background import processing, alert scans, report generation; OQ-41). Their presence in the repository is still not evidence that a feature exists.
- **Conflict C-3 — PARTLY RESOLVED (v0.2):** the pharmacy-side (Owner and staff) web interface is a **Progressive Web App (PWA)**. The repository still has no application structure for the three web interfaces (Super Admin, Platform Admin, Pharmacy); whether the first two share one codebase is Open (OQ-14).

---

## 2. Executive Summary

Pharma ERP is a multi-tenant, online-only platform that lets independent pharmacy businesses run daily operations from one system: medicine catalog, branch-level and batch-level inventory, supplier purchases and stock receiving, retail and wholesale billing, expiry and low-stock monitoring, staff permissions, and sales reporting.

Primary users are pharmacy business owners and their staff. Platform-level administrators (Super Admin, Platform Admin) manage registered businesses with restricted access to tenant data.

The value is accurate inventory, less manual record-keeping, reliable invoices, and owner visibility across branches.

**Initial delivery scope:** web applications for the platform administrators and the pharmacy; an online-only workflow; no subscription billing; Android scope undecided.

---

## 3. Problem Statement

Pharmacies commonly depend on paper records or disconnected spreadsheets. The problems this product targets:

| Area | Problem |
|---|---|
| Inventory accuracy | Stock counts drift from reality; no per-batch or per-branch record of where stock is. |
| Stock receiving | Purchases are recorded without confirming what physically arrived (partial deliveries, wrong batches, damaged goods). |
| Expiry monitoring | Expired stock is discovered late or sold by mistake; near-expiry stock is not acted on. |
| Supplier purchases | Supplier invoices and purchase costs are scattered; duplicates are hard to detect. |
| Employee permissions | Staff access cannot be limited to the work and branches they are responsible for. |
| Billing | Manual discount, tax and rounding calculations cause inconsistent invoice totals; wholesale and retail are handled ad hoc. |
| Sales reporting | The owner cannot easily see sales by period or branch, or which medicines sell most. |

No evidence is claimed that this product has already solved any of these problems.

---

## 4. Product Vision and Value Proposition

**Target business:** independent pharmacy businesses operating one or more branches that sell both retail and wholesale.

**Primary value:** a trustworthy record of stock, purchases and sales, so the owner can run and monitor the business from one place.

**How it improves operations:**
- Stock changes only through confirmed, traceable events.
- Billing calculations are consistent and reproducible.
- Staff see and do only what their permissions allow.
- Alerts surface low-stock and expiry risks before they become losses.

**Boundaries — the product will not attempt to be:**
- A hospital management system (no patients, prescriptions, clinical records).
- An e-commerce marketplace or customer-facing ordering site.
- A general-purpose accounting platform (no general ledger, payroll, or statutory tax filing).
- An offline-first product (initial release).
- A subscription/billing product (deferred).

---

## 5. Target Users and Personas

Roles are named collections of permissions (Section 11). Platform roles and pharmacy roles live in separate scopes.

| Role | Status |
|---|---|
| Super Admin | Confirmed |
| Platform Admin | Confirmed (capabilities Open, OQ-13) |
| Pharmacy Business Owner | Confirmed |
| Pharmacy Staff (custom roles created by Owner) | Confirmed concept; the role names below are **Proposed** examples |

### 5.1 Super Admin (platform)
- **Responsibilities:** register/view pharmacy businesses; activate/suspend business accounts; manage global settings; manage platform administrators and their permissions.
- **Goals:** keep the platform healthy and accounts correctly provisioned.
- **Workflows:** review business list → change account status; create Platform Admin → assign permissions.
- **Data access:** business-level records (name, status, contact, creation date, aggregate counts). **Not** pharmacy private financial/operational data by default (OQ-12).
- **Limitations:** no implicit access to tenant sales, invoices, stock or purchase data.

### 5.2 Platform Admin (platform)
- **Responsibilities:** only the specific platform duties granted by the Super Admin (e.g., support/onboarding). Exact list is Open (OQ-13).
- **Limitations:** never receives Super Admin rights by default; cannot manage other administrators.

### 5.3 Pharmacy Business Owner
- **Responsibilities:** set up business and branches; create users and roles; manage catalog, suppliers, purchases and receiving; set pricing, discount and tax configuration; review alerts and reports.
- **Goals:** accurate stock, controlled staff access, visibility across all branches.
- **Data access:** all data of their own business, all branches.
- **Limitations:** no access to other businesses or to platform administration.

### 5.4 Pharmacy Staff (Proposed example roles — Owner defines actual roles)
| Example role | Typical permissions |
|---|---|
| Cashier | Create bills, search medicines, view own bills |
| Inventory clerk | Manage stock, receive stock, view alerts |
| Purchase officer | Manage suppliers, record purchases, upload invoices |
| Branch manager | Operational view and actions within assigned branches, reports |

Staff belong to one business and one or more authorized branches. Branch assignment is a data-scope rule, separate from permissions (OQ-10).

---

## 6. Business Goals and Success Metrics

Targets are unknown; each is a **Proposed measurement method** requiring approval of the target value.

| ID | Goal | Measurement method | Target | Status |
|---|---|---|---|---|
| KPI-01 | Inventory accuracy | Periodic physical count vs. system balance per batch, as % of counted batches matching | TBD | Open |
| KPI-02 | Stock-receipt integrity | % of purchases where received quantity is explicitly confirmed before stock changes (must be 100% by rule) | 100% | Proposed |
| KPI-03 | Import success | % of import rows accepted on first upload; % of imports completed without support help | TBD | Open |
| KPI-04 | Billing consistency | Automated recalculation of stored invoices matches stored totals | 100% | Proposed |
| KPI-05 | Permission enforcement | Automated test suite: unauthorized actions and cross-tenant requests rejected | 100% pass | Proposed |
| KPI-06 | Core workflow completion | Owner completes setup → opening stock → purchase/receipt → bill → report without support, in a usability test | TBD | Open |
| KPI-07 | Expired-stock sales | Number of sales lines against expired batches (must be 0 without an approved override, OQ-6) | 0 | Proposed |
| KPI-08 | Duplicate transactions | Duplicate bills created from repeated requests | 0 | Proposed |

---

## 7. Product Scope

### 7.1 Confirmed MVP scope
- Multi-tenant businesses with multiple branches and data isolation.
- Users, roles and permissions created by the Owner, enforced by the backend.
- Medicine catalog.
- Opening inventory: manual entry and Excel/CSV import with validation and review of invalid rows.
- Supplier management.
- Manual purchase recording; supplier invoice upload as a supporting document (does not change stock).
- Stock receipt confirmation, with batch and expiry capture.
- Batch-level, branch-level inventory with traceable stock movements.
- Low-stock and near-expiry alerts; expired stock identification; sale of expired stock restricted.
- Retail and wholesale billing with discounts, taxes, rounding, payments, invoice generation and history, stock deduction, duplicate prevention.
- Sales reports with flexible date ranges, weekly/monthly views, medicines ranked by quantity sold, branch filter.
- Employee details and permitted activity history.
- Super Admin and Platform Admin web functions (restricted).

### 7.2 Proposed MVP requirements (need approval)
- Sale returns/cancellations with stock reversal (OQ-8).
- Audit log of sensitive actions (NFR-AUD-01).
- Stock adjustments (e.g., damaged/expired write-off) with reason (OQ-9).
- Inter-branch stock transfer is **not** proposed for MVP (see 7.3).

### 7.3 Later-phase (not MVP)
- Subscription plans and payment gateway; renewals; plan limits; feature gating.
- Offline billing, queues, sync, conflict resolution.
- Automated invoice OCR.
- Inter-branch stock transfers; purchase orders (pending OQ-5).
- Android feature set (pending OQ-14).

### 7.4 Explicitly out of scope
Subscription monetization of any kind; offline-first operation (a PWA does not imply offline use: installability only, no offline billing, queues or sync); hospital/patient/prescription management; e-commerce; general accounting; jurisdiction-specific tax filing; microservices. Redis/BullMQ are approved technologies but may be used only where a confirmed requirement needs them.

### 7.5 Assumptions
- A1: Each user belongs to exactly one business.
- A2: Money is in a single currency per business (currency chosen at setup; OQ-16).
- A3: Users have internet access at the point of use.
- A4: Tax rates and wholesale pricing policy are supplied by the Owner as configuration; the product ships with none.

---

## 8. Functional Requirements

Format per requirement: **Statement · Purpose · Actor · Preconditions · Behavior/Validation · Postconditions · Errors · Acceptance · Priority · Status.** Priority: M = Must (MVP), S = Should, C = Could. Where a status is not Confirmed, the requirement must not be built until approved.

### 8.1 Business and Branch Management (BB)

**BB-FR-001 — Register pharmacy business**
- *Statement:* The system shall allow a pharmacy business to be created with a unique identity, name and an initial Owner account.
- *Purpose:* Establish the tenant. *Actor:* Super Admin (creation path is OQ-11: self-signup vs admin-created).
- *Pre:* Actor authorized. *Validation:* name required; Owner email unique across the platform.
- *Post:* Business exists in Active state with one Owner. *Errors:* duplicate email rejected with a clear message; no partial business created.
- *Acceptance:* Given valid details, when the business is created, then the Owner can sign in and sees only an empty business. Given a duplicate Owner email, then nothing is created.
- *Priority:* M. *Status:* Confirmed (creation path Open).

**BB-FR-002 — Create and manage branches**
- *Statement:* The system shall allow the Owner to create, edit and deactivate branches within their business.
- *Purpose:* Support multi-branch operation. *Actor:* Owner. *Validation:* branch name unique within the business.
- *Post:* Deactivated branch accepts no new sales, receipts or imports; history is retained.
- *Errors:* deactivation blocked or warned if the branch has stock or open work (OQ-18).
- *Acceptance:* Given a deactivated branch, when a bill is attempted for it, then the system rejects it; its past invoices remain viewable.
- *Priority:* M. *Status:* Confirmed.

**BB-FR-003 — Business profile and billing configuration**
- *Statement:* The system shall allow the Owner to maintain business details printed on invoices and the business's tax, discount and rounding configuration.
- *Purpose:* Invoices and totals reflect the Owner's real rules. *Actor:* Owner.
- *Validation:* tax rates and discount limits are numeric, within 0–100% where percentages; no default rates are supplied.
- *Post:* Changes apply to future bills only; issued invoices never change.
- *Acceptance:* Given a changed tax rate, when an older invoice is opened, then it shows the original rate and totals.
- *Priority:* M. *Status:* Confirmed (rule specifics Open, OQ-3, OQ-4).

**BB-FR-004 — Business account status**
- *Statement:* The system shall prevent users of a Suspended business from signing in or calling the API, while preserving its data.
- *Actor:* Super Admin (sets status). *Post:* Reactivation restores access with data unchanged.
- *Acceptance:* Given a suspended business, when any of its users sends a request with a previously valid session, then it is rejected.
- *Priority:* M. *Status:* Confirmed.

### 8.2 User Management and Permissions (UM)

**UM-FR-001 — Create staff users**
- *Statement:* The system shall allow the Owner (and any user granted the permission) to create staff users for their business with a role and branch assignments.
- *Validation:* email unique; at least one branch unless the role is business-wide (OQ-10); password policy per NFR-SEC-02.
- *Post:* User can sign in and sees only permitted modules and branches.
- *Acceptance:* Given a staff user assigned to Branch A, when the user requests Branch B data, then the request is rejected.
- *Priority:* M. *Status:* Confirmed.

**UM-FR-002 — Define roles and permissions**
- *Statement:* The system shall allow the Owner to create roles as named sets of fine-grained permissions (Section 11).
- *Validation:* a role cannot grant a permission the creator lacks; the Owner role cannot be removed from the business's last Owner.
- *Acceptance:* Given a role with "View sales" but not "Create bill", when the user attempts to create a bill via the API, then the backend rejects it.
- *Priority:* M. *Status:* Confirmed.

**UM-FR-003 — Deactivate users**
- *Statement:* The system shall allow the Owner to deactivate a user, immediately revoking access while retaining all records the user created.
- *Acceptance:* Given a deactivated user with an active session, when they send a request, then it is rejected; their past invoices still show their name.
- *Priority:* M. *Status:* Confirmed.

**UM-FR-004 — Authentication**
- *Statement:* The system shall authenticate users with credentials and shall identify the user's business, role and branches from the authenticated session, never from client-supplied tenant identifiers.
- *Errors:* generic message on failed sign-in; repeated failures throttled (NFR-SEC-03).
- *Priority:* M. *Status:* Confirmed (mechanism is a design decision; password reset by email approved, MFA in a later phase, OQ-19).

### 8.3 Medicine Catalog (MC)

**MC-FR-001 — Create and edit medicines**
- *Statement:* The system shall allow authorized users to create and edit medicine master records (name, optional generic name, manufacturer, dosage form, strength, base unit, selling units, barcode/code if used).
- *Purpose:* One master record per medicine; batches hold expiry and cost. *Actor:* Owner or permitted staff.
- *Validation:* name and base unit required; duplicate detection on name + strength + form + manufacturer (warn, not silently merge).
- *Post:* Medicine available to inventory, purchases and billing.
- *Acceptance:* Given an existing medicine, when a user creates the same combination, then the system warns and requires confirmation or rejects.
- *Priority:* M. *Status:* Confirmed (exact attributes Proposed; regulatory fields such as schedule/prescription-only flag Open, OQ-7).

**MC-FR-002 — Unit conversions**
- *Statement:* The system shall store each medicine's selling units with an integer conversion to its base unit (e.g., strip = 10 tablets) and shall record all stock in base units.
- *Validation:* conversion factor positive and whole; changing a factor does not alter historical records.
- *Acceptance:* Given strip = 10 tablets, when 2 strips are sold, then stock decreases by 20 tablets.
- *Priority:* M. *Status:* Proposed.

**MC-FR-003 — Deactivate medicine**
- *Statement:* The system shall allow deactivating a medicine so it cannot be newly purchased or sold, while its history and remaining batches stay visible.
- *Priority:* M. *Status:* Proposed.

**MC-FR-004 — Selling price configuration**
- *Statement:* The system shall allow a retail selling price and a separate wholesale selling price to be configured per medicine. A wholesale bill shall not proceed for a medicine with no wholesale price.
- *Status:* Confirmed (OQ-3, v0.3). *Priority:* M. Discount and tax calculation remain blocked by OQ-2.

### 8.4 Opening Inventory (OI)

**OI-FR-001 — Manual opening stock entry**
- *Statement:* The system shall allow the Owner (or permitted user) to enter opening stock per medicine, branch and batch: batch number, expiry date, quantity, unit cost.
- *Pre:* Medicine and branch exist. *Validation:* quantity > 0; cost ≥ 0; expiry date valid; batch number required where batches apply; same medicine + batch number + branch combination is a duplicate and is rejected or merged only by explicit choice.
- *Post:* An Opening-stock movement is recorded and the branch balance for the batch equals the quantity.
- *Errors:* invalid line is rejected with a field-level message; no partial save of an entry document.
- *Acceptance:* Given valid lines, when saved, then each batch balance equals its quantity and a movement of type Opening exists for each.
- *Priority:* M. *Status:* Confirmed.

**OI-FR-002 — Opening stock window**
- *Statement:* The system shall restrict opening-stock entry to rules decided in OQ-9 (e.g., allowed only before first sale per branch, or always with adjustment records).
- *Status:* Open. *Priority:* M.

### 8.5 Excel/CSV Inventory Import (IM)

**IM-FR-001 — Upload and parse**
- *Statement:* The system shall accept an Excel (.xlsx) or CSV file for opening inventory, parse it, and not change inventory at upload time.
- *Validation:* file type and size limits (NFR-PERF-04); required columns present; template provided for download.
- *Errors:* unreadable or oversize file rejected with a clear message; nothing stored as inventory.
- *Priority:* M. *Status:* Confirmed.

**IM-FR-002 — Row validation and review**
- *Statement:* The system shall validate every row and present a review showing valid rows, invalid rows with reasons, and warnings, before any stock is created.
- *Validation:* each row checked as in OI-FR-001; unknown medicines handled per OQ-20 (reject vs. create vs. map); duplicates within the file and against existing batches flagged.
- *Acceptance:* Given a file with 100 rows of which 5 are invalid, when reviewed, then 95 valid and 5 invalid rows are listed with reasons and no stock exists yet.
- *Priority:* M. *Status:* Confirmed.

**IM-FR-003 — Accept import**
- *Statement:* The system shall let the user accept the import and shall create inventory atomically according to the chosen policy: accept valid rows only, or cancel everything (OQ-21).
- *Post:* Movements of type Opening created; the import is recorded (who, when, file name, counts) and cannot be applied twice.
- *Errors:* failure mid-apply leaves no partial stock.
- *Acceptance:* Given an accepted import, when the same file is submitted again, then the system warns of a prior import and does not double stock unless explicitly confirmed.
- *Priority:* M. *Status:* Confirmed (partial vs all-or-nothing Open).

**IM-FR-004 — Downloadable error report**
- *Statement:* The system shall let the user download invalid rows with reasons for correction and re-upload.
- *Priority:* S. *Status:* Proposed.

### 8.6 Supplier Management (SU)

**SU-FR-001 — Manage suppliers**
- *Statement:* The system shall allow authorized users to create, edit and deactivate suppliers (name, contact, address, tax/registration identifier if used, payment terms note).
- *Validation:* name required; duplicate warning on name + tax identifier.
- *Post:* Deactivated suppliers cannot receive new purchases; history remains.
- *Acceptance:* Given a supplier with purchases, when deactivated, then past purchases remain viewable and new ones are blocked.
- *Priority:* M. *Status:* Confirmed.

### 8.7 Purchase Recording (PU)

**PU-FR-001 — Record a purchase manually**
- *Statement:* The system shall allow authorized users to record a purchase from a supplier for a branch, with supplier invoice number and date, and lines containing medicine, batch number, expiry date, quantity, purchase cost and applicable tax/discount.
- *Pre:* Supplier, branch and medicines exist. *Validation:* lines non-empty; quantity > 0; cost ≥ 0; invoice totals equal sum of lines (or the user acknowledges a stated difference, OQ-22).
- *Post:* A Purchase in **Recorded (pending receipt)** state exists; **inventory is unchanged**.
- *Errors:* invalid lines rejected field by field.
- *Acceptance:* Given a recorded purchase, then stock balances are unchanged until receipt is confirmed.
- *Priority:* M. *Status:* Confirmed.

**PU-FR-002 — Duplicate supplier invoice detection**
- *Statement:* The system shall warn or block when a purchase has the same supplier and invoice number as an existing non-cancelled purchase in the same business.
- *Status:* Proposed (warn vs block Open, OQ-23). *Priority:* M.

**PU-FR-003 — Edit and cancel unreceived purchase**
- *Statement:* The system shall allow editing or cancelling a purchase that has no confirmed receipt, and shall prevent editing financial lines of purchases with confirmed receipts except through a defined correction process (OQ-24).
- *Priority:* M. *Status:* Proposed.

**PU-FR-004 — Purchase orders**
- *Statement:* Whether the system supports purchase orders (ordering before delivery) in addition to direct purchase records is undecided.
- *Status:* Excluded from MVP (OQ-5 approved, v0.3). See Section 10, rule BR-06. *Priority:* Later phase.

### 8.8 Supplier Invoice Upload (IU)

**IU-FR-001 — Attach invoice document**
- *Statement:* The system shall allow authorized users to upload a supplier invoice file (PDF/image) and attach it to a purchase as a supporting document.
- *Validation:* allowed types and maximum size (NFR-PERF-04); content type verified, not just extension.
- *Post:* Document stored privately and linked to the purchase; **stock unchanged**.
- *Errors:* failed upload leaves the purchase intact, with a retry option.
- *Acceptance:* Given an uploaded invoice, then stock balances are unchanged and the file is retrievable only by authorized users of the same business.
- *Priority:* M. *Status:* Confirmed.

**IU-FR-002 — Retrieve and replace document**
- *Statement:* The system shall let authorized users view an attached invoice, and replace or remove it while keeping a record that the change occurred.
- *Priority:* S. *Status:* Proposed.

### 8.9 Stock Receiving and Batch Tracking (SR)

**SR-FR-001 — Confirm stock receipt**
- *Statement:* The system shall allow authorized users to confirm receipt against a recorded purchase, entering per line the received quantity, accepted quantity (if different, with reason), batch number and expiry date.
- *Pre:* Purchase in Recorded or Partially received state. *Validation:* received ≥ 0; accepted ≤ received; cumulative accepted ≤ ordered quantity unless over-receipt is permitted (OQ-25); expiry not in the past; batch number required.
- *Post:* In one atomic operation, a Purchase-receipt movement increases the batch balance by the accepted quantity; receipt records who and when.
- *Errors:* any line failure rolls back the whole receipt; the user sees which line failed.
- *Acceptance:* Given a purchase for 100 units, when 60 are accepted, then balance increases by 60 and the purchase is Partially received with 40 outstanding.
- *Priority:* M. *Status:* Confirmed.

**SR-FR-002 — Partial and multiple receipts**
- *Statement:* The system shall support several receipts against one purchase and shall track ordered, received and accepted quantities per line.
- *Acceptance:* Given two receipts, then the purchase shows cumulative quantities and closes only when all lines are complete or the user closes it explicitly with a reason.
- *Priority:* M. *Status:* Confirmed (analysis in BR-06).

**SR-FR-003 — Batch identity**
- *Statement:* The system shall identify a batch by business, medicine, batch number and branch inventory, and shall reject a receipt that reuses a batch number with a different expiry date for the same medicine unless the user explicitly resolves the conflict.
- *Status:* Proposed (OQ-26). *Priority:* M.

**SR-FR-004 — Stock movement trace**
- *Statement:* The system shall record every inventory change as an immutable stock movement (type, medicine, batch, branch, quantity ±, reference document, user, time).
- *Acceptance:* Given any balance, then the sum of its movements equals the balance.
- *Priority:* M. *Status:* Confirmed.

**SR-FR-005 — Stock adjustment**
- *Statement:* The system shall allow authorized users to adjust a batch balance (e.g., damage, loss, expiry write-off, count correction) with a required reason, recorded as a movement.
- *Status:* Proposed (OQ-9). *Priority:* M.

### 8.10 Expiry and Low-Stock Alerts (AL)

**AL-FR-001 — Low-stock alerts**
- *Statement:* The system shall flag a medicine as low-stock for a branch when its total non-expired balance is at or below its reorder threshold.
- *Validation:* threshold is a non-negative number in base units, set per medicine (and branch, OQ-27).
- *Acceptance:* Given threshold 20 and balance 20, then the medicine appears in the low-stock list; at 21 it does not.
- *Priority:* M. *Status:* Confirmed (threshold granularity Open).

**AL-FR-002 — Near-expiry alerts**
- *Statement:* The system shall flag batches with remaining quantity whose expiry date falls within the configured near-expiry window.
- *Validation:* window in days configurable by the Owner; default is **not** assumed (OQ-28).
- *Priority:* M. *Status:* Confirmed (window value Open).

**AL-FR-003 — Expired stock identification**
- *Statement:* The system shall identify batches whose expiry date has passed as Expired and exclude them from available stock and from billing.
- *Acceptance:* Given a batch expiring today, then expiry boundary behavior follows OQ-6; given a batch expired yesterday, then it cannot be sold.
- *Priority:* M. *Status:* Confirmed (boundary and override Open).

**AL-FR-004 — Alert delivery**
- *Statement:* Alerts shall be visible in the application to users with permission; external notification (email/SMS) is not part of MVP.
- *Status:* Proposed (OQ-29). *Priority:* S.

### 8.11 Retail Billing (RB)

**RB-FR-001 — Create retail bill**
- *Statement:* The system shall allow authorized users to create a retail bill at a branch by searching medicines, selecting selling unit and quantity, and saving the bill.
- *Pre:* User has billing permission for the branch; medicine active and in stock. *Validation:* quantity > 0 and a valid unit; line quantity ≤ available non-expired stock; discounts within user's limit (OQ-4).
- *Post (atomic):* bill numbered; stock deducted per batch (FEFO by default; a user with the override permission may choose another non-expired batch, OQ-30); payment recorded; invoice generated.
- *Errors:* insufficient stock, expired-only stock, or invalid input shows a specific message and **saves nothing**.
- *Acceptance:* Given 5 units available, when a bill for 6 is submitted, then it is rejected and stock remains 5.
- *Priority:* M. *Status:* Confirmed.

**RB-FR-002 — Totals, discounts, tax and rounding**
- *Statement:* The system shall compute line amounts, discounts, taxes and the invoice total using the configured rules and a single documented rounding method, and shall store the computed values on the invoice.
- *Status:* Confirmed requirement; formulas Open (OQ-2, OQ-3).
- *Acceptance:* Given the same inputs, when the bill is recalculated, then the totals are identical; the server, not the client, is the authority for totals.
- *Priority:* M.

**RB-FR-003 — Payment recording**
- *Statement:* The system shall record one or more payments against a bill with method, amount and time, and shall track the outstanding balance.
- *Validation:* amount > 0; payments cannot exceed the bill total unless change/overpayment is handled per OQ-31; retail bills default to full payment (credit on retail Open).
- *Priority:* M. *Status:* Confirmed (payment methods list Open, OQ-31).

**RB-FR-004 — Duplicate request prevention**
- *Statement:* The system shall ensure a repeated submission of the same bill request (double-click, retry after timeout) creates at most one bill and one stock deduction.
- *Acceptance:* Given the same request key sent twice, then one bill exists and the second response returns the first bill.
- *Priority:* M. *Status:* Confirmed.

**RB-FR-005 — Concurrent last-unit sale**
- *Statement:* The system shall prevent stock from going negative when two bills compete for the same units.
- *Acceptance:* Given 1 unit and two simultaneous bills for 1, then exactly one succeeds and the other is rejected with an insufficient-stock message.
- *Priority:* M. *Status:* Confirmed.

### 8.12 Wholesale Billing (WB)

**WB-FR-001 — Create wholesale bill**
- *Statement:* The system shall allow authorized users to create wholesale bills for a named buyer with the same stock, expiry, tax, discount, rounding and duplicate-prevention rules as retail billing, and with wholesale pricing.
- *Validation:* buyer details required (depth Open, OQ-32); wholesale pricing per OQ-3; credit/outstanding balances per OQ-33.
- *Acceptance:* Given a wholesale bill, then the price used is the wholesale price and the bill records the buyer and customer type.
- *Priority:* M. *Status:* Confirmed (pricing policy, buyer records, credit terms Open — **no wholesale pricing policy is to be assumed**).

### 8.13 Sales History and Invoices (SH)

**SH-FR-001 — Invoice view and history**
- *Statement:* The system shall let permitted users search and open historical invoices by number, date range, branch, customer type, payer and status, and view/print/download the invoice as issued.
- *Acceptance:* Given an invoice issued last month, then it displays the totals, tax and business details as of issue.
- *Priority:* M. *Status:* Confirmed.

**SH-FR-002 — Immutable issued invoices**
- *Statement:* The system shall not allow an issued invoice to be edited; corrections shall be made through cancellation or return records.
- *Priority:* M. *Status:* Proposed.

**SH-FR-003 — Returns and cancellations**
- *Statement:* The system shall support (a) cancelling a bill on the day it was issued, (b) cancelling a bill on a later day, and (c) returning items from a bill, each creating records that reference the original bill, restoring stock only when the item is eligible, and adjusting payment/refund records. Issued invoices are never edited.
- *Validation:* each action requires its own permission and a reason; later-day cancellations and returns may carry additional conditions (time limit, approval, restock eligibility) defined by the regulations review.
- *Acceptance:* Given an issued bill, when it is cancelled (same day or later), then a cancellation record references it, eligible stock is restored by movement, payments are reversed or refunded as recorded, and reports show the cancellation separately from sales.
- *Status:* Approved in principle (owner, v0.4): same-day cancellation, later-day cancellation and defined returns are all in scope; the exact rules (time limits, restock eligibility, approvals) are Open until regulations are confirmed (OQ-8, OQ-42). Do not build until then. *Priority:* M.

### 8.14 Employee Details and Activity History (EA)

**EA-FR-001 — View employee details**
- *Statement:* The system shall let the Owner (and permitted users) view employee profiles: name, role, assigned branches, status.
- *Priority:* M. *Status:* Confirmed.

**EA-FR-002 — Permitted activity history**
- *Statement:* The system shall show for each employee a history of business actions the viewer is permitted to see (e.g., bills created, receipts confirmed), with date and branch filters.
- *Status:* Confirmed (which actions count as "activity" Open, OQ-34). *Priority:* S.

### 8.15 Sales and Medicine-Demand Reports (RP)

**RP-FR-001 — Sales report**
- *Statement:* The system shall provide sales reports for a chosen date range, filterable by branch, and by weekly/monthly grouping.
- *Metrics (must be separately labelled):* gross sales (before discounts), discounts, net revenue, taxes, refunds/returns, payments collected, outstanding balance; **profit** only if cost basis is defined (OQ-35).
- *Acceptance:* Given bills, a return and a partial payment, then each metric displays independently and totals reconcile with invoices.
- *Priority:* M. *Status:* Confirmed.

**RP-FR-002 — Medicines ranked by quantity sold**
- *Statement:* The system shall rank medicines by quantity sold (base unit and selling-unit view) for a date range and branch, net of returns.
- *Priority:* M. *Status:* Confirmed.

**RP-FR-003 — Report scoping**
- *Statement:* Reports shall only include branches and data the viewer is authorized for.
- *Priority:* M. *Status:* Confirmed.

**RP-FR-004 — Report export**
- *Statement:* The system shall allow exporting a report to CSV/PDF.
- *Status:* Proposed. *Priority:* S.

**RP-FR-005 — Customer purchase analysis**
- *Statement:* The system shall provide weekly and monthly analysis of medicines purchased, both in aggregate (RP-FR-002) and per identified customer (medicines each customer bought in a period, with quantities).
- *Preconditions:* a sale is attributed to an identified customer. Anonymous retail sales appear only in the aggregate view.
- *Validation:* per-customer data is limited to users with an explicit permission; customer identification on retail bills is optional unless decided otherwise (OQ-32).
- *Acceptance:* Given customer X bought medicine M on two bills in a month, then the per-customer report lists M with the summed quantity net of returns, and the aggregate report includes the same quantities.
- *Priority:* S. *Status:* Confirmed (owner, v0.2); customer record fields and privacy handling Open (OQ-32, OQ-37, OQ-42).

### 8.16 Super Admin Platform Management (SA)

**SA-FR-001 — View businesses** — The system shall let the Super Admin list and search registered businesses with name, status, creation date and aggregate counts (users, branches). *Priority:* M. *Status:* Confirmed.

**SA-FR-002 — Change business status** — The system shall let the Super Admin set a business Active or Suspended with a recorded reason (BB-FR-004). *Priority:* M. *Status:* Confirmed.

**SA-FR-003 — Manage platform administrators** — The system shall let the Super Admin create/deactivate Platform Admins and assign them permissions. *Priority:* M. *Status:* Confirmed.

**SA-FR-004 — Global settings** — The system shall provide only those global settings that are separately approved. *Status:* Open (OQ-13). *Priority:* TBD.

**SA-FR-005 — Tenant data boundary** — The system shall not expose a business's sales, invoices, stock or purchase data to platform roles unless a distinct, audited access permission is approved. *Status:* Proposed (OQ-12). *Priority:* M.

### 8.17 Platform Admin Restricted Operations (PA)

**PA-FR-001 — Permission-limited operations** — The system shall allow a Platform Admin to perform only the operations explicitly granted, and shall reject all others, including any administrator management. *Status:* Confirmed principle; granted operations Open (OQ-13). *Priority:* M.

### 8.18 Android Application Scope (AN)

**AN-FR-001 — Android scope** — Android is part of the intended direction. Its MVP functionality is **not decided**. No Android features are specified, and offline support is excluded. *Status:* Open (OQ-14). *Priority:* TBD.

---

## 9. Core User Journeys

Common failure rule: every failed operation leaves business data and inventory exactly as before the attempt.

### J-1 Pharmacy setup
- **Actor:** Super Admin, then Owner. **Start:** no business.
- **Main:** business created → Owner signs in → configures profile, currency, tax/discount/rounding rules → creates branches.
- **Alternate:** Owner invited by email (if OQ-11 chooses admin-created).
- **Failure:** duplicate Owner email → nothing created.
- **End state:** active business with ≥ 1 branch and configuration.

### J-2 Employee creation and permissions
- **Actor:** Owner. **Start:** branches exist.
- **Main:** create role → select permissions → create user → assign role and branches → user signs in.
- **Alternate:** edit role later; change applies at next request.
- **Failure:** attempt to exceed own permissions → rejected.
- **End state:** user can perform only permitted actions on assigned branches.

### J-3 Opening-stock entry (manual)
- **Actor:** Owner/inventory user. **Start:** medicines and branch exist.
- **Main:** choose branch → add lines (medicine, batch, expiry, quantity, cost) → save.
- **Alternate:** medicine missing → create it first.
- **Failure:** invalid line → rejected, entry not saved.
- **End state:** batch balances and Opening movements exist.

### J-4 Opening-stock import
- **Actor:** Owner. **Start:** catalog exists (or per OQ-20).
- **Main:** download template → upload file → review valid/invalid rows → accept.
- **Alternate:** correct invalid rows and re-upload; cancel import.
- **Failure:** unreadable file, missing columns, repeated file → rejected/warned; no partial stock.
- **End state:** inventory reflects accepted rows; import is recorded.

### J-5 Supplier setup
- **Actor:** Owner/purchase officer. **Main:** create supplier → save. **Failure:** duplicate warning. **End state:** supplier available for purchases.

### J-6 Purchase entry and invoice upload
- **Actor:** purchase officer. **Start:** supplier exists.
- **Main:** record purchase lines and invoice number → optionally upload invoice document → save.
- **Alternate:** upload later; edit before receipt.
- **Failure:** duplicate invoice number → warning/block; upload fails → purchase remains, retry.
- **End state:** Purchase in Recorded state; **stock unchanged**.

### J-7 Receiving stock
- **Actor:** inventory user. **Start:** purchase Recorded or Partially received.
- **Main:** open purchase → for each line enter received/accepted quantity, batch, expiry → confirm.
- **Alternate:** partial receipt now, remainder later; reject damaged units with reason.
- **Failure:** invalid expiry or over-receipt → rejected; all-or-nothing.
- **End state:** accepted quantities in inventory; movements recorded; purchase status updated.

### J-8 Expiry and low-stock review
- **Actor:** Owner/inventory user. **Main:** open alerts → filter by branch → review low-stock and near-expiry/expired lists → act (reorder, adjust, write off).
- **Empty:** no alerts shows a clear "nothing to review" state. **End state:** user informed; stock changes only via explicit adjustments.

### J-9 Retail billing
- **Actor:** cashier. **Start:** stock available at the branch.
- **Main:** search medicine → add lines → system calculates totals → record payment → save → invoice displayed/printable.
- **Alternate:** remove a line before saving; split payment.
- **Failure:** insufficient stock, expired batch, invalid discount, duplicate submission, server failure → no bill, no deduction (or the original bill returned for duplicates).
- **End state:** invoice issued, stock deducted, payment recorded.

### J-10 Wholesale billing
- As J-9 with buyer details and wholesale pricing; outstanding balance handling per OQ-33.

### J-11 Weekly/monthly reporting
- **Actor:** Owner/manager. **Main:** choose range and branch → view sales metrics and top medicines → optionally export.
- **Empty:** no sales shows zeros and an empty state. **Failure:** report load failure shows an error with retry. **End state:** read-only; no data changed.

---

## 10. Business Rules

Rules are constraints on behavior; implementation choices are deliberately excluded.

| ID | Rule | Why it matters | Status |
|---|---|---|---|
| BR-01 | **Tenant isolation:** every record belongs to exactly one business, and a user can access only their business's data. Tenant identity comes from the authenticated session, never from client input. | Pharmacy financial and stock data must stay private. | Confirmed |
| BR-02 | **Branch scope:** non-owner users act only on branches they are assigned to. Stock belongs to a branch. | Prevents staff from affecting or seeing other branches. | Confirmed (OQ-10) |
| BR-03 | **Permission enforcement:** authorization is enforced by the backend on every request. Hiding UI elements is not security. Viewing a module does not imply any other action in it. | Protects against bypass and privilege escalation. | Confirmed |
| BR-04 | **Medicine vs batch:** a medicine is a master record; stock, expiry and cost exist only on batches. | Expiry and traceability are batch properties. | Confirmed |
| BR-05 | **Invoice vs receipt:** a supplier invoice document and a recorded purchase never change stock. Only a confirmed receipt does. | Paperwork may not match what arrived. | Confirmed |
| BR-06 | **Ordered / received / accepted:** per purchase line, ordered = quantity on the purchase; received = quantity physically delivered; accepted = quantity added to stock. Accepted ≤ received. Stock increases only by accepted. *Relationship to analyze:* **direct purchase record** (recorded after or at delivery) and **purchase order** (ordered before delivery) share the same line fields; a stock receipt is the only stock-changing step in both. MVP proposal: one purchase record with one or more receipts; a separate purchase-order step is deferred unless OQ-5 approves it. | Prevents overstating stock and supports partial deliveries. | Confirmed (no purchase orders in MVP, OQ-5 approved) |
| BR-07 | **Stock balance consistency:** a batch balance equals the sum of its stock movements, never negative, and is changed only through movements. | Auditable inventory. | Confirmed |
| BR-08 | **Expiry eligibility:** expired batches cannot be sold. Sellable through the expiry date and blocked from the next day, with no override (OQ-6 approved). Month/year-only expiry is treated as the last day of that month (to confirm). | Patient safety and legal exposure. | Confirmed (OQ-6 approved; month/year expiry reading to confirm) |
| BR-09 | **Retail vs wholesale pricing:** each bill has a type; the price used depends on the type. Policy is not assumed. | Avoids wrong margins. | Open (OQ-3) |
| BR-10 | **Discount and tax:** applied in a single documented order with one rounding method; limits per role if approved. No tax rates are built in. | Consistent, defensible invoice totals. | Confirmed (formulas Open, OQ-2/3/4) |
| BR-11 | **Invoice history:** issued invoices are immutable and keep the prices, taxes and business details as of issue. Changes are made through returns/cancellations. | Legal and audit integrity. | Proposed |
| BR-12 | **Duplicate prevention:** a repeated bill request creates at most one bill and one deduction. | Prevents double billing and stock loss. | Confirmed |
| BR-13 | **Concurrency:** simultaneous changes to the same batch must not produce negative or lost updates. | Last-unit and busy-counter correctness. | Confirmed |
| BR-14 | **Cancellations/returns:** a bill may be cancelled on the same day or a later day, and items may be returned; each references the original document; stock returns only if the item is eligible; reports show them separately from sales. | Accurate stock and revenue. | Approved in principle; detailed rules Open (OQ-8) |
| BR-15 | **Batch-expiry consistency:** the same medicine and batch number should not carry two different expiry dates without explicit resolution. | Prevents misidentified stock. | Proposed |
| BR-16 | **Retention:** business records are not hard-deleted; deactivation hides them from new work while keeping history. | Audit and reporting. | Proposed (retention period Open, OQ-37) |

---

## 11. Roles and Permissions Matrix

Levels: **V** view, **C** create, **E** edit, **K** confirm, **X** cancel/reverse, **P** manage permissions. "—" = no access. Pharmacy staff columns are examples; the Owner defines real roles. Platform roles are scoped to platform data, not tenant data. Items marked † are unapproved.

| Module / action | Super Admin | Platform Admin | Owner | Branch manager† | Inventory clerk† | Purchase officer† | Cashier† |
|---|---|---|---|---|---|---|---|
| Businesses (list, status) | V, E (status) | per grant† | own business V, E profile | — | — | — | — |
| Platform admins and permissions | C, E, P | — | — | — | — | — | — |
| Global settings | per OQ-13 | per grant† | — | — | — | — | — |
| Branches | — | — | C, E, V | V (assigned) | V (assigned) | V (assigned) | V (assigned) |
| Users and roles | — | — | C, E, V, P | V† | — | — | — |
| Medicine catalog | — | — | C, E, V | C, E, V | C, E, V | V | V |
| Selling prices | — | — | C, E, V | V | V | V | V |
| Opening stock / import | — | — | C, K, V | per grant† | C, K, V | — | — |
| Suppliers | — | — | C, E, V | V | V | C, E, V | — |
| Purchases | — | — | C, E, X, V | V | V | C, E, X, V | — |
| Invoice documents | — | — | C, V | V | V | C, V | — |
| Stock receipt (confirm) | — | — | K, V | K† | K, V | V | — |
| Stock adjustment | — | — | C, K | per grant† | C† | — | — |
| Alerts | — | — | V | V | V | V | V |
| Retail / wholesale billing | — | — | C, V, X | C, V, X† | V | — | C, V |
| Discount above a set limit | — | — | K | K† | — | — | — |
| Returns / cancellations | — | — | X | X† | — | — | per grant† |
| Sales history | — | — | V | V (assigned) | — | — | V (own)† |
| Reports | aggregate only† | — | V | V (assigned) | — | — | — |
| Employee details and activity | — | — | V | V (assigned)† | — | — | — |
| Audit log | per OQ-12† | — | V | — | — | — | — |

Confirmation of approvals: the matrix is **Proposed** except the Owner's and platform rows, which follow the brief. Branch scope is applied on top of every pharmacy row.

---

## 12. Non-Functional Requirements

Targets depend on unknown workloads and are **Proposed** for approval unless noted.

| ID | Category | Requirement | Verification | Status |
|---|---|---|---|---|
| NFR-SEC-01 | Security | All traffic uses HTTPS; credentials and files are never exposed to other tenants or in logs. | Security review; log inspection | Proposed |
| NFR-SEC-02 | Security | Passwords are stored only as salted slow hashes; minimum password policy defined (OQ-19). | Code review; test | Proposed |
| NFR-SEC-03 | Security | Repeated failed sign-ins are rate-limited; API inputs are validated server-side. | Automated test | Proposed |
| NFR-TEN-01 | Tenant isolation | Cross-tenant read/write attempts by authenticated users return no data and an authorization error, in 100% of automated test cases across all endpoints. | Automated isolation test suite | Proposed |
| NFR-DAT-01 | Data consistency | Stock-changing operations are atomic: all-or-nothing, no negative balances under concurrent requests. | Concurrency tests | Proposed |
| NFR-DAT-02 | Data consistency | Each stored invoice total equals the recalculation of its stored lines. | Automated reconciliation | Proposed |
| NFR-PERF-01 | Performance | Medicine search returns within 1 s (p95) for a catalog of up to N medicines (N TBD, OQ-38). | Load test | Open |
| NFR-PERF-02 | Performance | Saving a bill completes within 2 s (p95) under the expected concurrent load (TBD). | Load test | Open |
| NFR-PERF-03 | Performance | Standard reports for a month load within 5 s (p95) at expected data volume (TBD). | Load test | Open |
| NFR-PERF-04 | Limits | Maximum import file size/rows and invoice upload size are defined and enforced (values TBD). | Test | Open |
| NFR-REL-01 | Reliability | A failed operation never leaves partial business data; user receives a clear error. | Fault-injection tests | Proposed |
| NFR-AVL-01 | Availability | Availability target during business hours (TBD, depends on infrastructure/cost). | Monitoring | Open |
| NFR-BKP-01 | Backup/recovery | Regular automated database and document backups; restore tested; RPO/RTO targets set by owner. | Restore drill | Open |
| NFR-AUD-01 | Auditability | Sensitive actions (permissions, stock adjustments, receipts, cancellations, price changes, status changes) record user, time, and before/after values. | Test | Proposed |
| NFR-MNT-01 | Maintainability | Business rules are covered by automated tests tied to acceptance criteria in Section 18. | CI test report | Proposed |
| NFR-SCL-01 | Scalability | Supports growth in businesses, branches and sales volume with no redesign up to targets (TBD). | Load test, review | Open |
| NFR-USA-01 | Usability | A cashier completes a typical bill without training beyond a short walkthrough; keyboard-friendly billing screen. | Usability test | Proposed |
| NFR-LOG-01 | Logging/monitoring | Errors and failed requests are logged with a correlation id, without secrets or personal data; failures are alertable. | Review | Proposed |
| NFR-CMP-01 | Compatibility | Latest two versions of major desktop browsers; Android versions TBD. | Cross-browser test | Open |
| NFR-PWA-01 | Compatibility | The pharmacy web app is a PWA: installable, responsive on tablet/phone. It remains online-only: with no connection it shows a clear offline message and **does not** queue or defer bills, receipts or stock changes. | Install and offline-behavior test | Confirmed (v0.2); "PWA" assumed from the owner's "pwd" — confirm |
| NFR-PRV-01 | Privacy | Personal and business data is collected only as needed, access is permission-controlled, and applicable data-protection obligations are identified (jurisdiction unknown). | Review | Open |

---

## 13. Core Data Requirements

Conceptual only; this is not a schema.

| Entity | What it represents | Why needed | Key rules |
|---|---|---|---|
| Business (tenant) | One pharmacy company | Isolation boundary | Every other record belongs to one business |
| Branch | A physical location of a business | Branch-level stock and sales | Name unique per business |
| User | A person with login | Accountability and access | Email unique platform-wide; belongs to one business (or the platform) |
| Role | Named permission set | Flexible access | Owned by business (or platform) |
| Permission | A single allowed action | Fine-grained control | Fixed catalog defined by product |
| Branch assignment | Link user ↔ branch | Data scope | Many-to-many |
| Medicine | Master product record | Single identity per product | Unique by business-defined key; units and conversions |
| Batch | A medicine lot (batch number, expiry, cost) | Expiry and traceability | Unique by medicine + batch number (+ expiry rule) |
| Inventory balance | Quantity of a batch at a branch | Fast availability check | Derived from, and equal to, the sum of movements |
| Stock movement | Immutable record of a stock change | Traceability | Never edited or deleted; has reference document |
| Supplier | Vendor | Purchasing | Name unique-ish per business |
| Purchase | Recorded supplier purchase | Cost and receipt basis | Supplier + invoice number is unique-ish per business |
| Purchase line | Medicine, ordered quantity, cost, tax | Per-item detail | Ordered/received/accepted tracked |
| Supplier invoice document | Uploaded file | Evidence | Private; linked to a purchase; changes recorded |
| Stock receipt | Confirmed delivery event | The only step that adds purchase stock | Holds received/accepted per line, who, when |
| Customer (retail/wholesale buyer) | Buyer details when needed | Wholesale billing | Depth Open (OQ-32) |
| Sale (invoice) | Bill header | Revenue record | Immutable once issued; sequential numbering per business/branch (OQ-39) |
| Sale line | Medicine, batch, quantity, price, discount, tax | Stock deduction and reporting | Snapshot of price/tax at sale |
| Payment | Money collected on a sale | Collections and outstanding balance | Linked to sale; method and amount |
| Return/cancellation | Reversal referencing a sale | Accurate stock and revenue | Open (OQ-8) |
| Import record | A file import and its outcome | Prevent duplicates, accountability | Not re-applied |
| Audit event | Who did what, when | Accountability | Append-only |

**Retention:** transactional and audit records are retained for a period set by legal/business requirement (OQ-37); deactivation, not deletion, is the default.

---

## 14. Pages and Screens

All pages require authentication and permission checks; on missing permission the page shows a "not authorized" state and the backend rejects the underlying request. All list pages have loading, empty, and error states per Section 15.

### Super Admin Web
| Page | Purpose / main actions |
|---|---|
| Business list | View, search businesses; change status |
| Business detail | View business-level information (not private pharmacy data) |
| Platform admins | Create/deactivate admins; assign permissions |
| Global settings | Only approved settings (Open) |

### Platform Admin Web
| Page | Purpose |
|---|---|
| Business list (limited) | Only as granted (OQ-13) |

### Pharmacy Web — PWA (Owner and staff; installable, online-only; each page appears only with permission)
| Page | Primary user | Main actions |
|---|---|---|
| Sign in | All | Authenticate |
| Dashboard | Owner/manager | Summary of alerts and recent sales (Proposed; minimal) |
| Business profile & billing settings | Owner | Edit details, tax/discount/rounding |
| Branches | Owner | Create/edit/deactivate |
| Users and roles | Owner | Create users, roles, assign branches/permissions |
| Medicine catalog | Inventory/Owner | Create/edit/deactivate, set units and prices |
| Inventory (by branch/batch) | Inventory/Owner | View stock, batches, movements; adjust |
| Opening stock entry | Owner | Manual entry |
| Import | Owner | Upload, review rows, accept, download errors |
| Suppliers | Purchase | Create/edit/deactivate |
| Purchases (list/detail) | Purchase | Record, edit, cancel, attach invoice |
| Receive stock | Inventory | Confirm receipt per line |
| Alerts | Inventory/Owner | Low-stock, near-expiry, expired |
| New bill (retail/wholesale) | Cashier | Search, add lines, pay, save |
| Sales history / invoice view | Cashier/manager | Search, view, print, return/cancel |
| Reports | Owner/manager | Sales, top medicines, filters |
| Employees and activity | Owner | Profiles, history |

### Android
Not defined (OQ-14).

---

## 15. Loading, Empty and Error States

General principle: **a failed or rejected operation saves nothing and changes no stock.** Messages are specific and actionable, and never expose technical internals.

| Situation | User-visible behavior | Data/inventory effect |
|---|---|---|
| Loading lists/reports | Skeleton/progress indicator; controls disabled where needed | None |
| Empty inventory | "No stock yet" with actions to add opening stock or import | None |
| Missing supplier | Purchase form prompts to create a supplier first | None |
| Failed invoice upload | Error with retry; purchase stays saved without document | Purchase kept; stock unchanged |
| Invalid import rows | Review table with reasons; user may fix and re-upload | No stock until accepted |
| Permission failure | "You do not have permission" and, via API, an authorization error | None |
| Invalid billing input | Field-level messages; bill not saved | None |
| Insufficient stock | Names the medicine and the available quantity | No bill, no deduction |
| Expired batch | Expired batches not selectable; message if only expired stock remains | None |
| Duplicate request | The original result is shown; no second bill | One bill, one deduction |
| Network failure | "Connection lost; your action was not confirmed — check history before retrying" | Unknown to the client; server guarantees all-or-nothing and duplicate protection |
| Database failure | Generic error with reference id; retry offered | Transaction rolled back |

---

## 16. Edge Cases and Data Integrity

| ID | Scenario | Expected behavior | Acceptance criteria |
|---|---|---|---|
| EC-01 | Duplicate supplier invoice | Warned or blocked per OQ-23 | Given an existing supplier/invoice number, when re-entered, then the user is warned or blocked and nothing duplicates silently. |
| EC-02 | Partial receipt | Stock increases only by accepted quantity; remainder outstanding | Given 100 ordered and 60 accepted, then balance +60, outstanding 40. |
| EC-03 | Incorrect batch details | Receipt cannot be edited silently; corrections are adjustments with reason | Given a wrong batch number after confirmation, then a recorded correction (movement) fixes it and the original is retained. |
| EC-04 | Invalid expiry date | Past or malformed dates rejected on receipt, import and entry | Given an expiry in the past, then rejection (expired opening stock policy per OQ-6). |
| EC-05 | Import duplication | Same file or same batches flagged; not applied twice without explicit confirmation | Given a second upload of an accepted file, then a warning appears and no stock doubles. |
| EC-06 | Concurrent sale of last unit | Exactly one succeeds | Two simultaneous bills for the last unit → one succeeds, one rejected, balance 0. |
| EC-07 | Incorrect unit conversion | Conversion validated; changes do not alter history | Given a conversion edit, then past sales keep their original base quantities. |
| EC-08 | Duplicate sale request | One bill | Same request key twice → one bill. |
| EC-09 | Failed transaction mid-save | Roll back | Given a failure after partial processing, then no bill, payment or movement exists. |
| EC-10 | Incorrect user permission | Backend rejects | A user without the permission calls the endpoint directly → authorization error, no change. |
| EC-11 | Cross-tenant access | No data returned, same response shape as not-found, attempt logged | Business A user requests a Business B record id → denied; no information disclosed. |
| EC-12 | Return/cancellation affecting stock | Stock restored only if eligible; recorded as movement | Given an eligible return, then balance increases and the movement references the original sale (rules OQ-8). |
| EC-13 | Reports with refunds/cancellations | Shown separately and net figures reconcile | Given a sale then a full return, then net revenue 0 while gross shows the sale and refund shows the return. |
| EC-14 | Deactivated medicine/supplier/branch with history | Hidden from new work, history intact | Past invoices still show deactivated items. |
| EC-15 | Price or tax changed after a bill is issued | Old invoices unchanged | Reopening an old invoice shows original values. |

---

## 17. Integrations and External Dependencies

| Integration | Purpose | Inputs/outputs | Failure handling | Blocks MVP? |
|---|---|---|---|---|
| PostgreSQL | System of record | Transactional data | Operations roll back; clear error | **Yes** |
| Excel/CSV processing | Opening inventory import | .xlsx/.csv in; validation report out | Reject unreadable files; no partial stock | **Yes** |
| Secure file storage | Supplier invoices | PDF/image in; private retrieval | Failed upload keeps purchase; retry | **Yes** (provider Open, OQ-40) |
| Logging/monitoring | Diagnose failures | Structured logs/alerts | Must not block business operations | Proposed for MVP |
| Email service | Account invitations/password reset | Email out | Retry; manual alternative | Open (OQ-19) |
| Payment gateway (subscriptions) | Future monetization | — | — | **Deferred, no** |
| Automated invoice OCR | Auto-reading invoices | — | — | **Deferred, no** |
| Redis / BullMQ | Approved technologies (v0.2); no confirmed requirement depends on them yet | Per use case once defined (e.g., background imports, alert scans) | Accepted work must not be lost; failed jobs visible and retryable | **No**, until a requirement uses them (OQ-41) |
| API documentation (Swagger/OpenAPI) | Approved (v0.2) as developer documentation of the backend API | OpenAPI spec generated from the API | Not user-facing; not exposed publicly in production without protection (NFR-SEC-01) | No |

---

## 18. Acceptance Criteria

Scenario IDs map to requirements; all are verified by automated and/or manual tests against observable behavior.

**AC-01 Stock receipt (SR-FR-001, BR-05, BR-06)**
- Given a recorded purchase with an uploaded invoice, When no receipt is confirmed, Then stock balances are unchanged.
- Given a purchase for 100 units, When a receipt accepts 60, Then the batch balance is +60, a Purchase-receipt movement exists, and the purchase shows 40 outstanding.
- Given a receipt with one invalid line, When confirmed, Then no line changes stock.

**AC-02 Billing (RB-FR-001/002/003)**
- Given configured tax and discount, When a bill is saved, Then stored totals equal an independent recalculation, and the invoice shows each component.
- Given sufficient stock, When a bill is saved, Then each batch decreases by the sold base-unit quantity and a Sale movement exists.
- Given insufficient stock, When submitted, Then rejection with the available quantity and no changes.

**AC-03 Tenant isolation (BR-01)**
- Given users of Business A and B, When A requests any B resource by id (read, update, delete, report, document download), Then access is denied for every endpoint and no B data appears in any response.

**AC-04 Permission enforcement (BR-03)**
- Given a role with view-only on sales, When the user calls create/cancel endpoints directly, Then they are rejected and nothing changes.
- Given a user assigned to Branch A, When they request Branch B stock or sales, Then denied.

**AC-05 Duplicate prevention (RB-FR-004, EC-01, EC-05)**
- Given one request submitted twice with the same key, Then exactly one bill and one stock deduction exist.
- Given an already accepted import file, Then re-upload warns and does not double stock.

**AC-06 Expiry restrictions (AL-FR-003, BR-08)**
- Given a batch expired yesterday, When a bill includes it, Then it is rejected; expired batches never count as available.
- Given a batch inside the near-expiry window, Then it appears in the near-expiry alert list.

**AC-07 Import validation (IM-FR-001..003)**
- Given a file with valid and invalid rows, Then the review lists each invalid row with a reason and no stock exists before acceptance.
- Given acceptance, Then only the permitted rows (per OQ-21) create stock and the import is recorded once.

**AC-08 Reports (RP-FR-001/002)**
- Given a known set of bills, a return and a partial payment, Then gross, discount, net revenue, tax, refunds, collected and outstanding each match hand-calculated values, and medicine ranking matches quantities sold net of returns.
- Given a branch filter, Then only that branch's data (if authorized) is included.

**AC-09 Concurrency (RB-FR-005)**
- Given one unit left, When two bills for it are submitted simultaneously, Then one succeeds, one is rejected, and the balance is never negative.

**AC-10 Platform boundaries (SA-FR-005, PA-FR-001)**
- Given a Platform Admin without a grant, When they request tenant sales data or admin management, Then denied.

---

## 19. MVP and Phased Delivery

### Dependency chain
Business setup → branches → users/roles → medicine catalog → opening inventory (manual/import) → suppliers → purchases → stock receipt → billing → reports. Alerts depend on inventory. Platform administration depends on the business setup only.

### Phases (Proposed)
| Phase | Content | Depends on |
|---|---|---|
| 0 | Resolve blocking open questions (Section 21), choose backend framework, fix pricing/tax/rounding rules | — |
| 1 | Authentication, tenant/branch model, users, roles, permissions, audit foundation; Super Admin and Platform Admin basics | 0 |
| 2 | Medicine catalog, units, opening stock (manual and import) | 1 |
| 3 | Suppliers, purchases, invoice upload, stock receipt, movements, adjustments | 2 |
| 4 | Retail and wholesale billing, payments, invoices, history, returns (if approved) | 2, 3 |
| 5 | Alerts, reports, employee activity | 3, 4 |
| 6 | Hardening: isolation and concurrency test suites, backups, usability test | all |
| Later | Subscriptions, Android scope, offline, OCR, transfers, POs | approvals |

Security, tenant isolation and data-integrity work are part of each phase, not deferrable. Subscription features are excluded from every MVP phase.

---

## 20. Risks and Dependencies

| ID | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R-01 | Pricing, tax, discount and rounding rules undefined | Wrong invoices; rework | High (currently undecided) | Resolve OQ-2/3/4 before billing work; keep rules configurable |
| R-02 | Inventory inconsistency (negative stock, lost updates) | Wrong availability, financial loss | Medium | Movement-based stock, atomic operations, concurrency tests |
| R-03 | Weak tenant isolation | Severe privacy/legal harm | Low if designed in; severe if missed | Isolation by design on every query; automated cross-tenant tests |
| R-04 | Ambiguous branch permissions | Staff see or change wrong data | Medium | Decide OQ-10; test matrix |
| R-05 | Invalid or messy import data | Wrong opening stock | High | Strict validation, review step, templates, rollback |
| R-06 | Scope creep (ERP features, Android, subscriptions) | Delay | Medium | Enforce Section 7 and Section 22 |
| R-07 | Pharmacy regulatory requirements unknown (scheduled drugs, returns, record keeping) | Non-compliance | Unknown | Identify jurisdiction and obligations (OQ-7, OQ-42) |
| R-08 | Online-only operation: outages stop billing | Lost sales | Medium | Availability/backup targets; revisit offline only if approved |
| R-09 | Approved technologies (Redis, BullMQ) without a defined use case | Unneeded complexity or unreliable background jobs | Present | Define the use case first; test failure and retry behavior (C-2) |
| R-10 | Unit-conversion errors | Wrong stock quantities | Medium | Integer conversions, validation, history untouched |

**Dependencies:** product-owner decisions on Section 21; jurisdiction and tax information; file storage provider; hosting decision.

---

## 21. Open Questions and Approval Log

"Blocks" means implementation of the related work must not start until decided. All are **Open** unless noted.

| ID | Question | Why it matters | Options / trade-offs | Recommendation | Blocks | Decision status (v0.3) |
|---|---|---|---|---|---|---|
| OQ-1 | How is stock tracked: batch-level for all medicines, or optional per medicine? | Data model, billing | (a) always batch-level — simpler rules, more entry; (b) optional — flexible, more complexity | (a) | Data model | Approved (owner, v0.3) — recommendation adopted |
| OQ-2 | Discount and tax calculation order, rounding method (per line vs per invoice) | Invoice totals | per-line rounding vs invoice-level rounding; tax-inclusive vs exclusive prices | Decide with accountant | Billing | Open — decide with accountant |
| OQ-3 | Retail vs wholesale pricing model (separate prices, tiered, discount off retail) | Revenue correctness | separate fields vs percentage rule vs quantity tiers | Separate wholesale price per medicine for MVP | Billing | Approved (owner, v0.3) — recommendation adopted |
| OQ-4 | Discount authority (per-role limits, owner approval) | Fraud/loss control | no limits vs role limits vs approval step | Role-based limit | Billing | Approved (owner, v0.3) — recommendation adopted |
| OQ-5 | Purchase orders in MVP, or direct purchase records only? | Purchasing data model | direct-only simpler; PO adds ordering workflow | Direct purchase records + receipts | Purchasing | Approved (owner, v0.3) — recommendation adopted |
| OQ-6 | Expiry boundary (sellable on expiry date?), expired opening stock, any override | Safety | strict block vs owner override | Strict block, no override | Billing, inventory | Approved (owner, v0.3) — recommendation adopted |
| OQ-7 | Medicine regulatory attributes (prescription-only, schedule, narcotics register) | Compliance | exclude vs flag only vs full register | Research jurisdiction first | Catalog | Open — research jurisdiction first |
| OQ-8 | Returns and cancellations: allowed when, restock rules, refund records | Stock and revenue | no MVP returns vs cancel-only vs full returns | Cancel same-day + defined returns; confirm regulations | Billing, reports | Approved in principle — regulations to be confirmed before returns are built |
| OQ-9 | Stock adjustments and opening-stock window | Auditable corrections | adjustments always allowed with reason vs restricted | Allowed with reason and permission | Inventory | Approved (owner, v0.3) — recommendation adopted |
| OQ-10 | Branch permission model: are permissions global to a role, or per branch? | Security design | role global + branch scope vs per-branch role | Role global + branch assignment | Users | Approved (owner, v0.3) — recommendation adopted |
| OQ-11 | How are businesses created: Super Admin only, or self-signup | Onboarding | admin-created vs self-registration | Admin-created for MVP | Setup | Approved (owner, v0.3) — recommendation adopted |
| OQ-12 | May platform roles ever view tenant data (support)? | Privacy | never vs audited, time-limited, consented access | Never in MVP | Admin | Approved (owner, v0.3) — recommendation adopted |
| OQ-13 | Exact Platform Admin capabilities and global settings | Authorization | list per need | Define minimal list | Admin | Approved (owner, v0.3) — recommendation adopted |
| OQ-14 | Android MVP scope; app structure for the Super Admin and Platform Admin web (pharmacy web is a PWA) | Scope | none yet vs billing-only vs inventory-only | Defer Android after web MVP | Android | Approved (owner, v0.3) — recommendation adopted |
| OQ-15 | Multi-business sharing of users (one person at two businesses)? | Account model | one business per user vs multiple | One business per user | Users | Approved (owner, v0.3) — recommendation adopted |
| OQ-16 | Currency, locale, time zone | Display and totals | single per business | Per-business setting | Billing | Approved (owner, v0.3) — recommendation adopted |
| OQ-17 | Backend framework | Delivery | — | **CLOSED (v0.2): Express** | — | Closed (Express) |
| OQ-18 | Branch deactivation with remaining stock/open work | Integrity | block vs transfer vs allow | Block until stock is resolved | Branches | Approved (owner, v0.3) — recommendation adopted |
| OQ-19 | Password reset, MFA, email delivery | Security | email reset vs admin reset | Email reset; MFA later | Auth | Approved (owner, v0.3) — recommendation adopted |
| OQ-20 | Import: unknown medicines — reject, auto-create or map | Import design | reject simple; auto-create fast but error-prone | Reject with clear message | Import | Approved (owner, v0.3) — recommendation adopted |
| OQ-21 | Import acceptance: valid rows only vs all-or-nothing | Import design | partial convenient; all-or-nothing safe | Owner chooses valid-only with explicit confirmation | Import | Approved (owner, v0.3) — recommendation adopted |
| OQ-22 | Invoice total differing from line sum | Purchase accuracy | block vs allow with note | Allow with visible difference | Purchasing | Approved (owner, v0.3) — recommendation adopted |
| OQ-23 | Duplicate supplier invoice: warn or block | Duplicates | warn vs block | Block unless explicitly overridden | Purchasing | Approved (owner, v0.3) — recommendation adopted |
| OQ-24 | Correcting confirmed receipts/purchases | Integrity | adjustments only vs reversal | Adjustment/reversal records | Receiving | Approved (owner, v0.3) — recommendation adopted |
| OQ-25 | Over-receipt beyond ordered quantity | Stock | block vs allow with reason | Allow with reason | Receiving | Approved (owner, v0.3) — recommendation adopted |
| OQ-26 | Same batch number with different expiry | Integrity | block vs warn | Block unless resolved | Receiving | Approved (owner, v0.3) — recommendation adopted |
| OQ-27 | Low-stock thresholds per medicine or per branch | Alerts | global vs per branch | Per medicine per branch | Alerts | Approved (owner, v0.3) — recommendation adopted |
| OQ-28 | Near-expiry window default | Alerts | 30/60/90 days | Owner-configurable; no assumed default | Alerts | Approved (owner, v0.3) — recommendation adopted |
| OQ-29 | Alert notifications beyond in-app | Scope | none vs email | In-app only for MVP | Alerts | Approved (owner, v0.3) — recommendation adopted |
| OQ-30 | Batch selection when selling (FEFO, manual) | Waste reduction | FEFO auto vs manual choice | FEFO default, manual override if permitted | Billing | Approved (owner, v0.3) — recommendation adopted |
| OQ-31 | Payment methods, change/overpayment, credit sales on retail | Payments | cash/card/UPI/other | Owner-defined list | Billing | Approved (owner, v0.3) — recommendation adopted |
| OQ-32 | Customer data (retail and wholesale; name, contact, tax id, credit limit); now also required for per-customer analysis (RP-FR-005) | Customer model, privacy | minimal vs full records; optional vs mandatory on retail bills | Minimal fields; optional on retail; privacy handling per jurisdiction | Billing, reports | Approved (owner, v0.3) — recommendation adopted |
| OQ-33 | Wholesale credit terms and outstanding balances | Finance | cash-only vs credit tracking | Define if required | Billing | Open — owner input needed |
| OQ-34 | What counts as employee "activity" | Reporting, privacy | all actions vs business actions only | Business actions | Reports | Approved (owner, v0.3) — recommendation adopted |
| OQ-35 | Profit calculation basis (average cost, FIFO, batch cost) | Report accuracy | batch cost vs average | Batch cost | Reports | Approved (owner, v0.3) — recommendation adopted |
| OQ-36 | Meaning of "medicines purchased by customers" analysis | Reports, customer model | — | **CLOSED (v0.2): both aggregate and per-customer** (see RP-FR-005) | — | Closed (aggregate and per-customer) |
| OQ-37 | Data retention period and legal record-keeping | Compliance | per local law | Confirm jurisdiction | Data | Open — needs legal/jurisdiction input |
| OQ-38 | Expected scale (businesses, branches, users, medicines, bills per day) | NFR targets | — | Provide estimates | NFR | Open — owner to provide estimates |
| OQ-39 | Invoice numbering format and scope | Legal/ops | per business vs per branch | Per branch, prefixed | Billing | Approved (owner, v0.3) — recommendation adopted |
| OQ-40 | Invoice file storage provider | Deployment | managed object storage vs local | Managed private storage | Upload | Approved (owner, v0.3) — recommendation adopted |
| OQ-41 | Are very large imports expected (justifying background processing)? | Infrastructure | synchronous vs background job | Synchronous unless proven needed | Import | Approved (owner, v0.3) — recommendation adopted |
| OQ-42 | Operating jurisdiction, tax law and pharmacy regulations | Compliance, tax | — | Identify first | Many | Open — owner to identify jurisdiction |

**Approval log (v0.3):** the owner approved the recommendations in the table above, except where the status column says Open. Specific decisions are summarized below. Requirements that depended on an approved question are now Confirmed, but anything still waiting on OQ-2, OQ-7, OQ-8 (regulations), OQ-33, OQ-37, OQ-38 or OQ-42 must not be built yet.

| Item | Decision | Decided by | Date |
|---|---|---|---|
| Backend framework is Express (closes C-1, OQ-17) | Approved | Product owner | 2026-10-20 |
| Redis, BullMQ, Swagger approved as technologies (C-2) | Approved; use cases still to be defined | Product owner | 2026-10-20 |
| Customer analysis is both aggregate and per-customer (closes OQ-36) | Approved | Product owner | 2026-10-20 |
| Pharmacy-side web is a PWA (C-3, NFR-PWA-01) | Approved; "PWA" wording to confirm | Product owner | 2026-10-20 |
| OQ-1: stock is always batch-level | Approved | Product owner | 2026-10-20 |
| OQ-2: tax/discount order and rounding | Deferred — decide with accountant; billing totals cannot be built until decided | Product owner | 2026-10-20 |
| OQ-3: separate wholesale price per medicine | Approved | Product owner | 2026-10-20 |
| OQ-4: role-based discount limits (limit values set by Owner as configuration) | Approved | Product owner | 2026-10-20 |
| OQ-5: direct purchase records plus receipts; no purchase orders in MVP | Approved | Product owner | 2026-10-20 |
| OQ-6: expired batches strictly blocked, no override; sellable through the expiry date; month/year expiry read as the last day of that month (to confirm) | Approved | Product owner | 2026-10-20 |
| OQ-7: regulatory medicine attributes | Open — research jurisdiction first | Product owner | 2026-10-20 |
| OQ-8: same-day cancellation, cancellation on later days, and defined returns | Approved in principle (updated v0.4); rules to be set once regulations are confirmed | Product owner | 2026-10-20 |
| OQ-2: tax/discount order and rounding | Remains with the accountant | Product owner | 2026-10-20 |
| OQ-19: password reset by email; MFA later | Approved (confirmed v0.4) | Product owner | 2026-10-20 |
| OQ-30: FEFO (first-expiry-first-out) is the default batch selection; manual override for users with permission ("EFO" read as FEFO) | Approved (confirmed v0.4) | Product owner | 2026-10-20 |
| OQ-9: stock adjustments allowed with a reason and permission | Approved | Product owner | 2026-10-20 |
| OQ-10: role permissions are global; branch assignment sets scope | Approved | Product owner | 2026-10-20 |
| OQ-11: businesses are created by the Super Admin in MVP | Approved | Product owner | 2026-10-20 |
| OQ-12: platform roles never see tenant data in MVP | Approved | Product owner | 2026-10-20 |
| OQ-13: Platform Admin gets a minimal list: view business list and business-level details, onboarding help; no status changes, admin management or settings | Approved | Product owner | 2026-10-20 |
| OQ-14: Android deferred until after the web MVP | Approved | Product owner | 2026-10-20 |
| OQ-15: one business per user | Approved | Product owner | 2026-10-20 |
| OQ-16: currency, locale and time zone are per-business settings | Approved | Product owner | 2026-10-20 |
| OQ-18 to OQ-41 (except OQ-33, OQ-37, OQ-38): recommendations in the table adopted | Approved | Product owner | 2026-10-20 |

---

## 22. Guidance for Future Coding Agents

Future agents must:

1. Read and follow the **approved** PRD; a draft is not authority for open items.
2. Respect confirmed scope and explicit exclusions (Section 7). Subscriptions and offline billing are out of scope.
3. Not add functionality that is not approved. A **Proposed** requirement is not approval to implement it.
4. Follow the business rules in Section 10.
5. Enforce tenant isolation and permissions on the backend for every request; never rely on the UI or client-supplied tenant ids.
6. Preserve data integrity and transaction history: stock changes only through movements, issued invoices are immutable, and operations are atomic.
7. Implement the required validation and the error/empty/loading states in Sections 15 and 16.
8. Test each requirement against its acceptance criteria (Section 18) and report which criteria pass.
9. Flag unresolved decisions (Section 21) to the product owner instead of inventing behavior, particularly for pricing, tax, rounding, returns and expiry.
10. Not modify unrelated functionality.
11. Build the backend with Express. Redis, BullMQ and Swagger are approved technologies, but a feature may use them only where a confirmed requirement needs it; do not invent features to use them. Do not add microservices or other extra infrastructure without approval. The pharmacy web app is a PWA that remains online-only.
12. Not treat the existence of configuration or dependencies as evidence that a feature exists.
