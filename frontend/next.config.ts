import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/profile",
        destination: "/profile",
        permanent: false,
      },
      {
        source: "/dashboard/settings",
        destination: "/settings",
        permanent: false,
      },
    ];
  },
  images: {
    qualities: [100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
};

export default nextConfig;
