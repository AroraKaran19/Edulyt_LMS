/**
 * Whether an emailed code is required to prove an address.
 *
 * Off unless an environment opts in, which is the wrong way round for a normal
 * feature and deliberate here: the flag exists to disable verification, so an
 * environment nobody has told about it stays disabled rather than mailing codes
 * to people who are not waiting for one.
 *
 * With it off, every flow that sent a code takes the address on trust. Signup
 * creates the account at `/register`, an email change swaps on its password
 * check alone, and the public scholarship gate opens a session on an unproven
 * address. Phone OTP is untouched, and in the public flows it becomes the only
 * proof of anything.
 */
export const EMAIL_OTP_ENABLED = process.env.EMAIL_OTP_ENABLED === "true";

/**
 * For the verify and resend routes, which have nothing to do once no code was
 * ever sent. They refuse rather than 404, so a client left on an old build gets
 * told why instead of looking like it hit a broken deploy.
 */
export const EMAIL_OTP_DISABLED_MESSAGE =
  "Email verification is turned off for this environment";
