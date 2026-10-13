import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: process.env.HARKA_STANDALONE === "1" ? "standalone" : undefined,
};

export default nextConfig;
