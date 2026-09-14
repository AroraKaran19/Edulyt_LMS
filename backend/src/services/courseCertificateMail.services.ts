/**
 * Sends the course certificate emails, exactly once each.
 *
 * Mirrors `internshipClosureMail.services`, minus the withheld case: a course has
 * no verdict, so the only two outcomes are a certificate that exists and one that
 * could not be generated.
 *
 * `issued` is terminal. `pending` is an interim notice and keeps its own marker,
 * so a learner told their certificate is being prepared still receives it once the
 * job is repaired.
 */
import mongoose from "mongoose";
import { asBrand, type Brand } from "../constants/brands";
import { productMailBrand } from "../utils/mailer";
import { EnrollmentModel } from "../models/enrollment.schema";
import { CourseModel } from "../models/course.schema";
import { UserModel } from "../models/user.schema";
import {
  courseCertificateIssuedMail,
  courseCertificatePendingMail,
} from "../mail";
import {
  buildCourseLinkedInShareUrl,
  buildCourseReasonLine,
} from "../lib/courseCertificateMail";

export type CourseCertificateEmailPayload =
  | { kind: "issued"; certificateUrl: string; verificationUrl: string }
  | { kind: "pending" };

const claimFieldFor = (kind: CourseCertificateEmailPayload["kind"]): string =>
  kind === "pending"
    ? "certificatePendingEmailSentAt"
    : "certificateEmailSentAt";

/**
 * Take the send slot, or report that someone already has it.
 *
 * The conditional update is the whole guard: a re-queued job or two workers
 * racing the same enrollment both issue this, and only one matches.
 */
const claimSendSlot = async (
  enrollmentId: mongoose.Types.ObjectId,
  kind: CourseCertificateEmailPayload["kind"],
): Promise<boolean> => {
  const field = claimFieldFor(kind);
  const res = await EnrollmentModel.updateOne(
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
 * would leave the learner certified and never told, with no path to a retry.
 */
const releaseSendSlot = async (
  enrollmentId: mongoose.Types.ObjectId,
  kind: CourseCertificateEmailPayload["kind"],
): Promise<void> => {
  await EnrollmentModel.updateOne(
    { _id: enrollmentId },
    { $unset: { [claimFieldFor(kind)]: "" } },
  );
};

type CourseCertificateContext = {
  email: string;
  name: string;
  courseName: string;
  successPoints: number;
  /** The enrollment's brand, once cutover has moved its course to that site. */
  brand: Brand;
};

/**
 * Everything the templates need, gathered before the slot is claimed so a missing
 * user or course does not burn a learner's only notification.
 */
const loadContext = async (
  enrollmentId: mongoose.Types.ObjectId,
): Promise<CourseCertificateContext | null> => {
  const enrollment = await EnrollmentModel.findById(enrollmentId)
    .select("userId courseId brand")
    .lean<{
      userId: mongoose.Types.ObjectId;
      courseId: mongoose.Types.ObjectId;
      brand?: unknown;
    }>();
  if (!enrollment) return null;

  const [user, course] = await Promise.all([
    UserModel.findById(enrollment.userId)
      .select("firstName lastName name email")
      .lean<{
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
      }>(),
    CourseModel.findById(enrollment.courseId)
      .select("title completionSuccessPoints")
      .lean<{ title?: string; completionSuccessPoints?: number }>(),
  ]);

  const email = user?.email?.trim();
  if (!email) return null;

  return {
    email,
    name:
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name?.trim() ||
      "there",
    courseName: course?.title?.trim() || "your course",
    // Zero or unset means the course awards none, and the copy then says nothing
    // about points rather than claiming zero were earned.
    successPoints: Number(course?.completionSuccessPoints ?? 0),
    brand: productMailBrand(asBrand(enrollment.brand)),
  };
};

/**
 * Send a learner their course certificate, or tell them it is coming.
 *
 * Returns whether an email was dispatched. Never throws: a certificate email must
 * not be able to fail the job that produced the certificate.
 */
export const sendCourseCertificateEmail = async (
  enrollmentId: string,
  payload: CourseCertificateEmailPayload,
): Promise<boolean> => {
  let claimed = false;
  let _id: mongoose.Types.ObjectId | null = null;

  try {
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) return false;
    _id = new mongoose.Types.ObjectId(enrollmentId);

    const context = await loadContext(_id);
    if (!context) {
      console.error(
        `[Course Certificate Mail] No contactable learner for enrollment ${enrollmentId} — skipping.`,
      );
      return false;
    }

    if (!(await claimSendSlot(_id, payload.kind))) return false;
    claimed = true;

    const reasonLine = buildCourseReasonLine(
      context.courseName,
      context.successPoints,
    );
    const year = new Date().getFullYear();
    const to = [{ email: context.email, name: context.name }];

    if (payload.kind === "pending") {
      const pending = await courseCertificatePendingMail.sendNow(
        to,
        {
          name: context.name,
          reasonLine,
          courseName: context.courseName,
          year,
        },
        { brand: context.brand },
      );
      if (!pending.ok) {
        await releaseSendSlot(_id, payload.kind);
        console.error(
          `[Course Certificate Mail] Send rejected for enrollment ${enrollmentId} (pending): ${pending.error}. Slot released.`,
        );
        return false;
      }
      return true;
    }

    const issued = await courseCertificateIssuedMail.sendNow(
      to,
      {
        name: context.name,
        reasonLine,
        courseName: context.courseName,
        certificateUrl: payload.certificateUrl,
        linkedInUrl: buildCourseLinkedInShareUrl(
          context.courseName,
          payload.verificationUrl,
        ),
        year,
      },
      // MSG91 fetches the attachment from this URL at send time. It is a permanent
      // public CDN object, never presigned, so nothing expires.
      {
        brand: context.brand,
        attachments: [
          {
            file: payload.certificateUrl,
            filename: `${context.courseName} Certificate.pdf`,
          },
        ],
      },
    );

    if (!issued.ok) {
      await releaseSendSlot(_id, payload.kind);
      console.error(
        `[Course Certificate Mail] Send rejected for enrollment ${enrollmentId} (issued): ${issued.error}. ` +
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
      `[Course Certificate Mail] Failed to send ${payload.kind} email for enrollment ${enrollmentId}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};
