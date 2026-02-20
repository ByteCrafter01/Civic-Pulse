# CivicPulse v2

An Intelligent Municipal Complaint Management System with Transformer-Based NLP, Event-Driven Workflows, Real-Time SLA Prediction, Explainable AI, and Public Transparency Analytics.

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Development (without Docker)

```bash
# 1. Start database services
docker compose up postgres redis -d

# 2. Setup server
cd server
cp .env.example .env       # fill in your values
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Setup AI service
cd ../ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Setup client
cd ../client
npm install
npm run dev
```

### With Docker Compose (full stack)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| AI Service | http://localhost:8000 |
| AI Docs | http://localhost:8000/docs |

## Architecture

- **Server**: Node.js + Express + Prisma + PostgreSQL + Redis + BullMQ + Socket.IO
- **AI Service**: FastAPI + DistilBERT + Sentence Transformers + XGBoost + SHAP
- **Client**: React 18 + Vite + Tailwind CSS + Recharts + Leaflet

## Test Users (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civicpulse.com | Admin@123 |
| Officer | officer@civicpulse.com | Officer@123 |
| Citizen | citizen@civicpulse.com | Citizen@123 |

## Project Structure

```
/
├── server/          # Node.js API Gateway (port 5000)
├── ai-service/      # FastAPI AI Microservice (port 8000)
├── client/          # React + Vite Frontend (port 5173)
├── evaluation/      # Academic evaluation suite
├── docs/            # Architecture and API documentation
└── docker-compose.yml
```
