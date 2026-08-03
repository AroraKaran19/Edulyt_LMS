import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { UserModel } from "../models/user.schema";
import { internshipApplicationReceivedMail } from "../mail";
import {
  RegistrationPath,
  buildCta,
  buildIntroLine,
  buildNextStepLine,
  buildPointsBlock,
  buildSeatOfferBlock,
} from "../lib/internshipApplicationMail";
import {
  buildConfirmSeatUrl,
  dashboardInternshipsUrl,
} from "../lib/internshipSeatUrl";
import { formatIstDate } from "../utils/ist";

/**
 * The "you're registered" email, for every path that creates a registration.
 *
 * Assembles the variables from the enrollment rather than from the caller's
 * locals, so all three registration paths hand over an id and nothing else.
 * Whatever the path stored is what the learner is told, which means the email
 * cannot drift from the row.
 *
 * Every failure in here is swallowed. A learner who registered successfully
 * must not see an error because an email did not go out, exactly as the
 * registration-points award already works.
 */

interface EnrollmentForMail {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  internship?: mongoose.Types.ObjectId;
  internshipSnapshot?: { title?: string; slug?: string };
  batchSnapshot?: { batchId?: string; name?: string };
  applicationSubmittedAt?: Date;
  createdAt?: Date;
}

/**
 * Whether the cohort can actually be bought into.
 *
 * Checked against the live internship rather than the enrollment's snapshot,
 * which does not carry the plan. A cohort with no active plan makes
 * `registerForPaidSeat` refuse, so offering the seat would be a link to a dead
 * end.
 */
const hasActivePaidSeat = async (
  internshipId: mongoose.Types.ObjectId,
  batchId: string,
): Promise<boolean> => {
  const internship = await InternshipModel.findById(internshipId)
    .select("batches")
    .lean<{
      batches?: {
        _id: unknown;
        isActive?: boolean;
        plan?: { price?: number; isActive?: boolean } | null;
      }[];
    } | null>();

  const batch = internship?.batches?.find((b) => String(b._id) === batchId);
  if (!batch || batch.isActive === false) return false;

  const price = Number(batch.plan?.price);
  return Boolean(batch.plan) && batch.plan?.isActive !== false && price > 0;
};

/**
 * Queues the registration email.
 *
 * `awardedPoints` comes from `tryAwardInternshipRegistrationPoints`, which
 * returns what it actually credited. Passing it in rather than re-reading the
 * setting is what keeps the points card honest when the once-per-internship
 * rule suppressed the award.
 */
export const sendInternshipApplicationReceivedEmail = async (
  enrollmentId: string,
  path: RegistrationPath,
  awardedPoints = 0,
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) return;

  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId)
    .select(
      "user internship internshipSnapshot batchSnapshot applicationSubmittedAt createdAt",
    )
    .lean<EnrollmentForMail | null>();
  if (!enrollment?.user || !enrollment.internship) return;

  const user = await UserModel.findById(enrollment.user)
    .select("email firstName lastName")
    .lean<{ email?: string; firstName?: string; lastName?: string } | null>();
  if (!user?.email) return;

  const internshipName = enrollment.internshipSnapshot?.title?.trim() || "";
  const slug = enrollment.internshipSnapshot?.slug?.trim() || "";
  const batchId = enrollment.batchSnapshot?.batchId || "";

  // Only the merit path is offered the paid seat, and only when the cohort
  // actually has one to sell.
  const offerSeat =
    path === "merit" && Boolean(slug && batchId)
      ? await hasActivePaidSeat(enrollment.internship, batchId)
      : false;

  // Shared with the entrance-exam rejection email, which offers the same seat.
  // Empty when the cohort cannot be named, so the offer card is dropped rather
  // than pointing at a catalogue the learner has to search again.
  const seatUrl = slug && batchId ? buildConfirmSeatUrl(slug, batchId) : "";

  const { ctaUrl, ctaLabel } = buildCta(
    path,
    dashboardInternshipsUrl(),
    seatUrl,
  );

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  internshipApplicationReceivedMail.send(
    { email: user.email, name: fullName || user.firstName || "" },
    {
      name: user.firstName || fullName || "there",
      internshipName,
      batchName: enrollment.batchSnapshot?.name?.trim() || "",
      registeredDate: formatIstDate(
        enrollment.applicationSubmittedAt || enrollment.createdAt || new Date(),
      ),
      introLine: buildIntroLine(path, internshipName),
      nextStepLine: buildNextStepLine(path),
      pointsBlock: buildPointsBlock(awardedPoints),
      seatOfferBlock: offerSeat
        ? buildSeatOfferBlock(internshipName, seatUrl)
        : "",
      ctaUrl,
      ctaLabel,
      year: new Date().getFullYear(),
    },
  );
};

/**
 * Fire-and-forget wrapper for the registration paths.
 *
 * Registration has already succeeded by the time this runs, so a mail failure
 * is logged and dropped rather than surfaced.
 */
export const queueInternshipApplicationReceivedEmail = (
  enrollmentId: string,
  path: RegistrationPath,
  awardedPoints = 0,
): void => {
  void sendInternshipApplicationReceivedEmail(
    enrollmentId,
    path,
    awardedPoints,
  ).catch((error) => {
    console.error(
      "Internship registration email failed:",
      error instanceof Error ? error.message : error,
    );
  });
};
