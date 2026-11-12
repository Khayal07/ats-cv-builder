import { defaultSettings, parseEditorDocument, parseResume } from "./migrate";
import type { EditorDocument } from "./types";

const EXPORT_FORMAT = "ats-cv-builder";

/** JSON file contents for "Export JSON". */
export function serializeDocument(doc: EditorDocument): string {
  return JSON.stringify({ format: EXPORT_FORMAT, ...doc }, null, 2);
}

/**
 * Accepts an exported document or a bare resume object.
 * Returns null when the text is not valid JSON or not a resume.
 */
export function parseImportedJson(text: string): EditorDocument | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const doc = parseEditorDocument(raw);
  if (doc) return doc;
  const resume = parseResume(raw);
  if (!resume || !looksLikeResume(raw)) return null;
  return { resume, settings: defaultSettings(), jobDescription: "" };
}

function looksLikeResume(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  return ["basics", "summary", "experience", "education", "skills", "projects"].some(
    (key) => key in raw,
  );
}

const ASCII_MAP: Record<string, string> = {
  ə: "a",
  Ə: "A",
  ı: "i",
  İ: "I",
  ğ: "g",
  Ğ: "G",
  ş: "s",
  Ş: "S",
  ç: "c",
  Ç: "C",
  ö: "o",
  Ö: "O",
  ü: "u",
  Ü: "U",
};

/** "Aysel Məmmədova" -> "Aysel_Mammadova_Resume" (safe for any file system). */
export function resumeFileBase(fullName: string): string {
  const ascii = fullName
    .replace(/[əƏıİğĞşŞçÇöÖüÜ]/g, (char) => ASCII_MAP[char] ?? char)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ascii ? `${ascii}_Resume` : "Resume";
}
