import { Icon } from "@iconify/react";

// Compact 80% dial — the signature, kept small so the strip stays one row tall.
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const REQUIRED_PCT = 0.8;

/**
 * Slim, evergreen reminder on the internship dashboard of how the certificate
 * is earned: at least 80% Success Points across meetings and tasks.
 */
const CertificationInfoCard = () => {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-linear-to-r from-primary/6 via-white to-white px-3 py-2.5 sm:gap-4 sm:px-4">
      {/* 80% ring */}
      <div className="relative size-12 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="13"
            className="stroke-primary/15"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="13"
            strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={`${CIRCUMFERENCE * REQUIRED_PCT} ${CIRCUMFERENCE}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-extrabold leading-none text-primary">
            80%
          </span>
        </div>
      </div>

      {/* Copy */}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
          <Icon
            icon="solar:medal-ribbon-star-bold"
            className="size-4 shrink-0 text-primary"
          />
          How you earn your certificate
        </p>
        <p className="mt-0.5 text-xs text-text-secondary sm:text-[13px]">
          Secure at least{" "}
          <span className="font-semibold text-text-primary">
            80% Success Points
          </span>{" "}
          from meetings and tasks — through active participation, timely task
          completion, and consistent attendance.
        </p>
      </div>
    </div>
  );
};

export default CertificationInfoCard;
