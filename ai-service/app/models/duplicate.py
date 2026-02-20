"""
Semantic + geo duplicate detector using Sentence-BERT and Haversine.
"""
import os
from typing import Optional
from app.config import settings
from app.preprocessing.geo import haversine_distance

_embedding_model = None

def _get_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(settings.embedding_model)
    return _embedding_model


def encode(text: str):
    return _get_model().encode(text, normalize_embeddings=True)


def cosine_similarity(v1, v2) -> float:
    import numpy as np
    return float(np.dot(v1, v2))  # already normalized


def check_duplicate(
    title: str,
    description: str,
    lat: float,
    lng: float,
    category_id: str,
    existing_complaints: list,  # [{ id, title, description, lat, lng, category_id }]
) -> dict:
    """
    Compare new complaint against existing ones.
    Returns best duplicate match if found.
    """
    query_embedding = encode(f"{title}. {description}")

    best_match   = None
    best_score   = 0.0

    for candidate in existing_complaints:
        # Text similarity
        cand_embedding  = encode(f"{candidate['title']}. {candidate['description']}")
        text_similarity = cosine_similarity(query_embedding, cand_embedding)

        if text_similarity < settings.similarity_threshold:
            continue

        # Geo check
        dist_m = haversine_distance(lat, lng, candidate["lat"], candidate["lng"])
        if dist_m > settings.geo_threshold_m:
            continue

        # Combined score (text 70%, geo proximity 30%)
        geo_score = max(0, 1 - dist_m / settings.geo_threshold_m)
        combined  = 0.7 * text_similarity + 0.3 * geo_score

        # Same category bonus
        if candidate.get("category_id") == category_id:
            combined = min(combined * 1.05, 1.0)

        if combined > best_score:
            best_score = combined
            best_match = {
                "duplicate_of_id":    candidate["id"],
                "text_similarity":    round(text_similarity, 4),
                "geo_distance_m":     round(dist_m, 1),
                "combined_confidence":round(combined, 4),
            }

    if best_match:
        return { "is_duplicate": True, **best_match }
    return { "is_duplicate": False }
