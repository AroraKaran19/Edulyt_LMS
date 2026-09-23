/**
 * Sends the internship closure emails, exactly once each.
 *
 * Three outcomes reach a learner: the certificate was issued, the certificate is
 * still being generated, or no certificate was earned. The first and last are
 * final, so they share one claim slot and whichever lands first wins. The middle
 * one is an interim notice and keeps its own slot, because a learner told their
 * certificate is being prepared still needs the certificate when it arrives.
 *
 * Every claim is taken before the send. A send that fails therefore leaves the
 * learner un-mailed rather than exposed to a duplicate on the next sweep:
 * under-sending is recoverable by hand, a second "you are certified" is not.
 */
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import type { MailSendResult } from "../utils/mailer";
import { InternshipModel } from "../models/internship.schema";
import { UserModel } from "../models/user.schema";
import {
  internshipCertificateIssuedMail,
  internshipCertificatePendingMail,
  internshipCertificateWithheldMail,
} from "../mail";
import {
  CONTACT_PHONE,
  buildAttachmentNote,
  buildHelpText,
  buildLinkedInShareUrl,
  buildReasonLine,
  type InternshipClosureOutcome,
} from "../lib/internshipClosureMail";

export type ClosureEmailPayload =
  | {
      kind: "issued";
      certificateUrl: string;
      verificationUrl: string;
      /** Set only when the Letter of Recommendation was actually generated. */
      lorUrl?: string;
    }
  | { kind: "pending" }
  | { kind: "withheld" };

/** `issued` and `withheld` are terminal; `pending` is not. */
const claimFieldFor = (kind: ClosureEmailPayload["kind"]): string =>
  kind === "pending" ? "closurePendingEmailSentAt" : "closureEmailSentAt";

/**
 * Take the send slot, or report that someone already has it.
 *
 * The conditional update is the whole guard: two workers racing the same
 * enrollment both issue this, and only one matches.
 */
const claimSendSlot = async (
  enrollmentId: mongoose.Types.ObjectId,
  kind: ClosureEmailPayload["kind"],
): Promise<boolean> => {
  const field = claimFieldFor(kind);
  const res = await InternshipEnrollmentModel.updateOne(
    { _id: enrollmentId, [field]: { $exists: false } },
    { $set: { [field]: new Date() } },
  );
  return res.modifiedCount === 1;
};

/**
 * Give the slot back after a send that never landed.
 *
 * The claim has to be taken before the send to win the race, but on its own that
 * makes the marker a record of intent rather than of delivery: a rejected send
 * would close the internship silently, with no path to a retry.
 */
const releaseSendSlot = async (
  enrollmentId: mongoose.Types.ObjectId,
  kind: ClosureEmailPayload["kind"],
): Promise<void> => {
  await InternshipEnrollmentModel.updateOne(
    { _id: enrollmentId },
    { $unset: { [claimFieldFor(kind)]: "" } },
  );
};

type ClosureContext = {
  email: string;
  name: string;
  internshipName: string;
  hadCertificationExam: boolean;
  outcome: InternshipClosureOutcome;
};

/**
 * Everything the templates need, gathered before the slot is claimed so a
 * missing user or internship does not burn a learner's only notification.
 */
