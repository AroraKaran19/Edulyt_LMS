/** Show list reminder from this many days before certification exam opens (UTC window). */
export const CERTIFICATION_EXAM_REMINDER_LEAD_DAYS = 2;

const MS_PER_DAY = 86_400_000;
export const CERTIFICATION_EXAM_REMINDER_LEAD_MS =
  CERTIFICATION_EXAM_REMINDER_LEAD_DAYS * MS_PER_DAY;

export type CertificationExamListReminder =
  | {
      show: true;
      phase: "upcoming" | "open";
      examStartAt: Date;
      examEndAt: Date;
    }
  | { show: false };

/**
 * Dashboard list: surface certification exam from T−2 days through window end (UTC instants).
 */
export function getCertificationExamListReminder(
  certificationExamStartAt?: string,
  certificationExamEndAt?: string,
  nowMs: number = Date.now(),
): CertificationExamListReminder {
  if (!certificationExamStartAt || !certificationExamEndAt) {
    return { show: false };
  }
  const examStartAt = new Date(certificationExamStartAt);
  const examEndAt = new Date(certificationExamEndAt);
  if (Number.isNaN(examStartAt.getTime()) || Number.isNaN(examEndAt.getTime())) {
    return { show: false };
  }
  if (nowMs > examEndAt.getTime()) return { show: false };

  const notifyFrom = examStartAt.getTime() - CERTIFICATION_EXAM_REMINDER_LEAD_MS;
  if (nowMs < notifyFrom) return { show: false };

  const phase = nowMs < examStartAt.getTime() ? "upcoming" : "open";
  return { show: true, phase, examStartAt, examEndAt };
}

export function formatCertExamIstRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  };
  return `${start.toLocaleString("en-IN", opts)} – ${end.toLocaleString("en-IN", opts)}`;
}
