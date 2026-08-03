/**
 * Tells a learner their cohort moved.
 *
 * No send-once marker, deliberately: a learner can be moved more than once and
 * every move changes their start date. `adminChangeEnrollmentBatch` returns early
 * when the target batch is the one they are already in, so the only emails sent
 * are for real changes.
 *
 * The old cohort name has to be captured by the caller before the snapshot is
 * overwritten, which is why it is a parameter rather than something read here.
 */
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { UserModel } from "../models/user.schema";
import { internshipBatchChangedMail } from "../mail";
import { dashboardInternshipsUrl } from "../lib/internshipSeatUrl";
import { formatIstDate } from "../utils/ist";

export const sendInternshipBatchChangedEmail = async (params: {
  enrollmentId: string;
  oldBatchName: string;
  newBatchName: string;
  newBatchStartDate: Date | string | null | undefined;
}): Promise<boolean> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.enrollmentId)) return false;

    const enrollment = await InternshipEnrollmentModel.findById(
      params.enrollmentId,
    )
      .select("user internship")
      .lean<{
        user: mongoose.Types.ObjectId;
        internship: mongoose.Types.ObjectId;
      }>();
    if (!enrollment) return false;

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
    if (!email) {
      console.error(
        `[Batch Change Mail] No contactable learner for enrollment ${params.enrollmentId} — skipping.`,
      );
      return false;
    }

    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name?.trim() ||
      "there";

    internshipBatchChangedMail.send([{ email, name }], {
      name,
      internshipName: internship?.title?.trim() || "your internship",
      oldBatch: params.oldBatchName?.trim() || "your previous cohort",
      newBatch: params.newBatchName?.trim() || "your new cohort",
      // Cohort starts are IST instants, so the learner must be shown IST rather
      // than whatever the server or their mail client would infer.
      newBatchStartDate: params.newBatchStartDate
        ? formatIstDate(params.newBatchStartDate)
        : "a date we will confirm shortly",
      ctaUrl: dashboardInternshipsUrl(),
      year: new Date().getFullYear(),
    });

    return true;
  } catch (error) {
    console.error(
      `[Batch Change Mail] Failed to notify enrollment ${params.enrollmentId}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};
