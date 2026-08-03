/**
 * MSG91 drops template variables into the HTML body verbatim, so anything that
 * reaches a variable from a database field, an admin form or an error message
 * has to be escaped on the way in. One stray `<` otherwise breaks the layout of
 * every email in the batch.
 */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Escape, then turn newlines into line breaks.
 *
 * For multi-line payloads such as a stack trace. Converting here rather than
 * relying on `white-space: pre-wrap` in the template keeps the layout correct in
 * clients that drop the declaration.
 */
export const escapeHtmlToBr = (value: string): string =>
  escapeHtml(value).replace(/\r\n|\r|\n/g, "<br />");
