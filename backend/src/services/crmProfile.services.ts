import mongoose from "mongoose";
import { UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { generateCrmCode } from "../lib/crmCode";
import { isRolePageGated } from "../config/adminPermissions";
import type { CrmExtraQuestion } from "../types/user";

export type AmbassadorKind = "marketing" | "sales";

export type CrmRole =
  | "marketer"
  | "sales"
  | "marketing-intern"
  | "sales-intern"
  /** A campus ambassador attached before the two intern kinds existed. */
  | "ambassador";

export const AMBASSADOR_KINDS: readonly AmbassadorKind[] = [
  "marketing",
  "sales",
];

export const AMBASSADOR_ROLE: Record<AmbassadorKind, CrmRole> = {
  marketing: "marketing-intern",
  sales: "sales-intern",
};

const CODE_MAX_RETRIES = 6;

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
  const kind = AMBASSADOR_KINDS.find((k) => k === ambassadorKind);
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
export const ensureCrmCode = async (
  userId: mongoose.Types.ObjectId,
): Promise<string> => {
  const existing = await UserModel.findById(userId, { crmCode: 1 }).lean();
  if (!existing) throw new AppError("User not found", 404);
  if (existing.crmCode) return existing.crmCode;

  for (let attempt = 0; attempt < CODE_MAX_RETRIES; attempt++) {
    const code = generateCrmCode();
    try {
      const updated = await UserModel.findOneAndUpdate(
        { _id: userId, crmCode: { $exists: false } },
        { $set: { crmCode: code, crmCodeActive: true } },
        { new: true, projection: { crmCode: 1 } },
      ).lean();
      if (updated?.crmCode) return updated.crmCode;

      // Matched nothing: a concurrent call already minted one. Read it back.
      const raced = await UserModel.findById(userId, { crmCode: 1 }).lean();
      if (raced?.crmCode) return raced.crmCode;
    } catch (err: unknown) {
      const e = err as { code?: number };
      // 11000 here can only be the partial unique index on crmCode, so the fix
      // is a fresh code, not a re-read.
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
  question: CrmExtraQuestion | null;
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

  const owner = await UserModel.findOne(
    { crmCode: normalized, crmCodeActive: true },
    {
      crmCode: 1,
      userType: 1,
      crmParentUserId: 1,
      firstName: 1,
      lastName: 1,
      crmExtraQuestion: 1,
      crmAmbassadorKind: 1,
    },
  ).lean();
  if (!owner) return null;

  const role = crmRoleOf(owner.userType, true, owner.crmAmbassadorKind);
  if (!role) return null;

  return {
    userId: String(owner._id),
    code: owner.crmCode as string,
    role,
    parentUserId: owner.crmParentUserId ? String(owner.crmParentUserId) : null,
    name:
      [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim() || "",
    // Only a marketer or sales person can own one; an ambassador shares the
    // form as-is.
    question: owner.crmExtraQuestion?.enabled
      ? (owner.crmExtraQuestion as CrmExtraQuestion)
      : null,
  };
};

/**
 * Attaches an existing student as an ambassador under `ownerId`, minting their
 * code. The student must already have an account, so recruiting is "sign up,
 * then give me your email".
 */
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
    throw new AppError("Choose whether they are a marketing or sales intern", 400);
  }

  const student = await UserModel.findOne(
    { email },
    { userType: 1, crmParentUserId: 1, crmCode: 1, firstName: 1, lastName: 1 },
  ).lean();
  if (!student) throw new AppError("No user found with this email", 404);
  if (student.userType !== "student") {
    throw new AppError("Only a student can be a campus ambassador", 400);
  }
  if (
    student.crmParentUserId &&
    String(student.crmParentUserId) !== String(ownerId)
  ) {
    throw new AppError(
      "This student is already an ambassador under someone else",
      409,
    );
  }

  await UserModel.updateOne(
    { _id: student._id },
    {
      $set: {
        crmParentUserId: ownerId,
        crmCodeActive: true,
        crmAmbassadorKind: cleanKind,
      },
    },
  );
  const code = await ensureCrmCode(
    student._id as unknown as mongoose.Types.ObjectId,
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
  const res = await UserModel.updateOne(
    { _id: ambassadorId, crmParentUserId: ownerId },
    { $set: { crmCodeActive: false }, $unset: { crmParentUserId: "" } },
  );
  if (res.matchedCount === 0) {
    throw new AppError("Ambassador not found on your roster", 404);
  }
};

export const listAmbassadors = async (
  ownerId: mongoose.Types.ObjectId,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;
  const filter = { crmParentUserId: ownerId };

  const [rows, total] = await Promise.all([
    UserModel.find(filter, {
      firstName: 1,
      lastName: 1,
      email: 1,
      crmCode: 1,
      crmCodeActive: 1,
      crmAmbassadorKind: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  return {
    ambassadors: rows.map((r) => ({
      userId: String(r._id),
      name: [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || "",
      email: r.email,
      code: r.crmCode ?? null,
      kind: r.crmAmbassadorKind ?? null,
      active: r.crmCodeActive !== false,
    })),
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
  const res = await UserModel.updateMany(
    { crmParentUserId: ownerId },
    { $set: { crmCodeActive: false }, $unset: { crmParentUserId: "" } },
  );
  return res.modifiedCount;
};
