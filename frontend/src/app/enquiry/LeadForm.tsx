"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import type { Student } from "@/types";
import { signInWithOAuthProvider } from "@/lib/oauthSignInClient";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import apiClient from "@/configs/apiConfig";
import publicClient, { schAuth } from "@/configs/scholarshipApiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import useMSG91OTP, { OTP_LENGTH } from "@/hooks/useMSG91OTP";
import EnquiryButton from "./EnquiryButton";
import OtpBoxes from "./OtpBoxes";
import { ISSUERS, MNC_ADDON_PRICE, PLANS, type PlanId } from "./plans";

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
  Record<"name" | "email" | "phone" | "college" | "code" | "form", string>
>;

/** Which proof the form is currently collecting. */
type Step = "form" | "emailOtp" | "phoneOtp";

const apiMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

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
  const { ready, loadError, sendOtp, verifyOtp } = useMSG91OTP();

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
    initialCollege || null
  );
  const [collegeIdInput, setCollegeIdInput] = useState<string | null>(
    initialCollegeId || null
  );
  const [step, setStep] = useState<Step>("form");
  const [digits, setDigits] = useState<string[]>([]);
  const [reqId, setReqId] = useState<string | null>(null);
  /** Proof of the verified email, and what authorises the lead afterwards. */
  const [sessionToken, setSessionToken] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
        `/enquiry?${back.toString()}`
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

  const chosenPlan = PLANS.find((p) => p.id === selected)!;
  const freeCert = selected === 3;
  const addonCost = cert && !freeCert ? MNC_ADDON_PRICE : 0;
  const total = chosenPlan.price + addonCost;

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
      setStep("phoneOtp");
    } catch (error) {
      setErrors({ form: apiMessage(error, "Could not send the code") });
    } finally {
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

    setSending(true);
    setErrors({});
    try {
      await publicClient.post(ENDPOINTS.enquiry.otp, {
        email: email.trim().toLowerCase(),
      });
      setDigits([]);
      setStep("emailOtp");
    } catch (error) {
      setErrors({ form: apiMessage(error, "Could not send the code") });
    } finally {
      setSending(false);
    }
  };

  const confirmEmailOtp = async (code: string) => {
    setSending(true);
    setErrors({});
    try {
      const res = await publicClient.post(
        ENDPOINTS.enquiry.verifyOtp,
        { email: email.trim().toLowerCase(), otp: code },
      );
      const token = String(res.data?.data?.sessionToken ?? "");
      setSessionToken(token);
      // A number proved on an earlier session for this address carries over, so
      // a reload does not cost another SMS.
      if (res.data?.data?.phoneVerified) {
        await sendLead(token);
        return;
      }
      await startPhoneVerification(token);
    } catch (error) {
      setErrors({ code: apiMessage(error, "That code did not work") });
      setDigits([]);
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
        await sendLead(sessionToken);
        return;
      }
      await apiClient.post(ENDPOINTS.users.phoneVerify, {
        phone,
        msg91Token: accessTokenMsg91,
      });
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

  // `sent` wins: the lead is posted from inside the phone step, so `step` is
  // still on a code panel at the moment it succeeds.
  if (step !== "form" && !sent) {
    const onEmail = step === "emailOtp";
    // A signed-in visitor only ever proves the phone, so numbering the steps
    // would promise a second one that never comes.
    const showsBothSteps = !isAuthenticated;

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

          {showsBothSteps && (
            <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#c4551a]">
              Step {onEmail ? 1 : 2} of 2
            </p>
          )}

          <h2 className="text-[1.15rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-text-primary">
            {onEmail ? "Check your inbox" : "Check your messages"}
          </h2>
          <p className="mt-1.5 mb-4 text-[13px] leading-[1.5] text-text-secondary">
            We sent a {OTP_LENGTH}-digit code to{" "}
            <b className="font-bold text-text-primary">
              {onEmail ? email.trim().toLowerCase() : `+91 ${phone}`}
            </b>
            .
          </p>

          <OtpBoxes
            length={OTP_LENGTH}
            digits={digits}
            onChange={setDigits}
            onComplete={onEmail ? confirmEmailOtp : confirmPhoneOtp}
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

          <p className="mt-4 text-[11.5px] leading-[1.45] text-[#8c7a70]">
            {sending
              ? "Checking…"
              : onEmail
                ? "Enter the code and we will move straight on to your number."
                : "Enter the code and your details go to our counselling team."}
          </p>
        </div>
      </div>
    );
  }

  if (sent) {
    const plan = PLANS.find((p) => p.id === selected)!;
    return (
      <div className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]" id="eq-form">
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
              <b className="text-[#c4551a]">On the call:</b> your counsellor takes
              you through the {plan.name} plan, what it covers and the fees.
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
    <div className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]" id="eq-form">
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
            <Check size={13} strokeWidth={3.4} className="mt-[3.5px] flex-none text-[#2c7f34]" />
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
            <label className="block text-[11.5px] font-bold text-text-primary mb-1" htmlFor="eq-name">
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
            {errors.name && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.name}</span>}
          </div>
        )}

        {!hideEmail && (
          <div className="mb-2.5">
            <label className="block text-[11.5px] font-bold text-text-primary mb-1" htmlFor="eq-email">
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
            {errors.email && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.email}</span>}
          </div>
        )}

        <div className="mb-2.5">
          <label className="block text-[11.5px] font-bold text-text-primary mb-1" htmlFor="eq-phone">
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
          {errors.phone && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.phone}</span>}
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
            <span className="block text-[12.5px] font-bold text-text-primary">Plan you are interested in</span>
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
            {PLANS.map((plan) => (
              <label
                key={plan.id}
                className={cn(
                  "relative block cursor-pointer rounded-lg border-[1.5px] px-1.5 py-2 text-center transition-[border-color,background-color,box-shadow] duration-150",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                  selected === plan.id
                    ? "border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(247,173,36,0.22)]"
                    : "border-[#ecdfd5] bg-[#fffcfa] hover:border-[#f2d6c2]"
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
                {freeCert ? "1 included free" : `+₹${MNC_ADDON_PRICE.toLocaleString("en-IN")} each`}
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
                  {freeCert ? "Help me choose later" : "No certification"}
                </option>
                {ISSUERS.map((issuer) => (
                  <option key={issuer.name} value={issuer.name}>
                    {issuer.name}
                    {freeCert
                      ? " (free)"
                      : ` (+₹${MNC_ADDON_PRICE.toLocaleString("en-IN")})`}
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
                : `${chosenPlan.name}, no certification added`}
            </span>
            <span className="flex-none text-[14px] font-extrabold text-primary">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {errors.form && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.form}</span>}

        <EnquiryButton type="submit" block disabled={sending}>
          {sending ? "Sending" : "Send me the details"}
          {!sending && <ArrowRight size={15} strokeWidth={2.5} />}
        </EnquiryButton>

        <p className="mt-2.5 text-[10.5px] leading-[1.45] text-[#8c7a70]">
          By submitting you agree to hear from Airkrit about this plan over
          email, SMS and WhatsApp. Read our{" "}
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
