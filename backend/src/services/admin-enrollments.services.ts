import { EnrollmentModel } from "../models";
import type { Brand } from "../constants/brands";

/**
 * Resolve gifter display name: live user (ObjectId or string id), else snapshot, else raw id.
 * Lookup matches whether `giftFrom` is stored as ObjectId or string.
 */
const giftFromLookupAndNameStages: any[] = [
  {
    $lookup: {
      from: "users",
      let: { gf: "$giftFrom" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $ne: ["$$gf", null] },
                {
                  $eq: [{ $toString: "$_id" }, { $toString: "$$gf" }],
                },
              ],
            },
          },
        },
        { $project: { firstName: 1, lastName: 1, email: 1 } },
      ],
      as: "giftFromUser",
    },
  },
  {
    $addFields: {
      giftFromName: {
        $cond: {
          if: { $gt: [{ $size: "$giftFromUser" }, 0] },
          then: {
            $let: {
              vars: {
                rawName: {
                  $trim: {
                    input: {
                      $concat: [
                        {
                          $ifNull: [
                            { $arrayElemAt: ["$giftFromUser.firstName", 0] },
                            "",
                          ],
                        },
                        " ",
                        {
                          $ifNull: [
                            { $arrayElemAt: ["$giftFromUser.lastName", 0] },
                            "",
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              in: {
                $cond: {
                  if: { $gt: [{ $strLenCP: "$$rawName" }, 0] },
                  then: "$$rawName",
                  else: {
                    $ifNull: [
                      { $arrayElemAt: ["$giftFromUser.email", 0] },
                      "",
                    ],
                  },
                },
              },
            },
          },
          else: {
            $ifNull: [
              "$giftFromSnapshot.displayName",
              {
                $cond: {
                  if: { $ne: ["$giftFrom", null] },
                  then: { $toString: "$giftFrom" },
                  else: "",
                },
              },
            ],
          },
        },
      },
    },
  },
];

export type EnrollmentTypeFilter = "all" | "paid" | "gift" | "trial";
export type EnrollmentStatusFilter = "all" | "active" | "revoked";

export const ADMIN_ENROLLMENT_STATUSES = ["active", "completed", "paused", "revoked"] as const;
export type AdminEnrollmentStatus = (typeof ADMIN_ENROLLMENT_STATUSES)[number];

export interface AdminEnrollmentExtraFilters {
  /** Overrides `enrollmentStatus` when non-empty. "revoked" also covers dropped. */
  statuses?: AdminEnrollmentStatus[];
  enrolledFrom?: Date;
  enrolledTo?: Date;
}

const applyExtraFilters = (
  match: Record<string, unknown>,
  enrollmentStatus: EnrollmentStatusFilter | undefined,
  extra: AdminEnrollmentExtraFilters
) => {
  if (extra.statuses?.length) {
    const raw = extra.statuses.flatMap((s) => (s === "revoked" ? ["dropped", "revoked"] : [s]));
    match.status = { $in: raw };
  } else if (enrollmentStatus === "active") {
    match.status = { $nin: ["dropped", "revoked"] };
  } else if (enrollmentStatus === "revoked") {
    match.status = { $in: ["dropped", "revoked"] };
  }
  if (extra.enrolledFrom || extra.enrolledTo) {
    const range: Record<string, Date> = {};
    if (extra.enrolledFrom) range.$gte = extra.enrolledFrom;
    if (extra.enrolledTo) range.$lte = extra.enrolledTo;
    match.enrolledAt = range;
  }
};

export interface AdminEnrollmentItem {
  _id: string;
  brand?: Brand;
  type: "paid" | "gift" | "trial";
  userId: { firstName?: string; lastName?: string; email?: string };
  courseId: { title?: string; slug?: string; thumbnail?: string };
  planType: string;
  status: string;
  date: string;
  trialExpiresAt?: string;
  giftFrom?: string;
  orderId?: string;
  txnId?: string;
  /**
   * The raw source, forwarded so the UI can tell a purchase from a free
   * allotment. `type: "paid"` only means "not gift, not trial", which lumps
   * collaboration-domain allotments (`promotion`) in with real purchases.
   */
  enrollmentSource?: string;
  /** Set on free category-sibling grants (enrollmentSource stays "direct"). */
  grantSource?: "category-sibling";
  /** The purchased course that triggered a category-sibling grant. */
  grantedFromCourse?: { title?: string; slug?: string };
}

export const getAdminEnrollmentsService = async (
  page: number,
  limit: number,
  enrollmentType: EnrollmentTypeFilter = "paid",
  search?: string,
  _paymentStatus?: string, // deprecated – kept for API compatibility, not used
  enrollmentStatus?: EnrollmentStatusFilter,
  brand?: Brand,
  extra: AdminEnrollmentExtraFilters = {}
) => {
  const skip = (page - 1) * limit;

  const buildEnrollmentMatch = (type: EnrollmentTypeFilter): Record<string, unknown> => {
    const match: Record<string, unknown> = {};
    if (brand) match.brand = brand;
    if (type === "paid") {
      // Paid = not gift or trial (includes direct, promotion, legacy)
      match.enrollmentSource = { $nin: ["gift", "trial"] };
    } else if (type === "gift") {
      match.enrollmentSource = "gift";
    } else if (type === "trial") {
      match.$or = [{ enrollmentSource: "trial" }, { isTrial: true }];
    }
    applyExtraFilters(match, enrollmentStatus, extra);
    return match;
  };

  // Reusable join stages — defined once so the search and no-search paths share
  // exactly the same lookups/projection.
  const userLookup: any = {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
      pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
    },
  };
  const unwindUser: any = {
    $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
  };
  const courseLookup: any = {
    $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "course",
      pipeline: [{ $project: { title: 1, slug: 1, thumbnail: 1 } }],
    },
  };
  const unwindCourse: any = {
    $unwind: { path: "$course", preserveNullAndEmptyArrays: true },
  };
  // Resolve the source course for free category-sibling grants. No-op (empty
  // array) for normal enrollments where grantedFromCourseId is unset.
  const grantedFromLookup: any = {
    $lookup: {
      from: "courses",
      localField: "grantedFromCourseId",
      foreignField: "_id",
      as: "grantedFromCourse",
      pipeline: [{ $project: { title: 1, slug: 1 } }],
    },
  };
  const buildSearchMatch = (raw: string): any => {
    const searchRegex = new RegExp(
      String(raw).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    return {
      $match: {
        $or: [
          { "user.firstName": searchRegex },
          { "user.lastName": searchRegex },
          { "user.email": searchRegex },
          { "course.title": searchRegex },
        ],
      },
    };
  };

  if (enrollmentType === "paid") {
    const match = buildEnrollmentMatch("paid");
    const hasSearch = !!(search && search.trim());

    // Correlated lookup for the latest successful order — only needed for the
    // rows actually returned, so it runs after $skip/$limit on both paths.
    const orderLookup: any = {
      $lookup: {
        from: "orders",
        let: { uid: "$userId", cid: "$courseId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$uid"] },
                  { $eq: ["$courseId", "$$cid"] },
                  { $eq: ["$paymentStatus", "success"] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { _id: 1, txnId: 1 } },
        ],
        as: "order",
      },
    };
    const finalProject: any = {
      $project: {
        _id: 1,
        userId: "$user",
        courseId: "$course",
        brand: 1,
        planType: 1,
        status: 1,
        date: "$enrolledAt",
        orderId: { $arrayElemAt: ["$order._id", 0] },
        txnId: { $arrayElemAt: ["$order.txnId", 0] },
        enrollmentSource: 1,
        grantSource: 1,
        grantedFromCourse: { $arrayElemAt: ["$grantedFromCourse", 0] },
      },
    };

    let enrollments: any[];
    let total: number;

    if (!hasSearch) {
      // Fast path: sort + paginate on the base collection (backed by the
      // { enrolledAt: -1 } index) BEFORE joining, so the user/course/order
      // lookups only run for the `limit` rows on the page instead of the whole
      // collection. The count is a plain countDocuments — no joins needed.
      [enrollments, total] = await Promise.all([
        EnrollmentModel.aggregate([
          { $match: match },
          { $sort: { enrolledAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          userLookup,
          unwindUser,
          courseLookup,
          unwindCourse,
          grantedFromLookup,
          orderLookup,
          finalProject,
        ]),
        EnrollmentModel.countDocuments(match),
      ]);
    } else {
      // Search filters on joined user/course fields, so the join must precede
      // the filter. The (heavier) order lookup still only runs for the page.
      const filtered: any[] = [
        { $match: match },
        userLookup,
        unwindUser,
        courseLookup,
        unwindCourse,
        buildSearchMatch(search as string),
      ];
      const [pageRows, countResult] = await Promise.all([
        EnrollmentModel.aggregate([
          ...filtered,
          { $sort: { enrolledAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          grantedFromLookup,
          orderLookup,
          finalProject,
        ]),
        EnrollmentModel.aggregate([...filtered, { $count: "total" }]),
      ]);
      enrollments = pageRows;
      total = countResult[0]?.total ?? 0;
    }

    const totalPages = Math.ceil(total / limit);

    return {
      enrollments: enrollments.map((e: any) => ({
        _id: e._id.toString(),
        type: "paid" as const,
        brand: e.brand,
        userId: e.userId,
        courseId: e.courseId,
        planType: e.planType || "essential",
        status: ["dropped", "revoked"].includes(e.status) ? "revoked" : e.status,
        date: e.date,
        orderId: e.orderId?.toString(),
        txnId: e.txnId,
        enrollmentSource: e.enrollmentSource,
        grantSource: e.grantSource,
        grantedFromCourse: e.grantedFromCourse
          ? { title: e.grantedFromCourse.title, slug: e.grantedFromCourse.slug }
          : undefined,
      })),
      total,
      totalPages,
      page,
    };
  }

  if (enrollmentType === "gift" || enrollmentType === "trial") {
    const match: Record<string, unknown> = {};
    if (brand) match.brand = brand;
    if (enrollmentType === "gift") {
      match.enrollmentSource = "gift";
    } else {
      match.$or = [{ enrollmentSource: "trial" }, { isTrial: true }];
    }
    applyExtraFilters(match, enrollmentStatus, extra);

    const hasSearch = !!(search && search.trim());
    // giftFrom display resolution is only needed for the rows actually
    // returned, so it runs after $skip/$limit (it isn't a search field).
    const giftStages =
      enrollmentType === "gift" ? giftFromLookupAndNameStages : [];
    const finalProject: any = {
      $project: {
        _id: 1,
        type: { $literal: enrollmentType },
        userId: "$user",
        courseId: "$course",
        planType: 1,
        status: 1,
        date: "$enrolledAt",
        brand: 1,
        trialExpiresAt: 1,
        giftFrom: enrollmentType === "gift" ? "$giftFromName" : "$giftFrom",
      },
    };

    let enrollments: any[];
    let total: number;

    if (!hasSearch) {
      [enrollments, total] = await Promise.all([
        EnrollmentModel.aggregate([
          { $match: match },
          { $sort: { enrolledAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          userLookup,
          unwindUser,
          courseLookup,
          unwindCourse,
          ...giftStages,
          finalProject,
        ]),
        EnrollmentModel.countDocuments(match),
      ]);
    } else {
      const filtered: any[] = [
        { $match: match },
        userLookup,
        unwindUser,
        courseLookup,
        unwindCourse,
        buildSearchMatch(search as string),
      ];
      const [pageRows, countResult] = await Promise.all([
        EnrollmentModel.aggregate([
          ...filtered,
          { $sort: { enrolledAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          ...giftStages,
          finalProject,
        ]),
        EnrollmentModel.aggregate([...filtered, { $count: "total" }]),
      ]);
      enrollments = pageRows;
      total = countResult[0]?.total ?? 0;
    }

    const totalPages = Math.ceil(total / limit);

    return {
      enrollments: enrollments.map((e: any) => ({
        _id: e._id.toString(),
        type: enrollmentType,
        brand: e.brand,
        userId: e.userId,
        courseId: e.courseId,
        planType: e.planType || "essential",
        status: ["dropped", "revoked"].includes(e.status) ? "revoked" : e.status,
        date: e.date,
        trialExpiresAt: e.trialExpiresAt,
        giftFrom: e.giftFrom,
      })),
      total,
      totalPages,
      page,
    };
  }

  // enrollmentType === "all" — every enrollment, typed per row. Uses the same
  // fast pattern as the single-type paths: paginate on the base collection,
  // join only the page, and get the true total from a plain countDocuments
  // (the old version capped each type at 500 and reported the merged length,
  // so "All" could read *lower* than a single type).
  const allMatch: Record<string, unknown> = {};
  if (brand) allMatch.brand = brand;
  applyExtraFilters(allMatch, enrollmentStatus, extra);

  const hasSearch = !!(search && search.trim());

  // Classify each enrollment by its own fields so it appears exactly once.
  const typeField: any = {
    $addFields: {
      type: {
        $cond: [
          { $eq: ["$enrollmentSource", "gift"] },
          "gift",
          {
            $cond: [
              {
                $or: [
                  { $eq: ["$enrollmentSource", "trial"] },
                  { $eq: ["$isTrial", true] },
                ],
              },
              "trial",
              "paid",
            ],
          },
        ],
      },
    },
  };
  const orderLookup: any = {
    $lookup: {
      from: "orders",
      let: { uid: "$userId", cid: "$courseId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$userId", "$$uid"] },
                { $eq: ["$courseId", "$$cid"] },
                { $eq: ["$paymentStatus", "success"] },
              ],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        { $project: { _id: 1, txnId: 1 } },
      ],
      as: "order",
    },
  };
  const allProject: any = {
    $project: {
      _id: 1,
      type: 1,
      userId: "$user",
      courseId: "$course",
      planType: 1,
      status: 1,
      date: "$enrolledAt",
      brand: 1,
      trialExpiresAt: 1,
      giftFrom: "$giftFromName",
      orderId: { $arrayElemAt: ["$order._id", 0] },
      txnId: { $arrayElemAt: ["$order.txnId", 0] },
      enrollmentSource: 1,
      grantSource: 1,
      grantedFromCourse: { $arrayElemAt: ["$grantedFromCourse", 0] },
    },
  };

  let allRows: any[];
  let allTotal: number;

  if (!hasSearch) {
    [allRows, allTotal] = await Promise.all([
      EnrollmentModel.aggregate([
        { $match: allMatch },
        { $sort: { enrolledAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        userLookup,
        unwindUser,
        courseLookup,
        unwindCourse,
        typeField,
        ...giftFromLookupAndNameStages,
        grantedFromLookup,
        orderLookup,
        allProject,
      ]),
      EnrollmentModel.countDocuments(allMatch),
    ]);
  } else {
    const filtered: any[] = [
      { $match: allMatch },
      userLookup,
      unwindUser,
      courseLookup,
      unwindCourse,
      buildSearchMatch(search as string),
    ];
    const [pageRows, countResult] = await Promise.all([
      EnrollmentModel.aggregate([
        ...filtered,
        { $sort: { enrolledAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        typeField,
        ...giftFromLookupAndNameStages,
        grantedFromLookup,
        orderLookup,
        allProject,
      ]),
      EnrollmentModel.aggregate([...filtered, { $count: "total" }]),
    ]);
    allRows = pageRows;
    allTotal = countResult[0]?.total ?? 0;
  }

  const totalPages = Math.ceil(allTotal / limit);

  return {
    enrollments: allRows.map((e: any) => {
      const base = {
        _id: e._id.toString(),
        type: e.type as "paid" | "gift" | "trial",
        brand: e.brand,
        userId: e.userId,
        courseId: e.courseId,
        planType: e.planType || "essential",
        status: ["dropped", "revoked"].includes(e.status) ? "revoked" : e.status,
        date: e.date,
      };
      if (e.type === "gift") return { ...base, giftFrom: e.giftFrom };
      if (e.type === "trial")
        return { ...base, trialExpiresAt: e.trialExpiresAt };
      return {
        ...base,
        orderId: e.orderId?.toString(),
        txnId: e.txnId,
        enrollmentSource: e.enrollmentSource,
        grantSource: e.grantSource,
        grantedFromCourse: e.grantedFromCourse
          ? { title: e.grantedFromCourse.title, slug: e.grantedFromCourse.slug }
          : undefined,
      };
    }),
    total: allTotal,
    totalPages,
    page,
  };
};
