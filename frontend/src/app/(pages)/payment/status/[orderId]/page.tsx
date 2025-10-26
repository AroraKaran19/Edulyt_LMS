"use client";
import axios from "axios";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Error from "@/components/ui/Error";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

const checkPaymentStatus = async (orderId: string) => {
  try {
    const checkOrderStatus = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/status/${orderId}`
    );
    if (checkOrderStatus.status === 200 || checkOrderStatus.status === 304) {
      return checkOrderStatus.data;
    } else {
      return null;
    }
  } catch {
    console.error("Error checking payment status!");
    return null;
  }
};

const verifyToken = async (token: string) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/verify-token/${token}`
    );
    if (response.status === 200) {
      return response.data.decoded;
    } else {
      return null;
    }
  } catch {
    console.error("Token verification failed!");
    return null;
  }
};

// Reusable Status Card Component
interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  variant?: "success" | "error" | "warning" | "info";
}

const StatusCard: React.FC<StatusCardProps> = ({
  icon,
  title,
  description,
  children,
  variant = "info",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-600";
      case "error":
        return "bg-red-100 text-red-600";
      case "warning":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-md mx-auto">
        {/* Icon */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 ${getVariantStyles()} rounded-full flex items-center justify-center`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-2 text-center w-full">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 px-2">
            {title}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base px-2">
            {description}
          </p>
        </div>

        {/* Children (Payment Details, Buttons, etc.) */}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

// Payment Details Component
interface PaymentDetailsProps {
  orderId: string;
  amount: number;
  createdAt: Date;
  txnId: string;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  orderId,
  amount,
  createdAt,
  txnId,
}) => {
  return (
    <div className="w-full bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
        <span className="text-gray-600 text-sm font-medium">Order ID:</span>
        <span className="font-medium text-sm break-all">{orderId}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
        <span className="text-gray-600 text-sm font-medium">Amount:</span>
        <span className="font-medium text-sm">₹{amount}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
        <span className="text-gray-600 text-sm font-medium">
          Transaction ID:
        </span>
        <span className="font-medium text-sm break-all font-mono">{txnId}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
        <span className="text-gray-600 text-sm font-medium">Date:</span>
        <span className="font-medium text-sm">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

// Loading Component
const PaymentLoadingScreen = ({ pollingCount }: { pollingCount: number }) => {
  const dots = ".".repeat((pollingCount % 4) + 1);
  const isLongPolling = pollingCount > 30;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 sm:gap-6 max-w-md w-full">
        {/* Spinner */}
        <div className="relative">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 animate-spin" />
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 px-2">
            Processing Payment
          </h2>
          <p className="text-gray-600 text-sm sm:text-base px-2">
            Please wait while we verify your payment status{dots}
          </p>
          <p className="text-sm text-gray-500 px-2">
            This may take a few moments
          </p>
          {isLongPolling && (
            <p className="text-sm text-orange-600 font-medium px-2">
              Taking longer than usual... Please don&apos;t close this page
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-48 sm:w-64 bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${Math.min((pollingCount / 20) * 100, 90)}%` }}
          ></div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span>Checking payment status...</span>
        </div>
      </div>
    </div>
  );
};

// Token Validation Loading Component
const TokenValidationScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 sm:gap-6 max-w-md w-full">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 animate-spin" />
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 px-2">
            Validating Payment Token
          </h2>
          <p className="text-gray-600 text-sm sm:text-base px-2">
            Please wait while we verify your payment token
          </p>
          <p className="text-sm text-gray-500 px-2">
            This ensures your payment is secure
          </p>
        </div>
      </div>
    </div>
  );
};

// Success Component
const PaymentSuccess = ({
  data,
}: {
  data: {
    status: string;
    orderId: string;
    createdAt: Date;
    amount: number;
    txnId: string;
  };
}) => {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate useEffect for navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/dashboard");
    }
  }, [countdown, router]);

  return (
    <StatusCard
      icon={<CheckCircle className="w-10 h-10" />}
      title="Payment Successful!"
      description="Your payment has been processed successfully"
      variant="success"
    >
      <p className="text-sm text-orange-600 font-medium">
        Redirecting to dashboard in {countdown} seconds...
      </p>

      <PaymentDetails
        orderId={data.orderId}
        amount={data.amount}
        createdAt={data.createdAt}
        txnId={data.txnId}
      />

      <OrangeButton
        className="w-full"
        onClick={() => router.push("/dashboard")}
      >
        Continue to Dashboard Now
      </OrangeButton>
    </StatusCard>
  );
};

// Failed Component
const PaymentFailed = ({
  data,
}: {
  data: {
    status: string;
    orderId: string;
    createdAt: Date;
    amount: number;
    txnId: string;
  };
}) => {
  const router = useRouter();

  return (
    <StatusCard
      icon={<XCircle className="w-10 h-10" />}
      title="Payment Failed"
      description="Your payment could not be processed"
      variant="error"
    >
      <PaymentDetails
        orderId={data.orderId}
        amount={data.amount}
        createdAt={data.createdAt}
        txnId={data.txnId}
      />

      <div className="flex flex-col w-full gap-3">
        <OrangeButton
          className="w-full"
          onClick={() => router.push("/courses")}
        >
          Browse Courses
        </OrangeButton>
        <WhiteButton className="w-full" onClick={() => router.push("/contact")}>
          Contact Support
        </WhiteButton>
      </div>
    </StatusCard>
  );
};

