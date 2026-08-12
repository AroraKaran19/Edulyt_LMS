export type PlanId = 1 | 2 | 3;

export type Plan = {
  id: PlanId;
  no: string;
  name: string;
  tagline: string;
  adds: string[];
  carried: string[];
};

export const ISSUERS = [
  { name: "Cisco", src: "/join/logos/cisco.svg", ratio: 52 / 28, height: 26 },
  { name: "Meta", src: "/join/logos/meta.svg", ratio: 256 / 171, height: 22 },
  { name: "Apple", src: "/join/logos/apple.svg", ratio: 814 / 1000, height: 27 },
  { name: "Airkrit", src: "/logo.svg", ratio: 700 / 200, height: 31 },
];

export const STATS = [
  { value: "36", label: "Courses built for college students" },
  { value: "4", label: "Certifications: Cisco, Meta, Apple, Airkrit" },
  { value: "1", label: "Internship with real deliverables" },
];

export const PLANS: Plan[] = [
  {
    id: 1,
    no: "01",
    name: "Plan 1",
    tagline: "Everything we teach, unlocked on day one.",
    adds: [
      "All 36 college student courses",
      "Project-led modules you build, not just watch",
      "Doubt support from working mentors",
      "Access that does not expire mid-semester",
    ],
    carried: [],
  },
  {
    id: 2,
    no: "02",
    name: "Plan 2",
    tagline: "Adds the proof a recruiter recognises before they read your resume.",
    adds: [
      "Certification from Cisco",
      "Certification from Meta",
      "Certification from Apple",
      "Certification from Airkrit",
      "A recommendation letter written for you",
    ],
    carried: ["All 36 courses"],
  },
  {
    id: 3,
    no: "03",
    name: "Plan 3",
    tagline: "Adds the line on your resume that is not a course.",
    adds: [
      "A structured internship with real deliverables",
      "Work reviewed by a mentor, not auto-graded",
      "An internship completion letter",
      "Something concrete to walk an interviewer through",
    ],
    carried: ["All 36 courses", "4 certifications", "Recommendation letter"],
  },
];

export const ARTIFACTS = [
  {
    kind: "Certificate × 4",
    rung: "Plan 2",
    title: "Certifications",
    body: "Issued in your name by Cisco, Meta, Apple and Airkrit. Verifiable, and one tap to your LinkedIn profile.",
    seal: "Verifiable",
  },
  {
    kind: "Letter",
    rung: "Plan 2",
    title: "Recommendation",
    body: "Written by the mentor who reviewed your work, about the work they actually reviewed. Not a template with your name pasted in.",
    seal: "Signed",
  },
  {
    kind: "Letter",
    rung: "Plan 3",
    title: "Internship record",
    body: "Dated, with the scope of what you shipped during the internship written out in full.",
    seal: "Dated",
  },
];
