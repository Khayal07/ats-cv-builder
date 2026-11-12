import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/** Extracts the text of every page, one line per text line, like an ATS parser would. */
export async function extractPdfText(path: string): Promise<{ text: string; pages: number }> {
  const data = new Uint8Array(await readFile(path));
  const pdf = await getDocument({ data, useSystemFonts: false }).promise;
  let text = "";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if ("str" in item) text += item.str + (item.hasEOL ? "\n" : "");
    }
    text += "\n";
  }
  return { text, pages: pdf.numPages };
}
