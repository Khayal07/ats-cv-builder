from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_health_returns_ok():
    client = TestClient(create_app(Settings(allowed_origins="http://localhost:3000")))
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_configured_origin():
    client = TestClient(create_app(Settings(allowed_origins="http://localhost:3000")))
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_rejects_unknown_origin():
    client = TestClient(create_app(Settings(allowed_origins="http://localhost:3000")))
    response = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in response.headers


def test_settings_parse_comma_separated_origins():
    settings = Settings(allowed_origins="http://a.test, https://b.test ,")
    assert settings.cors_origins == ["http://a.test", "https://b.test"]
