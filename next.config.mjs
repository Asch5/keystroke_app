/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors in build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Image configuration
  images: {
    domains: ['images.pexels.com'],
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
  // Experimental features
  experimental: {
    ppr: 'incremental',
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
