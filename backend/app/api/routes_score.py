from fastapi import APIRouter

from app.models import (
    KeywordOut,
    KeywordsRequest,
    KeywordsResponse,
    MatchedKeyword,
    ScoreRequest,
    ScoreResponse,
)
from app.services.keywords import extract_keywords
from app.services.matching import match_resume

router = APIRouter(prefix="/api", tags=["scoring"])


@router.post("/keywords", response_model=KeywordsResponse)
def keywords(request: KeywordsRequest) -> KeywordsResponse:
    found = extract_keywords(request.job_description)
    return KeywordsResponse(
        keywords=[KeywordOut(term=k.term, weight=k.weight, category=k.category) for k in found]
    )


@router.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest) -> ScoreResponse:
    result = match_resume(request.resume, extract_keywords(request.job_description))
    return ScoreResponse(
        score=result.score,
        matched=[
            MatchedKeyword(term=m.term, weight=m.weight, category=m.category, sections=m.sections)
            for m in result.matched
        ],
        missing=[
            KeywordOut(term=k.term, weight=k.weight, category=k.category) for k in result.missing
        ],
    )
