/**
 * Backfill `student.college` (+ `collegeName` snapshot) on every learner whose
 * email matches a `CollaborationDomain` that now has a bound `college`.
 *
 * Run AFTER admins have assigned colleges to existing collaboration domains
 * (e.g. via the modal). For every domain with a `college`, this finds the
 * students whose email hosts match that domain and stamps the college onto
 * their profile — exactly what the live worker does on new domain
 * allotments, applied retroactively to learners who registered before.
 *
 * Behaviour:
 *   - Both `course_allot` and `discount` domains are processed. A domain is
 *     authoritative about which college its students belong to regardless of
 *     which benefit it offers.
 *   - Exact (`@college.edu`) and wildcard (`@*.mait.ac.in`) hosts are both
 *     handled via the same regex helper the runtime uses
 *     (`studentEmailRegexForCollaborationDomain`).
 *   - When a student matches multiple domains bound to different colleges,
 *     the most recently created domain wins — matches the live "last write
 *     wins" worker behaviour.
 *   - Existing `student.college` is overwritten. The domain is treated as
 *     authoritative.
 *
 * Run from backend root:
 *   # preview every student that would be touched:
 *   npx ts-node src/scripts/backfill-collaboration-domain-student-college.ts
 *   # apply changes:
 *   npx ts-node src/scripts/backfill-collaboration-domain-student-college.ts --apply
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { CollaborationDomainModel } from "../models/collaborationDomain.schema";
import { CollegeModel } from "../models/college.schema";
import { UserModel } from "../models/user.schema";
import { studentEmailRegexForCollaborationDomain } from "../utils/collaborationDomainMatching";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

interface CollegeLean {
  _id: unknown;
  name: string;
}

interface DomainLean {
  _id: unknown;
  title: string;
  domain: string;
  collaborationKind: "course_allot" | "discount";
  college?: unknown;
  createdAt?: Date;
}

interface StudentLean {
  _id: unknown;
  email?: string;
  college?: unknown;
  collegeName?: string;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  // Oldest first so the most-recently-created domain ends up winning when a
  // student's email matches more than one bound-to-college domain.
  const domains = (await CollaborationDomainModel.find({
    college: { $exists: true, $ne: null },
  })
    .select("_id title domain collaborationKind college createdAt")
    .sort({ createdAt: 1 })
    .lean()) as unknown as DomainLean[];

  console.log(`Collaboration domains with a bound college: ${domains.length}\n`);
  if (domains.length === 0) {
    await mongoose.disconnect();
    return;
  }

  let totalStudentsConsidered = 0;
  let totalStudentsUpdated = 0;
  let totalAlreadyCorrect = 0;
  const finalAssignment = new Map<
    string,
    { collegeId: string; collegeName: string; domain: string }
  >();

  for (const d of domains) {
    const collegeId = d.college;
    if (!collegeId || !mongoose.Types.ObjectId.isValid(String(collegeId))) {
      console.log(
        `  SKIP DOMAIN  ${d._id} | "${d.title}" (${d.domain}) — bound college is invalid`,
      );
      continue;
    }

    const college = (await CollegeModel.findById(String(collegeId))
      .select("_id name")
      .lean()) as unknown as CollegeLean | null;

    if (!college) {
      console.log(
        `  SKIP DOMAIN  ${d._id} | "${d.title}" (${d.domain}) — bound college not found`,
      );
      continue;
    }

    const emailRegex = studentEmailRegexForCollaborationDomain(d.domain);

    const students = (await UserModel.find({
      userType: "student",
      email: { $regex: emailRegex },
    })
      .select("_id email college collegeName")
      .lean()) as unknown as StudentLean[];

    console.log(
      `\nDomain ${d._id} | "${d.title}" (${d.domain}) [${d.collaborationKind}] → ${college._id} (${college.name})`,
    );
    console.log(`  matching students: ${students.length}`);

    let updatedInDomain = 0;
    let alreadyInDomain = 0;

    for (const student of students) {
      totalStudentsConsidered += 1;

      const currentCollegeId = student.college
        ? String(student.college)
        : null;
      const targetCollegeId = String(college._id);
      const sameCollege = currentCollegeId === targetCollegeId;
      const sameName =
        String(student.collegeName ?? "").trim() === college.name.trim();

      // Last-write-wins record — older domains processed first, newest wins.
      finalAssignment.set(String(student._id), {
        collegeId: targetCollegeId,
        collegeName: college.name,
        domain: d.domain,
      });

      if (sameCollege && sameName) {
        alreadyInDomain += 1;
        totalAlreadyCorrect += 1;
        continue;
      }

      console.log(
        `    SET        ${student._id} | ${student.email ?? ""} | "${student.collegeName ?? ""}" → "${college.name}"`,
      );

      if (APPLY) {
        await UserModel.updateOne(
          { _id: student._id, userType: "student" },
          {
            $set: {
              college: college._id,
              collegeName: college.name,
            },
          },
        );
      }
      updatedInDomain += 1;
      totalStudentsUpdated += 1;
    }

    console.log(
      `  domain summary: updated=${updatedInDomain}, already=${alreadyInDomain}`,
    );
  }

  console.log(`\n— Overall —`);
  console.log(`Students matched:        ${totalStudentsConsidered}`);
  console.log(`Students updated:        ${totalStudentsUpdated}`);
  console.log(`Already correct:         ${totalAlreadyCorrect}`);
  console.log(`Unique students touched: ${finalAssignment.size}`);

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
