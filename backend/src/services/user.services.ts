import mongoose from "mongoose";
import {
  InstructorModel,
  PartnerModel,
  StudentModel,
  UserModel,
  EnrollmentModel,
  OrderModel,
  CertificateModel,
  VideoNoteModel,
  ReviewModel,
  QnAModel,
  AffiliateModel,
  CourseModel,
  LiveClassModel,
  LeadModel,
} from "../models";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { retireCrmForDeletedUser } from "./crmProfile.services";
import { deleteFilesFromS3, extractS3KeyFromUrl } from "./upload.services";
import { User } from "../types/user";
import { AppError } from "../middlewares/error.middleware";
import bcrypt from "bcrypt";
import { validatePassword } from "../utils/passwordValidation";
import { assertPasswordChangeAllowed } from "../constants/accountChangeCooldown";

/**
 * Lightweight dashboard counts for the authenticated learner: course
 * enrollments, certificates, and internship enrollments. Replaces three
 * full-data calls (dashboard-stats, certificates list, internships list)
 * used purely to read the totals shown in the dashboard navbar + banner.
 */
export interface CurrentUserDashboardCounts {
  totalCourses: number;
  totalCertificates: number;
  totalInternships: number;
}

export const getCurrentUserDashboardCountsService = async (
  userId: string,
): Promise<CurrentUserDashboardCounts> => {
  const [totalCourses, totalCertificates, totalInternships] = await Promise.all(
    [
      EnrollmentModel.countDocuments({
        userId,
        status: { $nin: ["dropped", "revoked"] },
      }),
      CertificateModel.countDocuments({
        userId,
        isActive: true,
        isLatest: true,
      }),
      InternshipEnrollmentModel.countDocuments({
        user: new mongoose.Types.ObjectId(userId),
      }),
    ],
  );
  return { totalCourses, totalCertificates, totalInternships };
};

export interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
  userType?: string;
  status?: string;
  /** Exclude users enrolled in any of these course IDs (for gift modal - show only eligible) */
  excludeEnrolledInCourseIds?: string[];
  /** Add alreadyEnrolledInSelected to each user (for trial modal) */
  enrollmentStatusForCourseIds?: string[];
  /** Attach `totalSpend` per user. Super-admin only — skipped otherwise, which
   *  also avoids the orders aggregation entirely. */
  includeTotalSpend?: boolean;
  /** Inclusive signup-date (`createdAt`) window. Both optional. */
  from?: Date;
  to?: Date;
  /** Ignore paging and return every match up to `maxRows`. For the CSV export. */
  exportAll?: boolean;
  maxRows?: number;
}

