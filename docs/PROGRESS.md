# Progress

Tracks execution of [PLAN.md](PLAN.md). Updated in the same commit as every completed step.
A commit cannot contain its own hash: the newest row says "this commit" and gets its hash in the next step's commit.

## Status

- **Phase 3 (rule-based scoring), Step 2** is next.
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
| 3.1 | this commit | `services/text.py`: NFC + i-folding match keys, tokenizer keeping `c++`/`c#`/`.net`/`node.js`/`ci/cd`, phrase segments, EN/AZ stopword lists; 31 tests |

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
- **Known, accepted:** `npm audit` reports 7 moderate findings in dev-only ESLint tooling. Starlette suggests `httpx2` for TestClient (a deprecation warning only); the approved `httpx` stays.

## Manual TODOs

| What | Phase | Status |
|---|---|---|
| Connect the GitHub repo to Vercel (Root Directory `frontend`, Node 24) and share the production URL | 2 | Pending |
| Create a Render web service for `backend/` and share the URL | 3 | Not started |
| Set `NEXT_PUBLIC_API_URL` on Vercel and `ALLOWED_ORIGINS` on Render | 3 | Not started |
| Create the hosted Supabase project, share the project ref, run `npx supabase login` | 5 | Not started |
| Create the Google OAuth client and configure the Supabase Google provider and redirect URLs | 5 | Not started |
| Add `OPENAI_API_KEY` to `backend/.env` locally and on Render | 6 | Not started |

## Deployments

None yet.

## Next

Phase 3, Step 2: `feat: add job description keyword extraction`. This adds `services/keywords.py` (1–3-gram candidates within segments, JD noise words, a curated `skills.json` with synonyms, weight = (2.0 for a skill, 1.0 otherwise) × min(freq, 3), top 30), Pydantic models, and `POST /api/keywords` with a 1–20,000 character limit, written test-first.
