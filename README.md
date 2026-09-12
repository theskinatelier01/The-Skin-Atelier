# The Skin Atelier

A premium aesthetic clinic platform for **The Skin Atelier**, F-11 Markaz, Islamabad.

Two connected but clearly separated surfaces in one Next.js application:

1. **Public website** — a CMS-driven, SEO-complete marketing site
2. **Clinic management system** — front desk, patients, clinical records, inventory, POS and finance

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in your Firebase values
npm run dev
```

The public website runs immediately, **without Firebase**, using the bundled
content in `src/lib/cms/defaults.ts`. The admin shows a setup screen until
server credentials are present.

To enable the clinic system:

```bash
# 1. Create a Firebase project, enable Auth (Email/Password), Firestore and Storage
# 2. Fill in .env.local (see .env.example for where each value comes from)
# 3. Seed the catalogue, demo data and your first administrator
npm run seed

# 4. Deploy the security rules and indexes
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

Then sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run seed` | Catalogue + demo data + first super admin |
| `npm run seed -- --no-demo` | Catalogue only, for a real go-live |
| `npm run seed:clean` | Delete every `isDemo: true` record |

---

## Architecture

```
src/
  app/
    (site)/          Public website — static, revalidated hourly
    admin/           Clinic system — force-dynamic, never cached
    api/auth/        Session cookie exchange
    login/           Staff sign-in
  components/
    ui/              Primitives shared by both surfaces
    public/          Marketing site components
    admin/           Clinic system components
  lib/
    auth/            Roles, permissions, session, RBAC
    firebase/        Client SDK, Admin SDK, collections, converters
    cms/             Public content queries + bundled defaults
    admin/           Admin queries, navigation, badges
    seo/             schema.org structured data
    validation/      Zod schemas (shared client + server)
  server/actions/    Server actions — every write goes through here
  types/             Domain model
