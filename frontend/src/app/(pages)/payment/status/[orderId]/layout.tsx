import React from "react";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) => {
  const { orderId } = await params;
  return {
    title: `Payment Status Order ID: ${orderId} | Airkrit`,
    description: `Payment Status Order ID: ${orderId} | Airkrit`,
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
