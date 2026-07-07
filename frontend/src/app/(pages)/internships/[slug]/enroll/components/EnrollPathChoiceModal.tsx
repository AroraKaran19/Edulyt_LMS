"use client";

import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

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
  const showPaidUpsell =
    typeof seatAmountInr === "number" && seatAmountInr > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={undefined}
      className={cn(
        "max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto",
        "border-2 border-amber-200/90 shadow-xl shadow-amber-900/10",
      )}
    >
      <div className="space-y-5 p-1">
        <div className="text-center space-y-2">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900">
            <Sparkles className="size-3.5" aria-hidden />
            Ready to register
          </p>
          <h2 className="text-xl font-bold text-stone-900 leading-snug">
            Complete your registration for{" "}
            <span className="text-primary">{programTitle}</span>
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            You&apos;re on the{" "}
            <strong className="text-stone-800">entrance exam</strong> path. Your
            details are saved in this browser you can switch paths without
            losing your answers.
          </p>
        </div>

        {showPaidUpsell ? (
          <div
            className={cn(
              "rounded-2xl border border-amber-300/80 bg-linear-to-br from-amber-50 via-white to-orange-50/90",
              "p-4 sm:p-5 space-y-3 shadow-inner",
            )}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900/90 flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0" aria-hidden />
              Prefer a confirmed seat?
            </p>
            <p className="text-sm text-stone-800 leading-relaxed">
              Skip the uncertainty of merit-only intake:{" "}
              <strong>secure your cohort seat with a one-time fee</strong>. You
              can still take the entrance exam for practice your paid seat
              stays locked after payment.
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-stone-900">
                ₹{seatAmountInr.toLocaleString("en-IN")}
              </span>
              {typeof listPriceInr === "number" &&
                listPriceInr > seatAmountInr && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    ₹{listPriceInr.toLocaleString("en-IN")}
                  </span>
                )}
            </div>
            <OrangeButton
              type="button"
              onClick={onSwitchToPaidPath}
              className="w-full py-3 text-sm font-bold justify-center gap-2"
            >
              Switch to paid seat path
              <ArrowRight className="size-4" aria-hidden />
            </OrangeButton>
          </div>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <WhiteButton type="button" glow={false} onClick={onClose}>
            Back to form
          </WhiteButton>
          <OrangeButton
            type="button"
            onClick={onConfirmEntrancePath}
            className="w-full sm:w-auto py-3 font-bold"
          >
            Continue Registeration
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
