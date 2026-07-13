import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getProvider, getEnabledGateways, resolveGateway } from "../registry";

const ENV = { ...process.env };

beforeEach(() => {
  process.env.PAYTM_MID = "mid";
  process.env.PAYTM_KEY = "key";
  process.env.PAYTM_WEBSITE = "site";
  process.env.PAYMENT_GATEWAYS_ENABLED = "paytm";
});
afterEach(() => {
  process.env = { ...ENV };
});

describe("registry", () => {
  it("returns the paytm provider", () => {
    expect(getProvider("paytm").name).toBe("paytm");
  });

  it("throws on an unknown gateway", () => {
    expect(() => getProvider("stripe")).toThrow(/Unsupported payment gateway/i);
  });

  it("throws when the gateway is not enabled", () => {
    process.env.PAYMENT_GATEWAYS_ENABLED = "razorpay";
    expect(() => getProvider("paytm")).toThrow(/not enabled/i);
  });

  it("omits a gateway whose credentials are missing", () => {
    delete process.env.PAYTM_KEY;
    expect(getEnabledGateways()).toEqual([]);
  });

  it("defaults to the first enabled gateway when none is requested", () => {
    expect(resolveGateway(undefined)).toBe("paytm");
  });

  // In Phase 1 razorpay has no registered provider, so it is rejected as
  // "unsupported"; once Phase 2 registers one it will be rejected as "not
  // enabled" instead. Either way it must never be handed to a caller.
  it("rejects a requested gateway that is not usable", () => {
    expect(() => resolveGateway("razorpay")).toThrow(
      /unsupported payment gateway|not enabled/i,
    );
  });
});
