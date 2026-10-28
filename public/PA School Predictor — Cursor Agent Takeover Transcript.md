# PA SCHOOL PREDICTOR — CURSOR AGENT TAKEOVER

You are taking over development of an existing private application called **PA School Predictor**.

Your responsibility is to inspect the existing repository, understand what has already been implemented, compare it against the requirements below, determine the next incomplete development phase, implement it completely, test it, and then stop.

Do NOT blindly start from Step 1.

---

# 1. FIRST: INSPECT THE EXISTING PROJECT

Before modifying anything, inspect the repository.

Review at minimum:

- `package.json`
- `src/`
- `app/`
- `components/`
- database/schema files
- migrations
- Supabase configuration
- authentication implementation
- middleware
- server actions
- API routes
- environment variable configuration
- existing tests
- README/documentation
- current Git status
- existing routes/pages
- existing UI components

Determine:

```text
Last fully completed step:
Current partially completed step:
Next required step:
Existing functionality that must be preserved:
Missing functionality:
Potential architectural conflicts:
```

Do not recreate functionality that already exists.

Do not replace working architecture without a clear reason.

---

# 2. PRODUCT PURPOSE

PA School Predictor is a private analytics and prediction application for PA (Physician Assistant) school applications.

It stores anonymous historical applicant/application information and uses historical data to identify schools that are a "best fit" for a new applicant.

"Best fit" means:

> Based on similar historical data.

The predictor must therefore be based on historical similarity and outcomes.

Do NOT invent subjective school rankings.

Do NOT create an arbitrary "school quality score."

---

# 3. PRIVACY REQUIREMENT

This is a private application.

The student/application data is intentionally anonymous.

Do NOT introduce:

- Student name
- Email
- Phone
- Date of birth
- Ethnicity
- Address
- Student ID
- Other unnecessary personally identifiable information

The only applicant-level demographic/location information currently required is:

```text
home_state
```

This is needed to determine in-state/out-of-state status.

---

# 4. CORE DATA MODEL

The conceptual model is:

```text
USER
  |
  +---- authorization

SCHOOL
  |
  +---- APPLICATION
             |
             +---- APPLICANT
```

More precisely:

```text
Applicant
   |
   +---- Application → School
   |
   +---- Application → School
   |
   +---- Application → School
   |
   +---- ...
```

One applicant can apply to multiple schools.

Do NOT combine applicant and application into one record.

---

# 5. USERS

Application roles:

```text
ADMIN
VIEWER
```

## ADMIN

Can:

- View data
- Add data
- Edit data
- Manage schools
- Manage application records
- Access all application functionality

## VIEWER

Can:

- View data
- Search schools
- View statistics
- Use read-only functionality

Viewer cannot perform write operations.

Authorization must be enforced:

1. In the server/application layer.
2. At the database/RLS layer where appropriate.

Do not rely only on hiding UI buttons.

---

# 6. AUTHENTICATION

Use Supabase Auth according to the existing project architecture.

There is:

**NO PUBLIC REGISTRATION.**

Expected login route:

```text
/login
```

Protected routes include at least:

```text
/dashboard
/schools
/schools/new
/schools/[id]
/applicants/new
/applications
/predictor
```

Unauthenticated users should not access protected application functionality.

Use reusable authentication helpers such as:

```text
getCurrentUser()
requireAuth()
requireAdmin()
```

Use the existing project's implementation if these already exist.

Never trust a role supplied by the browser.

Never expose Supabase service-role credentials to client-side code.

---

# 7. DATABASE

Use:

- PostgreSQL
- Supabase
- Drizzle ORM

unless the existing repository has a valid implementation that differs and is already functioning.

Core tables:

```text
users
schools
applicants
applications
audit_logs
```

---

# 8. USERS TABLE

Conceptual fields:

```text
id
email
name
role
is_active
created_at
updated_at
```

Role:

```text
ADMIN
VIEWER
```

Passwords belong to Supabase Auth, not this table.

---

# 9. SCHOOLS TABLE

Conceptual fields:

```text
id
name
state
requires_gre
is_active
created_at
updated_at
```

GRE means:

> Whether the PA program requires the GRE.

It does NOT mean whether an applicant took the GRE.

Do not add unrelated program information such as:

- deadlines
- prerequisites
- email
- website

unless specifically required later.

There is a separate Program Database containing such information.

---

# 10. APPLICANTS TABLE

Conceptual fields:

```text
id
home_state
created_at
updated_at
```

Do not add PII.

---

