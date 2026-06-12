import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/resumos", destination: "/summaries", permanent: true },
      { source: "/api/resumos/:path*", destination: "/api/summaries/:path*", permanent: true }
    ];
  }
};

export default nextConfig;
