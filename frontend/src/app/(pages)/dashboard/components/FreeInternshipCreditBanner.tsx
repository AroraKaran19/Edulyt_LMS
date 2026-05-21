"use client";

import { useState } from "react";
import { Gift, X } from "lucide-react";
import { useInternshipVouchers } from "@/hooks/useInternshipVouchers";
import FreeInternshipClaimModal from "./FreeInternshipClaimModal";
import { cn } from "@/lib/utils";

export default function FreeInternshipCreditBanner() {
  const { available, vouchers, isLoading, refetch } = useInternshipVouchers();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // The first available voucher is the one we'll spend.
  const nextVoucher = vouchers.find((v) => v.status === "available") ?? null;

  if (isLoading || available === 0 || dismissed) return null;

  return (
    <>
      <div
        className={cn(
          "relative flex items-start sm:items-center gap-3 rounded-2xl px-5 py-4",
          "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md",
          "mx-4 sm:mx-8 lg:mx-20 mt-4",
        )}
        role="alert"
      >
        <Gift className="w-6 h-6 flex-shrink-0 mt-0.5 sm:mt-0" />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm sm:text-base leading-snug">
            You have{" "}
            <span className="underline underline-offset-2">
              {available} free internship voucher{available === 1 ? "" : "s"}
            </span>
            !
          </p>
          <p className="text-xs sm:text-sm text-white/85 mt-0.5">
            Earned by purchasing a course. Each voucher gives you one free
            internship seat — single use only.
          </p>
          {nextVoucher && (
            <p className="text-xs text-white/70 mt-0.5 font-mono tracking-widest">
              Next: {nextVoucher.code}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            "flex-shrink-0 bg-white text-orange-600 font-semibold text-xs sm:text-sm",
            "px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap",
          )}
        >
          Avail now
        </button>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <FreeInternshipClaimModal
        isOpen={modalOpen}
        voucher={nextVoucher}
        onClose={() => setModalOpen(false)}
        onRedeemed={refetch}
      />
    </>
  );
}
