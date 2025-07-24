import "@/app/globals.css";
// import { ReduxProvider } from "@/store/Provider";
import { Plus_Jakarta_Sans } from "next/font/google";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import { cn } from "@/lib/utils";
import { Metadata } from "next";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
      <body className={cn(plusJakartaSans.className, "antialiased")}>
        {/* <ReduxProvider> */}
          <LayoutWrapper>{children}</LayoutWrapper>
        {/* </ReduxProvider> */}
      </body>
    </html>
  );
}
