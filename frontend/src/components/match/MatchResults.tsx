import type { Keyword, MatchedKeyword, ScoreResult, SectionName, Severity } from "@/lib/api";

const SECTION_LABELS: Record<SectionName, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  high: "Fix first",
  medium: "Improve",
  low: "Polish",
};

const SEVERITY_STYLES: Record<Severity, string> = {
  high: "border-ink bg-ink text-white",
  medium: "border-ink text-ink",
  low: "border-rule text-ink-soft",
};

function scoreVerdict(score: number): string {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match: a few gaps";
  if (score >= 40) return "Partial match";
  return "Weak match";
}

function ScoreMeter({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <p className="text-5xl font-semibold tabular-nums tracking-tight text-ink">
          {score}
          <span className="text-2xl text-ink-soft">%</span>
        </p>
        <p className="text-sm font-medium text-ink">{scoreVerdict(score)}</p>
      </div>
      <div
        role="meter"
        aria-label="Keyword match"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-desk"
      >
        <div className="h-full rounded-full bg-marker" style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        Share of the job description&apos;s weighted keywords found in your resume.
      </p>
    </div>
  );
}

function MatchedChip({ keyword }: { keyword: MatchedKeyword }) {
  const where = keyword.sections.map((section) => SECTION_LABELS[section]).join(", ");
  return (
    <li className="rounded-md bg-marker-soft px-2 py-1 text-sm text-ink" title={`Found in ${where}`}>
      {keyword.term}
      <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">{where}</span>
    </li>
  );
}

function MissingChip({ keyword }: { keyword: Keyword }) {
  return (
    <li className="rounded-md border border-dashed border-ink-faint px-2 py-1 text-sm text-ink">
      {keyword.term}
    </li>
  );
}

function ChipGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">
        {title} · {count}
      </h3>
      {count === 0 ? <p className="text-sm text-ink-soft">None.</p> : <ul className="flex flex-wrap gap-1.5">{children}</ul>}
    </section>
  );
}

export function MatchResults({ result }: { result: ScoreResult }) {
  return (
    <div className="flex flex-col gap-6" data-testid="match-results">
      <ScoreMeter score={result.score} />
      <ChipGroup title="Found in your resume" count={result.matched.length}>
        {result.matched.map((keyword) => (
          <MatchedChip key={keyword.term} keyword={keyword} />
        ))}
      </ChipGroup>
      <ChipGroup title="Missing" count={result.missing.length}>
        {result.missing.map((keyword) => (
          <MissingChip key={keyword.term} keyword={keyword} />
        ))}
      </ChipGroup>
      <section>
        <h3 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">
          Suggestions · {result.suggestions.length}
        </h3>
        {result.suggestions.length === 0 ? (
          <p className="text-sm text-ink-soft">No suggestions: your resume covers this job well.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {result.suggestions.map((suggestion, index) => (
              <li key={`${suggestion.type}-${suggestion.term ?? index}`} className="flex items-start gap-3 text-sm text-ink">
                <span
                  className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${SEVERITY_STYLES[suggestion.severity]}`}
                >
                  {SEVERITY_LABELS[suggestion.severity]}
                </span>
                <span>{suggestion.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
