"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CaVoucherPlan } from "@/types/ca-voucher";

export const CHIP = "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset";

export type ChipTone = "amber" | "green" | "red" | "gray" | "orange";

const TONE: Record<ChipTone, string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  green: "bg-green-50 text-green-700 ring-green-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  gray: "bg-gray-100 text-gray-600 ring-gray-500/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
};

export function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return <span className={cn(CHIP, TONE[tone])}>{children}</span>;
}

export function PlanChip({ plan }: { plan: CaVoucherPlan }) {
  return plan === "elite" ? <Chip tone="orange">Elite</Chip> : <Chip tone="gray">Essential</Chip>;
}

export function CaCell({ name, email, internId }: { name: string; email: string; internId: string | null }) {
  return (
    <>
      <div className="font-medium text-gray-900">{name}</div>
      <div className="mt-0.5 text-xs break-all text-gray-500">{email}</div>
      {internId ? <div className="text-xs text-gray-500">{internId}</div> : null}
    </>
  );
}
