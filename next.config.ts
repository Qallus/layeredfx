import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the local development badge clear of mobile navigation controls.
  devIndicators: false,
  // The connect-an-app consent screen must never be framed (clickjacking an approval). Its referrer policy must
  // allow same-origin referrers: under no-referrer, browsers send `Origin: null` with the Allow form and it is refused.
  async headers() {
    return [{source: '/oauth/:path*', headers: [{key: 'X-Frame-Options', value: 'DENY'}, {key: 'Content-Security-Policy', value: "frame-ancestors 'none'"}, {key: 'Referrer-Policy', value: 'same-origin'}]}];
  },
};
export default nextConfig;
