"""
FastAPI application — CivicPulse AI Microservice
Endpoints: /score, /check-duplicate, /route, /batch-score, /health, /model-info
"""
import os
import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings

app = FastAPI(
    title="CivicPulse AI Service",
    description="Transformer-based NLP for complaint prioritization, duplicate detection, and department routing",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ────────────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    title:           str  = Field(..., min_length=3)
    description:     str  = Field(..., min_length=10)
    category_name:   str  = "General"
    category_weight: float = 1.0
    lat:             float = 0.0
    lng:             float = 0.0
    has_image:       bool  = False

class ScoreResponse(BaseModel):
    priority_score:   float
    priority_level:   str
    sentiment_label:  str
    sentiment_score:  float
    urgency_keywords: list
    explanation:      dict

class DuplicateRequest(BaseModel):
    title:               str
    description:         str
    lat:                 float
    lng:                 float
    category_id:         str  = ""
    existing_complaints: list = []   # Passed by server with recent complaints

class RoutingRequest(BaseModel):
    title:       str
    description: str

class BatchScoreRequest(BaseModel):
    complaints: List[ScoreRequest]

# ── Routes ────────────────────────────────────────────────────────────────

@app.post("/score", response_model=ScoreResponse, tags=["Scoring"])
async def score_complaint(req: ScoreRequest):
    """Score a single complaint for priority, sentiment, and urgency."""
    try:
        from app.models.scorer import score
        result = score(
            title=req.title,
            description=req.description,
            category_name=req.category_name,
            category_weight=req.category_weight,
            lat=req.lat,
            lng=req.lng,
            has_image=req.has_image,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")


@app.post("/check-duplicate", tags=["Duplicate Detection"])
async def check_duplicate(req: DuplicateRequest):
    """Check if a complaint is a semantic + geographic duplicate."""
    try:
        from app.models.duplicate import check_duplicate as do_check
        result = do_check(
            title=req.title,
            description=req.description,
            lat=req.lat,
            lng=req.lng,
            category_id=req.category_id,
            existing_complaints=req.existing_complaints,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Duplicate check failed: {str(e)}")


@app.post("/route", tags=["Routing"])
async def route_complaint(req: RoutingRequest):
    """Auto-route complaint to the most relevant department."""
    try:
        from app.models.router import route
        return route(title=req.title, description=req.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing failed: {str(e)}")


@app.post("/batch-score", tags=["Scoring"])
async def batch_score(req: BatchScoreRequest):
    """Score multiple complaints in one request."""
    from app.models.scorer import score
    results = []
    for c in req.complaints:
        try:
            r = score(c.title, c.description, c.category_name, c.category_weight, c.lat, c.lng, c.has_image)
            results.append(r)
        except Exception as e:
            results.append({"error": str(e)})
    return {"results": results}


@app.get("/health", tags=["System"])
async def health_check():
    """Service health check."""
    return {
        "status":        "ok",
        "timestamp":     datetime.now().isoformat(),
        "models_loaded": os.path.exists(settings.scorer_model_path),
    }


@app.get("/model-info", tags=["System"])
async def model_info():
    """Return model version and configuration info."""
    return {
        "scorer_version":   "rule-based-fallback" if not os.path.exists(settings.scorer_model_path) else "xgboost-v1",
        "router_version":   "keyword-rules" if not os.path.exists(settings.routing_model_path) else "distilbert-v1",
        "embedding_model":  settings.embedding_model,
        "sentiment_model":  settings.sentiment_model,
        "similarity_threshold": settings.similarity_threshold,
        "geo_threshold_m":      settings.geo_threshold_m,
    }
