import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { requireStaffPageAccess } from "../middlewares/staffAccess.middleware";
import {
  addMyAmbassador,
  getCrmAnalyticsController,
  listCrmPeopleController,
  listPersonLeadsController,
  getCrmLeaderboard,
  getMyCrmProfile,
  getMyCrmStats,
  listMyAmbassadors,
  removeMyAmbassador,
  requireCrmOwner,
  updateMyExtraQuestion,
} from "../controllers/crmProfile.controller";

const router = Router();

router.use(verifyUser);

/**
 * @route   GET /api/crm/me
 * @desc    The caller's own code, minted on first call
 * @access  Marketer, sales, campus ambassador
 */
router.get("/me", getMyCrmProfile);

/**
 * @route   GET /api/crm/me/stats?from=&to=
 * @desc    The caller's own numbers
 * @access  Marketer, sales, campus ambassador
 */
router.get("/me/stats", getMyCrmStats);

/**
 * @route   PATCH /api/crm/me/question
 * @desc    Set or clear the one extra question on the caller's form
 * @access  Marketer, sales
 */
router.patch("/me/question", requireCrmOwner, updateMyExtraQuestion);

/**
 * @route   GET /api/crm/leaderboard?from=&to=
 * @desc    Top creators and closers over a date range
 * @access  Admin, super-admin
 */
router.get(
  "/leaderboard",
  requireStaffPageAccess("crm.analytics"),
  getCrmLeaderboard,
);

/**
 * @route   GET /api/crm/analytics?from=&to=
 * @desc    Company-wide lead analytics
 * @access  Admin with `crm.analytics`, super-admin
 */
router.get(
  "/analytics",
  requireStaffPageAccess("crm.analytics"),
  getCrmAnalyticsController,
  listCrmPeopleController,
  listPersonLeadsController,
);

/**
 * @route   GET /api/crm/people
 * @desc    Every marketer and sales person with their counts
 * @access  Admin with `crm.team`, super-admin
 */
router.get("/people", requireStaffPageAccess("crm.team"), listCrmPeopleController);

/**
 * @route   GET /api/crm/people/:id/leads?scope=&page=
 * @desc    One person's leads, in full
 * @access  Admin with `crm.team`, super-admin
 */
router.get(
  "/people/:id/leads",
  requireStaffPageAccess("crm.team"),
  listPersonLeadsController,
);

/**
 * @route   GET /api/crm/me/ambassadors
 * @desc    The caller's ambassador roster
 * @access  Marketer, sales
 */
router.get("/me/ambassadors", requireCrmOwner, listMyAmbassadors);

/**
 * @route   POST /api/crm/me/ambassadors
 * @desc    Attach an existing student as an ambassador
 * @access  Marketer, sales
 */
router.post("/me/ambassadors", requireCrmOwner, addMyAmbassador);

/**
 * @route   DELETE /api/crm/me/ambassadors/:id
 * @desc    Remove an ambassador from the caller's roster
 * @access  Marketer, sales
 */
router.delete("/me/ambassadors/:id", requireCrmOwner, removeMyAmbassador);

export default router;
