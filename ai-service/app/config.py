import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_cache_dir: str = "./models"
    
    # Scoring model
    scorer_model_path: str = "./models/scorer.pkl"
    embedding_model:   str = "all-MiniLM-L6-v2"
    sentiment_model:   str = "nlptown/bert-base-multilingual-uncased-sentiment"
    
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
        # Hindi urgency keywords
        "\u0916\u0924\u0930\u093e", "\u0906\u092a\u093e\u0924\u0915\u093e\u0932", "\u092c\u093e\u0922\u093c", "\u091f\u0942\u091f\u093e", "\u0906\u0917", "\u0926\u0941\u0930\u094d\u0918\u091f\u0928\u093e", "\u091a\u094b\u091f", "\u092c\u0940\u092e\u093e\u0930\u0940",
        "\u0924\u0941\u0930\u0902\u0924", "\u0917\u0902\u092d\u0940\u0930", "\u091c\u0930\u0942\u0930\u0940", "\u0938\u092e\u0938\u094d\u092f\u093e", "\u0930\u093f\u0938\u093e\u0935", "\u0928\u0941\u0915\u0938\u093e\u0928",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
