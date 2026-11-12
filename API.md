# Pharma ERP — API Specification

| Field | Value |
|---|---|
| Version | 0.1 (draft) |
| Matches | `PRD.md` v0.4, `ARCHITECTURE.md` v0.1, `DATABASE.md` v0.1 |
| Purpose | How the front ends and the backend communicate, and how the backend talks to external services |
| Status | Draft. Items marked **[Pending OQ-n]** depend on open PRD questions and must not be built until decided. |

This document defines contracts in tables and prose. It contains no code. The machine-readable contract is the OpenAPI document generated from the shared validation schemas (ARCHITECTURE 9.2); where the two ever differ, **the schemas are authoritative** and this document is corrected.

---

## 1. Scope and Principles

1. **Only required APIs.** Every endpoint traces to a PRD requirement. Nothing is added "in case".
2. **Authorization is server-side, always.** The UI hides controls for convenience; every request is authenticated and authorized by the backend (PRD BR-03).
3. **The tenant comes from the session, never from the request.** No path, query, header or body field selects a business (PRD BR-01).
4. **No secrets reach the client.** Browsers receive only an opaque, signed session cookie and non-secret public settings. Provider credentials, signing keys and database credentials exist only on the server.
5. **One convention set** for formats, errors, pagination, idempotency and concurrency across all endpoints.
6. **Integrations are fault-tolerant.** Every external call has a timeout, bounded retries where safe, and a defined user-visible outcome that never leaves business data half-changed.
7. **Stock- and money-changing calls are idempotent** and all-or-nothing (PRD RB-FR-004, BR-12).

---

## 2. Surfaces and Base Paths

| Surface | Base path | Realm | Consumers |
|---|---|---|---|
| Tenant API | `/api/v1` | Tenant (Owner, staff) | Pharmacy PWA |
| Platform API | `/api/v1/platform` | Platform (Super Admin, Platform Admin) | Platform admin web |
| Operations | `/health/live`, `/health/ready` | None | Load balancer, monitoring |
| Documentation | `/api/docs`, `/api/openapi.json` | Development and staging only; disabled or authenticated in production | Developers |

The Android client (deferred, PRD OQ-14) will use the same versioned tenant API; no Android-specific endpoints are defined.

---

## 3. Common Conventions

### 3.1 Transport and formats
| Topic | Rule |
|---|---|
| Protocol | HTTPS only; plain HTTP redirects or is refused |
| Content type | `application/json; charset=utf-8`; `multipart/form-data` only on the upload endpoints listed in Section 7 |
| Identifiers | UUID strings |
| Dates | Date-only fields (invoice date, expiry date) as `YYYY-MM-DD`; moments in time as ISO-8601 UTC with `Z`. The business time zone is applied only for display and report boundaries |
| Money | **Decimal strings** (e.g., `"125.50"`), never floating-point numbers; currency comes from the business |
| Quantities | Integers in the **base unit** unless a field explicitly says it is in a selling unit (sale line input carries `unitName` plus `quantity`; the server converts) |
| Unknown fields | Rejected with a validation error (no silent ignoring) |
| Request size | Body limit enforced for JSON; separate limits for uploads |
| Request ID | Server generates one per request, returns it in the `X-Request-Id` header and in every error body; clients quote it to support |
| Caching | Authenticated responses are not cacheable (`no-store`); static front-end assets are served separately |

### 3.2 Success responses
| Case | Status | Body |
|---|---|---|
| Read one | 200 | `data` object |
| Read list | 200 | `data` array plus `meta` (pagination) |
| Create | 201 | `data` object, plus `Location` header |
| Action with no returned resource | 204 | None |
| Accepted for later processing | 202 | `data` with a status (used only where noted) |
| Idempotent replay | Same status as the original | Original `data`; header `Idempotent-Replayed: true` |

### 3.3 Error responses (one shape everywhere)
Every non-2xx response has an `error` object with:
- `code`: stable machine-readable string (the frontend maps codes to DESIGN.md messages).
- `message`: short human-readable, safe to display.
- `fieldErrors`: optional list of `{field, code, message}` for validation failures (field paths use dotted notation, with indexes for array lines, e.g. `lines.2.quantity`).
- `details`: optional safe structured data for business errors (for example the medicine and available quantity on insufficient stock).
- `requestId`.

Never present in errors: stack traces, SQL, internal paths, internal identifiers of other records, or other tenants' data.

| HTTP | Meaning | Example codes |
|---|---|---|
| 400 | Malformed request | `malformed_request` |
| 401 | Not authenticated | `unauthenticated`, `session_expired` |
| 403 | Authenticated but not permitted | `forbidden`, `branch_not_permitted`, `csrf_invalid`, `business_suspended`, `account_deactivated` |
| 404 | Not found **or not visible to this tenant** (identical responses; PRD EC-11) | `not_found` |
| 409 | State or concurrency conflict | `version_conflict`, `insufficient_stock`, `batch_expired`, `duplicate_invoice`, `duplicate_record`, `invalid_state`, `request_in_progress`, `already_applied` |
| 413 | Payload too large | `payload_too_large` |
| 415 | Unsupported media or file type | `unsupported_media_type` |
| 422 | Validation failed or business rule violated | `validation_failed`, `idempotency_key_reuse`, `discount_not_permitted`, `wholesale_price_missing`, `payment_exceeds_total`, `accepted_exceeds_received`, `invalid_expiry`, `unit_conversion_invalid` |
| 429 | Rate limited | `rate_limited` (with `Retry-After`) |
| 500 | Unexpected failure | `internal_error` (with request ID) |
| 502/503 | A required dependency is unavailable | `dependency_unavailable`, `service_unavailable` |