export interface GetUsersResult {
  users: (User & {
    alreadyEnrolledInSelected?: boolean;
    totalSpend?: number;
  })[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetAdminUserOptionsParams {
  page: number;
  limit: number;
  search?: string;
  /** Comma-separated email list (exact match), used for Excel import */
  emails?: string[];
  userType?: string;
  /** Exclude these user types (e.g. ["admin","super-admin"] for the promote picker). Ignored when a specific `userType` is set. */
  excludeUserTypes?: string[];
  status?: string;
  /** Exclude users enrolled in any of these course IDs (gift modal) */
  excludeEnrolledInCourseIds?: string[];
  /** Add alreadyEnrolledInSelected to each user (trial modal) */
  enrollmentStatusForCourseIds?: string[];
}

export interface GetAdminUserOptionsResult {
  users: Array<{
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    /** Only includes courseIds from enrollmentStatusForCourseIds */
    enrolledCourseIds?: string[];
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export const getUsersService = async (
  params: GetUsersParams,
): Promise<GetUsersResult> => {
  const {
    page,
    limit,
    search,
    userType,
    status,
    excludeEnrolledInCourseIds,
    enrollmentStatusForCourseIds,
    includeTotalSpend = false,
    from,
    to,
    exportAll = false,
  } = params;
  const maxRows = params.maxRows ?? 50_000;
  const skip = (page - 1) * limit;

  let filters: any = {};

  // Signup-date window — the natural meaning of a date range on a lead list.
  if (from || to) {
    const clause: Record<string, Date> = {};
    if (from) clause.$gte = from;
    if (to) clause.$lte = to;
    filters.createdAt = clause;
  }

  if (search) {
    filters.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (userType && userType !== "all") {
    filters.userType = userType;
  }

  if (status && status !== "all") {
    filters.status = status;
  }

  // Exclude users already enrolled in any of the given courses (gift modal)
  if (
    excludeEnrolledInCourseIds?.length &&
    excludeEnrolledInCourseIds.every((id) =>
      mongoose.Types.ObjectId.isValid(id),
    )
  ) {
    const enrolledUserIds = await EnrollmentModel.distinct("userId", {
      courseId: { $in: excludeEnrolledInCourseIds },
      status: { $in: ["active", "completed", "paused"] },
    });
    filters._id = { $nin: enrolledUserIds };
  }

  const query = UserModel.find(filters)
    .select("-password -refreshTokens -__v -successPointsHistory")
    .sort({ createdAt: -1 });

  if (exportAll) {
    query.limit(maxRows);
  } else {
    query.skip(skip).limit(limit);
  }

  const users = await query.lean();

  const total = await UserModel.countDocuments(filters);
  const totalPages = exportAll ? 1 : Math.ceil(total / limit);

  let resultUsers = users as (User & { alreadyEnrolledInSelected?: boolean })[];

  // Add enrollment status for trial modal
  if (
    enrollmentStatusForCourseIds?.length &&
    enrollmentStatusForCourseIds.every((id) =>
      mongoose.Types.ObjectId.isValid(id),
    ) &&
    resultUsers.length > 0
  ) {
    const userIds = resultUsers.map((u) => u._id).filter(Boolean) as string[];
    const enrolledUserIds = await EnrollmentModel.distinct("userId", {
      userId: { $in: userIds },
      courseId: { $in: enrollmentStatusForCourseIds },
      status: { $in: ["active", "completed", "paused"] },
    });
    const enrolledSet = new Set(enrolledUserIds.map(String));
    resultUsers = resultUsers.map((u) => ({
      ...u,
      alreadyEnrolledInSelected: u._id ? enrolledSet.has(String(u._id)) : false,
    }));
  }

  // Add total spend (successful paid orders only) for each user
  if (includeTotalSpend && resultUsers.length > 0) {
    const userIds = resultUsers
      .map((u) => u._id)
      .filter(
        (id): id is string =>
          Boolean(id) && mongoose.Types.ObjectId.isValid(String(id)),
      )
      .map((id) => new mongoose.Types.ObjectId(id));
    const spendAgg = await OrderModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      totalSpend: number;
    }>([
      { $match: { userId: { $in: userIds }, paymentStatus: "success" } },
      { $group: { _id: "$userId", totalSpend: { $sum: "$amount" } } },
    ]);
    const spendByUser = new Map(
      spendAgg.map((r) => [r._id.toString(), r.totalSpend]),
    );
    resultUsers = resultUsers.map((u) => ({
      ...u,
      totalSpend: u._id ? (spendByUser.get(String(u._id)) ?? 0) : 0,
    }));
  }

  return {
    users: resultUsers,
    total,
    page: exportAll ? 1 : page,
    totalPages,
  };
};

/**
 * Lightweight user picker for admin modals (trial/gift).
 * Returns only id + name + email (+ alreadyEnrolledInSelected when requested).
 * Avoids heavy selects/aggregations (orders, etc).
 */
export const getAdminUserOptionsService = async (
  params: GetAdminUserOptionsParams,
): Promise<GetAdminUserOptionsResult> => {
  const {
    page,
    limit,
    search,
    emails,
    userType,
    excludeUserTypes,
    status,
    excludeEnrolledInCourseIds,
    enrollmentStatusForCourseIds,
  } = params;

  const skip = (page - 1) * limit;
  let filters: any = {};

  if (emails?.length) {
    const cleaned = emails
      .map((e) => String(e).trim().toLowerCase())
      .filter(Boolean);
    if (cleaned.length > 0) {
      filters.email = { $in: cleaned };
    }
  }

  if (search) {
    filters.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (userType && userType !== "all") {
    filters.userType = userType;
  } else if (excludeUserTypes?.length) {
    // Only applies when no specific userType is requested (e.g. promote picker
    // excludes existing admins/super-admins).
    filters.userType = { $nin: excludeUserTypes };
  }

  if (status && status !== "all") {
    filters.status = status;
  }

  // Exclude users already enrolled in any of the given courses (gift modal)
  if (
    excludeEnrolledInCourseIds?.length &&
    excludeEnrolledInCourseIds.every((id) =>
      mongoose.Types.ObjectId.isValid(id),
    )
  ) {
    const enrolledUserIds = await EnrollmentModel.distinct("userId", {
      courseId: { $in: excludeEnrolledInCourseIds },
      status: { $in: ["active", "completed", "paused"] },
    });
    filters._id = { $nin: enrolledUserIds };
  }

  const raw = await UserModel.find(filters)
    .select({ _id: 1, firstName: 1, lastName: 1, email: 1 })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await UserModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  let users = (raw ?? []).map((u) => ({
    _id: String((u as any)._id),
    firstName: (u as any).firstName,
    lastName: (u as any).lastName,
    email: String((u as any).email ?? ""),
  })) as GetAdminUserOptionsResult["users"];

  // Add enrollment status for trial modal
  if (
    enrollmentStatusForCourseIds?.length &&
    enrollmentStatusForCourseIds.every((id) =>
      mongoose.Types.ObjectId.isValid(id),
    ) &&
    users.length > 0
  ) {
    const userIds = users
      .map((u) => u._id)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const enrolledPairs = await EnrollmentModel.find({
      userId: { $in: userIds },
      courseId: { $in: enrollmentStatusForCourseIds },
      status: { $in: ["active", "completed", "paused"] },
    })
      .select({ userId: 1, courseId: 1, _id: 0 })
      .lean();

    const byUser = new Map<string, Set<string>>();
    for (const row of enrolledPairs ?? []) {
      const uid = String((row as any).userId);
      const cid = String((row as any).courseId);
      if (!uid || !cid) continue;
      const set = byUser.get(uid) ?? new Set<string>();
      set.add(cid);
      byUser.set(uid, set);
    }

    users = users.map((u) => ({
      ...u,
      enrolledCourseIds: Array.from(byUser.get(String(u._id)) ?? []),
    }));
  }

  return {
    users,
    total,
    page,
    totalPages,
  };
};

export const getUserByIdService = async (
  userId: string,
): Promise<User | null> => {
  // First get the user to determine their type
  const baseUser = await UserModel.findById(userId).select("userType").lean();

  if (!baseUser) {
    return null;
  }

  let user;

  // Fetch from the appropriate model based on user type
  if (baseUser.userType === "student") {
    user = await StudentModel.findById(userId)
      .select("-password -refreshTokens -__v -successPointsHistory")
      .lean();
  } else if (baseUser.userType === "instructor") {
    user = await InstructorModel.findById(userId)
      .select("-password -refreshTokens -__v -successPointsHistory")
      .lean();
  } else if (baseUser.userType === "partner") {
    // Populate the linked College so the admin UI can show "name, location"
    // without an extra round-trip per partner row.
    user = await UserModel.findById(userId)
      .select("-password -refreshTokens -__v -successPointsHistory")
      .populate({
        path: "partnerCollege",
        select: "name location website image",
      })
      .lean();
  } else {
    // For other user types (collaborator, admin, etc.), use base UserModel
    user = await UserModel.findById(userId)
      .select("-password -refreshTokens -__v -successPointsHistory")
      .lean();
  }

  return user as User | null;
};

export const updateUserStatusService = async (
  userId: string,
  status: "active" | "inactive" | "blocked",
): Promise<User | null> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { status, updatedAt: new Date() },
    { new: true, runValidators: true },
  ).select("-password -refreshTokens -__v -successPointsHistory");

  return user as User | null;
};

/**
 * Collect S3 keys from user profile and instructor live classes, then delete from S3.
 * Run non-blocking so user deletion returns quickly.
 */
const deleteUserFilesFromS3 = async (
  user: any,
  liveClasses: { imageUrl?: string | null }[],
): Promise<void> => {
  const urls: string[] = [];
  if (user?.profilePicture) urls.push(user.profilePicture);
  const acc = user?.accounts;
  if (acc?.google?.image) urls.push(acc.google.image);
  if (acc?.linkedin?.image) urls.push(acc.linkedin.image);
  for (const lc of liveClasses || []) {
    if (lc?.imageUrl) urls.push(lc.imageUrl);
  }
  const keys = urls
    .map((u) => extractS3KeyFromUrl(u))
    .filter((k): k is string => k != null);
  if (keys.length > 0) {
    await deleteFilesFromS3([...new Set(keys)]);
  }
};

export const deleteUserService = async (
  userId: string,
): Promise<User | null> => {
  const user = await UserModel.findById(userId)
    .select("-password -refreshTokens -__v -successPointsHistory")
    .lean();
  if (!user) {
    return null;
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Fetch live classes for instructors (for S3 imageUrl) before we unassign
  const liveClasses =
    user.userType === "instructor"
      ? await LiveClassModel.find({ instructor: userObjectId })
          .select("imageUrl")
          .lean()
      : [];

  // Delete user's S3 files in background (non-blocking)
  deleteUserFilesFromS3(user, liveClasses).catch((err) =>
    console.error("[DeleteUser] S3 cleanup failed:", err),
  );

  // Permanently delete user and all related data
  await Promise.all([
    EnrollmentModel.deleteMany({ userId: userObjectId }),
    OrderModel.deleteMany({ userId: userObjectId }),
    CertificateModel.deleteMany({ userId: userObjectId }),
    VideoNoteModel.deleteMany({ userId: userObjectId }),
    ReviewModel.deleteMany({ userId: userObjectId }),
    QnAModel.deleteMany({ userId: userObjectId }),
    AffiliateModel.updateMany(
      { users: userObjectId },
      { $pull: { users: userObjectId } },
    ),
    // Demotes the ambassadors this owner had and removes their own profile.
    // Never blocks and never deletes an ambassador: see the helper.
    retireCrmForDeletedUser(userObjectId),
    // Leads are never deleted with their creator: they belong to the company.
    // Only the pointer is cleared, so the name, code and role stay readable.
    LeadModel.updateMany(
      { "creator.userId": userObjectId },
      { $set: { "creator.userId": null } },
    ),
    LeadModel.updateMany(
      { "parent.userId": userObjectId },
      { $set: { "parent.userId": null } },
    ),
  ]);

  // For instructors: unassign from their courses
  if (user.userType === "instructor") {
    await CourseModel.updateMany(
      { instructor: userObjectId },
      { $unset: { instructor: "" } },
    );
  }

  await UserModel.findByIdAndDelete(userId);

  return user as User | null;
};

export const getUserStatsService = async () => {
  const totalUsers = await UserModel.countDocuments();
  const activeUsers = await UserModel.countDocuments({ status: "active" });
  const inactiveUsers = await UserModel.countDocuments({ status: "inactive" });
  const blockedUsers = await UserModel.countDocuments({ status: "blocked" });
  const deletedUsers = await UserModel.countDocuments({ status: "deleted" });

  const students = await UserModel.countDocuments({ userType: "student" });
  const instructors = await UserModel.countDocuments({
    userType: "instructor",
  });
  const admins = await UserModel.countDocuments({ userType: "admin" });
  const superAdmins = await UserModel.countDocuments({
    userType: "super-admin",
  });

  // Get recent users (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentUsers = await UserModel.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    blockedUsers,
    deletedUsers,
    userTypes: {
      students,
      instructors,
      admins,
      superAdmins,
    },
    recentUsers,
    recentUsersPeriod: "30 days",
  };
};

export const getCurrentUserProfileService = async (
  userId: string,
): Promise<User | null> => {
  const excludedFields =
    "-_id -__v -permissions -refreshTokens -pendingPayments -orders -status -affiliation -updatedAt -successPointsHistory";
  let user = await UserModel.findById(userId).select(excludedFields).lean();
  if (!user) {
    return null;
  }
  const type = user.userType;
  if (type === "student") {
    user = await StudentModel.findById(userId).select(excludedFields).lean();
  } else if (type === "instructor") {
    user = await InstructorModel.findById(userId).select(excludedFields).lean();
  }
  return user as User | null;
};

export const updateUserProfileService = async (
  userId: string,
  updateData: Partial<User>,
): Promise<User | null> => {
  // Remove sensitive fields that shouldn't be updated via profile
  const { password, refreshTokens, _id, createdAt, ...allowedFields } =
    updateData;

  // First get the user to determine their type. We also read the current
  // contact fields so we can skip re-writing them when they haven't changed.
  const existingUser = await UserModel.findById(userId).select(
    "userType email phone",
  );
  if (!existingUser) {
    return null;
  }

  // `college` is an ObjectId ref. The frontend sends "" when the student
  // typed a custom college name (no directory match) — empty string isn't a
  // valid ObjectId, so let mongoose strip the field via $unset instead of
  // trying to cast it.
  const fields = { ...allowedFields } as Record<string, unknown>;

  // Skip re-writing contact fields that haven't actually changed.
  if ("email" in fields && fields.email === existingUser.email) {
    delete fields.email;
  }
  if ("phone" in fields && fields.phone === existingUser.phone) {
    delete fields.phone;
  }

  const unsetOps: Record<string, ""> = {};
  if ("college" in fields) {
    const v = fields.college;
    if (v === "" || v === null || v === undefined) {
      delete fields.college;
      unsetOps.college = "";
    }
  }
  const update: Record<string, unknown> = {
    ...fields,
    updatedAt: new Date(),
  };
  if (Object.keys(unsetOps).length > 0) update.$unset = unsetOps;

  let updatedUser;

  // Update using the appropriate model based on user type
  if (existingUser.userType === "student") {
    updatedUser = await StudentModel.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens -__v -successPointsHistory");
  } else if (existingUser.userType === "instructor") {
    updatedUser = await InstructorModel.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens -__v -successPointsHistory");
  } else if (existingUser.userType === "partner") {
    updatedUser = await PartnerModel.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens -__v -successPointsHistory");
  } else {
    // collaborator, admin, super-admin — base schema only
    updatedUser = await UserModel.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens -__v -successPointsHistory");
  }

  return updatedUser as User | null;
};

export const changeUserPasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> => {
  // Get user with password field
  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Checked before the password so a locked account is told it is locked,
  // rather than being sent to reset a password that was never the problem.
  assertPasswordChangeAllowed(user.passwordChangedAt);

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );
  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Validate new password
  validatePassword(newPassword);

  // Check if new password is different from current
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
    );
  }

