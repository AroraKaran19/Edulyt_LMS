import mongoose from "mongoose";
import { CaApplicationModel, CaTaskSubmissionModel, CrmProfileModel } from "../models";
import type { CaDocumentJob } from "../models/caDocumentJob.schema";
import type { CaApplication } from "../types/caApplication";
import type { AmbassadorKind } from "../types/crm";
import { caDesignation } from "../lib/caDocuments";
import { parseIstDateOnly, ymdIst } from "../utils/ist";
import {
  ensureCaInternId,
  ensureCaJoiningDate,
  loadCaAvailablePointsSources,
  requiredCaPoints,
  sumCaAvailablePoints,
} from "./caApplicationReview.services";
import { getCaPageSettings } from "./caPageSettings.services";
import { renderCaCompletionDocuments, renderCaOfferLetter, type CaRenderable } from "./caDocuments.services";
import { sendCaApprovedEmail, sendCaCompletionEmail, sendCaNotEligibleEmail } from "./caApplicationMail.services";
import {
  claimNextCaDocumentJob,
  completeCaDocumentJob,
  enqueueCaDocumentJob,
  failCaDocumentJob,
} from "./caDocumentJob.services";

const designationFor = async (kind: AmbassadorKind | null | undefined): Promise<string> => {
  const settings = await getCaPageSettings();
  return caDesignation(
    settings.documents?.designations ?? { marketing: "", "social-media": "" },
    kind ?? "marketing",
  );
};

const processOfferLetter = async (job: CaDocumentJob, app: CaApplication): Promise<void> => {
  const { joiningDate, endDate } = await ensureCaJoiningDate(app);
  const appWithDates: CaApplication = { ...app, joiningDate, endDate };
  let url = appWithDates.documents?.offerLetter?.url;
  if (!url) {
    const internId = await ensureCaInternId(appWithDates._id, appWithDates.internId);
    const appWithInternId: CaApplication = { ...appWithDates, internId };
    const ref = await renderCaOfferLetter(appWithInternId as CaRenderable, await designationFor(app.kind));
    await CaApplicationModel.updateOne({ _id: app._id }, { $set: { "documents.offerLetter": ref } });
    url = ref.url;
  }
  // "already-sent" means an earlier attempt won the claim: the job still completes,
  // never retries. Only "failed" goes back through the retry/alert policy.
  const outcome = await sendCaApprovedEmail(appWithDates, url);
  if (outcome === "failed") {
    await failCaDocumentJob(job, new Error("offer letter email send failed"));
    return;
  }
  await completeCaDocumentJob(job._id);
};

const processCompletion = async (job: CaDocumentJob, app: CaApplication): Promise<void> => {
  // Once the documents are issued, a hold has nothing left to stop; taking this
  // branch anyway would drop a retried completion email for good (lifting the
  // hold only re-arms the job when `issuedAt` is still null).
  if (app.completion?.hold && !app.completion?.issuedAt) {
    await CaApplicationModel.updateOne({ _id: app._id }, { $set: { "completion.queuedAt": null } });
    await completeCaDocumentJob(job._id, "on hold");
    return;
  }

  let docs = {
    lor: app.documents?.lor?.url,
    internshipCertificate: app.documents?.internshipCertificate?.url,
    trainingCertificate: app.documents?.trainingCertificate?.url,
  };
  if (!app.completion?.issuedAt) {
    const refs = await renderCaCompletionDocuments(app as CaRenderable, await designationFor(app.kind));
    await CaApplicationModel.updateOne(
      { _id: app._id },
      {
        $set: {
          "documents.lor": refs.lor,
          "documents.internshipCertificate": refs.internshipCertificate,
          "documents.trainingCertificate": refs.trainingCertificate,
          "completion.issuedAt": new Date(),
        },
      },
    );
    docs = {
      lor: refs.lor.url,
      internshipCertificate: refs.internshipCertificate.url,
      trainingCertificate: refs.trainingCertificate.url,
    };
  }

  if (docs.lor && docs.internshipCertificate && docs.trainingCertificate) {
    const outcome = await sendCaCompletionEmail(app, {
      lor: docs.lor,
      internshipCertificate: docs.internshipCertificate,
      trainingCertificate: docs.trainingCertificate,
    });
    if (outcome === "failed") {
      await failCaDocumentJob(job, new Error("completion email send failed"));
      return;
    }
  }
  await completeCaDocumentJob(job._id);
};

export const processCaDocumentJob = async (job: CaDocumentJob): Promise<void> => {
  try {
    // Neither rendering nor mailing needs the payout ciphertext or the address.
    const app = (await CaApplicationModel.findById(job.applicationId, {
      payout: 0,
      address: 0,
    }).lean()) as CaApplication | null;
    if (!app) {
      await completeCaDocumentJob(job._id, "application deleted");
      return;
    }
    if (job.kind === "offer-letter") await processOfferLetter(job, app);
    else await processCompletion(job, app);
  } catch (error) {
    console.error(`[CA Worker] ${job.kind} job for ${String(job.applicationId)} failed:`, error);
    await failCaDocumentJob(job, error);
  }
};