# 11. APPLICATIONS TABLE

Conceptual fields:

```text
id
applicant_id
school_id

bcp_gpa
overall_gpa
science_gpa

pce_hours

application_attempt

status

waitlisted_at
accepted_at

created_at
updated_at
```

---

# 12. APPLICATION STATUS

Allowed statuses:

```text
ACCEPTED
NOT_ACCEPTED
WAITLISTED
NULL
```

NULL means:

```text
Unknown
```

CRITICAL:

```text
NULL != NOT_ACCEPTED
```

Never count unknown records as rejected.

Waitlisted is a genuine outcome.

A waitlisted application can later become accepted.

Example:

```text
WAITLISTED
      ↓
ACCEPTED
```

This must update the same application record.

Do not create a second application.

---

# 13. APPLICATION ATTEMPTS

Store:

```text
application_attempt
```

as an integer.

The UI/statistics should support:

```text
1st
2nd
3rd
4th
5th
```

But do NOT enforce a maximum of five.

Applicants may eventually have:

```text
6+
```

---

# 14. RESIDENCY

Do not permanently store:

```text
IN_STATE
OUT_OF_STATE
```

as the authoritative value.

Determine it dynamically:

```text
applicant.home_state == school.state
```

Therefore:

```text
true → IN_STATE
false → OUT_OF_STATE
```

This must be consistent throughout:

- statistics
- predictor
- reporting
- filtering

---

# 15. HISTORICAL DATA

The application will initially contain a few thousand historical records.

These records will be entered manually.

New records will also normally be entered:

```text
one record at a time
```

Therefore optimize data entry for:

- speed
- keyboard navigation
- clear validation
- minimal clicks
- fast repeated entry
- sensible defaults
- focus management

Do not implement CSV import unless specifically requested.

---

# 16. STATISTICS

Statistics use:

> ALL historical data.

Do not add year filters unless explicitly requested later.

---

# 17. GPA STATISTICS

GPA range:

```text
2.70 → 4.00
```

Required distributions:

```text
BCP GPA
Overall GPA
Science GPA
```

Graph semantics:

```text
X-axis = GPA
Y-axis = Number of Students
```

These are frequency/distribution charts.

Do not imply causal relationships.

---

# 18. PCE STATISTICS

PCE = Patient Care Experience hours.

Required ranges:

```text
0–500
500–1000
1000–2000
2000–3000
3000–4000
4000–5000
5000–6000
6000–7000
7000–8000
8000–9000
9000–10000
10000+
```

Use these consistently.

---

# 19. RESIDENCY STATISTICS

School statistics should eventually include:

```text
In State
Out of State
```

as a pie chart.

Residency must be calculated using applicant home state versus school state.

---

# 20. OUTCOME STATISTICS

The original requirement requested:

```text
Accepted
Not Accepted
```

However:

```text
WAITLISTED
UNKNOWN
```

also exist.

Never silently classify:

```text
WAITLISTED → NOT_ACCEPTED
UNKNOWN → NOT_ACCEPTED
```

The UI should represent these states honestly.

---

# 21. APPLICATION ATTEMPT STATISTICS

Required chart:

```text
1st time
2nd time
3rd time
4th time
5th time
```

If records above five exist, preserve them.

Do not discard them.

A future implementation can use:

```text
6+
```

if appropriate.

---

# 22. SCHOOL MANAGEMENT

Expected routes:

```text
/schools
/schools/new
/schools/[id]
```

School list must support:

- Search
- State filter
- GRE filter
- Active/inactive filter
- Pagination

Admin can:

- Add
- Edit
- Deactivate

Viewer can:

- View
- Search
- Filter

Viewer cannot mutate.

---

# 23. SCHOOL DELETION

Do NOT hard-delete historical schools.

Use:

```text
is_active = false
```

Historical applications must continue referencing the school.

Inactive schools should remain visible when examining historical records.

---

# 24. SCHOOL SEARCH

Search should support:

```text
School name
State
GRE requirement
Active/inactive
```

Filters should be combinable.

Example:

```text
Search: University
State: Texas
GRE: Not Required
Status: Active
```

Search should be case-insensitive.

Do not load all schools into the browser simply to perform search.

Use PostgreSQL/database querying.

---

# 25. REUSABLE SCHOOL SELECTOR

Create a reusable searchable school selector/autocomplete.

It should:

- Search by school name.
- Display school name + state.
- Prefer active schools.
- Return school ID.
- Support keyboard interaction.
- Show loading state.
- Show no-results state.
- Avoid loading every school into the browser.

