import { ReactNode } from 'react';
import { Geist, Montserrat, Merriweather, DM_Mono } from 'next/font/google';
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

// Landing page fonts: Merriweather for serif headings, DM Mono for monospace accents
const merriweather = Merriweather({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-mono',
  weight: ['400', '500'],
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
    } else if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
`;

// Root layout required for error pages (404, 500, etc.)
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${montserrat.variable} ${merriweather.variable} ${dmMono.variable}`}>
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