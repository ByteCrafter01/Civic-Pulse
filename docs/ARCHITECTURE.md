# CivicPulse v2 — System Architecture

## Overview

CivicPulse is an intelligent municipal complaint management system built on a microservices architecture. It combines NLP-powered complaint triage, event-driven workflows, real-time SLA tracking, and public transparency analytics to modernize civic grievance redressal.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 18 + Vite)                       │
│          Tailwind CSS · Recharts · Leaflet · Socket.IO Client           │
│                        PWA-enabled (Service Worker)                     │
└──────────────────┬──────────────────────┬───────────────────────────────┘
                   │  REST (HTTP/JSON)    │  WebSocket (Socket.IO)
                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Node.js + Express)                     │
│    JWT Auth · RBAC · Rate Limiting · Helmet · Zod Validation · CORS     │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │   Auth   │ │Complaints│ │ Dashboard│ │  Admin   │ │    Public    │ │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │ │    Routes    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │    AI    │ │ Feedback │ │ Reports  │ │ Surveys  │ │AI Evaluation │ │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │ │    Routes    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
└───────┬──────────────┬──────────────┬──────────────┬────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────────────┐
│ PostgreSQL 16│ │  Redis 7  │ │ Socket.IO │ │   AI Service (FastAPI)    │
│   (Prisma)   │ │ (BullMQ)  │ │  Server   │ │  Groq LLM · ML Models    │
└──────────────┘ └───────────┘ └───────────┘ └───────────────────────────┘
```

---

## Service Breakdown

### 1. Client — React 18 SPA

| Aspect        | Detail                                                    |
|---------------|-----------------------------------------------------------|
| Framework     | React 18 with Vite build tool                             |
| Styling       | Tailwind CSS 3.4                                          |
| Routing       | React Router v6 (role-based protected routes)             |
| State         | React Context API (Auth, Socket, Theme)                   |
| Forms         | React Hook Form + Zod schema validation                   |
| Charts        | Recharts (bar, line, pie, area charts)                    |
| Maps          | Leaflet + React-Leaflet (complaint heatmaps, geo pins)   |
| Real-time     | Socket.IO Client (live notifications, status updates)     |
| i18n          | i18next (English + Hindi localization)                    |
| Animations    | Framer Motion                                             |
| Icons         | Lucide React                                              |
| PWA           | Vite PWA plugin with service worker                       |

**Key Pages:**
- Landing, Login, Register (public)
- Citizen Dashboard (submit complaints, track status, surveys)
- Officer Dashboard (manage assigned complaints, AI feedback)
- Admin Dashboard (departments, SLA, analytics, user management)
- Public Dashboard (transparency stats, heatmap, complaint tracking)

### 2. API Gateway — Node.js + Express

| Aspect        | Detail                                                    |
|---------------|-----------------------------------------------------------|
| Runtime       | Node.js 20 LTS                                            |
| Framework     | Express 4.18                                               |
| ORM           | Prisma Client (PostgreSQL)                                 |
| Auth          | JWT (access + refresh tokens), bcrypt password hashing     |
| Real-time     | Socket.IO (WebSocket with polling fallback)                |
| Job Queue     | BullMQ (Redis-backed async processing)                     |
| File Upload   | Multer (5MB limit, images only)                            |
| PDF Reports   | PDFKit                                                     |
| Email         | Nodemailer (SMTP)                                          |
| QR Codes      | qrcode (complaint tracking receipts)                       |
| Image Proc.   | Sharp (resize, optimize uploads)                           |
| Security      | Helmet, CORS, HPP, rate limiting (tiered by role)          |
| Validation    | Zod schemas on all mutation endpoints                      |
| Logging       | Winston (structured JSON logs)                             |

### 3. Database — PostgreSQL 16

| Aspect        | Detail                                                    |
|---------------|-----------------------------------------------------------|
| Engine        | PostgreSQL 16 (Alpine)                                     |
| ORM           | Prisma with declarative schema + migrations                |
| Models        | 8 tables (User, Department, Category, SLAConfig, Complaint, ComplaintLog, AIFeedback, SatisfactionSurvey) |
| Indexing      | Composite geo index (lat/long), status, priority, timestamps |
| Persistence   | Docker volume (`pgdata`)                                   |

### 4. Cache & Queue — Redis 7

| Aspect        | Detail                                                    |
|---------------|-----------------------------------------------------------|
| Engine        | Redis 7 (Alpine)                                           |
| Job Queues    | 8 BullMQ queues (scoring, duplicate, routing, SLA start, SLA check, notification, workflow, analytics) |
| Graceful      | Optional — system degrades gracefully if Redis unavailable |
| Persistence   | Docker volume (`redisdata`)                                |

### 5. AI Service — FastAPI + Groq

| Aspect        | Detail                                                    |
|---------------|-----------------------------------------------------------|
| Framework     | FastAPI (Python 3.11)                                      |
| Primary AI    | Groq API (Llama 3.3 70B) — inline scoring at complaint creation |
| Fallback AI   | Local ML pipeline (DistilBERT + XGBoost + Sentence Transformers) |
| Endpoints     | `/score`, `/check-duplicate`, `/route`, `/batch-score`, `/evaluate`, `/health`, `/model-info` |
| Explainability| SHAP values for priority score breakdown                   |
| Memory Limit  | 2GB (Docker resource constraint)                           |

---

## Data Flow

### Complaint Lifecycle

```
Citizen submits complaint
        │
        ▼
