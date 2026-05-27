/**
 * Export every User in the database to a CSV file (UTF-8 with BOM so Excel
 * opens it cleanly). One row per user; all profile fields the User schema
 * and the Student / Instructor / Collaborator / Partner discriminators
 * carry are surfaced as columns. Heavy / sensitive fields (refreshTokens,
 * successPointsHistory, password hash) are intentionally excluded.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/export-user-profiles.ts
 *   npx ts-node src/scripts/export-user-profiles.ts --out=./user-profiles.csv
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { UserModel } from "../models/user.schema";
import "../models"; // ensures every discriminator + College model is registered

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseArgs() {
  let outPath = path.resolve(process.cwd(), "user-profiles.csv");
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--out=(.+)$/);
    if (m) outPath = path.resolve(process.cwd(), m[1]);
  }
  return { outPath };
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (v instanceof Date) {
    s = v.toISOString();
  } else if (typeof v === "object") {
    s = JSON.stringify(v);
  } else {
    s = String(v);
  }
  const needsQuote = /[",\r\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

const COLUMNS: { header: string; pick: (u: Record<string, unknown>) => unknown }[] = [
  { header: "User ID", pick: (u) => u._id },
  { header: "User Type", pick: (u) => u.userType },
  { header: "Status", pick: (u) => u.status },
  { header: "First Name", pick: (u) => u.firstName },
  { header: "Last Name", pick: (u) => u.lastName },
  { header: "Email", pick: (u) => u.email },
  { header: "Phone", pick: (u) => u.phone },
  { header: "WhatsApp", pick: (u) => u.whatsappNumber },
  { header: "Gender", pick: (u) => u.gender },
  { header: "DOB", pick: (u) => u.dob },
  { header: "Provider", pick: (u) => u.provider },
  { header: "Profile Picture", pick: (u) => u.profilePicture },
  { header: "Permissions", pick: (u) => (Array.isArray(u.permissions) ? (u.permissions as string[]).join("; ") : "") },
  // Address
  { header: "Address", pick: (u) => (u.address as Record<string, unknown> | undefined)?.address },
  { header: "City", pick: (u) => (u.address as Record<string, unknown> | undefined)?.city },
  { header: "State", pick: (u) => (u.address as Record<string, unknown> | undefined)?.state },
  { header: "Country", pick: (u) => (u.address as Record<string, unknown> | undefined)?.country },
  { header: "Pincode", pick: (u) => (u.address as Record<string, unknown> | undefined)?.pincode },
  // Social
  { header: "Google Email", pick: (u) => (u.accounts as Record<string, Record<string, unknown> | undefined> | undefined)?.google?.email },
  { header: "LinkedIn Email", pick: (u) => (u.accounts as Record<string, Record<string, unknown> | undefined> | undefined)?.linkedin?.email },
  { header: "GitHub", pick: (u) => (u.accounts as Record<string, unknown> | undefined)?.github },
  { header: "Instagram", pick: (u) => (u.accounts as Record<string, unknown> | undefined)?.instagram },
  // Student-specific (present on student discriminator only)
  { header: "College", pick: (u) => (u.collegeDoc as Record<string, unknown> | undefined)?.name ?? u.collegeName },
  { header: "Degree", pick: (u) => u.degreeName },
  { header: "Father Occupation", pick: (u) => u.fatherOccupation },
  { header: "Experience Level", pick: (u) => u.experienceLevel },
  { header: "Passing Year", pick: (u) => u.passingYear },
  { header: "Area of Interest", pick: (u) => u.areaOfInterest },
  { header: "Current Position", pick: (u) => u.currentPosition },
  { header: "Current Company", pick: (u) => u.currentCompany },
  { header: "Domain", pick: (u) => u.domain },
  { header: "LinkedIn URL", pick: (u) => u.linkedinUrl },
  { header: "Portfolio", pick: (u) => u.portfolio },
  { header: "Join Source", pick: (u) => u.joinSource },
  { header: "Success Points", pick: (u) => u.successPoints },
  { header: "Enrollments Count", pick: (u) => (Array.isArray(u.enrollments) ? (u.enrollments as unknown[]).length : "") },
  { header: "Orders Count", pick: (u) => (Array.isArray(u.orders) ? (u.orders as unknown[]).length : "") },
  // Instructor-specific
  { header: "Instructor Slug", pick: (u) => u.slug },
  { header: "Instructor Rating", pick: (u) => u.rating },
  { header: "Instructor Total Students", pick: (u) => u.totalStudents },
  { header: "Instructor Industry", pick: (u) => u.industry },
  { header: "Instructor Bio", pick: (u) => u.bio },
  // Collaborator-specific
  { header: "Total Referrals", pick: (u) => u.totalReferrals },
  { header: "Total Earnings", pick: (u) => u.totalEarnings },
  // Partner-specific
  { header: "Partner College ID", pick: (u) => u.partnerCollege },
  // Timestamps
  { header: "Created At", pick: (u) => u.createdAt },
  { header: "Updated At", pick: (u) => u.updatedAt },
];

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI (or MONGO_URI) must be set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);

  // Lean docs + lookup college name where applicable so we get a single round-trip.
  const users = await UserModel.aggregate<Record<string, unknown>>([
    {
      $lookup: {
        from: "colleges",
        localField: "college",
        foreignField: "_id",
        as: "collegeDoc",
      },
    },
    { $unwind: { path: "$collegeDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { userType: 1, createdAt: 1 } },
  ]);

  const { outPath } = parseArgs();
  const header = COLUMNS.map((c) => csvCell(c.header)).join(",");
  const body = users
    .map((u) => COLUMNS.map((c) => csvCell(c.pick(u))).join(","))
    .join("\r\n");

  // UTF-8 BOM so Excel detects encoding correctly.
  fs.writeFileSync(outPath, "﻿" + header + "\r\n" + body, "utf8");

  console.log(`Wrote ${users.length} user rows to:\n  ${outPath}`);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
