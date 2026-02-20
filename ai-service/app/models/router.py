"""
Department routing classifier.
Uses fine-tuned DistilBERT if model file exists, otherwise falls back to
keyword-based rule classification for cold start.
"""
import os
import re
from app.config import settings
from app.preprocessing.text import clean_text

_classifier = None

KEYWORD_RULES = {
    "Public Works":         ["road", "pothole", "bridge", "footpath", "pavement", "traffic", "construction"],
    "Water & Sanitation":   ["water", "pipe", "sewage", "drain", "flood", "leakage", "sanitation", "garbage", "waste"],
    "Electricity":          ["light", "electricity", "power", "outage", "streetlight", "wire", "cable"],
    "Health & Environment": ["mosquito", "health", "pollution", "air", "noise", "stray", "dog", "hospital", "disease"],
    "Parks & Recreation":   ["park", "tree", "garden", "playground", "bench", "recreation", "green"],
}


def _get_classifier():
    global _classifier
    if _classifier is None:
        if os.path.exists(settings.routing_model_path):
            import joblib
            _classifier = joblib.load(settings.routing_model_path)
        else:
            _classifier = "rule-based"
    return _classifier


def _keyword_route(text: str) -> list[dict]:
    """Keyword-based fallback router."""
    text_lower = text.lower()
    scores = {}
    for dept, keywords in KEYWORD_RULES.items():
        matches = sum(1 for kw in keywords if kw in text_lower)
        scores[dept] = matches

    sorted_depts = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    total = sum(s for _, s in sorted_depts) or 1

    return [
        {"department": d, "confidence": round(s / total, 4)}
        for d, s in sorted_depts
    ]


def route(title: str, description: str) -> dict:
    full_text = clean_text(f"{title}. {description}")
    classifier = _get_classifier()

    if classifier == "rule-based":
        ranked = _keyword_route(full_text)
    else:
        # ML classifier inference
        probs = classifier.predict_proba([full_text])[0]
        ranked = sorted(
            [{"department": d, "confidence": round(float(p), 4)}
             for d, p in zip(settings.routing_labels, probs)],
            key=lambda x: x["confidence"], reverse=True,
        )

    return {
        "department":  ranked[0]["department"],
        "confidence":  ranked[0]["confidence"],
        "alternatives":ranked[1:],
    }