This will later be reused by:

```text
Application entry
Predictor
Other school-selection workflows
```

---

# 26. SCHOOL DETAIL

The school detail page should eventually contain:

```text
School information
↓
Residency chart
↓
Outcome chart
↓
Application attempt chart
↓
BCP GPA distribution
↓
Overall GPA distribution
↓
Science GPA distribution
↓
PCE distribution
```

Do not implement all analytics prematurely.

Build them according to the development phases.

---

# 27. PREDICTOR

The predictor is the central feature.

It should take a new applicant's characteristics and compare them against historical applications.

Candidate variables include:

```text
BCP GPA
Overall GPA
Science GPA
PCE hours
Residency
```

School selection can be:

```text
1–30 schools
```

GRE should primarily function as a school requirement/search criterion.

Do not automatically treat GRE as an applicant variable.

---

# 28. PREDICTOR METHODOLOGY

Use a transparent similarity-based approach.

Conceptually:

```text
New Applicant
      ↓
Select Candidate Schools
      ↓
Retrieve Historical Applications
      ↓
Normalize Relevant Variables
      ↓
Calculate Similarity
      ↓
Identify Similar Historical Applicants
      ↓
Analyze Their Outcomes
      ↓
Rank Schools
      ↓
Explain Evidence
```

Variables need normalization because:

```text
GPA ≈ 2.7–4.0
PCE = hundreds/thousands of hours
```

PCE must not dominate merely because its raw numerical scale is larger.

Do not use arbitrary weights without documenting them.

Design the predictor engine so weights/thresholds can be adjusted later.

---

# 29. PREDICTOR SAMPLE SIZE

Sample size matters.

Do not treat:

```text
2 similar applicants
2 accepted
```

as equivalent evidence to:

```text
85 similar applicants
65 accepted
```

The predictor should show:

- number of similar historical applicants
- outcome counts
- evidence strength/sample size

If there is insufficient comparable historical data, say so.

Do not manufacture certainty.

---

# 30. PREDICTOR OUTPUT

A result should explain itself.

Example conceptual output:

```text
School: Example PA Program

Historical similar applicants: 42

Accepted: 27
Not Accepted: 9
Waitlisted: 4
Unknown: 2

Evidence: Strong
```

Do not simply show:

```text
Score: 87%
```

without supporting evidence.

---

# 31. DATA LEAKAGE

When predicting an application outcome, do not use outcome information as an input.

For example:

```text
accepted_at
waitlisted_at
final status
```

are outcome information.

They are not applicant features.

---

# 32. IMPORTANT STATISTICAL RULE

This application is a decision-support system.

Do not make claims such as:

> "A 3.8 GPA guarantees admission."

Instead say:

> "Historical applications with similar characteristics had these outcomes."

Do not imply causation from historical correlations.

---

# 33. AUDIT LOGGING

Important administrative changes should be auditable.

Track:

```text
user
action
entity type
entity ID
old values
new values
timestamp
```

Do not put unnecessary PII into audit logs.

---

# 34. TECH STACK

Preferred:

```text
Next.js
TypeScript
App Router
Tailwind
shadcn/ui
Supabase
PostgreSQL
Drizzle ORM
Zod
React Hook Form
Recharts
TanStack Table
Vercel
```

Use Next.js Server Actions/Route Handlers rather than creating a separate Express backend.

Do not introduce unnecessary infrastructure.

---

# 35. DO NOT OVERENGINEER

Do NOT introduce unless explicitly required:

- Microservices
- Kubernetes
- Redis
- Kafka
- Elasticsearch
- Separate Express backend
- ML infrastructure
- AI chatbot
- Complex event-driven architecture

The initial application is small/private and PostgreSQL + Next.js + Supabase is sufficient.

---

# 36. DEVELOPMENT PHASES

The intended phases are:

```text
STEP 1
Project foundation + development environment

STEP 2
PostgreSQL database schema + security foundation

STEP 3
Authentication + Admin/Viewer authorization

STEP 4
School management + searchable school interface

STEP 5
Anonymous applicant/application data-entry workflow

STEP 6
School statistics + charts

STEP 7
School search and filtering

STEP 8
Predictor engine based on similar historical data

STEP 9
Dashboard + audit/history + UX/performance polish

STEP 10
Testing + security review + deployment + production hardening
```

These are logical phases.

Inspect the actual repository before deciding which one is next.

---

# 37. HOW TO DETERMINE THE NEXT STEP

Do NOT simply assume:

