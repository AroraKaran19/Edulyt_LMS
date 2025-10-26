import { Request, Response } from "express";
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
} from "../services/user.services";

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, userType, status } = req.query;

  if (Number(page) < 1 || Number(limit) < 1) {
    throw new AppError("Page and limit must be positive numbers", 400);
  }

  const result = await getUsersService({
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    userType: userType as string,
    status: status as string,
  });

  sendSuccessResponse(res, result, "Users fetched successfully", 200);
});

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
    const updateData = req.body;

    if (!userId) {
      throw new AppError("User ID not found", 400);
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
