/**
 * Copy for the community review acknowledgement.
 *
 * Community reviews only, from `community-review.services.ts`. They have a title
 * and a tag but no rating and no item, and they are created `pending_approval`,
 * so this email confirms a submission rather than announcing a published post.
 * Saying "your review is live" here would be false for every recipient.
 *
 * Item reviews (course / instructor / internship) are a different system and get
 * no email at all.
 */
import { escapeHtml } from "./htmlEscape";

/**
 * Learner-written text going into an HTML email.
 *
 * MSG91 substitutes variables verbatim, so this is the one genuinely hostile
 * input in the template set: an unescaped tag would rewrite the message around
 * it, and a stray `<` would break the layout of every email in the batch.
 */
export const buildReviewQuote = (review: string, maxChars = 400): string => {
  const text = String(review ?? "").trim();
  // Long enough to recognise their own words, short enough that the email stays
  // an acknowledgement rather than a reprint.
  const clipped =
    text.length > maxChars ? `${text.slice(0, maxChars).trimEnd()}…` : text;
  return escapeHtml(clipped);
};

/** The author's own headline for their post. */
export const buildReviewTitle = (title: string): string =>
  escapeHtml(String(title ?? "").trim());

/** Category chip, e.g. "Career Switch". Admin-constrained, escaped anyway. */
export const buildReviewTag = (tag: string): string =>
  escapeHtml(String(tag ?? "").trim());

/** Where the author can find the community once their post is approved. */
export const buildCommunityUrl = (baseUrl: string): string =>
  `${baseUrl.replace(/\/+$/, "")}/community`;

/**
 * Success Points card, or nothing.
 *
 * Identified authors are rewarded with `communityReviewSuccessPoints`, which an
 * admin can set to 0. Anonymous posts carry no user and never reach this email.
 */
export const buildPointsBlock = (
  successPoints: number | null | undefined,
): string => {
  const points = Math.round(Number(successPoints) || 0);
  if (points <= 0) return "";

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="margin-top:24px; border:1px solid #F6CDA6; border-radius:12px; background-color:#FFF3EA;">` +
    `<tr><td align="center" style="padding:13px 18px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>` +
    `<td valign="middle" width="28" style="padding-right:10px;">` +
    `<img src="https://img.icons8.com/ios-filled/50/F77124/coins.png" width="22" height="22" alt="" ` +
    `style="display:block; border:0; outline:none;" /></td>` +
    `<td valign="middle" style="font-size:14px; line-height:20px; color:#5C4A42;">` +
    `You earned <strong style="color:#D2540E; font-size:15px;">${points}</strong> Success Points` +
    `</td></tr></table></td></tr></table>`
  );
};
