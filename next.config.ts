import type { NextConfig } from "next";

const isCI = process.env.CI === 'true';

const nextConfig: NextConfig = {
  basePath: isCI ? '' : '/furinakit',
  assetPrefix: isCI ? '' : '/furinakit',
  allowedDevOrigins: ['8.130.38.139'],
};

export default nextConfig;
