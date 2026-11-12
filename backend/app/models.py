"""API request/response models.

The resume models mirror the frontend's TypeScript ``Resume`` type (camelCase JSON).
They are lenient: missing fields get defaults and unknown fields are ignored, but
wrong types are rejected and sizes are capped.
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator
from pydantic.alias_generators import to_camel

MAX_JOB_DESCRIPTION_CHARS = 20_000
MAX_ENTRIES = 50
MAX_BULLETS = 50

JobDescription = Annotated[
    str, StringConstraints(min_length=1, max_length=MAX_JOB_DESCRIPTION_CHARS)
]
ShortText = Annotated[str, StringConstraints(max_length=500)]
LongText = Annotated[str, StringConstraints(max_length=5_000)]
Bullets = Annotated[list[LongText], Field(default_factory=list, max_length=MAX_BULLETS)]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class Link(CamelModel):
    id: ShortText = ""
    label: ShortText = ""
    url: ShortText = ""


class Basics(CamelModel):
    full_name: ShortText = ""
    headline: ShortText = ""
    email: ShortText = ""
    phone: ShortText = ""
    location: ShortText = ""
    links: list[Link] = Field(default_factory=list, max_length=20)


class ExperienceEntry(CamelModel):
    id: ShortText = ""
    company: ShortText = ""
    role: ShortText = ""
    location: ShortText = ""
    start_date: ShortText | None = ""
    end_date: ShortText | None = ""
    bullets: Bullets


class EducationEntry(CamelModel):
    id: ShortText = ""
    institution: ShortText = ""
    degree: ShortText = ""
    field: ShortText = ""
    location: ShortText = ""
    start_date: ShortText | None = ""
    end_date: ShortText | None = ""
    details: Bullets


class SkillGroup(CamelModel):
    id: ShortText = ""
    category: ShortText = ""
    items: list[ShortText] = Field(default_factory=list, max_length=100)


class ProjectEntry(CamelModel):
    id: ShortText = ""
    name: ShortText = ""
    url: ShortText = ""
    start_date: ShortText | None = ""
    end_date: ShortText | None = ""
    bullets: Bullets


class Resume(CamelModel):
    basics: Basics = Field(default_factory=Basics)
    summary: LongText = ""
    experience: list[ExperienceEntry] = Field(default_factory=list, max_length=MAX_ENTRIES)
    education: list[EducationEntry] = Field(default_factory=list, max_length=MAX_ENTRIES)
    skills: list[SkillGroup] = Field(default_factory=list, max_length=MAX_ENTRIES)
    projects: list[ProjectEntry] = Field(default_factory=list, max_length=MAX_ENTRIES)


class JobDescriptionRequest(BaseModel):
    job_description: JobDescription

    @field_validator("job_description")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Job description is empty.")
        return value


class KeywordsRequest(JobDescriptionRequest):
    pass


Category = Literal["skill", "phrase"]
SectionName = Literal["summary", "experience", "education", "skills", "projects"]


class KeywordOut(BaseModel):
    term: str
    weight: float
    category: Category


class KeywordsResponse(BaseModel):
    keywords: list[KeywordOut] = Field(default_factory=list)


class ScoreRequest(JobDescriptionRequest):
    resume: Resume


class MatchedKeyword(KeywordOut):
    sections: list[SectionName]


class ScoreResponse(BaseModel):
    score: int
    matched: list[MatchedKeyword]
    missing: list[KeywordOut]
