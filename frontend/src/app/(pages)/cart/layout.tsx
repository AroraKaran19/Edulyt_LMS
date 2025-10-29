import React from "react";
import AuthGuard from "@/app/providers/AuthGuard";

const CartLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard requiredUserType={["student"]} fallbackPath="/login">
      {children}
    </AuthGuard>
  );
};

export default CartLayout;
