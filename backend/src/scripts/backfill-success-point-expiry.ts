// Pre-expiry balances get today + admin expiry days. Idempotent. Dry run unless --apply.
//   npx ts-node src/scripts/backfill-success-point-expiry.ts [--apply]

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { StudentModel } from "../models/user.schema";
import { getPointsSettings } from "../services/pointsSettings.services";
import {
  creditLots,
  expiryFromDays,
  type SuccessPointLot,
} from "../lib/successPointLots";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const apply = process.argv.includes("--apply");

type Row = {
  _id: mongoose.Types.ObjectId;
  successPoints?: number;
  successPointsLots?: SuccessPointLot[];
  successPointsVersion?: number;
};

const untrackedOf = (s: Row): number =>
  Math.max(0, Math.floor(Number(s.successPoints ?? 0))) -
  (s.successPointsLots ?? []).reduce((sum, lot) => sum + lot.points, 0);

async function backfillOne(id: mongoose.Types.ObjectId, expiresAt: Date): Promise<number> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const s = await StudentModel.findById(id)
      .select("successPoints successPointsLots successPointsVersion")
      .lean<Row | null>();
    if (!s) return 0;
    const untracked = untrackedOf(s);
    if (untracked <= 0) return 0;

    const version = Number(s.successPointsVersion ?? 0);
    const res = await StudentModel.updateOne(
      { _id: id, successPointsVersion: version === 0 ? { $in: [0, null] } : version },
      {
        $set: {
          successPointsLots: creditLots(s.successPointsLots ?? [], 0, [
            { points: untracked, expiresAt },
          ]),
        },
        $inc: { successPointsVersion: 1 },
      },
    );
    if (res.modifiedCount === 1) return untracked;
  }
  throw new Error(`Wallet ${id} kept changing, re-run to retry it`);
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const { successPointsExpiryDays } = await getPointsSettings();
  const expiresAt = expiryFromDays(successPointsExpiryDays);
  if (!expiresAt) {
    console.error("Points expiry is 0 (never). Set it in admin settings first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const students = await StudentModel.find({ successPoints: { $gt: 0 } })
    .select("successPoints successPointsLots")
    .lean<Row[]>();
  const due = students.filter((s) => untrackedOf(s) > 0);
  const total = due.reduce((sum, s) => sum + untrackedOf(s), 0);

  console.log(`Expiry window:         ${successPointsExpiryDays} days`);
  console.log(`Expires at:            ${expiresAt.toISOString()}`);
  console.log(`Wallets to backfill:   ${due.length}`);
  console.log(`Points getting expiry: ${total}`);

  if (!apply) {
    console.log("\nDRY RUN, re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  let wallets = 0;
  let points = 0;
  for (const s of due) {
    const added = await backfillOne(s._id, expiresAt);
    if (added > 0) {
      wallets++;
      points += added;
    }
  }

  console.log(`\nApplied. ${points} points across ${wallets} wallets now expire.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
