"""Rule-based keyword extraction from a job description.

1. Split the text into phrase segments (see ``text.segments``).
2. Find known skills with a greedy longest match over the curated catalog
   (``data/skills.json``: canonical name + synonyms, e.g. "k8s" -> Kubernetes).
3. From the remaining content words (no stopwords/noise/numbers) build 1–3-word
   phrases; keep those that repeat, and drop phrases contained in a longer one
   that is at least as frequent.
4. Weight = (2.0 for a skill, 1.0 for a phrase) x min(frequency, 3); keep the top N.
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from functools import cache
from typing import Literal

from .text import DATA_DIR, Token, is_stopword, load_word_list, segments, tokenize

KeyTuple = tuple[str, ...]
Category = Literal["skill", "phrase"]

SKILL_WEIGHT = 2.0
PHRASE_WEIGHT = 1.0
MAX_FREQUENCY = 3
MAX_PHRASE_WORDS = 3
MIN_PHRASE_FREQUENCY = 2
DEFAULT_TOP_N = 30


@dataclass(frozen=True, slots=True)
class Skill:
    name: str
    aliases: tuple[KeyTuple, ...]


@dataclass(frozen=True, slots=True)
class Keyword:
    term: str
    weight: float
    category: Category
    # Token-key sequences that count as this keyword when matching a resume.
    variants: tuple[KeyTuple, ...]


def _keys(text: str) -> KeyTuple:
    return tuple(token.key for token in tokenize(text))


@cache
def skill_catalog() -> tuple[Skill, ...]:
    raw = json.loads((DATA_DIR / "skills.json").read_text(encoding="utf-8"))
    catalog = []
    for item in raw:
        names = list(item.get("aliases", []))
        if item.get("match_name", True):
            names.insert(0, item["name"])
        aliases = tuple(dict.fromkeys(k for k in map(_keys, names) if k))
        catalog.append(Skill(item["name"], aliases))
    return tuple(catalog)


@cache
def _alias_index() -> tuple[dict[KeyTuple, Skill], int]:
    index: dict[KeyTuple, Skill] = {}
    for skill in skill_catalog():
        for alias in skill.aliases:
            index[alias] = skill
    return index, max(len(alias) for alias in index)


@cache
def _noise() -> frozenset[str]:
    return load_word_list("jd_noise.txt")


def find_skills(tokens: list[Token]) -> list[tuple[int, int, Skill]]:
    """Greedy longest-match of catalog aliases. Returns (start, end, skill) spans."""
    index, longest = _alias_index()
    keys = [token.key for token in tokens]
    spans = []
    position = 0
    while position < len(keys):
        for size in range(min(longest, len(keys) - position), 0, -1):
            skill = index.get(tuple(keys[position : position + size]))
            if skill:
                spans.append((position, position + size, skill))
                position += size
                break
        else:
            position += 1
    return spans


def _is_content_word(key: str) -> bool:
    return (
        len(key) > 1
        and any(char.isalpha() for char in key)
        and not is_stopword(key)
        and key not in _noise()
    )


def _content_runs(
    tokens: list[Token], skill_spans: list[tuple[int, int, Skill]]
) -> list[list[Token]]:
    """Maximal runs of content words that are not part of a skill."""
    in_skill = {i for start, end, _ in skill_spans for i in range(start, end)}
    runs: list[list[Token]] = [[]]
    for i, token in enumerate(tokens):
        if i in in_skill or not _is_content_word(token.key):
            runs.append([])
        else:
            runs[-1].append(token)
    return [run for run in runs if run]


def _contains(longer: KeyTuple, shorter: KeyTuple) -> bool:
    size = len(shorter)
    return any(longer[i : i + size] == shorter for i in range(len(longer) - size + 1))


def extract_keywords(job_description: str, top_n: int = DEFAULT_TOP_N) -> list[Keyword]:
    skill_counts: Counter[str] = Counter()
    skills_by_name: dict[str, Skill] = {}
    phrase_counts: Counter[KeyTuple] = Counter()
    phrase_surface: dict[KeyTuple, str] = {}
    first_seen: dict[str, int] = {}
    order = 0

    def seen(term: str) -> None:
        nonlocal order
        first_seen.setdefault(term, order)
        order += 1

    for segment in segments(job_description):
        spans = find_skills(segment)
        for _, _, skill in spans:
            skill_counts[skill.name] += 1
            skills_by_name[skill.name] = skill
            seen(skill.name)
        for run in _content_runs(segment, spans):
            for size in range(1, MAX_PHRASE_WORDS + 1):
                for start in range(len(run) - size + 1):
                    window = run[start : start + size]
                    key = tuple(token.key for token in window)
                    phrase_counts[key] += 1
                    surface = " ".join(token.surface for token in window)
                    phrase_surface.setdefault(key, surface.lower())
                    seen(phrase_surface[key])

    frequent = {k: n for k, n in phrase_counts.items() if n >= MIN_PHRASE_FREQUENCY}
    phrases = {
        key: count
        for key, count in frequent.items()
        if not any(
            len(other) > len(key) and other_count >= count and _contains(other, key)
            for other, other_count in frequent.items()
        )
    }

    keywords = [
        Keyword(
            name, SKILL_WEIGHT * min(count, MAX_FREQUENCY), "skill", skills_by_name[name].aliases
        )
        for name, count in skill_counts.items()
    ] + [
        Keyword(phrase_surface[key], PHRASE_WEIGHT * min(count, MAX_FREQUENCY), "phrase", (key,))
        for key, count in phrases.items()
    ]
    keywords.sort(key=lambda k: (-k.weight, k.category != "skill", first_seen[k.term]))
    return keywords[:top_n]
