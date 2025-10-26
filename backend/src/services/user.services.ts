import { UserModel } from "../models";
import { User } from "../types/user";

export interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
  userType?: string;
  status?: string;
}

export interface GetUsersResult {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export const getUsersService = async (
  params: GetUsersParams
): Promise<GetUsersResult> => {
  const { page, limit, search, userType, status } = params;
  const skip = (page - 1) * limit;

  // Build filter object
  let filters: any = {};

  // Add search filter
  if (search) {
    filters.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Add user type filter
  if (userType && userType !== "all") {
    filters.userType = userType;
  }

  // Add status filter
  if (status && status !== "all") {
    filters.status = status;
  }

  // Get users with pagination
  const users = await UserModel.find(filters)
    .select("-password -refreshTokens -__v")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  // Get total count
  const total = await UserModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return {
    users: users as User[],
    total,
    page,
    totalPages,
  };
};

export const getUserByIdService = async (
  userId: string
): Promise<User | null> => {
  const user = await UserModel.findById(userId)
    .select("-password -refreshTokens -__v")
    .lean();

  return user as User | null;
};

export const updateUserStatusService = async (
  userId: string,
  status: "active" | "inactive" | "blocked"
): Promise<User | null> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { status, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select("-password -refreshTokens -__v");

  return user as User | null;
};

export const deleteUserService = async (
  userId: string
): Promise<User | null> => {
  // Soft delete - mark as deleted instead of actually deleting
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      status: "deleted",
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).select("-password -refreshTokens -__v");

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
  userId: string
): Promise<User | null> => {
  const user = await UserModel.findById(userId)
    .select("-password -refreshTokens -__v")
    .lean();

  return user as User | null;
};

export const updateUserProfileService = async (
  userId: string,
  updateData: Partial<User>
): Promise<User | null> => {
  // Remove sensitive fields that shouldn't be updated via profile
  const { password, refreshTokens, _id, createdAt, ...allowedFields } = updateData;
  
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { ...allowedFields, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select("-password -refreshTokens -__v");

  return user as User | null;
};