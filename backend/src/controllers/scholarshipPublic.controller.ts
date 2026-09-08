import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  claimScholarshipPhoneSend,
  requestScholarshipOtp,
  startSessionForAccount,
  verifyScholarshipOtp,
  verifyScholarshipPhone,
} from "../services/scholarshipOtp.services";
import {
  getResultForEmail,
  resumeAttempt,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from "../services/scholarshipAttempt.services";
import { captureScholarshipLead } from "../services/scholarshipLead.services";
import {
  getPublicCampaignBySlug,
  recordCampaignView,
} from "../services/scholarshipTest.services";
import {
  EMAIL_OTP_DISABLED_MESSAGE,
  EMAIL_OTP_ENABLED,
} from "../config/featureFlags";

/**
 * Public, unauthenticated campaign endpoints. Nothing here calls `verifyUser`:
 * every route is reachable by anyone on the internet, which is the point.
 */

const sessionOf = (req: Request) => {
  const session = req.scholarshipSession;
  if (!session) throw new AppError("Verify your email again to continue", 401);
  return session;
};

/**
 * Both channels have to be proved before a test starts. Enforced here rather
 * than trusted from the UI, since these routes are reachable by anyone.
 */
const fullyVerified = (req: Request) => {
  const session = sessionOf(req);
  if (!session.phoneVerified) {
    throw new AppError("Verify your mobile number to continue", 403);
  }
  return session;
};

export const getPublicCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    const campaign = await getPublicCampaignBySlug(String(req.params.slug));
    sendSuccessResponse(res, campaign, "Campaign fetched");
  },
);

export const pingCampaignView = asyncHandler(
  async (req: Request, res: Response) => {
    // Fire and forget: `recordCampaignView` never throws, so an unknown slug
    // or a mongo hiccup cannot fail a page load.
    await recordCampaignView(String(req.params.slug));
    sendSuccessResponse(res, null, "ok");
  },
);

export const requestOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await requestScholarshipOtp(
    String(req.params.slug),
    String(req.body?.email ?? ""),
  );
  sendSuccessResponse(res, result, "Code sent");
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  if (!EMAIL_OTP_ENABLED) {
    throw new AppError(EMAIL_OTP_DISABLED_MESSAGE, 400);
  }

  const result = await verifyScholarshipOtp(
    String(req.params.slug),
    String(req.body?.email ?? ""),
    String(req.body?.otp ?? ""),
  );
  sendSuccessResponse(res, result, "Verified");
});

/**
 * Signed-in shortcut past the email gate. Requires `verifyUser`, so `req.user`
 * is always present here, and the address is read from the account rather than
 * from the body.
 */
export const sessionFromAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const email = req.user?.email;
    if (!email) throw new AppError("Sign in again to continue", 401);
    // A profile number is already proved, so it carries into the session and
    // the candidate is not asked for it again.
    const profilePhone = req.user?.phoneVerifiedAt ? req.user?.phone : null;
    const result = await startSessionForAccount(
      String(req.params.slug),
      String(email),
      req.user?._id,
      profilePhone ?? null,
    );
    sendSuccessResponse(res, result, "Verified from your account");
  },
);

/**
 * Books an SMS before the browser widget is allowed to send one. The widget
 * dispatches client-side, so this is the only place a send can be metered.
 */
export const claimPhoneSend = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await claimScholarshipPhoneSend(
      sessionOf(req).id,
      req.body?.phone,
    );
    sendSuccessResponse(res, result, "You can send the code now");
  },
);

export const verifyPhone = asyncHandler(
  async (req: Request, res: Response) => {
    // Addressed by the session the bearer token names, not by (testId, email):
    // a candidate who verified their address twice has two sessions, and
    // writing the number to the wrong one leaves the right one still barred.
    const result = await verifyScholarshipPhone(
      sessionOf(req).id,
      req.body?.phone,
      req.body?.accessToken,
    );
    sendSuccessResponse(res, result, "Phone verified");
  },
);

export const getAttempt = asyncHandler(async (req: Request, res: Response) => {
  const { testId, email } = sessionOf(req);
  const attempt = await resumeAttempt(testId, email);
  sendSuccessResponse(res, attempt, "Attempt fetched");
});

export const beginAttempt = asyncHandler(
  async (req: Request, res: Response) => {
    const { testId, email, phone } = fullyVerified(req);
    const attempt = await startAttempt(testId, email);

    // Detached: campaign traffic joins the lead pool, but a failure there must
    // never cost someone the test they just started.
    void captureScholarshipLead({
      testId,
      email,
      phone,
      ref: typeof req.body?.ref === "string" ? req.body.ref : undefined,
    });

    sendSuccessResponse(res, attempt, "Attempt started", 201);
  },
);

export const putAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { testId, email } = sessionOf(req);
  const selected = Array.isArray(req.body?.selectedOptionIds)
    ? req.body.selectedOptionIds
    : [];
  await saveAnswer(testId, email, String(req.body?.questionId ?? ""), selected);
  sendSuccessResponse(res, null, "Saved");
});

export const finishAttempt = asyncHandler(
  async (req: Request, res: Response) => {
    const { testId, email } = sessionOf(req);
    const result = await submitAttempt(testId, email);
    sendSuccessResponse(res, result, "Submitted");
  },
);

export const getResult = asyncHandler(async (req: Request, res: Response) => {
  const { testId, email } = sessionOf(req);
  const result = await getResultForEmail(testId, email);
  sendSuccessResponse(res, result, "Result fetched");
});
