import mongoose from "mongoose";
import { CaApplicationModel, CrmProfileModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { cleanCaApplicationInput } from "../lib/caApplication";
import { encryptCaText } from "../lib/caPii";
import { getCaPageSettings } from "./caPageSettings.services";
import { resolveCrmCode } from "./crmProfile.services";
import { queueCaReceivedEmail } from "./caApplicationMail.services";
import type { CaReferrer } from "../types/caApplication";

export interface CaContact {
  email: string;
  phone: string;
  userId?: string;
}

/**
 * Only a marketer's or sales person's code recruits. Anything else, including a
 * lookup failure, makes this a direct application rather than a refusal.
 */
export const resolveCaReferrer = async (ref: unknown): Promise<CaReferrer | null> => {
  const code = String(ref ?? "").trim();
  if (!code) return null;
  try {
    const resolved = await resolveCrmCode(code);
    if (!resolved || (resolved.role !== "marketer" && resolved.role !== "sales")) {
      return null;
    }
    return {
      userId: new mongoose.Types.ObjectId(resolved.userId),
      code: resolved.code,
      name: resolved.name,
    };
  } catch (error) {
    console.error("[ca-applications] referrer lookup failed:", error);
    return null;
  }
};

export const submitCaApplication = async (
  body: Record<string, unknown>,
  contact: CaContact,
): Promise<{ id: string }> => {
  const settings = await getCaPageSettings({ fresh: true });
  const { acceptingApplications, durations } = settings.enrollment;
  if (!acceptingApplications || durations.length === 0) {
    // Not a 5xx: the error middleware hides those messages outside development.
    throw new AppError("Applications are not open yet", 409, "CA_APPLICATIONS_CLOSED");
  }
  const durationMonths = Number(body.durationMonths);
  if (!durations.includes(durationMonths)) {
    throw new AppError("Choose one of the available durations", 400);
  }

  const email = contact.email.trim().toLowerCase();
  const phone = contact.phone.trim();
  const input = cleanCaApplicationInput(
    body,
    settings.form.fields,
    settings.form.languages,
    phone,
  );

  const signedInId =
    contact.userId && mongoose.isValidObjectId(contact.userId)
      ? new mongoose.Types.ObjectId(contact.userId)
      : null;
  const account = signedInId
    ? { _id: signedInId }
    : ((await UserModel.findOne({ email }, { _id: 1 }).lean()) as {
        _id: mongoose.Types.ObjectId;
      } | null);

  if (account) {
    const onRoster = await CrmProfileModel.findOne(
      { userId: account._id, parentUserId: { $ne: null } },
      { _id: 1 },
    ).lean();
    if (onRoster) {
      throw new AppError("You are already a campus ambassador", 409, "CA_ALREADY_AMBASSADOR");
    }
  }

  const referrer = await resolveCaReferrer(body.ref);

  try {
    const doc = await CaApplicationModel.create({
      name: input.name,
      email,
      phone,
      submittedByUserId: signedInId,
      userId: account?._id ?? null,
      collegeId: input.collegeId,
      collegeName: input.collegeName,
      careerStage: input.careerStage,
      degree: input.degree,
      collegeEmail: input.collegeEmail,
      languages: input.languages,
      whatsappJoined: input.whatsappJoined,
      payout: input.payout
        ? { method: input.payout.method, ...encryptCaText(input.payout.value) }
        : null,
      address: input.address,
      joiningDate: null,
      durationMonths,
      endDate: null,
      referrer,
      status: "pending",
      open: true,
    });
    queueCaReceivedEmail({ name: input.name, email, durationMonths }, settings.form.whatsappLink);
    return { id: String(doc._id) };
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(
        "You have already applied. We'll be in touch soon.",
        409,
        "CA_ALREADY_APPLIED",
      );
    }
    throw error;
  }
};