```text
Next = Step N+1
```

Instead:

### 1. Inspect implementation

Determine what actually exists.

### 2. Map implementation to requirements.

### 3. Identify incomplete requirements.

### 4. Identify the highest completed phase.

### 5. Select the next logical incomplete phase.

### 6. Implement it.

### 7. Test it.

### 8. Stop.

---

# 38. DEVELOPMENT RULE

For every phase:

```text
INSPECT
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
VERIFY
↓
STOP
```

Do not implement multiple future phases in one autonomous run.

---

# 39. ACCEPTANCE CRITERIA

A phase is complete only when:

- Required functionality works.
- Existing functionality still works.
- Authentication is secure.
- Authorization is enforced.
- Database integrity is preserved.
- Input validation exists.
- Errors are handled.
- Relevant tests/checks pass.
- Production build passes where applicable.
- No secrets are exposed.
- No unrelated features were introduced.

---

# 40. SECURITY CHECKLIST

Before production:

- [ ] No public registration.
- [ ] Authentication required.
- [ ] Admin/Viewer authorization.
- [ ] Server-side authorization.
- [ ] RLS enabled.
- [ ] Service-role credentials protected.
- [ ] No unnecessary PII.
- [ ] Input validation.
- [ ] Secure session handling.
- [ ] No raw database errors exposed.
- [ ] Audit logging.
- [ ] No backdoors.
- [ ] Historical data preserved.
- [ ] Inactive schools are not destroyed.

---

# 41. TESTING

Eventually test:

### Authentication
- Login
- Invalid login
- Logout
- Expired session
- Protected routes

### Authorization
- Admin
- Viewer
- Viewer mutation rejection
- Direct request rejection

### Schools
- Create
- Edit
- Deactivate
- Duplicate handling
- Search
- State filter
- GRE filter
- Active/inactive filter
- Pagination

### Applicant
- Create anonymous applicant
- Home state

### Applications
- Create
- Edit
- Multiple applications per applicant
- GPA
- PCE
- Attempt number
- Status
- Waitlisted → Accepted

### Statistics
- Residency
- Outcome
- GPA
- PCE
- Attempts

### Predictor
- Similarity
- Normalization
- Sample size
- Residency
- Outcome handling
- Ranking
- Explanation

---

# 42. IMPORTANT DATA RULES

Never:

```text
NULL status → NOT_ACCEPTED
WAITLISTED → NOT_ACCEPTED
missing value → invented value
missing date → invented date
```

Never fabricate historical records.

Never fabricate statistics.

Never fabricate predictor evidence.

---

# 43. MIGRATIONS

Database changes must use migrations.

Do not manually change schema without a reproducible migration.

Do not destructively modify applied migrations unless the project's development workflow explicitly permits it.

---

# 44. ENVIRONMENT VARIABLES

Secrets must never be committed.

Use:

```text
.env.local
```

and maintain:

```text
.env.example
```

with variable names only.

Never expose server secrets through client-side environment variables.

---

# 45. UX PRIORITIES

Priority order:

```text
1. Data accuracy
2. Data integrity
3. Security
4. Speed of data entry
5. Clarity
6. Maintainability
7. Visual polish
```

This is an internal analytics/data-entry application.

Do not prioritize flashy UI over reliable data.

---

# 46. CURSOR RESPONSE FORMAT

Before implementation, tell me:

```text
PROJECT STATUS

Last fully completed step:
Current partially completed step:
Next step:
Why this is the correct next step:
Existing functionality I will preserve:
Potential issues/conflicts:
```

Then implement.

After implementation, report:

```text
IMPLEMENTATION COMPLETE

Step:
What was implemented:
Files changed:
Database changes:
Routes added/changed:
Security changes:
Tests/checks run:
Results:
Acceptance criteria:
Remaining issues:
```

Then:

**STOP.**

Do not continue automatically into the next step.

---

# 47. FINAL RULE

The fundamental product principle is:

> Build a reliable historical-data system first, then build transparent prediction on top of it.

The predictor is only as reliable as:

- historical data quality
- applicant/application relationships
- school data
- residency calculation
- status handling
- statistical calculations
- similarity methodology

Do not optimize for impressive-looking prediction results at the expense of correctness.

---

# START NOW

Inspect the current repository.

Do not ask me to manually explain what has already been built unless the repository genuinely cannot determine it.

Determine the current state.

Then identify the next incomplete development phase and implement **only that phase**.

Run the appropriate checks.

Report the result using the required format.

Then STOP.