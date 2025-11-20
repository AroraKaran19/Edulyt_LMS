import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createAuthenticationMediaService,
  deleteAuthenticationMediaService,
  getAllAuthenticationMediaService,
  getAuthenticationMediaByIdService,
  updateAuthenticationMediaService,
  reorderAuthenticationMediaService,
} from "../services/authentication-media.services";
import {
  CreateAuthenticationMediaData,
  UpdateAuthenticationMediaData,
} from "../types/authentication-media";

export const getAllAuthenticationMedia = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAllAuthenticationMediaService(
      Number(page),
      Number(limit)
    );

    if (!result || result.media.length === 0) {
      sendSuccessResponse(res, [], "No authentication media found", 200);
      return;
    }

    sendSuccessResponse(
      res,
      result,
      "Authentication media fetched successfully",
      200
    );
    return;
  }
);

export const getAuthenticationMediaById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Authentication media ID is required", 400);
    }

    const result = await getAuthenticationMediaByIdService(id);

    if (!result) {
      throw new AppError("Authentication media not found", 404);
    }

    sendSuccessResponse(
      res,
      result,
      "Authentication media fetched successfully",
      200
    );
    return;
  }
);

export const createAuthenticationMedia = asyncHandler(
  async (req: Request, res: Response) => {
    const { imageUrl, order, link } = req.body;

    if (!imageUrl) {
      throw new AppError("Image URL is required", 400);
    }

    if (order === undefined || order === null) {
      throw new AppError("Order is required", 400);
    }

    const mediaData: CreateAuthenticationMediaData = {
      imageUrl,
      order: Number(order),
      link: link || undefined,
    };

    const result = await createAuthenticationMediaService(mediaData);

    if (!result) {
      throw new AppError("Failed to create authentication media", 500);
    }

    sendSuccessResponse(
      res,
      result,
      "Authentication media created successfully",
      201
    );
    return;
  }
);

export const updateAuthenticationMedia = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { imageUrl, order, link } = req.body;

    if (!id) {
      throw new AppError("Authentication media ID is required", 400);
    }

    const updateData: UpdateAuthenticationMediaData = {};

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    if (order !== undefined && order !== null) {
      updateData.order = Number(order);
    }

    if (link !== undefined) {
      updateData.link = link || undefined;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("At least one field is required for update", 400);
    }

    const result = await updateAuthenticationMediaService(id, updateData);

    if (!result) {
      throw new AppError("Authentication media not found", 404);
    }

    sendSuccessResponse(
      res,
      result,
      "Authentication media updated successfully",
      200
    );
    return;
  }
);

export const deleteAuthenticationMedia = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Authentication media ID is required", 400);
    }

    const result = await deleteAuthenticationMediaService(id);

    if (!result) {
      throw new AppError("Authentication media not found", 404);
    }

    sendSuccessResponse(
      res,
      { id },
      "Authentication media deleted successfully",
      200
    );
    return;
  }
);

export const reorderAuthenticationMedia = asyncHandler(
  async (req: Request, res: Response) => {
    const { mediaIds } = req.body;

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      throw new AppError(
        "mediaIds must be a non-empty array of media IDs",
        400
      );
    }

    const result = await reorderAuthenticationMediaService(mediaIds);

    sendSuccessResponse(
      res,
      result,
      "Authentication media reordered successfully",
      200
    );
    return;
  }
);

