import { Font } from "@react-pdf/renderer";

/** PDF font family name -> file prefix in /public/fonts. */
export const PDF_FONT_FILES = {
  "Noto Serif": "NotoSerif",
  "Noto Sans": "NotoSans",
} as const;

export type PdfFontFamily = keyof typeof PDF_FONT_FILES;

let registeredBase: string | null = null;

/**
 * Registers the embedded Noto fonts (they cover Azerbaijani: ə ı ğ ş ç ö ü İ;
 * the built-in Helvetica does not) and turns hyphenation off so words are never split.
 * `base` is a URL in the browser or a directory path in Node (tests).
 */
export function registerPdfFonts(base: string): void {
  if (registeredBase === base) return;
  registeredBase = base;

  for (const [family, prefix] of Object.entries(PDF_FONT_FILES)) {
    Font.register({
      family,
      fonts: [
        { src: `${base}/${prefix}-Regular.ttf` },
        { src: `${base}/${prefix}-Bold.ttf`, fontWeight: "bold" },
        { src: `${base}/${prefix}-Italic.ttf`, fontStyle: "italic" },
        { src: `${base}/${prefix}-BoldItalic.ttf`, fontWeight: "bold", fontStyle: "italic" },
      ],
    });
  }

  Font.registerHyphenationCallback((word) => [word]);
}
