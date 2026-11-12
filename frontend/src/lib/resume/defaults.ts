import {
  RESUME_SCHEMA_VERSION,
  type EducationEntry,
  type ExperienceEntry,
  type Link,
  type ProjectEntry,
  type Resume,
  type SkillGroup,
} from "./types";

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyResume(): Resume {
  return {
    schemaVersion: RESUME_SCHEMA_VERSION,
    basics: { fullName: "", headline: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };
}

export function newLink(): Link {
  return { id: createId(), label: "", url: "" };
}

export function newExperience(): ExperienceEntry {
  return {
    id: createId(),
    company: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    bullets: [""],
  };
}

export function newEducation(): EducationEntry {
  return {
    id: createId(),
    institution: "",
    degree: "",
    field: "",
    location: "",
    startDate: "",
    endDate: "",
    details: [],
  };
}

export function newSkillGroup(): SkillGroup {
  return { id: createId(), category: "", items: [] };
}

export function newProject(): ProjectEntry {
  return { id: createId(), name: "", url: "", startDate: "", endDate: "", bullets: [""] };
}
