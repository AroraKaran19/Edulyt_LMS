"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import Input from "@/components/ui/inputs/Input";
import useMSG91OTP, {
  OTP_CHANNEL,
  OTP_LENGTH,
  type OtpChannel,
} from "@/hooks/useMSG91OTP";
import { COUNTRY_CODES, dialFor } from "@/constants/countryCodes";
import {
  fromE164,
  isValidPhone,
  sanitizePhoneInput,
  toE164,
  toMsg91Identifier,
} from "@/lib/phone";
import { PHONE_ERROR_CODES } from "@/constants/authErrorCodes";
import { cn } from "@/lib/utils";

/**
 * Phone number field that will not hand its value back until the number has
 * been proven by an MSG91 OTP.
 *
 * The number is saved by the verification endpoint itself, not by the form this
 * sits in, which is why `savedPhone` rather than a draft value decides whether
 * the field reads as verified: the badge always reflects what the account
 * actually holds. A parent form should treat `savedPhone` as the only phone
 * number it may submit, and gate its own save on `savedPhone` being present.
 */

const RESEND_FALLBACK_SECONDS = 60;

interface PhoneVerificationFieldProps {
  /** The verified number on the account, or "" when there is none yet. */
  savedPhone: string;
  /** Fires once the backend has stored the number. */
  onVerified: (phone: string) => void;
  label?: string;
  labelClassName?: string;
  required?: boolean;
  /** Parent-form error, e.g. "Phone number is required" on submit. */
  error?: string;
  className?: string;
}

/** The national part of a stored number, legacy 10-digit or E.164 alike. */
const normalize = (raw: string): string => fromE164(raw || "").national;

const isComplete = (countryIso: string, phone: string): boolean =>
  isValidPhone(countryIso, phone);

const apiMessage = (error: any, fallback: string): string =>
  error?.response?.data?.error?.message || error?.message || fallback;

const apiCode = (error: any): string | undefined =>
  error?.response?.data?.error?.code;

const apiMeta = (error: any): Record<string, any> =>
  error?.response?.data?.error?.meta ?? {};

/** Survives a reload so the code already in the learner's SMS still works. */
const reqIdKey = (phone: string) => `msg91:reqId:${phone}`;

const readStoredReqId = (phone: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(reqIdKey(phone));
  } catch {
    return null;
  }
};

const storeReqId = (phone: string, reqId: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (reqId) window.sessionStorage.setItem(reqIdKey(phone), reqId);
    else window.sessionStorage.removeItem(reqIdKey(phone));
  } catch {
    // Private mode or a full quota. The countdown still works, only the
    // cross-reload resume is lost.
  }
};

