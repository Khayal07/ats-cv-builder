from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

client = TestClient(create_app(Settings()))

RESUME = {
    "schemaVersion": 1,
    "basics": {
        "fullName": "Aysel Məmmədova",
        "headline": "Backend Engineer",
        "email": "a@example.com",
        "phone": "",
        "location": "Bakı",
        "links": [{"id": "l1", "label": "GitHub", "url": "github.com/a"}],
    },
    "summary": "Backend engineer working with Python and FastAPI.",
    "experience": [
        {
            "id": "e1",
            "company": "Kapital Tech",
            "role": "Engineer",
            "location": "",
            "startDate": "2022-01",
            "endDate": None,
            "bullets": ["Built services with Docker"],
        }
    ],
    "education": [],
    "skills": [{"id": "s1", "category": "Tools", "items": ["Python", "Docker"]}],
    "projects": [],
}


def test_scores_a_resume_against_a_job_description():
    response = client.post(
        "/api/score",
        json={"resume": RESUME, "job_description": "Python, Docker and Kubernetes."},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 67
    assert {m["term"] for m in body["matched"]} == {"Python", "Docker"}
    python = next(m for m in body["matched"] if m["term"] == "Python")
    assert python["sections"] == ["summary", "skills"]
    assert body["missing"] == [{"term": "Kubernetes", "weight": 2.0, "category": "skill"}]
    suggestion_types = [s["type"] for s in body["suggestions"]]
    assert "missing_keyword" in suggestion_types
    assert "empty_section" in suggestion_types  # no education
    assert all(set(s) == {"type", "severity", "message", "term"} for s in body["suggestions"])


def test_accepts_a_partial_resume():
    response = client.post(
        "/api/score", json={"resume": {"summary": "Python"}, "job_description": "Python"}
    )
    assert response.status_code == 200
    assert response.json()["score"] == 100


def test_rejects_wrong_types():
    response = client.post(
        "/api/score", json={"resume": {"experience": "lots"}, "job_description": "Python"}
    )
    assert response.status_code == 422


def test_rejects_blank_job_description():
    response = client.post("/api/score", json={"resume": RESUME, "job_description": " "})
    assert response.status_code == 422
