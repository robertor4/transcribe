import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Only use standalone output for production Docker builds
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' as const }),
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
    const isProd = process.env.NODE_ENV === 'production';

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
      // Cache headers only in production - disable for easier local debugging
      ...(isProd ? [
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
      ] : []),
    ];
  },
  // WebSocket proxy configuration for production only
  // In dev, Socket.io connects directly to localhost:3001 (no proxy needed)
  // Proxying in dev causes Socket.io ping frames to leak into Next.js HMR websocket
  async rewrites() {
    // Firebase Auth proxy works in all environments so custom authDomain shows on Google OAuth
    const firebaseAuthRewrite = {
      source: '/__/auth/:path*',
      destination: 'https://transcribe-52b6f.firebaseapp.com/__/auth/:path*',
    };

    if (process.env.NODE_ENV !== 'production') return [firebaseAuthRewrite];

    return [
      firebaseAuthRewrite,
      // Proxy socket.io WebSocket connections to the API (Docker networking)
      {
        source: '/api/socket.io/:path*',
        destination: 'http://api:3001/socket.io/:path*',
      },
    ];
  },
  // Note: API proxying is now handled by app/api/[...path]/route.ts
  // This allows runtime resolution of Docker service names
};

// Compose config with plugins (bundle analyzer wraps next-intl)
export default withBundleAnalyzer(withNextIntl(nextConfig));
