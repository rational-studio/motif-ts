import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@motif-ts/core', '@motif-ts/react', '@motif-ts/middleware'],
  reactCompiler: true,
};

export default nextConfig;
