# CN Vidas — Security Remediation Plan

> **Status as of polish branch `chore/portfolio-polish-2026-05-28`.**
>
> This document is an honest, externally-readable inventory of every security issue identified during the diligence-readability polish. Nothing here is hidden or paper-thin; each item is paired with the exact remediation step and an owner action.
>
> Items marked **R-** require rotation of a live credential and a destructive `git` operation (history rewrite). They are **not** fixed inside this polish branch — they need a deliberate, scheduled change with the owner.

---

## Summary

| Severity | Count | Topic |
|---|---|---|
| **Critical** | 6 | Live private keys, signing certificates, session cookies and auth-key material committed to history. |
| **High** | 2 | Hard-coded JWT fallback secret in 7 server files; live Stripe publishable key hard-coded in client and docs. |
| **Medium** | 5 | Server log, test-result log, test-report JSONs, `.xcode.env` and `xcode-cloud.env` committed (none contain live secrets, but should be untracked). |
| **Low** | 2 | 19 vendored AI-agent caches and 218 screenshots inflate the clone. |

## Critical (rotate immediately — repo history is poisoned)

### R-1. Apple PassKit signing key — `wallet_key.key`
- **What.** RSA `BEGIN PRIVATE KEY` block, 28 lines. Used to sign Apple Wallet passes for CN Vidas membership cards.
- **First committed.** `8d4b5da` — 2025-07-08, *"feat: Implementar Apple Wallet e notificações 24h"*.
- **Action.**
  1. Revoke the Apple Pass Type ID certificate in Apple Developer portal and reissue.
  2. Move the new key to Render env var `WALLET_SIGNER_KEY_BASE` (already referenced by `server/wallet/`).
  3. `git rm wallet_key.key` and `git filter-repo --invert-paths --path wallet_key.key` (or BFG) to scrub history.
  4. Force-push and rotate all forks/clones.

### R-2. Push notification CSR — `push.certsigningrequest`
- **What.** Apple APNs Certificate Signing Request. Less sensitive than a private key (it is the *request*, not the resulting certificate) but should not be public.
- **First committed.** `8d4b5da` — 2025-07-08.
- **Action.** Same scrub procedure as R-1. If the CSR was used to issue an APNs certificate, also reissue that certificate.

### R-3. APNs auth key (Base64) — `auth-key-base64.txt`
- **What.** Base64-encoded Apple `AuthKey_*.p8` for APNs token-based auth. Decodes to a `BEGIN PRIVATE KEY` block.
- **First committed.** `eef563e` — 2025-07-08, *"feat: Configurar APNs com Auth Key para push notifications"*.
- **Action.** Revoke the key in Apple Developer (Keys), generate a new one, move to Render env var `APNS_AUTH_KEY_BASE` (already referenced by `server/`). Scrub history.

### R-4. Apple Wallet signing certificate + key (Base64) — `wallet-key-base64.txt`, `wallet-cert-base64.txt`, `wallet-wwdr-base64.txt`
- **What.** Three Base64 blobs: the Pass Type signing key, the corresponding certificate, and the Apple WWDR intermediate. Together they are sufficient to forge CN Vidas membership passes.
- **First committed.** `8d4b5da` — 2025-07-08.
- **Action.** Same as R-1 (revoke + reissue + scrub). The new material should live in `WALLET_SIGNER_*_BASE` env vars only.

### R-5. Admin session cookies — `admin_cookies.txt`
- **What.** `curl`-format cookie file (Netscape format). Even if the session has expired, it leaks the admin session cookie name and domain shape. Should never have been committed.
- **First committed.** `166fc0d` — 2025-06-08, *"deply render"*.
- **Action.** Invalidate any sessions for the listed cookie (rotate `JWT_SECRET` server-side — see R-7 — which invalidates all tokens). Scrub history.

### R-6. Wallet env template — `wallet-env-template.txt`
- **What.** A `.env`-style template. Reviewed: it contains placeholder values (`XXXXXX`) rather than live secrets, but it is named like a secret and was the conduit by which R-1/R-4 were initially prepared. Lower severity, but archive-or-rename.
- **First committed.** ~2025-07.
- **Action.** Rename to `docs/wallet-env.example` or merge into `.env.example`. Scrub history of the `*-base64.txt` siblings.

## High (server code — fix in a follow-up commit, not in this branch)

### R-7. Hard-coded JWT fallback secret — `cnvidas-secret-key-2024`

7 occurrences across 6 files use `process.env.JWT_SECRET || 'cnvidas-secret-key-2024'` as fallback:

```
server/index.ts:125
server/index.ts:198
server/middleware/auth-unified.ts:62
server/scripts/check-auth-config.ts:42
server/routes/wallet-routes.ts:241
server/routes/auth-routes.ts:679
server/routes/public-subscription-routes.ts:83
server/routes/public-subscription-routes.ts:99
```

**Risk.** If `JWT_SECRET` is ever absent in production (env var typo, deploy misconfig), the server falls back to a *publicly known* string, allowing an attacker to forge valid JWTs for any user.

