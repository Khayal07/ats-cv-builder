import { createId } from "./defaults";
import { RESUME_SCHEMA_VERSION, type Resume } from "./types";

/** Realistic sample used for "Load sample" and tests. Includes Azerbaijani characters. */
export function sampleResume(): Resume {
  return {
    schemaVersion: RESUME_SCHEMA_VERSION,
    basics: {
      fullName: "Aysel Məmmədova",
      headline: "Full-Stack Software Engineer",
      email: "aysel.mammadova@example.com",
      phone: "+994 50 123 45 67",
      location: "Bakı, Azərbaycan",
      links: [
        { id: createId(), label: "LinkedIn", url: "linkedin.com/in/aysel-example" },
        { id: createId(), label: "GitHub", url: "github.com/aysel-example" },
      ],
    },
    summary:
      "Full-stack engineer with 5 years of experience building web applications with TypeScript, React and Python. Shipped payment and analytics features used by 200,000+ customers and led migrations to cloud-native infrastructure.",
    experience: [
      {
        id: createId(),
        company: "Kapital Tech",
        role: "Senior Software Engineer",
        location: "Bakı, Azərbaycan",
        startDate: "2022-03",
        endDate: null,
        bullets: [
          "Led a team of 4 engineers to rebuild the customer onboarding flow in Next.js, cutting drop-off by 18%.",
          "Designed REST APIs in FastAPI serving 3M requests per day with p95 latency under 120 ms.",
          "Introduced automated testing and CI with GitHub Actions, raising coverage from 35% to 80%.",
        ],
      },
      {
        id: createId(),
        company: "Ağ Şəhər Solutions",
        role: "Software Engineer",
        location: "Gəncə, Azərbaycan",
        startDate: "2019-07",
        endDate: "2022-02",
        bullets: [
          "Built internal dashboards with React and PostgreSQL used by 150 operations staff.",
          "Containerized 12 services with Docker and moved deployments to Kubernetes.",
        ],
      },
    ],
    education: [
      {
        id: createId(),
        institution: "Azərbaycan Dövlət Neft və Sənaye Universiteti",
        degree: "BSc",
        field: "Computer Engineering",
        location: "Bakı, Azərbaycan",
        startDate: "2015-09",
        endDate: "2019-06",
        details: [
          "GPA 3.8 / 4.0",
          "İstedadlı gənclər üçün təqaüd; Tələbə Elmi Cəmiyyətinin üzvü (Əla qiymətlərlə).",
          "Diplom işi: Şəbəkə trafikinin analizi və təşkili.",
        ],
      },
    ],
    skills: [
      { id: createId(), category: "Languages", items: ["TypeScript", "Python", "SQL"] },
      {
        id: createId(),
        category: "Frameworks",
        items: ["React", "Next.js", "FastAPI", "Tailwind CSS"],
      },
      {
        id: createId(),
        category: "Tools",
        items: ["PostgreSQL", "Docker", "Kubernetes", "GitHub Actions"],
      },
    ],
    projects: [
      {
        id: createId(),
        name: "Open Budget Tracker",
        url: "github.com/aysel-example/budget",
        startDate: "2023-01",
        endDate: "2023-06",
        bullets: [
          "Open-source budgeting app with React Native and Supabase; 2,000+ downloads.",
        ],
      },
    ],
  };
}
