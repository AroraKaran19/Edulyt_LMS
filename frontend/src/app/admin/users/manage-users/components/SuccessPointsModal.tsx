"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import useSuccessPoints from "@/hooks/useSuccessPoints";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { formatSuccessPointDate } from "@/components/shared/SuccessPoints/SuccessPointsHistoryRow";
import type { User, Student } from "@/types/user";

const expiryDateLabel = (days: number) =>
  formatSuccessPointDate(new Date(Date.now() + days * 86_400_000).toISOString());

interface Props {
  isOpen: boolean;
  user: (User & Partial<Student>) | null;
  onClose: () => void;
  onAdjusted: (userId: string, newBalance: number) => void;
}

export default function SuccessPointsModal({
  isOpen,
  user,
  onClose,
  onAdjusted,
}: Props) {
  const { adminAdjust } = useSuccessPoints();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [defaultExpiryDays, setDefaultExpiryDays] = useState("0");
  const [expiryDays, setExpiryDays] = useState("0");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setBalance(user.successPoints ?? 0);
      setAmount("");
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    apiClient
      .get(ENDPOINTS.admin.pointsSettings)
      .then((res) => {
        const days = String(
          Number(res.data?.data?.successPointsExpiryDays ?? 0) || 0,
        );
        if (cancelled) return;
        setDefaultExpiryDays(days);
        setExpiryDays(days);
      })
      .catch(() => {
        // Server applies the global window when expiryDays is left out.
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const parsed = Math.trunc(Number(amount));
  const valid =
    amount.trim() !== "" && Number.isFinite(parsed) && parsed !== 0;
  const preview = valid ? balance + parsed : balance;
  const isGrant = valid && parsed > 0;
  const days = Number(expiryDays);
  const expiryValid =
    expiryDays.trim() !== "" && Number.isInteger(days) && days >= 0 && days <= 3650;

  const apply = async () => {
    if (!valid) {
      toast.error(
        "Enter a non-zero whole number (use a minus sign to deduct).",
      );
      return;
    }
    if (isGrant && !expiryValid) {
      toast.error("Expiry must be a whole number of days from 0 to 3650.");
      return;
    }
    setIsApplying(true);
    try {
      const res = await adminAdjust({
        userId: user._id || "",
        points: parsed,
        ...(isGrant ? { expiryDays: days } : {}),
      });
      setBalance(res.balance);
      setAmount("");
      setExpiryDays(defaultExpiryDays);
      onAdjusted(user._id || "", res.balance);
      toast.success(
        `${parsed > 0 ? "Granted" : "Deducted"} ${Math.abs(
          parsed,
        )} points · new balance ${res.balance}.`,
      );
    } catch (err: unknown) {
      const e = err as {
        response?: {
          data?: { error?: { message?: string }; message?: string };
        };
      };
      toast.error(
        e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          "Couldn't adjust success points.",
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Success Points</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Adjusting points for:{" "}
            <span className="font-medium">{user.email}</span>
          </p>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#F77124] fill-[#F77124]" />
            <span className="text-sm text-gray-600">Current balance</span>
            <span
              className={cn(
                "ml-auto text-xl font-extrabold",
                balance < 0 ? "text-red-600" : "text-gray-900",
              )}
            >
              {balance}
            </span>
          </div>

          <Input
            label="Adjustment (positive grants, negative deducts)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100 or -50"
          />

          {isGrant && (
            <div className="space-y-1">
              <Input
                label="Expires after (days)"
                type="number"
                min={0}
                max={3650}
                step={1}
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                {!expiryValid
                  ? "Enter a whole number of days from 0 to 3650."
                  : days === 0
                    ? "These points will never expire."
                    : `These points expire at the end of ${expiryDateLabel(days)} (IST).`}
              </p>
            </div>
          )}

          {valid && (
            <p className="text-xs text-gray-500">
              New balance will be{" "}
              <span
                className={cn(
                  "font-bold",
                  preview < 0 ? "text-red-600" : "text-gray-900",
                )}
              >
                {preview}
              </span>
            </p>
          )}

          <p className="text-xs text-gray-400">
            Applied immediately and recorded in the student&apos;s points
            history. The balance may go negative.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <WhiteButton glow={false} onClick={onClose} disabled={isApplying}>
            Close
          </WhiteButton>
          <OrangeButton
            glow={false}
            onClick={apply}
            disabled={isApplying || !valid || (isGrant && !expiryValid)}
          >
            {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isApplying ? "Applying…" : "Apply"}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
}
