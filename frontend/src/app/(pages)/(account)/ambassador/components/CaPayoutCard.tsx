"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import { X } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import { formatIstDate } from "@/lib/ist";
import useCaPayout from "@/hooks/useCaPayout";
import useMSG91OTP, { OTP_CHANNEL, OTP_LENGTH, type OtpChannel } from "@/hooks/useMSG91OTP";
import OtpBoxes from "@/app/enquiry/components/OtpBoxes";
import type { CaPayoutView } from "@/types/ca-payout";
import s from "../desk.module.css";

const RESEND_COOLDOWN_SECONDS = 60;
const UPI_RE = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9.-]{1,63}$/;
const DETAILS_MAX = 500;

const methodLabel = (method: "upi" | "details" | null): string =>
  method === "details" ? "Payout details" : "UPI ID";

/** Same shape the server enforces; client-side only saves a round trip on a bad value. */
const validate = (method: "upi" | "details" | null, value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return method === "details" ? "Enter your payout details" : "Enter your UPI ID";
  if (method === "details") {
    return trimmed.length > DETAILS_MAX ? `Keep it under ${DETAILS_MAX} characters` : null;
  }
  return UPI_RE.test(trimmed.toLowerCase()) ? null : "Enter a valid UPI ID, like yourname@bank";
};

export default function CaPayoutCard() {
  const { getPayout } = useCaPayout();
  const [payout, setPayout] = useState<CaPayoutView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPayout().then((data) => {
      if (cancelled) return;
      setPayout(data);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [getPayout]);

  if (!loaded || !payout) return null;

  const locked = Boolean(payout.lockedUntil);

  return (
    <section className={s.section} aria-labelledby="desk-payout-title">
      <h2 id="desk-payout-title" className={cn(s.display, s.h2)}>
        Payout details
      </h2>
      <p className={s.sub}>Where your stipend and incentives are paid.</p>
      <div className={cn(s.card, s.payoutRow)}>
        <div className={s.payoutMeta}>
          <span className={s.payoutLabel}>{methodLabel(payout.method)}</span>
          <span className={s.payoutValue}>{payout.masked ?? "Not provided"}</span>
          {payout.lastChangedAt ? (
            <span className={s.payoutChanged}>Last changed {formatIstDate(payout.lastChangedAt)}</span>
          ) : null}
        </div>
        <WhiteButton
          className={cn(s.btn, s.btnWhite)}
          disabled={locked}
          onClick={() => setOpen(true)}
        >
          {locked ? `You can change this again on ${formatIstDate(payout.lockedUntil as string)}` : "Change"}
        </WhiteButton>
      </div>

      <PayoutChangeModal
        open={open}
        method={payout.method}
        onClose={() => setOpen(false)}
        onSaved={(next) => {
          setPayout(next);
          setOpen(false);
        }}
      />
    </section>
  );
}

interface ModalProps {
  open: boolean;
  method: "upi" | "details" | null;
  onClose: () => void;
  onSaved: (next: CaPayoutView) => void;
}

/** Native modal dialog: the browser supplies the focus trap, inert page and Esc. */
function PayoutChangeModal({ open, method, onClose, onSaved }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const onCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <dialog
      ref={ref}
      className={s.picker}
      aria-labelledby="payout-modal-title"
      onCancel={onCancel}
      onClick={onBackdrop}
    >
      {open ? <ModalBody method={method} onClose={onClose} onSaved={onSaved} /> : null}
    </dialog>
  );
}

type Step = "value" | "otp" | "success";

