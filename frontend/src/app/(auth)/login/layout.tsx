import React from "react";

export const metadata = {
  title: "Sign In to Your Account | Airkrit",
  description:
    "Sign in to your Airkrit account to get access to educational courses",
  keywords: ["sign in", "airkrit", "education", "courses", "learning"],
};

const LoginLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="login-page h-full min-h-0 lg:min-h-[unset] overflow-y-auto lg:overflow-visible w-full max-w-lg lg:max-w-xl flex flex-col gap-4 px-8 my-auto justify-center items-center">
      {children}
    </div>
  );
};

export default LoginLayout;
