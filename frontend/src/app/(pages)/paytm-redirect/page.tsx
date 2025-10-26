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
    // Early check for payment token before loading Paytm script
    const paymentToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("paymentToken="))
      ?.split("=")[1];

    if (!paymentToken) {
      console.error("Payment token not found in cookies");
      setPaymentStatus("Payment token not found. Redirecting back...");
      setIsRedirecting(true);

      // Redirect back after a short delay
      setTimeout(() => {
        router.back();
      }, 2000);
      return;
    }

    if (orderIdToBeUsed) {
      // Load Paytm CheckoutJS script dynamically
      const script = document.createElement("script");
      script.src = `https://secure.paytmpayments.com/merchantpgpui/checkoutjs/merchants/${process.env.NEXT_PUBLIC_PAYTM_MID}.js`;
      script.crossOrigin = "anonymous";
      script.type = "application/javascript";

      script.onload = async () => {
        try {
          // get token from cookies "paymentToken" (already checked above, but keeping for safety)
          const paymentToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("paymentToken="))
            ?.split("=")[1];

          // Validate required data
          if (!paymentToken || !orderIdToBeUsed) {
            console.error("Payment token or order ID not found");
            setPaymentStatus("Required data not found. Redirecting back...");
            setIsRedirecting(true);

            // Redirect back after a short delay
            setTimeout(() => {
              router.back();
            }, 2000);
            return;
          }

          // Validate Paytm MID environment variable
          const paytmMid = process.env.NEXT_PUBLIC_PAYTM_MID;
          if (!paytmMid) {
            console.error("Paytm MID not configured");
            setPaymentStatus(
              "Payment configuration error. Redirecting back..."
            );
            setIsRedirecting(true);

            setTimeout(() => {
              router.back();
            }, 2000);
            return;
          }

          // Validate token format (should be a string and not empty)
          if (typeof paymentToken !== "string" || paymentToken.trim() === "") {
            console.error("Invalid payment token format");
            setPaymentStatus("Invalid payment token. Redirecting back...");
            setIsRedirecting(true);

            setTimeout(() => {
              router.back();
            }, 2000);
            return;
          }

          // Validate orderId format
          if (
            typeof orderIdToBeUsed !== "string" ||
            orderIdToBeUsed.trim() === ""
          ) {
            console.error("Invalid order ID format");
            setPaymentStatus("Invalid order ID. Redirecting back...");
            setIsRedirecting(true);

            setTimeout(() => {
              router.back();
            }, 2000);
            return;
          }

          console.log("Paytm configuration data:", {
            orderId: orderIdToBeUsed,
            tokenLength: paymentToken.length,
            tokenType: "TXN_TOKEN",
            paytmMid: paytmMid,
          });

          const config = {
            flow: "DEFAULT",
            data: {
              orderId: orderIdToBeUsed,
              token: paymentToken,
              tokenType: "TXN_TOKEN",
              amount: "1",
            },
            handler: {
              notifyMerchant: function (eventName: string, data: any) {
                console.log("Paytm event:", eventName, "Data:", data);

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

          // Initialize Paytm CheckoutJS
          if (window.Paytm && window.Paytm.CheckoutJS) {
            try {
              window.Paytm.CheckoutJS.onLoad(function () {
                console.log("Paytm CheckoutJS loaded, initializing...");

                window.Paytm?.CheckoutJS?.init(config)
                  .then(() => {
                    console.log("Paytm CheckoutJS initialized successfully");
                    window.Paytm?.CheckoutJS?.invoke();
                    // Clear payment token from cookies after successful initialization
                    document.cookie =
                      "paymentToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  })
                  .catch((error: any) => {
                    console.error("Paytm init error:", error);
                    console.error("Error details:", {
                      message: error.message,
                      stack: error.stack,
                      config: config,
                    });
                    setPaymentStatus(
                      "Payment initialization failed. Redirecting back..."
                    );
                    setIsRedirecting(true);

                    setTimeout(() => {
                      router.back();
                    }, 2000);
                  });
              });
            } catch (error) {
              console.error("Error setting up Paytm onLoad:", error);
              setPaymentStatus("Payment setup failed. Redirecting back...");
              setIsRedirecting(true);

              setTimeout(() => {
                router.back();
              }, 2000);
            }
          } else {
            console.error("Paytm CheckoutJS not available");
            console.error("Window.Paytm:", window.Paytm);
            setPaymentStatus(
              "Payment service not available. Redirecting back..."
            );
            setIsRedirecting(true);

            setTimeout(() => {
              router.back();
            }, 2000);
          }
        } catch (error) {
          console.error("Error in Paytm script onload:", error);
          console.error("Error details:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          });
          setPaymentStatus("Payment error occurred. Redirecting back...");
          setIsRedirecting(true);

          setTimeout(() => {
            router.back();
          }, 2000);
        }
      };

      script.onerror = () => {
        console.error("Failed to load Paytm script");
        console.error("Script URL:", script.src);
        setPaymentStatus("Failed to load payment service. Redirecting back...");
        setIsRedirecting(true);

        setTimeout(() => {
          router.back();
        }, 2000);
      };

      document.body.appendChild(script);
    }
  }, [orderIdToBeUsed, router]);

  // Cleanup function to clear payment token when component unmounts
  useEffect(() => {
    return () => {};
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
          <div className="bg-linear-to-r from-[#F77124] to-[#E65A1A] rounded-2xl p-4">
            <p className="text-white text-sm font-semibold">
              You will be redirected shortly...
            </p>
          </div>
        )}
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
