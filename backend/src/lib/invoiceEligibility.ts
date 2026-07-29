/**
 * Which orders get a tax invoice.
 *
 * The test is provenance, not price. Anything the customer took through cart
 * and checkout is invoiced, including an order that a coupon, referral,
 * partnership discount or success points knocked all the way down to ₹0.
 *
 * Free grants are the opposite case and are excluded: admin allotment,
 * collaboration (partner-college) allotment, and internship voucher
 * redemptions hand out access without any money changing hands. Those paths
 * never create an Order document at all, so in practice they cannot reach the
 * invoice worker. The gateway check below exists as a backstop, so that any
 * future path which mints an Order outside checkout has to opt in explicitly
 * rather than silently start issuing tax invoices.
 *
 * Note that `collaborationDiscount` on a checkout order is a different thing
 * from a collaboration allotment: the former is a partner discount applied to
 * a real purchase and IS invoiced.
 */

/** Gateways that only ever appear on a real cart/checkout order. */
const CHECKOUT_GATEWAYS = new Set(["paytm", "razorpay"]);

export interface InvoiceEligibilityInput {
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}

/** True when this order is a settled checkout purchase that owes an invoice. */
export function isInvoiceableOrder(order: InvoiceEligibilityInput): boolean {
  if (order.paymentStatus !== "success") return false;
  return CHECKOUT_GATEWAYS.has(String(order.paymentMethod ?? "").toLowerCase());
}
