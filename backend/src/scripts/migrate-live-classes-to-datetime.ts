/**
 * Migrates the course live-classes collection onto the new schema.
 *
 * What changed and why each step is needed:
 *
 *  1. `startDate` + `startTime` ("HH:mm") collapse into a single
 *     `startDateTime` Date (same for end). The old pair was ambiguous: the
 *     date was stored as UTC midnight while the time string was entered as
 *     IST wall-clock, and every read did `setHours()` in whatever timezone
 *     the reading process happened to run in. We rebuild the true instant as
 *     "that calendar date at HH:mm in `--tz-offset-mins`" (default 330 = IST).
 *
 *  2. `link1` / `link2` attendance links are backfilled (never activated, so
 *     no attendance is invented for past classes), plus an empty
 *     `manualOverrides`.
 *
 *  3. `meetingLink` is backfilled from the first URL found in the description
 *     — admins had no join-link field, so they pasted it there. Rows with no
 *     recoverable URL are listed at the end for manual fixing.
 *
 *  4. The `expiresAt` TTL index is DROPPED. It was silently deleting every
 *     live class the moment it ended. Removing it from the schema is not
 *     enough — MongoDB keeps indexes until they are explicitly dropped.
 *
 * Dry run (default, writes nothing):
 *   npx ts-node src/scripts/migrate-live-classes-to-datetime.ts
 * Apply:
 *   npx ts-node src/scripts/migrate-live-classes-to-datetime.ts --apply
 */

import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

const tzArg = process.argv.find((a) => a.startsWith("--tz-offset-mins="));
/** Minutes east of UTC that the old "HH:mm" strings were entered in. */
const TZ_OFFSET_MINS = tzArg ? Number(tzArg.split("=")[1]) : 330;

const expiryArg = process.argv.find((a) => a.startsWith("--expiry-mins="));
/** Default attendance window for backfilled links. */
const DEFAULT_EXPIRY_MINS = expiryArg ? Number(expiryArg.split("=")[1]) : 10;

