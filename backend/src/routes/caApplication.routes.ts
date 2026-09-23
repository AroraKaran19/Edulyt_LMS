import { Router } from "express";
import { requireBrand } from "../middlewares/brand.middleware";
import { attachUserIfPresent, verifyUser } from "../middlewares/user.middleware";
import { requireVerifiedLeadContact } from "../middlewares/verifiedLeadContact.middleware";
import { requireStaffPageAccess } from "../middlewares/staffAccess.middleware";
import {
  approveCaApplicationController,
  changeCaApplicationDurationController,
  changeCaApplicationOwnerController,
  declineCaApplicationController,
  forcePassCaApplicationController,
  getCaApplicationController,
  listCaApplicationsController,
  listCaOwnersController,
  listCaTeamApplicationsController,
  revealCaApplicationController,
  retryCaDocumentsController,
  setCaCompletionHoldController,
  submitCaApplicationController,
} from "../controllers/caApplication.controller";

const router = Router();

/**
 * @route   POST /api/ca-applications
 * @desc    Submit a Campus Ambassador application
 * @access  Proved phone: a contact-session token, or a signed-in user whose
 *          verified number matches
 */
router.post(
  "/",
  requireBrand("airkrit"),
  attachUserIfPresent,
  requireVerifiedLeadContact,
  submitCaApplicationController,
);

const staff = [verifyUser, requireStaffPageAccess("crm.ca-leads")];

/**
 * @route   GET /api/ca-applications
 * @desc    Open applications. Marketers and sales see only their own referrals.
 * @access  Admin with `crm.ca-leads`, super-admin, marketer, sales
 */
router.get("/", ...staff, listCaApplicationsController);

/**
 * @route   GET /api/ca-applications/owners
 * @desc    Marketers and sales people, for the referrer filter and team picker
 * @access  Admin with `crm.ca-leads`, super-admin
 */
router.get("/owners", ...staff, listCaOwnersController);

/**
 * @route   GET /api/ca-applications/team?ownerUserId=
 * @desc    Attached CAs of one team. Marketers and sales always get their own.
 */
router.get("/team", ...staff, listCaTeamApplicationsController);

/**
 * @route   GET /api/ca-applications/:id
 * @desc    One application, without its encrypted fields
 */
router.get("/:id", ...staff, getCaApplicationController);

/**
 * @route   POST /api/ca-applications/:id/reveal
 * @desc    The decrypted payout details. POST so nothing caches it.
 * @access  Admin with `crm.ca-leads`, super-admin
 */
router.post("/:id/reveal", ...staff, revealCaApplicationController);

/**
 * @route   POST /api/ca-applications/:id/approve
 * @desc    Approve, pick the kind (and the team, for admins), and attach
 */
router.post("/:id/approve", ...staff, approveCaApplicationController);

/**
 * @route   DELETE /api/ca-applications/:id
 * @desc    Decline. Deletes the application and its encrypted fields.
 */
router.delete("/:id", ...staff, declineCaApplicationController);

/**
 * @route   PATCH /api/ca-applications/:id/owner
 * @desc    Move an approved, not yet attached application to another team
 * @access  Admin with `crm.ca-leads`, super-admin
 */
router.patch("/:id/owner", ...staff, changeCaApplicationOwnerController);

/**
 * @route   PATCH /api/ca-applications/:id/duration
 * @desc    Change one CA's duration; the end date is recomputed
 * @access  Admin with `crm.ca-leads`, super-admin
 */
router.patch("/:id/duration", ...staff, changeCaApplicationDurationController);

/**
 * @route   PATCH /api/ca-applications/:id/hold
 * @desc    Hold or release the end-of-tenure documents
 * @access  Admin with `crm.ca-leads`, super-admin, or the CA's current owner
 */
router.patch("/:id/hold", ...staff, setCaCompletionHoldController);

/**
 * @route   POST /api/ca-applications/:id/force-pass
 * @desc    Admin overrides the points gate for one CA's completion documents
 * @access  Admin with `crm.ca-leads`, super-admin
 */
router.post("/:id/force-pass", ...staff, forcePassCaApplicationController);

/**
 * @route   POST /api/ca-applications/:id/documents/retry
 * @desc    Re-run document jobs that used up their automatic retries
 * @access  Admin with `crm.ca-leads`, super-admin
 */
router.post("/:id/documents/retry", ...staff, retryCaDocumentsController);

export default router;
