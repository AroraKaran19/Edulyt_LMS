// app/layout.tsx
import type { Metadata } from "next";
import "@/app/globals.css";
import { ReduxProvider } from "@/store/Provider";
import LayoutWrapper from "@/components/shared/LayoutWrapper";

export const metadata: Metadata = {
  title: "Edulyt India",
  description: "Educational platform for learning and growth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
}
