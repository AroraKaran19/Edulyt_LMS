import React from "react";

export const metadata = {
  title: "Choose a New Password | Airkrit",
  description: "Set a new password for your Airkrit account",
  robots: { index: false, follow: false },
};

const ResetPasswordLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="reset-password-page h-full lg:h-auto w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      {children}
    </div>
  );
};

export default ResetPasswordLayout;
