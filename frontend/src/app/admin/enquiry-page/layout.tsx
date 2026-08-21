import type { ReactNode } from "react";
import { EnquirySettingsProvider } from "./EnquirySettingsContext";
import EnquirySettingsShell from "./components/EnquirySettingsShell";

export default function EnquiryPageSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <EnquirySettingsProvider>
      <EnquirySettingsShell>{children}</EnquirySettingsShell>
    </EnquirySettingsProvider>
  );
}
