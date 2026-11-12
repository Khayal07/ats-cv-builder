"use client";

import type { ReactNode } from "react";
import type { EntrySectionKey } from "@/lib/resume/types";
import { useEditor } from "@/state/ResumeProvider";
import type { EditorAction, EntryMap } from "@/state/editorReducer";
import { AddButton, FormSection, GhostButton } from "./fields";

interface EntryListProps<K extends EntrySectionKey> {
  section: K;
  title: string;
  description?: string;
  addLabel: string;
  emptyText: string;
  /** Short name for an entry, used in its card header and in button labels. */
  entryName: (entry: EntryMap[K], index: number) => string;
  renderEntry: (entry: EntryMap[K], patch: (value: EntryPatch<K>) => void) => ReactNode;
}

export type EntryPatch<K extends EntrySectionKey> = Partial<Omit<EntryMap[K], "id">>;

/** A section made of repeatable entries with add, remove and reorder controls. */
export function EntryList<K extends EntrySectionKey>({
  section,
  title,
  description,
  addLabel,
  emptyText,
  entryName,
  renderEntry,
}: EntryListProps<K>) {
  const { doc, dispatch } = useEditor();
  const entries = doc.resume[section] as EntryMap[K][];
  const updateEntry = (id: string, patch: EntryPatch<K>) =>
    dispatch({ type: "updateEntry", section, id, patch } as EditorAction);

  return (
    <FormSection title={title} description={description}>
      {entries.length === 0 ? <p className="text-sm text-ink-soft">{emptyText}</p> : null}
      <ol className="flex flex-col gap-4">
        {entries.map((entry, index) => {
          const name = entryName(entry, index);
          return (
            <li key={entry.id} className="rounded-lg border border-rule bg-panel" aria-label={name}>
              <div className="flex items-center justify-between gap-2 border-b border-rule bg-desk/50 px-3 py-1.5">
                <p className="truncate text-sm font-medium text-ink">{name}</p>
                <div className="flex shrink-0 items-center">
                  <GhostButton
                    label={`Move ${name} up`}
                    disabled={index === 0}
                    onClick={() => dispatch({ type: "moveEntry", section, id: entry.id, direction: -1 })}
                  >
                    ↑
                  </GhostButton>
                  <GhostButton
                    label={`Move ${name} down`}
                    disabled={index === entries.length - 1}
                    onClick={() => dispatch({ type: "moveEntry", section, id: entry.id, direction: 1 })}
                  >
                    ↓
                  </GhostButton>
                  <GhostButton
                    label={`Remove ${name}`}
                    onClick={() => dispatch({ type: "removeEntry", section, id: entry.id })}
                  >
                    Remove
                  </GhostButton>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {renderEntry(entry, (patch) => updateEntry(entry.id, patch))}
              </div>
            </li>
          );
        })}
      </ol>
      <AddButton onClick={() => dispatch({ type: "addEntry", section })}>{addLabel}</AddButton>
    </FormSection>
  );
}
