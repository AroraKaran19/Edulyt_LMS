"use client";

import type { CaDesk } from "@/types/ca-desk";
import s from "../desk.module.css";

type Props = Pick<
  CaDesk,
  "caPoints" | "thresholdPct" | "availablePoints" | "requiredPoints" | "pointsFromTasks" | "pointsFromMeetings"
>;

const isNum = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

export default function CaProgressCard({
  caPoints,
  thresholdPct,
  availablePoints,
  requiredPoints,
  pointsFromTasks,
  pointsFromMeetings,
}: Props) {
  // An admin override can still fail anyone, so with no threshold the card states no requirement at all.
  const target =
    isNum(thresholdPct) && thresholdPct > 0 && isNum(requiredPoints) && isNum(availablePoints)
      ? { pct: thresholdPct, required: requiredPoints, available: availablePoints }
      : null;

  return (
    <aside className={s.points} aria-label="Your success points">
      <p className={s.pointsTop}>
        <span className={s.num}>{caPoints}</span>
        <small>success points</small>
      </p>
      {target ? (
        <>
          <p className={s.pointsNote}>
            You need <b>{target.pct}%</b> of available points: <b>{target.required}</b> of {target.available} so far,
            for the LOR and certificates.
          </p>
          <div
            className={s.meter}
            role="progressbar"
            aria-label="Points towards what you need"
            aria-valuemin={0}
            aria-valuemax={target.required}
            aria-valuenow={Math.min(caPoints, target.required)}
          >
            <i
              style={{
                width: `${target.required > 0 ? Math.min(100, Math.round((caPoints / target.required) * 100)) : 0}%`,
              }}
            />
          </div>
          <div className={s.pointsLegend}>
            <span>{caPoints} earned</span>
            <span>
              {target.available === 0
                ? "No points available yet"
                : caPoints < target.required
                  ? `${target.required - caPoints} to go`
                  : `${target.required} needed so far`}
            </span>
          </div>
        </>
      ) : null}
      <ul className={s.pointsList}>
        <li>
          <span>From tasks</span>
          <span>+{pointsFromTasks}</span>
        </li>
        <li>
          <span>From meetings</span>
          <span>+{pointsFromMeetings}</span>
        </li>
      </ul>
    </aside>
  );
}
