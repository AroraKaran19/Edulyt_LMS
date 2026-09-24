/**
 * Clears finished lead import jobs from the Lead imports page. By default only
 * jobs with no leads left are removed; --all removes every finished job.
 * Queued and running jobs are never touched.
 *
 * Dry run: npm run scripts:clear-lead-import-history
 * Apply:   npm run scripts:clear-lead-import-history:apply  (append -- --all for every finished job)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { LeadModel } from "../models/lead.schema";
import { LeadImportJobModel, LeadImportPayloadModel } from "../models/leadImportJob.schema";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const ALL = process.argv.includes("--all");

async function clearLeadImportHistory() {
  let failed = false;
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");

    const finished = await LeadImportJobModel.find(
      { status: { $in: ["done", "failed"] } },
      { _id: 1, fileName: 1, created: 1 },
    ).lean();

    let targets = finished;
    if (!ALL && finished.length > 0) {
      const withLeads = await LeadModel.aggregate<{ _id: mongoose.Types.ObjectId }>([
        { $match: { "source.importJobId": { $in: finished.map((j) => j._id) } } },
        { $group: { _id: "$source.importJobId" } },
      ]);
      const kept = new Set(withLeads.map((g) => String(g._id)));
      targets = finished.filter((j) => !kept.has(String(j._id)));
    }

    for (const job of targets) {
      console.log(`- ${String(job._id)}  ${job.fileName || "Untitled file"}  (${job.created} added)`);
    }
    console.log(
      `${targets.length} of ${finished.length} finished import(s) to clear${ALL ? "" : " (no leads left)"}`,
    );

    if (!APPLY) {
      console.log("Dry run. Re-run with --apply to delete them.");
      return;
    }

    const ids = targets.map((j) => j._id);
    const [jobs, payloads] = await Promise.all([
      LeadImportJobModel.deleteMany({ _id: { $in: ids } }),
      LeadImportPayloadModel.deleteMany({ jobId: { $in: ids } }),
    ]);
    console.log(`Deleted ${jobs.deletedCount} import(s) and ${payloads.deletedCount} leftover upload(s)`);
  } catch (error) {
    failed = true;
    console.error("Clearing import history failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
  }
}

void clearLeadImportHistory();
