# AGENTS.md — Rules for Coding Agents on Pharma ERP

These rules apply to every AI coding agent and every contributor working in this repository. They are mandatory. If a rule here conflicts with a request, stop and ask instead of choosing silently.

| Field | Value |
|---|---|
| Version | 0.1 (draft) |
| Applies to | All work in this repository |
| Source documents | `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md` |

---

## 1. Source of Truth and Precedence

1. **Read before you act.** At the start of any task, read the parts of the documents relevant to it. Do not work from memory of earlier sessions.
2. **Documents win over assumptions.** Never invent business behavior, endpoints, columns, permissions, screens or rules.
3. **Precedence when documents disagree** (highest first):
   1. `PRD.md` — what the product must do and the business rules.
   2. `DATABASE.md` — data model and integrity constraints.
   3. `API.md` — contracts between front end and back end.
   4. `ARCHITECTURE.md` — how the system is built.
   5. `DESIGN.md` — visual design and UX.
   6. Existing code — evidence of current state, not of intent.
4. **Report conflicts; do not resolve them silently.** If two documents or the code contradict each other, say so, propose a resolution, and wait for approval before building on either side.
5. **Status labels are binding.** A requirement marked *Proposed* or *Open*, or tagged **[Pending OQ-n]**, **[AD-n]** or **[DQ-n]**, is **not approved**. Do not implement it, and do not implement code that guesses its answer. Examples that are currently blocked: discount/tax/rounding calculation (OQ-2), returns (OQ-8), regulatory medicine fields (OQ-7), wholesale credit (OQ-33).
6. **A proposal in a document is not permission to build it.** Only *Confirmed* or *Approved* items are in scope.
7. **Out of scope unless the owner says otherwise:** subscriptions and payment gateways, offline billing, purchase orders, inter-branch transfers, OCR, microservices, and an Android app.
8. **Do not edit the five source documents** unless the task is explicitly to update documentation. If an implementation reveals a documentation gap, report it instead of rewriting the document.

---

## 2. Working Method for Every Task

1. **Understand the task.** Restate it in one or two sentences. If it is ambiguous, or touches an open question, ask before writing code.
2. **Inspect existing code first.** Read the files you will touch, their neighbours, and the existing pattern for the same kind of thing (a similar module, route, service, component, test). Search the repository before creating anything new.
3. **Plan the smallest change** that satisfies the requirement and its acceptance criteria. State the files you expect to change.
4. **Make the change** following the existing patterns.
5. **Verify** with the project's own checks: type-check, lint, tests (Section 11). Report real results; never claim something passed without running it.
6. **Summarize** what changed, what you verified, what you did not, and any decision you need from the owner.

Stop and ask before proceeding when: a requirement is unclear or marked open; the change needs a new dependency, a schema change, a new endpoint or permission not in the documents; the change would touch many unrelated files; or an action is destructive or irreversible.

---

## 3. Scope and Change Discipline

- **Do only what was asked.** No drive-by refactors, renames, reformatting, dependency bumps, comment rewrites or "while I'm here" fixes. If you notice an unrelated problem, mention it in your summary and leave it alone.
- **No unnecessary rewrites.** Prefer extending and adjusting existing code over replacing it. A rewrite needs explicit approval.
- **Small, reviewable changes.** One concern per change. Large features are delivered in vertical slices that each leave the project working.
- **Never leave the project broken.** The build, type-check and tests that passed before your change must still pass.
- **No dead code, no commented-out code, no unused exports or files** left behind by your change. Delete what you made obsolete (and only that).
- **No placeholder implementations** presented as complete. If something is unfinished, say so plainly and mark it clearly; never fake a result.
- **Do not weaken a safeguard to make something pass** (a test, a type, a constraint, a lint rule, a permission check). Fix the cause or report the blocker.

---

## 4. Code Quality and Naming

### 4.1 General
- Write code that reads like the surrounding code: match its structure, comment density, naming and idiom.
- Prefer clear, simple code over clever code. One function does one thing; keep functions short enough to read at a glance.
- Handle each case explicitly; avoid hidden global state and implicit behavior.
- Comments explain **why** (a business rule, a constraint, a non-obvious decision), not what the code already says. Reference requirement IDs (for example `SR-FR-001`, `BR-05`) where a rule comes from the PRD.
- No magic numbers or strings: use named constants or configuration. Business values (tax rates, limits, windows) are **data/configuration, never hard-coded** (PRD A4).

