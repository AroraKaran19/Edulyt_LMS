/**
 * Conditional markup for the signup verification email.
 *
 * The welcome bonus is configurable and routinely zero, but MSG91 substitutes
 * variables and evaluates nothing, so the card announcing it cannot be switched
 * off from the template. It was previously handled by declaring two variants
 * that both pointed at the same dashboard id, which meant the choice did nothing
 * and a signup earning no bonus still read "You earned 0 Success Points".
 *
 * Building the card here collapses that back to one template and one id.
 */

/**
 * Welcome bonus card, or nothing.
 *
 * Empty whenever no bonus was credited, which is the normal case when an admin
 * has the reward switched off.
 */
export const buildWelcomeBonusBlock = (
  successPoints: number | null | undefined,
): string => {
  const points = Math.round(Number(successPoints) || 0);
  if (points <= 0) return "";

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="margin-top:26px; border:1px solid #F6CDA6; border-radius:12px; background-color:#FFF3EA;">` +
    `<tr><td align="center" style="padding:13px 18px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>` +
    `<td valign="middle" width="28" style="padding-right:10px;">` +
    `<img src="https://img.icons8.com/ios-filled/50/F77124/coins.png" width="22" height="22" alt="" ` +
    `style="display:block; border:0; outline:none;" /></td>` +
    `<td valign="middle" style="font-size:14px; line-height:20px; color:#5C4A42;">` +
    `Welcome bonus: <strong style="color:#D2540E; font-size:15px;">${points}</strong> ` +
    `Success Points added to your account` +
    `</td></tr></table></td></tr></table>`
  );
};
