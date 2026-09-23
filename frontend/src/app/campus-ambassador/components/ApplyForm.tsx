"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";
import useAuth from "@/hooks/useAuth";
import useMSG91OTP, { OTP_CHANNEL, type OtpChannel } from "@/hooks/useMSG91OTP";
import { signInWithOAuthProvider } from "@/lib/oauthSignInClient";
import apiClient from "@/configs/apiConfig";
import publicClient, { schAuth } from "@/configs/scholarshipApiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { CA_REF_STORAGE_KEY } from "@/constants/crm";
import { CAPTCHA_ERROR_CODES, PHONE_ERROR_CODES } from "@/constants/authErrorCodes";
import { COUNTRY_CODES, DEFAULT_COUNTRY_ISO, dialFor } from "@/constants/countryCodes";
import { DEGREE_OPTIONS } from "@/lib/constants/profileOptions";
import {
  fromE164,
  isValidPhone,
  sanitizePhoneInput,
  toE164,
  toMsg91Identifier,
} from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { Student } from "@/types/user";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../apply.module.css";
import {
  ClosedNote,
  CollegeStep,
  DoneStep,
  OtpStep,
  PayoutStep,
  StepsBar,
  Ticket,
  YouStep,
  type Details,
  type FormErrors,
  type Pane,
} from "./formSteps";

type ApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: { message?: string; code?: string; meta?: Record<string, unknown> };
    };
  };
};

const apiMessage = (error: unknown, fallback: string): string => {
  const data = (error as ApiError)?.response?.data;
  return data?.error?.message || data?.message || fallback;
};

/** Matches the server's cooldown, and only used until it reports the real one. */
const RESEND_COOLDOWN_SECONDS = 60;

const CAPTCHA_PROMPT = "Please confirm you are not a robot.";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const UPI = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9.-]{1,63}$/;

const CA_CODES = {
  closed: "CA_APPLICATIONS_CLOSED",
  applied: "CA_ALREADY_APPLIED",
  ambassador: "CA_ALREADY_AMBASSADOR",
  invalid: "CA_INVALID_FIELD",
} as const;

/**
 * `cleanCaApplicationInput`'s own messages for the college pane's fields, so a
 * `CA_INVALID_FIELD` for one of them can be routed back there instead of
 * showing under the payout form it was actually submitted from.
 */
const COLLEGE_STEP_MESSAGES: Partial<Record<string, keyof FormErrors>> = {
  "Select your college": "college",
  "Enter your college email": "collegeEmail",
  "Enter a valid college email": "collegeEmail",
  "Select your course": "course",
  "Select your career stage": "careerStage",
  "Pick at least one language": "languages",
};

/**
 * What proved the number. A contact session carries its own token and is bound to
 * the address it was opened for; an account proof rides on the access token.
 */
type Proof =
  | { via: "session"; phone: string; email: string; token: string }
  | { via: "account"; phone: string };

const pick = (value: string | undefined, options: { value: string }[]) =>
  value && options.some((o) => o.value === value) ? value : "";

