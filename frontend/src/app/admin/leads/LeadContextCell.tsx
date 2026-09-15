"use client";

import { formatIst } from "@/lib/ist";
import {
  ATTEMPT_STYLES,
  COUPON_STYLES,
  PROGRAM_KIND_LABELS,
  attemptSummary,
  couponSummary,
  type Lead,
} from "./types";

/**
 * The one column that differs by source. Enquiry leads answer a form; campaign
 * leads answer nothing, so the column carries where they got to instead.
 */

const CHIP =
  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset";

const answerForAny = (lead: Lead, ...keys: string[]) =>
  keys.map((k) => lead.answers.find((a) => a.key === k)?.value).find(Boolean);

function ScholarshipContext({ lead }: { lead: Lead }) {
  const scholarship = lead.scholarship;
  const attempt = scholarship?.attempt;

  return (
    <div className="space-y-1">
      <div className="font-medium text-gray-900">
        {lead.source.title || "Untitled campaign"}
      </div>
      {attempt || scholarship?.coupon ? (
        <div className="flex flex-wrap gap-1">
          {attempt ? (
            <span className={`${CHIP} ${ATTEMPT_STYLES[attempt.status]}`}>
              {attemptSummary(attempt)}
            </span>
          ) : null}
          {scholarship?.coupon ? (
            <span
              className={`${CHIP} ${COUPON_STYLES[scholarship.coupon.state]}`}
            >
              {couponSummary(scholarship)}
              {scholarship.coupon.state === "issued"
                ? `, till ${formatIst(scholarship.coupon.expiresAt, {
                    day: "numeric",
                    month: "short",
                  })}`
                : ""}
            </span>
          ) : null}
        </div>
      ) : (
        // Deleting a campaign detaches its attempts, so an old lead can outlive
        // everything it pointed at.
        <div className="text-[11px] text-gray-400">No attempt on record</div>
      )}
    </div>
  );
}

function EnquiryContext({ lead }: { lead: Lead }) {
  // Pre-snapshot leads still carry the college, and older ones carry
  // careerStage, in `answers`.
  const college =
    lead.collegeName ?? answerForAny(lead, "college", "careerStage");
  const plan = answerForAny(lead, "plan");
  const program = lead.source?.program;
  const experience = answerForAny(lead, "experienceLevel");

  if (!college && !plan && !program) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="space-y-0.5">
      {program ? (
        <div className="font-medium text-gray-900">
          {program.title || program.slug}
          <span className="ml-1.5 text-[11px] font-normal text-gray-500">
            {PROGRAM_KIND_LABELS[program.kind]}
          </span>
        </div>
      ) : null}
      {program && experience ? (
        <div className="text-gray-700">{experience}</div>
      ) : null}
      {plan ? <div className="font-medium text-gray-900">{plan}</div> : null}
      {college ? <div className="text-gray-700">{college}</div> : null}
      {lead.state ? (
        <div className="text-[11px] text-gray-500">{lead.state}</div>
      ) : null}
    </div>
  );
}

export default function LeadContextCell({ lead }: { lead: Lead }) {
  return lead.source?.kind === "scholarship" ? (
    <ScholarshipContext lead={lead} />
  ) : (
    <EnquiryContext lead={lead} />
  );
}
