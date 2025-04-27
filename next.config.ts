/** @type {import('next').NextConfig} */

import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    ppr: 'incremental',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Enable verbose logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Add trailing slash for consistent routing
  trailingSlash: false,
};

export default nextConfig;
