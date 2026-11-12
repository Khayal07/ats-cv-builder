from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

client = TestClient(create_app(Settings()))


def test_returns_keywords():
    response = client.post(
        "/api/keywords",
        json={"job_description": "Python and Docker. Python services on AWS."},
    )
    assert response.status_code == 200
    keywords = response.json()["keywords"]
    assert keywords[0] == {"term": "Python", "weight": 4.0, "category": "skill"}
    assert {k["term"] for k in keywords} >= {"Docker", "AWS"}


def test_rejects_blank_job_description():
    response = client.post("/api/keywords", json={"job_description": "   "})
    assert response.status_code == 422


def test_rejects_missing_job_description():
    assert client.post("/api/keywords", json={}).status_code == 422


def test_rejects_too_long_job_description():
    response = client.post("/api/keywords", json={"job_description": "a " * 10_001})
    assert response.status_code == 422
