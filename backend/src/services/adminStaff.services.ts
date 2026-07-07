/**
 * Super-admin-only staff (admin account) management.
 *
 */
import bcrypt from "bcryptjs";
import { UserModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { validatePassword } from "../utils/passwordValidation";
import { isValidPermissionKey } from "../config/adminPermissions";

/** Fields never returned to the client. */
const SAFE_PROJECTION = "-password -refreshTokens -__v -successPointsHistory";

/** Validate + dedupe a permission-key array against the catalog. */
const sanitizePermissions = (permissions: unknown): string[] => {
  if (!Array.isArray(permissions)) {
    throw new AppError("permissions must be an array of keys", 400);
  }
  const cleaned = Array.from(new Set(permissions.map((p) => String(p))));
  const invalid = cleaned.filter((k) => !isValidPermissionKey(k));
  if (invalid.length > 0) {
    throw new AppError(
      `Invalid permission key(s): ${invalid.join(", ")}`,
      400,
    );
  }
  return cleaned;
};

const normalizeEmail = (email?: string): string => {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) throw new AppError("Email is required", 400);
  return normalized;
};

/**
 * List all admins and super-admins, paginated (super-admins shown read-only on
 * the UI). Runs the page query and the total count in parallel; the count is a
 * plain countDocuments so it stays cheap regardless of page size.
 */
export const listAdminsService = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const filter = { userType: { $in: ["admin", "super-admin"] } };

  const [admins, total] = await Promise.all([
    UserModel.find(filter)
      .select(SAFE_PROJECTION)
      .sort({ userType: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  return {
    admins,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
};

export interface CreateAdminInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  permissions?: unknown;
}

/** Create a brand-new admin account with the given page permissions. */
export const createAdminService = async (data: CreateAdminInput) => {
  const email = normalizeEmail(data.email);
  if (!data.password) throw new AppError("Password is required", 400);
  validatePassword(data.password);
  const permissions = sanitizePermissions(data.permissions ?? []);

  const existing = await UserModel.findOne({ email }).select("_id").lean();
  if (existing) {
    throw new AppError("A user with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const admin = await UserModel.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email,
    password: hashedPassword,
    phone: data.phone,
    userType: "admin",
    provider: "credentials",
    permissions,
    status: "active",
  });

  const { password: _password, ...safe } = admin.toObject();
  return safe;
};

/** Promote an existing (non-admin) user to admin with the given permissions. */
export const promoteUserToAdminService = async (
  email: string,
  permissions: unknown,
) => {
  const normalized = normalizeEmail(email);
  const perms = sanitizePermissions(permissions ?? []);

  const target = await UserModel.findOne({ email: normalized })
    .select("_id userType")
    .lean();
  if (!target) throw new AppError("No user found with this email", 404);
  if (target.userType === "super-admin") {
    throw new AppError("A super-admin cannot be modified here", 403);
  }
  if (target.userType === "admin") {
    throw new AppError("This user is already an admin", 409);
  }

  const updated = await UserModel.findByIdAndUpdate(
    target._id,
    { $set: { userType: "admin", permissions: perms } },
    { new: true, overwriteDiscriminatorKey: true, runValidators: true },
  ).select(SAFE_PROJECTION);

  return updated;
};

/** Replace an admin's page permissions. */
export const updateAdminPermissionsService = async (
  adminId: string,
  permissions: unknown,
) => {
  const perms = sanitizePermissions(permissions ?? []);

  const target = await UserModel.findById(adminId).select("_id userType").lean();
  if (!target) throw new AppError("Admin not found", 404);
  if (target.userType === "super-admin") {
    throw new AppError("Super-admin permissions cannot be edited", 403);
  }
  if (target.userType !== "admin") {
    throw new AppError("This user is not an admin", 400);
  }

  const updated = await UserModel.findByIdAndUpdate(
    adminId,
    { $set: { permissions: perms } },
    { new: true, runValidators: true },
  ).select(SAFE_PROJECTION);

  return updated;
};

/** Revoke an admin — demote to a normal student and clear all permissions. */
export const revokeAdminService = async (adminId: string) => {
  const target = await UserModel.findById(adminId).select("_id userType").lean();
  if (!target) throw new AppError("Admin not found", 404);
  if (target.userType === "super-admin") {
    throw new AppError("A super-admin cannot be revoked", 403);
  }
  if (target.userType !== "admin") {
    throw new AppError("This user is not an admin", 400);
  }

  const updated = await UserModel.findByIdAndUpdate(
    adminId,
    { $set: { userType: "student", permissions: [] } },
    { new: true, overwriteDiscriminatorKey: true, runValidators: true },
  ).select(SAFE_PROJECTION);

  return updated;
};
