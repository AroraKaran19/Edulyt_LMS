/**
 * Sends the purchase confirmation, with the tax invoice attached, exactly once.
 *
 * Fires from the invoice worker rather than at payment time, because the invoice
 * does not exist until that worker has rendered it. Every checkout order owes an
 * invoice, so a confirmation without one means generation failed: the customer
 * still gets their receipt of purchase, the invoice card is simply absent, and
 * the team is alerted separately.
 */
import mongoose from "mongoose";
import { asBrand } from "../constants/brands";
import { OrderModel } from "../models/order.schema";
import { UserModel } from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import { InternshipModel } from "../models/internship.schema";
import { purchaseConfirmationMail } from "../mail";
import { formatIstDate } from "../utils/ist";
import { frontendBaseUrl } from "../lib/internshipSeatUrl";
import {
  buildHeading,
  buildIntroLine,
  buildInvoiceBlock,
  buildItemImageCell,
  buildItemType,
  buildPointsBlock,
  formatInr,
  type OrderKind,
} from "../lib/purchaseConfirmationMail";

/**
 * Take the send slot, or report that it is already taken.
 *
 * `generateInvoiceForOrderService` is idempotent and returns early for an
 * already-invoiced order, so the worker can legitimately reach the success path
 * more than once for the same order. This is what stops that becoming a second
 * receipt.
 *
 * Claimed before the send so two workers racing the same order cannot both mail
 * it, and released again by `releaseSendSlot` if that send does not land.
 */
const claimSendSlot = async (
  orderId: mongoose.Types.ObjectId,
): Promise<boolean> => {
  const res = await OrderModel.updateOne(
    { _id: orderId, confirmationEmailSentAt: { $exists: false } },
    { $set: { confirmationEmailSentAt: new Date() } },
  );
  return res.modifiedCount === 1;
};

/**
 * Give the slot back after a send that never landed.
 *
 * Without this the marker records an intent to send rather than a send, and the
 * buyer's receipt is lost for good: nothing re-reads a settled order, so a
 * rejected send would leave them paid, invoiced, and never told.
 */
const releaseSendSlot = async (
  orderId: mongoose.Types.ObjectId,
): Promise<void> => {
  await OrderModel.updateOne(
    { _id: orderId },
    { $unset: { confirmationEmailSentAt: "" } },
  );
};

type OrderLean = {
  _id: mongoose.Types.ObjectId;
  brand?: string;
  userId?: mongoose.Types.ObjectId;
  orderKind?: string;
  amount?: number;
  courseId?: mongoose.Types.ObjectId;
  courseName?: string;
  internshipId?: mongoose.Types.ObjectId;
  internshipTitle?: string;
  internshipSuccessPointsQuantity?: number;
  invoiceNumber?: string;
  invoiceUrl?: string;
  createdAt?: Date;
};

/** Where the CTA should land, per order kind. */
const callToAction = (
  kind: OrderKind,
): { ctaUrl: string; ctaLabel: string } => {
  const base = frontendBaseUrl();
  switch (kind) {
    case "internship_seat":
    case "internship_success_points":
      return {
        ctaUrl: `${base}/dashboard/internships`,
        ctaLabel: "Go to my internships",
      };
    case "course":
    default:
      return { ctaUrl: `${base}/dashboard`, ctaLabel: "Start learning" };
  }
};

/**
 * Email the buyer their confirmation.
 *
 * Returns whether an email was dispatched. Never throws: an invoice job must not
 * fail because a receipt could not be sent.
 */
export const sendPurchaseConfirmationEmail = async (
  orderId: string,
): Promise<boolean> => {
  let claimed = false;
  let _id: mongoose.Types.ObjectId | null = null;

  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return false;
    _id = new mongoose.Types.ObjectId(orderId);

    const order = await OrderModel.findById(_id)
      .select(
        "brand userId orderKind amount courseId courseName internshipId internshipTitle " +
          "internshipSuccessPointsQuantity invoiceNumber invoiceUrl createdAt",
      )
      .lean<OrderLean>();
    if (!order) return false;

    const user = await UserModel.findById(order.userId)
      .select("firstName lastName name email")
      .lean<{
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
      }>();

    const email = user?.email?.trim();
    if (!email) {
      console.error(
        `[Purchase Mail] No contactable buyer for order ${orderId} — skipping.`,
      );
      return false;
    }

    const kind = (order.orderKind as OrderKind) || "course";

    // Only the item actually bought is looked up, and only for its thumbnail and
    // a fallback name: the order already snapshots the name it was sold under.
    const item =
      kind === "course" && order.courseId
        ? await CourseModel.findById(order.courseId)
            .select("title thumbnail")
            .lean<{ title?: string; thumbnail?: string }>()
        : order.internshipId
          ? await InternshipModel.findById(order.internshipId)
              .select("title thumbnail")
              .lean<{ title?: string; thumbnail?: string }>()
          : null;

    const itemName =
      kind === "internship_success_points"
        ? `${Math.round(Number(order.internshipSuccessPointsQuantity) || 0)} Success Points`
        : order.courseName?.trim() ||
          order.internshipTitle?.trim() ||
          item?.title?.trim() ||
          "Your purchase";

    if (!(await claimSendSlot(_id))) return false;
    claimed = true;

    const { ctaUrl, ctaLabel } = callToAction(kind);

    const result = await purchaseConfirmationMail.sendNow(
      [
        {
          email,
          name:
            [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
            user?.name?.trim() ||
            "there",
        },
      ],
      {
        heading: buildHeading(kind),
        name:
          [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
          user?.name?.trim() ||
          "there",
        introLine: buildIntroLine(kind),
        // Success Points have no thumbnail of their own, and borrowing the
        // internship's would misrepresent what was bought.
        itemImageCell:
          kind === "internship_success_points"
            ? ""
            : buildItemImageCell(item?.thumbnail),
        itemName,
        itemType: buildItemType(kind),
        orderId: String(order._id),
        amount: formatInr(Number(order.amount) || 0),
        purchaseDate: formatIstDate(order.createdAt ?? new Date()),
        invoiceBlock: buildInvoiceBlock(order.invoiceNumber),
        pointsBlock: buildPointsBlock(
          kind,
          kind === "internship_success_points"
            ? 0
            : Number(order.internshipSuccessPointsQuantity) || 0,
        ),
        ctaUrl,
        ctaLabel,
        year: new Date().getFullYear(),
      },
      // MSG91 fetches the attachment from this URL at send time. Absent when
      // generation failed, in which case the invoice card is empty too, so the
      // email never promises a document it does not carry.
      order.invoiceUrl
        ? {
            brand: asBrand(order.brand),
            attachments: [
              {
                file: order.invoiceUrl,
                filename: `Invoice ${order.invoiceNumber ?? String(order._id)}.pdf`,
              },
            ],
          }
        : undefined,
    );

    if (!result.ok) {
      await releaseSendSlot(_id);
      console.error(
        `[Purchase Mail] Send rejected for order ${orderId}: ${result.error}. ` +
          "Slot released, so re-running the invoice job will try again.",
      );
      return false;
    }

    return true;
  } catch (error) {
    // The claim outlives this function only if the send succeeded, so anything
    // thrown after it has to hand the slot back.
    if (claimed && _id) await releaseSendSlot(_id).catch(() => undefined);
    console.error(
      `[Purchase Mail] Failed to send confirmation for order ${orderId}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};
