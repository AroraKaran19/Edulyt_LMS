import mongoose from "mongoose";
import { CaApplicationModel, UserModel } from "../models";
import {
  caApplicationApprovedMail,
  caApplicationReceivedMail,
  caCompletionMail,
} from "../mail/caApplication.mail";
import { brandPageBaseUrl } from "../lib/brandSiteUrl";
import { escapeHtml } from "../lib/htmlEscape";
import { formatIstDate } from "../utils/ist";
import { getCaPageSettings } from "./caPageSettings.services";
import { caDesignation } from "../lib/caDocuments";
import type { AmbassadorKind } from "../types/crm";
import type { CaApplication } from "../types/caApplication";

export const AMBASSADOR_KIND_LABEL: Record<AmbassadorKind, string> = {
  marketing: "Marketing intern",
  "social-media": "Social media marketing intern",
};

const recipient = (app: Pick<CaApplication, "name" | "email">) => [
  { email: app.email, name: app.name },
];

/** No marker: a person can hold only one open application, so this fires once per application. */
export const queueCaReceivedEmail = (
  app: Pick<CaApplication, "name" | "email" | "joiningDate" | "durationMonths">,
  whatsappLink: string,
): void => {
  caApplicationReceivedMail.send(recipient(app), {
    name: app.name,
    joiningDate: formatIstDate(app.joiningDate),
    durationMonths: app.durationMonths,
    whatsappLink,
    year: new Date().getFullYear(),
  });
};

type Marker = "approvedAt" | "completionAt";

const claim = async (id: mongoose.Types.ObjectId, marker: Marker): Promise<boolean> => {
  const res = await CaApplicationModel.updateOne(
    { _id: id, [`emails.${marker}`]: null },
    { $set: { [`emails.${marker}`]: new Date() } },
  );
  return res.modifiedCount === 1;
};

const release = async (id: mongoose.Types.ObjectId, marker: Marker): Promise<void> => {
  await CaApplicationModel.updateOne({ _id: id }, { $set: { [`emails.${marker}`]: null } });
};

/**
 * "already-sent" means an earlier attempt already won the claim (its send may
 * still be in flight, or already delivered): callers must treat this as success,
 * never retry. "failed" is the only outcome that should be retried.
 */
export type CaMailOutcome = "sent" | "already-sent" | "failed";

/** Never throws: the offer letter already exists whether or not the mail goes out. */
export const sendCaApprovedEmail = async (
  app: CaApplication,
  offerLetterUrl: string,
): Promise<CaMailOutcome> => {
  let claimed = false;
  try {
    if (!(await claim(app._id, "approvedAt"))) return "already-sent";
    claimed = true;

    const settings = await getCaPageSettings();
    const hasAccount = Boolean(
      app.userId || (await UserModel.findOne({ email: app.email }, { _id: 1 }).lean()),
    );
    const site = brandPageBaseUrl("airkrit");
    const kind = (app.kind ?? "marketing") as AmbassadorKind;

    const result = await caApplicationApprovedMail.sendNow(
      recipient(app),
      {
        name: app.name,
        kindLabel: AMBASSADOR_KIND_LABEL[kind],
        joiningDate: formatIstDate(app.joiningDate),
        durationMonths: app.durationMonths,
        accountLine: hasAccount
          ? "Log in to Airkrit to find your Ambassador tab and the link you share with students."
          : `Create your Airkrit account with <strong style="color:#2B1508;">${escapeHtml(app.email)}</strong> and you join your team automatically. Your Ambassador tab and your link appear as soon as you do.`,
        actionUrl: `${site}/${hasAccount ? "login" : "register"}`,
        actionLabel: hasAccount ? "Log in" : "Create your account",
        whatsappLink: settings.form.whatsappLink,
        year: new Date().getFullYear(),
      },
      { attachments: [{ file: offerLetterUrl, filename: "Airkrit Offer Letter.pdf" }] },
    );

    if (!result.ok) {
      await release(app._id, "approvedAt");
      console.error(`[CA Mail] Approved email refused for ${String(app._id)}: ${result.error}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error(`[CA Mail] Approved email failed for ${String(app._id)}:`, error);
    if (claimed) await release(app._id, "approvedAt").catch(() => undefined);
    return "failed";
  }
};

export const sendCaCompletionEmail = async (
  app: CaApplication,
  docs: { lor: string; internshipCertificate: string; trainingCertificate: string },
): Promise<CaMailOutcome> => {
  let claimed = false;
  try {
    if (!(await claim(app._id, "completionAt"))) return "already-sent";
    claimed = true;

    const settings = await getCaPageSettings();
    const kind = (app.kind ?? "marketing") as AmbassadorKind;
    const result = await caCompletionMail.sendNow(
      recipient(app),
      {
        name: app.name,
        designation: caDesignation(settings.documents.designations, kind),
        endDate: formatIstDate(app.endDate),
        year: new Date().getFullYear(),
      },
      {
        attachments: [
          { file: docs.lor, filename: "Airkrit Letter of Recommendation.pdf" },
          { file: docs.internshipCertificate, filename: "Airkrit Internship Certificate.pdf" },
          { file: docs.trainingCertificate, filename: "Airkrit Training Certificate.pdf" },
        ],
      },
    );

    if (!result.ok) {
      await release(app._id, "completionAt");
      console.error(`[CA Mail] Completion email refused for ${String(app._id)}: ${result.error}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error(`[CA Mail] Completion email failed for ${String(app._id)}:`, error);
    if (claimed) await release(app._id, "completionAt").catch(() => undefined);
    return "failed";
  }
};
