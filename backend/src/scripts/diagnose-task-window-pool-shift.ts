/**
 * DRY RUN — how does the task-window fix move each learner's achievable pool?
 *
 * The certificate dry-run only reports enrollments whose window has already
 * ended, so while every cohort is still running it reports nothing. This script
 * measures the thing that actually changed and is observable today: for every
 * live enrollment, the achievable pool under the OLD rule vs the NEW one, and
 * whether that would move them across the certificate threshold when their
 * window eventually closes.
 *
 *   OLD: a task counted when  cohortStart + dueDays <= programEnd
 *   NEW: a task counts when   computeTaskWindow(...).isReachable
 *        (unlockAfterDays included, deadline clamped, >= 5 days left)
 *
 * `earned` and live-meeting points are untouched by this work, so any movement
 * in `totalAchievable` comes from tasks alone.
 *
 * READ ONLY — writes nothing. Run from backend root:
 *   npx ts-node src/scripts/diagnose-task-window-pool-shift.ts
 *   npx ts-node src/scripts/diagnose-task-window-pool-shift.ts --csv | Out-File -Encoding utf8 pool-shift.csv
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipLiveMeetingModel } from "../models/liveMeeting.schema";
import { computeTaskWindow } from "../lib/internshipTaskWindow";
import { resolveProgramEndDate } from "../lib/internshipProgramWindow";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CSV = process.argv.includes("--csv");

type TaskLite = {
  _id: string;
  successPoints: number;
  unlockAfterDays: number;
  dueDays: number;
  isActive: boolean;
};

/** The pre-fix membership test, reproduced exactly for comparison. */
function oldPool(tasks: TaskLite[], cohortStart: Date, programEnd: Date): number {
  let total = 0;
  for (const t of tasks) {
    if (t.isActive === false) continue;
    const dueAt = new Date(cohortStart);
    dueAt.setDate(dueAt.getDate() + Number(t.dueDays ?? 0));
    if (dueAt <= programEnd) total += Math.max(0, t.successPoints);
  }
  return total;
}

