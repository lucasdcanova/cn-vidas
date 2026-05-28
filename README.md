# CN Vidas

> Telemedicine marketplace and digital health platform — connecting patients, physicians and healthcare partners in a single 3-sided product.

[![Status](https://img.shields.io/badge/status-in%20production-2ea44f)](https://cnvidas.com.br)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18%2B-339933?logo=node.js&logoColor=white)](.node-version)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![iOS · Android](https://img.shields.io/badge/mobile-iOS%20%C2%B7%20Android-black?logo=capacitor&logoColor=white)](https://capacitorjs.com/)

Live: **[cnvidas.com.br](https://cnvidas.com.br)** · iOS + Android via Capacitor · Built and operated by [Lucas Dickel Canova, MD](https://www.lucascanova.com.br) (CRM 46.242 / RQE 39.549).

---

## Problem

Brazilian primary care is fragmented across three disconnected sides:

1. **Patients** struggle to access on-demand consults, pay out of pocket, and have no portable view of their care.
2. **Physicians** outside large operators have no turnkey way to do compliant telemedicine, get paid, and reach patients.
3. **Healthcare partners** (clinics, labs, pharmacies, hospitals) need a low-friction channel to monetize spare capacity and reach a recurring patient base.

CN Vidas is a single platform addressing all three sides — subscription-driven access for patients, marketplace + scheduled and emergency telemedicine for physicians, and a B2B partner portal for service providers.

## What it does

- **On-demand emergency video consults** (Daily.co, persisted recordings).
- **Scheduled appointments** with available physicians.
- **Service marketplace** — partner clinics/labs publish discounted services to subscribers.
- **Dependents** management — primary subscriber covers family members.
- **Reimbursement / claims** flow for out-of-network services.
- **Apple Wallet pass** for the subscriber card.
- **Subscription billing** via Stripe (multiple tiers + corporate B2B plans).
- **Admin console** for operations, partner onboarding, financial reports.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Mobile | Capacitor (iOS + Android), Xcode Cloud CI, Play Store |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM, Prisma (generate) |
| Auth | JWT, session cookies, biometric (Capacitor) |
| Video | Daily.co (rooms, recordings, cloud storage) |
| Payments | Stripe (subscriptions, webhooks, corporate plans) |
| Email | Nodemailer + transactional templates |
| Push | APNs (iOS) + FCM (Android) |
| Wallet | Apple PassKit (`server/wallet/`) |
| Storage | AWS S3 (uploads, recordings) |
| Hosting | Render (web + worker), Xcode Cloud, Play Console |

## Architecture at a glance

Three first-class personas plus admin, sharing one Express API and PostgreSQL schema:

```
                        ┌──────────────┐
                        │   Patient    │ web + iOS + Android
                        └──────┬───────┘
                               │ subscribe · book · video · reimburse
┌──────────────┐               ▼               ┌──────────────┐
│   Partner    │◀────── CN Vidas API ─────────▶│  Physician   │
│ (clinic/lab) │  Express + Postgres + Drizzle │  (provider)  │
└──────────────┘               ▲               └──────────────┘
                               │
                        ┌──────┴───────┐
                        │    Admin     │ ops, finance, support
                        └──────────────┘
```

Detailed flows (emergency video, scheduled consult, marketplace, dependents, reimbursements) are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository layout

```
client/      React + Vite frontend (web + Capacitor shell)
server/      Express API, route handlers, wallet, integrations
shared/      Types and Drizzle schema shared between client and server
db/          Database client and migration helpers
prisma/      Prisma schema (used for codegen only)
migrations/  SQL migrations history
ios/         Capacitor iOS project (Xcode + Xcode Cloud)
android/     Capacitor Android project (Gradle + Play Console)
public/      Static assets served by Vite
docs/        Architecture, operational and integration guides
.github/     CI workflows (Android build, deploy, code review)
```

## Quick start

Requirements: Node 18+, PostgreSQL 14+, a Stripe test account, a Daily.co account.

```bash
git clone https://github.com/lucasdcanova/CNVidas-updated.git
cd CNVidas-updated
npm install

# Configure env (never commit .env — see docs/ for required keys)
cp .env.example .env

# Generate Prisma client + run migrations
npx prisma generate
npm run migrate

# Run server + client (single dev process)
npm run dev
```

Web app on `http://localhost:3000`, API on `http://localhost:3001`.

### Mobile (Capacitor)

```bash
npm run build:mobile
npx cap sync
npm run cap:ios       # opens Xcode
# Android:
npx cap open android  # opens Android Studio
```

## Status

In production at **[cnvidas.com.br](https://cnvidas.com.br)** with real subscribers, physicians and partner services. iOS app shipped via App Store / TestFlight; Android via Play Console. Active development is on the `main` branch.

## Contributing

This is primarily a single-founder production codebase. If you are reviewing it for diligence or collaboration, see [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch and PR conventions.

## For external reviewers

- [`docs/REPO_NAVIGATION.md`](docs/REPO_NAVIGATION.md) — what each top-level cluster of files is, what is load-bearing, what is safe to archive.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — persona walkthrough and major flows.
- [`docs/SECURITY_REMEDIATION_PLAN.md`](docs/SECURITY_REMEDIATION_PLAN.md) — honest inventory of known security cleanup items and remediation order.
- [`SECURITY.md`](SECURITY.md) — how to report a vulnerability.

## License

MIT — see [LICENSE](LICENSE).

## Author

**Lucas Dickel Canova, MD** — surgeon and endoscopist (CRM 46.242 / RQE 39.549), founder of CN Vidas.
Portfolio: [lucascanova.com.br](https://www.lucascanova.com.br) · Email: knovihax@gmail.com