### 4.2 Naming
| Item | Convention |
|---|---|
| Files and folders | `kebab-case`; one main export per file where practical |
| Types, classes, components | `PascalCase` |
| Functions, variables | `camelCase`, verb for functions (`confirmReceipt`), noun for values |
| Constants | `UPPER_SNAKE_CASE` only for true constants |
| Database tables/columns | `snake_case`, plural tables (see `DATABASE.md`); Prisma models map to them |
| API paths | lowercase, plural nouns, `kebab-case` (see `API.md`) |
| Booleans | Read as a question: `isActive`, `hasStock` |
| Permission codes | `module.action` exactly as in `API.md` Section 5.2 |

- Use the **domain vocabulary from the PRD** consistently: Medicine, Batch, Purchase, Receipt, Bill/Invoice (Sale), Adjustment, Branch, Business (tenant). Do not alternate synonyms or invent new names for existing concepts.
- Names reveal intent; avoid abbreviations except universally known ones.

### 4.3 Formatting and linting
Follow the repository's formatter and lint configuration. Do not change formatter or lint settings as part of a feature. Do not reformat files you did not otherwise change.

---

## 5. Project and Folder Structure

Follow the structure in `ARCHITECTURE.md` Section 14. Key rules:

- **Backend layering is one-way:** routes → controllers → services → repositories / integrations. Domain utilities are pure and called by services.
  - **Routes** map paths to controllers and attach middleware. No logic.
  - **Controllers** parse validated input, call one service method, shape the response. No business logic, no data access.
  - **Services** hold business rules, transaction boundaries, audit events and sensitive-rule re-checks.
  - **Repositories** are the only code that talks to Prisma, and every query is tenant-scoped.
  - **`domain/`** is pure functions (money/tax, units, expiry, FEFO): **no** database, network or framework imports.
  - **Integrations** (storage, email) sit behind interfaces.
- **Modules are private.** Code in `modules/<name>` is used by other modules only through that module's exported service interface. **Only `inventory` writes stock balances and movements**; other modules call it inside their own transaction.
- **Shared contracts** (validation schemas, types, permission catalog, shared calculations) live in `packages/contracts` and are the only definition of API shapes. Do not duplicate types between back end and front end.
- **Shared UI** (tokens, primitives, patterns) lives in `packages/ui`. Feature code in front-end apps is organized by feature.
- Put new files where the existing pattern puts them. If no pattern exists, follow `ARCHITECTURE.md`; if that is silent, ask.
- Do not create new top-level folders, apps or packages without approval.

---

## 6. Component and Code Reuse

- **Search before you build.** Before writing a component, hook, helper or schema, look for an existing one in `packages/ui`, `packages/contracts`, the feature folder, and `shared/`.
- **Use design-system components and tokens** from `DESIGN.md` for every UI element. No one-off colours, font sizes, spacing, radii or shadows; use tokens only. If a needed component or pattern does not exist, add it to the shared UI package following `DESIGN.md` (with all states and accessibility behavior) rather than creating a local variant.
- **Reuse the shared line-item grid, data table, form controls, dialog, badge and banner patterns** defined in `DESIGN.md` Section 8.
- **Reuse validation schemas** from `packages/contracts` on both sides; never re-declare a rule in a second place.
- **Reuse the money, tax, unit and expiry modules** in `domain/`. Never compute amounts, rounding, FEFO or expiry rules inline in controllers, services or components.
- Rule of three: extract shared code on the third real use, not speculatively. Do not build abstractions for one caller.

---

## 7. Dependency Management

- **Do not add, remove, upgrade or downgrade a dependency without explicit approval.** This includes dev dependencies. Propose it first with: the need, alternatives considered (including doing it without a package), size/maintenance/security record, and licence.
- **Prefer** the standard library and packages already in the project. The approved stack is in `ARCHITECTURE.md` Section 2; anything outside it needs approval.
- **Never run package-manager commands that change the install** (install, add, remove, update) unless the task explicitly includes it and approval exists. Never edit the lockfile by hand.
- **pnpm build scripts:** never approve or enable dependency build scripts (the `allowBuilds` entries) automatically. Ask the owner each time; explain which package and why.
- Pin versions as the project does; keep `packageManager` and Node versions consistent with the repository's configuration.
- **Redis, BullMQ and Swagger** are approved technologies but are used **only** where a confirmed requirement needs them (`ARCHITECTURE.md` Section 16). Do not add background jobs or caching "because they are available".
- Do not introduce microservices, new datastores, message brokers or new third-party services without approval.
- Treat third-party packages as untrusted input: do not run install scripts from unknown sources, and do not copy code from the internet without checking its licence and security.

