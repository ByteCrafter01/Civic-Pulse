# CivicPulse v2 — Deployment Guide

---

## Prerequisites

| Dependency       | Version  | Purpose                    |
|------------------|----------|----------------------------|
| Docker           | 24+      | Container runtime          |
| Docker Compose   | v2+      | Multi-service orchestration|
| Node.js          | 20 LTS   | Server & client builds     |
| Python           | 3.11+    | AI service                 |
| PostgreSQL       | 16       | Primary database           |
| Redis            | 7        | Job queue & caching        |

---

## Option 1: Docker Compose (Recommended)

Full stack with a single command:

```bash
# Clone and start
git clone <repo-url>
cd Civic-Pulse

# Configure server environment
cp server/.env.example server/.env
# Edit server/.env with your actual values:
#   - JWT_SECRET (generate: openssl rand -hex 32)
#   - JWT_REFRESH_SECRET (generate: openssl rand -hex 32)
#   - GROQ_API_KEY (from console.groq.com)
#   - SMTP credentials (for email notifications)

# Launch all services
docker compose up --build
```

### Service URLs

| Service      | URL                          | Description          |
|--------------|------------------------------|----------------------|
| Frontend     | http://localhost:5173        | React SPA            |
| API Server   | http://localhost:5000        | Express REST API     |
| AI Service   | http://localhost:8000        | FastAPI endpoints    |
| AI Docs      | http://localhost:8000/docs   | Swagger UI           |
| PostgreSQL   | localhost:5432               | Database             |
| Redis        | localhost:6379               | Cache & queue        |

### Test Credentials (After Seed)

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | admin@civicpulse.com      | Admin@123    |
| Officer | officer@civicpulse.com    | Officer@123  |
| Citizen | citizen@civicpulse.com    | Citizen@123  |

---

## Option 2: Local Development (Without Docker)

### Step 1 — Start Infrastructure

```bash
# Start only PostgreSQL and Redis via Docker
docker compose up postgres redis -d
```

### Step 2 — Server Setup

```bash
cd server
cp .env.example .env
# Fill in environment variables in .env

npm install
npx prisma migrate dev    # Apply database migrations
npx prisma db seed         # Seed test data
npm run dev                # Start server on port 5000
```

### Step 3 — AI Service Setup

```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
pip install torch --index-url https://download.pytorch.org/whl/cpu

uvicorn app.main:app --reload --port 8000
```

### Step 4 — Client Setup

```bash
cd client
npm install
npm run dev                # Start Vite dev server on port 5173
```

---

## Environment Variables

### Server (`server/.env`)

| Variable           | Required | Description                          | Example                              |
|--------------------|----------|--------------------------------------|--------------------------------------|
| PORT               | No       | Server port (default: 5000)          | 5000                                 |
| NODE_ENV           | No       | Environment mode                     | development                          |
| DATABASE_URL       | Yes      | PostgreSQL connection string         | postgresql://user:pass@host:5432/db  |
| REDIS_URL          | No       | Redis connection (optional)          | redis://localhost:6379               |
| JWT_SECRET         | Yes      | Access token signing key             | (openssl rand -hex 32)              |
| JWT_REFRESH_SECRET | Yes      | Refresh token signing key            | (openssl rand -hex 32)              |
| AI_SERVICE_URL     | No       | FastAPI service URL                  | http://localhost:8000                |
| GROQ_API_KEY       | No       | Groq API key for LLM scoring        | gsk_...                              |
| SMTP_HOST          | No       | Email server host                    | smtp.gmail.com                       |
| SMTP_PORT          | No       | Email server port                    | 587                                  |
| SMTP_USER          | No       | Email account                        | user@gmail.com                       |
| SMTP_PASS          | No       | Email password / app password        | xxxx xxxx xxxx xxxx                  |
| CLIENT_URL         | No       | Frontend URL for CORS                | http://localhost:5173                |

### AI Service

| Variable        | Required | Description                | Default     |
|-----------------|----------|----------------------------|-------------|
| MODEL_CACHE_DIR | No       | ML model storage directory | ./models    |
| PYTHONUNBUFFERED | No      | Force unbuffered stdout    | 1           |

---

## Database Management

```bash
# Apply pending migrations
npx prisma migrate dev

# Reset database (destructive)
npx prisma migrate reset

# Seed test data
npx prisma db seed

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## Docker Volumes

| Volume      | Purpose                    | Persists          |
|-------------|----------------------------|-------------------|
| pgdata      | PostgreSQL data files      | Database records  |
| redisdata   | Redis persistence (AOF/RDB)| Job queue state   |
| modelcache  | AI/ML model files          | Trained models    |

To reset all data:
```bash
docker compose down -v    # Removes all volumes
docker compose up --build # Fresh start
```

---

## Health Checks

| Service    | Endpoint / Command       | Expected Response        |
|------------|--------------------------|--------------------------|
| Server     | GET /health              | `{"status":"ok"}`        |
| AI Service | GET /health              | `{"status":"healthy"}`   |
| PostgreSQL | pg_isready -U civic      | Exit code 0              |
| Redis      | redis-cli ping           | PONG                     |

---

## Graceful Degradation

The system is designed to operate with reduced functionality when optional services are unavailable:

| Service Unavailable | Impact                                         | Fallback                   |
|---------------------|-------------------------------------------------|----------------------------|
| Redis               | BullMQ workers don't start                      | AI scoring runs inline     |
| AI Service          | Local ML models unavailable                     | Groq API used as primary   |
| Groq API            | LLM-based scoring unavailable                   | FastAPI ML models used     |
| Both AI services    | No AI scoring                                   | Defaults applied           |
| SMTP                | Email notifications don't send                  | Socket.IO still works      |

---

## Troubleshooting

| Issue                        | Solution                                          |
|------------------------------|---------------------------------------------------|
| Port already in use          | `lsof -i :5000` and kill the process              |
| Prisma migration failed      | `npx prisma migrate reset` then re-seed           |
| Redis connection refused     | Verify Redis is running: `docker compose ps`       |
| AI service out of memory     | Increase Docker memory limit (default: 2GB)        |
| CORS errors in browser       | Verify CLIENT_URL in server .env matches frontend  |
| Socket.IO not connecting     | Check that server and client ports match            |
