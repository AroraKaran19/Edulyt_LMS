import "@/app/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import LayoutWrapper from "@/app/LayoutWrapper";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import Head from "next/head";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Airkrit India",
  description: "Educational platform for learning and growth",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/"
      : "http://localhost:3000"
  ),
  openGraph: {
    title: "Airkrit India",
    description: "Educational platform for learning and growth",
    url: "https://www.airkrit.com/",
    siteName: "Airkrit India",
    type: "website",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Airkrit India",
    description: "Educational platform for learning and growth",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body
        className={cn(plusJakartaSans.className, "antialiased")}
        suppressHydrationWarning
      >
        <LayoutWrapper>{children}</LayoutWrapper>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={true}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="light"
          className="toast-container"
          limit={2}
          style={{ zIndex: 99999 }}
        />
      </body>
    </html>
  );
}
