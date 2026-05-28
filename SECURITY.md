# Security Policy

CN Vidas is a telemedicine platform that handles real patient data, payments and physician credentials. We take security reports seriously.

## Supported versions

Only the latest production deployment of `main` is supported. The platform is in active development and there are no LTS branches.

| Version | Supported |
|---|---|
| `main` (production at [cnvidas.com.br](https://cnvidas.com.br)) | Yes |
| Any older tag / branch | No |

## Reporting a vulnerability

If you believe you have found a security vulnerability in CN Vidas, please **do not open a public GitHub issue**. Instead:

1. Email **knovihax@gmail.com** with the subject line `[SECURITY] CN Vidas — <short description>`.
2. Include:
   - A description of the issue and its impact.
   - Step-by-step instructions to reproduce.
   - The affected URL, endpoint or component if known.
   - Your contact for follow-up, and whether you want public credit after the fix.
3. Allow up to **5 business days** for an initial acknowledgement and up to **30 days** for a remediation, depending on severity.

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction and service degradation.
- Do not access or exfiltrate patient data, physician records, payment details or admin credentials beyond what is needed to demonstrate the issue.
- Give us reasonable time to fix the issue before any public disclosure.

## Out of scope

The following are out of scope for vulnerability reports (we are aware and tracking):

- Self-reported scanner output (e.g. nmap, generic CVE lists) without an exploit path.
- Theoretical issues without a reproducible attack.
- Missing security headers on static asset routes.
- Rate-limiting on non-authentication endpoints.
- Already-known issues tracked in [`docs/SECURITY_REMEDIATION_PLAN.md`](docs/SECURITY_REMEDIATION_PLAN.md).

## Coordinated disclosure

Once a fix is deployed we will:

- Tag the fix commit with a brief security note in the PR description.
- (Optionally) acknowledge the reporter in the release notes if they want credit.
- Notify affected users via in-app banner or email if any patient data was potentially exposed.

## Sensitive data we hold

- Patient PII (name, CPF, contact, address).
- Patient medical interactions (consultation summaries, recordings stored in S3 with restricted ACLs).
- Physician credentials (CRM, RQE) and payment information.
- Partner CNPJ and service catalog.
- Stripe customer IDs and subscription state (no card PAN — Stripe holds those).

Reports involving any of these classes are prioritized.

## Contact

- Primary: **knovihax@gmail.com**
- Owner: Lucas Dickel Canova, MD (CRM 46.242 / RQE 39.549)
- Backup channel: PR comments on `chore/portfolio-polish-2026-05-28` (for diligence-time questions only — not for live vulnerabilities).
