import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors in build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Comprehensive image configuration for authentication and optimization
  images: {
    // Configure image domains and patterns (consolidated from both configs)
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
      {
        protocol: 'https',
        hostname: 'static.ordnet.dk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Image optimization settings
    unoptimized: false,
    loader: 'default',
    minimumCacheTTL: 86400, // 24 hours
  },

  // Enable verbose logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Add trailing slash for consistent routing
  trailingSlash: false,

  // Add headers to handle image requests properly
  async headers() {
    return [
      {
        source: '/api/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
        ],
      },
    ];
  },

  // Add Speed Insights configuration for development environment
  async rewrites() {
    return [
      {
        source: '/_vercel/speed-insights/script.js',
        destination: '/api/mock-speed-insights-script',
      },
      {
        source: '/_vercel/speed-insights/vitals',
        destination: '/api/mock-speed-insights-vitals',
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
