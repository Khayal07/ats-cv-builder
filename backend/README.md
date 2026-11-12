# Backend

FastAPI service for keyword extraction, match scoring and (later) AI suggestions.

## Setup

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
```

## Commands

| Command | Description |
|---|---|
| `uvicorn app.main:app --reload` | Dev server on http://localhost:8000 (docs at `/docs`) |
| `pytest` | Tests |
| `ruff check .` | Lint |
| `ruff format .` | Format |