Status choice rule: **422** when the request is well-formed but violates validation or a business rule; **409** when the request conflicts with the current state of the data. Insufficient stock and duplicate invoice are 409 because they depend on current state.

### 3.4 Validation
- Every endpoint validates **params, query and body** against its schema before any business logic runs; the same schemas generate the OpenAPI document and the front-end types (ARCHITECTURE 9.2).
- Validation is strict: types, ranges, string length limits, enumerations, decimal precision, date validity, and quantity positivity (mirroring DATABASE.md checks).
- Business-rule validation (stock, expiry, permissions on specific values such as discount level) happens in the service layer inside the transaction, so it sees current data.
- Client-side validation is a convenience only; the server result is final.

### 3.5 Pagination, filtering, sorting
| Use | Style | Parameters | Response `meta` |
|---|---|---|---|
| Most lists (medicines, suppliers, purchases, sales, users…) | **Page-based** | `page` (from 1), `pageSize` (default 25, maximum 100) | `page`, `pageSize`, `total`, `totalPages` |
| Append-heavy histories (stock movements, audit events, user activity) | **Cursor-based** | `cursor`, `limit` (default 50, maximum 200) | `nextCursor` (absent at the end) |
| Sorting | Whitelisted fields only | `sort=field` or `sort=-field` (descending) | — |
| Filtering | Explicit named parameters per endpoint (listed in Section 6); free search via `q` | e.g., `from`, `to`, `branchId`, `status` | Active filters echoed back |
| Date ranges | Inclusive `from` and `to` dates interpreted in the **business time zone** | | |

Unknown sort or filter fields are rejected, not ignored. Page size and cursor limits are enforced server-side.

### 3.6 Idempotency
`Idempotency-Key` header (client-generated unique value, one per user intent) is **required** on the endpoints marked **Idem** in Section 6. Behavior:
| Situation | Result |
|---|---|
| First request | Processed; the key, request fingerprint and response are stored (DATABASE `idempotency_keys`) |
| Same key, same request, already completed | Original response replayed with `Idempotent-Replayed: true`; **no second record or stock change** |
| Same key, still processing | 409 `request_in_progress`; the client waits and retries with the same key |
| Same key, different request | 422 `idempotency_key_reuse` |
| Missing key on a required endpoint | 400 `malformed_request` |
Keys are scoped per business and endpoint and expire after the configured retention (Section 11). After a timeout or network failure the client **must retry with the same key** (DESIGN.md 10.9).

### 3.7 Concurrency control
Updatable resources return a `version`. Update requests send the version they edited; a mismatch returns 409 `version_conflict` and the client shows the "updated by another user" state (DESIGN.md 10.6). Stock deductions use atomic guarded updates inside the transaction (DATABASE 4.4), independent of versions.

### 3.8 Actions
State changes with business meaning are explicit `POST` actions on a resource (confirm receipt, cancel, deactivate, reactivate, accept import), not generic field updates. Actions return the updated resource.

---

## 4. Authentication

### 4.1 Mechanism
- Sign-in with email and password is handled by **Better Auth** (ARCHITECTURE 7.2) and creates a **server-side session** (DATABASE 4.8). The browser receives an opaque, HMAC-signed identifier in a cookie that is **HTTP-only, Secure, SameSite, path-restricted**, and **different for the tenant and platform realms** (two Better Auth instances with separate cookie names, paths and tables).
- No tokens in `localStorage`, query strings or response bodies. The session token is stored server-side as issued and is only usable inside a cookie signed with the server secret; reset tokens are single-use and expiring.
- Idle and absolute session timeouts apply (Section 11). Activity extends the idle timeout only; the absolute limit is enforced by an application check on `absolute_expires_at`.
- **CSRF protection:** Better Auth validates the `Origin` of every state-changing request (`POST`, `PATCH`, `PUT`, `DELETE`) against the trusted origin list (the CORS allowlist, Section 11), and the cookie is `SameSite`. A failed check returns 403 `csrf_invalid`. There is no separate CSRF token or `X-CSRF-Token` header. Safe methods (`GET`) never change state.
- **CORS:** explicit allowlist of the pharmacy and admin web origins, with credentials allowed only for those origins; no wildcard (Section 11).
- Password rules per PRD NFR-SEC-02 (policy values **[Pending OQ-19 detail]**). MFA is a later phase; the sign-in contract leaves room for a second step (`mfa_required` outcome reserved, not implemented).

### 4.2 Authentication endpoints

| Method | Path | Purpose | Auth | Notes |
|---|---|---|---|---|
| POST | `/auth/sign-in/email` | Sign in (tenant realm) | None | Better Auth route. Before-hooks check lockout, user active and **business Active**; generic failure message; throttled; sets the session cookie |
| POST | `/auth/sign-out` | End the current session | Session | Deletes the session record |
| POST | `/auth/revoke-sessions` | End all of the user's sessions | Session | |
| GET | `/auth/session` | App endpoint: current user, business summary, permission codes, branch list | Session | Built on Better Auth's session lookup; permission list is for UI visibility only |
| POST | `/auth/change-password` | Change own password | Session | Requires current password; revokes other sessions |
| POST | `/auth/request-password-reset` | Request a reset email | None | Same neutral response whether or not the email exists; throttled per email and IP |
| POST | `/auth/reset-password` | Set a new password with a single-use token | None | Token expires; revokes all sessions on success |
| POST | `/platform/auth/sign-in/email` | Sign in (platform realm) | None | Same rules; separate instance, cookie and user store |
| POST | `/platform/auth/sign-out`, `/platform/auth/revoke-sessions`, `GET /platform/auth/session`, `/platform/auth/change-password`, `/platform/auth/request-password-reset`, `/platform/auth/reset-password` | Platform equivalents | As above | |

