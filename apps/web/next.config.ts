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
    // Use environment variable for API URL
    // In production Docker, this should be set to http://api:3001
    // In development, this defaults to localhost
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log('Next.js rewrites configured with API URL:', apiUrl);
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
