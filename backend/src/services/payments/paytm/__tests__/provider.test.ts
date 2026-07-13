import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { PaytmProvider } from "../provider";

vi.mock("axios");
vi.mock("../checksum", () => ({
  generatePaytmChecksum: vi.fn().mockResolvedValue("sig"),
}));

const order = { _id: "order123", amount: 500 } as any;

describe("PaytmProvider.fetchPaymentStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps TXN_SUCCESS to success with txnId and paymentMode", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      status: 200,
      data: {
        body: {
          resultInfo: { resultStatus: "TXN_SUCCESS" },
          txnId: "T1",
          paymentMode: "UPI",
        },
      },
    } as any);

    const result = await new PaytmProvider().fetchPaymentStatus(order);

    expect(result).toEqual({ status: "success", txnId: "T1", paymentMode: "UPI" });
  });

  it("maps TXN_FAILURE to failed and carries the reason", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      status: 200,
      data: {
        body: {
          resultInfo: { resultStatus: "TXN_FAILURE", resultMsg: "Insufficient funds" },
        },
      },
    } as any);

    const result = await new PaytmProvider().fetchPaymentStatus(order);

    expect(result).toEqual({ status: "failed", errorReason: "Insufficient funds" });
  });

  it("maps anything else to pending", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      status: 200,
      data: { body: { resultInfo: { resultStatus: "PENDING" } } },
    } as any);

    const result = await new PaytmProvider().fetchPaymentStatus(order);

    expect(result.status).toBe("pending");
  });

  it("returns pending (never throws) when Paytm is unreachable", async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error("ECONNRESET"));

    const result = await new PaytmProvider().fetchPaymentStatus(order);

    expect(result.status).toBe("pending");
  });
});
