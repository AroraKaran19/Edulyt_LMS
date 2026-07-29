import { defineMailTemplate } from "./mailer";

/**
 * Every MSG91 email template used by the backend is declared here, so there is
 * one place to see what mail the platform sends and which variables each one
 * needs.
 *
 * Adding a template:
 *  1. Upload the HTML from `src/templates/emails/` to the MSG91 dashboard and
 *     wait for approval (10-30 minutes).
 *  2. Declare it below with its id and the variables the template references.
 *
 * Ids are hardcoded here rather than read from env. They are dashboard
 * identifiers, not secrets, and keeping them beside the variable contract means
 * the id and the variables it expects get reviewed together. A wrong id fails
 * loudly at send time instead of silently resolving to nothing.
 *
 * The generic argument is the contract: callers get a compile error if they
 * miss a variable, and the names must match the template's placeholders exactly
 * (MSG91 substitutes by name, and an unmatched placeholder ships to the learner
 * as raw text).
 *
 * Example:
 *
 *   export const welcomeMail = defineMailTemplate<{
 *     name: string;
 *     loginUrl: string;
 *   }>("6890fa1cd6fc0561ab1f2c34", "welcome");
 *
 *   welcomeMail.send(
 *     { email: user.email, name: user.name },
 *     { name: user.name, loginUrl: `${process.env.FRONTEND_URL}/login` },
 *   );
 *
 * `send` is queued and returns immediately - never await it in a request path.
 * Use `sendNow` only when the caller must act on the delivery outcome.
 */

export { defineMailTemplate };

// Declare templates below as they are approved in MSG91.
