import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  Actor,
  ListFilters,
  createScholarshipTest,
  deleteScholarshipTest,
  getScholarshipTestById,
  listScholarshipTests,
  previewScholarshipTestDeletion,
  updateScholarshipTest,
} from "../services/scholarshipTest.services";

const LIST_STATUSES = new Set(["live", "paused"]);

const actorOf = (req: Request): Actor => {
  const user = req.user;
  if (!user?._id) throw new AppError("Authentication required", 401);
  return {
    id: String(user._id),
    userType: String(user.userType),
    name:
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email,
  };
};

const numberOr = (raw: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const createCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = actorOf(req);
    const body = req.body ?? {};
    // `createdBy` is taken from the session, never the body: otherwise a
    // role-gated staff member could plant a campaign under someone else's name.
    const created = await createScholarshipTest(
      {
        title: body.title,
        description: body.description,
        questionIds: Array.isArray(body.questionIds) ? body.questionIds : [],
        durationMinutes: Number(body.durationMinutes),
        attemptsAllowed: Number(body.attemptsAllowed ?? 1),
        discountPercent: Number(body.discountPercent),
        couponValidForDays: Number(body.couponValidForDays),
        isActive: body.isActive,
      },
      actor.id,
      actor.name,
    );
    sendSuccessResponse(res, created, "Campaign created", 201);
  },
);

export const listCampaigns = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = actorOf(req);
    const q = req.query ?? {};
    const status = String(q.status ?? "");
    const filters: ListFilters = {
      status: LIST_STATUSES.has(status)
        ? (status as ListFilters["status"])
        : undefined,
      search: q.search ? String(q.search) : undefined,
      mine: String(q.mine ?? "") === "true",
      page: numberOr(q.page, 1),
      limit: numberOr(q.limit, 20),
    };
    const result = await listScholarshipTests(filters, actor);
    sendSuccessResponse(res, result, "Campaigns fetched");
  },
);

export const getCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await getScholarshipTestById(
    String(req.params.id),
    actorOf(req),
  );
  sendSuccessResponse(res, campaign, "Campaign fetched");
});

export const updateCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body ?? {};
    // Whitelist: title, slug, discount, and duration are immutable, so
    // they are dropped here rather than silently ignored deeper down.
    const patch: Record<string, unknown> = {};
    if (body.description !== undefined) patch.description = body.description;
    if (body.couponValidForDays !== undefined) {
      patch.couponValidForDays = Number(body.couponValidForDays);
    }
    if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);
    if (body.questions !== undefined) patch.questions = body.questions;

    const updated = await updateScholarshipTest(
      String(req.params.id),
      patch,
      actorOf(req),
    );
    sendSuccessResponse(res, updated, "Campaign updated");
  },
);

export const previewCampaignDeletion = asyncHandler(
  async (req: Request, res: Response) => {
    const preview = await previewScholarshipTestDeletion(
      String(req.params.id),
      actorOf(req),
    );
    sendSuccessResponse(res, preview, "Deletion preview");
  },
);

export const deleteCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    await deleteScholarshipTest(String(req.params.id), actorOf(req));
    sendSuccessResponse(res, null, "Campaign deleted");
  },
);
