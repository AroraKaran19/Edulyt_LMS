"use client";

import React from "react";
import Image from "next/image";
import type { ActiveGateway, GatewayName } from "@/types/order";

interface Props {
  open: boolean;
  gateways: ActiveGateway[];
  onSelect: (gateway: GatewayName) => void;
  onClose: () => void;
}

/**
 * Per-gateway branding. Logos are vendor SVGs served from /public — not
 * hotlinked — so checkout never depends on a third-party CDN being up, and
 * visiting the cart doesn't leak a request to one. Both marks are single-colour
 * navy, hence the light tile.
 *
 * To change a logo, replace the file in `public/gateways/`. Nothing here moves.
 */
const BRAND: Record<GatewayName, { src: string; blurb: string }> = {
  razorpay: {
    src: "/gateways/razorpay.svg",
    blurb: "UPI, cards, net banking & wallets",
  },
  paytm: {
    src: "/gateways/paytm.svg",
    blurb: "Paytm wallet, UPI & cards",
  },
};

const GatewayPickerModal = ({ open, gateways, onSelect, onClose }: Props) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a payment gateway"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_0_20px_4px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 font-coolvetica text-xl font-bold text-[#2B1508]">
          Choose a payment gateway
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          You&apos;ll be charged the same amount either way.
        </p>

        <div className="flex flex-col gap-3">
          {gateways.map((g) => {
            const brand = BRAND[g.name];
            return (
              <button
                key={g.name}
                type="button"
                onClick={() => onSelect(g.name)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-left transition hover:border-[#F77124] hover:bg-[#F77124]/5 focus:outline-none focus-visible:border-[#F77124] focus-visible:ring-2 focus-visible:ring-[#F77124]/30"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
                  {brand ? (
                    <Image
                      src={brand.src}
                      alt={`${g.label} logo`}
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-sm font-bold text-[#2B1508]">
                      {g.label.charAt(0)}
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#2B1508]">
                    {g.label}
                  </span>
                  {brand?.blurb && (
                    <span className="block truncate text-xs text-gray-500">
                      {brand.blurb}
                    </span>
                  )}
                </span>

                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#F77124]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default GatewayPickerModal;
