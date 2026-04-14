import type { Assessment, AssessmentSubmission } from "@/types/assessment";

export const MOCK_INTERNSHIPS = [
  { _id: "int-1", title: "Data Science Summer 2026" },
  { _id: "int-2", title: "Full-Stack Web Internship" },
] as const;

/** Batches are embedded on the internship; mock uses a 0-based index per internship. */
export const MOCK_BATCHES = [
  { internshipId: "int-1", batchIndex: 0, label: "Jan – Mar 2026" },
  { internshipId: "int-1", batchIndex: 1, label: "Apr – Jun 2026" },
  { internshipId: "int-2", batchIndex: 0, label: "Cohort A" },
] as const;

export const MOCK_MCQ_POOL = [
  { _id: "mq-1", preview: "What is the time complexity of binary search?" },
  { _id: "mq-2", preview: "Which HTTP method is idempotent?" },
  { _id: "mq-3", preview: "Select valid CSS flex properties." },
] as const;

export const MOCK_FILE_POOL = [
  { _id: "fq-1", preview: "Upload your résumé (PDF)." },
  { _id: "fq-2", preview: "Submit a 2-page project brief." },
] as const;

const d = (s: string) => new Date(s);

export const INITIAL_MOCK_ASSESSMENTS: Assessment[] = [
  {
    _id: "asmt-1",
    internship: "int-1",
    batch: "0",
    submissionType: "mcq",
    mcqQuestions: ["mq-1", "mq-2"],
    assessmentPoints: 100,
    duration: { startDate: d("2026-05-01T09:00:00"), endDate: d("2026-05-15T18:00:00") },
    createdBy: "admin-1",
    isActive: true,
    createdAt: d("2026-04-01"),
  },
  {
    _id: "asmt-2",
    internship: "int-2",
    submissionType: "file",
    fileQuestions: ["fq-1", "fq-2"],
    assessmentPoints: 50,
    duration: { startDate: d("2026-06-01T09:00:00"), endDate: d("2026-06-30T23:59:00") },
    createdBy: "admin-1",
    isActive: true,
    createdAt: d("2026-04-05"),
  },
];

export const INITIAL_MOCK_SUBMISSIONS: AssessmentSubmission[] = [
  {
    _id: "sub-1",
    assessment: "asmt-1",
    internship: "int-1",
    batch: "0",
    user: "user-101",
    submissionType: "mcq",
    submission: {
      responses: [
        { question: "mq-1", selectedAnswers: ["O(log n)"] },
        { question: "mq-2", selectedAnswers: ["GET", "PUT"] },
      ],
      qualifyingScore: 85,
    },
    qualifyingScore: 85,
    earnedPoints: 85,
    status: "graded",
    submittedAt: d("2026-05-02T14:30:00"),
  },
  {
    _id: "sub-2",
    assessment: "asmt-2",
    internship: "int-2",
    batch: "0",
    user: "user-202",
    submissionType: "file",
    submission: {
      uploads: [
        { question: "fq-1", file: "s3://bucket/resume.pdf", qualifyingScore: 0 },
        { question: "fq-2", file: "s3://bucket/brief.pdf", qualifyingScore: 0 },
      ],
    },
    qualifyingScore: 0,
    earnedPoints: 40,
    status: "submitted",
    submittedAt: d("2026-06-10T11:00:00"),
  },
];

/** Display names for mock user ids */
export const MOCK_USER_LABELS: Record<string, { name: string; email: string }> = {
  "user-101": { name: "Asha Kumar", email: "asha@example.com" },
  "user-202": { name: "Rahul Mehta", email: "rahul@example.com" },
};

const ASSESSMENTS_STORAGE_KEY = "admin-internship-assessments-mock-v1";

function reviveAssessment(raw: Assessment): Assessment {
  const r = raw as Assessment;
  const duration = {
    startDate: new Date(r.duration.startDate),
    endDate: new Date(r.duration.endDate),
  };
  const base = {
    ...r,
    duration,
    createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
  };
  if (r.submissionType === "mcq") {
    return { ...base, submissionType: "mcq" as const, mcqQuestions: r.mcqQuestions };
  }
  return { ...base, submissionType: "file" as const, fileQuestions: r.fileQuestions };
}

/** Templates list synced from the admin list page (until APIs exist). */
export function loadPersistedAssessments(): Assessment[] {
  if (typeof window === "undefined") return INITIAL_MOCK_ASSESSMENTS;
  try {
    const s = sessionStorage.getItem(ASSESSMENTS_STORAGE_KEY);
    if (!s) return INITIAL_MOCK_ASSESSMENTS;
    const parsed = JSON.parse(s) as Assessment[];
    if (!Array.isArray(parsed)) return INITIAL_MOCK_ASSESSMENTS;
    return parsed.map(reviveAssessment);
  } catch {
    return INITIAL_MOCK_ASSESSMENTS;
  }
}

export function persistAssessments(assessments: Assessment[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(assessments));
  } catch {
    /* ignore quota */
  }
}
