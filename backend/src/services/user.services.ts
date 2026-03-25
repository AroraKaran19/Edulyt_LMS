import mongoose from "mongoose";
import {
  InstructorModel,
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
} from "../models";
import { deleteFilesFromS3, extractS3KeyFromUrl } from "./upload.services";
import { User } from "../types/user";
import { AppError } from "../middlewares/error.middleware";
import bcrypt from "bcrypt";
import { validatePassword } from "../utils/passwordValidation";

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
  } = params;
  const skip = (page - 1) * limit;

  let filters: any = {};

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

  const users = await UserModel.find(filters)
    .select("-password -refreshTokens -__v")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await UserModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

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
  if (resultUsers.length > 0) {
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
      .select("-password -refreshTokens -__v")
      .lean();
  } else if (baseUser.userType === "instructor") {
    user = await InstructorModel.findById(userId)
      .select("-password -refreshTokens -__v")
      .lean();
  } else {
    // For other user types (collaborator, admin, etc.), use base UserModel
    user = await UserModel.findById(userId)
      .select("-password -refreshTokens -__v")
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
  ).select("-password -refreshTokens -__v");

  return user as User | null;
};

/**
 * Collect S3 keys from user profile and instructor live classes, then delete from S3.
 * Run non-blocking so user deletion returns quickly.
 */
const deleteUserFilesFromS3 = async (
  user: any,
  liveClasses: { imageUrl?: string }[],
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
    .select("-password -refreshTokens -__v")
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
    VideoNoteModel.deleteMany({ user: userObjectId }),
    ReviewModel.deleteMany({ userId: userObjectId }),
    QnAModel.deleteMany({ userId: userObjectId }),
    AffiliateModel.updateMany(
      { users: userObjectId },
      { $pull: { users: userObjectId } },
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
    "-__v -permissions -refreshTokens -pendingPayments -orders -status -affiliation -updatedAt";
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

  // First get the user to determine their type
  const existingUser = await UserModel.findById(userId).select("userType");
  if (!existingUser) {
    return null;
  }

  let updatedUser;

  // Update using the appropriate model based on user type
  if (existingUser.userType === "student") {
    updatedUser = await StudentModel.findByIdAndUpdate(
      userId,
      { ...allowedFields, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).select("-password -refreshTokens -__v");
  } else if (existingUser.userType === "instructor") {
    updatedUser = await InstructorModel.findByIdAndUpdate(
      userId,
      { ...allowedFields, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).select("-password -refreshTokens -__v");
  } else {
    // For other user types (collaborator, admin, etc.), use base UserModel
    updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { ...allowedFields, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).select("-password -refreshTokens -__v");
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

export const setUserPasswordService = async (
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

export const changeUserEmailService = async (
  userId: string,
  currentPassword: string,
  newEmail: string,
): Promise<User | null> => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw new AppError("Invalid email format", 400);
  }

  // Get user with password field
  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );
  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Check if new email is different from current
  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    throw new AppError("New email must be different from current email", 400);
  }

  // Check if new email already exists
  const existingUser = await UserModel.findOne({
    email: newEmail.toLowerCase(),
    _id: { $ne: userId },
  });
  if (existingUser) {
    throw new AppError("Email already in use by another account", 400);
  }

  // Get the old email for notification
  const oldEmail = user.email;

  // Update email
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      email: newEmail.toLowerCase(),
      updatedAt: new Date(),
    },
    { new: true, runValidators: true },
  ).select("-password -refreshTokens -__v");

  if (!updatedUser) {
    throw new AppError("Failed to update email", 500);
  }

  // TODO: Send notification email to old email address
  // TODO: Send verification email to new email address (if email verification is required)

  return updatedUser as User | null;
};

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
  }).select("-password -refreshTokens -__v");

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
  }).select("-password -refreshTokens -__v");

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
