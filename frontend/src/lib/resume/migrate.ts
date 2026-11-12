import { createId, emptyResume } from "./defaults";
import {
  PAGE_SIZES,
  RESUME_SCHEMA_VERSION,
  TEMPLATE_IDS,
  type DocumentSettings,
  type EditorDocument,
  type PageSize,
  type Resume,
  type TemplateId,
} from "./types";

type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown): string => (typeof value === "string" ? value : "");
const strOrNull = (value: unknown): string | null => (value === null ? null : str(value));
const strArr = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const objArr = (value: unknown): Obj[] => (Array.isArray(value) ? value.filter(isObj) : []);

/** Keeps existing ids, but replaces missing or duplicated ones. */
function idFactory() {
  const seen = new Set<string>();
  return (value: unknown): string => {
    let id = typeof value === "string" && value.length > 0 ? value : createId();
    if (seen.has(id)) id = createId();
    seen.add(id);
    return id;
  };
}

export function defaultSettings(): DocumentSettings {
  return { template: "classic", pageSize: "A4" };
}

export function defaultDocument(): EditorDocument {
  return { resume: emptyResume(), settings: defaultSettings(), jobDescription: "" };
}

/**
 * Turns untrusted JSON (localStorage, file import, database row) into a valid Resume.
 * Unknown fields are dropped, missing fields get defaults. Returns null when the input
 * is not a resume or comes from a newer, unsupported schema version.
 */
export function parseResume(raw: unknown): Resume | null {
  if (!isObj(raw)) return null;
  if (raw.schemaVersion !== undefined && raw.schemaVersion !== RESUME_SCHEMA_VERSION) {
    return null;
  }

  const base = emptyResume();
  const basics = isObj(raw.basics) ? raw.basics : {};
  const nextId = idFactory();

  return {
    ...base,
    basics: {
      fullName: str(basics.fullName),
      headline: str(basics.headline),
      email: str(basics.email),
      phone: str(basics.phone),
      location: str(basics.location),
      links: objArr(basics.links).map((link) => ({
        id: nextId(link.id),
        label: str(link.label),
        url: str(link.url),
      })),
    },
    summary: str(raw.summary),
    experience: objArr(raw.experience).map((entry) => ({
      id: nextId(entry.id),
      company: str(entry.company),
      role: str(entry.role),
      location: str(entry.location),
      startDate: str(entry.startDate),
      endDate: strOrNull(entry.endDate),
      bullets: strArr(entry.bullets),
    })),
    education: objArr(raw.education).map((entry) => ({
      id: nextId(entry.id),
      institution: str(entry.institution),
      degree: str(entry.degree),
      field: str(entry.field),
      location: str(entry.location),
      startDate: str(entry.startDate),
      endDate: strOrNull(entry.endDate),
      details: strArr(entry.details),
    })),
    skills: objArr(raw.skills).map((group) => ({
      id: nextId(group.id),
      category: str(group.category),
      items: strArr(group.items),
    })),
    projects: objArr(raw.projects).map((entry) => ({
      id: nextId(entry.id),
      name: str(entry.name),
      url: str(entry.url),
      startDate: strOrNull(entry.startDate),
      endDate: strOrNull(entry.endDate),
      bullets: strArr(entry.bullets),
    })),
  };
}

export function parseSettings(raw: unknown): DocumentSettings {
  const settings = isObj(raw) ? raw : {};
  const template = TEMPLATE_IDS.includes(settings.template as TemplateId)
    ? (settings.template as TemplateId)
    : "classic";
  const pageSize = PAGE_SIZES.includes(settings.pageSize as PageSize)
    ? (settings.pageSize as PageSize)
    : "A4";
  return { template, pageSize };
}

export function parseEditorDocument(raw: unknown): EditorDocument | null {
  if (!isObj(raw)) return null;
  const resume = parseResume(raw.resume);
  if (!resume) return null;
  return {
    resume,
    settings: parseSettings(raw.settings),
    jobDescription: str(raw.jobDescription),
  };
}
