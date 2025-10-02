import React from "react";

interface AdminAuthLayoutProps {
  children: React.ReactNode;
}

const AdminAuthLayout: React.FC<AdminAuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F8F9FA] to-[#E9ECEF]">
      {children}
    </div>
  );
};

export default AdminAuthLayout;
