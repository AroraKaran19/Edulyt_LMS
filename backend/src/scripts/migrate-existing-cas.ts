/**
 * Migration: ambassadors added to a team before CA applications existed get an
 * attached application, so they join tasks, meetings and end-of-tenure documents.
 *
 * Joining date: the IST day their CRM profile was created (no attach timestamp was ever stored).
 * Duration: 6 months. Each gets an intern ID and a queued offer-letter job, so the CA
 * worker renders their letter and sends the approved email, as for a new approval. CAs whose 6 months have already ended are put on
 * hold, so an admin can extend the duration and release them instead of the sweep
 * sending "not eligible".
 *
 * Dry run: npm run scripts:migrate-existing-cas
 * Apply:   npm run scripts:migrate-existing-cas:apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { CaApplicationModel, CrmProfileModel, UserModel } from "../models";
import { tenureEndDate } from "../lib/caApplication";
import { parseIstDateOnly, ymdIst } from "../utils/ist";
import { toAmbassadorKind } from "../services/crmProfile.services";
import { allocateNextInternId } from "../services/internId.services";
import { enqueueCaDocumentJob } from "../services/caDocumentJob.services";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const DURATION_MONTHS = 6;

type UserLite = {
  _id: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

const fullName = (u: UserLite | undefined) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();

async function migrateExistingCas() {
  let failed = false;
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");

    const profiles = await CrmProfileModel.find(
      { parentUserId: { $type: "objectId" } },
      { userId: 1, parentUserId: 1, ambassadorKind: 1, createdAt: 1 },
    ).lean();

    const studentIds = profiles.map((p) => p.userId);
    const existing = await CaApplicationModel.find(
      { userId: { $in: studentIds } },
      { userId: 1 },
    ).lean();
    const hasApplication = new Set(existing.map((a) => String(a.userId)));
    const todo = profiles.filter((p) => !hasApplication.has(String(p.userId)));

    const userIds = [...new Set(todo.flatMap((p) => [String(p.userId), String(p.parentUserId)]))];
    const users = await UserModel.find(
      { _id: { $in: userIds } },
      { firstName: 1, lastName: 1, email: 1, phone: 1 },
    ).lean<UserLite[]>();
    const byId = new Map(users.map((u) => [String(u._id), u]));

    const todayStart = parseIstDateOnly(ymdIst(new Date()))!;
    const docs: Record<string, unknown>[] = [];
    let held = 0;
    const skipped: string[] = [];

    for (const p of todo) {
      const student = byId.get(String(p.userId));
      if (!student?.email) {
        skipped.push(`${String(p.userId)} (no account or email)`);
        continue;
      }
      const createdAt = (p as { createdAt?: Date }).createdAt ?? new Date();
      const joiningDate = parseIstDateOnly(ymdIst(createdAt))!;
      const endDate = tenureEndDate(joiningDate, DURATION_MONTHS);
      const expired = endDate < todayStart;
      if (expired) held += 1;
      const owner = byId.get(String(p.parentUserId));

      console.log(
        `${fullName(student) || student.email} | owner ${fullName(owner) || String(p.parentUserId)} | joins ${ymdIst(joiningDate)} | ends ${ymdIst(endDate)}${expired ? " | on hold (past 6 months)" : ""}`,
      );

      docs.push({
        name: fullName(student) || student.email,
        email: student.email,
        phone: student.phone || "-",
        userId: p.userId,
        submittedByUserId: p.userId,
        joiningDate,
        durationMonths: DURATION_MONTHS,
        endDate,
        status: "attached",
        open: false,
        ownerUserId: p.parentUserId,
        ownerName: fullName(owner),
        kind: toAmbassadorKind(p.ambassadorKind) ?? "marketing",
        decidedAt: createdAt,
        attachedAt: createdAt,
        migrated: true,
        createdAt,
        updatedAt: new Date(),
        completion: expired ? { hold: true, heldAt: new Date() } : {},
      });
    }

    console.log(
      `\n${profiles.length} ambassador(s) on a team, ${existing.length} already have an application, ${docs.length} to create (${held} on hold), ${skipped.length} skipped`,
    );
    for (const s of skipped) console.log(`  skipped: ${s}`);

    if (!APPLY) {
      console.log("Dry run. Re-run with --apply to write. Apply also queues an offer letter and approved email for each.");
      return;
    }

    let created = 0;
    for (const doc of docs) {
      const app = new CaApplicationModel({ ...doc, internId: await allocateNextInternId() });
      // Raw insert: migrated rows have no college, payout or address, which live applications require via the form.
      await CaApplicationModel.collection.insertOne(app.toObject({ depopulate: true }));
      await enqueueCaDocumentJob(app._id, "offer-letter");
      created += 1;
    }
    console.log(`Created ${created} application(s) and queued ${created} offer letter(s)`);

    // Rows from an earlier run of this script were created without a queued letter.
    const letterless = await CaApplicationModel.find(
      { migrated: true, "documents.offerLetter": null },
      { _id: 1 },
    ).lean();
    await Promise.all(letterless.map((a) => enqueueCaDocumentJob(a._id, "offer-letter")));
    console.log(`Queued offer letters for ${letterless.length} migrated application(s) without one`);
  } catch (error) {
    failed = true;
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
  }
}

void migrateExistingCas();
