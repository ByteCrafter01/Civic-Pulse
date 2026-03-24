# CivicPulse v2 — API Reference

Base URL: `http://localhost:5000/api`

All responses follow the format:
```json
{
  "success": true|false,
  "data": { ... },
  "message": "..."
}
```

---

## Authentication

### POST `/auth/register`
Register a new user account.

| Field    | Type   | Required | Notes                          |
|----------|--------|----------|--------------------------------|
| name     | string | Yes      | Full name                      |
| email    | string | Yes      | Must be unique                 |
| password | string | Yes      | Minimum 8 characters           |
| phone    | string | No       | Contact number                 |
| role     | string | No       | Default: `CITIZEN`             |

**Rate Limit:** 10 requests / 15 minutes

### POST `/auth/login`
Authenticate and receive JWT tokens.

| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | Yes      |
| password | string | Yes      |

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": { "id", "name", "email", "role" }
  }
}
```

### POST `/auth/refresh`
Refresh an expired access token.

| Field        | Type   | Required |
|--------------|--------|----------|
| refreshToken | string | Yes      |

### GET `/auth/me`
Get current authenticated user profile.

**Auth:** Bearer token required

---

## Complaints

### POST `/complaints`
Submit a new complaint.

**Auth:** Bearer token required
**Content-Type:** `multipart/form-data` (supports image upload)

| Field       | Type   | Required | Notes                          |
|-------------|--------|----------|--------------------------------|
| title       | string | Yes      | Complaint title                |
| description | string | Yes      | Detailed description           |
| categoryId  | string | Yes      | UUID of complaint category     |
| latitude    | float  | Yes      | GPS latitude                   |
| longitude   | float  | Yes      | GPS longitude                  |
| image       | file   | No       | Max 5MB, images only           |

**AI Processing:** On creation, the complaint is automatically scored by the AI service (Groq or FastAPI fallback) for priority, sentiment, urgency keywords, and department routing.

### GET `/complaints`
List complaints with pagination and filters.

**Auth:** Bearer token required

| Query Param  | Type   | Default | Notes                          |
|--------------|--------|---------|--------------------------------|
| page         | int    | 1       | Page number                    |
| limit        | int    | 20      | Results per page               |
| status       | string | —       | Filter by status               |
| priority     | string | —       | Filter by priority level       |
| department   | string | —       | Filter by department ID        |
| search       | string | —       | Full-text search               |

### GET `/complaints/:id`
Get a single complaint with all details.

**Auth:** Bearer token required

### PATCH `/complaints/:id/status`
Update complaint status.

**Auth:** Bearer token required

| Field  | Type   | Required | Notes                                      |
|--------|--------|----------|--------------------------------------------|
| status | string | Yes      | Target status (see status state machine)   |
| note   | string | No       | Transition note (stored in ComplaintLog)    |

### PATCH `/complaints/:id/assign`
Assign an officer to a complaint.

**Auth:** ADMIN only

| Field     | Type   | Required |
|-----------|--------|----------|
| officerId | string | Yes      |

### PATCH `/complaints/:id/merge`
Merge a duplicate complaint into another.

**Auth:** ADMIN only

| Field    | Type   | Required |
|----------|--------|----------|
| targetId | string | Yes      |

---

## Dashboard

All dashboard endpoints require Bearer token authentication. Results are automatically filtered by user role.

### GET `/dashboard/stats`
Role-specific aggregate statistics.

- **CITIZEN:** Own complaint counts by status
- **OFFICER:** Assigned complaint counts, resolution rate
- **ADMIN:** System-wide statistics

### GET `/dashboard/by-department`
Complaint distribution across departments.

### GET `/dashboard/by-category`
Complaint distribution across categories.

### GET `/dashboard/trends`
Weekly complaint volume trend data.

### GET `/dashboard/heatmap`
Geographic complaint density data (latitude, longitude, intensity).

### GET `/dashboard/sla`
SLA compliance statistics — breach rate, average resolution time, department-wise SLA performance.

### GET `/dashboard/sentiment-trends`
Sentiment analysis trends over time — positive/negative/neutral distribution.

### GET `/dashboard/area-sentiment`
Sentiment scores aggregated by geographic area.

### GET `/dashboard/insights`
AI-generated operational insights — volume trends, department hotspots, critical issue alerts, sentiment patterns.

---

## Admin

### Departments

| Method | Path                       | Auth  | Purpose              |
|--------|----------------------------|-------|----------------------|
| GET    | `/admin/departments`       | Any   | List all departments |
| POST   | `/admin/departments`       | ADMIN | Create department    |
| PATCH  | `/admin/departments/:id`   | ADMIN | Update department    |
| DELETE | `/admin/departments/:id`   | ADMIN | Delete department    |

**Create/Update Fields:**

| Field       | Type   | Required | Notes          |
|-------------|--------|----------|----------------|
| name        | string | Yes      | Must be unique |
| description | string | No       |                |

### Categories

| Method | Path                      | Auth  | Purpose             |
|--------|---------------------------|-------|---------------------|
| GET    | `/admin/categories`       | Any   | List all categories |
| POST   | `/admin/categories`       | ADMIN | Create category     |
| PATCH  | `/admin/categories/:id`   | ADMIN | Update category     |
| DELETE | `/admin/categories/:id`   | ADMIN | Delete category     |

**Create/Update Fields:**

| Field        | Type   | Required | Notes                          |
|--------------|--------|----------|--------------------------------|
| name         | string | Yes      | Must be unique                 |
| departmentId | string | Yes      | Parent department UUID         |
| weight       | float  | No       | AI scoring weight (default 1.0)|
| slaConfigId  | string | No       | Linked SLA configuration       |
| description  | string | No       |                                |

### SLA Configurations

| Method | Path                       | Auth  | Purpose           |
|--------|----------------------------|-------|-------------------|
| GET    | `/admin/sla-configs`       | ADMIN | List SLA configs  |
| POST   | `/admin/sla-configs`       | ADMIN | Create SLA config |
| PATCH  | `/admin/sla-configs/:id`   | ADMIN | Update SLA config |

**Fields:**

| Field           | Type   | Required | Notes                     |
|-----------------|--------|----------|---------------------------|
| name            | string | Yes      | e.g., "Critical SLA"     |
| resolutionHours | int    | Yes      | Target resolution time    |
| warningHours    | int    | Yes      | Warning threshold         |
| escalationHours | int    | Yes      | Auto-escalation threshold |

### Officers

| Method | Path                      | Auth  | Purpose                         |
|--------|---------------------------|-------|---------------------------------|
| GET    | `/admin/officers`         | ADMIN | List officers with load counts  |
| PATCH  | `/admin/officers/:id`     | ADMIN | Update officer dept/active      |

---

## AI

### POST `/ai/chat`
AI chatbot powered by Groq (Llama 3.3 70B).

**Auth:** Bearer token required

| Field    | Type   | Required | Notes                          |
|----------|--------|----------|--------------------------------|
| messages | array  | Yes      | Chat messages array            |
| context  | object | No       | Additional context for AI      |

### POST `/ai/suggest-category`
AI-powered category suggestion for a complaint.

**Auth:** Bearer token required

| Field       | Type   | Required |
|-------------|--------|----------|
| title       | string | Yes      |
| description | string | Yes      |

### GET `/ai/status`
Check AI service availability and configuration.

**Auth:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "groqEnabled": true,
    "model": "llama-3.3-70b-versatile",
    "status": "active"
  }
}
```

