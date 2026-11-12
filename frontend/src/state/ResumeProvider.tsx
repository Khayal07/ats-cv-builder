"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { defaultDocument } from "@/lib/resume/migrate";
import type { EditorDocument } from "@/lib/resume/types";
import type { StorageAdapter } from "@/lib/storage/adapter";
import { editorReducer, type EditorAction } from "./editorReducer";

export type LoadStatus = "loading" | "ready";
export type SaveState = "saved" | "saving" | "error";

interface EditorContextValue {
  doc: EditorDocument;
  dispatch: Dispatch<EditorAction>;
  status: LoadStatus;
  saveState: SaveState;
}

const EditorContext = createContext<EditorContextValue | null>(null);

type State = { status: LoadStatus; doc: EditorDocument };
type Action = EditorAction | { type: "loaded"; doc: EditorDocument };

function reducer(state: State, action: Action): State {
  if (action.type === "loaded") return { status: "ready", doc: action.doc };
  return { ...state, doc: editorReducer(state.doc, action) };
}

interface ResumeProviderProps {
  adapter: StorageAdapter;
  /** Debounce before persisting changes. */
  saveDelayMs?: number;
  children: ReactNode;
}

export function ResumeProvider({ adapter, saveDelayMs = 500, children }: ResumeProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    status: "loading" as const,
    doc: defaultDocument(),
  }));
  const [lastSaved, setLastSaved] = useState<EditorDocument | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  // Load once per adapter.
  useEffect(() => {
    let cancelled = false;
    adapter.load().then(
      (doc) => {
        if (cancelled) return;
        const loaded = doc ?? defaultDocument();
        setLastSaved(loaded);
        dispatch({ type: "loaded", doc: loaded });
      },
      () => {
        if (!cancelled) dispatch({ type: "loaded", doc: defaultDocument() });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  // Debounced save after every change.
  useEffect(() => {
    if (state.status !== "ready" || state.doc === lastSaved) return;
    const doc = state.doc;
    const handle = setTimeout(() => {
      adapter.save(doc).then(
        () => {
          setLastSaved(doc);
          setSaveFailed(false);
        },
        () => setSaveFailed(true),
      );
    }, saveDelayMs);
    return () => clearTimeout(handle);
  }, [state, lastSaved, adapter, saveDelayMs]);

  // Best-effort flush when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => {
      if (latest.current.status === "ready") void adapter.save(latest.current.doc).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [adapter]);

  const saveState: SaveState = saveFailed
    ? "error"
    : state.doc === lastSaved || state.status === "loading"
      ? "saved"
      : "saving";

  return (
    <EditorContext.Provider value={{ doc: state.doc, dispatch, status: state.status, saveState }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditor must be used inside <ResumeProvider>.");
  return value;
}
