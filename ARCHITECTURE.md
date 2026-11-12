# Pharma ERP — Architecture

| Field | Value |
|---|---|
| Version | 0.1 (draft) |
| Matches | `PRD.md` v0.4, `DESIGN.md` v0.1 |
| Purpose | Define how the product is built: stack, structure, data flow, security, testing, deployment |
| Status | Draft. Items marked **[Pending OQ-n]** depend on open PRD questions. Items marked **[AD-n]** are architecture decisions needing owner sign-off (Section 18). |

Nothing in this document is implemented yet. The repository currently holds only a backend skeleton (Express 5, TypeScript, pnpm) and an empty `frontend/` folder.

---

## 1. Architectural Principles

1. **Simplest reliable architecture.** One backend application, one database, one frontend per surface. No microservices.
2. **Correctness over speed of delivery in stock and money paths.** Inventory and billing are transactional, auditable and tested hardest (PRD BR-05, BR-07, BR-12, BR-13).
3. **The backend is the authority.** Tenant isolation, permissions, totals and stock availability are decided server-side. The UI is never a security boundary (PRD BR-03).
4. **Online-only.** No offline queue, sync or conflict resolution (PRD Section 7.4).
5. **Add infrastructure only when a requirement demands it.** Redis and BullMQ are approved technologies (PRD C-2) but are **not on the MVP critical path**; Section 16 states the triggers for adding them.
6. **Typed end to end.** One schema definition per API contract, shared between backend and frontends.
7. **Boring, well-supported technology.** Prefer widely used libraries with long support histories over novelty.

---

## 2. Technology Stack and Reasoning

### 2.1 Decided (by the product owner)
| Area | Choice | Source |
|---|---|---|
| Language | TypeScript on Node.js | PRD brief |
| Backend framework | **Express** | PRD OQ-17 (closed) |
| Database | PostgreSQL | PRD brief |
| ORM | Prisma | PRD brief |
| Authentication | **Better Auth** (Prisma adapter, version pinned) | Owner decision, 2026-11-04 |
| Pharmacy web | Progressive Web App, online-only | PRD C-3, NFR-PWA-01 |
| API documentation | Swagger / OpenAPI | PRD C-2 |
| Redis, BullMQ | Approved technologies, use case to be justified | PRD C-2 |

### 2.2 Recommended (architect's proposals) 
| Area | Recommendation | Why |
|---|---|---|
| Frontend framework | **React with Vite**, TypeScript | Mature ecosystem, strong accessibility component options, simple static build, easy PWA support. A server-rendering framework adds complexity the app does not need (internal authenticated tool, no SEO). |
| Routing and data fetching | React Router + **TanStack Query** | Server state (lists, details, mutations, retries) handled declaratively, with predictable loading/error states required by DESIGN.md Section 10 |
| Forms and validation | React Hook Form + the shared **zod** schemas | The same validation rules run in the browser and on the server |
| Component foundation | A headless, accessible primitive library for dialog, combobox, menu, tabs, date picker, plus own styling from DESIGN.md tokens | DESIGN.md demands WCAG 2.2 AA; building accessible comboboxes and dialogs from scratch is high-risk |
| Styling | CSS custom properties generated from the DESIGN.md tokens; a utility CSS approach is acceptable if it maps strictly to those tokens | One source of colour/type/spacing; no one-off values (DESIGN.md Section 15) |
| Tables | A headless table library plus own markup | Sorting, column control and accessible semantics without a heavy styled grid |
| API contract | **zod** schemas → request validation and **OpenAPI** generation (the already-installed `@asteasolutions/zod-to-openapi`) | One definition feeds validation, types and documentation |
| Logging | **pino** with `pino-http` (already installed) | Structured JSON logs, low overhead |
| Security middleware | `helmet`, `cors` (already installed) | Standard hardening |
| Password hashing | **argon2id** | Current recommended password hash; supplied to Better Auth as its custom hash and verify functions |
| Sessions | **Better Auth database-backed sessions in PostgreSQL**, two instances (tenant, platform), HTTP-only signed cookie (see Section 7) | Immediate revocation by deleting session rows (PRD BB-FR-004, UM-FR-003); no Redis needed |
| Money arithmetic | Fixed-precision decimal (database `numeric` plus a decimal library in code); **never floating point** | Billing correctness (PRD RB-FR-002) |
| File storage | S3-compatible private object storage; local disk in development | Private, durable invoice storage (PRD IU-FR-001, OQ-40) |
| Spreadsheet parsing | A maintained CSV parser and a maintained `.xlsx` reader, chosen at implementation | Required by PRD IM-FR-001; library selection must consider security advisories and file-size limits |
| Email | Transactional email via SMTP/provider behind an interface | Password reset and invitations (PRD OQ-19) |
| Testing | **Vitest**, Supertest, Playwright, axe-based accessibility checks | See Section 15 |
| Lint/format | ESLint (typescript-aware) + Prettier | Consistency |

