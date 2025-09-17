import { Request, Response } from "express";
import { asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import {
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialsByIds,
  getVerifiedTestimonials,
} from "../services/testimonial.service";

/**
 * Get all testimonials with pagination and search
 * @route GET /api/testimonials
 * @access Public
 * @param req Request object
 * @param res Response object
 */
export const getAllTestimonialsController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = ""
    } = req.query;

    const result = await getAllTestimonials(
      Number(page),
      Number(limit),
      String(search)
    );

    sendSuccessResponse(
      res,
      result,
      "Testimonials fetched successfully"
    );
  }
);

/**
 * Get testimonial by ID
 * @route GET /api/testimonials/:id
 * @access Public
 * @param req Request object
 * @param res Response object
 */
export const getTestimonialByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const testimonial = await getTestimonialById(id);

    sendSuccessResponse(
      res,
      testimonial,
      "Testimonial fetched successfully"
    );
  }
);

/**
 * Create a new testimonial
 * @route POST /api/testimonials
 * @access Admin
 * @param req Request object
 * @param res Response object
 */
export const createTestimonialController = asyncHandler(
  async (req: Request, res: Response) => {
    const testimonialData = req.body;

    const newTestimonial = await createTestimonial(testimonialData);

    sendSuccessResponse(
      res,
      newTestimonial,
      "Testimonial created successfully",
      201
    );
  }
);

/**
 * Update an existing testimonial
 * @route PUT /api/testimonials/:id
 * @access Admin
 * @param req Request object
 * @param res Response object
 */
export const updateTestimonialController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTestimonial = await updateTestimonial(id, updateData);

    sendSuccessResponse(
      res,
      updatedTestimonial,
      "Testimonial updated successfully"
    );
  }
);

/**
 * Delete a testimonial
 * @route DELETE /api/testimonials/:id
 * @access Admin
 * @param req Request object
 * @param res Response object
 */
export const deleteTestimonialController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await deleteTestimonial(id);

    sendSuccessResponse(
      res,
      result,
      "Testimonial deleted successfully"
    );
  }
);

/**
 * Get testimonials by IDs (for course testimonial selection)
 * @route POST /api/testimonials/by-ids
 * @access Public
 * @param req Request object
 * @param res Response object
 */
export const getTestimonialsByIdsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;

    const testimonials = await getTestimonialsByIds(ids);

    sendSuccessResponse(
      res,
      testimonials,
      "Testimonials fetched successfully"
    );
  }
);

/**
 * Get verified testimonials only
 * @route GET /api/testimonials/verified
 * @access Public
 * @param req Request object
 * @param res Response object
 */
export const getVerifiedTestimonialsController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10
    } = req.query;

    const result = await getVerifiedTestimonials(
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(
      res,
      result,
      "Verified testimonials fetched successfully"
    );
  }
);
