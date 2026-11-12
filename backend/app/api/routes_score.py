from fastapi import APIRouter

from app.models import KeywordOut, KeywordsRequest, KeywordsResponse
from app.services.keywords import extract_keywords

router = APIRouter(prefix="/api", tags=["scoring"])


@router.post("/keywords", response_model=KeywordsResponse)
def keywords(request: KeywordsRequest) -> KeywordsResponse:
    found = extract_keywords(request.job_description)
    return KeywordsResponse(
        keywords=[KeywordOut(term=k.term, weight=k.weight, category=k.category) for k in found]
    )
