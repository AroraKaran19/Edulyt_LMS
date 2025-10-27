import React from "react";

export const metadata = {
  title: "Reset Password | Airkrit",
  description:
    "Reset your Airkrit account password",
  keywords: ["forgot password", "reset password", "airkrit", "education", "courses"],
};

const ForgotPasswordLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="forgot-password-page h-full lg:h-auto w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      {children}
    </div>
  );
};

export default ForgotPasswordLayout;

