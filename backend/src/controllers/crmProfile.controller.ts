import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  attachAmbassador,
  canOwnAmbassadors,
  crmRoleOf,
  detachAmbassador,
  canSetExtraQuestion,
  type CrmRole,
  ensureCrmCode,
  listAmbassadors,
  resolveCrmCode,
} from "../services/crmProfile.services";
import {
  getCrmAnalytics,
  getCrmStats,
  getLeaderboards,
  listCrmPeople,
  listLeadsForPerson,
  getCrmPerson,
  listAmbassadorsForPerson,
  type PersonLeadScope,
} from "../services/crmReporting.services";
import { UserModel } from "../models/user.schema";

const actorId = (req: Request): mongoose.Types.ObjectId => {
  const id = req.user?._id;
  if (!id) throw new AppError("Authentication required", 401);
  return new mongoose.Types.ObjectId(String(id));
};

/**
 * The caller's CRM role, or null when they are not in the programme.
 *
 * Staff are members by virtue of their userType. A student is a member only
 * because a marketer or sales person attached them, and that attach is what
 * created their code, so reading an endpoint must never enrol one.
 */
const memberRoleOf = (req: Request): CrmRole | null => {
  const u = req.user;
  if (!u) return null;
  if (canOwnAmbassadors(u.userType)) return crmRoleOf(u.userType, true);
  const enrolled = Boolean(u.crmCode && u.crmCodeActive !== false);
  return crmRoleOf(u.userType, enrolled, u.crmAmbassadorKind);
};

/** Gate for the roster routes: only staff who can recruit reach them. */
export const requireCrmOwner = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }
  if (!canOwnAmbassadors(req.user.userType)) {
    return next(new AppError("You don't have access to this section", 403));
  }
  return next();
};

/**
 * @route GET /api/crm/me
 * @desc  The caller's own code, minted on first call
 */
export const getMyCrmProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const role = memberRoleOf(req);
    if (!role) {
      throw new AppError("You don't have access to this section", 403);
    }

    const isStaff = canOwnAmbassadors(req.user?.userType);
    // Staff mint on first visit; an ambassador already has the code their
    // attach created.
    const code = isStaff
      ? await ensureCrmCode(actorId(req))
      : (req.user?.crmCode as string);

    sendSuccessResponse(
      res,
      { code, role, canOwnAmbassadors: isStaff },
      "CRM profile fetched",
      200,
    );
  },
);

/**
 * @route GET /api/crm/me/ambassadors
 * @desc  The caller's ambassador roster
 */
export const listMyAmbassadors = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const result = await listAmbassadors(actorId(req), page, limit);
    sendSuccessResponse(res, result, "Ambassadors fetched", 200);
  },
);

/**
 * @route POST /api/crm/me/ambassadors
 * @desc  Attach an existing student as an ambassador under the caller
 */
export const addMyAmbassador = asyncHandler(
  async (req: Request, res: Response) => {
    const added = await attachAmbassador(
      actorId(req),
      req.body?.email,
      req.body?.kind,
    );
    sendSuccessResponse(res, added, "Ambassador added", 201);
  },
);

/**
 * @route DELETE /api/crm/me/ambassadors/:id
 * @desc  Remove an ambassador from the caller's roster
 */
export const removeMyAmbassador = asyncHandler(
  async (req: Request, res: Response) => {
    await detachAmbassador(actorId(req), String(req.params.id));
    sendSuccessResponse(res, { removed: true }, "Ambassador removed", 200);
  },
);

/**
 * @route  GET /api/crm-public/resolve?code=X
 * @desc   Confirms a shared code and names its owner, for the public form
 * @access Public
 *
 * Always 200. A 404 here would tempt the page into an error state, when the
 * correct behaviour for a retired code is to render normally and capture the
 * lead unattributed.
 */
export const resolvePublicCrmCode = asyncHandler(
  async (req: Request, res: Response) => {
    const resolved = await resolveCrmCode(String(req.query.code ?? ""));
    sendSuccessResponse(
      res,
      // Deliberately not the userId or the role: the page needs neither, and
      // this endpoint is unauthenticated.
      resolved
        ? {
            code: resolved.code,
            name: resolved.name,
            question: resolved.question ?? null,
          }
        : null,
      "Code resolved",
      200,
    );
  },
);

const parseRange = (req: Request) => {
  const from = String(req.query.from ?? "").trim();
  const to = String(req.query.to ?? "").trim();
  return {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };
};

/**
 * @route  GET /api/crm/me/stats?from=&to=
 * @desc   The caller's generated, team, assigned and converted counts
 * @access Marketer, sales, campus ambassador
 */