function newPool(tasks: TaskLite[], cohortStart: Date, programEnd: Date): number {
  let total = 0;
  for (const t of tasks) {
    if (t.isActive === false) continue;
    if (!computeTaskWindow(t, cohortStart, programEnd).isReachable) continue;
    total += Math.max(0, t.successPoints);
  }
  return total;
}

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  // ── Load everything up front: 4 queries total, then pure computation. ──────
  const enrollments = await InternshipEnrollmentModel.find({
    status: "enrolled",
    certificateEvaluation: { $exists: false },
  })
    .select(
      "internship batchSnapshot programDurationMonths endDate " +
        "internshipSuccessPoints certificateOverride",
    )
    .lean();

  const internships = await InternshipModel.find({})
    .select("title certificationThreshold batches")
    .lean();

  const taskIds = new Set<string>();
  for (const ins of internships as any[]) {
    for (const b of ins.batches ?? []) {
      for (const id of b.taskTemplateIds ?? []) taskIds.add(String(id));
    }
  }
  const taskDocs = await InternshipTaskModel.find({
    _id: { $in: [...taskIds].map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select("successPoints unlockAfterDays dueDays isActive")
    .lean();
  const taskById = new Map<string, TaskLite>(
    (taskDocs as any[]).map((t) => [
      String(t._id),
      {
        _id: String(t._id),
        successPoints: Number(t.successPoints ?? 0),
        unlockAfterDays: Number(t.unlockAfterDays ?? 0),
        dueDays: Number(t.dueDays ?? 0),
        isActive: t.isActive !== false,
      },
    ]),
  );

  const meetings = await InternshipLiveMeetingModel.find({})
    .select("internship batchId startDateTime successPoints")
    .lean();

  const insById = new Map(
    (internships as any[]).map((i) => [String(i._id), i]),
  );

  // ── Compare, per enrollment. ──────────────────────────────────────────────
  let grew = 0;
  let shrank = 0;
  let same = 0;
  let noWindow = 0;
  const flipsToFail: string[] = [];
  const flipsToPass: string[] = [];
  const csvRows: string[] = [];

  for (const e of enrollments as any[]) {
    const ins = insById.get(String(e.internship));
    const cohortStartRaw = e.batchSnapshot?.internshipStartDate;
    const programEnd = resolveProgramEndDate({
      endDate: e.endDate,
      cohortStart: cohortStartRaw,
      durationMonths: e.programDurationMonths,
    });
    if (!ins || !cohortStartRaw || !programEnd) {
      noWindow += 1;
      continue;
    }
    const cohortStart = new Date(cohortStartRaw);

    const batch = (ins.batches ?? []).find(
      (b: any) => String(b._id) === String(e.batchSnapshot?.batchId),
    );
    const tasks: TaskLite[] = (batch?.taskTemplateIds ?? [])
      .map((id: unknown) => taskById.get(String(id)))
      .filter(Boolean) as TaskLite[];

    // Meetings are unaffected by this change — same on both sides.
    let meetingsTotal = 0;
    for (const m of meetings as any[]) {
      if (String(m.internship) !== String(e.internship)) continue;
      if (String(m.batchId) !== String(e.batchSnapshot?.batchId)) continue;
      const t = new Date(m.startDateTime);
      if (t >= cohortStart && t <= programEnd) {
        meetingsTotal += Math.max(0, Number(m.successPoints ?? 0));
      }
    }

    const oldTasks = oldPool(tasks, cohortStart, programEnd);
    const newTasks = newPool(tasks, cohortStart, programEnd);
    const oldTotal = oldTasks + meetingsTotal;
    const newTotal = newTasks + meetingsTotal;

    const rawPct = ins.certificationThreshold;
    const pct =
      typeof rawPct === "number" && Number.isFinite(rawPct)
        ? Math.max(0, Math.min(100, rawPct))
        : 0;
    const earned = Math.max(0, Math.floor(Number(e.internshipSuccessPoints ?? 0)));

    const oldRequired = Math.ceil((oldTotal * pct) / 100);
    const newRequired = Math.ceil((newTotal * pct) / 100);
    const oldMeets = pct === 0 || earned >= oldRequired;
    const newMeets = pct === 0 || earned >= newRequired;

    if (newTotal > oldTotal) grew += 1;
    else if (newTotal < oldTotal) shrank += 1;
    else same += 1;

    const id = String(e._id);
    const label =
      `${id}  ${ins.title ?? "?"} / ${e.batchSnapshot?.name ?? "?"}  ` +
      `${e.programDurationMonths}mo  pool ${oldTotal} -> ${newTotal}  ` +
      `earned ${earned}, need ${oldRequired} -> ${newRequired}`;
    if (oldMeets && !newMeets) flipsToFail.push(label);
    if (!oldMeets && newMeets) flipsToPass.push(label);

    if (CSV) {
      csvRows.push(
        [
          id,
          `"${String(ins.title ?? "").replace(/"/g, '""')}"`,
          `"${String(e.batchSnapshot?.name ?? "").replace(/"/g, '""')}"`,
          new Date(cohortStartRaw).toISOString().slice(0, 10),
          e.programDurationMonths,
          programEnd.toISOString().slice(0, 10),
          tasks.length,
          oldTasks,
          newTasks,
          meetingsTotal,
          oldTotal,
          newTotal,
          newTotal - oldTotal,
          earned,
          oldRequired,
          newRequired,
          oldMeets ? "PASS" : "FAIL",
          newMeets ? "PASS" : "FAIL",
        ].join(","),
      );
    }
  }

  if (CSV) {
    console.log(
      "enrollmentId,internship,batch,cohortStart,months,programEnd," +
        "taskCount,oldTaskPts,newTaskPts,meetingPts," +
        "oldPool,newPool,delta,earned,oldRequired,newRequired,oldVerdict,newVerdict",
    );
    for (const r of csvRows) console.log(r);
    return;
  }

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  TASK WINDOW FIX — achievable pool shift`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`  Enrollments compared:  ${enrollments.length - noWindow}`);
  console.log(`    pool unchanged:      ${same}`);
  console.log(`    pool grew:           ${grew}   (more tasks now reachable)`);
  console.log(`    pool shrank:         ${shrank}   (phantom tasks removed)`);
  console.log(`    skipped (no window): ${noWindow}`);
  console.log(`\n  Threshold movement, once their window closes:`);
  console.log(`    would flip PASS -> FAIL:  ${flipsToFail.length}`);
  console.log(`    would flip FAIL -> PASS:  ${flipsToPass.length}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  if (flipsToFail.length > 0) {
    console.log(`PASS -> FAIL — review these before deploying:\n`);
    for (const l of flipsToFail) console.log(`  ${l}`);
    console.log("");
  }
  if (flipsToPass.length > 0) {
    console.log(`FAIL -> PASS — corrected by the fix:\n`);
    for (const l of flipsToPass) console.log(`  ${l}`);
    console.log("");
  }
  console.log(`Re-run with --csv for the full table.\n`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
