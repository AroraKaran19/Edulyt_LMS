import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler, sendSuccessResponse, AppError } from "../middlewares/error.middleware";
import { importLeads, type ImportRow } from "../services/leadImport.services";
import { generateLeadImportTemplateBuffer } from "../services/leadImportTemplate.services";

const MAX_ROWS = 2000;

/**
 * @desc  Download the .xlsx template (with dropdowns) for the lead importer
 * @route GET /api/admin/leads/import/template
 * @access Admin with `leads.import`, super-admin
 */
export const downloadLeadImportTemplateController = asyncHandler(
  async (_req: Request, res: Response) => {
    const buffer = await generateLeadImportTemplateBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="lead-import-template.xlsx"',
    );
    res.send(buffer);
  },
);

/**
 * @desc  Validate and insert leads parsed client-side from an Excel upload
 * @route POST /api/admin/leads/import
 * @access Admin with `leads.import`, super-admin
 */
export const importLeadsController = asyncHandler(async (req: Request, res: Response) => {
  const { fileName, dryRun, rows } = req.body ?? {};

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError("No rows to import", 400);
  }
  if (rows.length > MAX_ROWS) {
    throw new AppError(`Import is limited to ${MAX_ROWS} rows at a time`, 400);
  }

  const importedBy = {
    userId: req.user?._id ? new mongoose.Types.ObjectId(String(req.user._id)) : null,
    name:
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ").trim() || "",
  };

  const result = await importLeads(rows as ImportRow[], {
    fileName: String(fileName ?? "").trim().slice(0, 200),
    dryRun: dryRun === true,
    importedBy,
  });

  sendSuccessResponse(res, result, "Import processed", 200);
});
