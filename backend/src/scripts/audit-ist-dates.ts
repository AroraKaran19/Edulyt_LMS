/**
 * READ-ONLY audit for the IST migration. Writes nothing.
 *
 * Before the fix, admin `datetime-local` inputs were interpreted as the admin's
 * browser/server timezone (effectively UTC on the server), so a typed IST
 * wall-clock W was stored as the UTC instant Date.UTC(W) instead of
 * istWallClockToUtc(W) = Date.UTC(W) − 5:30. Old instant records therefore read
 * 5h30m LATER in IST than the admin intended.
 *
 * This script lists each suspect *instant* field with:
 *   stored UTC | current IST rendering | corrected (−5:30) IST candidate
 * so a human can decide which records were entered before the fix.
 *
 * Calendar-day fields (batch applicationLastDate / internshipStartDate) are
 * shown for sanity only — they store UTC-midnight which reads as the correct
 * IST day, so they need no correction.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/audit-ist-dates.ts            (all records)
 *   npx ts-node src/scripts/audit-ist-dates.ts --limit 20
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST = "Asia/Kolkata";

const toDate = (v: unknown): Date | null => {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
};
const utc = (v: unknown) => toDate(v)?.toISOString() ?? "—";
const ist = (v: unknown) => {
  const d = toDate(v);
  return d ? d.toLocaleString("en-IN", { timeZone: IST, dateStyle: "medium", timeStyle: "short" }) : "—";
};
/** IST rendering of the −5:30 corrected instant (what the admin likely meant). */
const istCorrected = (v: unknown) => {
  const d = toDate(v);
  return d ? new Date(d.getTime() - IST_OFFSET_MS).toLocaleString("en-IN", { timeZone: IST, dateStyle: "medium", timeStyle: "short" }) : "—";
};
const ymdIst = (v: unknown) => {
  const d = toDate(v);
  return d ? d.toLocaleDateString("en-CA", { timeZone: IST }) : "—";
};

function instantRow(label: string, v: unknown): string | null {
  if (toDate(v) == null) return null;
  return `    ${label.padEnd(22)} stored=${utc(v)}  IST=${ist(v)}   (−5:30 → ${istCorrected(v)})`;
}

async function run() {
  const limitFlag = process.argv.indexOf("--limit");
  const limit = limitFlag !== -1 ? parseInt(process.argv[limitFlag + 1], 10) || 0 : 0;

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined");
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  const db = mongoose.connection;

  let suspectInstants = 0;

  // ── Internship batches ──────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("INTERNSHIP BATCHES");
  console.log("=".repeat(70));
  const internships = await db
    .collection("internships")
    .find({}, { projection: { title: 1, batches: 1 } })
    .toArray();
  for (const it of internships) {
    const batches = (it.batches as Record<string, unknown>[]) ?? [];
    for (const b of batches) {
      const lines: string[] = [];
      // Calendar-day fields (sanity only).
      if (toDate(b.applicationLastDate))
        lines.push(`    applicationLastDate    IST day=${ymdIst(b.applicationLastDate)}  (calendar-day, no fix)`);
      if (toDate(b.internshipStartDate))
        lines.push(`    internshipStartDate    IST day=${ymdIst(b.internshipStartDate)}  (calendar-day, no fix)`);
      // Instant windows (correction candidates).
      for (const [label, key] of [
        ["entranceExamStartAt", "entranceExamStartAt"],
        ["entranceExamEndAt", "entranceExamEndAt"],
        ["documentationStartAt", "documentationStartAt"],
        ["documentationEndAt", "documentationEndAt"],
      ] as const) {
        const row = instantRow(label, b[key]);
        if (row) {
          lines.push(row);
          suspectInstants++;
        }
      }
      if (lines.length) {
        console.log(`\n  ${String(it.title ?? "Internship")} › batch "${String(b.name ?? "")}"`);
        lines.forEach((l) => console.log(l));
      }
    }
    if (limit && internships.indexOf(it) + 1 >= limit) break;
  }

  // ── Coupons ─────────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("COUPONS (validFrom / validUntil — instants)");
  console.log("=".repeat(70));
  const coupons = await db
    .collection("coupons")
    .find({}, { projection: { code: 1, validFrom: 1, validUntil: 1 } })
    .limit(limit || 0)
    .toArray();
  for (const c of coupons) {
    console.log(`\n  ${String(c.code ?? "")}`);
    [instantRow("validFrom", c.validFrom), instantRow("validUntil", c.validUntil)].forEach((r) => {
      if (r) {
        console.log(r);
        suspectInstants++;
      }
    });
  }

  // ── Live meetings ───────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("LIVE MEETINGS (startDateTime / endDateTime — instants)");
  console.log("=".repeat(70));
  const meetings = await db
    .collection("livemeetings")
    .find({}, { projection: { title: 1, startDateTime: 1, endDateTime: 1 } })
    .limit(limit || 0)
    .toArray();
  for (const m of meetings) {
    console.log(`\n  ${String(m.title ?? "Meeting")}`);
    [instantRow("startDateTime", m.startDateTime), instantRow("endDateTime", m.endDateTime)].forEach((r) => {
      if (r) {
        console.log(r);
        suspectInstants++;
      }
    });
  }

  console.log("\n" + "=".repeat(70));
  console.log(`Instant fields listed: ${suspectInstants}`);
  console.log(
    "Eyeball the IST column: if it reads ~5h30m LATER than what the admin\n" +
      "meant (and the '−5:30' candidate looks right), those records were entered\n" +
      "before the fix and should be corrected. createdAt/updatedAt are untouched.",
  );
  console.log("=".repeat(70));

  await db.close();
  process.exit(0);
}

run().catch(async (e) => {
  console.error("\n❌ Audit error:", e);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
