import { Router } from "express";
import {
  claimEnquiryPhoneSend,
  getEnquirySession,
  requestEnquiryOtp,
  startEnquirySession,
  verifyEnquiryOtp,
  verifyEnquiryPhone,
} from "../controllers/enquiryPublic.controller";
import { requireEnquirySession } from "../middlewares/enquirySession.middleware";
import { requireRecaptcha } from "../middlewares/recaptcha.middleware";

/**
 * Verification for the enquiry form. Unauthenticated by design: most visitors
 * arrive from an ad with no account, and the whole point is proving the address
 * and number they hand the sales team are theirs.
 */
const router = Router();

/**
 * @route   POST /api/enquiry/start
 * @desc    Open a session from a typed email, no code. The captcha is the only
 *          thing standing between a script and this form's SMS budget, so it
 *          stays even though nothing is mailed.
 * @access  Public, one solved reCAPTCHA per session
 */
router.post("/start", requireRecaptcha, startEnquirySession);

/**
 * @route   POST /api/enquiry/otp
 * @desc    Email a six digit code. Throttled per email, and behind a captcha
 *          because the per-email throttle says nothing about a script working
 *          through a list of addresses.
 *
 *          The enquiry form does not call this: it opens sessions through
 *          /start and proves the number only. Kept mounted so turning the email
 *          step back on is a frontend change.
 * @access  Public, one solved reCAPTCHA per send
 */
router.post("/otp", requireRecaptcha, requestEnquiryOtp);

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
