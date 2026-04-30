import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import {
  CollaborationWhitelistModel,
  PartnershipImportConfigModel,
  UserModel,
} from "../models";
import {
  createPartnershipImportAllotmentJobService,
} from "./collaborationJob.services";
import type {
  CollaborationWhitelistImportMode,
  CollaborationWhitelistImportRow,
  CollaborationWhitelistStatus,
} from "../types/collaborationWhitelist";
import type { PartnershipImportConfig } from "../types/partnershipImportConfig";

const MAX_LOOKUP_ATTEMPTS = 50;
const BATCH_LIMIT = Math.max(
  50,
  Math.min(500, Number(process.env.COLLABORATION_WHITELIST_BATCH_SIZE) || 200)
);

export function calculateWhitelistNextCheckTime(attempts: number): Date {
  const intervals = [5, 10, 15, 30, 60, 120, 240, 480, 720, 1440];
  const idx = Math.min(Math.max(0, attempts), intervals.length - 1);
  const minutes = intervals[idx];
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function normalizeWhitelistEmail(raw: string): string | null {
  const e = String(raw || "")
    .trim()
    .toLowerCase();
  if (!e || !e.includes("@")) return null;
  return e;
}

async function loadActiveImportConfig(
  partnershipImportConfigId: string
): Promise<PartnershipImportConfig | null> {
  if (!mongoose.Types.ObjectId.isValid(partnershipImportConfigId)) {
    return null;
  }
  return PartnershipImportConfigModel.findById(partnershipImportConfigId)
    .lean() as Promise<PartnershipImportConfig | null>;
}

export async function assertPartnershipImportConfigForWhitelist(
  partnershipImportConfigId: string
): Promise<PartnershipImportConfig> {
  const d = await loadActiveImportConfig(partnershipImportConfigId);
  if (!d) {
    throw new AppError("Partnership import config not found", 404);
  }
  if (!d.isActive) {
    throw new AppError("Partnership import config is inactive", 400);
  }
  return d;
}

async function enqueueCourseAllotJobForWhitelist(
  entryId: unknown,
  userId: string,
  partnershipImportConfigId: string
): Promise<void> {
  const id = new mongoose.Types.ObjectId(String(entryId));
  const job = await createPartnershipImportAllotmentJobService({
    userId,
    partnershipImportConfigId,
  });

  await CollaborationWhitelistModel.updateOne(
    { _id: id },
    {
      $set: {
        status: "queued" as CollaborationWhitelistStatus,
        userId: new mongoose.Types.ObjectId(userId),
        jobId: job.jobId,
        lastError: null,
      },
    }
  ).exec();
}

async function grantDiscountBenefitForWhitelist(
  entryId: unknown,
  userId: string
): Promise<void> {
  const id = new mongoose.Types.ObjectId(String(entryId));
  await CollaborationWhitelistModel.updateOne(
    { _id: id },
    {
      $set: {
        status: "benefit_applied" as CollaborationWhitelistStatus,
        userId: new mongoose.Types.ObjectId(userId),
        enrolledAt: new Date(),
        lastError: null,
        jobId: null,
      },
    }
  ).exec();
}

async function fulfillWhitelistEntryForUser(
  entry: { _id: unknown; partnershipImportConfigId: unknown },
  userId: string
): Promise<void> {
  const config = await assertPartnershipImportConfigForWhitelist(
    String(entry.partnershipImportConfigId)
  );

  if (config.kind === "discount") {
    await grantDiscountBenefitForWhitelist(entry._id, userId);
    return;
  }

  if (config.kind === "course_allot") {
    await enqueueCourseAllotJobForWhitelist(
      entry._id,
      userId,
      String(entry.partnershipImportConfigId)
    );
  }
}

/**
 * After registration: match pending whitelist rows and grant course jobs or discount eligibility.
 */
export async function tryPartnershipImportWhitelistAfterRegister(
  userId: string | mongoose.Types.ObjectId,
  email: string | undefined,
  userType: string
): Promise<void> {
  if (!email?.trim() || userType !== "student") return;

  const normalized = normalizeWhitelistEmail(email);
  if (!normalized) return;

  const entries = await CollaborationWhitelistModel.find({
    email: normalized,
    isActive: true,
    status: "pending",
  })
    .select("_id partnershipImportConfigId")
    .lean();

  for (const e of entries) {
    try {
      await assertPartnershipImportConfigForWhitelist(
        String(e.partnershipImportConfigId)
      );
      await fulfillWhitelistEntryForUser(e, String(userId));
    } catch (err) {
      console.error(
        "[Partnership import whitelist] Failed after register:",
        err
      );
    }
  }
}

export async function processCollaborationWhitelistBatchService(): Promise<{
  processed: number;
  queued: number;
  skipped: number;
}> {
  const now = new Date();

  await CollaborationWhitelistModel.updateMany(
    {
      status: "pending",
      isActive: true,
      expiresAt: { $lte: now },
    },
    { $set: { status: "expired" as CollaborationWhitelistStatus } }
  ).exec();

  const filter: Record<string, unknown> = {
    status: "pending",
    isActive: true,
    $or: [{ nextCheckAt: null }, { nextCheckAt: { $lte: now } }],
    $and: [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
    ],
  };

  const pending = await CollaborationWhitelistModel.find(filter)
    .sort({ createdAt: 1 })
    .limit(BATCH_LIMIT)
    .lean();

  if (pending.length === 0) {
    return { processed: 0, queued: 0, skipped: 0 };
  }

  const emails = [
    ...new Set(pending.map((p) => p.email).filter(Boolean)),
  ] as string[];

  const users = await UserModel.find({
    email: { $in: emails },
    userType: "student",
  })
    .select("_id email")
    .lean();

  const emailToUserId = new Map(
    users.map((u) => [String(u.email).toLowerCase(), String(u._id)])
  );

  let queued = 0;
  let skipped = 0;

  for (const row of pending) {
    const uid = emailToUserId.get(row.email);
    if (uid) {
      try {
        await fulfillWhitelistEntryForUser(row, uid);
        queued++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Fulfillment failed";
        await CollaborationWhitelistModel.updateOne(
          { _id: row._id },
          {
            $set: { lastError: msg, lastCheckedAt: now },
            $inc: { attempts: 1 },
          }
        ).exec();
        skipped++;
      }
      continue;
    }

    const attempts = (row.attempts ?? 0) + 1;
    const nextCheck = calculateWhitelistNextCheckTime(attempts);
    const updates: Record<string, unknown> = {
      attempts,
      lastCheckedAt: now,
      nextCheckAt: nextCheck,
    };

    if (attempts >= MAX_LOOKUP_ATTEMPTS) {
      updates.status = "failed" as CollaborationWhitelistStatus;
      updates.lastError =
        "User not registered after maximum lookup attempts";
      updates.nextCheckAt = null;
    }

    await CollaborationWhitelistModel.updateOne(
      { _id: row._id },
      { $set: updates }
    ).exec();
    skipped++;
  }

  return { processed: pending.length, queued, skipped };
}

export async function syncCollaborationWhitelistWithJobStatus(
  jobId: string,
  status: "completed" | "failed",
  errorMessage?: string | null
): Promise<void> {
  if (!jobId) return;

  const update =
    status === "completed"
      ? {
          $set: {
            status: "enrolled" as CollaborationWhitelistStatus,
            enrolledAt: new Date(),
            lastError: null,
          },
        }
      : {
          $set: {
            status: "failed" as CollaborationWhitelistStatus,
            lastError: errorMessage ?? "Collaboration job failed",
          },
        };

  await CollaborationWhitelistModel.updateMany({ jobId }, update).exec();
}

export async function importCollaborationWhitelistService(
  partnershipImportConfigId: string,
  rows: CollaborationWhitelistImportRow[],
  mode: CollaborationWhitelistImportMode,
  addedBy?: string
): Promise<{ inserted: number; updated: number; expired: number }> {
  const cfg = await assertPartnershipImportConfigForWhitelist(
    partnershipImportConfigId
  );

  const normalizedRows: CollaborationWhitelistImportRow[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const email = normalizeWhitelistEmail(r.email);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    normalizedRows.push({
      email,
      studentName: r.studentName?.trim() || undefined,
      studentId: r.studentId?.trim() || undefined,
    });
  }

  if (normalizedRows.length === 0) {
    throw new AppError("No valid emails in import", 400);
  }

  const oid = new mongoose.Types.ObjectId(partnershipImportConfigId);
  const incomingEmails = normalizedRows.map((r) => r.email);
  let expired = 0;

  if (mode === "replace") {
    const res = await CollaborationWhitelistModel.updateMany(
      {
        partnershipImportConfigId: oid,
        email: { $nin: incomingEmails },
        status: { $in: ["pending", "failed"] },
      },
      {
        $set: {
          status: "expired" as CollaborationWhitelistStatus,
          isActive: false,
          lastError: "Removed from list (replace import)",
        },
      }
    ).exec();
    expired = res.modifiedCount ?? 0;
  }

  let inserted = 0;
  let updated = 0;

  for (const r of normalizedRows) {
    const addedByOid = addedBy
      ? new mongoose.Types.ObjectId(addedBy)
      : undefined;

    if (mode === "replace") {
      const res = await CollaborationWhitelistModel.updateOne(
        { partnershipImportConfigId: oid, email: r.email },
        {
          $set: {
            partnershipImportConfigId: oid,
            email: r.email,
            studentName: r.studentName,
            studentId: r.studentId,
            isActive: true,
            addedBy: addedByOid,
            status: "pending" as CollaborationWhitelistStatus,
            attempts: 0,
            lastCheckedAt: null,
            nextCheckAt: null,
            lastError: null,
            jobId: null,
            userId: null,
            enrolledAt: null,
          },
        },
        { upsert: true }
      );
      if (res.upsertedCount) inserted++;
      else if (res.modifiedCount) updated++;
      continue;
    }

    const existing = await CollaborationWhitelistModel.findOne({
      partnershipImportConfigId: oid,
      email: r.email,
    })
      .select("_id status")
      .lean();

    if (!existing) {
      await CollaborationWhitelistModel.create({
        partnershipImportConfigId: oid,
        email: r.email,
        studentName: r.studentName,
        studentId: r.studentId,
        isActive: true,
        addedBy: addedByOid,
        status: "pending",
        attempts: 0,
      });
      inserted++;
      continue;
    }

    if (
      existing.status === "enrolled" ||
      existing.status === "queued" ||
      existing.status === "benefit_applied"
    ) {
      await CollaborationWhitelistModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            studentName: r.studentName,
            studentId: r.studentId,
            isActive: true,
          },
        }
      );
      updated++;
      continue;
    }

    const res = await CollaborationWhitelistModel.updateOne(
      { _id: existing._id },
      {
        $set: {
          studentName: r.studentName,
          studentId: r.studentId,
          isActive: true,
          status: "pending" as CollaborationWhitelistStatus,
          attempts: 0,
          lastCheckedAt: null,
          nextCheckAt: null,
          lastError: null,
          jobId: null,
          userId: null,
          enrolledAt: null,
        },
      }
    );
    if (res.modifiedCount) updated++;
  }

  return { inserted, updated, expired };
}

