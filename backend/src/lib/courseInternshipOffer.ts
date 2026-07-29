/**
 * Validation for a course's internship offer.
 *
 * One price per course — the duration a learner picks sets their certificate
 * period, never the amount they pay. Pure by design so the create and update
 * paths share one rule and it unit-tests without fixtures.
 */
import mongoose from "mongoose";

export type NormalizedOffer = {
  programId: string;
  price: number;
  durations: number[];
};

export type NormalizeResult = {
  /** null means "this course sells no internship" — a valid state. */
  offer: NormalizedOffer | null;
  /** Non-null means the input was rejected; the caller should 400 with it. */
  error: string | null;
};

const ok = (offer: NormalizedOffer | null): NormalizeResult => ({
  offer,
  error: null,
});
const fail = (error: string): NormalizeResult => ({ offer: null, error });

export function normalizeInternshipOffer(input: unknown): NormalizeResult {
  if (input === undefined || input === null) return ok(null);
  if (typeof input !== "object") {
    return fail("Internship offer must be an object");
  }

  const { programId, price, durations } = input as Record<string, unknown>;

  // No program selected → the course simply does not sell an internship.
  if (programId === undefined || programId === null || programId === "") {
    return ok(null);
  }

  if (
    typeof programId !== "string" ||
    !mongoose.Types.ObjectId.isValid(programId)
  ) {
    return fail("Internship program is not a valid id");
  }

  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return fail("Internship price must be a number of 0 or more");
  }

  if (!Array.isArray(durations) || durations.length === 0) {
    return fail("Select at least one internship duration");
  }

  const parsed: number[] = [];
  for (const raw of durations) {
    const months = Number(raw);
    if (!Number.isInteger(months) || months < 1) {
      return fail("Each duration must be a whole number of months, 1 or more");
    }
    if (parsed.includes(months)) {
      return fail("Duplicate internship duration");
    }
    parsed.push(months);
  }

  return ok({
    programId,
    price: Math.round(priceNum * 100) / 100,
    durations: parsed.sort((a, b) => a - b),
  });
}

export type OfferSelection = {
  months: number;
  price: number;
};

/**
 * Validates a learner's add-on choice against the course's own offer.
 *
 * The price always comes from the offer, never from the client — a learner can
 * choose *which* duration, never what it costs. All durations cost the same;
 * the choice sets the certificate period only.
 */
export function resolveOfferSelection(
  offer: { price: number; durations: number[] } | null | undefined,
  months: unknown,
): { selection: OfferSelection | null; error: string | null } {
  const wantsInternship = months !== undefined && months !== null && months !== "";

  if (!wantsInternship) return { selection: null, error: null };

  if (!offer || !Array.isArray(offer.durations) || offer.durations.length === 0) {
    return {
      selection: null,
      error: "This course does not offer an internship",
    };
  }

  const requested = Number(months);
  if (!Number.isInteger(requested) || requested < 1) {
    return { selection: null, error: "Invalid internship duration" };
  }

  if (!offer.durations.includes(requested)) {
    return {
      selection: null,
      error: "That internship duration is not offered for this course",
    };
  }

  const price = Number(offer.price);
  if (!Number.isFinite(price) || price < 0) {
    return { selection: null, error: "This course's internship price is invalid" };
  }

  return { selection: { months: requested, price }, error: null };
}

export type MirrorSync = {
  /** Program to remove this course from, or null. */
  pullFrom: string | null;
  /** Program to add this course to, or null. */
  addTo: string | null;
};

/**
 * Decides how to reconcile `courseInternships.courses[]` when a course's chosen
 * program changes. Pure so the decision is testable without a database; the
 * caller performs the two writes.
 *
 * An unchanged program is a no-op — re-saving a course must not churn the
 * mirror.
 */
export function planMirrorSync(
  previousProgramId: string | null,
  nextProgramId: string | null,
): MirrorSync {
  if (previousProgramId === nextProgramId) {
    return { pullFrom: null, addTo: null };
  }
  return { pullFrom: previousProgramId, addTo: nextProgramId };
}
