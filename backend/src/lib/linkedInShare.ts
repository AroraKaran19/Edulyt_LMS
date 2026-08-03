/**
 * LinkedIn share links for certificate emails.
 *
 * A plain redirect into LinkedIn's own composer: no OAuth, no app registration,
 * no scopes. The member edits and posts it themselves.
 *
 * `shareActive=true&text=` is the form that seeds the post body. LinkedIn's
 * documented `sharing/share-offsite/` endpoint accepts only a URL and scrapes
 * everything visible from the target page's Open Graph tags, which the
 * certificate verification route does not yet emit. Carrying the message in the
 * text instead means missing tags cost a pretty preview rather than the whole
 * post. The tradeoff is that this form is undocumented, so it could change; if it
 * does, the composer opens empty rather than erroring.
 */
const COMPOSER_URL = "https://www.linkedin.com/feed/?shareActive=true&text=";

/**
 * Wrap post text into a composer link.
 *
 * The whole body is percent-encoded, which is what keeps newlines intact and
 * stops any character in it from being read as another query parameter.
 */
export const linkedInShareUrl = (postText: string): string =>
  `${COMPOSER_URL}${encodeURIComponent(postText)}`;

/**
 * Assemble post text from lines, blank strings included as blank lines.
 *
 * LinkedIn truncates at roughly 140 characters behind a "see more", so the first
 * line has to carry the message on its own.
 */
export const postLines = (lines: string[]): string => lines.join("\n");
