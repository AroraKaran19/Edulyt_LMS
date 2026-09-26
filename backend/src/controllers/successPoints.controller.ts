import { Request, Response } from "express";
import {
  asyncHandler,
  AppError,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  adminAdjustSuccessPointsService,
  getSuccessPointsBalanceService,
  getSuccessPointsHistoryForAdminService,
  getSuccessPointsHistoryService,
  transferSuccessPointsService,
} from "../services/successPoints.services";
import { getPointsSettings } from "../services/pointsSettings.services";

export const getPublicRedemptionRate = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await getPointsSettings();
    sendSuccessResponse(
      res,
      {
        successPointRedemptionInr: settings.successPointRedemptionInr,
        successPointsMaxUtilizationPercent:
          settings.successPointsMaxUtilizationPercent,
      },
      "Redemption rate fetched",
      200,
    );
  },
);

export const getPublicRewardRates = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await getPointsSettings();
    sendSuccessResponse(
      res,
      {
        loginSuccessPoints: settings.loginSuccessPoints,
        communityReviewSuccessPoints: settings.communityReviewSuccessPoints,
        internshipRegistrationSuccessPoints:
          settings.internshipRegistrationSuccessPoints,
      },
      "Reward rates fetched",
      200,
    );
  },
);

export const getMySuccessPoints = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user?._id) throw new AppError("Unauthorized", 401);

    const result = await getSuccessPointsBalanceService(String(user._id));
    sendSuccessResponse(res, result, "Success points balance fetched", 200);
  },
);

export const getMySuccessPointsHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user?._id) throw new AppError("Unauthorized", 401);

    const { page = 1, limit = 10 } = req.query as {
      page?: string | number;
      limit?: string | number;
    };

    const result = await getSuccessPointsHistoryService(
      String(user._id),
      Number(page),
      Number(limit),
    );
    sendSuccessResponse(res, result, "Success points history fetched", 200);
  },
);

export const getUserSuccessPointsHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query as {
      page?: string | number;
      limit?: string | number;
    };

    const result = await getSuccessPointsHistoryForAdminService(
      String(userId ?? ""),
      Number(page),
      Number(limit),
    );
    sendSuccessResponse(res, result, "Success points history fetched", 200);
  },
);

export const transferSuccessPoints = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user?._id) throw new AppError("Unauthorized", 401);

    const { recipientEmail, points } = req.body as {
      recipientEmail?: string;
      points?: number | string;
    };

    const result = await transferSuccessPointsService({
      senderId: String(user._id),
      recipientEmail: recipientEmail ?? "",
      points: Number(points),
    });

    sendSuccessResponse(res, result, "Success points transferred", 200);
  },
);

export const adminAdjustSuccessPoints = asyncHandler(
  async (req: Request, res: Response) => {
    const admin = req.user;
    if (!admin?._id) throw new AppError("Unauthorized", 401);

    const { userId, points, expiryDays } = req.body as {
      userId?: string;
      points?: number | string;
      expiryDays?: number | string | null;
    };

    const adminName =
      [admin.firstName, admin.lastName].filter(Boolean).join(" ").trim() ||
      admin.email ||
      "Admin";

    const result = await adminAdjustSuccessPointsService({
      adminId: String(admin._id),
      adminName,
      targetUserId: String(userId ?? ""),
      points: Number(points),
      expiryDays:
        expiryDays === undefined || expiryDays === null || expiryDays === ""
          ? undefined
          : Number(expiryDays),
    });

    sendSuccessResponse(res, result, "Success points adjusted", 200);
  },
);
