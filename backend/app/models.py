"""API request/response models."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator

MAX_JOB_DESCRIPTION_CHARS = 20_000

JobDescription = Annotated[
    str, StringConstraints(min_length=1, max_length=MAX_JOB_DESCRIPTION_CHARS)
]


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


class KeywordOut(BaseModel):
    term: str
    weight: float
    category: Literal["skill", "phrase"]


class KeywordsResponse(BaseModel):
    keywords: list[KeywordOut] = Field(default_factory=list)
