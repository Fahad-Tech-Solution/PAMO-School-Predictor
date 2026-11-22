# Step 1 test records — Applicant names + last-name search

Living checklist. **Add a row every time you create a test applicant/application for Step 1.**  
Do not put real student PII here if this repo is shared — use clearly fake names.

## Privacy rule under test

- Names appear in admin list / detail / dashboard recent for lookup.
- Names must **not** appear in school statistics charts or predictor scoring inputs.

## Automated tests (run locally)

```bash
npm run db:migrate
npm run typecheck
npm run test -- src/lib/applicants/name.test.ts src/lib/validation/application.test.ts
```

## Manual test checklist

| # | Scenario | Steps | Expected | Pass? | Notes |
|---|----------|-------|----------|-------|-------|
| 1 | Create with full name | `/applications/new` → last **Rivera**, first **Casey**, home state, school, save | Form clears; Applications list shows **Rivera, Casey** | | |
| 2 | Search by last name | Applications → Last name filter `Rivera` | Only matching rows | | |
| 3 | Partial last-name search | Filter `riv` | Still finds Rivera (case-insensitive) | | |
| 4 | Create without name | Save with blank names | Row shows **—** for applicant; still editable later | | |
| 5 | Edit names on applicant | Open applicant → set last/first → Save applicant | Detail title updates to **Last, First** | | |
| 6 | Application detail | Open application | Applicant link shows name (or home state fallback) | | |
| 7 | Stats anonymity | Open a school stats page | No applicant names in charts | | |
| 8 | Predictor anonymity | `/predictor` | No name fields; GRE/GPA only as before | | |

## Records we added for testing

Fill this table as you create records (copy a blank row template as needed).

| Added (date) | Last name | First name | Home state | School(s) | Application ID (optional) | Applicant ID (optional) | Purpose | Still needed? |
|--------------|-----------|------------|------------|-----------|---------------------------|-------------------------|---------|---------------|
| _(template)_ | Rivera | Casey | TX | _(pick one)_ | | | Full-name create + search | Yes |
| _(template)_ | | | CA | _(pick one)_ | | | Nameless / legacy-style row | Yes |
| _(template)_ | Lee | Sam | NY | _(two schools)_ | | | Multi-school + later name edit | Yes |

### Suggested starter set (create these three)

1. **Rivera, Casey** — TX — one school — confirms list + last-name search  
2. **(no name)** — CA — one school — confirms blank-name UX  
3. **Lee, Sam** — NY — two schools — confirms multi-school + applicant edit  

After creating each, paste IDs from the URL (`/applicants/...` or `/applications/...`) into the table above.

## Cleanup

When Step 1 QA is done, mark rows “Still needed? No” and delete test applicants/applications from the app if they are not needed for Steps 2–4.
