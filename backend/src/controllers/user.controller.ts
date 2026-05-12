import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  getUsersService,
  getUserByIdService,
  updateUserStatusService,
  deleteUserService,
  getUserStatsService,
  updateUserProfileService,
  getCurrentUserProfileService,
  changeUserPasswordService,
  changeUserEmailService,
  setUserPasswordService,
  unlinkGoogleAccountService,
  unlinkLinkedInAccountService,
  adminChangeUserPasswordService,
  getAdminUserOptionsService,
} from "../services/user.services";

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    userType,
    status,
    excludeEnrolledInCourseIds,
    enrollmentStatusForCourseIds,
  } = req.query;

  if (Number(page) < 1 || Number(limit) < 1) {
    throw new AppError("Page and limit must be positive numbers", 400);
  }

  const viewerType = (req.user as { userType?: string } | undefined)?.userType;
  if (
    typeof userType === "string" &&
    userType === "super-admin" &&
    viewerType !== "super-admin"
  ) {
    throw new AppError("Forbidden", 403);
  }

  const toStringArray = (v: unknown): string[] | undefined => {
    if (v == null) return undefined;
    const arr = Array.isArray(v)
      ? v.map((x) => (typeof x === "string" ? x : String(x)))
      : (typeof v === "string" ? v.split(",") : []).filter(Boolean);
    return arr.length ? arr : undefined;
  };

  const result = await getUsersService({
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    userType: userType as string,
    status: status as string,
    excludeEnrolledInCourseIds: toStringArray(excludeEnrolledInCourseIds),
    enrollmentStatusForCourseIds: toStringArray(enrollmentStatusForCourseIds),
  });

  sendSuccessResponse(res, result, "Users fetched successfully", 200);
});

export const getAdminUserOptions = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      emails,
      userType,
      status,
      excludeEnrolledInCourseIds,
      enrollmentStatusForCourseIds,
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const viewerType = (req.user as { userType?: string } | undefined)?.userType;
    if (
      typeof userType === "string" &&
      userType === "super-admin" &&
      viewerType !== "super-admin"
    ) {
      throw new AppError("Forbidden", 403);
    }

    const toStringArray = (v: unknown): string[] | undefined => {
      if (v == null) return undefined;
      const arr = Array.isArray(v)
        ? v.map((x) => (typeof x === "string" ? x : String(x)))
        : (typeof v === "string" ? v.split(",") : []).filter(Boolean);
      return arr.length ? arr : undefined;
    };

    const result = await getAdminUserOptionsService({
      page: Number(page),
      limit: Number(limit),
      search: (search as string) || undefined,
      emails: toStringArray(emails),
      userType: userType as string,
      status: status as string,
      excludeEnrolledInCourseIds: toStringArray(excludeEnrolledInCourseIds),
      enrollmentStatusForCourseIds: toStringArray(enrollmentStatusForCourseIds),
    });

    sendSuccessResponse(res, result, "User options fetched successfully", 200);
  },
);

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const user = await getUserByIdService(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  sendSuccessResponse(res, user, "User fetched successfully", 200);
});

export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!status || !["active", "inactive", "blocked"].includes(status)) {
      throw new AppError("Status must be active, inactive, or blocked", 400);
    }

    const adminId = req.user?._id?.toString();
    if (adminId && userId === adminId && status !== "active") {
      throw new AppError("You cannot disable your own account", 400);
    }

    const updatedUser = await updateUserStatusService(userId, status);
    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    sendSuccessResponse(
      res,
      updatedUser,
      "User status updated successfully",
      200
    );
  }
);

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const deletedUser = await deleteUserService(userId);
  if (!deletedUser) {
    throw new AppError("User not found", 404);
  }

  sendSuccessResponse(res, deletedUser, "User deleted successfully", 200);
});

export const getUserStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await getUserStatsService();
    sendSuccessResponse(
      res,
      stats,
      "User statistics fetched successfully",
      200
    );
  }
);

export const getCurrentUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    const user = await getCurrentUserProfileService(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    sendSuccessResponse(res, user, "Profile fetched successfully", 200);
  }
);

export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const updateData = { ...req.body } as Record<string, unknown>;

    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    // Partners can't relink themselves — the college is set by an admin and
    // changing it would let a partner reassign which roster of students they
    // can see. Server-side strip is the source of truth; admin updates go via
    // /users/admin/:userId which is exempt from this check.
    if (req.user?.userType === "partner") {
      delete updateData.partnerCollege;
      delete updateData.userType;
    }

    const updatedUser = await updateUserProfileService(userId, updateData);
    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    sendSuccessResponse(
      res,
      updatedUser,
      "Profile updated successfully",
      200
    );
  }
);

