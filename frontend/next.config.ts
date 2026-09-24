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
      // Already-shared referral links keep working; the ?ref query is carried over.
      {
        source: "/campus-ambassador",
        destination: "/digital-marketing-internship",
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
