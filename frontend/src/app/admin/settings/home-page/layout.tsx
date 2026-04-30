import type { ReactNode } from "react";
import { HomePageSettingsProvider } from "./HomePageSettingsContext";
import HomePageSettingsShell from "./components/HomePageSettingsShell";

export default function HomePageSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <HomePageSettingsProvider>
      <HomePageSettingsShell>{children}</HomePageSettingsShell>
    </HomePageSettingsProvider>
  );
}
