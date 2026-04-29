"use client";

import Modal from "@/components/ui/Modal";

/** Labels aligned with `EnrollForm` field keys (public internship enroll page). */
const APPLICATION_SECTIONS: {
  heading: string;
  fields: { key: string; label: string }[];
}[] = [
  {
    heading: "Cohort & duration",
    fields: [
      { key: "batchId", label: "Batch (cohort id)" },
      { key: "internshipDuration", label: "Internship duration (months)" },
    ],
  },
  {
    heading: "Basic information",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "dob", label: "Date of birth" },
      { key: "gender", label: "Gender" },
      { key: "experience", label: "Experience" },
    ],
  },
  {
    heading: "Education",
    fields: [
      { key: "university", label: "University" },
      { key: "country", label: "Country" },
      { key: "courseName", label: "Course" },
      { key: "yearOfPassing", label: "Year of passing" },
    ],
  },
  {
    heading: "Contact & social",
    fields: [
      { key: "linkedinUrl", label: "LinkedIn URL" },
      { key: "instagramUrl", label: "Instagram URL" },
      { key: "collegeEmail", label: "College T&P email" },
      { key: "guardianContact", label: "Guardian contact" },
    ],
  },
  {
    heading: "Motivation & CR",
    fields: [
      { key: "joinReason", label: "Why join this program" },
      { key: "crName", label: "Class representative name" },
      { key: "crContact", label: "Class representative contact" },
    ],
  },
  {
    heading: "Preferences",
    fields: [
      { key: "paidTraining", label: "Paid training preference" },
      { key: "whatsappJoined", label: "WhatsApp group joined" },
      { key: "referralSource", label: "How they heard about us" },
      { key: "socialMediaFollowed", label: "Followed social media" },
      { key: "marketingActivities", label: "Marketing activities interest" },
    ],
  },
  {
    heading: "Academic marks",
    fields: [
      { key: "marks10thType", label: "10th — marks type" },
      { key: "marks10thValue", label: "10th — value" },
      { key: "marks12thType", label: "12th — marks type" },
      { key: "marks12thValue", label: "12th — value" },
      { key: "marksPursuingType", label: "Pursuing course — marks type" },
      { key: "marksPursuingValue", label: "Pursuing course — value" },
    ],
  },
];

function formatAnswerDisplay(key: string, raw: unknown): string {
  if (raw === undefined || raw === null || raw === "") return "—";
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object")
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  const s = String(raw);
  if (key === "dob") {
    try {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      /* fallthrough */
    }
  }
  return s;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Saved snapshot from enrollment `applicationAnswers`. */
  answers: Record<string, unknown> | null | undefined;
  submittedAtIso?: string;
  cohortName?: string;
};

export default function InternshipEnrollmentApplicationModal({
  isOpen,
  onClose,
  answers,
  submittedAtIso,
  cohortName,
}: Props) {
  const snap = answers ?? {};
  const hasData = Object.keys(snap).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registration form (application)"
      className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      showCloseButton
    >
      {!hasData ? (
        <p className="text-sm text-gray-600 py-4">
          No registration form snapshot is stored for this enrollment (e.g.
          submitted before we saved responses, or migration pending).
        </p>
      ) : (
        <div className="space-y-6 text-sm">
          {(submittedAtIso || cohortName) && (
            <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs text-stone-700 space-y-1">
              {cohortName ? (
                <p>
                  <span className="font-semibold text-stone-900">Cohort: </span>
                  {cohortName}
                </p>
              ) : null}
              {submittedAtIso ? (
                <p>
                  <span className="font-semibold text-stone-900">Submitted: </span>
                  {new Date(submittedAtIso).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              ) : null}
            </div>
          )}

          {APPLICATION_SECTIONS.map((section) => {
            const rows = section.fields.filter(
              (f) => snap[f.key] !== undefined && snap[f.key] !== "",
            );
            if (rows.length === 0) return null;
            return (
              <section key={section.heading}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 border-b border-stone-200 pb-2 mb-3">
                  {section.heading}
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {rows.map(({ key, label }) => (
                    <div key={key} className="min-w-0 sm:col-span-2">
                      <dt className="text-xs font-medium text-stone-500">{label}</dt>
                      <dd className="text-stone-900 mt-0.5 whitespace-pre-wrap break-words">
                        {formatAnswerDisplay(key, snap[key])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}

          {/* Any extra keys not in the template (forward compatibility) */}
          {(() => {
            const known = new Set(
              APPLICATION_SECTIONS.flatMap((s) => s.fields.map((f) => f.key)),
            );
            const extra = Object.keys(snap).filter((k) => !known.has(k));
            if (extra.length === 0) return null;
            return (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 border-b border-stone-200 pb-2 mb-3">
                  Additional fields
                </h3>
                <dl className="space-y-2">
                  {extra.map((key) => (
                    <div key={key}>
                      <dt className="text-xs font-medium text-stone-500 font-mono">
                        {key}
                      </dt>
                      <dd className="text-stone-900 mt-0.5 whitespace-pre-wrap break-words">
                        {formatAnswerDisplay(key, snap[key])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })()}
        </div>
      )}
    </Modal>
  );
}
