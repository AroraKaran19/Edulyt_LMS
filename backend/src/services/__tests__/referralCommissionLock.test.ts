import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const findProfile = vi.fn();
const createSale = vi.fn();
const countSales = vi.fn();
const findConfig = vi.fn();

vi.mock("../../models/referralProfile.schema", () => ({
  ReferralProfileModel: {
    findOne: (...a: unknown[]) => ({
      select: () => ({ lean: () => findProfile(...a) }),
    }),
  },
}));
const aggregateSales = vi.fn();
const findSales = vi.fn();

vi.mock("../../models/referralSale.schema", () => ({
  ReferralSaleModel: {
    create: (...a: unknown[]) => createSale(...a),
    countDocuments: (...a: unknown[]) => countSales(...a),
    aggregate: (...a: unknown[]) => aggregateSales(...a),
    find: () => {
      const chain = {
        sort: () => chain,
        skip: () => chain,
        limit: () => chain,
        lean: () => findSales(),
      };
      return chain;
    },
  },
}));
vi.mock("../../models/referralCommissionConfig.schema", () => ({
  ReferralCommissionConfigModel: {
    findOne: () => ({
      lean: () => findConfig(),
      select: () => ({ lean: () => findConfig() }),
    }),
  },
}));
const aggregateWithdrawals = vi.fn();
vi.mock("../../models/referralWithdrawal.schema", () => ({
  ReferralWithdrawalModel: {
    aggregate: (...a: unknown[]) => aggregateWithdrawals(...a),
  },
}));
vi.mock("../../models", () => ({ UserModel: { findById: vi.fn() } }));
vi.mock("../../middlewares/error.middleware", () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message);
    }
  },
}));

import {
  computeReferralBalance,
  listReferralSalesForUser,
  recordReferralSaleForOrder,
} from "../referral.services";

const REFERRER = "507f1f77bcf86cd799439011";
const BUYER = "507f1f77bcf86cd799439012";
const ORDER = "507f1f77bcf86cd799439013";

// tiers: 1+ sale -> 5%, 3+ sales -> 10%
const TIERS = [
  { thresholdSales: 1, commissionPercent: 5 },
  { thresholdSales: 3, commissionPercent: 10 },
];

const record = (amount: number) =>
  recordReferralSaleForOrder({
    orderId: ORDER,
    code: "ABCD2345",
    buyerUserId: BUYER,
    courseName: "Course",
    buyerName: "Buyer",
    amount,
  });

beforeEach(() => {
  findProfile.mockReset().mockResolvedValue({ userId: REFERRER, code: "ABCD2345" });
  createSale.mockReset().mockResolvedValue({});
  countSales.mockReset().mockResolvedValue(0);
  findConfig.mockReset().mockResolvedValue({ tiers: TIERS });
  aggregateSales.mockReset().mockResolvedValue([]);
  aggregateWithdrawals.mockReset().mockResolvedValue([]);
  findSales.mockReset().mockResolvedValue([]);
});

describe("recordReferralSaleForOrder — rate is locked at sale time", () => {
  it("stamps the live rate and amount on the sale", async () => {
    countSales.mockResolvedValue(4); // this becomes the 5th sale -> 10% tier

    await record(1000);

    expect(createSale).toHaveBeenCalledWith(
      expect.objectContaining({ commissionPercent: 10, commissionAmount: 100 }),
    );
  });

  it("counts the sale being recorded, so the very first sale earns the 1+ tier", async () => {
    countSales.mockResolvedValue(0); // first ever sale

    await record(2000);

    expect(createSale).toHaveBeenCalledWith(
      expect.objectContaining({ commissionPercent: 5, commissionAmount: 100 }),
    );
  });

  it("uses the config live at that moment — a later config edit cannot reach back", async () => {
    countSales.mockResolvedValue(0);
    await record(1000);
    expect(createSale).toHaveBeenLastCalledWith(
      expect.objectContaining({ commissionPercent: 5, commissionAmount: 50 }),
    );

    // Admin halves the rate. The next sale earns less; the one above is untouched
    // because its rate is already persisted on the row.
    findConfig.mockResolvedValue({
      tiers: [{ thresholdSales: 1, commissionPercent: 2.5 }],
    });
    countSales.mockResolvedValue(1);
    await record(1000);

    expect(createSale).toHaveBeenLastCalledWith(
      expect.objectContaining({ commissionPercent: 2.5, commissionAmount: 25 }),
    );
    expect(createSale).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ commissionPercent: 5, commissionAmount: 50 }),
    );
  });

  it("stamps 0% when no tiers are configured", async () => {
    findConfig.mockResolvedValue({ tiers: [] });

    await record(1000);

    expect(createSale).toHaveBeenCalledWith(
      expect.objectContaining({ commissionPercent: 0, commissionAmount: 0 }),
    );
  });

  it("does not record a self-referral", async () => {
    findProfile.mockResolvedValue({ userId: BUYER, code: "ABCD2345" });

    await record(1000);

    expect(createSale).not.toHaveBeenCalled();
  });
});

