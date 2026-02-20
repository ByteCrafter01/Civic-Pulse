import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_cache_dir: str = "./models"
    
    # Scoring model
    scorer_model_path: str = "./models/scorer.pkl"
    embedding_model:   str = "all-MiniLM-L6-v2"
    sentiment_model:   str = "distilbert-base-uncased-finetuned-sst-2-english"
    
    # Duplicate detection thresholds
    similarity_threshold: float  = 0.75
    geo_threshold_m:      float  = 300.0
    duplicate_lookback_days: int = 90
    
    # Routing
    routing_model_path: str = "./models/router.pkl"
    routing_labels:     list = ["Public Works", "Water & Sanitation", "Electricity", "Health & Environment", "Parks & Recreation"]
    
    # Urgency keywords
    urgency_keywords: list = [
        "urgent", "emergency", "danger", "hazard", "flood", "burst", "fire",
        "collapse", "accident", "injury", "critical", "severe", "immediate",
        "blocked", "overflow", "outage", "leaking", "broken", "damage",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
