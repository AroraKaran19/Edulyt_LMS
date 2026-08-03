/**
 * Copy and conditional markup for the purchase confirmation email.
 *
 * Follows the pattern set by `internshipApplicationMail.ts`: MSG91 evaluates
 * nothing, so anything that appears for one purchase and not another is built
 * here and passed in as a value, rather than a block the template branches on.
 * One upload serves every order kind.
 *
 * The email is sent from the invoice worker rather than at payment time, because
 * the invoice does not exist until that worker has rendered it. Every checkout
 * order is invoiceable (`lib/invoiceEligibility.ts`), so there is no such thing
 * here as a purchase that will never have one: an absent invoice means
 * generation failed, not that none was owed.
 */
import { escapeHtml } from "./htmlEscape";

/** What the order bought. Mirrors `order.orderKind`. */
export type OrderKind = "course" | "internship_seat" | "internship_success_points";

/** Rupee amounts, grouped Indian-style: 1,49,900 rather than 149,900. */
export const formatInr = (amount: number): string =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    Math.max(0, Number(amount) || 0),
  )}`;

/**
 * Hero headline.
 *
 * Success Points are a top-up rather than an enrolment, so "enrollment
 * confirmed" would be wrong for them.
 */
export const buildHeading = (kind: OrderKind): string => {
  switch (kind) {
    case "internship_success_points":
      return "Your Success Points are in";
    case "internship_seat":
      return "Your seat is confirmed";
    case "course":
    default:
      return "Your enrollment is confirmed";
  }
};

/** The pill beside the item name. */
export const buildItemType = (kind: OrderKind): string => {
  switch (kind) {
    case "internship_success_points":
      return "Success Points";
    case "internship_seat":
      return "Internship";
    case "course":
    default:
      return "Course";
  }
};

/**
 * The line under the greeting.
 *
 * No "thank you" here: the hero already says it, and twice in four lines reads
 * as filler. Deliberately does not promise access "now" for a seat either, since
 * a paid internship seat still passes through documentation before anything
 * unlocks.
 */
export const buildIntroLine = (kind: OrderKind): string => {
  switch (kind) {
    case "internship_success_points":
      return "Your payment went through and the points have been added to your account.";
    case "internship_seat":
      return "Your payment went through and your seat is reserved. Here is a summary of your order.";
    case "course":
    default:
      return "Your payment went through and your enrollment is confirmed. Here is a summary of your order.";
  }
};

/**
 * Thumbnail cell, or nothing.
 *
 * An image cannot be folded into a sentence the way a number can, so this one
 * has to be markup. Returning "" collapses the row to the name alone, which is
 * why the cell carries its own padding rather than relying on a sibling.
 */
export const buildItemImageCell = (imageUrl: string | null | undefined): string => {
  const url = String(imageUrl ?? "").trim();
  if (!url) return "";

  return (
    `<td valign="middle" width="96" style="padding-right:14px;">` +
    `<img src="${escapeHtml(url)}" width="96" height="54" alt="" ` +
    `style="display:block; width:96px; height:54px; border-radius:8px; border:0; outline:none;" />` +
    `</td>`
  );
};

/**
 * Success Points card, or nothing.
 *
 * Empty for a Success Points purchase: the points are the product there, already
 * named in the summary above, and a card announcing them as a bonus reads as a
 * second, phantom credit.
 */
export const buildPointsBlock = (
  kind: OrderKind,
  successPoints: number | null | undefined,
): string => {
  const points = Math.round(Number(successPoints) || 0);
  if (points <= 0 || kind === "internship_success_points") return "";

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

/**
 * Invoice card, or nothing.
 *
 * Present only when a rendered invoice exists. Every checkout order owes one, so
 * an empty block means generation failed and the team has been alerted; the
 * learner is simply not told about a document that is not there yet.
 */
export const buildInvoiceBlock = (
  invoiceNumber: string | null | undefined,
): string => {
  const number = String(invoiceNumber ?? "").trim();
  if (!number) return "";

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="margin-top:24px; border:1px solid #F6CDA6; border-radius:14px; background-color:#FFF3EA;">` +
    `<tr><td style="padding:20px 22px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
    `<td valign="middle" width="46" style="padding-right:14px;">` +
    `<img src="https://img.icons8.com/ios-filled/100/F77124/invoice.png" width="34" height="34" alt="" ` +
    `style="display:block; border:0; outline:none;" /></td>` +
    `<td valign="middle">` +
    `<p style="margin:0 0 2px 0; font-size:15px; line-height:22px; font-weight:800; color:#2B1508;">` +
    `Your invoice is attached below</p>` +
    `<p style="margin:0; font-size:13px; line-height:20px; color:#8A7A72;">` +
    `Tax invoice ${escapeHtml(number)}, included as a PDF with this email.</p>` +
    `</td></tr></table></td></tr></table>`
  );
};
