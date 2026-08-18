"use client";

import Input from "@/components/ui/inputs/Input";
import PercentageInput from "@/components/ui/inputs/PercentageInput";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import LockedField from "./LockedField";

type Props = {
  discountPercent: string;
  setDiscountPercent: (v: string) => void;
  durationMinutes: string;
  setDurationMinutes: (v: string) => void;
  attemptsAllowed: string;
  setAttemptsAllowed: (v: string) => void;
  couponValidForDays: string;
  setCouponValidForDays: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  /** Edit mode freezes the reward terms and the opening instant. */
  frozen: boolean;
};

export default function StepReward({
  discountPercent,
  setDiscountPercent,
  durationMinutes,
  setDurationMinutes,
  attemptsAllowed,
  setAttemptsAllowed,
  couponValidForDays,
  setCouponValidForDays,
  isActive,
  setIsActive,
  frozen,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {frozen ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LockedField label="Discount" value={`${discountPercent}%`} />
          <LockedField label="Attempt clock" value={`${durationMinutes} min`} />
          <LockedField label="Attempts allowed" value={attemptsAllowed} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PercentageInput
            label="Discount"
            required
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            min={1}
            max={100}
          />
          <Input
            label="Attempt clock (min)"
            type="number"
            min={1}
            required
            placeholder="15"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
          <Input
            label="Attempts allowed"
            type="number"
            min={1}
            required
            placeholder="1"
            value={attemptsAllowed}
            onChange={(e) => setAttemptsAllowed(e.target.value)}
          />
        </div>
      )}

      <Input
        label="Coupon valid for (days)"
        type="number"
        min={1}
        required
        placeholder="30"
        value={couponValidForDays}
        onChange={(e) => setCouponValidForDays(e.target.value)}
      />
      <p className="text-xs text-gray-500 -mt-2">
        Counted from the moment each person finishes the test, so everyone gets
        the same run of time no matter when they take it. Someone finishing on
        the last day still gets the full{" "}
        {couponValidForDays.trim() === "" ? "period" : `${couponValidForDays} days`}.
      </p>

      <CheckBoxContainer
        label="Campaign is active"
        checked={isActive}
        onChange={setIsActive}
      />
      <p className="text-xs text-gray-500 -mt-2">
        Turning this off hides the campaign and disables its coupon immediately.
      </p>
    </div>
  );
}