---

## 8. Type Safety and Validation

- TypeScript **strict mode** stays on. Do not weaken compiler options to make code compile.
- **No `any`.** Use `unknown` and narrow it. No non-null assertions or type casts used to silence errors; fix the type. A genuinely unavoidable escape hatch needs a one-line comment explaining why and an owner-visible mention in your summary.
- **No `@ts-ignore` or `@ts-expect-error`** without an explanatory comment and approval.
- **Validate all external input at the boundary** (HTTP params/query/body, file contents, environment variables, parsed spreadsheet cells) with the shared schemas. Inside the system, trust validated, typed values.
- **Derive types from schemas**; do not hand-write duplicate types for API shapes.
- **Money:** only fixed-precision decimals; **never floating-point numbers**. In the API, money and decimals are strings. **Quantities** are integers in the base unit. **Dates:** date-only values stay date-only (no time zone drift); timestamps are UTC.
- Use enums/union types for closed sets; make impossible states unrepresentable where practical.
- Exhaustively handle unions and enum values.

---

## 9. Error Handling

- Use the **typed application errors and the central error handler** described in `ARCHITECTURE.md` Section 12 and the response shape in `API.md` Section 3.3. Do not invent new error formats or status mappings.
- Throw typed errors with **stable error codes**; the front end maps codes to the messages in `DESIGN.md` Section 10. Never rely on matching message text.
- **Never swallow errors.** No empty `catch`. Either handle meaningfully (with a defined user outcome) or let it propagate.
- **Never expose internals** to clients: no stack traces, SQL, file paths or other tenants' identifiers.
- **Transactions are all-or-nothing.** Every stock- or money-changing use case runs in one database transaction; any error rolls everything back. Do not catch an error inside a transaction and continue as if it succeeded.
- Integrations (storage, email): set timeouts, use bounded retries only where safe, and implement the failure behavior defined in `API.md` Section 13.2. Never leave a database record claiming a file exists when it does not.
- Front end: implement loading, empty, error, permission-denied and offline states for every screen as defined in `DESIGN.md` Section 10. A screen without them is not finished. After a failure, keep the user's entered data on screen.
- Log errors with the request ID and context but **without** secrets or personal data (Section 10).

---

## 10. Security and Secrets

### 10.1 Secrets
- **Never read, print, log, copy, commit, summarize or transmit the contents of `.env` files, credentials, tokens, keys, cookies or connection strings.** If you must verify a variable exists, check presence only and never show its value.
- **Never hard-code** credentials, keys, URLs with credentials, or test passwords that resemble real ones. Use environment variables validated at start-up (`API.md` Section 11).
- Maintain `.env.example` with **names and placeholders only**. Never add real values. Ensure `.env*` (except `.env.example`) is in `.gitignore` **before** any `.env` file is created.
- **Never place secrets in front-end code or front-end build variables**; those are public. Provider credentials stay on the server.
- Do not paste secrets into issues, commit messages, comments, test files, logs or documentation.
- If you discover a secret in the repository, **stop, do not repeat it**, and report its location to the owner so it can be rotated.

### 10.2 Authentication, authorization and tenancy
- **Every endpoint authenticates and authorizes on the server.** UI hiding is convenience, never security (PRD BR-03). Every new route declares the permission code it requires, uses the shared permission catalog, and checks branch scope where relevant (`API.md` Section 5).
- **Never accept a tenant or business identifier from the client.** The tenant comes only from the session.
- **Every database query goes through a tenant-scoped repository.** Never write a query by bare record ID without the tenant context. Cross-tenant records must behave as not-found.
- Never add a "bypass", "debug" or "admin" shortcut around authentication, permissions or tenant scoping, even temporarily.
- Do not give platform roles access to tenant business data (PRD SA-FR-005).
- Sensitive rules (discount authority, batch override, adjustments, role-editor limits) are re-checked in the service layer, not only in routes.
- Passwords and tokens: hashed storage only; never log or return them; follow the session/CSRF design in `API.md` Section 4.

