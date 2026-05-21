/**
 * One-time cleanup: remove orphaned task-template references from internship
 * batches — `batches[].taskTemplateIds` entries that point to an
 * `InternshipTask` document that no longer exists.
 *
 * New deletions are already handled: `deleteInternshipTaskAdmin` `$pull`s the
 * id from every batch. This script clears legacy orphans left from task
 * deletions that happened before that cascade existed.
 *
 * Dry-run by default — prints the planned change and writes nothing.
 * Pass `--apply` to persist.
 *
 * Run (dry-run):  npm run scripts:cleanup-orphan-task-templates
 * Run (apply):    npm run scripts:cleanup-orphan-task-templates:apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { InternshipModel } from "../models/internship.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";

dotenv.config();

interface RawBatch {
  _id?: unknown;
  name?: string;
  taskTemplateIds?: unknown[];
}

interface RawInternship {
  _id: unknown;
  title?: string;
  batches?: RawBatch[];
}

async function cleanupOrphanTaskTemplates() {
  const apply = process.argv.includes("--apply");

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");
    console.log(
      apply
        ? "Mode: APPLY — changes will be written.\n"
        : "Mode: DRY-RUN — no changes will be written. Pass --apply to persist.\n",
    );

    const internships = (await InternshipModel.find({})
      .select("title batches._id batches.name batches.taskTemplateIds")
      .lean()) as unknown as RawInternship[];

    if (internships.length === 0) {
      console.log("No internships found — nothing to clean up.");
      return;
    }

    // Collect every referenced task-template id, then find which still exist.
    const referencedIds = new Set<string>();
    for (const ins of internships) {
      for (const b of ins.batches ?? []) {
        for (const id of b.taskTemplateIds ?? []) {
          if (id != null) referencedIds.add(String(id));
        }
      }
    }

    if (referencedIds.size === 0) {
      console.log("No batches reference any task templates — nothing to do.");
      return;
    }

    const existing = await InternshipTaskModel.find({
      _id: {
        $in: [...referencedIds].map(
          (id) => new mongoose.Types.ObjectId(id),
        ),
      },
    })
      .select("_id")
      .lean();
    const existingIds = new Set(existing.map((t) => String(t._id)));

    let internshipsUpdated = 0;
    let orphansRemoved = 0;

    for (const ins of internships) {
      const title = String(ins.title ?? "(untitled)");
      const batches = Array.isArray(ins.batches) ? ins.batches : [];
      let changedThisInternship = false;

      const nextBatches = batches.map((b) => {
        const ids = (b.taskTemplateIds ?? []).map((x) => String(x));
        const kept = ids.filter((id) => existingIds.has(id));
        const removed = ids.filter((id) => !existingIds.has(id));
        if (removed.length === 0) return b;
        changedThisInternship = true;
        orphansRemoved += removed.length;
        const batchLabel = b.name ? `"${b.name}"` : String(b._id);
        console.log(
          `  →  ${title} / batch ${batchLabel} — drop ${removed.length} orphan(s): ${removed.join(", ")}`,
        );
        return {
          ...b,
          taskTemplateIds: kept.map((id) => new mongoose.Types.ObjectId(id)),
        };
      });

      if (!changedThisInternship) continue;

      if (apply) {
        await InternshipModel.updateOne(
          { _id: ins._id as mongoose.Types.ObjectId },
          { $set: { batches: nextBatches } },
        );
      }
      internshipsUpdated++;
    }

    console.log("\n──────── Summary ────────");
    console.log(`Internships scanned        : ${internships.length}`);
    console.log(
      `${apply ? "Internships updated" : "Internships to update"}    : ${internshipsUpdated}`,
    );
    console.log(`Orphan references removed  : ${orphansRemoved}`);
    if (!apply && orphansRemoved > 0) {
      console.log("\nRe-run with --apply to persist these changes.");
    }
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

cleanupOrphanTaskTemplates();
