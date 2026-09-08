"use client";

import Input from "@/components/ui/inputs/Input";
import PercentageInput from "@/components/ui/inputs/PercentageInput";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import LockedField from "./LockedField";

type Props = {
  minDiscountPercent: string;
  setMinDiscountPercent: (v: string) => void;
  maxDiscountPercent: string;
  setMaxDiscountPercent: (v: string) => void;
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

/** "10%" when the bounds match, "10% to 50%" when they differ. */
const describeRange = (min: string, max: string): string =>
  min === max ? `${min}%` : `${min}% to ${max}%`;

export default function StepReward({
  minDiscountPercent,
  setMinDiscountPercent,
  maxDiscountPercent,
  setMaxDiscountPercent,
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
          <LockedField
            label="Discount"
            value={describeRange(minDiscountPercent, maxDiscountPercent)}
          />
          <LockedField label="Attempt clock" value={`${durationMinutes} min`} />
          <LockedField label="Attempts allowed" value={attemptsAllowed} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <PercentageInput
            label="Lowest discount"
            required
            value={minDiscountPercent}
            onChange={(e) => setMinDiscountPercent(e.target.value)}
            min={1}
            max={100}
          />
          <PercentageInput
            label="Highest discount"
            required
            value={maxDiscountPercent}
            onChange={(e) => setMaxDiscountPercent(e.target.value)}
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

      {!frozen && (
        <p className="text-xs text-gray-500 -mt-2">
          Each finisher wins a random whole percentage between these two,
          inclusive. Set them to the same number for a fixed discount. The range
          is never shown to candidates: they see what they won only after they
          finish.
        </p>
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
        Turning this off hides the campaign and stops new attempts. Codes
        already won stay valid until each winner&apos;s own deadline.
      </p>
    </div>
  );
}