export const changeUserPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    // Password validation is done in the service

    const result = await changeUserPasswordService(userId, currentPassword, newPassword);
    
    sendSuccessResponse(
      res,
      null,
      "Password updated successfully",
      200
    );
  }
);

export const changeUserEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { currentPassword, newEmail } = req.body;

    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    if (!currentPassword || !newEmail) {
      throw new AppError("Current password and new email are required", 400);
    }

    const updatedUser = await changeUserEmailService(userId, currentPassword, newEmail);
    
    sendSuccessResponse(
      res,
      updatedUser,
      "Email updated successfully. Please check your new email for verification.",
      200
    );
  }
);

export const setUserPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { newPassword } = req.body;

    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    if (!newPassword) {
      throw new AppError("New password is required", 400);
    }

    await setUserPasswordService(userId, newPassword);
    
    sendSuccessResponse(
      res,
      null,
      "Password set successfully",
      200
    );
  }
);

export const unlinkGoogleAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    const result = await unlinkGoogleAccountService(userId);
    
    sendSuccessResponse(
      res,
      result,
      result.needsPassword 
        ? "Google account unlinked successfully. Please set a password for your account."
        : "Google account unlinked successfully",
      200
    );
  }
);

export const unlinkLinkedInAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    const result = await unlinkLinkedInAccountService(userId);
    
    sendSuccessResponse(
      res,
      result,
      result.needsPassword 
        ? "LinkedIn account unlinked successfully. Please set a password for your account."
        : "LinkedIn account unlinked successfully",
      200
    );
  }
);

/**
 * Admin endpoint to update any user's profile
 */
export const adminUpdateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updateData = req.body;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Remove sensitive fields that shouldn't be updated
    const { password, refreshTokens, _id, createdAt, permissions, ...allowedFields } =
      updateData;

    const updatedUser = await updateUserProfileService(userId, allowedFields);
    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    sendSuccessResponse(
      res,
      updatedUser,
      "User updated successfully",
      200
    );
  }
);

/**
 * Admin endpoint to create a new partner user. Partners get a minimal
 * profile (first/last name, email, optional phone, password) plus a
 * `partnerCollegeId` (ObjectId of an existing College from the main
 * directory). The discriminator's async validator re-verifies the college
 * exists at save time, so the link is enforced even if the UI is bypassed.
 */
export const adminCreatePartner = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      partnerCollegeId,
    } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
      partnerCollegeId?: string;
    };

    if (!firstName?.trim()) throw new AppError("First name is required", 400);
    if (!email?.trim()) throw new AppError("Email is required", 400);
    if (!password) throw new AppError("Password is required", 400);
    if (!partnerCollegeId?.trim())
      throw new AppError("College is required", 400);

    if (!mongoose.Types.ObjectId.isValid(partnerCollegeId)) {
      throw new AppError("Invalid college id", 400);
    }

    const { UserModel } = await import("../models");
    const existing = await UserModel.findOne({ email: email.trim() });
    if (existing) {
      throw new AppError("A user with this email already exists", 400);
    }

    const { registerUser } = await import("../services/auth.services");
    const newUser = await registerUser({
      email: email.trim(),
      password,
      userType: "partner",
      provider: "credentials",
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      ...(phone?.trim() ? { phone: phone.trim() } : {}),
      // Cast the ObjectId-string through as a partner-only field; the
      // PartnerModel discriminator's validator confirms existence at save
      // time so a forged ID gets rejected by the model layer.
      partnerCollege: new mongoose.Types.ObjectId(partnerCollegeId),
    } as Parameters<typeof registerUser>[0] & {
      partnerCollege: mongoose.Types.ObjectId;
    });

    const sanitized = (newUser as { toObject?: () => unknown }).toObject?.() ?? newUser;
    if (sanitized && typeof sanitized === "object") {
      delete (sanitized as Record<string, unknown>).password;
    }

    sendSuccessResponse(res, sanitized, "Partner account created", 201);
  },
);

/**
 * Admin endpoint to change any user's password
 */
export const adminChangeUserPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!newPassword) {
      throw new AppError("New password is required", 400);
    }

    // Password validation is done in the service

    await adminChangeUserPasswordService(userId, newPassword);
    
    sendSuccessResponse(
      res,
      null,
      "User password updated successfully",
      200
    );
  }
);
