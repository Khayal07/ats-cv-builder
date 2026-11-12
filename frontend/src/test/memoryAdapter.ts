import type { EditorDocument } from "@/lib/resume/types";
import type { StorageAdapter } from "@/lib/storage/adapter";

/** In-memory StorageAdapter for component tests. */
export function memoryAdapter(initial: EditorDocument | null = null) {
  let stored = initial;
  const adapter: StorageAdapter & { saved: () => EditorDocument | null } = {
    load: async () => stored,
    save: async (doc) => {
      stored = doc;
    },
    saved: () => stored,
  };
  return adapter;
}
