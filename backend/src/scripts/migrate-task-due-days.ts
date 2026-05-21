/**
 * One-time migration: convert InternshipTask.dueDays from an absolute offset
 * (days from the anchor date) to a window length (days after the unlock date).
 *
 *   old: dueAt = anchor + dueDays
 *   new: dueAt = anchor + unlockAfterDays + dueDays
 *
 * To keep every task's effective due date unchanged:
 *
 *   newDueDays = oldDueDays - unlockAfterDays
 *
 * The previous validation guaranteed oldDueDays >= unlockAfterDays, so the
 * result is never negative; it is still clamped to 0 defensively.
 *
 * Dry-run by default — prints the planned change and writes nothing.
 * Pass `--apply` to persist.
 *
 * Run (dry-run):  npm run scripts:migrate-task-due-days
 * Run (apply):    npm run scripts:migrate-task-due-days:apply
 *
 * IMPORTANT: run exactly once. Re-running would subtract unlockAfterDays again.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { InternshipTaskModel } from "../models/internshipTask.schema";

dotenv.config();

async function migrateTaskDueDays() {
  const apply = process.argv.includes("--apply");

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");
    console.log(
      apply
        ? "Mode: APPLY — changes will be written.\n"
        : "Mode: DRY-RUN — no changes will be written. Pass --apply to persist.\n",
    );

    const tasks = await InternshipTaskModel.find({})
      .select("title unlockAfterDays dueDays")
      .lean();

    if (tasks.length === 0) {
      console.log("No internship tasks found — nothing to migrate.");
      return;
    }

    let changed = 0;
    let unchanged = 0;
    let suspicious = 0;

    for (const task of tasks) {
      const unlockAfterDays =
        typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0;
      const oldDueDays =
        typeof task.dueDays === "number" ? task.dueDays : 0;
      const newDueDays = Math.max(0, oldDueDays - unlockAfterDays);
      const title = String((task as { title?: string }).title ?? "(untitled)");

      // Heuristic: before migration every task had dueDays >= unlockAfterDays.
      // A task already below that suggests the migration may have run before.
      if (unlockAfterDays > 0 && oldDueDays < unlockAfterDays) {
        suspicious++;
        console.warn(
          `  ?  "${title}" — dueDays(${oldDueDays}) < unlockAfterDays(${unlockAfterDays}); already migrated? Skipping.`,
        );
        continue;
      }

      if (newDueDays === oldDueDays) {
        unchanged++;
        continue;
      }

      console.log(
        `  →  "${title}" — unlockAfterDays=${unlockAfterDays}, dueDays ${oldDueDays} → ${newDueDays}`,
      );

      if (apply) {
        await InternshipTaskModel.updateOne(
          { _id: task._id },
          { $set: { dueDays: newDueDays } },
        );
      }
      changed++;
    }

    console.log("\n──────── Summary ────────");
    console.log(`Total tasks       : ${tasks.length}`);
    console.log(`${apply ? "Updated" : "Would update"}     : ${changed}`);
    console.log(`Unchanged         : ${unchanged}`);
    if (suspicious > 0) {
      console.log(`Skipped (suspect) : ${suspicious}`);
    }
    if (!apply && changed > 0) {
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

migrateTaskDueDays();
