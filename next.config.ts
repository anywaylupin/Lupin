import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Lupin',
  assetPrefix: '/Lupin',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
