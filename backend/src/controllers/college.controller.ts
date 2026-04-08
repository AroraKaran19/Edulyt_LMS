import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createCollegeService,
  deleteCollegeService,
  getCollegeByIdService,
  listCollegesAdminService,
  listCollegesPublicService,
  updateCollegeService,
} from "../services/college.services";

export const listCollegesPublic = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 50, search } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const result = await listCollegesPublicService(
      p,
      l,
      typeof search === "string" ? search : undefined
    );
    sendSuccessResponse(res, result, "Colleges fetched successfully", 200);
  }
);

export const listCollegesAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    let activeFilter: boolean | undefined;
    if (isActive === "true") activeFilter = true;
    else if (isActive === "false") activeFilter = false;

    const result = await listCollegesAdminService(
      p,
      l,
      typeof search === "string" ? search : undefined,
      activeFilter
    );
    sendSuccessResponse(res, result, "Colleges fetched successfully", 200);
  }
);

export const getCollegeAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("College id is required", 400);
    const college = await getCollegeByIdService(id);
    if (!college) throw new AppError("College not found", 404);
    sendSuccessResponse(res, college, "College fetched successfully", 200);
  }
);

const requireNonEmptyLocation = (location: unknown): string => {
  if (typeof location !== "string" || !location.trim()) {
    throw new AppError("College location is required", 400);
  }
  return location.trim();
};

export const createCollege = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, location, isActive } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("College name is required", 400);
    }
    const loc = requireNonEmptyLocation(location);
    const college = await createCollegeService({
      name,
      location: loc,
      isActive,
    });
    sendSuccessResponse(res, college, "College created successfully", 201);
  }
);

export const updateCollege = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("College id is required", 400);
    const { name, location, isActive } = req.body;
    const loc = requireNonEmptyLocation(location);
    const college = await updateCollegeService(id, {
      name,
      location: loc,
      isActive,
    });
    if (!college) throw new AppError("College not found", 404);
    sendSuccessResponse(res, college, "College updated successfully", 200);
  }
);

export const deleteCollege = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new AppError("College id is required", 400);
    const ok = await deleteCollegeService(id);
    if (!ok) throw new AppError("College not found", 404);
    sendSuccessResponse(
      res,
      { deleted: true },
      "College deleted successfully",
      200
    );
  }
);
