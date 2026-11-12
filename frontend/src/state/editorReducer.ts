import { newEducation, newExperience, newLink, newProject, newSkillGroup } from "@/lib/resume/defaults";
import type {
  Basics,
  DocumentSettings,
  EditorDocument,
  EducationEntry,
  EntrySectionKey,
  ExperienceEntry,
  Link,
  ProjectEntry,
  Resume,
  SkillGroup,
} from "@/lib/resume/types";

export interface EntryMap {
  experience: ExperienceEntry;
  education: EducationEntry;
  skills: SkillGroup;
  projects: ProjectEntry;
}

type BasicsField = Exclude<keyof Basics, "links">;

type UpdateEntryAction = {
  [K in EntrySectionKey]: {
    type: "updateEntry";
    section: K;
    id: string;
    patch: Partial<Omit<EntryMap[K], "id">>;
  };
}[EntrySectionKey];

export type EditorAction =
  | { type: "replaceDocument"; doc: EditorDocument }
  | { type: "replaceResume"; resume: Resume }
  | { type: "setBasicsField"; field: BasicsField; value: string }
  | { type: "addLink" }
  | { type: "updateLink"; id: string; patch: Partial<Omit<Link, "id">> }
  | { type: "removeLink"; id: string }
  | { type: "setSummary"; value: string }
  | { type: "addEntry"; section: EntrySectionKey }
  | UpdateEntryAction
  | { type: "removeEntry"; section: EntrySectionKey; id: string }
  | { type: "moveEntry"; section: EntrySectionKey; id: string; direction: -1 | 1 }
  | { type: "setSettings"; patch: Partial<DocumentSettings> }
  | { type: "setJobDescription"; value: string };

const entryFactories: { [K in EntrySectionKey]: () => EntryMap[K] } = {
  experience: newExperience,
  education: newEducation,
  skills: newSkillGroup,
  projects: newProject,
};

/** Returns a copy of `items` with the item at `index` moved by `direction`. */
export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function updateResume(doc: EditorDocument, update: (resume: Resume) => Resume): EditorDocument {
  return { ...doc, resume: update(doc.resume) };
}

function mapSection<K extends EntrySectionKey>(
  resume: Resume,
  section: K,
  update: (entries: EntryMap[K][]) => EntryMap[K][],
): Resume {
  return { ...resume, [section]: update(resume[section] as EntryMap[K][]) };
}

function patchEntry<K extends EntrySectionKey>(
  resume: Resume,
  action: { section: K; id: string; patch: Partial<Omit<EntryMap[K], "id">> },
): Resume {
  return mapSection(resume, action.section, (entries) =>
    entries.map((entry) => (entry.id === action.id ? { ...entry, ...action.patch } : entry)),
  );
}

export function editorReducer(doc: EditorDocument, action: EditorAction): EditorDocument {
  switch (action.type) {
    case "replaceDocument":
      return action.doc;

    case "replaceResume":
      return { ...doc, resume: action.resume };

    case "setBasicsField":
      return updateResume(doc, (resume) => ({
        ...resume,
        basics: { ...resume.basics, [action.field]: action.value },
      }));

    case "addLink":
      return updateResume(doc, (resume) => ({
        ...resume,
        basics: { ...resume.basics, links: [...resume.basics.links, newLink()] },
      }));

    case "updateLink":
      return updateResume(doc, (resume) => ({
        ...resume,
        basics: {
          ...resume.basics,
          links: resume.basics.links.map((link) =>
            link.id === action.id ? { ...link, ...action.patch } : link,
          ),
        },
      }));

    case "removeLink":
      return updateResume(doc, (resume) => ({
        ...resume,
        basics: {
          ...resume.basics,
          links: resume.basics.links.filter((link) => link.id !== action.id),
        },
      }));

    case "setSummary":
      return updateResume(doc, (resume) => ({ ...resume, summary: action.value }));

    case "addEntry":
      return updateResume(doc, (resume) =>
        mapSection(resume, action.section, (entries) => [
          ...entries,
          entryFactories[action.section](),
        ]),
      );

    case "updateEntry":
      return updateResume(doc, (resume) => patchEntry(resume, action));

    case "removeEntry":
      return updateResume(doc, (resume) =>
        mapSection(resume, action.section, (entries) =>
          entries.filter((entry) => entry.id !== action.id),
        ),
      );

    case "moveEntry":
      return updateResume(doc, (resume) =>
        mapSection(resume, action.section, (entries) =>
          moveItem(
            entries,
            entries.findIndex((entry) => entry.id === action.id),
            action.direction,
          ),
        ),
      );

    case "setSettings":
      return { ...doc, settings: { ...doc.settings, ...action.patch } };

    case "setJobDescription":
      return { ...doc, jobDescription: action.value };
  }
}
