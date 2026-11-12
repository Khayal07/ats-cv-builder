import type { EditorDocument } from "@/lib/resume/types";

/**
 * Where an editor document lives. The guest builder uses localStorage;
 * signed-in users get a Supabase-backed adapter (added later).
 */
export interface StorageAdapter {
  load(): Promise<EditorDocument | null>;
  save(doc: EditorDocument): Promise<void>;
}
