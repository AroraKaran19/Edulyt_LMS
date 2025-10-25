import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createFAQService,
  deleteFAQService,
  getAllFAQsService,
  getFAQByIdService,
  updateFAQService,
} from "../services/faq.services";

export const getAllFAQ = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const isAdmin = req.user?.userType === "admin";

  if (Number(page) < 1 || Number(limit) < 1) {
    throw new AppError("Page and limit must be positive numbers", 400);
  }

  const result = await getAllFAQsService(
    Number(page),
    Number(limit),
    String(search),
    isAdmin
  );

  if (!result || result.faqs.length === 0) {
    sendSuccessResponse(res, [], "No FAQs found", 200);
    return;
  }

  sendSuccessResponse(res, result, "FAQs fetched successfully", 200);
  return;
});

export const getFAQById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user?.userType === "admin";
  
  if (!id) {
    throw new AppError("FAQ ID is required", 400);
  }

  const result = await getFAQByIdService(id, isAdmin);
  if (!result) {
    sendSuccessResponse(res, [], "FAQ not found", 200);
    return;
  }

  sendSuccessResponse(res, result, "FAQ fetched successfully", 200);
  return;
});

export const createFAQ = asyncHandler(async (req: Request, res: Response) => {
  const { question, answer } = req.body;
  if (!question && !answer) {
    throw new AppError("Question and answer are required", 400);
  }

  const result = await createFAQService(question, answer);
  if (!result) {
    throw new AppError("Failed to create FAQ", 500);
  }

  sendSuccessResponse(res, result, "FAQ created successfully", 201);
  return;
});

export const updateFAQ = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { question, answer } = req.body;
  if (!id) {
    throw new AppError("FAQ ID is required", 400);
  }
  if (!question && !answer) {
    throw new AppError("Question and answer are required", 400);
  }

  const result = await updateFAQService(id, { question, answer });
  if (!result) {
    throw new AppError("Failed to update FAQ", 500);
  }

  sendSuccessResponse(res, result, "FAQ updated successfully", 200);
  return;
});

export const deleteFAQ = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError("FAQ ID is required", 400);
  }

  const result = await deleteFAQService(id);
  if (!result) {
    throw new AppError("Failed to delete FAQ", 500);
  }

  sendSuccessResponse(res, result, "FAQ deleted successfully", 200);
  return;
});