const OID = new mongoose.Types.ObjectId(REFERRER);

describe("computeReferralBalance — earned commission is inert", () => {
  it("sums the stored commissionAmount rather than re-rating sales", async () => {
    aggregateSales.mockResolvedValue([{ _id: null, count: 4, earned: 400 }]);

    const balance = await computeReferralBalance(OID);

    expect(balance.activeCount).toBe(4);
    expect(balance.lifetimeEarned).toBe(400);
    expect(balance.available).toBe(400);
  });

  it("does not move an earned balance when the admin drops the tier percentages", async () => {
    aggregateSales.mockResolvedValue([{ _id: null, count: 4, earned: 400 }]);

    const before = await computeReferralBalance(OID);

    // Admin rewrites the config to a much lower rate.
    findConfig.mockResolvedValue({
      tiers: [{ thresholdSales: 1, commissionPercent: 1 }],
    });
    const after = await computeReferralBalance(OID);

    expect(after.lifetimeEarned).toBe(before.lifetimeEarned);
    expect(after.available).toBe(before.available);
  });

  it("never goes negative after a withdrawal when the admin drops the rate", async () => {
    // Earned 400 at the old rate and already withdrew all of it.
    aggregateSales.mockResolvedValue([{ _id: null, count: 4, earned: 400 }]);
    aggregateWithdrawals.mockResolvedValue([{ _id: null, sum: 400 }]);
    findConfig.mockResolvedValue({
      tiers: [{ thresholdSales: 1, commissionPercent: 1 }],
    });

    const balance = await computeReferralBalance(OID);

    expect(balance.lifetimeEarned).toBe(400);
    expect(balance.available).toBe(0);
  });

  it("reports currentTierPct as the rate the NEXT sale will earn", async () => {
    // 2 active sales; the 3rd crosses the 3+ threshold -> next sale earns 10%.
    aggregateSales.mockResolvedValue([{ _id: null, count: 2, earned: 100 }]);

    const balance = await computeReferralBalance(OID);

    expect(balance.currentTierPct).toBe(10);
    expect(balance.lifetimeEarned).toBe(100); // unaffected by that rate
  });
});

describe("listReferralSalesForUser — row mapping reads the frozen commissionAmount", () => {
  it("follows the stored commissionAmount even when it disagrees with the live tier config", async () => {
    findSales.mockResolvedValue([
      {
        _id: "507f1f77bcf86cd799439099",
        courseName: "Course",
        buyerName: "Buyer",
        amount: 1000,
        commissionPercent: 5,
        commissionAmount: 50, // frozen at sale time
        status: "active",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);
    countSales.mockResolvedValue(1);
    // Admin has since rewritten the live config to a very different rate — if
    // the row were re-derived from this it would show 500, not 50.
    findConfig.mockResolvedValue({
      tiers: [{ thresholdSales: 1, commissionPercent: 50 }],
    });

    const result = await listReferralSalesForUser(OID, 1, 10);

    expect(result.items[0].commission).toBe(50);
  });

  it("displays commission: 0 for a reversed sale", async () => {
    findSales.mockResolvedValue([
      {
        _id: "507f1f77bcf86cd799439099",
        courseName: "Course",
        buyerName: "Buyer",
        amount: 1000,
        commissionPercent: 5,
        commissionAmount: 50,
        status: "reversed",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);
    countSales.mockResolvedValue(1);

    const result = await listReferralSalesForUser(OID, 1, 10);

    expect(result.items[0].commission).toBe(0);
  });
});
