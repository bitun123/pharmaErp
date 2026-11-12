// Next.js is used as a front end only (ARCHITECTURE 5). A static export forbids route
// handlers, server actions and any server runtime, so no backend logic can live here.
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  transpilePackages: ["@pharma/ui"],
  images: { unoptimized: true },
};

export default nextConfig;
