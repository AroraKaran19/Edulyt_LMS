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

export type StaffRole = "admin" | "marketer" | "sales";

export const STAFF_ROLES: readonly StaffRole[] = [
  "admin",
  "marketer",
  "sales",
];

/**
 * True for staff whose baseline access comes from the role itself. They may
 * also hold page grants, which add to that baseline; see `ROLE_PAGE_KEYS`.
 */
export const isRoleGrantedStaff = (role: string): boolean =>
  role === "marketer" || role === "sales";

const ROLE_ARTICLE: Record<StaffRole, string> = {
  admin: "an admin",
  marketer: "a marketer",
  sales: "a sales user",
};

/** Rejects anything outside the three staff roles. */
const resolveRole = (role?: string): StaffRole => {
  if (role === undefined) return "admin";
  if (!STAFF_ROLES.includes(role as StaffRole)) {
    throw new AppError(`Unknown role: ${role}`, 400);
  }
  return role as StaffRole;
};

/**
 * Every staff role may hold page grants now. A marketer or sales user keeps
 * their role's own pages unconditionally (see `ROLE_PAGE_KEYS`); anything here
 * is additive on top, so a grant can widen their access but never shrink it.
 */
const permissionsForRole = (_role: StaffRole, permissions: unknown): string[] =>
  sanitizePermissions(permissions ?? []);

const GENDERS = ["male", "female", "other"] as const;
export type StaffGender = (typeof GENDERS)[number];

export interface StaffAddressInput {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

/**
 * Staff are `User` discriminators, so they get the same base profile as any
 * other account. Blank optionals are dropped rather than written as "", which
 * would make an untouched address indistinguishable from a filled-in one.
 */
const cleanAddress = (
  input: StaffAddressInput | undefined,
): StaffAddressInput | undefined => {
  if (!input) return undefined;
  const entries = Object.entries(input)
    .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v] as const)
    .filter(([, v]) => Boolean(v));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const parseDob = (raw: string | undefined): Date | undefined => {
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("Date of birth is not a valid date", 400);
  }
  if (parsed.getTime() > Date.now()) {
    throw new AppError("Date of birth cannot be in the future", 400);
  }
  return parsed;
};

const parseGender = (raw: string | undefined): StaffGender | undefined => {
  if (!raw) return undefined;
  if (!GENDERS.includes(raw as StaffGender)) {
    throw new AppError(`Gender must be one of: ${GENDERS.join(", ")}`, 400);
  }
  return raw as StaffGender;
};

const trimmedOrUndefined = (raw: string | undefined): string | undefined => {
  const value = (raw ?? "").trim();
  return value === "" ? undefined : value;
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
  const filter = {
    userType: { $in: ["admin", "super-admin", "marketer", "sales"] },
  };

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
  role?: StaffRole;
  whatsappNumber?: string;
  profilePicture?: string;
  dob?: string;
  gender?: StaffGender;
  address?: StaffAddressInput;
}

/** Create a brand-new staff account (admin by default, or a marketer). */
export const createAdminService = async (data: CreateAdminInput) => {
  const email = normalizeEmail(data.email);
  if (!data.password) throw new AppError("Password is required", 400);
  validatePassword(data.password);
  const role = resolveRole(data.role);
  const permissions = permissionsForRole(role, data.permissions);

  // Parsed before the availability check so a malformed profile fails fast
  // rather than after a round trip.
  const dob = parseDob(data.dob);
  const gender = parseGender(data.gender);
  const address = cleanAddress(data.address);

  const existing = await UserModel.findOne({ email }).select("_id").lean();
  if (existing) {
    throw new AppError("A user with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const admin = await UserModel.create({
    firstName: trimmedOrUndefined(data.firstName),
    lastName: trimmedOrUndefined(data.lastName),
    email,
    password: hashedPassword,
    phone: trimmedOrUndefined(data.phone),
    whatsappNumber: trimmedOrUndefined(data.whatsappNumber),
    profilePicture: trimmedOrUndefined(data.profilePicture),
    dob,
    gender,
    address,
    userType: role,
    provider: "credentials",
    permissions,
    status: "active",
  });

  const { password: _password, ...safe } = admin.toObject();
  return safe;
};

/** Promote an existing user to staff: admin with permissions, or a marketer. */
export const promoteUserToAdminService = async (
  email: string,
  permissions: unknown,
  role?: StaffRole,
) => {
  const normalized = normalizeEmail(email);
  const resolved = resolveRole(role);
  const perms = permissionsForRole(resolved, permissions);

  const target = await UserModel.findOne({ email: normalized })
    .select("_id userType")
    .lean();
  if (!target) throw new AppError("No user found with this email", 404);
  if (target.userType === "super-admin") {
    throw new AppError("A super-admin cannot be modified here", 403);
  }
  if (target.userType === resolved) {
    throw new AppError(
      `This user is already ${ROLE_ARTICLE[resolved]}`,
      409,
    );
  }

  const updated = await UserModel.findByIdAndUpdate(
    target._id,
    { $set: { userType: resolved, permissions: perms } },
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

/** Revoke a staff member — demote to a student and clear all permissions. */
export const revokeAdminService = async (adminId: string) => {
  const target = await UserModel.findById(adminId).select("_id userType").lean();
  if (!target) throw new AppError("Admin not found", 404);
  if (target.userType === "super-admin") {
    throw new AppError("A super-admin cannot be revoked", 403);
  }
  // Marketers and sales are staff too, so revoking one demotes it the same
  // way. The permissions-update path deliberately stays admin-only.
  if (target.userType !== "admin" && !isRoleGrantedStaff(target.userType)) {
    throw new AppError("This user is not staff", 400);
  }

  const updated = await UserModel.findByIdAndUpdate(
    adminId,
    { $set: { userType: "student", permissions: [] } },
    { new: true, overwriteDiscriminatorKey: true, runValidators: true },
  ).select(SAFE_PROJECTION);

  return updated;
};
