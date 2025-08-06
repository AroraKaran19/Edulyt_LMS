import AdminTopHeader from "@/components/admin/AdminTopHeader";
import Analytics from "@/components/admin/courses/Analytics";
import React from "react";

const AdminCourseAnalytics = () => {
  return (
    <div className="w-full h-full flex-col gap-4">
      <AdminTopHeader />
      <Analytics />
    </div>
  );
};

export default AdminCourseAnalytics;
