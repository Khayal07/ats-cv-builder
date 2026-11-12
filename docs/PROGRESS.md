# Progress

Tracks execution of [PLAN.md](PLAN.md). Updated in the same commit as every completed step.
A commit cannot contain its own hash: the newest row says "this commit" and gets its hash in the next step's commit.

## Status

- **Phase 3 code is complete.** The Vercel and Render deploys are waiting on the user (see Manual TODOs). After that comes the production smoke test, then **Phase 4, Step 1**.
- Phase 2, Step 8 (Vercel deploy): the docs are committed, but the deploy waits on the user connecting Vercel (see Manual TODOs).

## Done

### Phase 1: Scaffold and CI
| Step | Commit | Summary |
|---|---|---|
| 1.1 | `27be123` | README, Node/Python/Playwright/Supabase gitignore entries |
| 1.2 | `25d3165` | Next.js 16 frontend (TS, Tailwind v4, App Router, `src/`), vitest smoke test |
| 1.3 | `493827a` | FastAPI backend with `/health`, settings, CORS, pytest |
| 1.4 | `6a3a635` | GitHub Actions CI (frontend lint/typecheck/test/build, backend ruff/pytest), `.gitattributes` LF |

### Phase 2: Guest editor, preview, PDF
| Step | Commit | Summary |
|---|---|---|
| 2.1 | `c09feeb` | Resume types, defaults, sample (with Azerbaijani text), date formatting + tests |
| (fix) | `2ab21c0` | Fix broken venv activation path in README |
| 2.2 | `8a8076e` | `ResumeProvider` + reducer, localStorage adapter, tolerant JSON parser, `/builder` two-pane layout, contact and summary forms, HTML preview |
| 2.3 | `7b8768f` | Experience section: `EntryList` (add/remove/reorder), `BulletListInput`, `DateRangeFields`, component tests |
| 2.4 | `81ecc70` | Education, Skills, Projects sections |
| 2.5 | `72f4011` | JSON import/export, Load sample, Clear |
| 2.6 | `e90b130` | PDF export with `@react-pdf/renderer` and embedded Noto Serif/Sans |
| 2.7 | `dbab927` | Playwright E2E for the guest flow; PDF text checked with `pdfjs-dist`; E2E added to CI |
| 2.8 | `fc3194c` | Vercel deployment docs in README (the deploy itself is pending, see Manual TODOs) |
| (docs) | `d4a15e7` | `docs/PLAN.md`, `docs/PROGRESS.md`, session rules in CLAUDE.md |

### Phase 3: Rule-based scoring
| Step | Commit | Summary |
|---|---|---|
| 3.1 | `23f2168` | `services/text.py`: NFC + i-folding match keys, tokenizer keeping `c++`/`c#`/`.net`/`node.js`/`ci/cd`, phrase segments, EN/AZ stopword lists; 31 tests |
| 3.2 | `9f82038` | `services/keywords.py` + `POST /api/keywords`: 118-skill catalog with synonyms (`data/skills.json`), greedy longest alias match, repeated 1–3-word phrases with absorption, JD noise list (EN/AZ), weights and top 30; JD 1–20,000 chars, blank → 422 |
| 3.3 | `0774601` | Pydantic `Resume` models (camelCase, lenient, size-capped), `services/matching.py`, `POST /api/score` (score, matched with sections, missing by weight); 69 backend tests |
| 3.4 | `741f862` | `services/suggestions.py` wired into `/api/score`: missing keywords (top 5), skill only in Skills, missing email, empty summary, empty Experience/Education/Skills, bullets without numbers, bullets over 30 words, JD with no keywords; sorted by severity; 80 backend tests |
| 3.5 | `3cfe513` | "Match a job" tab: `lib/api.ts` typed client (90 s timeout, error kinds), `JobMatchPanel` (JD saved with the resume, score meter, found/missing chips with sections, suggestions, stale-result note, "server is waking up" after 5 s), component tests and 2 E2E tests with the API mocked; verified against the real local backend |
| 3.6 | this commit | `render.yaml` Blueprint (free web service, root `backend`, health check `/health`, `ALLOWED_ORIGINS` prompted), README Render + Vercel env docs. The deploy itself waits on the user |

## Decisions

