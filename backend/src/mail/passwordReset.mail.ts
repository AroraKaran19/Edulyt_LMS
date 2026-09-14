import { defineMailTemplate } from "../utils/mailTemplates";

/** Variables for `password-reset.html`. */
export type PasswordResetVariables = {
  name: string;
  /** Full reset link including the signed token. Rendered as button and text. */
  resetUrl: string;
  /** Must match the token's own lifetime, or the copy lies. */
  expiryMinutes: number;
  year: number;
};

/**
 * The password reset link.
 *
 * `defineMailTemplate`, never the opt-out variant: someone locked out of their
 * account cannot be required to still be subscribed to anything.
 *
 * The link is the only copy of the token. It used to be returned in the API
 * response of `POST /auth/generate-reset-password-token`, which meant anyone
 * who knew an address could request a working reset link for it and read it
 * straight out of the HTTP body.
 *
 * Subject in the dashboard: `Reset your Airkrit password`.
 */
const PASSWORD_RESET_TEMPLATE_ID = "airkrit_password_reset";

export const passwordResetMail = defineMailTemplate<PasswordResetVariables>(
  // TODO(brand-assets): no Edulyt copy in MSG91 yet; Edulyt sends reuse this
  // artwork until its id is added as `ids.edulyt`.
  PASSWORD_RESET_TEMPLATE_ID,
  "password-reset",
);
