"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import type { Student } from "@/types";
import { signInWithOAuthProvider } from "@/lib/oauthSignInClient";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import apiClient from "@/configs/apiConfig";
import publicClient, { schAuth } from "@/configs/scholarshipApiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import useMSG91OTP, {
  OTP_LENGTH as PHONE_OTP_LENGTH,
} from "@/hooks/useMSG91OTP";
import RecaptchaV2 from "@/components/ui/RecaptchaV2";
import {
  CAPTCHA_ERROR_CODES,
  PHONE_ERROR_CODES,
} from "@/constants/authErrorCodes";
import EnquiryButton from "./EnquiryButton";
import OtpBoxes from "./OtpBoxes";
import { ISSUERS, type PlanId } from "../plans";
import { usePlanData } from "../usePlanData";

type Props = {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  /** Chosen MNC certification, null if none. Free on Mentor-to-Placement. */
  cert: string | null;
  onCert: (cert: string | null) => void;
  onCompare: () => void;
  /** College carried back through the Google round trip, if any. */
  initialCollege?: string;
  initialCollegeId?: string;
};

type Errors = Partial<
  Record<
    "name" | "email" | "phone" | "college" | "code" | "captcha" | "form",
    string
  >
>;

/** Which proof the form is currently collecting. */
type Step = "form" | "phoneOtp";

const apiMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

/** Matches the server's cooldown, and only used until it reports the real one. */
const RESEND_COOLDOWN_SECONDS = 60;

