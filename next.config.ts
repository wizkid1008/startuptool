import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // CI runs `eslint .` as its own step. `next build` otherwise invokes the
    // legacy Next lint integration a second time, which is duplicated work and
    // couples a style check to whether the app is deployable.
    ignoreDuringBuilds: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
