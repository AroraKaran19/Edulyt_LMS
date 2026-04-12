/**
 * Deletes enrollments whose enrolledAt falls in a configurable local time window.
 *
 * Default window: 2026-04-13 between 04:00 and 05:00 (exclusive of end), timezone IST (+05:30).
 * Use --utc for the same clock times in UTC (2026-04-13T04:00:00Z .. T05:00:00Z).
 * Use --offset=+HH:MM for another fixed offset (e.g. --offset=+00:00).
 *
 * Also removes: certificates for those enrollments, enrollment ids from students'
 * enrollments arrays, decrements course analytics and instructor totalStudents (floored at 0).
 *
 * Run from backend root:
 *   npx ts-node src/scripts/remove-enrollments-by-enrolledAt-window.ts --dry-run
 *   npx ts-node src/scripts/remove-enrollments-by-enrolledAt-window.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import {
  EnrollmentModel,
  CertificateModel,
  CourseModel,
  StudentModel,
  UserModel,
} from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function toObjectId(id: unknown): mongoose.Types.ObjectId {
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(String(id));
}

const DEFAULT_DATE = "2026-04-13";
const DEFAULT_START_HOUR = 4;
const DEFAULT_END_HOUR = 5;

function argValue(prefix: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(prefix));
  if (!a) return undefined;
  return a.slice(prefix.length);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Build [start, end) Date range. offset 'Z' = UTC; else e.g. '+05:30'. */
function buildWindow(
  date: string,
  startHour: number,
  endHour: number,
  offset: string
): { start: Date; end: Date } {
  if (offset === "Z") {
    return {
      start: new Date(`${date}T${pad2(startHour)}:00:00.000Z`),
      end: new Date(`${date}T${pad2(endHour)}:00:00.000Z`),
    };
  }
  return {
    start: new Date(`${date}T${pad2(startHour)}:00:00${offset}`),
    end: new Date(`${date}T${pad2(endHour)}:00:00${offset}`),
  };
}

