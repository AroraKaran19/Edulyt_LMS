import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler, sendSuccessResponse, AppError } from "../middlewares/error.middleware";
import { importLeads, type ImportRow } from "../services/leadImport.services";
import { generateLeadImportTemplateBuffer } from "../services/leadImportTemplate.services";
import {
  createLeadImportJob,
  getLeadImportJob,
  listLeadImportJobs,
} from "../services/leadImportJob.services";

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

const readImportBody = (req: Request) => {
  const { fileName, rows } = req.body ?? {};
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError("No rows to import", 400);
  }
  if (rows.length > MAX_ROWS) {
    throw new AppError(`Import is limited to ${MAX_ROWS} rows at a time`, 400);
  }
  return {
    rows: rows as ImportRow[],
    fileName: String(fileName ?? "").trim().slice(0, 200),
    importedBy: {
      userId: req.user?._id ? new mongoose.Types.ObjectId(String(req.user._id)) : null,
      name: [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ").trim() || "",
    },
  };
};

/**
 * @desc  Validate rows parsed client-side from an Excel upload, writing nothing
 * @route POST /api/admin/leads/import/preview
 * @access Admin with `leads.import`, super-admin
 */
export const previewLeadImportController = asyncHandler(async (req: Request, res: Response) => {
  const { rows, fileName, importedBy } = readImportBody(req);
  const result = await importLeads(rows, { fileName, dryRun: true, importedBy });
  sendSuccessResponse(res, result, "Preview ready", 200);
});

/**
 * @desc  Queue an import; the worker inserts it in the background, one job at a time
 * @route POST /api/admin/leads/import/jobs
 * @access Admin with `leads.import`, super-admin
 */
export const createLeadImportJobController = asyncHandler(async (req: Request, res: Response) => {
  const { rows, fileName, importedBy } = readImportBody(req);
  const result = await createLeadImportJob(rows, fileName, importedBy);
  sendSuccessResponse(res, result, "Import queued", 201);
});

/**
 * @desc  Import history, newest first
 * @route GET /api/admin/leads/import/jobs
 * @access Admin with `leads.import`, super-admin
 */
export const listLeadImportJobsController = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  sendSuccessResponse(res, await listLeadImportJobs(page, limit), "Imports", 200);
});

/**
 * @desc  One import with its flagged and failed rows
 * @route GET /api/admin/leads/import/jobs/:id
 * @access Admin with `leads.import`, super-admin
 */
export const getLeadImportJobController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await getLeadImportJob(String(req.params.id)), "Import", 200);
});