function ModalBody({ method, onClose, onSaved }: Omit<ModalProps, "open">) {
  const { requestOtp, changePayout } = useCaPayout();
  const { ready, loadError, sendOtp, retryOtp, verifyOtp } = useMSG91OTP();
  const [step, setStep] = useState<Step>("value");
  const [value, setValue] = useState("");
  const [valueError, setValueError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [reqId, setReqId] = useState<string | null>(null);
  const [channel, setChannel] = useState<OtpChannel | null>(null);
  const [digits, setDigits] = useState<string[]>([]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [saved, setSaved] = useState<CaPayoutView | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /** Claims the send on the server first, then has the widget dispatch it. */
  const sendCode = async (via?: OtpChannel) => {
    const showError = step === "otp" ? setCodeError : setValueError;
    const problem = validate(method, value);
    if (problem) {
      setValueError(problem);
      return;
    }
    if (!ready) {
      showError(loadError || "Phone verification is still loading. Try again.");
      return;
    }
    setValueError(null);
    setCodeError(null);
    setBusy(true);
    try {
      const result = await requestOtp();
      if (!result.ok) {
        showError(result.message);
        return;
      }
      const nextReqId = reqId ? await retryOtp(reqId, via) : await sendOtp(result.identifier);
      setReqId(nextReqId ?? reqId);
      setSentTo(result.sentTo);
      setChannel(via ?? null);
      setDigits([]);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("otp");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not send the code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async (code: string) => {
    setBusy(true);
    setCodeError(null);
    let token: string;
    try {
      token = await verifyOtp(code, reqId);
    } catch {
      setBusy(false);
      setCodeError("Incorrect code. Please check and try again.");
      setDigits([]);
      return;
    }
    const result = await changePayout(value.trim(), token);
    setBusy(false);
    if (!result.ok) {
      setCodeError(result.message);
      setDigits([]);
      return;
    }
    setSaved(result.payout);
    setStep("success");
  };

  return (
    <div className={s.pickerInner}>
      <header className={s.pickerHead}>
        <h2 id="payout-modal-title" className={cn(s.display, s.pickerTitle)}>
          {step === "success" ? "Saved" : `Change your ${methodLabel(method).toLowerCase()}`}
        </h2>
        <button type="button" className={s.pickerClose} onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className={s.pickerScroll}>
        {step === "value" ? (
          <div className={s.confirm}>
            <p className={s.confirmNote}>
              Enter your new {methodLabel(method).toLowerCase()}. We will send a code to your verified mobile
              number to confirm it is really you.
            </p>
            <input
              type="text"
              className={s.pickerInput}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={method === "details" ? "Bank name, account number, IFSC..." : "yourname@bank"}
              aria-label={methodLabel(method)}
              aria-invalid={Boolean(valueError)}
            />
            {valueError || loadError ? <p className={s.payoutError}>{valueError || loadError}</p> : null}
            <div className={s.confirmActions}>
              <OrangeButton className={cn(s.btn, s.btnOrange)} onClick={() => void sendCode()} disabled={busy || !ready}>
                {busy ? "Sending..." : ready || loadError ? "Send code" : "Loading..."}
              </OrangeButton>
            </div>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className={s.confirm}>
            <p className={s.confirmNote}>
              We sent a {OTP_LENGTH}-digit code{channel === OTP_CHANNEL.whatsapp ? " on WhatsApp" : ""} to{" "}
              <b>{sentTo}</b>.
            </p>
            <OtpBoxes
              length={OTP_LENGTH}
              digits={digits}
              onChange={setDigits}
              onComplete={(code) => void confirmCode(code)}
              disabled={busy}
              invalid={Boolean(codeError)}
            />
            {codeError ? <p className={s.payoutError}>{codeError}</p> : null}
            <div className={s.confirmActions}>
              <WhiteButton
                className={cn(s.btn, s.btnWhite)}
                disabled={cooldown > 0 || busy}
                onClick={() => void sendCode(OTP_CHANNEL.sms)}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend by SMS"}
              </WhiteButton>
              <WhiteButton
                className={cn(s.btn, s.btnWhite)}
                disabled={cooldown > 0 || busy}
                onClick={() => void sendCode(OTP_CHANNEL.whatsapp)}
              >
                Send on WhatsApp
              </WhiteButton>
            </div>
          </div>
        ) : null}

        {step === "success" ? (
          <div className={s.confirm}>
            <p className={s.confirmNote}>
              Your {methodLabel(method).toLowerCase()} is now <b>{saved?.masked}</b>.
            </p>
            <div className={s.confirmActions}>
              <OrangeButton
                className={cn(s.btn, s.btnOrange)}
                onClick={() => saved && onSaved(saved)}
              >
                Done
              </OrangeButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
