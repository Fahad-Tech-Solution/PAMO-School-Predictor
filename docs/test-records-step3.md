# Step 3 test records — Waitlist journey + timeline charts

Living checklist. **Add a row every time you create/update a test record for Step 3.**  
Reuse Step 1/2 named records when possible.

## What Step 3 covers

- Detail label **Accepted after waitlist** + ordered timeline
- School stats card: **% waitlisted → later accepted** and **average days on waitlist**
- School charts: **interview dates** and **results dates** by month
- Names stay out of statistics

## Automated tests

```bash
npm run typecheck
npm run test -- src/lib/applications/journey.test.ts src/lib/statistics/waitlist-journey.test.ts src/lib/statistics/bins.test.ts
```

## Manual test checklist

| # | Scenario | Steps | Expected | Pass? | Notes |
|---|----------|-------|----------|-------|-------|
| 1 | Accepted after waitlist detail | Open app with waitlisted + accepted dates, status Accepted | Status shows “Accepted after waitlist”; timeline ordered; days on waitlist shown | | |
| 2 | Direct accept (no waitlist) | Accepted with no waitlisted date | Status stays “Accepted”; no waitlist journey days | | |
| 3 | School conversion % | School with 1 accepted-after-waitlist + 1 still waitlisted | Waitlist card ≈ 50%; “1 of 2 ever waitlisted” | | |
| 4 | Average wait days | Accepted-after-waitlist with both dates (e.g. Oct 30 → Aug 13) | Average days matches calendar span | | |
| 5 | Interview/results charts | Apps with interview/results months | Month bars appear on school stats | | |
| 6 | Empty waitlist cohort | School with no waitlisted stamps/status | Waitlist card empty state | | |

## Records we added for testing

| Added (date) | Last, First | School | Waitlisted | Accepted | Status | App ID | Purpose | Still needed? |
|--------------|-------------|--------|------------|----------|--------|--------|---------|---------------|
| _(template)_ | Patel, Morgan | | 2025-10-30 | 2026-08-13 | Accepted | | Conversion + avg days | Yes |
| _(template)_ | Rivera, Casey | same school | 2025-11-01 | | Waitlisted | | Denominator for % | Yes |

After creating/updating, paste IDs from the URL and mark checklist rows.
