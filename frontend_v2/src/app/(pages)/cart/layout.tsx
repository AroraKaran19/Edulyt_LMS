import React from "react";
import AuthGuard from "@/app/providers/AuthGuard";

const CartLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard fallbackPath="/login">
      {children}
    </AuthGuard>
  );
};

export default CartLayout;