┌───────────────────┐
│  POST /complaints │  ← Multer (image), Zod validation
└────────┬──────────┘
         │
         ▼
┌───────────────────┐     ┌─────────────────────┐
│  Save to Database │────▶│  AI Scoring (Groq)  │
│   (status: SUBMITTED)   │  Priority · Sentiment│
└────────┬──────────┘     │  Urgency · Routing   │
         │                └──────────┬──────────┘
         │                           │
         ▼                           ▼
┌───────────────────┐     ┌─────────────────────┐
│  BullMQ Queues    │     │  Update complaint   │
│  (if Redis avail.)│     │  with AI scores     │
│  • Duplicate check│     └─────────────────────┘
│  • SLA deadline   │
│  • Notifications  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Socket.IO Event  │ ── Real-time push to officers/admins
└───────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│  Officer processes complaint                   │
│  SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS │
│         → VERIFICATION → RESOLVED → CLOSED    │
│                                                │
│  Each transition:                              │
│  • ComplaintLog entry (audit trail)            │
│  • Socket.IO event (real-time)                 │
│  • Email notification (if SMTP configured)     │
│  • SLA tracking (breach detection)             │
└───────────────────────────────────────────────┘
         │
         ▼
┌───────────────────┐
│ Citizen receives   │
│ satisfaction survey│ ── POST /surveys/:complaintId
└───────────────────┘
```

### Status State Machine

```
                    ┌──────────┐
                    │SUBMITTED │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
              ┌─────│ TRIAGED  │─────┐
              │     └────┬─────┘     │
              │          │           │
         ┌────▼───┐ ┌───▼────┐      │
         │ MERGED │ │ASSIGNED│      │
         └────────┘ └───┬────┘      │
                        │           │
                   ┌────▼─────┐     │
                   │IN_PROGRESS│    │
                   └────┬─────┘     │
                        │           │
                  ┌─────▼──────┐   │
                  │VERIFICATION│   │
                  └─────┬──────┘   │
                        │          │
                   ┌────▼─────┐   │
              ┌────│ RESOLVED │   │
              │    └────┬─────┘   │
              │         │         │
         ┌────▼───┐┌───▼────┐    │
         │REOPENED││ CLOSED │    │
         └────┬───┘└────────┘    │
              │                   │
              └───────────────────┘
                        │
                   ┌────▼─────┐
                   │ESCALATED │
                   └──────────┘
```

---

## Authentication & Authorization

### JWT Token Flow

```
Login (email + password)
        │
        ▼
