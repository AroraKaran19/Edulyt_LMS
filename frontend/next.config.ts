import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "localhost",
      "127.0.0.1",
      "www.newdev.io",
      "www.edulyt.vercel.app",
      "edulyt.vercel.app",
      "images.unsplash.com",
      "videos.pexels.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
};

export default nextConfig;
