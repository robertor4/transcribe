import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix COOP issues with OAuth popups
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Allow OAuth popups
          },
        ],
      },
    ];
  },
  // Proxy API requests to NestJS backend
  async rewrites() {
    // In production, proxy to the Docker service name
    // In development, this is handled by NEXT_PUBLIC_API_URL
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://api:3001' // Docker service name
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
