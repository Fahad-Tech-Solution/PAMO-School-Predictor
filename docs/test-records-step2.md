# Step 2 test records — Interview & timeline dates

Living checklist. **Add a row every time you create/update a test record for Step 2.**  
Use fake names. Cross-link Step 1 records when reusing them.

## What Step 2 covers

- **Interview date** and **Results date** (separate fields)
- Editable **Waitlisted date** and **Accepted date**
- Auto-fill waitlisted/accepted only when status changes and the date field is blank
- Soft order checks: interview ≤ results; waitlisted ≤ accepted

## Automated tests

```bash
npm run db:migrate
npm run typecheck
npm run test -- src/lib/applications/dates.test.ts src/lib/validation/application.test.ts
```

## Manual test checklist

| # | Scenario | Steps | Expected | Pass? | Notes |
|---|----------|-------|----------|-------|-------|
| 1 | Create with interview + results | New app → interview `2025-10-19`, results `2025-10-30` | Detail shows both dates | | |
| 2 | Results before interview | Set results earlier than interview → save | Validation error on results date | | |
| 3 | Waitlisted auto-stamp | Status Waitlisted, leave waitlisted date blank | Waitlisted date fills (today) after save | | |
| 4 | Historical waitlist date | Status Waitlisted + waitlisted `2025-10-30` | Stored date is Oct 30, 2025 (not today) | | |
| 5 | Waitlist → accepted journey | Edit: Accepted + accepted `2026-08-13`; keep waitlisted `2025-10-30` | Both dates remain; status Accepted | | |
| 6 | Clear/edit dates | Change interview/results on edit form | Detail updates | | |
| 7 | Legacy blank dates | Open older app with no timeline dates | Form loads; can add dates later | | |

## Records we added for testing

| Added (date) | Last, First | Interview | Results | Waitlisted | Accepted | Status | App ID | Purpose | Still needed? |
|--------------|-------------|-----------|---------|------------|----------|--------|--------|---------|---------------|
| _(template)_ | Patel, Morgan | 2025-10-19 | 2025-10-30 | 2025-10-30 | 2026-08-13 | Accepted | | Full waitlist→accepted story | Yes |
| _(template)_ | Rivera, Casey | 2025-11-01 | 2025-11-15 | | | Unknown / Not accepted | | Interview+results only | Yes |

### Suggested starter

1. **Patel, Morgan** — interview Oct 19, 2025 → waitlisted Oct 30, 2025 → accepted Aug 13, 2026 (client’s example shape)  
2. Reuse a Step 1 named row and only add interview/results  

After creating/updating, paste IDs from the URL into the table.
