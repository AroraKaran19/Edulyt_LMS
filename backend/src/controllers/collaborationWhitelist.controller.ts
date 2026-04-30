import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import type {
  CollaborationWhitelistImportMode,
  CollaborationWhitelistStatus,
} from "../types/collaborationWhitelist";
import {
  deleteCollaborationWhitelistEntryService,
  getCollaborationWhitelistStatsService,
  importCollaborationWhitelistService,
  listCollaborationWhitelistService,
  retryCollaborationWhitelistEntryService,
  updateCollaborationWhitelistEntryService,
} from "../services/collaborationWhitelist.services";

const parseImportRows = (body: Record<string, unknown>) => {
  const rowsRaw = body.rows;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) {
    throw new AppError(
      "Provide `rows`: array of { email, studentName?, studentId? }",
      400
    );
  }
  return rowsRaw.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      email: String(row.email ?? ""),
      studentName: row.studentName != null ? String(row.studentName) : undefined,
      studentId: row.studentId != null ? String(row.studentId) : undefined,
    };
  });
};

export const getCollaborationWhitelistStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId } = req.params;
    const stats = await getCollaborationWhitelistStatsService(
      partnershipImportConfigId
    );
    sendSuccessResponse(res, stats, "Whitelist stats", 200);
  }
);

export const listCollaborationWhitelist = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || "";
    const status = req.query.status as CollaborationWhitelistStatus | undefined;

    const result = await listCollaborationWhitelistService(partnershipImportConfigId, {
      page,
      limit,
      search: search || undefined,
      status:
        status &&
        [
          "pending",
          "queued",
          "enrolled",
          "benefit_applied",
          "failed",
          "expired",
        ].includes(status)
          ? status
          : undefined,
    });

    sendSuccessResponse(res, result, "Whitelist entries", 200);
  }
);

export const importCollaborationWhitelist = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId } = req.params;
    const mode = (req.body?.mode || "append") as CollaborationWhitelistImportMode;
    if (mode !== "append" && mode !== "replace") {
      throw new AppError("mode must be append or replace", 400);
    }

    const rows = parseImportRows(req.body as Record<string, unknown>);
    const addedBy = req.user?._id ? String(req.user._id) : undefined;

    const result = await importCollaborationWhitelistService(
      partnershipImportConfigId,
      rows,
      mode,
      addedBy
    );

    sendSuccessResponse(
      res,
      result,
      "Whitelist import completed",
      200
    );
  }
);

export const updateCollaborationWhitelistEntry = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId, entryId } = req.params;
    const body = req.body as Record<string, unknown>;

    const doc = await updateCollaborationWhitelistEntryService(
      partnershipImportConfigId,
      entryId,
      {
        email: body.email != null ? String(body.email) : undefined,
        studentName:
          body.studentName === null
            ? null
            : body.studentName != null
              ? String(body.studentName)
              : undefined,
        studentId:
          body.studentId === null
            ? null
            : body.studentId != null
              ? String(body.studentId)
              : undefined,
        isActive:
          typeof body.isActive === "boolean" ? body.isActive : undefined,
        status: body.status as CollaborationWhitelistStatus | undefined,
        notes:
          body.notes === null
            ? null
            : body.notes != null
              ? String(body.notes)
              : undefined,
        expiresAt:
          body.expiresAt === null
            ? null
            : body.expiresAt
              ? new Date(String(body.expiresAt))
              : undefined,
      }
    );

    if (!doc) {
      throw new AppError("Whitelist entry not found", 404);
    }

    sendSuccessResponse(res, doc, "Whitelist entry updated", 200);
  }
);

export const deleteCollaborationWhitelistEntry = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId, entryId } = req.params;
    const ok = await deleteCollaborationWhitelistEntryService(
      partnershipImportConfigId,
      entryId
    );
    if (!ok) {
      throw new AppError("Whitelist entry not found", 404);
    }
    sendSuccessResponse(res, { deleted: true }, "Whitelist entry deleted", 200);
  }
);

export const retryCollaborationWhitelistEntry = asyncHandler(
  async (req: Request, res: Response) => {
    const { partnershipImportConfigId, entryId } = req.params;
    const doc = await retryCollaborationWhitelistEntryService(
      partnershipImportConfigId,
      entryId
    );
    if (!doc) {
      throw new AppError("Whitelist entry not found", 404);
    }
    sendSuccessResponse(res, doc, "Whitelist entry retry scheduled", 200);
  }
);
