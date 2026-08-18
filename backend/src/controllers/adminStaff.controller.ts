import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import { Request, Response } from "express";
import {
  listAdminsService,
  createAdminService,
  promoteUserToAdminService,
  updateAdminPermissionsService,
  revokeAdminService,
} from "../services/adminStaff.services";

/**
 * @route   GET /api/admin/staff/admins
 * @desc    List all admin (and super-admin) accounts, paginated
 * @access  Super-admin
 * @query   page, limit
 */
export const listAdminsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await listAdminsService(Number(page), Number(limit));
    sendSuccessResponse(res, result, "Admins fetched successfully", 200);
  },
);

/** Staff can be an admin or a marketer, so the copy has to name which. */
const roleLabel = (role?: string): string =>
  role === "marketer" ? "Marketer" : "Admin";

/**
 * @route   POST /api/admin/staff/admins
 * @desc    Create a new staff account: an admin with page permissions, or a marketer
 * @access  Super-admin
 */
export const createAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const admin = await createAdminService(req.body);
    sendSuccessResponse(
      res,
      admin,
      `${roleLabel(req.body?.role)} created successfully`,
      201,
    );
  },
);

/**
 * @route   POST /api/admin/staff/admins/promote
 * @desc    Promote an existing user to admin or marketer
 * @access  Super-admin
 */
export const promoteUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, permissions, role } = req.body;
    const admin = await promoteUserToAdminService(email, permissions, role);
    sendSuccessResponse(
      res,
      admin,
      `User promoted to ${roleLabel(role).toLowerCase()}`,
      200,
    );
  },
);

/**
 * @route   PATCH /api/admin/staff/admins/:adminId/permissions
 * @desc    Replace an admin's page permissions
 * @access  Super-admin
 */
export const updateAdminPermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { adminId } = req.params;
    const { permissions } = req.body;
    const admin = await updateAdminPermissionsService(adminId, permissions);
    sendSuccessResponse(res, admin, "Permissions updated successfully", 200);
  },
);

/**
 * @route   POST /api/admin/staff/admins/:adminId/revoke
 * @desc    Revoke an admin (demote to student, clear permissions)
 * @access  Super-admin
 */
export const revokeAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { adminId } = req.params;
    const admin = await revokeAdminService(adminId);
    sendSuccessResponse(res, admin, "Admin access revoked", 200);
  },
);
