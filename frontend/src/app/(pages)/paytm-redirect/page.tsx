"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";

declare global {
  interface Window {
    Paytm?: {
      CheckoutJS?: {
        onLoad: (callback: () => void) => void;
        init: (config: any) => Promise<void>;
        invoke: () => void;
      };
    };
  }
}

const PaymentRedirectContent = () => {
  const [orderIdToBeUsed, setOrderIdToBeUsed] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>(
    "Continue your payment"
  );
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdFromParams = searchParams.get("orderId");

  // remove the orderId from the search params
  useEffect(() => {
    if (orderIdFromParams) {
      setOrderIdToBeUsed(orderIdFromParams);
      // Create new URLSearchParams without orderId
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("orderId");

      // Get the new search string
      const newSearch = newSearchParams.toString();

      // Replace the current URL without the orderId parameter
      const newPath = newSearch
        ? `${window.location.pathname}?${newSearch}`
        : window.location.pathname;
      router.replace(newPath);
    }
  }, [orderIdFromParams, searchParams, router]);

  useEffect(() => {
    if (orderIdToBeUsed) {
      // Load Paytm CheckoutJS script dynamically
      const script = document.createElement("script");
      script.src = `https://secure.paytmpayments.com/merchantpgpui/checkoutjs/merchants/${process.env.NEXT_PUBLIC_PAYTM_MID}.js`;
      script.crossOrigin = "anonymous";
      script.type = "application/javascript";

      script.onload = async () => {
        try {
          // get token from cookies "paymentToken"
          const paymentToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("paymentToken="))
            ?.split("=")[1];

          if (!paymentToken) {
            console.error("Payment token not found in cookies");
            setPaymentStatus("Payment token not found. Please try again.");
            // Clear any existing payment token
            document.cookie =
              "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            return;
          }

          if (!orderIdToBeUsed) {
            console.error("Order ID not found");
            setPaymentStatus("Order ID not found. Please try again.");
            // Clear payment token on error
            document.cookie =
              "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            return;
          }

          const config = {
            root: "paytm-checkout-container",
            flow: "DEFAULT",
            data: {
              orderId: orderIdToBeUsed,
              token: paymentToken,
              tokenType: "TXN_TOKEN",
              amount: "1",
            },
            handler: {
              notifyMerchant: function (eventName: string) {
                // Clear payment token from cookies on any event
                document.cookie =
                  "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

                // Handle APP_CLOSED event
                if (eventName === "APP_CLOSED") {
                  setPaymentStatus("Redirecting back...");
                  setIsRedirecting(true);

                  // Redirect back after a short delay
                  setTimeout(() => {
                    router.back();
                  }, 2000);
                }
              },
            },
          };

          // Wait for Paytm to be available
          if (window.Paytm && window.Paytm.CheckoutJS) {
            window.Paytm.CheckoutJS.onLoad(function () {
              window.Paytm?.CheckoutJS?.init(config)
                .then(() => {
                  window.Paytm?.CheckoutJS?.invoke();
                })
                .catch((error: any) => {
                  console.error("Paytm init error:", error);
                  setPaymentStatus(
                    "Payment initialization failed. Please try again."
                  );
                  // Clear payment token on error
                  document.cookie =
                    "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                });
            });
          } else {
            console.error("Paytm CheckoutJS not available");
            setPaymentStatus(
              "Payment service not available. Please try again."
            );
          }
        } catch (error) {
          console.error("Error in Paytm script onload:", error);
          setPaymentStatus("Payment error occurred. Please try again.");
          // Clear payment token on error
          document.cookie =
            "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      };

      script.onerror = () => {
        console.error("Failed to load Paytm script");
        setPaymentStatus("Failed to load payment service. Please try again.");
        // Clear payment token on script load error
        document.cookie =
          "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      };

      document.body.appendChild(script);
    }
  }, [orderIdToBeUsed, router]);

  // Cleanup function to clear payment token when component unmounts
  useEffect(() => {
    return () => {
      // Clear payment token when component unmounts
      document.cookie =
        "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
      <div className="text-center bg-white rounded-3xl p-8 shadow-[0_0_20px_4px_rgba(0,0,0,0.1)] border border-gray-200 max-w-md mx-4">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F77124] mx-auto mb-6"></div>
        </div>
        <h1 className="text-2xl font-bold text-[#2B1508] mb-4 font-coolvetica">
          {paymentStatus}
        </h1>
        {isRedirecting && (
          <div className="bg-gradient-to-r from-[#F77124] to-[#E65A1A] rounded-2xl p-4">
            <p className="text-white text-sm font-semibold">
              You will be redirected shortly...
            </p>
          </div>
        )}
        {/* Paytm Checkout Container */}
        <div id="paytm-checkout-container" className="hidden"></div>
      </div>
    </div>
  );
};

const PaymentRedirectPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
          <div className="text-center bg-white rounded-3xl p-8 shadow-[0_0_20px_4px_rgba(0,0,0,0.1)] border border-gray-200 max-w-md mx-4">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F77124] mx-auto mb-6"></div>
            </div>
            <h1 className="text-2xl font-bold text-[#2B1508] mb-4 font-coolvetica">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <PaymentRedirectContent />
    </Suspense>
  );
};

export default PaymentRedirectPage;
