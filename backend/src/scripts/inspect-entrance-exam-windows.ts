/**
 * READ-ONLY diagnostic: list every internship batch that has an entrance-exam
 * template assigned, with its window (entranceExamStartAt/EndAt) in UTC + IST,
 * and whether the window is open/closed relative to now. Also dumps the linked
 * exam template's examResultAt/updatedAt so we can see what was actually edited.
 *
 *   npx ts-node src/scripts/inspect-entrance-exam-windows.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipModel } from "../models/internship.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function ist(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}
function utc(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toISOString();
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);

  const now = new Date();
  console.log(`\nNOW  UTC: ${utc(now)}`);
  console.log(`NOW  IST: ${ist(now)}\n`);

  const internships = await InternshipModel.find({
    "batches.entranceExamTemplateId": { $exists: true, $ne: null },
  })
    .select("title slug batches")
    .lean();

  for (const ins of internships as any[]) {
    for (const b of ins.batches ?? []) {
      if (!b?.entranceExamTemplateId) continue;
      const start = b.entranceExamStartAt as Date | undefined;
      const end = b.entranceExamEndAt as Date | undefined;
      const state = !end
        ? "no end set"
        : now.getTime() > new Date(end).getTime()
          ? "CLOSED"
          : start && now.getTime() < new Date(start).getTime()
            ? "not opened yet"
            : "OPEN";

      console.log("─".repeat(70));
      console.log(`internship:  ${ins.title}  (${ins.slug})`);
      console.log(`  internshipId:  ${ins._id}`);
      console.log(`  batch:         ${b.name}  (${b._id})`);
      console.log(`  templateId:    ${b.entranceExamTemplateId}`);
      console.log(`  startAt UTC:   ${utc(start)}   IST: ${ist(start)}`);
      console.log(`  endAt   UTC:   ${utc(end)}   IST: ${ist(end)}`);
      console.log(`  >>> window state vs now: ${state}`);

      const tpl = await InternshipExamModel.findById(b.entranceExamTemplateId)
        .select("title isActive examResultAt updatedAt")
        .lean();
      if (tpl) {
        const t = tpl as any;
        console.log(
          `  template:      "${t.title}" active=${t.isActive} examResultAt(IST)=${ist(t.examResultAt)} tplUpdated(IST)=${ist(t.updatedAt)}`,
        );
      } else {
        console.log("  template:      (not found / inactive)");
      }
    }
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
