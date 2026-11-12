"""Matches extracted job-description keywords against a resume.

A keyword matches when one of its variants (canonical name, synonyms, or the phrase
itself) appears as a contiguous token sequence inside one phrase segment of a resume
section. Matching on tokens gives word boundaries for free ("java" never matches
"javascript"), and segments stop multi-word terms from matching across punctuation.
Keys get a light plural fold on both sides so "pipelines" matches "pipeline".
"""

from __future__ import annotations

from dataclasses import dataclass

from app.models import Resume, SectionName

from .keywords import KeyTuple, Keyword
from .text import segments

SECTION_ORDER: tuple[SectionName, ...] = (
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
)


@dataclass(frozen=True, slots=True)
class KeywordMatch:
    term: str
    weight: float
    category: str
    sections: list[SectionName]


@dataclass(frozen=True, slots=True)
class MatchResult:
    score: int
    matched: list[KeywordMatch]
    missing: list[Keyword]
    matched_weight: float
    total_weight: float


def _fold(key: str) -> str:
    """Light singular form: "pipelines" -> "pipeline" (keeps "aws", "class")."""
    if len(key) > 3 and key.endswith("s") and not key.endswith("ss"):
        return key[:-1]
    return key


def _fold_tuple(keys: KeyTuple) -> KeyTuple:
    return tuple(_fold(key) for key in keys)


def section_texts(resume: Resume) -> dict[SectionName, list[str]]:
    """Plain text pieces of each standard section. Each piece is segmented separately."""
    return {
        "summary": [resume.basics.headline, resume.summary],
        "experience": [
            piece
            for entry in resume.experience
            for piece in (entry.role, entry.company, entry.location, *entry.bullets)
        ],
        "education": [
            piece
            for entry in resume.education
            for piece in (entry.institution, entry.degree, entry.field, *entry.details)
        ],
        "skills": [piece for group in resume.skills for piece in (group.category, *group.items)],
        "projects": [piece for entry in resume.projects for piece in (entry.name, *entry.bullets)],
    }


def _section_segments(resume: Resume) -> dict[SectionName, list[KeyTuple]]:
    return {
        section: [
            _fold_tuple(tuple(token.key for token in segment))
            for piece in pieces
            if piece.strip()
            for segment in segments(piece)
        ]
        for section, pieces in section_texts(resume).items()
    }


def _contains(haystack: KeyTuple, needle: KeyTuple) -> bool:
    size = len(needle)
    return any(haystack[i : i + size] == needle for i in range(len(haystack) - size + 1))


def match_resume(resume: Resume, keywords: list[Keyword]) -> MatchResult:
    sections = _section_segments(resume)
    matched: list[KeywordMatch] = []
    missing: list[Keyword] = []

    for keyword in keywords:
        variants = [_fold_tuple(variant) for variant in keyword.variants]
        found_in = [
            name
            for name in SECTION_ORDER
            if any(_contains(segment, v) for segment in sections[name] for v in variants)
        ]
        if found_in:
            matched.append(KeywordMatch(keyword.term, keyword.weight, keyword.category, found_in))
        else:
            missing.append(keyword)

    total = sum(k.weight for k in keywords)
    matched_weight = sum(m.weight for m in matched)
    score = round(100 * matched_weight / total) if total else 0
    missing.sort(key=lambda k: -k.weight)
    return MatchResult(score, matched, missing, matched_weight, total)
