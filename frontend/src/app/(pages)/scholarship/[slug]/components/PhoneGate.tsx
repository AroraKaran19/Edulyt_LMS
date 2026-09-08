"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Phone } from "lucide-react";
import { toast } from "react-toastify";
import scholarshipClient, { schAuth } from "@/configs/scholarshipApiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { PHONE_ERROR_CODES } from "@/constants/authErrorCodes";
import useMSG91OTP, {
  OTP_CHANNEL,
  OTP_LENGTH,
  type OtpChannel,
} from "@/hooks/useMSG91OTP";
import { COUNTRY_CODES, DEFAULT_COUNTRY_ISO, dialFor } from "@/constants/countryCodes";
import { isValidPhone, sanitizePhoneInput, toE164, toMsg91Identifier } from "@/lib/phone";

const RESEND_FALLBACK_SECONDS = 60;

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

const errorCode = (error: unknown): string | undefined =>
  (error as { response?: { data?: { error?: { code?: string } } } })?.response
    ?.data?.error?.code;

const errorMeta = (error: unknown): Record<string, unknown> =>
  (error as { response?: { data?: { error?: { meta?: Record<string, unknown> } } } })
    ?.response?.data?.error?.meta ?? {};

const isComplete = (countryIso: string, phone: string): boolean =>
  isValidPhone(countryIso, phone);

type Props = {
  slug: string;
  /** The session token from the email gate, or from the signed-in shortcut. */
  token: string;
  onVerified: () => void;
};

/**
 * The second half of the gate: a mobile number, proved by SMS.
 *
 * This is a sibling of `EmailGate` rather than a step inside it because the
 * signed-in path never renders the email gate at all, and a signed-in account
 * with no number on file still owes this step. One component both paths render
 * beats the same panel written twice.
 *
 * It is also a sibling of the app's `PhoneVerificationField` for a harder
 * reason: that field posts to `/users/me/phone/*`, which is auth-gated, and
 * most people here have no account. The MSG91 plumbing they share lives in
 * `useMSG91OTP`, which is the part worth reusing.
 */
