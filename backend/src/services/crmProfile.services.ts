import mongoose from "mongoose";
import { CaApplicationModel, CrmProfileModel, UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { generateCrmCode } from "../lib/crmCode";
import { isRolePageGated } from "../config/adminPermissions";
import type {
  AmbassadorKind,
  CrmExtraQuestion,
  CrmProfile,
} from "../types/crm";

export type { AmbassadorKind };

export type CrmRole =
  | "marketer"
  | "sales"
  | "marketing-intern"
  | "social-media-intern"
  /** A campus ambassador attached before the two intern kinds existed. */
  | "ambassador";

export const AMBASSADOR_KINDS: readonly AmbassadorKind[] = [
  "marketing",
  "social-media",
];

export const AMBASSADOR_ROLE: Record<AmbassadorKind, CrmRole> = {
  marketing: "marketing-intern",
  "social-media": "social-media-intern",
};

/** Narrows any stored value to a live kind, or null for a retired one like "sales". */
export const toAmbassadorKind = (value: unknown): AmbassadorKind | null =>
  AMBASSADOR_KINDS.find((k) => k === value) ?? null;

const CODE_MAX_RETRIES = 6;

/**
 * A lead form with more than two custom questions stops being a lead form.
 * Shared by the owner's own set and an ambassador's.
 */
export const MAX_EXTRA_QUESTIONS = 2;

/**
 * The CRM role is derived, never stored: a stored copy could drift out of sync
 * with `userType`, and there would be no way to tell which one was wrong.
 */
export const crmRoleOf = (
  userType: string | undefined,
  hasCode: boolean,
  ambassadorKind?: string,
): CrmRole | null => {
  if (!hasCode) return null;
  if (userType === "marketer") return "marketer";
  if (userType === "sales") return "sales";
  if (userType !== "student") return null;
  // A student attached before the split has no kind, so it stays "ambassador"
  // rather than being silently reported as one of the two.
  const kind = toAmbassadorKind(ambassadorKind);
  return kind ? AMBASSADOR_ROLE[kind] : "ambassador";
};

/** Staff who recruit ambassadors. `isRolePageGated` is the same pair. */
export const canOwnAmbassadors = (userType: string | undefined): boolean =>
  isRolePageGated(userType);

/** Ambassadors share a form, they never reshape it. */
export const canSetExtraQuestion = (userType: string | undefined): boolean =>
  isRolePageGated(userType);

/**
 * Returns the user's code, minting one on first call.
 *
 * The write is a single conditional update rather than read-then-write: two
 * concurrent first-visits would otherwise both see "no code" and the second
 * would overwrite the first, invalidating a link that had already been shared.
 */
/**
 * The profile document, created on demand. Mints no code: a marketer may hold
 * a question without one, and `PATCH /crm/me/question` must not start minting
 * codes as a side effect.
 */
export const ensureCrmProfile = async (
  userId: mongoose.Types.ObjectId,
): Promise<CrmProfile> => {
  const profile = await CrmProfileModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  if (!profile) throw new AppError("Could not open a CRM profile", 500);
  return profile as CrmProfile;
};

/**
 * The member's referral code, minting one on first need.
 *
 * The `code: null` guard on the update is what makes concurrent promotion safe:
 * only one caller can move a profile from codeless to coded. A duplicate key
 * can only be the unique index on `code`, so the fix is a fresh code, not a
 * re-read.
 */
export const ensureCrmCode = async (
  userId: mongoose.Types.ObjectId,
): Promise<string> => {
  const existing = await CrmProfileModel.findOne({ userId }, { code: 1 }).lean();
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < CODE_MAX_RETRIES; attempt++) {
    const code = generateCrmCode();
    try {
      const updated = await CrmProfileModel.findOneAndUpdate(
        { userId, code: null },
        { $set: { code, codeActive: true }, $setOnInsert: { userId } },
        { new: true, upsert: true, projection: { code: 1 } },
      ).lean();
      if (updated?.code) return updated.code;

      // Matched nothing: a concurrent call already minted one. Read it back.
      const raced = await CrmProfileModel.findOne(
        { userId },
        { code: 1 },
      ).lean();
      if (raced?.code) return raced.code;
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code === 11000) continue;
      throw err;
    }
  }
  throw new AppError("Failed to generate a unique code, please retry.", 500);
};

export interface ResolvedCrmCode {
  userId: string;
  code: string;
  role: CrmRole;
  parentUserId: string | null;
  name: string;
  /** Enabled questions only, in form order. Empty when there are none. */
  questions: CrmExtraQuestion[];
  /** Whether the enquiry page should render plan prices for this link. */
  hidePlanPrices: boolean;
  /**
   * The scholarship campaign this link advertises, or null. Still just a
   * pointer: whether it is live, and so whether anything renders, is settled by
   * the enquiry page's own resolver.
   */
  scholarshipTestId: string | null;
}