### 10.3 Other
- Treat all input as hostile: validate, parameterize, escape output. No string-built queries, no raw HTML rendering of user data.
- Uploads: enforce type and size limits, verify content, never trust file names, store privately (`API.md` Section 7.3).
- CORS uses the explicit allowlist; never a wildcard with credentials. Do not enable Swagger in production.
- Do not weaken security headers, rate limits, session settings or cookie flags.
- Dangerous or destructive scripts and commands are forbidden unless explicitly requested (Section 13).

---

## 11. Database and API Access

### 11.1 Database
- **All schema changes go through Prisma Migrate migrations** that follow `DATABASE.md`. Never change the database by hand, and never edit an already-merged migration.
- Implement the schema as designed: keys, tenant-safe composite foreign keys, check constraints, partial indexes, immutability of `stock_movements` and `audit_events`, and row-level security. **If you think the design is wrong, report it; do not deviate silently.**
- Hand-written SQL needed for features Prisma cannot express lives in the migration, with a header explaining it.
- **Only the Prisma repositories access the database.** No direct database access from controllers, services, scripts or tests outside the repository layer (except migration and test harness code).
- **Stock integrity:** balances change only through `inventory`'s movement operation, inside the same transaction as the movement. Never update `inventory_balances` directly, never edit or delete a movement, never create negative stock, and never bypass the guarded update used for deductions.
- **Concurrency and idempotency:** apply the patterns in `ARCHITECTURE.md` 8.4–8.5 to every stock- or money-changing endpoint; use the `Idempotency-Key` handling already defined, not a new mechanism.
- **Money and tax logic** lives only in the `domain` money module. No formulas for discounts, tax or rounding are written until **OQ-2** is decided; if a task needs them, stop and ask.
- Use soft deactivation, not deletion, for business records (PRD BR-16).
- **Never run migrations against, or connect to, any shared, staging or production database.** Migration commands run only against a local or ephemeral development database, and only when the task calls for it. Never run reset, drop, truncate or seed commands against anything you have not confirmed is a disposable local database.
- Use synthetic data in development and tests; never copy real data.

### 11.2 API
- **Implement endpoints exactly as defined in `API.md`:** path, method, permission code, validation, response shape, error codes, idempotency and pagination rules. Do not add, rename or repurpose endpoints without approval; if the document needs a change, report it.
- Define request/response schemas once in `packages/contracts`; generate validation, types and OpenAPI from them.
- Follow the conventions: decimal strings for money, ISO dates, the standard error shape, standard pagination, `version` for concurrency, explicit `POST` actions for business state changes.
- **Totals and availability are computed by the server.** Never trust client-sent totals, prices, permissions, tenant or branch scope.
- Front-end code talks to the API only through the typed API client; no ad-hoc `fetch` calls scattered in components.
- Keep the OpenAPI document in sync with the implementation as part of the same change.

---

## 12. Testing

- **Every change ships with tests** proportionate to its risk. Each requirement implemented must be traceable to its acceptance criteria in `PRD.md` Section 18 and its edge cases in Section 16.
- Required test layers (`ARCHITECTURE.md` Section 15): unit tests for domain rules; integration tests against a **real PostgreSQL** (never a mocked database); API tests for validation, authorization and error shapes; the **two-tenant isolation suite**; concurrency tests; reconciliation checks; accessibility checks; end-to-end tests for core journeys.
- **Any new endpoint** gets tests for: success, validation failure, unauthenticated, forbidden (missing permission), wrong branch, **cross-tenant access**, and the relevant business-rule failures.
- **Any stock- or money-changing code** gets tests for atomic rollback, idempotent replay, and concurrent requests.
- **Any new screen or component** is tested for keyboard operation and all its states, and checked against `DESIGN.md` accessibility requirements.
- Tests must be deterministic and independent; do not depend on test order, wall-clock time or real external services (use the interface fakes).
- **Never weaken, delete, skip or loosen a test to make a change pass.** If a test is wrong, explain why and get approval before changing it. If a failing test reveals a real bug, fix the bug.
- **Report results honestly.** State exactly which commands you ran and what they returned. If you could not run something (environment, missing service, blocked by policy), say "not verified" and why. Never write "tests pass" without having run them.
- Do not leave debugging output, `.only`/`.skip`, or temporary files behind.

