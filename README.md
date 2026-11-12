# ATS CV Builder

Build an ATS-friendly resume, preview it live, export it as a PDF with real selectable text, and check it against a job description for keyword match, score, and suggestions.

> Status: in development. Phase 2 (guest editor + PDF export) is done; see the roadmap below.

## Features

Done:

- Resume form with live preview (Summary, Experience, Education, Skills, Projects), add/remove/reorder entries
- Guest mode: the resume is saved in the browser (localStorage); JSON import/export and a sample resume
- ATS-friendly PDF export: single column, selectable text, embedded Noto fonts (supports Azerbaijani characters: ə ı ğ ş ç ö ü İ)

Planned:

- Three switchable ATS-safe templates (Classic, Modern, Compact)
- Job description keyword extraction and match score with improvement suggestions (rule-based)
- Accounts with Supabase (email/password, Google) to save and edit multiple resumes; guest mode with localStorage
- Optional AI bullet rewriting (OpenAI), rate-limited per user, disabled gracefully without an API key
- Optional DOCX export

## Stack

| Part | Tech |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, `@react-pdf/renderer` |
| Backend | FastAPI (Python 3.12) for scoring, keyword extraction and AI |
| Auth / DB | Supabase (Postgres + Auth, Row Level Security) |
| Hosting | Vercel (frontend), Render (backend) |

## Repository structure

```
ats-cv-builder/
├─ frontend/   Next.js app
├─ backend/    FastAPI app
└─ supabase/   database migrations
```

## ATS output rules

- Single column, real selectable text (no images, icons, or tables)
- Standard headings: Summary, Experience, Education, Skills, Projects
- Standard fonts, simple bullet lists, consistent date format (`MMM YYYY – MMM YYYY` / `Present`)

## Roadmap

1. Scaffold and CI
2. Guest editor, live preview, PDF export (first deploy)
3. Rule-based keyword scoring (backend deploy)
4. Three templates
5. Supabase auth and multi-resume persistence
6. AI bullet rewriting
7. Validation, polish, docs
8. DOCX export (optional)

## Local development

Requirements: Node.js 22+ (24 recommended), Python 3.12.

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm test             # unit and component tests (Vitest)
npm run lint && npm run typecheck && npm run build
npx playwright install chromium   # once
npm run test:e2e     # end-to-end tests (starts a dev server on :3200)
# or against a running app: E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload   # http://localhost:8000, docs at /docs
pytest
ruff check . && ruff format --check .
```

CI (GitHub Actions) runs the same checks on every push to `main`.

## Deployment

### Frontend on Vercel

1. In Vercel, **Add New → Project** and import the GitHub repository.
2. Set **Root Directory** to `frontend`. The framework preset is detected as Next.js; keep the default build and output settings.
3. Set the Node.js version to 24 (Project Settings → Build and Deployment).
4. Deploy. Every push to `main` deploys to production; pull requests get preview URLs.

Environment variables (Project Settings → Environment Variables):

| Variable | Needed from | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Phase 3 (scoring) | URL of the Render backend, e.g. `https://ats-cv-builder-api.onrender.com` |

More variables (Supabase, site URL) are added in later phases and listed here as they arrive.
