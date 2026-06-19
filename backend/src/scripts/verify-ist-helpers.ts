/**
 * Self-contained verification for the IST helpers (no test framework installed).
 * Run: npx ts-node src/scripts/verify-ist-helpers.ts
 * Exits non-zero on the first failed assertion.
 *
 * The frontend `lib/ist.ts` mirrors this exact offset math, so verifying the
 * backend module covers the shared logic.
 */
import {
  istWallClockToUtc,
  parseIstDatetimeLocal,
  parseIstDateOnly,
  ymdIst,
  istEndOfDayUtc,
  utcToIstDatetimeLocalValue,
} from "../utils/ist";

let passed = 0;
function eq(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    console.error(`❌ ${label}\n   expected: ${expected}\n   actual:   ${actual}`);
    process.exit(1);
  }
  passed++;
  console.log(`✅ ${label}`);
}

// IST wall-clock 11:00 on 20 Jun is 05:30Z (11:00 − 5:30).
eq(
  istWallClockToUtc(2025, 6, 20, 11, 0).toISOString(),
  "2025-06-20T05:30:00.000Z",
  "istWallClockToUtc(11:00 IST) → 05:30Z",
);

// datetime-local input is interpreted as IST.
eq(
  parseIstDatetimeLocal("2025-06-20T11:00")?.toISOString(),
  "2025-06-20T05:30:00.000Z",
  "parseIstDatetimeLocal('2025-06-20T11:00') → 05:30Z",
);

// Date-only is IST midnight → 18:30Z on the previous day.
eq(
  parseIstDateOnly("2025-06-20")?.toISOString(),
  "2025-06-19T18:30:00.000Z",
  "parseIstDateOnly('2025-06-20') → 18:30Z prev day",
);

// Calendar-day boundary: an instant at IST midnight reads as that IST day.
eq(ymdIst("2025-06-19T18:30:00.000Z"), "2025-06-20", "ymdIst at IST midnight → next day");
eq(
  ymdIst("2025-06-19T18:29:59.999Z"),
  "2025-06-19",
  "ymdIst 1ms before IST midnight → same day",
);
eq(ymdIst("2025-06-19T20:00:00.000Z"), "2025-06-20", "ymdIst 20:00Z → 01:30 IST next day");

// End-of-day IST (23:59:59.999 IST = 18:29:59.999Z same day).
eq(
  istEndOfDayUtc("2025-06-20T05:30:00.000Z")?.toISOString(),
  "2025-06-20T18:29:59.999Z",
  "istEndOfDayUtc → 18:29:59.999Z",
);

// Pre-fill a datetime-local input from a stored instant, in IST.
eq(
  utcToIstDatetimeLocalValue("2025-06-20T05:30:00.000Z"),
  "2025-06-20T11:00",
  "utcToIstDatetimeLocalValue(05:30Z) → '2025-06-20T11:00'",
);

// Round-trip: input → store → re-fill input.
const roundTrip = utcToIstDatetimeLocalValue(
  parseIstDatetimeLocal("2025-12-31T23:45"),
);
eq(roundTrip, "2025-12-31T23:45", "round-trip datetime-local preserves IST wall clock");

console.log(`\n${passed} assertions passed.`);
process.exit(0);
