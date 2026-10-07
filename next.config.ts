import type { NextConfig } from "next";

// NOTE: /api/* proxying is handled at runtime by middleware.ts (works on
// Cloudflare Workers where build-time env is unavailable). Do NOT add
// rewrites() here — it bakes API_BACKEND_URL at build time and conflicts
// with the middleware proxy.
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
};

export default nextConfig;