### 2.3 Existing repository observations (to resolve at implementation)
These come from the earlier backend audit and are not silently changed by this document.
- Installed versions: Express 5.2.1, TypeScript 7.0.2, Prisma and `@prisma/client` 6.19.3, `pg` 8.23.1, `ioredis` 6.0.0, BullMQ 6.3.11, zod 4.6.5, pino 10.4.0.
- **`pg` is only needed if Prisma's driver-adapter mode is used.** With Prisma's default engine it is unnecessary **[AD-2]**.
- **`@types/node` 26 vs Node 22 runtime:** align type version with the runtime Node LTS.
- pnpm build-script approvals (`allowBuilds`) for Prisma and `msgpackr-extract` are currently `false`; they must be revisited deliberately when Prisma generation is set up.
- `ioredis`, BullMQ and Swagger packages are present; the architecture uses them only as described in Sections 11, 16 and 9.

### 2.4 Not chosen, and why
| Option | Reason not chosen |
|---|---|
| Microservices | No scale or team-boundary need; multiplies deployment, consistency and debugging cost |
| NestJS | Owner chose Express (OQ-17); the module structure in Section 4 gives the needed organization |
| GraphQL | REST with OpenAPI is simpler to secure, test, cache and document for this CRUD-and-transactions workload |
| Server-rendered/Next.js frontend | No SEO need; adds server runtime and complexity |
| JWT as the only session mechanism | Hard to revoke instantly; requirements demand immediate revocation |
| Redis as a primary dependency | Not required for correctness in MVP; Postgres handles sessions, throttling and idempotency |
| Event sourcing / CQRS | Overkill; the stock movement ledger gives auditability without that complexity |
| Separate database per tenant | Operationally heavy; shared schema with enforced tenant scoping is sufficient at the expected scale (see OQ-38) |

---

## 3. System Overview

```
 Browser (Pharmacy PWA)      Browser (Platform Admin web)
          │                              │
          └──────────── HTTPS ───────────┘
                         │
                 Reverse proxy (TLS, compression)
                         │
              ┌──────────┴──────────┐
              │  API (Express, TS)  │──── Object storage (invoice files)
              │  modular monolith   │──── Email provider (reset, invites)
              └──────────┬──────────┘
                         │
                    PostgreSQL
              (system of record, sessions,
               idempotency keys, audit)

 Optional, only when triggered (Section 16):
              Redis + BullMQ worker (same codebase, separate process)
```

- **One deployable backend**: a modular monolith. Business modules are internal packages with enforced boundaries, not network services.
- **Two web front ends** (Section 5): the pharmacy PWA and the platform admin web, talking to the same API under separate route groups and authentication realms.
- **State lives in PostgreSQL**. The API process is stateless, so it can run as several identical instances behind the proxy without session affinity.

---

## 4. Backend Architecture

### 4.1 Layering
Each request passes through fixed layers; business logic never lives in route handlers.

| Layer | Responsibility |
|---|---|
| **Routes** | Maps HTTP paths and methods to controllers; attaches middleware (authentication, permission, validation) |
| **Controllers** | Parses the validated request, calls one service method, shapes the response. No business logic |
| **Services (use cases)** | Business rules, orchestration, **transaction boundaries**, permission re-checks for sensitive rules, audit events |
| **Repositories (data access)** | The only code that talks to Prisma. Every query is **tenant-scoped** by construction (Section 8.2) |
| **Domain utilities** | Pure functions: money and tax calculation, unit conversion, expiry rules, batch selection (FEFO). Fully unit-tested, no I/O |
| **Integrations** | Interfaces and adapters for file storage, email and (later) queue |

Dependency direction is one-way: routes → controllers → services → repositories/integrations; domain utilities are called by services. Lint rules enforce that controllers do not import repositories directly and that modules only import another module's public service interface.

### 4.2 Modules (bounded contexts)
Aligned to the PRD modules so requirement IDs map directly to code.

| Module | PRD area |
|---|---|
| `platform` | Super Admin, Platform Admin, business status (SA-, PA-FR) |
| `tenancy` | Businesses, branches, business settings (BB-FR) |
| `iam` | Users, roles, permissions, authentication, sessions (UM-FR) |
| `catalog` | Medicines, units, prices (MC-FR) |
| `inventory` | Batches, balances, **stock movements**, adjustments, alerts (OI-, SR-, AL-FR) |
| `imports` | Excel/CSV opening-stock import (IM-FR) |
| `suppliers` | Suppliers (SU-FR) |
| `purchasing` | Purchases, invoice documents, **receipts** (PU-, IU-, SR-FR) |
| `sales` | Bills, payments, invoices, cancellations/returns [Pending OQ-8] (RB-, WB-, SH-FR) |
| `customers` | Buyer records [Pending OQ-32] |
| `reporting` | Sales and demand reports (RP-FR) |
| `audit` | Append-only audit events (NFR-AUD-01) |
| `shared` | Errors, config, logging, money, ids, pagination, idempotency |

`inventory` is the **sole owner of stock changes**. `purchasing`, `sales`, `imports` and adjustments never write balances directly; they call inventory's movement operation inside their own transaction (Section 6.3).

