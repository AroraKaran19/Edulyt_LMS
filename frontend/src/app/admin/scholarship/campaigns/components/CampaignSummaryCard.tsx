type Props = {
  questionCount: number;
  durationMinutes: string;
  attemptsAllowed: string;
  discountPercent: string;
  couponValidForDays: string;
};

const orDash = (value: string): string => (value.trim() === "" ? "—" : value);

/**
 * Visible on every step, so a misconfigured window or reward is obvious next to
 * everything else rather than only on the step that owns it.
 */
export default function CampaignSummaryCard({
  questionCount,
  durationMinutes,
  attemptsAllowed,
  discountPercent,
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
          {orDash(discountPercent)}% off
        </span>
      </p>
      <p className="text-xs text-gray-500 mt-1 tabular-nums">
        Live as soon as you create it · {orDash(couponValidForDays)} day
        {couponValidForDays === "1" ? "" : "s"} to redeem
      </p>
    </div>
  );
}
