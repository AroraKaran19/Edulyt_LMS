import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";
import { EnrollmentModel } from "../models/enrollment.schema";

/**
 * Verifies that the authenticated user owns the enrollment (or is admin/super-admin).
 * Must be used after verifyUser. Expects enrollmentId in req.params.
 */
export const verifyEnrollmentOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const enrollmentId = req.params.enrollmentId;
  const user = req.user;

  if (!user) {
    return next(new AppError("Authentication required", 401));
  }

  if (!enrollmentId) {
    return next(new AppError("Enrollment ID is required", 400));
  }

  const enrollment = await EnrollmentModel.findById(enrollmentId).select(
    "userId"
  );

  if (!enrollment) {
    return next(new AppError("Enrollment not found", 404));
  }

  const isOwner =
    String(enrollment.userId) === String(user._id);
  const isAdmin =
    user.userType === "admin" || user.userType === "super-admin";

  if (!isOwner && !isAdmin) {
    return next(new AppError("You do not have access to this enrollment", 403));
  }

  next();
};
