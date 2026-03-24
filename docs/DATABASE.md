# CivicPulse v2 — Database Schema

ORM: **Prisma** | Engine: **PostgreSQL 16**

---

## Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Department  │───1:N─│   Category   │───N:1─│  SLAConfig   │
│              │       │              │       │              │
│ id           │       │ id           │       │ id           │
│ name         │       │ name         │       │ name         │
│ description  │       │ weight       │       │ resolutionH  │
│              │       │ departmentId │       │ warningH     │
│              │       │ slaConfigId  │       │ escalationH  │
└──────┬───────┘       └──────┬───────┘       └──────────────┘
       │                      │
       │ 1:N                  │ 1:N
       │                      │
┌──────▼───────┐       ┌──────▼───────────────────────────────┐
│     User     │       │            Complaint                 │
│              │       │                                      │
│ id           │──1:N─▶│ id             │ citizenId           │
│ name         │       │ title          │ officerId           │
│ email        │       │ description    │ categoryId          │
│ password     │       │ imageUrl       │ duplicateOfId       │
│ phone        │       │ latitude       │                     │
│ role (enum)  │       │ longitude      │ priorityScore       │
│ departmentId │       │ status (enum)  │ priorityLevel       │
│ isActive     │       │ priority (enum)│ sentimentLabel      │
│ emailNotif.  │       │                │ sentimentScore      │
└──────┬───────┘       │ slaDeadline    │ urgencyKeywords     │
       │               │ slaBreached    │ aiExplanation       │
       │               │ isDuplicate    │ routingConfidence   │
       │               └───┬──────┬────┬──────────────────────┘
       │                   │      │    │
       │ 1:N               │      │    │ 1:N
       │                   │      │    │
┌──────▼───────┐    ┌──────▼──┐  │  ┌─▼──────────────┐
│ ComplaintLog │    │AIFeedback│  │  │Satisfaction    │
│              │    │          │  │  │Survey          │
│ id           │    │ id       │  │  │                │
│ complaintId  │    │complaintId│ │  │ id             │
│ actorId      │    │ officerId│  │  │ complaintId    │
│ fromStatus   │    │origScore │  │  │ citizenId      │
│ toStatus     │    │corrScore │  │  │ rating (1-5)   │
│ note         │    │corrPriority│ │ │ responseTime   │
│ metadata     │    │ reason   │  │  │ communication  │
└──────────────┘    └──────────┘  │  │ resolution     │
                                  │  │ comment        │
                                  │  └────────────────┘
                                  │
                            Self-relation
                           (Duplicates)
