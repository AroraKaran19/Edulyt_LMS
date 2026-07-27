import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { CheckoutOrder } from "@/types/order";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

/** Loaded lazily and once — pages where nobody pays never fetch it. */
const loadRazorpayScript = (): Promise<void> => {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Failed to load Razorpay checkout"));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
};

const goToStatus = (orderId: string) => {
  window.location.href = `/payment/status/${orderId}`;
};

/**
 * Open the gateway's checkout for an already-created order.
 * Free orders never reach here — callers handle `freeOrder` before calling.
 */
export const launchCheckout = async (order: CheckoutOrder): Promise<void> => {
  if (order.gateway !== "razorpay") {
    // Paytm keeps its existing dedicated page, which reads the paymentToken cookie.
    window.location.href = `/paytm-redirect?orderId=${order._id}`;
    return;
  }

  if (!order.gatewayOrderId || !order.keyId) {
    throw new Error("Razorpay order is missing gatewayOrderId or keyId");
  }

  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Razorpay checkout unavailable");

  const checkout = new window.Razorpay({
    key: order.keyId,
    order_id: order.gatewayOrderId,
    amount: order.amount != null ? Math.round(order.amount * 100) : undefined,
    currency: order.currency ?? "INR",
    handler: async (response: Record<string, string>) => {
      try {
        await apiClient.post(ENDPOINTS.payments.verify(order._id), response);
      } catch {
        // The webhook and the reconciliation cron still settle this order —
        // the status page will catch up. Never strand the learner here.
      }
      goToStatus(order._id);
    },
    modal: {
      // Dismissed without paying: the order stays pending and the cron reaps it.
      ondismiss: () => {},
    },
  });

  checkout.open();
};