scripts/seed.ts      Firestore seeding
firestore.rules      Database security rules
storage.rules        File security rules
design-system/       Design tokens and rationale
```

### Key decisions

**Timestamps are ISO strings at the application layer.** Firestore `Timestamp`
objects are not serialisable across the React Server Component boundary, so
`lib/firebase/convert.ts` normalises them once, on read.

**Authorisation is enforced three times.** The UI hides what you cannot use,
every server action calls `requirePermission`, and the Firestore and Storage
rules check the role claim independently. Hiding a button is never the control.

**Writes are transactional where they must be.** Sequence numbers (patient
codes, invoice numbers) are allocated in a transaction, so two receptionists
working simultaneously cannot collide. Double-booking is prevented by reading
the clinician's diary inside the same transaction that writes the appointment.

**Stock is a ledger, not a number.** `currentStock` is a running balance
written alongside an append-only `stockMovements` entry. Corrections are new
entries, never edits, so any discrepancy is traceable.

**The public site runs without a database.** Every CMS read falls back to
bundled defaults, so the site is reviewable before Firebase exists and degrades
gracefully if a read fails in development.

---

## Roles and permissions

Eight roles with granular permissions, defined in `src/lib/auth/permissions.ts`
and visible as a live matrix at `/admin/system/roles`.

| Role | Scope |
|---|---|
| `SUPER_ADMIN` | Everything, including roles and system settings |
| `ADMIN` | Clinic and website; not roles, users or system settings |
| `DOCTOR` | Clinical records, consultations, treatments, own schedule |
| `FRONT_DESK` | Patients, appointments, queue, POS, invoices, payments |
| `RECEPTIONIST` | As front desk, without billing authority |
| `INVENTORY_MANAGER` | Stock, batches, suppliers, purchase orders |
| `ACCOUNTANT` | Invoices, payments, expenses, financial reporting |
| `MARKETING_MANAGER` | Website CMS, blog, leads |

Front desk deliberately has **no** access to the website CMS, inventory
purchasing, financial reports or staff management. An inventory manager has no
access to the patient directory at all — enforced in the Firestore rules, not
just the interface.

Per-user `extraPermissions` and `deniedPermissions` layer on top of the role.
Denials win, including over `SUPER_ADMIN`, so a break-glass revocation works.

---

## Patient privacy

This is the part of the system that most needs to be right.

- **Clinical data is a separate collection.** `patients` holds the directory;
  `patientMedical` holds allergies, history and contraindications, gated behind
  `patients.medical.read`. Reception can book an appointment without ever
  touching medical data.
- **Patient images are private by default.** They live under `patients/` in
  Cloud Storage, which is readable only by clinical roles.
- **Publication requires two independent conditions**: consent recorded as
  `Granted`, *and* an administrator approval. Both are checked in the server
  action and again in the Firestore rules, so a mistake in one layer cannot
  expose an image on its own.
- **Publishing copies, it does not unlock.** An approved case gets a separate
  public image; the original never becomes readable. Unpublishing clears the
  public copies, so withdrawing consent genuinely removes the image.
- **Audit logs redact.** Clinical notes, allergies and image paths are recorded
  as *changed* without storing their contents, so the audit trail does not
  become a second copy of the medical record.
- Audit logs are **append-only** — the rules deny `update` and `delete` to every
  role, including super admins.

---

## Public website

| Route | Notes |
|---|---|
| `/` | Hero, trust, services, concern finder, featured treatment, results, about, experts, packages, testimonials, social, CTA |
| `/services`, `/services/[slug]` | Statically generated per treatment |
| `/doctors`, `/doctors/[slug]` | Statically generated per clinician |
| `/results` | Before & after — consented cases only |
| `/packages`, `/gallery`, `/blog`, `/blog/[slug]`, `/faq` | |
| `/about`, `/contact`, `/book` | |
| `/privacy`, `/terms` | |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Generated from live content |

**SEO**: per-page metadata and canonicals, Open Graph, and schema.org
`MedicalClinic`, `MedicalProcedure`, `Physician`, `FAQPage`, `Article` and
`BreadcrumbList`. `AggregateRating` is emitted **only** when a genuine rating is
recorded in settings — inventing one is both a policy violation and dishonest.

**Booking is a request, not a booking.** The public form creates an
`appointmentRequests` document and notifies the front desk. A person confirms
the slot, the clinician and any preparation before anything reaches the
calendar. The form says so plainly above the submit button.

---

## Clinic system

**Front desk** (`/admin/clinic/front-desk`) — today at a glance, the next action
on every appointment row, live queue beside it. Built for someone standing at a
counter with a patient in front of them.

**Appointments** — day/range register, day calendar with a column per clinician,
transactional conflict checking, full status lifecycle.

**Patients** — directory, profile with appointment, clinical and billing
timelines, medical section replaced with an explicit "restricted" panel for
non-clinical roles.

**Inventory** — products, batch and expiry tracking with **FEFO** consumption
(first expiry, first out), append-only movement ledger, expiry dashboard with
bulk write-off, suppliers and purchase orders.

**POS and invoicing** — counter terminal selling treatments, packages and retail
products; stock deducted from the batch closest to expiry in the same
transaction as the invoice; printable invoice; partial payments and refunds.
Invoices are voided, never deleted.

**Finance** — revenue over time with period comparison, revenue by type and top
treatments, expenses by category, and six CSV reports generated from live data.

**Website management** — treatments with inline publish toggles, testimonials,
FAQs, blog, gallery, menus, media library, an SEO audit, and the before/after
consent workflow.

---

## Security checklist

- [x] Firestore rules deny by default; every collection is explicitly matched
- [x] Storage split into `public/`, `patients/`, `consent/`, `receipts/` by sensitivity
- [x] Session cookies are `httpOnly`, `secure` in production, `sameSite=lax`
- [x] `verifySessionCookie(..., true)` checks revocation on every request
- [x] Role stored as a custom claim so rules cost no extra document read
- [x] Middleware only redirects; it never authorises (it cannot verify on the edge)
- [x] Public write surface is one collection, field-validated in the rules
- [x] Rate limiting and a honeypot on both public forms
- [x] Zod validation on every action, shared with the client
- [x] CSV export escapes formula-injection characters
- [x] Blog content rendered to React elements, not `dangerouslySetInnerHTML`
- [x] `/admin` carries `X-Robots-Tag: noindex` and is disallowed in robots.txt
- [x] Sign-in errors do not reveal whether an email address exists

---

## Multi-branch

Every operational record carries `branchId`, seeded as `islamabad-f11`. Queries
accept an optional branch filter and the `branches` collection already holds
address, hours and contact per location. Adding a second clinic is a data
change plus a branch switcher in the admin shell — not a schema migration.

---

## Medical safety

This is a clinic management and marketing platform. It deliberately does **not**
provide automated diagnosis or any AI assessment of a medical condition.

Treatment suitability is determined by qualified clinical staff. Outcome
language throughout is qualified — *results vary from person to person* — and
no guaranteed result is claimed anywhere in the copy, the schema markup or the
CMS field hints. The service editor tells authors this explicitly.
