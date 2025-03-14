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
        ],
    },
};

export default nextConfig;
