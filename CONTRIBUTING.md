# Contributing to CN Vidas

Thanks for taking the time to look at the code. This is primarily a single-founder production codebase, so the contribution model is light. The notes below cover the conventions used in the repository so external reviewers and collaborators can move quickly.

## Branching

- `main` is the production branch. Render auto-deploys the web app and Xcode Cloud / GitHub Actions handle mobile builds.
- Feature work: `feat/<short-name>`
- Bug fixes: `fix/<short-name>`
- Chore / refactor / docs: `chore/<short-name>`, `refactor/<short-name>`, `docs/<short-name>`

## Commits

Conventional Commits, in English when possible:

```
feat(consultations): allow physician to reschedule scheduled slot
fix(ios): suppress WKProcessPool deprecated warning
chore(repo): tighten .gitignore to block wallet certificates
```

## Pull requests

1. Open a PR against `main`.
2. Fill out the PR template (in `.github/`).
3. Verify the build passes locally (`npm run build`) and the type check (`npm run lint`).
4. Mention any migration (`*_migration.sql`) added and confirm it has been applied to staging.

## Secrets

- **Never commit `.env`, `*.key`, `*.p8`, `*.p12`, `*.pem`, `*.cer`, `*-base64.txt`, certificates, cookies, or service-account JSON.**
- The `.gitignore` blocks the common cases. If you add a new secret kind, extend `.gitignore` in the same commit.
- All credentials live in Render (web), Xcode Cloud (iOS), Play Console (Android), and the project owner's password vault.

## Code style

- TypeScript first. Strict mode where feasible.
- React: functional components + hooks. Tailwind for styling. shadcn/ui for primitives.
- Backend: Express route modules under `server/routes/`. Drizzle for ORM. Shared types live in `shared/`.
- Migrations: prefer Drizzle migrations for new changes. Historic `*_migration.sql` files at the root are kept for traceability.

## Database changes

1. Write the Drizzle schema change in `shared/`.
2. Generate the SQL with Drizzle Kit.
3. Apply on staging first, then production via Render.
4. Document in the PR if there is any data backfill.

## Mobile changes

- Web is the source. Run `npm run build:mobile && npx cap sync` after touching anything that affects the bundle.
- iOS: bump the build number in `ios/App/App.xcodeproj`. Xcode Cloud picks it up.
- Android: bump `versionCode`/`versionName` in `android/app/build.gradle`. CI handles the rest.

## Questions

Open an issue using the template in `.github/ISSUE_TEMPLATE/` or contact the author (see `README.md`).
