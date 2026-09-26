"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Hourglass,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import type { SuccessPointTransaction } from "@/hooks/useSuccessPoints";
import { cn } from "@/lib/utils";

/** Shared by the student wallet modal and the admin user drawer. */
export function formatSuccessPointDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatSuccessPointDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const REWARD_LABELS: Record<string, string> = {
  login: "Welcome bonus",
  community_review: "Community review reward",
  internship_registration: "Internship registration reward",
};

const EARN_SOURCE_LABELS: Record<string, string> = {
  plan_purchase: "Plan purchase",
  purchased: "Course completion",
  coupon_paid_over_half_effective: "Course completion (coupon order)",
};

type Presentation = {
  Icon: typeof Sparkles;
  iconBg: string;
  iconColor: string;
  title: string;
  /** Second line, only rendered in the admin (`showActor`) view. */
  detail?: string;
  amount: string;
  amountColor: string;
};

function describe(
  tx: SuccessPointTransaction,
  showActor: boolean,
): Presentation {
  switch (tx.type) {
    case "transferred_in":
      return {
        Icon: ArrowDownLeft,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        title: `Received from ${tx.fromUserDisplayName || "a user"}`,
        amount: `+${tx.points}`,
        amountColor: "text-emerald-600",
      };
    case "transferred_out":
      return {
        Icon: ArrowUpRight,
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        title: `Sent to ${tx.toUserDisplayName || "a user"}`,
        amount: `-${tx.points}`,
        amountColor: "text-red-500",
      };
    case "redeemed":
      return {
        Icon: ShoppingCart,
        iconBg: "bg-rose-50",
        iconColor: "text-rose-500",
        title: `Redeemed at checkout${
          tx.courseSnapshot?.title ? ` · ${tx.courseSnapshot.title}` : ""
        }`,
        detail:
          showActor && tx.orderId ? `Order ${tx.orderId.slice(-8)}` : undefined,
        amount: `-${tx.points}`,
        amountColor: "text-rose-500",
      };
    case "expired":
      return {
        Icon: Hourglass,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-500",
        title: "Points expired",
        amount: `-${tx.points}`,
        amountColor: "text-gray-500",
      };
    case "admin_adjustment": {
      const credited = tx.points >= 0;
      const expiry =
        credited && tx.expiresAt !== undefined
          ? tx.expiresAt
            ? ` · expires ${formatSuccessPointDate(tx.expiresAt)}`
            : " · never expires"
          : "";
      return {
        Icon: ShieldCheck,
        iconBg: credited ? "bg-emerald-50" : "bg-red-50",
        iconColor: credited ? "text-emerald-600" : "text-red-500",
        title: "Admin adjustment",
        detail: showActor
          ? `${credited ? "Granted" : "Deducted"} by ${
              tx.adjustedByName || "an admin"
            }${expiry}`
          : undefined,
        amount: credited ? `+${tx.points}` : String(tx.points),
        amountColor: credited ? "text-emerald-600" : "text-red-500",
      };
    }
    case "reward":
      return {
        Icon: Gift,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        title: REWARD_LABELS[tx.rewardSource ?? ""] ?? "Reward",
        amount: `+${tx.points}`,
        amountColor: "text-emerald-600",
      };
    default:
      return {
        Icon: Sparkles,
        iconBg: "bg-orange-50",
        iconColor: "text-[#F77124]",
        title: `Earned${
          tx.courseSnapshot?.title ? ` · ${tx.courseSnapshot.title}` : ""
        }`,
        detail: showActor
          ? EARN_SOURCE_LABELS[tx.earnSource ?? ""]
          : undefined,
        amount: `+${tx.points}`,
        amountColor: "text-emerald-600",
      };
  }
}

interface Props {
  tx: SuccessPointTransaction;
  /**
   * Admin view: adds a second line naming the staff member behind an
   * adjustment, the order behind a redemption, or how points were earned.
   * Kept off for students so staff names never leak into the learner UI.
   */
  showActor?: boolean;
}

export default function SuccessPointsHistoryRow({
  tx,
  showActor = false,
}: Props) {
  const v = describe(tx, showActor);
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          v.iconBg,
        )}
      >
        <v.Icon className={cn("w-4 h-4", v.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {v.title}
        </p>
        {v.detail && (
          <p className="text-[11px] text-gray-500 truncate">{v.detail}</p>
        )}
        <p className="text-[11px] text-gray-400">
          {formatSuccessPointDateTime(tx.earnedAt)}
        </p>
      </div>
      <span className={cn("text-sm font-bold shrink-0", v.amountColor)}>
        {v.amount}
      </span>
    </div>
  );
}
