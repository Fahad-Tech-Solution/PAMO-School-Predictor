# Proposal: Applicant Identity, Interview Timeline & Waitlist Journey Tracking

**Project:** PAMO (PA School Application Outcomes)  
**Audience:** Client review / scope confirmation  
**Status:** Proposed enhancement package  

---

## 1. Executive summary

This proposal covers a major expansion of how applications are recorded, found, and analyzed. Until now, PAMO has prioritized **anonymous, outcome-focused statistics**. That design works well for charts and the school predictor—but it creates a real operational problem when you need to **go back months later**, find a specific student who was interviewed, and update their status (for example: waitlisted → later accepted).

This work package introduces:

1. **Controlled applicant identity** (last name + first name) for admin search and editing only  
2. **Interview and results date capture** with dedicated school-level timeline analytics  
3. **Waitlist-to-acceptance journey tracking** so students who came off the waitlist are visible as a distinct path—not just a final “Accepted” label  

These are **large, cross-cutting features**: they touch data structure, forms, list/search, application detail/edit flows, school statistics, caching, validation, and historical data behavior. They should be treated as a dedicated delivery phase—not a small UI tweak.

---

## 2. What we currently have

### 2.1 Applicant records (anonymous by design)
- Each applicant stores **home state** only  
- The system was intentionally built **without** name, email, phone, or other identifying fields  
- Multiple school applications can belong to one anonymous applicant  

**Implication today:** Once many records exist, it is difficult to tell which row belongs to which real student when you need to edit outcomes later.

### 2.2 Application outcomes
- Per-school application with status: **Accepted / Not accepted / Waitlisted / Unknown**  
- Academic fields (GPAs, PCE, GRE when required)  
- Attempt number  
- Automatic timestamps when status becomes **Waitlisted** or **Accepted** (`Waitlisted at` / `Accepted at`)  

**Implication today:** Those timestamps are mainly system “status changed now” stamps. They are **not** designed as full interview-cycle documentation (interview day vs. results day vs. later off-waitlist acceptance), and they are not first-class editable historical fields for your real-world timeline.

### 2.3 Finding and editing applications
- Applications list with filters (school, status, attempt, home state, residency)  
- Application detail + admin edit of status/academics  

**Implication today:** Filtering helps by school/outcome, but **cannot search “Smith”** or another last name to recover a specific interviewed applicant.

### 2.4 School statistics
- Strong distribution charts already exist (residency, outcomes, attempts, GPA bands, PCE, GRE where relevant)  
- Charts are built from **non-identifying** application features  

**Implication today:** There is **no** interview-date distribution, **no** results-date distribution, and **no** dedicated “accepted after waitlist” journey view.

### 2.5 What is already partially useful for waitlist stories
- If a student moves **Waitlisted → Accepted**, the system can retain **both** a waitlisted timestamp and an accepted timestamp  
- Detail pages already display those two stamps  

**Implication today:** The raw ingredients for a waitlist journey exist in a limited form—but without editable historical dates, interview date, results date, search-by-name, and dedicated analytics, the story you described (interview → waitlist → months later accepted) cannot be reliably captured or demonstrated at scale.

---

## 3. What is missing (gaps this proposal closes)

| Client need | Gap today |
|-------------|-----------|
| Remember which student an entry belongs to | No applicant name fields |
| Search by last name to edit later | No name-based search |
| Record interview day | No interview date field |
| Chart interview timing across applicants | No interview-date analytics |
| Record when results were received | No dedicated results date (only auto status stamps) |
| Chart results timing | No results-date analytics |
| Show “waitlisted, then later accepted” clearly | Final status alone hides the journey; no dedicated journey metric/UI |
| Enter real historical dates (e.g. Oct 2025 / Aug 2026) | Status timestamps are not a full, admin-friendly timeline editor |
| Keep names out of public-facing stats | Identity must be scoped carefully (admin lookup only) |

---

## 4. What we are going to add

### Workstream A — Applicant identity for operational lookup (major)
**Add**
- **Last name** and **first name** on the applicant  
- Display on application list, applicant/application detail, and create/edit flows  
- **Search / filter by last name** on Applications (and related admin views as needed)  

**Design principle**
- Names exist so **you** can find and correct records  
- Names are **excluded from school statistics charts and predictor similarity features**  
- This is a deliberate split: **operational identity** vs **anonymous analytics**

**Why this is large**
- Schema + migration for a previously anonymous model  
- Create, multi-school create, edit, list, detail, validation, and search query changes  
- Privacy/product rule updates across the app (“identifying data is allowed for admin lookup only”)  
- Careful handling of existing anonymous historical rows (blank names until filled)

---

### Workstream B — Interview & results timeline capture (major)
**Add**
- **Date of interview** (per application / school cycle)  
- **Date of results** (when the outcome of that interview cycle was communicated)  
- Editable date entry on create/edit (supporting historical backfill)  
- Alignment with status workflow so dates remain meaningful when status changes later  

**Add analytics**
- School statistics chart: **distribution / range of interview dates**  
- School statistics chart: **distribution / range of results dates**  

**Why this is large**
- New date fields, validation, forms, detail display  
- Binning/aggregation strategy for date charts (e.g. by month)  
- School stats pipeline + cache invalidation updates  
- Backfill/editing rules for older applications that only have status stamps today  

---

