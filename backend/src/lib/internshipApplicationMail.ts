/**
 * Copy and conditional markup for the internship registration email.
 *
 * MSG91 substitutes variables and evaluates nothing, so anything that appears
 * for one registration and not another has to be decided here and passed in as
 * a value. The two optional cards in `internship-application-received.html`
 * (Success Points, paid-seat offer) are therefore whole HTML fragments that go
 * empty when they do not apply, rather than blocks the template branches on.
 *
 * The alternative was one dashboard upload per combination, four ids to keep in
 * step and every copy edit repeated across them. `buildCourseReasonLine` in
 * `courseCertificateMail.ts` already establishes that variables carry HTML
 * through MSG91 intact.
 */
import { escapeHtml } from "./htmlEscape";

/**
 * How the learner got here. All three land on the same "you are registered"
 * email, but what happens next differs, and telling a paid registrant to sit an
 * entrance exam (or upselling them the seat they just bought) is the mistake
 * this distinction exists to prevent.
 */
export type RegistrationPath = "merit" | "paid_seat" | "voucher";

/** Matches the emphasis the templates use for a programme name. */
const strong = (value: string): string =>
  `<strong style="color:#2B1508;">${escapeHtml(value)}</strong>`;

/**
 * The opening sentence, as HTML.
 *
 * "Your spot is confirmed" is deliberately absent from the paid path: at that
 * point the row is `payment_pending` and no seat is held yet.
 */
export const buildIntroLine = (
  path: RegistrationPath,
  internshipName: string,
): string => {
  const name = strong(internshipName);

  switch (path) {
    case "merit":
      return `Thanks for registering for ${name}. Your spot is confirmed and your next step is the entrance exam.`;

    case "paid_seat":
      return `Thanks for registering for ${name}. We have your details and your seat is reserved as soon as your payment goes through.`;

    case "voucher":
      return `Thanks for registering for ${name}. Your voucher has been redeemed and your seat is confirmed.`;
  }
};

/** What the learner should expect next, as HTML. */
export const buildNextStepLine = (path: RegistrationPath): string => {
  switch (path) {
    case "merit":
      return "We'll email you the exam link and instructions before your exam window opens.";

    case "paid_seat":
      return "Complete the payment to lock in your seat. Until it goes through, your place in the cohort is not held.";

    case "voucher":
      return "We'll email you when your cohort is ready to begin, and your programme will appear in your dashboard.";
  }
};

/**
 * The Success Points card, or an empty string.
 *
 * Empty whenever nothing was credited, which happens more often than it looks:
 * the reward is once per internship, so registering for a second batch of one
 * the learner already registered for earns nothing. "You earned 0 Success
 * Points" is the bug this guard exists to avoid.
 */
export const buildPointsBlock = (points: number): string => {
  if (!Number.isFinite(points) || points <= 0) return "";
  const amount = String(Math.floor(points));

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px; border:1px solid #F6CDA6; border-radius:12px; background-color:#FFF3EA;">
      <tr>
        <td align="center" style="padding:13px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td valign="middle" width="28" style="padding-right:10px;">
                <img src="https://img.icons8.com/ios-filled/50/F77124/coins.png" width="22" height="22" alt="" style="display:block; border:0; outline:none;" />
              </td>
              <td valign="middle" style="font-size:14px; line-height:20px; color:#5C4A42;">
                You earned <strong style="color:#D2540E; font-size:15px;">${amount}</strong> Success Points
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
};

/**
 * The paid-seat offer card, or an empty string.
 *
 * Only ever shown to merit registrants whose cohort actually has an active
 * plan. Showing it without one sends the learner to a form that refuses with
 * "this cohort is not open for direct seat purchase"; showing it to someone who
 * already took the paid or voucher route sells them what they have.
 */
export const buildSeatOfferBlock = (
  internshipName: string,
  confirmSeatUrl: string,
): string => {
  if (!confirmSeatUrl) return "";
  const name = escapeHtml(internshipName);
  const url = escapeHtml(confirmSeatUrl);

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:32px; border-radius:16px;">
      <tr>
        <td align="center" bgcolor="#E0590F" style="border-radius:16px; background-color:#E0590F; background-image:linear-gradient(135deg, #F26A1B 0%, #D2540C 100%); padding:28px 28px 30px 28px;">
          <img src="https://img.icons8.com/ios-filled/100/FFFFFF/ticket.png" width="34" height="34" alt="" style="display:block; margin:0 auto 12px auto; border:0; outline:none;" />
          <p style="margin:0 0 6px 0; font-size:11px; line-height:16px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#FFD9BE;">Reserve your spot</p>
          <p style="margin:0 0 10px 0; font-size:19px; line-height:26px; font-weight:800; color:#FFFFFF;">Confirm your seat directly</p>
          <p style="margin:0 0 22px 0; font-size:14px; line-height:22px; color:#FFE7D6;">Prefer not to wait? Secure your place in ${name} and get started right away.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" bgcolor="#FFFFFF" style="border-radius:12px; background-color:#FFFFFF;">
                <a href="${url}" target="_blank" class="cta-link" style="display:inline-block; padding:15px 42px; font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:20px; font-weight:800; color:#D2540E; text-decoration:none; border-radius:12px;">Confirm your seat</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
};

/**
 * Where the main CTA points, and what it says.
 *
 * One destination, two labels. The dashboard card is where both actions happen:
 * a `payment_pending` row shows "Complete payment" on the same card everyone
 * else uses to view a registration, so only the wording has to change.
 */
export const buildCta = (
  path: RegistrationPath,
  dashboardUrl: string,
): { ctaUrl: string; ctaLabel: string } => ({
  ctaUrl: dashboardUrl,
  ctaLabel:
    path === "paid_seat" ? "Complete your payment" : "View my registration",
});
