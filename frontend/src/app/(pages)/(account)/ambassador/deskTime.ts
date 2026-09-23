const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const IST = "Asia/Kolkata";

/** Whole days since the epoch on the IST calendar, so day maths ignores the browser's zone. */
const istDay = (ms: number) => Math.floor((ms + IST_OFFSET_MS) / DAY_MS);

export interface Tenure {
  /** 0 before the joining date, `total` once the end date has passed. */
  day: number;
  total: number;
  daysLeft: number;
  daysToStart: number;
  endLabel: string;
  startLabel: string;
}

export function tenureOf(joiningDate: string | null, endDate: string | null, now: number): Tenure | null {
  if (!joiningDate || !endDate) return null;
  const start = new Date(joiningDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const total = istDay(end) - istDay(start) + 1;
  const today = istDay(now);
  const day = Math.min(Math.max(today - istDay(start) + 1, 0), total);
  return {
    day,
    total,
    daysLeft: Math.max(istDay(end) - today, 0),
    daysToStart: Math.max(istDay(start) - today, 0),
    endLabel: formatDate(endDate, true),
    startLabel: formatDate(joiningDate, true),
  };
}

export function formatDate(iso: string, withYear = false): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { timeZone: IST, hour: "numeric", minute: "2-digit" });
}

export function formatWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: IST, weekday: "long" });
}

export type DueTone = "calm" | "near" | "urgent";

/** Countdown copy for an open task; the tone warms as the deadline gets closer. */
export function dueIn(deadline: string | null, now: number): { label: string; tone: DueTone } {
  if (!deadline) return { label: "Open now", tone: "calm" };
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return { label: "Due now", tone: "urgent" };
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return { label: `Due in ${hours} hour${hours === 1 ? "" : "s"}`, tone: "urgent" };
  const days = Math.ceil(ms / DAY_MS);
  return { label: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: days <= 3 ? "near" : "calm" };
}
