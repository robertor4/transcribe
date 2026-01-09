import { ReactNode } from 'react';
import { Geist, Montserrat } from 'next/font/google';
import "./globals.css";
import { ThemeColor } from "@/components/ThemeColor";

// Dual-font system: Geist for body text, Montserrat for headings
// Using next/font for zero-latency font loading (self-hosted, no external requests)
const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
  weight: ['400', '500', '600', '700'], // Only weights we actually use
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['500', '600', '700', '800'], // For headings
});

type Props = {
  children: ReactNode;
};

// Inline script to apply theme before React hydration (prevents flash)
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'system';
    var isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

// Root layout required for error pages (404, 500, etc.)
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${montserrat.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeColor />
      </head>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}