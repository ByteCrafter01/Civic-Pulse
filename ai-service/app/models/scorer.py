"""
Multi-signal priority scoring engine.

Pipeline:
  1. DistilBERT → sentiment score
  2. Sentence-Transformers (MiniLM) → 384-dim embedding (PCA → 3 dims)
  3. Keyword regex → urgency count
  4. Category weight lookup
  5. Temporal + context features
  → XGBoost regressor → priority_score (0-100)
"""
import os
import numpy as np
from datetime import datetime
from typing import Optional

from app.config import settings
from app.preprocessing.text import clean_text, extract_urgency_keywords, word_count

# Lazy-loaded model singletons
_sentiment_pipeline = None
_embedding_model    = None
_scorer_model       = None
_pca_model          = None


def _get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        from transformers import pipeline
        _sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=settings.sentiment_model,
            device=-1,  # CPU
        )
    return _sentiment_pipeline


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(settings.embedding_model)
    return _embedding_model


def _get_scorer():
    """Load trained XGBoost or return fallback rule-based scorer."""
    global _scorer_model, _pca_model
    if _scorer_model is None:
        if os.path.exists(settings.scorer_model_path):
            import joblib
            _scorer_model = joblib.load(settings.scorer_model_path)
        else:
            _scorer_model = "fallback"
    return _scorer_model


def _rule_based_score(features: dict) -> float:
    """
    Fallback rule-based scorer when XGBoost model is not trained yet.
    Weighted sum of normalized signals.
    """
    sentiment_neg  = max(0, -features.get("sentiment_score", 0))  # 0-1
    urgency_norm   = min(features.get("urgency_count", 0) / 5, 1.0)
    cat_weight_norm= min(features.get("category_weight", 1.0) / 2.0, 1.0)
    has_img        = 0.1 if features.get("has_image", False) else 0

    score = (
        sentiment_neg  * 40 +
        urgency_norm   * 35 +
        cat_weight_norm* 20 +
        has_img        *  5
    )
    return round(min(max(score, 0), 100), 2)


def score(
    title: str,
    description: str,
    category_name: str,
    category_weight: float,
    lat: float,
    lng: float,
    has_image: bool = False,
):
    full_text = f"{title}. {description}"
    cleaned   = clean_text(full_text)

    # ── Sentiment ──────────────────────────────────────────────────────────
    sentiment_result = _get_sentiment_pipeline()(cleaned[:512])[0]
    raw_label        = sentiment_result["label"]
    raw_confidence   = sentiment_result["score"]

    # Handle both binary (POSITIVE/NEGATIVE) and star-based (1-5 star) models
    if "star" in raw_label.lower() or raw_label.isdigit():
        # Multilingual model: converts 1-5 stars to -1 to 1 scale
        stars = int(raw_label.replace(" star", "").replace(" stars", "").strip())
        sentiment_score = (stars - 3) / 2.0  # 1→-1, 2→-0.5, 3→0, 4→0.5, 5→1
        sentiment_label = "NEGATIVE" if stars <= 2 else ("POSITIVE" if stars >= 4 else "NEUTRAL")
    else:
        sentiment_label = raw_label
        sentiment_score = -raw_confidence if sentiment_label == "NEGATIVE" else raw_confidence

    # ── Urgency Keywords ───────────────────────────────────────────────────
    urgency_kws   = extract_urgency_keywords(cleaned, settings.urgency_keywords)
    urgency_count = len(urgency_kws)

    # ── Temporal Features ──────────────────────────────────────────────────
    now        = datetime.now()
    hour_of_day= now.hour
    is_weekend = int(now.weekday() >= 5)

    features = {
        "sentiment_score":  sentiment_score,
        "urgency_count":    urgency_count,
        "category_weight":  category_weight,
        "word_count":       word_count(cleaned),
        "has_image":        int(has_image),
        "hour_of_day":      hour_of_day,
        "is_weekend":       is_weekend,
    }

    # ── XGBoost or fallback ────────────────────────────────────────────────
    scorer = _get_scorer()
    if scorer == "fallback":
        priority_score = _rule_based_score(features)
    else:
        # Build feature vector matching training feature order
        X = np.array([[
            features["sentiment_score"],
            features["urgency_count"],
            features["category_weight"],
            features["word_count"],
            features["has_image"],
            features["hour_of_day"],
            features["is_weekend"],
        ]])
        priority_score = float(scorer.predict(X)[0])
        priority_score = round(min(max(priority_score, 0), 100), 2)

    # ── Priority Level ─────────────────────────────────────────────────────
    if priority_score >= 80:   priority_level = "CRITICAL"
    elif priority_score >= 60: priority_level = "HIGH"
    elif priority_score >= 40: priority_level = "MEDIUM"
    else:                      priority_level = "LOW"

    return {
        "priority_score":   priority_score,
        "priority_level":   priority_level,
        "sentiment_label":  sentiment_label,
        "sentiment_score":  round(sentiment_score, 4),
        "urgency_keywords": urgency_kws,
        "explanation": {
            "sentiment":       round(sentiment_score * 40, 2),
            "urgency_keywords":round(min(urgency_count / 5, 1.0) * 35, 2),
            "category_weight": round(min(category_weight / 2.0, 1.0) * 20, 2),
            "has_image":       round(int(has_image) * 5, 2),
        },
    }