### 4.3 Cross-cutting middleware (request pipeline order)
1. Request ID and structured request logging
2. Security headers, CORS allowlist, body size limits
3. Rate limiting (stricter on authentication routes)
4. Session resolution (cookie → server-side session → user, business, status)
5. Tenant context establishment (derived **only** from the session, never from the request)
6. Authorization (permission and branch checks per route)
7. Input validation (zod, per route: params, query, body)
8. Idempotency handling (for mutating routes that require it)
9. Controller → service
10. Central error handler (Section 12)

### 4.4 Background work
MVP has no background worker. Imports run in the request with limits (OQ-41 recommended synchronous); alerts are computed by query; reports are computed on request. Section 16 defines when a BullMQ worker is introduced and how it will be structured, so it can be added without redesign.

---

## 5. Frontend Architecture

### 5.1 Applications
| App | Users | Notes |
|---|---|---|
| **Pharmacy web (PWA)** | Owner, staff | Primary. Installable; online-only; follows DESIGN.md fully |
| **Platform admin web** | Super Admin, Platform Admin | Smaller surface; reuses the shared UI package. Whether it is a separate build or a route group in one app is **[AD-3, PRD OQ-14]**; recommendation: separate build and separate deployment path for a distinct authentication realm and smaller attack surface |

### 5.2 Structure and responsibilities
- **Feature-first organization**: each feature (billing, inventory, purchasing…) owns its screens, hooks, API calls and local components.
- **Shared UI package**: tokens, primitives (button, input, table, dialog…) and patterns from DESIGN.md, so all surfaces stay consistent.
- **Server state** is managed by the data-fetching library (caching, refetching, mutation states). **Local UI state** stays in components. There is **no global client store** for business data; the server is the source of truth.
- **API client** is generated or typed from the shared contracts. All errors arrive in one shape and map to the DESIGN.md states.
- **Permissions in the UI** come from the session response (list of permissions and branches) and only control visibility/disabled states. The backend re-checks every request (DESIGN.md 8.13).
- **Calculation**: totals shown while building a bill are a preview; the server's computation is final and the UI displays any difference (DESIGN.md 10.4). The same domain calculation code from the shared package is used for the preview so differences are rare, but the server remains the authority.

### 5.3 PWA behavior (PRD NFR-PWA-01)
- Web app manifest and service worker provide installability and fast load of the static shell.
- The service worker caches **only static assets**. It does **not** cache API responses and does **not** queue mutations.
- When offline, the application shows the offline banner and disables saving (DESIGN.md 10.9).
- Update strategy: new versions are detected and the user is prompted to reload at a safe moment (never mid-bill).

### 5.4 Performance approach
Route-level code splitting, virtualized long lists where needed, server-side pagination/filter/sort for all large lists, debounced search, self-hosted fonts. Targets follow PRD NFR-PERF (values pending OQ-38).

---

## 6. Data Flow

### 6.1 Generic request flow
Browser → proxy → API pipeline (Section 4.3) → service → repository → PostgreSQL → response in the standard envelope (Section 9) → client updates cached state and shows the DESIGN.md state.

### 6.2 Opening stock import (PRD IM-FR-001..003)
1. User uploads a file → API validates type/size → parses it → writes rows to an **import staging area** (import record plus row records with validation status). **No stock is created.**
2. API returns the review summary (valid, warning, invalid rows with reasons).
3. User accepts → in **one transaction**: the service verifies the import has not been applied, creates batches and balances through `inventory` movements of type Opening, and marks the import applied. Failure rolls back everything.
4. A repeated file is detected by content fingerprint and requires explicit confirmation.

### 6.3 Purchase and receipt (PRD BR-05, BR-06)
1. Recording a purchase stores the purchase and lines in state *Recorded*. Uploading an invoice stores the file in object storage and links it. **No stock change.**
2. Confirming a receipt runs in **one transaction**: validate each line (accepted ≤ received, cumulative rules, expiry, batch identity), create or find the batch, write a **Purchase-receipt stock movement** and update the balance for the accepted quantity, record the receipt, update purchase status. Any failing line rolls back the entire receipt.

### 6.4 Bill creation (PRD RB-FR-001..005)
In **one transaction**, after idempotency check:
1. Authenticate, authorize (permission and branch), validate input.
2. Load prices and tax/discount configuration; compute totals using the domain money module **[Pending OQ-2]**.
3. For each line, select batch(es) by FEFO unless an authorized override is supplied; ensure not expired.
4. Deduct stock with an atomic guarded update (Section 8.4) and write **Sale stock movements**.
5. Allocate the invoice number, write the sale, lines (with price/tax snapshots) and payments.
6. Write an audit event; commit. Return the invoice.

Any failure rolls back the whole operation; nothing is saved and no stock changes.

### 6.5 Reports
Read-only queries scoped by tenant, branch permission and date range. Reports reconcile with invoices by construction: figures come from sale, payment and return records (PRD AC-08). If performance requires it later, summary tables are added (Section 16).

### 6.6 Alerts
Computed on request from balances and batch expiry dates, using the business's thresholds and near-expiry window. In-app only (PRD OQ-29).

---

## 7. Authentication and Authorization