### Definition of done
A task is done only when: the implementation matches the documents; acceptance criteria are covered by tests; type-check, lint and the relevant tests pass (actually run); security and tenant-isolation rules are met; all UI states exist; no unrelated files changed; documentation touched by the change is current; and the summary lists what was verified and what was not.

---

## 13. Safe Operation Rules

Do not do any of the following without explicit instruction for that specific action:
- Delete, overwrite or move files you did not create in this task.
- Run destructive commands (recursive deletes, database reset/drop/truncate, force pushes, history rewrites).
- Run migrations, seeds or scripts that write to a database other than a confirmed disposable local one.
- Install, upgrade or remove packages, or approve dependency build scripts.
- Change environment files, deployment configuration, CI configuration or infrastructure.
- Call external services with real credentials, or send real emails or requests to third parties.
- Disable or bypass hooks, linters, type checks, tests, authentication or permissions.
- Commit, push, tag, merge or open pull requests (see Section 15).

Prefer reversible, read-only investigation first. Before deleting or overwriting anything, look at what is there.

---

## 14. Documentation

- Code is self-documenting first; comments explain why. Public module interfaces get a short description of purpose and contract.
- **Keep documentation current with the change:** the OpenAPI document (generated from schemas), `.env.example` when variables change, migration headers, and a short note in the pull request summary for behavior changes.
- Do not create new documentation files, READMEs or planning documents unless asked.
- When you implement something from the documents, reference the requirement ID in the relevant code comment or test name so traceability survives.
- **Do not edit `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md` or `API.md`** as a side effect of coding. Propose the change in your summary; the owner approves documentation updates.
- Record unresolved questions you encounter in your summary with the question, why it matters, the options and your recommendation. Do not bury them in code comments.

---

## 15. Git and Change Discipline

- **Do not commit, push, merge, tag or open pull requests unless the owner asks.** When asked, work on a feature branch, never directly on the default branch.
- If the folder is not yet a git repository, do not initialize one without being asked. Before it exists, `.gitignore` must be ready so that secrets and build output are never tracked.
- **Never commit secrets,** `.env` files (other than `.env.example`), credentials, build output (`dist/`), dependency folders, generated files that are not meant to be tracked, or real data.
- **Commits:** small and focused, one logical change each. Message format: a short imperative summary line, then a body explaining *why* when it is not obvious, and reference the requirement ID where relevant. Add the co-author trailer required by the environment. Never include secrets or personal data in a message.
- **Do not rewrite history** of shared branches. Do not amend or force-push unless explicitly instructed.
- **Pull request descriptions** state: what changed and why, the requirement IDs covered, how it was verified (actual commands and results), what was not verified, risks, and any documentation conflicts or open questions. Include the attribution line required by the environment.
- Keep diffs minimal: no unrelated formatting changes, no mixing refactors with feature work, no committed commented-out code.
- Migrations are committed with the feature that needs them and are never edited afterward; fixes are new migrations.

---

## 16. Communication Rules

- Be direct and factual. State what you did, what you verified, and what you did not.
- Never claim completion that you have not verified. Never claim a check passed unless you ran it.
- Never hide a failure, a skipped step, a workaround or a deviation from the documents.
- Use *they/them* for people whose pronouns are unknown; never guess from names.
- When you need a decision, ask a specific question, give the options and trade-offs, and give a recommendation. Do not ask for approval of trivial choices that the documents already settle.
- When blocked by an open question, say which one, stop work on the affected part, and continue with unaffected work where possible.

---

## 17. Quick Checklist (before you finish any task)

- [ ] I read the relevant parts of the five documents and followed them.
- [ ] I inspected the existing code and reused its patterns and shared components.
- [ ] I implemented only approved scope; no open or proposed item was guessed.
- [ ] No unrelated files, formatting or dependencies changed.
- [ ] No new dependency, schema change, endpoint or permission was added without approval.
- [ ] Authorization, tenant scoping and validation happen on the server.
- [ ] No secret was read, printed, logged, hard-coded or committed.
- [ ] Database changes are migrations that match `DATABASE.md`; stock changes go through `inventory` in one transaction.
- [ ] Errors use the standard shape and codes; all UI states (loading, empty, error, permission, offline) exist.
- [ ] Tests were added, actually run, and reported honestly; none were weakened.
- [ ] Documentation affected by the change is current, and conflicts or questions are reported.
- [ ] My summary lists what I verified, what I did not verify, and any decisions needed.