export default function ApplyForm({
  settings,
  refCode,
}: {
  settings: CaPageSettings;
  refCode: string | null;
}) {
  const { user, isAuthenticated, handleSignOut } = useAuth();
  const { ready, loadError, sendOtp, retryOtp, verifyOtp } = useMSG91OTP();
  const fields = settings.form.fields;

  /*
   * The profile is the default for each field and anything typed wins. Inputs stay
   * null until touched, so a profile that lands after hydration still fills them
   * without an effect writing into the form.
   */
  const profile = isAuthenticated ? (user as Student | undefined) : undefined;
  const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  const profilePhone = profile?.phone ? fromE164(profile.phone) : null;
  const profileE164 = profilePhone ? toE164(profilePhone.countryIso, profilePhone.national) : "";

  const [nameInput, setNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const [countryInput, setCountryInput] = useState<string | null>(null);
  const [detailInput, setDetailInput] = useState<Partial<Details>>({});

  const name = nameInput ?? profileName;
  const email = emailInput ?? profile?.email ?? "";
  const countryIso = countryInput ?? profilePhone?.countryIso ?? DEFAULT_COUNTRY_ISO;
  const phone = phoneInput ?? profilePhone?.national ?? "";
  const india = countryIso === "IN";
  const countryName = COUNTRY_CODES.find((c) => c.iso === countryIso)?.name ?? "India";

  /*
   * Only `collegeName` and `degreeName` ride on the session payload
   * (`protectedUser`); collegeId, career stage and address never do, so those
   * start blank rather than reading a field that is never actually there.
   */
  const details: Details = {
    collegeName: (profile?.collegeName ?? "").trim(),
    collegeId: "",
    collegeEmail: "",
    degree: pick(profile?.degreeName, DEGREE_OPTIONS),
    careerStage: "",
    languages: [],
    payout: "",
    line: "",
    city: "",
    state: "",
    pincode: "",
    country: countryName,
    whatsappJoined: false,
    ...detailInput,
  };
  const setDetails = (patch: Partial<Details>) => setDetailInput((prev) => ({ ...prev, ...patch }));

  const [pane, setPane] = useState<Pane>("you");
  const [closed, setClosed] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [digits, setDigits] = useState<string[]>([]);
  const [reqId, setReqId] = useState<string | null>(null);
  /** The contact session the current code was booked on, or null for the account path. */
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  /** The address `sessionToken` was opened for; editing it needs a new session. */
  const [sessionEmail, setSessionEmail] = useState("");
  const [proof, setProof] = useState<Proof | null>(null);
  /** Cleared once the server refuses the profile's number, so step 1 asks for a code. */
  const [trustProfilePhone, setTrustProfilePhone] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  /** Every code this window allows is spent. Unlike `cooldown` it never clears itself. */
  const [sendLimitMinutes, setSendLimitMinutes] = useState<number | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  const isClosed = closed || !settings.batch.joiningDate;
  const e164 = toE164(countryIso, phone);
  const typedEmail = email.trim().toLowerCase();
  const phoneLabel = `${dialFor(countryIso)} ${phone.trim()}`;

  const hideEmail = isAuthenticated && emailInput === null && EMAIL.test(email.trim());

  /*
   * The typed number is already proved, so step 1 needs no code and no captcha.
   * The auth payload carries no `phoneVerifiedAt`, so this trusts the profile
   * number the same way `LeadForm` does: on a match alone. The server gate
   * (`requireVerifiedLeadContact`) is the one that actually checks it is
   * verified, so an unverified match still falls back to an OTP at submit.
   */
  const provedNow = isAuthenticated
    ? (trustProfilePhone && e164 === profileE164) || (proof?.via === "account" && proof.phone === e164)
    : proof?.via === "session" && proof.phone === e164 && proof.email === typedEmail;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Each pane is shorter than the last, so a phone scrolled down to the button
  // would be left looking at whatever follows the card.
  const firstPane = useRef(true);
  useEffect(() => {
    if (firstPane.current) {
      firstPane.current = false;
      return;
    }
    // The old pane's submit button is gone, so focus would otherwise fall to
    // `body`. The new pane's root is focusable (`tabIndex={-1}`) for this.
    document.getElementById("ca-active-pane")?.focus({ preventScroll: true });
    const card = document.getElementById("apply");
    if (!card || card.getBoundingClientRect().top >= 0) return;
    card.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [pane]);

  const handleGoogle = async () => {
    setOauthLoading(true);
    try {
      const out = await signInWithOAuthProvider("google", "/campus-ambassador");
      if (out.kind === "redirect_to_provider") {
        window.location.assign(out.url);
        return;
      }
      if (out.kind === "oauth_redirecting") return;
      if (out.kind === "success") {
        window.location.assign(out.dest);
        return;
      }
      setErrors({ form: out.message || "Could not sign in with Google." });
    } catch {
      setErrors({ form: "Could not sign in with Google. Try again." });
    }
    setOauthLoading(false);
  };

  /** A v2 token dies on first use, so the box comes back unticked after every send. */
  const spendCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  };

  const handleSendRefusal = (error: unknown, fallback: string, onAlreadyVerified: () => void) => {
    const detail = (error as ApiError)?.response?.data?.error;

    if (
      detail?.code === CAPTCHA_ERROR_CODES.CAPTCHA_REQUIRED ||
      detail?.code === CAPTCHA_ERROR_CODES.CAPTCHA_REJECTED ||
      detail?.code === CAPTCHA_ERROR_CODES.CAPTCHA_UNAVAILABLE
    ) {
      setErrors({ captcha: apiMessage(error, fallback) });
      return;
    }

    // Not a failure: this session already proved its number, so nothing is left to send.
    if (detail?.code === PHONE_ERROR_CODES.PHONE_ALREADY_VERIFIED) {
      setErrors({});
      onAlreadyVerified();
      return;
    }

    if (detail?.code === PHONE_ERROR_CODES.OTP_SEND_LIMIT) {
      setSendLimitMinutes(Number(detail?.meta?.retryAfterMinutes) || null);
      setCooldown(0);
      setErrors({ form: apiMessage(error, fallback) });
      return;
    }

    const seconds = Number(detail?.meta?.retryAfterSeconds);
    if (detail?.code === PHONE_ERROR_CODES.OTP_THROTTLED && seconds > 0) {
      setCooldown(Math.ceil(seconds));
      setErrors({});
      return;
    }

    setErrors({ form: apiMessage(error, fallback) });
  };

  const provedBySession = (token: string, sessionFor: string) => {
    setProof({ via: "session", phone: e164, email: sessionFor, token });
    setPane("college");
  };

  /** Books the SMS on our server first, then lets the widget dispatch it. */
  const startPhoneVerification = async (token: string | null) => {
    if (!ready) {
      setErrors({ form: loadError || "Verification is still loading." });
      return;
    }
    setSending(true);
    setErrors({});
    try {
      if (token) {
        await publicClient.post(ENDPOINTS.enquiry.phoneOtpRequest, { phone: e164 }, schAuth(token));
      } else {
        // Writes the proved number to the profile, which is what the submit gate compares.
        await apiClient.post(ENDPOINTS.users.phoneOtpRequest, { phone: e164 });
      }
      setProof(null);
      setOtpToken(token);
      setReqId(await sendOtp(toMsg91Identifier(countryIso, phone)));
      setDigits([]);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setPane("otp");
    } catch (error) {
      handleSendRefusal(error, "Could not send the code", () => {
        if (token) provedBySession(token, typedEmail);
      });
    } finally {
      setSending(false);
    }
  };

  /** Opens the contact session the phone step runs on, for a visitor with no account. */
  const openSession = async (): Promise<string | null> => {
    if (!captchaToken) {
      setErrors({ captcha: CAPTCHA_PROMPT });
      return null;
    }
    setSending(true);
    setErrors({});
    try {
      const res = await publicClient.post(ENDPOINTS.enquiry.start, {
        email: typedEmail,
        recaptchaToken: captchaToken,
      });
      const token = String(res.data?.data?.sessionToken ?? "");
      setSessionToken(token);
      setSessionEmail(typedEmail);
      return token || null;
    } catch (error) {
      handleSendRefusal(error, "Could not continue. Try again.", () => undefined);
      return null;
    } finally {
      spendCaptcha();
      setSending(false);
    }
  };

  const validateYou = (): FormErrors => {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (!EMAIL.test(email.trim())) next.email = "Enter a valid email address";
    const digitsOnly = phone.replace(/\D/g, "");
    if (india && digitsOnly.length !== 10) {
      next.phone = "Enter a 10-digit mobile number";
    } else if (india && !/^[6-9]/.test(digitsOnly)) {
      next.phone = "Indian mobile numbers start with 6, 7, 8 or 9";
    } else if (!isValidPhone(countryIso, phone)) {
      next.phone = "Enter a valid mobile number for that country";
    }
    return next;
  };

  const submitYou = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateYou();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (provedNow) {
      if (isAuthenticated) setProof({ via: "account", phone: e164 });
      setPane("college");
      return;
    }

    if (isAuthenticated) {
      await startPhoneVerification(null);
      return;
    }

    // An unproved session for this same address is reused, so a failed SMS claim
    // does not cost another captcha tick. One that already proved a different
    // number cannot prove this one.
    const open =
      sessionToken && sessionEmail === typedEmail && !proof ? sessionToken : await openSession();
    if (open) await startPhoneVerification(open);
  };

  const resendCode = async (channel?: OtpChannel) => {
    if (sending || cooldown > 0 || sendLimitMinutes !== null) return;
    setSending(true);
    setErrors({});
    try {
      if (otpToken) {
        await publicClient.post(ENDPOINTS.enquiry.phoneOtpRequest, { phone: e164 }, schAuth(otpToken));
      } else {
        await apiClient.post(ENDPOINTS.users.phoneOtpRequest, { phone: e164 });
      }
      setReqId(await retryOtp(reqId, channel));
      setDigits([]);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      handleSendRefusal(error, "Could not resend the code", () => {
        if (otpToken) provedBySession(otpToken, sessionEmail);
      });
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async (code: string) => {
    setSending(true);
    setErrors({});
    try {
      // The widget checks the digits and hands back a signed token; only that is worth anything.
      const widgetToken = await verifyOtp(code, reqId);
      if (otpToken) {
        await publicClient.post(
          ENDPOINTS.enquiry.phoneVerify,
          { phone: e164, accessToken: widgetToken },
          schAuth(otpToken),
        );
        provedBySession(otpToken, sessionEmail);
      } else {
        await apiClient.post(ENDPOINTS.users.phoneVerify, { phone: e164, msg91Token: widgetToken });
        setProof({ via: "account", phone: e164 });
        setPane("college");
      }
      setDigits([]);
    } catch (error) {
      setErrors({
        code: (error as ApiError)?.response
          ? apiMessage(error, "That code did not work")
          : "Incorrect code. Check it and try again.",
      });
      setDigits([]);
    } finally {
      setSending(false);
    }
  };

  const validateCollege = (): FormErrors => {
    const next: FormErrors = {};
    if (fields.college.required && !details.collegeName.trim()) next.college = "Select your college";
    const collegeEmail = details.collegeEmail.trim().toLowerCase();
    if (fields.collegeEmail.enabled) {
      if (!collegeEmail) {
        if (fields.collegeEmail.required) next.collegeEmail = "Enter your college email";
      } else if (!EMAIL.test(collegeEmail)) {
        next.collegeEmail = "Enter a valid college email";
      }
    }
    if (fields.course.required && !details.degree) next.course = "Select your course";
    if (fields.careerStage.required && !details.careerStage) {
      next.careerStage = "Select your career stage";
    }
    if (
      fields.languages.required &&
      settings.form.languages.length > 0 &&
      details.languages.length === 0
    ) {
      next.languages = "Pick at least one language";
    }
    return next;
  };

  const submitCollege = (event: FormEvent) => {
    event.preventDefault();
    const found = validateCollege();
    setErrors(found);
    if (Object.keys(found).length === 0) setPane("payout");
  };

  const validatePayout = (): FormErrors => {
    const next: FormErrors = {};
    const payout = details.payout.trim();
    if (fields.payout.enabled) {
      if (!payout) {
        if (fields.payout.required) {
          next.payout = india ? "Enter your UPI ID" : "Enter your payout details";
        }
      } else if (india && !UPI.test(payout.toLowerCase())) {
        next.payout = "Enter a valid UPI ID, like yourname@bank";
      }
    }
    const parts = [details.line, details.city, details.state, details.pincode].map((s) => s.trim());
    // A partial address is dropped by the server, so an optional one is all or nothing.
    if (
      fields.address.enabled &&
      (fields.address.required || parts.some(Boolean)) &&
      !parts.every(Boolean)
    ) {
      next.address = "Enter your full address, including city, state and pincode";
    }
    if (fields.whatsapp.required && !details.whatsappJoined) {
      next.whatsapp = "Join the WhatsApp group and tick the box";
    }
    return next;
  };

  const submitApplication = async (event: FormEvent) => {
    event.preventDefault();
    const found = validatePayout();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (!proof) {
      setErrors({ form: "Verify your number again to continue." });
      setPane("you");
      return;
    }

    /*
     * `useSession()`'s token is a snapshot from render time and only refetches
     * on focus or visibility, so it can be stale here even though NextAuth
     * would refresh it. Asking for the session fresh runs that refresh first,
     * the same way `apiClient` does for every other authenticated request.
     */
    const token =
      proof.via === "session" ? proof.token : (await getSession())?.accessToken;
    if (!token) {
      setErrors({ form: "Verify your number again to continue." });
      setPane("you");
      return;
    }

    setSending(true);
    try {
      await publicClient.post(
        ENDPOINTS.caApplications,
        {
          name: name.trim(),
          phone: e164,
          collegeId: details.collegeId || undefined,
          collegeName: details.collegeName.trim(),
          collegeEmail: details.collegeEmail.trim().toLowerCase(),
          degree: details.degree,
          careerStage: details.careerStage,
          languages: details.languages,
          payout: details.payout.trim(),
          address: {
            line: details.line.trim(),
            city: details.city.trim(),
            state: details.state.trim(),
            pincode: details.pincode.trim(),
            country: details.country.trim(),
          },
          whatsappJoined: details.whatsappJoined,
          ref: refCode || undefined,
        },
        schAuth(token),
      );
      // Attribution is spent: a later application from this tab is not this referrer's.
      try {
        sessionStorage.removeItem(CA_REF_STORAGE_KEY);
      } catch {
        /* nothing stored to clear */
      }
      setPane("done");
    } catch (error) {
      const status = (error as ApiError)?.response?.status;
      const code = (error as ApiError)?.response?.data?.error?.code;
      if (code === CA_CODES.closed) {
        setClosed(true);
      } else if (code === CA_CODES.invalid) {
        // Most invalid-field messages come from step 2, since the client mirrors
        // the server's own step-3 checks. Send those back to the pane they
        // belong to instead of showing them under the payout form.
        const message = apiMessage(error, "That did not go through. Try once more.");
        const field = COLLEGE_STEP_MESSAGES[message];
        if (field) {
          setPane("college");
          setErrors({ [field]: message });
        } else {
          setErrors({ form: message });
        }
      } else if (code === CA_CODES.applied || code === CA_CODES.ambassador) {
        setErrors({ form: apiMessage(error, "That did not go through. Try once more.") });
      } else if (proof.via === "account" && status === 401) {
        // A fresh token still failed, so the session itself is the problem, not
        // the phone number. Re-proving it would only spend an SMS the server was
        // never going to ask for; let them retry instead.
        setErrors({ form: apiMessage(error, "Your session has a problem. Try submitting again.") });
      } else if (status === 401 || status === 403) {
        // The proof lapsed (the session expired, or the profile number moved), so
        // retrying here can never pass. Step 1 re-proves it with the details kept.
        setProof(null);
        setTrustProfilePhone(false);
        setSessionToken("");
        setPane("you");
        setErrors({ form: apiMessage(error, "Verify your number again to continue.") });
      } else {
        setErrors({ form: "That did not go through. Try once more." });
      }
    } finally {
      setSending(false);
    }
  };

  const goBack = (target: Pane) => {
    setErrors({});
    setPane(target);
  };

  const youAlert = provedNow
    ? errors.form ?? ""
    : sendLimitMinutes !== null
      ? `You have requested the maximum number of codes. You can start over in ${sendLimitMinutes} minute${sendLimitMinutes === 1 ? "" : "s"}.`
      : cooldown > 0
        ? `A code was just sent. You can ask for another in ${cooldown}s.`
        : errors.form ?? "";
  const youBlocked = !provedNow && (cooldown > 0 || sendLimitMinutes !== null);

  return (
    <aside
      className={cn(
        styles.apply,
        "max-sm:[&_input]:text-base max-sm:[&_textarea]:text-base max-sm:[&_select]:text-base",
      )}
      id="apply"
      aria-labelledby="ca-apply-title"
    >
      <div className={styles.applyHead}>
        <h2 className={styles.applyTitle} id="ca-apply-title">
          Apply to join
        </h2>
        {isClosed ? null : <span className={styles.applyMeta}>Takes about 2 minutes</span>}
      </div>

      {isClosed ? (
        <ClosedNote />
      ) : (
        <>
          <Ticket batch={settings.batch} />
          <StepsBar pane={pane} onGo={goBack} />

          {pane === "you" ? (
            <YouStep
              signedIn={
                isAuthenticated
                  ? {
                      title: profileName || profile?.email || "",
                      sub: hideEmail && profileName ? profile?.email ?? "" : "",
                    }
                  : null
              }
              onSignOut={() => void handleSignOut({ redirect: false })}
              onGoogle={() => void handleGoogle()}
              oauthLoading={oauthLoading}
              name={name}
              onName={setNameInput}
              showEmail={!hideEmail}
              email={email}
              onEmail={setEmailInput}
              countryIso={countryIso}
              onCountry={(iso) => {
                setCountryInput(iso);
                setPhoneInput(sanitizePhoneInput(iso, phone));
              }}
              phone={phone}
              onPhone={(value) => setPhoneInput(sanitizePhoneInput(countryIso, value))}
              captcha={
                isAuthenticated || provedNow
                  ? null
                  : { onChange: setCaptchaToken, resetSignal: captchaNonce }
              }
              errors={errors}
              alert={youAlert}
              submitLabel={
                sending ? "Sending code..." : youBlocked && cooldown > 0 ? `Wait ${cooldown}s` : "Verify number and continue"
              }
              disabled={sending || youBlocked}
              onSubmit={(event) => void submitYou(event)}
            />
          ) : null}

          {pane === "otp" ? (
            <OtpStep
              phoneLabel={phoneLabel}
              digits={digits}
              onDigits={setDigits}
              onComplete={(code) => void confirmCode(code)}
              onBack={() => {
                setDigits([]);
                goBack("you");
              }}
              sending={sending}
              errors={errors}
              cooldown={cooldown}
              sendLimitMinutes={sendLimitMinutes}
              onResend={() => void resendCode()}
              onResendWhatsApp={() => void resendCode(OTP_CHANNEL.whatsapp)}
            />
          ) : null}

          {pane === "college" ? (
            <CollegeStep
              fields={fields}
              languages={settings.form.languages}
              details={details}
              set={setDetails}
              errors={errors}
              onBack={() => goBack("you")}
              onContinue={submitCollege}
            />
          ) : null}

          {pane === "payout" ? (
            <PayoutStep
              fields={fields}
              details={details}
              set={setDetails}
              errors={errors}
              onBack={() => goBack("college")}
              india={india}
              whatsappLink={settings.form.whatsappLink}
              sending={sending}
              onSubmit={(event) => void submitApplication(event)}
            />
          ) : null}

          {pane === "done" ? <DoneStep phoneLabel={phoneLabel} /> : null}

          <p className={styles.applyLegal}>
            By applying you agree to hear from Airkrit over call, email, SMS and WhatsApp. Read our{" "}
            <Link href="/terms-of-use">terms</Link> and <Link href="/privacy-policy">privacy policy</Link>.
          </p>
        </>
      )}
    </aside>
  );
}
