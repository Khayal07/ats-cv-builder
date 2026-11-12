import type { Basics, YearMonth } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_MONTH = /^(\d{4})-(\d{2})$/;

export const PRESENT_LABEL = "Present";
export const DATE_SEPARATOR = " – ";
export const CONTACT_SEPARATOR = " | ";

export function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/** "2024-01" -> "Jan 2024". Invalid or empty input -> "". */
export function formatYearMonth(value: YearMonth | null | undefined): string {
  const match = value ? YEAR_MONTH.exec(value) : null;
  if (!match) return "";
  const month = Number(match[2]);
  if (month < 1 || month > 12) return "";
  return `${MONTHS[month - 1]} ${match[1]}`;
}

/**
 * The single date format used everywhere in the resume output:
 * "Mar 2021 – Jul 2023", "May 2022 – Present", or a single month.
 * `end === null` means the entry is ongoing.
 */
export function formatDateRange(
  start: YearMonth | null | undefined,
  end: YearMonth | null | undefined,
): string {
  const startText = formatYearMonth(start);
  const endText = end === null ? (startText ? PRESENT_LABEL : "") : formatYearMonth(end);

  if (startText && endText) {
    return startText === endText ? startText : `${startText}${DATE_SEPARATOR}${endText}`;
  }
  return startText || endText;
}

/** Plain-text contact line: no icons, separated by " | ". */
export function contactLine(basics: Basics): string {
  return [
    basics.location,
    basics.email,
    basics.phone,
    ...basics.links.map((link) => link.url),
  ]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(CONTACT_SEPARATOR);
}