**Action.**
- Remove the fallback. Replace with:
  ```ts
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is required');
  ```
- This is a server behavior change and is therefore out of scope for the polish branch (the rules of this round forbid API/behavior edits). Tracked here for a focused follow-up PR.

### R-8. Live Stripe publishable key hard-coded
- **What.** `pk_live_51RAOnMKOsPzrrDErXaDRtMivvPi3iVD7socexHWBbvb5BEjeUuDBxhC3WTrBRC9NLJ1IASrSAI8SGQj8ZF9uZA8F002np3ZUCz` appears as a fallback in `client/src/lib/stripe-config.ts:5` and quoted in `CLAUDE.md`, `xcode-cloud-workflow.md`, `docs/XCODE_CLOUD_ENV_SETUP.md`, `CLAUDE-MOBILE.md`.
- **Risk.** Stripe publishable keys are designed to be public — they can only create payment intents, not charge. **Not a leak.** But:
  - It pins the production key into builds; rotating Stripe accounts requires a code change.
  - It clutters the diligence read.
- **Action.** Move to `VITE_STRIPE_PUBLIC_KEY` and remove the fallback. Strip from docs. Not in this branch.

## Medium (cruft — already-tracked, .gitignore now blocks new ones)

| ID | File | Status |
|---|---|---|
| R-9 | `server.log` (266 lines, no secrets, but Stripe webhook traces visible) | Round 1 `.gitignore` blocks future `*.log`. Existing file needs `git rm --cached server.log`. |
| R-10 | `test-results.log`, `patient-test-results.log` | Same as R-9. |
| R-11 | `test-report-admin-api-2025-06-09.json`, `test-report-api-2025-06-09.json`, `test-report-doctor-partner-api-2025-06-09.json` | Round 1 `.gitignore` blocks future `test-report-*.json`. Needs `git rm --cached`. |
| R-12 | `ios/App/.xcode.env` | Contains only `export NODE_BINARY=...` — no secrets. Conventional, can stay. Mentioned for completeness. |
| R-13 | `xcode-cloud.env` | Contains only `NODE_ENV`, `VITE_API_URL`, `CI` — no secrets. Conventional, can stay. |

## Low (clone weight / clutter — already documented in REPO_NAVIGATION.md)

| ID | What | Action |
|---|---|---|
| R-14 | `attached_assets/` — 218 PNGs, ~81 MB tracked | See REPO_NAVIGATION §4.8. |
| R-15 | 19 vendored AI-agent caches | See REPO_NAVIGATION §4.9. Round 1 `.gitignore` blocks future; needs `git rm -r --cached` for each. |

## Recommended remediation order

1. **Day 0 — credentials.** Rotate R-1, R-3, R-4 in parallel (Apple Developer portal). Update Render env vars. Confirm prod still works.
2. **Day 0 — JWT.** Generate a new `JWT_SECRET`, set in Render. Sessions invalidate worldwide.
3. **Day 0 — code fix.** Open a focused PR removing the JWT fallback (R-7) and Stripe pk hard-code (R-8). Merge once R-3 / R-4 / R-1 are confirmed rotated.
4. **Day 1 — history scrub.** With a fresh backup of the bare repo, run BFG or `git filter-repo` over the file list R-1, R-2, R-3, R-4, R-5, R-6. Force-push. Notify any collaborators / forks.
5. **Day 1 — git rm --cached.** Single commit removing tracked-but-now-gitignored files: `server.log`, `test-results.log`, `patient-test-results.log`, `test-report-*.json`, the 19 AI-agent cache directories. No history rewrite (these are not secrets, just cruft).
6. **Day 2+ — archive cleanup.** Execute the `chore/archive-historic-scripts` PR described in REPO_NAVIGATION §5.

## Out of scope for this polish branch

The polish branch (`chore/portfolio-polish-2026-05-28`) deliberately does:

- **No file deletion.** Reviewing the impact of each `git rm` is the owner's call.
- **No `git filter-repo`.** Rewriting history is destructive and must be done deliberately.
- **No code edits to server behavior.** R-7 and R-8 require runtime testing.
- **No archive move.** Triggers npm-script and reference breakage; needs separate PR.

What this branch *does* deliver toward security hygiene:

- A hardened `.gitignore` that blocks every kind of secret file pattern observed in the repo from being committed again.
- This plan, so the owner and any reviewer have a single source of truth.
- A `SECURITY.md` at the repo root with a reporting policy (see [`../SECURITY.md`](../SECURITY.md)).

## Verification snippets

After R-1 … R-6 are scrubbed, the owner should be able to run:

```bash
# Should produce no output:
git log --all --diff-filter=A --pretty=format:'%h %ad %s' --date=short \
  -- wallet_key.key push.certsigningrequest admin_cookies.txt \
     auth-key-base64.txt wallet-key-base64.txt wallet-cert-base64.txt \
     wallet-wwdr-base64.txt

# Should produce no matches:
git grep -nE 'cnvidas-secret-key-2024|pk_live_51RAOnMKOsPzrrDEr'
```

If either command produces output, the corresponding remediation step is incomplete.