Login failures use one message for unknown email, wrong password and locked account; repeated failures lock the account temporarily (PRD NFR-SEC-03).

---

## 5. Authorization

### 5.1 Evaluation order (every request)
1. Resolve session → user, realm, business.
2. Reject if the user is deactivated or the **business is suspended** (403 `account_deactivated` / `business_suspended`); this takes effect on the very next request (PRD BB-FR-004, UM-FR-003).
3. Reject realm mismatch (a platform session cannot call tenant routes and vice versa).
4. Check the route's required **permission code** against the user's role.
5. For branch-scoped data, check the **branch** is in the user's assignment (Owner is business-wide).
6. Load the resource **within the tenant**; a record outside the tenant is `404`.
7. Services re-check sensitive rules (discount limit, batch override, adjustment, role-editor limits).

### 5.2 Permission codes (Proposed catalog)
Format `module.action`, defined once in the shared contracts and mirrored in the PRD matrix (Section 11).

| Module | Codes |
|---|---|
| business | `business.view`, `business.edit` |
| branches | `branches.view`, `branches.manage` |
| users | `users.view`, `users.create`, `users.edit`, `users.deactivate`, `roles.manage` (create/edit/delete roles and permissions) |
| catalog | `medicines.view`, `medicines.create`, `medicines.edit`, `prices.edit` |
| inventory | `inventory.view`, `inventory.opening_stock`, `inventory.import`, `inventory.adjust`, `alerts.view` |
| suppliers | `suppliers.view`, `suppliers.manage` |
| purchasing | `purchases.view`, `purchases.create`, `purchases.edit`, `purchases.cancel`, `documents.upload`, `receipts.confirm` |
| sales | `sales.view`, `sales.view_all` (all users' bills rather than own), `sales.create`, `sales.cancel`, `sales.return`, `sales.override_batch`, `sales.approve_discount` |
| customers | `customers.view`, `customers.manage`, `customers.anonymize` |
| reports | `reports.sales`, `reports.medicines`, `reports.customers` |
| people | `employees.view`, `employees.activity` |
| audit | `audit.view` |

Platform permissions (Platform Admin, minimal list per PRD OQ-13): `platform.businesses.view`, `platform.onboarding.assist`. Super Admin holds all platform permissions, including status change and administrator management, which are **Super-Admin-only** and not grantable.

Discount authority is not a permission code: the role's `max_discount_percent` limits what a user may apply; amounts above need `sales.approve_discount` (PRD OQ-4).

### 5.3 Rules
- A role editor cannot grant a permission they do not hold (PRD UM-FR-002).
- View permission never implies another action (PRD Section 11).
- Responses to forbidden cross-tenant records are indistinguishable from not-found.
- Platform endpoints never return tenant sales, invoices, stock or purchase data (PRD SA-FR-005).

---

## 6. Endpoint Catalog

Legend — **Perm**: required permission code(s). **Idem**: requires `Idempotency-Key`. **Branch**: the request's branch must be in the user's scope. Branch is passed as `branchId` in the query (reads) or body (writes), never in the path. All list endpoints support the pagination conventions of 3.5 unless stated.

### 6.1 Business, branches, settings (PRD BB-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/business` | Own business profile and settings | `business.view` |
| PATCH | `/business` | Edit profile, invoice details, near-expiry window, locale/time zone; currency locked once sales exist; billing rules apply to future bills only **[Pending OQ-2]** | `business.edit` |
| GET | `/branches` | List branches (scoped to the user) | `branches.view` |
| POST | `/branches` | Create branch | `branches.manage` |
| GET / PATCH | `/branches/{id}` | Read / edit branch | `branches.view` / `branches.manage` |
| POST | `/branches/{id}/deactivate`, `/reactivate` | Change branch availability; blocked while stock or open work remains (PRD OQ-18) | `branches.manage` |
| GET / POST / PATCH | `/tax-rates`, `/tax-rates/{id}` | Tax rates (owner-supplied) **[Pending OQ-2, OQ-42]** | `business.view` / `business.edit` |
| GET / POST / PATCH | `/payment-methods`, `/payment-methods/{id}` | Owner-defined payment methods | `business.view` / `business.edit` |

### 6.2 Users, roles, employees (PRD UM-FR, EA-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/users` | List users (filters: `status`, `roleId`, `branchId`, `q`) | `users.view` |
| POST | `/users` | Create user with role and branches | `users.create` |
| GET / PATCH | `/users/{id}` | Read / edit (role, branches, details) | `users.view` / `users.edit` |
| POST | `/users/{id}/deactivate`, `/reactivate` | Immediately revoke / restore access; sessions revoked | `users.deactivate` |
| GET | `/users/{id}/activity` | Permitted activity history (cursor; filters `from`, `to`, `branchId`) | `employees.activity` |
| GET | `/roles` | List roles | `users.view` |
| POST | `/roles` | Create role with permission codes and optional discount limit | `roles.manage` |
| GET / PATCH | `/roles/{id}` | Read / edit | `users.view` / `roles.manage` |
| DELETE | `/roles/{id}` | Delete an unassigned role (409 if users hold it) | `roles.manage` |
| GET | `/permissions` | The permission catalog (for the role editor) | `roles.manage` |

### 6.3 Catalog (PRD MC-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/medicines` | List/search (filters `q`, `isActive`, `dosageForm`) | `medicines.view` |
| POST | `/medicines` | Create medicine with units and prices; duplicate warning returned as `details` unless `confirmDuplicate` is true | `medicines.create` |
| GET / PATCH | `/medicines/{id}` | Read / edit; unit and price changes need `prices.edit` | `medicines.view` / `medicines.edit` |
| POST | `/medicines/{id}/deactivate`, `/reactivate` | Availability for new purchases and sales | `medicines.edit` |
| PUT | `/medicines/{id}/thresholds/{branchId}` | Set low-stock threshold for a branch | `medicines.edit`, **Branch** |
| GET | `/sellable-medicines` | Billing search: matching active medicines with units, retail/wholesale prices, tax rate and **available non-expired quantity** with FEFO batch suggestion. Params: `branchId`, `q`, `saleType` | `sales.create`, **Branch** |

### 6.4 Inventory, alerts (PRD OI-, AL-, SR-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/inventory` | Stock by medicine for a branch (filters `branchId` required, `q`, `status`: low, near_expiry, expired, out) | `inventory.view`, **Branch** |
| GET | `/inventory/medicines/{medicineId}` | Batches and quantities for a medicine at a branch | `inventory.view`, **Branch** |
| GET | `/batches/{id}` | Batch detail | `inventory.view` |
| GET | `/stock-movements` | Movement history (cursor; filters `branchId`, `batchId`, `medicineId`, `type`, `from`, `to`) | `inventory.view`, **Branch** |
| POST | `/inventory/opening-stock` | Manual opening stock lines for a branch (**Idem**, all-or-nothing) **[Pending OQ-9 window rule]** | `inventory.opening_stock`, **Branch** |
| POST | `/inventory/adjustments` | Adjust/write off a batch quantity with required reason (**Idem**) | `inventory.adjust`, **Branch** |
| GET | `/alerts/low-stock`, `/alerts/near-expiry`, `/alerts/expired` | Alert lists for a branch (`branchId`, `q`) | `alerts.view`, **Branch** |

### 6.5 Opening-stock import (PRD IM-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/inventory-imports/template` | Download the import template | `inventory.import` |
| POST | `/inventory-imports` | Upload file (multipart: `file`, `branchId`) → parses and **stages**; no stock created. 201 with summary | `inventory.import`, **Branch** |
| GET | `/inventory-imports` | Past imports | `inventory.import` |
| GET | `/inventory-imports/{id}` | Summary: status, counts, repeated-file warning | `inventory.import` |
| GET | `/inventory-imports/{id}/rows` | Review rows (filter `status`) | `inventory.import` |
| GET | `/inventory-imports/{id}/errors` | Download invalid rows with reasons (CSV) | `inventory.import` |
| POST | `/inventory-imports/{id}/accept` | Apply the import per policy (**Idem**, atomic); requires `confirmRepeat` for a repeated file; 409 `already_applied` if applied | `inventory.import` |
| POST | `/inventory-imports/{id}/cancel` | Discard a staged import | `inventory.import` |

### 6.6 Suppliers (PRD SU-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET / POST | `/suppliers` | List (filters `q`, `isActive`) / create (duplicate warning) | `suppliers.view` / `suppliers.manage` |
| GET / PATCH | `/suppliers/{id}` | Read / edit | `suppliers.view` / `suppliers.manage` |
| POST | `/suppliers/{id}/deactivate`, `/reactivate` | Availability for new purchases | `suppliers.manage` |

### 6.7 Purchasing and receiving (PRD PU-, IU-, SR-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/purchases` | List (filters `branchId`, `supplierId`, `status`, `from`, `to`, `q` for invoice number) | `purchases.view`, **Branch** |
| POST | `/purchases` | Record a purchase with lines; **does not change stock**; duplicate supplier invoice → 409 `duplicate_invoice` unless `duplicateOverride` is set (PRD OQ-23) | `purchases.create`, **Branch** |
| GET | `/purchases/{id}` | Detail including ordered / received / accepted per line, receipts, documents | `purchases.view` |
| PATCH | `/purchases/{id}` | Edit an unreceived purchase; confirmed lines change only via corrections **[Pending OQ-24]** | `purchases.edit` |
| POST | `/purchases/{id}/cancel`, `/close` | Cancel unreceived purchase / close with reason | `purchases.cancel` |
| POST | `/purchases/{id}/documents` | Upload supplier invoice (multipart); stock unchanged | `documents.upload` |
| GET | `/purchases/{id}/documents` | List documents | `purchases.view` |
| GET | `/purchases/{id}/documents/{docId}/download` | Authorized, short-lived access to the file | `purchases.view` |
| DELETE | `/purchases/{id}/documents/{docId}` | Soft-remove (recorded) | `documents.upload` |
| POST | `/purchases/{id}/receipts` | **Confirm receipt**: per line received/accepted, batch, expiry, reason; atomic; **Idem**; creates stock (PRD BR-05) | `receipts.confirm` |
| GET | `/purchases/{id}/receipts` | Receipt history | `purchases.view` |

### 6.8 Customers (PRD OQ-32, RP-FR-005) **[Pending OQ-32, OQ-42]**
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET / POST | `/customers` | List (`q`, `isActive`) / create | `customers.view` / `customers.manage` |
| GET / PATCH | `/customers/{id}` | Read / edit | `customers.view` / `customers.manage` |
| POST | `/customers/{id}/anonymize` | Erase personal fields; sales retained | `customers.anonymize` |

### 6.9 Sales (PRD RB-, WB-, SH-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| POST | `/sales` | **Create a bill** (retail or wholesale): lines (medicine, unit, quantity, optional batch override, discount), customer (required for wholesale), payments. Server computes all totals, selects batches FEFO, deducts stock, allocates the invoice number. **Idem**, atomic. Returns the issued invoice | `sales.create`, **Branch**; override needs `sales.override_batch`; excess discount needs `sales.approve_discount` |
| GET | `/sales` | History (filters `branchId`, `from`, `to`, `saleType`, `status`, `customerId`, `createdBy`, `q` for invoice number). Without `sales.view_all`, only the user's own bills | `sales.view`, **Branch** |
| GET | `/sales/{id}` | Invoice as issued (immutable snapshots), payments, status | `sales.view` |
| POST | `/sales/{id}/payments` | Record a payment or refund (**Idem**) **[Pending OQ-31]** | `sales.create` (payment) / `sales.cancel` (refund) |
| POST | `/sales/{id}/cancel` | Cancel a bill (same day or later; reason required); restores stock and records reversal (**Idem**) **[Pending OQ-8 rules]** | `sales.cancel` |
| POST | `/sales/{id}/returns` | Return items from a bill (**Idem**) **[Pending OQ-8, OQ-42; not built until regulations are confirmed]** | `sales.return` |

Totals are **never accepted from the client**. If a client sends computed totals for a preview check, the server ignores them and returns its own; a mismatch is shown by the UI (DESIGN.md 10.4). Tax, discount and rounding calculations are **[Pending OQ-2]**.

### 6.10 Reports (PRD RP-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/reports/sales-summary` | Gross sales, discounts, net revenue, taxes, refunds, collected payments, outstanding balance, per period. Params: `from`, `to`, `groupBy` (`day`, `week`, `month`), `branchId` (optional; Owner may omit for all branches). Profit only if defined **[Pending OQ-35]** | `reports.sales`, **Branch** |
| GET | `/reports/top-medicines` | Medicines ranked by quantity sold, net of returns. Params as above plus `limit`, `unitView` (`base`, `selling`) | `reports.medicines`, **Branch** |
| GET | `/reports/customer-medicines` | Medicines bought per customer per period **[Pending OQ-32]** | `reports.customers`, **Branch** |
| GET | same paths with `format=csv` | CSV export (Proposed, PRD RP-FR-004) | Same as the report |

Reports include only branches the user may access; requesting a forbidden branch is 403 `branch_not_permitted`.

### 6.11 Audit (PRD NFR-AUD-01)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/audit-events` | Search audit events (cursor; filters `from`, `to`, `action`, `actorId`, `subjectType`) | `audit.view` |

### 6.12 Platform API (PRD SA-FR, PA-FR)
| Method | Path | Purpose | Perm |
|---|---|---|---|
| GET | `/platform/businesses` | List businesses: id, name, status, created date, counts of users and branches (**business-level fields only**). Filters `q`, `status` | `platform.businesses.view` |
| GET | `/platform/businesses/{id}` | Business-level detail | `platform.businesses.view` |
| POST | `/platform/businesses` | Create a business with its first Owner (PRD OQ-11: admin-created); invitation email sent | Super Admin |
| POST | `/platform/businesses/{id}/suspend`, `/reactivate` | Change status with required reason; revokes tenant sessions on suspend | Super Admin |
| GET / POST | `/platform/admins` | List / create Platform Admins | Super Admin |
| GET / PATCH | `/platform/admins/{id}` | Read / edit | Super Admin |
| PUT | `/platform/admins/{id}/permissions` | Set the admin's grants | Super Admin |
| POST | `/platform/admins/{id}/deactivate`, `/reactivate` | Access control | Super Admin |

Global platform settings have no endpoints until approved (PRD SA-FR-004, OQ-13). No platform endpoint returns pharmacy sales, invoices, stock, purchases or customers.

### 6.13 Operations
| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/health/live` | Process is running | None; returns no data beyond status |
| GET | `/health/ready` | Database reachable (and required dependencies) | None; returns status only, never details |
| GET | `/api/docs`, `/api/openapi.json` | API documentation | Disabled or authenticated in production |

---

## 7. Request and Response Formats (field-level summaries)

Exact schemas live in the OpenAPI document. Below are the shapes that carry business rules.

### 7.1 Create bill (`POST /sales`)
| Part | Fields |
|---|---|
| Header | `Idempotency-Key` |
| Request | `branchId`, `saleType` (`retail`, `wholesale`), `customerId` (required for wholesale), `lines[]`: `medicineId`, `unitName`, `quantity`, optional `batchId` (override), optional `discountAmount` or percent as decided **[Pending OQ-2/OQ-4]**; `payments[]`: `paymentMethodId`, `amount` |
| Response (201) | Issued sale: `id`, `invoiceNumber`, `branchId`, `saleType`, `soldAt`, customer summary, **server-computed** `lines[]` (batch, unit, quantity, price, discount, tax rate, tax amount, line total), `subtotal`, `discountTotal`, `taxTotal`, `roundingAdjustment`, `grandTotal`, `payments[]`, `amountPaid`, `balanceDue`, `status`, `version` |
| Typical errors | 422 `validation_failed` (line-level `fieldErrors`), 409 `insufficient_stock` (`details`: medicine, requested, available, branch), 409 `batch_expired`, 422 `wholesale_price_missing`, 422 `discount_not_permitted`, 403 `branch_not_permitted`, 409/422 idempotency codes |

### 7.2 Confirm receipt (`POST /purchases/{id}/receipts`)
| Part | Fields |
|---|---|
| Request | `lines[]`: `purchaseLineId`, `receivedQty`, `acceptedQty`, `batchNumber`, `expiryDate`, `rejectionReason` (required when accepted < received); `note` |
| Behavior | One transaction; any invalid line rejects the whole receipt; accepted quantities create stock movements; purchase status becomes `partially_received` or `received` |
| Response (201) | Receipt with lines and the updated purchase status and per-line cumulative received/accepted quantities |
| Typical errors | 422 `accepted_exceeds_received`, 422 `invalid_expiry`, 409 `invalid_state` (cancelled/closed), 409 conflicting batch expiry (`duplicate_record` with details) |

### 7.3 Uploads
| Endpoint | Limits and checks |
|---|---|
| `POST /purchases/{id}/documents` | Allowed types: PDF and common image types; maximum size configured (Section 11); **content type verified by inspecting the file**, not the name; filename sanitized; stored under a non-guessable key; response returns document metadata only (never the storage key) |
| `POST /inventory-imports` | Allowed: `.xlsx` and `.csv`; maximum file size and row count configured; required columns checked; oversize or unreadable files rejected with 413/415/422; **no stock created** |

### 7.4 Downloads
Invoice documents and CSV exports are returned through authorized endpoints. Document downloads either stream through the API or redirect to a **short-lived signed URL** generated per request after the authorization check; the signed URL is never stored or logged. Responses set a safe `Content-Disposition` and `no-store`.

### 7.5 Session response (`GET /auth/session`)
Returns: user id and name, business name and settings the UI needs (currency, locale, time zone), role name, **permission codes**, **assigned branches**. It never returns password data, session identifiers or any provider credential.

---

## 8. Rate Limiting

Limits are applied by the API, per client IP and, once authenticated, per user. Values are **Proposed defaults, configurable by environment variables**, and tuned after load testing (PRD OQ-38).

| Scope | Default limit | Key | Notes |
|---|---|---|---|
| Sign-in (`/auth/sign-in/email`, `/platform/auth/sign-in/email`) | 5 attempts per minute | IP + submitted email | Plus temporary account lockout after repeated failures (stored on the user) |
| Password reset request | 3 per hour | Email and IP | Always returns the same response |
| Password reset confirm | 10 per hour | IP | |
| General authenticated API | 300 per minute | User | |
| Report endpoints | 30 per minute | User | Heavier queries |
| Uploads (documents, imports) | 10 per minute | User | |
| Unauthenticated health checks | Generous, separate | IP | Not exposed publicly beyond the load balancer |

Responses: 429 `rate_limited` with `Retry-After`; standard `RateLimit-*` headers on limited routes. Limit counters are held in memory per instance in MVP, which is acceptable for a single instance; **running several API instances requires a shared counter store** (Postgres-backed, or Redis once its trigger is met, ARCHITECTURE 16.2). Rate limits are a safety net; they never replace authorization.

---

## 9. External APIs and Integrations

Each integration sits behind an internal interface so it can be replaced or faked in tests without touching business logic (ARCHITECTURE 10).

### 9.1 Object storage (S3-compatible, private) — **required for MVP**
| Aspect | Specification |
|---|---|
| Purpose | Store supplier invoice files and business logos |
| Direction | Backend → storage only. Browsers never receive storage credentials; MVP uploads pass **through the API** so validation happens before storage |
| Access | Private bucket, no public URLs; downloads via authorized API endpoint with short-lived signed access |
| Keys | Include the business and a random component; never user-supplied names |
| Timeouts and retries | Connection and request timeouts; up to 2 retries with backoff on transient errors for uploads and reads (safe because keys are unique/immutable) |
| Failure handling | Upload fails → the purchase remains saved, response 502/503 `dependency_unavailable`, UI offers Retry (DESIGN.md 10.5). Download fails → clear error, no data change. Orphaned files from a failed database write are cleaned by a periodic reconciliation job |
| Blocks MVP? | Yes (provider choice is AD-5) |

### 9.2 Email provider — **required for MVP** (password reset, invitations)
| Aspect | Specification |
|---|---|
| Purpose | Send password-reset and account-invitation emails |
| Contract | Internal send operation with recipient, template and a link containing a single-use token; templates contain no sensitive business data |
| Timeouts and retries | Short timeout; up to 3 attempts with backoff inside the request that triggered the email |
| Failure handling | The user-facing response does **not** reveal delivery success or failure (always 202 for reset). Failures are logged with request ID (no token or address in logs). A persistent outbox with retries is **not** in MVP; when email reliability becomes a problem, this is a trigger for the background worker (ARCHITECTURE 16.2). An Owner can resend an invitation; a platform operator can re-trigger onboarding |
| Security | Tokens stored hashed, single use, expiring; links point only to the configured public web URLs |
| Blocks MVP? | Yes for reset/invitation flow |

### 9.3 Logging and error monitoring — optional
Structured logs are written to standard output and shipped by the platform. A hosted error-tracking service may be added; it receives **scrubbed** events only (Section 12). Its failure never affects request handling.

### 9.4 Not integrated in MVP
Payment gateway (subscriptions), OCR, SMS, push notifications, accounting or government tax systems, third-party analytics. None has an endpoint or contract. If added later, each requires its own approved requirement and a section here.

---

## 10. Webhooks

**MVP defines no inbound webhooks and no outbound webhooks.** No confirmed requirement needs them.

When a future integration needs an inbound webhook (for example a payment gateway for subscriptions, or email delivery/bounce events), it must follow these rules:

| Rule | Detail |
|---|---|
| Endpoint | A dedicated, unauthenticated-by-session route (e.g., under `/api/v1/webhooks/{provider}`) that is excluded from CSRF and cookie handling but protected by signature verification |
| Verification | Verify the provider's **signature over the raw request body** using a secret from the environment (constant-time comparison); reject on mismatch with 401 and log without the payload |
| Replay protection | Check the provider's timestamp against a short tolerance window and store processed **event IDs** to reject duplicates |
| Idempotent handling | Processing an event twice must produce the same state |
| Fast acknowledgment | Validate and record the event, return 2xx quickly; do heavy work asynchronously (a queue trigger) |
| Failure | Return 5xx only for transient failures so the provider retries; never return details |
| Source restrictions | Where the provider publishes IP ranges, allowlist them in addition to signatures |
| Privacy | Payloads are stored minimally, with sensitive fields excluded from logs |

Outbound webhooks to customers are out of scope; if ever approved, they would require signing, retries with backoff, per-tenant secrets and a delivery log.

---

## 11. Required Environment Variables

Names only; **values are never committed or logged.** A committed `.env.example` lists every name with placeholders; the process validates all variables at start-up and refuses to run if any required value is missing or invalid, reporting only names (ARCHITECTURE 11.2).

| Variable | Required | Where used | Secret | Purpose |
|---|---|---|---|---|
| `NODE_ENV` | Yes | Server | No | Environment name |
| `PORT` | Yes | Server | No | Listening port |
| `LOG_LEVEL` | No | Server | No | Logging verbosity |
| `PUBLIC_WEB_URL` | Yes | Server | No | Pharmacy web origin (links in emails, CORS) |
| `PUBLIC_ADMIN_URL` | Yes | Server | No | Platform admin origin |
| `CORS_ALLOWED_ORIGINS` | Yes | Server | No | Explicit origin allowlist (no wildcard) |
| `DATABASE_URL` | Yes | Server | **Yes** | Connection for the tenant role (`app_tenant`) |
| `DATABASE_PLATFORM_URL` | Yes | Server | **Yes** | Connection for the platform role (`app_platform`) |
| `DATABASE_MIGRATOR_URL` | Release only | Release pipeline | **Yes** | Schema owner for migrations; **never** present at runtime |
| `DATABASE_POOL_MAX` | No | Server | No | Pool size |
| `BETTER_AUTH_SECRET` | Yes | Server | **Yes** | Signs session cookies and tokens (Better Auth); at least 32 random characters |
| `SESSION_IDLE_TIMEOUT_MINUTES` | Yes | Server | No | Idle expiry |
| `SESSION_ABSOLUTE_TIMEOUT_HOURS` | Yes | Server | No | Maximum session age |
| `COOKIE_DOMAIN` | No | Server | No | Cookie scope (host-only by default) |
| `PASSWORD_RESET_TTL_MINUTES` | Yes | Server | No | Reset token lifetime |
| `STORAGE_PROVIDER` | Yes | Server | No | Object-storage adapter (local disk allowed in development) |
| `STORAGE_ENDPOINT` | If applicable | Server | No | S3-compatible endpoint |
| `STORAGE_REGION` | If applicable | Server | No | Region |
| `STORAGE_BUCKET` | Yes | Server | No | Private bucket name |
| `STORAGE_ACCESS_KEY_ID` | Yes (hosted) | Server | **Yes** | Storage credential |
| `STORAGE_SECRET_ACCESS_KEY` | Yes (hosted) | Server | **Yes** | Storage credential |
| `STORAGE_SIGNED_URL_TTL_SECONDS` | Yes | Server | No | Lifetime of download access |
| `EMAIL_PROVIDER` | Yes | Server | No | Email adapter (a mock in development) |
| `EMAIL_HOST`, `EMAIL_PORT` | If SMTP | Server | No | Transport |
| `EMAIL_USER`, `EMAIL_PASSWORD` or `EMAIL_API_KEY` | Yes (hosted) | Server | **Yes** | Email credential |
| `EMAIL_FROM` | Yes | Server | No | Sender address |
| `RATE_LIMIT_*` (one per scope in Section 8) | No | Server | No | Overrides of default limits |
| `MAX_INVOICE_UPLOAD_BYTES` | Yes | Server | No | Document size cap **[Pending NFR-PERF-04 values]** |
| `MAX_IMPORT_FILE_BYTES`, `MAX_IMPORT_ROWS` | Yes | Server | No | Import caps **[Pending NFR-PERF-04 values]** |
| `IDEMPOTENCY_TTL_HOURS` | Yes | Server | No | Key retention |
| `SWAGGER_ENABLED` | No | Server | No | Must default to **false** in production |
| `BOOTSTRAP_SUPER_ADMIN_EMAIL`, `BOOTSTRAP_SUPER_ADMIN_PASSWORD` | One-time | Bootstrap command | **Yes** | Creates the first Super Admin; removed afterwards; password change forced at first sign-in |
| `ERROR_TRACKING_DSN` | No | Server | **Yes** | Optional error-tracking service |
| `REDIS_URL` | Only if worker enabled | Server/worker | **Yes** | Background queue and shared rate limits, only once triggered (ARCHITECTURE 16.2) |

**Client-side configuration** (front-end builds) contains **only** non-secret public values such as the API base URL. Front-end build variables are public by nature: **no secret, key, token or credential may ever be placed in them.** All provider keys remain server-only.

Production-unsafe defaults are forbidden: Swagger off, permissive CORS off, debug logging off, secure cookies on.

---

## 12. Data Privacy

| Topic | Rule |
|---|---|
| Minimal responses | Endpoints return only fields the caller needs; password data, hashes, tokens and storage keys are never returned |
| Personal data | Employee and customer details are returned only to callers with the specific permission (`users.view`, `customers.view`, `reports.customers`); per-customer reporting is separately gated |
| No personal data in URLs | Searches that may contain personal data (customer name, phone) still use `q` in the query for convenience, but request logging **redacts query values** on those endpoints and logs never include them; identifiers in paths are opaque UUIDs |
| Log redaction | Never logged: passwords, session/reset/CSRF tokens, cookies, `Authorization` headers, idempotency response bodies, file contents, signed URLs, customer and employee personal fields, request bodies by default |
| Error responses | No stack traces, SQL, internal paths, other records' identifiers or tenant data; cross-tenant records look like not-found |
| Audit data | Before/after values exclude secrets and hashes (field allow-list) |
| Exports | CSV exports are permission-gated and recorded in the audit log |
| Erasure | Customer anonymization replaces personal fields while keeping invoices and totals (DATABASE 8.3) |
| Retention | Sessions, reset tokens, idempotency keys, staged import rows, IP/user-agent values are purged on schedule; financial retention follows jurisdiction **[Pending OQ-37, OQ-42]** |
| Third parties | Only the storage and email providers receive data: files and the recipient address plus the email text. No analytics or advertising services receive business or personal data |
| Cookie scope | Cookies are first-party, host-restricted, HTTP-only; no tracking cookies |

---

## 13. Failure Handling

### 13.1 Guarantees
- Every state-changing endpoint is **all-or-nothing**: on any failure the transaction rolls back and nothing is saved, no stock changes (PRD Section 15, NFR-REL-01).
- Retrying with the same `Idempotency-Key` after an unknown outcome is always safe; it either replays the original result or completes the request once.
- Errors never leave documents half-created: file storage and database writes are ordered so a failure leaves at worst an orphaned file (cleaned by reconciliation), never a database record pointing at a missing file without status.

### 13.2 Dependency failures
| Dependency | Timeout/retry | Behavior on failure | User-visible outcome |
|---|---|---|---|
| PostgreSQL | Statement and connection timeouts; bounded retry **only** on serialization failures and deadlocks (restart the whole transaction) | Transaction rolled back; readiness fails | 503 `service_unavailable` or 500 with request ID; data unchanged |
| Object storage | Timeout; up to 2 retries on transient errors | Purchase saved without the document; upload endpoint fails | 502/503 `dependency_unavailable`, Retry offered |
| Email provider | Timeout; up to 3 attempts | Logged; no persistent outbox in MVP | Reset still returns 202; invitations can be resent |
| Error tracking | Fire-and-forget with short timeout | Dropped | None |

### 13.3 Application-level
| Situation | Behavior |
|---|---|
| Unhandled error | Central handler returns 500 `internal_error` with request ID; logged with context (no secrets); transaction rolled back |
| Version conflict | 409 `version_conflict`; the client reloads and re-applies the user's change deliberately |
| Concurrent last-unit sales | One succeeds; the other receives 409 `insufficient_stock` (PRD RB-FR-005) |
| Duplicate bill request | Replay of the original response; no second bill or deduction |
| Upload exceeds limits or wrong type | 413/415 before any storage write |
| Suspended business or deactivated user mid-session | The next request returns 403 and the front end signs the user out |
| Slow or timed-out client request | The server finishes or rolls back independently; the client retries with the same key |
| Shutdown | Graceful: stop accepting new requests, finish in-flight ones within a limit, close pools |
| Partial import failure | Import accepted atomically per policy; failure leaves no stock and the import remains staged |

### 13.4 Observability
Every request is logged once with request ID, method, route pattern (not the raw URL with sensitive query values), status, duration and user/business identifiers (ids only). Metrics and alerts cover error rate, latency, 429s, failed logins, failed receipts and bills, dependency failures, and the scheduled reconciliation results (ARCHITECTURE 17.4).

---

## 14. Traceability

| PRD area | API sections |
|---|---|
| Tenant isolation, permissions (BR-01..03) | 3.3, 5, 6 (all) |
| Opening stock and import (OI-, IM-FR) | 6.4, 6.5, 7.3 |
| Suppliers, purchases, invoices, receipts (SU-, PU-, IU-, SR-FR) | 6.6, 6.7, 7.2, 9.1 |
| Billing, payments, invoices (RB-, WB-, SH-FR) | 6.9, 7.1 |
| Duplicate prevention and concurrency (BR-12, BR-13) | 3.6, 3.7, 13.3 |
| Reports (RP-FR) | 6.10 |
| Platform administration (SA-, PA-FR) | 6.12 |
| Security and privacy (NFR-SEC, NFR-PRV) | 4, 5, 8, 11, 12 |
| Auditability (NFR-AUD-01) | 6.11, 12 |

## 15. Open Items

| Item | Dependency |
|---|---|
| Discount and tax request fields, rounding display | PRD OQ-2, OQ-4 |
| Return and cancellation endpoints and conditions | PRD OQ-8, OQ-42 |
| Opening-stock window rule | PRD OQ-9 |
| Customer fields and per-customer report contract | PRD OQ-32 |
| Payment methods and overpayment rules | PRD OQ-31 |
| Purchase correction process after receipt | PRD OQ-24 |
| Password policy values, invitation resend detail | PRD OQ-19 |
| Upload and import size/row limits, rate-limit values | PRD NFR-PERF-04, OQ-38 |
| Profit in reports | PRD OQ-35 |
| Global platform settings endpoints | PRD SA-FR-004, OQ-13 |
| Hosting, storage and email provider | ARCHITECTURE AD-5 |