// Pending Component
const PaymentPending = ({
  data,
  onRefresh,
}: {
  data: {
    status: string;
    orderId: string;
    createdAt: Date;
    amount: number;
    txnId: string;
  } | null;
  onRefresh: () => void;
}) => {
  return (
    <StatusCard
      icon={<Clock className="w-10 h-10" />}
      title="Payment Pending"
      description="Your payment is being processed. This may take a few minutes."
      variant="warning"
    >
      {data && (
        <PaymentDetails
          orderId={data.orderId}
          amount={data.amount}
          createdAt={data.createdAt}
          txnId={data.txnId}
        />
      )}

      <OrangeButton className="w-full" onClick={onRefresh}>
        Refresh Status
      </OrangeButton>
    </StatusCard>
  );
};

// Invalid Token Component
const InvalidTokenScreen = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate useEffect for navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/");
    }
  }, [countdown, router]);

  return (
    <StatusCard
      icon={<AlertCircle className="w-10 h-10" />}
      title="Invalid Payment Token"
      description="The payment token is invalid or has expired. Please try again or contact support if the issue persists."
      variant="error"
    >
      <p className="text-sm text-red-600 font-medium">
        Redirecting to home page in {countdown} seconds...
      </p>

      <div className="flex flex-col w-full gap-3">
        <WhiteButton className="w-full" onClick={() => router.push("/contact")}>
          Contact Support
        </WhiteButton>
      </div>
    </StatusCard>
  );
};

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [tokenValidating, setTokenValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    status: string;
    orderId: string;
    createdAt: Date;
    amount: number;
    txnId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  const restartPolling = () => {
    setLoading(true);
    setError(null);
    setPollingCount(0);
    setPaymentData(null);
  };

  // Instant redirect if no token
  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }
  }, [token, router]);

  // Token validation effect (only runs if token exists)
  useEffect(() => {
    if (!token) return; // Skip if no token (will redirect above)

    const validateToken = async () => {
      setTokenValidating(true);

      try {
        const decoded = await verifyToken(token);
        if (decoded && decoded.orderId === orderId) {
          setTokenValid(true);
        } else {
          // Show invalid token screen instead of redirecting
          setTokenValid(false);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        // Show invalid token screen instead of redirecting
        setTokenValid(false);
      } finally {
        setTokenValidating(false);
      }
    };

    validateToken();
  }, [token, orderId, router]);

  // Payment status polling effect (only runs after token validation)
  useEffect(() => {
    if (!tokenValid || tokenValidating) return;

    let timeoutId: NodeJS.Timeout;

    const fetchPaymentStatus = async () => {
      try {
        setError(null);
        const data = await checkPaymentStatus(orderId as string);

        if (data) {
          setPaymentData(data);

          // If payment is still pending, continue polling
          if (data.status === "pending" || data.status === "processing") {
            // Poll every 3 seconds for up to 5 minutes (100 attempts)
            if (pollingCount < 100) {
              timeoutId = setTimeout(() => {
                setPollingCount((prev) => prev + 1);
              }, 3000);
            } else {
              // Stop polling after 5 minutes and show timeout
              setLoading(false);
              setError("Payment verification timeout. Please contact support.");
            }
          } else {
            // Payment completed (success or failed), stop polling
            setLoading(false);
          }
        } else {
          setPaymentData(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching payment status:", err);

        // If it's a network error, retry after 5 seconds
        if (pollingCount < 20) {
          timeoutId = setTimeout(() => {
            setPollingCount((prev) => prev + 1);
          }, 5000);
        } else {
          setError("Failed to fetch payment status. Please try again.");
          setLoading(false);
        }
      }
    };

    fetchPaymentStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId, pollingCount, tokenValid, tokenValidating]);

  // Don't render anything if no token (redirect will happen)
  if (!token) {
    return null;
  }

  // Show token validation loading
  if (tokenValidating) {
    return <TokenValidationScreen />;
  }

  // Show invalid token screen if token is invalid
  if (!tokenValid) {
    return <InvalidTokenScreen />;
  }

  // Show payment loading screen
  if (loading) {
    return <PaymentLoadingScreen pollingCount={pollingCount} />;
  }

  // Show error state
  if (error) {
    return (
      <Error
        icon={AlertCircle}
        title="Error"
        description={error}
        showAction={true}
        actionText="Try Again"
        onActionClick={restartPolling}
        containerHeight="min-h-screen"
        className="bg-gray-50"
      />
    );
  }

  // Show payment status based on data
  if (paymentData) {
    switch (paymentData.status) {
      case "success":
        return <PaymentSuccess data={paymentData} />;
      case "failed":
        return <PaymentFailed data={paymentData} />;
      case "pending":
        return <PaymentPending data={paymentData} onRefresh={restartPolling} />;
      default:
        return <PaymentPending data={paymentData} onRefresh={restartPolling} />;
    }
  }

  // Fallback
  return (
    <Error
      icon={AlertCircle}
      title="No Payment Data"
      description="Unable to load payment information"
      containerHeight="min-h-screen"
      className="bg-gray-50"
    />
  );
};

export default OrderStatusPage;
