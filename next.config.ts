import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint isn't set up yet; re-enable once it is.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
