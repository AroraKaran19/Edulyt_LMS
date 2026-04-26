import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { AppError } from "../middlewares/error.middleware";
import { isApplicationWindowOpenIst } from "../utils/applicationWindow";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toIso(d: unknown): string | undefined {
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d.toISOString();
  if (typeof d === "string" || typeof d === "number") {
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? undefined : t.toISOString();
  }
  return undefined;
}

export type InternshipEnrollmentListRow = {
  _id: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    name?: string;
  } | null;
  internship: {
    _id: string;
    title: string;
    slug?: string;
  } | null;
  internshipSnapshot?: {
    title: string;
    slug: string;
    thumbnail?: string;
  };
  batchSnapshot?: {
    batchId: string;
    name: string;
    internshipStartDate: string;
  };
  enrollmentType?: "merit" | "paid";
  status: string;
  examScore?: number;
  internshipSuccessPoints: number;
  enrolledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** ISO string — when the entrance exam window opens (from the batch's exam template). */
  examStartAt?: string;
  /** ISO string — when the entrance exam window closes. */
  examEndAt?: string;
  /** ISO string — when the exam result will be announced. */
  examResultAt?: string;
};

/**
 * Admin list: paginated internship enrollments with user + internship populated,
 * optional search (user email/name, internship title, batch name), status filter.
 */
export async function listInternshipEnrollmentsAdmin(
  page: number,
  limit: number,
  options: {
    search?: string;
    status?: string;
    internshipId?: string;
    batchId?: string;
    /** When status is "all" or omitted: `program` = seat confirmed / post-admission; `pipeline` = exam & selection; `all` = no status filter. */
    lifecycle?: "program" | "pipeline" | "all";
    enrollmentType?: "merit" | "paid";
    /** When true, `in_merit_pool` rows sort before all other statuses (then by `updatedAt` desc). */
    meritPoolFirst?: boolean;
  } = {},
): Promise<{
  enrollments: InternshipEnrollmentListRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  const skip = (p - 1) * l;

  const {
    search,
    status,
    internshipId,
    batchId,
    lifecycle,
    enrollmentType,
    meritPoolFirst,
  } = options;

  const PROGRAM_STATUSES = [
    "enrolled",
    "completed",
    "paused",
    "dropped",
    "revoked",
  ] as const;
  const PIPELINE_STATUSES = [
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
    "payment_pending",
  ] as const;

  const preMatch: Record<string, unknown> = {};
  if (internshipId && mongoose.Types.ObjectId.isValid(internshipId)) {
    preMatch.internship = new mongoose.Types.ObjectId(internshipId);
  }
  if (batchId) {
    preMatch["batchSnapshot.batchId"] = batchId;
  }
  if (enrollmentType === "merit" || enrollmentType === "paid") {
    preMatch.enrollmentType = enrollmentType;
  }
  if (status && status !== "all") {
    preMatch.status = status;
  } else if (!status || status === "all") {
    // lifecycle groups statuses unless a specific status is chosen
    if (lifecycle === "program") {
      preMatch.status = { $in: [...PROGRAM_STATUSES] };
    } else if (lifecycle === "pipeline") {
      preMatch.status = { $in: [...PIPELINE_STATUSES] };
    }
    // lifecycle "all" or undefined → no status constraint (back-compat)
  }

  const pipeline: mongoose.PipelineStage[] = [];
  if (Object.keys(preMatch).length > 0) {
    pipeline.push({ $match: preMatch });
  }
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc",
        pipeline: [
          { $project: { firstName: 1, lastName: 1, email: 1, name: 1 } },
        ],
      },
    },
    {
      $lookup: {
        from: "internships",
        localField: "internship",
        foreignField: "_id",
        as: "internshipDoc",
        pipeline: [{ $project: { title: 1, slug: 1 } }],
      },
    },
    {
      $addFields: {
        user: { $arrayElemAt: ["$userDoc", 0] },
        internship: { $arrayElemAt: ["$internshipDoc", 0] },
      },
    },
    { $project: { userDoc: 0, internshipDoc: 0 } },
  );

  if (search?.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    pipeline.push({
      $match: {
        $or: [
          { "user.email": rx },
          { "user.firstName": rx },
          { "user.lastName": rx },
          { "user.name": rx },
          { "internship.title": rx },
          { "batchSnapshot.name": rx },
        ],
      },
    });
  }

  const countResult = await InternshipEnrollmentModel.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);
  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / l));

  const sortStages: mongoose.PipelineStage[] = meritPoolFirst
    ? [
        {
          $addFields: {
            _meritPoolFirst: {
              $cond: [{ $eq: ["$status", "in_merit_pool"] }, 0, 1],
            },
          },
        },
        { $sort: { _meritPoolFirst: 1, updatedAt: -1 } },
      ]
    : [{ $sort: { updatedAt: -1 } }];

  const rows = await InternshipEnrollmentModel.aggregate([
    ...pipeline,
    ...sortStages,
    { $skip: skip },
    { $limit: l },
  ]);

  const enrollments: InternshipEnrollmentListRow[] = (
    rows as Record<string, unknown>[]
  ).map((r) => {
    const u = r.user as Record<string, unknown> | null | undefined;
    const ins = r.internship as Record<string, unknown> | null | undefined;
    const userOut =
      u && typeof u === "object" && u._id != null
        ? {
            _id: String((u as { _id: unknown })._id),
            firstName:
              typeof (u as { firstName?: string }).firstName === "string"
                ? (u as { firstName: string }).firstName
                : undefined,
            lastName:
              typeof (u as { lastName?: string }).lastName === "string"
                ? (u as { lastName: string }).lastName
                : undefined,
            email:
              typeof (u as { email?: string }).email === "string"
                ? (u as { email: string }).email
                : undefined,
            name:
              typeof (u as { name?: string }).name === "string"
                ? (u as { name: string }).name
                : undefined,
          }
        : null;
    const internshipOut =
      ins && typeof ins === "object" && ins._id != null
        ? {
            _id: String((ins as { _id: unknown })._id),
            title: String((ins as { title?: string }).title ?? ""),
            slug:
              typeof (ins as { slug?: string }).slug === "string"
                ? (ins as { slug: string }).slug
                : undefined,
          }
        : null;

    const batchSnap = r.batchSnapshot;
    const batchOut =
      batchSnap && typeof batchSnap === "object"
        ? {
            batchId: String((batchSnap as { batchId?: string }).batchId ?? ""),
            name: String((batchSnap as { name?: string }).name ?? ""),
            internshipStartDate:
              (batchSnap as { internshipStartDate?: Date })
                .internshipStartDate instanceof Date
                ? (
                    batchSnap as { internshipStartDate: Date }
                  ).internshipStartDate.toISOString()
                : new Date(
                    String(
                      (batchSnap as { internshipStartDate?: unknown })
                        .internshipStartDate ?? 0,
                    ),
                  ).toISOString(),
          }
        : undefined;

    const iSnap = r.internshipSnapshot as
      | { title?: string; slug?: string; thumbnail?: string }
      | null
      | undefined;
    const internshipSnapshotOut = iSnap?.title
      ? {
          title: String(iSnap.title),
          slug: String(iSnap.slug ?? ""),
          thumbnail:
            typeof iSnap.thumbnail === "string" ? iSnap.thumbnail : undefined,
        }
      : undefined;

    return {
      _id: String(r._id),
      user: userOut,
      internship: internshipOut,
      internshipSnapshot: internshipSnapshotOut,
      batchSnapshot: batchOut,
      enrollmentType: r.enrollmentType as "merit" | "paid" | undefined,
      status: String(r.status ?? ""),
      examScore: typeof r.examScore === "number" ? r.examScore : undefined,
      internshipSuccessPoints:
        typeof r.internshipSuccessPoints === "number"
          ? r.internshipSuccessPoints
          : 0,
      enrolledAt: toIso(r.enrolledAt),
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
    };
  });

  return { enrollments, total, page: p, totalPages };
}