  // Hash new password
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  const changedAt = new Date();
  await UserModel.findByIdAndUpdate(
    userId,
    {
      password: hashedNewPassword,
      passwordChangedAt: changedAt,
      updatedAt: changedAt,
    },
    { new: true },
  );

  return true;
};

export const setUserPasswordService = async (
  userId: string,
  newPassword: string,
): Promise<boolean> => {
  // Get user to verify existence
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // This route asks for no current password, which is only safe for the case
  // it exists to serve: an OAuth account that has never had one to ask for.
  // The UI only ever opens it for those, but nothing enforced that server-side,
  // so any session could overwrite its own password without knowing the old one
  // and skip `changeUserPasswordService` entirely.
  if (user.provider !== "google" && user.provider !== "linkedin") {
    throw new AppError(
      "Your account already has a password. Use the change password option instead.",
      400,
    );
  }

  // The same cooldown as `changeUserPasswordService`. Without it this route is
  // a way around that one: it writes the same field. A genuine first-time set
  // is unaffected, because an account that has never used any of the password
  // routes has no `passwordChangedAt`.
  assertPasswordChangeAllowed(user.passwordChangedAt);

  // Validate password
  validatePassword(newPassword);

  // Hash new password
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  const changedAt = new Date();
  await UserModel.findByIdAndUpdate(
    userId,
    {
      password: hashedNewPassword,
      passwordChangedAt: changedAt,
      updatedAt: changedAt,
    },
    { new: true },
  );

  return true;
};

