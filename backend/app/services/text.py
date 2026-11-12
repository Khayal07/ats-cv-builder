"""Text normalization and tokenization shared by keyword extraction and matching.

Matching works on *keys*: NFC-normalized, case-folded text in which the Azerbaijani/Turkish
dotted and dotless i (İ, I, ı, i) all fold to plain "i". That makes "IŞIQ", "ışıq" and "İşıq"
equal without guessing the language, while English "I" still becomes "i". The original
spelling is kept as the token's ``surface`` for display.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from functools import cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# A token is a run of letters/digits, optionally:
#   - starting with "." when it begins a word (".NET"),
#   - joined by . - / ' inside the word (node.js, ci/cd, scikit-learn, asp.net),
#   - ending in "++" or "#" (c++, c#).
_TOKEN_RE = re.compile(
    r"""
    (?:(?<![^\W_])\.(?=[^\W\d_]))?
    [^\W_]+
    (?:[.\-/'’][^\W_]+)*
    (?:\+\+|\#(?![^\W_]))?
    """,
    re.VERBOSE,
)

# Phrase boundaries: list punctuation, brackets, bullets, dashes used as separators,
# line breaks, and a period that ends a sentence (followed by whitespace or the end).
_BOUNDARY_RE = re.compile(r"[,;:!?()\[\]{}|•·▪◦●■–—\n\r\t]+|\.(?=\s|$)|\s[-/]\s")


@dataclass(frozen=True, slots=True)
class Token:
    surface: str
    key: str


def normalize_key(text: str) -> str:
    """Canonical form used for comparing words and phrases."""
    text = unicodedata.normalize("NFC", text)
    text = text.replace("İ", "i").replace("I", "i").replace("ı", "i")
    text = text.casefold()
    # casefold can still emit a combining dot above (U+0307) for some inputs.
    return unicodedata.normalize("NFC", text.replace("̇", ""))


def tokenize(text: str) -> list[Token]:
    return [Token(m.group(0), normalize_key(m.group(0))) for m in _TOKEN_RE.finditer(text)]


def segments(text: str) -> list[list[Token]]:
    """Splits text into phrase segments; n-grams are only built inside one segment."""
    result = []
    for part in _BOUNDARY_RE.split(unicodedata.normalize("NFC", text)):
        tokens = tokenize(part)
        if tokens:
            result.append(tokens)
    return result


def load_word_list(name: str) -> frozenset[str]:
    """Reads a data file with one entry per line ('#' starts a comment), as normalized keys."""
    entries = set()
    for line in (DATA_DIR / name).read_text(encoding="utf-8").splitlines():
        entry = line.split("#", 1)[0].strip()
        if entry:
            entries.add(normalize_key(entry))
    return frozenset(entries)


@cache
def stopwords() -> frozenset[str]:
    return load_word_list("stopwords_en.txt") | load_word_list("stopwords_az.txt")


def is_stopword(key: str) -> bool:
    return key in stopwords()