- **Font subsetting:** the Noto TTFs were subset with fontTools (`pyftsubset`) to Latin, IPA (`ə`), Cyrillic, punctuation, and currency (`₼`), without hinting. Each file is about 200 KB instead of about 600 KB. Coverage of ə Ə ı İ ğ ş ç ö ü • – ₼ was verified. The command is in `frontend/public/fonts/README.md`.
- **CSS font loading:** the preview loads the same `/public/fonts` files through `@font-face` in `globals.css` instead of `next/font/local`. The preview and the PDF then share one copy of the files, and react-pdf needs public URLs anyway.
- **`@types/node` 24:** create-next-app pinned `^20`, and vitest 5 requires `@types/node` 22 or later as a peer dependency. 24 matches the local runtime (Node 24) and CI.
- **`@testing-library/dom`:** a required peer of `@testing-library/react`. `@vitejs/plugin-react` and `vite-tsconfig-paths` were not needed: JSX compiles without them, and the `@/` alias is set in `vitest.config.mts`.
- **Typecheck script:** `next typegen && tsc --noEmit`, because `LayoutProps`/`PageProps` are generated globals in Next 16.
- **Tailwind v4 tokens:** colors go in a plain `@theme` block (so `var(--color-*)` exists at runtime) and fonts in `@theme inline` (their variables come from next/font classes).
- **Filenames:** Azerbaijani letters are transliterated passport-style (`ə→a`, `ş→s`, …), e.g. `Aysel_Mammadova_Resume.pdf`.
- **Storage adapter interface** (`load`/`save`): the guest editor uses localStorage now, and the Supabase adapter plugs in at Phase 5 without changing the editor.
- **E2E target:** `E2E_BASE_URL` points Playwright at a running app (a local dev server or a deployment). Next 16 refuses a second dev server in the same folder.
- **Matching keys fold every i variant:** the plan said "AZ-aware lowercasing (`İ→i`, `I→ı`)". Instead, keys fold `İ`, `I`, `ı` and `i` all to `i`. That needs no language detection, gives "IŞIQ" = "ışıq" = "İşıq", and keeps English "I" → "i". The cost is that `ı`/`i` minimal pairs collide, which is negligible for keyword matching. Display uses the original spelling.
- **Ambiguous skill names:** catalog entries can set `match_name: false`, so a skill whose name is also a common English word is only found through its unambiguous aliases (Go → `golang`, Express → `express.js`, Excel → `microsoft excel`/`advanced excel`).
- **Phrase keywords need a repeat:** a non-skill phrase needs at least 2 occurrences, and generic JD verbs/nouns are in `data/jd_noise.txt`. This keeps one-off words like "design" or "build" out of the score. At equal weight, skills rank above phrases.
- **Matching details:** keyword variants are matched as token sequences inside phrase segments of each section. The headline counts as Summary. A light plural fold (strip a trailing `s` from words longer than 3 letters, not `ss`) is applied to both sides so "pipelines" matches "pipeline". Score = round(100 × matched weight / total weight); a JD with no keywords scores 0.
- **Job match placement:** "Match a job" is a tab next to "Resume" in the left column, so the preview stays visible. Both panels stay mounted, so results survive switching tabs. A full mobile tab layout comes in Phase 7.
- **Known, accepted:** `npm audit` reports 7 moderate findings in dev-only ESLint tooling. Starlette suggests `httpx2` for TestClient (a deprecation warning only); the approved `httpx` stays.

## Manual TODOs

| What | Phase | Status |
|---|---|---|
| Connect the GitHub repo to Vercel (Root Directory `frontend`, Node 24) and share the production URL | 2 | Pending |
| Create the Render service from the Blueprint (`render.yaml`), enter `ALLOWED_ORIGINS` = Vercel URL, share the Render URL | 3 | Pending |
| Set `NEXT_PUBLIC_API_URL` on Vercel to the Render URL and redeploy | 3 | Pending |
| Create the hosted Supabase project, share the project ref, run `npx supabase login` | 5 | Not started |
| Create the Google OAuth client and configure the Supabase Google provider and redirect URLs | 5 | Not started |
| Add `OPENAI_API_KEY` to `backend/.env` locally and on Render | 6 | Not started |

## Deployments

None yet.

## Next

1. When the user shares the Vercel and Render URLs: smoke test `GET /health`, then run `E2E_BASE_URL=<vercel-url> npm run test:e2e` and do a manual production "Check match" (no CORS errors). Record the results under Deployments.
2. Then Phase 4, Step 1: `refactor: drive preview and pdf from template spec`. Classic becomes the first `TemplateSpec` and the output stays unchanged.
