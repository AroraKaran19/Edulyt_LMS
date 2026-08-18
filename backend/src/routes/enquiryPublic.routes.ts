import { Router } from "express";
import {
  claimEnquiryPhoneSend,
  getEnquirySession,
  requestEnquiryOtp,
  verifyEnquiryOtp,
  verifyEnquiryPhone,
} from "../controllers/enquiryPublic.controller";
import { requireEnquirySession } from "../middlewares/enquirySession.middleware";

/**
 * Verification for the enquiry form. Unauthenticated by design: most visitors
 * arrive from an ad with no account, and the whole point is proving the address
 * and number they hand the sales team are theirs.
 */
const router = Router();

/**
 * @route   POST /api/enquiry/otp
 * @desc    Email a six digit code. Throttled per email.
 * @access  Public
 */
router.post("/otp", requestEnquiryOtp);

/**
 * @route   POST /api/enquiry/otp/verify
 * @desc    Exchange a code for a session token
 * @access  Public
 */
router.post("/otp/verify", verifyEnquiryOtp);

/**
 * @route   POST /api/enquiry/session
 * @desc    Resume a session after a reload, so no code is re-sent
 * @access  Public
 */
router.post("/session", getEnquirySession);

/**
 * @route   POST /api/enquiry/phone/otp-request
 * @desc    Claim one SMS against the session budget. The widget sends from the
 *          browser, so this is what meters it.
 * @access  Verified session
 */
router.post("/phone/otp-request", requireEnquirySession, claimEnquiryPhoneSend);

/**
 * @route   POST /api/enquiry/phone/verify
 * @desc    Prove a mobile number with an MSG91 widget token
 * @access  Verified session
 */
router.post("/phone/verify", requireEnquirySession, verifyEnquiryPhone);

export default router;
