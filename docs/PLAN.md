# ATS CV Builder: Full Product Plan

## Context
The repo is empty (only `.gitignore` with a Python template, `CLAUDE.md`, and `.claude/settings.json`), with remote `origin` set to `github.com/Khayal07/ats-cv-builder`. We are building the full product, not just the MVP:
- a resume editor with live preview
- ATS-friendly PDF export with 3 switchable templates
- rule-based job-description keyword scoring (the core feature)
- Supabase auth and multi-resume persistence
- AI bullet rewriting as an optional add-on
- tests and CI
- deployment to Vercel and Render
- optionally, DOCX export

Every phase ends in a working, deployable state. The first deploy happens as soon as an end-to-end flow exists. After that, Vercel and Render auto-deploy on every push to `main`.

Environment: Node 24, npm 11, Python 3.12, Windows. No Docker.

### Decisions so far
| Topic | Decision |
|---|---|
| PDF | `@react-pdf/renderer` on the client, with embedded static TTFs: **Noto Sans** and **Noto Serif**, which cover ə ı ğ ş ç ö ü İ. Hyphenation is off, and bullets are a literal `•` character. |
| Keywords | Rule-based, pure Python. This is the core scoring. AI only builds on its output. |
| Python deps | pip, `requirements.txt` and `requirements-dev.txt`, venv in `backend/.venv` |
| Data access | Next.js reads and writes resumes **directly in Supabase with RLS**. FastAPI handles only scoring and AI. It verifies the Supabase JWT and enforces per-user AI limits in Postgres. |
| Guests | Guests build one resume in localStorage and get scoring and PDF export. Signing up offers to import it. Multiple resumes and AI require login. |
| Auth | Email and password (with confirmation and reset), plus Google OAuth |
| Supabase | A hosted project only. Migrations are versioned in `/supabase/migrations` and applied with `supabase db push` (CLI through `npx`, pinned version). |
| Deploy | Vercel (frontend) and Render (backend) |
| Git | Work on `main`, and after every step run `git add`, `git commit`, `git push`. Commits are short conventional English messages with no AI mention and no attribution. |

### Why @react-pdf/renderer
- It writes real PDF text objects, so output is selectable and extractable in single-column reading order.
- It looks the same in every browser and needs no server.
- It supports embedded TTFs, which Azerbaijani needs. It needs static font files, not variable fonts.
- Templates are data (`TemplateSpec`) consumed by both the HTML preview and the PDF document. That gives 2 renderers × 3 specs instead of 6 components, and keeps the preview and PDF in sync.

## Folder structure
```
ats-cv-builder/
├─ README.md
├─ .github/workflows/ci.yml
├─ supabase/{config.toml, migrations/*.sql}
├─ frontend/
│  ├─ public/fonts/  NotoSans-*.ttf, NotoSerif-*.ttf (Regular/Bold/Italic/BoldItalic), OFL.txt
│  ├─ e2e/           Playwright specs
│  └─ src/
│     ├─ app/
│     │  ├─ page.tsx                 landing
│     │  ├─ builder/page.tsx         guest editor (localStorage)
│     │  ├─ (auth)/login, signup, reset-password, update-password
│     │  ├─ auth/callback/route.ts   OAuth / PKCE code exchange
│     │  ├─ auth/confirm/route.ts    email confirmation (token_hash)
│     │  ├─ dashboard/page.tsx       list / create / duplicate / rename / delete resumes
│     │  └─ resumes/[id]/page.tsx    signed-in editor
│     ├─ proxy.ts                    session refresh + route protection (Next 16 "proxy", formerly middleware)
│     ├─ components/
│     │  ├─ editor/   ResumeEditor (shared by guest and signed-in), section forms, EntryList, BulletListInput
│     │  ├─ preview/  ResumePreview (HTML, driven by TemplateSpec), TemplateSwitcher
│     │  ├─ pdf/      ResumeDocument (react-pdf, driven by TemplateSpec), fonts.ts, DownloadPdfButton
│     │  ├─ match/    JobMatchPanel, ScoreBadge, KeywordChips, SuggestionList
│     │  └─ ai/       AiRewriteButton, RewriteReviewDialog (accept/reject per bullet)
│     ├─ lib/
│     │  ├─ resume/   types.ts, defaults.ts, sample.ts, format.ts, validate.ts, migrate.ts
│     │  ├─ templates/ types.ts, classic.ts, modern.ts, compact.ts, index.ts
│     │  ├─ storage/  adapter.ts (interface), local.ts, supabase.ts
│     │  ├─ supabase/ client.ts (browser), server.ts (server components/route handlers)
│     │  └─ api.ts    typed backend client (attaches the Supabase access token when signed in)
│     └─ state/ResumeProvider.tsx    useReducer + debounced save through a storage adapter
└─ backend/
   ├─ requirements.txt, requirements-dev.txt, .env.example
   ├─ app/
   │  ├─ main.py
   │  ├─ core/     config.py (pydantic-settings), auth.py (JWT verify), ratelimit.py, db.py
   │  ├─ api/      routes_score.py, routes_ai.py
   │  ├─ models.py Pydantic models mirroring the TS Resume type
   │  ├─ services/ text.py, keywords.py, matching.py, suggestions.py
   │  ├─ services/ai/ client.py (OpenAI wrapper), prompts.py, rewrite.py
   │  └─ data/     stopwords_en.txt, stopwords_az.txt, skills.json (canonical + synonyms)
   └─ tests/       one test module per service + test_api_*.py
```

