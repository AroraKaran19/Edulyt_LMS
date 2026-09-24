"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import { X } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import { formatIstDate } from "@/lib/ist";
import useCaPayout from "@/hooks/useCaPayout";
import OtpBoxes from "@/app/enquiry/components/OtpBoxes";
import type { CaPayoutView } from "@/types/ca-payout";
import s from "../desk.module.css";

const OTP_LENGTH = 6;
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
  const [step, setStep] = useState<Step>("value");
  const [value, setValue] = useState("");
  const [valueError, setValueError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
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

  const sendCode = async () => {
    const problem = validate(method, value);
    if (problem) {
      setValueError(problem);
      return;
    }
    setValueError(null);
    setBusy(true);
    const result = await requestOtp();
    setBusy(false);
    if (!result.ok) {
      setValueError(result.message);
      return;
    }
    setSentTo(result.sentTo);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setStep("otp");
  };

  const confirmCode = async (code: string) => {
    setBusy(true);
    setCodeError(null);
    const result = await changePayout(value.trim(), code);
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
              Enter your new {methodLabel(method).toLowerCase()}. We will text a code to your verified mobile
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
            {valueError ? <p className={s.payoutError}>{valueError}</p> : null}
            <div className={s.confirmActions}>
              <OrangeButton className={cn(s.btn, s.btnOrange)} onClick={() => void sendCode()} disabled={busy}>
                {busy ? "Sending..." : "Send code"}
              </OrangeButton>
            </div>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className={s.confirm}>
            <p className={s.confirmNote}>
              We sent a {OTP_LENGTH}-digit code to <b>{sentTo}</b>.
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
                onClick={() => void sendCode()}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
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