/** Sequential on purpose: each job starts LibreOffice, which is the resource ceiling. */
export const runCaDocumentJobs = async (limit = 5): Promise<number> => {
  let processed = 0;
  while (processed < limit) {
    const job = await claimNextCaDocumentJob();
    if (!job) break;
    await processCaDocumentJob(job);
    processed += 1;
  }
  return processed;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Queues the completion documents of CAs whose tenure has ended. Anyone no longer
 * on a roster is marked skipped rather than re-read every tick, which would let
 * a backlog of leavers starve everyone behind them. Eligibility (caPoints vs a
 * percentage of the points available over the CA's own tenure, or an admin
 * override) decides completion documents vs a one-time "not eligible" email;
 * a pending file review holds the decision until it clears or 7 days past the
 * end date, whichever comes first.
 */
export const runCaCompletionSweep = async (
  now = new Date(),
  limit = 50,
): Promise<{ due: number; queued: number; skipped: number; notEligible: number }> => {
  // `endDate` is the IST midnight that starts the last tenure day, so the tenure
  // is over only once today's IST midnight is past it.
  const startOfTodayIst = parseIstDateOnly(ymdIst(now) ?? "") ?? now;
  const due = (await CaApplicationModel.find(
    {
      status: "attached",
      endDate: { $lt: startOfTodayIst },
      "completion.issuedAt": null,
      "completion.queuedAt": null,
      "completion.skippedAt": null,
      "completion.hold": { $ne: true },
    },
    {
      userId: 1,
      caPoints: 1,
      joiningDate: 1,
      endDate: 1,
      name: 1,
      email: 1,
      "completion.certificateOverride": 1,
    },
  )
    .sort({ endDate: 1 })
    .limit(limit)
    .lean()) as Array<{
    _id: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId | null;
    caPoints?: number;
    joiningDate?: Date | null;
    endDate: Date;
    name: string;
    email: string;
    completion?: { certificateOverride?: "pass" | "fail" | null };
  }>;
  if (due.length === 0) return { due: 0, queued: 0, skipped: 0, notEligible: 0 };

  // Tasks and meetings are the same pool for every CA; loaded once per tick
  // and summed per row below, instead of one query per CA (N+1).
  const [onRoster, pendingReviewRows, settings, pointsSources] = await Promise.all([
    CrmProfileModel.find(
      { userId: { $in: due.map((d) => d.userId).filter(Boolean) }, parentUserId: { $ne: null }, codeActive: true },
      { userId: 1 },
    ).lean(),
    CaTaskSubmissionModel.find({ applicationId: { $in: due.map((d) => d._id) }, pendingReview: true }, { applicationId: 1 }).lean(),
    getCaPageSettings(),
    loadCaAvailablePointsSources(now),
  ]);
  const active = new Set(onRoster.map((p) => String(p.userId)));
  const pending = new Set(pendingReviewRows.map((r: any) => String(r.applicationId)));
  const thresholdPct = settings.enrollment.certificationThresholdPct;

  // Each row is an independent document, so the batch runs concurrently instead
  // of one round trip per row; a single row's failure does not lose the rest.
  const outcomes = await Promise.all(
    due.map(async (row) => {
      try {
        if (!row.userId || !active.has(String(row.userId))) {
          await CaApplicationModel.updateOne({ _id: row._id }, { $set: { "completion.skippedAt": now } });
          return "skipped" as const;
        }

        const graceUntil = row.endDate.getTime() + SEVEN_DAYS_MS;
        if (pending.has(String(row._id)) && now.getTime() < graceUntil) {
          return "waiting" as const;
        }

        const points = row.caPoints ?? 0;
        // Available points cover the whole tenure, since the sweep only ever
        // runs on or after the CA's own end date.
        const availablePoints = sumCaAvailablePoints(row, pointsSources, now);
        const requiredPoints = requiredCaPoints(availablePoints, thresholdPct);
        const override = row.completion?.certificateOverride ?? null;
        const eligible =
          override === "pass"
            ? true
            : override === "fail"
              ? false
              : thresholdPct === 0 || points >= requiredPoints;
        if (eligible) {
          await enqueueCaDocumentJob(row._id, "completion");
          await CaApplicationModel.updateOne(
            { _id: row._id },
            { $set: { "completion.queuedAt": now, "completion.outcome": "eligible" } },
          );
          return "queued" as const;
        }

        await CaApplicationModel.updateOne(
          { _id: row._id },
          { $set: { "completion.queuedAt": now, "completion.outcome": "not-eligible" } },
        );
        // `minPoints` is the not-eligible template's variable name; the value
        // passed is the required-points figure for this CA's own tenure.
        const mail = await sendCaNotEligibleEmail(row, points, requiredPoints);
        if (mail === "failed") {
          // Un-stamp so the next sweep retries; the mail's claim marker still sends it once.
          await CaApplicationModel.updateOne({ _id: row._id }, { $set: { "completion.queuedAt": null } });
          return "error" as const;
        }
        return "not-eligible" as const;
      } catch (error) {
        console.error(`[CA Worker] completion sweep failed for application ${String(row._id)}:`, error);
        return "error" as const;
      }
    }),
  );

  return {
    due: due.length,
    queued: outcomes.filter((o) => o === "queued").length,
    skipped: outcomes.filter((o) => o === "skipped").length,
    notEligible: outcomes.filter((o) => o === "not-eligible").length,
  };
};
