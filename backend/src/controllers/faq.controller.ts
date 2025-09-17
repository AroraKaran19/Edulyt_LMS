import { Request, Response } from "express";
import { asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQsByIds
} from "../services/faq.service";

/**
 * Get all FAQs with pagination and search
 * @route GET /api/faqs
 * @access Public
 * @param req Request object
 * @param res Response object
 */
export const getAllFAQsController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = ""
    } = req.query;

    const result = await getAllFAQs(
      Number(page),
      Number(limit),
      String(search)
    );

    sendSuccessResponse(
      res,
      result,
      "FAQs fetched successfully"
    );
  }
);

/**
 * Get FAQ by ID
 * @route GET /api/faqs/:id
 * @access Public
 * @param req Request object
 * @param res Response object
 */
export const getFAQByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const faq = await getFAQById(id);

    sendSuccessResponse(
      res,
      faq,
      "FAQ fetched successfully"
    );
  }
);

/**
 * Create a new FAQ
 * @route POST /api/faqs
 * @access Admin
 * @param req Request object
 * @param res Response object
 */
export const createFAQController = asyncHandler(
  async (req: Request, res: Response) => {
    const { question, answer } = req.body;

    const newFAQ = await createFAQ({
      question,
      answer
    });

    sendSuccessResponse(
      res,
      newFAQ,
      "FAQ created successfully",
      201
    );
  }
);

/**
 * Update an existing FAQ
 * @route PUT /api/faqs/:id
 * @access Admin
 * @param req Request object
 * @param res Response object
 */
export const updateFAQController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { question, answer } = req.body;

    const updatedFAQ = await updateFAQ(id, {
      question,
      answer
    });

    sendSuccessResponse(
      res,
      updatedFAQ,
      "FAQ updated successfully"
    );
  }
);

/**
 * Delete an FAQ
 * @route DELETE /api/faqs/:id
 * @access Admin
 * @param req Request object
 * @param res Response object
 */
export const deleteFAQController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await deleteFAQ(id);

    sendSuccessResponse(
      res,
      result,
      "FAQ deleted successfully"
    );
  }
);

/**
 * Get FAQs by IDs (for course FAQ selection)
 * @route POST /api/faqs/by-ids
 * @access Public
 * @param req Request object
 * @param res Response object
 */
export const getFAQsByIdsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { ids } = req.body;

    const faqs = await getFAQsByIds(ids);

    sendSuccessResponse(
      res,
      faqs,
      "FAQs fetched successfully"
    );
  }
);
