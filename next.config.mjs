/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for catching potential issues
  reactStrictMode: true,

  // Image optimization for external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "arxiv.org",
      },
    ],
  },

  // Experimental features
  experimental: {
    // Typed routes disabled as it requires all routes to be defined as types
    // Enable later once all routes are properly typed
    // typedRoutes: true,
  },

  // Exclude Convex directory from TypeScript checks during build
  // Convex has its own build process via `npx convex dev`
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    // Exclude convex from ESLint during build
    ignoreDuringBuilds: false,
    dirs: ["src"],
  },
};

export default nextConfig;
