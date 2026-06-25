import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import { UserModel } from "../models";
import { hashRefreshToken } from "../utils/refreshToken";

export const verifyTokenForRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshTokenPlain: unknown = req.body?.refreshToken;

    if (!refreshTokenPlain || typeof refreshTokenPlain !== "string") {
      return next(new AppError("Refresh token required", 401));
    }

    const tokenHash = hashRefreshToken(refreshTokenPlain);

    let user;
    try {
      user = await UserModel.findOne({
        "refreshTokens.tokenHash": tokenHash,
      }).select("-password -successPointsHistory");
    } catch (dbError) {
      return next(new AppError("Database error", 500));
    }

    // Unknown token — can't identify a family to revoke, so just reject.
    if (!user) {
      return next(new AppError("Invalid refresh token", 401));
    }

    if (user.status !== "active") {
      return next(new AppError("Account is not active", 401));
    }

    const entry = user.refreshTokens.find((rt) => rt.tokenHash === tokenHash);
    if (!entry) {
      return next(new AppError("Invalid refresh token", 401));
    }

    req.user = user;
    (req as any).refreshTokenHash = tokenHash;
    (req as any).refreshTokenEntry = entry;
    return next();
  } catch (error) {
    return next(new AppError("Authentication failed", 401));
  }
};