/**
 * Resolves a shared link's code back to its owner. Returns null for an unknown,
 * retired, or deactivated code: the caller renders the page and captures the
 * lead unattributed rather than 404ing, because losing a lead is worse than
 * losing its attribution.
 */
export const resolveCrmCode = async (
  code: string,
): Promise<ResolvedCrmCode | null> => {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase();
  if (!normalized) return null;

  const profile = await CrmProfileModel.findOne(
    { code: normalized, codeActive: true },
    {
      userId: 1,
      code: 1,
      parentUserId: 1,
      ambassadorKind: 1,
      extraQuestions: 1,
      hidePlanPrices: 1,
      scholarshipTestId: 1,
    },
  ).lean();
  if (!profile) return null;

  // The role and the display name are identity, so this needs both documents.
  const owner = await UserModel.findById(profile.userId, {
    userType: 1,
    firstName: 1,
    lastName: 1,
  }).lean();
  if (!owner) return null;

  const role = crmRoleOf(owner.userType, true, profile.ambassadorKind);
  if (!role) return null;

  const enabled = (list: CrmExtraQuestion[] | undefined) =>
    (list ?? []).filter((q) => q?.enabled).slice(0, MAX_EXTRA_QUESTIONS);

  // A campus ambassador decides neither of these: their marketer does. Read at
  // resolve time rather than copied onto the roster, so re-homing an ambassador
  // switches them to the new owner's settings with no fan-out and nothing to
  // drift. One extra lookup, and only for an ambassador's link.
  let hidePlanPrices = Boolean(profile.hidePlanPrices);
  let scholarshipTestId = profile.scholarshipTestId
    ? String(profile.scholarshipTestId)
    : null;
  let questions = enabled(profile.extraQuestions as CrmExtraQuestion[]);

  if (profile.parentUserId) {
    const parent = await CrmProfileModel.findOne(
      { userId: profile.parentUserId },
      {
        hideAmbassadorPlanPrices: 1,
        ambassadorScholarshipTestId: 1,
        allowAmbassadorQuestions: 1,
        extraQuestions: 1,
      },
    ).lean();
    // The owner's ambassador setting, not their own: a marketer may keep prices
    // on their personal link while their roster sends an unpriced page.
    hidePlanPrices = Boolean(parent?.hideAmbassadorPlanPrices);
    // Same split for the campaign, and an ambassador has none of their own to
    // fall back to: they cannot create one.
    scholarshipTestId = parent?.ambassadorScholarshipTestId
      ? String(parent.ambassadorScholarshipTestId)
      : null;

    // Ambassadors never set questions; their owner's apply to the whole roster.
    questions = enabled(parent?.extraQuestions as CrmExtraQuestion[]);
  }

  return {
    userId: String(profile.userId),
    code: profile.code as string,
    role,
    parentUserId: profile.parentUserId ? String(profile.parentUserId) : null,
    name:
      [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim() || "",
    questions,
    hidePlanPrices,
    scholarshipTestId,
  };
};

/**
 * Puts one student on an owner's roster. Mints the code first so they are never
 * on a roster without a link to share.
 */
export const attachStudentToOwner = async (
  ownerId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId,
  kind: AmbassadorKind,
): Promise<string> => {
  const otherOwner = () =>
    new AppError(
      "This student is already an ambassador under someone else",
      409,
      "CA_OTHER_OWNER",
    );
  const existing = await CrmProfileModel.findOne(
    { userId: studentId },
    { parentUserId: 1 },
  ).lean();
  if (existing?.parentUserId && String(existing.parentUserId) !== String(ownerId)) {
    throw otherOwner();
  }

  // `ensureCrmCode` upserts the profile, so a no-match here can only mean a
  // concurrent attach to another owner won since the read above.
  const code = await ensureCrmCode(studentId);
  const res = await CrmProfileModel.updateOne(
    { userId: studentId, parentUserId: { $in: [null, ownerId] } },
    { $set: { parentUserId: ownerId, codeActive: true, ambassadorKind: kind } },
  );
  if (res.matchedCount === 0) throw otherOwner();

  // A CA application's `ownerUserId` mirrors the roster relationship, so hold
  // rights and the team listing (both keyed on it) follow whoever currently
  // owns the ambassador rather than whoever approved the application. A no-op
  // unless this student already has an attached application.
  const owner = await UserModel.findById(ownerId, { firstName: 1, lastName: 1 }).lean();
  await CaApplicationModel.updateOne(
    { userId: studentId, status: "attached" },
    {
      $set: {
        ownerUserId: ownerId,
        ownerName: [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim(),
      },
    },
  );
  return code;
};

export const attachAmbassador = async (
  ownerId: mongoose.Types.ObjectId,
  studentEmail: string,
  kind: string,
) => {
  const email = String(studentEmail ?? "")
    .trim()
    .toLowerCase();
  if (!email) throw new AppError("An email is required", 400);

  const cleanKind = AMBASSADOR_KINDS.find((k) => k === kind);
  if (!cleanKind) {
    throw new AppError(
      "Choose whether they are a marketing or social media marketing intern",
      400,
    );
  }

  // The student check and the display name are identity concerns, so they stay
  // on User; the roster relationship lives on the profile.
  const student = await UserModel.findOne(
    { email },
    { userType: 1, firstName: 1, lastName: 1 },
  ).lean();
  if (!student) throw new AppError("No user found with this email", 404);
  if (student.userType !== "student") {
    throw new AppError("Only a student can be a campus ambassador", 400);
  }

  const code = await attachStudentToOwner(
    ownerId,
    student._id as unknown as mongoose.Types.ObjectId,
    cleanKind,
  );

  return {
    userId: String(student._id),
    email,
    name:
      [student.firstName, student.lastName].filter(Boolean).join(" ").trim() ||
      "",
    code,
    kind: cleanKind,
  };
};

/**
 * Removes an ambassador from this owner's roster. The code is deactivated, not
 * erased, so re-homing them later restores the same link instead of
 * invalidating whatever they already shared. Their leads are untouched.
 */
export const detachAmbassador = async (
  ownerId: mongoose.Types.ObjectId,
  ambassadorId: string,
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(ambassadorId)) {
    throw new AppError("Invalid ambassador id", 400);
  }
  const res = await CrmProfileModel.updateOne(
    { userId: ambassadorId, parentUserId: ownerId },
    { $set: { codeActive: false, parentUserId: null } },
  );
  if (res.matchedCount === 0) {
    throw new AppError("Ambassador not found on your roster", 404);
  }

  // Mirrors the roster removal: an ex-owner keeps neither hold rights nor a
  // team-listing row for a CA they no longer manage.
  await CaApplicationModel.updateOne(
    { userId: ambassadorId, status: "attached", ownerUserId: ownerId },
    { $set: { ownerUserId: null, ownerName: "" } },
  );
};

export const listAmbassadors = async (
  ownerId: mongoose.Types.ObjectId,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;
  const filter = { parentUserId: ownerId };

  // Paginate on the profile, which owns the filter and the sort, then fetch the
  // page's identities by id. Two indexed queries, same rows out.
  const [rows, total] = await Promise.all([
    CrmProfileModel.find(filter, {
      userId: 1,
      code: 1,
      codeActive: 1,
      ambassadorKind: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CrmProfileModel.countDocuments(filter),
  ]);

  const owners = await UserModel.find(
    { _id: { $in: rows.map((r) => r.userId) } },
    { firstName: 1, lastName: 1, email: 1 },
  ).lean();
  const byId = new Map(owners.map((u) => [String(u._id), u]));

  return {
    ambassadors: rows.map((r) => {
      const u = byId.get(String(r.userId));
      return {
        userId: String(r.userId),
        name: [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || "",
        email: u?.email ?? "",
        code: r.code ?? null,
        kind: toAmbassadorKind(r.ambassadorKind),
        active: r.codeActive !== false,
      };
    }),
    total,
    page,
    totalPages: Math.max(0, Math.ceil(total / limit)),
  };
};

/**
 * Called when a marketer or sales person is deleted. Their ambassadors are
 * demoted, never blocked and never deleted: the code is kept so an admin can
 * re-home them and restore the same link, and their leads stay exactly as they
 * are, including the snapshot naming the deleted owner.
 */
export const demoteAmbassadorsOf = async (
  ownerId: mongoose.Types.ObjectId,
): Promise<number> => {
  const res = await CrmProfileModel.updateMany(
    { parentUserId: ownerId },
    { $set: { codeActive: false, parentUserId: null } },
  );
  // Same rule as a single detach, applied to the whole roster at once: none of
  // them keep a hold-rights or team-listing link to the departed owner.
  await CaApplicationModel.updateMany(
    { ownerUserId: ownerId, status: "attached" },
    { $set: { ownerUserId: null, ownerName: "" } },
  );
  return res.modifiedCount;
};

/**
 * Retires a departing user's CRM footprint.
 *
 * Their ambassadors are demoted, never deleted: the code is kept so an admin
 * can re-home them and restore the same link, and their leads stay exactly as
 * they are, including the snapshot naming the deleted owner.
 *
 * Their own profile is deleted, which the embedded fields got for free. A
 * profile left behind holds a unique code that would stay reserved forever.
 */
export const retireCrmForDeletedUser = async (
  userId: mongoose.Types.ObjectId,
): Promise<void> => {
  await demoteAmbassadorsOf(userId);
  await CrmProfileModel.deleteOne({ userId });
};
