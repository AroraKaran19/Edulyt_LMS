"use client";

import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  programTitle: string;
  /** Shown when upselling paid seat (selected cohort has a plan) */
  seatAmountInr?: number;
  listPriceInr?: number;
  onConfirmEntrancePath: () => void;
  onSwitchToPaidPath: () => void;
};

/** What the one-time paid seat gets you — pulled out as chips so the value is
 *  scannable rather than buried in the paragraph. */
const PAID_SEAT_BENEFITS = [
  "Cohort seat locked in",
  "No merit cut-off",
  "Entrance exam optional",
];

/** Upsell modal for entrance/merit registrants — not shown on the paid-seat flow. */
export default function EnrollPathChoiceModal({
  isOpen,
  onClose,
  programTitle,
  seatAmountInr,
  listPriceInr,
  onConfirmEntrancePath,
  onSwitchToPaidPath,
}: Props) {
  const showPaidUpsell = typeof seatAmountInr === "number" && seatAmountInr > 0;
  const hasListPrice =
    typeof listPriceInr === "number" &&
    typeof seatAmountInr === "number" &&
    listPriceInr > seatAmountInr;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={undefined}
      className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-5 p-1">
        {/* Header */}
        <div className="space-y-2.5 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            Ready to register
          </p>
          <h2 className="text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
            Complete your registration for{" "}
            <span className="text-primary">{programTitle}</span>
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-stone-500">
            You&apos;re on the{" "}
            <strong className="font-semibold text-stone-700">
              entrance-exam
            </strong>{" "}
            path. Your answers are saved in this browser, so you can switch
            paths anytime without losing them.
          </p>
        </div>

        {/* Optional one-time paid-seat upgrade */}
        {showPaidUpsell ? (
          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-orange-50 via-white to-amber-50/50 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-primary/10 bg-white/60 px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                <ShieldCheck className="size-4 shrink-0" aria-hidden />
                Guaranteed seat
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                Optional
              </span>
            </div>

            <div className="space-y-3.5 p-4 sm:p-5">
              <p className="text-sm leading-relaxed text-stone-600">
                Skip the uncertainty of merit-only intake and lock in your
                cohort seat with a one-time fee. You can still sit the entrance
                exam for practice your seat stays reserved either way.
              </p>

              <ul className="flex flex-wrap gap-1.5">
                {PAID_SEAT_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-white px-2.5 py-1 text-xs font-medium text-stone-700"
                  >
                    <Check className="size-3 text-primary" aria-hidden />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tabular-nums text-stone-900">
                  ₹{seatAmountInr.toLocaleString("en-IN")}
                </span>
                {hasListPrice && (
                  <span className="text-sm tabular-nums text-stone-400 line-through">
                    ₹{listPriceInr!.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-[11px] font-medium text-stone-400">
                  one-time
                </span>
              </div>

              <OrangeButton
                type="button"
                onClick={onSwitchToPaidPath}
                className="w-full justify-center gap-2 py-3 text-sm font-bold"
              >
                Switch to paid seat path
                <ArrowRight className="size-4" aria-hidden />
              </OrangeButton>
            </div>
          </div>
        ) : null}

        {/* Footer — the entrance path is the default; paid seat above is optional */}
        <div
          className={cn(
            "flex flex-col-reverse gap-2 border-t border-stone-100 pt-4",
            "sm:flex-row sm:items-center sm:justify-end",
          )}
        >
          <WhiteButton type="button" glow={false} onClick={onClose}>
            Back to form
          </WhiteButton>
          <OrangeButton
            type="button"
            onClick={onConfirmEntrancePath}
            className="w-full justify-center gap-1.5 py-3 font-bold sm:w-auto"
          >
            Continue registration
            <ArrowRight className="size-4" aria-hidden />
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
