"""Rule-based improvement suggestions for a resume, given its match result."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from app.models import Resume

from .matching import MatchResult

Severity = Literal["high", "medium", "low"]

MAX_MISSING_SUGGESTIONS = 5
MAX_SKILLS_ONLY_SUGGESTIONS = 5
HIGH_WEIGHT = 4.0
LONG_BULLET_WORDS = 30
_SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}
_DIGIT = re.compile(r"\d")


@dataclass(frozen=True, slots=True)
class Suggestion:
    type: str
    severity: Severity
    message: str
    term: str | None = None


def _plural(count: int, word: str) -> str:
    return f"{count} {word}" if count == 1 else f"{count} {word}s"


def _bullets(resume: Resume) -> list[str]:
    bullets = [b for entry in resume.experience for b in entry.bullets]
    bullets += [b for entry in resume.projects for b in entry.bullets]
    return [b.strip() for b in bullets if b.strip()]


def _keyword_suggestions(result: MatchResult) -> list[Suggestion]:
    if result.total_weight == 0:
        return [
            Suggestion(
                "no_keywords",
                "low",
                "No keywords were found in this job description. Paste the full posting, "
                "including the requirements.",
            )
        ]

    suggestions = []
    for keyword in result.missing[:MAX_MISSING_SUGGESTIONS]:
        severity: Severity = "high" if keyword.weight >= HIGH_WEIGHT else "medium"
        if keyword.category == "skill":
            message = f'Add "{keyword.term}" if you have used it: the job description asks for it.'
        else:
            message = (
                f'The job description mentions "{keyword.term}". '
                "Use the same words where it is true for you."
            )
        suggestions.append(Suggestion("missing_keyword", severity, message, keyword.term))

    skills_only = [m for m in result.matched if m.sections == ["skills"] and m.category == "skill"]
    for match in skills_only[:MAX_SKILLS_ONLY_SUGGESTIONS]:
        suggestions.append(
            Suggestion(
                "skills_only",
                "medium",
                f'"{match.term}" appears only in your Skills. Show it in an Experience or '
                "Projects bullet to prove you used it.",
                match.term,
            )
        )
    return suggestions


def _content_suggestions(resume: Resume) -> list[Suggestion]:
    suggestions = []

    if not resume.basics.email.strip():
        suggestions.append(
            Suggestion("missing_email", "high", "Add an email address so recruiters can reach you.")
        )

    if not resume.summary.strip():
        suggestions.append(
            Suggestion(
                "empty_summary",
                "medium",
                "Add a 2–4 sentence summary that names your role and the top skills "
                "from the job description.",
            )
        )

    sections = {
        "Experience": any(e.role.strip() or e.company.strip() for e in resume.experience),
        "Education": any(e.institution.strip() or e.degree.strip() for e in resume.education),
        "Skills": any(item.strip() for group in resume.skills for item in group.items),
    }
    for name, present in sections.items():
        if not present:
            suggestions.append(
                Suggestion("empty_section", "medium", f"Add a {name} section.", name)
            )

    bullets = _bullets(resume)
    without_numbers = [b for b in bullets if not _DIGIT.search(b)]
    if without_numbers:
        suggestions.append(
            Suggestion(
                "bullets_without_numbers",
                "low",
                f"{len(without_numbers)} of {_plural(len(bullets), 'bullet')} have no numbers. "
                "Quantify impact: %, time saved, users, revenue, team size.",
            )
        )

    long_bullets = [b for b in bullets if len(b.split()) > LONG_BULLET_WORDS]
    if long_bullets:
        verb = "is" if len(long_bullets) == 1 else "are"
        suggestions.append(
            Suggestion(
                "long_bullets",
                "low",
                f"{_plural(len(long_bullets), 'bullet')} {verb} longer than "
                f"{LONG_BULLET_WORDS} words. Split or tighten them.",
            )
        )
    return suggestions


def build_suggestions(resume: Resume, result: MatchResult) -> list[Suggestion]:
    suggestions = _content_suggestions(resume) + _keyword_suggestions(result)
    # Stable sort keeps rule order within the same severity.
    return sorted(suggestions, key=lambda s: _SEVERITY_RANK[s.severity])
