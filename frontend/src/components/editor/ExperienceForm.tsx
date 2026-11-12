"use client";

import { experienceTitle } from "@/lib/resume/view";
import { BulletListInput } from "./BulletListInput";
import { DateRangeFields } from "./DateRangeFields";
import { EntryList } from "./EntryList";
import { TextField } from "./fields";

export function ExperienceForm() {
  return (
    <EntryList
      section="experience"
      title="Experience"
      description="Most recent first. Start bullets with a verb and include a number where you can."
      addLabel="Add position"
      emptyText="No positions yet."
      entryName={(entry, index) => experienceTitle(entry) || `Position ${index + 1}`}
      renderEntry={(entry, patch) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Job title" value={entry.role} onChange={(role) => patch({ role })} />
            <TextField label="Company" value={entry.company} onChange={(company) => patch({ company })} />
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
            ongoingLabel="I currently work here"
            onChange={patch}
          />
          <BulletListInput
            label="Achievements"
            items={entry.bullets}
            addLabel="Add achievement"
            placeholder="Reduced page load time by 40% by…"
            onChange={(bullets) => patch({ bullets })}
          />
        </>
      )}
    />
  );
}
