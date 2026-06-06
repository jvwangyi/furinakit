import type { NextConfig } from "next";

const isCI = process.env.CI === 'true';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: isCI ? '' : '/furinakit',
  assetPrefix: isCI ? '' : '/furinakit',
  allowedDevOrigins: ['8.130.38.139'],
  env: {
    NEXT_PUBLIC_BASE_PATH: isCI ? '' : '/furinakit',
  },
};

export default nextConfig;
