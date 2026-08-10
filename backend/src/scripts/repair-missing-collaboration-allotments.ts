/**
 * Enqueue collaboration allotment jobs for students who matched an active
 * course-allot partnership but never received one.
 *
 * Why these students exist: the register-time enqueue
 * (`enqueueCollaborationAllotmentAfterRegister`) went live partway through the
 * platform's life, and the only bulk catch-up
 * (`enqueueCollaborationAllotmentForExistingUsersMatchingDomain`) fires when a
 * domain is CREATED, never when it is edited. So a student who registered on a
 * partner domain after that domain was created but before the register-time
 * wiring existed falls in a permanent gap: nothing enqueues for them, and no
 * admin action re-triggers it.
 *
 * This script closes that gap. It enqueues through the same service the runtime
 * uses, so job snapshots and the pending/processing dedup behave identically.
 * The collaboration worker then grants the enrollments; it skips any course the
 * student already holds, so re-running is safe.
 *
 * A student is treated as already handled when they have a `completed` job for
 * that domain. Pending / processing jobs are left alone (the worker owns them),
 * and a `failed` job is re-enqueued, since the retry path is what it is for.
 *
 * Run from backend root:
 *   # preview every affected student across all course-allot domains:
 *   npx ts-node src/scripts/repair-missing-collaboration-allotments.ts
 *   # preview one domain:
 *   ... --domain=@pietgroup.co.in
 *   # one student only:
 *   ... --user=someone@pietgroup.co.in
 *   # write:
 *   ... --domain=@pietgroup.co.in --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { UserModel } from "../models/user.schema";
import { CollaborationDomainModel } from "../models/collaborationDomain.schema";
import { CollaborationJobModel } from "../models/collaborationJob.schema";
import { EnrollmentModel } from "../models/enrollment.schema";
import { createCollaborationAllotmentJobService } from "../services/collaborationJob.services";
import { studentEmailRegexForCollaborationDomain } from "../utils/collaborationDomainMatching";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
const APPLY = process.argv.includes("--apply");

const arg = (name: string): string =>
  (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").split("=")[1] ?? "";

const ONLY_DOMAIN = arg("domain").trim().toLowerCase();
const ONLY_USER = arg("user").trim().toLowerCase();

async function main() {
  if (!MONGO_URI) {
    console.error("No MONGODB_URI / MONGO_URI in env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`database: ${mongoose.connection.name}`);
  console.log(APPLY ? "MODE: APPLY (enqueueing)\n" : "MODE: DRY RUN (no writes)\n");

  const domainFilter: Record<string, unknown> = {
    collaborationKind: "course_allot",
    isActive: true,
  };
  if (ONLY_DOMAIN) {
    domainFilter.domain = ONLY_DOMAIN.startsWith("@")
      ? ONLY_DOMAIN
      : `@${ONLY_DOMAIN}`;
  }

  const domains = await CollaborationDomainModel.find(domainFilter)
    .select("_id domain title courses enrollmentAccess createdAt")
    .lean();

  if (domains.length === 0) {
    console.log("No active course-allot domains matched.");
    await mongoose.disconnect();
    return;
  }

  let totalEnqueued = 0;
  let totalSkipped = 0;

  for (const domain of domains) {
    const domainKey = String(domain.domain);
    const courseCount = (domain.courses ?? []).length;

    // A domain with no courses or no access rules would only make the worker
    // throw and burn retries, so it is reported rather than enqueued.
    if (courseCount === 0 || !domain.enrollmentAccess) {
      console.log(
        `${domainKey}: SKIPPING, courses=${courseCount} enrollmentAccess=${domain.enrollmentAccess ? "set" : "missing"}`,
      );
      continue;
    }

    const userFilter: Record<string, unknown> = {
      userType: "student",
      email: { $regex: studentEmailRegexForCollaborationDomain(domainKey) },
    };
    const students = await UserModel.find(userFilter)
      .select("_id email createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const scoped = ONLY_USER
      ? students.filter((s) => String(s.email).toLowerCase() === ONLY_USER)
      : students;

    if (scoped.length === 0) {
      if (!ONLY_USER) console.log(`${domainKey}: no students`);
      continue;
    }

    const ids = scoped.map((s) => s._id);

    // Two bulk reads instead of a query per student.
    const [handled, jobRows, enrolled] = await Promise.all([
      CollaborationJobModel.distinct("userId", {
        userId: { $in: ids },
        collaborationDomainId: domain._id,
        status: "completed",
      }),
      CollaborationJobModel.find({
        userId: { $in: ids },
        collaborationDomainId: domain._id,
        status: { $in: ["pending", "processing"] },
      })
        .select("userId status")
        .lean(),
      EnrollmentModel.distinct("userId", { userId: { $in: ids } }),
    ]);

    const handledSet = new Set(handled.map((x: unknown) => String(x)));
    const inFlightSet = new Set(jobRows.map((j: any) => String(j.userId)));
    const enrolledSet = new Set(enrolled.map((x: unknown) => String(x)));

    const needing = scoped.filter(
      (s) => !handledSet.has(String(s._id)) && !inFlightSet.has(String(s._id)),
    );

    console.log(
      `\n${domainKey}  "${domain.title}"  courses=${courseCount}\n` +
        `  students=${scoped.length} alreadyCompleted=${handledSet.size} ` +
        `inFlight=${inFlightSet.size} needing=${needing.length}`,
    );

    for (const student of needing) {
      const already = enrolledSet.has(String(student._id));
      const label =
        `  ${String((student as any).createdAt?.toISOString().slice(0, 10))}` +
        `  ${String(student._id)}${already ? "  (has some enrollments already)" : ""}`;

      if (!APPLY) {
        console.log(`  WOULD ENQUEUE ${label}`);
        totalEnqueued++;
        continue;
      }

      try {
        const job = await createCollaborationAllotmentJobService({
          userId: String(student._id),
          collaborationDomainId: String(domain._id),
        });
        console.log(`  ENQUEUED ${(job as any).jobId}${label}`);
        totalEnqueued++;
      } catch (error) {
        totalSkipped++;
        console.error(`  FAILED ${label}:`, error);
      }
    }
  }

  console.log(
    APPLY
      ? `\nenqueued ${totalEnqueued} job(s), ${totalSkipped} failed. The collaboration worker will grant the enrollments.`
      : `\nwould enqueue ${totalEnqueued} job(s). Re-run with --apply`,
  );

  if (APPLY && totalEnqueued > 0) {
    console.log(
      "Worker must be running (COLLABORATION_WORKER_ENABLED=true, or NODE_ENV=production).",
    );
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
