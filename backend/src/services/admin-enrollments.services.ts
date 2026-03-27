import { EnrollmentModel } from "../models";

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

export interface AdminEnrollmentItem {
  _id: string;
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
}

export const getAdminEnrollmentsService = async (
  page: number,
  limit: number,
  enrollmentType: EnrollmentTypeFilter = "paid",
  search?: string,
  _paymentStatus?: string, // deprecated – kept for API compatibility, not used
  enrollmentStatus?: EnrollmentStatusFilter
) => {
  const skip = (page - 1) * limit;

  const buildEnrollmentMatch = (type: EnrollmentTypeFilter): Record<string, unknown> => {
    const match: Record<string, unknown> = {};
    if (type === "paid") {
      // Paid = not gift or trial (includes direct, promotion, legacy)
      match.enrollmentSource = { $nin: ["gift", "trial"] };
    } else if (type === "gift") {
      match.enrollmentSource = "gift";
    } else if (type === "trial") {
      match.$or = [{ enrollmentSource: "trial" }, { isTrial: true }];
    }
    if (enrollmentStatus === "active") {
      match.status = { $nin: ["dropped", "revoked"] };
    } else if (enrollmentStatus === "revoked") {
      match.status = { $in: ["dropped", "revoked"] };
    }
    return match;
  };

  if (enrollmentType === "paid") {
    const match = buildEnrollmentMatch("paid");
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
          pipeline: [{ $project: { title: 1, slug: 1, thumbnail: 1 } }],
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      {
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
      },
    ];

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      pipeline.push({
        $match: {
          $or: [
            { "user.firstName": searchRegex },
            { "user.lastName": searchRegex },
            { "user.email": searchRegex },
            { "course.title": searchRegex },
          ],
        },
      });
    }

    const [enrollments, countResult] = await Promise.all([
      EnrollmentModel.aggregate([
        ...pipeline,
        { $sort: { enrolledAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            userId: "$user",
            courseId: "$course",
            planType: 1,
            status: 1,
            date: "$enrolledAt",
            orderId: { $arrayElemAt: ["$order._id", 0] },
            txnId: { $arrayElemAt: ["$order.txnId", 0] },
          },
        },
      ]),
      EnrollmentModel.aggregate([...pipeline, { $count: "total" }]),
    ]);

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      enrollments: enrollments.map((e: any) => ({
        _id: e._id.toString(),
        type: "paid" as const,
        userId: e.userId,
        courseId: e.courseId,
        planType: e.planType || "essential",
        status: ["dropped", "revoked"].includes(e.status) ? "revoked" : e.status,
        date: e.date,
        orderId: e.orderId?.toString(),
        txnId: e.txnId,
      })),
      total,
      totalPages,
      page,
    };
  }

  if (enrollmentType === "gift" || enrollmentType === "trial") {
    const match: Record<string, unknown> = {};
    if (enrollmentType === "gift") {
      match.enrollmentSource = "gift";
    } else {
      match.$or = [
        { enrollmentSource: "trial" },
        { isTrial: true },
      ];
    }
    if (enrollmentStatus === "active") {
      match.status = { $nin: ["dropped", "revoked"] };
    } else if (enrollmentStatus === "revoked") {
      match.status = { $in: ["dropped", "revoked"] };
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      ...(enrollmentType === "gift" ? giftFromLookupAndNameStages : []),
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
          pipeline: [{ $project: { title: 1, slug: 1, thumbnail: 1 } }],
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    ];

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      pipeline.push({
        $match: {
          $or: [
            { "user.firstName": searchRegex },
            { "user.lastName": searchRegex },
            { "user.email": searchRegex },
            { "course.title": searchRegex },
          ],
        },
      });
    }

    const [enrollments, countResult] = await Promise.all([
      EnrollmentModel.aggregate([
        ...pipeline,
        { $sort: { enrolledAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            type: { $literal: enrollmentType },
            userId: "$user",
            courseId: "$course",
            planType: 1,
            status: 1,
            date: "$enrolledAt",
            trialExpiresAt: 1,
            giftFrom: enrollmentType === "gift" ? "$giftFromName" : "$giftFrom",
          },
        },
      ]),
      EnrollmentModel.aggregate([...pipeline, { $count: "total" }]),
    ]);

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      enrollments: enrollments.map((e) => ({
        _id: e._id.toString(),
        type: enrollmentType,
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

  // enrollmentType === "all" - merge paid (from enrollments), gift, trial
  const paidMatch = buildEnrollmentMatch("paid");
  const paidPipeline: any[] = [
    { $match: paidMatch },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
        pipeline: [{ $project: { title: 1, slug: 1, thumbnail: 1 } }],
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    {
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
    },
  ];
  if (search && search.trim()) {
    const searchRegex = new RegExp(
      String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    paidPipeline.push({
      $match: {
        $or: [
          { "user.firstName": searchRegex },
          { "user.lastName": searchRegex },
          { "user.email": searchRegex },
          { "course.title": searchRegex },
        ],
      },
    });
  }

  const [paidEnrollments, giftEnrollments, trialEnrollments] = await Promise.all([
    EnrollmentModel.aggregate([
      ...paidPipeline,
      { $sort: { enrolledAt: -1 } },
      { $limit: 500 },
      {
        $project: {
          _id: 1,
          userId: "$user",
          courseId: "$course",
          planType: 1,
          status: 1,
          enrolledAt: 1,
          orderId: { $arrayElemAt: ["$order._id", 0] },
          txnId: { $arrayElemAt: ["$order.txnId", 0] },
        },
      },
    ]),
    enrollmentType === "all"
      ? EnrollmentModel.aggregate([
          {
            $match: {
              enrollmentSource: "gift",
              ...(enrollmentStatus === "active" && { status: { $nin: ["dropped", "revoked"] } }),
              ...(enrollmentStatus === "revoked" && { status: { $in: ["dropped", "revoked"] } }),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
              pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "courses",
              localField: "courseId",
              foreignField: "_id",
              as: "course",
              pipeline: [{ $project: { title: 1, slug: 1, thumbnail: 1 } }],
            },
          },
          { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
          ...giftFromLookupAndNameStages,
          ...(search && search.trim()
            ? [
                {
                  $match: {
                    $or: [
                      {
                        "user.firstName": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                      {
                        "user.lastName": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                      {
                        "user.email": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                      {
                        "course.title": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                    ],
                  },
                },
              ]
            : []),
          { $sort: { enrolledAt: -1 } },
          { $limit: 500 },
        ])
      : [],
    enrollmentType === "all"
      ? EnrollmentModel.aggregate([
          {
            $match: {
              $or: [{ enrollmentSource: "trial" }, { isTrial: true }],
              ...(enrollmentStatus === "active" && { status: { $nin: ["dropped", "revoked"] } }),
              ...(enrollmentStatus === "revoked" && { status: { $in: ["dropped", "revoked"] } }),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
              pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "courses",
              localField: "courseId",
              foreignField: "_id",
              as: "course",
              pipeline: [{ $project: { title: 1, slug: 1, thumbnail: 1 } }],
            },
          },
          { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
          ...(search && search.trim()
            ? [
                {
                  $match: {
                    $or: [
                      {
                        "user.firstName": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                      {
                        "user.lastName": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                      {
                        "user.email": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                      {
                        "course.title": new RegExp(
                          String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                          "i"
                        ),
                      },
                    ],
                  },
                },
              ]
            : []),
          { $sort: { enrolledAt: -1 } },
          { $limit: 500 },
        ])
      : [],
  ]);

  const paidItems = (paidEnrollments as any[]).map((e) => ({
    _id: e._id.toString(),
    type: "paid" as const,
    userId: e.userId,
    courseId: e.courseId,
    planType: e.planType || "essential",
    status: ["dropped", "revoked"].includes(e.status) ? "revoked" : e.status,
    date: e.enrolledAt,
    orderId: e.orderId?.toString(),
    txnId: e.txnId,
  }));

  const giftItems = giftEnrollments.map((e: any) => ({
    _id: e._id.toString(),
    type: "gift" as const,
    userId: e.user,
    courseId: e.course,
    planType: e.planType || "essential",
    status: ["dropped", "revoked"].includes(e.status) ? "revoked" : e.status,
    date: e.enrolledAt,
    giftFrom: e.giftFromName ?? e.giftFrom,
  }));

  const trialItems = trialEnrollments.map((e: any) => ({
    _id: e._id.toString(),
    type: "trial" as const,
    userId: e.user,
    courseId: e.course,
    planType: e.planType || "essential",
    status: ["dropped", "revoked"].includes(e.status) ? "revoked" : e.status,
    date: e.enrolledAt,
    trialExpiresAt: e.trialExpiresAt,
  }));

  const merged = [
    ...paidItems.map((x) => ({ ...x, _sortDate: new Date(x.date).getTime() })),
    ...giftItems.map((x) => ({ ...x, _sortDate: new Date(x.date).getTime() })),
    ...trialItems.map((x) => ({ ...x, _sortDate: new Date(x.date).getTime() })),
  ].sort((a, b) => (b._sortDate ?? 0) - (a._sortDate ?? 0));

  const total = merged.length;
  const totalPages = Math.ceil(total / limit);
  const paged = merged.slice(skip, skip + limit).map(({ _sortDate, ...rest }) => rest);

  return {
    enrollments: paged,
    total,
    totalPages,
    page,
  };
};