export async function listCollaborationWhitelistService(
  partnershipImportConfigId: string,
  options: {
    page?: number;
    limit?: number;
    status?: CollaborationWhitelistStatus;
    search?: string;
  } = {}
): Promise<{
  entries: unknown[];
  total: number;
  page: number;
  totalPages: number;
}> {
  await assertPartnershipImportConfigForWhitelist(partnershipImportConfigId);

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    partnershipImportConfigId: new mongoose.Types.ObjectId(
      partnershipImportConfigId
    ),
  };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search?.trim()) {
    const q = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { email: new RegExp(q, "i") },
      { studentName: new RegExp(q, "i") },
      { studentId: new RegExp(q, "i") },
    ];
  }

  const [total, raw] = await Promise.all([
    CollaborationWhitelistModel.countDocuments(filter),
    CollaborationWhitelistModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    entries: raw,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getCollaborationWhitelistStatsService(
  partnershipImportConfigId: string
): Promise<Record<string, number>> {
  await assertPartnershipImportConfigForWhitelist(partnershipImportConfigId);

  const oid = new mongoose.Types.ObjectId(partnershipImportConfigId);
  const statuses: CollaborationWhitelistStatus[] = [
    "pending",
    "queued",
    "enrolled",
    "benefit_applied",
    "failed",
    "expired",
  ];

  const counts = await Promise.all(
    statuses.map((s) =>
      CollaborationWhitelistModel.countDocuments({
        partnershipImportConfigId: oid,
        status: s,
      })
    )
  );

  const out: Record<string, number> = { total: 0 };
  statuses.forEach((s, i) => {
    out[s] = counts[i];
    out.total += counts[i];
  });

  return out;
}

export async function updateCollaborationWhitelistEntryService(
  partnershipImportConfigId: string,
  entryId: string,
  updates: {
    email?: string;
    studentName?: string | null;
    studentId?: string | null;
    isActive?: boolean;
    status?: CollaborationWhitelistStatus;
    notes?: string | null;
    expiresAt?: Date | null;
  }
): Promise<unknown | null> {
  await assertPartnershipImportConfigForWhitelist(partnershipImportConfigId);

  if (!mongoose.Types.ObjectId.isValid(entryId)) {
    throw new AppError("Invalid entry ID", 400);
  }

  const set: Record<string, unknown> = {};

  if (updates.email !== undefined) {
    const e = normalizeWhitelistEmail(updates.email);
    if (!e) throw new AppError("Invalid email", 400);
    set.email = e;
  }
  if (updates.studentName !== undefined) set.studentName = updates.studentName;
  if (updates.studentId !== undefined) set.studentId = updates.studentId;
  if (updates.isActive !== undefined) set.isActive = updates.isActive;
  if (updates.notes !== undefined) set.notes = updates.notes;
  if (updates.expiresAt !== undefined) set.expiresAt = updates.expiresAt;

  if (updates.status !== undefined) {
    set.status = updates.status;
    if (updates.status === "pending") {
      set.attempts = 0;
      set.nextCheckAt = null;
      set.lastError = null;
      set.jobId = null;
      set.enrolledAt = null;
    }
  }

  const doc = await CollaborationWhitelistModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(entryId),
      partnershipImportConfigId: new mongoose.Types.ObjectId(
        partnershipImportConfigId
      ),
    },
    { $set: set },
    { new: true }
  ).lean();

  return doc;
}

