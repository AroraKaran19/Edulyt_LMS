type Props = {
  questionCount: number;
  durationMinutes: string;
  attemptsAllowed: string;
  minDiscountPercent: string;
  maxDiscountPercent: string;
  couponValidForDays: string;
};

const orDash = (value: string): string => (value.trim() === "" ? "—" : value);

/** "25% off" when the bounds match, "10-50% off" when they differ. */
const describeReward = (min: string, max: string): string => {
  if (min.trim() === "" || max.trim() === "") {
    return `${orDash(min)}% off`;
  }
  return min === max ? `${min}% off` : `${min}-${max}% off`;
};

/**
 * Visible on every step, so a misconfigured window or reward is obvious next to
 * everything else rather than only on the step that owns it.
 */
export default function CampaignSummaryCard({
  questionCount,
  durationMinutes,
  attemptsAllowed,
  minDiscountPercent,
  maxDiscountPercent,
  couponValidForDays,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
      <p className="text-xs text-gray-600 leading-relaxed tabular-nums">
        <span className="font-semibold text-gray-900">
          {questionCount} question{questionCount === 1 ? "" : "s"}
        </span>
        {" · "}
        {orDash(durationMinutes)} min · {orDash(attemptsAllowed)} attempt
        {attemptsAllowed === "1" ? "" : "s"} ·{" "}
        <span className="font-semibold text-gray-900">
          {describeReward(minDiscountPercent, maxDiscountPercent)}
        </span>
      </p>
      <p className="text-xs text-gray-500 mt-1 tabular-nums">
        Live as soon as you create it · {orDash(couponValidForDays)} day
        {couponValidForDays === "1" ? "" : "s"} to redeem
      </p>
    </div>
  );
}