export default function PhoneGate({ slug, token, onVerified }: Props) {
  const { ready, loadError, sendOtp, retryOtp, verifyOtp } = useMSG91OTP();

  const [step, setStep] = useState<"number" | "code">("number");
  const [phone, setPhone] = useState("");
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [reqId, setReqId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  /** Set once the budget is spent: no more codes without a fresh session. */
  const [spent, setSpent] = useState(false);
  const [error, setError] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") boxes.current[0]?.focus();
  }, [step]);

  /**
   * Books the send on our server first, then lets the widget dispatch it. The
   * order is the whole point: the widget sends from the browser, so a budget is
   * only enforceable if it is spent before the client is trusted to do
   * anything.
   */
  const sendCode = async (isResend: boolean, channel?: OtpChannel) => {
    if (busy || cooldown > 0 || spent) return;
    if (!isComplete(countryIso, phone)) {
      setError("Enter a valid mobile number for that country");
      return;
    }
    if (!ready) {
      setError(loadError || "Verification is still loading, one moment.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await scholarshipClient.post(
        ENDPOINTS.scholarshipPublic.phoneOtpRequest(slug),
        { phone: toE164(countryIso, phone) },
        schAuth(token),
      );

      const nextReqId = isResend
        ? await retryOtp(reqId, channel)
        : await sendOtp(toMsg91Identifier(countryIso, phone));
      setReqId(nextReqId);
      setDigits(Array(OTP_LENGTH).fill(""));
      setStep("code");
      setCooldown(res.data?.data?.cooldownSeconds ?? RESEND_FALLBACK_SECONDS);
      toast.success(
        channel === OTP_CHANNEL.whatsapp
          ? `Code sent on WhatsApp to ${dialFor(countryIso)} ${phone}`
          : `Code sent to ${dialFor(countryIso)} ${phone}`,
      );
    } catch (err) {
      setError(errorMessage(err, "Could not send the code"));

      const code = errorCode(err);
      if (code === PHONE_ERROR_CODES.OTP_SEND_LIMIT) {
        // Re-arming the button would only dead-end them: the budget belongs to
        // the session, so the way back is a new one.
        setSpent(true);
        setCooldown(0);
      } else if (code === PHONE_ERROR_CODES.OTP_THROTTLED) {
        setCooldown(
          Number(errorMeta(err).retryAfterSeconds) || RESEND_FALLBACK_SECONDS,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (code: string) => {
    setBusy(true);
    setError("");
    try {
      // The widget checks the digits and hands back a signed token. Only that
      // token is worth anything to the backend.
      const accessToken = await verifyOtp(code, reqId);
      await scholarshipClient.post(
        ENDPOINTS.scholarshipPublic.phoneVerify(slug),
        { phone, accessToken },
        schAuth(token),
      );
      onVerified();
    } catch (err) {
      // A widget rejection is always "wrong digits", and its raw copy is not
      // worth showing. Anything with a response came from our API, whose
      // messages are written for candidates.
      setError(
        (err as { response?: unknown })?.response
          ? errorMessage(err, "That code did not work")
          : "Incorrect code. Check it and try again.",
      );
      setDigits(Array(OTP_LENGTH).fill(""));
      boxes.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (index: number, raw: string) => {
    const only = raw.replace(/\D/g, "");
    if (only.length > 1) {
      const next = Array(OTP_LENGTH).fill("");
      only
        .slice(0, OTP_LENGTH)
        .split("")
        .forEach((d, i) => (next[i] = d));
      setDigits(next);
      if (next.every(Boolean)) void submitCode(next.join(""));
      else boxes.current[Math.min(only.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = only;
    setDigits(next);
    if (only && index < OTP_LENGTH - 1) boxes.current[index + 1]?.focus();
    if (next.every(Boolean)) void submitCode(next.join(""));
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxes.current[index - 1]?.focus();
    }
  };

  if (step === "number") {
    return (
      <div className="flex flex-col gap-3">
        <label
          htmlFor="sch-phone"
          className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold"
        >
          One more, then you are in
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Valued by ISO, not dial code: +1 is both the US and Canada. */}
          <select
            aria-label="Country dialling code"
            value={countryIso}
            onChange={(e) => {
              setCountryIso(e.target.value);
              setPhone(sanitizePhoneInput(e.target.value, phone));
              setError("");
            }}
            className="w-full shrink-0 rounded-2xl border-[1.5px] border-sch-ink-line bg-sch-ink-raised px-4 py-3.5 text-base text-sch-on-ink focus:border-sch-gold focus:outline-none sm:w-44"
          >
            {COUNTRY_CODES.map((country) => (
              <option key={country.iso} value={country.iso}>
                {country.name} ({country.dial})
              </option>
            ))}
          </select>

          <div className="relative min-w-0 flex-1">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sch-on-ink-dim" />
            <input
              id="sch-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(sanitizePhoneInput(countryIso, e.target.value));
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && void sendCode(false)}
              className="w-full rounded-2xl border-[1.5px] border-sch-ink-line bg-sch-ink-raised py-3.5 pl-11 pr-4 text-base text-sch-on-ink placeholder:text-[#6d5f56] focus:border-sch-gold focus:outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-sch-on-ink-dim">
          {error ? (
            <span className="text-sch-foil">{error}</span>
          ) : (
            "We text a code to confirm it is you, and only for that."
          )}
        </p>
        <button
          type="button"
          disabled={busy || cooldown > 0 || spent || !ready}
          onClick={() => void sendCode(false)}
          className="mt-1 w-full rounded-2xl bg-linear-to-br from-sch-foil to-[#f0763c] px-6 py-4 text-[0.9375rem] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy
            ? "Sending…"
            : cooldown > 0
              ? `Send again in ${cooldown}s`
              : ready
                ? "Text me a code"
                : "Loading…"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => {
          setStep("number");
          setError("");
        }}
        className="inline-flex items-center gap-1.5 self-start text-sm text-sch-on-ink-dim transition-colors hover:text-sch-gold"
      >
        <ChevronLeft className="h-4 w-4" />
        +91 {phone}
      </button>
      <span className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold">
        {OTP_LENGTH} digits, by text
      </span>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${OTP_LENGTH}, minmax(0, 1fr))` }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            aria-label={`Digit ${i + 1}`}
            disabled={busy}
            className="aspect-3/4 max-h-15 w-full rounded-xl border-[1.5px] border-sch-ink-line bg-sch-ink-raised text-center font-sch-mono text-[1.375rem] text-sch-on-ink focus:border-sch-gold focus:outline-none disabled:opacity-60"
          />
        ))}
      </div>
      {error ? <p className="text-xs text-sch-foil">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          disabled={cooldown > 0 || busy || spent}
          onClick={() => void sendCode(true, OTP_CHANNEL.sms)}
          className="font-sch-mono text-xs tracking-wider text-sch-on-ink-dim transition-colors hover:text-sch-gold disabled:opacity-50 disabled:hover:text-sch-on-ink-dim"
        >
          {spent
            ? "NO CODES LEFT"
            : cooldown > 0
              ? `RESEND IN ${cooldown}S`
              : "RESEND BY SMS"}
        </button>

        {/* The widget picks the first channel by country; this is the way out
            when that one does not arrive. */}
        <button
          type="button"
          disabled={cooldown > 0 || busy || spent}
          onClick={() => void sendCode(true, OTP_CHANNEL.whatsapp)}
          className="font-sch-mono text-xs tracking-wider text-[#25D366] transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          SEND ON WHATSAPP
        </button>
      </div>
    </div>
  );
}
