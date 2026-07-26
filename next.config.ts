import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { typedEnv: true },
  allowedDevOrigins: ["192.168.1.12"],
};

export default nextConfig;
