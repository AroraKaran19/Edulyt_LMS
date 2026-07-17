/**
 * One-time backfill: freeze each existing ReferralSale's commission onto the row.
 *
 * Commission used to be re-derived on every read from the live tier config, which
 * meant an admin editing the tiers rewrote history. Sales now carry their own
 * `commissionPercent` / `commissionAmount`, frozen at sale time. Rows written
 * before that change have neither, and would read as ₹0.
 *
 * This stamps each existing row with the rate its referrer is on RIGHT NOW —
 * the highest tier whose threshold <= their active sale count, under the current
 * config — which is precisely what the UI is displaying to them today. Nobody's
 * balance moves.
 *
 * Dry-run by default — prints the planned change and writes nothing.
 * Pass `--apply` to persist.
 *
 * Run (dry-run):  npm run scripts:backfill-referral-commission
 * Run (apply):    npm run scripts:backfill-referral-commission:apply
 *
 * Safe to re-run: only rows missing `commissionPercent` are touched.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { ReferralSaleModel } from "../models/referralSale.schema";
import { ReferralCommissionConfigModel } from "../models/referralCommissionConfig.schema";

dotenv.config();

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pickTierPct(
  activeCount: number,
  tiers: { thresholdSales: number; commissionPercent: number }[],
): number {
  const sorted = [...tiers].sort((a, b) => a.thresholdSales - b.thresholdSales);
  let pct = 0;
  for (const t of sorted) {
    if (activeCount >= t.thresholdSales) pct = t.commissionPercent;
    else break;
  }
  return pct;
}

async function backfillReferralCommission() {
  const apply = process.argv.includes("--apply");

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");
    console.log(
      apply
        ? "Mode: APPLY — changes will be written.\n"
        : "Mode: DRY-RUN — no changes will be written. Pass --apply to persist.\n",
    );

    const cfg = await ReferralCommissionConfigModel.findOne({}).lean();
    const tiers = (cfg?.tiers ?? []).map((t) => ({
      thresholdSales: t.thresholdSales,
      commissionPercent: t.commissionPercent,
    }));
    console.log(
      `Current tiers: ${
        tiers.length
          ? tiers
              .map((t) => `${t.thresholdSales}+ -> ${t.commissionPercent}%`)
              .join(", ")
          : "(none configured — every sale backfills at 0%)"
      }\n`,
    );

    // Active-sale count per referrer, in one pass — this is what their rate is
    // based on today.
    const counts = await ReferralSaleModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      { $match: { status: "active" } },
      { $group: { _id: "$referrerUserId", count: { $sum: 1 } } },
    ]);
    const countByReferrer = new Map<string, number>(
      counts.map((c) => [String(c._id), c.count]),
    );

    // Reversed rows get stamped too — the fields are `required`, and they are
    // excluded from the balance by status regardless.
    const pending = await ReferralSaleModel.find({
      commissionPercent: { $exists: false },
    })
      .select("referrerUserId amount status")
      .lean();

    if (pending.length === 0) {
      console.log("No sales need backfilling — nothing to do.");
      return;
    }

    const ops = pending.map((sale) => {
      const activeCount = countByReferrer.get(String(sale.referrerUserId)) ?? 0;
      const commissionPercent = pickTierPct(activeCount, tiers);
      const amount = Math.max(0, Number(sale.amount ?? 0));
      const commissionAmount = round2(amount * (commissionPercent / 100));
      return {
        updateOne: {
          filter: { _id: sale._id },
          update: { $set: { commissionPercent, commissionAmount } },
        },
      };
    });

    const totalCommission = ops.reduce(
      (s, op) => s + Number(op.updateOne.update.$set.commissionAmount),
      0,
    );
    console.log(`Sales to backfill : ${ops.length}`);
    console.log(`Referrers affected: ${countByReferrer.size}`);
    console.log(`Commission frozen : ₹${round2(totalCommission)}\n`);

    if (!apply) {
      console.log("DRY-RUN — re-run with --apply to write these values.");
      return;
    }

    const res = await ReferralSaleModel.bulkWrite(ops);
    console.log(`Done. Modified ${res.modifiedCount} sale(s).`);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

void backfillReferralCommission();