### 7.1 Realms
| Realm | Users | Notes |
|---|---|---|
| **Platform** | Super Admin, Platform Admin | Separate user store and routes; cannot access tenant data endpoints (PRD SA-FR-005, OQ-12) |
| **Tenant** | Owner and staff | Always bound to exactly one business (PRD OQ-15) |

A person cannot hold both realms with one account.

### 7.2 Authentication
- Email and password; passwords stored as argon2id hashes only (PRD NFR-SEC-02).
- Sign-in is handled by **Better Auth** and creates a **server-side session** record; the browser receives an opaque identifier in an **HTTP-only, Secure, SameSite cookie**, signed with a server secret. No tokens in browser storage.
- Session carries: user, business (tenant), realm (by Better Auth instance), creation/last-activity time. Role, permissions and branches are **loaded server-side per request** (cached in-process for a very short time), so changes and deactivation take effect immediately.
- Each request checks that the user is active and the **business is Active**; suspended businesses and deactivated users are rejected at once (PRD BB-FR-004, UM-FR-003).
- Idle timeout through Better Auth session refresh, absolute timeout by an application check; sign-out and "sign out everywhere" delete session records.
- Password reset by email with single-use, expiring tokens (PRD OQ-19); responses never reveal whether an email exists. MFA is a later phase; the sign-in flow is structured so a second step can be added.
- Sign-in throttling and temporary lockout on repeated failures (PRD NFR-SEC-03).
- State-changing requests are protected against cross-site request forgery by Better Auth's `Origin` check against the trusted origins, plus SameSite cookies.

### 7.3 Authorization model
- **Permissions** are a fixed catalog defined in code (module × action: view, create, edit, confirm, cancel/reverse, manage permissions) and shared with the frontend.
- **Roles** are business-owned sets of permissions stored in the database. Permissions are **global to the role**; **branch assignment** sets where they apply (PRD OQ-10).
- Every route declares the permission it needs. The authorization step checks permission **and**, where the route touches branch data, the user's branch scope.
- The Owner is business-wide. A role editor cannot grant permissions the editor lacks (PRD UM-FR-002).
- Sensitive rules are re-checked in services (for example discount-limit authority, batch override, adjustment) so they hold even if a route is miscomposed.
- Platform Admin permissions come from a platform-level grant list (PRD OQ-13: minimal list).
- Cross-tenant or unauthorized resource requests return a response indistinguishable from "not found" (PRD EC-11).

---

## 8. Database Architecture

### 8.1 Principles
- One PostgreSQL database; **shared schema multi-tenancy**: every business-owned table carries the business identifier.
- Prisma is the only access path from application code. Migrations are managed with Prisma Migrate, reviewed, and applied by the release process (Section 17), never by application start-up.
- Schema conventions: stable surrogate identifiers, created/updated timestamps, soft deactivation instead of deletion (PRD BR-16), explicit foreign keys, and **database constraints** for rules that must never be violated.
- The detailed schema is designed during implementation from the PRD conceptual entities (PRD Section 13); this document sets the rules below.

### 8.2 Tenant isolation (defense in depth)
1. **Application layer (mandatory):** repositories receive a tenant context and add the business identifier to every query and write. There is no repository method that accepts a bare record identifier without the tenant context. Lint/tests forbid direct Prisma use outside repositories.
2. **Database layer (recommended hardening) [AD-1]:** PostgreSQL **Row-Level Security** policies on business-owned tables, with the tenant identifier set per transaction. This protects against a missed filter in application code. It adds some complexity with Prisma (per-transaction setting, a non-owner application role), so it is a decision for the owner: recommended for MVP because tenant leakage is the highest-impact risk (PRD R-03).
3. **Test layer (mandatory):** an automated isolation suite exercises every endpoint with two tenants (PRD NFR-TEN-01, AC-03).

### 8.3 Stock model
- **Stock movement** records are append-only and immutable: type (Opening, Purchase-receipt, Sale, Cancellation/Return, Adjustment, Write-off), batch, branch, signed base-unit quantity, reference document, user, time.
- **Inventory balance** per batch per branch is stored for fast reads and updated **only** inside the same transaction as the movement that changes it.
- Invariants enforced by the database: **balance ≥ 0**; the balance equals the sum of its movements (verified by an automated reconciliation job/test, PRD SR-FR-004, NFR-DAT-01).
- All quantities are stored in the **base unit**; selling-unit conversions are applied at the boundary (PRD MC-FR-002).
- Batch identity: business + medicine + batch number, with the expiry rule per PRD OQ-26 enforced by a constraint.

### 8.4 Concurrency and transactions
- Every stock- or money-changing use case runs in **one database transaction**.
- Stock deduction uses a **guarded atomic update** (decrease only if the balance is sufficient; otherwise fail) so two simultaneous last-unit sales cannot both succeed (PRD RB-FR-005, EC-06). Where multiple rows are touched, rows are locked in a consistent order to avoid deadlocks, with a bounded retry on serialization/deadlock errors.
- **Invoice numbers** are allocated from a per-branch counter inside the sale transaction, so numbers are unique and gap behavior is defined (PRD OQ-39).
- **Optimistic concurrency** (version column) on records that several users edit (purchases, medicines, roles) to surface "updated by another user" instead of overwriting (DESIGN.md 10.6).

