import re
import unicodedata

def clean_text(text: str) -> str:
    """Normalize and clean complaint text for NLP."""
    text = unicodedata.normalize("NFKC", text)
    text = text.lower().strip()
    text = re.sub(r"http\S+", " ", text)           # URLs
    text = re.sub(r"[^a-z0-9\s.,!?'-]", " ", text) # Special chars
    text = re.sub(r"\s+", " ", text)               # Extra whitespace
    return text

def extract_urgency_keywords(text: str, keyword_list: list) -> list[str]:
    """Return matched urgency keywords found in text."""
    text_lower = text.lower()
    return [kw for kw in keyword_list if kw in text_lower]

def word_count(text: str) -> int:
    return len(text.split())

def has_numbers(text: str) -> bool:
    return bool(re.search(r"\d", text))
