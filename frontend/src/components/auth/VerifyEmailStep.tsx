"use client";

import OrangeButton from "@/components/ui/buttons/OrangeButton";
import OtpInput, { OtpInputHandle } from "@/components/shared/OtpInput";
import apiClient from "@/configs/apiConfig";
import { SIGNUP_ERROR_CODES } from "@/constants/authErrorCodes";
import { MailCheck } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyEmailStepProps {
  pendingId: string;
  email: string;
  expiryMinutes: number;
  /** Fires once the account exists, so the caller can sign the learner in. */
  onVerified: () => Promise<void> | void;
  /** Returns to the register form so the address can be corrected. */
  onChangeEmail: () => void;
  /**
   * The pending signup no longer exists, so nothing on this screen can
   * succeed. The caller sends them back to the form to start over.
   */
  onExpired: () => void;
}

const isDigits = (value: string): boolean => /^\d+$/.test(value);

const VerifyEmailStep: React.FC<VerifyEmailStepProps> = ({
  pendingId,
  email,
  expiryMinutes,
  onVerified,
  onChangeEmail,
  onExpired,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  /** Set once the send cap is hit: no more codes until the signup expires. */
  const [sendLimitMinutes, setSendLimitMinutes] = useState<number | null>(null);
  const [activePendingId, setActivePendingId] = useState(pendingId);
  const otpRef = useRef<OtpInputHandle>(null);

  useEffect(() => {
    otpRef.current?.focusFirst();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const code = digits.join("");

  /** Clears the boxes and puts the caret back, after a rejected code. */
  const resetDigits = () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    otpRef.current?.focusFirst();
  };

  const errorMessage = (error: any, fallback: string): string =>
    error?.response?.data?.error?.message || fallback;

  const errorCode = (error: any): string | undefined =>
    error?.response?.data?.error?.code;

  const errorMeta = (error: any): Record<string, any> =>
    error?.response?.data?.error?.meta ?? {};

  const handleVerify = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (code.length !== OTP_LENGTH || !isDigits(code)) {
      toast.error(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }

    try {
      setVerifying(true);
      const response = await apiClient.post("/auth/register/verify-otp", {
        pendingId: activePendingId,
        otp: code,
      });

      if (response.status === 201) {
        await onVerified();
        return;
      }
      toast.error("Verification failed. Please try again.");
    } catch (error: any) {
      toast.error(errorMessage(error, "Verification failed. Please try again."));

      // The signup expired out from under them. Nothing here can succeed now,
      // so hand them back to the form rather than leaving them on a dead screen.
      if (errorCode(error) === SIGNUP_ERROR_CODES.PENDING_NOT_FOUND) {
        onExpired();
        return;
      }

      // A rejected code is almost always a typo; clear it so they can retype.
      resetDigits();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || sendLimitMinutes !== null) return;

    try {
      setResending(true);
      const response = await apiClient.post("/auth/register/resend-otp", {
        pendingId: activePendingId,
      });
      const data = response.data?.data;
      if (data?.pendingId) setActivePendingId(data.pendingId);

      resetDigits();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("A new code is on its way");
    } catch (error: any) {
      toast.error(errorMessage(error, "Could not resend the code."));

      const code = errorCode(error);

      // Same as above: the record is gone, so there is nothing left to resend.
      if (code === SIGNUP_ERROR_CODES.PENDING_NOT_FOUND) {
        onExpired();
        return;
      }

      // Every allowed code has been used. Re-arming the button would only
      // dead-end them again, so retire it and say when they can start over.
      if (code === SIGNUP_ERROR_CODES.OTP_SEND_LIMIT) {
        setSendLimitMinutes(Number(errorMeta(error).retryAfterMinutes) || null);
        setCooldown(0);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="header flex flex-col items-center gap-2 mb-2 w-full">
        <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-1">
          <MailCheck className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-regular font-coolvetica text-center text-text-primary">
          Verify your email
        </h1>
        <p className="text-sm sm:text-base font-regular text-center text-text-primary">
          We sent a {OTP_LENGTH}-digit code to{" "}
          <span className="font-bold break-all">{email}</span>
        </p>
      </div>

      <form className="w-full flex flex-col gap-4" onSubmit={handleVerify}>
        <OtpInput
          ref={otpRef}
          value={digits}
          onChange={setDigits}
          length={OTP_LENGTH}
          disabled={verifying}
        />

        <p className="text-xs sm:text-sm text-gray-500 text-center">
          The code expires in {expiryMinutes} minutes.
        </p>

        <OrangeButton
          className="w-full rounded-xl font-bold text-sm sm:text-base py-3"
          type="submit"
          disabled={verifying || code.length !== OTP_LENGTH}
        >
          {verifying ? "Verifying..." : "Verify & Create Account"}
        </OrangeButton>
      </form>

      <div className="w-full flex flex-col items-center gap-2 mt-4">
        {sendLimitMinutes !== null ? (
          <p className="text-sm text-center text-gray-500 max-w-xs">
            You have requested the maximum number of codes. You can start over
            in{" "}
            <span className="font-bold text-gray-700">
              {sendLimitMinutes} minute{sendLimitMinutes === 1 ? "" : "s"}
            </span>
            .
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-sm font-bold text-orange-500 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend code"}
          </button>
        )}
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
        >
          Wrong email? <span className="font-bold">Go back</span>
        </button>
      </div>
    </>
  );
};

export default VerifyEmailStep;
