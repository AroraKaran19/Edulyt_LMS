/**
 * Diagnose the "stats shows N courses but only M visible" mismatch for a user.
 *
 * GetUserEnrollmentsService computes `total` via countDocuments(filters) but the
 * returned list drops enrollments whose populated courseId is null (deleted/missing
 * course). So orphan enrollments inflate the count above the visible cards.
 *
 * READ ONLY. Run from backend root:
 *   npx ts-node src/scripts/diagnose-course-count-mismatch.ts <email>
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { UserModel, EnrollmentModel, CourseModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  const email = (process.argv[2] || "test123@gmail.com").trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  const user = await UserModel.findOne({
    email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  }).lean();
  if (!user) {
    console.log(`No user found for ${email}`);
    return;
  }
  const uid = (user as any)._id;
  console.log(`User: ${(user as any).email}  _id=${uid}\n`);

  // Mirror GetUserEnrollmentsService default filter (no status arg)
  const filters = { userId: uid, status: { $nin: ["dropped", "revoked"] } };

  const total = await EnrollmentModel.countDocuments(filters);
  console.log(`countDocuments(filters) [the "N courses" number] = ${total}\n`);

  const enrollments = await EnrollmentModel.find(filters)
    .populate({ path: "courseId", select: "title slug" })
    .sort({ enrolledAt: -1 })
    .lean();

  let visible = 0;
  let orphan = 0;
  for (const e of enrollments as any[]) {
    const c = e.courseId;
    if (c) {
      visible++;
      console.log(`  ✅ visible  enrollment=${e._id}  status=${e.status}  course="${c.title}" (${c.slug})`);
    } else {
      orphan++;
      // courseId is set on the raw doc but populate returned null -> course doc missing
      const rawCourseId = e.courseId; // null after populate; read raw below
      console.log(`  ❌ ORPHAN   enrollment=${e._id}  status=${e.status}  courseId points to a MISSING course`);
    }
  }

  // Re-read raw (no populate) to print the dangling courseId values for orphans
  const raw = await EnrollmentModel.find(filters).select("courseId status").lean();
  const danglers: string[] = [];
  for (const e of raw as any[]) {
    const exists = await CourseModel.exists({ _id: e.courseId });
    if (!exists) danglers.push(String(e.courseId));
  }

  console.log(`\nSummary for ${email}:`);
  console.log(`  counted (total):  ${total}`);
  console.log(`  visible cards:    ${visible}`);
  console.log(`  orphan (hidden):  ${orphan}`);
  if (danglers.length) {
    console.log(`  dangling courseId(s): ${danglers.join(", ")}`);
    console.log(`\n  ROOT CAUSE: these enrollments reference course docs that no longer exist.`);
    console.log(`  countDocuments() counts them; the list filters them out (populate -> null).`);
  } else if (total !== visible) {
    console.log(`\n  NOTE: counts differ but no dangling courseId found on page 1 — check pagination (limit) or status filter.`);
  } else {
    console.log(`\n  No mismatch detected for this user right now.`);
  }
}

run()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await mongoose.connection.close(); process.exit(process.exitCode ?? 0); });
