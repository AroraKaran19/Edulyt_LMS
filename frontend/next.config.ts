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
      // Courses → Programs route migration. Keeps old URLs/bookmarks working
      // and catches any internal link still pointing at /courses.
      {
        source: "/courses",
        destination: "/programs",
        permanent: true,
      },
      {
        source: "/courses/:path*",
        destination: "/programs/:path*",
        permanent: true,
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
