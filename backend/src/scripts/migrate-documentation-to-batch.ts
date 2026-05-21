/**
 * One-time migration: move the documentation submission window from the
 * internship level down to each of its batches.
 *
 *   before: internship.documentationStartAt / documentationEndAt
 *   after:  internship.batches[].documentationStartAt / documentationEndAt
 *
 * For each internship that has a documentation window, the values are copied
 * into every batch that doesn't already have its own window. The internship-
 * level fields are then `$unset`.
 *
 * Operates on the raw `internships` collection, so it works regardless of
 * whether the new schema has been deployed yet. Recommended order is still
 * migrate first, then deploy.
 *
 * Dry-run by default — prints the planned change and writes nothing.
 * Pass `--apply` to persist.
 *
 * Run (dry-run):  npm run scripts:migrate-documentation-to-batch
 * Run (apply):    npm run scripts:migrate-documentation-to-batch:apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

interface RawBatch {
  _id?: unknown;
  name?: string;
  documentationStartAt?: Date | null;
  documentationEndAt?: Date | null;
}

interface RawInternship {
  _id: unknown;
  title?: string;
  documentationStartAt?: Date | null;
  documentationEndAt?: Date | null;
  batches?: RawBatch[];
}

async function migrateDocumentationToBatch() {
  const apply = process.argv.includes("--apply");

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");
    console.log(
      apply
        ? "Mode: APPLY — changes will be written.\n"
        : "Mode: DRY-RUN — no changes will be written. Pass --apply to persist.\n",
    );

    const collection = mongoose.connection.collection("internships");
    const internships = (await collection
      .find({})
      .toArray()) as unknown as RawInternship[];

    if (internships.length === 0) {
      console.log("No internships found — nothing to migrate.");
      return;
    }

    let updated = 0;
    let skippedNoWindow = 0;
    let skippedNoBatches = 0;

    for (const ins of internships) {
      const title = String(ins.title ?? "(untitled)");
      const start = ins.documentationStartAt ?? null;
      const end = ins.documentationEndAt ?? null;

      if (!start && !end) {
        skippedNoWindow++;
        continue;
      }

      const batches = Array.isArray(ins.batches) ? ins.batches : [];
      if (batches.length === 0) {
        skippedNoBatches++;
        console.warn(
          `  ?  "${title}" — has a documentation window but no batches. Skipping.`,
        );
        continue;
      }

      // Fill each batch that lacks its own window.
      let filledCount = 0;
      const nextBatches = batches.map((b) => {
        const hasOwn = b.documentationStartAt || b.documentationEndAt;
        if (hasOwn) return b;
        filledCount++;
        return {
          ...b,
          documentationStartAt: start,
          documentationEndAt: end,
        };
      });

      console.log(
        `  →  "${title}" — copy window to ${filledCount}/${batches.length} batch(es), unset internship-level fields`,
      );

      if (apply) {
        await collection.updateOne(
          { _id: ins._id as mongoose.Types.ObjectId },
          {
            $set: { batches: nextBatches },
            $unset: { documentationStartAt: "", documentationEndAt: "" },
          },
        );
      }
      updated++;
    }

    console.log("\n──────── Summary ────────");
    console.log(`Total internships        : ${internships.length}`);
    console.log(`${apply ? "Migrated" : "Would migrate"}          : ${updated}`);
    console.log(`Skipped (no window)      : ${skippedNoWindow}`);
    if (skippedNoBatches > 0) {
      console.log(`Skipped (no batches)     : ${skippedNoBatches}`);
    }
    if (!apply && updated > 0) {
      console.log("\nRe-run with --apply to persist these changes.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

migrateDocumentationToBatch();
