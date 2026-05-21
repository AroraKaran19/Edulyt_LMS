import { Request, Response, NextFunction } from "express";
import { ACCOUNT_DISABLED_MESSAGE } from "../constants/authMessages";
import { AppError } from "./error.middleware";
import { UserModel } from "../models";
import jwt from "jsonwebtoken";

/**
 * Blocks partner accounts from learner-only flows (cart purchases, voucher
 * redemption, internship enrollment, etc.). Partners are a portal-only
 * account type — they view their college's students but never enroll in
 * anything themselves. Must be chained AFTER `verifyUser`.
 */
export const denyPartners = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }
  if (req.user.userType === "partner") {
    return next(
      new AppError(
        "Partner accounts can't perform this action. Please use a student account.",
        403,
      ),
    );
  }
  next();
};

/**
 * Gate for the partner portal endpoints (/api/partner/*). Confirms the
 * authenticated user is a partner; non-partners get a 403. Must be chained
 * AFTER `verifyUser`.
 */
export const verifyPartner = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }
  if (req.user.userType !== "partner") {
    return next(new AppError("Partner access required", 403));
  }
  next();
};

/**
 * Best-effort auth: if a valid Bearer token is present, attaches `req.user`;
 * otherwise just calls `next()` with no error. Use on public endpoints that
 * need to *enrich* their response when the caller happens to be logged in
 * (e.g. "did this user already like this post?").
 */
export const optionalVerifyUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const accessToken = authHeader.substring(7);
  if (!process.env.JWT_SECRET) return next();
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET) as {
      userId: string;
    };
    const user = await UserModel.findById(decoded.userId).select(
      "-password -successPointsHistory"
    );
    if (user && user.status === "active") {
      req.user = user;
    }
  } catch {
    // ignore — fall through as anonymous
  }
  next();
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Access token required", 401));
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      return next(new AppError("JWT_SECRET is not set", 500));
    }

    // Verify access token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET) as {
      userId: string;
      userType: string;
    };

    const user = await UserModel.findById(decoded.userId).select(
      "-password -successPointsHistory"
    );

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    if (user.status !== "active") {
      return next(new AppError(ACCOUNT_DISABLED_MESSAGE, 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid access token", 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Access token expired", 401));
    }
    next(error);
  }
};
