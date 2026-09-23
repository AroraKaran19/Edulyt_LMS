import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { requireStaffPageAccess } from "../middlewares/staffAccess.middleware";
import {
  addMyAmbassador,
  getCrmAnalyticsController,
  getMyCrmLeadsController,
  listCrmPeopleController,
  listPersonLeadsController,
  getCrmPersonController,
  listPersonAmbassadorsController,
  getCrmLeaderboard,
  getMyCrmProfile,
  getMyCrmStats,
  listMyAmbassadors,
  listMyScholarshipOptions,
  removeMyAmbassador,
  requireCrmOwner,
  updateMyExtraQuestion,
  updateMyLinkSettings,
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
 * @route   GET /api/crm/me/leads?page=&limit=
 * @desc    The caller's own leads, name-masked and stripped of contact fields
 * @access  Marketer, sales, campus ambassador
 */
router.get("/me/leads", getMyCrmLeadsController);

/**
 * @route   PATCH /api/crm/me/questions
 * @desc    Replace the caller's extra questions (max 2)
 * @access  Marketer, sales, and an ambassador whose owner allows it
 */
// Not requireCrmOwner: an ambassador may set their own while their owner
// allows it, which the controller checks against the parent's profile.
router.patch("/me/questions", updateMyExtraQuestion);

/**
 * @route   PATCH /api/crm/me/link-settings
 * @desc    Plan prices and attached scholarship for this member's links
 * @access  Marketer, sales
 */
router.patch("/me/link-settings", requireCrmOwner, updateMyLinkSettings);

/**
 * @route   GET /api/crm/me/scholarship-options
 * @desc    The caller's own campaigns, for the attach pickers
 * @access  Marketer, sales
 */
router.get("/me/scholarship-options", requireCrmOwner, listMyScholarshipOptions);

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
 * @route   GET /api/crm/people/:id
 * @desc    One staff member's header row and counts
 * @access  Admin with `crm.team`, super-admin
 */
router.get(
  "/people/:id",
  requireStaffPageAccess("crm.team"),
  getCrmPersonController,
);

/**
 * @route   GET /api/crm/people/:id/ambassadors?page=&limit=
 * @desc    The ambassadors this staff member has added
 * @access  Admin with `crm.team`, super-admin
 */
router.get(
  "/people/:id/ambassadors",
  requireStaffPageAccess("crm.team"),
  listPersonAmbassadorsController,
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
