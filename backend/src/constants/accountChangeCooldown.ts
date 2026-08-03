import { AppError } from "../middlewares/error.middleware";

/**
 * Cooldown between two changes to the same account credential.
 *
 * Stops a learner cycling their email or password repeatedly. That churn is
 * worth blocking for its own sake, and it is also what makes an account hard to
 * trace after a takeover: an attacker who can move the address freely can keep
 * moving it every time support puts it back.
 *
 * Applied to password reset too, at redeem time. Reset was originally left
 * exempt as a recovery path, but exempting it made the limit decorative: anyone
 * refused in the profile UI could mail themselves a link and change the
 * password anyway. The cost of closing it is real and accepted: someone who
 * resets and then forgets again has support as their only route for a week.
 *
 * Requesting a reset link is NOT gated, only redeeming one. A silently
 * unsent link would look identical to a delivery failure, and the request
 * endpoint answers uniformly on purpose so it cannot be used to probe for
 * accounts. Link sending is bounded by its own per-address throttle instead.
 */
export const ACCOUNT_CHANGE_COOLDOWN_DAYS = 7;

/** Error code for a refused password change. The UI branches on it. */
export const PASSWORD_CHANGE_TOO_SOON = "PASSWORD_CHANGE_TOO_SOON";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days left on the cooldown, rounded up, or 0 once it has passed.
 *
 * Rounded up so the message never promises a wait shorter than the real one:
 * "try again in 1 day" with 4 hours still to run is a support ticket.
 */
export const cooldownDaysRemaining = (
  lastChangedAt: Date | null | undefined,
): number => {
  if (!lastChangedAt) return 0;

  const elapsed = Date.now() - new Date(lastChangedAt).getTime();
  const remaining = ACCOUNT_CHANGE_COOLDOWN_DAYS * DAY_MS - elapsed;
  // A clock skew or a future-dated stamp should not lock anyone out forever.
  if (remaining <= 0) return 0;
  return Math.min(ACCOUNT_CHANGE_COOLDOWN_DAYS, Math.ceil(remaining / DAY_MS));
};

/** "in 3 days" / "tomorrow", for the end of a refusal message. */
export const cooldownRetryPhrase = (daysRemaining: number): string =>
  daysRemaining <= 1 ? "tomorrow" : `in ${daysRemaining} days`;

/**
 * Refuses a password change made inside the cooldown.
 *
 * Shared by every route that writes a password: the authenticated change, the
 * OAuth first-time set, and the reset link. A limit enforced on some of them is
 * not a limit, since whichever route was left open becomes the way around it.
 */
export const assertPasswordChangeAllowed = (
  lastChangedAt: Date | null | undefined,
): void => {
  const daysRemaining = cooldownDaysRemaining(lastChangedAt);
  if (daysRemaining <= 0) return;

  throw new AppError(
    `You can only change your password once every ${ACCOUNT_CHANGE_COOLDOWN_DAYS} days. ` +
      `Please try again ${cooldownRetryPhrase(daysRemaining)}.`,
    429,
    PASSWORD_CHANGE_TOO_SOON,
    { daysRemaining },
  );
};
