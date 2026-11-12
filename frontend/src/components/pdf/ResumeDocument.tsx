import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { contactLine, formatDateRange } from "@/lib/resume/format";
import {
  SECTION_HEADINGS,
  type DocumentSettings,
  type Resume,
  type SectionKey,
} from "@/lib/resume/types";
import {
  cleanList,
  educationDegree,
  educationHasContent,
  experienceHasContent,
  experienceTitle,
  joinParts,
  projectHasContent,
  projectTitle,
  skillGroupHasContent,
  skillLine,
  visibleSections,
} from "@/lib/resume/view";

/*
 * ATS rules: one column, real text, standard headings, plain "•" bullets,
 * no images, icons or tables. Layout mirrors ResumePreview.
 */
const styles = StyleSheet.create({
  page: {
    fontFamily: "Noto Serif",
    fontSize: 10.5,
    lineHeight: 1.35,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    color: "#000000",
  },
  header: { marginBottom: 10, textAlign: "center" },
  name: { fontSize: 20, fontWeight: "bold", lineHeight: 1.2 },
  headline: { fontSize: 11.5 },
  contact: { marginTop: 3 },
  section: { marginBottom: 9 },
  heading: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.66,
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    paddingBottom: 1,
    marginBottom: 4,
  },
  entry: { marginBottom: 8 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontWeight: "bold", flexShrink: 1, paddingRight: 12 },
  italic: { fontStyle: "italic" },
  bulletList: { marginTop: 2 },
  bulletRow: { flexDirection: "row", paddingLeft: 4 },
  bulletMark: { width: 10 },
  bulletText: { flex: 1 },
});

function EntryHeader({ title, dates }: { title: string; dates: string }) {
  return (
    <View style={styles.entryHeader} minPresenceAhead={24}>
      <Text style={styles.entryTitle}>{title}</Text>
      {dates ? <Text>{dates}</Text> : null}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  const clean = cleanList(items);
  if (clean.length === 0) return null;
  return (
    <View style={styles.bulletList}>
      {clean.map((item, index) => (
        <View key={index} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionBody({ resume, section }: { resume: Resume; section: SectionKey }) {
  switch (section) {
    case "summary":
      return <Text>{resume.summary.trim()}</Text>;
    case "experience":
      return resume.experience.filter(experienceHasContent).map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <EntryHeader title={experienceTitle(entry)} dates={formatDateRange(entry.startDate, entry.endDate)} />
          {entry.location.trim() ? <Text style={styles.italic}>{entry.location.trim()}</Text> : null}
          <Bullets items={entry.bullets} />
        </View>
      ));
    case "education":
      return resume.education.filter(educationHasContent).map((entry) => {
        const degreeLine = joinParts([educationDegree(entry), entry.location], " — ");
        return (
          <View key={entry.id} style={styles.entry}>
            <EntryHeader title={entry.institution.trim()} dates={formatDateRange(entry.startDate, entry.endDate)} />
            {degreeLine ? <Text>{degreeLine}</Text> : null}
            <Bullets items={entry.details} />
          </View>
        );
      });
    case "skills":
      return resume.skills
        .filter(skillGroupHasContent)
        .map((group) => <Text key={group.id}>{skillLine(group)}</Text>);
    case "projects":
      return resume.projects.filter(projectHasContent).map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <EntryHeader title={projectTitle(entry)} dates={formatDateRange(entry.startDate, entry.endDate)} />
          <Bullets items={entry.bullets} />
        </View>
      ));
  }
}

interface ResumeDocumentProps {
  resume: Resume;
  settings: DocumentSettings;
}

/** The exported PDF. Call registerPdfFonts() before rendering. */
export function ResumeDocument({ resume, settings }: ResumeDocumentProps) {
  const name = resume.basics.fullName.trim();
  const contact = contactLine(resume.basics);

  return (
    <Document
      title={name ? `${name} – Resume` : "Resume"}
      author={name || undefined}
      subject="Resume"
      creator="ATS CV Builder"
      producer="ATS CV Builder"
    >
      <Page size={settings.pageSize} style={styles.page}>
        <View style={styles.header}>
          {name ? <Text style={styles.name}>{name}</Text> : null}
          {resume.basics.headline.trim() ? (
            <Text style={styles.headline}>{resume.basics.headline.trim()}</Text>
          ) : null}
          {contact ? <Text style={styles.contact}>{contact}</Text> : null}
        </View>
        {visibleSections(resume).map((section) => (
          <View key={section} style={styles.section}>
            <Text style={styles.heading} minPresenceAhead={40}>
              {SECTION_HEADINGS[section]}
            </Text>
            <SectionBody resume={resume} section={section} />
          </View>
        ))}
      </Page>
    </Document>
  );
}
