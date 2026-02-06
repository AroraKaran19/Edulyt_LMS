import React from "react";

export const metadata = {
  title: "Sign In to Your Account | Airkrit",
  description:
    "Sign in to your Airkrit account to get access to educational courses",
  keywords: ["sign in", "airkrit", "education", "courses", "learning"],
};

const LoginLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="login-page h-full min-h-0 lg:min-h-[unset] overflow-y-auto lg:overflow-visible w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      {children}
    </div>
  );
};

export default LoginLayout;
