/**
 * Tells a candidate the outcome of their entrance exam application, exactly once.
 *
 * Both emails are driven by admin decisions, and the status graph makes "which
 * email" less obvious than it looks:
 *
 *  - Selection is not a single transition. `adminApproveMeritToEnrolled` moves a
 *    candidate to `pending_documentation`, while `adminUpdateEnrollmentStatus` can
 *    fast-forward `in_merit_pool` straight to `enrolled`. Both are selections.
 *  - `in_merit_pool` is NOT a selection. It is a shortlist, it can still end in
 *    rejection, and the learner API deliberately masks it as `exam_attempted`.
 *    Congratulating someone there would leak what that masking protects and could
 *    be followed by a rejection.
 *  - Rejection is only announced from a pre-selection status. A candidate rejected
 *    after being selected would otherwise be told "you were not selected", which is
 *    false, and there is no template for a post-selection withdrawal.
 *  - Rejection from `exam_registered` sends nothing: they never sat the exam, so
 *    "thank you for taking the entrance exam" would be wrong.
 */
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { UserModel } from "../models/user.schema";
import {
  entranceExamPassedMail,
  entranceExamRejectedMail,
} from "../mail";
import {
  buildConfirmSeatUrl,
  dashboardInternshipsUrl,
} from "../lib/internshipSeatUrl";

/** Statuses before a seat has been granted. */
const PRE_SELECTION_STATUSES = new Set([
  "exam_registered",
  "exam_attempted",
  "in_merit_pool",
  "payment_pending",
]);

/** Statuses that mean the candidate now holds a seat. */
const SELECTED_STATUSES = new Set([
  "pending_documentation",
  "docs_under_review",
  "re_pending_documentation",
  "offer_letter_pending",
  "enrolled",
]);

/**
 * Rejections that get an email. `exam_registered` is absent on purpose: a
 * candidate who never sat the exam cannot be thanked for sitting it.
 */
const ANNOUNCEABLE_REJECTION_FROM = new Set(["exam_attempted", "in_merit_pool"]);

/** True when this transition grants a seat that the candidate did not have. */
export const isEntranceSelection = (
  previousStatus: string,
  newStatus: string,
): boolean =>
  PRE_SELECTION_STATUSES.has(previousStatus) && SELECTED_STATUSES.has(newStatus);

/** True when this rejection is one the candidate should be told about. */
export const isAnnounceableEntranceRejection = (
  previousStatus: string,
  newStatus: string,
): boolean =>
  newStatus === "admin_rejected" &&
  ANNOUNCEABLE_REJECTION_FROM.has(previousStatus);

/**
 * Take the send slot, or report that it is already taken.
 *
 * One slot for both emails: only one of them can legitimately fire for a given
 * enrollment, so a candidate can never be both congratulated and rejected.
 */
const claimSendSlot = async (
  enrollmentId: mongoose.Types.ObjectId,
): Promise<boolean> => {
  const res = await InternshipEnrollmentModel.updateOne(
    { _id: enrollmentId, entranceResultEmailSentAt: { $exists: false } },
    { $set: { entranceResultEmailSentAt: new Date() } },
  );
  return res.modifiedCount === 1;
};

type EntranceContext = {
  email: string;
  name: string;
  internshipName: string;
  /** Identifies the cohort, so the seat offer can link straight to it. */
  slug: string;
  batchId: string;
};

/**
 * Gathered before the slot is claimed, so a missing user does not burn a
 * candidate's only notification.
 */
const loadContext = async (
  enrollmentId: mongoose.Types.ObjectId,
): Promise<EntranceContext | null> => {
  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId)
    .select("user internship internshipSnapshot.slug batchSnapshot.batchId")
    .lean<{
      user: mongoose.Types.ObjectId;
      internship: mongoose.Types.ObjectId;
      internshipSnapshot?: { slug?: string };
      batchSnapshot?: { batchId?: string };
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
      .select("title")
      .lean<{ title?: string }>(),
  ]);

  const email = user?.email?.trim();
  if (!email) return null;

  return {
    email,
    name:
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name?.trim() ||
      "there",
    internshipName: internship?.title?.trim() || "your internship",
    slug: enrollment.internshipSnapshot?.slug?.trim() || "",
    batchId: enrollment.batchSnapshot?.batchId?.trim() || "",
  };
};

/**
 * Send the entrance exam outcome email for a status change, if this transition
 * warrants one.
 *
 * Returns whether an email was dispatched. Never throws: an admin's status change
 * must not fail because a notification could not be sent.
 */
export const sendEntranceExamResultEmail = async (
  enrollmentId: string,
  previousStatus: string,
  newStatus: string,
): Promise<boolean> => {
  try {
    const selected = isEntranceSelection(previousStatus, newStatus);
    const rejected = isAnnounceableEntranceRejection(previousStatus, newStatus);
    if (!selected && !rejected) return false;

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) return false;
    const _id = new mongoose.Types.ObjectId(enrollmentId);

    const context = await loadContext(_id);
    if (!context) {
      console.error(
        `[Entrance Mail] No contactable candidate for enrollment ${enrollmentId} — skipping.`,
      );
      return false;
    }

    if (!(await claimSendSlot(_id))) return false;

    const year = new Date().getFullYear();
    const to = [{ email: context.email, name: context.name }];

    if (selected) {
      entranceExamPassedMail.send(to, {
        name: context.name,
        internshipName: context.internshipName,
        ctaUrl: dashboardInternshipsUrl(),
        year,
      });
    } else {
      entranceExamRejectedMail.send(to, {
        name: context.name,
        internshipName: context.internshipName,
        // The enroll form in seat mode with their cohort preselected, not the
        // bare catalogue: a candidate being offered a seat should not have to
        // find their own programme and batch again. Same link the registration
        // email uses, and it survives an expired session.
        confirmSeatUrl: buildConfirmSeatUrl(context.slug, context.batchId),
        year,
      });
    }

    return true;
  } catch (error) {
    console.error(
      `[Entrance Mail] Failed to send entrance result email for enrollment ${enrollmentId}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};
