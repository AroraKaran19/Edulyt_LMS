import { AppCounterModel } from "../models/appCounter.schema";

const COUNTER_ID = "internId";

/**
 * Atomically allocate the next intern ID (e.g. `AI-00046`). Uses Mongo's
 * per-document atomicity guarantee on `$inc`, so concurrent callers always
 * receive distinct sequence numbers — no race regardless of parallelism.
 *
 * Call this once at the point an enrollment transitions to
 * `offer_letter_pending`. Persist the result on the enrollment row so the
 * offer-letter worker reads a stable ID on every retry.
 */
export async function allocateNextInternId(): Promise<string> {
  const result = await AppCounterModel.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  const seq = (result as { seq: number }).seq;
  return `AI-${seq.toString().padStart(5, "0")}`;
}

/**
 * Seed the intern-ID counter to a specific value. Used by backfill scripts
 * after they've manually assigned IDs to a batch of enrollments — sets the
 * counter to the last assigned number so the next live allocation continues
 * the sequence without collision.
 */
export async function seedInternIdCounter(value: number): Promise<void> {
  await AppCounterModel.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $set: { seq: value } },
    { upsert: true },
  );
}
