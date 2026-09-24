import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@carwatch/database", "@carwatch/shared", "@carwatch/notifications"],
  agentRules: false,
};

export default nextConfig;
