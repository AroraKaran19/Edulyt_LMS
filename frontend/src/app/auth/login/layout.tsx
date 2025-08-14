import React from "react";

export const metadata = {
  title: "Sign In to Your Account | Edulyt",
  description:
    "Sign in to your Edulyt account to get access to educational courses",
  keywords: ["sign in", "edulyt", "education", "courses", "learning"],
};

const LoginLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="login-page h-full lg:h-auto w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      {children}
    </div>
  );
};

export default LoginLayout;
