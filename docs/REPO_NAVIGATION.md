# CN Vidas — Repository Navigation Guide

> **Audience.** External reviewer (VC partner, technical diligence, prospective collaborator) opening this repo on GitHub for the first time.
>
> **TL;DR.** The repo is a working production codebase that grew organically over ~2 years of solo founder development. There are 250+ files at the root because historic ad-hoc migration / debug / start scripts were never archived. This guide tells you what each cluster is, what is *load-bearing* (cannot move), and what is safe to archive in a follow-up cleanup PR.
>
> Nothing in this Round-2 polish branch moves or deletes files — moving would silently break npm scripts, deploy configs and CI. The plan below is informational only.

---

## 1. The fast path — what to read first

If you only have 10 minutes:

| # | File | Why |
|---|---|---|
| 1 | [`README.md`](../README.md) | Product pitch, stack, quick start. |
| 2 | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Persona-level walkthrough of the 3-sided product and the main flows. |
| 3 | [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Branching, commits, secret hygiene, DB / mobile change procedure. |
| 4 | [`docs/SECURITY_REMEDIATION_PLAN.md`](SECURITY_REMEDIATION_PLAN.md) | Diligence-honest inventory of secrets that need rotation + repo hygiene that needs follow-up. |
| 5 | [`shared/schema.ts`](../shared/schema.ts) (or `prisma/schema.prisma`) | Source of truth for the data model. |
| 6 | [`server/index.ts`](../server/index.ts) | Express entry point — all routes mount here. |
| 7 | [`client/src/App.tsx`](../client/src/App.tsx) | React SPA root. |

Everything else can be skipped on a first read.

## 2. First-class directories (load-bearing — used by build / deploy / CI)

| Directory | Purpose | Touched by |
|---|---|---|
| `client/` | React + Vite SPA (web app and Capacitor mobile shell). | `npm run dev`, `npm run build:client`, `cap sync` |
| `server/` | Express API, route handlers, integrations (Stripe, Daily.co, APNs, S3, Wallet). | `npm run dev:server`, `npm run build:server` |
| `shared/` | TypeScript types and Drizzle schema shared between client and server. | All builds. |
| `db/` | Database client (`db/index.ts`) and Drizzle migrations (`db/migrations/`). | `npm run migrate` |
| `prisma/` | Prisma schema, kept only for codegen (`prisma generate` runs during Render build). | `npm run build:render` |
| `migrations/` | **Official** Drizzle-managed migrations (`0000_…sql` etc.). New schema changes go here. | `npm run migrate` |
| `ios/` | Capacitor iOS project (Xcode + Xcode Cloud). | Xcode Cloud workflow. |
| `android/` | Capacitor Android project (Gradle + Play Console). | `android-*.yml` GitHub Actions. |
| `public/` | Static assets served by Vite (logos, favicons, manifest). | Vite. |
| `scripts/` | Curated operational scripts (Daily.co webhook config, recording checks). | Manually invoked. |
| `docs/` | Architecture, integration and ops guides. | Humans. |
| `legal-docs/` | Versioned legal contracts (adhesion, partner, doctor, privacy, terms). | Referenced from app + admin UI. |
| `.github/` | PR / Issue templates, Android build / deploy workflows, Claude review workflow. | GitHub Actions. |
| `ci_scripts/` | Xcode Cloud post-clone / pre-archive hooks. | Xcode Cloud. |
| `node_modules/` (partial) | **Intentionally tracked**: Capacitor plugins for Xcode Cloud (cannot resolve via npm at build time). 14 plugin packages, ~1.5k files. Removing breaks iOS builds. | Xcode Cloud. |

## 3. Root files that are referenced by `package.json` (DO NOT MOVE)

These are surfaced as `npm run …` commands and are part of the public contract of the repo. Moving them silently breaks the script.

| Root file | Surfaced as |
|---|---|
| `apply-migration.js` | `npm run migrate:fix-constraints` |
| `run-campaign-leads-migration.js` | `npm run migrate:campaign-leads` |
| `db-query.ts` | `npm run db:query` |
| `check-doctor-onboarding-simple.js` | `npm run check-doctor-onboarding` |
| `fix-doctor-onboarding-simple.js` | `npm run fix-doctor-onboarding` |
| `check-partner.js` | `npm run check-partner` |
| `create-partner.js` | `npm run create-partner` |
| `run-migration-drizzle.ts` *(referenced by `npm run migrate` — missing from working tree, should be restored or the script repointed)* | `npm run migrate` |

Build / config files at root that are also load-bearing: `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `drizzle.config.ts`, `jest.config.js`, `capacitor.config.ts`, `capacitor.assets.config.json`, `components.json`, `aws-policy-cnvidas.json`, `build.js`, `build-render.js`, `.replit`, `.node-version`, `.gitattributes`, `.gitignore`.

## 4. Root files that are NOT referenced by `package.json` (safe to archive in a follow-up PR)

> Plan: move these into `archive/` (a new top-level directory) in a separate `chore/archive-historic-scripts` PR. They are kept in git history so nothing is lost. The current polish branch only documents them.

### 4.1 Ad-hoc migration SQL (30 files)

Pre-Drizzle, founder-era one-shot SQL. Already applied to production. The canonical place for new migrations is `migrations/` (Drizzle) or `db/migrations/`.

```
add_is_featured.sql                       fix-constraints.sql
add_onboarding_completed_field.sql        fix-missing-doctors.sql
add-partner-onboarding-completed.sql      gender_column_migration.sql
add-partner-profile-image.sql             legal_acceptances_migration.sql
address_fields_migration.sql              notifications_column_migration.sql
checkout_tracking_migration.sql           onboarding_status_migration.sql
claims_reviewed_at_migration.sql          payment_fields_migration.sql
cnpj_field_migration.sql                  schema_update_availability.sql
cpf_field_migration.sql                   schema_update_qr.sql
doctor_payment_fields_migration.sql       schema_update.sql
doctor_payment_info_migration.sql         seller_fields_migration.sql
doctor_profile_image_migration.sql        service_image_migration.sql
doctor_rqe_migration.sql                  subscription_plan_enum_update.sql
email_verification_migration.sql          subscription_plans_migration.sql
emergency_consultations_migration.sql     welcome_status_migration.sql
```

**Recommendation.** Move to `archive/migrations-adhoc/` and add a one-line `README.md` noting they were applied prior to Drizzle adoption.

### 4.2 Ad-hoc `check-*` scripts (23 files)

One-off data inspection scripts written while debugging specific tickets.

```
check-appointment-181.js                  check-patient-lucas.mjs
check-appointment-204.js                  check-profile-images-v2.js
check-consultation-204-detailed.js        check-profile-images.cjs
check-doctor-onboarding.js                check-profile-images.mjs
check-doctor-user.cjs                     check-recent-upload.cjs
check-doctors-table.js                    check-recordings.js
check-emergency-consultations.mjs         check-subscription.js
check-emergency-simple.cjs                check-users.mjs
check-onboarding-field.mjs                (check-doctor-onboarding-simple.js
check-partner-complete.js                  check-partner.js
check-password.cjs                         check-password.js
                                          → keep, referenced by npm scripts)
```

**Recommendation.** Move to `archive/ops-scripts/check/`.

### 4.3 Ad-hoc `fix-*` scripts (14 files)

Idempotent data-repair scripts run once and forgotten.

```
fix-admin-issues.mjs                      fix-emergency-room-names.md
fix-admin-typescript.mjs                  fix-failed-recording.js
fix-all-database-columns.mjs              fix-gender-column.mjs
fix-database-columns.mjs                  fix-imports.sh
fix-doctor-onboarding.js                  fix-missing-doctors.js
fix-doctor-partner-issues.mjs             fix-partners-table.mjs
fix-doctor-password.mjs                   fix-patient-issues.mjs
                                          fix-recording-processing.js
                                          fix-subscription-columns.mjs
```

**Recommendation.** Move to `archive/ops-scripts/fix/`. Keep `fix-ios-build.sh` at root only if a current iOS build doc references it (it does not — also archivable).

### 4.4 Ad-hoc `test-*` / `run-*-test*` scripts (24 files)

Manual API smoke tests. Not part of `jest`. None are wired to CI.

```
test-admin-api.mjs                        test-emergency-api.mjs
test-admin-complete.cjs                   test-emergency-fix.cjs
test-admin-complete.mjs                   test-frontend-doctor.cjs
test-admin-cookies.cjs                    test-mock-login.ts
test-admin-frontend.cjs                   test-partner-complete.mjs
test-admin-functions.cjs                  test-partner-registration.py
test-doctor-complete.cjs                  test-partner-registration.sh
test-doctor-complete.mjs                  test-partner-services.cjs
test-doctor-final.cjs                     test-password-change.mjs
test-doctor-partner-api.mjs               test-patient-api.mjs
test-email-service.mjs                    test-patient-complete.mjs
test-email-verify.mjs                     test-patient-full.mjs
                                          test-registration.mjs
                                          test-user-data.mjs
                                          run-doctor-upload-tests.sh
                                          run-patient-tests-final.cjs
                                          run-patient-tests.cjs
                                          test-all-roles.sh
                                          test-runner.sh
                                          test-server.sh
                                          test-upload-ios.sh
```

Plus 3 generated test reports + 1 stray HTML / image:

```
test-report-admin-api-2025-06-09.json
test-report-api-2025-06-09.json
test-report-doctor-partner-api-2025-06-09.json
test-profile-image-display.html
test-profile.jpg
test-upload-browser.html
test-results.log
patient-test-results.log
```

The `.gitignore` Round 1 added already blocks `test-report-*.json` and `*.log` for *future* commits but already-tracked files persist (see SECURITY_REMEDIATION_PLAN.md item R-7).

**Recommendation.** Move scripts to `archive/manual-tests/`. Hard-delete the `*.log` / `*report*.json` files (they are pure artifacts).

### 4.5 Ad-hoc `start-*` / server entry scripts (10 files)

Multiple competing dev-server entry points from before `npm run dev` stabilized.

```
emergency-server.js          start-clean.sh           start-server-now.js
minimal-server.js            start-dev.sh             start-server-simple.sh
restart-server.sh            start-production.sh      start-server.sh
run-server.sh                start-server-fix.sh      start-simple.js
server-start.sh              start-unified.sh         working-server.js
start-both.sh                                         setup-ssh-access.sh
```

**Recommendation.** Move to `archive/legacy-bootstrap/`. The canonical entry points are `npm run dev`, `npm run start`, `npm run dev:unified`.

### 4.6 Ad-hoc `create-*` / `setup-*` / `reset-*` admin scripts

```
create-admin-direct.cjs           create-doctor.js              setup-db.js
create-admin-now.js               create-mock-patient.ts        setup-hcsr-partner.js
create-admin-simple.mjs           create-partner.js (npm)       setup-test-data-direct.js
create-admin.js                   create-paulo-admin.js         setup-test-data.js
create-doctor-user.cjs            reset-admin-password.js
                                  hash-password.js
                                  reprocess-recording.js
                                  cleanup-old-notifications.js
                                  send-test-email.js
                                  send-test-email-full.mjs
                                  apply-migration.js (npm)
                                  execute-onboarding-migration.js
                                  run-legal-acceptances-migration.js
                                  run-migration.js
                                  run-onboarding-migration.js
                                  run-rqe-migration.js
                                  run-sync-migration.js
                                  update-doctor-password.cjs
                                  update-emergency-consultations.cjs
```

**Recommendation.** Move to `archive/ops-scripts/admin/` except the four referenced by npm scripts.

### 4.7 Root markdowns — guides and reports (42 files)

Three buckets:

**Keep at root (3):** `README.md`, `CONTRIBUTING.md`, `CLAUDE.md` (AI assistant config used by Claude Code).

**Move to `docs/` (relocate, do not delete) — these are useful diligence reading:**
```
APNS_SETUP_GUIDE.md            IOS_SETUP_GUIDE.md          STRIPE_WEBHOOK_SETUP.md
AWS_SETUP_RENDER.md            DEPLOY_GUIDE.md             TESTFLIGHT_GUIDE.md
CLAUDE-MOBILE.md               DEPLOY.md                   WALLET_SETUP.md
IOS_ONBOARDING_GUIDE.md        FLUXOS_USUARIO_CNVIDAS.md   xcode-cloud-workflow.md
PARTNER_B2B_IMPLEMENTATION.md  ROADMAP_FUNCIONALIDADES.md  cn_vidas_technical_documentation.md
START_SERVERS.md               PWA-CHECKLIST.md            DESIGN_GUIDELINES_TRIUNFO.md
```

**Move to `archive/notes/` — sprint-era working notes, status reports, internal designs (NOT for external reviewers):**
```
DEBUG-RECORDING-ISSUE.md            MELHORIAS_EMAIL_DESIGN.md
FIX_DOCTOR_ONBOARDING_LOOP.md       NOMENCLATURE_FIXES_STATUS.md
fix-emergency-room-names.md         patient-fixes-plan.md
MELHORIA_AUTH_LAYOUT.md             PLANO_MARKETING_TRIUNFO_FEV2026.md
MELHORIA_CARDS_CONSULTAS_AGENDADAS  PROXIMOS_PASSOS_TESTFLIGHT.md
MELHORIA_DESIGN_CARDS_CONSULTAS.md  SOLUCAO_ERRO_AGENDAMENTO.md
relatorio-administrador-completo.md SOLUCAO_IMAGENS_UPLOAD.md
relatorio-completo-medicos-parc..md TEST_REMOTE_CONSOLE.md
relatorio-testes-paciente.md        TEST-PARTNER-README.md
TESTE-PLANOS-CORPORATIVOS.md        test-upload-manual.md
UPLOAD_FIXES.md
```

### 4.8 `attached_assets/` — 218 screenshots, ~81 MB

`Captura de Tela …png` files dragged in while debugging tickets. Tracked in git so the bundle is heavy to clone. Round 1 added a `.gitignore` rule for new `/Captura*.png` at root but the existing `attached_assets/` directory is already tracked.

**Recommendation.** Three options, in order of preference:
1. **Move to a release asset bucket** (S3 / Cloudflare R2) and add an `attached_assets/README.md` with the inventory + URL.
2. **`git rm -r --cached attached_assets/`** in a separate PR, add to `.gitignore`, lose the screenshots permanently. ~81 MB savings on clone.
3. **Leave as-is** if any open ticket / doc references a specific screenshot path.

### 4.9 Vendored AI-agent caches — 19 directories

```
.agent/  .agents/  .cline/   .codex/    .commandcode/  .factory/  .gemini/
.goose/  .kilocode/ .kiro/   .neovate/  .opencode/     .openhands/ .pi/
.qoder/  .roo/      .trae/   .windsurf/ .zencoder/
```

Each holds 1-2 boilerplate config files from a different AI coding assistant the founder evaluated. None affect runtime. Round 1 added all 19 to `.gitignore` for future commits but already-tracked content persists (`git rm -r --cached` is needed in a follow-up PR).

**Recommendation.** Keep only the agent you actively use (likely `.cursor/` and `.claude/`); remove the other 17 in a follow-up commit.

### 4.10 Other directories worth flagging

| Directory | State | Action |
|---|---|---|
| `temp-screenshots/` | Empty in working tree, but tracked. | Remove via `git rm -r --cached`. |
| `uploads/recordings/`, `uploads/temp/` | Runtime upload mount points; should be empty in git. | Verify and add `.gitkeep` if needed. |
| `backend/src/db/` | Single-file orphan (one DB helper that doesn't seem to belong to `server/`). | Investigate; either move into `server/` or delete. |
| `src/pages/Admin/` | Orphan — looks like a half-extracted React route from before `client/src/pages/admin/`. | Investigate; likely deletable. |
| `test-scripts/` | One audio-fixture generator + README. | Keep. |
| `marketing/` | One HTML carousel. | Move to `archive/`. |

## 5. Suggested archive PR (NOT in this branch)

```bash
git checkout -b chore/archive-historic-scripts
mkdir -p archive/{migrations-adhoc,ops-scripts/{check,fix,admin},legacy-bootstrap,manual-tests,notes}

# Use git mv so history is preserved.
git mv add_*.sql add-*.sql address_fields_migration.sql … archive/migrations-adhoc/
git mv check-appointment-*.js check-doctor-*.js … archive/ops-scripts/check/
# ...

# DO NOT move the files in section 3 (referenced by package.json).
git commit -m "chore(repo): archive historic ad-hoc scripts and notes

Move 100+ legacy root-level files into archive/ to reduce the
top-level surface area exposed to first-time reviewers. No files
deleted, no code paths changed, no npm scripts repointed."
```

After this archive PR, the root would shrink from ~250 files to roughly:

```
.github/  .gitignore  android/  archive/  build.js  build-render.js
capacitor.*  CLAUDE.md  client/  components.json  CONTRIBUTING.md
db/  docs/  drizzle.config.ts  ios/  jest.config.js  legal-docs/
LICENSE  migrations/  package*.json  postcss.config.js  prisma/
public/  README.md  scripts/  server/  shared/  src/  tailwind.config.ts
tsconfig*.json  uploads/  vite.config.ts
+ the 8 npm-referenced root scripts
```

That is the layout a first-time reviewer would expect for a production codebase of this size.

## 6. Why this guide exists (and why Round 2 didn't archive)

Three reasons the archive was deliberately *not* executed in this branch:

1. **The rules of the polish task forbid renaming files with code references.** Several of the would-be-archived files are referenced from working notes, README snippets, or are imported by other archived scripts — verifying every reference requires either running the app or accepting the risk of a silent break. A separate, focused PR can do this carefully.
2. **`run-migration-drizzle.ts` is missing from the working tree** but referenced as `npm run migrate`. Until that is resolved (restored or the script repointed), shuffling migration files is risky.
3. **Live secrets must be rotated first** ([`SECURITY_REMEDIATION_PLAN.md`](SECURITY_REMEDIATION_PLAN.md)). Cleaning the cruft before fixing the security exposure would invert the priority order a reviewer would expect.

This document is the bridge: it gives a reviewer everything they need to understand the layout *as it stands today*, without having to wade through the noise.
