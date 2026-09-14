import mongoose from "mongoose";
import { UserModel } from "../models";
import { referralUsedMail } from "../mail";
// Shared formatter rather than a second copy of the Indian-grouping rules. It
// lives in the purchase-confirmation lib because that is where it was first
// needed, not because it is specific to that email.
import { formatInr } from "../lib/purchaseConfirmationMail";
import { escapeHtml } from "../lib/htmlEscape";
import { brandFrontendUrl } from "../lib/brandSiteUrl";
import type { Brand } from "../constants/brands";

/**
 * Tells a referrer that their code earned a commission.
 *
 * Sent on a recorded sale, never on a signup: commission only exists against a
 * paid order, so announcing a reward for anything else would promise money that
 * was never credited.
 *
 * Every failure is swallowed. The commission row is already written by the time
 * this runs, and a purchase must not fail because a notification could not be
 * sent.
 */

const frontendBase = (brand: Brand): string =>
  brandFrontendUrl(brand) ?? "http://localhost:3000";

interface ReferralUsedInput {
  referrerUserId: mongoose.Types.ObjectId | string;
  /** The brand the sale was made on, which is the balance it credited. */
  brand: Brand;
  /** Name captured on the sale row. May be empty on older or odd orders. */
  buyerName?: string;
  commissionAmount: number;
}

export const sendReferralUsedEmail = async ({
  referrerUserId,
  buyerName,
  commissionAmount,
  brand,
}: ReferralUsedInput): Promise<void> => {
  // A zero-commission tier earns nothing, and "Reward earned: ₹0" reads as a
  // bug rather than a tier rule.
  if (!(Number(commissionAmount) > 0)) return;

  const referrer = await UserModel.findById(referrerUserId)
    .select("email firstName lastName")
    .lean<{ email?: string; firstName?: string; lastName?: string } | null>();
  if (!referrer?.email) return;

  const fullName =
    [referrer.firstName, referrer.lastName].filter(Boolean).join(" ").trim() ||
    referrer.firstName ||
    "there";

  referralUsedMail.send(
    { email: referrer.email, name: fullName },
    {
      name: referrer.firstName || fullName,
      // The sale row stores the buyer's name at purchase time; fall back to
      // something neutral rather than rendering "Hi , just bought".
      //
      // Escaped because this is the only cross-user value in the whole template
      // set: it is the buyer's own display name, rendered into the referrer's
      // inbox. Everything else unescaped is the recipient's own data, where the
      // worst case is breaking your own email. Here, a name of `</p><table>…`
      // rewrites a genuine Airkrit email sent to somebody else.
      referredName: escapeHtml(buyerName?.trim() || "Someone"),
      rewardValue: formatInr(commissionAmount),
      // Opens the Refer & Earn modal on arrival. There is no referrals page to
      // link to: the balance, tier and withdrawal controls all live in that
      // modal, so a bare `/dashboard` link would leave the reader hunting for
      // the button. `DashboardBanner` reads the param and strips it.
      ctaUrl: `${frontendBase(brand)}/dashboard?refer=1`,
      year: new Date().getFullYear(),
    },
    { brand },
  );
};

/** Fire-and-forget wrapper for the sale-recording path. */
export const queueReferralUsedEmail = (input: ReferralUsedInput): void => {
  void sendReferralUsedEmail(input).catch((error) => {
    console.error(
      "Referral reward email failed:",
      error instanceof Error ? error.message : error,
    );
  });
};
