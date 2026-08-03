/**
 * The one place that builds the "confirm your seat" link.
 *
 * Two emails offer a paid seat (the registration receipt and the entrance-exam
 * rejection) and both must point at the same thing: the enroll form already in
 * seat mode with the learner's cohort selected. Assembled here so the two
 * cannot drift, and so the query contract with `EnrollForm` lives next to a
 * note about what reads it.
 *
 * `EnrollForm` reads `flow=seat` to skip the merit path and `batchId` to
 * preselect the cohort. It also redirects a signed-out visitor to
 * `/login?callbackUrl=<this url>` and returns them afterwards, which is what
 * makes these links safe to put in an inbox: a reader whose session has expired
 * logs in and lands back on the right cohort instead of a form that fails on
 * submit.
 */

export const frontendBaseUrl = (): string =>
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

/** The learner's programme list. */
export const dashboardInternshipsUrl = (): string =>
  `${frontendBaseUrl()}/dashboard/internships`;

/** Public internship listing, the fallback when a cohort cannot be named. */
export const internshipListingUrl = (): string =>
  `${frontendBaseUrl()}/internships`;

/**
 * Direct paid-seat link for one cohort.
 *
 * Falls back to the listing when either identifier is missing rather than
 * emitting a broken path: a link to the catalogue is a poor outcome, a 404 is a
 * worse one.
 */
export const buildConfirmSeatUrl = (
  slug: string | undefined | null,
  batchId: string | undefined | null,
): string => {
  const cleanSlug = String(slug ?? "").trim();
  const cleanBatchId = String(batchId ?? "").trim();
  if (!cleanSlug || !cleanBatchId) return internshipListingUrl();

  return (
    `${frontendBaseUrl()}/internships/${encodeURIComponent(cleanSlug)}/enroll` +
    `?flow=seat&batchId=${encodeURIComponent(cleanBatchId)}`
  );
};