export async function getInternshipEnrollmentByIdAdmin(
  id: string,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const doc = await InternshipEnrollmentModel.findById(id)
    .populate("user", "firstName lastName email name")
    .populate("internship", "title slug")
    .lean();
  if (!doc) {
    throw new AppError("Enrollment not found", 404);
  }
  const u = doc.user as unknown as Record<string, unknown> | null;
  const ins = doc.internship as unknown as Record<string, unknown> | null;
  const userOut =
    u && u._id != null
      ? {
          _id: String(u._id),
          firstName: typeof u.firstName === "string" ? u.firstName : undefined,
          lastName: typeof u.lastName === "string" ? u.lastName : undefined,
          email: typeof u.email === "string" ? u.email : undefined,
          name: typeof u.name === "string" ? u.name : undefined,
        }
      : null;
  const internshipOut =
    ins && ins._id != null
      ? {
          _id: String(ins._id),
          title: String(ins.title ?? ""),
          slug: typeof ins.slug === "string" ? ins.slug : undefined,
        }
      : null;
  const iSnap = doc.internshipSnapshot as
    | { title?: string; slug?: string; thumbnail?: string }
    | null
    | undefined;
  const bs = doc.batchSnapshot;
  return {
    _id: String(doc._id),
    user: userOut,
    internship: internshipOut,
    internshipSnapshot: iSnap?.title
      ? {
          title: String(iSnap.title),
          slug: String(iSnap.slug ?? ""),
          thumbnail:
            typeof iSnap.thumbnail === "string" ? iSnap.thumbnail : undefined,
        }
      : undefined,
    batchSnapshot:
      bs && typeof bs === "object"
        ? {
            batchId: String((bs as { batchId?: string }).batchId ?? ""),
            name: String((bs as { name?: string }).name ?? ""),
            internshipStartDate:
              (bs as { internshipStartDate?: Date })
                .internshipStartDate instanceof Date
                ? (
                    bs as { internshipStartDate: Date }
                  ).internshipStartDate.toISOString()
                : new Date(0).toISOString(),
          }
        : undefined,
    enrollmentType: doc.enrollmentType as "merit" | "paid" | undefined,
    status: String(doc.status ?? ""),
    examScore: typeof doc.examScore === "number" ? doc.examScore : undefined,
    internshipSuccessPoints:
      typeof doc.internshipSuccessPoints === "number"
        ? doc.internshipSuccessPoints
        : 0,
    enrolledAt:
      doc.enrolledAt instanceof Date
        ? doc.enrolledAt.toISOString()
        : doc.enrolledAt
          ? new Date(doc.enrolledAt).toISOString()
          : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : undefined,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : undefined,
  };
}

// ─── Learner: register for entrance exam ─────────────────────────────────────

