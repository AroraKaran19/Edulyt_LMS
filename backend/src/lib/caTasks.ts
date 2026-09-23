import { addIstCalendarDays, istEndOfDayUtc } from "../utils/ist";

export interface CaTaskWindowInput {
  startFromDay: number;
  endOnDay: number;
}

export interface CaTaskWindow {
  opensAt: Date;
  deadline: Date;
  visible: boolean;
  submittable: boolean;
}

/**
 * A task's window for one CA. Returns null when the CA has no joining date
 * yet, or when the task's opening day falls after their tenure end date (the
 * tenure cut-off: it never appears for that CA at all).
 */
export function isCaTaskOpenForApplication(
  task: CaTaskWindowInput,
  joiningDate: Date | null,
  tenureEndDate: Date | null,
  now: Date = new Date(),
): CaTaskWindow | null {
  if (!joiningDate || !tenureEndDate) return null;

  const opensAt = addIstCalendarDays(joiningDate, task.startFromDay);
  if (!opensAt || opensAt.getTime() > tenureEndDate.getTime()) return null;

  const ownDeadline = istEndOfDayUtc(addIstCalendarDays(joiningDate, task.endOnDay));
  const tenureDeadline = tenureEndDate;
  const deadline =
    ownDeadline && ownDeadline.getTime() < tenureDeadline.getTime() ? ownDeadline : tenureDeadline;

  const nowMs = now.getTime();
  return {
    opensAt,
    deadline,
    visible: nowMs >= opensAt.getTime(),
    submittable: nowMs >= opensAt.getTime() && nowMs <= deadline.getTime(),
  };
}
