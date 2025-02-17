import type { NextConfig } from 'next';

const repositoryBase = process.env.NODE_ENV === 'production' ? '/Lupin/' : '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  assetPrefix: repositoryBase,
  basePath: repositoryBase,
  output: 'export'
};

export default nextConfig;
