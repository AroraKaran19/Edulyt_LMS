import { NextFunction, Request, Response } from "express";
import { brandFromHeaders } from "../lib/brandRequest";
import type { Brand } from "../constants/brands";
import { AppError } from "./error.middleware";

export const resolveBrand = (req: Request, _res: Response, next: NextFunction) => {
  req.brand = brandFromHeaders(req.headers);
  next();
};

/**
 * For a route family that belongs to one brand. Answers 404 rather than 403:
 * on the other brand the feature does not exist, so it should not look like
 * something the caller might be allowed to reach.
 */
export const requireBrand =
  (brand: Brand) => (req: Request, _res: Response, next: NextFunction) => {
    if ((req.brand) !== brand) {
      return next(new AppError("Not found", 404));
    }
    next();
  };
