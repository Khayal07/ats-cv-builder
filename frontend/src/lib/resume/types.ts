/** "YYYY-MM", as produced by <input type="month">. */
export type YearMonth = string;

export const RESUME_SCHEMA_VERSION = 1 as const;

export interface Link {
  id: string;
  label: string;
  url: string;
}

export interface Basics {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: Link[];
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: YearMonth;
  /** null means "Present". */
  endDate: YearMonth | null;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: YearMonth;
  endDate: YearMonth | null;
  details: string[];
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  url: string;
  startDate: YearMonth | null;
  endDate: YearMonth | null;
  bullets: string[];
}

export interface Resume {
  schemaVersion: typeof RESUME_SCHEMA_VERSION;
  basics: Basics;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
}

export const TEMPLATE_IDS = ["classic", "modern", "compact"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const PAGE_SIZES = ["A4", "LETTER"] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface DocumentSettings {
  template: TemplateId;
  pageSize: PageSize;
}

/** Everything the editor persists for one resume. */
export interface EditorDocument {
  resume: Resume;
  settings: DocumentSettings;
  jobDescription: string;
}

/** Section keys that hold a list of entries. */
export type EntrySectionKey = "experience" | "education" | "skills" | "projects";

/** Standard ATS headings, in the fixed render order. */
export const SECTION_HEADINGS = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
} as const;

export type SectionKey = keyof typeof SECTION_HEADINGS;

export const SECTION_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
];
