import { describe, it, expect } from "vitest";
import {
  computeProgramEndDate,
  deriveCertificateVerdict,
  computeAchievableTaskPoints,
  isProgramWindowOver,
  resolveProgramEndDate,
} from "../internshipProgramWindow";

describe("computeProgramEndDate", () => {
  it("returns IST end-of-day of the last day of the program", () => {
    // 1 Aug 2025 IST + 3 months -> last day is 31 Oct 2025 IST.
    // IST 23:59:59.999 on 31 Oct == 18:29:59.999Z on 31 Oct.
    const start = new Date("2025-08-01T00:00:00.000Z");
    const end = computeProgramEndDate(start, 3);
    expect(end.toISOString()).toBe("2025-10-31T18:29:59.999Z");
  });

  it("handles a 1-month program across a 31-day month", () => {
    const start = new Date("2025-05-01T00:00:00.000Z");
    const end = computeProgramEndDate(start, 1);
    expect(end.toISOString()).toBe("2025-05-31T18:29:59.999Z");
  });

  it("throws on a non-positive duration", () => {
    expect(() =>
      computeProgramEndDate(new Date("2025-08-01T00:00:00Z"), 0),
    ).toThrow();
  });
});

describe("deriveCertificateVerdict", () => {
  it("passes an eligible learner", () => {
    expect(deriveCertificateVerdict({ certificateEligible: true })).toEqual({
      verdict: "pass",
      reason: "passed",
    });
  });

  it("fails an ineligible learner with a points shortfall", () => {
    expect(deriveCertificateVerdict({ certificateEligible: false })).toEqual({
      verdict: "fail",
      reason: "points_shortfall",
    });
  });
});

describe("isProgramWindowOver", () => {
  const end = new Date("2025-10-31T18:29:59.999Z");

  it("is true after the window end", () => {
    expect(isProgramWindowOver(end, end.getTime() + 1)).toBe(true);
  });

  it("is false at or before the window end", () => {
    expect(isProgramWindowOver(end, end.getTime())).toBe(false);
    expect(isProgramWindowOver(end, end.getTime() - 1)).toBe(false);
  });

  it("treats a missing or invalid endDate as no window to enforce", () => {
    expect(isProgramWindowOver(null, Date.now())).toBe(false);
    expect(isProgramWindowOver(undefined, Date.now())).toBe(false);
    expect(isProgramWindowOver("not-a-date", Date.now())).toBe(false);
  });

  it("accepts an ISO string endDate", () => {
    expect(isProgramWindowOver(end.toISOString(), end.getTime() + 1)).toBe(true);
  });
});

describe("resolveProgramEndDate", () => {
  it("prefers a stored endDate", () => {
    const stored = new Date("2025-10-31T18:29:59.999Z");
    expect(
      resolveProgramEndDate({ endDate: stored, cohortStart: new Date("2025-08-01T00:00:00Z"), durationMonths: 6 })?.toISOString(),
    ).toBe(stored.toISOString());
  });

  it("derives from cohort start + duration when no endDate is stored", () => {
    expect(
      resolveProgramEndDate({
        cohortStart: new Date("2025-08-01T00:00:00.000Z"),
        durationMonths: 3,
      })?.toISOString(),
    ).toBe("2025-10-31T18:29:59.999Z");
  });

  it("returns null when nothing is resolvable", () => {
    expect(resolveProgramEndDate({})).toBeNull();
    expect(resolveProgramEndDate({ cohortStart: new Date("2025-08-01T00:00:00Z") })).toBeNull();
  });
});

describe("computeAchievableTaskPoints", () => {
  const start = new Date("2025-08-01T00:00:00.000Z");
  const end = new Date("2025-10-31T18:29:59.999Z");

  it("counts tasks whose due date lands inside the window", () => {
    const total = computeAchievableTaskPoints(
      [
        { successPoints: 10, dueDays: 30 },
        { successPoints: 5, dueDays: 60 },
      ],
      start,
      end,
    );
    expect(total).toBe(15);
  });

  it("excludes tasks due after the window ends", () => {
    const total = computeAchievableTaskPoints(
      [
        { successPoints: 10, dueDays: 30 },
        { successPoints: 99, dueDays: 400 },
      ],
      start,
      end,
    );
    expect(total).toBe(10);
  });

  it("skips inactive templates", () => {
    const total = computeAchievableTaskPoints(
      [{ successPoints: 10, dueDays: 30, isActive: false }],
      start,
      end,
    );
    expect(total).toBe(0);
  });

  it("treats missing/negative points as zero", () => {
    const total = computeAchievableTaskPoints(
      [{ dueDays: 10 }, { successPoints: -5, dueDays: 10 }],
      start,
      end,
    );
    expect(total).toBe(0);
  });
});
