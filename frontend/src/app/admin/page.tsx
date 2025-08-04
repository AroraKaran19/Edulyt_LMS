import UnderDevelopment from "@/components/ui/UnderDevelopment";
import { notFound } from "next/navigation";
import React from "react";

const AdminPage = () => {
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    avatar: "https://via.placeholder.com/150",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
    lastLogin: "2021-01-01",
  };

  if (!user || user.role !== "admin") {
    return notFound();
  }

  return (
    <div className="w-full h-full flex-col gap-4 p-8">
      <UnderDevelopment className="w-full h-full flex flex-col justify-center" />
    </div>
  );
};

export default AdminPage;
