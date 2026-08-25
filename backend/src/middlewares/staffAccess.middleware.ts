import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "./error.middleware";
import { canAccessPageAsRole } from "../config/adminPermissions";
import { verifyUser } from "./user.middleware";

/**
 * Page-level gate for an admin route reachable by more than one kind of staff.
 * `requirePermission` cannot be reused here: it denies anything that is not
 * `admin`, while marketer and sales are their own userTypes holding no
 * permissions array.
 */
export const requireStaffPageAccess =
  (pageKey: string) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    if (canAccessPageAsRole(user.userType, permissions, pageKey)) {
      return next();
    }

    return next(new AppError("You don't have access to this section", 403));
  };

/**
 * Same check, but satisfied by any one of several pages. For shared data a
 * page borrows from another section: the question bank is read by both the
 * question-bank page and the campaign builder that embeds its picker.
 */
export const requireStaffAnyPageAccess =
  (pageKeys: readonly string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const allowed = pageKeys.some((key) =>
      canAccessPageAsRole(user.userType, permissions, key),
    );
    if (allowed) {
      return next();
    }

    return next(new AppError("You don't have access to this section", 403));
  };

/**
 * Guard chain for a page-keyed staff route:
 *
 *   router.get("/admin", ...staffGuard("scholarship.tests"), listCampaigns);
 */
export const staffGuard = (pageKey: string): RequestHandler[] => [
  verifyUser,
  requireStaffPageAccess(pageKey),
];