export const getMyCrmStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!memberRoleOf(req)) {
      throw new AppError("You don't have access to this section", 403);
    }
    const stats = await getCrmStats(actorId(req), parseRange(req));
    sendSuccessResponse(res, stats, "Stats fetched", 200);
  },
);

/**
 * @route  GET /api/crm/leaderboard?from=&to=
 * @desc   Top creators and closers over a date range
 * @access Admin, super-admin
 */
export const getCrmLeaderboard = asyncHandler(
  async (req: Request, res: Response) => {
    const boards = await getLeaderboards(parseRange(req));
    sendSuccessResponse(res, boards, "Leaderboard fetched", 200);
  },
);

/**
 * @route  GET /api/crm/analytics?from=&to=
 * @desc   Company-wide lead analytics with the leaderboards
 * @access Admin with `crm.analytics`, super-admin
 */
export const getCrmAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const range = parseRange(req);
    const [analytics, leaderboards] = await Promise.all([
      getCrmAnalytics(range),
      getLeaderboards(range, 10),
    ]);
    sendSuccessResponse(
      res,
      { ...analytics, leaderboards },
      "Analytics fetched",
      200,
    );
  },
);

/**
 * @route  GET /api/crm/people?page=&limit=&search=
 * @desc   Every marketer and sales person with their counts
 * @access Admin with `crm.team`, super-admin
 */
export const listCrmPeopleController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const search = String(req.query.search ?? "").trim();
    sendSuccessResponse(
      res,
      await listCrmPeople(page, limit, search),
      "People fetched",
      200,
    );
  },
);

const LEAD_SCOPES: PersonLeadScope[] = [
  "generated",
  "team",
  "assigned",
  "converted",
];

/**
 * @route  GET /api/crm/people/:id/leads?scope=&page=
 * @desc   One person's leads, in full
 * @access Admin with `crm.team`, super-admin
 */
export const listPersonLeadsController = asyncHandler(
  async (req: Request, res: Response) => {
    const raw = String(req.query.scope ?? "generated");
    const scope = LEAD_SCOPES.includes(raw as PersonLeadScope)
      ? (raw as PersonLeadScope)
      : "generated";
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    sendSuccessResponse(
      res,
      await listLeadsForPerson(String(req.params.id), scope, page, limit),
      "Leads fetched",
      200,
    );
  },
);

/**
 * @route  GET /api/crm/people/:id
 * @desc   One staff member's header row and counts
 * @access Admin with `crm.team`, super-admin
 */
export const getCrmPersonController = asyncHandler(
  async (req: Request, res: Response) => {
    const person = await getCrmPerson(String(req.params.id));
    if (!person) throw new AppError("This person was not found", 404);
    sendSuccessResponse(res, person, "Person fetched", 200);
  },
);

/**
 * @route  GET /api/crm/people/:id/ambassadors?page=&limit=
 * @desc   The ambassadors this staff member has added
 * @access Admin with `crm.team`, super-admin
 */
export const listPersonAmbassadorsController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    sendSuccessResponse(
      res,
      await listAmbassadorsForPerson(String(req.params.id), page, limit),
      "Ambassadors fetched",
      200,
    );
  },
);

/**
 * @route  PATCH /api/crm/me/question
 * @desc   Set or clear the one extra question on the caller's form
 * @access Marketer, sales
 */
export const updateMyExtraQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    if (!canSetExtraQuestion(req.user?.userType)) {
      throw new AppError("You don't have access to this section", 403);
    }

    const { enabled, label, type, options, required } = req.body ?? {};

    if (!enabled) {
      await UserModel.updateOne(
        { _id: actorId(req) },
        { $unset: { crmExtraQuestion: "" } },
      );
      sendSuccessResponse(res, { question: null }, "Question cleared", 200);
      return;
    }

    const cleanLabel = String(label ?? "").trim();
    if (cleanLabel.length < 3) {
      throw new AppError("Give the question a label", 400);
    }
    const cleanType = type === "select" ? "select" : "text";
    const cleanOptions = (Array.isArray(options) ? options : [])
      .map((o: unknown) => String(o ?? "").trim())
      .filter(Boolean)
      .slice(0, 20);
    if (cleanType === "select" && cleanOptions.length < 2) {
      throw new AppError("A dropdown needs at least two options", 400);
    }

    // Derived server-side and namespaced, so a chosen label can never collide
    // with a built-in answer key such as `college` or `plan`.
    const key = `extra_${cleanLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40)}`;

    const question = {
      enabled: true,
      key,
      label: cleanLabel.slice(0, 200),
      type: cleanType,
      options: cleanType === "select" ? cleanOptions : [],
      required: Boolean(required),
    };

    await UserModel.updateOne(
      { _id: actorId(req) },
      { $set: { crmExtraQuestion: question } },
    );
    sendSuccessResponse(res, { question }, "Question saved", 200);
  },
);
