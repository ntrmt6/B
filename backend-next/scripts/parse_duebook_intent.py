#!/usr/bin/env python3
"""DueBook AI intent parser.

Reads JSON from stdin:
  { "text": "...", "entities": [{ "id": "...", "name": "...", "phone": "..." }, ...] }

Writes JSON to stdout:
  { "ok": true, "entityId": "...", "entityName": "...", "amount": 500,
    "direction": "INCOME"|"EXPENSE", "confidence": 0.0-1.0, "note": "..." }
  or
  { "ok": false, "error": "reason", "hint": "example" }

Supports mixed English + banglish. Numbers in words (five hundred, panch sho) covered lightly.
"""
from __future__ import annotations
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher

# Direction cues ("I gave/paid someone" -> EXPENSE / I owe them,
#                 "someone owes me / I got from them" -> INCOME / they owe me)
INCOME_CUES = [
    "owe me", "owes me", "paba", "pabo", "paona", "paoyona", "pawna",
    "due te", "dueete", "due-te", "add to due", "due add", "add due",
    "kache", "khe pabo", "receivable", "credit sale", "baki",
    "he owes", "she owes", "they owe", "customer", "kheye geche",
    "borrowed from me", "loan diyechi", "dhar diyechi",
]
EXPENSE_CUES = [
    "i owe", "i paid", "diyechi", "dilam", "dibo", "dibe",
    "expense", "khoroch", "supplier", "supplier ke",
    "borrowed", "dhar niyechi", "loan niyechi", "advance diyechi",
    "salary diyechi", "salary dilam",
]

# Bangla digits
BANGLA_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")

# Very rough word-number map (English + banglish)
WORD_NUMS = {
    "zero": 0, "shunno": 0,
    "one": 1, "ek": 1, "ekta": 1,
    "two": 2, "dui": 2, "duita": 2,
    "three": 3, "tin": 3, "tinta": 3,
    "four": 4, "char": 4, "chaar": 4,
    "five": 5, "panch": 5, "paanch": 5,
    "six": 6, "choy": 6, "chhoy": 6,
    "seven": 7, "shat": 7, "saat": 7,
    "eight": 8, "aat": 8, "aath": 8,
    "nine": 9, "noy": 9,
    "ten": 10, "dosh": 10,
    "twenty": 20, "kuri": 20, "bish": 20,
    "fifty": 50, "pochash": 50, "pachash": 50,
    "hundred": 100, "sho": 100, "shoto": 100, "eksho": 100,
    "thousand": 1000, "hazar": 1000, "hajar": 1000,
    "lakh": 100000, "lac": 100000,
    "crore": 10000000, "koti": 10000000,
}

STOP_TOKENS = {
    "add", "please", "pls", "kore", "koro", "korun", "korbe",
    "the", "a", "an", "to", "of", "for", "on", "in", "at", "with",
    "tk", "taka", "bdt", "rs", "rupees", "rupee",
    "amount", "due", "dueete", "duete", "khaate", "khate",
    "customer", "supplier", "employee", "person", "name", "naam",
    "and", "or", "with", "hai", "hoy", "hobe", "hocche",
    "er", "ke", "kache", "theke", "upor", "upore", "onno",
    "make", "note", "notes", "type", "give", "gave", "paid", "pay",
    "buy", "bought", "sell", "sold", "sale", "sales", "purchase",
    "his", "her", "their", "my", "his/her", "him", "her",
}


def normalize(s: str) -> str:
    """Fold banglish to lowercase ASCII-ish, replace bangla digits."""
    s = unicodedata.normalize("NFKC", s).strip()
    s = s.translate(BANGLA_DIGITS)
    s = s.lower()
    return s


def parse_amount(text: str) -> float | None:
    """Extract a monetary amount from the text.

    Prefers explicit numeric groups; falls back to word-number combos.
    Handles "1,200", "1.5k", "2.5 hazar", "5 sho", "5000".
    """
    t = " " + text + " "
    # 1) number followed by k / hazar / thousand / lakh / lac / crore / koti
    m = re.search(
        r"(\d+(?:[.,]\d+)?)\s*(k|hazar|hajar|thousand|lakh|lac|crore|koti|sho|shoto)\b",
        t,
    )
    if m:
        num = float(m.group(1).replace(",", ""))
        unit = m.group(2)
        mult = {
            "k": 1000, "hazar": 1000, "hajar": 1000, "thousand": 1000,
            "lakh": 100000, "lac": 100000,
            "crore": 10000000, "koti": 10000000,
            "sho": 100, "shoto": 100,
        }[unit]
        return num * mult
    # 2) plain number
    for m in re.finditer(r"(\d[\d,]*(?:\.\d+)?)", t):
        raw = m.group(1).replace(",", "")
        try:
            n = float(raw)
        except ValueError:
            continue
        if n > 0:
            return n
    # 3) word-only combo: "panch sho", "dui hajar" (very small subset)
    tokens = re.findall(r"[a-z]+", t)
    total = 0.0
    running = 0.0
    matched = False
    for tok in tokens:
        if tok in WORD_NUMS:
            v = WORD_NUMS[tok]
            matched = True
            if v >= 100:
                running = (running or 1) * v
                total += running
                running = 0
            else:
                running += v
    total += running
    if matched and total > 0:
        return total
    return None


