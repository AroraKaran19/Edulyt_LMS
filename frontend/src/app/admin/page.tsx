import AdminTopHeader from "@/components/admin/AdminTopHeader";
import AdminDashboard from "@/components/admin/dashboard/AdminDashboard";
import { notFound } from "next/navigation";

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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <AdminTopHeader />
      <div className="flex-1 overflow-y-auto">
        <AdminDashboard />
      </div>
    </div>
  );
};

export default AdminPage;
