import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@svg-spawn/core',
    '@svg-spawn/svg-pipeline',
    '@svg-spawn/compiler',
    '@svg-spawn/ai-client',
  ],
};

export default nextConfig;
