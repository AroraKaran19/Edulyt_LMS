import type { CampaignStatus } from "@/types/scholarship";

const STYLES: Record<CampaignStatus, { label: string; className: string }> = {
  live: {
    label: "Live",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export default function StatusPill({ status }: { status: CampaignStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${className}`}
    >
      {label}
    </span>
  );
}
