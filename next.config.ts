// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Build tetap sukses walau ada lint error
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
