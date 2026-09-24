import localFont from "next/font/local";

export const caDisplayFont = localFont({
  src: [
    { path: "./CabinetGrotesk-500.woff2", weight: "500" },
    { path: "./CabinetGrotesk-700.woff2", weight: "700" },
    { path: "./CabinetGrotesk-800.woff2", weight: "800" },
  ],
  variable: "--font-ca-display",
  display: "swap",
});

export const caBodyFont = localFont({
  src: [
    { path: "./Switzer-400.woff2", weight: "400" },
    { path: "./Switzer-500.woff2", weight: "500" },
    { path: "./Switzer-600.woff2", weight: "600" },
    { path: "./Switzer-700.woff2", weight: "700" },
  ],
  variable: "--font-ca-body",
  display: "swap",
});