/**
 * Called when a learner submits the enrollment form.
 * Creates an InternshipEnrollment with status "exam_registered".
 * The user's profile is updated separately via PATCH /users/me before this call.
 */
export async function registerForExam(
  userId: mongoose.Types.ObjectId,
  internshipId: string,
  batchId: string,
): Promise<{ enrollmentId: string }> {
  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Invalid internship id", 400);
  }

  const internship = await InternshipModel.findById(internshipId).lean();
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.isActive) throw new AppError("Internship is not active", 400);

  const batch = (
    internship.batches as {
      _id: unknown;
      name: string;
      internshipStartDate: Date;
      applicationLastDate?: Date;
      isActive: boolean;
      entranceExamTemplateId?: unknown;
    }[]
  )?.find((b) => String(b._id) === batchId);
  if (!batch) throw new AppError("Batch not found", 404);
  if (!batch.isActive)
    throw new AppError("Batch is not accepting registrations", 400);
  if (!batch.entranceExamTemplateId) {
    throw new AppError("This batch does not have an entrance exam", 400);
  }
  if (!isApplicationWindowOpenIst(batch.applicationLastDate)) {
    throw new AppError("The application period for this batch has ended", 400);
  }

  const existing = await InternshipEnrollmentModel.findOne({
    user: userId,
    internship: new mongoose.Types.ObjectId(internshipId),
    "batchSnapshot.batchId": batchId,
  }).lean();
  if (existing) {
    // Idempotent — already registered for exam (merit or paid-upgrade path).
    const examStatuses = ["exam_registered", "exam_attempted"] as string[];
    if (examStatuses.includes(String(existing.status))) {
      return { enrollmentId: String(existing._id) };
    }
    // Already fully enrolled (paid seat confirmed or merit pool converted).
    if (String(existing.status) === "enrolled") {
      return { enrollmentId: String(existing._id) };
    }
    throw new AppError("You are already registered for this batch", 409);
  }

  const enrollment = await InternshipEnrollmentModel.create({
    internship: new mongoose.Types.ObjectId(internshipId),
    user: userId,
    enrollmentType: "merit",
    status: "exam_registered",
    internshipSnapshot: {
      title: String((internship as { title?: unknown }).title ?? ""),
      slug: String((internship as { slug?: unknown }).slug ?? ""),
      thumbnail:
        typeof (internship as { thumbnail?: unknown }).thumbnail === "string"
          ? (internship as { thumbnail: string }).thumbnail
          : undefined,
    },
    batchSnapshot: {
      batchId: String(batch._id),
      name: batch.name,
      internshipStartDate: batch.internshipStartDate,
    },
  });

  return { enrollmentId: String(enrollment._id) };
}

/**
 * “Book seat / without entrance” — requires batch `plan` with pricing.
 * Learner must complete payment via Paytm; enrollment stays `payment_pending` until then.
 */
export async function registerForPaidSeat(
  userId: mongoose.Types.ObjectId,
  internshipId: string,
  batchId: string,
): Promise<{ enrollmentId: string }> {
  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Invalid internship id", 400);
  }

  const internship = await InternshipModel.findById(internshipId).lean();
  if (!internship) throw new AppError("Internship not found", 404);
  if (!internship.isActive) throw new AppError("Internship is not active", 400);

  const batch = (
    internship.batches as {
      _id: unknown;
      name: string;
      internshipStartDate: Date;
      applicationLastDate?: Date;
      isActive: boolean;
      plan?: { price: number; isActive?: boolean; discount?: unknown } | null;
    }[]
  )?.find((b) => String(b._id) === batchId);
  if (!batch) throw new AppError("Batch not found", 404);
  if (!batch.isActive)
    throw new AppError("Batch is not accepting registrations", 400);
  if (!isApplicationWindowOpenIst(batch.applicationLastDate)) {
    throw new AppError("The application period for this batch has ended", 400);
  }
  if (!batch.plan || batch.plan.isActive === false) {
    throw new AppError(
      "This cohort is not open for direct seat purchase (no plan configured)",
      400,
    );
  }

  const existing = await InternshipEnrollmentModel.findOne({
    user: userId,
    internship: new mongoose.Types.ObjectId(internshipId),
    "batchSnapshot.batchId": batchId,
  });
  if (existing) {
    // Already fully paid/enrolled — nothing to do.
    if (
      existing.enrollmentType === "paid" &&
      existing.status === "payment_pending"
    ) {
      return { enrollmentId: String(existing._id) };
    }

    // User registered for entrance but now also wants to pay for a guaranteed seat.
    // Upgrade enrollmentType → "paid" without touching status so exam access is preserved.
    // After payment completes they will be moved directly to "enrolled".
    const upgradeableStatuses = [
      "exam_registered",
      "exam_attempted",
    ] as string[];
    if (upgradeableStatuses.includes(String(existing.status))) {
      existing.enrollmentType = "paid";
      await existing.save();
      return { enrollmentId: String(existing._id) };
    }

    throw new AppError("You are already registered for this batch", 409);
  }

  const enrollment = await InternshipEnrollmentModel.create({
    internship: new mongoose.Types.ObjectId(internshipId),
    user: userId,
    enrollmentType: "paid",
    status: "payment_pending",
    internshipSnapshot: {
      title: String((internship as { title?: unknown }).title ?? ""),
      slug: String((internship as { slug?: unknown }).slug ?? ""),
      thumbnail:
        typeof (internship as { thumbnail?: unknown }).thumbnail === "string"
          ? (internship as { thumbnail: string }).thumbnail
          : undefined,
    },
    batchSnapshot: {
      batchId: String(batch._id),
      name: batch.name,
      internshipStartDate: batch.internshipStartDate,
    },
  });

  return { enrollmentId: String(enrollment._id) };
}