const URL_IN_TEXT = /https?:\/\/[^\s<>"')]+/;

interface LegacyLiveClass {
  _id: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  instructor?: mongoose.Types.ObjectId;
  startDate?: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  meetingLink?: string;
  link1?: unknown;
  link2?: unknown;
  manualOverrides?: unknown;
  createdBy?: mongoose.Types.ObjectId;
}

/**
 * Rebuilds the real instant from a UTC-midnight date plus an "HH:mm" string
 * that was written in a fixed offset.
 */
function combine(date: Date, time: string, offsetMins: number): Date | null {
  const [hRaw, mRaw] = String(time).split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return new Date(utcMidnight + (h * 60 + m - offsetMins) * 60_000);
}

function newLink() {
  return {
    token: crypto.randomBytes(32).toString("base64url"),
    expiryMins: DEFAULT_EXPIRY_MINS,
    activatedAt: null,
    clickedBy: [],
  };
}

const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : "—");

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  if (!Number.isFinite(TZ_OFFSET_MINS)) {
    throw new Error("--tz-offset-mins must be a number");
  }
  if (!Number.isFinite(DEFAULT_EXPIRY_MINS) || DEFAULT_EXPIRY_MINS < 1) {
    throw new Error("--expiry-mins must be a number >= 1");
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database handle");
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(
    `Mode: ${APPLY ? "APPLY" : "DRY RUN"}  tzOffsetMins=${TZ_OFFSET_MINS}  ` +
      `defaultExpiryMins=${DEFAULT_EXPIRY_MINS}\n`,
  );

  const collection = db.collection<LegacyLiveClass>("liveclasses");

  // ── 1. Drop the destructive TTL index ────────────────────────────────────
  const indexes = await collection.indexes();
  const ttl = indexes.find((i) => i.name === "expiresAt_1");
  if (ttl) {
    console.log(`Found TTL index expiresAt_1 (${JSON.stringify(ttl.key)})`);
    if (APPLY) {
      await collection.dropIndex("expiresAt_1");
      console.log("  → dropped\n");
    } else {
      console.log("  → would drop\n");
    }
  } else {
    console.log("No expiresAt_1 TTL index present.\n");
  }

  // Stale single-field indexes on fields that no longer exist.
  for (const stale of [
    "startDate_1",
    "endDate_1",
    "startDate_1_endDate_1",
    "course_1_startDate_1",
  ]) {
    if (indexes.some((i) => i.name === stale)) {
      if (APPLY) {
        await collection.dropIndex(stale);
        console.log(`Dropped stale index ${stale}`);
      } else {
        console.log(`Would drop stale index ${stale}`);
      }
    }
  }

  // ── 2. Migrate documents ─────────────────────────────────────────────────
  const docs = await collection.find({}).toArray();
  console.log(`\n${docs.length} live class document(s) found.\n`);

  let migrated = 0;
  let skipped = 0;
  const unresolvableTiming: string[] = [];
  const missingMeetingLink: string[] = [];

  for (const doc of docs) {
    const set: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    // Timing
    if (!doc.startDateTime) {
      if (!doc.startDate || !doc.startTime) {
        unresolvableTiming.push(`${doc._id} "${doc.title ?? ""}" (start)`);
        skipped += 1;
        continue;
      }
      const start = combine(doc.startDate, doc.startTime, TZ_OFFSET_MINS);
      if (!start) {
        unresolvableTiming.push(
          `${doc._id} "${doc.title ?? ""}" (bad startTime)`,
        );
        skipped += 1;
        continue;
      }
      set.startDateTime = start;
    }

    if (!doc.endDateTime) {
      if (!doc.endDate || !doc.endTime) {
        unresolvableTiming.push(`${doc._id} "${doc.title ?? ""}" (end)`);
        skipped += 1;
        continue;
      }
      const end = combine(doc.endDate, doc.endTime, TZ_OFFSET_MINS);
      if (!end) {
        unresolvableTiming.push(`${doc._id} "${doc.title ?? ""}" (bad endTime)`);
        skipped += 1;
        continue;
      }
      set.endDateTime = end;
    }

    // Attendance links + override array
    if (!doc.link1) set.link1 = newLink();
    if (!doc.link2) set.link2 = newLink();
    if (!doc.manualOverrides) set.manualOverrides = [];

    // Join URL, recovered from the description if the admin pasted one there.
    if (!doc.meetingLink) {
      const found = doc.description?.match(URL_IN_TEXT)?.[0] ?? "";
      set.meetingLink = found;
      if (!found) {
        missingMeetingLink.push(`${doc._id} "${doc.title ?? ""}"`);
      }
    }

    if (!doc.createdBy && doc.instructor) set.createdBy = doc.instructor;

    for (const legacy of [
      "startDate",
      "startTime",
      "endDate",
      "endTime",
      "expiresAt",
    ]) {
      if (legacy in doc) unset[legacy] = "";
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;
    if (Object.keys(update).length === 0) continue;

    console.log(
      `${doc._id}  "${doc.title ?? ""}"\n` +
        `   start ${iso(doc.startDate)} + ${doc.startTime ?? "—"} → ${iso(set.startDateTime as Date)}\n` +
        `   end   ${iso(doc.endDate)} + ${doc.endTime ?? "—"} → ${iso(set.endDateTime as Date)}\n` +
        `   meetingLink: ${set.meetingLink !== undefined ? `"${set.meetingLink}"` : "(kept)"}`,
    );

    if (APPLY) await collection.updateOne({ _id: doc._id }, update);
    migrated += 1;
  }

  // ── 3. Report ────────────────────────────────────────────────────────────
  console.log(`\n=== SUMMARY (${APPLY ? "applied" : "dry run"}) ===`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (unresolvable timing): ${skipped}`);

  if (unresolvableTiming.length > 0) {
    console.log(
      "\nSkipped — missing/invalid legacy timing, delete or fix by hand:",
    );
    unresolvableTiming.forEach((l) => console.log(`  • ${l}`));
  }

  if (missingMeetingLink.length > 0) {
    console.log(
      "\nNo join URL could be recovered — an admin must set the meeting link " +
        "on each of these before students can join:",
    );
    missingMeetingLink.forEach((l) => console.log(`  • ${l}`));
  }

  if (!APPLY) console.log("\nRe-run with --apply to write these changes.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