┌───────────────────────┐
│ Verify bcrypt hash    │
│ Generate access token │  (short-lived)
│ Generate refresh token│  (long-lived)
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐     ┌──────────────────┐
│ Client stores tokens  │────▶│ Axios interceptor │
│ in localStorage       │     │ auto-attaches JWT │
└───────────────────────┘     └────────┬─────────┘
                                       │
                              401 Unauthorized?
                                       │
                              ┌────────▼─────────┐
                              │ Auto-refresh via  │
                              │ POST /auth/refresh│
                              └──────────────────┘
```

### Role-Based Access Control

| Role    | Scope                                                              |
|---------|--------------------------------------------------------------------|
| CITIZEN | Submit complaints, track own complaints, submit surveys            |
| OFFICER | Manage assigned complaints, provide AI feedback, view department   |
| ADMIN   | Full access — departments, categories, SLA, officers, analytics    |
| Public  | No auth — aggregate stats, heatmap, complaint tracking by ID       |

---

## Security Architecture

| Layer             | Mechanism                                              |
|-------------------|--------------------------------------------------------|
| Transport         | HTTPS (production), CORS whitelist                     |
| Headers           | Helmet (CSP, HSTS, X-Frame-Options, etc.)              |
| Authentication    | JWT (RS256), bcrypt (12 rounds)                        |
| Authorization     | Role-based middleware (`authorize('ADMIN')`)           |
| Rate Limiting     | Tiered — Auth: 10/15m, Citizen: 100/15m, Officer: 500/15m |
| Input Validation  | Zod schemas on all mutations (422 on failure)          |
| File Upload       | Multer — images only, 5MB max, Sharp optimization      |
| Parameter Safety  | HPP (HTTP Parameter Pollution prevention)              |
| Logging           | Winston structured logs (no PII in logs)               |

---

## Deployment Architecture (Docker Compose)

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │PostgreSQL│  │  Redis   │  │    AI Service     │  │
│  │  :5432   │  │  :6379   │  │     :8000         │  │
│  │ pgdata   │  │redisdata │  │   modelcache      │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│       └──────┬───────┘                 │              │
│              │                         │              │
│        ┌─────▼──────┐                  │              │
│        │   Server   │◄─────────────────┘              │
│        │   :5000    │                                 │
│        │  uploads   │                                 │
│        └─────┬──────┘                                 │
│              │                                        │
│        ┌─────▼──────┐                                 │
│        │   Client   │                                 │
│        │  :5173→80  │                                 │
│        │   nginx    │                                 │
│        └────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

| Service     | Image               | Healthcheck          | Volumes      |
|-------------|----------------------|----------------------|--------------|
| PostgreSQL  | postgres:16-alpine   | pg_isready           | pgdata       |
| Redis       | redis:7-alpine       | redis-cli ping       | redisdata    |
| Server      | node:20-bullseye-slim| —                    | uploads      |
| AI Service  | python:3.11-slim     | —                    | modelcache   |
| Client      | nginx:alpine         | —                    | —            |

### Nginx Reverse Proxy (Production)

The client container runs nginx which:
- Serves the built React SPA from `/usr/share/nginx/html`
- Proxies `/api/*` requests to `http://server:5000` (Docker internal DNS)
- Supports WebSocket upgrade for Socket.IO
- Handles SPA routing via `try_files $uri $uri/ /index.html`

---

## Technology Stack Summary

| Layer          | Technology                                            |
|----------------|-------------------------------------------------------|
| Frontend       | React 18, Vite, Tailwind CSS, Recharts, Leaflet      |
| API Gateway    | Node.js 20, Express 4, Socket.IO                     |
| ORM            | Prisma (PostgreSQL)                                   |
| Database       | PostgreSQL 16                                         |
| Cache/Queue    | Redis 7, BullMQ                                       |
| AI (Primary)   | Groq API (Llama 3.3 70B)                             |
| AI (Fallback)  | FastAPI, DistilBERT, XGBoost, Sentence Transformers  |
| Explainability | SHAP                                                  |
| Auth           | JWT, bcrypt                                           |
| Email          | Nodemailer (SMTP)                                     |
| PDF            | PDFKit                                                |
| Containerization| Docker Compose                                       |
| i18n           | i18next (EN, HI)                                      |
