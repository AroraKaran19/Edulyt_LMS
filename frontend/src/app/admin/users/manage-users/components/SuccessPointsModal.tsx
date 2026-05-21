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
import type { User, Student } from "@/types/user";

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
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setBalance(user.successPoints ?? 0);
      setAmount("");
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const parsed = Math.trunc(Number(amount));
  const valid =
    amount.trim() !== "" && Number.isFinite(parsed) && parsed !== 0;
  const preview = valid ? balance + parsed : balance;

  const apply = async () => {
    if (!valid) {
      toast.error(
        "Enter a non-zero whole number (use a minus sign to deduct).",
      );
      return;
    }
    setIsApplying(true);
    try {
      const res = await adminAdjust({
        userId: user._id || "",
        points: parsed,
      });
      setBalance(res.balance);
      setAmount("");
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
            disabled={isApplying || !valid}
          >
            {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isApplying ? "Applying…" : "Apply"}
          </OrangeButton>
        </div>
      </div>
    </div>
  );
}
