# ATS CV Builder

Build an ATS-friendly resume, preview it live, export it as a PDF with real selectable text, and check it against a job description for keyword match, score, and suggestions.

> Status: early development. See the roadmap below.

## Features (planned)

- Resume form with live preview (Summary, Experience, Education, Skills, Projects)
- ATS-friendly PDF export: single column, selectable text, embedded Noto fonts (supports Azerbaijani characters: ə ı ğ ş ç ö ü İ)
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

Setup instructions will be added as the frontend and backend are scaffolded.
