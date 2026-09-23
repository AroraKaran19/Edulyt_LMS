/**
 * Migration: the Sales intern kind was retired. Existing sales interns become
 * marketing interns, so their links, leads and dashboard tab keep working.
 *
 * Dry run: npm run scripts:migrate-ca-kind
 * Apply:   npm run scripts:migrate-ca-kind:apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { CrmProfileModel } from "../models";

dotenv.config();

const APPLY = process.argv.includes("--apply");

async function migrateCaKind() {
  let failed = false;
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    const filter = { ambassadorKind: "sales" };
    const count = await CrmProfileModel.countDocuments(filter);
    console.log(`${count} profile(s) still carry the sales intern kind`);

    if (APPLY && count > 0) {
      const result = await CrmProfileModel.updateMany(filter, {
        $set: { ambassadorKind: "marketing" },
      });
      console.log(`Moved ${result.modifiedCount} to the marketing intern kind`);
    } else if (!APPLY) {
      console.log("Dry run. Re-run with --apply to write.");
    }
  } catch (error) {
    failed = true;
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
  }
}

void migrateCaKind();
