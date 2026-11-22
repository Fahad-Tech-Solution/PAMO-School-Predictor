# Step 4 — Full QA (Steps 1–3)

Master verification for applicant identity, timeline dates, and waitlist-journey analytics.  
Use fake names. Fill Pass? as you walk the app; link App/Applicant IDs from Steps 1–3 tables.

## Automated gate (2026-11-20)

| Check | Result | Notes |
|-------|--------|-------|
| `npm run typecheck` | Pass | |
| `npm run test` | Pass — 12 files / 53 tests | Includes name, dates, journey, waitlist stats, bins, validation |
| `npm run lint` | Pass (0 errors) | `set-state-in-effect` fixes applied. Remaining: 1 warning — `window.location.assign("/login")` in `sidebar-user-menu` (intentional hard navigation after sign-out) |

Feature-focused unit suites:

```bash
npm run typecheck
npm run test -- src/lib/applicants/name.test.ts src/lib/applications/dates.test.ts src/lib/applications/journey.test.ts src/lib/statistics/waitlist-journey.test.ts src/lib/statistics/bins.test.ts src/lib/validation/application.test.ts
```

## Code review spot-checks (automated / static)

| # | Check | Result |
|---|-------|--------|
| C1 | School stats SQL does **not** select `lastName` / `firstName` | Pass — only academics, status, timeline dates, homeState |
| C2 | Predictor code has no name fields | Pass — no `lastName`/`firstName` under `src/lib/predictor` |
| C3 | Stats cache version bumped for new aggregates | Pass — `schoolStats` key `v6` |
| C4 | Application create/update invalidates school stats cache | Pass |
| C5 | Accept-after-waitlist preserves prior `waitlistedAt` when form blank | Pass — `resolveStatusDates` |
| C6 | Journey helpers: conversion % + avg days definitions | Pass — unit coverage |

## Success criteria (proposal §8)

| # | Criterion | Covered by | Pass? |
|---|-----------|------------|-------|
| 1 | Enter interviewed applicant with last + first name | Step 1 #1 | |
| 2 | Months later find by last name and update status | Step 1 #2–3 + Step 2 #5 | |
| 3 | Record interview date + results date | Step 2 #1, #6 | |
| 4 | School charts for interview + results timing | Step 3 #5 | |
| 5 | Waitlisted then later accepted with real date sequence | Step 2 #5 + Step 3 #1, #3–4 | |
| 6 | Names out of stats; still usable for admin lookup | Step 1 #7–8 + C1–C2 | |

## End-to-end manual walk (recommended order)

Create **one school** used for all journey stats, then:

1. **Rivera, Casey** — named create + last-name search (Step 1)  
2. Add interview/results dates on that row (Step 2)  
3. **Patel, Morgan** — interview → waitlisted → accepted with historical dates (Steps 2–3)  
4. Second waitlisted-only row at same school (Step 3 conversion denominator)  
5. Open school stats → waitlist card + interview/results month charts  
6. Confirm predictor and school charts show no names  

### Consolidated Pass? grid

Copy outcomes from the living Step 1–3 checklists, or mark here:

| Area | Key scenarios | Pass? | Notes |
|------|---------------|-------|-------|
| Names + search | Create named / blank; filter `Rivera` / `riv`; applicant edit | | |
| Timeline dates | Interview+results; inverted dates rejected; historical waitlist/accepted | | |
| Auto-stamps | Waitlisted blank → today; accept keeps prior waitlisted stamp | | |
| Detail journey | “Accepted after waitlist”; timeline order; days on waitlist | | |
| School waitlist metrics | Conversion %; avg days; empty cohort | | |
| Date charts | Interview months; results months | | |
| Privacy | No names in school stats or predictor | | |
| Legacy rows | Older apps without dates/names still editable | | |

## Records cross-link

| Role | Suggested identity | Step docs |
|------|--------------------|-----------|
| Named search | Rivera, Casey | `test-records-step1.md`, `step2.md`, `step3.md` |
| Waitlist→accepted | Patel, Morgan | `step2.md`, `step3.md` |
| Still waitlisted (same school) | _(any)_ | `step3.md` |
| Nameless / legacy | blank names | `step1.md` |

## Sign-off

| | |
|--|--|
| Automated gate | Typecheck + unit tests green; lint 0 errors (1 logout assign warning) |
| Manual E2E | _pending — fill Pass? columns above_ |
| Ready for client demo | _after manual E2E_ |
