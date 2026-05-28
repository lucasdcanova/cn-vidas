# CN Vidas — Architecture

This document is a diligence-level walkthrough of the CN Vidas platform: the three personas it serves, the major flows that connect them, and the boundaries between the components in this repository.

## 1. Personas

CN Vidas is a 3-sided product. Every feature, table and route belongs to one of these roles (plus admin for operations).

### 1.1 Patient
- Subscribes to a plan (Stripe), individually or via a corporate B2B plan.
- Can add **dependents** (family members covered by the same subscription).
- Books **scheduled consultations** with available physicians.
- Starts **emergency video consults** on demand (Daily.co room created on the fly).
- Browses the **partner marketplace** for discounted in-person services (labs, clinics, pharmacies).
- Submits **reimbursement claims** for out-of-network expenses.
- Carries an **Apple Wallet pass** as proof of membership.

### 1.2 Physician
- Onboards with CRM, RQE, payment info and KYC.
- Sets **availability** and accepts scheduled or emergency consults.
- Conducts video consults via Daily.co (recorded and persisted in cloud storage).
- Gets paid through the integrated payment fields (`doctor_payment_fields_migration.sql`).
- Has a dashboard for upcoming consults, history, and earnings.

### 1.3 Partner
- Healthcare provider (clinic, lab, hospital, pharmacy) registered with CNPJ.
- Publishes services (with image, price, discount, location) into the marketplace.
- Receives bookings/claims from patients holding an active subscription.
- Has a dedicated portal and onboarding flow (`add-partner-onboarding-completed.sql`, `PARTNER_B2B_IMPLEMENTATION.md`).
- Tracks performance and reimbursements (`claims_reviewed_at_migration.sql`).

### 1.4 Admin (operations)
- Manages all three sides above: approves partners, audits physicians, reviews claims, runs financial reports, fixes data.
- Has a separate console and elevated permissions.

## 2. Major flows

### 2.1 Emergency video consultation

```
Patient app                 API                       Daily.co
   │                         │                            │
   │ POST /consultations/    │                            │
   │     emergency           │                            │
   │ ───────────────────────▶│                            │
   │                         │ create room (REST)         │
   │                         │ ──────────────────────────▶│
   │                         │ ◀────────────────────── room url
   │                         │                            │
   │                         │ notify available           │
   │                         │ physicians (push + email)  │
   │                         │                            │
   │ ◀── room url + token ───│                            │
   │                         │                            │
   │ open video session ────▶│ ◀──── physician joins ────│
   │                         │                            │
   │                         │ ◀── recording stored to    │
   │                         │     S3 via Daily.co        │
   │                         │     cloud recording        │
```

Relevant code: `server/routes/`, `client/src/pages/consultation/`, `docs/CLOUD_RECORDING_MIGRATION.md`, `docs/CLOUD_RECORDING_TEST.md`.

### 2.2 Scheduled consultation

```
Patient ─▶ browses physicians (specialty, availability)
        ─▶ picks slot
        ─▶ confirms (payment if outside subscription benefit)
        ─▶ API creates Appointment + Daily.co room reservation
        ─▶ both sides receive reminder push/email
        ─▶ at start time, both join the room
        ─▶ post-session, prescription / notes attached to appointment
```

Tables: `appointments`, `consultations`, `doctors`, `users`.

### 2.3 Service marketplace (partner side)

```
Partner ─▶ onboarding (KYC, CNPJ, address, profile image)
        ─▶ publishes Service { name, description, image, price, discount }
        ─▶ Admin reviews / featured flag (`add_is_featured.sql`)
        ─▶ Patient browses category / location
        ─▶ Patient redeems benefit (in-app voucher / QR)
        ─▶ Partner marks fulfilled
        ─▶ Reimbursement / payout flows trigger
```

Tables: `partners`, `services`, `claims`. SQL: `service_image_migration.sql`, `seller_fields_migration.sql`.

### 2.4 Dependents

A single subscriber can cover multiple dependents:

