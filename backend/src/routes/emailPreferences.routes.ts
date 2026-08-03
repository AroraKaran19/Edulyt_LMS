import {
  getMyEmailPreferences,
  resubscribeToEmails,
  unsubscribeFromEmails,
  updateMyEmailPreferences,
} from "../controllers/emailPreferences.controller";
import { verifyUser } from "../middlewares/user.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/email-preferences/me
 * @desc    Current opt-in state for every category
 * @access  Private
 */
router.get("/me", verifyUser, getMyEmailPreferences);

/**
 * @route   PATCH /api/email-preferences/me
 * @desc    Toggle categories from account settings
 * @access  Private
 */
router.patch("/me", verifyUser, updateMyEmailPreferences);

/**
 * Public by design: the caller is holding an emailed link, not a session.
 * Authorisation is the HMAC in the link, which is scoped to one user and one
 * category and can do nothing else.
 *
 * @route   POST /api/email-preferences/unsubscribe
 * @desc    Switch off one category of non-essential email
 * @access  Public (signed link)
 */
router.post("/unsubscribe", unsubscribeFromEmails);

/**
 * @route   POST /api/email-preferences/resubscribe
 * @desc    Undo an unsubscribe, for the misclick case
 * @access  Public (signed link)
 */
router.post("/resubscribe", resubscribeToEmails);

export default router;