---

## AI Evaluation (Admin Only)

All endpoints require ADMIN authentication.

### GET `/ai-evaluation/metrics`
Complete AI performance metrics — priority scoring accuracy, sentiment analysis accuracy, routing precision.

### GET `/ai-evaluation/accuracy`
Detailed accuracy breakdown — MAE (Mean Absolute Error), confusion matrix, officer override rate.

### GET `/ai-evaluation/routing`
Department routing accuracy — correct routing percentage per department.

### GET `/ai-evaluation/export`
Export all evaluation metrics as CSV (for paper appendix / academic analysis).

---

## Feedback

### POST `/feedback/:complaintId`
Submit officer feedback on AI scoring (used for model improvement).

**Auth:** OFFICER or ADMIN

| Field             | Type   | Required | Notes                          |
|-------------------|--------|----------|--------------------------------|
| correctedScore    | float  | Yes      | Officer's corrected score 0-100|
| correctedPriority | string | No       | CRITICAL, HIGH, MEDIUM, LOW    |
| reason            | string | No       | Explanation for correction     |

### GET `/feedback/:complaintId`
Get all feedback entries for a complaint.

**Auth:** OFFICER or ADMIN

### GET `/feedback`
Get all feedback system-wide (analytics).

**Auth:** ADMIN only

