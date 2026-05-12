/**
 * Rank colleges by linked student count (`userType: student`, `college` ref set).
 *
 * Run from backend root:
 *   npx ts-node src/scripts/college-student-counts.ts
 *   npx ts-node src/scripts/college-student-counts.ts --top=5
 *   npx ts-node src/scripts/college-student-counts.ts --all
 *
 * Prints students that have no `college` ObjectId as "Unlinked".
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { UserModel } from "../models/user.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseArgs() {
  let top = 15;
  let showAll = false;
  for (const arg of process.argv.slice(2)) {
    if (arg === "--all") showAll = true;
    const m = arg.match(/^--top=(\d+)$/);
    if (m) top = Math.max(1, parseInt(m[1], 10));
  }
  return { top, showAll };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI (or MONGO_URI) must be set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const unlinkedResult = await UserModel.aggregate<{ c: number }>([
    { $match: { userType: "student", $or: [{ college: null }, { college: { $exists: false } }] } },
    { $count: "c" },
  ]);
  const unlinked = unlinkedResult[0]?.c ?? 0;

  const grouped = await UserModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    studentCount: number;
    college?: { name: string; location: string };
  }>([
    { $match: { userType: "student", college: { $exists: true, $ne: null } } },
    { $group: { _id: "$college", studentCount: { $sum: 1 } } },
    { $sort: { studentCount: -1 } },
    {
      $lookup: {
        from: "colleges",
        localField: "_id",
        foreignField: "_id",
        as: "c",
      },
    },
    { $unwind: { path: "$c", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        studentCount: 1,
        college: {
          name: "$c.name",
          location: "$c.location",
        },
      },
    },
  ]);

  const { top, showAll } = parseArgs();
  const rows = showAll ? grouped : grouped.slice(0, top);

  if (grouped.length === 0 && unlinked === 0) {
    console.log("No student users found.");
    await mongoose.disconnect();
    return;
  }

  const maxRows = Math.max(rows.length, 1);

  console.log("Colleges ranked by linked student count (college ObjectId)\n");

  let rank = 1;
  const displayWidth = maxRows.toString().length;
  for (const row of rows) {
    const name = row.college?.name ?? "(deleted or missing college doc)";
    const loc = row.college?.location ? ` — ${row.college.location}` : "";
    const id = row._id.toString();
    console.log(
      `${String(rank++).padStart(displayWidth)}. ${row.studentCount} students — ${name}${loc}`,
    );
    console.log(`     collegeId: ${id}`);
  }

  if (!showAll && grouped.length > rows.length) {
    console.log(`\n(${grouped.length - rows.length} more colleges omitted; use --all or --top=N)`);
  }

  console.log(`\nStudents lacking college Id (still may have collegeName): ${unlinked}`);
  const withLink = grouped.reduce((acc, r) => acc + r.studentCount, 0);
  console.log(`Students with linked college Id: ${withLink}`);
  console.log(`Total student users counted above: ${withLink + unlinked}`);

  if (grouped.length > 0) {
    const winner = grouped[0];
    const nm = winner.college?.name ?? "(missing name)";
    console.log("\nHighest count (linked ObjectId):");
    console.log(`  ${nm} → ${winner.studentCount} students`);
  }

  // Legacy / backfill-gap: students with only free-text collegeName.
  const byCollegeName = await UserModel.aggregate<{ _id: string; studentCount: number }>([
    {
      $match: {
        userType: "student",
        $nor: [{ college: { $exists: true, $ne: null } }],
        collegeName: { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: {
          $trim: { input: { $toLower: "$collegeName" }, chars: " \t\n\r" },
        },
        studentCount: { $sum: 1 },
      },
    },
    { $match: { _id: { $ne: "" } } },
    { $sort: { studentCount: -1 } },
  ]);

  // Map lowercase key → one display spelling (first seen).
  const displayLabel = await UserModel.aggregate<{ _id: string; canon: string }>([
    {
      $match: {
        userType: "student",
        $nor: [{ college: { $exists: true, $ne: null } }],
        collegeName: { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: { $trim: { input: { $toLower: "$collegeName" }, chars: " \t\n\r" } },
        canon: { $first: { $trim: { input: "$collegeName" } } },
      },
    },
  ]);

  const labelByLower = new Map(displayLabel.map((r) => [r._id, r.canon] as const));

  if (byCollegeName.length > 0) {
    console.log(
      "\n--- By college name (students without college ObjectId) ---\n",
    );
    const nameRows = showAll ? byCollegeName : byCollegeName.slice(0, top);
    rank = 1;
    for (const row of nameRows) {
      const lbl = labelByLower.get(row._id) ?? row._id ?? "(unknown)";
      console.log(
        `${String(rank++).padStart(displayWidth)}. ${row.studentCount} students — ${lbl}`,
      );
    }
    if (!showAll && byCollegeName.length > nameRows.length) {
      console.log(`\n(${byCollegeName.length - nameRows.length} more omitted)`);
    }
    const nmTop = labelByLower.get(byCollegeName[0]._id) ?? byCollegeName[0]._id;
    console.log("\nHighest count (text collegeName field only):");
    console.log(`  ${nmTop} → ${byCollegeName[0].studentCount} students`);
  }

  await mongoose.disconnect();
  console.log("\nDisconnected.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
