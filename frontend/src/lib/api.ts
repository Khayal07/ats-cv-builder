import type { Resume } from "@/lib/resume/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

/** Generous because a free Render instance can take ~50 s to wake up. */
const REQUEST_TIMEOUT_MS = 90_000;

export const MAX_JOB_DESCRIPTION_CHARS = 20_000;

export type SectionName = "summary" | "experience" | "education" | "skills" | "projects";
export type KeywordCategory = "skill" | "phrase";
export type Severity = "high" | "medium" | "low";

export interface Keyword {
  term: string;
  weight: number;
  category: KeywordCategory;
}

export interface MatchedKeyword extends Keyword {
  sections: SectionName[];
}

export interface Suggestion {
  type: string;
  severity: Severity;
  message: string;
  term: string | null;
}

export interface ScoreResult {
  score: number;
  matched: MatchedKeyword[];
  missing: Keyword[];
  suggestions: Suggestion[];
}

export type ApiErrorKind = "network" | "timeout" | "invalid" | "server";

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (timeout.aborted) {
      throw new ApiError("timeout", "The scoring server took too long to answer. Try again.");
    }
    if (signal?.aborted) throw error;
    throw new ApiError("network", "The scoring server can't be reached. Check your connection and try again.");
  }

  if (response.status === 422) {
    throw new ApiError("invalid", "The job description or resume couldn't be read. Check the text and try again.");
  }
  if (!response.ok) {
    throw new ApiError("server", `The scoring server returned an error (${response.status}). Try again in a moment.`);
  }
  return (await response.json()) as T;
}

export function scoreResume(resume: Resume, jobDescription: string, signal?: AbortSignal) {
  return postJson<ScoreResult>("/api/score", { resume, job_description: jobDescription }, signal);
}
