"use client";

import { useCallback, useRef, useState } from "react";
import GatewayPickerModal from "@/components/payments/GatewayPickerModal";
import { fetchActiveGateways } from "@/lib/payments/gateways";
import { launchCheckout } from "@/lib/payments/launchCheckout";
import type { ActiveGateway, CheckoutOrder, GatewayName } from "@/types/order";

type CreateOrder = (gateway?: GatewayName) => Promise<CheckoutOrder>;

/**
 * One checkout flow for all six payment entry points:
 * resolve gateway (picker only when there's an actual choice) → create the order
 * with it → open that gateway's checkout.
 *
 * The caller supplies `createOrder` because every site creates orders differently
 * (coupons, quantity, referral codes, prior enrollment calls).
 */
export const useCheckout = () => {
  const [gateways, setGateways] = useState<ActiveGateway[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const pendingCreate = useRef<CreateOrder | null>(null);

  const run = useCallback(
    async (createOrder: CreateOrder, gateway?: GatewayName) => {
      setIsBusy(true);
      try {
        const order = await createOrder(gateway);

        // Free orders settle server-side and never touch a gateway.
        if (order.freeOrder && order.token) {
          window.location.href = `/payment/status/${order._id}?token=${order.token}`;
          return;
        }

        await launchCheckout(order);
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const start = useCallback(
    async (createOrder: CreateOrder) => {
      const active = await fetchActiveGateways();

      // Fewer than two options means there is nothing to choose. This is what
      // keeps today's Paytm-only checkout byte-for-byte unchanged.
      if (active.length < 2) {
        await run(createOrder, active[0]?.name);
        return;
      }

      setGateways(active);
      pendingCreate.current = createOrder;
      setPickerOpen(true);
    },
    [run],
  );

  const handleSelect = useCallback(
    async (gateway: GatewayName) => {
      const createOrder = pendingCreate.current;
      pendingCreate.current = null;
      setPickerOpen(false);
      if (createOrder) await run(createOrder, gateway);
    },
    [run],
  );

  const handleClose = useCallback(() => {
    pendingCreate.current = null;
    setPickerOpen(false);
  }, []);

  const picker = (
    <GatewayPickerModal
      open={pickerOpen}
      gateways={gateways}
      onSelect={handleSelect}
      onClose={handleClose}
    />
  );

  return { start, picker, isBusy };
};
