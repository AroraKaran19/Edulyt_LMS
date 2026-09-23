import { redirect } from "next/navigation";
import { CA_SECTIONS } from "./sections";

export default function CaPageSettingsIndex() {
  redirect(`/admin/ca-page/${CA_SECTIONS[0].slug}`);
}