### 8.5 Idempotency
Mutating endpoints that create money- or stock-affecting records (bill, receipt, payment, import accept, adjustment) require a client-generated **idempotency key**. The key and the resulting response are stored in PostgreSQL with a uniqueness constraint per business, so a repeated request returns the original result and cannot create a second bill or deduction (PRD RB-FR-004, EC-08). Keys expire after a retention period.

### 8.6 Money and tax
- Amounts stored as fixed-precision decimals; currency per business (PRD OQ-16).
- All tax, discount and rounding logic lives in one domain module so it is defined once and tested exhaustively. Its specification waits on **[Pending OQ-2]**: no formulas are implemented before the accountant's decision.
- Each sale line stores a **snapshot** of price, discount, tax rate and computed amounts, so history never changes when configuration changes (PRD BB-FR-003, BR-11).

### 8.7 Auditing
Audit events are append-only records (actor, action, subject, before/after values, request ID, time) for permission changes, adjustments, receipts, cancellations, price and status changes (PRD NFR-AUD-01). They are written in the same transaction as the change.

### 8.8 Retention, backup and recovery
- No hard deletes of business records; deactivation hides records from new work.
- Automated PostgreSQL backups with point-in-time recovery, plus object-storage durability for documents; **restore is rehearsed** before launch and on a schedule (PRD NFR-BKP-01). RPO/RTO targets are set by the owner **[Pending OQ-38]**.
- Retention periods for financial records follow the jurisdiction **[Pending OQ-37, OQ-42]**.

---

## 9. API Architecture

### 9.1 Style
- **REST over HTTPS, JSON**, versioned under `/api/v1`.
- Resource-oriented paths, standard methods, plural nouns. Domain actions that are not simple CRUD are explicit sub-resources, for example confirming a receipt or cancelling a bill (these are actions with business meaning, not generic updates).
- Route groups: `/api/v1/platform/*` (platform realm) and `/api/v1/*` (tenant realm). No path contains a tenant identifier; the tenant comes from the session.

### 9.2 Contracts and documentation
- Every route has zod schemas for params, query, body and response. These drive **runtime validation** (rejecting unknown or malformed input), **TypeScript types** shared with the frontends, and the **OpenAPI document**.
- Swagger UI is available in development and staging. In production it is disabled or protected by authentication, since it describes the attack surface (PRD NFR-SEC-01).

### 9.3 Conventions
| Topic | Convention |
|---|---|
| Success | Consistent envelope with the resource or list plus metadata |
| Pagination | Cursor or page-based with total counts where needed; size capped server-side |
| Filtering/sorting | Whitelisted fields only |
| Dates | ISO-8601 in UTC on the wire; business time zone applied at presentation and in report boundaries |
| Money/quantities | Decimal strings (never floating-point numbers) with explicit units |
| Errors | One error shape: stable machine code, human message, field errors, request ID (Section 12) |
| Idempotency | `Idempotency-Key` header on the endpoints listed in Section 8.5 |
| Concurrency | Version value on updatable resources; conflict returns a specific error |
| Rate limits | Per IP and per user, stricter for authentication and uploads |
| Uploads | Multipart with enforced size/type limits; content type verified by inspection |
| Compatibility | Additive changes within v1; breaking changes require v2 (relevant when Android arrives) |

### 9.4 Representative endpoint groups
Authentication and session; businesses/branches/settings; users/roles/permissions; medicines and prices; inventory and movements; adjustments; imports (upload, review, accept); suppliers; purchases and invoice documents; receipts; bills, payments, invoices and cancellations; alerts; reports; employees/activity; platform businesses and platform admins; health/readiness. The full endpoint list is derived from the PRD requirement IDs during implementation and recorded in the OpenAPI document.

---

## 10. External Services

| Service | Purpose | MVP? | Failure handling |
|---|---|---|---|
| PostgreSQL | System of record, sessions, idempotency, audit | **Yes** | Operations roll back; clear error; readiness check fails |
| Object storage (S3-compatible, private) | Supplier invoice files | **Yes** | Upload failure keeps the purchase; retry (DESIGN.md 10.5) |
| Email provider | Password reset, invitations | **Yes** | Retry with limited backoff; admin alternative **[Pending OQ-19 detail]** |
| Logging / error monitoring | Diagnosis and alerting | Yes (basic structured logs); hosted error tracking optional | Must never block business operations |
| Redis + BullMQ | Background jobs, shared rate-limit/cache state | **No** (Section 16) | — |
| Payment gateway | Subscriptions | **Deferred** (PRD 7.3) | — |
| OCR service | Invoice reading | **Deferred** | — |

Integrations sit behind small interfaces (storage, email, later queue) so providers can be changed or faked in tests without touching business logic.

### 10.1 AI architecture
**No AI components are required** by the PRD, and none are included. Automated invoice OCR is explicitly deferred. If it is approved later, it must be added as an isolated integration whose output is only a *suggested, user-reviewed* purchase draft; it must never change stock (PRD BR-05).

---

## 11. Environment Configuration

