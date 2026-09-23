import type { ReactNode } from "react";
import { CaSettingsProvider } from "./CaSettingsContext";
import CaSettingsShell from "./components/CaSettingsShell";

export default function CaPageSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CaSettingsProvider>
      <CaSettingsShell>{children}</CaSettingsShell>
    </CaSettingsProvider>
  );
}