## Resume data schema (TS source of truth, mirrored in Pydantic)
```ts
type YearMonth = string;                      // "YYYY-MM"
type TemplateId = "classic" | "modern" | "compact";
interface Resume {
  schemaVersion: 1;
  basics: { fullName; headline; email; phone; location; links: { id; label; url }[] };
  summary: string;
  experience: { id; company; role; location; startDate: YearMonth; endDate: YearMonth | null; bullets: string[] }[];
  education:  { id; institution; degree; field; location; startDate: YearMonth; endDate: YearMonth | null; details: string[] }[];
  skills:     { id; category; items: string[] }[];
  projects:   { id; name; url; startDate: YearMonth | null; endDate: YearMonth | null; bullets: string[] }[];
}
interface ResumeDoc { id; title; template: TemplateId; pageSize: "A4" | "LETTER"; data: Resume; jobDescription: string; updatedAt }
```
- Dates always render as `MMM YYYY – MMM YYYY` or `– Present`, through a single `formatDateRange()`.
- Sections always appear in a fixed order with standard headings: Summary, Experience, Education, Skills, Projects. Empty sections are hidden.
- The contact line is plain text separated by ` | `, with URLs shown as text. No icons, images, or tables.
- `migrate.ts` upgrades older `schemaVersion` data, both from localStorage and from the database.

### Templates (all single column with real text)
| Template | Font | Style |
|---|---|---|
| Classic | Noto Serif | Centered name, uppercase headings with a rule underneath, 11pt body |
| Modern | Noto Sans | Left-aligned name, small-caps headings with a thin accent rule, 10.5pt body |
| Compact | Noto Sans | Tighter spacing and a 10pt body, built to fit one page |

## Database (Supabase Postgres)
```sql
-- public.resumes: exposed through the Data API and protected by RLS
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled resume' check (char_length(title) between 1 and 120),
  template text not null default 'classic' check (template in ('classic','modern','compact')),
  page_size text not null default 'A4' check (page_size in ('A4','LETTER')),
  data jsonb not null check (pg_column_size(data) < 200000),
  job_description text check (char_length(job_description) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.resumes (user_id, updated_at desc);
alter table public.resumes enable row level security;
grant select, insert, update, delete on public.resumes to authenticated;   -- nothing for anon
-- 4 policies, all `to authenticated` with an ownership check (select auth.uid()) = user_id;
-- update has both USING and WITH CHECK
-- updated_at trigger function: security invoker, set search_path = ''

-- private.ai_usage: not exposed. Only the backend writes to it, over a direct Postgres connection.
create schema private;
create table private.ai_usage (user_id uuid not null, day date not null, count int not null default 0,
                               primary key (user_id, day));
revoke all on schema private from anon, authenticated;
```
The rate limit is one atomic statement: `insert ... on conflict (user_id, day) do update set count = ai_usage.count + 1 returning count`. If the result exceeds `AI_DAILY_LIMIT`, the backend returns 429. After each migration, run `supabase db advisors` (or the Supabase MCP `get_advisors`) and fix what it reports.