/**
 * Email changes live in `emailChangeVerification.services.ts`.
 *
 * The version that stood here swapped the address on a password check alone,
 * with the two `TODO`s about verification never done. That address is the
 * account's password-reset channel, so moving it unverified is a one-way door:
 * a typo locks the learner out, and a hijacked session takes the account with
 * no signal reaching its owner.
 */

export const unlinkGoogleAccountService = async (
  userId: string,
): Promise<{ user: User | null; needsPassword: boolean }> => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check if user has Google account linked
  if (!user.accounts?.google) {
    throw new AppError("Google account is not linked to this user", 400);
  }

  // If user's provider is Google, change provider to credentials
  // The user already has a password (set during OAuth registration)
  const updateData: any = {
    $unset: { "accounts.google": "" },
    updatedAt: new Date(),
  };

  if (user.provider === "google") {
    updateData.provider = "credentials";
  }

  // Remove profile picture if it's from Google (external URL, not S3)
  if (
    user.profilePicture &&
    !user.profilePicture.includes(".s3.") &&
    !user.profilePicture.includes("s3.amazonaws.com")
  ) {
    updateData.$unset.profilePicture = "";
  }

  // Remove Google account data and update provider if needed
  const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -refreshTokens -__v -successPointsHistory");

  if (!updatedUser) {
    throw new AppError("Failed to unlink Google account", 500);
  }

  // Check if user needs to set a password (if provider was Google, they have a random password)
  const needsPassword = user.provider === "google";

  return { user: updatedUser as User | null, needsPassword };
};

