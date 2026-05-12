/**
 * One-off diagnostic: dump the internship enrollment(s) for a given user
 * email so we can see what's actually stored — especially internshipSnapshot
 * vs the live `internship` ref.
 *
 *   npx ts-node src/scripts/inspect-user-enrollment.ts <email>
 *   # default: kaustubh779.ps@gmail.com
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { UserModel } from "../models/user.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const email = process.argv[2] || "kaustubh779.ps@gmail.com";

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const user = await UserModel.findOne({ email })
    .select("_id email firstName lastName name")
    .lean();
  if (!user) {
    console.log(`No user found with email ${email}`);
    await mongoose.disconnect();
    return;
  }
  console.log("User:", user);

  const enrollments = await InternshipEnrollmentModel.find({ user: user._id }).lean();

  console.log(`\nEnrollments: ${enrollments.length}\n`);
  for (const e of enrollments) {
    const ee = e as Record<string, unknown>;
    console.log("─".repeat(60));
    console.log("_id:                  ", ee._id);
    console.log("status:               ", ee.status);
    console.log("internId:             ", ee.internId);
    console.log("internship (ref):     ", ee.internship);
    console.log(
      "internshipSnapshot:   ",
      JSON.stringify(ee.internshipSnapshot, null, 2),
    );
    console.log(
      "batchSnapshot:        ",
      JSON.stringify(ee.batchSnapshot, null, 2),
    );
    console.log("offerLetterUrl:       ", ee.offerLetterUrl);
    console.log("enrolledAt:           ", ee.enrolledAt);
    console.log("createdAt:            ", ee.createdAt);
    console.log("programDurationMonths:", ee.programDurationMonths);
    console.log(
      "applicationAnswers:   ",
      JSON.stringify(ee.applicationAnswers, null, 2),
    );

    if (ee.internship) {
      const live = await InternshipModel.findById(
        ee.internship as mongoose.Types.ObjectId,
      )
        .select("title isActive isPublished")
        .lean();
      console.log("live internship doc:  ", live);
    } else {
      console.log("live internship doc:   (no internship ref set)");
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
