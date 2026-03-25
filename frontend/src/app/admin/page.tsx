"use client";
import SuperAdminDashboard from "@/components/admin/dashboard/SuperAdminDashboard";
import useAuth from "@/hooks/useAuth";

const AdminPage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <SuperAdminDashboard
        variant={user.userType === "super-admin" ? "super-admin" : "admin"}
      />
    </div>
  );
};

export default AdminPage;
