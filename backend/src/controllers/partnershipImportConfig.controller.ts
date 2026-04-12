import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  createPartnershipImportConfigService,
  deletePartnershipImportConfigService,
  getPartnershipImportConfigByIdService,
  listPartnershipImportConfigsService,
  updatePartnershipImportConfigService,
} from "../services/partnershipImportConfig.services";
import type { PartnershipImportConfig } from "../types/partnershipImportConfig";

export const listPartnershipImportConfigs = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || "";
    const isActive =
      req.query.isActive === "true"
        ? true
        : req.query.isActive === "false"
          ? false
          : undefined;

    const result = await listPartnershipImportConfigsService(
      page,
      limit,
      search,
      isActive
    );
    sendSuccessResponse(res, result, "Partnership import configs", 200);
  }
);

export const getPartnershipImportConfigById = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId } = req.params;
    const doc = await getPartnershipImportConfigByIdService(
      partnershipImportConfigId
    );
    if (!doc) {
      throw new AppError("Partnership import config not found", 404);
    }
    sendSuccessResponse(res, doc, "Partnership import config", 200);
  }
);

export const createPartnershipImportConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const createdBy = req.user?._id ? String(req.user._id) : undefined;
    const body = req.body as Partial<PartnershipImportConfig>;
    const doc = await createPartnershipImportConfigService(body, createdBy);
    sendSuccessResponse(res, doc, "Partnership import config created", 201);
  }
);

export const updatePartnershipImportConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId } = req.params;
    const body = req.body as Partial<PartnershipImportConfig>;
    const doc = await updatePartnershipImportConfigService(
      partnershipImportConfigId,
      body
    );
    if (!doc) {
      throw new AppError("Partnership import config not found", 404);
    }
    sendSuccessResponse(res, doc, "Partnership import config updated", 200);
  }
);

export const deletePartnershipImportConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId } = req.params;
    const ok = await deletePartnershipImportConfigService(
      partnershipImportConfigId
    );
    if (!ok) {
      throw new AppError("Partnership import config not found", 404);
    }
    sendSuccessResponse(res, { deleted: true }, "Deleted", 200);
  }
);