---

## Reports

### GET `/reports/monthly`
Download auto-generated monthly PDF report with statistics, charts, and insights.

**Auth:** ADMIN only
**Response:** `application/pdf`

### GET `/reports/complaint/:id/receipt`
Download PDF receipt for a specific complaint (includes QR code for tracking).

**Auth:** Bearer token required (citizens see own complaints only)
**Response:** `application/pdf`

### GET `/reports/ai-evaluation`
Download AI evaluation PDF report with accuracy metrics and charts.

**Auth:** ADMIN only
**Response:** `application/pdf`

---

## Surveys

### POST `/surveys/:complaintId`
Submit a satisfaction survey after complaint resolution.

**Auth:** CITIZEN only

| Field         | Type   | Required | Notes                    |
|---------------|--------|----------|--------------------------|
| rating        | int    | Yes      | 1–5 overall satisfaction |
| responseTime  | int    | No       | 1–5 response speed       |
| communication | int    | No       | 1–5 communication quality|
| resolution    | int    | No       | 1–5 resolution quality   |
| comment       | string | No       | Free-text feedback       |

### GET `/surveys/check/:complaintId`
Check if a survey has been submitted for a complaint.

**Auth:** Bearer token required

### GET `/surveys/analytics`
Aggregate survey analytics — average ratings by department, satisfaction correlation with AI scores, response rates.

**Auth:** ADMIN only

---

## Public (No Authentication)

### GET `/public/stats`
Aggregate public statistics — total complaints, resolution rates, average resolution time. No PII exposed.

### GET `/public/heatmap`
Geographic complaint density data for public heatmap visualization.

### GET `/public/track/:id`
Track a complaint by ID (full or partial match). Returns sanitized status information without sensitive data.

### GET `/public/by-department`
Public department-level summary — complaint counts and resolution rates per department.

---

## Health Check

### GET `/health`
Server health check endpoint.

**Auth:** None

```json
{
  "status": "ok",
  "timestamp": "2026-03-24T10:00:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{ "success": false, "message": "Validation error description" }
```

### 401 Unauthorized
```json
{ "success": false, "message": "Access token required" }
```

### 403 Forbidden
```json
{ "success": false, "message": "Insufficient permissions" }
```

### 404 Not Found
```json
{ "success": false, "message": "Route /path not found" }
```

### 422 Unprocessable Entity (Validation)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 429 Too Many Requests
```json
{ "success": false, "message": "Too many requests, please try again later" }
```

---

## Rate Limits

| Scope    | Limit           | Applied To                    |
|----------|-----------------|-------------------------------|
| Auth     | 10 / 15 min     | `/auth/register`, `/auth/login` |
| Citizen  | 100 / 15 min    | Complaint creation            |
| Officer  | 500 / 15 min    | Officer/Admin operations      |
| General  | 200 / 15 min    | All other endpoints           |
