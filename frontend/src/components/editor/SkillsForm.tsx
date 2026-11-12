"use client";

import { EntryList } from "./EntryList";
import { TextField } from "./fields";

/** Items are kept as typed (split on commas) so trailing commas and spaces survive editing. */
export const parseSkillItems = (value: string): string[] => value.split(",");
export const formatSkillItems = (items: string[]): string => items.join(",");

export function SkillsForm() {
  return (
    <EntryList
      section="skills"
      title="Skills"
      description="Group related skills. Use the exact names a job post would use."
      addLabel="Add skill group"
      emptyText="No skills added yet."
      entryName={(entry, index) => entry.category.trim() || `Skill group ${index + 1}`}
      renderEntry={(entry, patch) => (
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <TextField
            label="Category"
            value={entry.category}
            placeholder="Languages"
            onChange={(category) => patch({ category })}
          />
          <TextField
            label="Skills"
            value={formatSkillItems(entry.items)}
            placeholder="Python, TypeScript, SQL"
            hint="Separate with commas."
            onChange={(value) => patch({ items: parseSkillItems(value) })}
          />
        </div>
      )}
    />
  );
}
