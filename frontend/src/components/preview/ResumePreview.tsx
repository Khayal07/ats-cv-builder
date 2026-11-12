import { contactLine, formatDateRange } from "@/lib/resume/format";
import { SECTION_HEADINGS, type Resume, type SectionKey } from "@/lib/resume/types";
import {
  cleanList,
  educationDegree,
  educationHasContent,
  experienceHasContent,
  experienceTitle,
  projectHasContent,
  projectTitle,
  skillGroupHasContent,
  skillLine,
  visibleSections,
} from "@/lib/resume/view";

function EntryHeader({ title, dates }: { title: string; dates: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h3 className="font-bold">{title}</h3>
      {dates ? <span className="shrink-0 tabular-nums">{dates}</span> : null}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  const clean = cleanList(items);
  if (clean.length === 0) return null;
  return (
    <ul className="mt-1 list-disc pl-[1.2em]">
      {clean.map((item, index) => (
        <li key={index} className="pl-[0.2em]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function SectionBody({ resume, section }: { resume: Resume; section: SectionKey }) {
  switch (section) {
    case "summary":
      return <p className="whitespace-pre-line">{resume.summary.trim()}</p>;
    case "experience":
      return resume.experience.filter(experienceHasContent).map((entry) => (
        <article key={entry.id} className="mb-[0.8em] last:mb-0">
          <EntryHeader title={experienceTitle(entry)} dates={formatDateRange(entry.startDate, entry.endDate)} />
          {entry.location.trim() ? <p className="italic">{entry.location.trim()}</p> : null}
          <Bullets items={entry.bullets} />
        </article>
      ));
    case "education":
      return resume.education.filter(educationHasContent).map((entry) => (
        <article key={entry.id} className="mb-[0.8em] last:mb-0">
          <EntryHeader title={entry.institution.trim()} dates={formatDateRange(entry.startDate, entry.endDate)} />
          {educationDegree(entry) || entry.location.trim() ? (
            <p>
              {educationDegree(entry)}
              {educationDegree(entry) && entry.location.trim() ? " — " : ""}
              <span className="italic">{entry.location.trim()}</span>
            </p>
          ) : null}
          <Bullets items={entry.details} />
        </article>
      ));
    case "skills":
      return (
        <ul>
          {resume.skills.filter(skillGroupHasContent).map((group) => (
            <li key={group.id}>{skillLine(group)}</li>
          ))}
        </ul>
      );
    case "projects":
      return resume.projects.filter(projectHasContent).map((entry) => (
        <article key={entry.id} className="mb-[0.8em] last:mb-0">
          <EntryHeader title={projectTitle(entry)} dates={formatDateRange(entry.startDate, entry.endDate)} />
          <Bullets items={entry.bullets} />
        </article>
      ));
  }
}

/** HTML rendering of the resume. Single column, real text, standard headings. */
export function ResumePreview({ resume }: { resume: Resume }) {
  const sections = visibleSections(resume);
  const contact = contactLine(resume.basics);
  const isEmpty = !resume.basics.fullName.trim() && !contact && sections.length === 0;

  return (
    <div className="resume-paper font-resume text-[10.5pt] leading-[1.35] text-black" data-testid="resume-preview">
      {isEmpty ? (
        <p className="mt-24 text-center font-sans text-sm text-neutral-400">
          Your resume appears here as you type.
        </p>
      ) : (
        <>
          <header className="mb-[1em] text-center">
            {resume.basics.fullName.trim() ? (
              <h1 className="text-[20pt] font-bold leading-tight">{resume.basics.fullName.trim()}</h1>
            ) : null}
            {resume.basics.headline.trim() ? <p className="text-[11.5pt]">{resume.basics.headline.trim()}</p> : null}
            {contact ? <p className="mt-[0.3em]">{contact}</p> : null}
          </header>
          {sections.map((section) => (
            <section key={section} className="mb-[0.9em]">
              <h2 className="mb-[0.4em] border-b border-black pb-[0.1em] text-[11pt] font-bold uppercase tracking-[0.06em]">
                {SECTION_HEADINGS[section]}
              </h2>
              <SectionBody resume={resume} section={section} />
            </section>
          ))}
        </>
      )}
    </div>
  );
}
