import type { NextConfig } from "next";

// The backend lives on a different domain. The browser only ever talks to this site:
// `/api/*` is forwarded to the backend below, so the session cookie belongs to this
// site and proxy.ts / Server Components can read it. Server-only (no NEXT_PUBLIC_ prefix).
const backendUrl = (process.env.BACKEND_URL ?? "").trim().replace(/\/+$/, "");
if (!backendUrl) {
  throw new Error("BACKEND_URL is not set (e.g. http://localhost:8080). The frontend cannot reach the API without it.");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  transpilePackages: ["@repo/contracts"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
