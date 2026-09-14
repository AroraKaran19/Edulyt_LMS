/**
 * The one place that builds the "confirm your seat" link.
 *
 * Two emails offer a paid seat (the registration receipt and the entrance-exam
 * rejection) and both must point at the same thing: the learner's programme
 * list, where the card for that registration carries the seat button. Assembled
 * here so the two cannot drift.
 *
 * Not the enroll form. Both emails go to someone who already has a registration
 * row, and the enroll form is the path for creating one: it would ask them to
 * fill the whole application again to reach a payment their dashboard card
 * starts in one click. That card posts the paid-seat upgrade against the row
 * they already have and opens checkout in place.
 *
 * Dashboard routes sit behind `AuthGuard`, which sends a signed-out visitor to
 * `/login?callbackUrl=<this url>` and returns them afterwards, which is what
 * makes these links safe to put in an inbox: a reader whose session has expired
 * logs in and lands back on their registration rather than on the login page.
 */

export const frontendBaseUrl = (): string =>
  (process.env.AIRKRIT_FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

/** The learner's programme list. */
export const dashboardInternshipsUrl = (): string =>
  `${frontendBaseUrl()}/dashboard/internships`;

/** Public internship listing, the fallback when a cohort cannot be named. */
export const internshipListingUrl = (): string =>
  `${frontendBaseUrl()}/internships`;

/**
 * Where an email's "confirm your seat" CTA points.
 *
 * The programme list rather than a per-cohort deep link: the seat button lives
 * on the card, and the page has no parameter that selects one. Named separately
 * from `dashboardInternshipsUrl` so the intent is readable at the call site and
 * so a deep link, if one is ever added, changes one function.
 */
export const confirmSeatUrl = (): string => dashboardInternshipsUrl();
