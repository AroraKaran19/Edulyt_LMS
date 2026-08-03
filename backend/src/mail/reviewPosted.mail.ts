import { defineOptOutMailTemplate } from "../utils/mailTemplates";
import { EMAIL_PREFERENCE_CATEGORIES } from "../constants/emailPreferences";

/**
 * Acknowledges a community review submission.
 *
 * Community reviews only. They carry a title and a tag but no rating and no item,
 * and they are created `pending_approval`, so this confirms receipt rather than
 * announcing a published post. Item reviews (course, instructor, internship) are a
 * separate system and send nothing.
 *
 * Anonymous posts never reach this: they carry no `userId`, so there is nobody to
 * write to and no Success Points to report.
 *
 * Opt-out, unlike most of the set. Being thanked for a post is exactly the "can
 * live without" test in `emailPreferences.ts`. `defineOptOutMailTemplate` fills
 * `unsubscribeUrl` and skips recipients who opted out of REVIEWS.
 */
export type ReviewPostedVariables = {
  name: string;
  /** The author's own headline, HTML-escaped. */
  reviewTitle: string;
  /** Category chip, e.g. "Career Switch". */
  reviewTag: string;
  /** The author's words, escaped and clipped for length. */
  reviewText: string;
  /** Success Points card, or "" when the reward is set to zero. */
  pointsBlock: string;
  /** The public community page. */
  ctaUrl: string;
  year: number;
  /** Filled by `defineOptOutMailTemplate`, not by the caller. */
  unsubscribeUrl?: string;
};

/** Subject in the dashboard: `Thanks for sharing your story on Airkrit!`. */
export const reviewPostedMail = defineOptOutMailTemplate<ReviewPostedVariables>(
  "airkrit_community_notification",
  "review-posted",
  EMAIL_PREFERENCE_CATEGORIES.REVIEWS,
);
