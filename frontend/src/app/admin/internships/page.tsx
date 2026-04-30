import { redirect } from "next/navigation";

/** Default /admin/internships → main internship admin hub */
export default function AdminInternshipsPage() {
  redirect("/admin/internships/manage-internships");
}
