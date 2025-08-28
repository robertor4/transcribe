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
  // Note: API proxying is now handled by app/api/[...path]/route.ts
  // This allows runtime resolution of Docker service names
};

export default withNextIntl(nextConfig);
