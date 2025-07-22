import { redirect } from "next/navigation";

const AdminCoursesPage = () => {
  redirect("/admin/courses/manage-courses");
};

export default AdminCoursesPage;
