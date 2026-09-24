import axios from "axios";
import { AppError } from "../middlewares/error.middleware";
import { isIndianMobile } from "./caApplication";

/**
 * Dispatches one payout-change OTP by SMS through MSG91's OTP API, the same
 * provider already trusted for the widget token check and transactional mail.
 *
 * Kept in its own module, apart from the OTP business logic, so a test can
 * replace this one call without a live MSG91 account: nothing else here talks
 * to the network. Never logs the code outside development.
 */

const MSG91_OTP_SEND_URL = "https://control.msg91.com/api/v5/otp";

const toMsg91Mobile = (phone: string): string =>
  isIndianMobile(phone) ? `91${phone}` : phone.replace(/^\+/, "");

export const sendCaPayoutOtpSms = async (phone: string, otp: string): Promise<void> => {
  const authKey = process.env.MSG91_AUTHKEY?.trim();
  // Optional: MSG91 uses the account default OTP template when none is sent.
  const templateId = process.env.MSG91_CA_PAYOUT_OTP_TEMPLATE_ID?.trim();

  if (!authKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] CA payout OTP: ${otp}`);
      return;
    }
    throw new AppError("Phone verification is unavailable right now. Please try again later.", 503);
  }

  try {
    const response = await axios.post(
      MSG91_OTP_SEND_URL,
      { mobile: toMsg91Mobile(phone), otp, authkey: authKey, ...(templateId && { template_id: templateId }) },
      { headers: { "Content-Type": "application/json" }, timeout: 10_000 },
    );
    // MSG91 can answer 200 with a rejection in the body, so the body decides.
    if (response.data?.type !== "success") {
      throw new Error(response.data?.message || "MSG91 rejected the OTP send");
    }
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] CA payout OTP: ${otp}`);
      return;
    }
    throw new AppError("Could not send the code, try again", 502);
  }
};
