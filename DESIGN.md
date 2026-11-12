# Pharma ERP — Design System and UX Guide

| Field | Value |
|---|---|
| Version | 0.1 (draft) |
| Source of truth for | Visual design and UX of all web interfaces |
| Depends on | `PRD.md` v0.3 (requirements, roles, states, open questions) |
| Status | Draft. Anything tied to an open PRD question is marked **[Pending OQ-n]** and must not be finalized until that question is decided. |

Colour values were checked for contrast ratios (WCAG 2.2). Ratios quoted below are measured, not estimated.

---

## 1. Scope and Surfaces

| Surface | Users | Form factor priority | Notes |
|---|---|---|---|
| **Pharmacy Web (PWA)** | Owner, staff (cashier, inventory, purchase, manager) | Counter desktop/laptop first, tablet second, phone for review tasks | Installable, **online-only**. No offline billing, queueing or sync (PRD NFR-PWA-01). |
| **Super Admin Web** | Super Admin | Desktop | Business-level data only; no private pharmacy data (PRD SA-FR-005). |
| **Platform Admin Web** | Platform Admin | Desktop | Minimal capability list (PRD OQ-13). |
| Android | — | — | Deferred until after the web MVP (PRD OQ-14). Not designed here. |

All three web surfaces share one design system. The pharmacy surface is the primary design target; the platform surfaces reuse its components with a lighter layout.

---

## 2. Visual Direction and Design Principles

### 2.1 Direction
A **calm, dense, clinical-utility** interface. It should feel like a well-made instrument: quiet colour, strong type hierarchy, and numbers that line up. Pharmacy staff work fast, repeatedly, for long shifts, often with a customer waiting. The design serves speed and error prevention, not first-impression marketing.

Characteristics:
- Neutral warm-grey surfaces; one restrained teal-green accent for actions; colour otherwise reserved for **meaning** (stock, expiry, errors).
- Flat surfaces separated by borders and spacing, not shadows or gradients.
- Information density that suits data work: tables and forms are compact but never cramped.
- Plain, specific language (see Section 9). No marketing tone inside the product.

### 2.2 Principles
1. **Prevent errors before reporting them.** Disable impossible actions with a visible reason, constrain inputs, and confirm destructive or irreversible steps.
2. **The server is the authority.** Totals, stock availability and permissions are shown as the backend returns them. The UI may preview but never decides (PRD BR-03, RB-FR-002).
3. **Make state visible.** Every record shows its status (Recorded, Partially received, Expired, Cancelled). Never leave the user guessing whether something saved.
4. **Numbers are first-class.** Quantities, money and dates get tabular figures, right alignment, consistent formats and units.
5. **Speed at the counter.** Billing is fully keyboard-operable; common actions take the fewest steps.
6. **Consistency over novelty.** One pattern per job. A new pattern needs a written reason.
7. **Colour is never the only signal.** Always pair colour with text or an icon.
8. **Honest about limits.** Show what failed and what did not change (PRD Section 15). Never imply an unsent action succeeded.

### 2.3 What to avoid
Gradient hero areas, decorative illustrations, glassmorphism, large rounded "card soup", emoji as icons, purple/blue gradient branding, oversized stat tiles with no action, animated counters, and dashboards that decorate rather than inform. Every element on screen must have a job.

---

## 3. Colour

### 3.1 Tokens (light theme)

Dark theme is **deferred** (not in the PRD). If added later, it must reuse these token names with re-validated contrast.

**Neutrals**

| Token | Value | Use |
|---|---|---|
| `bg-app` | #F6F7F5 | Page background |
| `bg-surface` | #FFFFFF | Panels, tables, forms, dialogs |
| `bg-sunken` | #EEF0ED | Table headers, wells, read-only fields, hover rows |
| `border-subtle` | #D5D9D3 | Dividers, table rules, card edges (decorative; not required to meet 3:1) |
| `border-control` | #8A928C | Input, checkbox, select outlines (3.2:1 on white — meets the 3:1 control rule) |
| `text-primary` | #1B211F | Body, headings (16.4:1 on white) |
| `text-secondary` | #4A544F | Labels, helper text (7.9:1 on white) |
| `text-muted` | #66706A | Placeholders, meta, timestamps (5.1:1 on white, 4.8:1 on `bg-app`) |

**Brand / action**

| Token | Value | Use |
|---|---|---|
| `primary` | #0E5A56 | Primary buttons, links, focus accent, selected nav (8.0:1 with white text) |
| `primary-hover` | #0A4744 | Hover/pressed (10.5:1 with white) |
| `primary-subtle` | #E0F0EE | Selected row/tab background, info highlights (6.8:1 with `primary` text) |

