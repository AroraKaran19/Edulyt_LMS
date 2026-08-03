import { defineMailTemplate } from "../utils/mailTemplates";

/**
 * Purchase confirmation, with the tax invoice attached.
 *
 * Sent from the invoice worker rather than at payment time: the invoice does not
 * exist until that worker has rendered it and pushed it to S3. The cost is up to
 * one poll interval of delay (`INVOICE_WORKER_POLL_MS`, 60s by default); the
 * alternative was either a confirmation with no invoice or two emails per order.
 *
 * One template covers course, internship seat and Success Points purchases.
 * Everything that varies between them, including the invoice card itself, is an
 * HTML-valued variable built in `lib/purchaseConfirmationMail.ts`.
 *
 * Transactional: a receipt is not something a customer can opt out of.
 */
export type PurchaseConfirmationVariables = {
  /** Hero headline, varies by order kind. */
  heading: string;
  name: string;
  /** Opening sentence, varies by order kind. */
  introLine: string;
  /** A whole `<td>` for the thumbnail, or "" when the item has no image. */
  itemImageCell: string;
  itemName: string;
  /** Pill label: Course, Internship, or Success Points. */
  itemType: string;
  orderId: string;
  /** Preformatted with the currency symbol, e.g. `₹1,49,900`. */
  amount: string;
  /** Preformatted IST date. */
  purchaseDate: string;
  /**
   * The tax invoice card, or "". Empty means generation failed, not that none
   * was owed: every checkout order is invoiceable.
   */
  invoiceBlock: string;
  /** The Success Points card, or "". */
  pointsBlock: string;
  ctaUrl: string;
  ctaLabel: string;
  year: number;
};

/** Subject in the dashboard: `Order confirmed: {{itemName}}`. */
export const purchaseConfirmationMail =
  defineMailTemplate<PurchaseConfirmationVariables>(
    "airkrit_order_confirmation",
    "purchase-confirmation",
  );
