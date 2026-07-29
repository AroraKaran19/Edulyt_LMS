import { redirect } from "next/navigation";

/** Default /admin/courses/course-internships → the programs list */
export default function AdminCourseInternshipsPage() {
  redirect("/admin/courses/course-internships/manage");
}
