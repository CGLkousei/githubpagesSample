import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/githubpagesSample',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
