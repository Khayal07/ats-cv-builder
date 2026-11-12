"use client";

import { BulletListInput } from "./BulletListInput";
import { DateRangeFields } from "./DateRangeFields";
import { EntryList } from "./EntryList";
import { TextField } from "./fields";

export function EducationForm() {
  return (
    <EntryList
      section="education"
      title="Education"
      addLabel="Add education"
      emptyText="No education added yet."
      entryName={(entry, index) => entry.institution.trim() || `Education ${index + 1}`}
      renderEntry={(entry, patch) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="School or university"
              value={entry.institution}
              onChange={(institution) => patch({ institution })}
              className="sm:col-span-2"
            />
            <TextField
              label="Degree"
              value={entry.degree}
              placeholder="BSc"
              onChange={(degree) => patch({ degree })}
            />
            <TextField
              label="Field of study"
              value={entry.field}
              placeholder="Computer Science"
              onChange={(field) => patch({ field })}
            />
            <TextField
              label="Location"
              value={entry.location}
              onChange={(location) => patch({ location })}
              className="sm:col-span-2"
            />
          </div>
          <DateRangeFields
            start={entry.startDate}
            end={entry.endDate}
            ongoingLabel="I currently study here"
            onChange={patch}
          />
          <BulletListInput
            label="Details"
            items={entry.details}
            addLabel="Add detail"
            placeholder="GPA, honours, thesis…"
            onChange={(details) => patch({ details })}
          />
        </>
      )}
    />
  );
}