## API (FastAPI)
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/health` | none | none | `{status}` |
| POST | `/api/keywords` | none | `{job_description}` | `{keywords:[{term, weight, category}]}` |
| POST | `/api/score` | none | `{resume, job_description}` | `{score, matched:[{term, weight, sections}], missing:[{term, weight}], suggestions:[{type, severity, message}]}` |
| GET | `/api/ai/status` | optional | none | `{enabled, daily_limit, remaining \| null}` |
| POST | `/api/ai/rewrite-bullets` | **required** | `{bullets (≤10), role, job_description}` | `{rewrites:[{original, rewritten, keywords_used}]}` |

### Rule-based scoring (core)
- **Normalize:** NFC, then Azerbaijani-aware lowercasing (`İ→i`, `I→ı`), then a Unicode tokenizer that keeps tokens like `c++`, `c#`, `.net`, `node.js`.
- **Extract:** remove EN and AZ stopwords, build 1–3-gram candidates, and look them up in `skills.json` (synonyms such as `js→JavaScript` and `k8s→Kubernetes`). Weight = (2.0 for a known skill, 1.0 otherwise) × min(frequency, 3). Keep the top 30.
- **Match:** word-boundary matching of each term and its synonyms, broken down by section. Score = 100 × matched weight / total weight.
- **Suggestions:**
  - missing high-weight keywords
  - keywords that appear only in Skills ("show it in an Experience bullet")
  - empty summary
  - bullets with no numbers
  - bullets over about 30 words
  - missing email
  - empty standard sections

