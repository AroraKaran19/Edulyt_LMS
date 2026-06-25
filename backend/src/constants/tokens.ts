/**
 * Token lifetime policy (two-token model).
 *
 *  - Access token  : short-lived JWT, sent on every API request.
 *  - Refresh token : long-lived opaque random string, sent ONLY to
 *                    /auth/refresh-token. We store only its SHA-256 hash so a
 *                    DB leak can't be replayed.
 *
 * Two expiry clocks run together:
 *  - idle (sliding)  : reset on every successful rotation; dies on inactivity.
 *  - absolute (hard) : fixed at first login; never moves, caps the family.
 */
export const ACCESS_TOKEN_TTL = "30m";
export const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;
export const REFRESH_IDLE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
export const REFRESH_ABSOLUTE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
/** Grace window after rotation during which the just-rotated token still works
 *  (covers concurrent refreshes / flaky networks without tripping reuse). */
export const REFRESH_GRACE_MS = 60 * 1000; // 60s
