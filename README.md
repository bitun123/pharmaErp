# Pharma ERP

## 1. Project Overview

Pharma ERP is intended to be software for managing medicine shops: billing, stock check and update, user details, reports and other pharmacy features.

**Current state of the code (important):** only the platform foundation is built so far.

- Sign-in, email OTP verification and password reset
- Roles and permissions (Super Admin, Admin, Staff)
- A shop management API (create, list, view, update, block, delete) and image upload
- A Super Admin dashboard screen (UI only, running on placeholder data)

The pharmacy features themselves (billing, stock, reports and so on) are **not in the code yet**. See [Features](#2-features).

It is a monorepo managed with **pnpm workspaces** and **Turborepo**:

| Part | Path | What it is |
|---|---|---|
| Backend API | `apps/backend` | Express 5 + Better Auth + Prisma + PostgreSQL |
| Frontend | `apps/frontend` | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| Shared contracts | `packages/contracts` | Zod schemas and TypeScript types used by both apps |

---

## 2. Features

### Found in code

| Feature | Where | Notes |
|---|---|---|
| Sign in with email and password | `apps/frontend/app/(auth)/signin`, Better Auth in `apps/backend/src/module/auth/config/auth.ts` | `requireEmailVerification: true`. Sessions last 7 days. |
| Sign-in code (two-factor by email) | `apps/frontend/app/(auth)/otpverify`, `twoFactor` plugin in `apps/backend/src/module/auth/config/auth.ts` | Required for every account at sign-in. 6-digit code, valid 5 minutes, 3 attempts, stored hashed. **No session exists until the code is entered.** Already signed-in sessions are not asked again. Users cannot switch it off (`disabledPaths`). |
| Forgot / reset password | `apps/frontend/app/(auth)/forgotpassword` | Uses the Better Auth email-OTP reset flow. |
| Roles and permissions | `apps/backend/src/config/permissions.ts`, `membership.service.ts` | Roles `SUPER_ADMIN`, `ADMIN`, `STAFF`. Permissions `shop:create/read/update/delete` and `media:upload/read/delete`. Only `SUPER_ADMIN` has any permission by default. |
| Shop management API | `apps/backend/src/module/shop` | Create (also creates the shop admin user), list with search, filter, sort and pagination, get by id or slug, update, soft delete. |
| Block / unblock a shop | `PATCH /api/shop/:id` with `isActive` | Blocked or deleted shops lock out their admin and staff (`authenticate.ts`, `shop-access.service.ts`). |
| Shop admin invitation | `shop/service.ts`, `POST /api/shop/set-admin-password` | If no password is given at creation, a one-time setup link (valid 48 h) is emailed. |
| Image upload (ImageKit) | `apps/backend/src/module/media`, `services/imagekit.service.ts` | JPEG, PNG, WEBP, GIF up to 5 MB. Content is checked by file bytes. Folders are limited to `/shops/logos`, `/users/avatars`, `/general`. |
| Super Admin dashboard (UI) | `apps/frontend/app/(dashboard)/dashboard` | Sidebar, stat cards and a "Recently Created Shops" table. **Uses mock data** from `features/shops/mock-data.ts`. |
| Light / dark theme | `components/theme-toggle.tsx`, `app/globals.css` | |
| Responsive layout | Sidebar collapses to a drawer on small screens | |

### Mentioned by owner, not found in code

- Billing / invoices
- Stock check and stock update
- Medicine inventory
- Customer / user details screens (the backend has users for login only)
- Sales and purchase
- Reports
- Expiry alerts and low-stock alerts
- Staff management (the `STAFF` role exists, but no API or screen manages staff)

### Partly built or not connected

- The frontend does **not** call the shop or media APIs yet. The dashboard shows mock data.
- The sidebar links to `/shops`, and the dashboard links to `/shops/new` and `/shops/[id]`. These pages are **not found in code**, so the links lead to 404.
- The shop-admin password setup email links to `/set-password` on the frontend. That page is **not found in code**.
- Sign-in with a 10-digit NPI number is accepted by the form, but `auth.api.ts` rejects it ("not available yet").
- A sign-up call exists in `auth.api.ts` (`signUp`) and in the hooks, but there is no sign-up page.

---

## 3. Tech Stack

Versions are taken from the `package.json` files.

**Monorepo / tooling**

- pnpm 11.25.0 (`packageManager`), Node.js `>=24`
- Turborepo `^2.11.11`
- TypeScript 7.0.2, Prettier 3.9.6

**Frontend (`apps/frontend`)**

- Next.js 16.4.6, React 19.3.0, with `cacheComponents` and `partialPrefetching` enabled in `next.config.ts`
- Tailwind CSS 4.3.3 (`@tailwindcss/postcss`), `tw-animate-css`
- shadcn (`^4.23.0`) with `@base-ui/react ^1.9.0`, `class-variance-authority`, `lucide-react ^1.73.0`
- `@tanstack/react-query ^5.107.1`
- `react-hook-form ^7.92.0`, `zod ^4.6.7`
- `next-themes ^0.4.6`
- ESLint 9 with `eslint-config-next`

**Backend (`apps/backend`)**

- Express `^5.3.0`, `cors ^2.8.6`, `helmet ^8.3.0`
- Better Auth `^1.7.23` (email and password, email OTP plugin, two-factor plugin used for emailed sign-in codes) with `@better-auth/prisma-adapter`
- Prisma `^7.10.1` with `@prisma/adapter-pg ^7.10.1`
- PostgreSQL (`provider = "postgresql"` in `schema.prisma`)
- Multer `^2.5.0` (uploads), ImageKit `^6.0.0` (image storage)
- Nodemailer `^10.5.0` (email; defaults to a local Mailpit at `127.0.0.1:1025`)
- Pino `^10.4.0` and `pino-http` (logging)
- `tsx ^4.23.15` to run TypeScript

**Shared (`packages/contracts`)**

- Zod `^4.6.7`, TypeScript source consumed directly (the frontend lists it in `transpilePackages`)

**Other workspace packages**

- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` come from the Turborepo starter. `@repo/typescript-config` is used by `packages/contracts`. **`@repo/ui` and `@repo/eslint-config` are not imported by either app.**

**Not found in code:** Docker or docker-compose files, a test framework or tests, CI configuration, a migrations folder.

---

## 4. Project Structure

```
pharmaErp/
├── package.json              Root scripts (turbo run dev/build/lint/check-types, prettier)
├── turbo.json                Turborepo task config (build, lint, check-types, dev)
├── pnpm-workspace.yaml       Workspaces: apps/* and packages/*
├── AGENTS.md                 Notes for AI coding agents (Turborepo docs pointer)
├── apps/
│   ├── backend/
│   │   ├── server.ts                  Entry point: connects DB, verifies SMTP, starts Express
│   │   ├── prisma/schema.prisma       Database models
│   │   ├── prisma7.config.ts          Prisma config (schema path, DATABASE_URL)
│   │   ├── scripts/
│   │   │   ├── backfill-permissions.ts        One-off: seeds membership permissions (dry run by default)
│   │   │   └── cleanup-pending-uploads.ts     Deletes ImageKit uploads never attached to a shop (dry run by default)
│   │   └── src/
│   │       ├── app.ts                 Express app: CORS, helmet, routes, error handler
│   │       ├── config/                permissions, helmet, imagekit, pino logger
│   │       ├── middlewares/           authenticate, authorize, upload (multer), error handler
│   │       ├── error/app-error.ts     AppError (code, message, statusCode)
│   │       ├── module/
│   │       │   ├── auth/              Better Auth config, DB client, mail, membership + email services
│   │       │   ├── shop/              shop routes, controller, service, shop-access rules
│   │       │   └── media/             upload / delete / details / client-token routes
│   │       ├── services/imagekit.service.ts   ImageKit calls and folder/file safety checks
│   │       ├── utils/image-signature.ts       Detects real image type from file bytes
│   │       └── generated/prisma/              Generated Prisma client (committed)
│   └── frontend/
│       ├── app/
│       │   ├── layout.tsx             Root layout (theme, React Query, toast providers)
│       │   ├── page.tsx               Home page (still the create-next-app placeholder)
│       ├── proxy.ts                   First gate: no session cookie means redirect to /signin (optimistic check only)
│       │   ├── (auth)/                /signin, /forgotpassword, /otpverify
│       │   └── (dashboard)/dashboard  Super Admin dashboard
│       ├── components/                ui (shadcn), auth, dashboard, brand/logo, providers, theme toggle
│       ├── features/auth/             Auth API calls and React Query hooks
│       ├── features/shops/            Mock data for the dashboard
│       ├── lib/                       API client (`client.tsx`), error messages, helpers
│       ├── hooks/use-mobile.ts        Mobile breakpoint hook
│       └── public/brand/              Logo files (light, dark, icon-only)
└── packages/
    ├── contracts/                     Shared Zod schemas + types (auth, shop)
    ├── ui/ eslint-config/ typescript-config/   Turborepo starter packages
```

---

## 5. How to Setup and Run

These are suggested steps based on the scripts and config in the repo. Nothing here was run while writing this README.

**Prerequisites:** Node.js 24 or newer, pnpm 11, a running PostgreSQL, and an SMTP server (the code defaults to a local Mailpit on `127.0.0.1:1025`, and the backend refuses to start if the SMTP check fails). ImageKit credentials are needed for uploads.

1. **Install dependencies** (from the repo root):
   ```bash
   pnpm install
   ```
2. **Create the env files** (they are git-ignored). Names are listed in [Environment Variables](#6-environment-variables):
   - `apps/backend/.env`
   - `apps/frontend/.env`
3. **Set up the database.** Create the PostgreSQL database and put its URL in `DATABASE_URL`. Then, from `apps/backend`, generate the Prisma client and create the tables from `prisma/schema.prisma`:
   ```bash
   cd apps/backend
   npx prisma generate
   npx prisma db push
   ```
   - There is **no migrations folder and no seed script** in the repo. `db push` is a suggestion, not a script defined in code.
   - `Shop.shopCode` defaults to a database function `generate_shop_code()`. Its definition is **not found in code**, so it must exist in your database or shop creation will fail.
4. **Create the first Super Admin.** No seed script or signup flow for this was found in code. A Super Admin is a `user` row with `role = SUPER_ADMIN`, an email-and-password `account`, and a `membership`. You must create one yourself.
5. **Start the apps.**
   - Everything via Turborepo, from the root:
     ```bash
     pnpm dev
     ```
   - Or one at a time:
     ```bash
     pnpm --filter backend dev      # runs: tsx watch server.ts   (default port 5000 unless PORT is set)
     pnpm --filter frontend dev     # runs: next dev              (default port 3000)
     ```
6. Open the frontend at `http://localhost:3000`, sign in at `/signin`, then enter the emailed 6-digit code at `/otpverify` (locally, open Mailpit to read it).

**Other scripts**

| Command | What it does |
|---|---|
| `pnpm build` / `pnpm lint` / `pnpm check-types` | Turborepo tasks across the workspace |
| `pnpm format` | Prettier on `**/*.{ts,tsx,md}` |
| `pnpm --filter backend typecheck` | `tsc --noEmit` for the backend |
| `pnpm --filter backend build` / `start` | `tsc` and `node server.js` (as defined in `package.json`) |
| `npx tsx scripts/backfill-permissions.ts [--apply]` | Run from `apps/backend`. Dry run unless `--apply` is passed. |
| `npx tsx scripts/cleanup-pending-uploads.ts [--hours=N] [--apply]` | Run from `apps/backend`. Dry run unless `--apply` is passed. |

---

## 6. Environment Variables

Names only. No values are shown here.

**`apps/backend/.env`**

| Variable | Used for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (required, the server throws if missing) |
| `BETTER_AUTH_SECRET` | Better Auth secret (required) |
| `BETTER_AUTH_URL` | Better Auth base URL (required) |
| `PORT` | Backend port (default `5000`) |
| `NODE_ENV` | `production` changes cookie/CSRF and TLS behaviour |
| `LOG_LEVEL` | Pino log level |
| `FRONTEND_URL` | Allowed frontend origin(s) for CORS and Better Auth, comma separated (default `http://localhost:3000`) |
| `PUBLIC_WEB_URL` | Base URL used in the shop-admin password setup link |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM` | Email sending (defaults: `127.0.0.1`, `1025`) |
| `SMTP_USER`, `SMTP_PASS` | Optional SMTP login |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | ImageKit uploads |

Note: the current `apps/backend/.env` also contains `CORS_ALLOWED_ORIGINS`, but **no code reads it**. CORS uses `FRONTEND_URL`.

**`apps/frontend/.env`**

| Variable | Used for |
|---|---|
| `BACKEND_URL` | Backend address, server-side only (required, `next.config.ts` throws if missing). Next forwards `/api/*` to it, so the browser only talks to the frontend domain. Example: `http://localhost:8080`. |

The frontend and backend can be on different domains. Set the backend `BETTER_AUTH_URL` and `FRONTEND_URL` to the **frontend's** public URL, so the session cookie belongs to the frontend site.

---

## 7. Database Details

PostgreSQL, accessed through Prisma 7 with the `@prisma/adapter-pg` driver adapter. Schema: `apps/backend/prisma/schema.prisma`. The generated client is in `apps/backend/src/generated/prisma`.

| Model (table) | Purpose |
|---|---|
| `User` (`user`) | Login user: name, email (unique), `role` (`SUPER_ADMIN` / `ADMIN` / `STAFF`), phone, address, date of birth. |
| `Session` (`session`) | Better Auth sessions. |
| `Account` (`account`) | Better Auth credentials (hashed password). |
| `Verification` (`verification`) | Email OTP codes, sign-in code challenges and shop-admin password setup tokens. |
| `TwoFactor` (`twoFactor`) | Required by the two-factor plugin (attempt counters and lockout). Codes are emailed, so no secrets are stored. |
| `Membership` (`membership`) | One per user: role, permissions JSON, and the shop they belong to. |
| `Shop` | Shop: `shopCode` (database-generated), name, unique slug, address, logo URL and `logoFileId`, `isActive`, `adminId` (unique, null once deleted), soft delete via `deletedAt`. |

Notes:
- Deleting a shop is a **soft delete**. It frees the admin and the slug, and the shop's people are refused afterwards.
- There are no tables yet for medicines, stock, sales, invoices or customers.

---

## 8. API and Main Flows

The browser calls `/api/...` on the frontend's own domain, and Next forwards it to `BACKEND_URL`. Success responses look like `{ success, data, ... }`. Errors look like `{ code, message, statusCode }`.

### Authentication (Better Auth, mounted at `/api/auth/*`)

Calls used by the frontend: `POST /sign-in/email`, `POST /sign-up/email`, `POST /sign-out`, `GET /get-session`, `POST /email-otp/send-verification-otp`, `POST /email-otp/verify-email`, `POST /email-otp/reset-password`.

**Login flow:** the user enters email and password. A correct password creates **no session**: the server only sets a short-lived "code pending" cookie (`better-auth.two_factor`) and emails a 6-digit code. The user enters it at `/otpverify` (`POST /api/auth/two-factor/verify-otp`), and only then does the server create the session and send them to `/dashboard`. Users of a blocked or deleted shop cannot sign in.

### Shop API (`/api/shop`)

| Method and path | Permission | Purpose |
|---|---|---|
| `POST /set-admin-password` | Public (needs the emailed token) | Shop admin sets their first password |
| `POST /` | `shop:create` | Create shop and its admin user |
| `GET /` | `shop:read` | List: `page`, `limit`, `search`, `isActive`, `sortBy`, `sortOrder` |
| `GET /:id` | `shop:read` | Get one shop by id or slug |
| `PATCH /:id` | `shop:update` | Update (can block with `isActive`, change logo, reassign admin) |
| `DELETE /:id` | `shop:delete` | Soft delete |

### Media API (`/api/media`, all need a login plus a media permission)

| Method and path | Permission | Purpose |
|---|---|---|
| `POST /upload` | `media:upload` | Upload an image (multipart field `image`, optional `folder`, `tags`) |
| `GET /details/:fileId` | `media:read` | File metadata |
| `DELETE /:fileId` | `media:delete` | Delete a file (refused if it is a shop's logo) |
| `GET /auth` | `media:upload` | Short-lived token for direct browser upload to ImageKit |

**Shop creation flow:** upload the logo to `shops/logos`, then `POST /api/shop` with the returned `logoFileId`, admin name and admin email. The admin gets either the password you set or a setup link by email.

---

## 9. Future Improvements

These are gaps found in code, not promises.

- Build the pharmacy features that are mentioned but missing: medicine inventory, stock check and update, billing / invoices, sales and purchase, customers, reports, expiry and low-stock alerts.
- Connect the frontend to the existing shop and media APIs, and replace the dashboard's mock data. A backend endpoint for dashboard statistics does not exist yet.
- Add the missing pages: `/shops`, `/shops/new`, `/shops/[id]`, `/set-password`.
- Add a "my shop" endpoint and screens for the Shop Admin and Staff users, which have no permissions or screens today.
- Add staff management for shop admins.
- Add a seed script for the first Super Admin and a migrations folder, and store the `generate_shop_code()` SQL in the repo.
- Add tests, CI and Docker setup. None were found.
- Replace the placeholder home page and template metadata in the frontend, and remove the unused starter packages (`@repo/ui`, `@repo/eslint-config`).