### Auth in the backend
`core/auth.py` reads the `Authorization: Bearer <supabase access token>` header and verifies it with PyJWT against the project JWKS (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`). It checks `aud=authenticated` and the `iss`, and uses `sub` as the user id. If `SUPABASE_JWT_SECRET` is set, it falls back to HS256 for projects still on legacy keys. I'll check the current Supabase JWT docs before implementing this.

### AI add-on (degrades gracefully)
- With no `OPENAI_API_KEY`, `/api/ai/status` returns `enabled:false`, the UI hides or disables the AI button with a tooltip, and the rewrite endpoint returns 503 `{code:"ai_disabled"}`. Everything else keeps working.
- Each rewrite request receives the **missing keywords from the rule-based scorer**. The prompt says to stay truthful: no invented employers, numbers, or tools, and keywords go in only where they plausibly fit. The response uses OpenAI structured output, validated by Pydantic. The job description is treated as untrusted input and truncated.
- `OPENAI_MODEL` comes from an env var. I'll pick the default from the current OpenAI docs when building the step. Requests time out after 30s and upstream errors map to 502.
- The limit is per user per day (`AI_DAILY_LIMIT`, default 20) and returns 429 with `Retry-After`.
- In the UI, each Experience/Project entry gets an "Improve with AI" button, which opens a dialog showing original and suggested bullets so the user can accept or reject each one.
- The AI is wrapped behind an interface. Tests inject a fake client, so they never call OpenAI.

## Environment variables
| Where | Variable | Notes |
|---|---|---|
| Vercel / `frontend/.env.local` | `NEXT_PUBLIC_SITE_URL` | Base URL for auth redirects |
| | `NEXT_PUBLIC_API_URL` | Render backend URL |
| | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (or legacy anon) key. **Never** the secret or service_role key. |
| Render / `backend/.env` | `ALLOWED_ORIGINS` | Comma-separated list (localhost plus the Vercel domain) |
| | `SUPABASE_URL` | Used for JWKS and the issuer check |
| | `SUPABASE_JWT_SECRET` | Optional, only for legacy HS256 projects |
| | `DATABASE_URL` | Supabase pooler connection string (IPv4), used only for `private.ai_usage` |
| | `OPENAI_API_KEY` | Optional. Leaving it unset disables AI. |
| | `OPENAI_MODEL`, `AI_DAILY_LIMIT` (20), `AI_TIMEOUT_SECONDS` (30) | Defaults live in `config.py` |
| Supabase dashboard | Site URL, redirect URLs, Google OAuth client ID/secret | Set in the dashboard, not as env vars. The steps go in the README. |
| GitHub Actions | none required | CI uses dummy public values. Optional `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` enable the signed-in E2E test. |

`backend/.env` and `frontend/.env.local` are gitignored. Only the `.env.example` files are committed.

## Dependencies (approving this plan approves these; I'll name each one again when it is added)
- **Frontend:** create-next-app defaults, `@react-pdf/renderer`, `@supabase/supabase-js`, `@supabase/ssr`. Dev: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test`, `pdfjs-dist` (PDF text-extraction test), `supabase` CLI (pinned, run through npx).
- **Backend:** `fastapi`, `uvicorn[standard]`, `pydantic-settings`, `PyJWT[crypto]`, `psycopg[binary]`, `openai`. Dev: `pytest`, `httpx`, `ruff`.
- **Phase 8 (optional):** `docx`.
- **Fonts:** Noto Sans and Noto Serif static TTFs (SIL OFL).

## Phases and steps
Each step ends with lint, tests, and build passing locally, followed by a commit and push.

### Phase 1: Scaffold and CI
1. `chore: add readme and gitignore entries`: Node/Next/env entries.
2. `chore: scaffold next.js frontend`: create-next-app (TS, Tailwind, App Router, ESLint, `src/`), with vitest set up and one smoke test.
3. `chore: scaffold fastapi backend`: `/health`, `config.py`, CORS, `.env.example`, and a pytest health test.
4. `chore: add ci workflow`: frontend job (`npm ci`, lint, typecheck, vitest, build) and backend job (ruff, pytest).

### Phase 2: Guest editor, preview, PDF, then **deploy the frontend**
1. `feat: add resume types, defaults and date formatting`: with tests.
2. `feat: add resume state with storage adapter`: `ResumeProvider`, a localStorage adapter, the `/builder` two-pane layout, and the basics and summary forms with preview. Includes tests for the reducer and adapter.
3. `feat: add experience section`: `EntryList` (add/remove/move) and `BulletListInput`, with a component test.
4. `feat: add education, projects and skills sections`
5. `feat: add json import/export and sample data`
6. `feat: add pdf export with embedded noto fonts`: `ResumeDocument`, font registration, a lazy-loaded download button, and PDF metadata.
7. `test: add guest flow e2e`: Playwright fills the form, checks the preview, and downloads the PDF. `pdfjs-dist` then confirms the headings and `ə ı ğ ş` are extractable as text. Added to CI.
8. `chore: deploy frontend to vercel`: you connect the repo in the dashboard (root `frontend`), then the README deploy section is added. **First deploy:** the guest builder and PDF work in production.

### Phase 3: Rule-based scoring, then **deploy the backend** (first full UI → API → result flow)
Steps 1–4 use TDD.
1. `feat: add text normalization and tokenizer`
2. `feat: add job description keyword extraction`: `/api/keywords`
3. `feat: add resume match scoring`: `/api/score`
4. `feat: add improvement suggestions`
5. `feat: add job match panel`: score, chips, suggestions, loading and error states, and a cold-start message. Includes an E2E test with the API mocked.
6. `chore: deploy backend to render`: `render.yaml`, set `ALLOWED_ORIGINS`, set `NEXT_PUBLIC_API_URL` on Vercel, and document the env vars. Check: production scoring works with no CORS errors.

### Phase 4: Three templates
1. `refactor: drive preview and pdf from template spec`: Classic becomes the first `TemplateSpec`, and the output is unchanged.
2. `feat: add modern and compact templates`: add the Noto Serif/Sans files as needed.
3. `feat: add template switcher and page size toggle`: saved through the adapter. Includes an E2E test that switches templates and checks the PDF text.

### Phase 5: Supabase auth and persistence, then redeploy
1. `chore: init supabase project config`: `supabase init` and `link`, documented in the README. You create the hosted project and share the project ref.
2. `feat: add resumes table with rls`: migration, advisors clean, pushed with `supabase db push`. Verify RLS: user A cannot read user B's rows.
3. `feat: add supabase clients and session proxy`: `lib/supabase/*` and `proxy.ts` (`getClaims()`), which protects `/dashboard` and `/resumes/*`.
4. `feat: add email/password auth`: sign up, confirm, log in, log out, and reset or update the password.
5. `feat: add google oauth sign-in`: callback route. You configure the Google Cloud client and the Supabase provider, and the README documents how.
6. `feat: add resume dashboard`: list, create, duplicate, rename, delete.
7. `feat: add supabase storage adapter with autosave`: `/resumes/[id]` reuses `ResumeEditor`, saves with a ~1s debounce, and shows a "Saved/Saving…" indicator. Last write wins.
8. `feat: import guest resume after sign-up`: offered once, after which the local copy is cleared.
9. `feat: verify supabase jwt in backend`: `core/auth.py` with tests (valid, expired, wrong audience, missing). Not yet required by any existing endpoint.
10. `chore: configure production auth`: Vercel env vars and Supabase redirect URLs, then a smoke test of signup → save → reload in production.

### Phase 6: AI bullet rewriting (add-on)
1. `feat: add ai usage rate limiter`: `private.ai_usage` migration, `ratelimit.py`, and tests. Tests use an in-memory fake. A Postgres integration test is skipped when `DATABASE_URL` is unset.
2. `feat: add ai status and rewrite endpoints`: OpenAI wrapper, prompts, structured output, and graceful 503/429/502 responses. Tests use a fake client and cover: AI disabled, auth required, rate limited, and invalid model output.
3. `feat: add ai rewrite review dialog`: the button is hidden when AI is disabled or the user is a guest, the dialog accepts or rejects each bullet, and the remaining quota is shown. Includes an E2E test with the API mocked.
4. `chore: enable ai in production`: set `OPENAI_API_KEY`, `DATABASE_URL`, and `OPENAI_MODEL` on Render. Smoke test it, and also check the no-key path.

### Phase 7: Hardening, polish, and docs
1. `feat: add form validation`: required name, email and URL format, date order, with inline messages and a warning before export.
2. `feat: polish responsive layout and accessibility`: Edit/Preview/Match tabs on mobile, labels, focus states, empty states.
3. `feat: add basic ip rate limit to public endpoints`: in-memory, with no new dependency.
4. `test: extend e2e and api edge cases`: signed-in E2E (skipped without `E2E_*` secrets), oversized JD, malformed resume.
5. `docs: finalize readme`: architecture, local setup, env var table, Supabase setup (migrations, auth providers), deploy steps for Vercel and Render, ATS rules, screenshots.

### Phase 8 (optional): DOCX export
1. `feat: add docx export`: the `docx` package on the client, driven by the same `Resume` and `TemplateSpec`. It uses Arial/Times New Roman, which Word supports for Azerbaijani characters. The DOCX is single column with real paragraphs and real bullet lists, and no tables or text boxes.
2. `test: add docx export tests`: unzip the file and check the `document.xml` text, headings, and AZ characters.

## Verification
- **Every step:** frontend `npm run lint && npx tsc --noEmit && npm test && npm run build`, and backend `ruff check . && pytest`. CI runs the same checks plus Playwright on every push.
- **UI steps:** run `npm run dev` together with `uvicorn`, and check them in a browser with the Playwright MCP.
- **PDF and DOCX:** an automated text-extraction test (headings in order, AZ characters, no split words), plus a manual select-and-copy check.
- **Supabase:** advisors are clean after each migration, and a two-user RLS check confirms no cross-user reads or writes.
- **Deploys** (end of Phases 2, 3, 5, 6): a production smoke test of the flow that phase added.

## What I'll need from you during execution
- Connect Vercel and Render to the GitHub repo (Phases 2 and 3).
- Create the Supabase project and share its ref, and log in to the Supabase CLI (`! npx supabase login`) (Phase 5).
- Create the Google OAuth client and paste its credentials into the Supabase dashboard (Phase 5).
- Add `OPENAI_API_KEY` to `backend/.env` locally and on Render (Phase 6).

Note: on the free tiers, Render services sleep when idle (the UI shows a "waking up" state) and Supabase projects pause after about a week of inactivity.
