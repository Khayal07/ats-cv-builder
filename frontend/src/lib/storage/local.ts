import { parseEditorDocument } from "@/lib/resume/migrate";
import type { EditorDocument } from "@/lib/resume/types";
import type { StorageAdapter } from "./adapter";

export const GUEST_STORAGE_KEY = "atscv.guest.v1";

type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): KeyValueStore | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    // Access can throw when storage is blocked (privacy settings, sandboxed frames).
    return null;
  }
}

export function createLocalAdapter(
  key: string = GUEST_STORAGE_KEY,
  getStore: () => KeyValueStore | null = browserStorage,
): StorageAdapter & { clear(): void } {
  return {
    async load(): Promise<EditorDocument | null> {
      try {
        const raw = getStore()?.getItem(key);
        return raw ? parseEditorDocument(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    },
    async save(doc: EditorDocument): Promise<void> {
      const store = getStore();
      if (!store) throw new Error("Browser storage is not available.");
      store.setItem(key, JSON.stringify(doc));
    },
    clear(): void {
      try {
        getStore()?.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}
