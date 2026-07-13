import { describe, it, expect, vi, beforeEach } from "vitest";

const fulfil = vi.fn();
vi.mock("../fulfillment", () => ({
  createEnrollmentAfterPayment: (...a: unknown[]) => fulfil(...a),
}));
const pullPending = vi.fn();
vi.mock("../../../models", () => ({
  UserModel: { findById: vi.fn().mockResolvedValue({ userType: "student" }) },
  StudentModel: { findByIdAndUpdate: (...a: unknown[]) => pullPending(...a) },
}));

import { applyPaymentResult } from "../orderFlow";

const makeOrder = (over: Record<string, unknown> = {}) =>
  ({
    _id: "o1",
    userId: "u1",
    paymentStatus: "pending",
    paymentMode: "online",
    save: vi.fn().mockResolvedValue(undefined),
    ...over,
  }) as any;

describe("applyPaymentResult", () => {
  beforeEach(() => vi.clearAllMocks());

  it("settles a successful payment and fulfils it", async () => {
    const order = makeOrder();
    await applyPaymentResult(order, { status: "success", txnId: "T1", paymentMode: "UPI" });

    expect(order.paymentStatus).toBe("success");
    expect(order.txnId).toBe("T1");
    expect(order.paymentMode).toBe("UPI");
    expect(order.save).toHaveBeenCalled();
    expect(fulfil).toHaveBeenCalledOnce();
  });

  it("does NOT overwrite paymentMode when the gateway omits it (webhook case)", async () => {
    const order = makeOrder({ paymentMode: "online" });
    await applyPaymentResult(order, { status: "success", txnId: "T1" });

    expect(order.paymentMode).toBe("online");
  });

  it("is idempotent — a second call on a settled order does nothing", async () => {
    const order = makeOrder({ paymentStatus: "success" });
    await applyPaymentResult(order, { status: "success", txnId: "T2" });

    expect(order.save).not.toHaveBeenCalled();
    expect(fulfil).not.toHaveBeenCalled();
    expect(order.txnId).toBeUndefined();
  });

  it("marks a failure with its reason", async () => {
    const order = makeOrder();
    await applyPaymentResult(order, { status: "failed", errorReason: "Declined" });

    expect(order.paymentStatus).toBe("failed");
    expect(order.paymentErrorReason).toBe("Declined");
    expect(fulfil).not.toHaveBeenCalled();
  });

  it("ignores a pending result", async () => {
    const order = makeOrder();
    await applyPaymentResult(order, { status: "pending" });

    expect(order.paymentStatus).toBe("pending");
    expect(order.save).not.toHaveBeenCalled();
  });

  it("never lets a fulfilment failure un-succeed a paid order", async () => {
    fulfil.mockRejectedValueOnce(new Error("enrollment blew up"));
    const order = makeOrder();

    await expect(
      applyPaymentResult(order, { status: "success", txnId: "T1" }),
    ).resolves.not.toThrow();
    expect(order.paymentStatus).toBe("success");
  });
});
