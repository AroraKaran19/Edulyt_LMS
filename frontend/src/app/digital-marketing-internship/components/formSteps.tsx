"use client";

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Lock,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import CollegeSelect from "@/components/ui/inputs/CollegeSelect";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import RecaptchaV2 from "@/components/ui/RecaptchaV2";
import Modal from "@/components/ui/Modal";
import OtpBoxes from "@/app/enquiry/components/OtpBoxes";
import { OTP_LENGTH } from "@/hooks/useMSG91OTP";
import { COUNTRY_CODES, dialFor } from "@/constants/countryCodes";
import {
  DEGREE_OPTIONS,
  EXPERIENCE_LEVELS,
} from "@/lib/constants/profileOptions";
import { cn } from "@/lib/utils";
import type {
  CaFieldConfig,
  CaOptionalField,
  CaPageSettings,
} from "@/types/ca-page-settings";
import styles from "../apply.module.css";
import { SUPPORT_PHONE } from "../content";
import ButtonLink from "./ButtonLink";

// Same config as the shared Input, so the country picker matches the number box beside it.
const siteFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export type Pane = "you" | "otp" | "college" | "payout" | "done";

export type FormErrors = Partial<
  Record<
    | "name"
    | "duration"
    | "email"
    | "phone"
    | "captcha"
    | "code"
    | "form"
    | "college"
    | "collegeEmail"
    | "course"
    | "careerStage"
    | "languages"
    | "payout"
    | "address"
    | "whatsapp",
    string
  >
>;

export type Details = {
  collegeName: string;
  collegeId: string;
  collegeEmail: string;
  degree: string;
  careerStage: string;
  languages: string[];
  payout: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  whatsappJoined: boolean;
};

type Fields = Record<CaOptionalField, CaFieldConfig>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-01" as "1 Oct 2026". Intl writes "Sept" in en-GB and en-IN. */
export const formatYmd = (ymd: string | null): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd ?? "");
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
};

const flagEmoji = (iso: string) =>
  String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

function Flag({ iso }: { iso: string }) {
  if (iso !== "IN") return <span aria-hidden="true">{flagEmoji(iso)}</span>;
  return (
    <svg className={styles.flag} width="22" height="15" viewBox="0 0 3 2" aria-hidden="true">
      <rect width="3" height="2" fill="#fff" />
      <rect width="3" height=".667" fill="#FF9933" />
      <rect y="1.333" width="3" height=".667" fill="#138808" />
      <circle cx="1.5" cy="1" r=".27" fill="none" stroke="#000080" strokeWidth=".06" />
    </svg>
  );
}

export function DurationTicket({
  enrollment,
  value,
  onChange,
  error,
}: {
  enrollment: CaPageSettings["enrollment"];
  value: number | null;
  onChange: (months: number) => void;
  error?: string;
}) {
  return (
    <div className={styles.field}>
      <Select
        label="Internship duration"
        placeholder="Select how long you want to intern"
        options={enrollment.durations.map((months) => ({
          value: String(months),
          label: `${months} month${months === 1 ? "" : "s"}`,
        }))}
        value={value ? String(value) : ""}
        onChange={(v) => onChange(Number(v))}
        error={error}
      />
      <p className={styles.ticketNote}>Your joining date is confirmed the moment you&apos;re approved.</p>
    </div>
  );
}

const STEPS: { n: number; label: string; pane: Pane }[] = [
  { n: 1, label: "You", pane: "you" },
  { n: 2, label: "College", pane: "college" },
  { n: 3, label: "Payout and kit", pane: "payout" },
];

const STEP_OF: Record<Pane, number> = { you: 1, otp: 1, college: 2, payout: 3, done: 4 };

