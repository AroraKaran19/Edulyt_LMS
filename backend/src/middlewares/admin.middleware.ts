import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "./error.middleware";
import {
  ADMIN_PERMISSION_CATALOG,
  hasPageAccess,
} from "../config/adminPermissions";
import { verifyUser } from "./user.middleware";

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  // Check if user is authenticated (verifyUser should be called first)
  if (!user) {
    return next(new AppError("Authentication required", 401));
  }

  // Check if user is admin or super-admin
  if (user.userType !== "admin" && user.userType !== "super-admin") {
    return next(new AppError("Admin access required", 403));
  }

  next();
};

/**
 * Restricts a route to super-admins only. Use for the admin-access management
 * endpoints. Assumes `verifyUser` has already populated `req.user`.
 */
export const verifySuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return next(new AppError("Authentication required", 401));
  }

  if (user.userType !== "super-admin") {
    return next(new AppError("Super admin access required", 403));
  }

  next();
};

export const requirePermission =
  (pageKey: string) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    // Super-admin bypasses all page checks.
    if (user.userType === "super-admin") {
      return next();
    }

    // Only admins can hold page permissions; anything else is denied.
    if (user.userType !== "admin") {
      return next(new AppError("Admin access required", 403));
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    if (hasPageAccess(permissions, pageKey)) {
      return next();
    }

    return next(
      new AppError("You don't have access to this section", 403)
    );
  };

/**
 * Like {@link requirePermission} but passes when the admin holds ANY of the
 * given page keys. Use for endpoints shared across pages (e.g. an instructor
 * lookup used by both course management and user management), so holding either
 * page is enough.
 */
export const requireAnyPermission =
  (...pageKeys: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }
    if (user.userType === "super-admin") {
      return next();
    }
    if (user.userType !== "admin") {
      return next(new AppError("Admin access required", 403));
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    if (pageKeys.some((key) => hasPageAccess(permissions, key))) {
      return next();
    }

    return next(new AppError("You don't have access to this section", 403));
  };

/**
 * Passes when the admin can access ANY page within a section (or holds the bare
 * section key), or is super-admin. Use for read-only lookups shared across a
 * section's pages — e.g. the internship list/detail is consumed by the
 * Manage Internships, Live Meetings, and Enrollments pages alike, so any
 * internship-section admin should be able to read it.
 */
export const requireSectionAccess =
  (sectionKey: string) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required", 401));
    }
    if (user.userType === "super-admin") {
      return next();
    }
    if (user.userType !== "admin") {
      return next(new AppError("Admin access required", 403));
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const section = ADMIN_PERMISSION_CATALOG.find((s) => s.key === sectionKey);
    const pageKeys = section
      ? section.pages.map((p) => p.key)
      : [sectionKey];
    const ok =
      permissions.includes(sectionKey) ||
      pageKeys.some((key) => permissions.includes(key));

    if (ok) {
      return next();
    }
    return next(new AppError("You don't have access to this section", 403));
  };

/**
 * Standard admin route guard chain for a single page permission. Spread into a
 * route definition so authorization lives right next to the handler:
 *
 *   router.get("/admin", ...adminGuard("courses.manage"), getAdminCourses);
 *
 * Equivalent to `verifyUser, verifyAdmin, requirePermission(pageKey)`.
 */
export const adminGuard = (pageKey: string): RequestHandler[] => [
  verifyUser,
  verifyAdmin,
  requirePermission(pageKey),
];

/** Like adminGuard, but a marketer or sales person with this page granted also passes. */
export const staffGuard = (pageKey: string): RequestHandler[] => [
  verifyUser,
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(new AppError("Authentication required", 401));
    if (user.userType === "super-admin") return next();
    const staff = ["admin", "marketer", "sales"].includes(String(user.userType));
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    if (staff && hasPageAccess(permissions, pageKey)) return next();
    return next(new AppError("You don't have access to this page", 403));
  },
];
