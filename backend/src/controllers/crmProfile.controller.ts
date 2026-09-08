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
  ensureCrmProfile,
  listAmbassadors,
  MAX_EXTRA_QUESTIONS,
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
import { CrmProfileModel } from "../models/crmProfile.schema";

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
 *
 * Async because an ambassador's enrolment lives on their profile now. It used
 * to read `req.user`, which `verifyUser` no longer populates with CRM fields,
 * and it read them through a local alias so a search for `user.crm` missed it.
 */
const memberRoleOf = async (req: Request): Promise<CrmRole | null> => {
  const u = req.user;
  if (!u) return null;
  if (canOwnAmbassadors(u.userType)) return crmRoleOf(u.userType, true);

  const profile = await CrmProfileModel.findOne(
    { userId: u._id },
    { code: 1, codeActive: 1, ambassadorKind: 1 },
  ).lean();
  const enrolled = Boolean(profile?.code && profile.codeActive !== false);
  return crmRoleOf(u.userType, enrolled, profile?.ambassadorKind);
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
    const role = await memberRoleOf(req);
    if (!role) {
      throw new AppError("You don't have access to this section", 403);
    }

    const isStaff = canOwnAmbassadors(req.user?.userType);
    // Staff mint on first visit; an ambassador already has the code their
    // attach created, now read from their profile rather than from req.user.
    let code: string;
    if (isStaff) {
      code = await ensureCrmCode(actorId(req));
    } else {
      const profile = await CrmProfileModel.findOne(
        { userId: actorId(req) },
        { code: 1 },
      ).lean();
      code = (profile?.code ?? "") as string;
    }

    // Everyone needs their own questions back, or the editor opens empty and
    // the next save silently wipes what they had. The two link settings are
    // staff-only: an ambassador's link follows their marketer's, resolved
    // publicly rather than shown to them here.
    const settings = await CrmProfileModel.findOne(
      { userId: actorId(req) },
      {
        hidePlanPrices: 1,
        hideAmbassadorPlanPrices: 1,
        allowAmbassadorQuestions: 1,
        extraQuestions: 1,
        parentUserId: 1,
      },
    ).lean();

    // An ambassador may edit their own only while their owner permits it.
    const canSetQuestions = isStaff || (await canSetOwnQuestions(req));

    sendSuccessResponse(
      res,
      {
        code,
        role,
        canOwnAmbassadors: isStaff,
        hidePlanPrices: isStaff && Boolean(settings?.hidePlanPrices),
        hideAmbassadorPlanPrices:
          isStaff && Boolean(settings?.hideAmbassadorPlanPrices),
        allowAmbassadorQuestions:
          isStaff && Boolean(settings?.allowAmbassadorQuestions),
        questions: settings?.extraQuestions ?? [],
        canSetQuestions,
      },
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
      // Deliberately not the userId, the role or the price setting: the page
      // needs none of them, and this endpoint is unauthenticated. Prices are
      // decided server side by the pricing endpoint, so no flag travels.
      resolved
        ? {
            code: resolved.code,
            name: resolved.name,
            questions: resolved.questions,
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
    // Awaited: `memberRoleOf` became async when an ambassador's enrolment moved
    // to CrmProfile, and an un-awaited Promise is always truthy, which silently
    // disabled this guard.
    if (!(await memberRoleOf(req))) {
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
 * Validates and normalises one submitted question.
 *
 * The key is derived server-side and namespaced, so a chosen label can never
 * collide with a built-in answer key such as `college` or `plan`.
 */
const cleanQuestion = (raw: unknown) => {
  const q = (raw ?? {}) as Record<string, unknown>;

  const label = String(q.label ?? "").trim();
  if (label.length < 3) {
    throw new AppError("Give the question a label", 400);
  }

  const type = q.type === "select" ? "select" : "text";
  const options = (Array.isArray(q.options) ? q.options : [])
    .map((o: unknown) => String(o ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
  if (type === "select" && options.length < 2) {
    throw new AppError("A dropdown needs at least two options", 400);
  }

  const key = `extra_${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)}`;

  return {
    enabled: true,
    key,
    label: label.slice(0, 200),
    type,
    options: type === "select" ? options : [],
    required: Boolean(q.required),
  };
};

/**
 * Whether the caller may set questions of their own.
 *
 * Staff always may. A campus ambassador may only while their current owner
 * allows it, which is read at request time so revoking it takes effect on the
 * ambassador's next save without touching their roster.
 */
const canSetOwnQuestions = async (req: Request): Promise<boolean> => {
  if (canSetExtraQuestion(req.user?.userType)) return true;

  const own = await CrmProfileModel.findOne(
    { userId: actorId(req) },
    { parentUserId: 1 },
  ).lean();
  if (!own?.parentUserId) return false;

  const parent = await CrmProfileModel.findOne(
    { userId: own.parentUserId },
    { allowAmbassadorQuestions: 1 },
  ).lean();
  return Boolean(parent?.allowAmbassadorQuestions);
};

/**
 * @route  PATCH /api/crm/me/questions
 * @desc   Replace the caller's extra questions, up to MAX_EXTRA_QUESTIONS
 * @access Marketer, sales, and an ambassador whose owner allows it
 */
export const updateMyExtraQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    if (!(await canSetOwnQuestions(req))) {
      throw new AppError("You don't have access to this section", 403);
    }

    const raw = Array.isArray(req.body?.questions) ? req.body.questions : [];
    if (raw.length > MAX_EXTRA_QUESTIONS) {
      throw new AppError(
        `You can ask at most ${MAX_EXTRA_QUESTIONS} extra questions`,
        400,
      );
    }

    const questions = raw.map(cleanQuestion);

    // Two labels can slugify to the same key, which would put two answers under
    // one key on the lead and make them indistinguishable in the CRM. Rejected
    // rather than auto-suffixed, so the keys stay meaningful.
    if (new Set(questions.map((q) => q.key)).size !== questions.length) {
      throw new AppError("Two questions cannot have the same label", 400);
    }

    // Opened first, because a marketer may never have minted a code and this
    // endpoint must not start doing that as a side effect.
    await ensureCrmProfile(actorId(req));
    await CrmProfileModel.updateOne(
      { userId: actorId(req) },
      { $set: { extraQuestions: questions } },
    );

    sendSuccessResponse(res, { questions }, "Questions saved", 200);
  },
);

/**
 * @route  PATCH /api/crm/me/link-settings
 * @desc   Toggle whether this member's enquiry link shows plan prices
 * @access Marketer, sales
 *
 * Ambassadors are deliberately excluded: their link follows whoever currently
 * owns them, resolved from the parent at request time.
 */
export const updateMyLinkSettings = asyncHandler(
  async (req: Request, res: Response) => {
    if (!canSetExtraQuestion(req.user?.userType)) {
      throw new AppError("You don't have access to this section", 403);
    }

    const hidePlanPrices = Boolean(req.body?.hidePlanPrices);
    const hideAmbassadorPlanPrices = Boolean(
      req.body?.hideAmbassadorPlanPrices,
    );
    const allowAmbassadorQuestions = Boolean(req.body?.allowAmbassadorQuestions);

    await ensureCrmProfile(actorId(req));
    await CrmProfileModel.updateOne(
      { userId: actorId(req) },
      {
        $set: {
          hidePlanPrices,
          hideAmbassadorPlanPrices,
          allowAmbassadorQuestions,
        },
      },
    );

    sendSuccessResponse(
      res,
      { hidePlanPrices, hideAmbassadorPlanPrices, allowAmbassadorQuestions },
      "Link settings saved",
      200,
    );
  },
);
