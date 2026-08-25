/**
 * One-time migration: rename `removed[].collection` to `removed[].collectionName`
 * on every role-change job.
 *
 * `collection` is a reserved property on a Mongoose document (the driver's
 * Collection handle), so a schema path of that name shadows it on any hydrated
 * subdocument. The schema now declares `collectionName`; this brings rows
 * written before that change into line so the audit trail has one spelling.
 *
 * Safe to run at any point relative to the deploy: nothing reads the field. It
 * is written once when a job completes and is only ever read by eye, so there
 * is no window where old and new rows behave differently.
 *
 * Idempotent. A second run finds nothing left to rename.
 *
 * Dry-run by default - prints the planned change and writes nothing.
 * Pass `--apply` to persist.
 *
 * Run (dry-run):  npm run scripts:rename-role-change-collection-key
 * Run (apply):    npm run scripts:rename-role-change-collection-key:apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { RoleChangeJobModel } from "../models/roleChangeJob.schema";

dotenv.config();

interface RawRemovedSet {
  collection?: string;
  collectionName?: string;
  count?: number;
}

interface RawJob {
  _id: unknown;
  jobId?: string;
  direction?: string;
  removed?: RawRemovedSet[];
}

/** Every job still carrying the pre-rename key. */
const STALE = { "removed.collection": { $exists: true } };

async function renameRoleChangeJobCollectionKey() {
  const apply = process.argv.includes("--apply");

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");
    console.log(
      apply
        ? "Mode: APPLY - changes will be written.\n"
        : "Mode: DRY-RUN - no changes will be written. Pass --apply to persist.\n",
    );

    // Driver-level, not through the model: the old key is no longer in the
    // schema, so a Mongoose projection would strip the very field this script
    // exists to find.
    const jobs = RoleChangeJobModel.collection;

    const stale = (await jobs
      .find(STALE)
      .project({ jobId: 1, direction: 1, removed: 1 })
      .toArray()) as unknown as RawJob[];

    if (stale.length === 0) {
      console.log("No job carries the old `removed[].collection` key.");
      return;
    }

    let entriesToRename = 0;
    for (const job of stale) {
      const entries = (job.removed ?? []).filter(
        (r) => r.collection !== undefined,
      );
      entriesToRename += entries.length;
      console.log(
        `${job.jobId ?? String(job._id)} (${job.direction ?? "?"}): ` +
          entries.map((r) => `${r.collection}=${r.count ?? 0}`).join(", "),
      );
    }

    if (apply) {
      // An update pipeline rather than a read-then-write: `$rename` cannot
      // reach inside an array, and rebuilding the manifest server-side means no
      // stale copy of it ever travels back from this process. `$ifNull` is what
      // makes a re-run a no-op on rows already carrying the new key.
      const result = await jobs.updateMany(STALE, [
        {
          $set: {
            removed: {
              $map: {
                input: "$removed",
                as: "entry",
                in: {
                  collectionName: {
                    $ifNull: ["$$entry.collectionName", "$$entry.collection"],
                  },
                  count: "$$entry.count",
                  ids: "$$entry.ids",
                  truncated: "$$entry.truncated",
                },
              },
            },
          },
        },
      ]);
      console.log(`\nModified ${result.modifiedCount} job(s).`);

      const left = await jobs.countDocuments(STALE);
      if (left > 0) {
        console.log(`WARNING: ${left} job(s) still carry the old key.`);
      }
    }

    console.log("\n-------- Summary --------");
    console.log(`Jobs carrying the old key  : ${stale.length}`);
    console.log(
      `${apply ? "Entries renamed" : "Entries to rename"}          : ${entriesToRename}`,
    );
    if (!apply) {
      console.log("\nRe-run with --apply to persist these changes.");
    }
  } catch (error) {
    console.error("Rename failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

renameRoleChangeJobCollectionKey();
