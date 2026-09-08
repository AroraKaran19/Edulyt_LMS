"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import OtpInput, { OtpInputHandle } from "@/components/shared/OtpInput";
import apiClient from "@/configs/apiConfig";
import { EMAIL_CHANGE_ERROR_CODES } from "@/constants/authErrorCodes";

/**
 * Two-step email change: prove the password, then prove the new address.
 *
 * The account keeps its current email for the whole of step one. Only the
 * verify call moves it, so nothing here can hand an account to an address
 * nobody can read. That matters more than it sounds: the email on the account
 * is where password resets go.
 *
 * Lives outside the profile page because that page is already long, and this is
 * a self-contained flow with its own state machine.
 */

const OTP_LENGTH = 6;

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
  /** Fires once the address has actually changed, with the new one. */
  onChanged: (newEmail: string) => Promise<void> | void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  fallback;

const errorCode = (error: any): string | undefined =>
  error?.response?.data?.error?.code;

const errorMeta = (error: any): Record<string, any> =>
  error?.response?.data?.error?.meta ?? {};

const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onChanged,
}) => {
  const [step, setStep] = useState<"form" | "verify">("form");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requesting, setRequesting] = useState(false);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(5);
  const [cooldown, setCooldown] = useState(0);
  /** Set once the send cap is hit: no more codes until the window resets. */
  const [sendLimitMinutes, setSendLimitMinutes] = useState<number | null>(null);
  const otpRef = useRef<OtpInputHandle>(null);

  const code = digits.join("");

  const resetAll = () => {
    setStep("form");
    setCurrentPassword("");
    setNewEmail("");
    setShowPassword(false);
    setErrors({});
    setDigits(Array(OTP_LENGTH).fill(""));
    setCooldown(0);
    setSendLimitMinutes(null);
  };

  // A closed modal keeps no half-finished state: reopening starts clean rather
  // than dropping the learner back onto a code that has since expired.
  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen]);

  useEffect(() => {
    if (step === "verify") otpRef.current?.focusFirst();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const resetDigits = () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    otpRef.current?.focusFirst();
  };

  const validateForm = (): boolean => {
    const next: Record<string, string> = {};

    if (!currentPassword) {
      next.currentPassword = "Current password is required";
    }

    if (!newEmail) {
      next.newEmail = "New email is required";
    } else if (!EMAIL_PATTERN.test(newEmail)) {
      next.newEmail = "Please enter a valid email address";
    } else if (newEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      next.newEmail = "New email must be different from current email";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** Maps a rejected request back onto the field that caused it. */
  const applyRequestError = (error: any) => {
    const message = errorMessage(error, "Failed to send the code.");
    const codeName = errorCode(error);

    if (
      codeName === EMAIL_CHANGE_ERROR_CODES.PASSWORD_INCORRECT ||
      codeName === EMAIL_CHANGE_ERROR_CODES.PASSWORD_NOT_SET
    ) {
      setErrors({ currentPassword: message });
      return;
    }

    if (
      codeName === EMAIL_CHANGE_ERROR_CODES.EMAIL_IN_USE ||
      codeName === EMAIL_CHANGE_ERROR_CODES.EMAIL_UNCHANGED ||
      codeName === EMAIL_CHANGE_ERROR_CODES.EMAIL_INVALID
    ) {
      setErrors({ newEmail: message });
      return;
    }

    toast.error(message);
  };

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setRequesting(true);
      const response = await apiClient.post("/users/change-email/request", {
        currentPassword,
        newEmail,
      });

      const data = response.data?.data;

      /*
       * With verification off this one call is the whole change, and the
       * response says so by carrying the applied address instead of a countdown
       * to a code. There is no verify step to advance to.
       */
      if (data?.changedAt) {
        toast.success("Email updated successfully");
        await onChanged(String(data.email ?? newEmail));
        onClose();
        return;
      }

      setExpiryMinutes(Number(data?.expiryMinutes) || 5);
      setCooldown(Number(data?.cooldownSeconds) || 60);
      setSendLimitMinutes(null);
      setStep("verify");
    } catch (error: any) {
      applyRequestError(error);
    } finally {
      setRequesting(false);
    }
  };

  const handleVerify = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (code.length !== OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }

    try {
      setVerifying(true);
      await apiClient.post("/users/change-email/verify", { otp: code });

      toast.success("Email updated successfully");
      await onChanged(newEmail);
      onClose();
    } catch (error: any) {
      toast.error(errorMessage(error, "Verification failed. Please try again."));

      // The change expired out from under them, so nothing on this screen can
      // succeed. Send them back to the form rather than leaving a dead code box.
      if (errorCode(error) === EMAIL_CHANGE_ERROR_CODES.REQUEST_NOT_FOUND) {
        setStep("form");
        setDigits(Array(OTP_LENGTH).fill(""));
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
      const response = await apiClient.post("/users/change-email/resend");
      const data = response.data?.data;

      resetDigits();
      setCooldown(Number(data?.cooldownSeconds) || 60);
      toast.success("A new code is on its way");
    } catch (error: any) {
      toast.error(errorMessage(error, "Could not resend the code."));

      const codeName = errorCode(error);

      if (codeName === EMAIL_CHANGE_ERROR_CODES.REQUEST_NOT_FOUND) {
        setStep("form");
        return;
      }

      // Every allowed code has been used. Re-arming the button would only
      // dead-end them, so retire it and say when they can start over.
      if (codeName === EMAIL_CHANGE_ERROR_CODES.OTP_SEND_LIMIT) {
        setSendLimitMinutes(Number(errorMeta(error).retryAfterMinutes) || null);
        setCooldown(0);
      }

      if (codeName === EMAIL_CHANGE_ERROR_CODES.OTP_THROTTLED) {
        setCooldown(Number(errorMeta(error).retryAfterSeconds) || 60);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === "form" ? "Change Email" : "Confirm your new email"}
      className="max-w-md"
    >
      {step === "form" ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearError("currentPassword");
                }}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value.toLowerCase());
                clearError("newEmail");
              }}
              autoCapitalize="none"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all duration-200 ease-in-out outline-none shadow-sm hover:shadow-md"
              placeholder="Enter your new email address"
            />
            {errors.newEmail && (
              <p className="mt-1 text-sm text-red-500">{errors.newEmail}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              A code goes to this address. Your email only changes once you
              enter it.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={requesting}
              className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {requesting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {requesting ? "Sending code..." : "Send code"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
              <MailCheck className="w-7 h-7 text-orange-500" />
            </div>
            <p className="text-sm text-center text-gray-600">
              We sent a {OTP_LENGTH}-digit code to{" "}
              <span className="font-bold break-all text-gray-900">
                {newEmail}
              </span>
            </p>
          </div>

          <OtpInput
            ref={otpRef}
            value={digits}
            onChange={setDigits}
            onEnter={handleVerify}
            length={OTP_LENGTH}
            disabled={verifying}
            size="sm"
          />

          <p className="text-xs text-center text-gray-500">
            The code expires in {expiryMinutes} minutes.
          </p>

          <button
            type="submit"
            disabled={verifying || code.length !== OTP_LENGTH}
            className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verifying && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {verifying ? "Verifying..." : "Confirm email"}
          </button>

          <div className="flex flex-col items-center gap-2">
            {sendLimitMinutes !== null ? (
              <p className="text-sm text-center text-gray-500 max-w-xs">
                You have requested the maximum number of codes. You can start
                over in{" "}
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
              onClick={() => {
                setStep("form");
                setDigits(Array(OTP_LENGTH).fill(""));
              }}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
            >
              Wrong address? <span className="font-bold">Go back</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ChangeEmailModal;
