import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "./error.middleware";
import { hasPageAccess } from "../config/adminPermissions";
import { verifyUser } from "./user.middleware";

/** The only page a marketer may reach. Analytics is deliberately excluded. */
const MARKETER_PAGE_KEYS = new Set(["scholarship.tests"]);

/**
 * Scholarship pages are reachable three ways, so `requirePermission` cannot be
 * reused: it denies anything that is not `admin`, and a marketer is its own
 * userType holding no permissions array.
 */
export const requireScholarshipAccess =
  (pageKey: string) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    if (user.userType === "super-admin") {
      return next();
    }

    if (user.userType === "marketer") {
      if (MARKETER_PAGE_KEYS.has(pageKey)) {
        return next();
      }
      return next(new AppError("You don't have access to this section", 403));
    }

    if (user.userType !== "admin") {
      return next(new AppError("You don't have access to this section", 403));
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    if (hasPageAccess(permissions, pageKey)) {
      return next();
    }

    return next(new AppError("You don't have access to this section", 403));
  };

/**
 * Guard chain for a scholarship route. Mirrors `adminGuard`, but admits
 * marketers:
 *
 *   router.get("/admin", ...scholarshipGuard("scholarship.tests"), listCampaigns);
 */
export const scholarshipGuard = (pageKey: string): RequestHandler[] => [
  verifyUser,
  requireScholarshipAccess(pageKey),
];
