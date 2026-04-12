import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../middlewares/error.middleware";
import { CollaborationJobModel } from "../models/collaborationJob.schema";
import { CollaborationDomainModel } from "../models/collaborationDomain.schema";
import { PartnershipImportConfigModel } from "../models/partnershipImportConfig.schema";
import { UserModel } from "../models/user.schema";
import {
  CollaborationDomainJobSnapshot,
  CollaborationJob,
  CollaborationJobStatus,
  PartnershipImportConfigJobSnapshot,
} from "../types/collaborationJob";

function buildUserSnapshot(user: { firstName?: string; lastName?: string; email?: string } | null): {
  name: string;
  email: string;
} | null {
  if (!user) return null;
  const name = `${String(user.firstName ?? "").trim()} ${String(user.lastName ?? "").trim()}`.trim();
  const email = String(user.email ?? "").trim().toLowerCase();
  if (!name && !email) return null;
  return { name, email };
}

function normalizeEmailDomainForSnapshot(raw: string): string {
  const s = (raw || "").trim().toLowerCase();
  return s.startsWith("@") ? s.slice(1) : s;
}

export const createCollaborationAllotmentJobService = async (data: {
  userId: string;
  collaborationDomainId: string;
}): Promise<CollaborationJob> => {
  const jobId = uuidv4();

  const domainDoc = await CollaborationDomainModel.findById(
    data.collaborationDomainId
  )
    .select("title domain")
    .lean();

  if (!domainDoc) {
    throw new AppError("Collaboration domain not found", 404);
  }

  const collaborationDomainSnapshot: CollaborationDomainJobSnapshot = {
    title: domainDoc.title,
    domain: normalizeEmailDomainForSnapshot(domainDoc.domain),
  };

  const userDoc = await UserModel.findById(data.userId)
    .select("firstName lastName email")
    .lean();
  const userSnapshot = buildUserSnapshot(userDoc as any);

  try {
    const job = await CollaborationJobModel.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(data.userId),
        collaborationDomainId: new mongoose.Types.ObjectId(
          data.collaborationDomainId
        ),
        status: { $in: ["pending", "processing"] },
      },
      {
        $setOnInsert: {
          jobId,
          userId: new mongoose.Types.ObjectId(data.userId),
          collaborationDomainId: new mongoose.Types.ObjectId(
            data.collaborationDomainId
          ),
          status: "pending" as CollaborationJobStatus,
          retryCount: 0,
          collaborationDomainSnapshot,
          userSnapshot: userSnapshot ?? undefined,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return job as unknown as CollaborationJob;
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      const existing = await CollaborationJobModel.findOne({
        userId: new mongoose.Types.ObjectId(data.userId),
        collaborationDomainId: new mongoose.Types.ObjectId(
          data.collaborationDomainId
        ),
        status: { $in: ["pending", "processing"] },
      }).lean();
      if (existing) {
        return existing as unknown as CollaborationJob;
      }
    }
    console.error("Error creating collaboration allotment job:", error);
    throw new AppError("Failed to create collaboration allotment job", 500);
  }
};

export const createPartnershipImportAllotmentJobService = async (data: {
  userId: string;
  partnershipImportConfigId: string;
}): Promise<CollaborationJob> => {
  const jobId = uuidv4();

  const cfgDoc = await PartnershipImportConfigModel.findById(
    data.partnershipImportConfigId
  )
    .select("title kind")
    .lean();

  if (!cfgDoc) {
    throw new AppError("Partnership import config not found", 404);
  }

  if (cfgDoc.kind !== "course_allot") {
    throw new AppError("Partnership import config is not course allot", 400);
  }

  const partnershipImportConfigSnapshot: PartnershipImportConfigJobSnapshot = {
    title: cfgDoc.title,
  };

  const userDoc = await UserModel.findById(data.userId)
    .select("firstName lastName email")
    .lean();
  const userSnapshot = buildUserSnapshot(userDoc as any);

  try {
    const job = await CollaborationJobModel.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(data.userId),
        partnershipImportConfigId: new mongoose.Types.ObjectId(
          data.partnershipImportConfigId
        ),
        status: { $in: ["pending", "processing"] },
      },
      {
        $setOnInsert: {
          jobId,
          userId: new mongoose.Types.ObjectId(data.userId),
          partnershipImportConfigId: new mongoose.Types.ObjectId(
            data.partnershipImportConfigId
          ),
          collaborationDomainId: null,
          status: "pending" as CollaborationJobStatus,
          retryCount: 0,
          partnershipImportConfigSnapshot,
          userSnapshot: userSnapshot ?? undefined,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return job as unknown as CollaborationJob;
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      const existing = await CollaborationJobModel.findOne({
        userId: new mongoose.Types.ObjectId(data.userId),
        partnershipImportConfigId: new mongoose.Types.ObjectId(
          data.partnershipImportConfigId
        ),
        status: { $in: ["pending", "processing"] },
      }).lean();
      if (existing) {
        return existing as unknown as CollaborationJob;
      }
    }
    console.error("Error creating partnership import allotment job:", error);
    throw new AppError("Failed to create partnership import allotment job", 500);
  }
};