/**
 * Learner: list their internship enrollments (dashboard).
 */
export async function listMyInternshipEnrollments(
  userId: mongoose.Types.ObjectId,
  page: number,
  limit: number,
  search?: string,
  /** When set, only rows whose `status` is in this list (entrance exam / selection flow). */
  statuses?: string[],
): Promise<{
  enrollments: InternshipEnrollmentListRow[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  const skip = (p - 1) * l;

  const baseMatch: Record<string, unknown> = { user: userId };
  if (statuses && statuses.length > 0) {
    baseMatch.status = { $in: statuses };
  }
  if (search?.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    baseMatch.$or = [
      { "internshipSnapshot.title": rx },
      { "batchSnapshot.name": rx },
    ];
  }

  const [raw, total] = await Promise.all([
    InternshipEnrollmentModel.find(baseMatch)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    InternshipEnrollmentModel.countDocuments(baseMatch),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / l));

  // For merit-path rows that are exam_registered or exam_attempted, fetch exam window dates.
  const meritExamStatuses = new Set(["exam_registered", "exam_attempted"]);
  const examWindowById = new Map<
    string,
    { examStartAt?: string; examEndAt?: string }
  >();

  const meritRows = (raw as Record<string, unknown>[]).filter(
    (d) => meritExamStatuses.has(String(d.status ?? "")) && d.internship,
  );

  if (meritRows.length > 0) {
    // Group by internshipId so we fetch each internship once.
    const byInternship = new Map<
      string,
      { batchId: string; docIds: string[] }[]
    >();
    for (const d of meritRows) {
      const insId = String(
        (d.internship as { _id?: unknown })?._id ?? d.internship ?? "",
      );
      const batchId = String(
        (d.batchSnapshot as { batchId?: string } | undefined)?.batchId ?? "",
      );
      if (!insId || !batchId) continue;
      if (!byInternship.has(insId)) byInternship.set(insId, []);
      byInternship.get(insId)!.push({ batchId, docIds: [String(d._id)] });
    }

    const insIds = [...byInternship.keys()].filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (insIds.length > 0) {
      const insDocs = await InternshipModel.find({
        _id: { $in: insIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .select("batches._id batches.entranceExamTemplateId")
        .lean();

      // Build map: internshipId → batchId → entranceExamTemplateId
      const examIdByBatch = new Map<string, string>();
      for (const ins of insDocs) {
        const insId = String((ins as { _id: unknown })._id);
        const batches =
          (
            ins as {
              batches?: { _id?: unknown; entranceExamTemplateId?: unknown }[];
            }
          ).batches ?? [];
        for (const b of batches) {
          if (b.entranceExamTemplateId) {
            examIdByBatch.set(
              `${insId}::${String(b._id)}`,
              String(b.entranceExamTemplateId),
            );
          }
        }
      }

      // Collect unique exam template ids
      const examTemplateIds = new Set<string>();
      for (const d of meritRows) {
        const insId = String(
          (d.internship as { _id?: unknown })?._id ?? d.internship ?? "",
        );
        const batchId = String(
          (d.batchSnapshot as { batchId?: string } | undefined)?.batchId ?? "",
        );
        const tid = examIdByBatch.get(`${insId}::${batchId}`);
        if (tid) examTemplateIds.add(tid);
      }

      if (examTemplateIds.size > 0) {
        const examDocs = await InternshipExamModel.find({
          _id: {
            $in: [...examTemplateIds].map(
              (id) => new mongoose.Types.ObjectId(id),
            ),
          },
        })
          .select("examStartAt examEndAt examResultAt")
          .lean();

        const windowByExamId = new Map<
          string,
          { examStartAt?: string; examEndAt?: string; examResultAt?: string }
        >();
        for (const e of examDocs) {
          const eid = String((e as { _id: unknown })._id);
          const eAny = e as {
            examStartAt?: Date;
            examEndAt?: Date;
            examResultAt?: Date;
          };
          windowByExamId.set(eid, {
            examStartAt:
              eAny.examStartAt instanceof Date
                ? eAny.examStartAt.toISOString()
                : undefined,
            examEndAt:
              eAny.examEndAt instanceof Date
                ? eAny.examEndAt.toISOString()
                : undefined,
            examResultAt:
              eAny.examResultAt instanceof Date
                ? eAny.examResultAt.toISOString()
                : undefined,
          });
        }

        for (const d of meritRows) {
          const insId = String(
            (d.internship as { _id?: unknown })?._id ?? d.internship ?? "",
          );
          const batchId = String(
            (d.batchSnapshot as { batchId?: string } | undefined)?.batchId ??
              "",
          );
          const tid = examIdByBatch.get(`${insId}::${batchId}`);
          if (tid) {
            const win = windowByExamId.get(tid);
            if (win) examWindowById.set(String(d._id), win);
          }
        }
      }
    }
  }

  const enrollments: InternshipEnrollmentListRow[] = (
    raw as Record<string, unknown>[]
  ).map((doc) => {
    const id = String(doc._id);
    const ins = doc.internship as
      | { _id: unknown; title?: string; slug?: string }
      | null
      | undefined;
    const iSnap = doc.internshipSnapshot as
      | { title?: string; slug?: string; thumbnail?: string }
      | undefined;
    const bs = doc.batchSnapshot as
      | {
          batchId?: string;
          name?: string;
          internshipStartDate?: Date;
        }
      | undefined;
    return {
      _id: id,
      user: null,
      internship:
        ins && ins._id != null
          ? {
              _id: String(ins._id),
              title: String(ins.title ?? ""),
              slug: typeof ins.slug === "string" ? ins.slug : undefined,
            }
          : null,
      internshipSnapshot: iSnap?.title
        ? {
            title: String(iSnap.title),
            slug: String(iSnap.slug ?? ""),
            thumbnail:
              typeof iSnap.thumbnail === "string" ? iSnap.thumbnail : undefined,
          }
        : undefined,
      batchSnapshot:
        bs && typeof bs === "object"
          ? {
              batchId: String(bs.batchId ?? ""),
              name: String(bs.name ?? ""),
              internshipStartDate:
                bs.internshipStartDate instanceof Date
                  ? bs.internshipStartDate.toISOString()
                  : (toIso(bs.internshipStartDate) ??
                    new Date(0).toISOString()),
            }
          : undefined,
      enrollmentType: doc.enrollmentType as "merit" | "paid" | undefined,
      status: String(doc.status ?? ""),
      examScore: typeof doc.examScore === "number" ? doc.examScore : undefined,
      internshipSuccessPoints:
        typeof doc.internshipSuccessPoints === "number"
          ? doc.internshipSuccessPoints
          : 0,
      enrolledAt: toIso(doc.enrolledAt),
      createdAt: doc.createdAt
        ? toIso((doc as { createdAt: unknown }).createdAt)
        : undefined,
      updatedAt: doc.updatedAt
        ? toIso((doc as { updatedAt: unknown }).updatedAt)
        : undefined,
      ...examWindowById.get(String(doc._id)),
    };
  });

  return { enrollments, total, page: p, totalPages };
}

// ─── Learner: get entrance exam for a specific enrollment ────────────────────

export type LearnerEntranceExamQuestion = {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  options?: { optionId: string; text: string }[];
};

export type LearnerEntranceExam = {
  examId: string;
  enrollmentId: string;
  internshipId: string;
  batchId: string;
  title: string;
  description: string;
  totalScore: number;
  thresholdScore?: number;
  examStartAt?: string;
  examEndAt?: string;
  examResultAt?: string;
  questions: LearnerEntranceExamQuestion[];
  /** Existing draft submission id (if the learner already started). */
  existingSubmissionId?: string;
};

export async function getLearnerEntranceExam(
  enrollmentId: string,
  userId: mongoose.Types.ObjectId,
): Promise<LearnerEntranceExam> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const enrollment =
    await InternshipEnrollmentModel.findById(enrollmentId).lean();
  if (!enrollment) throw new AppError("Enrollment not found", 404);
  if (String((enrollment as { user?: unknown }).user) !== String(userId)) {
    throw new AppError("Forbidden", 403);
  }
  const status = String((enrollment as { status?: unknown }).status ?? "");
  if (status !== "exam_registered" && status !== "exam_attempted") {
    throw new AppError(
      "No entrance exam available for this enrollment's current status",
      400,
    );
  }

  const internshipId = String(
    (enrollment as { internship?: unknown }).internship ?? "",
  );
  const batchId = String(
    (enrollment as { batchSnapshot?: { batchId?: string } }).batchSnapshot
      ?.batchId ?? "",
  );
  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw new AppError("Enrollment has no valid internship reference", 500);
  }

  const internship = await InternshipModel.findById(internshipId)
    .select("batches._id batches.entranceExamTemplateId")
    .lean();
  if (!internship) throw new AppError("Internship not found", 404);

  const batches =
    (
      internship as {
        batches?: { _id?: unknown; entranceExamTemplateId?: unknown }[];
      }
    ).batches ?? [];
  const batch = batches.find((b) => String(b._id) === batchId);
  if (!batch?.entranceExamTemplateId) {
    throw new AppError("This batch has no entrance exam configured", 400);
  }

  const examId = String(batch.entranceExamTemplateId);
  const exam = await InternshipExamModel.findById(examId).lean();
  if (!exam || !(exam as { isActive?: boolean }).isActive) {
    throw new AppError("Entrance exam not found or inactive", 404);
  }

  const eAny = exam as {
    title?: string;
    description?: string;
    totalScore?: number;
    thresholdScore?: number;
    examStartAt?: Date;
    examEndAt?: Date;
    examResultAt?: Date;
    questions?: unknown[];
    isActive?: boolean;
  };

  const now = new Date();
  if (eAny.examStartAt && now < eAny.examStartAt) {
    throw new AppError("The exam window has not opened yet", 403);
  }
  if (eAny.examEndAt && now > eAny.examEndAt) {
    throw new AppError("The exam window has closed", 403);
  }

  // Fetch questions (scrub isCorrect)
  const qIds = Array.isArray(eAny.questions)
    ? eAny.questions.map((q) => new mongoose.Types.ObjectId(String(q)))
    : [];
  const qDocs = await (
    await import("../models/internshipQuestion.schema")
  ).InternshipQuestionModel.find({ _id: { $in: qIds } })
    .select("questionText type score options referenceFile")
    .lean();

  const questions: LearnerEntranceExamQuestion[] = qIds
    .map((oid) =>
      qDocs.find((d) => String((d as { _id: unknown })._id) === String(oid)),
    )
    .filter((q): q is NonNullable<typeof q> => q != null)
    .map((q) => {
      const qAny = q as {
        _id: unknown;
        questionText?: string;
        type?: string;
        score?: number;
        options?: { _id?: unknown; text?: unknown; isCorrect?: unknown }[];
      };
      const out: LearnerEntranceExamQuestion = {
        questionId: String(qAny._id),
        questionText: String(qAny.questionText ?? ""),
        type: (qAny.type === "file_upload" ? "file_upload" : "mcq") as
          | "mcq"
          | "file_upload",
        score: typeof qAny.score === "number" ? qAny.score : 0,
      };
      if (qAny.type === "mcq" && Array.isArray(qAny.options)) {
        out.options = qAny.options.map((o) => ({
          optionId: String(o._id ?? ""),
          text: String(o.text ?? ""),
          // isCorrect intentionally excluded for learners
        }));
      }
      return out;
    });

  // Check for existing draft submission
  const { InternshipSubmissionModel } =
    await import("../models/internshipSubmission.schema");
  const existingSub = await InternshipSubmissionModel.findOne({
    userId,
    examId,
    batchId,
    status: "draft",
  })
    .select("_id")
    .lean();

  return {
    examId,
    enrollmentId,
    internshipId,
    batchId,
    title: String(eAny.title ?? "Entrance Exam"),
    description: String(eAny.description ?? ""),
    totalScore: typeof eAny.totalScore === "number" ? eAny.totalScore : 0,
    thresholdScore:
      typeof eAny.thresholdScore === "number" ? eAny.thresholdScore : undefined,
    examStartAt:
      eAny.examStartAt instanceof Date
        ? eAny.examStartAt.toISOString()
        : undefined,
    examEndAt:
      eAny.examEndAt instanceof Date ? eAny.examEndAt.toISOString() : undefined,
    examResultAt:
      eAny.examResultAt instanceof Date
        ? eAny.examResultAt.toISOString()
        : undefined,
    questions,
    existingSubmissionId: existingSub
      ? String((existingSub as { _id: unknown })._id)
      : undefined,
  };
}

// ─── Admin: update enrollment status ─────────────────────────────────────────

const ALLOWED_ADMIN_TRANSITIONS: Record<string, string[]> = {
  /** Admin may move straight to merit pool (e.g. shortlist without exam attempt on file). */
  exam_registered: ["exam_attempted", "in_merit_pool", "admin_rejected"],
  exam_attempted: ["in_merit_pool", "admin_rejected"],
  in_merit_pool: ["enrolled", "admin_rejected"],
  enrolled: ["completed", "paused", "revoked"],
  paused: ["enrolled", "revoked"],
};

export async function adminUpdateEnrollmentStatus(
  enrollmentId: string,
  newStatus: string,
  adminUserId: mongoose.Types.ObjectId,
  rejectionNote?: string,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  const allowed = ALLOWED_ADMIN_TRANSITIONS[doc.status as string] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from "${doc.status}" to "${newStatus}"`,
      400,
    );
  }

  doc.status = newStatus as typeof doc.status;
  doc.adminActionBy = adminUserId;
  doc.adminActionAt = new Date();

  if (newStatus === "admin_rejected" && rejectionNote) {
    doc.adminRejectionNote = rejectionNote;
  }
  if (newStatus === "enrolled") {
    doc.enrolledAt = new Date();
  }

  await doc.save();
  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}

/** Merit-path statuses an admin can resolve to `enrolled` in one action. */
const APPROVABLE_MERIT_TO_ENROLLED = new Set([
  "exam_registered",
  "exam_attempted",
  "in_merit_pool",
]);

/**
 * Admin: confirm merit candidates into the program as `enrolled` in a single
 * action (no separate “merit pool” step on the client). Idempotent for
 * already-enrolled rows.
 */
export async function adminApproveMeritToEnrolled(
  enrollmentId: string,
  adminUserId: mongoose.Types.ObjectId,
): Promise<InternshipEnrollmentListRow> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new AppError("Enrollment not found", 404);

  const s = String(doc.status ?? "");
  if (s === "enrolled") {
    return getInternshipEnrollmentByIdAdmin(enrollmentId);
  }
  if (!APPROVABLE_MERIT_TO_ENROLLED.has(s)) {
    throw new AppError(`Cannot approve to enrolled from status "${s}"`, 400);
  }

  doc.status = "enrolled" as typeof doc.status;
  doc.enrolledAt = new Date();
  doc.adminActionBy = adminUserId;
  doc.adminActionAt = new Date();
  await doc.save();
  return getInternshipEnrollmentByIdAdmin(enrollmentId);
}

export type BulkApproveMeritToEnrolledItem = {
  enrollmentId: string;
  ok: boolean;
  error?: string;
};

/**
 * Run {@link adminApproveMeritToEnrolled} for each id; collects per-row
 * errors so the client can show partial success.
 */
export async function adminBulkApproveMeritToEnrolled(
  enrollmentIds: string[],
  adminUserId: mongoose.Types.ObjectId,
): Promise<{
  results: BulkApproveMeritToEnrolledItem[];
  ok: number;
  failed: number;
}> {
  const unique = [
    ...new Set(enrollmentIds.map((id) => String(id).trim())),
  ].filter((id) => mongoose.Types.ObjectId.isValid(id));
  const results: BulkApproveMeritToEnrolledItem[] = [];
  let ok = 0;
  let failed = 0;
  for (const id of unique) {
    try {
      await adminApproveMeritToEnrolled(id, adminUserId);
      results.push({ enrollmentId: id, ok: true });
      ok += 1;
    } catch (e) {
      const msg = e instanceof AppError ? e.message : "Update failed";
      results.push({ enrollmentId: id, ok: false, error: msg });
      failed += 1;
    }
  }
  return { results, ok, failed };
}

// ─── Admin: delete enrollment (e.g. remove mistaken exam registration) ───────

export async function deleteInternshipEnrollmentAdmin(
  enrollmentId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }
  const oid = new mongoose.Types.ObjectId(enrollmentId);
  const deleted = await InternshipEnrollmentModel.findByIdAndDelete(oid);
  if (!deleted) throw new AppError("Enrollment not found", 404);
  await InternshipSubmissionModel.deleteMany({ enrollmentId: oid });
}

// ─── Admin: list cohorts that have an entrance exam (for navigation) ───────

export type EntranceExamCohortRow = {
  internshipId: string;
  internshipTitle: string;
  internshipSlug: string;
  batchId: string;
  batchName: string;
  applicationLastDate: string;
  internshipStartDate: string;
  examId: string;
  examTitle: string;
};

export async function listEntranceExamCohortsAdmin(): Promise<
  EntranceExamCohortRow[]
> {
  const internships = await InternshipModel.find({})
    .select("title slug batches isActive")
    .lean();

  type BatchLean = {
    _id: unknown;
    name?: string;
    isActive?: boolean;
    entranceExamTemplateId?: unknown;
    applicationLastDate?: Date;
    internshipStartDate?: Date;
  };

  const rows: EntranceExamCohortRow[] = [];

  for (const ins of internships) {
    if ((ins as { isActive?: boolean }).isActive === false) continue;
    const insId = String((ins as { _id: unknown })._id);
    const title = String((ins as { title?: string }).title ?? "");
    const slug = String((ins as { slug?: string }).slug ?? "");
    const batches = Array.isArray((ins as { batches?: BatchLean[] }).batches)
      ? (ins as { batches: BatchLean[] }).batches
      : [];
    for (const b of batches) {
      if (b.isActive === false) continue;
      const tid = b.entranceExamTemplateId;
      if (!tid) continue;
      const appD = b.applicationLastDate;
      const startD = b.internshipStartDate;
      rows.push({
        internshipId: insId,
        internshipTitle: title,
        internshipSlug: slug,
        batchId: String(b._id),
        batchName: String(b.name ?? "Batch"),
        applicationLastDate:
          appD instanceof Date && !Number.isNaN(appD.getTime())
            ? appD.toISOString()
            : new Date(0).toISOString(),
        internshipStartDate:
          startD instanceof Date && !Number.isNaN(startD.getTime())
            ? startD.toISOString()
            : new Date(0).toISOString(),
        examId: String(tid),
        examTitle: "",
      });
    }
  }

  const uniqueExamIds = [...new Set(rows.map((r) => r.examId))].map(
    (s) => new mongoose.Types.ObjectId(s),
  );
  const examDocs = await InternshipExamModel.find({
    _id: { $in: uniqueExamIds },
  })
    .select("title")
    .lean();
  const titleById = new Map(
    examDocs.map((e) => [
      String(e._id),
      String((e as { title?: string }).title ?? ""),
    ]),
  );
  for (const r of rows) {
    r.examTitle = titleById.get(r.examId) || "Entrance exam";
  }

  return rows.sort((a, b) => {
    const t = a.internshipTitle.localeCompare(b.internshipTitle);
    if (t !== 0) return t;
    return a.batchName.localeCompare(b.batchName);
  });
}

// ─── Learner: program detail by slug ─────────────────────────────────────────

export type LearnerTaskRow = {
  _id: string;
  title: string;
  description: string;
  taskType: "attendance" | "task";
  totalScore: number;
  scoreThreshold: number;
  unlockAfterDays: number;
  dueDays: number;
  questionCount: number;
  isUnlocked: boolean;
  isDue: boolean;
  /** ISO string: when this task becomes available. */
  visibleFrom: string;
  /** ISO string: submission deadline. */
  dueAt: string;
  /** Exists when the learner has already started or submitted this task. */
  submission?: {
    _id: string;
    status: string;
    totalAwardedScore: number;
  };
};

export type LearnerProgramDetail = {
  enrollment: {
    _id: string;
    status: string;
    enrollmentType?: string;
    enrolledAt?: string;
    internshipSuccessPoints: number;
    internshipId: string;
    batchId: string;
    internshipSnapshot?: {
      title: string;
      slug: string;
      thumbnail?: string;
    };
    batchSnapshot?: {
      batchId: string;
      name: string;
      internshipStartDate: string;
    };
  };
  tasks: LearnerTaskRow[];
};

/**
 * Returns the learner's enrolled-program detail for a given internship slug,
 * including the list of **unlocked** task templates with submission state.
 *
 * Only users with status `enrolled | completed | paused` can access this.
 */
export async function getLearnerProgramBySlug(
  userId: mongoose.Types.ObjectId,
  slug: string,
): Promise<LearnerProgramDetail> {
  const { InternshipTaskModel } = await import("../models/internshipTask.schema");
  const { InternshipSubmissionModel } = await import("../models/internshipSubmission.schema");

  // 1. Resolve internship from slug
  const internship = await InternshipModel.findOne({ slug: slug.trim() })
    .select("_id batches")
    .lean();
  if (!internship) throw new AppError("Program not found", 404);

  // 2. Find the user's most-recent enrollment for this internship
  const enrollment = await InternshipEnrollmentModel.findOne({
    user: userId,
    internship: internship._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!enrollment) {
    throw new AppError("You are not enrolled in this program", 403);
  }

  const ALLOWED_STATUSES = new Set(["enrolled", "completed", "paused"]);
  if (!ALLOWED_STATUSES.has(enrollment.status)) {
    throw new AppError(
      "Your enrollment is not yet active for this program",
      403,
    );
  }

  // 3. Get the batch's task template IDs
  const batchId = enrollment.batchSnapshot?.batchId ?? "";
  type BatchLike = { _id?: unknown; taskTemplateIds?: unknown[] };
  const batches =
    (internship as { batches?: BatchLike[] }).batches ?? [];
  const matchedBatch = batches.find((b) => String(b._id) === batchId);
  const rawTaskIds: unknown[] = Array.isArray(matchedBatch?.taskTemplateIds)
    ? matchedBatch!.taskTemplateIds
    : [];

  const taskOids = rawTaskIds
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(String(id));
      } catch {
        return null;
      }
    })
    .filter((x): x is mongoose.Types.ObjectId => x !== null);

  // 4. Compute anchor date
  const rawEnrolledAt = enrollment.enrolledAt ?? enrollment.createdAt;
  const enrolledAt =
    rawEnrolledAt instanceof Date ? rawEnrolledAt : new Date(rawEnrolledAt ?? Date.now());

  const MS_PER_DAY = 86_400_000;
  const now = Date.now();

  // 5. Fetch tasks and filter to unlocked ones
  const taskDocs =
    taskOids.length > 0
      ? await InternshipTaskModel.find({ _id: { $in: taskOids }, isActive: true })
          .select(
            "title description taskType totalScore scoreThreshold unlockAfterDays dueDays questions",
          )
          .lean()
      : [];

  const unlockedTasks: LearnerTaskRow[] = [];

  for (const task of taskDocs) {
    const unlockAfterDays =
      typeof task.unlockAfterDays === "number" ? task.unlockAfterDays : 0;
    const dueDays = typeof task.dueDays === "number" ? task.dueDays : 0;
    const visibleFrom = new Date(
      enrolledAt.getTime() + unlockAfterDays * MS_PER_DAY,
    );
    const dueAt = new Date(enrolledAt.getTime() + dueDays * MS_PER_DAY);

    if (now < visibleFrom.getTime()) continue; // locked — skip

    const sub = await InternshipSubmissionModel.findOne({
      userId,
      taskId: String(task._id),
      batchId,
    })
      .select("_id status totalAwardedScore")
      .lean();

    unlockedTasks.push({
      _id: String(task._id),
      title: String(task.title ?? ""),
      description: String(
        (task as { description?: string }).description ?? "",
      ),
      taskType:
        (task as { taskType?: string }).taskType === "attendance"
          ? "attendance"
          : "task",
      totalScore: typeof task.totalScore === "number" ? task.totalScore : 0,
      scoreThreshold:
        typeof (task as { scoreThreshold?: number }).scoreThreshold === "number"
          ? (task as { scoreThreshold: number }).scoreThreshold
          : 0,
      unlockAfterDays,
      dueDays,
      questionCount: Array.isArray(task.questions) ? task.questions.length : 0,
      isUnlocked: true,
      isDue: now >= dueAt.getTime(),
      visibleFrom: visibleFrom.toISOString(),
      dueAt: dueAt.toISOString(),
      submission: sub
        ? {
            _id: String(sub._id),
            status: String(sub.status ?? ""),
            totalAwardedScore:
              typeof sub.totalAwardedScore === "number"
                ? sub.totalAwardedScore
                : 0,
          }
        : undefined,
    });
  }

  const snap = enrollment.internshipSnapshot as
    | { title?: string; slug?: string; thumbnail?: string }
    | undefined;
  const bsnap = enrollment.batchSnapshot as
    | {
        batchId?: string;
        name?: string;
        internshipStartDate?: Date | string;
      }
    | undefined;

  return {
    enrollment: {
      _id: String(enrollment._id),
      status: enrollment.status,
      enrollmentType: enrollment.enrollmentType ?? undefined,
      enrolledAt: toIso(enrollment.enrolledAt),
      internshipSuccessPoints:
        typeof enrollment.internshipSuccessPoints === "number"
          ? enrollment.internshipSuccessPoints
          : 0,
      internshipId: String(internship._id),
      batchId,
      internshipSnapshot: snap
        ? {
            title: String(snap.title ?? ""),
            slug: String(snap.slug ?? ""),
            thumbnail:
              typeof snap.thumbnail === "string" ? snap.thumbnail : undefined,
          }
        : undefined,
      batchSnapshot: bsnap
        ? {
            batchId: String(bsnap.batchId ?? ""),
            name: String(bsnap.name ?? ""),
            internshipStartDate: toIso(bsnap.internshipStartDate) ?? "",
          }
        : undefined,
    },
    tasks: unlockedTasks,
  };
}
