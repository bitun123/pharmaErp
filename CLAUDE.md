# Agent Rules - Pharma ERP Project
This file is mandatory. The agent must read and follow these rules before starting any task.

## 1. First Rule - Code First, Never Guess
- Read the existing codebase thoroughly before answering or writing code.
- If something is not found in the codebase, explicitly state: `"Not found in code"`.
- Never guess tech stack details, file names, or function names from training memory.
- Include the exact file path and line number with every claim (e.g., `src/billing/service.ts:42`).

## 2. No Assumption Rule
- Never make assumptions on your own.
- If there is any doubt, unclear requirement, or more than one way to implement something, stop and ask the owner.
- Never write code based on assumptions. Ask first, then write.

## 3. Follow Existing Code Structure
- Before writing new code, inspect how code is structured in this project.
- Follow the exact same folder structure, naming conventions, and design patterns.
- If the project uses a Service pattern, use the Service pattern. If it uses a Controller pattern, follow that.
- Do not invent new patterns on your own.
- Do not refactor existing code without a valid reason and approval.

## 4. Plan, Prioritize & Permission Rule - Most Important
- **Propose the Plan First:** Before creating, updating, or deleting any file, present a clear implementation plan covering:
  1. **What** will change and **why**.
  2. **Which files** will be created, modified, or affected.
  3. **Potential impact** (what could break or be affected).
- **Prioritize Tasks According to the Plan:** Break the plan into prioritized tasks before coding, ordered by dependency and criticality:
  - **P0 (Critical / Blockers):** Schema, migrations, security, core types, or shared utilities that other tasks depend on.
  - **P1 (Core Logic):** Services, APIs, business rules, and validation.
  - **P2 (UI / Secondary):** Frontend integration, polish, and non-blocking enhancements.
- **Wait for Approval:** Never execute code changes, package installs, database migrations, deletions, or config changes until the owner explicitly approves the plan and priority order.
- **Read-Only Exception:** Read-only tasks (reading files, analyzing bugs, explaining code) do not require permission.

## 5. Security Rules
- Never hardcode passwords, tokens, API keys, or secrets in the code.
- Always load secrets from environment variables, and never commit `.env` files.
- Never insert user input into the database without validating it first.
- Protect against SQL injection, XSS, and authentication bypasses.
- Exercise extra caution in billing and payment code: always validate amounts and quantities on the server side.
- Never print sensitive data in logs.

## 6. Handle Edge Cases
- For every feature, explicitly think through and handle:
  - What happens if the data is empty?
  - What happens if stock is 0 (should billing be allowed or blocked)?
  - What happens if a medicine is expired?
  - What happens if the user provides invalid input?
  - What happens if the network or database fails?
- Handle failure paths just as carefully as the happy path.

## 7. DRY Principle
- Do not repeat the same code.
- If the same logic is needed in two places, extract it into a shared utility/function and reuse it.
- Do not bloat the codebase by copy-pasting code.

## 8. Other Important Principles
- **KISS:** Keep the code simple; do not overcomplicate it.
- **YAGNI:** Do not build what is not needed right now; avoid adding speculative features for the future.
- **Single Responsibility:** One function or file should do one job only.
- **Clean Naming:** Use clear, self-explanatory variable and function names (e.g., `calculateTotalBill`, `checkStock`).
- **Error Handling:** Handle every error with a proper message; never fail silently.
- **Validation:** Validate inputs on both the frontend and the backend.

## 9. Standard Agent Rules
- Work on one task at a time; do not try to do everything in a single message.
- **Verification Gate:** Before marking any task or phase as "done", run typecheck, linter, and relevant tests. Never mark a task complete if the build, types, lint, or tests fail.
- Stop after completing a phase and ask: `"Next phase?"`
- Give crisp answers: lead with a direct 3–4 line summary, and provide details only when asked.
- Respond using bullet points and tables rather than long paragraphs.
- Use simple, plain language without unnecessary jargon.
- Before making any major change, explain its impact—which files could break and which features will be affected.

## 10. Pharma ERP Specific Rules
- Never allow medicine stock to go negative.
- Keep GST, discount, and total billing calculations in a single centralized place.
- Block selling expired medicines or enforce a strict warning.
- Report data must always come from the database—never use hardcoded values.
- Strictly enforce user roles (e.g., Admin, Cashier, Pharmacist) so users can only access what they are permitted to do.

## 11. Frontend / Backend Scope Rule
- **Working on the frontend:** do NOT change anything in the backend (`apps/backend`). Only analyze the backend (read-only) and implement the frontend according to what the backend actually does.
- **Working on the backend:** do NOT change anything in the frontend (`apps/frontend`).
- If a task needs a change on the other side, stop and tell the owner what is needed. Do not make that change yourself.
- Shared code (`packages/contracts`) is the exception only when the owner has approved it in the plan.

## 12. Database Rule - Most Important
- **Never perform any operation on the database.** Do not change, update, or delete data or structure.
- This includes: INSERT / UPDATE / DELETE, schema changes (DDL), migrations, `prisma db push`, `prisma db execute`, seed scripts, `psql` or any other database client, and scripts or tests that connect to the database and write to it.
- Do not run any command that connects to the database to read or write. If database work is needed, give the owner the exact command or SQL and let the owner run it.
- Editing `schema.prisma` or code files is allowed only after plan approval (rule 4), but applying the change to the database is always done by the owner.