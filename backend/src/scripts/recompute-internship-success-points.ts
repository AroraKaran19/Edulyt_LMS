/**
 * Recompute `internshipSuccessPoints` for internship enrollments from
 * authoritative sources, repairing points that were orphaned before the task
 * success-points ledger existed. Also restores each task submission's
 * `creditedSuccessPoints` ledger so future reconciles stay correct.
 *
 * trueTotal = tasks + attendance + purchased + certification exam
 *   tasks      = Σ task submissions: (fully_reviewed && awarded >= snapshot.scoreThreshold) ? awarded : 0
 *   attendance = Σ finalized batch meetings the learner attended (both links clicked): meeting.successPoints
 *   purchased  = Σ fulfilled success-point orders for the enrollment: internshipSuccessPointsQuantity
 *   exam       = cert-exam submission: (fully_reviewed && awarded >= snapshot.thresholdScore) ? awarded : 0
 *
 * Mirrors exactly the four live crediting paths (task reconcile, liveMeeting
 * finalize, order fulfillment, accrueSuccessPointsIfPassed). Only TASK points
 * can be wrong (the only source with a reset); attendance/purchase/exam are
 * append-only and recomputed identically, so they should match and not change.
 *
 * DRY RUN BY DEFAULT — pass --apply to write.
 *   npx ts-node src/scripts/recompute-internship-success-points.ts            (dry run, all)
 *   npx ts-node src/scripts/recompute-internship-success-points.ts test@x.com (dry run, one user)
 *   npx ts-node src/scripts/recompute-internship-success-points.ts --apply    (write, all)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipLiveMeetingModel } from "../models/liveMeeting.schema";
import { OrderModel, UserModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  const apply = process.argv.includes("--apply");
  const emailArg = process.argv.find((a) => a.includes("@"));
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  let userFilter: mongoose.Types.ObjectId | null = null;
  if (emailArg) {
    const u = await UserModel.findOne({
      email: { $regex: `^${emailArg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    })
      .select("_id")
      .lean<{ _id: mongoose.Types.ObjectId } | null>();
    if (!u) { console.log(`No user for ${emailArg}`); return; }
    userFilter = u._id;
  }

  // batchId -> certification exam template id (config lives on the batch).
  const internships = await InternshipModel.find({}).select("batches").lean<any[]>();
  const certExamByBatch = new Map<string, string | null>();
  for (const ins of internships) {
    for (const b of ins.batches ?? []) {
      certExamByBatch.set(
        String(b._id),
        b.certificationExamTemplateId ? String(b.certificationExamTemplateId) : null,
      );
    }
  }

  // Live task config (taskId -> { successPoints, scoreThreshold }). Read live —
  // admins set these after submissions exist, so the submission snapshot is stale.
  const taskCfg = new Map<string, { successPoints: number; scoreThreshold: number }>();
  const allTasks = await InternshipTaskModel.find({})
    .select("successPoints scoreThreshold")
    .lean<any[]>();
  for (const t of allTasks) {
    taskCfg.set(String(t._id), {
      successPoints: Math.max(0, Number(t.successPoints ?? 0)),
      scoreThreshold: Math.max(0, Number(t.scoreThreshold ?? 0)),
    });
  }

  // Cache finalized meetings per `${internship}::${batchId}` (avoid re-querying per learner).
  const meetingsCache = new Map<
    string,
    { successPoints: number; l1: Set<string>; l2: Set<string> }[]
  >();
  async function meetingsForBatch(internship: unknown, batchId: string) {
    const key = `${String(internship)}::${batchId}`;
    const cached = meetingsCache.get(key);
    if (cached) return cached;
    const docs = await InternshipLiveMeetingModel.find({
      internship,
      batchId,
      finalizedAt: { $ne: null },
    })
      .select("successPoints link1.clickedBy link2.clickedBy")
      .lean<any[]>();
    const mapped = docs.map((m) => ({
      successPoints: Math.max(0, Math.floor(Number(m.successPoints ?? 0))),
      l1: new Set<string>((m.link1?.clickedBy ?? []).map((x: unknown) => String(x))),
      l2: new Set<string>((m.link2?.clickedBy ?? []).map((x: unknown) => String(x))),
    }));
    meetingsCache.set(key, mapped);
    return mapped;
  }

  const q: Record<string, unknown> = {};
  if (userFilter) q.user = userFilter;
  const enrollments = await InternshipEnrollmentModel.find(q)
    .select("user internship batchSnapshot internshipSuccessPoints status internshipSnapshot.title")
    .lean<any[]>();

  console.log(`${apply ? "APPLY" : "DRY RUN"} — inspecting ${enrollments.length} enrollment(s)\n`);

  const enrollWrites: any[] = [];
  const ledgerWrites: any[] = [];
  let changed = 0;

  for (const enr of enrollments) {
    const batchId = enr.batchSnapshot?.batchId ? String(enr.batchSnapshot.batchId) : null;
    const certExamId = batchId ? certExamByBatch.get(batchId) ?? null : null;
    const uid = String(enr.user);

    // 1) Tasks + 4) Exam (from submissions)
    const subs = await InternshipSubmissionModel.find({ enrollmentId: enr._id })
      .select(
        "submissionFor taskId examId status totalAwardedScore creditedSuccessPoints templateSnapshot.scoreThreshold templateSnapshot.successPoints templateSnapshot.thresholdScore",
      )
      .lean<any[]>();
    let tasksTotal = 0;
    let examTotal = 0;
    for (const s of subs) {
      const awarded = Math.max(0, Number(s.totalAwardedScore ?? 0));
      const finalized = String(s.status) === "fully_reviewed";
      if (s.submissionFor === "task") {
        // Task credits = configured successPoints, awarded all-or-nothing once
        // the learner's marks reach the threshold (not the grading marks).
        // Read LIVE task config (snapshot may predate the successPoints field).
        const cfg = taskCfg.get(String(s.taskId)) ?? {
          successPoints: Number(s.templateSnapshot?.successPoints ?? 0),
          scoreThreshold: Number(s.templateSnapshot?.scoreThreshold ?? 0),
        };
        const contribution =
          finalized && awarded >= cfg.scoreThreshold ? cfg.successPoints : 0;
        tasksTotal += contribution;
        if ((s.creditedSuccessPoints ?? null) !== contribution) {
          ledgerWrites.push({
            updateOne: {
              filter: { _id: s._id },
              update: { $set: { creditedSuccessPoints: contribution } },
            },
          });
        }
      } else if (s.submissionFor === "exam" && certExamId && String(s.examId) === certExamId) {
        const thr = Number(s.templateSnapshot?.thresholdScore ?? 0);
        examTotal += finalized && awarded >= thr ? awarded : 0;
      }
    }

    // 2) Attendance
    let attendanceTotal = 0;
    if (batchId) {
      const meetings = await meetingsForBatch(enr.internship, batchId);
      for (const m of meetings) {
        if (m.l1.has(uid) && m.l2.has(uid)) attendanceTotal += m.successPoints;
      }
    }

    // 3) Purchased
    const orders = await OrderModel.find({
      internshipEnrollmentId: enr._id,
      paymentStatus: "success",
      internshipSuccessPointsFulfillmentApplied: true,
    })
      .select("internshipSuccessPointsQuantity")
      .lean<any[]>();
    let purchaseTotal = 0;
    for (const o of orders)
      purchaseTotal += Math.max(0, Math.floor(Number(o.internshipSuccessPointsQuantity ?? 0)));

    const trueTotal = tasksTotal + attendanceTotal + purchaseTotal + examTotal;
    const current = Math.floor(Number(enr.internshipSuccessPoints ?? 0));

    if (trueTotal !== current) {
      changed++;
      console.log(
        `${current > trueTotal ? "↓" : "↑"} ${enr._id}  ${current} → ${trueTotal}` +
          `  [tasks ${tasksTotal} + attend ${attendanceTotal} + bought ${purchaseTotal} + exam ${examTotal}]` +
          `  ${(enr.internshipSnapshot?.title || "").slice(0, 32)}`,
      );
      enrollWrites.push({
        updateOne: {
          filter: { _id: enr._id },
          update: { $set: { internshipSuccessPoints: trueTotal } },
        },
      });
    }
  }

  console.log(`\nEnrollments needing correction: ${changed} / ${enrollments.length}`);
  console.log(`Task ledger fields to (re)set: ${ledgerWrites.length}`);

  if (!apply) {
    console.log(`\n[DRY RUN] Nothing written. Re-run with --apply to commit.`);
    return;
  }

  if (enrollWrites.length) await InternshipEnrollmentModel.bulkWrite(enrollWrites);
  if (ledgerWrites.length) await InternshipSubmissionModel.bulkWrite(ledgerWrites);
  console.log(
    `\n✅ Applied ${enrollWrites.length} point correction(s) and ${ledgerWrites.length} ledger update(s).`,
  );
}

run()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await mongoose.connection.close(); process.exit(process.exitCode ?? 0); });
