"use client";

import { useEditor } from "@/state/ResumeProvider";
import { AddButton, FormSection, GhostButton, TextField } from "./fields";

export function BasicsForm() {
  const { doc, dispatch } = useEditor();
  const { basics } = doc.resume;
  const set = (field: "fullName" | "headline" | "email" | "phone" | "location") => (value: string) =>
    dispatch({ type: "setBasicsField", field, value });

  return (
    <FormSection title="Contact details" description="Shown at the top of your resume as plain text.">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" value={basics.fullName} onChange={set("fullName")} autoComplete="name" />
        <TextField
          label="Headline"
          value={basics.headline}
          onChange={set("headline")}
          placeholder="Backend Engineer"
        />
        <TextField label="Email" type="email" value={basics.email} onChange={set("email")} autoComplete="email" />
        <TextField label="Phone" type="tel" value={basics.phone} onChange={set("phone")} autoComplete="tel" />
        <TextField
          label="Location"
          value={basics.location}
          onChange={set("location")}
          placeholder="Bakı, Azərbaycan"
          className="sm:col-span-2"
        />
      </div>

      <div className="flex flex-col gap-3">
        {basics.links.map((link, index) => (
          <div key={link.id} className="grid grid-cols-[1fr_2fr_auto] items-end gap-2">
            <TextField
              label={`Link ${index + 1} label`}
              value={link.label}
              placeholder="LinkedIn"
              onChange={(label) => dispatch({ type: "updateLink", id: link.id, patch: { label } })}
            />
            <TextField
              label="URL"
              type="url"
              value={link.url}
              placeholder="linkedin.com/in/you"
              onChange={(url) => dispatch({ type: "updateLink", id: link.id, patch: { url } })}
            />
            <GhostButton
              label={`Remove link ${index + 1}`}
              onClick={() => dispatch({ type: "removeLink", id: link.id })}
            >
              Remove
            </GhostButton>
          </div>
        ))}
        <AddButton onClick={() => dispatch({ type: "addLink" })}>Add link</AddButton>
      </div>
    </FormSection>
  );
}