### 11.1 Environments
| Environment | Purpose |
|---|---|
| Local development | Developer machine; Postgres (and Redis only if a worker is in use) via Docker Compose; local-disk file storage; mock email |
| CI | Ephemeral Postgres for integration tests |
| Staging | Production-like, separate data, separate credentials; Swagger enabled |
| Production | Real data; hardened; Swagger disabled/protected |

### 11.2 Configuration rules
- All configuration comes from **environment variables**, read in one place and **validated with zod at start-up**. The process refuses to start with missing or invalid values and reports the **names**, never the values.
- `.env` files are never committed; a committed `.env.example` lists every variable with placeholder values only. A `.gitignore` is required before any `.env` is created (open item from the setup audit).
- Secrets live in the host's secret store in staging and production, not in the repository or images.
- No secret has a default value in code. Production-unsafe defaults (permissive CORS, enabled Swagger, debug logging) are not the default.

### 11.3 Variable groups (names only)
Application (environment name, port, log level, public URLs); database (connection string, pool size); session (secret(s), idle and absolute lifetimes, cookie settings); CORS allowlist; file storage (provider, bucket, region, credentials); email (host, credentials, sender); rate-limit settings; upload and import limits; optional Redis connection (only when the worker is enabled); error-tracking key (optional); feature flags for deferred modules (off).

---

## 12. Error Handling

### 12.1 Strategy
- Services raise **typed application errors** (validation, authentication, authorization, not-found, conflict, business-rule violation, dependency failure). Unknown errors are treated as internal errors.
- A single **central error handler** converts errors to the standard response shape and HTTP status, logs them with the request ID, and **never exposes stack traces, SQL, file paths or internal identifiers** to clients.
- Business-rule failures carry **stable error codes** the frontend maps to DESIGN.md messages (for example insufficient stock with the medicine and available quantity; expired batch; duplicate request returns the original result rather than an error).

### 12.2 Mapping
| Class | Status | Example |
|---|---|---|
| Validation | 400/422 | Field-level errors |
| Not authenticated | 401 | Expired session |
| Not authorized | 403 | Missing permission/branch |
| Not found (including cross-tenant) | 404 | Indistinguishable from forbidden resources |
| Conflict | 409 | Version mismatch, duplicate invoice number, insufficient stock |
| Too many requests | 429 | Throttling |
| Dependency failure | 502/503 | Storage or email unavailable |
| Internal | 500 | Reference ID shown to the user |

### 12.3 Transactional guarantees
Any error inside a use case rolls back its transaction. The user-facing message states only what is known (for example that no stock was changed, once rollback is confirmed), per DESIGN.md 10.8.

### 12.4 Process-level
Unhandled promise rejections and exceptions are logged and the process exits for the supervisor to restart; in-flight requests are drained on shutdown signals (graceful shutdown), and database connections are closed cleanly.

---

## 13. Security Boundaries

### 13.1 Trust boundaries
1. **Internet → proxy/API:** all input is untrusted; TLS only; size, rate and type limits.
2. **Session → tenant context:** tenant identity comes only from the server-side session.
3. **API → database:** least-privilege application database role (no schema changes at runtime); tenant scoping in repositories and optionally RLS.
4. **API → object storage:** private bucket, no public access; downloads through authorized endpoints that issue short-lived signed access; keys include the business and are never guessable.
5. **Platform realm ↔ tenant realm:** separate authentication, routes and permissions; no platform endpoint returns tenant sales, invoices, stock or purchase data (PRD SA-FR-005).
6. **Admin tooling (database console, backups):** restricted to named operators; access is logged.

### 13.2 Controls
| Threat | Control |
|---|---|
| Cross-tenant access | Section 8.2 (three layers) |
| Privilege escalation | Backend permission checks, no reliance on UI, role-editor limits |
| Session theft / CSRF | HTTP-only Secure signed cookies, SameSite, Origin check, short idle timeout |
| Credential attacks | Argon2id, throttling, lockout, uniform responses |
| Injection | Prisma parameterization; no string-built queries; zod validation on all input |
| XSS | Output escaping by the framework; strict content-security policy; no unsafe HTML rendering of user data |
| Malicious uploads | Type and size limits, content sniffing, private storage, no execution, downloads with a safe content disposition; spreadsheet parsing limits against oversized or crafted files |
| Dependency risk | Lockfile, supply-chain checks, routine updates and advisory monitoring; pnpm build scripts approved only deliberately |
| Information leakage | Generic errors, no stack traces, logs exclude secrets and personal data |
| Abuse / denial | Rate limits, body limits, pagination caps, timeouts |
| CORS | Explicit allowlist of the known front-end origins; no wildcard with credentials |
| Secrets exposure | Environment-only, secret manager in hosted environments, never logged |

### 13.3 Data privacy
Collect only what the PRD needs; customer data is minimal and permission-gated (PRD OQ-32); personal data is excluded from logs; jurisdiction-specific obligations are assessed **[Pending OQ-42]**.

---

## 14. Repository and Folder Structure

### 14.1 Proposed layout
A single repository with a pnpm workspace. Existing `backend/` and `frontend/` folders are kept by name to avoid churn **[AD-4]**.