### Workstream C — Waitlist → accepted journey visibility (major / complex)
**Goal:** Make cases like this first-class and demonstrable:

> Interviewed **Oct 19, 2025** → Waitlisted **Oct 30, 2025** → Came off waitlist / accepted **Aug 13, 2026**

**Add**
- Clear **timeline presentation** on application detail (interview → waitlist → acceptance/results)  
- Ability to set/edit the relevant historical dates (not only “timestamp = now”)  
- Recognition of **Accepted after waitlist** as a distinct pathway:
  - Detail labeling (e.g. “Accepted after waitlist”)  
  - School-level metric/chart segment for students who were waitlisted and later accepted  

**Why this is large / complex**
- Outcome is no longer only a single status label; it becomes a **multi-event history**  
- Must preserve waitlist date when status later becomes Accepted  
- Must avoid double-counting confusion in charts (final outcome vs journey path)  
- Requires product rules for edge cases (waitlisted then not accepted; accepted with no waitlist; missing dates; status changed years later)

---

## 5. How the final product will feel

### For day-to-day data entry
1. Create an application as you do today (schools, academics, status).  
2. Optionally enter **applicant last name + first name**.  
3. Optionally enter **interview date** and **results date**.  
4. When outcomes change over time, update status **and** the timeline dates so the record matches reality.

### For finding someone later
1. Go to Applications.  
2. Search by **last name**.  
3. Open the correct student/school entry and update Accepted / Waitlisted / dates without guessing which anonymous row is theirs.

### For school insight
On each school’s statistics section, beyond existing GPA/PCE/GRE/outcome charts, you will also see:
- **When interviews happened** (date range / distribution)  
- **When results came out** (date range / distribution)  
- **How many accepted students came through the waitlist** (journey visibility)

### For the waitlist story
A student is no longer “just Accepted.”  
When data is complete, the record can show the full path:

**Interview → Waitlist → Later acceptance**

That path becomes visible on the record and rollable into school-level reporting.

---

## 6. Scope boundaries (what this package is / is not)

### In scope
- Last name + first name (admin operational use)  
- Last-name search  
- Interview date + results date  
- Interview/results charts on school stats  
- Waitlist-then-accepted journey labeling + reporting support  
- Forms, list, detail, validation, database migration, stats/cache updates  

### Explicitly out of scope (unless added later)
- Full CRM (email/phone/address/DOB)  
- Showing names inside school charts or predictor scoring  
- Automated email/calendar integrations  
- Importing dates from CASPA/external systems  
- Multi-interview series per school beyond a primary interview/results timeline (can be a future phase)

---

## 7. Delivery complexity (why this is a substantial phase)

This is not a single-screen change. It is a **platform-level data model evolution**:

| Area | Impact |
|------|--------|
| Database | New applicant identity fields; new application date fields; indexes for name search; migration of existing rows |
| Application workflows | Create, multi-school create, edit, detail, list filters |
| Search | New last-name query path and UX |
| Statistics engine | New date binning, new charts, journey segmentation, cache versioning |
| Product rules | Anonymous analytics vs identifiable admin records |
| Historical data | Support incomplete older records while enabling rich new entries |
| QA | Status transitions, date editing, chart correctness, privacy checks |

Recommended framing for timeline/effort: **a dedicated multi-part feature phase**, with staged delivery if needed:

1. **Phase 1:** Names + last-name search (unblocks editing pain immediately)  
2. **Phase 2:** Interview/results dates + charts  
3. **Phase 3:** Waitlist-journey polish (detail timeline + “accepted after waitlist” analytics)

---

## 8. Success criteria

The enhancement is successful when you can:

1. Enter an interviewed applicant with **last name, first name**  
2. Months later, **find them by last name** and update status  
3. Record **interview date** and **results date**  
4. See school charts for **interview timing** and **results timing**  
5. Document and demonstrate a student who was **waitlisted and later accepted**, with dates that match the real sequence (not just a final Accepted label)  
6. Keep **names out of statistics charts** while still using them for admin lookup  

---

## 9. Client decisions (confirmed)

**Results date definition:** Option A — Results date is a **separate field** (“date the school communicated the outcome of this interview cycle”), in addition to waitlisted/accepted timeline stamps.

**Naming display:** **Last, First** in admin lists (searchability).

**Step 1 status:** Implemented (names + last-name search). Track manual QA in `docs/test-records-step1.md`.

**Step 2 status:** Implemented (interview/results dates + editable waitlisted/accepted). Track manual QA in `docs/test-records-step2.md`.

**Step 3 status:** Implemented (waitlist → acceptance journey labeling + school conversion/avg-days metrics + interview/results month charts). Track manual QA in `docs/test-records-step3.md`.

**Step 4 status:** In progress (full QA). Master checklist + automated gate results in `docs/test-records-step4.md`. Automated: typecheck + 53 unit tests pass; eslint has pre-existing `set-state-in-effect` failures unrelated to this package. Manual E2E Pass? columns still to be filled in-app.

---

## 10. Closing

This package turns PAMO from a primarily **anonymous outcomes analytics tool** into a system that still protects analytics anonymity **while giving you the operational memory you need** to manage real interview cycles over time—including the hard case of students who sit on a waitlist and are accepted much later.

It is a **high-impact, multi-system enhancement** and should be scoped and scheduled accordingly.

---

*End of proposal*