export const unlinkLinkedInAccountService = async (
  userId: string,
): Promise<{ user: User | null; needsPassword: boolean }> => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check if user has LinkedIn account linked
  if (!user.accounts?.linkedin) {
    throw new AppError("LinkedIn account is not linked to this user", 400);
  }

  // If user's provider is LinkedIn, change provider to credentials
  // The user already has a password (set during OAuth registration)
  const updateData: any = {
    $unset: { "accounts.linkedin": "" },
    updatedAt: new Date(),
  };

  if (user.provider === "linkedin") {
    updateData.provider = "credentials";
  }

  // Remove profile picture if it's from LinkedIn (external URL)
  if (
    user.profilePicture &&
    !user.profilePicture.includes(".s3.") &&
    !user.profilePicture.includes("s3.amazonaws.com")
  ) {
    updateData.$unset.profilePicture = "";
  }

  // Remove LinkedIn account data and update provider if needed
  const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -refreshTokens -__v -successPointsHistory");

  if (!updatedUser) {
    throw new AppError("Failed to unlink LinkedIn account", 500);
  }

  // Check if user needs to set a password (if provider was LinkedIn, they have a random password)
  const needsPassword = user.provider === "linkedin";

  return { user: updatedUser as User | null, needsPassword };
};

/**
 * Admin service to change any user's password without requiring current password
 */
export const adminChangeUserPasswordService = async (
  userId: string,
  newPassword: string,
): Promise<boolean> => {
  // Get user to verify existence
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Validate password
  validatePassword(newPassword);

  // Hash new password
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await UserModel.findByIdAndUpdate(
    userId,
    {
      password: hashedNewPassword,
      updatedAt: new Date(),
    },
    { new: true },
  );

  return true;
};
