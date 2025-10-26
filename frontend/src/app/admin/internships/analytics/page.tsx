import AdminTopHeader from "@/components/admin/AdminTopHeader";
import InternshipsAnalytics from "@/components/admin/internships/InternshipsAnalytics";

const page = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <AdminTopHeader />
      <div className="flex-1 overflow-y-auto">
        <InternshipsAnalytics />
      </div>
    </div>
  );
};

export default page;
