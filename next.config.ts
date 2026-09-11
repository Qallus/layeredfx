import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the local development badge clear of mobile navigation controls.
  devIndicators: false,
};
export default nextConfig;
