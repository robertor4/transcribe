import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withContentlayer } from 'next-contentlayer2';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow external images from Google and Firebase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.firebasestorage.app',
      },
    ],
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
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade', // Allow loading Google profile images
          },
        ],
      },
    ];
  },
  // WebSocket proxy configuration for production
  async rewrites() {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://api:3001'
      : 'http://localhost:3001';

    return [
      // Proxy socket.io WebSocket connections to the API
      {
        source: '/api/socket.io/:path*',
        destination: `${apiUrl}/socket.io/:path*`,
      },
    ];
  },
  // Note: API proxying is now handled by app/api/[...path]/route.ts
  // This allows runtime resolution of Docker service names
};

// Compose plugins: withContentlayer wraps withNextIntl which wraps nextConfig
export default withContentlayer(withNextIntl(nextConfig));
