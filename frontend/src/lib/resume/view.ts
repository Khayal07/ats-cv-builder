/**
 * Pure helpers that turn resume data into the text shown in the output.
 * Shared by the HTML preview and the PDF document so both always agree.
 */
import { isBlank } from "./format";
import {
  SECTION_ORDER,
  type EducationEntry,
  type ExperienceEntry,
  type ProjectEntry,
  type Resume,
  type SectionKey,
  type SkillGroup,
} from "./types";

export function cleanList(items: string[]): string[] {
  return items.map((item) => item.trim()).filter((item) => item.length > 0);
}

export function joinParts(parts: (string | null | undefined)[], separator: string): string {
  return parts
    .map((part) => (part ?? "").trim())
    .filter((part) => part.length > 0)
    .join(separator);
}

const anyText = (...values: (string | null | undefined)[]) => values.some((v) => !isBlank(v));

export function experienceHasContent(entry: ExperienceEntry): boolean {
  return anyText(entry.company, entry.role, entry.location) || cleanList(entry.bullets).length > 0;
}

export function educationHasContent(entry: EducationEntry): boolean {
  return (
    anyText(entry.institution, entry.degree, entry.field, entry.location) ||
    cleanList(entry.details).length > 0
  );
}

export function skillGroupHasContent(group: SkillGroup): boolean {
  return cleanList(group.items).length > 0;
}

export function projectHasContent(entry: ProjectEntry): boolean {
  return anyText(entry.name, entry.url) || cleanList(entry.bullets).length > 0;
}

/** Sections that have something to show, in the fixed ATS order. */
export function visibleSections(resume: Resume): SectionKey[] {
  const has: Record<SectionKey, boolean> = {
    summary: !isBlank(resume.summary),
    experience: resume.experience.some(experienceHasContent),
    education: resume.education.some(educationHasContent),
    skills: resume.skills.some(skillGroupHasContent),
    projects: resume.projects.some(projectHasContent),
  };
  return SECTION_ORDER.filter((key) => has[key]);
}

/** "Senior Software Engineer — Kapital Tech" */
export function experienceTitle(entry: ExperienceEntry): string {
  return joinParts([entry.role, entry.company], " — ");
}

/** "BSc, Computer Engineering" */
export function educationDegree(entry: EducationEntry): string {
  return joinParts([entry.degree, entry.field], ", ");
}

/** "Languages: TypeScript, Python" (or just the items when there is no category). */
export function skillLine(group: SkillGroup): string {
  const items = cleanList(group.items).join(", ");
  return isBlank(group.category) ? items : `${group.category.trim()}: ${items}`;
}

/** "Open Budget Tracker | github.com/x/budget" */
export function projectTitle(entry: ProjectEntry): string {
  return joinParts([entry.name, entry.url], " | ");
}
