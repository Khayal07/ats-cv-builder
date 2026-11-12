from app.models import Resume
from app.services.keywords import extract_keywords
from app.services.matching import match_resume
from app.services.suggestions import build_suggestions

GOOD_BULLETS = ["Cut API latency by 40% for 2M users", "Shipped 12 services to production"]


def make_resume(**overrides) -> Resume:
    data = {
        "basics": {"fullName": "Aysel", "email": "a@example.com"},
        "summary": "Backend engineer with 5 years in Python.",
        "experience": [{"role": "Engineer", "company": "Acme", "bullets": GOOD_BULLETS}],
        "education": [{"institution": "ADA University", "degree": "BSc"}],
        "skills": [{"category": "Tools", "items": ["Python"]}],
        "projects": [],
    }
    data.update(overrides)
    return Resume.model_validate(data)


def suggest(resume: Resume, jd: str = "Python"):
    return build_suggestions(resume, match_resume(resume, extract_keywords(jd)))


def types(suggestions) -> list[str]:
    return [s.type for s in suggestions]


def test_complete_matching_resume_has_no_suggestions():
    resume = make_resume(
        experience=[
            {"role": "Engineer", "bullets": ["Built Python APIs serving 3M requests per day"]}
        ]
    )
    assert suggest(resume) == []


def test_missing_keywords_are_suggested_highest_weight_first():
    result = suggest(make_resume(), "Kafka. Kafka. Kafka. Docker. Python.")
    missing = [s for s in result if s.type == "missing_keyword"]
    assert [s.term for s in missing] == ["Kafka", "Docker"]
    assert missing[0].severity == "high"
    assert missing[1].severity == "medium"
    assert "Kafka" in missing[0].message


def test_missing_keyword_suggestions_are_capped_at_five():
    jd = "Docker, Kafka, Redis, Go lang, Rust, Scala, Terraform, Ansible"
    result = suggest(make_resume(), jd)
    assert types(result).count("missing_keyword") == 5


def test_skill_only_listed_in_skills_section():
    result = suggest(make_resume(summary="Backend engineer with 5 years of experience."), "Python")
    skills_only = [s for s in result if s.type == "skills_only"]
    assert [s.term for s in skills_only] == ["Python"]
    assert "Experience" in skills_only[0].message


def test_empty_summary():
    assert "empty_summary" in types(suggest(make_resume(summary="  ")))


def test_bullets_without_numbers_are_counted():
    resume = make_resume(
        experience=[
            {"role": "Engineer", "bullets": ["Built APIs", "Led a team", "Cut costs by 10%"]}
        ]
    )
    [hint] = [s for s in suggest(resume) if s.type == "bullets_without_numbers"]
    assert hint.message.startswith("2 of 3 bullets")


def test_long_bullets():
    long_bullet = " ".join(["word"] * 31) + " 5"
    resume = make_resume(
        experience=[{"role": "Engineer", "bullets": [long_bullet, "Did 3 things"]}]
    )
    [hint] = [s for s in suggest(resume) if s.type == "long_bullets"]
    assert hint.message.startswith("1 bullet is longer than 30 words")


def test_missing_email_is_high_severity():
    result = suggest(make_resume(basics={"fullName": "Aysel", "email": ""}))
    assert result[0].type == "missing_email"
    assert result[0].severity == "high"


def test_empty_core_sections():
    result = suggest(make_resume(experience=[], education=[], skills=[]))
    empty = [s for s in result if s.type == "empty_section"]
    assert [s.term for s in empty] == ["Experience", "Education", "Skills"]


def test_job_description_without_keywords():
    assert "no_keywords" in types(suggest(make_resume(), "the and of"))


def test_suggestions_are_sorted_by_severity():
    resume = make_resume(summary="", basics={"fullName": "A", "email": ""})
    severities = [s.severity for s in suggest(resume, "Kafka. Kafka. Kafka.")]
    rank = {"high": 0, "medium": 1, "low": 2}
    assert severities == sorted(severities, key=rank.__getitem__)
