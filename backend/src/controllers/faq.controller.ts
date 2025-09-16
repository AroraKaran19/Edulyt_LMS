import { Request, Response } from "express";
import {
  getAllFAQs as getAllFAQsService,
  getFAQById as getFAQByIdService,
  createFAQ as createFAQService,
  updateFAQ as updateFAQService,
  deleteFAQ as deleteFAQService,
  searchFAQs as searchFAQsService,
  bulkCreateFAQs as bulkCreateFAQsService,
} from "../services/faq.service";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";

/**
 * Get all FAQs with pagination
 */
export const getAllFAQs = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search } = req.query;

    const faqs = await getAllFAQsService(
      Number(page),
      Number(limit),
      search as string
    );

    sendSuccessResponse(res, faqs, "FAQs retrieved successfully", 200);
  }
);

/**
 * Get FAQ by ID
 */
export const getFAQById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { faqId } = req.params;

    if (!faqId) {
      throw new AppError("FAQ ID is required", 400);
    }

    const faq = await getFAQByIdService(faqId);

    if (!faq) {
      throw new AppError("FAQ not found", 404);
    }

    sendSuccessResponse(res, { faq }, "FAQ retrieved successfully", 200);
  }
);

/**
 * Create a new FAQ
 */
export const createFAQ = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const faqData = req.body;

    if (!faqData) {
      throw new AppError("FAQ data is required", 400);
    }

    console.log("📝 Creating FAQ:", {
      question: faqData.question?.substring(0, 50) + "...",
      answerLength: faqData.answer?.length
    });

    const result = await createFAQService(faqData);

    sendSuccessResponse(
      res,
      { faqId: result.faqId },
      result.message,
      201
    );
  }
);

/**
 * Update FAQ
 */
export const updateFAQ = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { faqId } = req.params;
    const updateData = req.body;

    if (!faqId) {
      throw new AppError("FAQ ID is required", 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError("Update data is required", 400);
    }

    console.log("📝 Updating FAQ:", faqId);

    const result = await updateFAQService(faqId, updateData);

    sendSuccessResponse(
      res,
      { faqId, updated: true },
      result.message,
      200
    );
  }
);

/**
 * Delete FAQ
 */
export const deleteFAQ = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { faqId } = req.params;

    if (!faqId) {
      throw new AppError("FAQ ID is required", 400);
    }

    console.log("🗑️ Deleting FAQ:", faqId);

    const result = await deleteFAQService(faqId);

    sendSuccessResponse(
      res,
      { faqId, deleted: true },
      result.message,
      200
    );
  }
);

/**
 * Search FAQs
 */
export const searchFAQs = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { q: searchTerm, limit = 10 } = req.query;

    if (!searchTerm) {
      throw new AppError("Search term (q) is required", 400);
    }

    console.log("🔍 Searching FAQs for:", searchTerm);

    const faqs = await searchFAQsService(
      searchTerm as string,
      Number(limit)
    );

    sendSuccessResponse(
      res,
      { faqs, total: faqs.length },
      "FAQs search completed successfully",
      200
    );
  }
);

/**
 * Bulk create FAQs
 */
export const bulkCreateFAQs = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { faqs } = req.body;

    if (!faqs || !Array.isArray(faqs)) {
      throw new AppError("FAQs array is required", 400);
    }

    console.log(`📝 Bulk creating ${faqs.length} FAQs`);

    const result = await bulkCreateFAQsService(faqs);

    sendSuccessResponse(
      res,
      {
        createdCount: result.createdCount,
        totalRequested: faqs.length,
        errors: result.errors.length > 0 ? result.errors : undefined
      },
      `Successfully created ${result.createdCount} out of ${faqs.length} FAQs`,
      201
    );
  }
);

/**
 * Get FAQ statistics
 */
export const getFAQStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const totalFAQs = await getAllFAQsService(1, 1);
    
    sendSuccessResponse(
      res,
      {
        totalFAQs: totalFAQs.total,
        totalPages: totalFAQs.totalPages
      },
      "FAQ statistics retrieved successfully",
      200
    );
  }
);
