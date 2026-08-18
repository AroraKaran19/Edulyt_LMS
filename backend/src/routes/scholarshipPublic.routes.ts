import { Router } from "express";
import {
  beginAttempt,
  claimPhoneSend,
  finishAttempt,
  getAttempt,
  getPublicCampaign,
  getResult,
  pingCampaignView,
  putAnswer,
  requestOtp,
  sessionFromAccount,
  verifyOtp,
  verifyPhone,
} from "../controllers/scholarshipPublic.controller";
import { requireScholarshipSession } from "../middlewares/scholarshipSession.middleware";
import { verifyUser } from "../middlewares/user.middleware";

/**
 * The public face of a scholarship campaign. Every route here is
 * unauthenticated by design: the whole point is acquiring people who do not
 * have an account yet.
 *
 * Routes below `/:slug/attempt` and `/:slug/result` are gated by
 * `requireScholarshipSession`, which resolves the bearer token issued at OTP
 * verify. `testId` and `email` always come from that session, never from the
 * request body.
 */
const router = Router();

/**
 * @route   GET /api/scholarship/:slug
 * @desc    Public campaign view plus its live/scheduled/ended state
 * @access  Public
 */
router.get("/:slug", getPublicCampaign);

/**
 * @route   POST /api/scholarship/:slug/view
 * @desc    Approximate top-of-funnel ping, bucketed by IST day
 * @access  Public
 */
router.post("/:slug/view", pingCampaignView);

/**
 * @route   POST /api/scholarship/:slug/otp
 * @desc    Email a six digit code. Throttled per email and per IP.
 * @access  Public
 */
router.post("/:slug/otp", requestOtp);

/**
 * @route   POST /api/scholarship/:slug/otp/verify
 * @desc    Exchange a code for a session token
 * @access  Public
 */
router.post("/:slug/otp/verify", verifyOtp);

/**
 * @route   POST /api/scholarship/:slug/session
 * @desc    Skip the email gate: a signed-in account already proved its address
 * @access  Signed in
 */
router.post("/:slug/session", verifyUser, sessionFromAccount);

/**
 * @route   POST /api/scholarship/:slug/phone/otp-request
 * @desc    Claim one SMS against the session and per-IP budgets. The widget
 *          sends from the browser, so this is what meters it.
 * @access  Verified session
 */
router.post(
  "/:slug/phone/otp-request",
  requireScholarshipSession,
  claimPhoneSend,
);

/**
 * @route   POST /api/scholarship/:slug/phone/verify
 * @desc    Prove a mobile number with an MSG91 widget token
 * @access  Verified session
 */
router.post("/:slug/phone/verify", requireScholarshipSession, verifyPhone);

/**
 * @route   GET /api/scholarship/:slug/attempt
 * @desc    Resume an in-progress attempt, or null
 * @access  Verified session
 */
router.get("/:slug/attempt", requireScholarshipSession, getAttempt);

/**
 * @route   POST /api/scholarship/:slug/attempt
 * @desc    Start an attempt, freezing the paper and the clock
 * @access  Verified session
 */
router.post("/:slug/attempt", requireScholarshipSession, beginAttempt);

/**
 * @route   PATCH /api/scholarship/:slug/attempt/answer
 * @desc    Autosave one answer
 * @access  Verified session
 */
router.patch("/:slug/attempt/answer", requireScholarshipSession, putAnswer);

/**
 * @route   POST /api/scholarship/:slug/attempt/submit
 * @desc    Finish the test and receive the coupon
 * @access  Verified session
 */
router.post("/:slug/attempt/submit", requireScholarshipSession, finishAttempt);

/**
 * @route   GET /api/scholarship/:slug/result
 * @desc    The coupon this email already earned, or null
 * @access  Verified session
 *
 * The recovery path: nothing emails the coupon, so this is the only way back to
 * it for anyone who closed the tab.
 */
router.get("/:slug/result", requireScholarshipSession, getResult);

export default router;