**Semantic** — each has a strong colour for text/icon/border and a tinted background.

| Meaning | Strong | Tint | Contrast (strong on tint) | Used for |
|---|---|---|---|---|
| Danger | #B42318 | #FDECEA | 5.8:1 | Errors, expired stock, cancel/reverse actions, blocked sales |
| Warning | #7A4F00 | #FFF3D6 | 6.5:1 | Near-expiry, low stock, import warnings |
| Success | #1B6B3A | #E3F4E8 | 5.7:1 | Confirmed receipt, paid, saved |
| Info | #1F5FA8 | #E4EEFA | 5.5:1 | Neutral notices, pending status |

### 3.2 Colour rules
- Text on `bg-surface` or `bg-app` uses only `text-primary`, `text-secondary`, `text-muted` or `primary`. No lighter greys for text.
- A status is **always** shown as icon + text label inside a tinted badge, never as a coloured dot alone.
- Danger red is reserved for genuine danger. Do not use it for decoration or for ordinary "Delete row" in a draft.
- One primary button per view region. Secondary actions use the outlined style.
- Expiry colour mapping is fixed system-wide: **expired = danger, near-expiry = warning, healthy = no colour**. Low stock = warning. Out of stock = danger.
- Charts (reports) use one accent plus neutrals by default. Where categories must be distinguished, use varied lightness plus direct labels or patterns, never colour alone.

---

## 4. Typography

### 4.1 Typefaces
| Role | Family | Fallback | Reason |
|---|---|---|---|
| UI and body | **IBM Plex Sans** | system sans-serif | Legible at small sizes, distinct letterforms (I/l/1, O/0) matter for batch numbers and codes |
| Data, codes, batch numbers, invoice numbers | **IBM Plex Mono** (or tabular figures of the sans) | system monospace | Prevents misreading of identifiers |

Fonts are self-hosted so the PWA does not depend on a third-party request at the counter. Use **tabular (fixed-width) figures** in every table column and every money/quantity field.

### 4.2 Scale

Base size is 14 px for dense data views and 16 px for forms, dialogs and reading text. Minimum text size anywhere is 12 px, used only for meta text.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| Display | 28 / 36 | 600 | Page title on large screens only (one per page) |
| Heading 1 | 22 / 30 | 600 | Page title |
| Heading 2 | 18 / 26 | 600 | Section / panel titles |
| Heading 3 | 15 / 22 | 600 | Sub-sections, table group headers |
| Body | 14 / 20 (data views), 16 / 24 (forms, dialogs) | 400 | Default |
| Label | 13 / 18 | 500 | Form labels, column headers |
| Meta | 12 / 16 | 400 | Timestamps, helper text, hints |
| Numeric emphasis | 20–24 / 28 | 600, tabular | Invoice totals, key summary numbers |

Rules:
- Sentence case everywhere; no all-caps except short badges (≤ 12 characters).
- Line length for prose ≤ 72 characters.
- Do not use more than two weights on one screen region.
- Invoice grand total is the largest number on the billing screen.

### 4.3 Number, date, currency formats
- Money: currency symbol/code per business setting (PRD OQ-16), right-aligned, fixed decimal places per currency, thousand separators per business locale. Negative values (refunds, discounts) are shown with a minus sign and in `danger` only when meaning a loss/refund line.
- Quantities show the unit next to the value (e.g., "20 tablets", "2 strips"); unit conversions are displayed where both units matter, e.g. "2 strips (20 tablets)".
- Dates are unambiguous: the business locale format with a month name or the ISO form in exports. Expiry is shown as month and year **and** the resolved last-valid day in the detail view **[Pending OQ-6 confirmation of month/year handling]**.
- Time zone follows the business setting.

---

## 5. Spacing, Layout and Elevation

### 5.1 Spacing scale (4 px base)
`4, 8, 12, 16, 24, 32, 48, 64`. Use only these values.

| Use | Value |
|---|---|
| Icon-to-label gap | 8 |
| Gap between related fields | 12 |
| Gap between field groups | 24 |
| Panel padding | 16 (compact) / 24 (standard) |
| Between page sections | 32 |
| Table cell vertical padding | 8 (compact) / 12 (comfortable) |

### 5.2 Density modes
- **Compact** (default on data tables and the billing grid): 36 px row height.
- **Comfortable** (default on touch devices and forms): 48 px row height, 44×44 px minimum touch targets.
- Users may switch table density; the choice is remembered per user.

