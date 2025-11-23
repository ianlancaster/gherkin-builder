import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // reactCompiler is now a top-level option or handled via babel plugin presence
  },
  // reactCompiler is now a top-level option or handled via babel plugin presence
  reactCompiler: true,
};

export default nextConfig;