```
pharmaErp/
├─ PRD.md  DESIGN.md  ARCHITECTURE.md
├─ pnpm-workspace.yaml            (workspace root; build-script approvals live here)
├─ docker-compose.yml             (local Postgres; Redis only if enabled)
├─ .env.example   .gitignore
├─ backend/                       (API; Express + Prisma)
│  ├─ prisma/                     (schema, migrations)
│  ├─ src/
│  │  ├─ app.ts  server.ts        (app assembly / process entry)
│  │  ├─ config/                  (validated environment)
│  │  ├─ middleware/              (request id, session, tenant, authz, validation, idempotency, errors)
│  │  ├─ modules/
│  │  │  ├─ platform/ tenancy/ iam/ catalog/ inventory/ imports/
│  │  │  ├─ suppliers/ purchasing/ sales/ customers/ reporting/ audit/
│  │  │  └─ (each module: routes, controllers, services, repositories, schemas, tests)
│  │  ├─ domain/                  (pure rules: money/tax, units, expiry, FEFO)
│  │  ├─ integrations/            (storage, email, queue-later)
│  │  ├─ shared/                  (errors, logger, ids, pagination)
│  │  └─ docs/                    (OpenAPI assembly)
│  └─ tests/                      (integration, isolation, concurrency suites)
├─ frontend/                      (pharmacy PWA; React + Vite)
│  └─ src/ (app shell, features/…, routes, api client, pwa)
├─ admin/                         (platform admin web)
└─ packages/
   ├─ contracts/                  (zod schemas, types, permission catalog, shared domain calculations)
   └─ ui/                         (tokens, primitives, patterns from DESIGN.md)
```

### 14.2 Rules
- Code under `modules/<name>` is private to that module except its exported service interface.
- `domain/` has **no** database, network or framework imports.
- `packages/contracts` is the only place API shapes and the permission catalog are defined.
- Tests live beside the code they cover; cross-cutting suites live in `backend/tests`.
- The current backend `tsconfig` and scripts are updated as part of implementation to match this layout (the earlier build-configuration fixes remain valid).

---

## 15. Testing Strategy

| Level | Scope | Tooling |
|---|---|---|
| **Unit** | Domain rules: money/tax/rounding, unit conversion, expiry boundary, FEFO selection, permission evaluation | Vitest |
| **Integration** | Services and repositories against a **real PostgreSQL** (never a mocked database) including transactions, constraints, rollback | Vitest + ephemeral Postgres |
| **API** | Every route: validation, authorization, error shapes, OpenAPI conformance | Supertest |
| **Tenant isolation** | Two-tenant suite across **every** endpoint (read, update, delete, download, report) | Automated, must be 100% passing (PRD NFR-TEN-01, AC-03) |
| **Concurrency** | Parallel sales of the last unit, parallel receipts, duplicate-request replay, no negative balances | Integration with real parallelism (PRD AC-09, AC-05) |
| **Reconciliation** | Batch balance equals the sum of movements; invoice totals equal recalculation | Automated checks run in CI and as a scheduled production check (NFR-DAT-01/02) |
| **Frontend component** | Primitive behavior, keyboard operation, states | Vitest + testing library |
| **Accessibility** | Automated rules on every page/state plus manual keyboard and screen-reader checks of billing, receiving, import | axe-based checks, manual protocol (DESIGN.md 12.5) |
| **End-to-end** | Core journeys from PRD Section 9: setup → opening stock → purchase → receipt → bill → report; permission denial paths | Playwright |
| **Security** | Dependency audit, static analysis, authorization negative tests | CI jobs |
| **Load** | Medicine search, bill save, month report at agreed volumes | Targets pending OQ-38 |
| **Backup restore** | Rehearsed restore into a clean environment | Scheduled drill |

Rules: every acceptance criterion in PRD Section 18 maps to at least one automated test; billing and stock code carries the highest coverage expectations; no merge when the isolation, concurrency or reconciliation suites fail. Test data uses no real personal data.

---

## 16. MVP vs Future Scalability

### 16.1 MVP architecture (this document's build target)
Modular monolith; PostgreSQL only for state (including sessions and idempotency); private object storage; email provider; synchronous imports with size/row limits; alerts and reports computed on demand; PWA front end; platform admin web; Swagger in non-production.

### 16.2 Introduce later, only on a trigger
| Capability | Trigger | Approach |
|---|---|---|
| **Redis + BullMQ worker** | Imports or reports exceeding request-time limits; scheduled alert scans or email sending needing retries; shared rate-limiting across many API instances | Worker as a **second process from the same codebase**; jobs are idempotent and keyed; failures visible and retryable; Redis used as the queue only, never as source of truth (PRD C-2, OQ-41) |
| Read replica / reporting tables | Slow reports at real data volumes | Replica for reports or maintained summary tables reconciled with source records |
| Table partitioning / archiving | Very large stock-movement or sales history | Partition by time; archive per retention policy |
| Horizontal API scaling | Load growth | Already supported by the stateless API and shared Postgres sessions |
| Search service | Catalog or history search beyond Postgres capability | Introduce only if database search measurably fails |
| Android client | After the web MVP (PRD OQ-14) | Reuses the same versioned REST API; token-based sessions for mobile may be added as a second authentication mode |
| Subscriptions | Commercial phase | A new `billing` module with a payment-gateway adapter; plan limits implemented through a feature-gating layer that is **absent** from MVP code paths |
| Offline billing | Only if re-approved | Would require a separate design (local store, sync, conflict resolution); not prepared for in MVP beyond idempotent APIs |
| OCR | If approved | Isolated suggestion service (Section 10.1) |
| Service extraction | A module with distinct scaling or team ownership | Module boundaries and public service interfaces make extraction possible; not planned |