def detect_direction(text: str) -> tuple[str, float]:
    """Return ('INCOME'|'EXPENSE', confidence 0-1)."""
    t = " " + text + " "
    inc = sum(1 for cue in INCOME_CUES if cue in t)
    exp = sum(1 for cue in EXPENSE_CUES if cue in t)
    if inc == 0 and exp == 0:
        # Default: "add ... to X's due" implies INCOME (they owe me).
        return "INCOME", 0.4
    if inc >= exp:
        return "INCOME", min(1.0, 0.5 + 0.15 * (inc - exp))
    return "EXPENSE", min(1.0, 0.5 + 0.15 * (exp - inc))


def similar(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def find_entity(text: str, entities: list[dict]) -> tuple[dict | None, float]:
    """Return (entity, confidence). Uses substring + fuzzy match on tokens."""
    if not entities:
        return None, 0.0
    t = normalize(text)
    # Strip amount + stopwords to isolate name tokens
    cleaned = re.sub(r"\d[\d,]*(?:\.\d+)?", " ", t)
    cleaned = re.sub(r"[^a-z\s]", " ", cleaned)
    tokens = [w for w in cleaned.split() if w and w not in STOP_TOKENS and w not in WORD_NUMS]

    best = None
    best_score = 0.0
    for ent in entities:
        name = normalize(ent.get("name", ""))
        if not name:
            continue
        # Direct substring match on full name
        if name in t:
            score = 0.95 + 0.05 * min(1.0, len(name) / 20)
            if score > best_score:
                best, best_score = ent, score
            continue
        # Token-level match
        name_tokens = [w for w in re.split(r"\s+", name) if w]
        if not name_tokens:
            continue
        # Any name token appears in text tokens
        overlap = 0
        for nt in name_tokens:
            if nt in tokens:
                overlap += 1
            elif len(nt) >= 3 and any(similar(nt, tk) >= 0.85 for tk in tokens):
                overlap += 1
        if overlap:
            score = 0.5 + 0.4 * (overlap / len(name_tokens))
            if score > best_score:
                best, best_score = ent, score
        else:
            # Fuzzy against joined tokens
            joined = " ".join(tokens)
            if joined:
                r = similar(name, joined)
                if r > 0.75 and r > best_score:
                    best, best_score = ent, r * 0.9

    return best, best_score


def extract_note(text: str, entity_name: str | None) -> str | None:
    """Pull a short note after 'for' / 'note:' / 'porjonto' etc. Optional."""
    t = text.strip()
    m = re.search(r"\b(?:for|note[:\-]?|because|reason[:\-]?)\s+(.+)$", t, flags=re.IGNORECASE)
    if m:
        note = m.group(1).strip().strip(".!?,")
        if 0 < len(note) <= 120:
            return note
    return None


def parse(payload: dict) -> dict:
    text = payload.get("text", "")
    entities = payload.get("entities", []) or []
    if not text or not isinstance(text, str):
        return {"ok": False, "error": "Empty message", "hint": "e.g. 'Rahim 500 taka add to due'"}

    norm = normalize(text)

    amount = parse_amount(norm)
    if amount is None:
        return {
            "ok": False,
            "error": "Could not find an amount",
            "hint": "Include a number, e.g. 'add 500 taka to Rahim'",
        }
    if amount <= 0 or amount > 1_000_000_000:
        return {"ok": False, "error": "Amount out of range", "hint": "Enter 1 – 1,000,000,000"}

    entity, ent_conf = find_entity(norm, entities)
    if not entity:
        return {
            "ok": False,
            "error": "Could not identify customer",
            "hint": "Mention an existing customer name, e.g. 'Rahim 500 taka due'",
            "amount": amount,
        }

    direction, dir_conf = detect_direction(norm)
    note = extract_note(text, entity.get("name"))

    return {
        "ok": True,
        "entityId": entity.get("id"),
        "entityName": entity.get("name"),
        "amount": round(amount, 2),
        "direction": direction,
        "confidence": round(min(ent_conf, dir_conf + 0.2), 2),
        "note": note,
    }


def main() -> int:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw else {}
    except json.JSONDecodeError as e:
        print(json.dumps({"ok": False, "error": f"Bad JSON: {e}"}))
        return 1
    result = parse(payload)
    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