/** Goes back to a finished step only. Nothing ahead of the current one is proved yet. */
export function StepsBar({ pane, onGo }: { pane: Pane; onGo: (pane: Pane) => void }) {
  const current = STEP_OF[pane];
  return (
    <ol className={styles.steps} aria-label="Application steps">
      {STEPS.map((step) => (
        <li
          key={step.n}
          className={cn(step.n === current && styles.isOn, step.n < current && styles.isDone)}
        >
          <button
            type="button"
            aria-current={step.n === current ? "step" : undefined}
            disabled={step.n >= current || current > 3}
            onClick={() => onGo(step.pane)}
          >
            <span className={styles.stepsBar} />
            {step.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

function Field({
  id,
  labelId,
  label,
  optional,
  lock,
  help,
  error,
  children,
}: {
  id?: string;
  labelId?: string;
  label: string;
  optional?: boolean;
  lock?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  const text = (
    <>
      <span>
        {label}
        {optional ? <span className={styles.optional}> (optional)</span> : null}
      </span>
      {lock ? (
        <span className={styles.lock}>
          <Lock aria-hidden="true" />
          Stored encrypted
        </span>
      ) : null}
    </>
  );
  return (
    <div className={styles.field}>
      {id ? (
        <label className={styles.fieldLabel} htmlFor={id}>
          {text}
        </label>
      ) : (
        <span className={styles.fieldLabel} id={labelId}>
          {text}
        </span>
      )}
      {children}
      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
      {help ? <p className={styles.help}>{help}</p> : null}
    </div>
  );
}

function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className={styles.alert}>
      <TriangleAlert aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

type YouStepProps = {
  signedIn: { title: string; sub: string } | null;
  onSignOut: () => void;
  onGoogle: () => void;
  oauthLoading: boolean;
  name: string;
  onName: (value: string) => void;
  showEmail: boolean;
  email: string;
  onEmail: (value: string) => void;
  countryIso: string;
  onCountry: (iso: string) => void;
  phone: string;
  onPhone: (value: string) => void;
  captcha: { onChange: (token: string | null) => void; resetSignal: number } | null;
  errors: FormErrors;
  alert: string;
  submitLabel: string;
  disabled: boolean;
  onSubmit: (event: FormEvent) => void;
};

export function YouStep(p: YouStepProps) {
  const dial = dialFor(p.countryIso);
  const country = COUNTRY_CODES.find((c) => c.iso === p.countryIso);
  return (
    <form id="ca-active-pane" tabIndex={-1} className={styles.pane} onSubmit={p.onSubmit} noValidate>
      {p.signedIn ? (
        <div className={styles.signed}>
          <Check aria-hidden="true" strokeWidth={3} />
          <div className={styles.signedText}>
            <span>Signed in as {p.signedIn.title}</span>
            {p.signedIn.sub ? <span className={styles.signedSub}>{p.signedIn.sub}</span> : null}
          </div>
          <button type="button" onClick={p.onSignOut}>
            Log out
          </button>
        </div>
      ) : (
        <>
          <button
            className={styles.google}
            type="button"
            onClick={p.onGoogle}
            disabled={p.oauthLoading}
          >
            <Image src="/google-icon.svg" alt="" width={18} height={18} />
            {p.oauthLoading ? "Opening Google..." : "Continue with Google"}
          </button>
          <div className={styles.or}>or fill it in</div>
        </>
      )}

      <Field id="ca-name" label="Full name">
        <Input
          id="ca-name"
          autoComplete="name"
          placeholder="Your full name"
          value={p.name}
          setChange={(value: string) => p.onName(value)}
          error={p.errors.name}
        />
      </Field>

      {p.showEmail ? (
        <Field id="ca-email" label="Email">
          <Input
            id="ca-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Your personal email"
            value={p.email}
            setChange={(value: string) => p.onEmail(value)}
            error={p.errors.email}
          />
        </Field>
      ) : null}

      <Field
        id="ca-phone"
        label="Mobile number"
        error={p.errors.phone}
        help={`We text you a ${OTP_LENGTH}-digit code to confirm it's yours.`}
      >
        <div className={styles.phone}>
          <div className={cn(styles.cc, siteFont.className)}>
            <Flag iso={p.countryIso} />
            {dial}
            <ChevronDown className={styles.ccChevron} aria-hidden="true" />
            <select
              aria-label={`Country code, ${country?.name ?? ""} ${dial}`}
              value={p.countryIso}
              onChange={(e) => p.onCountry(e.target.value)}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {c.name} ({c.dial})
                </option>
              ))}
            </select>
          </div>
          <Input
            id="ca-phone"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="Your mobile number"
            value={p.phone}
            setChange={(value: string) => p.onPhone(value)}
            aria-invalid={Boolean(p.errors.phone)}
          />
        </div>
      </Field>

      {p.captcha ? (
        <div className={styles.captcha}>
          <RecaptchaV2 onChange={p.captcha.onChange} resetSignal={p.captcha.resetSignal} />
          {p.errors.captcha ? (
            <p className="mt-1 text-sm text-red-500">{p.errors.captcha}</p>
          ) : null}
        </div>
      ) : null}

      {p.alert ? <Alert>{p.alert}</Alert> : null}

      <OrangeButton
        type="submit"
        className={cn(styles.btnOrange, styles.btnBlock)}
        disabled={p.disabled}
      >
        {p.submitLabel}
      </OrangeButton>
    </form>
  );
}

type OtpStepProps = {
  phoneLabel: string;
  digits: string[];
  onDigits: (digits: string[]) => void;
  onComplete: (code: string) => void;
  onBack: () => void;
  sending: boolean;
  errors: FormErrors;
  cooldown: number;
  sendLimitMinutes: number | null;
  onResend: () => void;
  onResendWhatsApp: () => void;
};

export function OtpStep(p: OtpStepProps) {
  const complete = p.digits.filter(Boolean).length === OTP_LENGTH;
  return (
    <div id="ca-active-pane" tabIndex={-1} className={styles.pane}>
      <button className={styles.back} type="button" onClick={p.onBack}>
        <ChevronLeft aria-hidden="true" />
        Change number
      </button>
      <h3>Check your messages</h3>
      <p className={styles.paneSub}>
        We sent a {OTP_LENGTH}-digit code to <b>{p.phoneLabel}</b>.
      </p>
      <div
        className={cn(styles.otp, p.errors.code && styles.otpInvalid)}
        role="group"
        aria-label="Verification code"
        style={{ "--otp-len": OTP_LENGTH } as CSSProperties}
      >
        <OtpBoxes
          length={OTP_LENGTH}
          digits={p.digits}
          onChange={p.onDigits}
          onComplete={p.onComplete}
          disabled={p.sending}
          invalid={Boolean(p.errors.code)}
        />
      </div>
      {p.errors.code ? <p className="mb-3 text-sm text-red-500">{p.errors.code}</p> : null}
      {p.errors.form ? <Alert>{p.errors.form}</Alert> : null}

      <div className={styles.resend}>
        {p.sendLimitMinutes !== null ? (
          <p className={styles.limit}>
            You have requested the maximum number of codes. You can start over in{" "}
            {p.sendLimitMinutes} minute{p.sendLimitMinutes === 1 ? "" : "s"}.
          </p>
        ) : (
          <>
            <button
              className={styles.textlink}
              type="button"
              onClick={p.onResend}
              disabled={p.cooldown > 0 || p.sending}
            >
              {p.cooldown > 0 ? `Resend code in ${p.cooldown}s` : "Resend code"}
            </button>
            <button
              className={cn(styles.textlink, styles.textlinkWa)}
              type="button"
              onClick={p.onResendWhatsApp}
              disabled={p.cooldown > 0 || p.sending}
            >
              Send on WhatsApp
            </button>
          </>
        )}
      </div>

      <OrangeButton
        className={cn(styles.btnOrange, styles.btnBlock)}
        disabled={p.sending || !complete}
        onClick={() => p.onComplete(p.digits.join(""))}
      >
        {p.sending ? "Checking..." : "Verify and continue"}
      </OrangeButton>
    </div>
  );
}

type DetailsStepProps = {
  fields: Fields;
  details: Details;
  set: (patch: Partial<Details>) => void;
  errors: FormErrors;
  onBack: () => void;
};

const optionalOf = (field: CaFieldConfig) => !field.required;

export function CollegeStep({
  fields,
  languages,
  details,
  set,
  errors,
  onBack,
  onContinue,
}: DetailsStepProps & { languages: string[]; onContinue: (event: FormEvent) => void }) {
  const showCourse = fields.course.enabled;
  const showStage = fields.careerStage.enabled;

  const course = showCourse ? (
    <Field label={fields.course.label} optional={optionalOf(fields.course)} help={fields.course.help}>
      <Select
        options={DEGREE_OPTIONS}
        placeholder="Select your course"
        searchable
        searchPlaceholder="Search courses"
        value={details.degree}
        onChange={(value) => set({ degree: value })}
        error={errors.course}
      />
    </Field>
  ) : null;

  const stage = showStage ? (
    <Field
      label={fields.careerStage.label}
      optional={optionalOf(fields.careerStage)}
      help={fields.careerStage.help}
    >
      <Select
        options={EXPERIENCE_LEVELS}
        placeholder="Select your career stage"
        value={details.careerStage}
        onChange={(value) => set({ careerStage: value })}
        error={errors.careerStage}
      />
    </Field>
  ) : null;

  const toggleLanguage = (language: string) =>
    set({
      languages: details.languages.includes(language)
        ? details.languages.filter((l) => l !== language)
        : [...details.languages, language],
    });

  return (
    <form id="ca-active-pane" tabIndex={-1} className={styles.pane} onSubmit={onContinue} noValidate>
      {fields.college.enabled ? (
        <Field label={fields.college.label} optional={optionalOf(fields.college)} help={fields.college.help}>
          <CollegeSelect
            placeholder="Search and select your college"
            value={details.collegeName}
            onChange={(value) => set({ collegeName: value, collegeId: "" })}
            onSelect={(picked) => set({ collegeName: picked.display, collegeId: picked._id })}
            error={errors.college}
          />
        </Field>
      ) : null}

      {fields.collegeEmail.enabled ? (
        <Field
          id="ca-college-email"
          label={fields.collegeEmail.label}
          optional={optionalOf(fields.collegeEmail)}
          help={fields.collegeEmail.help}
        >
          <Input
            id="ca-college-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="Your email on your college's domain"
            value={details.collegeEmail}
            setChange={(value: string) => set({ collegeEmail: value })}
            error={errors.collegeEmail}
          />
        </Field>
      ) : null}

      {course && stage ? (
        <div className={styles.row2}>
          {course}
          {stage}
        </div>
      ) : (
        course || stage
      )}

      {fields.languages.enabled && languages.length > 0 ? (
        <Field
          labelId="ca-languages"
          label={fields.languages.label}
          optional={optionalOf(fields.languages)}
          help={fields.languages.help}
          error={errors.languages}
        >
          <div className={styles.chips} role="group" aria-labelledby="ca-languages">
            {languages.map((language) => (
              <button
                key={language}
                className={styles.chip}
                type="button"
                aria-pressed={details.languages.includes(language)}
                onClick={() => toggleLanguage(language)}
              >
                {language}
              </button>
            ))}
          </div>
        </Field>
      ) : null}

      <div className={styles.paneActions}>
        <WhiteButton className={styles.btnWhite} type="button" onClick={onBack}>
          Back
        </WhiteButton>
        <OrangeButton className={styles.btnOrange} type="submit">
          Continue
        </OrangeButton>
      </div>
    </form>
  );
}

export function PayoutStep({
  fields,
  details,
  set,
  errors,
  onBack,
  india,
  whatsappLink,
  sending,
  onSubmit,
}: DetailsStepProps & {
  india: boolean;
  whatsappLink: string;
  sending: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  const [intlOpen, setIntlOpen] = useState(false);
  return (
    <form id="ca-active-pane" tabIndex={-1} className={styles.pane} onSubmit={onSubmit} noValidate>
      {fields.payout.enabled ? (
        <Field
          id="ca-payout"
          label={india ? fields.payout.label : "Payout details"}
          optional={optionalOf(fields.payout)}
          lock
          help={india ? fields.payout.help : "Your fixed stipend and incentives are paid here."}
        >
          <Input
            id="ca-payout"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={india ? "yourname@bank" : "Bank or PayPal details"}
            value={details.payout}
            setChange={(value: string) => set({ payout: value })}
            error={errors.payout}
          />
        </Field>
      ) : null}

      <button type="button" className={styles.intlLink} onClick={() => setIntlOpen(true)}>
        International student?
      </button>
      <Modal isOpen={intlOpen} onClose={() => setIntlOpen(false)} title="International students">
        <div className="px-6 pb-6">
          <p className="text-[15px] leading-relaxed text-gray-600">
            Stipends to accounts outside India are set up one to one. Talk to our support team and we
            will help you with your application and payout.
          </p>
          <p className="mt-4 text-lg font-bold text-gray-900">{SUPPORT_PHONE.display}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href={SUPPORT_PHONE.tel} variant="orange">
              Call support
            </ButtonLink>
            <ButtonLink href={SUPPORT_PHONE.whatsapp} variant="white" external>
              Chat on WhatsApp
            </ButtonLink>
          </div>
        </div>
      </Modal>

      {fields.address.enabled ? (
        <Field
          id="ca-address"
          label={fields.address.label}
          optional={optionalOf(fields.address)}
          help={fields.address.help}
          error={errors.address}
        >
          <Input
            id="ca-address"
            autoComplete="street-address"
            placeholder="House, street and area"
            value={details.line}
            setChange={(value: string) => set({ line: value })}
          />
          <div className={cn(styles.row2, styles.row2Keep, styles.row2Gap)}>
            <Input
              aria-label="City"
              autoComplete="address-level2"
              placeholder="City"
              value={details.city}
              setChange={(value: string) => set({ city: value })}
            />
            <Input
              aria-label="State"
              autoComplete="address-level1"
              placeholder="State"
              value={details.state}
              setChange={(value: string) => set({ state: value })}
            />
          </div>
          <div className={cn(styles.row2, styles.row2Keep, styles.row2Gap)}>
            <Input
              aria-label="Pincode"
              autoComplete="postal-code"
              inputMode={india ? "numeric" : undefined}
              placeholder="Pincode"
              value={details.pincode}
              setChange={(value: string) => set({ pincode: value })}
            />
            <Input
              aria-label="Country"
              autoComplete="country-name"
              placeholder="Country"
              value={details.country}
              setChange={(value: string) => set({ country: value })}
            />
          </div>
        </Field>
      ) : null}

      {fields.whatsapp.enabled ? (
        <div className={styles.field} role="group" aria-label={fields.whatsapp.label}>
          <div className={styles.wa}>
            {whatsappLink ? (
              <a className={styles.waBtn} href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" />
                Open the ambassador WhatsApp group
              </a>
            ) : null}
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={details.whatsappJoined}
                onChange={(e) => set({ whatsappJoined: e.target.checked })}
              />
              {"I've joined the WhatsApp group"}
            </label>
          </div>
          {errors.whatsapp ? <p className="mt-1 text-sm text-red-500">{errors.whatsapp}</p> : null}
          {fields.whatsapp.help ? <p className={styles.help}>{fields.whatsapp.help}</p> : null}
        </div>
      ) : null}

      {errors.form ? <Alert>{errors.form}</Alert> : null}

      <div className={styles.paneActions}>
        <WhiteButton className={styles.btnWhite} type="button" onClick={onBack} disabled={sending}>
          Back
        </WhiteButton>
        <OrangeButton className={styles.btnOrange} type="submit" disabled={sending}>
          {sending ? "Sending..." : "Submit application"}
        </OrangeButton>
      </div>
    </form>
  );
}

export function DoneStep({ phoneLabel }: { phoneLabel: string }) {
  return (
    <div id="ca-active-pane" tabIndex={-1} className={cn(styles.pane, styles.done)}>
      <div className={styles.doneMark}>
        <Check aria-hidden="true" />
      </div>
      <h3>Application sent</h3>
      <p className={cn(styles.paneSub, styles.doneSub)}>
        Your counsellor will call you on {phoneLabel} within 24 hours.
      </p>
      <ul>
        <li>
          <b>On the call:</b> a short onboarding and a formal discussion about the role.
        </li>
        <li>
          <b>Once approved:</b> your offer letter arrives by email straight away.
        </li>
        <li>
          <b>Check your inbox:</b> {"we've emailed you a copy of your application."}
        </li>
      </ul>
    </div>
  );
}

export function ClosedNote() {
  return (
    <div className={cn(styles.pane, styles.closed)}>
      <h3>Applications open soon</h3>
      <p className={styles.paneSub}>
        {"The next batch hasn't been announced yet. Check back soon or message us on WhatsApp."}
      </p>
    </div>
  );
}