---

## 17. Deployment Approach

### 17.1 Packaging
- Containerized backend and static front-end builds; a multi-stage build produces a small production image running as a non-root user.
- Front ends are static assets served from the proxy or a static host, with long-lived caching for hashed assets and a short-lived entry document.

### 17.2 Topology (MVP)
- Reverse proxy with TLS in front of one or more identical API instances.
- Managed PostgreSQL with automated backups and point-in-time recovery (preferred over self-managed for MVP reliability).
- Private object storage bucket.
- Staging environment mirrors production.
- Hosting provider and region are a decision for the owner **[AD-5]**; the architecture requires only containers, managed Postgres and S3-compatible storage, so it is portable.

### 17.3 Release process
1. Continuous integration: install from the lockfile, lint, type-check, build, run all test suites against ephemeral Postgres, audit dependencies.
2. Build versioned images and front-end bundles.
3. Deploy to staging; run migrations; smoke tests including a health check.
4. Approval, then production deployment.
5. **Database migrations** run as a separate release step (`migrate deploy`), never at application start-up, using an **expand-then-contract** pattern so the previous application version keeps working during rollout and rollback is possible.
6. Post-deploy smoke tests; rollback procedure documented and tested.

### 17.4 Operations
- **Health endpoints:** liveness (process up) and readiness (database reachable).
- **Logging:** structured JSON, request ID in every line, shipped to a log service; no secrets or personal data.
- **Monitoring and alerts:** error rate, latency, failed logins, failed receipts/bills, database and storage health, backup success, scheduled reconciliation results.
- **Graceful shutdown** and zero-downtime rolling restarts.
- **Backups and restore drills** as in Section 8.8; an incident runbook for data-integrity incidents.
- **Availability target** to be set by the owner **[Pending OQ-38, NFR-AVL-01]**.

---

## 18. Architecture Decisions Needing Sign-off

| ID | Decision | Recommendation | Trade-off |
|---|---|---|---|
| AD-1 | Add PostgreSQL Row-Level Security as a second tenant-isolation layer in MVP | **Yes** | Extra setup complexity with Prisma vs strong protection against the highest-impact risk |
| AD-2 | Keep or remove the `pg` package | Remove unless a Prisma driver adapter is chosen | Fewer dependencies vs adapter flexibility |
| AD-3 | Platform admin as a separate build/deployment (vs route group in the pharmacy app) | Separate build | Slightly more setup vs smaller attack surface and clearer realm separation (PRD OQ-14) |
| AD-4 | Keep `backend/` and `frontend/` names; add `admin/` and `packages/` | Yes | Familiar names vs fully renamed apps layout |
| AD-5 | Hosting provider and region | Owner decides; managed Postgres + S3-compatible storage required | Cost, data-residency, jurisdiction (PRD OQ-42) |
| AD-6 | Better Auth with database-backed sessions in Postgres rather than stateless tokens | Sessions | Per-request lookup cost vs instant revocation; session token stored as issued, mitigated by the signed cookie (owner-approved 2026-11-04) |
| AD-7 | Introduce BullMQ in MVP or defer to trigger-based | Defer (Section 16) | Slightly slower imports vs less infrastructure |
| AD-8 | Spreadsheet and CSV parsing libraries | Select at implementation with advisory and size-limit review | — |

Dependencies on open PRD questions: billing calculations (OQ-2), returns (OQ-8), jurisdiction and retention (OQ-37, OQ-42), scale and availability targets (OQ-38), customer data (OQ-32), wholesale credit (OQ-33).

---

## 19. Traceability to the PRD

| PRD area | Architecture sections |
|---|---|
| Tenant isolation, permissions (BR-01..03) | 4.3, 7, 8.2, 13 |
| Stock correctness (BR-05..07, BR-13) | 6.2–6.4, 8.3, 8.4 |
| Duplicate prevention (BR-12) | 8.5, 9.3 |
| Billing and totals (RB-FR-002, BR-10) | 6.4, 8.6 |
| Import (IM-FR) | 6.2, 13.2 |
| Invoice upload (IU-FR) | 6.3, 10, 13.1 |
| Online-only PWA (NFR-PWA-01) | 5.3, 16 |
| Auditability (NFR-AUD-01) | 8.7 |
| Backup and recovery (NFR-BKP-01) | 8.8, 17.4 |
| Error and empty states (PRD Section 15, DESIGN.md Section 10) | 12, 5.2 |
| Redis/BullMQ approval (C-2) | 2, 16 |
