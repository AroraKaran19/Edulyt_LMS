/**
 * CLEANUP for the login-bonus bug: each student keeps exactly ONE "login"
 * welcome reward (the earliest); all duplicate login rewards are removed and
 * the exceed points deducted from the balance. Balance is clamped at 0 — users
 * who would go negative (already spent points) are reported, not overdrawn.
 *
 * Only touches students who received the login reward MORE THAN ONCE.
 * Other reward sources and single-bonus users are left untouched.
 *
 *   npx ts-node src/scripts/remove-duplicate-login-reward-points.ts          # dry run
 *   npx ts-node src/scripts/remove-duplicate-login-reward-points.ts --apply  # write
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { StudentModel } from "../models/user.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const apply = process.argv.includes("--apply");

type Plan = {
  id: string;
  email: string;
  removeTxIds: string[];
  exceed: number;
  oldBalance: number;
  newBalance: number;
  clamped: boolean;
};

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const students = (await StudentModel.find({
    "successPointsHistory.rewardSource": "login",
  })
    .select("email successPoints successPointsHistory")
    .lean()) as any[];

  const plans: Plan[] = [];

  for (const s of students) {
    const history = (s.successPointsHistory ?? []) as any[];
    const loginTx = history.filter(
      (t) => t.type === "reward" && t.rewardSource === "login",
    );
    if (loginTx.length <= 1) continue; // single bonus → keep as-is

    // Keep the earliest login reward; remove the rest.
    const sorted = [...loginTx].sort(
      (a, b) =>
        new Date(a.earnedAt ?? 0).getTime() - new Date(b.earnedAt ?? 0).getTime(),
    );
    const toRemove = sorted.slice(1);
    const removeTxIds = toRemove
      .map((t) => String(t.transactionId))
      .filter(Boolean);
    const exceed = toRemove.reduce((a, t) => a + Number(t.points || 0), 0);

    const oldBalance = Number(s.successPoints || 0);
    const rawNew = oldBalance - exceed;
    const newBalance = Math.max(0, rawNew);

    plans.push({
      id: String(s._id),
      email: s.email,
      removeTxIds,
      exceed,
      oldBalance,
      newBalance,
      clamped: rawNew < 0,
    });
  }

  const totalTx = plans.reduce((a, p) => a + p.removeTxIds.length, 0);
  const totalDeducted = plans.reduce(
    (a, p) => a + (p.oldBalance - p.newBalance),
    0,
  );
  const clampedUsers = plans.filter((p) => p.clamped);

  console.log(`Users with duplicate login rewards: ${plans.length}`);
  console.log(`Duplicate transactions to remove:   ${totalTx}`);
  console.log(`Total points to deduct (clamped):   ${totalDeducted}`);
  console.log(`Users clamped at zero (review!):    ${clampedUsers.length}`);
  for (const c of clampedUsers) {
    console.log(
      `  CLAMP ${c.email}  exceed=${c.exceed}  oldBal=${c.oldBalance} → 0 (raw ${c.oldBalance - c.exceed})`,
    );
  }

  if (!apply) {
    console.log("\nDRY RUN — re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  for (const p of plans) {
    await StudentModel.updateOne(
      { _id: new mongoose.Types.ObjectId(p.id) },
      {
        $set: { successPoints: p.newBalance },
        $pull: {
          successPointsHistory: { transactionId: { $in: p.removeTxIds } },
        },
      },
    );
    updated++;
  }

  console.log(`\nApplied. Updated ${updated} students.`);
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