function getInstructorIds(course: Record<string, unknown> | null): string[] {
  if (!course) return [];
  const out: string[] = [];
  const ins = course.instructor as unknown;
  if (!ins) return out;
  if (Array.isArray(ins)) {
    for (const i of ins) {
      if (typeof i === "string") out.push(i);
      else if (i && typeof i === "object" && "_id" in (i as object)) {
        out.push(String((i as { _id: unknown })._id));
      }
    }
  } else if (typeof ins === "string") {
    out.push(ins);
  } else if (ins && typeof ins === "object" && "_id" in (ins as object)) {
    out.push(String((ins as { _id: unknown })._id));
  }
  return out;
}

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const useUtc = process.argv.includes("--utc");
  const offsetArg = argValue("--offset=");
  const dateArg = argValue("--date=") ?? DEFAULT_DATE;
  const startH = parseInt(argValue("--start-hour=") ?? String(DEFAULT_START_HOUR), 10);
  const endH = parseInt(argValue("--end-hour=") ?? String(DEFAULT_END_HOUR), 10);

  const offset = useUtc ? "Z" : offsetArg ?? "+05:30";

  if (
    Number.isNaN(startH) ||
    Number.isNaN(endH) ||
    startH < 0 ||
    startH > 23 ||
    endH < 0 ||
    endH > 23 ||
    endH <= startH
  ) {
    throw new Error(
      "Invalid --start-hour / --end-hour (expect 0-23, end > start)"
    );
  }

  const { start, end } = buildWindow(dateArg, startH, endH, offset);

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI (or MONGO_URI) is not set");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.\n");

  console.log("Time window (enrolledAt):");
  console.log(`  start (inclusive): ${start.toISOString()}`);
  console.log(`  end   (exclusive): ${end.toISOString()}`);
  console.log(`  offset: ${offset === "Z" ? "UTC (--utc)" : offset}`);
  console.log("");

  const enrollments = await EnrollmentModel.find({
    enrolledAt: { $gte: start, $lt: end },
  }).lean();

  console.log(`Matching enrollments: ${enrollments.length}`);

  if (enrollments.length === 0) {
    await mongoose.connection.close();
    process.exit(0);
    return;
  }

  const preview = Math.min(15, enrollments.length);
  for (let i = 0; i < preview; i++) {
    const e = enrollments[i] as Record<string, unknown>;
    console.log(
      `  ${i + 1}. _id=${e._id} userId=${e.userId} courseId=${e.courseId} enrolledAt=${(e.enrolledAt as Date)?.toISOString?.()} status=${e.status}`
    );
  }
  if (enrollments.length > preview) {
    console.log(`  ... and ${enrollments.length - preview} more`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] No changes. Run with --apply to delete.");
    await mongoose.connection.close();
    process.exit(0);
    return;
  }

  const enrollmentIds = enrollments.map((e) => toObjectId(e._id));

  const courseIdSet = new Set(
    enrollments.map((e) => String((e as { courseId: unknown }).courseId))
  );
  const courseIds = [...courseIdSet]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const courses = await CourseModel.find({ _id: { $in: courseIds } }).lean();
  const courseById = new Map(
    courses.map((c) => [String((c as { _id: unknown })._id), c])
  );

  const perCourseTotal = new Map<string, number>();
  const perCourseActive = new Map<string, number>();
  const instructorDeltas = new Map<string, number>();

  for (const e of enrollments) {
    const cid = String((e as { courseId: unknown }).courseId);
    perCourseTotal.set(cid, (perCourseTotal.get(cid) || 0) + 1);
    if ((e as { status?: string }).status === "active") {
      perCourseActive.set(cid, (perCourseActive.get(cid) || 0) + 1);
    }
    const course = courseById.get(cid) as Record<string, unknown> | undefined;
    for (const iid of getInstructorIds(course ?? null)) {
      instructorDeltas.set(iid, (instructorDeltas.get(iid) || 0) + 1);
    }
  }

  const certRes = await CertificateModel.deleteMany({
    enrollmentId: { $in: enrollmentIds },
  });
  console.log(`\nCertificates deleted: ${certRes.deletedCount}`);

  const byUser = new Map<string, mongoose.Types.ObjectId[]>();
  for (const e of enrollments) {
    const uid = String((e as { userId: unknown }).userId);
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push(toObjectId(e._id));
  }
  for (const [uid, ids] of byUser) {
    await StudentModel.findByIdAndUpdate(uid, {
      $pullAll: { enrollments: ids },
    });
  }
  console.log(`Student enrollment refs updated: ${byUser.size} user(s)`);

  for (const [cid, total] of perCourseTotal) {
    const active = perCourseActive.get(cid) || 0;
    const oid = new mongoose.Types.ObjectId(cid);
    await CourseModel.updateOne(
      { _id: oid },
      [
        {
          $set: {
            "analytics.totalEnrollments": {
              $max: [
                0,
                {
                  $subtract: [
                    { $ifNull: ["$analytics.totalEnrollments", 0] },
                    total,
                  ],
                },
              ],
            },
            "analytics.activeEnrollments": {
              $max: [
                0,
                {
                  $subtract: [
                    { $ifNull: ["$analytics.activeEnrollments", 0] },
                    active,
                  ],
                },
              ],
            },
          },
        },
      ]
    );
  }
  console.log(`Course analytics adjusted: ${perCourseTotal.size} course(s)`);

  for (const [instructorId, dec] of instructorDeltas) {
    if (!mongoose.Types.ObjectId.isValid(instructorId)) continue;
    await UserModel.updateOne(
      { _id: new mongoose.Types.ObjectId(instructorId) },
      [
        {
          $set: {
            totalStudents: {
              $max: [
                0,
                {
                  $subtract: [{ $ifNull: ["$totalStudents", 0] }, dec],
                },
              ],
            },
          },
        },
      ]
    );
  }
  console.log(`Instructor totalStudents adjusted: ${instructorDeltas.size}`);

  const delRes = await EnrollmentModel.deleteMany({
    _id: { $in: enrollmentIds },
  });
  console.log(`\nEnrollments deleted: ${delRes.deletedCount}`);

  await mongoose.connection.close();
  console.log("\nDone. MongoDB connection closed.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  mongoose.connection.close().finally(() => process.exit(1));
});
