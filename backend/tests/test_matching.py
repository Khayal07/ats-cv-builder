from app.models import Resume
from app.services.keywords import extract_keywords
from app.services.matching import match_resume


def make_resume(**sections) -> Resume:
    data = {
        "basics": {"fullName": "Aysel", "headline": sections.pop("headline", "")},
        "summary": sections.pop("summary", ""),
        "experience": [
            {"role": "Engineer", "company": "Acme", "bullets": [b]}
            for b in sections.pop("experience", [])
        ],
        "education": [],
        "skills": [{"category": "Tools", "items": sections.pop("skills", [])}],
        "projects": [{"name": "Side", "bullets": [b]} for b in sections.pop("projects", [])],
    }
    assert not sections, f"unknown sections {sections}"
    return Resume.model_validate(data)


def match(jd: str, resume: Resume):
    return match_resume(resume, extract_keywords(jd))


def matched_terms(result) -> set[str]:
    return {m.term for m in result.matched}


def missing_terms(result) -> set[str]:
    return {m.term for m in result.missing}


def test_reports_sections_in_standard_order():
    resume = make_resume(
        skills=["Python"], experience=["Built Python services"], summary="Python developer"
    )
    result = match("Python", resume)
    assert result.matched[0].sections == ["summary", "experience", "skills"]


def test_matches_synonyms_from_the_catalog():
    result = match("Kubernetes and PostgreSQL", make_resume(skills=["k8s", "Postgres"]))
    assert matched_terms(result) == {"Kubernetes", "PostgreSQL"}
    assert result.score == 100


def test_java_does_not_match_javascript():
    result = match("Java", make_resume(skills=["JavaScript"]))
    assert missing_terms(result) == {"Java"}
    assert result.score == 0


def test_multi_word_terms_do_not_match_across_punctuation():
    result = match("Machine learning", make_resume(skills=["machine", "learning"]))
    assert missing_terms(result) == {"Machine Learning"}


def test_score_is_matched_weight_over_total_weight():
    # Python: 2.0 x 3 = 6, Docker: 2.0 x 1 = 2 -> Docker only = 2/8 = 25.
    result = match("Python. Python. Python. Docker.", make_resume(skills=["Docker"]))
    assert result.score == 25
    assert result.total_weight == 8.0
    assert result.matched_weight == 2.0


def test_plural_and_singular_forms_match():
    jd = "Own data pipelines. Scale data pipelines."
    result = match(jd, make_resume(experience=["Built a data pipeline in Airflow"]))
    assert "data pipelines" in matched_terms(result)


def test_azerbaijani_case_variants_match():
    jd = "Komanda ilə işləmək. Komanda ilə işləmək."
    result = match(jd, make_resume(summary="KOMANDA İLƏ İŞLƏMƏK bacarığım var"))
    assert {"komanda", "işləmək"} <= matched_terms(result)


def test_headline_counts_as_summary():
    result = match("React", make_resume(headline="React Developer"))
    assert result.matched[0].sections == ["summary"]


def test_missing_keywords_are_sorted_by_weight():
    result = match("Docker. Kafka. Kafka.", make_resume())
    assert [m.term for m in result.missing] == ["Kafka", "Docker"]


def test_no_keywords_means_zero_score():
    result = match("the and of", make_resume(skills=["Python"]))
    assert result.score == 0
    assert result.total_weight == 0