### 5.3 Grid and containers
- 12-column grid, 16 px gutters (24 px at ≥ 1280 px). Page content max width 1440 px; forms max width 720 px; reading text 72 characters.
- Application shell: persistent left sidebar (Section 7), top bar, content area.
- Content is organized as **panels** (white surface, 1 px `border-subtle`, 8 px corner radius). Do not nest panels more than one level.

### 5.4 Shape and elevation
- Corner radius: 4 px for controls and badges, 8 px for panels and dialogs, none for full-width bars.
- Elevation is minimal: panels have no shadow. Only floating layers (menus, popovers, dialogs, toasts) have a single soft shadow and sit above a scrim where modal.
- Stacking order (low to high): content, sticky headers, side panels, menus/popovers, modal dialogs, toasts.

---

## 6. Iconography and Imagery
- One consistent outline icon set, 20 px default (16 px in dense tables, 24 px in navigation on touch). Stroke weight matches body text.
- Icons always accompany visible text on actions, except universally understood ones (close, search, calendar) which carry an accessible name.
- No decorative illustrations. Empty states may use one small, simple icon at most.
- No stock photography. Business logo appears only on invoices and the sign-in screen for the business.

---

## 7. Navigation and Application Shell

### 7.1 Structure
- **Left sidebar**: grouped, text-and-icon items. Expanded (240 px) at ≥ 1024 px; collapsed to icons with tooltips optionally; becomes a drawer below 768 px.
- **Top bar**: branch switcher (pharmacy surface), global medicine/invoice search, alerts indicator, user menu (profile, sign out). Online/connection indicator when the connection is lost.
- **Breadcrumbs** only on depth ≥ 3 (e.g., Purchases › Purchase #123 › Receive).
- **Page header**: title, status badge if applicable, primary action on the right.

### 7.2 Pharmacy Web navigation groups
Items appear only if the user has permission for the module; **hiding items is a convenience, never security** (PRD BR-03).

| Group | Items |
|---|---|
| Sell | New bill, Sales history |
| Stock | Inventory, Alerts, Receive stock, Adjustments, Opening stock, Import |
| Buy | Purchases, Suppliers |
| Catalog | Medicines |
| Insight | Reports, Customer analysis [Pending OQ-32] |
| Manage | Branches, Users and roles, Employees, Business settings |

"New bill" is the most prominent item and has a keyboard shortcut.

### 7.3 Super Admin and Platform Admin navigation
Single-level sidebar: Businesses, Platform admins (Super Admin only), Settings (only approved settings, PRD SA-FR-004). Platform Admin sees only the items its grants allow.

### 7.4 Branch context
- A user assigned to several branches sees a **branch switcher** in the top bar. The active branch is always visible, and the current branch name appears on billing, receiving and inventory screens.
- A user with one branch sees the branch name as static text.
- Owner has an "All branches" option on reports and inventory views only; transactional screens (billing, receiving) always require one specific branch.
- Switching branch while a draft bill exists asks for confirmation and warns that the draft belongs to the previous branch.

### 7.5 Search
- Global search (medicines, invoices by number, suppliers). Results grouped by type and permission-filtered by the backend.
- Medicine search (billing, purchases) matches name, generic name, strength and code as the user types, with a debounce, and shows batch availability in results.

---

## 8. Components

Every component below has: default, hover, focus, active, disabled, loading, and error states where relevant. Behaviors are shared across the product.

### 8.1 Buttons
| Type | Look | Use |
|---|---|---|
| Primary | Filled `primary`, white text | The main action of a region (Save bill, Confirm receipt). One per region. |
| Secondary | Outlined `border-control`, `text-primary` | Other actions |
| Tertiary | Text-only `primary` | Low-emphasis (Cancel, Clear) |
| Destructive | Filled `danger` | Irreversible or reversing actions (Cancel bill). Requires confirmation. |
| Icon button | 36/44 px, always has accessible name and tooltip | Row actions |

- Height: 36 px compact / 44 px comfortable. Minimum width 80 px. Label is a verb phrase ("Confirm receipt", not "OK").
- **Loading**: label stays, a spinner replaces the icon, button is disabled to prevent double submit, width does not jump.
- **Disabled** buttons show why on hover/focus and via helper text where the reason is not obvious (e.g., "Add at least one item").
- After a click that triggers a server operation, the button remains disabled until a response is received (supports PRD RB-FR-004).

### 8.2 Form controls
- Text input, number input, select, searchable select (combobox), date picker, textarea, checkbox, radio, toggle, file upload.
- Label above the control, always visible (no placeholder-as-label). Required fields marked with text "Required" in the label area, not only an asterisk. Helper text below; error text replaces helper text.
- Control height 36 px compact / 44 px comfortable. Outline `border-control`; focus ring per Section 12.
- Number inputs: right-aligned, tabular, with unit suffix, reject non-numeric entry, no scroll-wheel value changes.
- Date inputs: typed entry plus picker; show expected format; reject impossible dates and explain why.
- Combobox: type-ahead, keyboard navigation, shows "No matches" with a creation shortcut where permitted (e.g., "Add supplier").
- Read-only fields use `bg-sunken` and are still readable text, not disabled-looking.

### 8.3 Data table
The workhorse component (inventory, purchases, sales, users, reports).
- Sticky header, sortable columns marked with an icon and an accessible sort state, column headers in Label style.
- Numeric columns right-aligned with tabular figures; text columns left-aligned; status columns use badges.
- Row hover uses `bg-sunken`; selected row uses `primary-subtle`. Whole-row click opens detail only when there is no ambiguity with row actions.
- Toolbar above the table: search, filters (as removable chips), date range, branch filter, density toggle, export where allowed.
- Pagination below (page size selectable); server-side for large sets. Show total count and active filters.
- Row actions: at most two visible icon actions plus an overflow menu.
- Empty, loading (skeleton rows) and error states per Section 10.
- Mobile: tables collapse to **stacked rows** showing the 3–4 most important fields with a "Details" affordance; never rely on horizontal scrolling for primary data. Where a wide table is unavoidable (reports), allow scroll with a sticky first column.

### 8.4 Badges and status chips
- Shape: 4 px radius, 12 px text, icon + label.
- Standard statuses:

| Domain | Statuses (colour) |
|---|---|
| Purchase | Recorded (info), Partially received (warning), Received (success), Cancelled (neutral grey) |
| Receipt | Confirmed (success) |
| Bill | Issued (success), Paid / Partly paid (warning) / Unpaid (danger-tint only when overdue rules exist), Cancelled (neutral), Returned (neutral) |
| Stock | In stock (none), Low stock (warning), Near expiry (warning), Expired (danger), Out of stock (danger) |
| Import row | Valid (success), Warning (warning), Invalid (danger) |
| Account | Active (success), Suspended (danger), Deactivated (neutral) |

### 8.5 Alerts and banners
- Inline banner (info, success, warning, danger) at the top of a panel or page for conditions that persist (e.g., "3 batches expire within 30 days"). Contains icon, one-sentence message, optional single action. Dismissible only for info/success.
- Banner for connection loss is global and sticky (Section 10.9).

### 8.6 Toasts
- Brief confirmation of **completed** actions only ("Bill INV-0042 saved"). Bottom-left on desktop, bottom-centre on mobile, stack up to 3.
- Auto-dismiss after 6 seconds, pause on hover/focus, include a persistent route to the result (link to the invoice).
- Errors and anything needing a decision are **never** toast-only; they stay on screen inline.

### 8.7 Dialogs and confirmation
- Modal dialogs for short, focused decisions: cancel bill, confirm adjustment, resolve a conflict. Not for long forms (use a page or side panel).
- Structure: title (states the action), body (states consequence), actions (right-aligned; primary on the right; destructive style when destructive).
- Destructive and stock-affecting confirmations restate the object ("Cancel invoice INV-0042 and restore 6 items to stock?").
- Focus is trapped, Esc closes unless the action is mid-submit, focus returns to the trigger on close.
- Side panel (drawer) for detail views and short edits that benefit from page context.

### 8.8 Tabs, filters, chips
- Tabs for peer views of one record (Overview, Batches, Movements). Filters as chips, each removable, with a "Clear all" action.
- Date range control with presets (Today, This week, This month, Last month, Custom). Week start follows business setting.

### 8.9 Line-item grid (billing, purchases, receiving, opening stock)
A shared editable grid:
- Columns configurable per use; first column is a medicine combobox; quantity, unit, price, discount, tax and line total follow.
- Keyboard: Tab/Shift+Tab across cells, Enter commits and moves to the next line, Esc cancels cell edit, a shortcut adds/removes lines.
- Computed cells (line total, tax) are read-only and visibly distinct.
- Row-level errors show inline beneath the row with the field highlighted and an icon; the page summary lists the number of errors.
- Totals bar is sticky at the bottom of the grid so the grand total is always visible.

### 8.10 File upload
- Drop zone plus "Choose file" button. States: idle, dragging, uploading (progress), uploaded (file name, size, replace/remove), failed (reason + Retry).
- Displays allowed types and maximum size up front. Validation errors are specific ("File is 14 MB; the maximum is 10 MB" — values per NFR-PERF-04).

### 8.11 Import review table
- Summary strip first: counts of valid, warning, invalid rows.
- Table of rows with row number, key fields, status badge and reason. Filter to "Invalid only." Download of invalid rows is available (PRD IM-FR-004, Proposed).
- The accept action states exactly what will be created ("Create stock for 95 valid rows"). Behavior for invalid rows follows OQ-21.

### 8.12 Stat summary
- Use sparingly: number, label, and where useful a delta and a link to the relevant list. A stat that cannot be clicked into a list or cause an action is removed.
- Maximum 4 per row, no decorative icons or sparklines unless they add information.

### 8.13 Permission-aware UI
- If a user lacks permission for an action, **hide** the control when the action is irrelevant to their role, or **show it disabled with a reason** when it helps them understand (e.g., "Requires permission: Confirm receipt").
- The UI never assumes view access implies other actions (PRD Section 11). Every action control is conditional on its own permission.
- Direct navigation to a forbidden page shows a "You don't have access" page with a way back and who to contact (the Owner), never a blank or generic error.

---

## 9. Content and Language

- Plain and specific. State what happened, what it affected and what to do. No jargon, no blame.
- Use the PRD's terms consistently: **Medicine**, **Batch**, **Purchase**, **Receipt**, **Bill/Invoice**, **Adjustment**, **Branch**. Do not alternate synonyms.
- Button labels are verbs; page titles are nouns.
- Errors: reason first, then fix. Example: "Not enough stock. 4 units of Paracetamol 500 mg are available at Main Branch." not "Error 409".
- Never expose technical internals or stack traces. Server errors show a short message and a reference ID for support.
- Dates relative ("3 days ago") only in activity feeds, always with the absolute value on hover/focus.
- Tone is neutral and professional. No exclamation marks, no humour in errors.

---

## 10. Loading, Empty and Error States

These implement PRD Section 15. Principle: **a failed or rejected operation saves nothing and changes no stock — and the interface says so.**

### 10.1 Loading
| Situation | Pattern |
|---|---|
| First page load | App shell appears immediately; content area shows skeletons shaped like the final layout |
| Table/list | Skeleton rows (6–10) preserving column widths; toolbar stays interactive |
| Report | Skeleton for chart and table; filters remain usable; "Updating…" indicator when filters change |
| Action in progress | The triggering button shows a spinner and is disabled (Section 8.1); the rest of the page stays usable unless the action locks it |
| Slow operation (> 3 s) | Add a text status ("Importing 2,000 rows…") with progress where measurable |
| Very slow / background (if jobs are used) | Move to an "in progress" status on the record and allow the user to leave the page; result shown on the record |

No full-screen spinners except sign-in. Skeletons do not animate for users with reduced motion (Section 11).

### 10.2 Empty states
Each empty state has: one-line explanation, why it matters if not obvious, and the single next action (if the user has permission).

| Screen | Message and action |
|---|---|
| Inventory (no stock) | "No stock at this branch yet." → Add opening stock / Import |
| Medicines | "No medicines yet." → Add medicine |
| Suppliers | "No suppliers yet." → Add supplier (shown in the purchase form too, where a supplier is missing) |
| Purchases | "No purchases recorded." → Record purchase |
| Alerts | "Nothing needs attention." (positive empty state; no action) |
| Sales history / reports with filters | "No results for these filters." → Clear filters; show the active filters |
| Reports, no sales in range | Zeros are displayed, with "No sales in this period." |
| No permission | Not an empty state: show the access page (8.13) |

### 10.3 Validation errors (forms)
- Validate on blur and again on submit; do not interrupt typing.
- Error text below the field in `danger`, with an icon, replacing helper text; field outline turns `danger` (plus icon, so not colour-only).
- On submit failure: focus moves to an error summary at the top (count + links to each field), and the first invalid field is scrolled into view.
- Server-side validation errors are mapped to the same fields. Unmapped errors appear in a top banner.
- Data the user typed is preserved on failure.

### 10.4 Billing errors
| Case | Behavior |
|---|---|
| Invalid input (quantity ≤ 0, bad unit, discount over limit) | Inline on the line; bill cannot be saved; summary count shown |
| Insufficient stock | Names the medicine, requested vs. available quantity and the branch; bill is not saved; user can reduce quantity or remove the line |
| Only expired stock | Medicine shows "Expired stock only — cannot be sold"; expired batches are not selectable (PRD BR-08) |
| Discount above limit | Prompts for confirmation by a permitted user, or blocks with the reason [Pending OQ-4 limit values] |
| Duplicate submission | The first result is shown ("This bill was already saved: INV-0042"); no second bill |
| Totals changed by the server | If the server's total differs from the preview, show the server total with an explanatory banner before the user confirms |
| Save fails (network/database) | See 10.8 and 10.9. The bill draft remains on screen with all entered data |

### 10.5 Import and upload errors
- Unreadable file, wrong type, missing columns: stays on the upload step with a specific message; nothing created.
- Row errors: shown in the review table; user can fix the file and re-upload.
- Already-accepted file detected: warning with the earlier import's date and user; requires explicit confirmation to proceed (PRD EC-05).
- Failed invoice upload: the purchase remains saved; the document area shows "Upload failed — <reason>" with Retry (PRD Section 15).

### 10.6 Stock and receipt errors
- Receipt validation errors appear per line with field-level messages; confirm is blocked; **no line changes stock until all pass** (PRD SR-FR-001).
- Concurrent change: "This purchase was updated by another user. Review the changes." with a refresh action, never silently overwriting.

### 10.7 Permission and access errors
- Action blocked: inline message "You don't have permission to <action>." with who can grant it.
- Cross-tenant/not-found requests are presented identically ("This record doesn't exist or isn't available to you"), without disclosing existence (PRD EC-11).
- Session expired: a dialog asks to sign in again and, after sign-in, returns the user to the same screen; unsaved form data is kept in memory where possible but never assumed saved.

### 10.8 Server and database errors
- Message: "Something went wrong and your changes were not saved." plus a reference ID and a Retry action. Entered data stays on screen.
- State what is known: because operations are all-or-nothing, the message can say that no stock was changed **when the server confirms rollback**.

### 10.9 Network and offline
- The product is online-only. When the connection drops, show a sticky banner: "You're offline. Changes can't be saved until you reconnect." Disable save/confirm buttons; leave data entered on screen.
- If a request times out with an unknown outcome: "We couldn't confirm that this saved. Check Sales history before trying again." The retry uses the same request identity so a duplicate cannot be created (PRD RB-FR-004).
- No offline queue, no deferred sync, no stale-data editing.

---

## 11. Interaction and Motion

### 11.1 Principles
- Motion explains change; it is never decoration. Keep it functional and brief.
- Durations: 100–150 ms for hover/focus and small state changes; 200 ms for menus, drawers and dialogs; skeleton shimmer ≤ 1.5 s loop. Easing is a standard ease-out for entering, ease-in for leaving.
- No animation on data refreshes, row insertions in billing, or total changes (no counting-up numbers). Totals update instantly so the cashier never reads a mid-animation value.

### 11.2 Behaviors
| Interaction | Behavior |
|---|---|
| Hover | Subtle background change; never the only cue |
| Press | Slight darkening; no scale |
| Dialog/drawer | Fades and slides short distance; scrim fades |
| Toasts | Fade in/out |
| Save success | Inline state change (badge, banner) plus toast; no confetti |
| Line added in grid | Row appears immediately; focus moves to the next cell |
| Page transitions | None, or instant; keep the shell stable |

### 11.3 Reduced motion
Respect the user's reduced-motion setting: remove shimmer, slides and fades larger than a simple opacity change; keep state changes immediate.

### 11.4 Keyboard shortcuts (pharmacy surface)
Shortcuts are discoverable (a help overlay, `?`), never required, and must not collide with browser or screen-reader shortcuts. Define a small set: new bill, focus medicine search, add line, save, toggle density. Final key bindings are chosen at implementation and documented here.

---

## 12. Accessibility Requirements

Target: **WCAG 2.2 Level AA** across all surfaces. These are requirements, tested before release.

### 12.1 Perceivable
- Text contrast ≥ 4.5:1 (≥ 3:1 for large text 18 px+ / 14 px bold); UI component and focus indicator contrast ≥ 3:1. The palette in Section 3 meets this; new colours must be validated.
- Information is never conveyed by colour alone (badges, form errors, charts, alerts).
- Text can be resized to 200% and reflowed at 320 px width without loss of content or horizontal scrolling of primary content.
- All non-text content has a text alternative; decorative icons are hidden from assistive technology.

### 12.2 Operable
- Every function is keyboard-operable with a logical tab order; no keyboard traps; skip-to-content link first.
- Visible focus on every interactive element: 2 px `primary` outline with 2 px offset (white inner gap), never removed.
- Touch targets ≥ 44×44 px on touch devices (24×24 px absolute minimum on dense desktop).
- No time limits that cannot be extended; session-timeout warnings give time to respond.
- Dragging is never the only way to perform an action.

### 12.3 Understandable
- Every input has a persistent visible label; instructions and required status are text, not only colour or symbol.
- Errors are identified in text, associated programmatically with their fields and announced to assistive technology.
- Consistent navigation and consistent component behavior across surfaces.
- Confirmation (not auto-action) for destructive operations; users can review before final submission of financial/stock-changing actions.

### 12.4 Robust
- Semantic structure: landmarks (header, nav, main), one H1 per page, heading order, real tables with header cells for data, lists for lists.
- Dynamic updates (toasts, validation summaries, loading completion) are announced through live regions at an appropriate politeness level; errors assertive, confirmations polite.
- Custom components (combobox, date picker, dialog, tabs, grid) follow established ARIA authoring patterns and are tested with a screen reader.
- Page language is declared; business locale formats are exposed correctly.

### 12.5 Testing
Accessibility testing combines automated checks in CI, keyboard-only walkthroughs of the core journeys (PRD Section 9), and screen-reader checks of billing, receiving and import before release. Findings of AA failures block release.

---

## 13. Responsive Behavior

### 13.1 Breakpoints
| Name | Width | Layout |
|---|---|---|
| Phone | < 640 px | Single column; bottom or drawer navigation; stacked tables |
| Tablet | 640–1023 px | Collapsible sidebar (drawer); two-column forms where space permits |
| Desktop | 1024–1439 px | Persistent sidebar; full tables |
| Wide | ≥ 1440 px | Content centred at max width; detail side panels beside lists |

### 13.2 Rules
- Design for the counter first: billing must work well at 1280×720 and on a tablet.
- Layout adapts through reflow, not shrinking: fewer columns, stacked fields, priority columns.
- Tables show priority columns first and move the rest into the row detail on small screens.
- Primary action stays reachable: sticky footer action bar on phone/tablet forms (Save, Confirm).
- Dialogs become full-screen sheets on phones.
- Support portrait and landscape; do not lock orientation.
- The PWA supports installation to the home screen/desktop window with the same layout rules. No offline mode (Section 10.9).

### 13.3 Phone scope
Phone use is mainly for reviewing alerts, stock, reports and invoices, and for simple receiving. Dense multi-line editing (large purchases, imports) is designed for desktop and tablet; on phones it remains functional but is not optimised.

---

## 14. Page-Level Layout Guidance

General page anatomy (pharmacy surface): shell → page header (title, status, primary action) → optional banner → toolbar/filters → main content → footer actions (forms). Lists and detail views share the same patterns. States from Section 10 apply to every page.

### 14.1 Sign-in
Centred single form, business logo (if known), email, password, sign-in, "Forgot password" (reset by email; MFA is a later phase). Generic error on failure; rate-limit message when throttled. No marketing content.

### 14.2 Dashboard (Owner/manager) — Proposed, minimal
Per PRD this page is Proposed. If built: (1) alerts requiring action (low stock, near-expiry, expired) with links; (2) recent sales summary for the active branch; (3) quick actions (New bill, Receive stock). No decorative tiles; each element links to its list.

### 14.3 New bill (retail and wholesale)
The most time-critical screen.
- Layout: left/main **line-item grid** with medicine search at the top; right (or below on small screens) **summary panel** with subtotal, discount, tax, rounding, **grand total (largest number)**, payments, outstanding balance.
- Bill type (Retail / Wholesale) is a clear toggle at the top; switching type recalculates and warns if lines are already present. Wholesale shows a buyer selector and uses the wholesale price (missing wholesale price blocks the line with a reason).
- Each line shows medicine, batch (defaults to the earliest-expiring non-expired batch, FEFO; users with the override permission can pick another non-expired batch, and the override is visible on the line), unit, quantity, price, discount, tax, line total, availability. Expired batches are not selectable.
- Payment: add one or more payments with method and amount; shows balance due or change [Pending OQ-31].
- Save requires explicit action; after saving, show the invoice with Print and "New bill" actions. Draft state is visible; leaving with unsaved lines asks for confirmation.
- Tax and discount presentation **[Pending OQ-2]**: the layout reserves space for per-line tax and discount and for rounding; the calculation display is finalized after the accountant's decision.

### 14.4 Sales history and invoice view
- List: filters (date range, branch, customer type, status, payer, invoice number search). Columns: invoice number, date, customer, type, total, paid, status.
- Invoice detail: faithful, print-ready invoice as issued (immutable), with a side column for payments and status and a clearly separated "Cancel / Return" action with confirmation and a required reason; same-day and later-day cancellations and returns are all supported, with conditions to be set once regulations are confirmed [Pending OQ-8 rules].
- Print stylesheet: business details, invoice number, itemised lines with batch, tax, totals; no navigation chrome.

### 14.5 Inventory
- Default view by medicine with total quantity per branch, expandable to batches (batch number, expiry, quantity, cost, status badge). Toggle to a flat batch view.
- Filters: branch, status (low, near-expiry, expired), medicine search.
- Row detail (drawer): batch information and **stock movements** (type, quantity ±, reference, user, time).
- "Adjust stock" requires reason and permission, with confirmation.

### 14.6 Opening stock and Import
- Manual entry uses the line-item grid (medicine, batch, expiry, quantity, cost).
- Import is a **stepper**: Upload → Review → Accept → Result. Each step shows what happens next and what has not yet changed ("No stock has been created yet" on the review step). Result step shows counts and a link to the import record.

### 14.7 Suppliers
List and detail/form; deactivate instead of delete with explanation of retained history.

### 14.8 Purchases and Receive stock
- Purchase form: supplier, invoice number and date, branch, lines (medicine, batch, expiry, quantity, cost, tax/discount), attachment area. A persistent note: "Saving a purchase does not change stock. Stock changes when you confirm receipt."
- Duplicate invoice warning appears at the invoice-number field with a link to the existing purchase [Pending OQ-23 warn vs. block].
- Purchase detail: header with status badge, line table showing **ordered, received and accepted** quantities as separate columns, receipt history, attached invoice viewer.
- Receive stock: per-line received and accepted quantity, batch, expiry, reason when accepted < received; summary of the resulting stock change before confirming; the confirm button is the primary action and is disabled until the form is valid.

### 14.9 Alerts
Three tabs or segmented sections: Low stock, Near expiry, Expired. Each is a table with the relevant quantity/date, batch and branch, and row actions (Reorder note / Adjust). Near-expiry window shown as a setting reference [Pending OQ-28 owner-configured].

### 14.10 Medicine catalog
List with search and filters (active/inactive); form for medicine details, units and conversions (with a live example "1 strip = 10 tablets"), retail and wholesale prices, low-stock threshold. Duplicate-detection warning inline. Regulatory attributes appear only after OQ-7.

### 14.11 Reports
- Header: date range (with presets, weekly/monthly grouping), branch filter, export.
- Content: metric summary row with **separately labelled** revenue concepts — gross sales, discounts, net revenue, taxes, refunds, collected payments, outstanding balance (profit only if OQ-35 defines it) — followed by a trend chart and a table. Medicines ranked by quantity sold is a separate tab with a bar chart and table.
- A definition tooltip (also available as text) explains each metric. Totals must reconcile with the table beneath.
- Per-customer analysis is a separate view, visible only with its permission, with privacy-aware presentation [Pending OQ-32, OQ-42].

### 14.12 Users, roles and permissions
- Users list with role, branches and status. User form: details, role, branch assignment (multi-select).
- Roles page: role list; role editor presents permissions as a **grouped checklist by module**, each module row with separate checkboxes for View, Create, Edit, Confirm, Cancel/Reverse. A summary at the top states the user-facing consequence ("Users with this role can create bills but cannot cancel them").
- Cannot grant permissions the editor lacks; blocked options show a reason. Changes show an "applies at next request" note.
- Deactivate (not delete), with confirmation and retained-history explanation.

### 14.13 Employees and activity
Profile with role, branches, status; activity table (action, reference, branch, time) with filters; only actions the viewer may see appear.

### 14.14 Branches and business settings
Forms with clear grouping: business profile, billing configuration (tax, discount, rounding, currency, locale [Pending OQ-2, OQ-16]), alert settings. Changes to billing rules state "Applies to future bills only; issued invoices don't change."

### 14.15 Super Admin and Platform Admin pages
- Businesses list: name, status, created, counts (users, branches). Detail shows business-level information only and a status control (Super Admin) with a required reason and confirmation.
- Platform admins: list, create/deactivate, permission assignment using the same grouped-checklist pattern.
- No page shows pharmacy sales, invoices, stock or purchase data (PRD SA-FR-005, OQ-12).

---

## 15. Design Governance

- New components and patterns are added to this document before use, with states, accessibility notes and usage rules.
- Tokens are the only source of colour, type, spacing and radius values; no one-off values in screens.
- Any screen that departs from a rule here records the reason in its design notes.
- Items marked **[Pending OQ-n]** are revisited when the PRD question is decided; DESIGN.md version is incremented with the PRD version it matches.
- Review checklist for every screen: usable by keyboard; all states (loading, empty, error, permission, offline) designed; status shown by text plus colour; consistent terminology; no decoration without a job.
