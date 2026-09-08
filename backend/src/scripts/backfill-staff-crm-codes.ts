/**
 * Mints a CRM code for every marketer and sales user who has none.
 *
 * Codes used to be created on the person's first visit to their own CRM page,
 * which left an admin unable to see or hand out a link for anyone who had not
 * logged in yet. Role assignment mints one now; this covers accounts created
 * before that.
 *
 * Re-runs are safe: anyone who already has a code is skipped, and `ensureCrmCode`
 * is itself idempotent.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/backfill-staff-crm-codes.ts --dry-run
 *   npx ts-node src/scripts/backfill-staff-crm-codes.ts
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { UserModel } from "../models";
import { ensureCrmCode } from "../services/crmProfile.services";
import { CrmProfileModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await connectDB();

  try {
    // The code lives on CrmProfile now, so "missing" means no profile with a
    // code rather than a missing field on the user document.
    const staff = await UserModel.find(
      { userType: { $in: ["marketer", "sales"] } },
      { firstName: 1, lastName: 1, email: 1, userType: 1 },
    ).lean();

    const coded = await CrmProfileModel.find(
      {
        userId: { $in: staff.map((u) => u._id) },
        code: { $type: "string" },
      },
      { userId: 1 },
    ).lean();
    const hasCode = new Set(coded.map((p) => String(p.userId)));

    const missing = staff.filter((u) => !hasCode.has(String(u._id)));

    const total = staff.length;

    console.log(`Staff accounts:      ${total}`);
    console.log(`Missing a code:      ${missing.length}`);
    for (const u of missing) {
      console.log(`  ${String(u.userType).padEnd(9)} ${u.email}`);
    }

    if (dryRun) {
      console.log("\n--dry-run: no database writes.");
      return;
    }
    if (missing.length === 0) return;

    let minted = 0;
    for (const u of missing) {
      try {
        const code = await ensureCrmCode(
          u._id as unknown as mongoose.Types.ObjectId,
        );
        minted += 1;
        console.log(`  ${u.email} -> ${code}`);
      } catch (error) {
        // One collision-exhausted account must not stop the rest.
        console.error(`  ${u.email} FAILED:`, (error as Error).message);
      }
    }
    console.log(`\nDone. Codes minted: ${minted} / ${missing.length}`);
  } finally {
    await disconnectDB();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
