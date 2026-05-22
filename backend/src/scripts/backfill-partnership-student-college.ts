/**
 * Backfill `student.college` (+ `collegeName` snapshot) on every learner who
 * was whitelisted into a partnership-import config that now has a bound
 * `college`.
 *
 * Run AFTER admins have assigned colleges to the existing partnership configs
 * (e.g. via the modal, or the sibling backfill script). For every config with
 * a `college`, this finds the students on its whitelist and stamps that
 * college onto their profile — exactly what the live worker does on new
 * allotments, applied retroactively.
 *
 * Behaviour:
 *   - Both `course_allot` and `discount` partnerships are processed. A
 *     partnership is an authoritative source of the student's college
 *     regardless of which benefit type it offers.
 *   - A student is targeted whenever their whitelist row has a `userId` set
 *     (i.e. they have registered). Pending rows without a userId are skipped.
 *   - When a student appears on multiple whitelists bound to different
 *     colleges, the most recently created partnership wins — matches the
 *     live "last write wins" worker behaviour.
 *   - Existing `student.college` is overwritten. The partnership is treated
 *     as authoritative about which college the student belongs to.
 *
 * Run from backend root:
 *   # preview every student that would be touched:
 *   npx ts-node src/scripts/backfill-partnership-student-college.ts
 *   # apply changes:
 *   npx ts-node src/scripts/backfill-partnership-student-college.ts --apply
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { PartnershipImportConfigModel } from "../models/partnershipImportConfig.schema";
import { CollegeModel } from "../models/college.schema";
import { CollaborationWhitelistModel } from "../models/collaborationWhitelist.schema";
import { UserModel } from "../models/user.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

interface CollegeLean {
  _id: unknown;
  name: string;
}

interface ConfigLean {
  _id: unknown;
  title: string;
  kind: "course_allot" | "discount";
  college?: unknown;
  createdAt?: Date;
}

interface WhitelistLean {
  _id: unknown;
  userId?: unknown;
  email?: string;
  status?: string;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  // Oldest first so the most-recently-created partnership ends up winning
  // when a student is on multiple whitelists with different colleges.
  const configs = (await PartnershipImportConfigModel.find({
    college: { $exists: true, $ne: null },
  })
    .select("_id title kind college createdAt")
    .sort({ createdAt: 1 })
    .lean()) as unknown as ConfigLean[];

  console.log(`Partnerships with a bound college: ${configs.length}\n`);
  if (configs.length === 0) {
    await mongoose.disconnect();
    return;
  }

  let totalRowsConsidered = 0;
  let totalStudentsUpdated = 0;
  let totalAlreadyCorrect = 0;
  let totalSkippedNoUser = 0;
  let totalSkippedMissingStudent = 0;

  // Track last-write-wins: which college the student should end up with after
  // processing all configs in createdAt order. Logged in dry-run so the
  // operator can see the final state without writes.
  const finalAssignment = new Map<
    string,
    { collegeId: string; collegeName: string; partnershipTitle: string }
  >();

  for (const cfg of configs) {
    const collegeId = cfg.college;
    if (!collegeId || !mongoose.Types.ObjectId.isValid(String(collegeId))) {
      console.log(
        `  SKIP CONFIG  ${cfg._id} | "${cfg.title}" — bound college is invalid`,
      );
      continue;
    }

    const college = (await CollegeModel.findById(String(collegeId))
      .select("_id name")
      .lean()) as unknown as CollegeLean | null;

    if (!college) {
      console.log(
        `  SKIP CONFIG  ${cfg._id} | "${cfg.title}" — bound college not found`,
      );
      continue;
    }

    const rows = (await CollaborationWhitelistModel.find({
      partnershipImportConfigId: cfg._id,
      userId: { $exists: true, $ne: null },
    })
      .select("_id userId email status")
      .lean()) as unknown as WhitelistLean[];

    console.log(
      `\nPartnership ${cfg._id} | "${cfg.title}" [${cfg.kind}] → ${college._id} (${college.name})`,
    );
    console.log(`  whitelist rows with registered users: ${rows.length}`);

    let updatedInConfig = 0;
    let alreadyInConfig = 0;
    let missingInConfig = 0;

    for (const row of rows) {
      totalRowsConsidered += 1;
      const userId = row.userId;
      if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        totalSkippedNoUser += 1;
        continue;
      }

      const student = await UserModel.findOne({
        _id: new mongoose.Types.ObjectId(String(userId)),
        userType: "student",
      })
        .select("_id email college collegeName")
        .lean<{
          _id: unknown;
          email?: string;
          college?: unknown;
          collegeName?: string;
        } | null>();

      if (!student) {
        console.log(
          `    MISSING    ${row._id} | userId=${userId} | ${row.email ?? ""} — not a student / deleted`,
        );
        missingInConfig += 1;
        totalSkippedMissingStudent += 1;
        continue;
      }

      const currentCollegeId = student.college
        ? String(student.college)
        : null;
      const targetCollegeId = String(college._id);
      const sameCollege = currentCollegeId === targetCollegeId;
      const sameName =
        String(student.collegeName ?? "").trim() === college.name.trim();

      // Last-write-wins record — older configs are processed first, so the
      // newest binding stays on top.
      finalAssignment.set(String(student._id), {
        collegeId: targetCollegeId,
        collegeName: college.name,
        partnershipTitle: cfg.title,
      });

      if (sameCollege && sameName) {
        alreadyInConfig += 1;
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
      updatedInConfig += 1;
      totalStudentsUpdated += 1;
    }

    console.log(
      `  partnership summary: updated=${updatedInConfig}, already=${alreadyInConfig}, missing=${missingInConfig}`,
    );
  }

  console.log(`\n— Overall —`);
  console.log(`Whitelist rows considered: ${totalRowsConsidered}`);
  console.log(`Students updated:          ${totalStudentsUpdated}`);
  console.log(`Already correct:           ${totalAlreadyCorrect}`);
  console.log(`Skipped (no userId):       ${totalSkippedNoUser}`);
  console.log(`Skipped (missing student): ${totalSkippedMissingStudent}`);
  console.log(`Unique students touched:   ${finalAssignment.size}`);

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
