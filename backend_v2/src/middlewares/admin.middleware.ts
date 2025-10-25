import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (user?.userType !== "admin") {
    return next(new AppError("Unauthorized", 401));
  }

  next();
};
