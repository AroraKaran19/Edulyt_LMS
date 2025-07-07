import type { Metadata } from "next";
import "@/app/globals.css";
import Navbar from "@/components/shared/Navbar/Navbar";
import Footer from "@/components/shared/Footer/Footer";
import { ReduxProvider } from "@/store/Provider";

export const metadata: Metadata = {
  title: "Edulyt India",
  description: "Educational platform for learning and growth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>
          <Navbar />
          <main className="flex min-h-screen flex-col pt-[78px] relative overflow-hidden">
            {children}
          </main>
          <Footer />
        </ReduxProvider>
      </body>
    </html>
  );
}
