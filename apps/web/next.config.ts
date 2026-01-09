import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
  // Fix COOP issues with OAuth popups + cache headers for static assets
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
      // Cache static assets for 30 days (images, logos, etc. may be updated)
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      // Cache Next.js static chunks
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images for 30 days
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
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

// Compose config with plugins (bundle analyzer wraps next-intl)
export default withBundleAnalyzer(withNextIntl(nextConfig));
