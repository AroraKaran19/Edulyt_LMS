import mongoose from "mongoose";
import { LeadModel } from "../models/lead.schema";
import { UserModel } from "../models/user.schema";
import { ScholarshipTestModel } from "../models/scholarshipTest.schema";
import { resolveCrmCode } from "./crmProfile.services";
import { buildAttribution } from "../lib/leadAttribution";
import { isValidPhone } from "./phoneVerification.services";
import { defaultPair, getLeadPipeline } from "./leadPipelineSettings.services";



/**
 * A readable name for a funnel that only proves an email and a phone.
 *
 * Prefers the platform account, since most people taking a campaign test
 * already have one. Falls back to the email's local part so a sales person has
 * something to open a call with rather than a blank row.
 */
export const nameForScholarshipLead = (
  account: { firstName?: string; lastName?: string } | null,
  email: string,
): string => {
  const fromAccount = [account?.firstName, account?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fromAccount.length >= 2) return fromAccount;

  const handle = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() ?? "";
  const titled = handle
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return titled.length >= 2 ? titled : email;
};

export interface ScholarshipLeadInput {
  testId: string;
  email: string;
  phone: string;
  /** Raw `?ref=` code. Resolved here; never trusted as an identity. */
  ref?: string;
}

/**
 * Records a campaign test start as a lead, so scholarship traffic lands in the
 * same pool as the enquiry form.
 *
 * Never throws: a failure here must not cost someone their test. One lead per
 * (campaign, email), so a resumed or restarted attempt does not create a second.
 */
export const captureScholarshipLead = async (
  input: ScholarshipLeadInput,
): Promise<void> => {
  try {
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();
    if (!isValidPhone(phone)) return;

    const testId = new mongoose.Types.ObjectId(input.testId);

    const existing = await LeadModel.exists({
      email,
      "source.kind": "scholarship",
      "source.testId": testId,
    });
    if (existing) return;

    // Loaded here rather than passed in: the attempt view the caller holds
    // carries no campaign details, and this is already inside the guard that
    // stops a failure reaching the request.
    const campaign = await ScholarshipTestModel.findById(testId, {
      title: 1,
      slug: 1,
      createdByName: 1,
    }).lean();
    if (!campaign) return;

    const account = await UserModel.findOne(
      { email },
      { _id: 1, firstName: 1, lastName: 1 },
    ).lean();

    let attribution = {};
    if (input.ref) {
      const resolved = await resolveCrmCode(String(input.ref));
      if (resolved) {
        const owner = resolved.parentUserId
          ? await UserModel.findById(resolved.parentUserId, {
              firstName: 1,
              lastName: 1,
            }).lean()
          : null;
        attribution = buildAttribution(
          resolved,
          [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim() ||
            "",
        );
      }
    }

    const landing = defaultPair(await getLeadPipeline());
    await LeadModel.create({
      status: landing.status,
      subStatus: landing.subStatus,
      source: {
        kind: "scholarship",
        testId,
        title: campaign.title,
        slug: campaign.slug,
        campaignOwnerName: campaign.createdByName ?? "",
      },
      ...attribution,
      name: nameForScholarshipLead(account, email),
      email,
      phone,
      emailOnPlatform: Boolean(account),
      emailCheckedAt: new Date(),
      platformUserId: account?._id,
      answers: [
        {
          key: "campaign",
          label: "Scholarship campaign",
          value: campaign.title,
        },
      ],
    });
  } catch (error) {
    console.error("[scholarship] lead capture failed:", error);
  }
};