const PhoneVerificationField = ({
  savedPhone,
  onVerified,
  label = "Phone Number",
  labelClassName,
  required = false,
  error,
  className,
}: PhoneVerificationFieldProps) => {
  const { ready, loadError, sendOtp, retryOtp, verifyOtp } = useMSG91OTP();

  const [phone, setPhone] = useState(() => normalize(savedPhone));
  const [countryIso, setCountryIso] = useState(
    () => fromE164(savedPhone || "").countryIso,
  );
  const [showCode, setShowCode] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [reqId, setReqId] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  /** Set once the send budget is spent: no more codes until it resets. */
  const [sendLimitMinutes, setSendLimitMinutes] = useState<number | null>(null);
  /** Belongs to the number itself: bad format, refused send, taken number. */
  const [fieldError, setFieldError] = useState("");
  /** Belongs to the code boxes, so it renders beside them and not on the input. */
  const [codeError, setCodeError] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const verified = Boolean(savedPhone) && normalize(savedPhone) === phone;
  const code = digits.join("");

  // Adopt the account's number whenever it changes underneath us (initial
  // profile load, or a verification completing). Never while a code panel is
  // open: a profile that finishes loading mid-flow would otherwise swap the
  // number out from under the code the learner is about to type.
  useEffect(() => {
    const next = normalize(savedPhone);
    if (next && !showCode) setPhone(next);
    // `showCode` is read, not tracked — this fires on account changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPhone]);

  // Restore the server-side throttle so a reload cannot re-arm the send button
  // while MSG91 would still refuse, and so a spent budget keeps saying so
  // rather than making the learner click to rediscover it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/users/me/phone/otp-status");
        const status = res.data?.data;
        if (cancelled || !status) return;

        if (status.sendsLeft === 0) {
          setSendLimitMinutes(status.resetsInMinutes || null);
        }
        if (!status.active) return;

        setCooldown(status.remainingSeconds || 0);
        if (status.phone && normalize(status.phone) !== normalize(savedPhone)) {
          // A code is already out for a number they had not finished saving.
          setPhone(normalize(status.phone));
          setReqId(readStoredReqId(normalize(status.phone)));
          setShowCode(true);
        }
      } catch {
        // Status is a convenience; the send endpoint enforces the real limit.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally on mount only: this restores state, it does not track it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (showCode) inputRefs.current[0]?.focus();
  }, [showCode]);

  const focusInput = (index: number) => {
    inputRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  };

  const handleDigitChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    setCodeError("");
    if (!value) {
      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
      return;
    }
    // Typing or pasting several digits at once fills forward from here.
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < value.length && index + i < OTP_LENGTH; i += 1) {
        next[index + i] = value[i];
      }
      return next;
    });
    focusInput(index + value.length);
  };

  const handleDigitKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      // Empty box: step back so a second backspace clears the previous digit.
      event.preventDefault();
      focusInput(index - 1);
      setDigits((prev) => prev.map((d, i) => (i === index - 1 ? "" : d)));
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusInput(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handleDigitPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < Math.min(pasted.length, OTP_LENGTH); i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  /**
   * Handles a refused send. A cooldown just restarts the countdown, but a spent
   * budget has to retire the button: re-arming it would only dead-end them.
   */
  const handleSendError = async (err: any, fallback: string) => {
    // Inline only. The message sits directly under the field it is about, so a
    // toast saying the same thing is just the same error twice.
    setFieldError(apiMessage(err, fallback));

    const code = apiCode(err);
    if (code === PHONE_ERROR_CODES.OTP_SEND_LIMIT) {
      setSendLimitMinutes(Number(apiMeta(err).retryAfterMinutes) || null);
      setCooldown(0);
      return;
    }
    if (code !== PHONE_ERROR_CODES.OTP_THROTTLED) return;

    setCooldown(
      Number(apiMeta(err).retryAfterSeconds) || RESEND_FALLBACK_SECONDS,
    );

    // Refused because a code went out moments ago, possibly from another tab.
    // If it went to this same number, show the entry boxes rather than leaving
    // them staring at a dead button with a live code in their messages.
    try {
      const res = await apiClient.get("/users/me/phone/otp-status");
      const status = res.data?.data;
      if (status?.active && normalize(status.phone || "") === phone) {
        setReqId(readStoredReqId(phone));
        setShowCode(true);
      }
    } catch {
      // Best-effort: the countdown above is what actually matters here.
    }
  };

  /**
   * Claims a send on the server first, then asks the widget to dispatch it. The
   * order matters: the budget is only enforceable if it is spent before the
   * client is trusted to do anything.
   */
  const requestCode = async (isResend: boolean, channel?: OtpChannel) => {
    if (sending || cooldown > 0 || sendLimitMinutes !== null) return;
    if (!isComplete(countryIso, phone)) {
      setFieldError("Enter a valid mobile number for that country");
      return;
    }
    if (!ready) {
      setFieldError(loadError || "Phone verification is still loading.");
      return;
    }

    setSending(true);
    setFieldError("");
    setCodeError("");
    try {
      await apiClient.post("/users/me/phone/otp-request", {
        phone: toE164(countryIso, phone),
      });

      const nextReqId = isResend
        ? await retryOtp(reqId ?? readStoredReqId(phone), channel)
        : await sendOtp(toMsg91Identifier(countryIso, phone));

      setReqId(nextReqId);
      storeReqId(phone, nextReqId);
      setDigits(Array(OTP_LENGTH).fill(""));
      setShowCode(true);
      setCooldown(RESEND_FALLBACK_SECONDS);
      toast.success(
        channel === OTP_CHANNEL.whatsapp
          ? `Code sent on WhatsApp to ${dialFor(countryIso)} ${phone}`
          : `Code sent to ${dialFor(countryIso)} ${phone}`,
      );
    } catch (err: any) {
      await handleSendError(err, "Could not send the code. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (verifying || code.length !== OTP_LENGTH) return;

    setVerifying(true);
    setCodeError("");
    try {
      // The widget checks the digits and, if they are right, hands back a
      // signed token. Only that token is worth anything to the backend.
      const msg91Token = await verifyOtp(code, reqId);
      const res = await apiClient.post("/users/me/phone/verify", {
        phone: toE164(countryIso, phone),
        msg91Token,
      });

      const confirmed = res.data?.data?.phone || phone;
      storeReqId(phone, null);
      setReqId(null);
      setShowCode(false);
      setDigits(Array(OTP_LENGTH).fill(""));
      setCooldown(0);
      setSendLimitMinutes(null);
      onVerified(confirmed);
      toast.success("Phone number verified");
    } catch (err: any) {
      // A widget rejection is always "wrong digits", and its raw copy ("invalid
      // otp") is not worth showing. Anything with a response came from our API,
      // whose messages are written for learners.
      setCodeError(
        err?.response
          ? apiMessage(err, "That code did not work.")
          : "Incorrect code. Please check and try again.",
      );
      // A rejected code is almost always a typo; clear it so they can retype.
      setDigits(Array(OTP_LENGTH).fill(""));
      focusInput(0);
    } finally {
      setVerifying(false);
    }
  };

  const shownError = fieldError || error;
  const canSend =
    isComplete(countryIso, phone) &&
    !verified &&
    !sending &&
    cooldown === 0 &&
    sendLimitMinutes === null &&
    ready;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        {/* Valued by ISO, not dial code: +1 is both the US and Canada. */}
        <select
          aria-label="Country dialling code"
          value={countryIso}
          disabled={showCode}
          onChange={(e) => {
            setCountryIso(e.target.value);
            // A longer dial code leaves fewer digits for the number.
            setPhone(sanitizePhoneInput(e.target.value, phone));
            setFieldError("");
          }}
          className="h-[46px] w-full shrink-0 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-orange-500 disabled:opacity-60 sm:w-44"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.name} ({country.dial})
            </option>
          ))}
        </select>

        <div className="min-w-0 flex-1">
          <Input
            label={label}
            labelClassName={labelClassName}
            placeholder="Enter your phone number"
            type="tel"
            required={required}
            inputMode="tel"
            value={phone}
            disabled={showCode}
            onChange={(e) => {
              setPhone(sanitizePhoneInput(countryIso, e.target.value));
              setFieldError("");
            }}
            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
              const pasted = e.clipboardData.getData("text");
              if (!/^[+\d\s-]+$/.test(pasted)) e.preventDefault();
            }}
            error={shownError}
          />
        </div>
      </div>

      {verified && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Verified
        </p>
      )}

      {!verified && !showCode && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => requestCode(false)}
            disabled={!canSend}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors",
              canSend
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "cursor-not-allowed bg-gray-200 text-gray-500",
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            {sending ? "Sending..." : "Verify number"}
          </button>
          {sendLimitMinutes !== null ? (
            <span className="text-xs font-medium text-red-500">
              Too many codes requested. Please try again in {sendLimitMinutes}{" "}
              minute{sendLimitMinutes === 1 ? "" : "s"}.
            </span>
          ) : cooldown > 0 ? (
            <span className="text-xs text-gray-500">
              You can request another code in {cooldown}s
            </span>
          ) : loadError ? (
            // A widget that failed to load leaves the button dead, so say why
            // rather than showing copy that implies it is about to work.
            <span className="text-xs font-medium text-red-500">
              {loadError}
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              {ready
                ? "We will text you a code to confirm this number."
                : "Loading verification..."}
            </span>
          )}
        </div>
      )}

      {!verified && showCode && (
        <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
          <p className="text-sm text-gray-700">
            Enter the {OTP_LENGTH}-digit code sent to{" "}
            <span className="font-bold">+91 {phone}</span>
          </p>

          <div className="flex gap-2" onPaste={handleDigitPaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={OTP_LENGTH}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(index, e)}
                onFocus={(e) => e.target.select()}
                aria-label={`Digit ${index + 1}`}
                className={cn(
                  "h-12 w-11 rounded-lg border bg-white text-center text-xl font-bold outline-none transition-colors focus:border-orange-400",
                  codeError ? "border-red-400" : "border-gray-300",
                )}
              />
            ))}
          </div>

          {codeError && (
            <p className="text-xs font-medium text-red-500">{codeError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || code.length !== OTP_LENGTH}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-bold transition-colors",
                code.length === OTP_LENGTH && !verifying
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "cursor-not-allowed bg-gray-200 text-gray-500",
              )}
            >
              {verifying ? "Verifying..." : "Confirm code"}
            </button>

            {sendLimitMinutes !== null ? (
              <span className="text-xs font-medium text-red-500">
                No codes left. Please try again in {sendLimitMinutes} minute
                {sendLimitMinutes === 1 ? "" : "s"}.
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {/* Both named: the client cannot know which channel the widget
                    picked for this country, so the learner chooses. */}
                <button
                  type="button"
                  onClick={() => requestCode(true, OTP_CHANNEL.sms)}
                  disabled={cooldown > 0 || sending}
                  className="text-sm font-bold text-orange-500 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                >
                  {sending
                    ? "Sending..."
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Resend by SMS"}
                </button>

                <button
                  type="button"
                  onClick={() => requestCode(true, OTP_CHANNEL.whatsapp)}
                  disabled={cooldown > 0 || sending}
                  className="text-sm font-semibold text-[#25D366] hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                >
                  Send on WhatsApp
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowCode(false);
                setDigits(Array(OTP_LENGTH).fill(""));
                setFieldError("");
                setCodeError("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Change number
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneVerificationField;
