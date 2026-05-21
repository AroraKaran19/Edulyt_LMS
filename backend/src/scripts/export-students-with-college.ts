/**
 * Export all students who have selected a college (linked `college` ObjectId
 * OR a free-text `collegeName`) to a CSV file with columns:
 *
 *   Student | College Selected
 *
 * CSV is written with a UTF-8 BOM so Microsoft Excel opens it cleanly with
 * correct character encoding. Rename the .csv to .xlsx after opening + saving
 * in Excel if a native xlsx is required.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/export-students-with-college.ts
 *   npx ts-node src/scripts/export-students-with-college.ts --out=./students-by-college.csv
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { UserModel } from "../models/user.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseArgs() {
  let outPath = path.resolve(process.cwd(), "students-by-college.csv");
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--out=(.+)$/);
    if (m) outPath = path.resolve(process.cwd(), m[1]);
  }
  return { outPath };
}

function csvCell(v: string): string {
  const needsQuote = /[",\r\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI (or MONGO_URI) must be set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);

  const rows = await UserModel.aggregate<{
    studentName: string;
    collegeSelected: string;
  }>([
    {
      $match: {
        userType: "student",
        $or: [
          { college: { $exists: true, $ne: null } },
          { collegeName: { $exists: true, $nin: [null, ""] } },
        ],
      },
    },
    {
      $lookup: {
        from: "colleges",
        localField: "college",
        foreignField: "_id",
        as: "collegeDoc",
      },
    },
    { $unwind: { path: "$collegeDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        studentName: {
          $let: {
            vars: {
              fn: { $ifNull: ["$firstName", ""] },
              ln: { $ifNull: ["$lastName", ""] },
            },
            in: {
              $trim: {
                input: { $concat: ["$$fn", " ", "$$ln"] },
              },
            },
          },
        },
        email: 1,
        collegeSelected: {
          $ifNull: [
            "$collegeDoc.name",
            { $ifNull: ["$collegeName", ""] },
          ],
        },
      },
    },
    {
      $project: {
        studentName: {
          $cond: [
            { $eq: ["$studentName", ""] },
            { $ifNull: ["$email", "(unnamed)"] },
            "$studentName",
          ],
        },
        collegeSelected: 1,
      },
    },
    { $match: { collegeSelected: { $ne: "" } } },
    { $sort: { collegeSelected: 1, studentName: 1 } },
  ]);

  const { outPath } = parseArgs();
  const header = "Student,College Selected";
  const body = rows
    .map((r) => `${csvCell(r.studentName)},${csvCell(r.collegeSelected)}`)
    .join("\r\n");

  // UTF-8 BOM ensures Excel recognises the encoding.
  fs.writeFileSync(outPath, "﻿" + header + "\r\n" + body, "utf8");

  console.log(`Wrote ${rows.length} student rows to:\n  ${outPath}`);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