```
User (primary subscriber)
  ├── Dependent (spouse)
  ├── Dependent (child)
  └── Dependent (parent)
```

Each dependent inherits the plan's benefits but has its own profile and consult history. Authentication is always done by the primary subscriber; dependents are switched in-app.

### 2.5 Reimbursement / claims

```
Patient ─▶ pays out of pocket for service
        ─▶ uploads receipt + service info
        ─▶ Claim created (status: pending)
        ─▶ Admin reviews (claims_reviewed_at)
        ─▶ approved → payout queued
        ─▶ rejected → patient notified with reason
```

Tables: `claims`. Notifications via email + in-app.

## 3. Component boundaries

```
┌──────────────────────────────────────────────────────────────┐
│                       client/  (React)                       │
│   pages/  components/  services/  hooks/  contexts/          │
│           ▲                                                  │
│           │ fetch / WebSocket / Daily.co SDK                 │
│           ▼                                                  │
├──────────────────────────────────────────────────────────────┤
│                        server/  (Express)                    │
│   routes/   wallet/   email/   stripe/   notifications/      │
│           ▲                                                  │
│           │ Drizzle ORM                                      │
│           ▼                                                  │
├──────────────────────────────────────────────────────────────┤
│                     shared/  (types + schema)                │
│                       │                                      │
│                       ▼                                      │
│                  PostgreSQL (Drizzle + Prisma generate)      │
└──────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
     Stripe         Daily.co       AWS S3          APNs/FCM
```

- `shared/` carries the Drizzle schema and TypeScript types used by both client and server — single source of truth.
- `prisma/` is kept for `prisma generate` to produce types used in scripts; Drizzle is the runtime ORM.
- `migrations/` plus the many `*_migration.sql` files at root are the historical schema evolution; new changes go through Drizzle's migration tooling.

## 4. Mobile (Capacitor)

The same React app is wrapped by Capacitor for iOS and Android:

- iOS: `ios/App/` — built and signed via **Xcode Cloud** (`ci_scripts/`, `xcode-cloud-build.sh`, `xcode-cloud-workflow.md`). Uses APNs (`docs/APNS_RENDER_SETUP.md`).
- Android: `android/` — built via GitHub Actions (`.github/workflows/android-*.yml`) and deployed to Play Console.
- Native plugins in use: biometric auth, secure storage, push notifications, in-app browser, splash screen.

Web build artifacts are copied into the Capacitor projects via `npm run build:mobile && npx cap sync`.

## 5. External integrations

| Service | Used for | Boundary |
|---|---|---|
| **Stripe** | Subscriptions, corporate plans, webhooks | `server/stripe/`, `STRIPE_WEBHOOK_SETUP.md` |
| **Daily.co** | Video rooms, cloud recording | `server/routes/` (room creation), client SDK |
| **AWS S3** | Uploads (avatars, receipts, recordings) | `aws-policy-cnvidas.json`, `AWS_SETUP_RENDER.md` |
| **APNs** | iOS push | `docs/APNS_RENDER_SETUP.md` |
| **FCM** | Android push | Play Console workflow |
| **Apple PassKit** | Subscriber Wallet pass | `server/wallet/`, `docs/WALLET_SETUP.md` |
| **Render** | Web hosting, env management | `render.yaml` |

## 6. Security and data handling notes (for reviewers)

- Auth is JWT + cookie-based; biometric unlock is enforced on mobile via Capacitor plugins.
- All medical data is bound to a `users` row (patient or dependent) and never exposed cross-tenant by route handlers; admin routes carry their own guard.
- Secrets are sourced from `.env` on Render and from Xcode Cloud / Play Console secrets in mobile CI; **no secret should be committed to the repo**.
- Some legacy helper files at the root contain placeholder or development-only material — these are tracked here for historical context and are being progressively migrated out of the repository.

## 7. What is intentionally not in this repo

- Production database dumps and patient data.
- Real Stripe / Daily.co / Apple / AWS credentials.
- Marketing assets used on the public website (`lucascanova.com.br` / `cnvidas.com.br`).
- Internal operational runbooks that live outside source control.