const loadClosureContext = async (
  enrollmentId: mongoose.Types.ObjectId,
  kind: ClosureEmailPayload["kind"],
): Promise<ClosureContext | null> => {
  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId)
    .select("user internship batchSnapshot certificateEvaluation")
    .lean<{
      user: mongoose.Types.ObjectId;
      internship: mongoose.Types.ObjectId;
      batchSnapshot?: { batchId?: string };
      certificateEvaluation?: { earned?: number; requiredPoints?: number };
    }>();
  if (!enrollment) return null;

  const [user, internship] = await Promise.all([
    UserModel.findById(enrollment.user)
      .select("firstName lastName name email")
      .lean<{
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
      }>(),
    InternshipModel.findById(enrollment.internship)
      .select("title batches")
      .lean<{
        title?: string;
        batches?: {
          _id?: unknown;
          certificationExamTemplateId?: unknown;
        }[];
      }>(),
  ]);

  const email = user?.email?.trim();
  if (!email) return null;

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.name?.trim() ||
    "there";

  // The exam only changes whether a retake is worth discussing, so an
  // unresolvable batch simply means we do not offer one.
  const batchId = enrollment.batchSnapshot?.batchId;
  const batch = internship?.batches?.find(
    (b) => String(b?._id) === String(batchId),
  );
  const hadCertificationExam = Boolean(batch?.certificationExamTemplateId);

  const outcome: InternshipClosureOutcome =
    kind === "withheld"
      ? {
          kind: "points_short",
          earned: Number(enrollment.certificateEvaluation?.earned ?? 0),
          requiredPoints: Number(
            enrollment.certificateEvaluation?.requiredPoints ?? 0,
          ),
        }
      : { kind: "passed" };

  return {
    email,
    name,
    internshipName: internship?.title?.trim() || "your internship",
    hadCertificationExam,
    outcome,
  };
};

/**
 * Tell a learner how their internship closed.
 *
 * Returns whether an email was dispatched. Never throws: a closure email must
 * not be able to roll back the verdict or fail the certificate job that
 * triggered it.
 */
export const sendInternshipClosureEmail = async (
  enrollmentId: string,
  payload: ClosureEmailPayload,
): Promise<boolean> => {
  let claimed = false;
  let _id: mongoose.Types.ObjectId | null = null;

  try {
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) return false;
    _id = new mongoose.Types.ObjectId(enrollmentId);

    const context = await loadClosureContext(_id, payload.kind);
    if (!context) {
      console.error(
        `[Closure Mail] No contactable learner for enrollment ${enrollmentId} — skipping.`,
      );
      return false;
    }

    if (!(await claimSendSlot(_id, payload.kind))) return false;
    claimed = true;

    const reasonLine = buildReasonLine(context.outcome, context.internshipName);
    const year = new Date().getFullYear();
    const to = [{ email: context.email, name: context.name }];

    let result: MailSendResult;

    switch (payload.kind) {
      case "issued":
        result = await internshipCertificateIssuedMail.sendNow(
          to,
          {
            name: context.name,
            reasonLine,
            internshipName: context.internshipName,
            certificateUrl: payload.certificateUrl,
            linkedInUrl: buildLinkedInShareUrl(
              context.internshipName,
              payload.verificationUrl,
            ),
            attachmentNote: buildAttachmentNote(
              context.internshipName,
              Boolean(payload.lorUrl),
            ),
            year,
          },
          // MSG91 fetches the attachment from this URL at send time. It is a
          // permanent public CDN object, never presigned, so nothing expires.
          {
            attachments: [
              {
                file: payload.certificateUrl,
                filename: `${context.internshipName} Certificate.pdf`,
              },
              ...(payload.lorUrl
                ? [
                    {
                      file: payload.lorUrl,
                      filename: "Airkrit Letter of Recommendation.pdf",
                    },
                  ]
                : []),
            ],
          },
        );
        break;

      case "pending":
        result = await internshipCertificatePendingMail.sendNow(to, {
          name: context.name,
          reasonLine,
          internshipName: context.internshipName,
          year,
        });
        break;

      case "withheld":
        result = await internshipCertificateWithheldMail.sendNow(to, {
          name: context.name,
          reasonLine,
          helpText: buildHelpText(context.hadCertificationExam),
          contactPhone: CONTACT_PHONE,
          year,
        });
        break;
    }

    if (!result.ok) {
      await releaseSendSlot(_id, payload.kind);
      console.error(
        `[Closure Mail] Send rejected for enrollment ${enrollmentId} (${payload.kind}): ${result.error}. ` +
          "Slot released, so re-running the certificate job will try again.",
      );
      return false;
    }

    return true;
  } catch (error) {
    // The claim outlives this function only if the send succeeded, so anything
    // thrown after it has to hand the slot back.
    if (claimed && _id) {
      await releaseSendSlot(_id, payload.kind).catch(() => undefined);
    }
    console.error(
      `[Closure Mail] Failed to send ${payload.kind} email for enrollment ${enrollmentId}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};
