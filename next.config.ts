import type { NextConfig } from "next";

const API_TARGET = process.env.API_BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  // Skip ESLint in production builds (run `yarn lint` in CI separately).
  // This saves 1-3 min on Cloudflare Pages.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep type-checking enabled for safety. If builds are still slow,
  // you can set ignoreBuildErrors: true and type-check in CI instead.
  // Cache handler + heavy barrel imports optimization:
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "react-hook-form",
      "@reduxjs/toolkit",
      "react-redux",
      "zod",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;