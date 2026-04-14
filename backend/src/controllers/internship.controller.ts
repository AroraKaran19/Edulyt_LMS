import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  listInternshipsPublicService,
  listFeaturedInternshipsPublicService,
  listInternshipsAdminService,
  getInternshipByIdAdminService,
  getInternshipBySlugService,
  checkSlugAvailabilityService,
  createInternshipService,
  updateInternshipService,
  deleteInternshipService,
} from "../services/internship.services";

/**
 * @route   GET /api/internships
 * @desc    List active internships (public, paginated + search + audience filter)
 * @access  Public
 */
export const listInternshipsPublic = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, audience } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const aud =
      audience === "college-students" || audience === "professionals"
        ? audience
        : undefined;
    const result = await listInternshipsPublicService(
      p,
      l,
      typeof search === "string" ? search : undefined,
      aud
    );
    sendSuccessResponse(
      res,
      result,
      "Internships fetched successfully",
      200
    );
  }
);

/**
 * @route   GET /api/internships/featured
 * @desc    List active, featured internships (public, paginated + search + audience)
 * @access  Public
 */
export const listFeaturedInternshipsPublic = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, audience } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const aud =
      audience === "college-students" || audience === "professionals"
        ? audience
        : undefined;
    const result = await listFeaturedInternshipsPublicService(
      p,
      l,
      typeof search === "string" ? search : undefined,
      aud
    );
    sendSuccessResponse(
      res,
      result,
      "Featured internships fetched successfully",
      200
    );
  }
);

/**
 * @route   GET /api/internships/admin
 * @desc    List all internships (admin, paginated + filters)
 * @access  Admin
 */
export const listInternshipsAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, isActive, audience, featured } =
      req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    let activeFilter: boolean | undefined;
    if (isActive === "true") activeFilter = true;
    else if (isActive === "false") activeFilter = false;

    const aud =
      audience === "college-students" || audience === "professionals"
        ? audience
        : undefined;

    let featuredFilter: boolean | undefined;
    if (featured === "true") featuredFilter = true;
    else if (featured === "false") featuredFilter = false;

    const result = await listInternshipsAdminService(
      p,
      l,
      typeof search === "string" ? search : undefined,
      activeFilter,
      aud,
      featuredFilter
    );
    sendSuccessResponse(
      res,
      result,
      "Internships fetched successfully",
      200
    );
  }
);

/**
 * @route   GET /api/internships/admin/id/:id
 * @desc    Get internship by ID (admin, populated)
 * @access  Admin
 */
export const getInternshipAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Internship ID is required", 400);
    const internship = await getInternshipByIdAdminService(id);
    if (!internship) throw new AppError("Internship not found", 404);
    sendSuccessResponse(
      res,
      internship,
      "Internship fetched successfully",
      200
    );
  }
);

/**
 * @route   GET /api/internships/slug/:slug
 * @desc    Get internship by slug (public, populated)
 * @access  Public
 */
export const getInternshipBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug || !slug.trim()) {
      throw new AppError("Slug is required", 400);
    }
    const internship = await getInternshipBySlugService(slug.trim());
    if (!internship) throw new AppError("Internship not found", 404);
    sendSuccessResponse(
      res,
      internship,
      "Internship fetched successfully",
      200
    );
  }
);

/**
 * @route   GET /api/internships/check-slug/:slug
 * @desc    Check slug availability (optional excludeId query param)
 * @access  Private
 */
export const checkSlugAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { excludeId } = req.query;
    if (!slug || !slug.trim()) {
      throw new AppError("Slug is required", 400);
    }
    const result = await checkSlugAvailabilityService(
      slug.trim().toLowerCase(),
      typeof excludeId === "string" ? excludeId : undefined
    );
    sendSuccessResponse(res, result, "Slug check completed", 200);
  }
);

/**
 * @route   POST /api/internships/metadata
 * @desc    Create internship (metadata + batches)
 * @access  Admin
 */
export const createInternship = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    if (!userId) throw new AppError("User not authenticated", 401);

    const { title, slug, description, thumbnail } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new AppError("Internship title is required", 400);
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
      throw new AppError("Slug is required", 400);
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      throw new AppError("Description is required", 400);
    }
    if (!thumbnail || typeof thumbnail !== "string" || !thumbnail.trim()) {
      throw new AppError("Thumbnail is required", 400);
    }

    // Check slug availability
    const slugCheck = await checkSlugAvailabilityService(
      slug.trim().toLowerCase()
    );
    if (!slugCheck.available) {
      throw new AppError("Slug is already in use", 400);
    }

    const internship = await createInternshipService(req.body, String(userId));
    sendSuccessResponse(
      res,
      internship,
      "Internship created successfully",
      201
    );
  }
);

/**
 * @route   PUT /api/internships/:id/metadata
 * @desc    Update internship (metadata)
 * @access  Admin
 */
export const updateInternship = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Internship ID is required", 400);

    // If slug is being updated, check availability
    if (req.body.slug) {
      const slugCheck = await checkSlugAvailabilityService(
        req.body.slug.trim().toLowerCase(),
        id
      );
      if (!slugCheck.available) {
        throw new AppError("Slug is already in use", 400);
      }
    }

    const userId = (req as any).user?._id;
    if (!userId) throw new AppError("User not authenticated", 401);

    const internship = await updateInternshipService(
      id,
      req.body,
      String(userId)
    );
    if (!internship) throw new AppError("Internship not found", 404);
    sendSuccessResponse(
      res,
      internship,
      "Internship updated successfully",
      200
    );
  }
);

/**
 * @route   DELETE /api/internships/:id
 * @desc    Delete internship
 * @access  Admin
 */
export const deleteInternship = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("Internship ID is required", 400);
    const ok = await deleteInternshipService(id);
    if (!ok) throw new AppError("Internship not found", 404);
    sendSuccessResponse(
      res,
      { deleted: true },
      "Internship deleted successfully",
      200
    );
  }
);