export const updateCollaborationJobStatusService = async (
  jobId: string,
  updates: {
    status?: CollaborationJobStatus;
    error?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }
): Promise<CollaborationJob> => {
  const updateData: Record<string, unknown> = { ...updates };

  if (updates.status === "processing" && !updates.startedAt) {
    updateData.startedAt = new Date();
  }
  if (updates.status === "completed" || updates.status === "failed") {
    updateData.completedAt = new Date();
  }

  const job = await CollaborationJobModel.findOneAndUpdate(
    { jobId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!job) {
    throw new AppError("Collaboration job not found", 404);
  }

  return job as unknown as CollaborationJob;
};

export const incrementCollaborationJobRetryService = async (
  jobId: string
): Promise<void> => {
  await CollaborationJobModel.findOneAndUpdate({ jobId }, { $inc: { retryCount: 1 } });
};

export const getNextPendingCollaborationJobService =
  async (): Promise<CollaborationJob | null> => {
    const job = await CollaborationJobModel.findOneAndUpdate(
      { status: "pending" },
      {
        $set: {
          status: "processing",
          startedAt: new Date(),
        },
      },
      {
        sort: { createdAt: 1 },
        new: true,
      }
    ).lean();

    return job as unknown as CollaborationJob | null;
  };

export type CollaborationJobAdminRow = CollaborationJob & {
  userName?: string;
  userEmail?: string;
  /** Resolved display: snapshot preferred, else live domain doc */
  domainTitle?: string;
  /** Email domain (no @), snapshot preferred */
  domainEmail?: string;
  /** True when the domain document is gone and this job has no snapshot (legacy rows). */
  domainRecordMissing?: boolean;
};

/**
 * List collaboration allotment jobs (admin): pagination, status filter, search on
 * job ID, user name/email, collaboration domain title.
 */
export const getAllCollaborationJobsService = async (
  options: {
    page?: number;
    limit?: number;
    status?: CollaborationJobStatus;
    search?: string;
  } = {}
): Promise<{
  jobs: CollaborationJobAdminRow[];
  total: number;
  page: number;
  limit: number;
}> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;
  const searchTrimmed = options.search?.trim();

  const filter: Record<string, unknown> = {};
  if (options.status) {
    filter.status = options.status;
  }

  const enrichJobs = async (
    raw: Record<string, unknown>[]
  ): Promise<CollaborationJobAdminRow[]> => {
    if (raw.length === 0) return [];

    const userIds = [
      ...new Set(
        raw.map((j) => String(j.userId ?? "")).filter(Boolean)
      ),
    ];
    const domainIds = [
      ...new Set(
        raw.map((j) => String(j.collaborationDomainId ?? "")).filter(Boolean)
      ),
    ];

    const [users, domains] = await Promise.all([
      UserModel.find({ _id: { $in: userIds } })
        .select("firstName lastName email")
        .lean(),
      CollaborationDomainModel.find({ _id: { $in: domainIds } })
        .select("title domain")
        .lean(),
    ]);

    const userMap = new Map(
      users.map((u) => {
        const id = String(u._id);
        const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
        return [id, { name, email: u.email || "" }];
      })
    );
    const domainMap = new Map(
      domains.map((d) => [
        String(d._id),
        {
          title: d.title || "",
          domain: normalizeEmailDomainForSnapshot(String((d as { domain?: string }).domain || "")),
        },
      ])
    );

    return raw.map((row) => {
      const j = row as Record<string, unknown>;
      const uid = String(j.userId ?? "");
      const did = String(j.collaborationDomainId ?? "");
      const u = userMap.get(uid);
      const userSnap = j.userSnapshot as { name?: string; email?: string } | null | undefined;
      const snap = j.collaborationDomainSnapshot as
        | CollaborationDomainJobSnapshot
        | undefined
        | null;
      const live = domainMap.get(did);
      const domainTitle = snap?.title ?? live?.title ?? "";
      const domainEmail = snap?.domain ?? live?.domain ?? "";
      const domainRecordMissing = !snap && !live;

      return {
        ...(j as unknown as CollaborationJob),
        userName: u?.name || userSnap?.name || "",
        userEmail: u?.email || userSnap?.email || "",
        domainTitle,
        domainEmail,
        collaborationDomainSnapshot:
          (snap ?? j.collaborationDomainSnapshot) as
            | CollaborationDomainJobSnapshot
            | null
            | undefined,
        domainRecordMissing,
      };
    });
  };

  try {
    if (searchTrimmed) {
      const searchRegex = new RegExp(
        searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      const usersColl = UserModel.collection.name;
      const domainsColl = CollaborationDomainModel.collection.name;

      const pipeline: mongoose.PipelineStage[] = [
        { $match: filter },
        {
          $lookup: {
            from: usersColl,
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
              { $project: { firstName: 1, lastName: 1, email: 1 } },
            ],
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: domainsColl,
            localField: "collaborationDomainId",
            foreignField: "_id",
            as: "domain",
            pipeline: [{ $project: { title: 1, domain: 1 } }],
          },
        },
        { $unwind: { path: "$domain", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            userName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ["$user.firstName", ""] },
                    " ",
                    { $ifNull: ["$user.lastName", ""] },
                  ],
                },
              },
            },
            userEmail: { $ifNull: ["$user.email", "$userSnapshot.email"] },
            snapshotUserName: { $ifNull: ["$userSnapshot.name", ""] },
            resolvedTitle: {
              $ifNull: [
                "$collaborationDomainSnapshot.title",
                "$domain.title",
                "",
              ],
            },
            resolvedDomain: {
              $ifNull: [
                "$collaborationDomainSnapshot.domain",
                "$domain.domain",
                "",
              ],
            },
          },
        },
        {
          $match: {
            $or: [
              { jobId: searchRegex },
              { userName: searchRegex },
              { "user.email": searchRegex },
              { snapshotUserName: searchRegex },
              { "userSnapshot.email": searchRegex },
              { resolvedTitle: searchRegex },
              { resolvedDomain: searchRegex },
              { "collaborationDomainSnapshot.title": searchRegex },
              { "collaborationDomainSnapshot.domain": searchRegex },
              { "domain.title": searchRegex },
              { "domain.domain": searchRegex },
              {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$collaborationDomainId" },
                    regex: searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                    options: "i",
                  },
                },
              },
            ],
          },
        },
      ];

      const [countResult, jobsResult] = await Promise.all([
        CollaborationJobModel.aggregate([...pipeline, { $count: "total" }]),
        CollaborationJobModel.aggregate([
          ...pipeline,
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              user: 0,
              domain: 0,
            },
          },
        ]),
      ]);

      const total = countResult[0]?.total ?? 0;
      const jobs = (
        jobsResult as (CollaborationJobAdminRow & {
          resolvedTitle?: string;
          resolvedDomain?: string;
          snapshotUserName?: string;
          userSnapshot?: { name?: string; email?: string } | null;
        })[]
      ).map((row) => {
        const snap = row.collaborationDomainSnapshot;
        const domainTitle = String(row.resolvedTitle ?? "").trim() || snap?.title || "";
        const domainEmail = normalizeEmailDomainForSnapshot(
          String(row.resolvedDomain ?? snap?.domain ?? "")
        );
        const domainRecordMissing =
          !snap &&
          !String(row.resolvedTitle ?? "").trim() &&
          !String(row.resolvedDomain ?? "").trim();

        const { resolvedTitle, resolvedDomain, ...rest } =
          row as unknown as Record<string, unknown> & {
            resolvedTitle?: string;
            resolvedDomain?: string;
          };

        return {
          ...(rest as unknown as CollaborationJob),
          userName: row.userName || row.snapshotUserName || "",
          userEmail: String(row.userEmail ?? row.userSnapshot?.email ?? "").trim(),
          domainTitle,
          domainEmail,
          domainRecordMissing,
          collaborationDomainSnapshot: snap ?? null,
        } as CollaborationJobAdminRow;
      });

      return { jobs, total, page, limit };
    }

    const [jobs, total] = await Promise.all([
      CollaborationJobModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CollaborationJobModel.countDocuments(filter),
    ]);

    const enriched = await enrichJobs(jobs as Record<string, unknown>[]);
    return { jobs: enriched, total, page, limit };
  } catch (error) {
    console.error("Error getting collaboration jobs:", error);
    throw new AppError("Failed to get collaboration jobs", 500);
  }
};

/**
 * Retry a failed collaboration job — reset to pending for the worker to pick up.
 */
export const retryCollaborationJobService = async (
  jobId: string
): Promise<CollaborationJob> => {
  try {
    const job = await CollaborationJobModel.findOne({ jobId }).lean();

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    if (job.status !== "failed") {
      throw new AppError(
        "Only failed jobs can be retried. Current status: " + job.status,
        400
      );
    }

    const updated = await CollaborationJobModel.findOneAndUpdate(
      { jobId },
      {
        $set: { status: "pending" as CollaborationJobStatus },
        $unset: {
          error: "",
          startedAt: "",
          completedAt: "",
        },
      },
      { new: true }
    ).lean();

    return updated as unknown as CollaborationJob;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error retrying collaboration job:", error);
    throw new AppError("Failed to retry collaboration job", 500);
  }
};
