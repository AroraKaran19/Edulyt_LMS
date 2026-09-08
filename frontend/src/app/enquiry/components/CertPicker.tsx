"use client";

import Image from "next/image";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ISSUERS, type PerkState } from "../plans";
import { usePlanData } from "../usePlanData";

type Props = {
  state: PerkState;
  /** Which MNC certification the student wants, null if none. */
  cert: string | null;
  onCert: (cert: string | null) => void;
};

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/**
 * The certification row carries its own controls, because this is the one perk
 * the student actively chooses: paid on Blended and Mentor-Led, one free on
 * Mentor-to-Placement. Picking a partner is what turns the add-on on, so there
 * is no separate toggle that can fall out of sync with the choice.
 *
 * The options are spelled out as labelled radio rows rather than bare logos,
 * since a logo on its own does not read as something you can click.
 */
export default function CertPicker({ state, cert, onCert }: Props) {
  // Read here rather than passed down: this is the only row that quotes the
  // add-on, and it used a shipped constant, so an admin's price never reached
  // it and a withheld visit rendered the constant as a real number.
  const { mncAddonPrice, hasPrices } = usePlanData();
  const isFree = state.kind === "included";
  const chosen = cert !== null;

  return (
    <li
      className={cn(
        "mt-1 rounded-lg border px-2.5 py-2 transition-[background-color,border-color] duration-500",
        chosen
          ? "border-primary/60 bg-primary/5"
          : "border-[#f7ad24]/50 bg-[#fffdf7]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-[18px] flex-none place-items-center rounded-full transition-colors duration-300",
            chosen
              ? "bg-primary/15 text-primary"
              : "bg-[#f7ad24]/25 text-[#8a5c05]",
          )}
        >
          {chosen ? (
            <Check size={10} strokeWidth={3.6} />
          ) : (
            <Plus size={10} strokeWidth={3.6} />
          )}
        </span>

        <span className="min-w-0 flex-1 text-[13px] leading-[1.35] font-semibold text-text-primary">
          MNC certification with exam
        </span>

        <span
          className={cn(
            "flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap",
            isFree
              ? "bg-[#fff6f1] text-[#c4551a]"
              : "bg-[#f7ad24]/20 text-[#8a5c05]",
          )}
        >
          {isFree
            ? "Any 1 free"
            : hasPrices
              ? `+${inr(mncAddonPrice)}`
              : "Charged extra"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-text-primary">
          {isFree
            ? "Choose the one included with your plan"
            : "Choose one to add it to your plan"}
        </span>
        {chosen && !isFree && (
          <button
            type="button"
            onClick={() => onCert(null)}
            className="inline-flex flex-none items-center gap-0.5 text-[10.5px] font-bold text-[#c4551a] underline decoration-[#c4551a]/40 underline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X size={10} strokeWidth={3} />
            Remove
          </button>
        )}
      </div>

      <div className="mt-1.5 grid gap-1">
        {ISSUERS.map((issuer) => {
          const active = cert === issuer.name;
          return (
            <button
              key={issuer.name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onCert(active && !isFree ? null : issuer.name)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-2 py-1.5 text-left transition-[border-color,background-color] duration-200",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active
                  ? "border-primary bg-primary/8"
                  : "border-[#ecdfd5] bg-white hover:border-[#f2d6c2] hover:bg-[#fffaf6]",
              )}
            >
              <span
                className={cn(
                  "grid size-4 flex-none place-items-center rounded-full border-[1.5px] transition-colors duration-200",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-[#d9c7ba] bg-white text-transparent",
                )}
              >
                <Check size={9} strokeWidth={4} />
              </span>

              <Image
                src={issuer.src}
                alt=""
                height={issuer.height}
                width={Math.round(issuer.height * issuer.ratio)}
                style={{ height: 14, width: "auto" }}
                unoptimized
                className="block flex-none object-contain"
              />

              <span className="min-w-0 flex-1 text-[12px] font-bold text-text-primary">
                {issuer.name}
              </span>

              <span
                className={cn(
                  "flex-none text-[11px] font-bold whitespace-nowrap",
                  isFree ? "text-[#2c7f34]" : "text-[#8a5c05]",
                )}
              >
                {isFree
                  ? "Free"
                  : hasPrices
                    ? `+${inr(mncAddonPrice)}`
                    : "Extra"}
              </span>
            </button>
          );
        })}
      </div>
    </li>
  );
}