export async function deleteCollaborationWhitelistEntryService(
  partnershipImportConfigId: string,
  entryId: string
): Promise<boolean> {
  await assertPartnershipImportConfigForWhitelist(partnershipImportConfigId);

  if (!mongoose.Types.ObjectId.isValid(entryId)) {
    throw new AppError("Invalid entry ID", 400);
  }

  const res = await CollaborationWhitelistModel.deleteOne({
    _id: new mongoose.Types.ObjectId(entryId),
    partnershipImportConfigId: new mongoose.Types.ObjectId(
      partnershipImportConfigId
    ),
  }).exec();

  return res.deletedCount === 1;
}

export async function retryCollaborationWhitelistEntryService(
  partnershipImportConfigId: string,
  entryId: string
): Promise<unknown | null> {
  await assertPartnershipImportConfigForWhitelist(partnershipImportConfigId);

  if (!mongoose.Types.ObjectId.isValid(entryId)) {
    throw new AppError("Invalid entry ID", 400);
  }

  const entry = await CollaborationWhitelistModel.findOne({
    _id: new mongoose.Types.ObjectId(entryId),
    partnershipImportConfigId: new mongoose.Types.ObjectId(
      partnershipImportConfigId
    ),
  }).lean();

  if (!entry) {
    throw new AppError("Whitelist entry not found", 404);
  }

  const email = entry.email;
  const user = await UserModel.findOne({
    email,
    userType: "student",
  })
    .select("_id")
    .lean();

  if (!user) {
    await CollaborationWhitelistModel.updateOne(
      { _id: entry._id },
      {
        $set: {
          status: "pending" as CollaborationWhitelistStatus,
          attempts: 0,
          nextCheckAt: new Date(),
          lastError: null,
          jobId: null,
          userId: null,
        },
      }
    );
    return CollaborationWhitelistModel.findById(entry._id).lean();
  }

  await fulfillWhitelistEntryForUser(entry, String(user._id));

  return CollaborationWhitelistModel.findById(entry._id).lean();
}
