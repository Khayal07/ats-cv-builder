"use client";

import { BulletListInput } from "./BulletListInput";
import { DateRangeFields } from "./DateRangeFields";
import { EntryList } from "./EntryList";
import { TextField } from "./fields";

export function ProjectsForm() {
  return (
    <EntryList
      section="projects"
      title="Projects"
      description="Side projects, open source or notable work that shows relevant skills."
      addLabel="Add project"
      emptyText="No projects added yet."
      entryName={(entry, index) => entry.name.trim() || `Project ${index + 1}`}
      renderEntry={(entry, patch) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Project name" value={entry.name} onChange={(name) => patch({ name })} />
            <TextField
              label="Link"
              type="url"
              value={entry.url}
              placeholder="github.com/you/project"
              onChange={(url) => patch({ url })}
            />
          </div>
          <DateRangeFields
            start={entry.startDate}
            end={entry.endDate}
            ongoingLabel="Ongoing project"
            onChange={patch}
          />
          <BulletListInput
            label="Highlights"
            items={entry.bullets}
            addLabel="Add highlight"
            placeholder="What it does and the result"
            onChange={(bullets) => patch({ bullets })}
          />
        </>
      )}
    />
  );
}