```

---

## Models

### User

Represents all system actors — citizens, officers, and administrators.

| Column             | Type     | Constraints              | Description                    |
|--------------------|----------|--------------------------|--------------------------------|
| id                 | UUID     | PK, auto-generated       | Unique identifier              |
| name               | String   | Required                 | Full name                      |
| email              | String   | Required, unique         | Login email                    |
| password           | String   | Required                 | bcrypt hashed                  |
| phone              | String   | Optional                 | Contact number                 |
| role               | Role     | Default: CITIZEN         | CITIZEN, OFFICER, ADMIN        |
| departmentId       | UUID     | FK → Department, optional| Officer's assigned department   |
| isActive           | Boolean  | Default: true            | Account active status          |
| emailNotifications | Boolean  | Default: true            | Email preference               |
| createdAt          | DateTime | Auto                     | Registration timestamp         |
| updatedAt          | DateTime | Auto                     | Last update timestamp          |

**Indexes:** `role`, `departmentId`

### Department

Municipal departments that handle specific complaint categories.

| Column      | Type     | Constraints        | Description              |
|-------------|----------|--------------------|--------------------------|
| id          | UUID     | PK, auto-generated | Unique identifier        |
| name        | String   | Required, unique   | Department name          |
| description | String   | Optional           | Department description   |
| createdAt   | DateTime | Auto               | Creation timestamp       |

**Seeded Departments:** Public Works, Water & Sanitation, Electricity, Health & Environment, Parks & Recreation

### Category

Complaint categories linked to departments, with configurable AI scoring weights.

| Column       | Type     | Constraints           | Description                |
|--------------|----------|-----------------------|----------------------------|
| id           | UUID     | PK, auto-generated    | Unique identifier          |
| name         | String   | Required, unique      | Category name              |
| description  | String   | Optional              | Category description       |
| weight       | Float    | Default: 1.0         | AI priority scoring weight |
| departmentId | UUID     | FK → Department       | Parent department          |
| slaConfigId  | UUID     | FK → SLAConfig, opt.  | Linked SLA rules           |
| createdAt    | DateTime | Auto                  | Creation timestamp         |

**Index:** `departmentId`

### SLAConfig

Service Level Agreement templates defining resolution timeframes.

| Column          | Type     | Constraints        | Description                     |
|-----------------|----------|--------------------|---------------------------------|
| id              | UUID     | PK, auto-generated | Unique identifier               |
| name            | String   | Required           | Config name (e.g., "Critical")  |
| resolutionHours | Int      | Required           | Target resolution time (hours)  |
| warningHours    | Int      | Required           | Warning alert threshold (hours) |
| escalationHours | Int      | Required           | Auto-escalation threshold       |
| createdAt       | DateTime | Auto               | Creation timestamp              |

**Default Configs:** Critical (24h), High (48h), Normal (120h)

### Complaint

Core entity representing a citizen's grievance report with AI enrichment.

| Column            | Type      | Constraints             | Description                      |
|-------------------|-----------|-------------------------|----------------------------------|
| id                | UUID      | PK, auto-generated      | Unique identifier                |
| title             | String    | Required                | Short complaint title            |
| description       | String    | Required                | Detailed description             |
| imageUrl          | String    | Optional                | Uploaded evidence image path     |
| latitude          | Float     | Required                | GPS latitude                     |
| longitude         | Float     | Required                | GPS longitude                    |
| status            | Status    | Default: SUBMITTED      | Current workflow status          |
| previousStatus    | Status    | Optional                | Status before last transition    |
| priorityScore     | Float     | Optional (AI-set)       | AI-computed priority (0–100)     |
| priorityLevel     | Priority  | Optional (AI-set)       | CRITICAL, HIGH, MEDIUM, LOW     |
| sentimentLabel    | String    | Optional (AI-set)       | positive, negative, neutral      |
| sentimentScore    | Float     | Optional (AI-set)       | Sentiment confidence (0–1)       |
| urgencyKeywords   | String[]  | Optional (AI-set)       | Extracted urgency indicators     |
| aiExplanation     | JSON      | Optional (AI-set)       | SHAP-based score explanation     |
| isDuplicate       | Boolean   | Default: false          | Flagged as duplicate             |
| duplicateOfId     | UUID      | FK → Complaint, opt.    | Original complaint reference     |
| similarityScore   | Float     | Optional                | Semantic similarity (0–1)        |
| suggestedDeptId   | UUID      | Optional (AI-set)       | AI-suggested department          |
| routingConfidence | Float     | Optional (AI-set)       | Routing confidence (0–1)         |
| categoryId        | UUID      | FK → Category           | Complaint category               |
| citizenId         | UUID      | FK → User               | Submitting citizen               |
| officerId         | UUID      | FK → User, optional     | Assigned officer                 |
| slaDeadline       | DateTime  | Optional                | Computed SLA deadline            |
| slaWarningAt      | DateTime  | Optional                | Warning notification time        |
| slaBreached       | Boolean   | Default: false          | SLA breach flag                  |
| slaBreachedAt     | DateTime  | Optional                | Breach occurrence time           |
| resolvedAt        | DateTime  | Optional                | Resolution timestamp             |
| createdAt         | DateTime  | Auto                    | Submission timestamp             |
| updatedAt         | DateTime  | Auto                    | Last update timestamp            |

**Indexes:** `status`, `priorityScore`, `citizenId`, `officerId`, `categoryId`, `[latitude, longitude]` (composite geo), `createdAt`, `slaDeadline`

### ComplaintLog

Immutable audit trail for every complaint status transition.

| Column      | Type     | Constraints              | Description                |
|-------------|----------|--------------------------|----------------------------|
| id          | UUID     | PK, auto-generated       | Unique identifier          |
| complaintId | UUID     | FK → Complaint (cascade) | Parent complaint           |
| actorId     | UUID     | FK → User                | Who made the change        |
| fromStatus  | Status   | Required                 | Previous status            |
| toStatus    | Status   | Required                 | New status                 |
| note        | String   | Optional                 | Transition note/reason     |
| metadata    | JSON     | Optional                 | Additional context data    |
| createdAt   | DateTime | Auto                     | Transition timestamp       |

**Indexes:** `complaintId`, `createdAt`

### AIFeedback

Officer corrections to AI priority scores — used for continuous model improvement.

| Column            | Type     | Constraints        | Description                    |
|-------------------|----------|--------------------|--------------------------------|
| id                | UUID     | PK, auto-generated | Unique identifier              |
| complaintId       | UUID     | FK → Complaint     | Scored complaint               |
| officerId         | UUID     | FK → User          | Correcting officer             |
| originalScore     | Float    | Required           | AI's original score            |
| correctedScore    | Float    | Required           | Officer's corrected score      |
| correctedPriority | Priority | Optional           | Officer's corrected priority   |
| reason            | String   | Optional           | Correction explanation         |
| createdAt         | DateTime | Auto               | Feedback timestamp             |

**Index:** `complaintId`

### SatisfactionSurvey

Post-resolution citizen satisfaction feedback.

| Column        | Type     | Constraints           | Description                 |
|---------------|----------|-----------------------|-----------------------------|
| id            | UUID     | PK, auto-generated    | Unique identifier           |
| complaintId   | UUID     | FK → Complaint, unique| One survey per complaint    |
| citizenId     | UUID     | FK → User             | Survey respondent           |
| rating        | Int      | Required              | 1–5 overall satisfaction    |
| responseTime  | Int      | Optional              | 1–5 perceived speed         |
| communication | Int      | Optional              | 1–5 communication quality   |
| resolution    | Int      | Optional              | 1–5 resolution quality      |
| comment       | String   | Optional              | Free-text feedback          |
| createdAt     | DateTime | Auto                  | Submission timestamp        |

**Index:** `citizenId`

---

## Enums

### Role
```
CITIZEN  — Public users who submit complaints
OFFICER  — Department officers who process complaints
ADMIN    — System administrators with full access
```

### Status
```
SUBMITTED    — Initial state after citizen submission
TRIAGED      — AI-scored and categorized
ASSIGNED     — Officer assigned by admin
IN_PROGRESS  — Officer actively working
VERIFICATION — Resolution being verified
RESOLVED     — Issue resolved, pending citizen confirmation
CLOSED       — Complaint fully closed
REOPENED     — Citizen reopened after resolution
MERGED       — Merged into duplicate complaint
ESCALATED    — Escalated due to SLA breach or severity
```

### Priority
```
CRITICAL — Score 80–100, SLA: 24 hours
HIGH     — Score 60–79,  SLA: 48 hours
MEDIUM   — Score 40–59,  SLA: 120 hours
LOW      — Score 0–39,   SLA: 120 hours
```

---

## Migrations

| Migration                              | Description                              |
|----------------------------------------|------------------------------------------|
| `20260221033030_init`                  | Full schema creation — all 8 models      |
| `20260320114746_add_email_and_survey`  | Added email notification prefs, satisfaction surveys |
