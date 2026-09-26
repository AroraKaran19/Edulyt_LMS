import { addIstCalendarDays, istEndOfDayUtc, ymdIst } from "../utils/ist";

export type SuccessPointLot = { points: number; expiresAt: Date | null };

const expiryMs = (lot: SuccessPointLot): number =>
  lot.expiresAt ? new Date(lot.expiresAt).getTime() : Number.POSITIVE_INFINITY;

export const sortLots = (lots: SuccessPointLot[]): SuccessPointLot[] =>
  [...lots].sort((a, b) => expiryMs(a) - expiryMs(b));

const lotTotal = (lots: SuccessPointLot[]): number =>
  lots.reduce((sum, lot) => sum + lot.points, 0);

function mergeLots(lots: SuccessPointLot[]): SuccessPointLot[] {
  const merged: SuccessPointLot[] = [];
  for (const lot of sortLots(lots)) {
    if (lot.points <= 0) continue;
    const last = merged[merged.length - 1];
    if (last && expiryMs(last) === expiryMs(lot)) last.points += lot.points;
    else merged.push({ points: lot.points, expiresAt: lot.expiresAt ?? null });
  }
  return merged;
}

/** 0 days means the points never expire. */
export function expiryFromDays(days: number, now = new Date()): Date | null {
  const whole = Math.floor(Number(days));
  if (!Number.isFinite(whole) || whole <= 0) return null;
  return istEndOfDayUtc(addIstCalendarDays(now, whole));
}

export const istMonthKey = (now = new Date()): string =>
  (ymdIst(now) ?? "").slice(0, 7);

/** Lots total max(0, balance); untracked balance (pre-backfill, scripts) never expires. */
export function reconcileLots(
  lots: SuccessPointLot[],
  balance: number,
): SuccessPointLot[] {
  const target = Math.max(0, Math.floor(balance));
  const current = mergeLots(lots);
  const diff = target - lotTotal(current);
  if (diff > 0) return mergeLots([...current, { points: diff, expiresAt: null }]);
  if (diff < 0) return trimLatest(current, -diff);
  return current;
}

function trimLatest(lots: SuccessPointLot[], excess: number): SuccessPointLot[] {
  let remaining = excess;
  const kept: SuccessPointLot[] = [];
  for (const lot of [...lots].reverse()) {
    const cut = Math.min(remaining, lot.points);
    remaining -= cut;
    if (lot.points - cut > 0) kept.unshift({ ...lot, points: lot.points - cut });
  }
  return kept;
}

/** Incoming points first pay off a negative balance, soonest-expiring first. */
export function creditLots(
  lots: SuccessPointLot[],
  balance: number,
  incoming: SuccessPointLot[],
): SuccessPointLot[] {
  let deficit = Math.max(0, -balance);
  const added: SuccessPointLot[] = [];
  for (const lot of sortLots(incoming)) {
    const payoff = Math.min(deficit, lot.points);
    deficit -= payoff;
    if (lot.points - payoff > 0) added.push({ ...lot, points: lot.points - payoff });
  }
  return mergeLots([...lots, ...added]);
}

/** Spends soonest-expiring lots first; `taken` is what left the wallet. */
export function debitLots(
  lots: SuccessPointLot[],
  points: number,
): { lots: SuccessPointLot[]; taken: SuccessPointLot[] } {
  let remaining = points;
  const kept: SuccessPointLot[] = [];
  const taken: SuccessPointLot[] = [];
  for (const lot of sortLots(lots)) {
    const take = Math.min(remaining, lot.points);
    remaining -= take;
    if (take > 0) taken.push({ points: take, expiresAt: lot.expiresAt });
    if (lot.points - take > 0) kept.push({ ...lot, points: lot.points - take });
  }
  return { lots: kept, taken };
}

export function splitExpiredLots(
  lots: SuccessPointLot[],
  now: Date,
): { live: SuccessPointLot[]; expiredPoints: number } {
  const live: SuccessPointLot[] = [];
  let expiredPoints = 0;
  for (const lot of lots) {
    if (lot.expiresAt && new Date(lot.expiresAt).getTime() <= now.getTime()) {
      expiredPoints += lot.points;
    } else {
      live.push(lot);
    }
  }
  return { live, expiredPoints };
}

export function nextExpiringLot(lots: SuccessPointLot[]): SuccessPointLot | null {
  return sortLots(lots).find((lot) => lot.expiresAt && lot.points > 0) ?? null;
}
