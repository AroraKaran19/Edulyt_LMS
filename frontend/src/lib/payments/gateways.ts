import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ActiveGateway } from "@/types/order";

/**
 * Memoized as a promise, not a value: pages like the internships dashboard render
 * many launcher cards at once, and each mounting its own request would be an
 * N-per-page fetch. Concurrent callers share the first in-flight request.
 */
let inFlight: Promise<ActiveGateway[]> | null = null;

export const fetchActiveGateways = (): Promise<ActiveGateway[]> => {
  if (!inFlight) {
    inFlight = apiClient
      .get(ENDPOINTS.payments.gateways)
      .then((res) => (res.data?.data?.gateways ?? []) as ActiveGateway[])
      .catch(() => {
        // Let the next caller retry rather than caching a failure forever.
        inFlight = null;
        // Empty list => useCheckout proceeds with no explicit gateway and the
        // backend's resolveGateway picks the first enabled one.
        return [];
      });
  }
  return inFlight;
};

/** Test/debug hook — drops the memo so a later call refetches. */
export const resetGatewayCache = () => {
  inFlight = null;
};
