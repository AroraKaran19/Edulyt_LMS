import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getEmailPreferences,
  setEmailPreference,
  updateEmailPreferences,
} from "../services/emailPreferences.services";
import {
  EMAIL_PREFERENCE_LABELS,
  EMAIL_PREFERENCE_MESSAGES,
  EmailPreferenceCategory,
  isEmailPreferenceCategory,
} from "../constants/emailPreferences";

interface UnsubscribeBody {
  uid?: string;
  cat?: string;
  sig?: string;
}

const readBody = (
  body: UnsubscribeBody,
): { userId: string; category: EmailPreferenceCategory; token: string } => {
  const { uid, cat, sig } = body;

  if (!uid || !cat || !sig || !isEmailPreferenceCategory(cat)) {
    throw new AppError(
      EMAIL_PREFERENCE_MESSAGES.INVALID_LINK,
      400,
      "INVALID_LINK",
    );
  }

  return { userId: String(uid), category: cat, token: String(sig) };
};

/**
 * Switches one category off.
 *
 * POST rather than GET on purpose: inbox scanners prefetch links, so a GET
 * that mutated would unsubscribe people who never clicked. The emailed link
 * opens a page, and the page calls this when the button is pressed.
 */
export const unsubscribeFromEmails = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, category, token } = readBody(req.body);

    await setEmailPreference(userId, category, token, false);

    sendSuccessResponse(
      res,
      { category, label: EMAIL_PREFERENCE_LABELS[category], subscribed: false },
      EMAIL_PREFERENCE_MESSAGES.UNSUBSCRIBED,
    );
  },
);

/** Settings page: current state of every category for the signed-in learner. */
export const getMyEmailPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const preferences = await getEmailPreferences(userId);

    sendSuccessResponse(
      res,
      { preferences, labels: EMAIL_PREFERENCE_LABELS },
      "Email preferences fetched",
    );
  },
);

/** Settings page: toggle one or more categories. */
export const updateMyEmailPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const preferences = await updateEmailPreferences(
      userId,
      req.body?.preferences ?? req.body ?? {},
    );

    sendSuccessResponse(res, { preferences }, "Email preferences updated");
  },
);

/** Undo, for the "changed your mind?" button on the same page. */
export const resubscribeToEmails = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, category, token } = readBody(req.body);

    await setEmailPreference(userId, category, token, true);

    sendSuccessResponse(
      res,
      { category, label: EMAIL_PREFERENCE_LABELS[category], subscribed: true },
      EMAIL_PREFERENCE_MESSAGES.RESUBSCRIBED,
    );
  },
);