/** Shown when the box is untouched. Matches the wording the backend returns. */
const CAPTCHA_PROMPT = "Please confirm you are not a robot.";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LeadForm({
  selected,
  onSelect,
  cert,
  onCert,
  onCompare,
  initialCollege = "",
  initialCollegeId = "",
}: Props) {
  const { user, isAuthenticated, accessToken, handleSignOut } = useAuth();
  const { ready, loadError, sendOtp, retryOtp, verifyOtp } = useMSG91OTP();

  /*
   * Signed-in students get their profile as the default for each field, but
   * anything they type wins. Holding the inputs as null-until-touched keeps
   * that a derived value, so the profile can land after hydration without an
   * effect writing state back into the form.
   */
  const profile = isAuthenticated ? user : undefined;
  const profileName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const profilePhone = (profile?.phone ?? "").replace(/\D/g, "").slice(-10);
  const student = profile as Student | undefined;
  const profileCollege = (student?.collegeName ?? "").trim();
  const profileCollegeId = student?.college ?? "";

  const [nameInput, setNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const [collegeInput, setCollegeInput] = useState<string | null>(
    initialCollege || null,
  );
  const [collegeIdInput, setCollegeIdInput] = useState<string | null>(
    initialCollegeId || null,
  );
  const [step, setStep] = useState<Step>("form");
  const [digits, setDigits] = useState<string[]>([]);
  const [reqId, setReqId] = useState<string | null>(null);
  /** What authorises the phone calls and the lead afterwards. */
  const [sessionToken, setSessionToken] = useState("");
  /** The address `sessionToken` was opened for; editing it invalidates the session. */
  const [sessionEmail, setSessionEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  /** Seconds until another code may be asked for. Drives the button, not a toast. */
  const [cooldown, setCooldown] = useState(0);
  /**
   * Set once every code this window allows is spent. Distinct from `cooldown`:
   * that one clears itself, this one has to retire the button, because
   * re-arming it would only dead-end them again.
   */
  const [sendLimitMinutes, setSendLimitMinutes] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  /**
   * Both proofs are in and only the lead itself is still owed.
   *
   * Once the number is proved the session's SMS budget is closed, so every
   * button that books another code is refused from here on. Without this the
   * panel kept offering "Resend code" as the only way forward and a lead that
   * failed to post had nowhere to go.
   */
  const [phoneProved, setPhoneProved] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [sent, setSent] = useState(false);
  /**
   * Solved reCAPTCHA response, required by `/enquiry/start`. Only the anonymous
   * path needs one: a signed-in visitor never touches that route, and the two
   * they do touch are already behind their access token. With no email code in
   * the way it is the only thing between a script and this form's SMS budget.
   */
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  /** Bumped to clear a tick the server has already spent. */
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const needsCaptcha = !isAuthenticated;

  const name = nameInput ?? profileName;
  const email = emailInput ?? profile?.email ?? "";
  const phone = phoneInput ?? profilePhone;
  const college = collegeInput ?? profileCollege;
  const collegeId = collegeIdInput ?? profileCollegeId;

  const setName = setNameInput;
  const setEmail = setEmailInput;
  const setPhone = setPhoneInput;

  /** Google returns the student here with their picks intact. */
  const handleGoogle = async () => {
    setOauthLoading(true);
    const back = new URLSearchParams({ plan: String(selected) });
    if (cert) back.set("cert", cert);
    if (college) back.set("college", college);
    if (collegeId) back.set("collegeId", collegeId);

    try {
      const out = await signInWithOAuthProvider(
        "google",
        `/enquiry?${back.toString()}`,
      );
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

  const hideName =
    isAuthenticated && nameInput === null && profileName.trim().length >= 2;
  const hideEmail =
    isAuthenticated && emailInput === null && EMAIL.test(email.trim());

  const { plans, mncAddonPrice, planById } = usePlanData();
  const chosenPlan = planById(selected);
  const freeCert = selected === 3;
  const addonCost = cert && !freeCert ? mncAddonPrice : 0;
  const total = chosenPlan.price + addonCost;

  /*
   * Every panel after the form is a fraction of its height, so swapping one in
   * shortens the page under a scroll position taken against the taller one. The
   * visitor is left looking at whatever now sits in the middle of the screen
   * and reads the form as submitted, when a code is waiting to be typed.
   *
   * Skipped while the form itself is showing: this must never fire on load and
   * drag someone who opened /enquiry past the top of the page.
   */
  useEffect(() => {
    if (step === "form" && !phoneProved && !sent) return;
    document.getElementById("eq-form")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }, [step, phoneProved, sent]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  /**
   * A v2 token dies on first use, whatever the server made of it, so the box
   * has to come back unticked after every send that carried one.
   */
  const spendCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  };

  /**
   * Turns a refused send into something the UI can act on.
   *
   * A throttle is a known state, not a failure: the server says when the next
   * code is allowed, so the button counts down instead of inviting a click that
   * would only bounce again.
   */
  const handleSendRefusal = (error: unknown, fallback: string) => {
    const detail = (
      error as {
        response?: {
          data?: { error?: { code?: string; meta?: Record<string, unknown> } };
        };
      }
    )?.response?.data?.error;

    // A captcha refusal belongs beside the box, not in the throttle banner:
    // the fix is one more tick, and nothing here is worth counting down.
    if (
      detail?.code === CAPTCHA_ERROR_CODES.CAPTCHA_REQUIRED ||
      detail?.code === CAPTCHA_ERROR_CODES.CAPTCHA_REJECTED ||
      detail?.code === CAPTCHA_ERROR_CODES.CAPTCHA_UNAVAILABLE
    ) {
      setErrors({ captcha: apiMessage(error, fallback) });
      return;
    }

    // Not a failure: the number is already proved for this session, so there is
    // no code left to send and the only thing still owed is the lead.
    if (detail?.code === PHONE_ERROR_CODES.PHONE_ALREADY_VERIFIED) {
      setPhoneProved(true);
      setErrors({});
      void retryLead();
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

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (!EMAIL.test(email.trim())) next.email = "Enter a valid email address";
    if (phone.length !== 10) {
      next.phone = "Enter a 10-digit mobile number";
    } else if (!/^[6-9]/.test(phone)) {
      next.phone = "Indian mobile numbers start with 6, 7, 8 or 9";
    }
    if (!college.trim()) next.college = "Select your college";
    return next;
  };

  /**
   * Sends the lead once both channels are proved. `authToken` is the whole
   * authorisation story: the contact-session token for a visitor with no
   * account, or the signed-in access token, and the backend reads the verified
   * email and phone from whichever it turns out to be.
   */
  const sendLead = async (authToken: string) => {
    setSending(true);
    try {
      const response = await fetch("/api/enquiry-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone,
          college: college.trim(),
          authToken,
          plan: selected,
          certification: cert,
          total,
          source: typeof window !== "undefined" ? window.location.search : "",
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      setSent(true);
    } catch {
      setErrors({ form: "That did not go through. Try once more." });
    } finally {
      setSending(false);
    }
  };

  /**
   * Posts the lead again after a failed attempt. The proofs survive the
   * failure, so this never asks for another code.
   */
  const retryLead = async () => {
    const token = sessionToken || accessToken;
    if (!token) {
      setErrors({ form: "Start again from your details." });
      return;
    }
    await sendLead(token);
  };

  /** Books an SMS on the right endpoint, then lets the widget dispatch it. */
  const startPhoneVerification = async (sessionToken: string | null) => {
    if (!ready) {
      setErrors({ form: loadError || "Verification is still loading." });
      return;
    }
    setSending(true);
    setErrors({});
    try {
      if (sessionToken) {
        await publicClient.post(
          ENDPOINTS.enquiry.phoneOtpRequest,
          { phone },
          schAuth(sessionToken),
        );
      } else {
        // Signed in and changing their number: this path writes the proved
        // number to the profile, which is what the lead gate compares against.
        await apiClient.post(ENDPOINTS.users.phoneOtpRequest, { phone });
      }
      setReqId(await sendOtp(phone));
      setDigits([]);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("phoneOtp");
    } catch (error) {
      handleSendRefusal(error, "Could not send the code");
    } finally {
      setSending(false);
    }
  };

  /**
   * Opens the session the phone step runs on, for a visitor with no account.
   *
   * The address is taken as typed: this form books a sales call, so the number
   * is the part worth proving and it is proved next. The tick is spent either
   * way, refused or not, because the server has now seen that token and will
   * not take it a second time.
   */
  const openSession = async (): Promise<string | null> => {
    if (!captchaToken) {
      setErrors({ captcha: CAPTCHA_PROMPT });
      return null;
    }

    setSending(true);
    setErrors({});
    try {
      const res = await publicClient.post(ENDPOINTS.enquiry.start, {
        email: email.trim().toLowerCase(),
        recaptchaToken: captchaToken,
      });
      const token = String(res.data?.data?.sessionToken ?? "");
      setSessionToken(token);
      setSessionEmail(email.trim().toLowerCase());
      return token || null;
    } catch (error) {
      handleSendRefusal(error, "Could not continue. Try again.");
      return null;
    } finally {
      spendCaptcha();
      setSending(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Signed in, number unchanged: the account settled the email and the
    // profile already holds this proved number, so there is nothing to re-prove.
    if (isAuthenticated && accessToken && phone === profilePhone) {
      await sendLead(accessToken);
      return;
    }

    // Signed in, number changed: only the phone needs proving.
    if (isAuthenticated) {
      await startPhoneVerification(null);
      return;
    }

    // A session already open for this same address is reused, so a failed SMS
    // claim does not cost the visitor another captcha tick to try again.
    const open =
      sessionToken && sessionEmail === email.trim().toLowerCase()
        ? sessionToken
        : await openSession();
    if (open) await startPhoneVerification(open);
  };

  const resendCode = async () => {
    if (sending || cooldown > 0 || sendLimitMinutes !== null) return;

    setSending(true);
    setErrors({});
    try {
      if (sessionToken) {
        await publicClient.post(
          ENDPOINTS.enquiry.phoneOtpRequest,
          { phone },
          schAuth(sessionToken),
        );
      } else {
        await apiClient.post(ENDPOINTS.users.phoneOtpRequest, { phone });
      }
      setReqId(await retryOtp(reqId));
      setDigits([]);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      handleSendRefusal(error, "Could not resend the code");
    } finally {
      setSending(false);
    }
  };

  const confirmPhoneOtp = async (code: string) => {
    setSending(true);
    setErrors({});
    try {
      // The widget checks the digits and hands back a signed token. Only that
      // token is worth anything to the backend.
      const accessTokenMsg91 = await verifyOtp(code, reqId);
      if (sessionToken) {
        await publicClient.post(
          ENDPOINTS.enquiry.phoneVerify,
          { phone, accessToken: accessTokenMsg91 },
          schAuth(sessionToken),
        );
        // Set before the lead goes out: from here the proof holds whatever the
        // post does, and re-proving it is neither possible nor needed.
        setPhoneProved(true);
        await sendLead(sessionToken);
        return;
      }
      await apiClient.post(ENDPOINTS.users.phoneVerify, {
        phone,
        msg91Token: accessTokenMsg91,
      });
      setPhoneProved(true);
      if (accessToken) await sendLead(accessToken);
    } catch (error) {
      setErrors({
        code: (error as { response?: unknown })?.response
          ? apiMessage(error, "That code did not work")
          : "Incorrect code. Check it and try again.",
      });
      setDigits([]);
    } finally {
      setSending(false);
    }
  };

  /*
   * Both proofs are in but the lead has not landed yet. Its own panel, because
   * the code panel underneath is spent: the boxes have nothing left to check
   * and its resend button books an SMS the server will refuse. This is the
   * only thing left to do, so it is the only thing on screen.
   */
  if (phoneProved && !sent) {
    return (
      <div
        className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]"
        id="eq-form"
      >
        <div className="px-[18px] pt-5 pb-[18px] sm:px-6 sm:pb-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-6 flex-none place-items-center rounded-full bg-[#3aa544]/[0.12] text-[#2c7f34]">
              <Check size={14} strokeWidth={3.4} />
            </span>
            <h2 className="text-[1.15rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-text-primary">
              Email and number verified
            </h2>
          </div>
          <p className="mb-4 text-[13px] leading-[1.5] text-text-secondary">
            {sending
              ? "Sending your details to our counselling team."
              : "Nothing else to verify. Send your details and a counsellor will call you."}
          </p>

          {errors.form && (
            <span className="mb-3 block text-xs font-semibold text-[#c03c19]">
              {errors.form}
            </span>
          )}

          <EnquiryButton
            type="button"
            block
            disabled={sending}
            onClick={() => void retryLead()}
          >
            {sending ? "Sending…" : "Send my details"}
            {!sending && <ArrowRight size={16} strokeWidth={2.8} />}
          </EnquiryButton>
        </div>
      </div>
    );
  }

  // `sent` wins: the lead is posted from inside the phone step, so `step` is
  // still on a code panel at the moment it succeeds.
  if (step !== "form" && !sent) {
    return (
      <div
        className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]"
        id="eq-form"
      >
        <div className="px-[18px] pt-4 pb-[18px] sm:px-6 sm:pt-5 sm:pb-5">
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setDigits([]);
              setErrors({});
            }}
            className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#8c7a70] transition-colors hover:text-[#c4551a]"
          >
            <ArrowDown size={13} strokeWidth={2.8} className="rotate-90" />
            Back to your details
          </button>

          <h2 className="text-[1.15rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-text-primary">
            Check your messages
          </h2>
          <p className="mt-1.5 mb-4 text-[13px] leading-[1.5] text-text-secondary">
            We sent a {PHONE_OTP_LENGTH}-digit code to{" "}
            <b className="font-bold text-text-primary">+91 {phone}</b>.
          </p>

          <OtpBoxes
            length={PHONE_OTP_LENGTH}
            digits={digits}
            onChange={setDigits}
            onComplete={confirmPhoneOtp}
            disabled={sending}
            invalid={Boolean(errors.code)}
          />

          {errors.code && (
            <span className="mt-2 block text-xs font-semibold text-[#c03c19]">
              {errors.code}
            </span>
          )}
          {errors.form && (
            <span className="mt-2 block text-xs font-semibold text-[#c03c19]">
              {errors.form}
            </span>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {sendLimitMinutes !== null ? (
              <p className="text-[11.5px] leading-[1.45] font-semibold text-[#a8401a]">
                You have requested the maximum number of codes. You can start
                over in {sendLimitMinutes} minute
                {sendLimitMinutes === 1 ? "" : "s"}.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void resendCode()}
                  disabled={cooldown > 0 || sending}
                  className="text-[12.5px] font-bold text-[#c4551a] hover:underline disabled:cursor-not-allowed disabled:text-[#a3928a] disabled:no-underline"
                >
                  {sending
                    ? "Sending…"
                    : cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : "Resend code"}
                </button>
                <span className="text-[11.5px] leading-[1.45] text-[#8c7a70]">
                  Then your details go to our counselling team.
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (sent) {
    const plan = planById(selected);
    return (
      <div
        className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]"
        id="eq-form"
      >
        <div className="px-[26px] pt-10 pb-[34px] text-center">
          <div className="mx-auto mb-[18px] grid size-14 place-items-center rounded-full bg-[#3aa544]/[0.12] text-[#3aa544]">
            <Check size={26} strokeWidth={3} />
          </div>
          <h2 className="mb-2.5 text-2xl font-extrabold tracking-[-0.02em] text-text-primary">
            We have your details
          </h2>
          <p className="mx-auto max-w-[36ch] text-[0.9375rem] leading-[1.6] text-text-secondary">
            You picked the {plan.name} plan. A counsellor will call you on +91{" "}
            {phone} within one working day.
          </p>
          <ul className="mt-6 grid gap-3 border-t border-[#fbe3d2] pt-5 text-left text-sm leading-[1.5] text-text-secondary">
            <li>
              <b className="text-[#c4551a]">Nothing charged:</b> this is an
              enquiry, not an enrolment. No payment has been taken.
            </li>
            <li>
              <b className="text-[#c4551a]">On the call:</b> your counsellor
              takes you through the {plan.name} plan, what it covers and the
              fees.
            </li>
            <li>
              <b className="text-[#c4551a]">You pick the course:</b> the plan
              applies to one course you choose from our catalogue, so you decide
              what you want to learn.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]"
      id="eq-form"
    >
      <form
        className="px-[18px] pt-4 pb-[18px] sm:px-6 sm:pt-5 sm:pb-5"
        onSubmit={submit}
        noValidate
      >
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[1.15rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-text-primary">
            Get your plan details
          </h2>
          <span className="flex-none text-[11px] font-semibold whitespace-nowrap text-[#8c7a70]">
            Takes 30 seconds
          </span>
        </div>

        {isAuthenticated ? (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-[#3aa544]/[0.08] px-3 py-2">
            <Check
              size={13}
              strokeWidth={3.4}
              className="mt-[3.5px] flex-none text-[#2c7f34]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold text-[#2c7f34]">
                Signed in as {profileName || profile?.email}
              </p>
              {hideEmail && profileName ? (
                <p className="truncate text-[10.5px] leading-[1.4] text-[#2c7f34]/75">
                  {profile?.email}
                </p>
              ) : null}
            </div>
            {/* `redirect: false` keeps them on the page. Bouncing a lead to
                /login to sign out would end the visit. */}
            <button
              type="button"
              onClick={() => void handleSignOut({ redirect: false })}
              className="mt-[1px] flex-none rounded px-1 text-[11px] font-bold text-[#2c7f34]/80 underline underline-offset-2 transition-colors hover:text-[#2c7f34] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2c7f34]"
            >
              Log out
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={oauthLoading}
              className="mb-2.5 flex h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#ecdfd5] bg-white text-[13.5px] font-bold text-text-primary transition-[border-color,background-color] duration-150 hover:border-[#f2d6c2] hover:bg-[#fffaf6] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Image src="/google-icon.svg" alt="" width={16} height={16} />
              {oauthLoading ? "Opening Google..." : "Continue with Google"}
            </button>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="h-px flex-1 bg-[#f2d6c2]" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8c7a70]">
                or fill it in
              </span>
              <span className="h-px flex-1 bg-[#f2d6c2]" />
            </div>
          </>
        )}

        {!hideName && (
          <div className="mb-2.5">
            <label
              className="block text-[11.5px] font-bold text-text-primary mb-1"
              htmlFor="eq-name"
            >
              Full name
            </label>
            <input
              id="eq-name"
              className="h-[42px] w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
              type="text"
              autoComplete="name"
              placeholder="Ananya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">
                {errors.name}
              </span>
            )}
          </div>
        )}

        {!hideEmail && (
          <div className="mb-2.5">
            <label
              className="block text-[11.5px] font-bold text-text-primary mb-1"
              htmlFor="eq-email"
            >
              Email
            </label>
            <input
              id="eq-email"
              className="h-[42px] w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">
                {errors.email}
              </span>
            )}
          </div>
        )}

        <div className="mb-2.5">
          <label
            className="block text-[11.5px] font-bold text-text-primary mb-1"
            htmlFor="eq-phone"
          >
            Mobile number
          </label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-[42px] flex-none items-center rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fbf3ed] px-3 text-[14px] font-semibold text-text-secondary">
              +91
            </span>
            <input
              id="eq-phone"
              className="h-[42px] w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              aria-invalid={!!errors.phone}
            />
          </div>
          {errors.phone && (
            <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">
              {errors.phone}
            </span>
          )}
        </div>

        <div className="mb-2.5">
          <CollegeSelect
            label="University / College"
            labelClassName="text-[11.5px] font-bold text-text-primary mb-1"
            placeholder="Search and select your college"
            value={college}
            onChange={(value) => {
              setCollegeInput(value);
              setCollegeIdInput(null);
            }}
            onSelect={(picked) => {
              setCollegeInput(picked.display);
              setCollegeIdInput(picked._id);
            }}
            error={errors.college}
          />
        </div>

        <div className="mb-2.5">
          <div className="mb-[9px] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
            <span className="block text-[12.5px] font-bold text-text-primary">
              Plan you are interested in
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-bold text-[#c4551a] underline decoration-[#c4551a]/40 decoration-[1.5px] underline-offset-[3px] hover:text-primary hover:decoration-current focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary"
              onClick={onCompare}
            >
              Compare plans
              <ArrowDown size={13} strokeWidth={2.6} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className={cn(
                  "relative block cursor-pointer rounded-lg border-[1.5px] px-1.5 py-2 text-center transition-[border-color,background-color,box-shadow] duration-150",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                  selected === plan.id
                    ? "border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(247,173,36,0.22)]"
                    : "border-[#ecdfd5] bg-[#fffcfa] hover:border-[#f2d6c2]",
                )}
              >
                <input
                  type="radio"
                  name="plan-form"
                  value={plan.id}
                  checked={selected === plan.id}
                  onChange={() => onSelect(plan.id)}
                  className="sr-only"
                />
                <span className="block truncate text-[11.5px] font-bold text-text-primary">
                  {plan.name}
                </span>
                <span className="mt-0.5 block text-[12.5px] font-extrabold text-primary">
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-2.5">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label
                className="block text-[11.5px] font-bold text-text-primary"
                htmlFor="eq-cert"
              >
                MNC certification
              </label>
              <span className="flex-none text-[10.5px] font-bold whitespace-nowrap text-[#c4551a]">
                {freeCert
                  ? "1 included free"
                  : `+₹${mncAddonPrice.toLocaleString("en-IN")} each`}
              </span>
            </div>
            <div className="relative">
              <select
                id="eq-cert"
                className="h-[42px] w-full appearance-none rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] pr-9 pl-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)]"
                value={cert ?? ""}
                onChange={(e) => onCert(e.target.value || null)}
              >
                <option value="">
                  {/* Not "none": every plan ships Airkrit's own certificates,
                      and this dropdown only decides the MNC exam on top. */}
                  {freeCert
                    ? "Help me choose later"
                    : "Airkrit certificates only"}
                </option>
                {ISSUERS.map((issuer) => (
                  <option key={issuer.name} value={issuer.name}>
                    {issuer.name}
                    {freeCert
                      ? " (free)"
                      : ` (+₹${mncAddonPrice.toLocaleString("en-IN")})`}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                strokeWidth={2.6}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#8c7a70]"
              />
            </div>
            <p className="mt-1 text-[10.5px] leading-[1.45] text-[#8c7a70]">
              {freeCert
                ? "Mentor-to-Placement includes one certification of your choice at no extra cost."
                : "Optional. Sit the official exam and get certified by Meta, Microsoft, Adobe or Cisco."}
            </p>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2 rounded-lg bg-[#fff6f1] px-3 py-2">
            <span className="text-[11px] leading-[1.35] font-semibold text-text-secondary">
              {cert
                ? addonCost > 0
                  ? `${chosenPlan.name} + ${cert} certification`
                  : `${chosenPlan.name}, ${cert} certification included`
                : `${chosenPlan.name}, Airkrit certificates only`}
            </span>
            <span className="flex-none text-[14px] font-extrabold text-primary">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {needsCaptcha && (
          <div className="mt-3">
            <RecaptchaV2
              onChange={setCaptchaToken}
              resetSignal={captchaNonce}
            />
            {errors.captcha && (
              <span className="mt-1 block text-xs font-semibold text-[#c03c19]">
                {errors.captcha}
              </span>
            )}
          </div>
        )}

        {(errors.form || cooldown > 0 || sendLimitMinutes !== null) && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-[#f0b9a2] bg-[#fff4ef] px-3 py-2.5 text-[12.5px] leading-[1.45] font-semibold text-[#a8401a]"
          >
            <TriangleAlert
              size={14}
              strokeWidth={2.6}
              className="mt-[1px] flex-none"
            />
            <span>
              {sendLimitMinutes !== null
                ? `You have requested the maximum number of codes. You can start over in ${sendLimitMinutes} minute${sendLimitMinutes === 1 ? "" : "s"}.`
                : cooldown > 0
                  ? `A code was just sent. You can ask for another in ${cooldown}s.`
                  : errors.form}
            </span>
          </p>
        )}

        <EnquiryButton
          type="submit"
          block
          disabled={sending || cooldown > 0 || sendLimitMinutes !== null}
          className="mt-3"
        >
          {sending
            ? "Sending"
            : cooldown > 0
              ? `Wait ${cooldown}s`
              : "Send me the details"}
          {!sending && <ArrowRight size={15} strokeWidth={2.5} />}
        </EnquiryButton>

        <p className="mt-2.5 text-[10.5px] leading-[1.45] text-[#8c7a70]">
          By submitting you agree to hear from Airkrit about this plan over
          call, email, SMS and WhatsApp. Read our{" "}
          <Link
            href="/terms-of-use"
            className="text-text-secondary underline underline-offset-2"
          >
            terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="text-text-secondary underline underline-offset-2"
          >
            privacy policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
