import React from "react";

export const metadata = {
  title: "Create Your Airkrit Account | Airkrit",
  description:
    "Create a new Airkrit account to start exploring educational courses",
  keywords: ["sign up", "airkrit", "education", "courses", "learning"],
};

const RegisterLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="register-page h-full min-h-0 lg:min-h-[unset] overflow-y-auto lg:overflow-visible w-full lg:max-w-3xl flex flex-col gap-4 px-8 my-auto justify-center items-center lg:items-start lg:justify-start">
      {children}
    </div>
  );
};

export default RegisterLayout;
