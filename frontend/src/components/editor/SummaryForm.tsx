"use client";

import { useEditor } from "@/state/ResumeProvider";
import { FormSection, TextAreaField } from "./fields";

export function SummaryForm() {
  const { doc, dispatch } = useEditor();
  const words = doc.resume.summary.trim() ? doc.resume.summary.trim().split(/\s+/).length : 0;

  return (
    <FormSection title="Summary" description="Two to four sentences on who you are and what you deliver.">
      <TextAreaField
        label="Professional summary"
        value={doc.resume.summary}
        rows={5}
        onChange={(value) => dispatch({ type: "setSummary", value })}
        hint={`${words} words`}
      />
    </FormSection>
  );
}
