import { redirect } from "next/navigation";
import { ENQUIRY_SECTIONS } from "./sections";

export default function EnquiryPageSettingsIndex() {
  redirect(`/admin/enquiry-page/${ENQUIRY_SECTIONS[0].slug}`);
}
