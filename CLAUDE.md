# ATS CV Builder

ATS-friendly CV builder: form, live preview, PDF export, and job-description keyword scoring.

## Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind
- Backend: FastAPI (Python)
- No auth or database in the MVP (state in localStorage)

## Structure
- /frontend: Next.js app
- /backend: FastAPI app (scoring, keyword extraction)

## ATS output rules
- Single column, real selectable text (no images, icons, or tables)
- Standard headings: Summary, Experience, Education, Skills, Projects
- Standard fonts, simple bullet lists, consistent date format

## Git rules
- After each completed step: git add, git commit, git push.
- Commit messages: short, English, conventional style (feat:, fix:, chore:).
- No AI mentions in commits or PRs: no Co-Authored-By, no "generated with", no attribution of any kind.

## Working rules
- At the start of every session, read docs/PLAN.md and docs/PROGRESS.md and continue from Next. After every completed step, update docs/PROGRESS.md in the same commit as the step. Never put secrets, keys or tokens in any file that is committed.
- Plan first, code after approval.
- Small steps, one commit per step, each step ends in a working state.
- Ask before adding new dependencies.
- Write tests for backend logic (scoring, keyword extraction).
- Keep README updated as the project evolves.