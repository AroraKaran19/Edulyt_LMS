import React from "react";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) => {
  const { orderId } = await params;
  return {
    title: `Payment Status Order ID: ${orderId} | Edulyt`,
    description: `Payment Status Order ID: ${orderId} | Edulyt`,
  };
};

const OrderStatusPageLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return children;
};

export default OrderStatusPageLayout;
